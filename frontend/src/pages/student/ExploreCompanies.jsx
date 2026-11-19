import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../../api/client";

export default function ExploreCompanies() {
  const [companies, setCompanies] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchCompanies = async () => {
      const res = await api.get(`/student/companies?q=${encodeURIComponent(query)}`);
      setCompanies(res.data);
    };
    fetchCompanies();
  }, [query]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Explore Companies</h1>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {companies.map((c) => (
          <Link
            key={c.id}
            to={`/company/${c.id}`}
            className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-indigo-500 hover:shadow-md transition"
          >
            <img
              src={c.logo_url}
              alt={c.name}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=eef2ff&color=4f46e5&bold=true`;
              }}
              className="w-14 h-14 object-contain rounded-lg"
            />
            <span className="font-semibold text-slate-800 text-center text-sm">{c.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}