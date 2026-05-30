import React from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export const DebugPanel = () => {
  const { user, profile, loading, session } = useAuth();
  
  return (
    <div className="fixed bottom-0 right-0 p-4 m-4 bg-red-600 text-white rounded shadow-lg text-xs font-mono max-w-xs z-50 overflow-auto max-h-64">
      <h3 className="font-bold border-b border-gray-100 mb-2">DEBUG PANEL (Always Visible)</h3>
      <p>Supabase Configured: {isSupabaseConfigured().toString()}</p>
      <p>Loading: {loading.toString()}</p>
      <p>User: {user ? user.id : 'null'}</p>
      <p>Profile: {profile ? JSON.stringify(profile) : 'null'}</p>
      <p>Session: {session ? 'Exists' : 'null'}</p>
    </div>
  );
};
