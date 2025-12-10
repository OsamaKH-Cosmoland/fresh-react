import { useCallback } from "react";
import { buildAppUrl } from "@/utils/navigation";
import { Button } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import { useLifecycle } from "@/lifecycle";
import { getPlanById } from "@/subscriptions";
import { useTranslation } from "@/localization/locale";

export function LifecycleActionSlot() {
  const { currentAction, dismissCurrentAction, reEvaluate } = useLifecycle();
  const { setCart } = useCart();
  const { t } = useTranslation();

  if (!currentAction || currentAction.ruleId !== "subscription_refill_soon") {
    return null;
  }

  const planId = typeof currentAction.payload?.subscriptionId === "string"
    ? currentAction.payload.subscriptionId
    : null;
  const plan = planId ? getPlanById(planId) : null;
  const message = t(currentAction.messageKey, currentAction.payload ?? {});
  const title = t("lifecycle.actions.refill.title");

  const handlePrimary = useCallback(() => {
    if (plan) {
      setCart(plan.items.map((item) => ({ ...item })));
      dismissCurrentAction();
      reEvaluate();
      window.location.href = buildAppUrl("/checkout");
      return;
    }
    dismissCurrentAction();
    reEvaluate();
    window.location.href = buildAppUrl("/account?view=refillPlans");
  }, [plan, setCart, dismissCurrentAction, reEvaluate]);

  const handleDismiss = useCallback(() => {
    dismissCurrentAction();
  }, [dismissCurrentAction]);

  return (
    <div className="lifecycle-slot" role="region" aria-live="polite">
      <div className="lifecycle-slot__content">
        <div>
          <p className="lifecycle-slot__title">{title}</p>
          <p className="lifecycle-slot__message">{message}</p>
        </div>
        <div className="lifecycle-slot__actions">
          <Button variant="secondary" size="sm" onClick={handlePrimary}>
            {t("lifecycle.actions.refill.cta")}
          </Button>
          <button
            type="button"
            className="lifecycle-slot__close"
            aria-label={t("lifecycle.actions.refill.dismiss")}
            onClick={handleDismiss}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
