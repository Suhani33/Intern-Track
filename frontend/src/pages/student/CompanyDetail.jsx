import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExternalLink, MapPin, Clock, IndianRupee, Users } from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function CompanyDetail() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/student/companies/${id}`).then((res) => setCompany(res.data));
  }, [id]);

  if (!company) return <div className="p-10 text-center text-slate-500">Loading company...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Company Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <img
          src={company.logo_url}
          alt={company.name}
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=eef2ff&color=4f46e5&bold=true`;
          }}
          className="w-20 h-20 object-contain rounded-xl border p-2"
        />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 text-sm flex items-center gap-1 hover:underline"
            >
              Website <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-slate-600 mt-2 text-sm">{company.description}</p>
        </div>
      </div>

      {/* Internships List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Available Internship Opportunities</h2>
        {company.internships.map((intern) => (
          <div key={intern.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{intern.title}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${intern.is_paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {intern.is_paid ? "Paid" : "Unpaid"}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{intern.description}</p>
              </div>
              <button
                onClick={() => (user ? navigate(`/apply/${intern.id}`, { state: { intern, company } }) : navigate("/login"))}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 shrink-0"
              >
                Apply Now
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl">
              <div className="flex items-center gap-1.5"><IndianRupee className="w-4 h-4 text-indigo-600" /> <strong>Stipend:</strong> {intern.stipend}</div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-600" /> <strong>Duration:</strong> {intern.duration}</div>
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-600" /> <strong>Mode:</strong> {intern.work_mode}</div>
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-600" /> <strong>Vacancies:</strong> {intern.vacancies} ({intern.applicant_count} applied)</div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <p><strong>Eligibility:</strong> {intern.eligibility}</p>
                <p className="mt-1"><strong>Deadline:</strong> {intern.deadline}</p>
                <p className="mt-1"><strong>Required Skills:</strong> {intern.required_skills.join(", ")}</p>
              </div>
              <div>
                <p><strong>Selection Stages:</strong> {intern.hiring_stages.join(" → ")}</p>
                <p className="mt-1"><strong>Required Documents:</strong> {intern.required_docs.join(", ")}</p>
                {intern.instructions && <p className="mt-1"><strong>Instructions:</strong> {intern.instructions}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}