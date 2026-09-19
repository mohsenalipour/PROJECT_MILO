import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ChatMessage } from "@/lib/chat-schema";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const direction = getTextDirection(message.content);
  return (
    <li className={`message-row ${isUser ? "message-row-user" : "message-row-milo"}`}>
      <article className={`message-bubble ${isUser ? "message-user" : "message-milo"}`}>
        <span className="message-label">{isUser ? "شما" : "مایلو"}</span>
        {message.attachments?.length ? (
          <div className="message-attachments">
            {message.attachments.map((attachment) =>
              attachment.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={attachment.id} src={attachment.dataUrl} alt={attachment.name} />
              ) : (
                <span key={attachment.id}>📄 {attachment.name}</span>
              ),
            )}
          </div>
        ) : null}
        {isUser ? (
          <p dir={direction} className={`message-content message-content-${direction}`}>
            {message.content}
          </p>
        ) : (
          <div
            dir={direction}
            className={`message-content markdown-content message-content-${direction}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ children, ...props }) => (
                  <a {...props} target="_blank" rel="noreferrer noopener">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </article>
    </li>
  );
}

export function getTextDirection(content: string): "rtl" | "ltr" {
  return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(content) ? "rtl" : "ltr";
}
