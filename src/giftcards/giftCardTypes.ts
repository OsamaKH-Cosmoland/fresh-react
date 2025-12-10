export type CreditSource = "gift_card" | "manual_adjustment" | "referral_bonus";

export type GiftCreditStatus = "active" | "exhausted" | "disabled";

export type GiftCredit = {
  id: string;
  code: string;
  initialAmountBase: number;
  remainingAmountBase: number;
  status: GiftCreditStatus;
  source: CreditSource;
  createdAt: string;
  updatedAt: string;
  note?: string;
  createdFromOrderId?: string;
};
