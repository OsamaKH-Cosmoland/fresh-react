import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/localization/locale";
import { createPlan, REFILL_FREQUENCY_OPTIONS, type RefillPlan } from "@/subscriptions";
import type { CartItem } from "@/cart/cartStore";

type CreationStatus = "idle" | "saving" | "saved" | "error";

interface Props {
  title: ReactNode;
  description?: ReactNode;
  items: CartItem[];
  source: string;
  label?: string;
  startAt?: string;
  buttonLabel?: string;
  className?: string;
  onCreated?: (plan: RefillPlan) => void;
}

export function RefillPlanCreationPanel({
  title,
  description,
  items,
  source,
  label,
  startAt,
  buttonLabel,
  className = "",
  onCreated,
}: Props) {
  const { t } = useTranslation();
  const [selectedFrequency, setSelectedFrequency] = useState(REFILL_FREQUENCY_OPTIONS[0].value);
  const [status, setStatus] = useState<CreationStatus>("idle");

  const hasItems = items.length > 0;
  const isBusy = status === "saving";

  const handleFrequencySelect = (value: string) => {
    setSelectedFrequency(value);
    if (status === "saved") {
      setStatus("idle");
    }
  };

  const handleCreate = () => {
    if (!hasItems || isBusy) return;
    setStatus("saving");
    const plan = createPlan({
      items,
      source,
      label,
      frequency: selectedFrequency,
      startAt,
    });
    if (plan) {
      setStatus("saved");
      onCreated?.(plan);
      return;
    }
    setStatus("error");
  };

  const statusMessage =
    status === "saved"
      ? t("refillPlans.savedMessage")
      : status === "error"
        ? t("refillPlans.errorMessage")
        : null;

  return (
    <div className={`refill-panel ${className}`.trim()}>
      <div className="refill-panel__header">
        <p className="refill-panel__title">{title}</p>
        {description && <p className="refill-panel__description">{description}</p>}
      </div>
      <div className="refill-panel__frequency" role="group" aria-label={t("refillPlans.frequencyLabel")}>
        {REFILL_FREQUENCY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`refill-frequency-option${
              option.value === selectedFrequency ? " is-active" : ""
            }`}
            onClick={() => handleFrequencySelect(option.value)}
            aria-pressed={option.value === selectedFrequency}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
      <div className="refill-panel__actions">
        <Button
          size="md"
          variant="secondary"
          onClick={handleCreate}
          disabled={!hasItems || isBusy}
        >
          {buttonLabel ?? t("refillPlans.createButton")}
        </Button>
        {statusMessage && (
          <p className="refill-panel__status" role="status">
            {statusMessage}
          </p>
        )}
      </div>
    </div>
  );
}
