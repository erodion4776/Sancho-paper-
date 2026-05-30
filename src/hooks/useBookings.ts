import { useState, useEffect } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { Booking } from '../types';

export const useBookings = (userId?: string) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    console.log("Fetching bookings for userId:", userId);
    if (!isSupabaseConfigured()) {
        console.error("Supabase not configured");
        setError("Supabase not configured");
        setLoading(false);
        return;
    }
    if (!userId) {
      console.log("No userId, skipping fetch");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log("Calling supabase...");
      const { data, error } = await getSupabase()
        .from('bookings')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });
      
      console.log("Supabase response:", { data, error });
      
      if (error) {
        throw error;
      } else {
        setBookings(data || []);
      }
    } catch (e: any) {
      console.error("Error fetching bookings:", e);
      setError(e.message || 'An error occurred');
    } finally {
      console.log("Fetch finished");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const createBooking = async (booking: Omit<Booking, 'id' | 'created_at' | 'status' | 'assigned_staff_id' | 'payment_status' | 'payment_reference' | 'amount_paid'>) => {
    const { data, error } = await getSupabase()
      .from('bookings')
      .insert([booking])
      .select();
    
    if (error) throw error;
    await fetchBookings();
    return data;
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    const { data, error } = await getSupabase()
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    await fetchBookings();
    return data;
  };

  return { bookings, loading, error, createBooking, updateBooking };
};
