import { z } from "zod";

export const MAX_MESSAGES = 20;
export const MAX_CONTENT_LENGTH = 4_000;

export const chatMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
  })
  .strict();

export const chatRequestSchema = z
  .object({
    messages: z
      .array(chatMessageSchema)
      .min(1)
      .max(MAX_MESSAGES)
      .refine((messages) => messages.at(-1)?.role === "user", {
        message: "آخرین پیام باید متعلق به کاربر باشد.",
      }),
  })
  .strict();

export const chatHistorySchema = z.array(chatMessageSchema).max(MAX_MESSAGES);

export type ChatMessage = z.infer<typeof chatMessageSchema>;
