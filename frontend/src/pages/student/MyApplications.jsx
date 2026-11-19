import { useEffect, useState } from "react";
import api from "../../api/client";

const STATUS_COLORS = {
  Applied: "bg-slate-100 text-slate-700",
  "Under Review": "bg-blue-50 text-blue-700",
  Shortlisted: "bg-indigo-50 text-indigo-700",
  Assessment: "bg-purple-50 text-purple-700",
  Interview: "bg-amber-50 text-amber-700",
  Selected: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-rose-50 text-rose-700",
  Withdrawn: "bg-gray-200 text-gray-600",
};

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadApps = () => api.get("/student/applications").then((res) => setApps(res.data));

  useEffect(() => {
    loadApps();
  }, []);

  const withdraw = async (id) => {
    await api.post(`/student/applications/${id}/withdraw`);
    loadApps();
    setSelected(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold">My Applications</h1>
        {apps.length === 0 && <p className="text-sm text-slate-500">No applications yet. Explore companies to apply!</p>}
        {apps.map((app) => (
          <div
            key={app.id}
            onClick={() => setSelected(app)}
            className={`bg-white p-5 rounded-2xl border cursor-pointer transition ${
              selected?.id === app.id ? "border-indigo-600 shadow-sm" : "border-slate-200 hover:border-indigo-300"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{app.role}</h3>
                <p className="text-sm text-slate-600">{app.company_name}</p>
                <p className="text-xs text-slate-400 mt-1">Ref: {app.reference_id} • Applied: {app.applied_at}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLORS[app.status] || "bg-slate-100"}`}>
                {app.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Individual Application History Drawer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit">
        {selected ? (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">{selected.company_name}</h2>
            <p className="text-sm text-slate-600">{selected.role} ({selected.reference_id})</p>

            {selected.feedback && (
              <div className="bg-amber-50 p-3 rounded-xl text-xs text-amber-900">
                <strong>Company Feedback:</strong> {selected.feedback}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Status Update History</h4>
              <div className="space-y-3 border-l-2 border-indigo-200 pl-3">
                {selected.history.map((h, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="font-semibold text-slate-800">{h.status}</div>
                    <div className="text-slate-600">{h.remarks}</div>
                    <div className="text-[10px] text-slate-400">{h.updated_at}</div>
                  </div>
                ))}
              </div>
            </div>

            {!["Selected", "Rejected", "Withdrawn"].includes(selected.status) && (
              <button
                onClick={() => withdraw(selected.id)}
                className="w-full border border-rose-300 text-rose-600 py-2 rounded-xl text-xs font-medium hover:bg-rose-50"
              >
                Withdraw Application
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-10">Click any application to inspect its full timeline and details.</p>
        )}
      </div>
    </div>
  );
}