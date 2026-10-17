import { useState, useEffect } from "react";
import {
  listAdminProductsFn,
  createProductFn,
  updateProductFn,
  deleteProductFn,
} from "@/server/functions/adminFunctions";
import { formatNaira } from "@/lib/format";

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    try {
      const data = await listAdminProductsFn();
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
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
    setFormSpecs([
      { key: "Specification", value: "" },
    ]);
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

    // Convert specs json object to array of key-value pairs
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
    if (!formName.trim() || !formPrice) {
      alert("Please provide product name and cash price.");
      return;
    }

    setSaving(true);
    try {
      // Build specs JSON
      const specsObj: Record<string, string> = {};
      formSpecs.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specsObj[s.key.trim()] = s.value.trim();
        }
      });

      const slug = formName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (isNew) {
        await createProductFn({
          data: {
            name: formName.trim(),
            slug,
            category: formCategory,
            brand: formBrand.trim() || undefined,
            cashPrice: parseInt(formPrice, 10),
            description: formDescription.trim() || undefined,
            inStock: formInStock,
            featured: formFeatured,
            isPublished: formIsPublished,
            specs: specsObj,
          },
        });
      } else {
        await updateProductFn({
          data: {
            id: editingProduct.id,
            name: formName.trim(),
            slug: editingProduct.slug || slug,
            category: formCategory,
            brand: formBrand.trim() || undefined,
            cashPrice: parseInt(formPrice, 10),
            description: formDescription.trim() || undefined,
            inStock: formInStock,
            featured: formFeatured,
            isPublished: formIsPublished,
            specs: specsObj,
          },
        });
      }

      setEditingProduct(null);
      fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product";
      alert("Failed to save product: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await deleteProductFn({ data: { id } });
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete product";
      alert("Failed to delete product: " + msg);
    }
  };

  const handleToggleStock = async (p: any) => {
    const nextVal = !p.in_stock;
    try {
      await updateProductFn({
        data: {
          id: p.id,
          inStock: nextVal,
        },
      });
      setProducts(products.map((item) => (item.id === p.id ? { ...item, in_stock: nextVal } : item)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle inventory";
      alert("Failed to toggle inventory: " + msg);
    }
  };

  const filtered = products.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Products & Pricing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage catalogue items, stock availability, cash prices, and technical specifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="h-10 px-4 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-surface p-4 rounded-xl border border-border">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-navy mb-1 uppercase">Search Products</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or brand..."
            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:border-navy focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-navy mb-1 uppercase">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:border-navy focus:outline-none"
          >
            <option value="all">All categories</option>
            <option value="solar">Solar for Business</option>
            <option value="ev">Electric Vehicles</option>
            <option value="phones">Phones</option>
            <option value="laptops">Laptops</option>
            <option value="tablets">Tablets</option>
            <option value="power_banks">Power Banks</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Cash Price</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    {loading ? "Loading products..." : "No products found in this category."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-sand/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-navy">{p.name}</div>
                      {p.brand && <div className="text-xs text-muted-foreground">{p.brand}</div>}
                    </td>
                    <td className="py-3 px-4 capitalize text-xs font-medium">
                      {p.category}
                    </td>
                    <td className="py-3 px-4 font-bold text-navy">
                      {formatNaira(p.cash_price)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStock(p)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.in_stock
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {p.in_stock ? "In Stock" : "Out of Stock"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium">
                      {p.featured ? (
                        <span className="text-amber-800 font-bold">Featured</span>
                      ) : (
                        <span className="text-muted-foreground">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id, p.name)}
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

      {/* Add / Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-navy">
                  {isNew ? "Add New Product" : `Edit Product: ${editingProduct.name}`}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update product information, price, and specs visible on the landing page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. 5kVA Solar Commercial Kit"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:border-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:border-navy focus:outline-none"
                  >
                    <option value="solar">Solar for Business</option>
                    <option value="ev">Electric Vehicles</option>
                    <option value="phones">Phones</option>
                    <option value="laptops">Laptops</option>
                    <option value="tablets">Tablets</option>
                    <option value="power_banks">Power Banks</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. Samsung, Tecno, SIB Power"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:border-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">
                    Cash Price (NGN) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 850000"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:border-navy focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">
                  Brief Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Recommended business use case or equipment capacity..."
                  className="w-full p-2.5 text-sm rounded-md border border-input bg-background focus:border-navy focus:outline-none"
                />
              </div>

              {/* Specs Editor */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-navy uppercase">
                    Technical Specifications
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="text-xs font-semibold text-navy hover:underline"
                  >
                    Add Specification Row
                  </button>
                </div>
                <div className="space-y-2">
                  {formSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Feature (e.g. Battery)"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(idx, "key", e.target.value)}
                        className="w-1/3 h-9 px-2 text-xs rounded border border-input bg-background focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Detail (e.g. 5kWh lithium)"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, "value", e.target.value)}
                        className="flex-1 h-9 px-2 text-xs rounded border border-input bg-background focus:outline-none"
                      />
                      {formSpecs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecRow(idx)}
                          className="px-2 py-1 text-xs text-destructive hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formInStock}
                    onChange={(e) => setFormInStock(e.target.checked)}
                    className="rounded border-input text-navy focus:ring-navy"
                  />
                  <span className="text-sm font-semibold text-navy">Item in stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="rounded border-input text-navy focus:ring-navy"
                  />
                  <span className="text-sm font-semibold text-navy">Published on website</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="rounded border-input text-navy focus:ring-navy"
                  />
                  <span className="text-sm font-semibold text-navy">Featured on landing page</span>
                </label>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-md border border-input text-sm font-semibold text-navy hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
                >
                  {saving ? "Saving Product..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
