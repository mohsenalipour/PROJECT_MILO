import { z } from "zod";

export const MAX_MESSAGES = 20;
export const MAX_CONTENT_LENGTH = 4_000;
export const MAX_ATTACHMENTS = 4;
export const MAX_ATTACHMENT_SIZE = 4 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENT_SIZE = 8 * 1024 * 1024;

const supportedAttachmentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);

export const chatAttachmentSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(255),
    type: z.string().refine((value) => supportedAttachmentTypes.has(value)),
    size: z.number().int().positive().max(MAX_ATTACHMENT_SIZE),
    dataUrl: z.string().max(Math.ceil((MAX_ATTACHMENT_SIZE * 4) / 3) + 256),
  })
  .strict()
  .refine(
    (attachment) =>
      attachment.dataUrl.startsWith("data:" + attachment.type + ";base64,") &&
      /^data:[^;,]+;base64,[A-Za-z0-9+/=]+$/.test(attachment.dataUrl),
    { message: "دادهٔ فایل معتبر نیست." },
  );

export const chatMessageSchema = z
  .object({
    id: z.string().min(1).max(100).optional(),
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
    attachments: z.array(chatAttachmentSchema).max(MAX_ATTACHMENTS).optional(),
  })
  .strict();

export const chatRequestSchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    messages: z
      .array(chatMessageSchema)
      .min(1)
      .max(MAX_MESSAGES)
      .refine((messages) => messages.at(-1)?.role === "user", {
        message: "آخرین پیام باید متعلق به کاربر باشد.",
      }),
  })
  .strict()
  .refine(
    ({ messages }) =>
      messages.reduce(
        (total, message) =>
          total + (message.attachments ?? []).reduce((sum, attachment) => sum + attachment.size, 0),
        0,
      ) <= MAX_TOTAL_ATTACHMENT_SIZE,
    { message: "حجم مجموع فایل‌ها بیش از حد مجاز است." },
  );

export const chatHistorySchema = z.array(chatMessageSchema).max(MAX_MESSAGES);

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatAttachment = z.infer<typeof chatAttachmentSchema>;

export function isImageAttachment(attachment: ChatAttachment): boolean {
  return attachment.type.startsWith("image/");
}
