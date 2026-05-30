import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

export const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role: "client", // always register as client; admin assigns staff role
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      navigate("/client/login");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleRegister}
        className="p-8 bg-white rounded shadow-md w-96"
      >
        <h2 className="mb-4 text-2xl font-bold">Create Account</h2>
        {error && <p className="mb-4 text-red-500">{error}</p>}

        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Phone"
          className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          minLength={6}
          className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full p-2 text-white bg-blue-600 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <div className="mt-4 text-sm text-center">
          <Link to="/client/login" className="text-blue-600 hover:underline">
            Already have an account? Login
          </Link>
        </div>
      </form>
    </div>
  );
};
