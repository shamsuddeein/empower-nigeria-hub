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
    setSelectedApp(app);
    setNotes(app.notes || "");
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedApp) return;
    setUpdatingStatus(true);
    try {
      await updateApplicationStatusFn({
        data: {
          id: selectedApp.id,
          status: newStatus,
        },
      });

      if (notes !== selectedApp.notes) {
        await updateApplicationNotesFn({
          data: {
            id: selectedApp.id,
            notes,
          },
        });
      }

      setSelectedApp({ ...selectedApp, status: newStatus, notes });
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, status: newStatus, notes } : a))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      alert("Failed to update status: " + msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setUpdatingStatus(true);
    try {
      await updateApplicationNotesFn({
        data: {
          id: selectedApp.id,
          notes,
        },
      });
      setSelectedApp({ ...selectedApp, notes });
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, notes } : a))
      );
      alert("Staff notes saved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save notes";
      alert("Failed to save notes: " + msg);
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

            {/* Product & Terms Breakdown */}
            <div className="border border-border rounded-xl p-4 space-y-3 bg-surface">
              <h3 className="font-bold text-navy text-sm uppercase">Selected Product & Financing Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Product</span>
                  <span className="font-bold text-navy">{selectedApp.product_name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Cash Price</span>
                  <span className="font-semibold">{formatNaira(selectedApp.price)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Duration</span>
                  <span className="font-semibold">{selectedApp.duration} Months</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Installment</span>
                  <span className="font-extrabold text-green-700">
                    {selectedApp.payment_amount ? formatNaira(selectedApp.payment_amount) : "Calculated"} / {selectedApp.frequency}
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
                onChange={(e) => setNotes(e.target.value)}
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

            {/* Status Workflow Action Buttons */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Current status: <strong className="text-navy font-bold">{selectedApp.status}</strong>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("Contacted")}
                  disabled={updatingStatus}
                  className="min-h-[44px] px-3.5 rounded-lg border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors disabled:opacity-50"
                >
                  Mark Contacted
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("Approved")}
                  disabled={updatingStatus}
                  className="min-h-[44px] px-3.5 rounded-lg bg-green-700 text-xs font-semibold text-white hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                  Approve Application
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("Rejected")}
                  disabled={updatingStatus}
                  className="min-h-[44px] px-3.5 rounded-lg bg-destructive text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("Completed")}
                  disabled={updatingStatus}
                  className="min-h-[44px] px-3.5 rounded-lg bg-navy text-xs font-semibold text-white hover:bg-navy/90 transition-colors disabled:opacity-50"
                >
                  Mark Completed
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  );
}
