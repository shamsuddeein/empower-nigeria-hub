import { useState, useEffect } from "react";
import {
  listAdminMessagesFn,
  toggleMessageReadFn,
  deleteMessageFn,
} from "@/server/functions/adminFunctions";

export function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState("all");

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await listAdminMessagesFn({ data: { topic: topicFilter } });
      setMessages(data || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
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
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteMessageFn({ data: { id } });
      setMessages(messages.filter((m) => m.id !== id));
    } catch (err: any) {
      alert("Failed to delete message: " + err.message);
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
            disabled={loading}
            className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-semibold text-navy hover:bg-sand transition-colors"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-border">
        <label className="text-xs font-bold text-navy uppercase">Filter Topic:</label>
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
        >
          <option value="all">All Topics</option>
          <option value="solar">Solar for Business</option>
          <option value="ev">Electric Vehicles</option>
          <option value="phones">Phones & Gadgets</option>
          <option value="land">Land & Estate</option>
          <option value="finance">POS & Financial Services</option>
          <option value="training">Vocational Training</option>
          <option value="agent">Agent Network</option>
          <option value="general">General Support</option>
        </select>
      </div>

      {/* Messages List */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Message Content</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    {loading ? "Loading messages..." : "No messages found for this topic."}
                  </td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-sand/30 transition-colors ${
                      !m.is_read ? "bg-amber-50/40 font-medium" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          !m.is_read
                            ? "bg-amber-100 text-amber-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {!m.is_read ? "Unread" : "Read"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-navy">
                      {m.name}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div>{m.phone}</div>
                      <a href={`tel:${m.phone}`} className="text-navy font-semibold hover:underline">
                        Call sender
                      </a>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold capitalize text-navy">
                      {m.topic}
                    </td>
                    <td className="py-3 px-4 text-xs text-foreground max-w-sm whitespace-pre-wrap">
                      {m.message}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleRead(m)}
                        className="px-2.5 py-1 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
                      >
                        {m.is_read ? "Mark Unread" : "Mark Read"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        className="px-2.5 py-1 rounded-md border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
