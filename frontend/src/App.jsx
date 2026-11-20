import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ExploreCompanies from "./pages/student/ExploreCompanies";
import CompanyDetail from "./pages/student/CompanyDetail";
import ApplyForm from "./pages/student/ApplyForm";
import MyApplications from "./pages/student/MyApplications";
import Interviews from "./pages/student/Interviews";
import Offers from "./pages/student/Offers";
import Profile from "./pages/student/Profile";
import HRDashboard from "./pages/company/HRDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ScheduleInterview from "./pages/company/ScheduleInterview";
import CompanyProfile from "./pages/company/ComapanyProfile";
import PostInternship from "./pages/company/PostInternship";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Navbar />
          <Routes>
            <Route path="/" element={<ExploreCompanies />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/company/:id" element={<CompanyDetail />} />
            <Route path="/apply/:internshipId" element={<ApplyForm />} />
            <Route path="/applications" element={<MyApplications />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/hr/applications/:appId/schedule" element={<ScheduleInterview />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/hr" element={<HRDashboard />} />
<Route path="/hr/company" element={<CompanyProfile />} />
<Route path="/hr/post-internship" element={<PostInternship />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}