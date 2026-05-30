import { useBookings } from '../hooks/useBookings';
import { useAuth } from '../context/AuthContext';

export const StaffDashboard = () => {
  const { bookings, loading, updateBooking } = useBookings();
  const { user } = useAuth();

  const assignedBookings = bookings.filter(b => b.assigned_staff_id === user?.id);

  const handleUpdateStatus = async (id: string, status: string) => {
    await updateBooking(id, { status: status as any });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Staff Dashboard</h1>
      <div className="space-y-4">
        {assignedBookings.map(b => (
          <div key={b.id} className="p-4 bg-white rounded shadow">
            <p>Service: {b.service_type}</p>
            <p>Status: {b.status}</p>
            {b.status === 'assigned' && <button onClick={() => handleUpdateStatus(b.id, 'in_progress')} className="bg-yellow-600 text-white p-1 rounded mt-2">Start</button>}
            {b.status === 'in_progress' && <button onClick={() => handleUpdateStatus(b.id, 'completed')} className="bg-blue-600 text-white p-1 rounded mt-2">Complete</button>}
          </div>
        ))}
      </div>
    </div>
  );
};
