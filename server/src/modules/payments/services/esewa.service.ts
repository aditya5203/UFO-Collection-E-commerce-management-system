import crypto from "crypto";

type EsewaInit = {
  amount: number;
  orderId: string;
};

const ESEWA_BASE_URL = process.env.ESEWA_BASE_URL || "https://uat.esewa.com.np";
const ESEWA_MERCHANT_CODE = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
const ESEWA_SUCCESS_URL =
  process.env.ESEWA_SUCCESS_URL ||
  "http://localhost:8080/api/payments/esewa/success";
const ESEWA_FAILURE_URL =
  process.env.ESEWA_FAILURE_URL ||
  "http://localhost:8080/api/payments/esewa/failure";

// ✅ classic eSewa form endpoint (UAT)
const ESEWA_FORM_URL = `${ESEWA_BASE_URL}/epay/main`;

function toEsewaAmount(n: number) {
  const safe = Number(n || 0);
  return safe.toFixed(2);
}

// You can store orderId in DB later. For now we just generate.
export const esewaService = {
  createEsewaRedirectUrl(input: EsewaInit) {
    const amt = toEsewaAmount(input.amount);

    // eSewa classic params
    const params = new URLSearchParams({
      amt, // amount
      psc: "0", // service charge
      pdc: "0", // delivery charge
      txAmt: "0", // tax
      tAmt: amt, // total
      pid: input.orderId, // product/order id
      scd: ESEWA_MERCHANT_CODE, // merchant code
      su: ESEWA_SUCCESS_URL, // success url
      fu: ESEWA_FAILURE_URL, // failure url
    });

    return `${ESEWA_FORM_URL}?${params.toString()}`;
  },

  // Optional: make a simple orderId if not provided
  makeOrderId(prefix = "UFO") {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  },
};
