import { useState, useEffect } from "react";
import { getAdminOverviewFn, listAdminApplicationsFn } from "@/server/functions/adminFunctions";
import { AdminLoadingState, AdminErrorState } from "./AdminStateFeedback";

interface AdminOverviewProps {
  onNavigate: (tab: string) => void;
}

export function AdminOverview({ onNavigate }: AdminOverviewProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalApps: 0,
    newApps: 0,
    totalAgents: 0,
    pendingAgents: 0,
    totalProducts: 0,
    totalPlots: 0,
    totalLandInquiries: 0,
    newLandInquiries: 0,
    totalCourses: 0,
    totalTrainingSignups: 0,
    totalMessages: 0,
    unreadMessages: 0,
  });
  const [recentApps, setRecentApps] = useState<any[]>([]);

  const fetchStats = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const [overviewData, appsData] = await Promise.all([
        getAdminOverviewFn(),
        listAdminApplicationsFn(),
      ]);

      setStats({
        totalApps: overviewData.totalApplications,
        newApps: overviewData.newApplications,
        totalAgents: overviewData.totalAgents,
        pendingAgents: overviewData.pendingAgentApplications,
        totalProducts: overviewData.totalProducts,
        totalPlots: overviewData.totalPlots,
        totalLandInquiries: overviewData.totalLandInquiries,
        newLandInquiries: overviewData.newLandInquiries,
        totalCourses: overviewData.totalCourses,
        totalTrainingSignups: overviewData.totalTrainingSignups,
        totalMessages: overviewData.totalMessages,
        unreadMessages: overviewData.unreadMessages,
      });

      if (Array.isArray(appsData)) {
        setRecentApps(appsData.slice(0, 6));
      }
      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard overview data.";
      console.error("Error loading dashboard stats:", err);
      setErrorMessage(msg);
      setStatus("error");
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
            disabled={status === "loading"}
            className="min-h-[44px] px-4 rounded-lg border border-input bg-surface text-sm font-semibold text-navy hover:bg-sand transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {status === "loading" && <AdminLoadingState message="Loading operational metrics..." />}

      {status === "error" && (
        <AdminErrorState
          title="Unable to load dashboard overview"
          message={errorMessage ?? "A server error occurred while retrieving operational metrics."}
          onRetry={fetchStats}
        />
      )}

      {status === "success" && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 1. Installment Applications */}
            <div className="p-5 rounded-xl border border-border bg-surface shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Applications</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-navy">{stats.totalApps}</span>
                  {stats.newApps > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {stats.newApps} new
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Hire purchase submissions</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("applications")}
                className="mt-4 min-h-[44px] w-full text-left text-xs font-semibold text-navy hover:text-action flex items-center justify-between border-t border-border/60 pt-2 transition-colors"
              >
                <span>Review applications</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            {/* 2. Agent Applications */}
            <div className="p-5 rounded-xl border border-border bg-surface shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agent Network</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-navy">{stats.totalAgents}</span>
                  {stats.pendingAgents > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {stats.pendingAgents} pending
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Accredited field agents</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("agents")}
                className="mt-4 min-h-[44px] w-full text-left text-xs font-semibold text-navy hover:text-action flex items-center justify-between border-t border-border/60 pt-2 transition-colors"
              >
                <span>Manage agents</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            {/* 3. Land Inquiries (Counting actual inquiries!) */}
            <div className="p-5 rounded-xl border border-border bg-surface shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Land Inquiries</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-navy">{stats.totalLandInquiries}</span>
                  {stats.newLandInquiries > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {stats.newLandInquiries} new
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Site visit & purchase requests</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("land")}
                className="mt-4 min-h-[44px] w-full text-left text-xs font-semibold text-navy hover:text-action flex items-center justify-between border-t border-border/60 pt-2 transition-colors"
              >
                <span>Inspect land inquiries</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            {/* 4. Vocational Training Signups (Counting actual student registrations!) */}
            <div className="p-5 rounded-xl border border-border bg-surface shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Training Signups</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-navy">{stats.totalTrainingSignups}</span>
                  <span className="text-xs text-muted-foreground">{stats.totalCourses} courses</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Student course enrollments</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("training")}
                className="mt-4 min-h-[44px] w-full text-left text-xs font-semibold text-navy hover:text-action flex items-center justify-between border-t border-border/60 pt-2 transition-colors"
              >
                <span>View training signups</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            {/* 5. Inquiries & Messages (Dedicated card linking directly to messages!) */}
            <div className="p-5 rounded-xl border border-border bg-surface shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Messages</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-navy">{stats.totalMessages}</span>
                  {stats.unreadMessages > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {stats.unreadMessages} unread
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Customer contact messages</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("messages")}
                className="mt-4 min-h-[44px] w-full text-left text-xs font-semibold text-navy hover:text-action flex items-center justify-between border-t border-border/60 pt-2 transition-colors"
              >
                <span>Read messages</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>

          {/* Quick Action Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-border bg-sand/40 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-navy text-base">Catalog & Pricing</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Manage product specs, inventory status, cash prices, and installment markup rules.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => onNavigate("products")}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-navy text-xs font-semibold text-white hover:bg-navy/90 transition-colors"
                >
                  Manage Products ({stats.totalProducts})
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("installments")}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-input bg-surface text-xs font-semibold text-navy hover:bg-sand transition-colors"
                >
                  Markup Rules
                </button>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-sand/40 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-navy text-base">Field Network & Property</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Verify agent credentials, publish trusted community agents, and review plot layout records.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => onNavigate("agents")}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-navy text-xs font-semibold text-white hover:bg-navy/90 transition-colors"
                >
                  Agent Directory ({stats.totalAgents})
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("land")}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-input bg-surface text-xs font-semibold text-navy hover:bg-sand transition-colors"
                >
                  Plots & Layouts ({stats.totalPlots})
                </button>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-sand/40 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-navy text-base">Company & Content</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Update corporate contact numbers, head office address, approved testimonials, and FAQs.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => onNavigate("settings")}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-navy text-xs font-semibold text-white hover:bg-navy/90 transition-colors"
                >
                  Company Settings
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("testimonials")}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-input bg-surface text-xs font-semibold text-navy hover:bg-sand transition-colors"
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
                className="min-h-[40px] px-3 text-xs font-semibold text-navy hover:underline flex items-center"
              >
                View all records &rarr;
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
                            className="min-h-[40px] px-3 rounded-lg text-xs font-semibold text-navy hover:bg-sand/80 transition-colors"
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
        </>
      )}
    </div>
  );
}
