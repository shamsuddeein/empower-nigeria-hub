import { useState, useEffect, useRef } from "react";
import {
  listAdminFaqsFn,
  createFaqFn,
  updateFaqFn,
  deleteFaqFn,
} from "@/server/functions/adminFunctions";
import { AdminDialog } from "./AdminDialog";
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from "./AdminStateFeedback";

export function AdminFaqs() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [topicFilter, setTopicFilter] = useState("all");

  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [isNewFaq, setIsNewFaq] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);

  const [formTopic, setFormTopic] = useState("Solar");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(1);

  const requestIdRef = useRef(0);

  const fetchFaqs = async () => {
    const currentReq = ++requestIdRef.current;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const data = await listAdminFaqsFn({ data: { topic: topicFilter } });
      if (currentReq === requestIdRef.current) {
        setFaqs(data || []);
        setStatus("success");
      }
    } catch (err: unknown) {
      if (currentReq === requestIdRef.current) {
        const msg = err instanceof Error ? err.message : "Failed to load FAQs.";
        console.error("Error loading FAQs:", err);
        setErrorMessage(msg);
        setStatus("error");
      }
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
      await fetchFaqs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save FAQ";
      alert(msg);
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ item?")) return;
    try {
      await deleteFaqFn({ data: { id } });
      setFaqs(faqs.filter((f) => f.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete FAQ";
      alert(msg);
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
            onClick={fetchFaqs}
            disabled={status === "loading"}
            className="min-h-[44px] px-4 rounded-lg border border-input bg-surface text-sm font-semibold text-navy hover:bg-sand transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={openAddFaq}
            className="min-h-[44px] px-4 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors shadow-xs"
          >
            + Add FAQ Item
          </button>
        </div>
      </div>

      {/* Topic Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-surface p-4 rounded-xl border border-border">
        <label htmlFor="faq-topic-filter" className="text-xs font-bold text-navy uppercase shrink-0">
          Filter by Topic:
        </label>
        <select
          id="faq-topic-filter"
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="w-full sm:w-72 min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
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

      {status === "loading" && <AdminLoadingState message="Loading FAQs..." />}

      {status === "error" && (
        <AdminErrorState
          title="Unable to load FAQ items"
          message={errorMessage ?? "A server error prevented loading questions."}
          onRetry={fetchFaqs}
        />
      )}

      {status === "success" && (
        <>
          {faqs.length === 0 ? (
            <AdminEmptyState
              title="No FAQs found"
              description={
                topicFilter === "all"
                  ? "No FAQ items have been published yet."
                  : `No FAQs found under "${topicFilter}".`
              }
              action={
                <button
                  type="button"
                  onClick={openAddFaq}
                  className="min-h-[44px] px-4 rounded-lg bg-navy text-xs font-semibold text-white hover:bg-navy/90"
                >
                  Create First FAQ
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {/* Mobile View */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {faqs.map((f) => (
                  <div key={f.id} className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-action">
                        {f.topic}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">Order: #{f.sort_order}</span>
                    </div>
                    <h3 className="font-bold text-base text-navy">{f.question}</h3>
                    <p className="text-sm text-foreground line-clamp-3 leading-relaxed">{f.answer}</p>
                    <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditFaq(f)}
                        className="min-h-[44px] px-4 rounded-lg border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                      >
                        Edit Question
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(f.id)}
                        className="min-h-[44px] px-3.5 rounded-lg border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                      <tr>
                        <th className="py-3.5 px-4">Topic</th>
                        <th className="py-3.5 px-4">Question</th>
                        <th className="py-3.5 px-4">Answer Excerpt</th>
                        <th className="py-3.5 px-4">Order</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {faqs.map((f) => (
                        <tr key={f.id} className="hover:bg-sand/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-md bg-sand/60 text-xs font-bold text-navy">
                              {f.topic}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-navy max-w-xs">{f.question}</td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground line-clamp-2 max-w-md">
                            {f.answer}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs">{f.sort_order}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditFaq(f)}
                                className="min-h-[40px] px-3.5 rounded-lg border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFaq(f.id)}
                                className="min-h-[40px] px-3 rounded-lg border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Accessible FAQ Editor Dialog */}
      <AdminDialog
        isOpen={Boolean(editingFaq)}
        onClose={() => setEditingFaq(null)}
        title={isNewFaq ? "Create New FAQ Item" : "Edit FAQ Item"}
        description="Provide accurate explanations for customer self-service and clarity on installment rules."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveFaq} className="space-y-5">
          <div>
            <label htmlFor="faq-form-topic" className="block text-xs font-bold text-navy uppercase mb-1.5">
              Service Topic *
            </label>
            <select
              id="faq-form-topic"
              value={formTopic}
              onChange={(e) => setFormTopic(e.target.value)}
              className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
            >
              <option value="Solar">Solar for Business</option>
              <option value="Electric Vehicles">Electric Vehicles</option>
              <option value="Phones and Gadgets">Phones & Gadgets</option>
              <option value="Land and Estate">Land & Estate</option>
              <option value="Payments and Plans">Payments & Commercial Plans</option>
              <option value="Agents">Agents & Ambassadors</option>
            </select>
          </div>

          <div>
            <label htmlFor="faq-form-question" className="block text-xs font-bold text-navy uppercase mb-1.5">
              Question Title *
            </label>
            <input
              id="faq-form-question"
              type="text"
              required
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              placeholder="e.g. Can I pay weekly or monthly?"
              className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="faq-form-answer" className="block text-xs font-bold text-navy uppercase mb-1.5">
              Detailed Answer *
            </label>
            <textarea
              id="faq-form-answer"
              rows={4}
              required
              value={formAnswer}
              onChange={(e) => setFormAnswer(e.target.value)}
              placeholder="Write the full response clearly explaining requirements..."
              className="w-full p-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="faq-form-order" className="block text-xs font-bold text-navy uppercase mb-1.5">
              Display Sort Order
            </label>
            <input
              id="faq-form-order"
              type="number"
              min="1"
              value={formSortOrder}
              onChange={(e) => setFormSortOrder(Number(e.target.value) || 1)}
              className="w-32 min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingFaq(null)}
              className="min-h-[44px] px-5 rounded-lg border border-input text-sm font-semibold text-navy hover:bg-sand transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingFaq}
              className="min-h-[44px] px-6 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              {savingFaq ? "Saving..." : "Save FAQ"}
            </button>
          </div>
        </form>
      </AdminDialog>
    </div>
  );
}
