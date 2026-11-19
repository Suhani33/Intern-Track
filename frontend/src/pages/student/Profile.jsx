import { useEffect, useState } from "react";
import api from "../../api/client";

export default function Profile() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/auth/profile").then((res) => setForm({ ...res.data, skills: res.data.skills.join(", ") }));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await api.put("/auth/profile", {
      ...form,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!form) return null;

  return (
    <div className="max-w-xl mx-auto my-8 bg-white p-8 rounded-2xl border border-slate-200">
      <h1 className="text-xl font-bold mb-4">Student Profile</h1>
      {saved && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm mb-4">Profile updated!</div>}
      <form onSubmit={handleSave} className="space-y-3 text-sm">
        <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full Name" className="w-full border rounded-lg px-3 py-2" />
        <input disabled value={form.email} className="w-full border rounded-lg px-3 py-2 bg-slate-100" />
        <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="College" className="w-full border rounded-lg px-3 py-2" />
        <div className="grid grid-cols-2 gap-3">
          <input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="Branch" className="border rounded-lg px-3 py-2" />
          <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="Year" className="border rounded-lg px-3 py-2" />
        </div>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full border rounded-lg px-3 py-2" />
        <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Skills (comma separated)" className="w-full border rounded-lg px-3 py-2" />
        <button className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium">Save Profile</button>
      </form>
    </div>
  );
}