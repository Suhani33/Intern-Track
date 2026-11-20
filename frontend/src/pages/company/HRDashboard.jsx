import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";

import {
  Briefcase,
  Users,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  Building2,
  Send,
  PlusCircle,
} from "lucide-react";

const BACKEND_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api").replace(/\/api$/, "");

export default function HRDashboard() {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingOfferId, setSendingOfferId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchDashboardData = async () => {
    try {
      const [compRes, internRes, appRes] = await Promise.all([
        api.get("/company/profile"),
        api.get("/company/internships").catch(() => ({ data: [] })),
        api.get("/company/applications").catch(() => ({ data: [] })),
      ]);
      setCompany(compRes.data?.company === null ? null : compRes.data);
      setInternships(internRes.data || []);
      setApplications(appRes.data || []);
    } catch (err) {
      alert("Failed to load HR dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusUpdate = async (appId, newStatus, remarks = "") => {
    try {
      await api.put(`/company/applications/${appId}/status`, {
        status: newStatus,
        remarks,
      });
      alert(`Application marked as ${newStatus}`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  // One-click automated offer letter generation + instant greeting email
  const handleQuickOffer = async (app) => {
    setSendingOfferId(app.id);
    try {
      const res = await api.post(`/company/applications/${app.id}/offer`, {});
      alert(
        res.data?.message ||
          `Offer letter auto-generated & emailed to ${app.student_email}!`
      );
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send offer letter");
    } finally {
      setSendingOfferId(null);
    }
  };

  const filteredApps =
    statusFilter === "ALL"
      ? applications
      : applications.filter((a) => a.status === statusFilter);

  const stats = [
    {
      label: "Active Roles",
      value: internships.length,
      icon: Briefcase,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Total Applicants",
      value: applications.length,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Interviews Scheduled",
      value: applications.filter((a) => a.status === "Interview").length,
      icon: Calendar,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Offers Issued",
      value: applications.filter((a) =>
        ["Selected", "Offer Received", "Offer Accepted"].includes(a.status)
      ).length,
      icon: Award,
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  const badgeStyle = (status) => {
    switch (status) {
      case "Shortlisted":
        return "bg-blue-100 text-blue-700";
      case "Interview":
        return "bg-amber-100 text-amber-800";
      case "Selected":
      case "Offer Received":
      case "Offer Accepted":
        return "bg-emerald-100 text-emerald-700";
      case "Rejected":
      case "Offer Declined":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading HR Recruitment Portal...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">
                {company?.name || "HR Recruitment Dashboard"}
              </h1>
              {company?.is_verified && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Verified Partner
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Review AI-ranked applicants, schedule interviews, and issue instant offer letters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/hr/company")}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Company Profile
          </button>
          <button
            onClick={() => navigate("/hr/post-internship")}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Post Internship
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Applicants Pipeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Candidate Applications (Ranked by AI Match)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click <strong>Schedule Interview</strong> to open the interview planner, or{" "}
              <strong>Send Offer</strong> to auto-generate & email the official offer letter in one click.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["ALL", "Applied", "Shortlisted", "Interview", "Selected", "Rejected"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === tab
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>

        {filteredApps.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No candidate applications found under this filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredApps.map((app) => {
              const isOffered = [
                "Selected",
                "Offer Received",
                "Offer Accepted",
              ].includes(app.status);

              return (
                <div
                  key={app.id}
                  className="p-6 hover:bg-slate-50/70 transition flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Candidate Info */}
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-900">
                        {app.student_name}
                      </h3>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {app.reference_id}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeStyle(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        <Sparkles className="w-3 h-3" /> {app.ai_match_score}% Match
                      </span>
                    </div>

                    <p className="text-sm font-medium text-indigo-600">
                      Applied for: {app.internship_title}
                    </p>

                    <p className="text-xs text-slate-600">
                      {app.student_email}
                      {app.college ? ` â€¢ ${app.college}` : ""}
                      {app.branch ? ` (${app.branch})` : ""}
                      {app.cgpa ? ` â€¢ CGPA: ${app.cgpa}` : ""}
                    </p>

                    {Array.isArray(app.skills) && app.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {app.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {app.resume_path && (
                      <div className="pt-1">
                        <a
  href={`${BACKEND_URL}/uploads/${app.resume_path}`}
  target="_blank"
  rel="noreferrer"
  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
>
                          <FileText className="w-3.5 h-3.5" /> View Uploaded Resume
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {app.status === "Applied" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(
                            app.id,
                            "Shortlisted",
                            "Profile shortlisted by HR."
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Shortlist
                      </button>
                    )}

                    {/* Navigates to dedicated Schedule Interview page */}
                    <button
                      onClick={() =>
                        navigate(`/hr/applications/${app.id}/schedule`)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Schedule Interview
                    </button>

                    {/* One-click automated Offer Letter + Greeting Email */}
                    <button
                      onClick={() => handleQuickOffer(app)}
                      disabled={sendingOfferId === app.id || isOffered}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition ${
                        isOffered
                          ? "bg-emerald-100 text-emerald-700 cursor-default"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sendingOfferId === app.id
                        ? "Sending Offer..."
                        : isOffered
                        ? "Offer Sent"
                        : "Send Offer"}
                    </button>

                    {!isOffered && app.status !== "Rejected" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(
                            app.id,
                            "Rejected",
                            "Thank you for applying. We have moved forward with other candidates."
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

