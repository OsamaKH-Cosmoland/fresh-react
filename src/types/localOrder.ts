import type { CartItem } from "@/cart/cartStore";

export type PaymentStatus = "paid" | "simulated";

export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  shippingCost: number;
  total: number;
  currency: string;
}

export interface CustomerContact {
  name: string;
  email: string;
  phone?: string;
}

export interface ShippingAddress {
  country: string;
  city: string;
  street: string;
  postalCode: string;
}

export interface ShippingMethod {
  id: string;
  label: string;
  description: string;
  eta: string;
  cost: number;
}

export interface PaymentSummary {
  methodLabel: string;
  last4?: string;
  status: PaymentStatus;
}

export interface LocalOrder {
  id: string;
  createdAt: string;
  items: CartItem[];
  totals: OrderTotals;
  promoCode?: string;
  customer: CustomerContact;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  paymentSummary: PaymentSummary;
  notes?: string;
}
