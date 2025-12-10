import type { ReferralAttribution, ReferralProfile } from "@/referrals/referralTypes";

export const REFERRAL_PROFILE_KEY = "naturagloss_referral_profile";
export const REFERRAL_ATTRIBUTIONS_KEY = "naturagloss_referral_attributions";
export const REFERRAL_STORAGE_EVENT = "naturagloss_referral_storage";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const safelyParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const randomId = () =>
  `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `NG-${suffix}`;
};

export function loadReferralProfile(): ReferralProfile | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(REFERRAL_PROFILE_KEY);
  return safelyParse<ReferralProfile>(raw);
}

export function saveReferralProfile(profile: ReferralProfile): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(REFERRAL_PROFILE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent(REFERRAL_STORAGE_EVENT));
  } catch (error) {
    console.warn("Unable to save referral profile", error);
  }
}

export function ensureReferralProfile(): ReferralProfile {
  const existing = loadReferralProfile();
  if (existing) return existing;
  const now = new Date().toISOString();
  const profile: ReferralProfile = {
    id: randomId(),
    code: generateReferralCode(),
    createdAt: now,
    totalReferredOrders: 0,
    totalReferralCreditBase: 0,
  };
  saveReferralProfile(profile);
  return profile;
}

export function listReferralAttributions(): ReferralAttribution[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(REFERRAL_ATTRIBUTIONS_KEY);
  const parsed = safelyParse<ReferralAttribution[]>(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function addReferralAttribution(entry: ReferralAttribution): void {
  if (!canUseStorage()) return;
  try {
    const current = listReferralAttributions();
    window.localStorage.setItem(
      REFERRAL_ATTRIBUTIONS_KEY,
      JSON.stringify([entry, ...current])
    );
    window.dispatchEvent(new CustomEvent(REFERRAL_STORAGE_EVENT));
  } catch (error) {
    console.warn("Unable to save referral attribution", error);
  }
}
