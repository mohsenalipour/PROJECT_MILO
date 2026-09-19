import "server-only";

import OpenAI from "openai";

import type { ChatMessage } from "@/lib/chat-schema";
import { ConfigError, EmptyProviderResponseError } from "@/lib/errors";

const SYSTEM_PROMPT =
  "You are MILO, the helpful AI companion of PROJECT_MILO. " +
  "Always speak as MILO in the first person and never claim to be another assistant. " +
  "Reply in the user's language, be warm, clear and concise, and never pretend " +
  "that you performed actions you did not perform.";

type ProviderSettings = {
  apiKey: string;
  model: string;
  baseURL?: string;
};

function getSettings(): ProviderSettings {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim();
  const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined;
  if (!apiKey || !model) throw new ConfigError();

  if (baseURL) {
    try {
      const url = new URL(baseURL);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    } catch {
      throw new ConfigError();
    }
  }
  return { apiKey, model, baseURL };
}

export async function createCompletionStream(
  messages: ChatMessage[],
): Promise<AsyncIterable<string>> {
  const settings = getSettings();
  const client = new OpenAI({
    apiKey: settings.apiKey,
    ...(settings.baseURL ? { baseURL: settings.baseURL } : {}),
    timeout: 30_000,
    maxRetries: 0,
  });

  if (settings.baseURL) {
    const providerMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((message) => ({ role: message.role, content: message.content })),
    ];
    const stream = await client.chat.completions.create({
      model: settings.model,
      messages: providerMessages,
      stream: true,
    });
    return {
      async *[Symbol.asyncIterator]() {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta.content;
          if (delta) yield delta;
        }
      },
    };
  }

  const stream = await client.responses.create({
    model: settings.model,
    instructions: SYSTEM_PROMPT,
    input: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    stream: true,
  });
  return {
    async *[Symbol.asyncIterator]() {
      for await (const event of stream) {
        if (event.type === "response.output_text.delta" && event.delta) {
          yield event.delta;
        } else if (event.type === "response.refusal.delta" && event.delta) {
          yield event.delta;
        }
      }
    },
  };
}

export async function createCompletion(messages: ChatMessage[]): Promise<string> {
  const chunks: string[] = [];
  for await (const chunk of await createCompletionStream(messages)) chunks.push(chunk);
  const content = chunks.join("").trim();
  if (!content) throw new EmptyProviderResponseError();
  return content;
}
