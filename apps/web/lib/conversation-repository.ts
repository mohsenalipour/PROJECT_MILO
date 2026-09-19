import "server-only";

import { randomUUID } from "node:crypto";

import type { ChatMessage } from "@/lib/chat-schema";
import { ensureSchema, pool } from "@/lib/database";

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type ConversationRow = {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
};

export async function listConversations(): Promise<ConversationSummary[]> {
  await ensureSchema();
  const result = await pool.query<ConversationRow>(
    "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC LIMIT 50",
  );
  return result.rows.map(toSummary);
}

export async function createConversation(title = "گفت‌وگوی جدید"): Promise<ConversationSummary> {
  await ensureSchema();
  const id = randomUUID();
  const result = await pool.query<ConversationRow>(
    "INSERT INTO conversations (id, title) VALUES ($1, $2) RETURNING id, title, created_at, updated_at",
    [id, title],
  );
  return toSummary(result.rows[0]);
}

export async function getConversation(
  id: string,
): Promise<{ conversation: ConversationSummary; messages: ChatMessage[] } | null> {
  await ensureSchema();
  const conversationResult = await pool.query<ConversationRow>(
    "SELECT id, title, created_at, updated_at FROM conversations WHERE id = $1",
    [id],
  );
  if (!conversationResult.rows[0]) return null;

  const messagesResult = await pool.query<{
    client_id: string;
    role: "user" | "assistant";
    content: string;
    attachments: ChatMessage["attachments"];
  }>(
    "SELECT client_id, role, content, attachments FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 20",
    [id],
  );
  return {
    conversation: toSummary(conversationResult.rows[0]),
    messages: messagesResult.rows.map((message) => ({
      id: message.client_id,
      role: message.role,
      content: message.content,
      ...(message.attachments?.length ? { attachments: message.attachments } : {}),
    })),
  };
}

export async function saveMessage(conversationId: string, message: ChatMessage): Promise<void> {
  await ensureSchema();
  const clientId = message.id ?? randomUUID();
  await pool.query(
    `INSERT INTO messages (id, conversation_id, client_id, role, content, attachments)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     ON CONFLICT (conversation_id, client_id) DO NOTHING`,
    [
      randomUUID(),
      conversationId,
      clientId,
      message.role,
      message.content,
      JSON.stringify(message.attachments ?? []),
    ],
  );

  const title = message.content.replace(/\s+/g, " ").trim().slice(0, 60);
  await pool.query(
    `UPDATE conversations
     SET updated_at = now(),
         title = CASE WHEN title = 'گفت‌وگوی جدید' AND $2 = 'user' THEN $3 ELSE title END
     WHERE id = $1`,
    [conversationId, message.role, title || "گفت‌وگوی جدید"],
  );
}

export async function deleteConversation(id: string): Promise<boolean> {
  await ensureSchema();
  const result = await pool.query("DELETE FROM conversations WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

function toSummary(row: ConversationRow): ConversationSummary {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
