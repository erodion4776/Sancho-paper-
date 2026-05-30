import { useBookings } from "../hooks/useBookings";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, LogOut, Briefcase } from "lucide-react";

export const StaffDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading, error, updateBooking } = useBookings({
    role: "staff",
    userId: user?.id,
    authReady: !authLoading
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    await updateBooking(id, { status: status as any });
  };

  if (authLoading || bookingsLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* SASHIO Staff Header */}
      <header className="bg-slate-900 text-white py-6 px-4 md:px-8 sticky top-0 z-40 shadow-lg border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-md">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-md font-extrabold tracking-tight font-sans uppercase text-white">SASHIO Staff Operations</h1>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-sky-800 text-sky-200 rounded-full border border-sky-700">Crew Gateway</span>
              </div>
              <p className="text-xs text-slate-400">Service Delivery and Job Tracking</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-mono font-medium text-slate-400">
              Active Crew: {user?.email}
            </span>
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
      <main className="flex-grow max-w-4xl w-full mx-auto p-4 md:p-8">

      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings assigned to you yet.</p>
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

              <div className="mt-2 flex gap-2">
                {b.status === "assigned" && (
                  <button
                    onClick={() => handleUpdateStatus(b.id, "in_progress")}
                    className="bg-yellow-600 text-white px-2 py-1 rounded text-sm"
                  >
                    Start Job
                  </button>
                )}
                {b.status === "in_progress" && (
                  <button
                    onClick={() => handleUpdateStatus(b.id, "completed")}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </main>

      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 mt-12">
        <p>© {new Date().getFullYear()} SASHIO Mobile Toilets. Service Delivery and Job Tracking.</p>
      </footer>
    </div>
  );
};
