import React from 'react';
import { useAuth } from '../context/AuthContext';

export const DebugPanel = () => {
  const { user, profile, loading, session } = useAuth();
  
  // Only show the debug panel in development mode
  if (import.meta.env.PROD) {
    return null;
  }
  
  return (
    <div className="fixed bottom-16 right-4 p-4 bg-red-600 text-white rounded-xl shadow-2xl text-xs font-mono max-w-xs z-50 overflow-auto max-h-64 border border-red-500/30">
      <h3 className="font-bold border-b border-white/20 pb-1 mb-2">DEBUG PANEL</h3>
      <p>Loading: {loading.toString()}</p>
      <p>User OK: {!!user ? 'Yes' : 'No'}</p>
      <p>Profile OK: {!!profile ? 'Yes' : 'No'}</p>
      <p>Session OK: {!!session ? 'Yes' : 'No'}</p>
      <p>Role: {profile?.role || 'null'}</p>
    </div>
  );
};

