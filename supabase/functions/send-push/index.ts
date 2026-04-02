import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.3/cors";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Web Push helpers using Web Crypto API
function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

async function generateVapidAuthHeader(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string,
): Promise<{ authorization: string; cryptoKey: string }> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyBytes = base64UrlDecode(privateKey);
  const publicKeyBytes = base64UrlDecode(publicKey);

  // Build raw PKCS8 from the 32-byte private key + public key
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(publicKeyBytes.slice(1, 33)),
    y: base64UrlEncode(publicKeyBytes.slice(33, 65)),
    d: base64UrlEncode(privateKeyBytes),
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(unsignedToken),
  );

  // Convert DER-like signature to raw r||s format if needed
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32, 64);
  } else {
    // Already in raw format from Web Crypto
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32);
  }

  const rawSig = concatBuffers(r, s);
  const token = `${unsignedToken}.${base64UrlEncode(rawSig)}`;

  return {
    authorization: `vapid t=${token}, k=${base64UrlEncode(publicKeyBytes)}`,
    cryptoKey: `p256ecdsa=${base64UrlEncode(publicKeyBytes)}`,
  };
}

async function encryptPayload(
  payload: string,
  subscriptionKeys: { p256dh: string; auth: string },
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);

  // Generate ECDH key pair for this message
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeyPair.publicKey),
  );

  // Import client public key
  const clientPublicKeyBytes = base64UrlDecode(subscriptionKeys.p256dh);
  const clientPublicKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientPublicKey },
      serverKeyPair.privateKey,
      256,
    ),
  );

  const authSecret = base64UrlDecode(subscriptionKeys.auth);

  // Salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive encryption key and nonce
  // PRK = HKDF-Extract(auth_secret, shared_secret)
  const prkKey = await crypto.subtle.importKey("raw", authSecret, { name: "HKDF" }, false, [
    "deriveBits",
  ]);

  // info for PRK
  const authInfo = encoder.encode("Content-Encoding: auth\0");

  // We need to use a proper HKDF approach
  // Step 1: Extract PRK from shared secret using auth as salt
  const ikmKey = await crypto.subtle.importKey("raw", sharedSecret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  
  // Use HMAC for HKDF-Extract
  const hmacAuthKey = await crypto.subtle.importKey("raw", authSecret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", hmacAuthKey, sharedSecret));

  // Create info for content encryption key
  const cekInfo = concatBuffers(
    encoder.encode("Content-Encoding: aesgcm\0"),
    new Uint8Array([0, 0, 0x41]),
    clientPublicKeyBytes,
    new Uint8Array([0, 0x41]),
    serverPublicKeyRaw,
  );

  // Create info for nonce
  const nonceInfo = concatBuffers(
    encoder.encode("Content-Encoding: nonce\0"),
    new Uint8Array([0, 0, 0x41]),
    clientPublicKeyBytes,
    new Uint8Array([0, 0x41]),
    serverPublicKeyRaw,
  );

  // HKDF-Expand for key material
  const prkImport = await crypto.subtle.importKey("raw", prk, { name: "HKDF" }, false, ["deriveBits"]);

  // Derive IKM using HKDF with auth info
  const ikmBytes = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: salt, info: encoder.encode("Content-Encoding: auth\0") },
      await crypto.subtle.importKey("raw", prk, { name: "HKDF" }, false, ["deriveBits"]),
      256,
    ),
  );

  // Use salt-based HKDF for final keys
  const hkdfKey = await crypto.subtle.importKey("raw", prk, { name: "HKDF" }, false, ["deriveBits"]);

  const keyMaterial = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: cekInfo },
      hkdfKey,
      128,
    ),
  );

  const nonceBytes = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
      hkdfKey,
      96,
    ),
  );

  // Add padding (2 bytes for padding length + payload)
  const paddedPayload = concatBuffers(new Uint8Array([0, 0]), payloadBytes);

  // Encrypt with AES-128-GCM
  const contentKey = await crypto.subtle.importKey("raw", keyMaterial, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonceBytes },
      contentKey,
      paddedPayload,
    ),
  );

  return { ciphertext: encrypted, salt, serverPublicKey: serverPublicKeyRaw };
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.hostname}`;

    const vapidHeaders = await generateVapidAuthHeader(
      audience,
      "mailto:noreply@meucalendario.app",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY,
    );

    const { ciphertext, salt, serverPublicKey } = await encryptPayload(payload, {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    });

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: vapidHeaders.authorization,
        "Crypto-Key": `${vapidHeaders.cryptoKey};dh=${base64UrlEncode(serverPublicKey)}`,
        "Content-Encoding": "aesgcm",
        Encryption: `salt=${base64UrlEncode(salt)}`,
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Urgency: "high",
      },
      body: ciphertext,
    });

    if (response.status === 410 || response.status === 404) {
      // Subscription expired, remove it
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
      return false;
    }

    return response.ok;
  } catch (err) {
    console.error("Push send error:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, evento_id } = await req.json();

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id and title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({
      title,
      body: body || "",
      evento_id: evento_id || "",
      timestamp: Date.now(),
    });

    let sent = 0;
    for (const sub of subscriptions) {
      const ok = await sendPushNotification(sub, payload);
      if (ok) sent++;
    }

    return new Response(JSON.stringify({ sent, total: subscriptions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
