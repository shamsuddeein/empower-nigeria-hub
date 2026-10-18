import { useState, useEffect } from "react";
import {
  listAdminInstallmentRulesFn,
  upsertInstallmentRuleFn,
} from "@/server/functions/adminFunctions";
import { formatNaira } from "@/lib/format";
import { calculatePlan, defaultMarkups } from "@/lib/installments";
import { AdminLoadingState, AdminErrorState } from "./AdminStateFeedback";

const defaultRulesList = Object.entries(defaultMarkups).map(([d, m]) => ({
  duration_months: Number(d),
  markup_percent: m,
}));

export function AdminInstallmentPlans() {
  const [rules, setRules] = useState<{ duration_months: number; markup_percent: number }[]>(defaultRulesList);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Simulator test inputs
  const [simPrice, setSimPrice] = useState(850000);
  const [simDuration, setSimDuration] = useState(6);
  const [simCategory, setSimCategory] = useState<"solar" | "ev" | "phone">("solar");

  const fetchRules = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const data = await listAdminInstallmentRulesFn();
      if (data && data.length) {
        setRules(data);
      } else {
        setRules(defaultRulesList);
      }
      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load installment markup rules from server.";
      console.error("Error fetching rules:", err);
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleMarkupChange = (duration: number, newPercent: number) => {
    setRules((prev) =>
      prev.map((r) => (r.duration_months === duration ? { ...r, markup_percent: newPercent } : r))
    );
  };

  const handleSaveRules = async () => {
    if (status !== "success" || saving) return;

    setSaving(true);
    setFeedback(null);
    try {
      for (const r of rules) {
        await upsertInstallmentRuleFn({
          data: {
            durationMonths: r.duration_months,
            markupPercent: r.markup_percent,
          },
        });
      }
      setFeedback({ type: "success", text: "Installment markup rules updated successfully." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save rules";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  // Convert rules to record for simulator
  const currentMarkupsRecord = rules.length > 0
    ? Object.fromEntries(rules.map((r) => [r.duration_months, r.markup_percent]))
    : defaultMarkups;

  const deposit = simCategory === "solar" ? 0 : Math.round(simPrice * 0.1);

  const calc = calculatePlan({
    price: simPrice,
    months: simDuration,
    frequency: "monthly",
    deposit,
    markups: currentMarkupsRecord,
  });

  const weeklyCalc = calculatePlan({
    price: simPrice,
    months: simDuration,
    frequency: "weekly",
    deposit,
    markups: currentMarkupsRecord,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Installment Terms & Markup</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure financing markup rates by tenor and simulate customer repayment schedules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRules}
            disabled={status === "loading" || saving}
            className="min-h-[44px] px-4 rounded-lg border border-input bg-surface text-sm font-semibold text-navy hover:bg-sand transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Refreshing..." : "Refresh Rules"}
          </button>
          <button
            type="button"
            onClick={handleSaveRules}
            disabled={saving || status !== "success"}
            className="min-h-[44px] px-5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50 transition-colors shadow-xs"
          >
            {saving ? "Saving Changes..." : "Save Markup Rules"}
          </button>
        </div>
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

      {status === "loading" && <AdminLoadingState message="Loading financing rules and markup rates..." />}

      {status === "error" && (
        <AdminErrorState
          title="Unable to load installment rules"
          message={errorMessage ?? "A server error prevented loading current markup rules. Existing database rules were not modified."}
          onRetry={fetchRules}
        />
      )}

      {status === "success" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rules Table */}
          <div className="bg-surface p-6 rounded-xl border border-border shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-navy">Markup Rates by Tenor</h2>
            <p className="text-xs text-muted-foreground">
              These percentages are applied to the product cash price to determine total payable and installment breakdown.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                  <tr>
                    <th className="py-3 px-3">Tenor</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Approved Markup (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rules.map((rule) => (
                    <tr key={rule.duration_months} className="hover:bg-sand/20">
                      <td className="py-3 px-3 font-semibold text-navy">
                        {rule.duration_months} Months
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">
                        ~{rule.duration_months * 4} weeks
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <label htmlFor={`markup-${rule.duration_months}`} className="sr-only">
                            {rule.duration_months} months markup percent
                          </label>
                          <input
                            id={`markup-${rule.duration_months}`}
                            type="number"
                            min="0"
                            max="100"
                            value={rule.markup_percent}
                            onChange={(e) =>
                              handleMarkupChange(
                                rule.duration_months,
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="w-24 min-h-[44px] px-3 text-base sm:text-sm font-bold text-navy rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
                          />
                          <span className="text-xs font-semibold text-muted-foreground">%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Simulator */}
          <div className="bg-surface p-6 rounded-xl border border-border shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-navy">Commercial Calculator Simulator</h2>
            <p className="text-xs text-muted-foreground">
              Test how rules reflect for a customer applying via the public website.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="sim-cash-price" className="block text-xs font-bold text-navy uppercase mb-1.5">
                  Cash Price (NGN)
                </label>
                <input
                  id="sim-cash-price"
                  type="number"
                  value={simPrice}
                  onChange={(e) => setSimPrice(Number(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="sim-category" className="block text-xs font-bold text-navy uppercase mb-1.5">
                  Category
                </label>
                <select
                  id="sim-category"
                  value={simCategory}
                  onChange={(e) => setSimCategory(e.target.value as any)}
                  className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
                >
                  <option value="solar">Solar (0% deposit)</option>
                  <option value="ev">Electric Vehicles</option>
                  <option value="phone">Phones / Gadgets</option>
                </select>
              </div>
              <div>
                <label htmlFor="sim-duration" className="block text-xs font-bold text-navy uppercase mb-1.5">
                  Tenor
                </label>
                <select
                  id="sim-duration"
                  value={simDuration}
                  onChange={(e) => setSimDuration(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
                >
                  {rules.map((r) => (
                    <option key={r.duration_months} value={r.duration_months}>
                      {r.duration_months} Months
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-sand/40 border border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash price:</span>
                <span className="font-semibold">{formatNaira(simPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Financing markup ({calc.markupPercent}%):</span>
                <span className="font-semibold text-amber-800">+{formatNaira(calc.extra)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="font-bold text-navy">Total customer payable:</span>
                <span className="font-extrabold text-navy text-base">{formatNaira(calc.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Initial deposit:</span>
                <span className="font-bold text-green-700">
                  {deposit === 0 ? "₦0 (No deposit required)" : formatNaira(deposit)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="bg-surface p-3.5 rounded-lg border border-border text-center">
                  <span className="text-xs text-muted-foreground block">Monthly Installment</span>
                  <span className="text-base font-extrabold text-navy">{formatNaira(calc.perPayment)}</span>
                </div>
                <div className="bg-surface p-3.5 rounded-lg border border-border text-center">
                  <span className="text-xs text-muted-foreground block">Weekly Equivalent</span>
                  <span className="text-base font-extrabold text-green-800">{formatNaira(weeklyCalc.perPayment)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
