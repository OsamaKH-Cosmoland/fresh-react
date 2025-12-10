import type { LocalOrder } from "@/types/localOrder";

export type TopItem = {
  id: string;
  type: "product" | "bundle" | "gift";
  name: string;
  totalQuantity: number;
  totalRevenueBase: number;
};

export type OrdersSummary = {
  ordersCount: number;
  totalRevenueBase: number;
  averageOrderValueBase: number;
  firstOrderAt?: string;
  lastOrderAt?: string;
  repeatCustomerEstimate: number;
};

export type FlowUsageSummary = {
  usedFinder: boolean;
  usedCoach: boolean;
  usedGiftBuilder: boolean;
};

export type ReferralTopCode = {
  code: string;
  orders: number;
  creditBase: number;
};

export type ReferralSummary = {
  totalReferrals: number;
  totalCreditBase: number;
  topCodes: ReferralTopCode[];
};
