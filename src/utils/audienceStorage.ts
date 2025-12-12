import type { AudienceContact, ConsentChannel, ConsentSource } from "@/types/audience";
import { getLogger } from "@/logging/globalLogger";

const AUDIENCE_KEY = "naturagloss_audience";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const safelyParse = (value: string | null) => {
  if (value == null) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    getLogger().warn("Failed to parse audience data", { error });
    return null;
  }
};

function writeAudience(contacts: AudienceContact[]) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(AUDIENCE_KEY, JSON.stringify(contacts));
  } catch (error) {
    getLogger().warn("Unable to write audience data", { error });
  }
}

export function listAudience(): AudienceContact[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(AUDIENCE_KEY);
  if (!raw) return [];
  const parsed = safelyParse(raw);
  return Array.isArray(parsed) ? (parsed as AudienceContact[]) : [];
}

type ConsentToAdd = {
  channel: ConsentChannel;
  source: ConsentSource;
};

type UpsertInput = {
  email: string;
  locale?: string;
  concerns?: string[];
  timePreference?: string;
  scentPreference?: string;
  budgetPreference?: string;
  consentsToAdd?: ConsentToAdd[];
  lastOrderAt?: string | null;
};

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `audience-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export function upsertAudienceContact(input: UpsertInput): AudienceContact {
  const trimmedEmail = input.email.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error("Email is required to upsert an audience contact");
  }
  const now = new Date().toISOString();
  const existingList = listAudience();
  const existingContact = existingList.find(
    (entry) => entry.email.toLowerCase() === trimmedEmail
  );

  const mergeConcerns = (base?: string[], addition?: string[]) => {
    if (!addition || addition.length === 0) return base ?? [];
    if (!base || base.length === 0) return [...new Set(addition)];
    return [...new Set([...base, ...addition])];
  };

  const hasLastOrderAt = "lastOrderAt" in input;
  const nextLastOrderAt =
    hasLastOrderAt ? input.lastOrderAt : existingContact?.lastOrderAt ?? null;
  const shouldIncrementOrders =
    typeof input.lastOrderAt === "string" && input.lastOrderAt.length > 0;
  const baseOrders = existingContact?.ordersCount ?? 0;
  const nextOrdersCount = shouldIncrementOrders ? baseOrders + 1 : baseOrders;

  const existingConsents = existingContact?.consents ?? [];
  const mergedConsents = existingConsents.map((consent) => ({ ...consent }));
  if (input.consentsToAdd) {
    input.consentsToAdd.forEach((entry) => {
      const match = mergedConsents.find(
        (consent) => consent.channel === entry.channel && consent.source === entry.source
      );
      if (match) {
        match.granted = true;
        match.grantedAt = now;
      } else {
        mergedConsents.push({
          channel: entry.channel,
          granted: true,
          grantedAt: now,
          source: entry.source,
        });
      }
    });
  }

  const nextContact: AudienceContact = {
    id: existingContact?.id ?? createId(),
    email: trimmedEmail,
    locale: projectLocale(input.locale ?? existingContact?.locale ?? "en"),
    createdAt: existingContact?.createdAt ?? now,
    updatedAt: now,
    concerns: mergeConcerns(existingContact?.concerns, input.concerns),
    timePreference: input.timePreference ?? existingContact?.timePreference,
    scentPreference: input.scentPreference ?? existingContact?.scentPreference,
    budgetPreference: input.budgetPreference ?? existingContact?.budgetPreference,
    ordersCount: nextOrdersCount,
    lastOrderAt: nextLastOrderAt ?? null,
    consents: mergedConsents,
    notes: existingContact?.notes,
  };

  const nextList = [nextContact, ...existingList.filter((entry) => entry.id !== nextContact.id)];
  writeAudience(nextList);
  return nextContact;
}

function projectLocale(value: string) {
  const candidate = value?.trim();
  if (!candidate) return "en";
  return candidate;
}

export const AUDIENCE_STORAGE_KEY = AUDIENCE_KEY;
