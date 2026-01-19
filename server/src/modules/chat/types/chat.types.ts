export type ChatStatus = "OPEN" | "ENDED";
export type ChatSenderRole = "user" | "admin" | "bot" | "system";

export type CreateConversationDTO = {
  orderId?: string;
};

export type SendMessageDTO = {
  text: string;
};
