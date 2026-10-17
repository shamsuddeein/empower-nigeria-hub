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

export function AdminTestimonialsMedia() {
  const [activeTab, setActiveTab] = useState<"testimonials" | "gallery">("testimonials");
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
    try {
      const [tData, gData] = await Promise.all([
        listAdminTestimonialsFn(),
        listAdminGalleryFn(),
      ]);
      setTestimonials(tData || []);
      setGallery(gData || []);
    } catch (err) {
      console.error("Error loading testimonials & media:", err);
    } finally {
      setLoading(false);
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
    } catch (err: any) {
      alert("Failed to save testimonial: " + err.message);
    } finally {
      setSavingTestimonial(false);
    }
  };

  const handleToggleTestimonialApproved = async (t: any) => {
    const nextVal = !t.approved;
    try {
      await updateTestimonialFn({ data: { id: t.id, approved: nextVal } });
      setTestimonials(testimonials.map((item) => (item.id === t.id ? { ...item, approved: nextVal } : item)));
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Delete this customer testimonial?")) return;
    try {
      await deleteTestimonialFn({ data: { id } });
      setTestimonials(testimonials.filter((t) => t.id !== id));
    } catch (err: any) {
      alert("Failed to delete testimonial: " + err.message);
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
    } catch (err: any) {
      alert("Failed to save media: " + err.message);
    } finally {
      setSavingMedia(false);
    }
  };

  const handleToggleMediaApproved = async (m: any) => {
    const nextVal = !m.approved;
    try {
      await updateGalleryItemFn({ data: { id: m.id, approved: nextVal } });
      setGallery(gallery.map((item) => (item.id === m.id ? { ...item, approved: nextVal } : item)));
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Delete this installation media?")) return;
    try {
      await deleteGalleryItemFn({ data: { id } });
      setGallery(gallery.filter((g) => g.id !== id));
    } catch (err: any) {
      alert("Failed to delete media: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Approved Testimonials & Installation Media</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage genuine customer reviews, installation photographs, and verified field videos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "testimonials" ? (
            <button
              type="button"
              onClick={openAddTestimonial}
              className="h-10 px-4 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Add Testimonial
            </button>
          ) : (
            <button
              type="button"
              onClick={openAddMedia}
              className="h-10 px-4 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Add Media Photo/Video
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("testimonials")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "testimonials"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Customer Testimonials ({testimonials.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gallery")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "gallery"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Installation Media ({gallery.length})
        </button>
      </div>

      {activeTab === "testimonials" ? (
        /* Testimonials Table */
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Business / Use Case</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quote Excerpt</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {testimonials.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      {loading ? "Loading testimonials..." : "No customer testimonials found."}
                    </td>
                  </tr>
                ) : (
                  testimonials.map((t) => (
                    <tr key={t.id} className="hover:bg-sand/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-navy">
                        {t.name}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {t.business || "Individual"}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {t.state}
                      </td>
                      <td className="py-3 px-4 text-xs capitalize">
                        {t.category}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        "{t.quote}"
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleTestimonialApproved(t)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            t.approved
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {t.approved ? "Approved (Live)" : "Draft (Pending)"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditTestimonial(t)}
                          className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTestimonial(t.id)}
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
        /* Gallery Table */
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Caption</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {gallery.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      No installation media uploaded yet.
                    </td>
                  </tr>
                ) : (
                  gallery.map((item) => (
                    <tr key={item.id} className="hover:bg-sand/30 transition-colors">
                      <td className="py-3 px-4">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.caption || "Media"}
                            className="h-12 w-16 object-cover rounded border border-border"
                          />
                        ) : (
                          <span className="text-xs font-mono text-muted-foreground">Video Link</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-navy text-xs">
                        {item.caption || "Installation photograph"}
                      </td>
                      <td className="py-3 px-4 text-xs capitalize">
                        {item.category}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleMediaApproved(item)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.approved
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {item.approved ? "Approved (Live)" : "Draft (Pending)"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(item.id)}
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
      )}

      {/* Testimonial Modal */}
      {editingTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl border border-border shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-navy">
                  {isNewTestimonial ? "Add Approved Testimonial" : `Edit Testimonial`}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Only authentic, verified feedback from genuine customers should be approved.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTestimonial(null)}
                className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Musa Abdullahi"
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Business / Occupation</label>
                  <input
                    type="text"
                    value={formBusiness}
                    onChange={(e) => setFormBusiness(e.target.value)}
                    placeholder="e.g. Phone Charging Business"
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
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">Service Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                >
                  <option value="solar">Solar for Business</option>
                  <option value="ev">Electric Vehicles</option>
                  <option value="phones">Phones & Gadgets</option>
                  <option value="land">Land & Estate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">Testimonial Quote *</label>
                <textarea
                  rows={3}
                  required
                  value={formQuote}
                  onChange={(e) => setFormQuote(e.target.value)}
                  placeholder="Exact statement from the customer regarding power reliability, savings, or service..."
                  className="w-full p-2.5 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Photo URL (Optional)</label>
                  <input
                    type="url"
                    value={formPhoto}
                    onChange={(e) => setFormPhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Video URL (Optional)</label>
                  <input
                    type="url"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formApproved}
                    onChange={(e) => setFormApproved(e.target.checked)}
                    className="rounded border-input text-navy focus:ring-navy"
                  />
                  <span className="text-sm font-semibold text-navy">Approved for public display on landing page</span>
                </label>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTestimonial(null)}
                  className="px-4 py-2 rounded-md border border-input text-sm font-semibold text-navy hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTestimonial}
                  className="px-4 py-2 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
                >
                  {savingTestimonial ? "Saving..." : "Save Testimonial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {editingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl border border-border shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-navy">Add Installation Photograph or Video</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visual proof of commercial rooftop installations and rider handovers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMedia(null)}
                className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">Image URL</label>
                <input
                  type="url"
                  value={formMediaImage}
                  onChange={(e) => setFormMediaImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">Video URL (Optional)</label>
                <input
                  type="url"
                  value={formMediaVideoUrl}
                  onChange={(e) => setFormMediaVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Category</label>
                  <select
                    value={formMediaCategory}
                    onChange={(e) => setFormMediaCategory(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  >
                    <option value="solar">Solar Installation</option>
                    <option value="ev">Electric Bike / Keke</option>
                    <option value="estate">Land Estate Layout</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Caption</label>
                  <input
                    type="text"
                    value={formMediaCaption}
                    onChange={(e) => setFormMediaCaption(e.target.value)}
                    placeholder="e.g. 5kVA Solar Installation in Kano"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formMediaApproved}
                    onChange={(e) => setFormMediaApproved(e.target.checked)}
                    className="rounded border-input text-navy focus:ring-navy"
                  />
                  <span className="text-sm font-semibold text-navy">Approved for public gallery</span>
                </label>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMedia(null)}
                  className="px-4 py-2 rounded-md border border-input text-sm font-semibold text-navy hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMedia}
                  className="px-4 py-2 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
                >
                  {savingMedia ? "Saving..." : "Save Media"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
