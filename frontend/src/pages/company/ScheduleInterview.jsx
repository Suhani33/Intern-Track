import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/client";
import { ArrowLeft, Calendar, Clock, Video, FileText, Send, UserCheck } from "lucide-react";

export default function ScheduleInterview() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    round_name: "Technical Interview",
    scheduled_at: "",
    meeting_link_or_venue: "https://meet.google.com/new",
    response_deadline: "",
    instructions: "Please join 5 minutes early with a stable internet connection, valid college ID, and your project portfolio ready.",
  });

  useEffect(() => {
    api.get("/company/applications")
      .then((res) => {
        const match = (res.data || []).find((a) => String(a.id) === String(appId));
        setApplicant(match || null);
      })
      .catch(() => alert("Could not load candidate details"));
  }, [appId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/company/applications/${appId}/interview`, form);
      alert("Interview scheduled & invitation email sent!");
      navigate("/hr/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to schedule interview");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/hr/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to HR Dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Schedule Candidate Interview</h1>
              <p className="text-indigo-100 text-sm">
                Configure interview round details and trigger an automated email invitation
              </p>
            </div>
          </div>
        </div>

        {applicant && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-semibold text-slate-900">{applicant.student_name}</p>
                <p className="text-xs text-slate-500">
                  {applicant.student_email} â€¢ {applicant.internship_title} ({applicant.reference_id})
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
              AI Match: {applicant.ai_match_score}%
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Interview Round
              </label>
              <select
                value={form.round_name}
                onChange={(e) => setForm({ ...form, round_name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              >
                <option value="Resume & Portfolio Screening">Resume & Portfolio Screening</option>
                <option value="Technical Interview - Round 1">Technical Interview - Round 1</option>
                <option value="Technical Interview - Round 2">Technical Interview - Round 2</option>
                <option value="System Design / Coding Round">System Design / Coding Round</option>
                <option value="HR & Culture Fit Round">HR & Culture Fit Round</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date & Time
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-600" /> Meeting Link or Office Venue
              </label>
              <input
                type="text"
                placeholder="https://meet.google.com/xxx-xxxx-xxx or Office Address"
                value={form.meeting_link_or_venue}
                onChange={(e) => setForm({ ...form, meeting_link_or_venue: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> Confirmation Response Deadline
              </label>
              <input
                type="date"
                value={form.response_deadline}
                onChange={(e) => setForm({ ...form, response_deadline: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" /> Candidate Instructions
            </label>
            <textarea
              rows={3}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Include ID requirements, coding environment setup, or panel details..."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              to="/hr/dashboard"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Sending Invitation..." : "Confirm & Email Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

