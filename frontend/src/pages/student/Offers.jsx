import { useEffect, useState } from "react";
import api from "../../api/client";

export default function Offers() {
  const [offers, setOffers] = useState([]);

  const loadOffers = () => api.get("/student/offers").then((res) => setOffers(res.data));
  useEffect(() => { loadOffers(); }, []);

  const respond = async (id, decision) => {
    await api.post(`/student/offers/${id}/respond`, { decision });
    loadOffers();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Offers & Joining</h1>
      {offers.length === 0 ? (
        <p className="text-sm text-slate-500">No offers received yet.</p>
      ) : (
        offers.map((o) => (
          <div key={o.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{o.company_name} — {o.role}</h3>
                <p className="text-xs text-slate-500">Stipend: {o.stipend} • Duration: {o.duration}</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold">{o.status}</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl">
              <div><strong>Acceptance Deadline:</strong> {o.acceptance_deadline}</div>
              <div><strong>Joining Date:</strong> {o.joining_date}</div>
              <div className="sm:col-span-2"><strong>Required Joining Documents:</strong> {o.joining_docs.join(", ")}</div>
              {o.joining_instructions && <div className="sm:col-span-2"><strong>Joining Instructions:</strong> {o.joining_instructions}</div>}
            </div>

            {o.status === "Offer Received" && (
              <div className="flex gap-3">
                <button onClick={() => respond(o.id, "accept")} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-medium">
                  Accept Offer
                </button>
                <button onClick={() => respond(o.id, "decline")} className="border border-rose-300 text-rose-600 px-5 py-2 rounded-xl text-sm font-medium">
                  Decline Offer
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}