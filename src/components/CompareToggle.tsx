import { useCompare, type CompareEntry, type CompareType } from "@/compare/compareStore";

export interface CompareToggleProps {
  id: string;
  type: CompareType;
  className?: string;
}

export function CompareToggle({ id, type, className = "" }: CompareToggleProps) {
  const { isInCompare, toggleCompare } = useCompare();
  const active = isInCompare(id, type);

  return (
    <button
      type="button"
      className={`compare-toggle ${active ? "is-active" : ""} ${className}`.trim()}
      onClick={(event) => {
        event.stopPropagation();
        toggleCompare({ id, type });
      }}
      aria-pressed={active}
      aria-label={active ? "Remove from compare" : "Add to compare"}
    >
      <span aria-hidden="true">⇄</span>
    </button>
  );
}
