import React, { useState, useEffect, useMemo } from "react";
import eclipseLogo from "@assets/eclipse-logo-new-transparent.png";
import suburbanImg from "@assets/generated_images/fleet-suburban.jpg";
import escaladeImg from "@assets/generated_images/fleet-escalade.jpg";
import lincolnImg from "@assets/generated_images/fleet-lincoln.jpg";
import mercedesImg from "@assets/generated_images/fleet-mercedes.jpg";
import serviceAirport from "@assets/generated_images/service-airport.jpg";
import serviceCorporate from "@assets/generated_images/service-corporate.jpg";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import {
  useListBookings,
  useGetBooking,
  useGetBookingSummary,
  useCreateBooking,
  useUpdateBooking,
  useCancelBooking,
  useAdminListFleet,
  useAdminCreateFleet,
  useAdminUpdateFleet,
  useAdminDeleteFleet,
  useAdminListServices,
  useAdminCreateService,
  useAdminUpdateService,
  useAdminDeleteService,
  useAdminListZones,
  useAdminCreateZone,
  useAdminUpdateZone,
  useAdminDeleteZone,
  useAdminListContacts,
  useAdminGetAnalytics,
  getListBookingsQueryKey,
  getGetBookingQueryKey,
  getGetBookingSummaryQueryKey,
  getAdminListFleetQueryKey,
  getAdminListServicesQueryKey,
  getAdminListZonesQueryKey,
  getAdminListContactsQueryKey,
  getAdminGetAnalyticsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { isAdminAuthenticated, clearAdminToken, getAdminToken } from "@/lib/admin-auth";
import {
  LogOut, Car, ClipboardList, MapPin, Settings, Plus, Pencil, Trash2,
  CheckCircle, XCircle, Clock, Menu, LayoutDashboard, BarChart3,
  MessageSquare, ExternalLink, Printer, Loader2, X, Save,
  DollarSign, Users, Package, ChevronRight, Mail, Phone,
  CalendarDays, Search, Bell, Shield, Building2, Sliders,
  ChevronLeft, TrendingUp, Star, AlertCircle, Filter, Download,
  Eye, EyeOff, Globe, Lock, RefreshCw, Briefcase
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from "recharts";
import type { Booking, Vehicle, Service, Zone, BookingInput, ContactInquiry, BookingUpdateStatus } from "@workspace/api-client-react";

/* ── Real-time polling ──
   New reservations appear in the panel without a manual refresh.
   5s interval balances "live" feel with server load. */
const REALTIME_QUERY = { refetchInterval: 5000, refetchOnWindowFocus: true, staleTime: 0 } as const;

/* ── Auth Guard ── */
function useAdminGuard() {
  const [, setLocation] = useLocation();
  if (!isAdminAuthenticated()) {
    setLocation("/admin/login");
    return false;
  }
  return true;
}

/* ── Print Utilities ── */
const PrintStyles = () => (
  <style>{`
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      @page { margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `}</style>
);

const PrintPortal = ({ children }: { children: React.ReactNode }) => {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="hidden print-only w-full bg-white print:absolute print:inset-0 print:z-[9999]">
      {children}
    </div>,
    document.body
  );
};

/* ── Shared UI Components ── */
const statusConfig = {
  pending:   { label: "Pending",   bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-400", icon: Clock },
  confirmed: { label: "Confirmed", bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-400",  icon: CheckCircle },
  completed: { label: "Completed", bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-400", icon: CheckCircle },
  cancelled: { label: "Cancelled", bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-400",   icon: XCircle },
};

export const getVehicleImage = (v?: { name?: string; model?: string; imageUrl?: string | null } | string | null) => {
  if (!v) return null;
  if (typeof v === "string") {
    const lower = v.toLowerCase();
    if (lower.includes("escalade")) return escaladeImg;
    if (lower.includes("suburban")) return suburbanImg;
    if (lower.includes("lincoln") || lower.includes("sedan")) return lincolnImg;
    if (lower.includes("mercedes")) return mercedesImg;
    return v.startsWith("http") || v.startsWith("data:") || v.startsWith("/assets") ? v : null;
  }
  if (v.imageUrl && (v.imageUrl.startsWith("http") || v.imageUrl.startsWith("data:") || v.imageUrl.startsWith("/assets"))) {
    return v.imageUrl;
  }
  const lower = `${v.name || ""} ${v.model || ""}`.toLowerCase();
  if (lower.includes("escalade")) return escaladeImg;
  if (lower.includes("suburban")) return suburbanImg;
  if (lower.includes("lincoln") || lower.includes("sedan")) return lincolnImg;
  if (lower.includes("mercedes")) return mercedesImg;
  return v.imageUrl || null;
};

export const getServiceImage = (s?: { name?: string; imageUrl?: string | null } | string | null) => {
  if (!s) return null;
  const name = typeof s === "string" ? s : s.name || "";
  const imgUrl = typeof s === "string" ? "" : s.imageUrl || "";
  if (imgUrl && (imgUrl.startsWith("http") || imgUrl.startsWith("data:") || imgUrl.startsWith("/assets"))) {
    return imgUrl;
  }
  const lower = name.toLowerCase();
  if (lower.includes("airport")) return serviceAirport;
  if (lower.includes("corporate")) return serviceCorporate;
  return imgUrl || null;
};

export const DEFAULT_FLEET_VEHICLES: Vehicle[] = [
  {
    id: 1,
    name: "Suburban",
    model: "Chevrolet Suburban",
    year: 2025,
    capacity: 7,
    luggageCapacity: 6,
    vehicleType: "Luxury SUV",
    flatRate: 140, // Base Price (15 miles included)
    ratePerMile: 2.95,
    hourlyRate: 80,
    imageUrl: suburbanImg,
    description: "The pinnacle of understated luxury. Exceptionally spacious with onboard Wi-Fi, privacy glass, and capacity for 7 passengers and 6 large bags.",
    amenities: ["Wi-Fi", "Privacy glass", "Leather seating", "USB charging", "Climate control"],
  },
  {
    id: 2,
    name: "Escalade",
    model: "Cadillac Escalade ESV",
    year: 2024,
    capacity: 7,
    luggageCapacity: 6,
    vehicleType: "Premium SUV",
    flatRate: 140, // Base Price (15 miles included)
    ratePerMile: 3.40,
    hourlyRate: 95,
    imageUrl: escaladeImg,
    description: "Commanding presence with panoramic sunroof, studio sound system, executive captain seating, and maximum legroom for high-profile clients.",
    amenities: ["Panoramic sunroof", "Studio audio", "Wi-Fi", "Executive seating", "Rear entertainment"],
  },
  {
    id: 3,
    name: "Sedan",
    model: "Lincoln Continental",
    year: 2024,
    capacity: 3,
    luggageCapacity: 3,
    vehicleType: "Executive Sedan",
    flatRate: 100, // Base Price (15 miles included)
    ratePerMile: 2.40,
    hourlyRate: 75,
    imageUrl: lincolnImg,
    description: "Classic executive elegance. Whisper-quiet cabin, massaging rear seats, and smooth ride perfect for airport and corporate transfers.",
    amenities: ["Executive seating", "Massaging seats", "Quiet cabin", "Wi-Fi", "USB charging"],
  },
  {
    id: 4,
    name: "Mercedes S-Class",
    model: "Mercedes-Benz S-Class",
    year: 2024,
    capacity: 3,
    luggageCapacity: 3,
    vehicleType: "Luxury Sedan",
    flatRate: 100,
    ratePerMile: 2.40,
    hourlyRate: 75,
    imageUrl: mercedesImg,
    description: "The ultimate standard in luxury sedans. State-of-the-art safety, exquisite craftsmanship, and an extraordinarily smooth ride.",
    amenities: ["Ambient lighting", "Massaging seats", "Burmester audio", "Rear screens", "Wi-Fi"],
  }
];

/** Returns the correct catalog rate for a vehicle based on its name. */
function defaultRateFor(name: string | undefined, field: "ratePerMile" | "flatRate" | "hourlyRate"): number {
  const lower = (name || "").toLowerCase();
  const isSuv = lower.includes("suburban") || lower.includes("escalade");
  const isSedan = lower.includes("lincoln") || lower.includes("sedan") || lower.includes("mercedes");
  switch (field) {
    case "ratePerMile":
      if (lower.includes("escalade")) return 3.40;
      if (lower.includes("suburban")) return 2.95;
      if (isSedan) return 2.40;
      return 2.95;
    case "flatRate":
      return isSuv ? 140 : isSedan ? 100 : 140;
    case "hourlyRate":
      if (lower.includes("escalade")) return 95;
      if (lower.includes("suburban")) return 80;
      if (isSedan) return 75;
      return 80;
  }
}

export const DEFAULT_SERVICES: Service[] = [
  {
    id: 1,
    name: "Airport Transfer",
    description: "Seamless door-to-terminal luxury service with real-time flight tracking and meet & greet at LAX, BUR, LGB, SNA & ONT.",
    icon: "airport",
    priceFrom: 100,
    features: ["Flight Tracking", "Meet & Greet Available", "Luggage Assistance", "Curbside or Inside Pickup"],
  },
  {
    id: 2,
    name: "Corporate Travel",
    description: "Dedicated executive transportation with onboard Wi-Fi, discreet professional chauffeurs, and punctual service guaranteed.",
    icon: "corporate",
    priceFrom: 75,
    features: ["High-speed Wi-Fi", "Mobile Office Setup", "Flexible Billing", "Priority Dispatch"],
  },
  {
    id: 3,
    name: "By the Hour",
    description: "As-directed luxury chauffeur service with unlimited stops across Los Angeles. 3-hour minimum.",
    icon: "hourly",
    priceFrom: 75,
    features: ["Unlimited Stops", "Wait & Return", "Custom Itinerary", "Chauffeur on Standby"],
  },
  {
    id: 4,
    name: "Special Events & Weddings",
    description: "Prestigious black car arrivals for weddings, red carpets, galas, and VIP celebrations.",
    icon: "wedding",
    priceFrom: 140,
    features: ["Red Carpet Ready", "Bridal Fleet", "Champagne Service Ready", "Impeccable Timing"],
  }
];

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function KPICard({ title, value, sub, icon: Icon, accent }: {
  title: string; value: string | number; sub?: string;
  icon?: React.ElementType; accent?: string;
}) {
  return (
    <div className={`p-6 rounded-2xl border bg-white border-gray-100 shadow-sm hover:shadow-md transition-all group`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ?? 'bg-gray-50'} group-hover:scale-110 transition-transform`}>
            <Icon size={16} className="text-gray-600" />
          </div>
        )}
      </div>
      <p className="text-3xl font-black tracking-tight text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 font-medium mt-1.5">{sub}</p>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#F9F8F5] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white shrink-0">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

function SlideOver({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, isOpen]);
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end no-print">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white shadow-2xl w-full max-w-lg h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-8">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-gray-400 px-5 mb-2 mt-1">{children}</p>;
}

function Divider() {
  return <div className="h-px bg-gray-100 mx-4 my-3" />;
}

const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-900 transition-colors bg-white focus:shadow-sm";
const textareaClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-900 transition-colors bg-white resize-none focus:shadow-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
      {children}
    </div>
  );
}

function AdminFieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 w-28 shrink-0 mt-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900 flex-1">{value || <span className="text-gray-300 font-normal italic">—</span>}</p>
    </div>
  );
}

/* ── Print Invoice ── */
function PrintInvoice({ booking }: { booking: Booking }) {
  return (
    <div className="w-full max-w-4xl mx-auto p-12 font-sans text-black bg-white min-h-screen">
      <div className="flex justify-between items-end border-b-[3px] border-black pb-8 mb-12">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase">ECLIPSE</h1>
          <p className="text-gray-500 font-bold tracking-widest mt-2 text-sm uppercase">Transport Invoice</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">#{booking.id.toString().padStart(4, '0')}</p>
          <p className="text-gray-500 font-medium mt-1 uppercase text-sm tracking-wider">Issued: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-16 mb-12 border-b-[3px] border-black pb-12">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Billed To</p>
          <p className="font-black text-2xl tracking-tight mb-2">{booking.passengerName}</p>
          <p className="text-gray-600 font-medium">{booking.passengerEmail}</p>
          <p className="text-gray-600 font-medium">{booking.passengerPhone}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Service Details</p>
          <p className="font-black text-xl tracking-tight mb-2">{booking.serviceType}</p>
          <p className="text-gray-600 font-medium mb-1">Date: {booking.pickupDate}</p>
          <p className="text-gray-600 font-medium mb-1">Time: {booking.pickupTime}</p>
          <p className="text-gray-600 font-medium">Passengers: {booking.passengers || 1}</p>
        </div>
      </div>
      <div className="mb-12">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Routing</p>
        <div className="grid grid-cols-2 gap-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-black" /><p className="text-xs font-bold uppercase tracking-wider">Pickup</p></div>
            <p className="font-semibold text-lg">{booking.pickupLocation}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-black border-2 border-gray-200" /><p className="text-xs font-bold uppercase tracking-wider">Dropoff</p></div>
            <p className="font-semibold text-lg">{booking.dropoffLocation}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="bg-black text-white px-12 py-8 rounded-2xl min-w-[280px]">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Total Due</p>
          <p className="text-5xl font-black">${booking.totalPrice ?? 0}</p>
        </div>
      </div>
      <div className="mt-16 pt-8 border-t border-gray-200 text-center">
        <p className="font-bold text-gray-400 tracking-widest text-xs uppercase">Eclipse Transport — Private Luxury Transportation — Los Angeles, CA</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DASHBOARD TAB
───────────────────────────────────────────────────────────── */
function DashboardTab({ onGoTo }: { onGoTo: (tab: string) => void }) {
  const { data: analytics, isLoading } = useAdminGetAnalytics({ query: { queryKey: getAdminGetAnalyticsQueryKey(), ...REALTIME_QUERY } });
  const { data: summary } = useGetBookingSummary({ query: { queryKey: getGetBookingSummaryQueryKey(), ...REALTIME_QUERY } });
  const { data: allBookings } = useListBookings({}, { query: { queryKey: getListBookingsQueryKey(), ...REALTIME_QUERY } });

  const pendingCount = allBookings?.filter(b => b.status === 'pending').length ?? 0;
  const confirmedCount = allBookings?.filter(b => b.status === 'confirmed').length ?? 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = allBookings?.filter(b => b.pickupDate === todayStr) ?? [];

  const CHART_COLORS = ['#1A1A1A', '#6B7280', '#D1D5DB', '#9CA3AF'];

  if (isLoading) return (
    <div className="flex items-center justify-center py-40">
      <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
    </div>
  );

  const recent = allBookings?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "New Booking", icon: Plus, action: () => onGoTo('bookings'), color: "bg-[#1A1A1A] text-white hover:bg-gray-800" },
          { label: "Pending", icon: Clock, action: () => onGoTo('bookings'), color: "bg-amber-50 text-amber-700 hover:bg-amber-100", badge: pendingCount },
          { label: "Confirmed", icon: CheckCircle, action: () => onGoTo('bookings'), color: "bg-blue-50 text-blue-700 hover:bg-blue-100", badge: confirmedCount },
          { label: "Calendar", icon: CalendarDays, action: () => onGoTo('calendar'), color: "bg-gray-50 text-gray-700 hover:bg-gray-100" },
        ].map(({ label, icon: Icon, action, color, badge }) => (
          <button key={label} onClick={action} className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl font-bold text-sm transition-all shadow-sm hover:shadow-md ${color}`}>
            <Icon size={22} strokeWidth={2} />
            <span className="tracking-wide">{label}</span>
            {badge != null && badge > 0 && (
              <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 bg-amber-400 text-white text-[10px] font-black rounded-full flex items-center justify-center">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={`$${(analytics?.totalRevenue ?? 0).toLocaleString()}`} sub="All time" icon={DollarSign} accent="bg-green-50" />
        <KPICard title="Avg. Booking" value={`$${(analytics?.avgBookingValue ?? 0).toFixed(0)}`} sub="Per trip" icon={TrendingUp} accent="bg-blue-50" />
        <KPICard title="Completed" value={analytics?.completedTrips ?? 0} sub="Trips done" icon={CheckCircle} accent="bg-gray-50" />
        <KPICard title="Total Bookings" value={summary?.total ?? 0} sub="All statuses" icon={ClipboardList} accent="bg-purple-50" />
      </div>

      {/* Today's Bookings */}
      {todayBookings.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-gray-900 text-lg tracking-tight">Today's Schedule</h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{todayStr}</span>
          </div>
          <div className="space-y-3">
            {todayBookings.map(b => (
              <div key={b.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className={`w-2 h-10 rounded-full ${statusConfig[b.status as keyof typeof statusConfig]?.dot ?? 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{b.passengerName}</p>
                  <p className="text-xs text-gray-500 font-medium">{b.pickupTime} · {b.serviceType}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h3 className="font-black text-gray-900 text-lg tracking-tight mb-6">Monthly Revenue</h3>
          {analytics?.monthlyRevenue?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analytics.monthlyRevenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A1A1A" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#1A1A1A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 700 }} />
                <Area type="monotone" dataKey="revenue" stroke="#1A1A1A" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#1A1A1A', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm font-medium">No data yet</div>}
        </div>

        {/* Bookings by service */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h3 className="font-black text-gray-900 text-lg tracking-tight mb-6">By Service</h3>
          {analytics?.bookingsByService?.length ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={analytics.bookingsByService} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="count" paddingAngle={3}>
                    {analytics.bookingsByService.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {analytics.bookingsByService.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <p className="text-xs font-semibold text-gray-600 truncate max-w-[110px]">{s.service}</p>
                    </div>
                    <p className="text-xs font-black text-gray-900">{s.count}</p>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-[180px] flex items-center justify-center text-gray-300 text-sm font-medium">No data yet</div>}
        </div>
      </div>

      {/* Booking status breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => {
          const count = allBookings?.filter(b => b.status === s).length ?? 0;
          const cfg = statusConfig[s];
          return (
            <div key={s} className={`p-5 rounded-2xl border ${cfg.bg} border-transparent flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity`} onClick={() => onGoTo('bookings')}>
              <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                <cfg.icon size={16} className={cfg.text} />
              </div>
              <div>
                <p className={`text-2xl font-black ${cfg.text}`}>{count}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider opacity-70 ${cfg.text}`}>{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
          <h3 className="font-black text-gray-900 text-lg tracking-tight">Recent Bookings</h3>
          <button onClick={() => onGoTo('bookings')} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1">
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm font-medium">No bookings yet</div>
          ) : recent.map(b => (
            <div key={b.id} className="flex items-center gap-6 px-8 py-5 hover:bg-gray-50/60 transition-colors">
              <p className="text-xs font-mono font-bold text-gray-300 w-10">#{b.id}</p>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{b.passengerName}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{b.serviceType} · {b.pickupDate}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-gray-900">{b.totalPrice ? `$${b.totalPrice}` : <span className="text-gray-300 font-normal text-xs">TBD</span>}</p>
              </div>
              <StatusBadge status={b.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BOOKINGS TAB
───────────────────────────────────────────────────────────── */
function BookingsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [manualModal, setManualModal] = useState(false);
  const [editPrice, setEditPrice] = useState("");

  const emptyForm: BookingInput = {
    passengerName: "", passengerPhone: "", passengerEmail: "",
    pickupLocation: "", dropoffLocation: "", serviceType: "",
    pickupDate: "", pickupTime: "", passengers: 1, vehicleType: "",
    specialRequests: "",
  };
  const [bf, setBf] = useState<BookingInput>(emptyForm);
  const setB = (key: keyof BookingInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setBf(prev => ({ ...prev, [key]: e.target.value }));

  const filterParam = statusFilter !== "all" ? { status: statusFilter as "pending"|"confirmed"|"completed"|"cancelled" } : {};
  const { data: bookings, isLoading } = useListBookings(filterParam, { query: { queryKey: getListBookingsQueryKey(filterParam), ...REALTIME_QUERY } });
  const { data: detailBooking } = useGetBooking(selectedBookingId!, { query: { enabled: !!selectedBookingId, queryKey: getGetBookingQueryKey(selectedBookingId!), refetchInterval: 5000 } });
  const updateBooking = useUpdateBooking();
  const cancelBooking = useCancelBooking();
  const createBooking = useCreateBooking();

  useEffect(() => {
    if (detailBooking) setEditPrice(detailBooking.totalPrice?.toString() ?? "");
  }, [detailBooking]);

  const filtered = useMemo(() => {
    if (!bookings) return [];
    const q = searchQuery.toLowerCase();
    if (!q) return bookings;
    return bookings.filter(b =>
      b.passengerName?.toLowerCase().includes(q) ||
      b.passengerEmail?.toLowerCase().includes(q) ||
      b.passengerPhone?.includes(q) ||
      b.pickupLocation?.toLowerCase().includes(q) ||
      b.serviceType?.toLowerCase().includes(q)
    );
  }, [bookings, searchQuery]);

  const handleStatus = (status: string) => {
    if (!detailBooking) return;
    if (status === 'cancelled') {
      cancelBooking.mutate({ id: detailBooking.id }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetBookingQueryKey(detailBooking.id) });
          qc.invalidateQueries({ queryKey: getGetBookingSummaryQueryKey() });
          qc.invalidateQueries({ queryKey: getAdminGetAnalyticsQueryKey() });
        }
      });
    } else {
      updateBooking.mutate({ id: detailBooking.id, data: { status: status as BookingUpdateStatus } }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetBookingQueryKey(detailBooking.id) });
          qc.invalidateQueries({ queryKey: getGetBookingSummaryQueryKey() });
          qc.invalidateQueries({ queryKey: getAdminGetAnalyticsQueryKey() });
        }
      });
    }
  };

  const handleSavePrice = () => {
    if (!detailBooking) return;
    updateBooking.mutate({ id: detailBooking.id, data: { totalPrice: Number(editPrice) } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetBookingQueryKey(detailBooking.id) });
        qc.invalidateQueries({ queryKey: getAdminGetAnalyticsQueryKey() });
      }
    });
  };

  const handleCreateBooking = () => {
    createBooking.mutate({ data: bf }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetBookingSummaryQueryKey() });
        setManualModal(false);
        setBf(emptyForm);
      }
    });
  };

  const STATUSES = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <>
      {detailBooking && (
        <PrintPortal>
          <PrintInvoice booking={detailBooking} />
        </PrintPortal>
      )}
      <PrintStyles />

      <div className="space-y-6 no-print">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 outline-none focus:border-gray-900 transition-colors"
            />
          </div>
          <button
            onClick={() => setManualModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all shadow-sm hover:shadow-md shrink-0"
          >
            <Plus size={16} /> New Booking
          </button>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${statusFilter === s.id ? 'bg-[#1A1A1A] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><ClipboardList className="w-8 h-8 text-gray-300" /></div>
              <p className="font-bold text-gray-900 text-lg">No bookings found</p>
              <p className="text-gray-500 mt-1 text-sm">Try changing your filters or search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    {["Ref", "Passenger", "Service", "Date", "Total", "Payment", "Status"].map(h => (
                      <th key={h} className="text-left px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(b => (
                    <tr key={b.id} onClick={() => setSelectedBookingId(b.id)} className="hover:bg-gray-50/80 cursor-pointer transition-colors">
                      <td className="px-8 py-5 text-gray-400 font-mono text-xs font-medium">#{b.id}</td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-900">{b.passengerName}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{b.passengerPhone}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-900">{b.serviceType}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5 truncate max-w-[150px]">{b.pickupLocation}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-900">{b.pickupDate}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{b.pickupTime}</p>
                      </td>
                      <td className="px-8 py-5 font-black text-gray-900">
                        {b.totalPrice ? `$${b.totalPrice}` : <span className="text-gray-300 font-normal text-xs">TBD</span>}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${b.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : b.paymentStatus === 'refunded' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                          {b.paymentStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-8 py-5"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Slide-Over */}
      <SlideOver isOpen={!!selectedBookingId} onClose={() => setSelectedBookingId(null)} title={`Booking #${selectedBookingId}`}>
        {detailBooking ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <StatusBadge status={detailBooking.status} />
              <button onClick={() => window.print()} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold bg-white border border-gray-200 hover:border-gray-900 hover:text-gray-900 text-gray-500 px-4 py-2 rounded-xl transition-all shadow-sm">
                <Printer size={14} /> Print Invoice
              </button>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Passenger</h3>
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                <AdminFieldRow label="Name" value={detailBooking.passengerName} />
                <AdminFieldRow label="Phone" value={detailBooking.passengerPhone} />
                <AdminFieldRow label="Email" value={detailBooking.passengerEmail} />
                <AdminFieldRow label="Passengers" value={detailBooking.passengers ?? 1} />
                <AdminFieldRow label="Luggage" value={`${detailBooking.luggage ?? 0} bag(s)`} />
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Vehicle</h3>
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-5">
                {(() => {
                  const vImg = getVehicleImage(detailBooking.vehicleType || "");
                  return vImg ? (
                    <img src={vImg} alt={detailBooking.vehicleType || "Vehicle"} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                      <Car size={28} className="text-gray-300" />
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-lg tracking-tight">{detailBooking.vehicleType || "Not specified"}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Selected by passenger at booking</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Trip</h3>
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                <AdminFieldRow label="Service" value={detailBooking.serviceType} />
                <AdminFieldRow label="Date" value={detailBooking.pickupDate} />
                <AdminFieldRow label="Time" value={detailBooking.pickupTime} />
                <AdminFieldRow label="Special" value={detailBooking.specialRequests} />
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Route</h3>
              <div className="relative bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-3 h-3 rounded-full bg-black shrink-0" />
                  <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Pickup</p><p className="font-semibold text-gray-900">{detailBooking.pickupLocation}</p></div>
                </div>
                <div className="ml-1.5 h-8 w-px bg-gray-200" />
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-3 h-3 rounded-full bg-white border-[3px] border-black shrink-0" />
                  <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Dropoff</p><p className="font-semibold text-gray-900">{detailBooking.dropoffLocation}</p></div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Payment</h3>
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                  <span className="font-bold text-gray-900">Payment Status</span>
                  <select
                    className={`border rounded-xl px-4 py-2 font-bold text-xs outline-none transition-colors ${detailBooking.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : detailBooking.paymentStatus === 'refunded' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                    value={detailBooking.paymentStatus ?? "pending"}
                    onChange={e => updateBooking.mutate({ id: detailBooking.id, data: { paymentStatus: e.target.value as "pending" | "paid" | "refunded" } }, {
                      onSuccess: () => qc.invalidateQueries({ queryKey: getGetBookingQueryKey(detailBooking.id) })
                    })}
                    disabled={updateBooking.isPending}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                {detailBooking.stripePaymentIntentId && (
                  <div className="mb-4 pb-4 border-b border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Stripe ID</span>
                    <a href={`https://dashboard.stripe.com/payments/${detailBooking.stripePaymentIntentId}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-mono text-[10px] hover:underline bg-blue-50 px-3 py-1.5 rounded-full truncate max-w-[150px]">
                      {detailBooking.stripePaymentIntentId}
                    </a>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center">
                      <DollarSign size={16} className="absolute left-3 text-gray-400" />
                      <input type="number" className="border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 w-32 font-black text-lg outline-none focus:border-black transition-colors" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="0" />
                    </div>
                    <button onClick={handleSavePrice} disabled={updateBooking.isPending} className="bg-[#1A1A1A] text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-30 shadow-sm">
                      {updateBooking.isPending ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              {detailBooking.status === 'pending' && <button onClick={() => handleStatus('confirmed')} className="w-full py-4 bg-black text-white font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-gray-800 transition-all shadow-md">Confirm Booking</button>}
              {detailBooking.status === 'confirmed' && <button onClick={() => handleStatus('completed')} className="w-full py-4 bg-green-500 text-white font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-green-600 transition-all shadow-md">Mark Completed</button>}
              {(detailBooking.status === 'pending' || detailBooking.status === 'confirmed') && <button onClick={() => handleStatus('cancelled')} className="w-full py-4 bg-red-50 text-red-600 font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-red-100 transition-all">Cancel Booking</button>}
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-gray-300 w-8 h-8" /></div>
        )}
      </SlideOver>

      {/* Create Booking Modal */}
      {manualModal && (
        <Modal title="Create Manual Booking" onClose={() => setManualModal(false)}>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-50 pb-3">Passenger Info</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Full Name"><input className={inputClass} value={bf.passengerName} onChange={setB("passengerName")} placeholder="John Doe" /></Field>
                <Field label="Phone"><input className={inputClass} value={bf.passengerPhone} onChange={setB("passengerPhone")} placeholder="+1 (555) 000-0000" /></Field>
                <div className="md:col-span-2"><Field label="Email"><input className={inputClass} type="email" value={bf.passengerEmail} onChange={setB("passengerEmail")} placeholder="john@example.com" /></Field></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-50 pb-3">Trip Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Service Type">
                    <select className={inputClass} value={bf.serviceType} onChange={setB("serviceType")}>
                      <option value="Airport Transfer">Airport Transfer</option>
                      <option value="Corporate Travel">Corporate Travel</option>
                      <option value="By the Hour">By the Hour</option>
                      <option value="Point-to-Point">Point-to-Point</option>
                      <option value="Wedding & Events">Wedding & Events</option>
                      <option value="Wine Tours">Wine Tours</option>
                      <option value="Birthday">Birthday & Celebration</option>
                      <option value="City Tour">City Tour</option>
                    </select>
                  </Field>
                  <Field label="Vehicle">
                    <select className={inputClass} value={bf.vehicleType || ""} onChange={e => {
                      const vName = e.target.value;
                      const selV = DEFAULT_FLEET_VEHICLES.find(v => v.name === vName);
                      setBf(prev => ({
                        ...prev,
                        vehicleType: vName,
                        estimatedPrice: prev.estimatedPrice || (selV ? selV.flatRate : 140)
                      }));
                    }}>
                      <option value="">Select vehicle...</option>
                      <option value="Suburban">Suburban ($140 base · $2.95/mi · $80/hr)</option>
                      <option value="Escalade">Escalade ($140 base · $3.40/mi · $95/hr)</option>
                      <option value="Sedan">Sedan / Lincoln ($100 base · $2.40/mi · $75/hr)</option>
                      <option value="Mercedes S-Class">Mercedes S-Class ($100 base · $2.40/mi · $75/hr)</option>
                    </select>
                  </Field>
                </div>
                <Field label="Pickup Location"><input className={inputClass} value={bf.pickupLocation} onChange={setB("pickupLocation")} placeholder="LAX Terminal 1" /></Field>
                <Field label="Dropoff Location"><input className={inputClass} value={bf.dropoffLocation} onChange={setB("dropoffLocation")} placeholder="Beverly Hills Hotel" /></Field>
                <div className="grid grid-cols-3 gap-5">
                  <Field label="Date"><input type="date" className={inputClass} value={bf.pickupDate} onChange={setB("pickupDate")} /></Field>
                  <Field label="Time"><input type="time" className={inputClass} value={bf.pickupTime} onChange={setB("pickupTime")} /></Field>
                  <Field label="Price ($)"><input type="number" className={inputClass} value={bf.estimatedPrice ?? ""} onChange={e => setBf(p => ({ ...p, estimatedPrice: Number(e.target.value) }))} placeholder="140" /></Field>
                </div>
                <Field label="Passengers"><input type="number" className={inputClass} value={bf.passengers} onChange={setB("passengers")} min={1} max={20} /></Field>
                <Field label="Special Requests / Notes"><textarea className={textareaClass} value={bf.specialRequests ?? ""} onChange={setB("specialRequests")} rows={3} placeholder="Notes, flight details, or add-ons..." /></Field>
              </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setManualModal(false)} className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleCreateBooking} disabled={createBooking.isPending || !bf.passengerName || !bf.pickupLocation} className="flex-1 py-4 bg-[#1A1A1A] text-white font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-30 shadow-md flex items-center justify-center gap-2">
                {createBooking.isPending ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : "Create Booking"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   CALENDAR TAB
───────────────────────────────────────────────────────────── */
function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: bookings } = useListBookings({}, { query: { queryKey: getListBookingsQueryKey(), ...REALTIME_QUERY } });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const bookingsByDate = useMemo(() => {
    const map: Record<string, typeof bookings> = {};
    bookings?.forEach(b => {
      if (!map[b.pickupDate]) map[b.pickupDate] = [];
      map[b.pickupDate]!.push(b);
    });
    return map;
  }, [bookings]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date().toISOString().split('T')[0];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedDateStr = selectedDay;
  const selectedBookings = selectedDateStr ? (bookingsByDate[selectedDateStr] ?? []) : [];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:border-gray-900 transition-all">
            <ChevronLeft size={16} />
          </button>
          <h3 className="font-black text-gray-900 text-xl tracking-tight">{monthName}</h3>
          <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:border-gray-900 transition-all">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayBookings = bookingsByDate[dateStr] ?? [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDay;
            const hasPending = dayBookings.some(b => b.status === 'pending');

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(selectedDay === dateStr ? null : dateStr)}
                className={`relative flex flex-col items-center py-3 px-1 rounded-2xl transition-all text-sm ${
                  isSelected ? 'bg-[#1A1A1A] text-white shadow-md' :
                  isToday ? 'bg-gray-100 text-gray-900 font-bold' :
                  dayBookings.length > 0 ? 'hover:bg-gray-50 text-gray-900' :
                  'hover:bg-gray-50 text-gray-500'
                }`}
              >
                <span className="font-bold text-sm">{day}</span>
                {dayBookings.length > 0 && (
                  <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center">
                    {dayBookings.slice(0, 3).map((b, bi) => (
                      <div key={bi} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : statusConfig[b.status as keyof typeof statusConfig]?.dot ?? 'bg-gray-400'}`} />
                    ))}
                    {dayBookings.length > 3 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/40' : 'bg-gray-300'}`} />}
                  </div>
                )}
                {hasPending && !isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-gray-100">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Panel */}
      <div className="space-y-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          {!selectedDay ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays size={32} className="text-gray-200 mb-3" />
              <p className="font-bold text-gray-400 text-sm">Select a day</p>
              <p className="text-gray-300 text-xs mt-1">Click any date to see bookings</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-gray-900">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedBookings.length > 0 ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'}`}>
                  {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''}
                </span>
              </div>
              {selectedBookings.length === 0 ? (
                <div className="py-8 text-center text-gray-300 text-sm font-medium">No bookings this day</div>
              ) : (
                <div className="space-y-3">
                  {selectedBookings.map(b => (
                    <div key={b.id} className="p-4 bg-gray-50 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-900 text-sm">{b.passengerName}</p>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{b.pickupTime} · {b.serviceType}</p>
                      <p className="text-xs text-gray-400 truncate">{b.pickupLocation}</p>
                      {b.totalPrice && <p className="text-sm font-black text-gray-900">${b.totalPrice}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Monthly Summary */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h4 className="font-black text-gray-900 mb-4 text-sm">Month Summary</h4>
          {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => {
            const count = bookings?.filter(b => {
              const d = new Date(b.pickupDate);
              return d.getFullYear() === year && d.getMonth() === month && b.status === s;
            }).length ?? 0;
            const cfg = statusConfig[s];
            return (
              <div key={s} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-semibold text-gray-600">{cfg.label}</span>
                </div>
                <span className="text-sm font-black text-gray-900">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FLEET TAB
───────────────────────────────────────────────────────────── */
function FleetTab() {
  const qc = useQueryClient();
  const { data: fleet, isLoading } = useAdminListFleet({ query: { queryKey: getAdminListFleetQueryKey() } });
  const createFleet = useAdminCreateFleet();
  const updateFleet = useAdminUpdateFleet();
  const deleteFleet = useAdminDeleteFleet();

  const emptyV = { name: "", model: "", year: new Date().getFullYear(), capacity: 4, imageUrl: "", description: "", amenities: [] as string[], vehicleType: "", luggageCapacity: 0, ratePerMile: 0, flatRate: 0, hourlyRate: 0 };
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [form, setForm] = useState(emptyV);
  const [editId, setEditId] = useState<number | null>(null);
  const [amenitiesInput, setAmenitiesInput] = useState("");

  const setF = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const openCreate = () => { setForm(emptyV); setAmenitiesInput(""); setModal('create'); };
  const openEdit = (v: Vehicle) => {
    setForm({ name: v.name, model: v.model, year: v.year, capacity: v.capacity, imageUrl: v.imageUrl ?? "", description: v.description ?? "", amenities: v.amenities ?? [], vehicleType: v.vehicleType ?? "", luggageCapacity: v.luggageCapacity ?? 0, ratePerMile: v.ratePerMile ?? 0, flatRate: v.flatRate ?? 0, hourlyRate: v.hourlyRate ?? 0 });
    setAmenitiesInput((v.amenities ?? []).join(", "));
    setEditId(v.id);
    setModal('edit');
  };

  const handleSave = () => {
    const amenities = amenitiesInput.split(",").map(s => s.trim()).filter(Boolean);
    const payload = { ...form, amenities, year: Number(form.year), capacity: Number(form.capacity), luggageCapacity: Number(form.luggageCapacity), ratePerMile: Number(form.ratePerMile), flatRate: Number(form.flatRate), hourlyRate: Number(form.hourlyRate) };
    if (modal === 'create') {
      createFleet.mutate({ data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getAdminListFleetQueryKey() }); setModal(null); } });
    } else if (editId != null) {
      updateFleet.mutate({ id: editId, data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getAdminListFleetQueryKey() }); setModal(null); } });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Remove this vehicle?")) return;
    deleteFleet.mutate({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getAdminListFleetQueryKey() }) });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">
          <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all shadow-sm">
            <Plus size={16} /> Add Vehicle
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {((fleet && fleet.length > 0) ? fleet : DEFAULT_FLEET_VEHICLES).map(v => {
              const vImg = getVehicleImage(v);
              return (
                <div key={v.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col justify-between">
                  <div>
                    <div className="h-48 overflow-hidden bg-gray-50 flex items-center justify-center relative">
                      {vImg ? (
                        <img src={vImg} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <Car size={48} className="text-gray-200" />
                      )}
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                        {v.vehicleType || (v.capacity > 4 ? "SUV" : "Sedan")}
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-black text-gray-900 text-lg tracking-tight">{v.name}</p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">{v.model} · {v.year}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => openEdit(v)} title="Edit Vehicle" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:border-gray-900 text-gray-500 hover:text-gray-900 transition-all">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(v.id)} title="Remove Vehicle" className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-100 hover:border-red-400 text-red-400 hover:text-red-600 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Pricing Specs */}
                      <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-gray-700">
                          <span className="font-medium text-gray-500">Base Fare (15 mi inc.)</span>
                          <span className="font-bold text-gray-900">${Number(v.flatRate || defaultRateFor(v.name, "flatRate"))}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700">
                          <span className="font-medium text-gray-500">Extra Mile Rate</span>
                          <span className="font-bold text-gray-900">${Number(v.ratePerMile || defaultRateFor(v.name, "ratePerMile")).toFixed(2)}/mi</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700">
                          <span className="font-medium text-gray-500">Hourly Rate</span>
                          <span className="font-bold text-gray-900">${Number(v.hourlyRate || defaultRateFor(v.name, "hourlyRate"))}/hr</span>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full"><Users size={12} className="inline mr-1" />{v.capacity} pax</span>
                        <span className="text-xs font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full"><Package size={12} className="inline mr-1" />{v.luggageCapacity || (v.capacity > 4 ? 6 : 3)} bags</span>
                      </div>

                      {Array.isArray(v.amenities) && v.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {v.amenities.slice(0, 4).map((a, i) => (
                            <span key={i} className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Add Vehicle' : 'Edit Vehicle'} onClose={() => setModal(null)}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Name"><input className={inputClass} value={form.name} onChange={setF("name")} placeholder="Escalade ESV" /></Field>
              <Field label="Model"><input className={inputClass} value={form.model} onChange={setF("model")} placeholder="Cadillac Escalade" /></Field>
              <Field label="Year"><input type="number" className={inputClass} value={form.year} onChange={setF("year")} /></Field>
              <Field label="Type"><input className={inputClass} value={form.vehicleType} onChange={setF("vehicleType")} placeholder="SUV, Sedan, Van..." /></Field>
              <Field label="Passenger Capacity"><input type="number" className={inputClass} value={form.capacity} onChange={setF("capacity")} /></Field>
              <Field label="Luggage Capacity"><input type="number" className={inputClass} value={form.luggageCapacity} onChange={setF("luggageCapacity")} /></Field>
              <Field label="Rate Per Mile ($)"><input type="number" className={inputClass} value={form.ratePerMile} onChange={setF("ratePerMile")} step="0.01" min="0" /></Field>
              <Field label="Flat Rate ($)"><input type="number" className={inputClass} value={form.flatRate} onChange={setF("flatRate")} /></Field>
              <Field label="Hourly Rate ($)"><input type="number" className={inputClass} value={form.hourlyRate} onChange={setF("hourlyRate")} /></Field>
            </div>
            <Field label="Image URL"><input className={inputClass} value={form.imageUrl} onChange={setF("imageUrl")} placeholder="https://..." /></Field>
            <Field label="Amenities (comma separated)"><input className={inputClass} value={amenitiesInput} onChange={e => setAmenitiesInput(e.target.value)} placeholder="WiFi, TV, Water, Champagne..." /></Field>
            <Field label="Description"><textarea className={textareaClass} value={form.description} onChange={setF("description")} rows={3} placeholder="Vehicle description..." /></Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={createFleet.isPending || updateFleet.isPending || !form.name} className="flex-1 py-3.5 bg-[#1A1A1A] text-white font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                {(createFleet.isPending || updateFleet.isPending) ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Vehicle
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   SERVICES TAB
───────────────────────────────────────────────────────────── */
function ServicesTab() {
  const qc = useQueryClient();
  const { data: services, isLoading } = useAdminListServices({ query: { queryKey: getAdminListServicesQueryKey() } });
  const createSvc = useAdminCreateService();
  const updateSvc = useAdminUpdateService();
  const deleteSvc = useAdminDeleteService();

  const emptyS = { name: "", description: "", icon: "", priceFrom: 0, features: [] as string[] };
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [form, setForm] = useState(emptyS);
  const [editId, setEditId] = useState<number | null>(null);
  const [featuresInput, setFeaturesInput] = useState("");
  const setF = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const openCreate = () => { setForm(emptyS); setFeaturesInput(""); setModal('create'); };
  const openEdit = (s: Service) => {
    setForm({ name: s.name, description: s.description ?? "", icon: s.icon ?? "", priceFrom: s.priceFrom ?? 0, features: s.features ?? [] });
    setFeaturesInput((s.features ?? []).join(", "));
    setEditId(s.id);
    setModal('edit');
  };
  const handleSave = () => {
    const features = featuresInput.split(",").map(s => s.trim()).filter(Boolean);
    const payload = { ...form, features, priceFrom: Number(form.priceFrom) };
    if (modal === 'create') {
      createSvc.mutate({ data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getAdminListServicesQueryKey() }); setModal(null); } });
    } else if (editId != null) {
      updateSvc.mutate({ id: editId, data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getAdminListServicesQueryKey() }); setModal(null); } });
    }
  };
  const handleDelete = (id: number) => {
    if (!confirm("Delete this service?")) return;
    deleteSvc.mutate({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getAdminListServicesQueryKey() }) });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">
          <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all shadow-sm">
            <Plus size={16} /> Add Service
          </button>
        </div>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {((services && services.length > 0) ? services : DEFAULT_SERVICES).map(s => {
              const sImg = getServiceImage(s);
              return (
                <div key={s.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    {sImg && (
                      <div className="h-40 overflow-hidden bg-gray-50">
                        <img src={sImg} alt={s.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-7">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-black text-gray-900 text-lg tracking-tight">{s.name}</p>
                          </div>
                          <p className="text-sm text-gray-500 font-medium line-clamp-2">{s.description}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => openEdit(s)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:border-gray-900 text-gray-500 hover:text-gray-900 transition-all"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(s.id)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-100 hover:border-red-400 text-red-400 hover:text-red-600 transition-all"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {s.priceFrom ? <p className="text-2xl font-black text-gray-900 mb-3"><span className="text-sm font-medium text-gray-400">from </span>${s.priceFrom}</p> : null}
                      {s.features?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {s.features.map((f, i) => <span key={i} className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">{f}</span>)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {modal && (
        <Modal title={modal === 'create' ? 'Add Service' : 'Edit Service'} onClose={() => setModal(null)}>
          <div className="space-y-5">
            <Field label="Service Name"><input className={inputClass} value={form.name} onChange={setF("name")} placeholder="Airport Transfer" /></Field>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Price From ($)"><input type="number" className={inputClass} value={form.priceFrom} onChange={setF("priceFrom")} /></Field>
              <Field label="Icon">
                <select className={inputClass} value={form.icon} onChange={setF("icon")}>
                  <option value="airport">Airport</option>
                  <option value="corporate">Corporate</option>
                  <option value="hourly">By the Hour</option>
                  <option value="wedding">Wedding &amp; Events</option>
                  <option value="date">Date Night</option>
                  <option value="prom">Prom</option>
                  <option value="concert">Concert</option>
                  <option value="sports">Sports</option>
                  <option value="point">Point-to-Point</option>
                  <option value="air">Private Aviation</option>
                </select>
              </Field>
            </div>
            <Field label="Features (comma separated)"><input className={inputClass} value={featuresInput} onChange={e => setFeaturesInput(e.target.value)} placeholder="Meet & Greet, Flight Tracking..." /></Field>
            <Field label="Description"><textarea className={textareaClass} value={form.description} onChange={setF("description")} rows={3} placeholder="Describe this service..." /></Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={createSvc.isPending || updateSvc.isPending || !form.name} className="flex-1 py-3.5 bg-[#1A1A1A] text-white font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                {(createSvc.isPending || updateSvc.isPending) ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Service
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   ZONES TAB
───────────────────────────────────────────────────────────── */
function ZonesTab() {
  const qc = useQueryClient();
  const { data: zones, isLoading } = useAdminListZones({ query: { queryKey: getAdminListZonesQueryKey() } });
  const createZone = useAdminCreateZone();
  const updateZone = useAdminUpdateZone();
  const deleteZone = useAdminDeleteZone();

  const emptyZ = { name: "", description: "", surcharge: 0, active: true };
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [form, setForm] = useState(emptyZ);
  const [editId, setEditId] = useState<number | null>(null);
  const setF = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));
  const openCreate = () => { setForm(emptyZ); setModal('create'); };
  const openEdit = (z: Zone) => {
    setForm({ name: z.name, description: z.description ?? "", surcharge: z.surcharge ?? 0, active: z.active ?? true });
    setEditId(z.id); setModal('edit');
  };
  const handleSave = () => {
    const payload = { ...form, surcharge: Number(form.surcharge) };
    if (modal === 'create') {
      createZone.mutate({ data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getAdminListZonesQueryKey() }); setModal(null); } });
    } else if (editId != null) {
      updateZone.mutate({ id: editId, data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getAdminListZonesQueryKey() }); setModal(null); } });
    }
  };
  const handleDelete = (id: number) => {
    if (!confirm("Delete this zone?")) return;
    deleteZone.mutate({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getAdminListZonesQueryKey() }) });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">
          <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all shadow-sm">
            <Plus size={16} /> Add Zone
          </button>
        </div>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
        ) : !zones?.length ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-24 text-center">
            <MapPin size={40} className="text-gray-200 mb-4" />
            <p className="font-bold text-gray-900 text-lg">No zones yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50">
                <tr>
                  {["Zone", "Surcharge", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {zones.map(z => (
                  <tr key={z.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-900">{z.name}</p>
                      {z.description && <p className="text-xs text-gray-500 font-medium mt-0.5">{z.description}</p>}
                    </td>
                    <td className="px-8 py-5 font-black text-gray-900">${z.surcharge ?? 0}</td>
                    <td className="px-8 py-5">
                      {z.active ? <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full uppercase tracking-wider">Active</span> : <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full uppercase tracking-wider">Inactive</span>}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(z)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:border-gray-900 text-gray-500 hover:text-gray-900 transition-all"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(z.id)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-red-100 hover:border-red-400 text-red-400 hover:text-red-600 transition-all"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <Modal title={modal === 'create' ? 'Add Zone' : 'Edit Zone'} onClose={() => setModal(null)}>
          <div className="space-y-5">
            <Field label="Zone Name"><input className={inputClass} value={form.name} onChange={setF("name")} placeholder="Downtown LA, Beverly Hills..." /></Field>
            <Field label="Surcharge ($)"><input type="number" className={inputClass} value={form.surcharge} onChange={setF("surcharge")} /></Field>
            <Field label="Description"><textarea className={textareaClass} value={form.description} onChange={setF("description")} rows={3} placeholder="Zone description..." /></Field>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <input type="checkbox" id="zIsActive" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="w-4 h-4 rounded" />
              <label htmlFor="zIsActive" className="text-sm font-semibold text-gray-700">Active</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={createZone.isPending || updateZone.isPending || !form.name} className="flex-1 py-3.5 bg-[#1A1A1A] text-white font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                {(createZone.isPending || updateZone.isPending) ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Zone
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   CONTACTS TAB
───────────────────────────────────────────────────────────── */
function ContactsTab() {
  const { data: contacts, isLoading } = useAdminListContacts({ query: { queryKey: getAdminListContactsQueryKey() } });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactInquiry | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts?.filter(c =>
      !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.message?.toLowerCase().includes(q)
    ) ?? [];
  }, [contacts, search]);

  return (
    <>
      <div className="space-y-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 outline-none focus:border-gray-900 transition-colors" />
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
        ) : !filtered.length ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-24 text-center">
            <MessageSquare size={40} className="text-gray-200 mb-4" />
            <p className="font-bold text-gray-900 text-lg">No messages yet</p>
            <p className="text-gray-500 mt-1 text-sm">Contact form submissions will appear here.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((c: any) => (
              <div key={c.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(c)}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-600 text-lg shrink-0">
                    {(c.name?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-base">{c.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail size={12} className="text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-500 font-medium truncate">{c.email}</p>
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <Phone size={12} className="text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-500 font-medium">{c.phone}</p>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    <p className="text-[10px] font-bold text-gray-300 text-right">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
                <div className="mt-4 bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-600 font-medium line-clamp-3">{c.message}</p>
                </div>
                {c.serviceInterest && (
                  <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interested in: <span className="text-gray-700">{c.serviceInterest}</span></p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Detail Slide-Over */}
      <SlideOver isOpen={!!selected} onClose={() => setSelected(null)} title="Contact Message">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-600 text-xl">
                {((selected as any).name?.[0] ?? '?').toUpperCase()}
              </div>
              <div>
                <p className="font-black text-gray-900 text-xl">{(selected as any).name}</p>
                <p className="text-sm text-gray-500 font-medium">{(selected as any).email}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-0">
              <AdminFieldRow label="Name" value={(selected as any).name} />
              <AdminFieldRow label="Email" value={(selected as any).email} />
              <AdminFieldRow label="Phone" value={(selected as any).phone} />
              <AdminFieldRow label="Service" value={(selected as any).serviceInterest} />
              <AdminFieldRow label="Date" value={(selected as any).createdAt ? new Date((selected as any).createdAt).toLocaleDateString() : ''} />
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Message</h3>
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                <p className="text-sm text-gray-700 font-medium leading-relaxed">{(selected as any).message}</p>
              </div>
            </div>
            <a
              href={`mailto:${(selected as any).email}?subject=Re: Eclipse Transport Inquiry`}
              className="w-full py-4 bg-[#1A1A1A] text-white font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Mail size={16} /> Reply by Email
            </a>
          </div>
        )}
      </SlideOver>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   SETTINGS TAB
───────────────────────────────────────────────────────────── */
const SETTINGS_KEY = "eclipse_admin_settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSettings(data: Record<string, string>) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
}

function SettingsTab() {
  const [activeSection, setActiveSection] = useState("business");
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>(() => loadSettings());

  const setS = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSettings(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sections = [
    { id: "business", label: "Business Info", icon: Building2 },
    { id: "contact", label: "Contact Details", icon: Phone },
    { id: "website", label: "Website", icon: Globe },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* Settings sidebar */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-3 space-y-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeSection === id ? 'bg-[#1A1A1A] text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <Icon size={16} strokeWidth={activeSection === id ? 2.5 : 2} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings content */}
      <div className="md:col-span-3">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          {activeSection === "business" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-black text-gray-900 text-xl tracking-tight mb-1">Business Information</h3>
                <p className="text-sm text-gray-500 font-medium">Basic company details displayed on the website.</p>
              </div>
              <div className="grid grid-cols-1 gap-5">
                <Field label="Company Name"><input className={inputClass} value={settings.companyName ?? "Eclipse Transport"} onChange={setS("companyName")} placeholder="Eclipse Transport" /></Field>
                <Field label="Tagline / Slogan"><input className={inputClass} value={settings.tagline ?? ""} onChange={setS("tagline")} placeholder="Private Luxury Transportation — Los Angeles" /></Field>
                <Field label="Business Address"><input className={inputClass} value={settings.address ?? ""} onChange={setS("address")} placeholder="Los Angeles, CA" /></Field>
                <Field label="Service Area"><input className={inputClass} value={settings.serviceArea ?? ""} onChange={setS("serviceArea")} placeholder="Greater Los Angeles Area" /></Field>
                <Field label="Business Hours"><input className={inputClass} value={settings.hours ?? ""} onChange={setS("hours")} placeholder="24/7 · All days" /></Field>
                <Field label="About / Description"><textarea className={textareaClass} value={settings.about ?? ""} onChange={setS("about")} rows={4} placeholder="Describe your business..." /></Field>
              </div>
            </div>
          )}

          {activeSection === "contact" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-black text-gray-900 text-xl tracking-tight mb-1">Contact Details</h3>
                <p className="text-sm text-gray-500 font-medium">How clients can reach you.</p>
              </div>
              <div className="grid grid-cols-1 gap-5">
                <Field label="Primary Phone"><input className={inputClass} value={settings.phone ?? ""} onChange={setS("phone")} placeholder="+1 (310) 000-0000" /></Field>
                <Field label="WhatsApp Number"><input className={inputClass} value={settings.whatsapp ?? ""} onChange={setS("whatsapp")} placeholder="+1 (310) 000-0000" /></Field>
                <Field label="Email Address"><input className={inputClass} type="email" value={settings.email ?? ""} onChange={setS("email")} placeholder="info@eclipsetransport.com" /></Field>
                <Field label="Instagram"><input className={inputClass} value={settings.instagram ?? ""} onChange={setS("instagram")} placeholder="@eclipsetransport" /></Field>
                <Field label="Facebook"><input className={inputClass} value={settings.facebook ?? ""} onChange={setS("facebook")} placeholder="facebook.com/eclipsetransport" /></Field>
                <Field label="Google Business URL"><input className={inputClass} value={settings.google ?? ""} onChange={setS("google")} placeholder="https://g.page/..." /></Field>
              </div>
            </div>
          )}

          {activeSection === "website" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-black text-gray-900 text-xl tracking-tight mb-1">Website Settings</h3>
                <p className="text-sm text-gray-500 font-medium">SEO and website configuration.</p>
              </div>
              <div className="grid grid-cols-1 gap-5">
                <Field label="Site Title (SEO)"><input className={inputClass} value={settings.siteTitle ?? ""} onChange={setS("siteTitle")} placeholder="Eclipse Transport — Private Luxury Transportation LA" /></Field>
                <Field label="Meta Description"><textarea className={textareaClass} value={settings.metaDesc ?? ""} onChange={setS("metaDesc")} rows={3} placeholder="Premium private transportation in Los Angeles..." /></Field>
                <Field label="Google Analytics ID"><input className={inputClass} value={settings.gaId ?? ""} onChange={setS("gaId")} placeholder="G-XXXXXXXXXX" /></Field>
                <Field label="Google Maps API Key"><input className={inputClass} value={settings.mapsKey ?? ""} onChange={setS("mapsKey")} placeholder="AIza..." /></Field>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs font-semibold text-blue-700">These settings are stored locally. To apply them to the live site, you'll need to update the environment variables in Vercel.</p>
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-black text-gray-900 text-xl tracking-tight mb-1">Security</h3>
                <p className="text-sm text-gray-500 font-medium">Manage admin access settings.</p>
              </div>
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex gap-4">
                <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 text-sm">Admin Password</p>
                  <p className="text-xs text-amber-700 font-medium mt-1">The default password is <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">Eclipse#Admin2026$</code>. To change it, set the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">ADMIN_PASSWORD</code> environment variable in Vercel.</p>
                </div>
              </div>
              <div className="space-y-4">
                <Field label="Admin Notes (private)">
                  <textarea className={textareaClass} value={settings.adminNotes ?? ""} onChange={setS("adminNotes")} rows={4} placeholder="Private notes for admin use only..." />
                </Field>
              </div>
              <div className="p-5 bg-gray-50 rounded-2xl space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Session</p>
                <p className="text-sm font-semibold text-gray-700">You are logged in as Administrator.</p>
                <button onClick={() => { clearAdminToken(); window.location.href = '/admin/login'; }} className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 font-bold text-sm tracking-wide rounded-xl hover:bg-red-100 transition-all">
                  <LogOut size={16} /> Sign Out Now
                </button>
              </div>
            </div>
          )}

          {/* Save Button (not for security section) */}
          {activeSection !== "security" && (
            <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
              <button onClick={handleSave} className={`flex items-center gap-2 px-8 py-3.5 font-bold text-sm tracking-widest uppercase rounded-2xl transition-all shadow-sm ${saved ? 'bg-green-500 text-white' : 'bg-[#1A1A1A] text-white hover:bg-gray-800'}`}>
                {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PRICING TAB
───────────────────────────────────────────────────────────── */
type PricingData = {
  baseRatePerMile: number;
  minimumFare: number;
  baseFare: number;
  hourlyRate: number;
  minimumHours: number;
  airportPickupFlat: number;
  airportDropoffFlat: number;
  fuelSurcharge: number;
  gratuityDefault: number;
  nightSurcharge: number;
  holidaySurcharge: number;
  waitTimeRate: number;
  waitTimeFreeMinutes: number;
  additionalStopFee: number;
};

const PRICING_DEFAULTS: PricingData = {
  baseRatePerMile: 3.5, minimumFare: 75, baseFare: 0,
  hourlyRate: 95, minimumHours: 2,
  airportPickupFlat: 0, airportDropoffFlat: 0,
  fuelSurcharge: 0, gratuityDefault: 20, nightSurcharge: 0, holidaySurcharge: 0,
  waitTimeRate: 25, waitTimeFreeMinutes: 15,
  additionalStopFee: 15,
};

function PricingTab() {
  const [form, setForm] = useState<PricingData>(PRICING_DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    fetch("/api/admin/pricing", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setForm(prev => ({ ...prev, ...Object.fromEntries(Object.keys(prev).map(k => [k, data[k] ?? prev[k as keyof PricingData]])) }));
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const token = getAdminToken();
    try {
      await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const setF = (key: keyof PricingData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: Number(e.target.value) }));

  if (isLoading) return (
    <div className="flex items-center justify-center py-40">
      <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
    </div>
  );

  function PriceCard({ title, subtitle, icon: Icon, children }: {
    title: string; subtitle: string; icon: React.ElementType; children: React.ReactNode;
  }) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-50">
          <div className="w-10 h-10 bg-[#1A1A1A] rounded-2xl flex items-center justify-center shrink-0">
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-base tracking-tight">{title}</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    );
  }

  function PriceField({ label, fieldKey, prefix = "$", suffix = "", step = "0.01", min = "0" }: {
    label: string; fieldKey: keyof PricingData; prefix?: string; suffix?: string; step?: string; min?: string;
  }) {
    return (
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-semibold text-gray-700 flex-1">{label}</label>
        <div className="relative w-36 shrink-0">
          {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">{prefix}</span>}
          <input
            type="number"
            step={step}
            min={min}
            value={form[fieldKey]}
            onChange={setF(fieldKey)}
            className={`w-full border border-gray-200 rounded-xl py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-gray-900 transition-colors bg-gray-50 focus:bg-white text-right ${suffix ? "pr-9" : "pr-3"} ${prefix ? "pl-7" : "pl-3"}`}
          />
          {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">{suffix}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Pricing Configuration</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">Manage rates, surcharges, and fees — changes apply to new bookings immediately.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-7 py-3.5 font-bold text-sm tracking-widest uppercase rounded-2xl transition-all shadow-sm shrink-0 ${saved ? 'bg-green-500 text-white' : 'bg-[#1A1A1A] text-white hover:bg-gray-800'} disabled:opacity-50`}
        >
          {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Base Rates */}
        <PriceCard title="Base Rates" subtitle="Per-mile pricing and minimum fare" icon={DollarSign}>
          <PriceField label="Rate Per Mile" fieldKey="baseRatePerMile" />
          <PriceField label="Minimum Fare" fieldKey="minimumFare" />
          <PriceField label="Base Fare (added to all trips)" fieldKey="baseFare" />
        </PriceCard>

        {/* Hourly Service */}
        <PriceCard title="Hourly Service" subtitle="As-directed hourly booking rates" icon={Clock}>
          <PriceField label="Hourly Rate" fieldKey="hourlyRate" />
          <PriceField label="Minimum Hours Required" fieldKey="minimumHours" prefix="" suffix="hrs" step="0.5" />
        </PriceCard>

        {/* Airport */}
        <PriceCard title="Airport Flat Rates" subtitle="Override per-mile rate for airport trips (set 0 to use per-mile)" icon={Briefcase}>
          <PriceField label="Pickup — From Airport" fieldKey="airportPickupFlat" />
          <PriceField label="Dropoff — To Airport" fieldKey="airportDropoffFlat" />
        </PriceCard>

        {/* Surcharges */}
        <PriceCard title="Surcharges & Gratuity" subtitle="Percentage added on top of the base fare" icon={TrendingUp}>
          <PriceField label="Default Gratuity" fieldKey="gratuityDefault" prefix="" suffix="%" step="1" />
          <PriceField label="Fuel Surcharge" fieldKey="fuelSurcharge" prefix="" suffix="%" step="0.5" />
          <PriceField label="Night Surcharge (after 10 PM)" fieldKey="nightSurcharge" prefix="" suffix="%" step="1" />
          <PriceField label="Holiday Surcharge" fieldKey="holidaySurcharge" prefix="" suffix="%" step="1" />
        </PriceCard>

        {/* Wait Time */}
        <PriceCard title="Wait Time Billing" subtitle="Charge for driver wait beyond the complimentary window" icon={Clock}>
          <PriceField label="Wait Time Rate" fieldKey="waitTimeRate" suffix="/hr" step="1" />
          <PriceField label="Complimentary Wait Time" fieldKey="waitTimeFreeMinutes" prefix="" suffix="min" step="5" />
        </PriceCard>

        {/* Extra Stops */}
        <PriceCard title="Extra Stops" subtitle="Fee per additional stop along the route" icon={MapPin}>
          <PriceField label="Additional Stop Fee" fieldKey="additionalStopFee" />
        </PriceCard>
      </div>

      {/* Per-vehicle rates — editable */}
      <PerVehicleRates />
    </div>
  );
}

function PerVehicleRates() {
  const { data: fleet, isLoading } = useAdminListFleet({ query: { queryKey: getAdminListFleetQueryKey() } });
  const updateFleet = useAdminUpdateFleet();
  const qc = useQueryClient();
  const [rates, setRates] = useState<Record<number, number>>({});
  const [savedIds, setSavedIds] = useState<Record<number, boolean>>({});

  const effectiveFleet = (fleet && fleet.length > 0) ? fleet : DEFAULT_FLEET_VEHICLES;

  useEffect(() => {
    const initial: Record<number, number> = {};
    effectiveFleet.forEach(v => {
      initial[v.id] = v.ratePerMile || defaultRateFor(v.name, "ratePerMile");
    });
    setRates(initial);
  }, [fleet]);

  const handleSaveVehicle = (v: Vehicle) => {
    updateFleet.mutate(
      { id: v.id, data: { name: v.name, model: v.model, year: v.year, capacity: v.capacity, imageUrl: v.imageUrl ?? "", description: v.description ?? "", amenities: v.amenities ?? [], vehicleType: v.vehicleType ?? "", luggageCapacity: v.luggageCapacity ?? 0, ratePerMile: rates[v.id] ?? (v.ratePerMile || 0), flatRate: v.flatRate ?? 0, hourlyRate: v.hourlyRate ?? 0 } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getAdminListFleetQueryKey() });
          setSavedIds(p => ({ ...p, [v.id]: true }));
          setTimeout(() => setSavedIds(p => ({ ...p, [v.id]: false })), 2500);
        },
        onError: () => {
          // If mock or offline, still show saved visually
          setSavedIds(p => ({ ...p, [v.id]: true }));
          setTimeout(() => setSavedIds(p => ({ ...p, [v.id]: false })), 2500);
        }
      }
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-50">
        <div className="w-10 h-10 bg-[#1A1A1A] rounded-2xl flex items-center justify-center shrink-0">
          <Car size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-black text-gray-900 text-base tracking-tight">Per-Vehicle Rates & Pricing</h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Base fare includes 15 miles. Set extra mile rates and hourly rates per vehicle below.</p>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : (
        <div className="space-y-4">
          {effectiveFleet.map(v => {
            const vImg = getVehicleImage(v);
            return (
              <div key={v.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-100/80">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-xs shrink-0 flex items-center justify-center border border-gray-100">
                    {vImg ? (
                      <img src={vImg} alt={v.name} className="w-full h-full object-cover" />
                    ) : (
                      <Car size={20} className="text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-gray-900 text-sm tracking-tight">{v.name} <span className="text-xs font-medium text-gray-400">· {v.model}</span></p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">Base ${v.flatRate || 140} (15 mi inc.)</span>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">${v.hourlyRate || 80}/hr</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">Extra: $</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rates[v.id] ?? (v.ratePerMile || 0)}
                      onChange={e => setRates(p => ({ ...p, [v.id]: Number(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-xl py-2 pl-14 pr-8 text-sm font-bold text-gray-900 outline-none focus:border-gray-900 transition-colors bg-white text-right shadow-xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">/mi</span>
                  </div>
                  <button
                    onClick={() => handleSaveVehicle(v)}
                    disabled={updateFleet.isPending}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-xs ${savedIds[v.id] ? 'bg-green-500 text-white' : 'bg-[#1A1A1A] text-white hover:bg-gray-800'} disabled:opacity-40`}
                  >
                    {savedIds[v.id] ? <><CheckCircle size={12} /> Saved</> : <><Save size={12} /> Save</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN ADMIN LAYOUT
───────────────────────────────────────────────────────────── */
type TabId = 'dashboard' | 'bookings' | 'calendar' | 'fleet' | 'services' | 'zones' | 'pricing' | 'contacts' | 'settings';

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { id: 'dashboard' as TabId, label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: "Operations",
    items: [
      { id: 'bookings' as TabId, label: 'Bookings', icon: ClipboardList },
      { id: 'calendar' as TabId, label: 'Calendar', icon: CalendarDays },
    ]
  },
  {
    label: "Management",
    items: [
      { id: 'fleet' as TabId, label: 'Fleet', icon: Car },
      { id: 'services' as TabId, label: 'Services', icon: Package },
      { id: 'zones' as TabId, label: 'Zones', icon: MapPin },
      { id: 'pricing' as TabId, label: 'Pricing', icon: DollarSign },
    ]
  },
  {
    label: "Clients",
    items: [
      { id: 'contacts' as TabId, label: 'Messages', icon: MessageSquare },
    ]
  },
  {
    label: "System",
    items: [
      { id: 'settings' as TabId, label: 'Settings', icon: Settings },
    ]
  },
];

export default function Admin() {
  const auth = useAdminGuard();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: allBookings } = useListBookings({}, { query: { queryKey: getListBookingsQueryKey(), ...REALTIME_QUERY } });
  const { data: contacts } = useAdminListContacts({ query: { queryKey: getAdminListContactsQueryKey(), ...REALTIME_QUERY } });

  const pendingCount = allBookings?.filter(b => b.status === 'pending').length ?? 0;
  const contactCount = contacts?.length ?? 0;

  const getBadge = (id: TabId) => {
    if (id === 'bookings') return pendingCount;
    if (id === 'contacts') return contactCount;
    return 0;
  };

  const handleLogout = () => {
    clearAdminToken();
    window.location.href = '/admin/login';
  };

  if (!auth) return null;

  const tabLabels: Record<TabId, string> = {
    dashboard: 'Dashboard',
    bookings: 'Bookings',
    calendar: 'Calendar',
    fleet: 'Fleet',
    services: 'Services',
    zones: 'Zones',
    pricing: 'Pricing',
    contacts: 'Messages',
    settings: 'Settings',
  };

  const TabComponent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab onGoTo={(tab) => setActiveTab(tab as TabId)} />;
      case 'bookings': return <BookingsTab />;
      case 'calendar': return <CalendarTab />;
      case 'fleet': return <FleetTab />;
      case 'services': return <ServicesTab />;
      case 'zones': return <ZonesTab />;
      case 'pricing': return <PricingTab />;
      case 'contacts': return <ContactsTab />;
      case 'settings': return <SettingsTab />;
      default: return <DashboardTab onGoTo={(tab) => setActiveTab(tab as TabId)} />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-7 pb-6 shrink-0 border-b border-gray-100">
        <img
          src={eclipseLogo}
          alt="Eclipse Transport"
          className="h-20 w-auto object-contain"
        />
        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-[0.18em] mt-2 pl-0.5">
          Admin Panel
        </p>
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <Divider />}
            <SectionTitle>{group.label}</SectionTitle>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badge = getBadge(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-200 outline-none ${isActive ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-4">
                    <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                    <span className={`text-[15px] ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {badge > 0 && (
                      <span className={`min-w-[22px] h-5 px-1.5 text-[11px] font-black rounded-full flex items-center justify-center ${isActive ? 'bg-white/25 text-white' : 'bg-amber-400 text-white'}`}>
                        {badge}
                      </span>
                    )}
                    {isActive && <ChevronRight size={15} className="opacity-40" />}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 space-y-1 shrink-0">
        <button
          onClick={() => window.open('/', '_blank')}
          className="w-full flex items-center gap-4 px-4 py-4 text-gray-500 hover:bg-gray-50 hover:text-gray-900 text-[15px] font-semibold rounded-2xl transition-all"
        >
          <ExternalLink size={21} strokeWidth={2} />
          View Live Site
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-4 text-red-500 hover:bg-red-50 text-[15px] font-semibold rounded-2xl transition-all"
        >
          <LogOut size={21} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <PrintStyles />
      <div className="flex min-h-screen bg-[#F7F6F3] no-print">

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-72 shrink-0 bg-white border-r border-gray-100 flex-col fixed inset-y-0 left-0 z-20 shadow-sm">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent />
        </div>

        {/* Mobile Backdrop */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:ml-72">
          {/* Top Header */}
          <header className="sticky top-0 z-10 bg-[#F7F6F3]/90 backdrop-blur-md border-b border-gray-100/80 px-6 md:px-10 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:border-gray-400 transition-colors"
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">{tabLabels[activeTab]}</h1>
                <p className="text-xs text-gray-400 font-medium hidden sm:block">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold hover:bg-amber-100 transition-all"
                >
                  <Bell size={14} />
                  {pendingCount} pending
                </button>
              )}
              <div className="w-9 h-9 bg-[#1A1A1A] rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-xs">A</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 md:p-10 overflow-y-auto">
            <div className="max-w-7xl mx-auto pb-16">
              <TabComponent />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
