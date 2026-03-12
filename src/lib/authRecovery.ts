export const RECOVERY_FLAG_KEY = "auth_recovery_pending_at";
export const RECOVERY_FLAG_TTL_MS = 30 * 60 * 1000;

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return {
    local: window.localStorage,
    session: window.sessionStorage,
  };
};

const normalizeTimestamp = (value: string | null) => {
  if (!value) return null;

  const timestamp = Number(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const setRecoveryPending = () => {
  const storage = getStorage();
  if (!storage) return;

  const now = Date.now().toString();
  storage.local.setItem(RECOVERY_FLAG_KEY, now);
  storage.session.setItem(RECOVERY_FLAG_KEY, now);
};

export const clearRecoveryPending = () => {
  const storage = getStorage();
  if (!storage) return;

  storage.local.removeItem(RECOVERY_FLAG_KEY);
  storage.session.removeItem(RECOVERY_FLAG_KEY);
};

export const hasValidRecoveryFlag = () => {
  const storage = getStorage();
  if (!storage) return false;

  const timestamps = [
    normalizeTimestamp(storage.local.getItem(RECOVERY_FLAG_KEY)),
    normalizeTimestamp(storage.session.getItem(RECOVERY_FLAG_KEY)),
  ].filter((value): value is number => value !== null);

  if (!timestamps.length) {
    return false;
  }

  const latestTimestamp = Math.max(...timestamps);
  const isExpired = Date.now() - latestTimestamp > RECOVERY_FLAG_TTL_MS;

  if (isExpired) {
    clearRecoveryPending();
    return false;
  }

  return true;
};

export const hasRecoveryParamsFromLocation = (
  search: string = window.location.search,
  hash: string = window.location.hash,
) => {
  const params = new URLSearchParams(search);

  return (
    hash.includes("type=recovery") ||
    hash.includes("access_token=") ||
    hash.includes("token_hash=") ||
    params.get("type") === "recovery" ||
    params.has("code")
  );
};

export const getRuntimeBasePath = (configuredBase: string = import.meta.env.BASE_URL.replace(/\/$/, "")) => {
  if (typeof window === "undefined") {
    return configuredBase === "/" ? "" : configuredBase;
  }

  const normalizedBase = configuredBase === "/" ? "" : configuredBase;
  if (!normalizedBase) return "";

  const pathname = window.location.pathname;
  const hasConfiguredBase = pathname === normalizedBase || pathname.startsWith(`${normalizedBase}/`);

  return hasConfiguredBase ? normalizedBase : "";
};

export const buildResetPasswordRedirectUrl = () => {
  const basePath = getRuntimeBasePath();
  const resetPath = `${basePath}/reset-password`.replace(/\/+/g, "/");
  const resetUrl = new URL(resetPath, window.location.origin);
  return resetUrl.toString();
};
