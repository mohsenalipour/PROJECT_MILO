"use client";

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  conversations: ConversationSummary[];
  activeId: string | null;
  open: boolean;
  loading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
};

export function ConversationSidebar({
  conversations,
  activeId,
  open,
  loading,
  onSelect,
  onDelete,
  onNew,
  onClose,
}: Props) {
  return (
    <aside className={`history-sidebar ${open ? "history-sidebar-open" : ""}`}>
      <div className="history-heading">
        <div>
          <span>ARCHIVE</span>
          <h2>تاریخچه</h2>
        </div>
        <button className="sidebar-close" type="button" onClick={onClose} aria-label="بستن تاریخچه">
          ×
        </button>
      </div>
      <button className="new-chat-button" type="button" onClick={onNew}>
        <span aria-hidden="true">＋</span>
        گفت‌وگوی جدید
      </button>
      <nav aria-label="تاریخچهٔ گفت‌وگوها">
        {loading ? <p className="history-empty">در حال دریافت تاریخچه…</p> : null}
        {!loading && !conversations.length ? (
          <p className="history-empty">هنوز گفت‌وگویی ذخیره نشده است.</p>
        ) : null}
        <ul className="conversation-list">
          {conversations.map((conversation) => (
            <li
              key={conversation.id}
              className={conversation.id === activeId ? "conversation-active" : ""}
            >
              <button
                className="conversation-select"
                type="button"
                onClick={() => onSelect(conversation.id)}
              >
                <strong>{conversation.title}</strong>
                <time dateTime={conversation.updatedAt}>{formatDate(conversation.updatedAt)}</time>
              </button>
              <button
                className="conversation-delete"
                type="button"
                onClick={() => onDelete(conversation.id)}
                aria-label={`حذف ${conversation.title}`}
                title="حذف گفت‌وگو"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <p className="database-badge">
        <span className="status-light" aria-hidden="true" />
        PostgreSQL محلی
      </p>
    </aside>
  );
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}
