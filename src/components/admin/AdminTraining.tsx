import { useState, useEffect } from "react";
import { formatNaira } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import {
  listAdminCoursesFn,
  listAdminTrainingSignupsFn,
  createCourseFn,
  updateCourseFn,
  deleteCourseFn,
} from "@/server/functions/adminFunctions";
import { AdminDialog } from "./AdminDialog";
import {
  AdminLoadingState,
  AdminErrorState,
  AdminEmptyState,
} from "./AdminStateFeedback";

export function AdminTraining() {
  const [activeTab, setActiveTab] = useState<"courses" | "signups">("courses");
  const [courses, setCourses] = useState<any[]>([]);
  const [signups, setSignups] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add / Edit Course Modal
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [isNewCourse, setIsNewCourse] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formPrice, setFormPrice] = useState(150000);
  const [formStartDate, setFormStartDate] = useState("2026-11-16");
  const [formSeatsLeft, setFormSeatsLeft] = useState(12);
  const [formActive, setFormActive] = useState(true);
  const [formLearn, setFormLearn] = useState("");

  const fetchData = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const [coursesData, signupsData] = await Promise.all([
        listAdminCoursesFn(),
        listAdminTrainingSignupsFn(),
      ]);
      setCourses(coursesData || []);
      setSignups(signupsData || []);
      setStatus("success");
    } catch (err: unknown) {
      console.error("Error loading training data:", err);
      const msg = err instanceof Error ? err.message : "Failed to load vocational courses and signups.";
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddCourseModal = () => {
    setIsNewCourse(true);
    setFormTitle("");
    setFormDuration("4 weeks, Monday to Friday");
    setFormPrice(150000);
    setFormStartDate("");
    setFormSeatsLeft(15);
    setFormActive(true);
    setFormLearn("System sizing\nWiring and inverters\nBattery safety\nFault diagnostics");
    setEditingCourse({});
  };

  const openEditCourseModal = (c: any) => {
    setIsNewCourse(false);
    setFormTitle(c.title);
    setFormDuration(c.duration || "");
    setFormPrice(c.price || 0);
    setFormStartDate(c.start_date || "");
    setFormSeatsLeft(c.seats_left || 0);
    setFormActive(c.active);
    setFormLearn(Array.isArray(c.learn) ? c.learn.join("\n") : "");
    setEditingCourse(c);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Course title is required.");
      return;
    }
    setSavingCourse(true);
    try {
      const slug =
        editingCourse.slug ||
        formTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      const learnArray = formLearn
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: formTitle.trim(),
        slug,
        duration: formDuration.trim() || undefined,
        price: Number(formPrice),
        startDate: formStartDate || undefined,
        seatsLeft: Number(formSeatsLeft),
        active: formActive,
        learn: learnArray,
      };

      if (isNewCourse) {
        await createCourseFn({ data: payload });
      } else {
        await updateCourseFn({ data: { id: editingCourse.id, ...payload } });
      }

      setEditingCourse(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save course";
      alert("Failed to save course: " + msg);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleToggleActive = async (c: any) => {
    const nextVal = !c.active;
    try {
      await updateCourseFn({ data: { id: c.id, active: nextVal } });
      setCourses(courses.map((item) => (item.id === c.id ? { ...item, active: nextVal } : item)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      alert("Failed to update status: " + msg);
    }
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!confirm(`Delete course ${title}?`)) return;
    try {
      await deleteCourseFn({ data: { id } });
      setCourses(courses.filter((c) => c.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete course";
      alert("Failed to delete course: " + msg);
    }
  };

  const exportSignupsCSV = () => {
    if (!signups.length) {
      alert("No signups to export.");
      return;
    }
    const headers = ["Full Name", "Phone", "Email", "State", "Course", "Education", "Experience", "Registered At"];
    const rows = signups.map((s) => [
      s.full_name || "",
      s.phone || "",
      s.email || "",
      s.state || "",
      s.course_title || "",
      s.education || "",
      s.experience || "",
      s.created_at ? new Date(s.created_at).toISOString() : "",
    ]);
    downloadCsv({
      filename: `training_signups_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">Vocational Training & Capacity</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage solar and POS business training cohorts, syllabus modules, and trainee registrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "courses" ? (
            <button
              type="button"
              onClick={openAddCourseModal}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors shadow-xs"
            >
              Add Course
            </button>
          ) : (
            <button
              type="button"
              onClick={exportSignupsCSV}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg border border-input bg-surface text-sm font-semibold text-navy hover:bg-sand transition-colors shadow-xs"
            >
              Export Signups CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border" role="tablist" aria-label="Training modules">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "courses"}
          onClick={() => setActiveTab("courses")}
          className={`min-h-[44px] py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "courses"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Courses Offered ({courses.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "signups"}
          onClick={() => setActiveTab("signups")}
          className={`min-h-[44px] py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "signups"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Trainee Registrations ({signups.length})
        </button>
      </div>

      {/* State Feedback */}
      {status === "loading" && (
        <AdminLoadingState message="Loading training cohorts and registrant roster..." />
      )}

      {status === "error" && (
        <AdminErrorState
          title="Could not load training data"
          message={errorMessage ?? "An error occurred while communicating with the database."}
          onRetry={fetchData}
        />
      )}

      {status === "success" && activeTab === "courses" && (
        <>
          {courses.length === 0 ? (
            <AdminEmptyState
              title="No courses listed"
              message="Add practical vocational courses such as Solar Installation or POS Business Operations."
              actionLabel="Add Course"
              onAction={openAddCourseModal}
            />
          ) : (
            <div className="space-y-4">
              {/* Mobile Card View (< 768px) */}
              <div className="grid gap-3 md:hidden">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-navy text-base">{c.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {c.duration} &bull; {c.seats_left} seats remaining
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.active
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.active ? "Open" : "Closed"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                      <div>
                        <span className="text-muted-foreground">Tuition Fee: </span>
                        <strong className="text-navy font-bold">{formatNaira(c.price)}</strong>
                      </div>
                      {c.start_date && (
                        <div>
                          <span className="text-muted-foreground">Starts: </span>
                          <span className="font-semibold text-navy">{c.start_date}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => openEditCourseModal(c)}
                        className="flex-1 min-h-[44px] px-3 py-2 rounded-lg border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                      >
                        Edit Course
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(c.id, c.title)}
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
                        <th className="py-3 px-4">Course Title</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Tuition Fee</th>
                        <th className="py-3 px-4">Next Cohort</th>
                        <th className="py-3 px-4">Seats Left</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {courses.map((c) => (
                        <tr key={c.id} className="hover:bg-sand/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-navy">
                            {c.title}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {c.duration || "Self-paced"}
                          </td>
                          <td className="py-3 px-4 font-bold text-navy">
                            {formatNaira(c.price)}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {c.start_date || "Rolling admission"}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold">
                            {c.seats_left}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(c)}
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                                c.active
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-muted text-muted-foreground hover:bg-sand"
                              }`}
                            >
                              {c.active ? "Open for Registration" : "Closed"}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openEditCourseModal(c)}
                              className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCourse(c.id, c.title)}
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
        </>
      )}

      {status === "success" && activeTab === "signups" && (
        <>
          {signups.length === 0 ? (
            <AdminEmptyState
              title="No trainee registrations yet"
              message="Prospective trainees submitting registrations through the public portal will appear in this cohort roster."
            />
          ) : (
            <div className="space-y-4">
              {/* Mobile Card View (< 768px) */}
              <div className="grid gap-3 md:hidden">
                {signups.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-navy text-base">{s.full_name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {s.state} &bull; {s.course_title || "General Training"}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 bg-sand/30 p-2.5 rounded-lg border border-border/50">
                      <div>
                        <span className="font-semibold text-navy">Phone: </span>
                        <span>{s.phone}</span>
                      </div>
                      {s.email && (
                        <div>
                          <span className="font-semibold text-navy">Email: </span>
                          <span>{s.email}</span>
                        </div>
                      )}
                      {s.experience && (
                        <div>
                          <span className="font-semibold text-navy">Background: </span>
                          <span className="text-muted-foreground">{s.experience}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border">
                      <a
                        href={`tel:${s.phone}`}
                        className="w-full min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-lg bg-navy text-xs font-semibold text-white hover:bg-navy/90"
                      >
                        Call Trainee ({s.phone})
                      </a>
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
                        <th className="py-3 px-4">Trainee Name</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">State</th>
                        <th className="py-3 px-4">Selected Course</th>
                        <th className="py-3 px-4">Background</th>
                        <th className="py-3 px-4">Registered</th>
                        <th className="py-3 px-4 text-right">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {signups.map((s) => (
                        <tr key={s.id} className="hover:bg-sand/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-navy">
                            {s.full_name}
                          </td>
                          <td className="py-3 px-4 text-xs font-medium">
                            {s.phone}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {s.state}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-navy">
                            {s.course_title || "General"}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                            {s.experience || "No prior background specified"}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : "-"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <a
                              href={`tel:${s.phone}`}
                              className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand transition-colors"
                            >
                              Call
                            </a>
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

      {/* Accessible Add / Edit Course Modal using AdminDialog */}
      <AdminDialog
        isOpen={Boolean(editingCourse)}
        onClose={() => setEditingCourse(null)}
        title={isNewCourse ? "Add Vocational Course" : `Edit Course: ${editingCourse?.title ?? ""}`}
        subtitle="Manage course curriculum, tuition pricing, and enrollment capacity."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveCourse} className="space-y-4">
          <div>
            <label htmlFor="courseFormTitle" className="block text-xs font-bold text-navy uppercase mb-1">
              Course Title *
            </label>
            <input
              id="courseFormTitle"
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Solar Installation & Inverter Sizing"
              className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="courseFormDuration" className="block text-xs font-bold text-navy uppercase mb-1">
                Duration
              </label>
              <input
                id="courseFormDuration"
                type="text"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder="4 weeks, Mon-Fri"
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
            <div>
              <label htmlFor="courseFormPrice" className="block text-xs font-bold text-navy uppercase mb-1">
                Course Fee (NGN)
              </label>
              <input
                id="courseFormPrice"
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                placeholder="150000"
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="courseFormStartDate" className="block text-xs font-bold text-navy uppercase mb-1">
                Start Date
              </label>
              <input
                id="courseFormStartDate"
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
            <div>
              <label htmlFor="courseFormSeats" className="block text-xs font-bold text-navy uppercase mb-1">
                Seats Available
              </label>
              <input
                id="courseFormSeats"
                type="number"
                value={formSeatsLeft}
                onChange={(e) => setFormSeatsLeft(Number(e.target.value))}
                placeholder="15"
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="courseFormLearn" className="block text-xs font-bold text-navy uppercase mb-1">
              What Trainees Learn (one item per line)
            </label>
            <textarea
              id="courseFormLearn"
              rows={4}
              value={formLearn}
              onChange={(e) => setFormLearn(e.target.value)}
              placeholder="Sizing a system for a shop or home&#10;Mounting panels safely on roofs&#10;Wiring inverters and lithium batteries&#10;Troubleshooting and diagnostics"
              className="w-full p-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="size-4 rounded border-input text-navy focus:ring-navy"
              />
              <span className="text-sm font-semibold text-navy">Course is active and open for registration</span>
            </label>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingCourse(null)}
              className="min-h-[44px] px-5 py-2.5 rounded-lg border border-input text-sm font-semibold text-navy hover:bg-sand transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCourse}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              {savingCourse ? "Saving..." : "Save Course"}
            </button>
          </div>
        </form>
      </AdminDialog>
    </div>
  );
}
