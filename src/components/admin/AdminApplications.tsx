import { useState, useEffect, useRef } from "react";
import {
  listAdminApplicationsFn,
  updateApplicationStatusFn,
  updateApplicationNotesFn,
} from "@/server/functions/adminFunctions";
import { formatNaira } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { AdminDialog } from "./AdminDialog";
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from "./AdminStateFeedback";

export function AdminApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notes, setNotes] = useState("");
  const [statusConfirm, setStatusConfirm] = useState<{
    applicantName: string;
    reference: string;
    currentStatus: string;
    proposedStatus: "New" | "Contacted" | "Approved" | "Rejected" | "Completed";
  } | null>(null);
  const [inspectorFeedback, setInspectorFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [draftNotesByAppId, setDraftNotesByAppId] = useState<Record<string, string>>({});
  const selectedAppIdRef = useRef<string | null>(null);
  const cancelConfirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const triggerActionBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedAppIdRef.current = selectedApp ? selectedApp.id : null;
  }, [selectedApp]);

  useEffect(() => {
    if (!statusConfirm) return undefined;
    const timer = setTimeout(() => {
      cancelConfirmBtnRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [statusConfirm]);

  const requestIdRef = useRef(0);

  const fetchApplications = async () => {
    const currentReq = ++requestIdRef.current;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const data = await listAdminApplicationsFn({
        data: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        },
      });
      if (currentReq === requestIdRef.current) {
        setApplications(data || []);
        setStatus("success");
      }
    } catch (err: unknown) {
      if (currentReq === requestIdRef.current) {
        const msg = err instanceof Error ? err.message : "Failed to load applications.";
        console.error("Error fetching applications:", err);
        setErrorMessage(msg);
        setStatus("error");
      }
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, categoryFilter]);

  const handleOpenInspector = (app: any) => {
    selectedAppIdRef.current = app.id;
    setSelectedApp(app);
    const existingDraft = draftNotesByAppId[app.id] ?? (app.notes || "");
    setNotes(existingDraft);
    setStatusConfirm(null);
    setInspectorFeedback(null);
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (selectedApp) {
      setDraftNotesByAppId((prev) => ({ ...prev, [selectedApp.id]: val }));
    }
  };

  const lastActionStatusRef = useRef<string | null>(null);

  const requestStatusChange = (
    newStatus: "New" | "Contacted" | "Approved" | "Rejected" | "Completed",
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!selectedApp || selectedApp.status === newStatus) return;
    lastActionStatusRef.current = newStatus;
    if (e?.currentTarget) {
      triggerActionBtnRef.current = e.currentTarget;
    }
    setInspectorFeedback(null);
    setStatusConfirm({
      applicantName: selectedApp.full_name,
      reference: selectedApp.reference,
      currentStatus: selectedApp.status,
      proposedStatus: newStatus,
    });
  };

  const cancelStatusChange = () => {
    const actionToRestore = lastActionStatusRef.current;
    setStatusConfirm(null);
    setTimeout(() => {
      if (triggerActionBtnRef.current && triggerActionBtnRef.current.isConnected) {
        triggerActionBtnRef.current.focus();
      } else if (actionToRestore) {
        const btn = document.querySelector<HTMLButtonElement>(`button[data-status-action="${actionToRestore}"]`);
        btn?.focus();
      }
    }, 15);
  };

  const confirmStatusChange = async () => {
    if (!selectedApp || !statusConfirm) return;
    const targetAppId = selectedApp.id;
    const targetRef = selectedApp.reference;
    const targetStatus = statusConfirm.proposedStatus;
    const prevStatus = selectedApp.status;
    const appAtStart = selectedApp;
    const notesToSend = draftNotesByAppId[targetAppId] ?? notes;

    setUpdatingStatus(true);
    setInspectorFeedback(null);
    try {
      // Single atomic update for status and changed notes
      const notesToUpdate = notesToSend !== appAtStart.notes ? notesToSend : undefined;
      await updateApplicationStatusFn({
        data: {
          id: targetAppId,
          status: targetStatus,
          notes: notesToUpdate,
        },
      });

      const updated = { ...appAtStart, status: targetStatus, notes: notesToSend };

      // Keep active filtered queue synchronized: a rejected record must not remain under New filter
      setApplications((prev) => {
        if (statusFilter !== "all" && statusFilter !== targetStatus) {
          return prev.filter((a) => a.id !== targetAppId);
        }
        return prev.map((a) => (a.id === targetAppId ? updated : a));
      });

      // ONLY update the inspector if the open inspector is STILL targetAppId
      if (selectedAppIdRef.current === targetAppId) {
        setSelectedApp(updated);
        setStatusConfirm(null);
        setInspectorFeedback({
          type: "success",
          text: `Application ${targetRef} status updated from "${prevStatus}" to "${targetStatus}".`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      // ONLY update inspector feedback if the open inspector is STILL targetAppId
      if (selectedAppIdRef.current === targetAppId) {
        setInspectorFeedback({
          type: "error",
          text: `Failed to update status: ${msg}. Current status remains "${prevStatus}".`,
        });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    const targetAppId = selectedApp.id;
    const appAtStart = selectedApp;
    const notesToSend = draftNotesByAppId[targetAppId] ?? notes;

    setUpdatingStatus(true);
    setInspectorFeedback(null);
    try {
      await updateApplicationNotesFn({
        data: {
          id: targetAppId,
          notes: notesToSend,
        },
      });

      const updated = { ...appAtStart, notes: notesToSend };
      setApplications((prev) =>
        prev.map((a) => (a.id === targetAppId ? updated : a))
      );

      // ONLY update the inspector if the open inspector is STILL targetAppId
      if (selectedAppIdRef.current === targetAppId) {
        setSelectedApp(updated);
        setInspectorFeedback({
          type: "success",
          text: "Staff notes saved successfully.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save notes";
      if (selectedAppIdRef.current === targetAppId) {
        setInspectorFeedback({
          type: "error",
          text: msg,
        });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };


  const filteredApps = applications.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.reference?.toLowerCase().includes(q) ||
      a.full_name?.toLowerCase().includes(q) ||
      a.phone?.includes(q) ||
      a.state?.toLowerCase().includes(q) ||
      a.product_name?.toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    if (!filteredApps.length) {
      alert("No applications to export.");
      return;
    }
    const headers = [
      "Reference",
      "Full Name",
      "Phone",
      "WhatsApp",
      "Email",
      "State",
      "LGA",
      "Address",
      "Occupation",
      "Product Name",
      "Category",
      "Price",
      "Duration (Months)",
      "Frequency",
      "Payment Amount",
      "Status",
      "Submitted At",
      "Staff Notes",
    ];

    const rows = filteredApps.map((a) => [
      a.reference || "",
      a.full_name || "",
      a.phone || "",
      a.whatsapp || "",
      a.email || "",
      a.state || "",
      a.lga || "",
      a.address || "",
      a.occupation || "",
      a.product_name || "",
      a.category || "",
      a.price || 0,
      a.duration || 0,
      a.frequency || "",
      a.payment_amount || 0,
      a.status || "",
      a.created_at || "",
      a.notes || "",
    ]);

    downloadCsv(`applications_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Installment Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review customer applications, verify applicant contacts, and update review status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="min-h-[44px] px-4 rounded-lg border border-input bg-surface text-sm font-semibold text-navy hover:bg-sand transition-colors"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={fetchApplications}
            disabled={status === "loading"}
            className="min-h-[44px] px-4 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-surface p-4 rounded-xl border border-border">
        <div className="md:col-span-2">
          <label htmlFor="app-search" className="block text-xs font-bold text-navy mb-1.5 uppercase">
            Search
          </label>
          <input
            id="app-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, applicant name, phone, or state..."
            className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="app-status-filter" className="block text-xs font-bold text-navy mb-1.5 uppercase">
            Status
          </label>
          <select
            id="app-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <label htmlFor="app-cat-filter" className="block text-xs font-bold text-navy mb-1.5 uppercase">
            Category
          </label>
          <select
            id="app-cat-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
          >
            <option value="all">All categories</option>
            <option value="solar">Solar Systems</option>
            <option value="ev">Electric Vehicles</option>
            <option value="phones">Phones & Gadgets</option>
          </select>
        </div>
      </div>

      {status === "loading" && <AdminLoadingState message="Loading applications..." />}

      {status === "error" && (
        <AdminErrorState
          title="Unable to load applications"
          message={errorMessage ?? "A server error prevented loading the application list."}
          onRetry={fetchApplications}
        />
      )}

      {status === "success" && (
        <>
          {filteredApps.length === 0 ? (
            <AdminEmptyState
              title="No matching applications found"
              description={
                search.trim()
                  ? `No applications matched "${search}". Try adjusting your search term or filter.`
                  : "No applications found for the selected status and category."
              }
            />
          ) : (
            <div className="space-y-4">
              {/* Mobile View: High-clarity Card Layout */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-navy block">
                          {app.reference}
                        </span>
                        <h3 className="font-bold text-sm text-foreground mt-0.5">{app.full_name}</h3>
                        <p className="text-xs text-muted-foreground">{app.phone} • {app.state}</p>
                      </div>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          app.status === "New"
                            ? "bg-amber-100 text-amber-800"
                            : app.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : app.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="text-xs bg-sand/30 p-2.5 rounded-lg space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Product:</span>
                        <span className="font-semibold text-navy truncate max-w-[180px]">{app.product_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Terms:</span>
                        <span className="font-medium">
                          {app.duration} mos • {formatNaira(app.payment_amount || 0)}/{app.frequency}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenInspector(app)}
                      className="min-h-[44px] w-full rounded-lg border border-input bg-surface text-xs font-semibold text-navy hover:bg-sand transition-colors flex items-center justify-center"
                    >
                      Inspect Application
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop View: Full Data Table with Comfort Sizing */}
              <div className="hidden md:block rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                      <tr>
                        <th className="py-3.5 px-4">Ref Code</th>
                        <th className="py-3.5 px-4">Applicant</th>
                        <th className="py-3.5 px-4">Product</th>
                        <th className="py-3.5 px-4">Location</th>
                        <th className="py-3.5 px-4">Plan Terms</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredApps.map((app) => (
                        <tr key={app.id} className="hover:bg-sand/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-navy">
                            {app.reference}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-navy">{app.full_name}</div>
                            <div className="text-xs text-muted-foreground">{app.phone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-foreground">{app.product_name}</div>
                            <div className="text-xs text-muted-foreground">{formatNaira(app.price)}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <div className="font-medium">{app.state}</div>
                            <div className="text-muted-foreground">{app.lga}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <div className="font-medium">{app.duration} months</div>
                            <div className="font-semibold text-navy">
                              {formatNaira(app.payment_amount || 0)} / {app.frequency}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                                app.status === "New"
                                  ? "bg-amber-100 text-amber-800"
                                  : app.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : app.status === "Rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenInspector(app)}
                              className="min-h-[40px] px-3.5 rounded-lg border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors inline-flex items-center"
                            >
                              Inspect
                            </button>
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

      {/* Accessible Inspector Dialog */}
      <AdminDialog
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title={`Application ${selectedApp?.reference ?? ""}`}
        description="Verify customer details, review installment calculation, and record staff notes."
        maxWidth="max-w-3xl"
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* Applicant Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-sand/30 p-4 rounded-xl border border-border">
              <div>
                <p className="text-xs font-bold text-navy uppercase">Applicant Full Name</p>
                <p className="font-bold text-base text-navy mt-0.5">{selectedApp.full_name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-navy uppercase">Contact Phone & WhatsApp</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <a href={`tel:${selectedApp.phone}`} className="font-semibold text-navy hover:underline">
                    {selectedApp.phone}
                  </a>
                  {selectedApp.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedApp.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-green-700 hover:underline px-2 py-0.5 rounded bg-green-50"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-navy uppercase">Email Address</p>
                <p className="font-medium mt-0.5">{selectedApp.email || "Not supplied"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-navy uppercase">Location</p>
                <p className="font-medium mt-0.5">{selectedApp.state}, LGA: {selectedApp.lga}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-navy uppercase">Occupation</p>
                <p className="font-medium mt-0.5">{selectedApp.occupation}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-navy uppercase">Application Date</p>
                <p className="font-medium mt-0.5">{new Date(selectedApp.created_at).toLocaleDateString()}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-navy uppercase">Residential / Business Address</p>
                <p className="font-medium mt-0.5">{selectedApp.address}</p>
              </div>
            </div>

            {/* Authoritative Stored Financing Terms Breakdown */}
            <div className="border border-border rounded-xl p-4 space-y-3 bg-surface">
              <h3 className="font-bold text-navy text-sm uppercase">Authoritative Stored Financing Terms</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Product</span>
                  <span className="font-bold text-navy truncate block">{selectedApp.product_name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Cash Price</span>
                  <span className="font-semibold">{formatNaira(selectedApp.price)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Upfront Deposit</span>
                  <span className="font-semibold">{formatNaira(selectedApp.deposit || 0)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Upfront Charges</span>
                  <span className="font-semibold">{formatNaira(selectedApp.charges || 0)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Payment Duration</span>
                  <span className="font-semibold">{selectedApp.duration} Months</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Payment Frequency</span>
                  <span className="font-semibold capitalize">{selectedApp.frequency}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Payment Count</span>
                  <span className="font-semibold">
                    {selectedApp.payment_count ||
                      selectedApp.plan?.payments ||
                      Math.round(selectedApp.frequency === "weekly" ? (selectedApp.duration * 52) / 12 : selectedApp.duration)}{" "}
                    Payments
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Regular Payment</span>
                  <span className="font-extrabold text-green-700">
                    {formatNaira(selectedApp.payment_amount || selectedApp.plan?.perPayment || 0)} / {selectedApp.frequency}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Adjusted Final Payment</span>
                  <span className="font-semibold text-navy">
                    {formatNaira(
                      selectedApp.final_payment_amount ||
                        selectedApp.plan?.finalPayment ||
                        selectedApp.payment_amount ||
                        0
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Total Repayable</span>
                  <span className="font-bold text-navy">
                    {formatNaira(selectedApp.total_amount || selectedApp.plan?.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Notes */}
            <div>
              <label htmlFor="inspector-staff-notes" className="block text-xs font-bold text-navy uppercase mb-1.5">
                Internal Staff Notes
              </label>
              <textarea
                id="inspector-staff-notes"
                rows={3}
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add verification notes, guarantor check findings, or contact outcomes..."
                className="w-full p-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={updatingStatus}
                  className="min-h-[44px] px-4 rounded-lg border border-input bg-surface text-xs font-semibold text-navy hover:bg-sand transition-colors disabled:opacity-50"
                >
                  Save Notes
                </button>
              </div>
            </div>

            {/* Inline Feedback Notification */}
            {inspectorFeedback && (
              <div
                role="status"
                className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  inspectorFeedback.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <span>{inspectorFeedback.text}</span>
                <button
                  type="button"
                  onClick={() => setInspectorFeedback(null)}
                  className="text-xs font-bold hover:underline ml-4"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Status Change Confirmation Panel */}
            {statusConfirm ? (
              <div
                role="alertdialog"
                aria-modal="false"
                tabIndex={-1}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    cancelStatusChange();
                  }
                }}
                aria-labelledby="confirm-status-title"
                aria-describedby="confirm-status-desc"
                className="p-4 rounded-xl border-2 border-action bg-action-soft space-y-3 animate-in fade-in duration-150 outline-none"
              >
                <div className="flex items-center justify-between">
                  <h4 id="confirm-status-title" className="font-bold text-sm text-navy uppercase">
                    Confirm Status Change
                  </h4>
                  <span className="text-xs font-mono font-bold text-navy">
                    {statusConfirm.reference}
                  </span>
                </div>
                <p id="confirm-status-desc" className="text-xs sm:text-sm text-foreground">
                  Are you sure you want to change the status for{" "}
                  <strong className="text-navy">{statusConfirm.applicantName}</strong> from{" "}
                  <span className="font-semibold underline">{statusConfirm.currentStatus}</span> to{" "}
                  <strong className="text-navy">{statusConfirm.proposedStatus}</strong>?
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    ref={cancelConfirmBtnRef}
                    type="button"
                    onClick={cancelStatusChange}
                    disabled={updatingStatus}
                    className="min-h-[44px] px-4 rounded-lg border border-input bg-surface text-xs font-semibold text-navy hover:bg-sand transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmStatusChange}
                    disabled={updatingStatus}
                    className={`min-h-[44px] px-4 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
                      statusConfirm.proposedStatus === "Approved"
                        ? "bg-green-700 hover:bg-green-800"
                        : statusConfirm.proposedStatus === "Rejected"
                        ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        : "bg-navy hover:bg-navy/90"
                    }`}
                  >
                    {updatingStatus ? "Updating..." : `Confirm ${statusConfirm.proposedStatus}`}
                  </button>
                </div>
              </div>
            ) : (
              /* Status Workflow Action Buttons */
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Current status: <strong className="text-navy font-bold">{selectedApp.status}</strong>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Correction / Reopen path to New */}
                  {selectedApp.status !== "New" && (
                    <button
                      type="button"
                      data-status-action="New"
                      onClick={(e) => requestStatusChange("New", e)}
                      disabled={updatingStatus}
                      className="min-h-[44px] px-3.5 rounded-lg border border-amber-300 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      Return to New
                    </button>
                  )}
                  <button
                    type="button"
                    data-status-action="Contacted"
                    onClick={(e) => requestStatusChange("Contacted", e)}
                    disabled={updatingStatus || selectedApp.status === "Contacted"}
                    className={`min-h-[44px] px-3.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-50 ${
                      selectedApp.status === "Contacted"
                        ? "bg-blue-50 border-blue-200 text-blue-800 cursor-default"
                        : "border-input text-navy hover:bg-sand"
                    }`}
                  >
                    {selectedApp.status === "Contacted" ? "✓ Contacted" : "Mark Contacted"}
                  </button>
                  <button
                    type="button"
                    data-status-action="Approved"
                    onClick={(e) => requestStatusChange("Approved", e)}
                    disabled={updatingStatus || selectedApp.status === "Approved"}
                    className={`min-h-[44px] px-3.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                      selectedApp.status === "Approved"
                        ? "bg-green-100 border border-green-300 text-green-800 cursor-default"
                        : "bg-green-700 text-white hover:bg-green-800"
                    }`}
                  >
                    {selectedApp.status === "Approved" ? "✓ Approved" : "Approve Application"}
                  </button>
                  <button
                    type="button"
                    data-status-action="Rejected"
                    onClick={(e) => requestStatusChange("Rejected", e)}
                    disabled={updatingStatus || selectedApp.status === "Rejected"}
                    className={`min-h-[44px] px-3.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                      selectedApp.status === "Rejected"
                        ? "bg-red-100 border border-red-300 text-red-800 cursor-default"
                        : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    }`}
                  >
                    {selectedApp.status === "Rejected" ? "✓ Rejected" : "Reject Application"}
                  </button>
                  <button
                    type="button"
                    data-status-action="Completed"
                    onClick={(e) => requestStatusChange("Completed", e)}
                    disabled={updatingStatus || selectedApp.status === "Completed"}
                    className={`min-h-[44px] px-3.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                      selectedApp.status === "Completed"
                        ? "bg-navy/10 border border-navy/20 text-navy cursor-default"
                        : "bg-navy text-white hover:bg-navy/90"
                    }`}
                  >
                    {selectedApp.status === "Completed" ? "✓ Completed" : "Mark Completed"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </AdminDialog>
    </div>
  );
}
