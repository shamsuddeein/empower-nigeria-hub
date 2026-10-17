import { useState, useEffect } from "react";
import { companyDefaults, type CompanyConfig } from "@/config/company";
import { getAdminSettingsFn, updateAdminSettingFn } from "@/server/functions/adminFunctions";

export function AdminSettings() {
  const [config, setConfig] = useState<CompanyConfig>(companyDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const settings = await getAdminSettingsFn();
      if (settings?.["company"] && typeof settings["company"] === "object") {
        setConfig({ ...companyDefaults, ...(settings["company"] as Partial<CompanyConfig>) });
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateAdminSettingFn({ data: { key: "company", value: config } });
      setMessage({ type: "success", text: "Company contact information updated successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: "Failed to update settings: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Company Contact & Details</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update official company communication channels, corporate registration, and physical office addresses.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold border ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-surface p-6 rounded-xl border border-border shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-navy">Verified Corporate Profile</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-navy uppercase mb-1">Company Legal Name *</label>
            <input
              type="text"
              required
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-navy uppercase mb-1">Display Short Name</label>
            <input
              type="text"
              value={config.shortName}
              onChange={(e) => setConfig({ ...config, shortName: e.target.value })}
              className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-navy uppercase mb-1">Local Phone Display *</label>
            <input
              type="text"
              required
              value={config.phone}
              onChange={(e) => setConfig({ ...config, phone: e.target.value })}
              placeholder="0803 123 4567"
              className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-navy uppercase mb-1">International Dial *</label>
            <input
              type="text"
              required
              value={config.phoneIntl}
              onChange={(e) => setConfig({ ...config, phoneIntl: e.target.value })}
              placeholder="+2348031234567"
              className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-navy uppercase mb-1">Official WhatsApp *</label>
            <input
              type="text"
              required
              value={config.whatsapp}
              onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
              placeholder="2348031234567"
              className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-navy uppercase mb-1">Support Email *</label>
            <input
              type="email"
              required
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="info@sibbillionaires.com"
              className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-navy uppercase mb-1">CAC Registration Note</label>
            <input
              type="text"
              value={config.rcNumber}
              onChange={(e) => setConfig({ ...config, rcNumber: e.target.value })}
              placeholder="RC Registration status"
              className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-navy uppercase mb-1">Office Street Address *</label>
          <input
            type="text"
            required
            value={config.address}
            onChange={(e) => setConfig({ ...config, address: e.target.value })}
            placeholder="Head office physical address"
            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-navy uppercase mb-1">Operating Hours</label>
          <input
            type="text"
            value={config.hours}
            onChange={(e) => setConfig({ ...config, hours: e.target.value })}
            placeholder="Monday to Saturday, 8:00 AM – 6:00 PM"
            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-navy uppercase mb-1">Company Description / Summary</label>
          <textarea
            rows={2}
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            className="w-full p-2.5 text-sm rounded-md border border-input bg-background focus:outline-none"
          />
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfig(companyDefaults)}
            className="px-4 py-2 rounded-md border border-input text-sm font-semibold text-navy hover:bg-sand"
          >
            Reset to Defaults
          </button>
          <button
            type="submit"
            disabled={saving || loading}
            className="px-6 py-2 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Company Information"}
          </button>
        </div>
      </form>
    </div>
  );
}
