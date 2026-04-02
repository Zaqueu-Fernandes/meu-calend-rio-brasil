import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.3/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 1000).toISOString();
    const windowEnd = new Date(now.getTime() + 60 * 1000).toISOString();

    // Find events with alarms in the current window
    const { data: eventos, error: eventosError } = await supabaseAdmin
      .from("eventos")
      .select("id, user_id, titulo, descricao, horario, alarme")
      .not("alarme", "is", null)
      .gte("alarme", windowStart)
      .lte("alarme", windowEnd);

    if (eventosError) throw eventosError;

    if (!eventos || eventos.length === 0) {
      return new Response(JSON.stringify({ checked: 0, triggered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find users that have push subscriptions
    const userIds = [...new Set(eventos.map((e) => e.user_id))];
    const { data: subscriptions } = await supabaseAdmin
      .from("push_subscriptions")
      .select("user_id")
      .in("user_id", userIds);

    const usersWithPush = new Set((subscriptions || []).map((s) => s.user_id));

    let triggered = 0;

    for (const evento of eventos) {
      if (!usersWithPush.has(evento.user_id)) continue;

      // Call send-push for this user
      const sendPushUrl = `${SUPABASE_URL}/functions/v1/send-push`;
      const response = await fetch(sendPushUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          user_id: evento.user_id,
          title: `⏰ Alarme: ${evento.titulo}`,
          body: evento.descricao || `Evento às ${evento.horario || "hoje"}`,
          evento_id: evento.id,
        }),
      });

      if (response.ok) triggered++;
      else {
        const errText = await response.text();
        console.error(`Failed to send push for evento ${evento.id}:`, errText);
      }
    }

    return new Response(
      JSON.stringify({ checked: eventos.length, triggered }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("check-alarms error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
