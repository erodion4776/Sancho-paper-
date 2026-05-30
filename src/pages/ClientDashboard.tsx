import React, { useState } from "react";
import { useBookings } from "../hooks/useBookings";
import { useAuth } from "../context/AuthContext";
import { MapComponent } from "../components/MapComponent";
import { AddressAutocomplete } from "../components/AddressAutocomplete";

export const ClientDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();

  const { bookings, loading: bookingsLoading, error, createBooking } =
    useBookings({
      role: "client",
      userId: user?.id,
      authReady: !authLoading, // don't fetch until auth has resolved
    });

  const [serviceType, setServiceType] = useState("");
  const [location, setLocation] = useState<{address: string, lat: number, lng: number} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Show loading only while auth OR an active bookings fetch is in progress
  if (authLoading || bookingsLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !location) return;
    setSubmitting(true);
    try {
      await createBooking({
        client_id: user.id,
        service_type: serviceType,
        location_address: location.address,
        latitude: location.lat,
        longitude: location.lng,
      });
      setServiceType("");
      setLocation(null);
    } catch (e: any) {
      alert("Failed to create booking: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async (bookingId: string) => {
    if (!user?.email) return;
    setPayingId(bookingId);
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, amount: 5000, email: user.email }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert("Payment error: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Payment failed: " + e.message);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <button
          onClick={signOut}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          Sign Out
        </button>
      </div>

      {/* Booking form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow mb-8">
        <h2 className="text-lg font-semibold mb-3">Book a Service</h2>
        <input
          type="text"
          placeholder="Service Type"
          className="w-full p-2 mb-3 border rounded"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          required
        />
        <label className="block mb-1 text-sm font-medium">Select Location</label>
        <div className="mb-3">
          <AddressAutocomplete 
            onPlaceSelect={(address, lat, lng) => setLocation({address, lat, lng})} 
          />
        </div>
        
        {location && (
          <div className="mb-4">
            <MapComponent 
              center={{ lat: location.lat, lng: location.lng }}
              markerPosition={{ lat: location.lat, lng: location.lng }}
            />
          </div>
        )}
        
        <button
          type="submit"
          disabled={submitting || !location}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Booking..." : "Book Now"}
        </button>
      </form>

      {/* Booking list */}
      <h2 className="text-xl font-semibold mb-4">My Bookings</h2>
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
              {b.payment_status !== "paid" && (
                <button
                  onClick={() => handlePay(b.id)}
                  disabled={payingId === b.id}
                  className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                  {payingId === b.id ? "Redirecting..." : "Pay Now"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
