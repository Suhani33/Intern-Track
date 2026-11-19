import { useEffect, useState } from "react";
import api from "../../api/client";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [companies, setCompanies] = useState([]);

  const loadData = async () => {
    const [s, c] = await Promise.all([api.get("/admin/stats"), api.get("/admin/companies")]);
    setStats(s.data);
    setCompanies(c.data);
  };

  useEffect(() => { loadData(); }, []);

  const toggleVerify = async (id) => {
    await api.post(`/admin/companies/${id}/verify`);
    loadData();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Platform Admin Console</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="bg-white p-5 rounded-2xl border border-slate-200">
            <div className="text-xs uppercase text-slate-400">{k.replace("_", " ")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-lg font-bold mb-4">Company Verification & Management</h2>
        <div className="divide-y">
          {companies.map((c) => (
            <div key={c.id} className="py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-bold">{c.name}</span> <span className="text-xs text-slate-500">({c.internships_count} roles)</span>
              </div>
              <button
                onClick={() => toggleVerify(c.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${c.is_verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
              >
                {c.is_verified ? "Verified (Click to Suspend)" : "Pending (Click to Verify)"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}