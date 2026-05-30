import { useState } from "react";
import { useBookings } from "../hooks/useBookings";
import { useAuth } from "../context/AuthContext";
import { ChangePassword } from "../components/ChangePassword";
import { ShieldCheck, LogOut, KeyRound } from "lucide-react";

export const AdminDashboard = () => {
  const { signOut, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading, error, updateBooking } = useBookings({ role: "admin", authReady: !authLoading });
  const [staffId, setStaffId] = useState<Record<string, string>>({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const handleUpdateStatus = async (id: string, status: string) => {
    await updateBooking(id, { status: status as any });
  };

  const handleAssign = async (id: string) => {
    const sid = staffId[id]?.trim();
    if (!sid) return;
    await updateBooking(id, { status: "assigned", assigned_staff_id: sid });
    setStaffId((prev) => ({ ...prev, [id]: "" }));
  };

  if (authLoading || bookingsLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* SASHIO Admin Header */}
      <header className="bg-slate-900 text-white py-6 px-4 md:px-8 sticky top-0 z-40 shadow-lg border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center border border-slate-700">
              <ShieldCheck className="h-6 w-6 text-slate-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-md font-extrabold tracking-tight font-sans uppercase text-white">SASHIO Admin Center</h1>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700">Root Access</span>
              </div>
              <p className="text-xs text-slate-400">Operations, Staff and Revenue Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-340 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-all"
            >
                <KeyRound className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{showPasswordChange ? 'Hide Security' : 'Change Password'}</span>
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8">
        {showPasswordChange && (
            <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <ChangePassword />
            </div>
        )}

      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="p-4 bg-white rounded shadow">
              <p className="font-medium">{b.service_type}</p>
              <p className="text-sm text-gray-500">{b.location_address}</p>
              {b.latitude && b.longitude && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  View on Map
                </a>
              )}
              <p>
                Status:{" "}
                <span className="font-semibold capitalize">{b.status}</span>
              </p>
              <p>
                Payment:{" "}
                <span className="font-semibold capitalize">
                  {b.payment_status || "pending"}
                </span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {/* Assign to staff */}
                {b.status === "pending" && (
                  <>
                    <input
                      type="text"
                      placeholder="Staff UUID"
                      className="border rounded p-1 text-sm w-64"
                      value={staffId[b.id] || ""}
                      onChange={(e) =>
                        setStaffId((prev) => ({
                          ...prev,
                          [b.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      onClick={() => handleAssign(b.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded text-sm"
                    >
                      Assign
                    </button>
                  </>
                )}

                {b.status !== "completed" && b.status !== "cancelled" && (
                  <button
                    onClick={() => handleUpdateStatus(b.id, "completed")}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                  >
                    Mark Complete
                  </button>
                )}

                {b.status !== "cancelled" && (
                  <button
                    onClick={() => handleUpdateStatus(b.id, "cancelled")}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </main>

      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 mt-12">
        <p>© {new Date().getFullYear()} SASHIO Mobile Toilets. Operations, Staff and Revenue Management.</p>
      </footer>
    </div>
  );
};
