import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { Booking } from '../types';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await getSupabase()
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      setError(error.message);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const createBooking = async (booking: Omit<Booking, 'id' | 'created_at' | 'status' | 'assigned_staff_id'>) => {
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
