// server/src/modules/chat/services/ai.service.ts
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are "UFO Bot", the customer support assistant for UFO Collection (Nepal).
You support English and Nepali.
Be friendly and practical.
Never ask for password, OTP, or sensitive data.
Help with order tracking, delivery, returns, payment issues, and size guidance.
`;

export async function aiReply(
  history: { role: "user" | "assistant"; content: string }[]
) {
  if (!process.env.OPENAI_API_KEY) return "";

  // ✅ Properly typed messages
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
  ];

  const resp = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages,
    temperature: 0.4,
  });

  return resp.choices?.[0]?.message?.content?.trim() || "";
}
