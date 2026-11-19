import { useEffect, useState } from "react";
import api from "../../api/client";

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    api.get("/student/interviews").then((res) => setInterviews(res.data));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Interview Schedule</h1>
      {interviews.length === 0 ? (
        <p className="text-sm text-slate-500">No interviews scheduled yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {interviews.map((iv) => (
            <div key={iv.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="font-bold text-slate-900">{iv.company_name} — {iv.role}</span>
                <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">{iv.status}</span>
              </div>
              <div className="text-sm font-medium text-indigo-600">{iv.round_name}</div>
              <div className="text-xs text-slate-600"><strong>Date & Time:</strong> {iv.scheduled_at}</div>
              <div className="text-xs text-slate-600"><strong>Venue / Link:</strong> {iv.meeting_link_or_venue}</div>
              {iv.instructions && <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg">{iv.instructions}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}