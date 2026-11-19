import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      loginUser(res.data.access_token, res.data.user);
      const role = res.data.user.role;
      if (role === "hr") navigate("/hr");
      else if (role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-14 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h1>
      <p className="text-sm text-slate-500 mb-6">Log in to InternTrack to continue</p>

      {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            placeholder="you@college.edu"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>
        <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700">
          Log In
        </button>
      </form>

      <div className="mt-4 flex justify-between text-sm">
        <Link to="/forgot-password" className="text-indigo-600 hover:underline">Forgot password?</Link>
        <Link to="/register" className="text-slate-600 hover:underline">Create account</Link>
      </div>

      <div className="mt-6 pt-4 border-t text-xs text-slate-500 space-y-1">
        <div><strong>Demo HR:</strong> hr@google.com / Admin@123</div>
        <div><strong>Demo Admin:</strong> admin@interntrack.com / Admin@123</div>
      </div>
    </div>
  );
}