import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";

export default function Register() {
  const [step, setStep] = useState("register"); // register | verify
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student",
    college: "",
    branch: "",
    year: "2nd Year",
    phone: "",
    skills: "",
  });
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const res = await api.post("/auth/register", payload);
      setMsg(res.data.message);
      setStep("verify");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/verify-otp", { email: form.email, otp });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "OTP verification failed");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
      {step === "register" ? (
        <>
          <h1 className="text-2xl font-bold mb-1">Create Account</h1>
          <p className="text-sm text-slate-500 mb-6">Register as a Student or Company HR</p>
          {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Account Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="student">Student</option>
                <option value="hr">Company HR</option>
              </select>
            </div>
            <input
              required
              placeholder="Full Name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />

            {form.role === "student" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    placeholder="College Name"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <input
                    required
                    placeholder="Branch (e.g. CSE)"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Year (e.g. 2nd Year)"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <input
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <input
                  placeholder="Skills (comma-separated: Python, React, Java)"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </>
            )}

            <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700">
              Sign Up & Send OTP
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <h2 className="text-xl font-bold">Verify Your Email</h2>
          <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">{msg}</p>
          <p className="text-xs text-slate-500">Check your Flask backend console if SMTP isn't configured yet.</p>
          {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm">{error}</div>}
          <input
            required
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-center tracking-widest text-lg font-bold"
          />
          <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium">
            Verify OTP
          </button>
        </form>
      )}
    </div>
  );
}