// server/src/modules/discounts/types/discount.types.ts
export type ValidateCartItem = {
  productId: string;
  qty: number;
};

export type ValidateRequestBody = {
  couponCode?: string;
  items: ValidateCartItem[];
  shippingPaisa?: number;
};