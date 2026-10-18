import { useState, useEffect, useRef } from "react";
import {
  listAdminMessagesFn,
  toggleMessageReadFn,
  deleteMessageFn,
} from "@/server/functions/adminFunctions";
import { ENQUIRY_TOPICS } from "@/lib/taxonomy";
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from "./AdminStateFeedback";

export function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [topicFilter, setTopicFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const requestIdRef = useRef(0);

  const fetchMessages = async () => {
    const currentReq = ++requestIdRef.current;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const data = await listAdminMessagesFn({ data: { topic: topicFilter } });
      if (currentReq === requestIdRef.current) {
        setMessages(data || []);
        setStatus("success");
      }
    } catch (err: unknown) {
      if (currentReq === requestIdRef.current) {
        const msg = err instanceof Error ? err.message : "Failed to load messages from server.";
        console.error("Error loading messages:", err);
        setErrorMessage(msg);
        setStatus("error");
      }
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [topicFilter]);

  const handleToggleRead = async (msg: any) => {
    const nextVal = !msg.is_read;
    try {
      await toggleMessageReadFn({ data: { id: msg.id, isRead: nextVal } });
      setMessages(messages.map((m) => (m.id === msg.id ? { ...m, is_read: nextVal } : m)));
      setFeedback({ type: "success", text: nextVal ? "Message marked as read." : "Message marked as unread." });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update message status";
      setFeedback({ type: "error", text: errorMsg });
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!confirm("Are you sure you want to delete this customer inquiry?")) return;
    setDeletingId(id);
    try {
      await deleteMessageFn({ data: { id } });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setFeedback({ type: "success", text: "Customer inquiry deleted successfully." });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete message";
      setFeedback({ type: "error", text: errorMsg });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Customer Inquiries & Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review incoming questions submitted via the public contact and inquiry forms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMessages}
            disabled={status === "loading"}
            className="min-h-[44px] px-4 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs using canonical topics and labels */}
      <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "All Topics" },
          ...ENQUIRY_TOPICS.map((t) => ({ id: t.id, label: t.label })),
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={topicFilter === t.id}
            onClick={() => setTopicFilter(t.id)}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              topicFilter === t.id
                ? "bg-navy text-white shadow-xs"
                : "border border-input bg-surface text-navy hover:bg-sand"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status === "loading" && <AdminLoadingState message="Loading inquiries & messages..." />}

      {status === "error" && (
        <AdminErrorState
          title="Unable to load customer messages"
          message={errorMessage ?? "A server error occurred while retrieving message records."}
          onRetry={fetchMessages}
        />
      )}

      {status === "success" && (
        <>
          {messages.length === 0 ? (
            <AdminEmptyState
              title="No customer messages found"
              description={
                topicFilter === "all"
                  ? "No customer inquiries have been submitted through the contact forms yet."
                  : `No messages found under the topic "${topicFilter}".`
              }
            />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-5 rounded-xl border transition-colors shadow-xs ${
                    m.is_read
                      ? "bg-surface border-border opacity-85"
                      : "bg-surface border-navy/40 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-base text-navy">{m.name}</h2>
                        {!m.is_read && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-action text-navy">
                            NEW
                          </span>
                        )}
                        <span className="text-xs px-2.5 py-0.5 rounded-md bg-sand font-semibold text-navy">
                          {m.topic}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                        <a href={`tel:${m.phone}`} className="font-semibold text-navy hover:underline">
                          {m.phone}
                        </a>
                        <span>•</span>
                        <span>{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRead(m)}
                        className="min-h-[44px] px-3.5 rounded-lg border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                      >
                        {m.is_read ? "Mark Unread" : "Mark as Read"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        className="min-h-[44px] px-3.5 rounded-lg border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      >
                        {deletingId === m.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {m.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
