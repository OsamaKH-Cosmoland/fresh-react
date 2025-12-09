import { trackEvent } from "@/analytics/events";
import { useCompare, type CompareEntry, type CompareType } from "@/compare/compareStore";
import { useTranslation } from "@/localization/locale";

export interface CompareToggleProps {
  id: string;
  type: CompareType;
  className?: string;
  itemLabel?: string;
}

export function CompareToggle({ id, type, className = "", itemLabel }: CompareToggleProps) {
  const { isInCompare, toggleCompare } = useCompare();
  const { t } = useTranslation();
  const active = isInCompare(id, type);

  return (
    <button
      type="button"
      className={`compare-toggle ${active ? "is-active" : ""} ${className}`.trim()}
      onClick={(event) => {
        event.stopPropagation();
        const nextInCompare = !active;
        toggleCompare({ id, type });
        trackEvent({
          type: "toggle_compare",
          id,
          itemType: type,
          isInCompare: nextInCompare,
        });
      }}
      aria-pressed={active}
      aria-label={
        active
          ? t("accessibility.compare.remove", {
              item: itemLabel ?? t("accessibility.compare.genericItem"),
            })
          : t("accessibility.compare.add", {
              item: itemLabel ?? t("accessibility.compare.genericItem"),
            })
      }
    >
      <span aria-hidden="true">⇄</span>
    </button>
  );
}
