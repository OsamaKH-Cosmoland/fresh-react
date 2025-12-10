export type ReferralProfile = {
  id: string;
  code: string;
  createdAt: string;
  name?: string;
  email?: string;
  totalReferredOrders: number;
  totalReferralCreditBase: number;
};

export type ReferralAttribution = {
  code: string;
  attributedAt: string;
  orderId: string;
  orderTotalBase: number;
  creditAwardedBase: number;
};
