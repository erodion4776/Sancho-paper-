import React, { useState, useEffect } from "react";
import { useBookings } from "../hooks/useBookings";
import { useAuth } from "../context/AuthContext";
import { MapComponent } from "../components/MapComponent";
import { AddressAutocomplete } from "../components/AddressAutocomplete";
import { getSupabase } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutGrid, 
  CalendarRange, 
  Wallet, 
  User, 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MapPin,
  FileText,
  ChevronRight,
  LogOut,
  Save,
  Plus,
  Zap,
  Sparkles,
  Wind,
  Wrench,
  Cpu,
  Paintbrush,
  MapIcon,
  ShieldCheck,
  Check,
  Smartphone
} from "lucide-react";

// Premium Service list mapped to real prices, descriptions and professional corporate styling
interface ServiceOption {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: "clean",
    name: "Executive Office Sanitization & Deep Clean",
    price: 45000,
    description: "Multi-point hospital-grade deep cleaning & surface protection.",
    icon: Sparkles,
    color: "from-teal-500 to-emerald-600"
  },
  {
    id: "hvac",
    name: "Corporate HVAC Maintenance & AC Servicing",
    price: 25000,
    description: "Filter washing, dust purge, coolant check, and performance test.",
    icon: Wind,
    color: "from-blue-500 to-indigo-600"
  },
  {
    id: "electrical",
    name: "Technical Electrical Cabling & Backup Audits",
    price: 85000,
    description: "Inverter setup, load balancing, diagnostics, and wiring fixes.",
    icon: Zap,
    color: "from-amber-500 to-orange-600"
  },
  {
    id: "plumbing",
    name: "Professional Plumbing Audits & Pipe Repair",
    price: 30000,
    description: "Leak sensing, pipe repairs, low-pressure boost, and valve tuning.",
    icon: Wrench,
    color: "from-cyan-500 to-blue-600"
  },
  {
    id: "smart_office",
    name: "Smart-Office IoT Device Installation",
    price: 120000,
    description: "Connected security integration, smart sensors, and controller configs.",
    icon: Cpu,
    color: "from-purple-500 to-pink-600"
  },
  {
    id: "finish",
    name: "Premium Wall Painting & Eco-Friendly Finishes",
    price: 150000,
    description: "Full wall preparation, premium weather-resistant coating, precision lines.",
    icon: Paintbrush,
    color: "from-rose-500 to-red-600"
  }
];

// Helper to serialize custom scheduling data into service_type string compatible with any database schema
const serializeServiceType = (type: string, date: string, time: string, notes: string) => {
  return `${type} | Date: ${date} | Time: ${time} | Notes: ${notes || 'No extra guidelines'}`;
};

// Helper to extract nested date, time, and notes from serialized DB records
const deserializeServiceType = (serialized: string) => {
  const parts = (serialized || '').split(" | ");
  const typeName = parts[0] || serialized || "Professional Maintenance";
  let date = "Unscheduled";
  let time = "Unscheduled";
  let notes = "None";
  
  parts.forEach(part => {
    if (part.startsWith("Date: ")) date = part.substring(6);
    if (part.startsWith("Time: ")) time = part.substring(6);
    if (part.startsWith("Notes: ")) notes = part.substring(7);
  });
  
  return { typeName, date, time, notes };
};

