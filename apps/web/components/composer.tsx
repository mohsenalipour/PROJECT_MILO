import {
  forwardRef,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import type { ChatAttachment } from "@/lib/chat-schema";

type ComposerProps = {
  value: string;
  disabled: boolean;
  attachments?: ChatAttachment[];
  attachmentError?: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFiles?: (files: File[]) => void;
  onRemoveAttachment?: (id: string) => void;
};

export const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer(
  {
    value,
    disabled,
    attachments = [],
    attachmentError,
    onChange,
    onSubmit,
    onFiles,
    onRemoveAttachment,
  },
  ref,
) {
  const canSubmit = Boolean(value.trim() || attachments.length);
  const direction = !value.trim() || /[\u0600-\u06ff]/.test(value) ? "rtl" : "ltr";

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!disabled && canSubmit) onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && canSubmit) onSubmit();
    }
  }

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) onFiles?.(Array.from(event.target.files));
    event.target.value = "";
  }

  return (
    <form className="composer" onSubmit={submit}>
      {attachments.length ? (
        <ul className="attachment-list" aria-label="فایل‌های پیوست‌شده">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              {attachment.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={attachment.dataUrl} alt="" />
              ) : (
                <span aria-hidden="true">TXT</span>
              )}
              <span title={attachment.name}>{attachment.name}</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment?.(attachment.id)}
                aria-label={`حذف ${attachment.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="sr-only" htmlFor="milo-message">
        پیام شما برای مایلو
      </label>
      <textarea
        id="milo-message"
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={4000}
        rows={2}
        dir={direction}
        placeholder="پیامتان را بنویسید…"
      />

      <div className="composer-actions">
        <label className="attach-button" aria-label="افزودن فایل یا تصویر" title="افزودن فایل یا تصویر">
          <input
            type="file"
            multiple
            disabled={disabled}
            accept="image/jpeg,image/png,image/webp,image/gif,text/plain,text/markdown,text/csv,application/json"
            onChange={chooseFiles}
          />
          <span aria-hidden="true">＋</span>
        </label>
        <button className="send-button" type="submit" disabled={disabled || !canSubmit}>
          ارسال
        </button>
      </div>
      {attachmentError ? <p className="attachment-error" role="alert">{attachmentError}</p> : null}
      <p className="composer-hint">Enter برای ارسال · Shift+Enter برای خط جدید</p>
    </form>
  );
});
