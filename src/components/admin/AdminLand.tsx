import { useState, useEffect } from "react";
import {
  listAdminPlotsFn,
  listAdminLandInquiriesFn,
  createPlotFn,
  updatePlotFn,
  deletePlotFn,
  updateLandInquiryStatusFn,
} from "@/server/functions/adminFunctions";
import { formatNaira } from "@/lib/format";

export function AdminLand() {
  const [activeTab, setActiveTab] = useState<"plots" | "inquiries">("plots");
  const [plots, setPlots] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Plot modal state
  const [editingPlot, setEditingPlot] = useState<any | null>(null);
  const [isNewPlot, setIsNewPlot] = useState(false);
  const [savingPlot, setSavingPlot] = useState(false);

  // Form states for Plot
  const [formEstateName, setFormEstateName] = useState("");
  const [formState, setFormState] = useState("Kaduna");
  const [formTown, setFormTown] = useState("");
  const [formSizeSqm, setFormSizeSqm] = useState(450);
  const [formCashPrice, setFormCashPrice] = useState(2400000);
  const [formMonthlyAmount, setFormMonthlyAmount] = useState(115000);
  const [formPlanMonths, setFormPlanMonths] = useState(24);
  const [formPlanSummary, setFormPlanSummary] = useState("");
  const [formStatus, setFormStatus] = useState("Available");
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formDocuments, setFormDocuments] = useState("C of O, Survey Plan");
  const [formLocationDesc, setFormLocationDesc] = useState("");
  const [formLandmarks, setFormLandmarks] = useState("");
  const [formMapLink, setFormMapLink] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pData, iData] = await Promise.all([
        listAdminPlotsFn(),
        listAdminLandInquiriesFn(),
      ]);
      setPlots(pData || []);
      setInquiries(iData || []);
    } catch (err) {
      console.error("Error loading land data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddPlotModal = () => {
    setIsNewPlot(true);
    setFormEstateName("");
    setFormState("Kaduna");
    setFormTown("");
    setFormSizeSqm(450);
    setFormCashPrice(2000000);
    setFormMonthlyAmount(100000);
    setFormPlanMonths(24);
    setFormPlanSummary("N100,000 per month for 24 months");
    setFormStatus("Available");
    setFormIsPublished(true);
    setFormDocuments("C of O, Survey Plan");
    setFormLocationDesc("");
    setFormLandmarks("");
    setFormMapLink("");
    setEditingPlot({});
  };

  const openEditPlotModal = (p: any) => {
    setIsNewPlot(false);
    setFormEstateName(p.estate_name);
    setFormState(p.state);
    setFormTown(p.town);
    setFormSizeSqm(p.size_sqm);
    setFormCashPrice(p.cash_price);
    setFormMonthlyAmount(p.monthly_amount || 0);
    setFormPlanMonths(p.plan_months || 24);
    setFormPlanSummary(p.plan_summary || "");
    const safeStatus = ["Available", "Few left", "Sold"].includes(p.status) ? p.status : "Available";
    setFormStatus(safeStatus);
    setFormIsPublished(p.is_published ?? (p.status !== "Draft"));
    setFormDocuments(Array.isArray(p.documents) ? p.documents.join(", ") : "");
    setFormLocationDesc(p.location_description || "");
    setFormLandmarks(Array.isArray(p.landmarks) ? p.landmarks.join(", ") : "");
    setFormMapLink(p.map_link || "");
    setEditingPlot(p);
  };

  const handleSavePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEstateName.trim() || !formTown.trim()) {
      alert("Please provide estate name and town.");
      return;
    }
    setSavingPlot(true);
    try {
      const slug =
        editingPlot.slug ||
        `${formEstateName}-${formTown}-${formState}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      const docsArray = formDocuments
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const landmarksArray = formLandmarks
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const safeStatus = ["Available", "Few left", "Sold"].includes(formStatus) ? formStatus : "Available";

      if (isNewPlot) {
        await createPlotFn({
          data: {
            estateName: formEstateName.trim(),
            slug,
            state: formState,
            town: formTown.trim(),
            sizeSqm: Number(formSizeSqm),
            cashPrice: Number(formCashPrice),
            monthlyAmount: Number(formMonthlyAmount) || undefined,
            planMonths: Number(formPlanMonths) || undefined,
            planSummary: formPlanSummary.trim() || undefined,
            status: safeStatus,
            isPublished: formIsPublished,
            documents: docsArray,
            locationDescription: formLocationDesc.trim() || undefined,
            landmarks: landmarksArray,
            mapLink: formMapLink.trim() || undefined,
          },
        });
      } else {
        await updatePlotFn({
          data: {
            id: editingPlot.id,
            estateName: formEstateName.trim(),
            slug,
            state: formState,
            town: formTown.trim(),
            sizeSqm: Number(formSizeSqm),
            cashPrice: Number(formCashPrice),
            monthlyAmount: Number(formMonthlyAmount) || undefined,
            planMonths: Number(formPlanMonths) || undefined,
            planSummary: formPlanSummary.trim() || undefined,
            status: safeStatus,
            isPublished: formIsPublished,
            documents: docsArray,
            locationDescription: formLocationDesc.trim() || undefined,
            landmarks: landmarksArray,
            mapLink: formMapLink.trim() || undefined,
          },
        });
      }

      setEditingPlot(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save plot";
      alert("Failed to save plot: " + msg);
    } finally {
      setSavingPlot(false);
    }
  };

  const handleDeletePlot = async (id: string, name: string) => {
    if (!confirm(`Delete plot listing ${name}?`)) return;
    try {
      await deletePlotFn({ data: { id } });
      setPlots(plots.filter((p) => p.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete plot";
      alert("Failed to delete plot: " + msg);
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, nextStatus: string) => {
    try {
      await updateLandInquiryStatusFn({
        data: {
          id: inquiryId,
          status: nextStatus,
        },
      });
      setInquiries(inquiries.map((i) => (i.id === inquiryId ? { ...i, status: nextStatus } : i)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      alert("Failed to update status: " + msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Land & Estate Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage verified land layouts, installment allocation plans, and client site visit inquiries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "plots" && (
            <button
              type="button"
              onClick={openAddPlotModal}
              className="h-10 px-4 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Add Land Plot
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("plots")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "plots"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Plot Listings ({plots.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("inquiries")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "inquiries"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Site Visit Inquiries ({inquiries.length})
        </button>
      </div>

      {activeTab === "plots" ? (
        /* Plots List */
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-4">Estate Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Cash Price</th>
                  <th className="py-3 px-4">Installment Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {plots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      {loading ? "Loading plots..." : "No land plots registered."}
                    </td>
                  </tr>
                ) : (
                  plots.map((plot) => (
                    <tr key={plot.id} className="hover:bg-sand/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-navy">
                        {plot.estate_name}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div>{plot.town}</div>
                        <div className="text-muted-foreground">{plot.state}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {plot.size_sqm} sqm
                      </td>
                      <td className="py-3 px-4 font-bold text-navy">
                        {formatNaira(plot.cash_price)}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {plot.monthly_amount ? (
                          <div>
                            <span className="font-semibold text-green-700">
                              {formatNaira(plot.monthly_amount)}/mo
                            </span>
                            <div className="text-muted-foreground">{plot.plan_months} months</div>
                          </div>
                        ) : (
                          "Outright"
                        )}
                      </td>
                      <td className="py-3 px-4 space-x-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            plot.status === "Available"
                              ? "bg-green-100 text-green-800"
                              : plot.status === "Few left"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {plot.status}
                        </span>
                        {plot.is_published === false && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditPlotModal(plot)}
                          className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlot(plot.id, plot.estate_name)}
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
      ) : (
        /* Inquiries List */
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Plot Inquired</th>
                  <th className="py-3 px-4">Preferred Visit Date</th>
                  <th className="py-3 px-4">Message / Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No site visit inquiries submitted yet.
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-sand/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-navy">
                        {inq.full_name}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div>{inq.phone}</div>
                        <a
                          href={`tel:${inq.phone}`}
                          className="text-navy font-semibold hover:underline block"
                        >
                          Call
                        </a>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {inq.plot_name || "General inquiry"} ({inq.state})
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {inq.visit_date ? new Date(inq.visit_date).toLocaleDateString() : "Flexible"}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {inq.message || "No specific note"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            inq.status === "New"
                              ? "bg-amber-100 text-amber-800"
                              : inq.status === "Site Visit Scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {inq.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={inq.status}
                          onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                          className="text-xs p-1 rounded border border-input bg-background font-semibold"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Plot Modal */}
      {editingPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-navy">
                  {isNewPlot ? "Add Land Plot Listing" : `Edit Plot: ${editingPlot.estate_name}`}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ensure all titles and documents are accurately noted before publishing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlot(null)}
                className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSavePlot} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Estate Name *</label>
                  <input
                    type="text"
                    required
                    value={formEstateName}
                    onChange={(e) => setFormEstateName(e.target.value)}
                    placeholder="e.g. Unguwan Rimi Gardens"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">State *</label>
                  <select
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  >
                    <option value="Kaduna">Kaduna</option>
                    <option value="Kano">Kano</option>
                    <option value="Abuja FCT">Abuja FCT</option>
                    <option value="Katsina">Katsina</option>
                    <option value="Bauchi">Bauchi</option>
                    <option value="Sokoto">Sokoto</option>
                    <option value="Plateau">Plateau</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Town / LGA *</label>
                  <input
                    type="text"
                    required
                    value={formTown}
                    onChange={(e) => setFormTown(e.target.value)}
                    placeholder="e.g. Kaduna North"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Plot Size (sqm) *</label>
                  <input
                    type="number"
                    required
                    value={formSizeSqm}
                    onChange={(e) => setFormSizeSqm(Number(e.target.value))}
                    placeholder="450"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Outright Cash Price (NGN) *</label>
                  <input
                    type="number"
                    required
                    value={formCashPrice}
                    onChange={(e) => setFormCashPrice(Number(e.target.value))}
                    placeholder="2400000"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Monthly Amount (NGN)</label>
                  <input
                    type="number"
                    value={formMonthlyAmount}
                    onChange={(e) => setFormMonthlyAmount(Number(e.target.value))}
                    placeholder="115000"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Plan Duration (Months)</label>
                  <input
                    type="number"
                    value={formPlanMonths}
                    onChange={(e) => setFormPlanMonths(Number(e.target.value))}
                    placeholder="24"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Commercial Availability</label>
                  <select
                    value={["Available", "Few left", "Sold"].includes(formStatus) ? formStatus : "Available"}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Few left">Few left</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="rounded border-input text-navy focus:ring-navy"
                  />
                  <span className="text-sm font-semibold text-navy">Published on website</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">
                  Legal Documents (comma-separated)
                </label>
                <input
                  type="text"
                  value={formDocuments}
                  onChange={(e) => setFormDocuments(e.target.value)}
                  placeholder="e.g. C of O, Survey Plan, Deed of Assignment"
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">
                  Nearby Landmarks (comma-separated)
                </label>
                <input
                  type="text"
                  value={formLandmarks}
                  onChange={(e) => setFormLandmarks(e.target.value)}
                  placeholder="e.g. Rimi Market (1.2km), Primary School (600m)"
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">
                  Location Description
                </label>
                <textarea
                  rows={2}
                  value={formLocationDesc}
                  onChange={(e) => setFormLocationDesc(e.target.value)}
                  placeholder="Dry ground, drainage cleared, road network description..."
                  className="w-full p-2.5 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  value={formMapLink}
                  onChange={(e) => setFormMapLink(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlot(null)}
                  className="px-4 py-2 rounded-md border border-input text-sm font-semibold text-navy hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlot}
                  className="px-4 py-2 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
                >
                  {savingPlot ? "Saving Plot..." : "Save Plot Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
