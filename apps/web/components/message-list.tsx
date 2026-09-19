"use client";

import { useEffect, useRef } from "react";

import type { ChatMessage } from "@/lib/chat-schema";

import { MessageBubble } from "./message-bubble";

export function MessageList({
  messages,
  loading,
  streamingText,
}: {
  messages: ChatMessage[];
  loading: boolean;
  streamingText: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, streamingText]);

  return (
    <div className="message-viewport" aria-live="polite" aria-busy={loading}>
      <ol className="message-list">
        {messages.map((message, index) => (
          <MessageBubble key={`${message.role}-${index}`} message={message} />
        ))}
        {streamingText ? (
          <MessageBubble message={{ role: "assistant", content: streamingText }} />
        ) : loading ? (
          <li className="thinking" role="status">
            <span className="pulse-dot" />
            مایلو در حال فکر کردن است…
          </li>
        ) : null}
      </ol>
      <div ref={endRef} />
    </div>
  );
}
