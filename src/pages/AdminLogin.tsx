import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
       setError('Supabase is not configured.');
       return;
    }
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await getSupabase().auth.signInWithPassword({ email, password });
    
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Verify admin role
    const { data: profile } = await getSupabase()
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();
    
    if (profile?.role !== 'admin') {
        setError('Unauthorized: Only administrators can access this portal.');
        await getSupabase().auth.signOut();
    } else {
        navigate('/admin');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleAdminLogin} className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="mb-4 text-2xl font-bold">Admin Portal</h2>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <input type="email" placeholder="Admin Email" className="w-full p-2 mb-4 border rounded" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Admin Password" className="w-full p-2 mb-4 border rounded" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="w-full p-2 text-white bg-red-600 rounded" disabled={loading}>
          {loading ? 'Logging in...' : 'Admin Login'}
        </button>
      </form>
    </div>
  );
};
