import { useTranslation } from "@/localization/locale";

export function SkipToContent() {
  const { t } = useTranslation();
  return (
    <a className="skip-link" href="#main-content">
      {t("accessibility.skipToContent")}
    </a>
  );
}
