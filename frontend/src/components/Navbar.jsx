import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Briefcase, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [openBell, setOpenBell] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/student/notifications");
      setNotifications(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const markRead = async (id) => {
    await api.post(`/student/notifications/${id}/read`);
    loadNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <Briefcase className="w-6 h-6" />
          <span>InternTrack</span>
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium text-slate-700">
          {(!user || user.role === "student") && (
            <>
              <Link to="/" className="hover:text-indigo-600">Explore Companies</Link>
              {user && (
                <>
                  <Link to="/applications" className="hover:text-indigo-600">My Applications</Link>
                  <Link to="/interviews" className="hover:text-indigo-600">Interviews</Link>
                  <Link to="/offers" className="hover:text-indigo-600">Offers & Joining</Link>
                  <Link to="/profile" className="hover:text-indigo-600 flex items-center gap-1">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                </>
              )}
            </>
          )}

          {user?.role === "hr" && (
            <Link to="/hr" className="hover:text-indigo-600">Company HR Portal</Link>
          )}

          {user?.role === "admin" && (
            <Link to="/admin" className="hover:text-indigo-600">Platform Admin</Link>
          )}

          {user ? (
            <div className="flex items-center gap-4 relative">
              <button
                onClick={() => setOpenBell(!openBell)}
                className="relative p-2 rounded-full hover:bg-slate-100"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {openBell && (
                <div className="absolute right-12 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 max-h-96 overflow-y-auto">
                  <div className="font-semibold text-slate-800 pb-2 border-b">Notifications</div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`p-2.5 my-1 rounded-lg cursor-pointer text-xs ${
                          n.is_read ? "bg-slate-50 text-slate-600" : "bg-indigo-50 text-slate-900 font-medium"
                        }`}
                      >
                        <div className="font-semibold">{n.title}</div>
                        <div className="mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{n.created_at}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-700"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-slate-700 hover:text-indigo-600">Login</Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}