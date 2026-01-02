// server/src/modules/payments/services/khalti.service.ts
import axios, { AxiosError } from "axios";

type KhaltiInit = {
  amount: number; // paisa (Rs. 100 => 10000)
  orderId: string;
  orderName: string;
};

type KhaltiLookup = {
  pidx: string;
};

// ✅ Correct base URL for Khalti epayment APIs
const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL || "https://a.khalti.com/api/v2";

// ✅ Must be the SECRET KEY from Khalti dashboard (test/live)
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY || "";

// ✅ IMPORTANT: return back to /payment so frontend can lookup + create order + go ThankYou
const KHALTI_RETURN_URL = process.env.KHALTI_RETURN_URL || "http://localhost:3000/payment";
const KHALTI_WEBSITE_URL = process.env.KHALTI_WEBSITE_URL || "http://localhost:3000";

function ensureKey() {
  if (!KHALTI_SECRET_KEY) {
    throw new Error("Missing KHALTI_SECRET_KEY in .env");
  }
  const lower = KHALTI_SECRET_KEY.toLowerCase();
  if (lower.includes("your_khalti") || lower.includes("<") || lower.includes("secret_key")) {
    throw new Error(
      "KHALTI_SECRET_KEY looks like a placeholder. Paste the real key from Khalti dashboard."
    );
  }
}

const khaltiApi = axios.create({
  baseURL: KHALTI_BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

function niceAxiosError(err: unknown) {
  const e = err as AxiosError<any>;

  if (e.response) {
    const status = e.response.status;
    const data = e.response.data;

    const message =
      typeof data === "string"
        ? data
        : data?.detail || data?.message || JSON.stringify(data);

    throw new Error(`Khalti API error (${status}): ${message}`);
  }

  if (e.code === "ECONNABORTED") {
    throw new Error("Khalti request timed out (sandbox can be slow). Try again.");
  }

  throw err;
}

export const khaltiService = {
  async initiatePayment(input: KhaltiInit) {
    ensureKey();

    const payload = {
      return_url: KHALTI_RETURN_URL,
      website_url: KHALTI_WEBSITE_URL,
      amount: Number(input.amount), // paisa
      purchase_order_id: String(input.orderId),
      purchase_order_name: String(input.orderName),
    };

    try {
      const res = await khaltiApi.post("/epayment/initiate/", payload, {
        headers: { Authorization: `Key ${KHALTI_SECRET_KEY}` },
      });
      return res.data;
    } catch (err) {
      niceAxiosError(err);
    }
  },

  async lookupPayment(input: KhaltiLookup) {
    ensureKey();

    try {
      const res = await khaltiApi.post(
        "/epayment/lookup/",
        { pidx: String(input.pidx) },
        { headers: { Authorization: `Key ${KHALTI_SECRET_KEY}` } }
      );
      return res.data;
    } catch (err) {
      niceAxiosError(err);
    }
  },
};
