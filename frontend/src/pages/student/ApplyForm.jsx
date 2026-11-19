import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import api from "../../api/client";

export default function ApplyForm() {
  const { internshipId } = useParams();
  const { state } = useLocation();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState("");
  const [whyHire, setWhyHire] = useState("");
  const [resume, setResume] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/auth/profile").then((res) => setProfile(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) return setError("Please confirm all details before submitting.");
    if (!resume) return setError("Resume PDF upload is mandatory.");

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("answers", JSON.stringify({ projects_and_achievements: projects, why_hire_you: whyHire }));

    try {
      const res = await api.post(`/student/internships/${internshipId}/apply`, formData);
      setSubmittedRef(res.data.reference_id);
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed");
    }
  };

  if (submittedRef) {
    return (
      <div className="max-w-lg mx-auto mt-14 bg-white p-8 rounded-2xl border border-emerald-200 text-center space-y-4">
        <div className="text-emerald-600 font-bold text-xl">Application Submitted Successfully!</div>
        <p className="text-sm text-slate-600">A confirmation email has been sent to your registered email.</p>
        <div className="bg-slate-100 py-3 px-4 rounded-xl font-mono text-lg font-bold text-slate-900">
          Reference ID: {submittedRef}
        </div>
        <Link to="/applications" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
          Go to My Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 bg-white p-8 rounded-2xl border border-slate-200">
      <h1 className="text-xl font-bold mb-1">
        Apply for {state?.intern?.title || "Internship"} {state?.company?.name ? `at ${state.company.name}` : ""}
      </h1>
      <p className="text-xs text-slate-500 mb-6">Personal and educational details are pre-filled from your profile.</p>

      {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

      {profile && (
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl text-xs mb-6">
          <div><strong>Name:</strong> {profile.full_name}</div>
          <div><strong>Email:</strong> {profile.email}</div>
          <div><strong>College:</strong> {profile.college}</div>
          <div><strong>Branch & Year:</strong> {profile.branch} ({profile.year})</div>
          <div className="col-span-2"><strong>Skills:</strong> {profile.skills?.join(", ")}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Projects & Achievements</label>
          <textarea
            rows={3}
            required
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
            placeholder="Highlight key projects, hackathons, or GitHub links..."
            className="w-full border border-slate-300 rounded-lg p-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Why should we select you for this role?</label>
          <textarea
            rows={3}
            required
            value={whyHire}
            onChange={(e) => setWhyHire(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Upload Resume (PDF Mandatory)</label>
          <input
            type="file"
            accept=".pdf"
            required
            onChange={(e) => setResume(e.target.files[0])}
            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 pt-2">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          I confirm that all information and uploaded documents are accurate.
        </label>

        <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700">
          Submit Final Application
        </button>
      </form>
    </div>
  );
}