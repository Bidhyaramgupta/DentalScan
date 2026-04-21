export type MessagingSender = "patient" | "dentist";

export type MessagingThreadId = string;

export type MessagingApiMessage = {
  id: string;
  threadId: MessagingThreadId;
  sender: MessagingSender;
  content: string;
  createdAt: string;
};
