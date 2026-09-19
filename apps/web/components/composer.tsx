import { forwardRef, type FormEvent, type KeyboardEvent } from "react";

type ComposerProps = {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer(
  { value, disabled, onChange, onSubmit },
  ref,
) {
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!disabled && value.trim()) onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
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
        dir="auto"
        placeholder="پیامتان را بنویسید…"
      />
      <button className="send-button" type="submit" disabled={disabled || !value.trim()}>
        ارسال
      </button>
      <p className="composer-hint">Enter برای ارسال · Shift+Enter برای خط جدید</p>
    </form>
  );
});
