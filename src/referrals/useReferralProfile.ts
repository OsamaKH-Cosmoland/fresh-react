import { useCallback, useEffect, useState } from "react";
import type { ReferralAttribution, ReferralProfile } from "@/referrals/referralTypes";
import {
  REFERRAL_ATTRIBUTIONS_KEY,
  REFERRAL_PROFILE_KEY,
  REFERRAL_STORAGE_EVENT,
  ensureReferralProfile,
  listReferralAttributions,
  saveReferralProfile,
} from "@/utils/referralStorage";

export function useReferralProfile() {
  const initialProfile = ensureReferralProfile();
  const [profile, setProfile] = useState<ReferralProfile>(initialProfile);
  const [attributions, setAttributions] = useState<ReferralAttribution[]>(() =>
    listReferralAttributions().filter((entry) => entry.code === initialProfile.code)
  );

  const refresh = useCallback(() => {
    const nextProfile = ensureReferralProfile();
    setProfile(nextProfile);
    setAttributions(
      listReferralAttributions().filter((entry) => entry.code === nextProfile.code)
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === REFERRAL_PROFILE_KEY ||
        event.key === REFERRAL_ATTRIBUTIONS_KEY
      ) {
        refresh();
      }
    };
    const handleCustom = () => refresh();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(REFERRAL_STORAGE_EVENT, handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(REFERRAL_STORAGE_EVENT, handleCustom);
    };
  }, [refresh]);

  const updateProfile = (updates: Partial<ReferralProfile>) => {
    const nextProfile = { ...profile, ...updates };
    saveReferralProfile(nextProfile);
    setProfile(nextProfile);
  };

  return {
    profile,
    attributions,
    updateProfile,
  };
}
