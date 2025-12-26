import axios from "axios";

type KhaltiInit = {
  amount: number; // paisa
  orderId: string;
  orderName: string;
};

const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL || "https://a.khalti.com/api/v2";
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY || "";
const KHALTI_RETURN_URL = process.env.KHALTI_RETURN_URL || "http://localhost:3000/ThankYou";
const KHALTI_WEBSITE_URL = process.env.KHALTI_WEBSITE_URL || "http://localhost:3000";

export const khaltiService = {
  async initiatePayment(input: KhaltiInit) {
    if (!KHALTI_SECRET_KEY) {
      throw new Error("Missing KHALTI_SECRET_KEY in .env");
    }

    // Khalti ePayment endpoint
    const url = `${KHALTI_BASE_URL}/epayment/initiate/`;

    const payload = {
      return_url: KHALTI_RETURN_URL,
      website_url: KHALTI_WEBSITE_URL,
      amount: input.amount, // paisa
      purchase_order_id: input.orderId,
      purchase_order_name: input.orderName,
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Key ${KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    // Khalti returns pidx + payment_url
    return res.data; // { pidx, payment_url, ... }
  },
};
