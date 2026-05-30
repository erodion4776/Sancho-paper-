import { useBookings } from "../hooks/useBookings";
import { useAuth } from "../context/AuthContext";

export const StaffDashboard = () => {
  const { user, signOut } = useAuth();
  const { bookings, loading, error, updateBooking } = useBookings({
    role: "staff",
    userId: user?.id,
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    await updateBooking(id, { status: status as any });
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
        <button
          onClick={signOut}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          Sign Out
        </button>
      </div>

      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings assigned to you yet.</p>
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
    </div>
  );
};
