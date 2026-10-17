import { useState, useEffect } from "react";
import {
  listAdminApplicationsFn,
  updateApplicationStatusFn,
  updateApplicationNotesFn,
} from "@/server/functions/adminFunctions";
import { formatNaira } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";

export function AdminApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notes, setNotes] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await listAdminApplicationsFn({
        data: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        },
      });
      setApplications(data || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, categoryFilter]);

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
            className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-semibold text-navy hover:bg-sand transition-colors"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={fetchApplications}
            disabled={loading}
            className="h-10 px-4 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-surface p-4 rounded-xl border border-border">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-navy mb-1 uppercase">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, applicant name, phone, or state..."
            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-navy mb-1 uppercase">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:border-navy focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-navy mb-1 uppercase">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:border-navy focus:outline-none"
          >
            <option value="all">All categories</option>
            <option value="solar">Solar</option>
            <option value="ev">Electric Vehicles</option>
            <option value="phones">Phones & Gadgets</option>
            <option value="laptops">Laptops</option>
            <option value="tablets">Tablets</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
              <tr>
                <th className="py-3 px-4">Ref Code</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Plan Terms</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    {loading ? "Loading applications..." : "No matching applications found."}
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-sand/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-navy">
                      {app.reference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-navy">{app.full_name}</div>
                      <div className="text-xs text-muted-foreground">{app.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{app.product_name}</div>
                      <div className="text-xs text-muted-foreground">{formatNaira(app.price)}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div>{app.state}</div>
                      <div className="text-muted-foreground">{app.lga}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div>{app.duration} months</div>
                      <div className="text-muted-foreground">
                        {app.payment_amount ? `${formatNaira(app.payment_amount)} / ${app.frequency}` : app.frequency}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApp(app);
                          setNotes(app.notes || "");
                        }}
                        className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Detail Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase">
                  Reference: {selectedApp.reference}
                </span>
                <h2 className="text-xl font-bold text-navy mt-1">
                  {selectedApp.full_name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Submitted: {new Date(selectedApp.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
              >
                Close
              </button>
            </div>

            {/* Applicant Contact & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-sand/30 p-4 rounded-lg">
              <div>
                <p className="text-xs font-bold text-navy uppercase">Phone Number</p>
                <p className="font-medium mt-0.5">{selectedApp.phone}</p>
                <div className="mt-1 flex gap-2">
                  <a
                    href={`tel:${selectedApp.phone}`}
                    className="text-xs font-semibold text-navy hover:underline"
                  >
                    Call applicant
                  </a>
                  {selectedApp.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedApp.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-green-700 hover:underline"
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
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-navy uppercase">Residential / Business Address</p>
                <p className="font-medium mt-0.5">{selectedApp.address}</p>
              </div>
            </div>

            {/* Product & Terms Breakdown */}
            <div className="border border-border rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-navy text-sm uppercase">Selected Product & Calculation</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Product</span>
                  <span className="font-semibold text-navy">{selectedApp.product_name}</span>
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
                  <span className="font-bold text-green-700">
                    {selectedApp.payment_amount ? formatNaira(selectedApp.payment_amount) : "Calculated"} / {selectedApp.frequency}
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Notes */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase mb-1">
                Internal Staff Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add verification notes, guarantor check findings, or contact outcomes..."
                className="w-full p-2.5 text-sm rounded-md border border-input bg-background focus:border-navy focus:outline-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 rounded-md border border-input bg-surface text-xs font-semibold text-navy hover:bg-sand"
                >
                  Save Notes
                </button>
              </div>
            </div>

            {/* Status Workflow Action Buttons */}
            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                Current status: <strong className="text-navy">{selectedApp.status}</strong>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("Contacted")}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
                >
                  Mark Contacted
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("Approved")}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 rounded-md bg-green-700 text-xs font-semibold text-white hover:bg-green-800"
                >
                  Approve Application
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("Rejected")}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 rounded-md bg-destructive text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("Completed")}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 rounded-md bg-navy text-xs font-semibold text-white hover:bg-navy/90"
                >
                  Mark Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
