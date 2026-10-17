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

export function AdminTraining() {
  const [activeTab, setActiveTab] = useState<"courses" | "signups">("courses");
  const [courses, setCourses] = useState<any[]>([]);
  const [signups, setSignups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
    try {
      const [coursesData, signupsData] = await Promise.all([
        listAdminCoursesFn(),
        listAdminTrainingSignupsFn(),
      ]);
      setCourses(coursesData || []);
      setSignups(signupsData || []);
    } catch (err) {
      console.error("Error loading training data:", err);
    } finally {
      setLoading(false);
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
    } catch (err: any) {
      alert("Failed to save course: " + err.message);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleToggleActive = async (c: any) => {
    const nextVal = !c.active;
    try {
      await updateCourseFn({ data: { id: c.id, active: nextVal } });
      setCourses(courses.map((item) => (item.id === c.id ? { ...item, active: nextVal } : item)));
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!confirm(`Delete course ${title}?`)) return;
    try {
      await deleteCourseFn({ data: { id } });
      setCourses(courses.filter((c) => c.id !== id));
    } catch (err: any) {
      alert("Failed to delete course: " + err.message);
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
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Vocational Training & Capacity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage solar and POS business training cohorts, syllabus modules, and trainee registrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "courses" ? (
            <button
              type="button"
              onClick={openAddCourseModal}
              className="h-10 px-4 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Add Course
            </button>
          ) : (
            <button
              type="button"
              onClick={exportSignupsCSV}
              className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-semibold text-navy hover:bg-sand transition-colors"
            >
              Export Signups CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("courses")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "courses"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Courses ({courses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("signups")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "signups"
              ? "border-navy text-navy"
              : "border-transparent text-muted-foreground hover:text-navy"
          }`}
        >
          Trainee Registrations ({signups.length})
        </button>
      </div>

      {activeTab === "courses" ? (
        /* Courses Table */
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Fee</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Seats Left</th>
                  <th className="py-3 px-4">Publication</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      {loading ? "Loading courses..." : "No vocational courses registered."}
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-sand/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-navy">
                        {course.title}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {course.duration}
                      </td>
                      <td className="py-3 px-4 font-bold text-navy">
                        {formatNaira(course.price)}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {course.start_date ? new Date(course.start_date).toLocaleDateString() : "Rolling"}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-amber-800">
                        {course.seats_left} seats
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(course)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            course.active
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {course.active ? "Active (Open)" : "Draft (Closed)"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditCourseModal(course)}
                          className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(course.id, course.title)}
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
      ) : (
        /* Signups Table */
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/60 text-xs font-bold text-navy uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-4">Trainee</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Education & Background</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {signups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No training signups recorded yet.
                    </td>
                  </tr>
                ) : (
                  signups.map((s) => (
                    <tr key={s.id} className="hover:bg-sand/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-navy">
                        {s.full_name}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div>{s.phone}</div>
                        <a href={`tel:${s.phone}`} className="text-navy font-semibold hover:underline">
                          Call
                        </a>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {s.state}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-navy">
                        {s.course_title}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div>{s.education || "Not specified"}</div>
                        <div className="text-muted-foreground">{s.experience || "No prior experience"}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-right text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl border border-border shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-navy">
                  {isNewCourse ? "Create Vocational Course" : `Edit Course: ${editingCourse.title}`}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set program dates, available capacity, and curriculum focus points.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold text-navy hover:bg-sand"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Solar Installation & Inverter Sizing"
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Duration</label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="4 weeks, Mon-Fri"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Course Fee (NGN)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    placeholder="150000"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Seats Available</label>
                  <input
                    type="number"
                    value={formSeatsLeft}
                    onChange={(e) => setFormSeatsLeft(Number(e.target.value))}
                    placeholder="15"
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase mb-1">
                  What Trainees Learn (one item per line)
                </label>
                <textarea
                  rows={4}
                  value={formLearn}
                  onChange={(e) => setFormLearn(e.target.value)}
                  placeholder="Sizing a system for a shop or home&#10;Mounting panels safely on roofs&#10;Wiring inverters and lithium batteries&#10;Troubleshooting and diagnostics"
                  className="w-full p-2.5 text-sm rounded-md border border-input bg-background focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded border-input text-navy focus:ring-navy"
                  />
                  <span className="text-sm font-semibold text-navy">Course is active and open for registration</span>
                </label>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-md border border-input text-sm font-semibold text-navy hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="px-4 py-2 rounded-md bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
                >
                  {savingCourse ? "Saving..." : "Save Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
