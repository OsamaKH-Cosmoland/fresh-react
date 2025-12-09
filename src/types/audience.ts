export type ConsentChannel = "newsletter" | "product_updates" | "offers" | "research";

export type ConsentSource = "newsletter_form" | "checkout" | "onboarding" | "account";

export type AudienceContact = {
  id: string;
  email: string;
  locale: "en" | "ar" | string;
  createdAt: string;
  updatedAt: string;
  concerns?: string[];
  timePreference?: string;
  scentPreference?: string;
  budgetPreference?: string;
  ordersCount?: number;
  lastOrderAt?: string | null;
  consents: {
    channel: ConsentChannel;
    granted: boolean;
    grantedAt: string;
    source: ConsentSource;
  }[];
  notes?: string;
};
