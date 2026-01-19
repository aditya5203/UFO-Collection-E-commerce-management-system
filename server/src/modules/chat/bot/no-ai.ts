// server/src/modules/chat/bot/no-ai.ts

function norm(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isAny(input: string, list: string[]) {
  const t = norm(input);
  return list.some((k) => t === k || t.includes(k));
}

function numberedMenu() {
  return (
    `Agent: I can help you with:\n` +
    `1) Order tracking\n` +
    `2) Delivery time\n` +
    `3) Returns / refunds\n` +
    `4) Payments (eSewa / Khalti)\n` +
    `5) Size guidance\n` +
    `6) Talk to a human agent\n\n` +
    `Reply with a number (1–6) or type keywords like "order tracking", "delivery time", "return policy", "payment failed", "size help", "talk to agent".`
  );
}

export function noAiReply(input: string) {
  const t = norm(input);

  // If user sends only numbers
  if (t === "1") t.replace("1", "order tracking");
  if (t === "2") t.replace("2", "delivery time");
  if (t === "3") t.replace("3", "return policy");
  if (t === "4") t.replace("4", "payment failed");
  if (t === "5") t.replace("5", "size help");
  if (t === "6") t.replace("6", "talk to agent");

  // greetings
  if (isAny(t, ["hello", "hi", "namaste", "hey"])) {
    return numberedMenu();
  }

  // 6) human
  if (isAny(t, ["talk to agent", "talk to human", "live agent", "agent", "customer care", "manche sanga kura", "agent sanga kura"])) {
    return (
      `Agent: Okay — a human agent will reply here when available.\n` +
      `Tip: Please also share your Order ID (if this is about an order) so the agent can help faster.`
    );
  }

  // 1) order tracking
  if (isAny(t, ["order tracking", "track my order", "track order", "where is my order", "order status", "mero order kaha cha", "mero order track"])) {
    return (
      `Agent: Order Tracking steps:\n` +
      `1) Open Profile → Order Tracking\n` +
      `2) Enter your Tracking Number\n` +
      `3) You can also open Profile → Order History to see the latest status\n\n` +
      `If you share your Order ID, I can guide the next steps.`
    );
  }

  // 2) delivery
  if (isAny(t, ["delivery time", "shipping time", "estimated delivery", "when will it arrive", "delivery kati din", "delivery kahile aaucha"])) {
    return (
      `Agent: Delivery time:\n` +
      `1) Inside valley: usually 2–5 days\n` +
      `2) Outside valley: usually 4–7 days\n\n` +
      `If you share your city/district, I can give a better estimate.`
    );
  }

  // 3) returns
  if (isAny(t, ["return", "return policy", "refund", "refund policy", "exchange", "return kasari", "refund kasari", "exchange kasari"])) {
    return (
      `Agent: Returns / Refunds:\n` +
      `1) Keep the item unused and in original packaging\n` +
      `2) Share your Order ID and the issue (size / defect / wrong item)\n` +
      `3) We will guide pickup/return steps based on your location`
    );
  }

  // 4) payments
  if (isAny(t, ["payment", "payment failed", "esewa", "khalti", "esewa problem", "khalti problem", "esewa chalena", "khalti chalena"])) {
    return (
      `Agent: Payment help (eSewa / Khalti):\n` +
      `1) Share your Order ID\n` +
      `2) Tell which wallet you used (eSewa or Khalti)\n` +
      `3) If you have a transaction reference, share that too`
    );
  }

  // 5) size
  if (isAny(t, ["size", "size help", "size guide", "which size", "kun size", "size kasari thaha paune"])) {
    return (
      `Agent: Size Guidance:\n` +
      `1) Go to Profile → Update height/weight\n` +
      `2) Your Recommended Size will show there\n\n` +
      `If you tell me your height (ft) + weight (kg), I can suggest a size too.`
    );
  }

  // default
  return numberedMenu();
}
