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

export function AdminAgents() {
  const [activeTab, setActiveTab] = useState<"directory" | "applications">("directory");
  const [agents, setAgents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    try {
      const [agData, apData] = await Promise.all([
        listAdminAgentsFn(),
        listAdminAgentApplicationsFn(),
      ]);
      setAgents(agData || []);
      setApplications(apData || []);
    } catch (err) {
      console.error("Error loading agent data:", err);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Agent & Ambassador Network</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage verified community representatives across Northern Nigeria and review onboarding signups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "directory" && (
            <button
              type="button"
              onClick={openAddAgentModal}
              className="h-10 px-4 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Add Agent
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "directory"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Verified Directory ({agents.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("applications")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "applications"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Onboarding Applications ({applications.filter((a) => a.status === "Pending").length} pending)
        </button>
      </div>

      {activeTab === "directory" ? (
        <div className="space-y-4">
          {/* State Filter */}
          <div className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-border">
            <label className="text-xs font-bold text-navy uppercase">Filter by State:</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
            >
              <option value="all">All States</option>
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

          {/* Directory Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Public Locator Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                        {loading ? "Loading agents..." : "No agents found for this state."}
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-sand/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-navy">
                          {agent.name}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div>{agent.phone}</div>
                          {agent.whatsapp && (
                            <div className="text-muted-foreground">WA: {agent.whatsapp}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div>{agent.town || agent.lga}</div>
                          <div className="text-muted-foreground">{agent.state}</div>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium">
                          {agent.type}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(agent)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              agent.show_publicly
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {agent.show_publicly ? "Published" : "Draft (Hidden)"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditAgentModal(agent)}
                            className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAgent(agent.id, agent.name)}
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
        </div>
      ) : (
        /* Applications List */
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Occupation & Shop</th>
                  <th className="py-3 px-4">Role Sought</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No agent applications received yet.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
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
                              className="px-2.5 py-1 rounded-md bg-green-700 text-xs font-semibold text-white hover:bg-green-800"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectApplication(app.id)}
                              className="px-2.5 py-1 rounded-md border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Agent Modal */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl border border-border shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-navy">
                  {isNewAgent ? "Add Community Agent" : `Edit Agent: ${editingAgent.name}`}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verified agent profiles will be displayed in the public agent locator.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAgent(null)}
                className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Abubakar Yusuf"
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="08031234567"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="08031234567"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">State *</label>
                  <select
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full h-10 px-2 text-sm rounded-md border border-input bg-background focus:outline-none"
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
                  <label className="block text-xs font-bold text-navy uppercase mb-1">LGA</label>
                  <input
                    type="text"
                    value={formLga}
                    onChange={(e) => setFormLga(e.target.value)}
                    placeholder="Nassarawa"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Town / Ward</label>
                  <input
                    type="text"
                    value={formTown}
                    onChange={(e) => setFormTown(e.target.value)}
                    placeholder="Kano Central"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Role</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  >
                    <option value="Agent">Agent (Retail point)</option>
                    <option value="Ambassador">Brand Ambassador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Visibility</label>
                  <select
                    value={formShowPublicly ? "true" : "false"}
                    onChange={(e) => setFormShowPublicly(e.target.value === "true")}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  >
                    <option value="true">Published in Locator</option>
                    <option value="false">Draft / Hidden</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="px-4 py-2 rounded-md border border-input text-sm font-semibold text-navy hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAgent}
                  className="px-4 py-2 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
                >
                  {savingAgent ? "Saving..." : "Save Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