export const ClientDashboard = () => {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'payments' | 'profile'>('dashboard');

  // Load user bookings
  const { bookings, loading: bookingsLoading, error, createBooking, refetch } =
    useBookings({
      role: "client",
      userId: user?.id,
      authReady: !authLoading,
    });

  // Booking Form State
  const [selectedService, setSelectedService] = useState<ServiceOption>(SERVICE_OPTIONS[0]);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [location, setLocation] = useState<{address: string; lat: number; lng: number} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  
  // Active Bookings View Toggle (Form vs list)
  const [bookingSubView, setBookingSubView] = useState<'list' | 'create'>('list');

  // Profile Edit State
  const [profileName, setProfileName] = useState(profile?.full_name || "");
  const [profilePhone, setProfilePhone] = useState(profile?.phone || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState("");

  // Payment Active State
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<{bookingId: string; message: string} | null>(null);
  const [paymentErrorMsg, setPaymentErrorMsg] = useState<{bookingId: string; message: string} | null>(null);

  // Sync profile values when loaded
  useEffect(() => {
    if (profile) {
      setProfileName(profile.full_name || "");
      setProfilePhone(profile.phone || "");
    }
  }, [profile]);

  // Statistics calculation
  const totalBookings = bookings.length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  
  // Net Outstanding Payments calculation (Nigerian Naira)
  const getServicePrice = (serializedStr: string) => {
    const deserialized = deserializeServiceType(serializedStr);
    const service = SERVICE_OPTIONS.find(s => s.name === deserialized.typeName);
    return service ? service.price : 15000; // fallback default price
  };

  const outstandingRentBookings = bookings.filter(b => b.payment_status !== 'paid' && b.status !== 'cancelled');
  const outstandingSum = outstandingRentBookings.reduce((sum, b) => {
    const price = b.amount_paid ? 0 : getServicePrice(b.service_type);
    return sum + price;
  }, 0);

  // Auto-synthesized timeline notifications based on actual booking transitions
  const getTimelineNotifications = () => {
    const notifications: Array<{ id: string; title: string; body: string; status: 'info' | 'success' | 'warn'; time: string }> = [];

    // Base system setup welcome message
    notifications.push({
      id: "net_welcome",
      title: "Premium Client Portal Active",
      body: `Welcome, ${profile?.full_name || "Valued Merchant"}. Your premium ₦4M corporate operations cockpit is fully synchronized via Supabase.`,
      status: 'success',
      time: 'Just now'
    });

    bookings.slice(0, 5).forEach((b, index) => {
      const { typeName, date } = deserializeServiceType(b.service_type);
      
      if (b.status === 'completed') {
        notifications.push({
          id: `notif_comp_${b.id}`,
          title: "Service Order Complete",
          body: `Verification approved! ${typeName} scheduled for ${date} has been marked complete.`,
          status: 'success',
          time: new Date(b.created_at).toLocaleDateString()
        });
      }
      if (b.payment_status === 'paid') {
        notifications.push({
          id: `notif_paid_${b.id}`,
          title: "Paystack Transaction Verified",
          body: `Successfully credited ₦${getServicePrice(b.service_type).toLocaleString()} for your ${typeName} order. Ref: ${b.payment_reference?.slice(0, 10)}...`,
          status: 'success',
          time: new Date(b.created_at).toLocaleDateString()
        });
      } else if (b.status === 'assigned') {
        notifications.push({
          id: `notif_ass_${b.id}`,
          title: "Operations Specialist Assigned",
          body: `Our operations admin dispatched a professional team for your ${typeName} scheduled on ${date}.`,
          status: 'info',
          time: new Date(b.created_at).toLocaleDateString()
        });
      } else if (b.status === 'pending') {
        notifications.push({
          id: `notif_pend_${b.id}`,
          title: "Service Order Logged",
          body: `${typeName} is secured into our schedule. Waiting for Operations dispatch approval.`,
          status: 'warn',
          time: new Date(b.created_at).toLocaleDateString()
        });
      }
    });

    return notifications;
  };

  // Submit Booking Form handler
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !location || !bookingDate || !bookingTime) {
      alert("Please complete all fields and choose a verified location on the map.");
      return;
    }
    setSubmitting(true);
    setBookingSuccess(null);

    const fullSerializedService = serializeServiceType(
      selectedService.name,
      bookingDate,
      bookingTime,
      bookingNotes
    );

    try {
      await createBooking({
        client_id: user.id,
        service_type: fullSerializedService,
        location_address: location.address,
        latitude: location.lat,
        longitude: location.lng
      });
      
      setBookingSuccess("Your corporate booking has been lodged successfully and is live in our routing engine.");
      setBookingNotes("");
      setBookingDate("");
      setBookingTime("");
      setLocation(null);

      // Auto switch back to list view with gentle delay
      setTimeout(() => {
        setBookingSuccess(null);
        setBookingSubView('list');
      }, 3000);

    } catch (e: any) {
      alert("Error logging booking: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Profile submission update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    setProfileSavedMsg("");
    try {
      const { error } = await getSupabase()
        .from("profiles")
        .update({
          full_name: profileName,
          phone: profilePhone,
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setProfileSavedMsg("Your account information has been securely updated in the database.");
      setTimeout(() => {
        setProfileSavedMsg("");
      }, 3500);
      refetch();
    } catch (err: any) {
      alert("Failed updating database profile: " + err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  // Real Paystack integration with error handling and feedback states
  const handlePaystackPay = async (bookingId: string) => {
    if (!user?.email) return;
    setPayingId(bookingId);
    setPaymentSuccessMsg(null);
    setPaymentErrorMsg(null);

    const targetBooking = bookings.find(b => b.id === bookingId);
    if (!targetBooking) return;

    const amount = getServicePrice(targetBooking.service_type);

    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, amount, email: user.email }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.authorization_url) {
        setPaymentSuccessMsg({
          bookingId,
          message: "Secure checkout initialized. Redirecting you to Paystack payment gateway..."
        });
        setTimeout(() => {
          window.location.href = data.authorization_url;
        }, 1500);
      } else {
        setPaymentErrorMsg({
          bookingId,
          message: data.error || "Payment Gateway is offline. Verify PAYSTACK_SECRET_KEY in setup settings."
        });
      }
    } catch (e: any) {
      setPaymentErrorMsg({
        bookingId,
        message: "Network failure: " + e.message
      });
    } finally {
      setPayingId(null);
    }
  };

  // If Auth context is still loading, show a premium layout template
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
          <Smartphone className="w-6 h-6 text-brand-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">Syncing with Secure Node</h2>
        <p className="text-sm text-slate-400 max-w-xs">Initializing localized secure authentication profiles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 md:pb-8">
      {/* Premium Header Accent */}
      <header className="bg-slate-900 text-white py-6 px-4 md:px-8 sticky top-0 z-40 shadow-lg border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/30">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-md font-extrabold tracking-tight font-sans uppercase">ApexOps SaaS</h1>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-brand-500/20 text-brand-300 rounded-full border border-brand-500/30">Client Hub</span>
              </div>
              <p className="text-xs text-slate-400">Secure Commercial Service Suite</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-medium text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              ⚡ {profile?.full_name || user?.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6">
        
        {/* TAB 1: DASHBOARD HOME */}
        {activeTab === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            {/* Quick Hero Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> Operations Cockpit Active
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Welcome to ApexOps, <span className="text-brand-300">{profile?.full_name || "Valued Customer"}</span>
                </h2>
                <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
                  Monitor service agreements, schedule professional engineering visits, and confirm secure transactions locally or internationally.
                </p>
                <div className="pt-4 flex flex-wrap gap-2.5">
                  <button 
                    onClick={() => { setActiveTab('bookings'); setBookingSubView('create'); }}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-500/20"
                  >
                    <Plus className="w-4 h-4" /> Book Premium Service
                  </button>
                  <button 
                    onClick={() => setActiveTab('payments')}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all"
                  >
                    <Wallet className="w-4 h-4" /> View Unpaid Bills
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-bold font-sans">Total Bookings</span>
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <CalendarRange className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold tracking-tight text-slate-900 font-mono">{totalBookings}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Logged records in log</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-bold font-sans">Pending Dispatch</span>
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold tracking-tight text-slate-900 font-mono">{pendingCount}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Awaiting coordinator approval</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-bold font-sans">Services Finished</span>
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold tracking-tight text-slate-900 font-mono">{completedCount}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Specialists certified work completed</p>
                </div>
              </div>

              <div className="border-2 border-brand-100 bg-brand-50/50 p-4 rounded-2xl shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-brand-800 text-xs font-bold font-sans">Outstanding Due</span>
                  <div className="p-2 bg-brand-500 rounded-xl text-white shadow-sm">
                    <span className="text-xs font-extrabold">₦</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tight text-slate-900 font-mono">
                    ₦{outstandingSum.toLocaleString()}
                  </h4>
                  <p className="text-[10px] text-brand-700 mt-1 font-bold">Unpaid active agreements</p>
                </div>
              </div>
            </div>

            {/* Notifications Area */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Activity & Updates Terminal</h3>
                    <p className="text-xs text-slate-400">Database event logs, verified bookings, & Paystack invoices</p>
                  </div>
                </div>
                <span className="text-xs text-brand-500 font-extrabold uppercase tracking-wide bg-brand-100 px-2 py-0.5 rounded-md">Live Sync</span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {getTimelineNotifications().map((notif) => (
                  <div key={notif.id} className="p-3.5 bg-slate-50 rounded-xl flex gap-3 border border-slate-100 hover:bg-slate-100/50 transition-all">
                    <div className="mt-0.5">
                      {notif.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {notif.status === 'info' && <Bell className="w-4 h-4 text-blue-500" />}
                      {notif.status === 'warn' && <Clock className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-slate-800">{notif.title}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{notif.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{notif.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: BOOKINGS (Form + List) */}
        {activeTab === 'bookings' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            {/* Action Header / Sub-tab Toggle */}
            <div className="flex items-center justify-between p-1 bg-slate-100 rounded-xl">
              <button 
                onClick={() => setBookingSubView('list')}
                className={`flex-1 py-2.5 text-xs font-bold text-center rounded-lg transition-all ${bookingSubView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                📋 My Active Bookings ({bookings.length})
              </button>
              <button 
                onClick={() => setBookingSubView('create')}
                className={`flex-1 py-2.5 text-xs font-bold text-center rounded-lg transition-all ${bookingSubView === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                ✨ Book New Service
              </button>
            </div>

            {/* SUB-VIEW 1: BOOKINGS LIST */}
            {bookingSubView === 'list' && (
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-4 shadow-sm">
                    <div className="w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                      <CalendarRange className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">Create your first booking</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        No active service orders currently booked in our operations database. Tap below to schedule a world-class on-site service.
                      </p>
                    </div>
                    <button 
                      onClick={() => setBookingSubView('create')}
                      className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 shadow-md shadow-brand-500/10"
                    >
                      <Plus className="w-4 h-4" /> Schedule Visit Now
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {bookings.map((b) => {
                      const { typeName, date, time, notes } = deserializeServiceType(b.service_type);
                      const baseService = SERVICE_OPTIONS.find(s => s.name === typeName);
                      const price = baseService ? baseService.price : 15000;
                      const IconComp = baseService?.icon || Sparkles;

                      // Status styles
                      const getStatusBadgeStyles = (status: string) => {
                        switch(status) {
                          case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
                          case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
                          case 'assigned': return 'bg-sky-50 text-sky-700 border-sky-100';
                          case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-100';
                          default: return 'bg-slate-50 text-slate-700 border-slate-100';
                        }
                      };

                      // Payment badge styles
                      const getPaymentBadgeStyles = (statusStr: string) => {
                        return statusStr === 'paid' 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20';
                      };

                      return (
                        <div key={b.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                          <div className="space-y-4">
                            {/* Service Type Row */}
                            <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight line-clamp-1">{typeName}</h4>
                                  <span className="text-[10px] font-mono font-medium text-slate-400">Order Ref: #{b.id.slice(0, 8)}</span>
                                </div>
                              </div>
                              <span className="text-xs font-extrabold text-slate-900 font-mono">₦{price.toLocaleString()}</span>
                            </div>

                            {/* Scheduling & Details */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100/50">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Scheduled Date</p>
                                <p className="font-extrabold text-slate-800 mt-1">{date}</p>
                              </div>
                              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100/50">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Scheduled Time</p>
                                <p className="font-extrabold text-slate-800 mt-1">{time}</p>
                              </div>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Location Address</p>
                              <p className="font-medium text-slate-700 flex items-center gap-1.5 leading-snug">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {b.location_address}
                              </p>
                              {b.latitude && b.longitude && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] text-brand-500 hover:underline font-bold"
                                >
                                  <MapIcon className="w-3 h-3" /> View coordinates on Google Maps
                                </a>
                              )}
                            </div>

                            {notes && notes !== 'None' && (
                              <p className="text-[11px] text-slate-500 italic px-2 border-l-2 border-slate-300 bg-slate-50/50 py-1 rounded-r-md">
                                <FileText className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> &ldquo;{notes}&rdquo;
                              </p>
                            )}

                            {/* Badges row */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                <span className={`px-2.5 py-1 rounded-full border ${getStatusBadgeStyles(b.status)} uppercase font-mono`}>
                                  Status: {b.status}
                                </span>
                                <span className={`px-2.5 py-1 rounded-full border ${getPaymentBadgeStyles(b.payment_status || 'pending')} uppercase font-mono`}>
                                  Payment: {b.payment_status || 'pending'}
                                </span>
                              </div>

                              <span className="text-[10px] text-slate-500 font-medium">
                                Assigned Staff: {b.assigned_staff_id ? `Active (#${b.assigned_staff_id.slice(0, 6)})` : "Pending Dispatch"}
                              </span>
                            </div>
                          </div>

                          {/* Quick Payment Button inside Listing */}
                          {b.payment_status !== "paid" && b.status !== 'cancelled' && (
                            <div className="mt-4 border-t border-slate-50 pt-3">
                              <button
                                onClick={() => handlePaystackPay(b.id)}
                                disabled={payingId === b.id}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-emerald-500/10"
                              >
                                {payingId === b.id ? (
                                  <>
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                    <span>Syncing Paystack Gateway...</span>
                                  </>
                                ) : (
                                  <>
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span>Pay ₦{price.toLocaleString()} via Paystack Checkout</span>
                                  </>
                                )}
                              </button>
                              
                              {paymentErrorMsg?.bookingId === b.id && (
                                <p className="mt-2 text-center text-[10px] text-rose-500 font-semibold bg-rose-50 border border-rose-100 p-2 rounded-lg">
                                  ⚠️ {paymentErrorMsg.message}
                                </p>
                              )}
                              {paymentSuccessMsg?.bookingId === b.id && (
                                <p className="mt-2 text-center text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 p-2 rounded-lg animate-pulse">
                                  ✓ {paymentSuccessMsg.message}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 2: REDESIGNED BOOKING FORM */}
            {bookingSubView === 'create' && (
              <form onSubmit={handleBookingSubmit} className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-5">
                <div className="border-b border-slate-50 pb-4">
                  <h3 className="text-base font-extrabold text-slate-900 mb-1">Redesigned Corporate Service Booking</h3>
                  <p className="text-xs text-slate-400">Schedule certified on-site engineering and luxury finishes instantly</p>
                </div>

                {/* Service Dropdown Picker */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Estimate & Service Selection</label>
                  <div className="grid gap-2">
                    {SERVICE_OPTIONS.map((opt) => (
                      <div 
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedService(opt)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${selectedService.id === opt.id ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl bg-slate-900 text-white`}>
                            <opt.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">{opt.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{opt.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-slate-900 block">₦{opt.price.toLocaleString()}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-bold">Standard rate</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date & Time Picker Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Scheduled Date</label>
                    <input 
                      type="date" 
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Preferred Time Block</label>
                    <input 
                      type="time" 
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Location Picker & Map */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">On-Site Servicing Location</label>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <AddressAutocomplete 
                      onPlaceSelect={(address, lat, lng) => setLocation({address, lat, lng})} 
                    />
                  </div>
                  
                  {location ? (
                    <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                      <div className="bg-slate-900 text-white p-3 text-xs flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5 truncate">
                          <MapPin className="text-emerald-400 w-3.5 h-3.5 shrink-0" /> {location.address}
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-mono py-0.5 px-2 rounded-md">Verified GPS</span>
                      </div>
                      <MapComponent 
                        center={{ lat: location.lat, lng: location.lng }}
                        markerPosition={{ lat: location.lat, lng: location.lng }}
                      />
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">Please enter and select an address using search to load geolocation mapping.</p>
                  )}
                </div>

                {/* Special Guidelines Section */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Access Guidelines / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details (e.g. gates, special instructions, specific personnel, workspace contact person)"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                  />
                </div>

                {/* Booking feedback */}
                {bookingSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-2 animate-bounce">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{bookingSuccess}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || !location}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-black/10 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Transmitting Service Order...</span>
                    </>
                  ) : (
                    <>
                      <CalendarRange className="w-4 h-4" />
                      <span>Confirm ₦{selectedService.price.toLocaleString()} Scheduled Booking</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        )}

        {/* TAB 3: PAYMENTS HISTORY */}
        {activeTab === 'payments' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            {/* Payment Summary Tally */}
            <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-300 py-1 px-2.5 bg-brand-500/20 rounded-full border border-brand-500/20 inline-block mb-1">Verified Paystack Node</span>
                  <h3 className="text-lg font-bold">Outstanding Operations Due</h3>
                  <p className="text-xs text-slate-300 max-w-sm">Payments are processed instantly using card, bank transfers or mobile money via Paystack SDK secure gateway.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right min-w-[200px]">
                  <p className="text-[10px] text-white/70 uppercase font-black tracking-wider">Total Outstanding</p>
                  <p className="text-2xl font-black font-mono mt-1 text-emerald-300">₦{outstandingSum.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* List of Billings */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Current Corporate Invoices</h3>
                <p className="text-xs text-slate-400">Pay each appointment or request to dispatch certified staff</p>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No service invoices on record yet.</div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => {
                    const { typeName, date } = deserializeServiceType(b.service_type);
                    const amount = getServicePrice(b.service_type);
                    const isPaid = b.payment_status === 'paid';

                    return (
                      <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-100/50">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${isPaid ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                            <h4 className="text-xs font-extrabold text-slate-900 leading-snug">{typeName}</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-500">
                            <p>📅 Schedule: <span className="font-extrabold text-slate-700">{date}</span></p>
                            <p>📎 Ref: <span className="font-mono text-slate-400">#{b.id.slice(0, 8)}</span></p>
                            {isPaid && (
                              <p className="col-span-2 text-emerald-600 font-extrabold">
                                ✓ Verified pay ref: {b.payment_reference || "Webhook automatic sync"}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
                          <div>
                            <span className="text-xs text-slate-400 block text-left md:text-right">Total Amount</span>
                            <span className="text-sm font-extrabold font-mono text-slate-900 block">₦{amount.toLocaleString()}</span>
                          </div>

                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase font-mono px-3 py-1.5 rounded-lg shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Settled
                            </span>
                          ) : b.status === 'cancelled' ? (
                            <span className="inline-flex bg-slate-200 text-slate-600 text-[10px] font-black uppercase font-mono px-3 py-1.5 rounded-lg">
                              Cancelled
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1 min-w-[120px]">
                              <button
                                onClick={() => handlePaystackPay(b.id)}
                                disabled={payingId === b.id}
                                className="bg-slate-900 hover:bg-black text-white font-extrabold text-[10px] uppercase tracking-wide px-3 py-2 rounded-lg transition-all disabled:opacity-50 shadow-md shadow-black/5"
                              >
                                {payingId === b.id ? "Syncing..." : "Pay Invoice"}
                              </button>
                              
                              {paymentErrorMsg?.bookingId === b.id && (
                                <span className="text-[9px] text-rose-500 font-bold block max-w-[150px] line-clamp-2 leading-tight">
                                  {paymentErrorMsg.message}
                                </span>
                              )}
                              {paymentSuccessMsg?.bookingId === b.id && (
                                <span className="text-[9px] text-emerald-600 font-bold block animate-pulse">
                                  {paymentSuccessMsg.message}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            {/* Identity badge summary */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-center space-y-3">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white text-xl font-black mx-auto shadow-md">
                {profile?.full_name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "OP"}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">{profile?.full_name || "ApexOps Partner"}</h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold uppercase border border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-300" /> Authorized Roles: CLIENT
              </div>
            </div>

            {/* Profile update DB Form */}
            <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Secure Profile Settings</h3>
                <p className="text-xs text-slate-400">Updates will sync across staff assignments and invoices</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Full Business Name</label>
                <input 
                  type="text" 
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Acme Tech Solutions PLC"
                  className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Phone Number</label>
                <input 
                  type="tel" 
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Email (Locked)</label>
                <input 
                  type="email" 
                  disabled
                  value={user?.email || ""}
                  className="w-full text-xs font-medium p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">Email addresses are verified and managed from credentials settings.</span>
              </div>

              {profileSavedMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{profileSavedMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {profileSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Updating database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Accountant Profile Changes</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

      </main>

      {/* FIXED BOTTOM NAVIGATION BAR WITH GLASSMORPHISM AND MOBILE RESPONSE */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur-lg border-t border-white/5 py-2.5 px-4 z-50 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all relative ${activeTab === 'dashboard' ? 'text-brand-400 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-300'}`}
          >
            {activeTab === 'dashboard' && (
              <motion.div layoutId="navAccent" className="absolute -top-2.5 inset-x-0 h-0.5 bg-brand-400 rounded-full" />
            )}
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">Dashboard</span>
          </button>

          <button 
            onClick={() => { setActiveTab('bookings'); setBookingSubView('list'); }}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all relative ${activeTab === 'bookings' ? 'text-brand-400 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-300'}`}
          >
            {activeTab === 'bookings' && (
              <motion.div layoutId="navAccent" className="absolute -top-2.5 inset-x-0 h-0.5 bg-brand-400 rounded-full" />
            )}
            <CalendarRange className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">Bookings</span>
          </button>

          <button 
            onClick={() => setActiveTab('payments')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all relative ${activeTab === 'payments' ? 'text-brand-400 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-300'}`}
          >
            {activeTab === 'payments' && (
              <motion.div layoutId="navAccent" className="absolute -top-2.5 inset-x-0 h-0.5 bg-brand-400 rounded-full" />
            )}
            <Wallet className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">Payments</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-all relative ${activeTab === 'profile' ? 'text-brand-400 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-300'}`}
          >
            {activeTab === 'profile' && (
              <motion.div layoutId="navAccent" className="absolute -top-2.5 inset-x-0 h-0.5 bg-brand-400 rounded-full" />
            )}
            <User className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">Profile</span>
          </button>

        </div>
      </nav>
    </div>
  );
};
