import { useBookings } from '../hooks/useBookings';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { bookings, loading, updateBooking } = useBookings(user?.id, 'admin');

  const handleUpdateStatus = async (id: string, status: string) => {
    await updateBooking(id, { status: status as any });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="space-y-4">
        {bookings.map(b => (
          <div key={b.id} className="p-4 bg-white rounded shadow">
            <p>Service: {b.service_type}</p>
            <p>Status: {b.status}</p>
            <button onClick={() => handleUpdateStatus(b.id, 'assigned')} className="bg-green-600 text-white p-1 rounded mt-2">Assign</button>
            <button onClick={() => handleUpdateStatus(b.id, 'completed')} className="bg-blue-600 text-white p-1 rounded mt-2 ml-2">Complete</button>
          </div>
        ))}
      </div>
    </div>
  );
};
