import React, { useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { useAuth } from '../context/AuthContext';

export const ClientDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading, error, createBooking } = useBookings(user?.id, 'client');
  const [serviceType, setServiceType] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createBooking({ client_id: user.id, service_type: serviceType, location_address: location });
    setServiceType('');
    setLocation('');
  };

  console.log("ClientDashboard:", { user, authLoading, bookingsLoading, bookings, error });

  if (authLoading || bookingsLoading) return <div className="p-8">Loading... (Auth: {authLoading ? 'Yes' : 'No'}, Bookings: {bookingsLoading ? 'Yes' : 'No'})</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Client Dashboard</h1>
      
      <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow mb-8">
        <h2 className="text-lg font-semibold mb-2">Book a Service</h2>
        <input type="text" placeholder="Service Type" className="w-full p-2 mb-2 border rounded" value={serviceType} onChange={(e) => setServiceType(e.target.value)} required />
        <input type="text" placeholder="Location Address" className="w-full p-2 mb-2 border rounded" value={location} onChange={(e) => setLocation(e.target.value)} required />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">Book Now</button>
      </form>

      <h2 className="text-xl font-semibold mb-4">My Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.id} className="p-4 bg-white rounded shadow">
              <p>Service: {b.service_type}</p>
              <p>Status: {b.status}</p>
              <p>Payment: {b.payment_status || 'pending'}</p>
              {b.status === 'pending' && b.payment_status !== 'paid' && (
                  <button 
                      onClick={async () => {
                          const res = await fetch('/api/create-payment', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ bookingId: b.id, amount: 5000, email: user?.email })
                          });
                          const data = await res.json();
                          if (data.authorization_url) window.location.href = data.authorization_url;
                      }}
                      className="bg-green-600 text-white p-1 rounded mt-2"
                  >
                      Pay Now
                  </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
