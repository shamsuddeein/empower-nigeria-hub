import { useState, useEffect } from "react";
import {
  listAdminProductsFn,
  createProductFn,
  updateProductFn,
  deleteProductFn,
} from "@/server/functions/adminFunctions";
import { formatNaira } from "@/lib/format";
import { AdminDialog } from "./AdminDialog";
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from "./AdminStateFeedback";

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("solar");
  const [formBrand, setFormBrand] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInStock, setFormInStock] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formSpecs, setFormSpecs] = useState<{ key: string; value: string }[]>([]);

  const fetchProducts = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const data = await listAdminProductsFn();
      setProducts(data || []);
      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load products from server.";
      console.error("Error fetching products:", err);
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setIsNew(true);
    setFormName("");
    setFormCategory(categoryFilter === "all" ? "solar" : categoryFilter);
    setFormBrand("");
    setFormPrice("");
    setFormDescription("");
    setFormInStock(true);
    setFormFeatured(false);
    setFormIsPublished(true);
    setFormSpecs([{ key: "Specification", value: "" }]);
    setEditingProduct({});
  };

  const openEditModal = (p: any) => {
    setIsNew(false);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormBrand(p.brand || "");
    setFormPrice(p.cash_price.toString());
    setFormDescription(p.description || "");
    setFormInStock(p.in_stock);
    setFormFeatured(p.featured);
    setFormIsPublished(p.is_published ?? true);

    const specsObj = p.specs || {};
    const specsArr = Object.entries(specsObj).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    setFormSpecs(specsArr.length ? specsArr : [{ key: "Specification", value: "" }]);

    setEditingProduct(p);
  };

  const handleAddSpecRow = () => {
    setFormSpecs([...formSpecs, { key: "", value: "" }]);
  };

  const handleRemoveSpecRow = (idx: number) => {
    setFormSpecs(formSpecs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx: number, field: "key" | "value", val: string) => {
    const updated = [...formSpecs];
    const target = updated[idx];
    if (target) {
      target[field] = val;
      setFormSpecs(updated);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!formName.trim() || !formPrice.trim()) {
      alert("Product name and cash price are required.");
      return;
    }

    const priceNum = parseInt(formPrice, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid positive cash price.");
      return;
    }

    setSaving(true);
    try {
      const specsObj: Record<string, string> = {};
      formSpecs.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specsObj[s.key.trim()] = s.value.trim();
        }
      });

      if (isNew) {
        await createProductFn({
          data: {
            name: formName.trim(),
            category: formCategory,
            brand: formBrand.trim() || null,
            cashPrice: priceNum,
            description: formDescription.trim() || null,
            specs: specsObj,
            inStock: formInStock,
            featured: formFeatured,
            isPublished: formIsPublished,
          },
        });
      } else {
        await updateProductFn({
          data: {
            id: editingProduct.id,
            name: formName.trim(),
            category: formCategory,
            brand: formBrand.trim() || null,
            cashPrice: priceNum,
            description: formDescription.trim() || null,
            specs: specsObj,
            inStock: formInStock,
            featured: formFeatured,
            isPublished: formIsPublished,
          },
        });
      }

      setEditingProduct(null);
      await fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      await deleteProductFn({ data: { id } });
      await fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete product";
      alert(msg);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Products & Pricing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product catalog, cash pricing, specifications, and website publication status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchProducts}
            disabled={status === "loading"}
            className="min-h-[44px] px-4 rounded-lg border border-input bg-surface text-sm font-semibold text-navy hover:bg-sand transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="min-h-[44px] px-4 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors shadow-xs"
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-surface p-4 rounded-xl border border-border">
        <div className="flex-1">
          <label htmlFor="prod-search" className="block text-xs font-bold text-navy mb-1.5 uppercase">
            Search Catalog
          </label>
          <input
            id="prod-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, brand, or model..."
            className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
          />
        </div>
        <div className="sm:w-64">
          <label htmlFor="prod-category-filter" className="block text-xs font-bold text-navy mb-1.5 uppercase">
            Filter by Category
          </label>
          <select
            id="prod-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="solar">Solar Energy Systems</option>
            <option value="ev">Electric Vehicles</option>
            <option value="phones">Phones & Gadgets</option>
          </select>
        </div>
      </div>

      {status === "loading" && <AdminLoadingState message="Loading catalog products..." />}

      {status === "error" && (
        <AdminErrorState
          title="Unable to load products"
          message={errorMessage ?? "A server error prevented loading the product list."}
          onRetry={fetchProducts}
        />
      )}

      {status === "success" && (
        <>
          {filteredProducts.length === 0 ? (
            <AdminEmptyState
              title="No products found"
              description={
                search.trim()
                  ? `No products matched "${search}".`
                  : "No products exist under this category filter."
              }
              action={
                <button
                  type="button"
                  onClick={openAddModal}
                  className="min-h-[44px] px-4 rounded-lg bg-navy text-xs font-semibold text-white hover:bg-navy/90"
                >
                  Create First Product
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {/* Mobile Card Layout */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                          {p.category} {p.brand ? `• ${p.brand}` : ""}
                        </span>
                        <h3 className="font-bold text-base text-navy mt-0.5">{p.name}</h3>
                        <p className="text-sm font-extrabold text-foreground mt-1">{formatNaira(p.cash_price)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            p.in_stock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {p.in_stock ? "In Stock" : "Out of Stock"}
                        </span>
                        {p.is_published && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800">
                            Published
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="min-h-[44px] px-4 rounded-lg border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                      >
                        Edit Product
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="min-h-[44px] px-3.5 rounded-lg border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Data Table */}
              <div className="hidden md:block rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                      <tr>
                        <th className="py-3.5 px-4">Product Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Cash Price</th>
                        <th className="py-3.5 px-4">Inventory</th>
                        <th className="py-3.5 px-4">Visibility</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-sand/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-navy">{p.name}</div>
                            {p.brand && <div className="text-xs text-muted-foreground">{p.brand}</div>}
                          </td>
                          <td className="py-3.5 px-4 capitalize text-xs font-medium">{p.category}</td>
                          <td className="py-3.5 px-4 font-bold text-navy">{formatNaira(p.cash_price)}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                p.in_stock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {p.in_stock ? "In Stock" : "Out of Stock"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                p.is_published ? "bg-blue-100 text-blue-800" : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {p.is_published ? "Published" : "Draft"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(p)}
                                className="min-h-[40px] px-3.5 rounded-lg border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id)}
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

      {/* Accessible Product Editor Dialog */}
      <AdminDialog
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        title={isNew ? "Add New Catalogue Product" : "Edit Catalogue Product"}
        description="Configure pricing, technical specifications, and customer-facing visibility."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-5">
          <div>
            <label htmlFor="prod-form-name" className="block text-xs font-bold text-navy uppercase mb-1.5">
              Product Title / Model *
            </label>
            <input
              id="prod-form-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. 3.5kVA Solar Inverter System"
              className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prod-form-category" className="block text-xs font-bold text-navy uppercase mb-1.5">
                Category *
              </label>
              <select
                id="prod-form-category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
              >
                <option value="solar">Solar Energy</option>
                <option value="ev">Electric Vehicles</option>
                <option value="phones">Phones & Gadgets</option>
              </select>
            </div>
            <div>
              <label htmlFor="prod-form-brand" className="block text-xs font-bold text-navy uppercase mb-1.5">
                Brand / Manufacturer
              </label>
              <input
                id="prod-form-brand"
                type="text"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
                placeholder="e.g. Felicity, Haojue"
                className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="prod-form-price" className="block text-xs font-bold text-navy uppercase mb-1.5">
                Cash Price (NGN) *
              </label>
              <input
                id="prod-form-price"
                type="number"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="e.g. 850000"
                className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-form-desc" className="block text-xs font-bold text-navy uppercase mb-1.5">
              Brief Description
            </label>
            <textarea
              id="prod-form-desc"
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Recommended business use case or equipment capacity..."
              className="w-full p-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
            />
          </div>

          {/* Technical Specs Editor: Stacks cleanly on narrow screens */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-sand/20">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-navy uppercase">
                Technical Specifications
              </label>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="text-xs font-semibold text-navy hover:underline min-h-[44px] flex items-center"
              >
                + Add Spec Row
              </button>
            </div>
            <div className="space-y-3">
              {formSpecs.map((spec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-border bg-surface space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2 shadow-2xs"
                >
                  <div className="sm:w-1/3">
                    <label htmlFor={`spec-key-${idx}`} className="sr-only">
                      Feature Name
                    </label>
                    <input
                      id={`spec-key-${idx}`}
                      type="text"
                      placeholder="Feature (e.g. Battery)"
                      value={spec.key}
                      onChange={(e) => handleSpecChange(idx, "key", e.target.value)}
                      className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={`spec-val-${idx}`} className="sr-only">
                      Feature Detail
                    </label>
                    <input
                      id={`spec-val-${idx}`}
                      type="text"
                      placeholder="Detail (e.g. 5kWh lithium)"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(idx, "value", e.target.value)}
                      className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:outline-none"
                    />
                  </div>
                  {formSpecs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecRow(idx)}
                      className="min-h-[44px] px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg self-end sm:self-auto transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Visibility and Stock Toggles */}
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={formInStock}
                onChange={(e) => setFormInStock(e.target.checked)}
                className="w-4 h-4 rounded border-input text-navy focus:ring-navy"
              />
              <span className="text-sm font-semibold text-navy">Item in stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={formIsPublished}
                onChange={(e) => setFormIsPublished(e.target.checked)}
                className="w-4 h-4 rounded border-input text-navy focus:ring-navy"
              />
              <span className="text-sm font-semibold text-navy">Published on website</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={formFeatured}
                onChange={(e) => setFormFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-input text-navy focus:ring-navy"
              />
              <span className="text-sm font-semibold text-navy">Featured on landing page</span>
            </label>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="min-h-[44px] px-5 rounded-lg border border-input text-sm font-semibold text-navy hover:bg-sand transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              {saving ? "Saving Product..." : "Save Product"}
            </button>
          </div>
        </form>
      </AdminDialog>
    </div>
  );
}
