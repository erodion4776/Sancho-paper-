import React from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export const DebugPanel = () => {
  const { user, profile, loading, session } = useAuth();
  
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-0 right-0 p-4 m-4 bg-black text-white rounded shadow-lg text-xs font-mono max-w-xs z-50 overflow-auto max-h-64">
      <h3 className="font-bold border-b border-gray-600 mb-2">Debug Panel</h3>
      <p>Supabase Configured: {isSupabaseConfigured().toString()}</p>
      <p>Loading: {loading.toString()}</p>
      <p>User: {user ? user.id : 'null'}</p>
      <p>Profile: {profile ? JSON.stringify(profile) : 'null'}</p>
      <p>Session: {session ? 'Exists' : 'null'}</p>
    </div>
  );
};
