import { useTranslation } from "@/localization/locale";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function OfflineNotice() {
  const { isOnline } = useNetworkStatus();
  const { t } = useTranslation();

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-notice" role="status" aria-live="polite">
      <p>{t("offline.message")}</p>
    </div>
  );
}
