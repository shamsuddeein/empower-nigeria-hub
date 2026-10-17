import { useState, useEffect } from "react";
import {
  listAdminFaqsFn,
  createFaqFn,
  updateFaqFn,
  deleteFaqFn,
} from "@/server/functions/adminFunctions";

export function AdminFaqs() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState("all");

  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [isNewFaq, setIsNewFaq] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);

  const [formTopic, setFormTopic] = useState("Solar");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(1);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const data = await listAdminFaqsFn({ data: { topic: topicFilter } });
      setFaqs(data || []);
    } catch (err) {
      console.error("Error loading FAQs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [topicFilter]);

  const openAddFaq = () => {
    setIsNewFaq(true);
    setFormTopic(topicFilter === "all" ? "Solar" : topicFilter);
    setFormQuestion("");
    setFormAnswer("");
    setFormSortOrder(faqs.length + 1);
    setEditingFaq({});
  };

  const openEditFaq = (f: any) => {
    setIsNewFaq(false);
    setFormTopic(f.topic);
    setFormQuestion(f.question);
    setFormAnswer(f.answer);
    setFormSortOrder(f.sort_order || 1);
    setEditingFaq(f);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      alert("Please provide both question and answer.");
      return;
    }
    setSavingFaq(true);
    try {
      const payload = {
        topic: formTopic,
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        sortOrder: Number(formSortOrder),
      };

      if (isNewFaq) {
        await createFaqFn({ data: payload });
      } else {
        await updateFaqFn({ data: { id: editingFaq.id, ...payload } });
      }

      setEditingFaq(null);
      fetchFaqs();
    } catch (err: any) {
      alert("Failed to save FAQ: " + err.message);
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Delete this FAQ item?")) return;
    try {
      await deleteFaqFn({ data: { id } });
      setFaqs(faqs.filter((f) => f.id !== id));
    } catch (err: any) {
      alert("Failed to delete FAQ: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Frequently Asked Questions (FAQ)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage company explanations regarding installment terms, collateral, site visits, and warranties.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddFaq}
            className="h-10 px-4 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
          >
            Add FAQ
          </button>
        </div>
      </div>

      {/* Topic Filter */}
      <div className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-border">
        <label className="text-xs font-bold text-navy uppercase">Filter by Topic:</label>
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
        >
          <option value="all">All Topics</option>
          <option value="Solar">Solar for Business</option>
          <option value="Electric Vehicles">Electric Vehicles</option>
          <option value="Phones and Gadgets">Phones & Gadgets</option>
          <option value="Land and Estate">Land & Estate</option>
          <option value="Payments and Plans">Payments & Commercial Plans</option>
          <option value="Agents">Agents & Ambassadors</option>
        </select>
      </div>

      {/* FAQs List */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
              <tr>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Question</th>
                <th className="py-3 px-4">Answer Excerpt</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    {loading ? "Loading FAQs..." : "No FAQs found."}
                  </td>
                </tr>
              ) : (
                faqs.map((f) => (
                  <tr key={f.id} className="hover:bg-sand/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-navy text-xs">
                      {f.topic}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {f.question}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground max-w-sm truncate">
                      {f.answer}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {f.sort_order}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditFaq(f)}
                        className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(f.id)}
                        className="px-3 py-1.5 rounded-md border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
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

      {/* FAQ Modal */}
      {editingFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl border border-border shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-navy">
                  {isNewFaq ? "Create FAQ Item" : `Edit FAQ`}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clear, honest explanations prevent customer misunderstandings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
                className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Topic *</label>
                  <select
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  >
                    <option value="Solar">Solar</option>
                    <option value="Electric Vehicles">Electric Vehicles</option>
                    <option value="Phones and Gadgets">Phones and Gadgets</option>
                    <option value="Land and Estate">Land and Estate</option>
                    <option value="Payments and Plans">Payments and Plans</option>
                    <option value="Agents">Agents</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">Question *</label>
                <input
                  type="text"
                  required
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. Do I need collateral for solar installation?"
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">Answer *</label>
                <textarea
                  rows={4}
                  required
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="Clear answer explaining terms..."
                  className="w-full p-2.5 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
                  className="px-4 py-2 rounded-md border border-input text-sm font-semibold text-navy hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFaq}
                  className="px-4 py-2 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
                >
                  {savingFaq ? "Saving..." : "Save FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
