import { useEffect } from "react";
import { useTranslation, type AppTranslationKey } from "@/localization/locale";

export function usePageTitle(titleKey: AppTranslationKey | null | undefined, fallback?: string) {
  const { t } = useTranslation();

  useEffect(() => {
    const title =
      titleKey && titleKey !== ""
        ? `NaturaGloss – ${t(titleKey)}`
        : fallback
        ? `NaturaGloss – ${fallback}`
        : "NaturaGloss";
    document.title = title;
  }, [fallback, t, titleKey]);
}
