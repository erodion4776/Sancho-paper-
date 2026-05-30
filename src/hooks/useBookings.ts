import { useState, useEffect } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { Booking } from '../types';

export const useBookings = (userId?: string, role?: 'client' | 'staff' | 'admin') => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!isSupabaseConfigured()) {
        setError("Supabase not configured");
        setLoading(false);
        return;
    }
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let query = getSupabase().from('bookings').select('*');
      
      if (role === 'staff') {
        query = query.eq('assigned_staff_id', userId);
      } else if (role !== 'admin') {
        query = query.eq('client_id', userId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      } else {
        setBookings(data || []);
      }
    } catch (e: any) {
      console.error("Error fetching bookings:", e);
      setError(e.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [userId, role]);

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
