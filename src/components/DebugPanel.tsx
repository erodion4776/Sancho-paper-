import React from 'react';
import { useAuth } from '../context/AuthContext';

export const DebugPanel = () => {
  const { user, profile, loading, session } = useAuth();
  
  return (
    <div className="fixed bottom-0 right-0 p-4 m-4 bg-red-600 text-white rounded shadow-lg text-xs font-mono max-w-xs z-50 overflow-auto max-h-64">
      <h3 className="font-bold border-b border-gray-100 mb-2">DEBUG PANEL</h3>
      <p>Loading: {loading.toString()}</p>
      <p>User OK: {!!user ? 'Yes' : 'No'}</p>
      <p>Profile OK: {!!profile ? 'Yes' : 'No'}</p>
      <p>Session OK: {!!session ? 'Yes' : 'No'}</p>
      <p>Role: {profile?.role || 'null'}</p>
    </div>
  );
};
