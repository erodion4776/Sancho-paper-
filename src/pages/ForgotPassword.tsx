import React, { useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSupabaseConfigured()) {
            setError('Supabase is not configured.');
            return;
        }
        setError('');
        setMessage('');

        const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Check your email for the password reset link.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <form onSubmit={handleReset} className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-4 text-2xl font-bold">Forgot Password</h2>
                {error && <p className="mb-4 text-red-500">{error}</p>}
                {message && <p className="mb-4 text-green-500">{message}</p>}
                <input type="email" placeholder="Email" className="w-full p-2 mb-4 border rounded" onChange={(e) => setEmail(e.target.value)} required />
                <button type="submit" className="w-full p-2 text-white bg-blue-600 rounded">Reset Password</button>
            </form>
        </div>
    );
};
