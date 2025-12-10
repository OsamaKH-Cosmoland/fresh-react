import { lifecycleRules } from "./rules";
import type { LifecycleAction, LifecycleContext, LifecycleHistory } from "./types";

const sortedRules = [...lifecycleRules].sort((a, b) => a.priority - b.priority);

export function evaluateLifecycle(
  context: LifecycleContext,
  history: LifecycleHistory,
  referenceTime = Date.now()
): { action: LifecycleAction | null; history: LifecycleHistory } {
  const nowIso = new Date(referenceTime).toISOString();
  const updatedHistory: LifecycleHistory = {
    ...history,
    lastEvaluatedAt: nowIso,
    ruleHistory: { ...history.ruleHistory },
    dismissalHistory: { ...history.dismissalHistory },
  };

  let action: LifecycleAction | null = null;

  for (const rule of sortedRules) {
    if (action) {
      break;
    }
    const cooldownMs = (rule.cooldownSeconds ?? 0) * 1000;
    const lastTriggered = updatedHistory.ruleHistory[rule.id];
    if (lastTriggered && cooldownMs > 0) {
      const lastTriggeredMs = new Date(lastTriggered).getTime();
      if (referenceTime - lastTriggeredMs < cooldownMs) {
        continue;
      }
    }
    const payload = rule.evaluate(context, referenceTime);
    if (!payload) continue;
    action = {
      ruleId: rule.id,
      channel: rule.channel,
      reasonKey: rule.reasonKey,
      messageKey: rule.messageKey,
      payload,
      triggeredAt: nowIso,
    };
    updatedHistory.ruleHistory[rule.id] = nowIso;
  }

  updatedHistory.lastAction = action;

  return { action, history: updatedHistory };
}
