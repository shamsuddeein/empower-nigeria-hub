import { useState, useEffect } from "react";
import { companyDefaults, type CompanyConfig } from "@/config/company";
import { getAdminSettingsFn, updateAdminSettingFn } from "@/server/functions/adminFunctions";
import { AdminLoadingState, AdminErrorState } from "./AdminStateFeedback";

export function AdminSettings() {
  const [config, setConfig] = useState<CompanyConfig>(companyDefaults);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const settings = await getAdminSettingsFn();
      if (settings?.["company"] && typeof settings["company"] === "object") {
        setConfig({ ...companyDefaults, ...(settings["company"] as Partial<CompanyConfig>) });
      }
      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load company settings from server.";
      console.error("Error loading settings:", err);
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "success" || saving) return;

    setSaving(true);
    setFeedback(null);
    try {
      await updateAdminSettingFn({ data: { key: "company", value: config } });
      setFeedback({ type: "success", text: "Company contact information updated successfully." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update settings.";
      setFeedback({ type: "error", text: msg });
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
        <button
          type="button"
          onClick={fetchSettings}
          disabled={status === "loading" || saving}
          className="min-h-[44px] px-4 rounded-lg border border-input bg-surface text-sm font-semibold text-navy hover:bg-sand transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          {status === "loading" ? "Refreshing..." : "Refresh Settings"}
        </button>
      </div>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`p-4 rounded-xl text-sm font-semibold border ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {status === "loading" && <AdminLoadingState message="Loading verified company settings..." />}

      {status === "error" && (
        <AdminErrorState
          title="Unable to load company settings"
          message={errorMessage ?? "A server or network error prevented loading company settings. Existing settings have not been modified."}
          onRetry={fetchSettings}
        />
      )}

      {status === "success" && (
        <form onSubmit={handleSave} className="bg-surface p-6 rounded-xl border border-border shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-navy">Verified Corporate Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company-legal-name" className="block text-xs font-bold text-navy uppercase mb-1.5">
                Company Legal Name *
              </label>
              <input
                id="company-legal-name"
                type="text"
                required
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="company-short-name" className="block text-xs font-bold text-navy uppercase mb-1.5">
                Display Short Name
              </label>
              <input
                id="company-short-name"
                type="text"
                value={config.shortName}
                onChange={(e) => setConfig({ ...config, shortName: e.target.value })}
                className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="company-phone" className="block text-xs font-bold text-navy uppercase mb-1.5">
                Local Phone Display *
              </label>
              <input
                id="company-phone"
                type="text"
                required
                value={config.phone}
                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                placeholder="0803 123 4567"
                className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="company-phone-intl" className="block text-xs font-bold text-navy uppercase mb-1.5">
                International Dial *
              </label>
              <input
                id="company-phone-intl"
                type="text"
                required
                value={config.phoneIntl}
                onChange={(e) => setConfig({ ...config, phoneIntl: e.target.value })}
                placeholder="+2348031234567"
                className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="company-whatsapp" className="block text-xs font-bold text-navy uppercase mb-1.5">
                Official WhatsApp *
              </label>
              <input
                id="company-whatsapp"
                type="text"
                required
                value={config.whatsapp}
                onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                placeholder="2348031234567"
                className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company-email" className="block text-xs font-bold text-navy uppercase mb-1.5">
                Support Email *
              </label>
              <input
                id="company-email"
                type="email"
                required
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                placeholder="info@sibbillionaires.com"
                className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="company-rc" className="block text-xs font-bold text-navy uppercase mb-1.5">
                CAC Registration Note
              </label>
              <input
                id="company-rc"
                type="text"
                value={config.rcNumber}
                onChange={(e) => setConfig({ ...config, rcNumber: e.target.value })}
                placeholder="RC Registration status"
                className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="company-address" className="block text-xs font-bold text-navy uppercase mb-1.5">
              Office Street Address *
            </label>
            <input
              id="company-address"
              type="text"
              required
              value={config.address}
              onChange={(e) => setConfig({ ...config, address: e.target.value })}
              placeholder="Head office physical address"
              className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="company-hours" className="block text-xs font-bold text-navy uppercase mb-1.5">
              Operating Hours
            </label>
            <input
              id="company-hours"
              type="text"
              value={config.hours}
              onChange={(e) => setConfig({ ...config, hours: e.target.value })}
              placeholder="Monday to Saturday, 8:00 AM – 6:00 PM"
              className="w-full min-h-[44px] px-3.5 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="company-description" className="block text-xs font-bold text-navy uppercase mb-1.5">
              Company Description / Summary
            </label>
            <textarea
              id="company-description"
              rows={3}
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              className="w-full p-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-border flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfig(companyDefaults)}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-input text-sm font-semibold text-navy hover:bg-sand transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              type="submit"
              disabled={saving || status !== "success"}
              className="min-h-[44px] px-6 py-2 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              {saving ? "Saving Changes..." : "Save Company Information"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
