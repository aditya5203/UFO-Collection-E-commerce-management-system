export type ValidateCartItem = {
  productId: string;
  qty: number;
};

export type ValidateRequestBody = {
  couponCode?: string;        // optional: validate a specific coupon
  items: ValidateCartItem[];  // cart items
  shippingPaisa?: number;     // optional
};
