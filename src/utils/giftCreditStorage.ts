import { MANUAL_CREDIT_SEEDS } from "@/giftcards/manualCreditsConfig";
import type { CreditSource, GiftCredit } from "@/giftcards/giftCardTypes";
import { getLogger } from "@/logging/globalLogger";

export const GIFT_CREDIT_KEY = "naturagloss_gift_credit";
const MANUAL_SEED_FLAG = `${GIFT_CREDIT_KEY}_manual_seeded`;

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const safelyParse = (value: string | null): GiftCredit[] | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return null;
};

const createCreditId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `gc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
};

const normalizeCode = (code: string) => code.trim().toUpperCase();

export function listGiftCredits(): GiftCredit[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(GIFT_CREDIT_KEY);
  const parsed = safelyParse(raw);
  return parsed ?? [];
}

export function saveGiftCredits(list: GiftCredit[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(GIFT_CREDIT_KEY, JSON.stringify(list));
  } catch (error) {
    getLogger().warn("Unable to save gift credits", { error });
  }
}

export function findCreditByCode(code: string): GiftCredit | undefined {
  const normalized = normalizeCode(code);
  return listGiftCredits().find((entry) => normalizeCode(entry.code) === normalized);
}

export function createGiftCreditFromOrder(params: {
  code: string;
  amountBase: number;
  orderId: string;
  note?: string;
}): GiftCredit {
  const now = new Date().toISOString();
  const credit: GiftCredit = {
    id: createCreditId(),
    code: normalizeCode(params.code),
    initialAmountBase: params.amountBase,
    remainingAmountBase: params.amountBase,
    status: "active",
    source: "gift_card",
    createdAt: now,
    updatedAt: now,
    note: params.note,
    createdFromOrderId: params.orderId,
  };
  const next = [...listGiftCredits(), credit];
  saveGiftCredits(next);
  return credit;
}

export function createManualGiftCredit(params: {
  code: string;
  amountBase: number;
  source?: CreditSource;
  orderId?: string;
  note?: string;
}): GiftCredit {
  const now = new Date().toISOString();
  const credit: GiftCredit = {
    id: createCreditId(),
    code: normalizeCode(params.code),
    initialAmountBase: params.amountBase,
    remainingAmountBase: params.amountBase,
    status: "active",
    source: params.source ?? "manual_adjustment",
    createdAt: now,
    updatedAt: now,
    note: params.note,
    createdFromOrderId: params.orderId,
  };
  const next = [...listGiftCredits(), credit];
  saveGiftCredits(next);
  return credit;
}

export function applyCreditToAmount(
  credit: GiftCredit,
  orderTotalBase: number
): {
  appliedAmountBase: number;
  remainingOrderBase: number;
  updatedCredit: GiftCredit;
} {
  const normalizedTotal = Math.max(orderTotalBase, 0);
  const appliedAmountBase = Math.min(normalizedTotal, credit.remainingAmountBase);
  const remainingOrderBase = Math.max(normalizedTotal - appliedAmountBase, 0);
  const remainingCredit = Math.max(credit.remainingAmountBase - appliedAmountBase, 0);
  const updatedCredit: GiftCredit = {
    ...credit,
    remainingAmountBase: remainingCredit,
    status: remainingCredit <= 0 ? "exhausted" : credit.status,
    updatedAt: new Date().toISOString(),
  };
  return { appliedAmountBase, remainingOrderBase, updatedCredit };
}

export function seedManualCreditsOnce(): void {
  if (!canUseStorage()) return;
  if (!MANUAL_CREDIT_SEEDS.length) {
    window.localStorage.setItem(MANUAL_SEED_FLAG, "true");
    return;
  }
  const seeded = window.localStorage.getItem(MANUAL_SEED_FLAG);
  if (seeded === "true") return;
  const existing = listGiftCredits();
  const existingCodes = new Set(existing.map((entry) => normalizeCode(entry.code)));
  const seedsToAdd = MANUAL_CREDIT_SEEDS.filter(
    (seed) => !existingCodes.has(normalizeCode(seed.code))
  );
  if (seedsToAdd.length) {
    const now = new Date().toISOString();
    const manualCredits: GiftCredit[] = seedsToAdd.map((seed) => ({
      id: createCreditId(),
      code: normalizeCode(seed.code),
      initialAmountBase: seed.amountBase,
      remainingAmountBase: seed.amountBase,
      status: "active",
      source: "manual_adjustment",
      createdAt: now,
      updatedAt: now,
      note: seed.note,
    }));
    saveGiftCredits([...existing, ...manualCredits]);
  }
  window.localStorage.setItem(MANUAL_SEED_FLAG, "true");
}
