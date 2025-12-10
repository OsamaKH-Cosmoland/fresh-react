const REFERRAL_CODE_QUERY_PARAM = "ref";
const LAST_ATTRIBUTION_KEY = "naturagloss_last_referral_code";

const normalizeCode = (value: string) => value.trim().toUpperCase();

export function getReferralCodeFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const candidate = params.get(REFERRAL_CODE_QUERY_PARAM);
  if (!candidate) return null;
  const normalized = normalizeCode(candidate);
  return normalized || null;
}

export function storeLastAttributionCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_ATTRIBUTION_KEY, normalizeCode(code));
  } catch {
    // ignore
  }
}

export function loadLastAttributionCode(): string | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(LAST_ATTRIBUTION_KEY);
  if (!stored) return null;
  const normalized = normalizeCode(stored);
  return normalized || null;
}
