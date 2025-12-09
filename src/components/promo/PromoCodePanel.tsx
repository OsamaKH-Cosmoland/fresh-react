import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCart } from "@/cart/cartStore";
import { useTranslation } from "@/localization/locale";

interface PromoCodePanelProps {
  shippingCost?: number;
}

type StatusState = {
  type: "error" | "success" | "info";
  message: string;
} | null;

export default function PromoCodePanel({ shippingCost = 0 }: PromoCodePanelProps) {
  const { activePromoCode, appliedPromo, applyPromoCode, clearPromoCode } = useCart();
  const { t } = useTranslation();
  const [code, setCode] = useState(activePromoCode ?? "");
  const [status, setStatus] = useState<StatusState>(null);

  useEffect(() => {
    setCode(activePromoCode ?? "");
  }, [activePromoCode]);

  const savingsMessage = useMemo(() => {
    if (!appliedPromo || appliedPromo.discountAmount <= 0) {
      return null;
    }
    return t("cart.promo.youSave", {
      amount: formatCurrency(appliedPromo.discountAmount),
    });
  }, [appliedPromo, t]);

  const handleApply = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setStatus({ type: "error", message: t("cart.promo.invalid") });
      return;
    }
    const result = applyPromoCode(trimmed, shippingCost);
    if (result.status === "applied") {
      setStatus({ type: "success", message: t("cart.promo.success") });
      setCode(result.applied.code);
    } else if (result.status === "invalid") {
      setStatus({ type: "error", message: t("cart.promo.invalid") });
    } else {
      setStatus({ type: "error", message: t("cart.promo.notApplicable") });
    }
  };

  const handleClear = () => {
    clearPromoCode();
    setStatus({ type: "info", message: t("cart.promo.removed") });
    setCode("");
  };

  return (
    <div className="promo-panel">
      <div className="promo-panel__input-row">
        <label htmlFor="promo-code">{t("cart.promo.label")}</label>
        <div className="promo-panel__input-group">
          <input
            id="promo-code"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder={t("cart.promo.placeholder")}
            className="promo-panel__input"
          />
          <Button variant="ghost" size="sm" onClick={handleApply}>
            {t("cart.promo.apply")}
          </Button>
        </div>
      </div>
      {status && (
        <p
          className={`promo-panel__status promo-panel__status--${status.type}`}
          role="status"
          aria-live="polite"
        >
          {status.message}
        </p>
      )}
      {appliedPromo && (
        <div className="promo-panel__details">
          <div>
            <p className="promo-panel__details-label">
              {appliedPromo.label} · {appliedPromo.code}
            </p>
            {savingsMessage && (
              <p className="promo-panel__details-savings">{savingsMessage}</p>
            )}
            {appliedPromo.freeShipping && (
              <p className="promo-panel__free-shipping">{t("cart.promo.freeShipping")}</p>
            )}
          </div>
          <div className="promo-panel__details-actions">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              {t("cart.promo.remove")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
