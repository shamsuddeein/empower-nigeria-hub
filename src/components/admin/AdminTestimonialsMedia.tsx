import { useState, useEffect } from "react";
import {
  listAdminTestimonialsFn,
  createTestimonialFn,
  updateTestimonialFn,
  deleteTestimonialFn,
  listAdminGalleryFn,
  createGalleryItemFn,
  updateGalleryItemFn,
  deleteGalleryItemFn,
} from "@/server/functions/adminFunctions";
import { AdminDialog } from "./AdminDialog";
import {
  AdminLoadingState,
  AdminErrorState,
  AdminEmptyState,
} from "./AdminStateFeedback";

export function AdminTestimonialsMedia() {
  const [activeTab, setActiveTab] = useState<"testimonials" | "gallery">("testimonials");
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Testimonial Modal
  const [editingTestimonial, setEditingTestimonial] = useState<any | null>(null);
  const [isNewTestimonial, setIsNewTestimonial] = useState(false);
  const [savingTestimonial, setSavingTestimonial] = useState(false);

  const [formName, setFormName] = useState("");
  const [formBusiness, setFormBusiness] = useState("");
  const [formState, setFormState] = useState("Kaduna");
  const [formQuote, setFormQuote] = useState("");
  const [formCategory, setFormCategory] = useState("solar");
  const [formApproved, setFormApproved] = useState(true);
  const [formPhoto, setFormPhoto] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");

  // Gallery Modal
  const [editingMedia, setEditingMedia] = useState<any | null>(null);
  const [isNewMedia, setIsNewMedia] = useState(false);
  const [savingMedia, setSavingMedia] = useState(false);

  const [formMediaCaption, setFormMediaCaption] = useState("");
  const [formMediaCategory, setFormMediaCategory] = useState("solar");
  const [formMediaImage, setFormMediaImage] = useState("");
  const [formMediaVideoUrl, setFormMediaVideoUrl] = useState("");
  const [formMediaApproved, setFormMediaApproved] = useState(true);

  const fetchData = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const [tData, gData] = await Promise.all([
        listAdminTestimonialsFn(),
        listAdminGalleryFn(),
      ]);
      setTestimonials(tData || []);
      setGallery(gData || []);
      setStatus("success");
    } catch (err: unknown) {
      console.error("Error loading testimonials & media:", err);
      const msg = err instanceof Error ? err.message : "Failed to load testimonials and media.";
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddTestimonial = () => {
    setIsNewTestimonial(true);
    setFormName("");
    setFormBusiness("");
    setFormState("Kaduna");
    setFormQuote("");
    setFormCategory("solar");
    setFormApproved(true);
    setFormPhoto("");
    setFormVideoUrl("");
    setEditingTestimonial({});
  };

  const openEditTestimonial = (t: any) => {
    setIsNewTestimonial(false);
    setFormName(t.name);
    setFormBusiness(t.business || "");
    setFormState(t.state || "Kaduna");
    setFormQuote(t.quote);
    setFormCategory(t.category);
    setFormApproved(t.approved);
    setFormPhoto(t.photo || "");
    setFormVideoUrl(t.video_url || "");
    setEditingTestimonial(t);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formQuote.trim()) {
      alert("Name and testimonial text are required.");
      return;
    }
    setSavingTestimonial(true);
    try {
      const payload = {
        name: formName.trim(),
        business: formBusiness.trim() || undefined,
        state: formState,
        quote: formQuote.trim(),
        category: formCategory,
        approved: formApproved,
        photo: formPhoto.trim() || undefined,
        videoUrl: formVideoUrl.trim() || undefined,
      };

      if (isNewTestimonial) {
        await createTestimonialFn({ data: payload });
      } else {
        await updateTestimonialFn({ data: { id: editingTestimonial.id, ...payload } });
      }

      setEditingTestimonial(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save testimonial";
      alert("Failed to save testimonial: " + msg);
    } finally {
      setSavingTestimonial(false);
    }
  };

  const handleToggleTestimonialApproved = async (t: any) => {
    const nextVal = !t.approved;
    try {
      await updateTestimonialFn({ data: { id: t.id, approved: nextVal } });
      setTestimonials(testimonials.map((item) => (item.id === t.id ? { ...item, approved: nextVal } : item)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      alert("Failed to update status: " + msg);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Delete this customer testimonial?")) return;
    try {
      await deleteTestimonialFn({ data: { id } });
      setTestimonials(testimonials.filter((t) => t.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete testimonial";
      alert("Failed to delete testimonial: " + msg);
    }
  };

  // Gallery methods
  const openAddMedia = () => {
    setIsNewMedia(true);
    setFormMediaCaption("");
    setFormMediaCategory("solar");
    setFormMediaImage("");
    setFormMediaVideoUrl("");
    setFormMediaApproved(true);
    setEditingMedia({});
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMediaImage.trim() && !formMediaVideoUrl.trim()) {
      alert("Please provide an image URL or video URL.");
      return;
    }
    setSavingMedia(true);
    try {
      const payload = {
        caption: formMediaCaption.trim() || undefined,
        category: formMediaCategory,
        image: formMediaImage.trim() || undefined,
        videoUrl: formMediaVideoUrl.trim() || undefined,
        approved: formMediaApproved,
      };

      if (isNewMedia) {
        await createGalleryItemFn({ data: payload });
      } else {
        await updateGalleryItemFn({ data: { id: editingMedia.id, ...payload } });
      }

      setEditingMedia(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save media";
      alert("Failed to save media: " + msg);
    } finally {
      setSavingMedia(false);
    }
  };

  const handleToggleMediaApproved = async (m: any) => {
    const nextVal = !m.approved;
    try {
      await updateGalleryItemFn({ data: { id: m.id, approved: nextVal } });
      setGallery(gallery.map((item) => (item.id === m.id ? { ...item, approved: nextVal } : item)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      alert("Failed to update status: " + msg);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Delete this installation media?")) return;
    try {
      await deleteGalleryItemFn({ data: { id } });
      setGallery(gallery.filter((g) => g.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete media";
      alert("Failed to delete media: " + msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">Approved Testimonials & Installation Media</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage genuine customer reviews, installation photographs, and verified field videos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "testimonials" ? (
            <button
              type="button"
              onClick={openAddTestimonial}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors shadow-xs"
            >
              Add Testimonial
            </button>
          ) : (
            <button
              type="button"
              onClick={openAddMedia}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors shadow-xs"
            >
              Add Media
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border" role="tablist" aria-label="Proof modules">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "testimonials"}
          onClick={() => setActiveTab("testimonials")}
          className={`min-h-[44px] py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "testimonials"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Customer Reviews ({testimonials.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "gallery"}
          onClick={() => setActiveTab("gallery")}
          className={`min-h-[44px] py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "gallery"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Installation Gallery ({gallery.length})
        </button>
      </div>

      {/* State Feedback */}
      {status === "loading" && (
        <AdminLoadingState message="Loading testimonials and installation media..." />
      )}

      {status === "error" && (
        <AdminErrorState
          title="Could not load social proof"
          message={errorMessage ?? "An error occurred while communicating with the database."}
          onRetry={fetchData}
        />
      )}

      {status === "success" && activeTab === "testimonials" && (
        <>
          {testimonials.length === 0 ? (
            <AdminEmptyState
              title="No customer testimonials yet"
              message="Add verified customer statements to highlight real commercial savings and system reliability."
              actionLabel="Add Testimonial"
              onAction={openAddTestimonial}
            />
          ) : (
            <div className="space-y-4">
              {/* Mobile Card View (< 768px) */}
              <div className="grid gap-3 md:hidden">
                {testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-navy text-base">{t.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {t.business ? `${t.business}, ` : ""}{t.state} &bull; {t.category}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleTestimonialApproved(t)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          t.approved
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.approved ? "Approved" : "Draft"}
                      </button>
                    </div>

                    <p className="text-xs italic text-navy/90 bg-sand/30 p-2.5 rounded-lg border border-border/50">
                      "{t.quote}"
                    </p>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => openEditTestimonial(t)}
                        className="flex-1 min-h-[44px] px-3 py-2 rounded-lg border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(t.id)}
                        className="min-h-[44px] px-4 py-2 rounded-lg border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= 768px) */}
              <div className="hidden md:block rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Business / Location</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Statement</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {testimonials.map((t) => (
                        <tr key={t.id} className="hover:bg-sand/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-navy">
                            {t.name}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <div>{t.business || "Customer"}</div>
                            <div className="text-muted-foreground">{t.state}</div>
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold uppercase text-muted-foreground">
                            {t.category}
                          </td>
                          <td className="py-3 px-4 text-xs text-navy max-w-md truncate">
                            "{t.quote}"
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleTestimonialApproved(t)}
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                                t.approved
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-muted text-muted-foreground hover:bg-sand"
                              }`}
                            >
                              {t.approved ? "Approved" : "Draft"}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openEditTestimonial(t)}
                              className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTestimonial(t.id)}
                              className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 rounded-md border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              Delete
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

      {status === "success" && activeTab === "gallery" && (
        <>
          {gallery.length === 0 ? (
            <AdminEmptyState
              title="No gallery items published"
              message="Add installation photos and videos to demonstrate verified project execution."
              actionLabel="Add Media"
              onAction={openAddMedia}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs space-y-3 p-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {m.image ? (
                      <img
                        src={m.image}
                        alt={m.caption || "Installation"}
                        className="w-full aspect-video object-cover rounded-lg border border-border"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-sand/60 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                        Video Media: {m.video_url}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-navy uppercase">{m.category}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleMediaApproved(m)}
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          m.approved ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.approved ? "Approved" : "Draft"}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {m.caption || "No caption provided"}
                    </p>
                  </div>
                  <div className="flex items-center justify-end pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(m.id)}
                      className="min-h-[44px] px-4 py-2 rounded-lg border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Accessible Testimonial Modal */}
      <AdminDialog
        isOpen={Boolean(editingTestimonial)}
        onClose={() => setEditingTestimonial(null)}
        title={isNewTestimonial ? "Add Customer Testimonial" : `Edit Testimonial: ${editingTestimonial?.name ?? ""}`}
        subtitle="Genuine review from a commercial or domestic client."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveTestimonial} className="space-y-4">
          <div>
            <label htmlFor="testiFormName" className="block text-xs font-bold text-navy uppercase mb-1">
              Full Name *
            </label>
            <input
              id="testiFormName"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Musa Abdullahi"
              className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="testiFormBusiness" className="block text-xs font-bold text-navy uppercase mb-1">
                Business / Occupation
              </label>
              <input
                id="testiFormBusiness"
                type="text"
                value={formBusiness}
                onChange={(e) => setFormBusiness(e.target.value)}
                placeholder="e.g. Phone Charging Business"
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
            <div>
              <label htmlFor="testiFormState" className="block text-xs font-bold text-navy uppercase mb-1">
                State *
              </label>
              <select
                id="testiFormState"
                value={formState}
                onChange={(e) => setFormState(e.target.value)}
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
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
          </div>

          <div>
            <label htmlFor="testiFormCategory" className="block text-xs font-bold text-navy uppercase mb-1">
              Service Category
            </label>
            <select
              id="testiFormCategory"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="solar">Solar for Business</option>
              <option value="ev">Electric Vehicles</option>
              <option value="phones">Phones & Gadgets</option>
              <option value="land">Land & Estate</option>
            </select>
          </div>

          <div>
            <label htmlFor="testiFormQuote" className="block text-xs font-bold text-navy uppercase mb-1">
              Testimonial Quote *
            </label>
            <textarea
              id="testiFormQuote"
              rows={3}
              required
              value={formQuote}
              onChange={(e) => setFormQuote(e.target.value)}
              placeholder="Exact statement from the customer regarding power reliability, savings, or service..."
              className="w-full p-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="testiFormPhoto" className="block text-xs font-bold text-navy uppercase mb-1">
                Photo URL (Optional)
              </label>
              <input
                id="testiFormPhoto"
                type="url"
                value={formPhoto}
                onChange={(e) => setFormPhoto(e.target.value)}
                placeholder="https://..."
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
            <div>
              <label htmlFor="testiFormVideo" className="block text-xs font-bold text-navy uppercase mb-1">
                Video URL (Optional)
              </label>
              <input
                id="testiFormVideo"
                type="url"
                value={formVideoUrl}
                onChange={(e) => setFormVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={formApproved}
                onChange={(e) => setFormApproved(e.target.checked)}
                className="size-4 rounded border-input text-navy focus:ring-navy"
              />
              <span className="text-sm font-semibold text-navy">Approved for public display on landing page</span>
            </label>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingTestimonial(null)}
              className="min-h-[44px] px-5 py-2.5 rounded-lg border border-input text-sm font-semibold text-navy hover:bg-sand transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingTestimonial}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              {savingTestimonial ? "Saving..." : "Save Testimonial"}
            </button>
          </div>
        </form>
      </AdminDialog>

      {/* Accessible Gallery Modal */}
      <AdminDialog
        isOpen={Boolean(editingMedia)}
        onClose={() => setEditingMedia(null)}
        title={isNewMedia ? "Add Installation Photograph or Video" : "Edit Media Item"}
        subtitle="Visual proof of commercial rooftop installations and rider handovers."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveMedia} className="space-y-4">
          <div>
            <label htmlFor="mediaFormImage" className="block text-xs font-bold text-navy uppercase mb-1">
              Image URL
            </label>
            <input
              id="mediaFormImage"
              type="url"
              value={formMediaImage}
              onChange={(e) => setFormMediaImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>

          <div>
            <label htmlFor="mediaFormVideo" className="block text-xs font-bold text-navy uppercase mb-1">
              Video URL (Optional)
            </label>
            <input
              id="mediaFormVideo"
              type="url"
              value={formMediaVideoUrl}
              onChange={(e) => setFormMediaVideoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="mediaFormCategory" className="block text-xs font-bold text-navy uppercase mb-1">
                Category
              </label>
              <select
                id="mediaFormCategory"
                value={formMediaCategory}
                onChange={(e) => setFormMediaCategory(e.target.value)}
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="solar">Solar Installation</option>
                <option value="ev">Electric Bike / Keke</option>
                <option value="estate">Land Estate Layout</option>
              </select>
            </div>
            <div>
              <label htmlFor="mediaFormCaption" className="block text-xs font-bold text-navy uppercase mb-1">
                Caption
              </label>
              <input
                id="mediaFormCaption"
                type="text"
                value={formMediaCaption}
                onChange={(e) => setFormMediaCaption(e.target.value)}
                placeholder="e.g. 5kVA Solar Installation in Kano"
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={formMediaApproved}
                onChange={(e) => setFormMediaApproved(e.target.checked)}
                className="size-4 rounded border-input text-navy focus:ring-navy"
              />
              <span className="text-sm font-semibold text-navy">Approved for public gallery</span>
            </label>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingMedia(null)}
              className="min-h-[44px] px-5 py-2.5 rounded-lg border border-input text-sm font-semibold text-navy hover:bg-sand transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingMedia}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              {savingMedia ? "Saving..." : "Save Media"}
            </button>
          </div>
        </form>
      </AdminDialog>
    </div>
  );
}
