import { useState, useEffect } from "react";
import { getAdminOverviewFn, listAdminApplicationsFn } from "@/server/functions/adminFunctions";

interface AdminOverviewProps {
  onNavigate: (tab: string) => void;
}

export function AdminOverview({ onNavigate }: AdminOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApps: 0,
    newApps: 0,
    totalProducts: 0,
    landInquiries: 0,
    agentApps: 0,
    trainingSignups: 0,
    unreadMessages: 0,
  });
  const [recentApps, setRecentApps] = useState<any[]>([]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [overviewData, appsData] = await Promise.all([
        getAdminOverviewFn(),
        listAdminApplicationsFn(),
      ]);

      setStats({
        totalApps: overviewData.totalApplications,
        newApps: overviewData.newApplications,
        totalProducts: overviewData.totalProducts,
        landInquiries: overviewData.totalPlots,
        agentApps: overviewData.pendingAgentApplications,
        trainingSignups: overviewData.totalCourses,
        unreadMessages: overviewData.unreadMessages,
      });

      if (Array.isArray(appsData)) {
        setRecentApps(appsData.slice(0, 6));
      }
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Staff Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Activity summary and pending operational workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-semibold text-navy hover:bg-sand transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border bg-surface shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Installment Applications</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-navy">{stats.totalApps}</span>
            {stats.newApps > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {stats.newApps} new
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate("applications")}
            className="mt-4 text-xs font-semibold text-navy hover:underline block"
          >
            View applications
          </button>
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agent Applications</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-navy">{stats.agentApps}</span>
            <span className="text-xs text-muted-foreground">Pending review</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("agents")}
            className="mt-4 text-xs font-semibold text-navy hover:underline block"
          >
            Review agents
          </button>
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Land Inquiries</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-navy">{stats.landInquiries}</span>
            <span className="text-xs text-muted-foreground">Site visit requests</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("land")}
            className="mt-4 text-xs font-semibold text-navy hover:underline block"
          >
            Inspect land inquiries
          </button>
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Training & Inquiries</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-navy">
              {stats.trainingSignups + stats.unreadMessages}
            </span>
            {stats.unreadMessages > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {stats.unreadMessages} messages
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate("training")}
            className="mt-4 text-xs font-semibold text-navy hover:underline block"
          >
            View training & messages
          </button>
        </div>
      </div>

      {/* Quick Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-border bg-sand/40">
          <h3 className="font-bold text-navy text-base">Catalog & Pricing</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Manage product specs, inventory status, cash prices, and installment markup rules.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate("products")}
              className="px-3 py-1.5 rounded-md bg-navy text-xs font-semibold text-white hover:bg-navy/90"
            >
              Manage Products ({stats.totalProducts})
            </button>
            <button
              type="button"
              onClick={() => onNavigate("installments")}
              className="px-3 py-1.5 rounded-md border border-input bg-surface text-xs font-semibold text-navy hover:bg-sand"
            >
              Markup Rules
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-sand/40">
          <h3 className="font-bold text-navy text-base">Field Network</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Verify agent credentials, publish trusted community agents, and review ambassador registrations.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate("agents")}
              className="px-3 py-1.5 rounded-md bg-navy text-xs font-semibold text-white hover:bg-navy/90"
            >
              Agent Directory
            </button>
            <button
              type="button"
              onClick={() => onNavigate("land")}
              className="px-3 py-1.5 rounded-md border border-input bg-surface text-xs font-semibold text-navy hover:bg-sand"
            >
              Plots & Layouts
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-sand/40">
          <h3 className="font-bold text-navy text-base">Company & Content</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Update corporate contact numbers, head office address, approved testimonials, and FAQs.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate("settings")}
              className="px-3 py-1.5 rounded-md bg-navy text-xs font-semibold text-white hover:bg-navy/90"
            >
              Company Settings
            </button>
            <button
              type="button"
              onClick={() => onNavigate("testimonials")}
              className="px-3 py-1.5 rounded-md border border-input bg-surface text-xs font-semibold text-navy hover:bg-sand"
            >
              Media & Testimonials
            </button>
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-navy text-base">Recent Applications</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest hire purchase and installment applications submitted through the landing page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("applications")}
            className="text-xs font-semibold text-navy hover:underline"
          >
            View all records
          </button>
        </div>

        {recentApps.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No applications submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-4">Ref Code</th>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Tenor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentApps.map((app) => (
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
                      <div className="text-xs text-muted-foreground capitalize">{app.category}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium">
                      {app.state}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {app.duration} months ({app.frequency})
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
                        onClick={() => onNavigate("applications")}
                        className="text-xs font-semibold text-navy hover:underline"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
