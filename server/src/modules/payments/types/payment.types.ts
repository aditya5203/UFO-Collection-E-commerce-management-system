//src/modules/payments/types/payment.types.ts
export type PaymentMethod = "esewa" | "khalti";

export type CreatePaymentDto = {
  orderId: string;
  amount: number; // in NPR (e.g. 1200)
};

export type EsewaInitiateResponse = {
  url: string;
  params: Record<string, string | number>;
};

export type KhaltiInitiateResponse = {
  payment_url: string;
  pidx: string;
  expires_at?: string;
};
