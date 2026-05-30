import { useState, useEffect, useCallback } from "react";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import { Booking, UserRole } from "../types";

interface UseBookingsOptions {
  userId?: string;
  role?: UserRole;
  /** Pass authLoading so the hook waits for auth before fetching */
  authReady?: boolean;
}

export const useBookings = (options: UseBookingsOptions = {}) => {
  const { userId, role, authReady = true } = options;
  const [bookings, setBookings] = useState<Booking[]>([]);
  // Start as false — only go true when we actually fire a request
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase not configured");
      return;
    }
    // For client/staff roles we need a userId
    if ((role === "client" || role === "staff") && !userId) {
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
      // admin: no filter

      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
    } catch (e: any) {
      console.error("Error fetching bookings:", e);
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    // Wait until auth has resolved before fetching
    if (!authReady) return;
    fetchBookings();
  }, [fetchBookings, authReady]);

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
