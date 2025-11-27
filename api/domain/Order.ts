import type { ObjectId } from "mongodb";

export type PaymentMethod = "cash_on_delivery" | "card" | string;

export interface OrderVariant {
  name: string;
  label: string;
  size: string;
  currency: string;
  price: number | null;
}

export interface OrderItem {
  id: string | number;
  productSlug?: string;
  title: string;
  quantity: number;
  unitPrice: string;
  variant?: OrderVariant;
  qty?: number;
  unitPriceValue?: number;
  lineTotal?: number;
}

export interface OrderTotals {
  items: number;
  subtotal: number;
  subTotal?: number;
  shipping: number;
  grandTotal?: number;
  currency: string;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

export interface Order {
  _id?: ObjectId;
  id: string;
  customerId?: string | ObjectId;
  orderCode?: string;
  paymentMethod: PaymentMethod;
  status: string;
  totals: OrderTotals;
  customer: OrderCustomer;
  items: OrderItem[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  mongoId?: string;
}
