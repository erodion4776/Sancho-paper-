import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, RefreshCw, Lock, Mail, ChevronRight, Check } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // programmatic force-mute and play ensures autoplay works with absolute reliability in safari/chrome
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playIntent = videoRef.current.play();
      if (playIntent !== undefined) {
        playIntent.catch((err) => {
          console.warn("Muted autoplay blocked or deferred by browser policy. Interaction will trigger playback.", err);
        });
      }
    }
  }, []);

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
      title: "Sign in to your SASHIO Client Portal",
      subtitle: "Access your dashboard to book, track, and manage services securely.",
      themeColor: "bg-teal-500 hover:bg-teal-600 shadow-teal-500/20 focus:ring-teal-500/30",
      accentText: "text-teal-400 font-bold",
      accentBorder: "border-teal-500/30",
      tagline: "Corporate Fleet Deployments"
    },
    staff: {
      title: "Sign in to your SASHIO Staff Portal",
      subtitle: "Access your dispatcher workspace to view assigned jobs and update statuses.",
      themeColor: "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20 focus:ring-sky-500/30",
      accentText: "text-sky-400 font-bold",
      accentBorder: "border-sky-500/30",
      tagline: "On-Site Sanitation Operations"
    },
    admin: {
      title: "Sign in to your SASHIO Admin Dashboard",
      subtitle: "Access the global control console to coordinate operations and billing.",
      themeColor: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 focus:ring-indigo-500/30",
      accentText: "text-indigo-400 font-bold",
      accentBorder: "border-indigo-500/30",
      tagline: "Global Control Console"
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mb-4" />
        <p className="text-xs text-slate-400 tracking-wider font-mono">Verifying secure active profile...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950 font-sans overflow-x-hidden">
      
      {/* Cinematic Background Video Element */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <source src="https://res.cloudinary.com/dz9xbqtk0/video/upload/v1780153559/3b485104-0e59-44a2-92e2-d0a021c892a7_qw1td0.mp4" type="video/mp4" />
      </video>

      {/* Dark Ambient Overlay (solid rgba(0,0,0,0.55) to satisfy specifications) */}
      <div 
        className="fixed top-0 left-0 w-full h-full bg-black/55 pointer-events-none" 
        style={{ zIndex: 2 }}
      />

      {/* Core Container wrapper with proper padding & width constraints */}
      <div className="relative w-full max-w-md mx-auto flex flex-col gap-6" style={{ zIndex: 10 }}>
        
        {/* Glow ambient effects */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Global Brand Header Section */}
        <div className="text-center space-y-2 mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md mb-2">
            <ShieldCheck className="h-4 w-4 text-teal-400 animate-pulse" />
            <span className="text-[10px] text-teal-300 font-mono tracking-widest uppercase font-bold">
              {activePortal.tagline}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase font-sans">
            SASHIO
          </h1>
          <p className="text-sm font-semibold tracking-wider text-teal-400 uppercase font-mono">
            Mobile Toilet Fleet Management System
          </p>
          <p className="text-xs text-slate-350 max-w-sm mx-auto leading-relaxed">
            Corporate deployments, real-time tracking, and secure service management.
          </p>
        </div>

        {/* Glassmorphic Login Section Card */}
        <div className="w-full bg-slate-950/50 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          
          {/* Section title & subtitle info */}
          <div className="space-y-1.5 border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold tracking-tight text-white">
              {activePortal.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activePortal.subtitle}
            </p>
          </div>

          {/* Error Message Panel */}
          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-200 text-xs font-medium leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {/* Input Form Fields */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Account Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  required
                  className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-white/5 hover:bg-white/10 focus:bg-white/10 text-white border border-white/10 focus:border-teal-400 rounded-xl transition-all outline-none" 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Account Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="Enter your password" 
                  required
                  className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-white/5 hover:bg-white/10 focus:bg-white/10 text-white border border-white/10 focus:border-teal-400 rounded-xl transition-all outline-none" 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`w-full p-3.5 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10 focus:ring-2 focus:outline-none ${activePortal.themeColor}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span className="tracking-widest uppercase font-bold text-[10px]">Authorizing Security Keys...</span>
                </>
              ) : (
                <span className="tracking-widest uppercase font-bold text-[10px]">Unlock Workspace Access</span>
              )}
            </button>
          </form>

          {/* Secondary Links bar */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3 text-xs text-slate-400">
            {portalType === 'client' ? (
              <>
                <Link to="/client/register" className="text-teal-400 font-bold hover:text-teal-300 transition-all hover:underline flex items-center gap-1">
                  Don’t have an account? Sign Up <ChevronRight className="w-3 h-3" />
                </Link>
                <Link to="/client/forgot-password" className="text-slate-400 hover:text-indigo-300 transition-colors hover:underline">
                  Forgot Password?
                </Link>
              </>
            ) : portalType === 'staff' ? (
              <span className="text-[10px] text-slate-400 leading-tight">
                Staff registration is restricted. Contact corporate administrator.
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 leading-tight">
                Root access terminal keys registered. System changes are audited.
              </span>
            )}
          </div>

        </div>

        {/* Portal Switch Section (Styled as sleek horizontal glass controls below the main login card) */}
        <div className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col gap-2">
          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest text-center">
            Switch System Portal
          </p>
          <div className="grid grid-cols-3 gap-1 px-1">
            <Link 
              to="/client/login" 
              className={`text-[10px] text-center py-1.5 rounded-lg border transition-all ${portalType === 'client' ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 font-bold' : 'bg-transparent hover:bg-white/5 border-transparent text-slate-400'}`}
            >
              Client Portal
            </Link>
            <Link 
              to="/staff/login" 
              className={`text-[10px] text-center py-1.5 rounded-lg border transition-all ${portalType === 'staff' ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-bold' : 'bg-transparent hover:bg-white/5 border-transparent text-slate-400'}`}
            >
              Staff Portal
            </Link>
            <Link 
              to="/admin/login" 
              className={`text-[10px] text-center py-1.5 rounded-lg border transition-all ${portalType === 'admin' ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-bold' : 'bg-transparent hover:bg-white/5 border-transparent text-slate-400'}`}
            >
              Admin Dashboard
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

