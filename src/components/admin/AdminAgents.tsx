import { useState, useEffect } from "react";
import {
  listAdminAgentsFn,
  listAdminAgentApplicationsFn,
  createAgentFn,
  updateAgentFn,
  deleteAgentFn,
  approveAgentApplicationFn,
  updateAgentApplicationStatusFn,
} from "@/server/functions/adminFunctions";
import { AdminDialog } from "./AdminDialog";
import {
  AdminLoadingState,
  AdminErrorState,
  AdminEmptyState,
} from "./AdminStateFeedback";

export function AdminAgents() {
  const [activeTab, setActiveTab] = useState<"directory" | "applications">("directory");
  const [agents, setAgents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState("all");

  // Add/Edit Agent Modal
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [isNewAgent, setIsNewAgent] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formState, setFormState] = useState("Kano");
  const [formLga, setFormLga] = useState("");
  const [formTown, setFormTown] = useState("");
  const [formType, setFormType] = useState("Agent");
  const [formShowPublicly, setFormShowPublicly] = useState(true);

  const fetchData = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const [agData, apData] = await Promise.all([
        listAdminAgentsFn(),
        listAdminAgentApplicationsFn(),
      ]);
      setAgents(agData || []);
      setApplications(apData || []);
      setStatus("success");
    } catch (err: unknown) {
      console.error("Error loading agent data:", err);
      const msg = err instanceof Error ? err.message : "Failed to load agent directory records.";
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddAgentModal = () => {
    setIsNewAgent(true);
    setFormName("");
    setFormPhone("");
    setFormWhatsapp("");
    setFormState(stateFilter === "all" ? "Kano" : stateFilter);
    setFormLga("");
    setFormTown("");
    setFormType("Agent");
    setFormShowPublicly(true);
    setEditingAgent({});
  };

  const openEditAgentModal = (a: any) => {
    setIsNewAgent(false);
    setFormName(a.name);
    setFormPhone(a.phone);
    setFormWhatsapp(a.whatsapp || "");
    setFormState(a.state);
    setFormLga(a.lga || "");
    setFormTown(a.town || "");
    setFormType(a.type);
    setFormShowPublicly(a.show_publicly);
    setEditingAgent(a);
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert("Name and phone number are required.");
      return;
    }

    setSavingAgent(true);
    try {
      if (isNewAgent) {
        await createAgentFn({
          data: {
            name: formName.trim(),
            phone: formPhone.trim(),
            whatsapp: formWhatsapp.trim() || undefined,
            state: formState,
            lga: formLga.trim() || undefined,
            town: formTown.trim() || undefined,
            type: formType,
            showPublicly: formShowPublicly,
            status: "Approved",
          },
        });
      } else {
        await updateAgentFn({
          data: {
            id: editingAgent.id,
            name: formName.trim(),
            phone: formPhone.trim(),
            whatsapp: formWhatsapp.trim() || undefined,
            state: formState,
            lga: formLga.trim() || undefined,
            town: formTown.trim() || undefined,
            type: formType,
            showPublicly: formShowPublicly,
          },
        });
      }

      setEditingAgent(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save agent";
      alert("Failed to save agent: " + msg);
    } finally {
      setSavingAgent(false);
    }
  };

  const handleTogglePublish = async (agent: any) => {
    const nextVal = !agent.show_publicly;
    try {
      await updateAgentFn({
        data: {
          id: agent.id,
          showPublicly: nextVal,
        },
      });
      setAgents(agents.map((a) => (a.id === agent.id ? { ...a, show_publicly: nextVal } : a)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      alert("Failed to update status: " + msg);
    }
  };

  const handleDeleteAgent = async (id: string, name: string) => {
    if (!confirm(`Delete agent ${name}?`)) return;
    try {
      await deleteAgentFn({ data: { id } });
      setAgents(agents.filter((a) => a.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete agent";
      alert("Failed to delete agent: " + msg);
    }
  };

  const handleApproveApplication = async (app: any) => {
    if (!confirm(`Approve ${app.full_name} and add to verified agent directory?`)) return;
    try {
      await approveAgentApplicationFn({
        data: {
          applicationId: app.id,
        },
      });
      alert(`Approved ${app.full_name} and added to agent directory.`);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve application";
      alert("Failed to approve application: " + msg);
    }
  };

  const handleRejectApplication = async (id: string) => {
    try {
      await updateAgentApplicationStatusFn({
        data: {
          id,
          status: "Rejected",
        },
      });
      setApplications(applications.map((a) => (a.id === id ? { ...a, status: "Rejected" } : a)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reject application";
      alert("Failed to reject application: " + msg);
    }
  };

  const filteredAgents = agents.filter((a) => {
    if (stateFilter === "all") return true;
    return a.state === stateFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">Agent & Ambassador Network</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage verified community representatives across Northern Nigeria and review onboarding signups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "directory" && (
            <button
              type="button"
              onClick={openAddAgentModal}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors shadow-xs"
            >
              Add Agent
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border" role="tablist" aria-label="Agent modules">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "directory"}
          onClick={() => setActiveTab("directory")}
          className={`min-h-[44px] py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "directory"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Verified Directory ({agents.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "applications"}
          onClick={() => setActiveTab("applications")}
          className={`min-h-[44px] py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "applications"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          New Signups ({applications.length})
        </button>
      </div>

      {/* State Feedback */}
      {status === "loading" && (
        <AdminLoadingState message="Loading agent directory and onboarding applications..." />
      )}

      {status === "error" && (
        <AdminErrorState
          title="Could not load agent records"
          message={errorMessage ?? "An error occurred while communicating with the database."}
          onRetry={fetchData}
        />
      )}

      {status === "success" && activeTab === "directory" && (
        <div className="space-y-4">
          {/* State Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-navy uppercase">Filter State:</span>
            {["all", "Kano", "Kaduna", "Abuja FCT", "Katsina", "Bauchi", "Sokoto", "Plateau", "Jigawa", "Niger"].map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStateFilter(st)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    stateFilter === st
                      ? "bg-navy text-white"
                      : "bg-surface border border-border text-muted-foreground hover:text-navy"
                  }`}
                >
                  {st === "all" ? "All States" : st}
                </button>
              )
            )}
          </div>

          {filteredAgents.length === 0 ? (
            <AdminEmptyState
              title="No agents found"
              message={
                stateFilter === "all"
                  ? "No community agents registered yet. Click 'Add Agent' to register a representative."
                  : `No agents listed under ${stateFilter}.`
              }
              actionLabel={stateFilter === "all" ? "Add Agent" : undefined}
              onAction={stateFilter === "all" ? openAddAgentModal : undefined}
            />
          ) : (
            <div className="space-y-4">
              {/* Mobile Card View (< 768px) */}
              <div className="grid gap-3 md:hidden">
                {filteredAgents.map((ag) => (
                  <div
                    key={ag.id}
                    className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-navy text-base">{ag.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {ag.town ? `${ag.town}, ` : ""}{ag.lga ? `${ag.lga}, ` : ""}{ag.state}
                        </p>
                      </div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ag.type === "Ambassador"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {ag.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <a
                        href={`tel:${ag.phone}`}
                        className="inline-flex items-center min-h-[44px] px-3 py-2 rounded-lg bg-navy/10 text-navy font-semibold hover:bg-navy/20"
                      >
                        Call {ag.phone}
                      </a>
                      {ag.whatsapp && (
                        <a
                          href={`https://wa.me/${ag.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center min-h-[44px] px-3 py-2 rounded-lg bg-green-100 text-green-800 font-semibold"
                        >
                          WhatsApp
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(ag)}
                        className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          ag.show_publicly
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {ag.show_publicly ? "Public" : "Hidden"}
                      </button>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => openEditAgentModal(ag)}
                        className="flex-1 min-h-[44px] px-3 py-2 rounded-lg border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAgent(ag.id, ag.name)}
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
                        <th className="py-3 px-4">Representative</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Visibility</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredAgents.map((ag) => (
                        <tr key={ag.id} className="hover:bg-sand/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-navy">
                            {ag.name}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <div>{ag.phone}</div>
                            {ag.whatsapp && (
                              <div className="text-muted-foreground">WA: {ag.whatsapp}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <div>{ag.town || ag.lga || ag.state}</div>
                            <div className="text-muted-foreground">{ag.state}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                ag.type === "Ambassador"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {ag.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(ag)}
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                                ag.show_publicly
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-muted text-muted-foreground hover:bg-sand"
                              }`}
                            >
                              {ag.show_publicly ? "Public in Locator" : "Hidden"}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openEditAgentModal(ag)}
                              className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAgent(ag.id, ag.name)}
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
        </div>
      )}

      {status === "success" && activeTab === "applications" && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <AdminEmptyState
              title="No agent applications pending"
              message="Online applications from prospective local agents and brand ambassadors will appear here for review."
            />
          ) : (
            <div className="space-y-4">
              {/* Mobile Card View (< 768px) */}
              <div className="grid gap-3 md:hidden">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-navy text-base">{app.full_name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {app.town}, {app.lga}, {app.state}
                        </p>
                      </div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          app.status === "Pending"
                            ? "bg-amber-100 text-amber-800"
                            : app.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 bg-sand/30 p-2.5 rounded-lg border border-border/50">
                      <div>
                        <span className="font-semibold text-navy">Occupation: </span>
                        <span>{app.occupation} ({app.has_shop ? "Has shop" : "No shop"})</span>
                      </div>
                      <div>
                        <span className="font-semibold text-navy">Role Applied: </span>
                        <span>{app.type}</span>
                      </div>
                      {app.note && (
                        <div>
                          <span className="font-semibold text-navy">Note: </span>
                          <span className="text-muted-foreground">{app.note}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <a
                        href={`tel:${app.phone}`}
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center px-3 py-2 rounded-lg bg-navy/10 text-navy text-xs font-semibold hover:bg-navy/20"
                      >
                        Call {app.phone}
                      </a>
                      {app.status === "Pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveApplication(app)}
                            className="min-h-[44px] px-4 py-2 rounded-lg bg-green-700 text-xs font-semibold text-white hover:bg-green-800"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectApplication(app.id)}
                            className="min-h-[44px] px-4 py-2 rounded-lg border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
                          >
                            Reject
                          </button>
                        </>
                      )}
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
                        <th className="py-3 px-4">Applicant</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Background</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-sand/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-navy">
                            {app.full_name}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <div>{app.phone}</div>
                            <a href={`tel:${app.phone}`} className="text-navy font-semibold hover:underline">
                              Call
                            </a>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <div>{app.town}, {app.lga}</div>
                            <div className="text-muted-foreground">{app.state}</div>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <div>{app.occupation}</div>
                            <div className="text-muted-foreground">
                              {app.has_shop ? "Has physical shop" : "No dedicated shop"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs font-medium">
                            {app.type}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                app.status === "Pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : app.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {app.status === "Pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveApplication(app)}
                                  className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 rounded-md bg-green-700 text-xs font-semibold text-white hover:bg-green-800"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectApplication(app.id)}
                                  className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 rounded-md border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accessible Add / Edit Agent Modal using AdminDialog */}
      <AdminDialog
        isOpen={Boolean(editingAgent)}
        onClose={() => setEditingAgent(null)}
        title={isNewAgent ? "Add Community Agent" : `Edit Agent: ${editingAgent?.name ?? ""}`}
        subtitle="Verified agent profiles will be displayed in the public agent locator."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveAgent} className="space-y-4">
          <div>
            <label htmlFor="agentFormName" className="block text-xs font-bold text-navy uppercase mb-1">
              Full Name *
            </label>
            <input
              id="agentFormName"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Abubakar Yusuf"
              className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="agentFormPhone" className="block text-xs font-bold text-navy uppercase mb-1">
                Phone Number *
              </label>
              <input
                id="agentFormPhone"
                type="tel"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="08031234567"
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
            <div>
              <label htmlFor="agentFormWhatsapp" className="block text-xs font-bold text-navy uppercase mb-1">
                WhatsApp Number
              </label>
              <input
                id="agentFormWhatsapp"
                type="tel"
                value={formWhatsapp}
                onChange={(e) => setFormWhatsapp(e.target.value)}
                placeholder="08031234567"
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="agentFormState" className="block text-xs font-bold text-navy uppercase mb-1">
                State *
              </label>
              <select
                id="agentFormState"
                value={formState}
                onChange={(e) => setFormState(e.target.value)}
                className="w-full min-h-[44px] px-2 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="Kano">Kano</option>
                <option value="Kaduna">Kaduna</option>
                <option value="Abuja FCT">Abuja FCT</option>
                <option value="Katsina">Katsina</option>
                <option value="Bauchi">Bauchi</option>
                <option value="Sokoto">Sokoto</option>
                <option value="Plateau">Plateau</option>
                <option value="Jigawa">Jigawa</option>
                <option value="Niger">Niger</option>
              </select>
            </div>
            <div>
              <label htmlFor="agentFormLga" className="block text-xs font-bold text-navy uppercase mb-1">
                LGA
              </label>
              <input
                id="agentFormLga"
                type="text"
                value={formLga}
                onChange={(e) => setFormLga(e.target.value)}
                placeholder="Nassarawa"
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
            <div>
              <label htmlFor="agentFormTown" className="block text-xs font-bold text-navy uppercase mb-1">
                Town / Ward
              </label>
              <input
                id="agentFormTown"
                type="text"
                value={formTown}
                onChange={(e) => setFormTown(e.target.value)}
                placeholder="Kano Central"
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="agentFormType" className="block text-xs font-bold text-navy uppercase mb-1">
                Role
              </label>
              <select
                id="agentFormType"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="Agent">Agent (Retail point)</option>
                <option value="Ambassador">Brand Ambassador</option>
              </select>
            </div>
            <div>
              <label htmlFor="agentFormVisibility" className="block text-xs font-bold text-navy uppercase mb-1">
                Visibility
              </label>
              <select
                id="agentFormVisibility"
                value={formShowPublicly ? "true" : "false"}
                onChange={(e) => setFormShowPublicly(e.target.value === "true")}
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="true">Published in Locator</option>
                <option value="false">Draft / Hidden</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingAgent(null)}
              className="min-h-[44px] px-5 py-2.5 rounded-lg border border-input text-sm font-semibold text-navy hover:bg-sand transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAgent}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              {savingAgent ? "Saving..." : "Save Agent"}
            </button>
          </div>
        </form>
      </AdminDialog>
    </div>
  );
}
