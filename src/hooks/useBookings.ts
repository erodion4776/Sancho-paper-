import { useState, useEffect } from "react";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import { Booking, UserRole } from "../types";

interface UseBookingsOptions {
  userId?: string;
  role?: UserRole;
}

export const useBookings = (options: UseBookingsOptions = {}) => {
  const { userId, role } = options;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }

    // Clients must have a userId; admins and staff can fetch without one
    if (role === "client" && !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = getSupabase()
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (role === "client" && userId) {
        query = query.eq("client_id", userId);
      } else if (role === "staff" && userId) {
        query = query.eq("assigned_staff_id", userId);
      }
      // admin: no filter — fetch all bookings

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (e: any) {
      console.error("Error fetching bookings:", e);
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [userId, role]);

  const createBooking = async (
    booking: Omit<
      Booking,
      | "id"
      | "created_at"
      | "status"
      | "assigned_staff_id"
      | "payment_status"
      | "payment_reference"
      | "amount_paid"
    >
  ) => {
    const { data, error } = await getSupabase()
      .from("bookings")
      .insert([booking])
      .select();

    if (error) throw error;
    await fetchBookings();
    return data;
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    const { data, error } = await getSupabase()
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;
    await fetchBookings();
    return data;
  };

  return { bookings, loading, error, createBooking, updateBooking, refetch: fetchBookings };
};
