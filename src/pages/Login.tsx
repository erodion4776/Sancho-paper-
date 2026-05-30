import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Zap, RefreshCw, Smartphone } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading: authLoading } = useAuth();

  // Deduce active portal based on current pathname (client | staff | admin)
  const pathname = location.pathname.toLowerCase();
  const portalType = pathname.includes('/admin') 
    ? 'admin' 
    : pathname.includes('/staff') 
      ? 'staff' 
      : 'client';

  // Dedicated portal configurations for premium design variation
  const portalStyles = {
    client: {
      title: "Client Portal",
      subtitle: "Secure scheduling, live maps, & instant invoice processing.",
      themeColor: "bg-brand-600 hover:bg-brand-700",
      accentBg: "from-brand-900 to-indigo-900",
      iconColor: "text-brand-400",
      accentText: "text-brand-500"
    },
    staff: {
      title: "Staff Dispatch",
      subtitle: "Review assigned site bookings, update status, & log tasks.",
      themeColor: "bg-amber-600 hover:bg-amber-700",
      accentBg: "from-amber-950 to-orange-900",
      iconColor: "text-amber-400",
      accentText: "text-amber-500"
    },
    admin: {
      title: "Admin Command",
      subtitle: "Global operations coordinator, staff accounts, & database rules.",
      themeColor: "bg-slate-800 hover:bg-black",
      accentBg: "from-slate-900 to-slate-950",
      iconColor: "text-slate-300",
      accentText: "text-slate-400"
    }
  };

  const activePortal = portalStyles[portalType];

  // Auto-redirect if a user is already authenticated
  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (profile.role === 'staff') {
        navigate('/staff/dashboard', { replace: true });
      } else {
        navigate('/client/dashboard', { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
       setError('Supabase credentials not configured in the workspace.');
       return;
    }
    setLoading(true);
    setError('');

    try {
      const { data, error: loginError } = await getSupabase().auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (loginError) {
        setError(loginError.message);
        setLoading(false);
      } else {
        // Successful login, wait briefly for auth observer to sync and navigate.
        // Route Redirection helper '/' will route correctly based on authenticated database profile role
        setTimeout(() => {
          navigate('/');
        }, 300);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mb-4" />
        <p className="text-xs text-slate-400">Verifying secure active profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-12 bg-slate-50 font-sans">
      
      {/* Brand Sidebar Container (Visible on medium screens and up) */}
      <div className={`hidden md:flex md:col-span-5 bg-gradient-to-br ${activePortal.accentBg} text-white p-12 flex-col justify-between relative overflow-hidden`}>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
            <ShieldCheck className={`h-6 w-6 ${activePortal.iconColor}`} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">ApexOps Commercial</h1>
            <p className="text-[10px] text-white/60 tracking-wider">Suite v4.2</p>
          </div>
        </div>

        <div className="space-y-4 relative z-10 max-w-sm">
          <span className="text-xs uppercase tracking-widest font-mono text-white/50 bg-white/10 px-3 py-1 rounded-full border border-white/5">
            Verified Authentication
          </span>
          <h2 className="text-3xl font-black tracking-tight leading-none text-white font-sans">
            ApexOps {activePortal.title}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {activePortal.subtitle}
          </p>
        </div>

        <div className="text-xs text-white/40 tracking-tight font-mono relative z-10">
          Secure Key Node: SSL-256 Enabled
        </div>
      </div>

      {/* Form Area Container */}
      <div className="col-span-12 md:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile Brand Header */}
          <div className="md:hidden flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-brand-400" />
            </div>
            <div>
              <h2 className="text-md font-bold tracking-tight uppercase text-slate-950">ApexOps Executive</h2>
            </div>
          </div>

          <div className="space-y-2">
            <span className={`text-[10px] uppercase tracking-widest font-bold ${activePortal.accentText}`}>
              Portal Secured
            </span>
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 capitalize">
              Sign Into {activePortal.title}
            </h3>
            <p className="text-xs text-slate-500">
              Provide your authorized corporate credentials to log in.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Account Email Address</label>
              <input 
                type="email" 
                placeholder="developer@apexops.net" 
                required
                className="w-full text-xs font-medium p-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-400 focus:bg-white transition-all outline-none" 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Vault Password</label>
              <input 
                type="password" 
                placeholder="••••••••••••" 
                required
                className="w-full text-xs font-medium p-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-400 focus:bg-white transition-all outline-none" 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            <button 
              type="submit" 
              className={`w-full p-3.5 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${activePortal.themeColor}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Authorizing Security Keys...</span>
                </>
              ) : (
                <span>Access Dashboard Workspace</span>
              )}
            </button>
          </form>

          {/* Bottom helper paths */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-slate-400">
            {portalType === 'client' && (
              <>
                <Link to="/client/register" className="text-brand-600 font-bold hover:underline">
                  Don't have an account? Sign Up
                </Link>
                <Link to="/client/forgot-password" className="text-slate-400 hover:text-slate-600 transition-all hover:underline">
                  Forgot Password?
                </Link>
              </>
            )}
            
            {portalType === 'staff' && (
              <span className="text-[10px] text-slate-400 leading-tight">
                Staff registration is restricted. Contact network administrator for credential assignments.
              </span>
            )}

            {portalType === 'admin' && (
              <span className="text-[10px] text-slate-400 leading-tight">
                Root access terminal keys registered. System changes are fully logged in logs.
              </span>
            )}
          </div>

          {/* Quick links to alternate screens (Useful for multi-role test sessions/demos) */}
          <div className="p-3 bg-slate-100/50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Switch Portal Brand Preview:</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/client/login" className="text-[10px] px-2.5 py-1 bg-white hover:bg-slate-100 rounded-md border border-slate-200 text-slate-600 font-semibold transition-all">
                Client Portal
              </Link>
              <Link to="/staff/login" className="text-[10px] px-2.5 py-1 bg-white hover:bg-slate-100 rounded-md border border-slate-200 text-slate-600 font-semibold transition-all">
                Staff Gateway
              </Link>
              <Link to="/admin/login" className="text-[10px] px-2.5 py-1 bg-white hover:bg-slate-100 rounded-md border border-slate-200 text-slate-600 font-semibold transition-all">
                Admin Console
              </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
