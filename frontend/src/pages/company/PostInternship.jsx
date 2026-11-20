import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { Briefcase, ArrowLeft, PlusCircle } from "lucide-react";

export default function PostInternship() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    is_paid: true,
    stipend: "₹25,000 / month",
    duration: "3 Months",
    work_mode: "Hybrid",
    eligibility: "B.E / B.Tech CSE, ISE, ECE (2nd/3rd Year, CGPA >= 7.5)",
    required_skills: "Python, React, SQL, Git",
    deadline: "",
    vacancies: 2,
    hiring_stages: "Resume Screening, Technical Interview, HR Round",
    required_docs: "Resume, College ID Card",
    instructions: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        stipend: form.is_paid ? form.stipend : "Unpaid",
        vacancies: Number(form.vacancies) || 1,
        required_skills: form.required_skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        hiring_stages: form.hiring_stages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        required_docs: form.required_docs
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const res = await api.post("/company/internships", payload);
      alert(res.data?.message || "Internship published successfully!");
      navigate("/hr");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to publish internship";
      alert(msg);
      if (msg.toLowerCase().includes("company profile")) {
        navigate("/hr/company");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate("/hr")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to HR Dashboard
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-indigo-600 text-white">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Post New Internship
            </h1>
            <p className="text-xs text-slate-500">
              Publish a role to match with qualified student candidates
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Internship Role Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Full Stack Software Engineering Intern"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Role Description & Responsibilities *
            </label>
            <textarea
              rows={4}
              required
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Outline key responsibilities, tech stack, and learning outcomes..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Work Mode *
              </label>
              <select
                value={form.work_mode}
                onChange={(e) =>
                  setForm({ ...form, work_mode: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Duration *
              </label>
              <input
                type="text"
                required
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 3 Months"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Vacancies *
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.vacancies}
                onChange={(e) =>
                  setForm({ ...form, vacancies: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
                <input
                  type="checkbox"
                  checked={form.is_paid}
                  onChange={(e) =>
                    setForm({ ...form, is_paid: e.target.checked })
                  }
                  className="rounded text-indigo-600"
                />
                Paid Internship (Stipend)
              </label>
              <input
                type="text"
                disabled={!form.is_paid}
                value={form.is_paid ? form.stipend : "Unpaid"}
                onChange={(e) => setForm({ ...form, stipend: e.target.value })}
                placeholder="e.g. ₹25,000 / month"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Application Deadline *
              </label>
              <input
                type="date"
                required
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Eligibility Criteria *
            </label>
            <input
              type="text"
              required
              value={form.eligibility}
              onChange={(e) =>
                setForm({ ...form, eligibility: e.target.value })
              }
              placeholder="e.g. B.E / B.Tech CSE, CGPA >= 7.5"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Required Skills (comma-separated for AI matching)
            </label>
            <input
              type="text"
              value={form.required_skills}
              onChange={(e) =>
                setForm({ ...form, required_skills: e.target.value })
              }
              placeholder="Python, React, SQL, Machine Learning"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Hiring Stages (comma-separated)
              </label>
              <input
                type="text"
                value={form.hiring_stages}
                onChange={(e) =>
                  setForm({ ...form, hiring_stages: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Required Documents (comma-separated)
              </label>
              <input
                type="text"
                value={form.required_docs}
                onChange={(e) =>
                  setForm({ ...form, required_docs: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Additional Instructions (optional)
            </label>
            <textarea
              rows={2}
              value={form.instructions}
              onChange={(e) =>
                setForm({ ...form, instructions: e.target.value })
              }
              placeholder="Any portfolio links, GitHub requirements, or assessment notes..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/hr")}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm disabled:opacity-60"
            >
              <PlusCircle className="w-4 h-4" />
              {submitting ? "Publishing..." : "Publish Internship"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}