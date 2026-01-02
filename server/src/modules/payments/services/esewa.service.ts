// server/src/modules/payments/services/esewa.service.ts
import crypto from "crypto";
import axios from "axios";

type EsewaInitiateInput = {
  totalAmount: number; // NPR
  transactionUuid: string;
};

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "";

// ✅ Sandbox form URL (rc-epay)
const ESEWA_FORM_URL =
  process.env.ESEWA_FORM_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

// ✅ Sandbox status URL (rc.esewa)
const ESEWA_STATUS_URL =
  process.env.ESEWA_STATUS_URL || "https://rc.esewa.com.np/api/epay/transaction/status/";

const ESEWA_SUCCESS_URL =
  process.env.ESEWA_SUCCESS_URL || "http://localhost:8080/api/payments/esewa/success";

const ESEWA_FAILURE_URL =
  process.env.ESEWA_FAILURE_URL || "http://localhost:8080/api/payments/esewa/failure";

export const esewaService = {
  // ✅ transaction_uuid supports alphanumeric + hyphen(-) only
  makeOrderId(prefix = "ESEWA") {
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 100000);
    return `${prefix}-${ts}-${rand}`;
  },

  createSignature(message: string) {
    if (!ESEWA_SECRET_KEY) throw new Error("Missing ESEWA_SECRET_KEY in .env");
    return crypto.createHmac("sha256", ESEWA_SECRET_KEY).update(message).digest("base64");
  },

  createEsewaV2Form(input: EsewaInitiateInput) {
    const amount = Number(input.totalAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) throw new Error("Invalid totalAmount");

    const tax_amount = 0;
    const product_service_charge = 0;
    const product_delivery_charge = 0;

    const total_amount = amount + tax_amount + product_service_charge + product_delivery_charge;
    const transaction_uuid = input.transactionUuid;
    const product_code = ESEWA_PRODUCT_CODE;

    const signed_field_names = "total_amount,transaction_uuid,product_code";
    const signingString = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const signature = this.createSignature(signingString);

    const fields: Record<string, string | number> = {
      amount,
      tax_amount,
      total_amount,
      transaction_uuid,
      product_code,
      product_service_charge,
      product_delivery_charge,
      success_url: ESEWA_SUCCESS_URL,
      failure_url: ESEWA_FAILURE_URL,
      signed_field_names,
      signature,
    };

    // ✅ Debug logs (remove later)
    console.log("ESEWA_PRODUCT_CODE:", product_code);
    console.log("SIGN STRING:", signingString);
    console.log("SIGNATURE:", signature);
    console.log("FIELDS:", fields);

    return { formUrl: ESEWA_FORM_URL, fields };
  },

  decodeEsewaData(base64Data: string) {
    const json = Buffer.from(base64Data, "base64").toString("utf-8");
    return JSON.parse(json) as Record<string, any>;
  },

  verifyEsewaResponseSignature(payload: Record<string, any>) {
    if (!payload?.signed_field_names || !payload?.signature) return false;

    const names = String(payload.signed_field_names)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const signingString = names.map((k) => `${k}=${payload[k]}`).join(",");
    const expected = this.createSignature(signingString);
    return expected === payload.signature;
  },

  async checkStatus(input: { transaction_uuid: string; total_amount: number }) {
    const url = `${ESEWA_STATUS_URL}?product_code=${encodeURIComponent(
      ESEWA_PRODUCT_CODE
    )}&total_amount=${encodeURIComponent(String(input.total_amount))}&transaction_uuid=${encodeURIComponent(
      input.transaction_uuid
    )}`;

    const res = await axios.get(url);
    return res.data;
  },

  buildAutoSubmitHtml(formUrl: string, fields: Record<string, string | number>) {
    const inputs = Object.entries(fields)
      .map(([k, v]) => `<input type="hidden" name="${String(k)}" value="${String(v).replace(/"/g, "&quot;")}" />`)
      .join("\n");

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Redirecting to eSewa...</title>
  </head>
  <body>
    <p>Redirecting to eSewa payment...</p>
    <form id="esewaForm" method="POST" action="${formUrl}">
      ${inputs}
      <noscript><button type="submit">Continue</button></noscript>
    </form>
    <script>
      document.getElementById("esewaForm").submit();
    </script>
  </body>
</html>`;
  },
};
