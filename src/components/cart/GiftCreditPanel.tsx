import { useId, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCurrency } from "@/currency/CurrencyProvider";
import { useTranslation } from "@/localization/locale";
import type { ApplyGiftCreditResult } from "@/cart/cartStore";

interface GiftCreditPanelProps {
  appliedCode?: string | null;
  appliedAmountBase?: number;
  disabled?: boolean;
  onApply: (code: string) => ApplyGiftCreditResult;
  onClear: () => void;
}

export default function GiftCreditPanel({
  appliedCode,
  appliedAmountBase,
  disabled,
  onApply,
  onClear,
}: GiftCreditPanelProps) {
  const { currency } = useCurrency();
  const { t } = useTranslation();
  const [codeInput, setCodeInput] = useState("");
  const [result, setResult] = useState<ApplyGiftCreditResult | null>(null);
  const inputId = useId();
  const errorMessage = useMemo(() => {
    if (!result || result.status === "ok") return null;
    return t(`cart.giftCredit.errors.${result.status}`);
  }, [result, t]);

  const handleApply = (event: FormEvent) => {
    event.preventDefault();
    if (!codeInput.trim()) {
      setResult({ status: "invalid" });
      return;
    }
    const next = onApply(codeInput);
    setResult(next);
    if (next.status === "ok") {
      setCodeInput("");
    }
  };

  const handleClear = () => {
    onClear();
    setResult(null);
  };

  const showApplied =
    Boolean(appliedCode) && typeof appliedAmountBase === "number" && appliedAmountBase > 0;

  return (
    <section className="gift-credit-panel" aria-live="polite">
      <div className="gift-credit-panel__header">
        <p className="gift-credit-panel__title">{t("cart.giftCredit.title")}</p>
        <p className="gift-credit-panel__help">{t("cart.giftCredit.help")}</p>
      </div>
      <form className="gift-credit-panel__form" onSubmit={handleApply}>
        <label htmlFor={inputId} className="sr-only">
          {t("cart.giftCredit.inputLabel")}
        </label>
        <div className="gift-credit-panel__controls">
          <input
            id={inputId}
            type="text"
            placeholder={t("cart.giftCredit.placeholder")}
            value={codeInput}
            onChange={(event) => setCodeInput(event.target.value)}
            disabled={disabled}
          />
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={disabled || !codeInput.trim()}
          >
            {t("cart.giftCredit.apply")}
          </Button>
        </div>
      </form>
      {errorMessage && (
        <p className="gift-credit-panel__error" role="status">
          {errorMessage}
        </p>
      )}
      {showApplied && (
        <div className="gift-credit-panel__applied">
          <div>
            <p className="gift-credit-panel__applied-code">
              {t("cart.giftCredit.appliedLabel", { code: appliedCode })}
            </p>
            <p className="gift-credit-panel__applied-amount">
              {formatCurrency(appliedAmountBase ?? 0, currency)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            {t("cart.giftCredit.remove")}
          </Button>
        </div>
      )}
    </section>
  );
}
