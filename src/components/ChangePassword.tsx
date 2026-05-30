import React, { useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
        setError('Supabase not configured');
        return;
    }
    setLoading(true);
    setMessage('');
    setError('');

    const { error: updateError } = await getSupabase().auth.updateUser({ password: newPassword });

    if (updateError) {
        setError(updateError.message);
    } else {
        setMessage('Password updated successfully!');
        setNewPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-bold mb-4">Change Admin Password</h3>
         {error && <p className="mb-2 text-red-500">{error}</p>}
         {message && <p className="mb-2 text-green-500">{message}</p>}
         <form onSubmit={handleChangePassword}>
             <input type="password" placeholder="New Password" className="w-full p-2 mb-4 border rounded" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
             <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded" disabled={loading}>
                 {loading ? 'Updating...' : 'Update Password'}
             </button>
         </form>
    </div>
  );
};
