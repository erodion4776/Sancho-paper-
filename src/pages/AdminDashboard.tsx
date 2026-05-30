import { useState } from "react";
import { useBookings } from "../hooks/useBookings";
import { useAuth } from "../context/AuthContext";

export const AdminDashboard = () => {
  const { signOut, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading, error, updateBooking } = useBookings({ role: "admin", authReady: !authLoading });
  const [staffId, setStaffId] = useState<Record<string, string>>({});

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={signOut}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          Sign Out
        </button>
      </div>

      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="p-4 bg-white rounded shadow">
              <p className="font-medium">{b.service_type}</p>
              <p className="text-sm text-gray-500">{b.location_address}</p>
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
    </div>
  );
};
