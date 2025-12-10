import type { CartItem } from "@/cart/cartStore";

const STORAGE_KEY = "naturagloss_refill_plans";
export const REFILL_PLAN_STORAGE_KEY = STORAGE_KEY;
const DAY_MS = 24 * 60 * 60 * 1000;

type UnknownPlan = Record<string, unknown>;

export type RefillPlanStatus = "active" | "paused" | "cancelled";

export interface RefillPlan {
  id: string;
  label?: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
  source: string;
  frequency: string;
  nextRefillAt: string;
  status: RefillPlanStatus;
}

export interface RefillPlanFrequencyOption {
  value: string;
  days: number;
  labelKey: string;
}

export const REFILL_FREQUENCY_OPTIONS: RefillPlanFrequencyOption[] = [
  { value: "30d", days: 30, labelKey: "refillPlans.frequencyLabels.30d" },
  { value: "60d", days: 60, labelKey: "refillPlans.frequencyLabels.60d" },
  { value: "90d", days: 90, labelKey: "refillPlans.frequencyLabels.90d" },
];

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const createPlanId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `refill-${Date.now().toString(36)}`;

const parseFrequencyDays = (frequency: string): number => {
  const match = /^([0-9]+)d$/i.exec(frequency.trim());
  if (!match) return REFILL_FREQUENCY_OPTIONS[0].days;
  const parsed = Number(match[1]);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return REFILL_FREQUENCY_OPTIONS[0].days;
};

const computeNextRefillAt = (referenceMs: number, frequency: string) =>
  new Date(referenceMs + parseFrequencyDays(frequency) * DAY_MS).toISOString();

const cloneItems = (items: CartItem[]) => items.map((item) => ({ ...item }));

const normalizeCartItems = (items: unknown[]): CartItem[] =>
  items
    .filter((item): item is CartItem => Boolean(item) && typeof item === "object" && typeof (item as CartItem).id === "string")
    .map((item) => ({
      ...item,
      quantity:
        typeof (item as CartItem).quantity === "number" && (item as CartItem).quantity > 0
          ? (item as CartItem).quantity
          : 1,
    }));

const parseTimestamp = (value: string | number | undefined): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Date.now();
};

const servePlan = (plan: RefillPlan): RefillPlan => ({
  ...plan,
  items: cloneItems(plan.items),
});

const normalizePlan = (value: unknown): RefillPlan | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as UnknownPlan;
  const id = typeof record.id === "string" ? record.id : null;
  if (!id) return null;
  const frequency = typeof record.frequency === "string" ? record.frequency : REFILL_FREQUENCY_OPTIONS[0].value;
  const createdAt = typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString();
  const updatedAt = typeof record.updatedAt === "string" ? record.updatedAt : createdAt;
  const statusValue = record.status === "paused" || record.status === "cancelled" ? record.status : "active";
  const status = statusValue as RefillPlanStatus;
  const source = typeof record.source === "string" ? record.source : "manual";
  const label = typeof record.label === "string" ? record.label : undefined;
  const firstItems = Array.isArray(record.items) ? record.items : [];
  const items = normalizeCartItems(firstItems);
  if (!items.length) return null;
  const rawNext = typeof record.nextRefillAt === "string" ? record.nextRefillAt : "";
  const nextRefillAt = rawNext && !Number.isNaN(Date.parse(rawNext))
    ? rawNext
    : computeNextRefillAt(parseTimestamp(createdAt), frequency);
  return {
    id,
    label,
    items,
    createdAt,
    updatedAt,
    source,
    status,
    frequency,
    nextRefillAt,
  };
};

const loadRawPlans = (): RefillPlan[] => {
  if (!canUseStorage()) {
    return [];
  }
  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    if (!serialized) return [];
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizePlan)
      .filter((plan): plan is RefillPlan => Boolean(plan));
  } catch {
    return [];
  }
};

const persistPlans = (plans: RefillPlan[]) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // ignore
  }
};

export const listPlans = (): RefillPlan[] =>
  loadRawPlans()
    .map(servePlan)
    .sort((a, b) => {
      const aTime = Date.parse(a.nextRefillAt);
      const bTime = Date.parse(b.nextRefillAt);
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return aTime - bTime;
    });

