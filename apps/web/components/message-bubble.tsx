import type { ChatMessage } from "@/lib/chat-schema";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const direction = getTextDirection(message.content);
  return (
    <li className={`message-row ${isUser ? "message-row-user" : "message-row-milo"}`}>
      <article className={`message-bubble ${isUser ? "message-user" : "message-milo"}`}>
        <span className="message-label">{isUser ? "شما" : "مایلو"}</span>
        <p dir={direction} className={`message-content message-content-${direction}`}>
          {message.content}
        </p>
      </article>
    </li>
  );
}

export function getTextDirection(content: string): "rtl" | "ltr" {
  return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(content) ? "rtl" : "ltr";
}
