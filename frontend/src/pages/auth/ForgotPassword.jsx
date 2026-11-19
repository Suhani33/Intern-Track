import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const requestOtp = async (e) => {
    e.preventDefault();
    await api.post("/auth/forgot-password", { email });
    setStep(2);
  };

  const resetPw = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/reset-password", { email, otp, new_password: newPassword });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-14 bg-white p-8 rounded-2xl border border-slate-200">
      <h1 className="text-xl font-bold mb-4">Reset Password</h1>
      {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-3">{error}</div>}
      {step === 1 ? (
        <form onSubmit={requestOtp} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Enter registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg">Send Reset OTP</button>
        </form>
      ) : (
        <form onSubmit={resetPw} className="space-y-4">
          <input
            required
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <input
            type="password"
            required
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg">Update Password</button>
        </form>
      )}
    </div>
  );
}