export const listActivePlans = (): RefillPlan[] =>
  listPlans().filter((plan) => plan.status === "active");

export const hasActivePlans = (): boolean => listActivePlans().length > 0;

export const getEarliestNextRefillAt = (plans: RefillPlan[]): string | null => {
  let earliest: number | null = null;
  for (const plan of plans) {
    const time = Date.parse(plan.nextRefillAt);
    if (Number.isNaN(time)) continue;
    if (earliest === null || time < earliest) {
      earliest = time;
    }
  }
  return earliest === null ? null : new Date(earliest).toISOString();
};

export const findPlansDueWithin = (referenceTime: number, windowMs: number): RefillPlan[] => {
  return listActivePlans().filter((plan) => {
    if (!plan.nextRefillAt) return false;
    const candidate = Date.parse(plan.nextRefillAt);
    if (Number.isNaN(candidate)) return false;
    const delta = candidate - referenceTime;
    return delta >= 0 && delta <= windowMs;
  });
};

export const getPlanById = (id: string): RefillPlan | undefined =>
  listPlans().find((plan) => plan.id === id);

export const createPlan = (params: {
  label?: string;
  items: CartItem[];
  source: string;
  frequency?: string;
  nextRefillAt?: string;
  startAt?: string | number;
  status?: RefillPlanStatus;
}): RefillPlan | null => {
  const items = normalizeCartItems(params.items);
  if (!items.length) {
    return null;
  }
  const frequency = params.frequency ?? REFILL_FREQUENCY_OPTIONS[0].value;
  const base = params.startAt === undefined ? Date.now() : parseTimestamp(params.startAt);
  const parsedNext = params.nextRefillAt ? Date.parse(params.nextRefillAt) : NaN;
  const nextRefillAt =
    params.nextRefillAt && !Number.isNaN(parsedNext)
      ? params.nextRefillAt
      : computeNextRefillAt(base, frequency);
  const now = new Date().toISOString();
  const plan: RefillPlan = {
    id: createPlanId(),
    label: params.label?.trim() ? params.label.trim() : undefined,
    items,
    source: params.source,
    frequency,
    status: params.status ?? "active",
    createdAt: now,
    updatedAt: now,
    nextRefillAt,
  };
  const next = [plan, ...listPlans()];
  persistPlans(next);
  return plan;
};

export type RefillPlanUpdate = {
  label?: string | null;
  frequency?: string;
  status?: RefillPlanStatus;
  nextRefillAt?: string | null;
  startAt?: string | number;
};

export const updatePlan = (id: string, updates: RefillPlanUpdate): RefillPlan | null => {
  const existing = listPlans();
  let updatedPlan: RefillPlan | null = null;
  const now = new Date().toISOString();
  const nextPlans = existing.map((plan) => {
    if (plan.id !== id) return plan;
    const label = updates.label === undefined
      ? plan.label
      : updates.label === null
        ? undefined
        : updates.label.trim() || undefined;
    const frequency = updates.frequency ?? plan.frequency;
    let nextRefillAt = updates.nextRefillAt ?? plan.nextRefillAt;
    if (updates.frequency && updates.frequency !== plan.frequency) {
      const base = parseTimestamp(updates.startAt ?? Date.now());
      nextRefillAt = computeNextRefillAt(base, frequency);
    }
    const parsedNext = nextRefillAt ? Date.parse(nextRefillAt) : NaN;
    if (
      updates.status === "active" &&
      (!nextRefillAt || Number.isNaN(parsedNext) || parsedNext <= Date.now())
    ) {
      nextRefillAt = computeNextRefillAt(Date.now(), frequency);
    }
    const updated: RefillPlan = {
      ...plan,
      label,
      frequency,
      status: updates.status ?? plan.status,
      nextRefillAt: nextRefillAt ?? plan.nextRefillAt,
      updatedAt: now,
    };
    updatedPlan = updated;
    return updated;
  });
  if (!updatedPlan) {
    return null;
  }
  persistPlans(nextPlans);
  return updatedPlan;
};

export const deletePlan = (id: string): boolean => {
  const existing = listPlans();
  const filtered = existing.filter((plan) => plan.id !== id);
  if (filtered.length === existing.length) return false;
  persistPlans(filtered);
  return true;
};
