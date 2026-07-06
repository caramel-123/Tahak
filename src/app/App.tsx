import { useState, useEffect } from "react";
import {
  MapPin, Star, Shield, Users, Calendar, Clock, ChevronRight,
  Search, Filter, MessageCircle, Bell, Home, Compass, BookOpen,
  User, Menu, X, CheckCircle, Award, TrendingUp, DollarSign,
  Camera, Flag, BarChart2, ArrowRight, Leaf, Mountain, Waves,
  Play, ChevronLeft, Plus, QrCode, AlertTriangle, LogOut,
  Wallet, Globe, Languages, Map, Zap, Heart, Share2, Navigation2
} from "lucide-react";
import { supabase } from "../lib/supabase";
import freighterApi from "@stellar/freighter-api";

// ─── Types ──────────────────────────────────────────────────────────────────
type GuideVM = {
  id: string;
  name: string;
  location: string;
  specialty: string;
  rating: number;
  reviews: number;
  tours: number;
  price: number;
  languages: string[];
  badges: string[];
  verified: boolean;
  avatar: string;
  cover: string;
  bio: string;
  specialties: string[];
};

type DestinationVM = { name: string; region: string; guides: number; image: string };
type TestimonialVM = { name: string; country: string; text: string; avatar: string; rating: number; guide: string };
type BookingVM = { id: string; guide: string; destination: string; date: string; status: string; amount: number; milestone: string; progress: number; avatar: string };

function guideRowToVM(g: any): GuideVM {
  return {
    id: g.id,
    name: g.name,
    location: g.location,
    specialty: g.specialty,
    rating: Number(g.rating),
    reviews: g.review_count,
    tours: g.tours_completed,
    price: Number(g.price_per_day),
    languages: g.languages ?? [],
    badges: g.badges ?? [],
    verified: g.verified,
    avatar: g.avatar_url,
    cover: g.cover_url,
    bio: g.bio ?? "",
    specialties: g.specialties ?? [],
  };
}

type Page =
  | "landing"
  | "wallet-connect"
  | "explore"
  | "guide-profile"
  | "bookings"
  | "guide-dashboard"
  | "officer-dashboard"
  | "tour-details";
type Role = "tourist" | "guide" | "officer" | null;

// ─── Mock Data ───────────────────────────────────────────────────────────────
const GUIDES = [
  {
    id: "1",
    name: "Maria Santos",
    location: "Banaue, Ifugao",
    specialty: "Rice Terraces & Hiking",
    rating: 4.97,
    reviews: 312,
    tours: 847,
    price: 2800,
    languages: ["Filipino", "English", "Ilocano"],
    badges: ["DOT Accredited", "Top Rated", "100 Tours"],
    verified: true,
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&auto=format",
    cover: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=400&fit=crop&auto=format",
    bio: "Born and raised in the Cordillera highlands, I have guided travelers through the ancient Banaue Rice Terraces for over 12 years. I speak the land, the culture, and the stories that no guidebook can tell.",
    specialties: ["Rice Terraces", "Mountain Trekking", "Cultural Immersion", "Photography Tours"],
  },
  {
    id: "2",
    name: "Jose Reyes",
    location: "Coron, Palawan",
    specialty: "Island Hopping & Diving",
    rating: 4.94,
    reviews: 208,
    tours: 521,
    price: 3500,
    languages: ["Filipino", "English", "Japanese"],
    badges: ["Barangay Certified", "50 Tours", "Community Vouched"],
    verified: true,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&auto=format",
    cover: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&h=400&fit=crop&auto=format",
    bio: "Coron is not just my home — it is my classroom. I have spent a decade exploring every lagoon, shipwreck, and hidden cove in these waters. Let me show you what most tourists never discover.",
    specialties: ["Island Hopping", "Snorkeling", "Freediving", "Kayaking"],
  },
  {
    id: "3",
    name: "Ana Dela Cruz",
    location: "Siargao, Surigao del Norte",
    specialty: "Surfing & Island Life",
    rating: 4.91,
    reviews: 189,
    tours: 403,
    price: 2200,
    languages: ["Filipino", "English"],
    badges: ["Community Vouched", "Top Rated"],
    verified: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&auto=format",
    cover: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&h=400&fit=crop&auto=format",
    bio: "Siargao shaped me. I learned to surf before I learned to ride a bike, and I have been guiding surf sessions and island tours here for 8 years. My tours are unhurried, honest, and unforgettable.",
    specialties: ["Surfing", "Island Hopping", "Mangrove Tours", "Sunset Cruises"],
  },
  {
    id: "4",
    name: "Ramon Villanueva",
    location: "Bicol Region",
    specialty: "Mayon Volcano & Waterfalls",
    rating: 4.88,
    reviews: 145,
    tours: 290,
    price: 2600,
    languages: ["Filipino", "English", "Bicolano"],
    badges: ["DOT Accredited", "Barangay Certified"],
    verified: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format",
    cover: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=400&fit=crop&auto=format",
    bio: "At the foot of the world's most perfect cone, I have built a career helping adventurers safely explore Mayon's slopes, hidden waterfalls, and the rich Bicolano culture surrounding them.",
    specialties: ["Volcano Trekking", "Waterfall Hikes", "ATV Adventures", "Cultural Tours"],
  },
];

const DESTINATIONS = [
  { name: "Banaue Rice Terraces", region: "Ifugao", guides: 24, image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&h=300&fit=crop&auto=format" },
  { name: "Coron, Palawan", region: "MIMAROPA", guides: 38, image: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&h=300&fit=crop&auto=format" },
  { name: "Siargao Island", region: "Caraga", guides: 19, image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&h=300&fit=crop&auto=format" },
  { name: "Mayon Volcano", region: "Bicol", guides: 15, image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop&auto=format" },
  { name: "Chocolate Hills", region: "Bohol", guides: 22, image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&h=300&fit=crop&auto=format" },
  { name: "Tubbataha Reef", region: "Palawan", guides: 11, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format" },
];

const TESTIMONIALS = [
  { name: "Hana Tanaka", country: "Japan", text: "Maria took us through the rice terraces at sunrise. The blockchain escrow made me feel completely safe paying before the trip — no worries about scams.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format", rating: 5, guide: "Maria Santos" },
  { name: "Chris Müller", country: "Germany", text: "Jose showed us secret lagoons no tourist boat visits. The QR check-in milestones were a genius idea — we always knew exactly where we stood.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format", rating: 5, guide: "Jose Reyes" },
  { name: "Priya Mehta", country: "India", text: "Ana made Siargao come alive. I was nervous about surfing for the first time but she was patient, funny, and deeply professional. Booked again already.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format", rating: 5, guide: "Ana Dela Cruz" },
];

const BOOKINGS = [
  { id: "TH-2847", guide: "Maria Santos", destination: "Banaue Rice Terraces", date: "Jul 12, 2025", status: "upcoming", amount: 2800, milestone: "Escrow Funded", progress: 25, avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&auto=format" },
  { id: "TH-2651", guide: "Jose Reyes", destination: "Coron Island Hopping", date: "Jun 28, 2025", status: "ongoing", amount: 3500, milestone: "Day 2 of 3 Complete", progress: 66, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&auto=format" },
  { id: "TH-2190", guide: "Ana Dela Cruz", destination: "Siargao Surf Camp", date: "Jun 5, 2025", status: "completed", amount: 2200, milestone: "Payment Released", progress: 100, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&auto=format" },
];

// ─── Utility ──────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
  disputed: "bg-orange-100 text-orange-700",
};

// ─── Small Components ────────────────────────────────────────────────────────
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${sz} ${i <= Math.round(rating) ? "fill-[#D8B26E] text-[#D8B26E]" : "fill-none text-gray-300"}`} />
      ))}
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
      <Shield className="w-3 h-3" /> Verified
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function GuideCard({ guide, onClick }: { guide: GuideVM; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border cursor-pointer group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="relative h-44 overflow-hidden bg-secondary">
        <img src={guide.cover} alt={guide.location} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="text-white text-xs font-semibold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {guide.location}
          </span>
        </div>
        {guide.verified && (
          <div className="absolute top-3 right-3">
            <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" /> DOT
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <img src={guide.avatar} alt={guide.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-[#D8B26E] flex-shrink-0 -mt-8 relative z-10" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm leading-tight font-poppins">{guide.name}</h3>
            <p className="text-muted-foreground text-xs mt-0.5 truncate">{guide.specialty}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StarRating rating={guide.rating} />
            <span className="text-xs font-semibold text-foreground">{guide.rating}</span>
            <span className="text-xs text-muted-foreground">({guide.reviews})</span>
          </div>
          <div className="text-right">
            <span className="text-primary font-bold text-sm">₱{guide.price.toLocaleString()}</span>
            <span className="text-muted-foreground text-xs"> /day</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {guide.badges.slice(0, 2).map((b) => (
            <span key={b} className="text-xs bg-secondary text-primary font-medium px-2 py-0.5 rounded-full">{b}</span>
          ))}
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <Compass className="w-3 h-3" /> {guide.tours} tours
          </span>
        </div>
        <button className="mt-3 w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#245530] transition-colors duration-200">
          Book Now
        </button>
      </div>
    </div>
  );
}

function MilestoneBar({ progress, label }: { progress: number; label: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        <span className="text-primary">{progress}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-[#76A96B] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function BottomNav({ page, setPage, role }: { page: Page; setPage: (p: Page) => void; role: Role }) {
  const items = [
    { id: "landing" as Page, icon: Home, label: "Home" },
    { id: "explore" as Page, icon: Compass, label: "Explore" },
    { id: "bookings" as Page, icon: BookOpen, label: "Bookings" },
    { id: "guide-dashboard" as Page, icon: BarChart2, label: "Dashboard" },
    { id: "wallet-connect" as Page, icon: User, label: "Profile" },
  ];

  const filtered = role === "guide"
    ? items
    : role === "officer"
    ? [items[0], items[1], { id: "officer-dashboard" as Page, icon: BarChart2, label: "Dashboard" }, items[4]]
    : [items[0], items[1], items[2], items[4]];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="flex">
        {filtered.map(({ id, icon: Icon, label }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id)} className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors duration-200 ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-semibold">{label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Sidebar({ page, setPage, role }: { page: Page; setPage: (p: Page) => void; role: Role }) {
  const touristItems = [
    { id: "landing" as Page, icon: Home, label: "Home" },
    { id: "explore" as Page, icon: Compass, label: "Explore Guides" },
    { id: "bookings" as Page, icon: BookOpen, label: "My Bookings" },
    { id: "guide-dashboard" as Page, icon: MessageCircle, label: "Messages" },
  ];
  const guideItems = [
    { id: "guide-dashboard" as Page, icon: BarChart2, label: "Dashboard" },
    { id: "explore" as Page, icon: Map, label: "Manage Tours" },
    { id: "bookings" as Page, icon: BookOpen, label: "Booking Requests" },
    { id: "landing" as Page, icon: Award, label: "Reputation" },
  ];
  const officerItems = [
    { id: "officer-dashboard" as Page, icon: BarChart2, label: "Regional Dashboard" },
    { id: "explore" as Page, icon: Shield, label: "Verification Queue" },
    { id: "bookings" as Page, icon: Flag, label: "Disputes" },
    { id: "landing" as Page, icon: Globe, label: "Region Map" },
  ];

  const items = role === "guide" ? guideItems : role === "officer" ? officerItems : touristItems;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border min-h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Navigation2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>Tahak</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Philippine Tour Guide Platform</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map(({ id, icon: Icon, label }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${active ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
              <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              {label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{role === "guide" ? "Maria Santos" : role === "officer" ? "Officer Bautista" : "Traveler"}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{role || "Tourist"}</p>
          </div>
          <Wallet className="w-4 h-4 text-primary" />
        </div>
      </div>
    </aside>
  );
}

function TopBar({ page, setPage, role }: { page: Page; setPage: (p: Page) => void; role: Role }) {
  const titles: Record<string, string> = {
    landing: "Tahak",
    explore: "Explore Guides",
    "guide-profile": "Guide Profile",
    bookings: "My Bookings",
    "guide-dashboard": "Dashboard",
    "officer-dashboard": "Regional Dashboard",
    "wallet-connect": "Connect Wallet",
    "tour-details": "Tour Details",
  };

  if (page === "landing") return null;

  return (
    <header className="md:hidden sticky top-0 bg-card/95 backdrop-blur-md border-b border-border z-40 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {page !== "landing" && (
          <button onClick={() => setPage("landing")} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <span className="font-bold text-base text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>{titles[page] || "Tahak"}</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary relative">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary" onClick={() => setPage("wallet-connect")}>
          <User className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </header>
  );
}

// ─── Landing Page ────────────────────────────────────────────────────────────
function LandingPage({ setPage, setRole, goToGuide }: { setPage: (p: Page) => void; setRole: (r: Role) => void; goToGuide: (id: string) => void }) {
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [destinations, setDestinations] = useState<DestinationVM[]>(DESTINATIONS);
  const [guides, setGuides] = useState<GuideVM[]>(GUIDES);
  const [testimonials, setTestimonials] = useState<TestimonialVM[]>(TESTIMONIALS);

  useEffect(() => {
    supabase.from("destinations").select("*").order("guide_count", { ascending: false })
      .then(({ data }) => {
        if (data && data.length) setDestinations(data.map((d: any) => ({ name: d.name, region: d.region, guides: d.guide_count, image: d.image_url })));
      });

    supabase.from("guides").select("*").order("rating", { ascending: false }).limit(4)
      .then(({ data }) => { if (data && data.length) setGuides(data.map(guideRowToVM)); });

    supabase.from("testimonials").select("*, guides(name)").limit(6)
      .then(({ data }) => {
        if (data && data.length) setTestimonials(data.map((t: any) => ({ name: t.name, country: t.country, text: t.text, avatar: t.avatar_url, rating: t.rating, guide: t.guides?.name ?? "" })));
      });
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Navigation2 className="w-4.5 h-4.5 w-[18px] h-[18px] text-white" />
            </div>
            <span className="font-bold text-lg text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>Tahak</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setPage("explore")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Explore</button>
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</button>
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPage("wallet-connect")} className="hidden md:block text-sm font-semibold text-foreground hover:text-primary transition-colors">Sign In</button>
            <button onClick={() => setPage("wallet-connect")} className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#245530] transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 bg-secondary">
          <img
            src="https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1600&h=900&fit=crop&auto=format"
            alt="Banaue Rice Terraces"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2F6B3C]/60 via-background/10 to-background" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5" />
              Powered by Stellar Blockchain Escrow
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
              Journey with<br />
              <span className="text-[#D8B26E]">Trusted Local</span><br />
              Guides
            </h1>
            <p className="mt-6 text-base sm:text-lg text-white/90 max-w-lg leading-relaxed">
              Book verified Philippine tour guide experiences secured by blockchain escrow. Protect your trip, support local communities.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={() => setPage("explore")} className="bg-[#A66A3F] hover:bg-[#8a572f] text-white font-bold px-8 py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                <Compass className="w-5 h-5" /> Explore Guides
              </button>
              <button onClick={() => { setRole("guide"); setPage("wallet-connect"); }} className="bg-white/90 hover:bg-white text-foreground font-bold px-8 py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-all duration-200">
                <Award className="w-5 h-5" /> Become a Guide
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: "Verified Guides", value: "1,240+", icon: Shield },
            { label: "Tours Completed", value: "28,400+", icon: Compass },
            { label: "Happy Travelers", value: "94,000+", icon: Heart },
            { label: "Regions Covered", value: "17", icon: Globe },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon className="w-6 h-6 text-[#D8B26E] mx-auto mb-2" />
              <div className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</div>
              <div className="text-xs sm:text-sm text-white/70 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>Popular Destinations</h2>
              <p className="text-muted-foreground mt-1 text-sm">Discover the Philippines with a trusted local</p>
            </div>
            <button onClick={() => setPage("explore")} className="hidden sm:flex items-center gap-1.5 text-primary font-semibold text-sm hover:underline">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {destinations.map((d) => (
              <button key={d.name} onClick={() => setPage("explore")} className="group rounded-2xl overflow-hidden bg-secondary relative aspect-[3/4] hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <img src={d.image} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                  <p className="text-white font-bold text-xs sm:text-sm leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>{d.name}</p>
                  <p className="text-white/70 text-xs mt-0.5">{d.guides} guides</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="py-16 sm:py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>Featured Guides</h2>
              <p className="text-muted-foreground mt-1 text-sm">Verified local experts with proven track records</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {guides.map((g) => (
              <GuideCard key={g.id} guide={g} onClick={() => goToGuide(g.id)} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <button onClick={() => setPage("explore")} className="bg-primary text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-[#245530] transition-colors inline-flex items-center gap-2">
              View All Guides <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>How Tahak Works</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto text-sm">Blockchain-powered safety for every journey — without the crypto complexity</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Search, step: "01", title: "Find a Guide", desc: "Browse DOT-verified guides filtered by destination, language, and specialty." },
              { icon: Wallet, step: "02", title: "Fund Escrow", desc: "Your payment is held securely on Stellar blockchain — released only as milestones are met." },
              { icon: QrCode, step: "03", title: "QR Check-In", desc: "Your guide scans your QR code at each milestone, confirming progress on-chain." },
              { icon: Star, step: "04", title: "Review & Pay", desc: "Leave a verified review and payment releases automatically to your guide." },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="bg-card rounded-2xl p-6 border border-border relative overflow-hidden">
                <div className="absolute top-4 right-4 text-5xl font-black text-primary/5" style={{ fontFamily: "Poppins, sans-serif" }}>{step}</div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-base mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>Travelers Love Tahak</h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center">
              <img src={testimonials[testimonialIdx]?.avatar} alt={testimonials[testimonialIdx]?.name} className="w-16 h-16 rounded-full mx-auto mb-4 object-cover ring-4 ring-[#D8B26E]" />
              <StarRating rating={5} size="md" />
              <p className="text-white/90 text-base leading-relaxed mt-4 italic">"{testimonials[testimonialIdx]?.text}"</p>
              <p className="font-bold text-white mt-4" style={{ fontFamily: "Poppins, sans-serif" }}>{testimonials[testimonialIdx]?.name}</p>
              <p className="text-white/60 text-sm">{testimonials[testimonialIdx]?.country} · Toured with {testimonials[testimonialIdx]?.guide}</p>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === testimonialIdx ? "bg-[#D8B26E] w-6" : "bg-white/30"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-[#2F6B3C] to-[#76A96B] rounded-3xl p-10 sm:p-14">
            <Leaf className="w-10 h-10 text-[#D8B26E] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>Ready to Traverse the Philippines?</h2>
            <p className="text-white/80 mt-3 text-sm sm:text-base">Connect your Stellar wallet and start exploring with verified local guides.</p>
            <button onClick={() => setPage("wallet-connect")} className="mt-8 bg-[#A66A3F] hover:bg-[#8a572f] text-white font-bold px-10 py-4 rounded-2xl text-base transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2">
              Connect Wallet <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Navigation2 className="w-5 h-5 text-[#D8B26E]" />
            <span className="font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>Tahak</span>
            <span className="text-xs">· Philippine Tour Guide Platform</span>
          </div>
          <p className="text-xs">© 2025 Tahak. Built on Stellar Blockchain. Powered by community.</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Wallet Connect Page ──────────────────────────────────────────────────────
function WalletConnectPage({ setPage, setRole }: { setPage: (p: Page) => void; setRole: (r: Role) => void }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setWalletError(null);
    try {
      const { isConnected: installed } = await freighterApi.isConnected();
      if (!installed) {
        setWalletError("Freighter extension not detected. Install it from freighter.app to connect a real Stellar wallet.");
        return;
      }
      const access = await freighterApi.requestAccess();
      if (access.error || !access.address) {
        setWalletError(access.error?.message || "Wallet access was denied.");
        return;
      }
      setAddress(access.address);
      setConnected(true);

      const net = await freighterApi.getNetwork();
      if (!net.error) setNetwork(net.network);

      try {
        const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${access.address}`);
        if (res.ok) {
          const data = await res.json();
          const native = data.balances?.find((b: any) => b.asset_type === "native");
          setBalance(native ? Number(native.balance).toFixed(2) : "0.00");
        } else {
          setBalance("0.00 (unfunded testnet account)");
        }
      } catch {
        setBalance(null);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleContinue = () => {
    if (!selectedRole) return;
    setRole(selectedRole);
    if (selectedRole === "guide") setPage("guide-dashboard");
    else if (selectedRole === "officer") setPage("officer-dashboard");
    else setPage("explore");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Navigation2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>Welcome to Tahak</h1>
          <p className="text-muted-foreground mt-1 text-sm">Connect your Stellar wallet to get started</p>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          {!connected ? (
            <>
              <div className="bg-secondary rounded-2xl p-8 text-center mb-6">
                <Wallet className="w-16 h-16 text-primary mx-auto mb-3 opacity-60" />
                <p className="text-sm text-muted-foreground">Connect your Freighter wallet to continue</p>
              </div>
              {walletError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4">
                  {walletError}{" "}
                  {walletError.toLowerCase().includes("install") && (
                    <a href="https://www.freighter.app/" target="_blank" rel="noreferrer" className="underline font-semibold">Get Freighter →</a>
                  )}
                </div>
              )}
              <button onClick={handleConnect} disabled={connecting} className="w-full bg-primary hover:bg-[#245530] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                <Wallet className="w-5 h-5" /> {connecting ? "Connecting…" : "Connect Wallet"}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 bg-secondary rounded-xl p-3 mb-6">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-primary">Wallet Connected{network ? ` · ${network}` : ""}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {address ? `${address.slice(0, 4)}…${address.slice(-4)}` : ""} {balance ? `· ${balance} XLM` : ""}
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-foreground mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>Choose your role</p>
              <div className="space-y-3 mb-6">
                {([
                  { role: "tourist" as Role, icon: Compass, label: "Tourist", desc: "Discover and book verified guides across the Philippines" },
                  { role: "guide" as Role, icon: Mountain, label: "Tour Guide", desc: "Offer your expertise, build reputation, earn securely" },
                  { role: "officer" as Role, icon: Shield, label: "Tourism Officer", desc: "Verify guides and manage regional dispute resolution" },
                ] as { role: Role; icon: typeof Compass; label: string; desc: string }[]).map(({ role, icon: Icon, label, desc }) => (
                  <button key={label} onClick={() => setSelectedRole(role)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${selectedRole === role ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedRole === role ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    {selectedRole === role && <CheckCircle className="w-5 h-5 text-primary ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>
              <button onClick={handleContinue} disabled={!selectedRole} className="w-full bg-[#A66A3F] disabled:opacity-40 hover:bg-[#8a572f] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed">
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        <button onClick={() => setPage("landing")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to home
        </button>
      </div>
    </div>
  );
}

// ─── Explore Page ─────────────────────────────────────────────────────────────
function ExplorePage({ setPage, goToGuide }: { setPage: (p: Page) => void; goToGuide: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [guides, setGuides] = useState<GuideVM[]>(GUIDES);

  useEffect(() => {
    supabase.from("guides").select("*").order("rating", { ascending: false })
      .then(({ data }) => { if (data && data.length) setGuides(data.map(guideRowToVM)); });
  }, []);

  const filtered = guides.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.location.toLowerCase().includes(search.toLowerCase()) ||
    g.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search destination, guide name, specialty…"
          className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filter
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {["all", "mountains", "islands", "rivers", "culture", "diving"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${filter === f ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground"><span className="font-bold text-foreground">{filtered.length}</span> verified guides found</p>
        <button className="text-xs text-primary font-semibold">Sort by Rating</button>
      </div>

      {/* Guide cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((g) => (
          <GuideCard key={g.id} guide={g} onClick={() => goToGuide(g.id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>No guides found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
}

// ─── Guide Profile Page ───────────────────────────────────────────────────────
function GuideProfilePage({ setPage, guideId }: { setPage: (p: Page) => void; guideId: string | null }) {
  const [guide, setGuide] = useState<GuideVM>(GUIDES[0]);
  const [reviews, setReviews] = useState<TestimonialVM[]>(TESTIMONIALS);
  const [tab, setTab] = useState<"tours" | "reviews" | "gallery">("tours");

  useEffect(() => {
    if (!guideId) return;
    supabase.from("guides").select("*").eq("id", guideId).single()
      .then(({ data }) => { if (data) setGuide(guideRowToVM(data)); });
    supabase.from("testimonials").select("*, guides(name)").eq("guide_id", guideId)
      .then(({ data }) => {
        if (data) setReviews(data.map((t: any) => ({ name: t.name, country: t.country, text: t.text, avatar: t.avatar_url, rating: t.rating, guide: t.guides?.name ?? "" })));
      });
  }, [guideId]);

  const tours = [
    { name: "Sunrise Rice Terraces Trek", duration: "1 Day", price: 2800, rating: 4.97, bookings: 312 },
    { name: "Batad Village Cultural Walk", duration: "Half Day", price: 1500, rating: 4.95, bookings: 184 },
    { name: "Cordillera Multi-Day Adventure", duration: "3 Days", price: 8400, rating: 4.99, bookings: 67 },
  ];

  return (
    <div className="pb-24 md:pb-6">
      {/* Cover */}
      <div className="relative h-52 sm:h-72 bg-secondary overflow-hidden">
        <img src={guide.cover} alt={guide.location} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={() => setPage("explore")} className="absolute top-4 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white md:hidden">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <Heart className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </button>
          <button className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <Share2 className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Profile header */}
        <div className="flex items-end gap-4 -mt-12 sm:-mt-14 mb-4">
          <img src={guide.avatar} alt={guide.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-card shadow-lg flex-shrink-0" />
          <div className="pb-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-xl text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>{guide.name}</h1>
              <VerifiedBadge />
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" /> {guide.location}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Rating", value: `${guide.rating}`, icon: Star },
            { label: "Reviews", value: `${guide.reviews}`, icon: MessageCircle },
            { label: "Tours", value: `${guide.tours}`, icon: Compass },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-3 text-center">
              <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="font-bold text-foreground text-base" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Bio */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <p className="text-sm text-foreground leading-relaxed">{guide.bio}</p>
        </div>

        {/* Languages & Specialties */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Languages className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Languages</span>
            </div>
            {guide.languages.map((l) => (
              <span key={l} className="block text-xs text-muted-foreground mt-1">{l}</span>
            ))}
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Badges</span>
            </div>
            {guide.badges.map((b) => (
              <span key={b} className="block text-xs text-muted-foreground mt-1">{b}</span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-5">
          {(["tours", "reviews", "gallery"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "tours" && (
          <div className="space-y-3 mb-6">
            {tours.map((tour) => (
              <div key={tour.name} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-foreground text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>{tour.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {tour.duration}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {tour.bookings} booked</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3 fill-[#D8B26E] text-[#D8B26E]" /> {tour.rating}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-primary text-sm">₱{tour.price.toLocaleString()}</p>
                  <button onClick={() => setPage("bookings")} className="mt-1 bg-[#A66A3F] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#8a572f] transition-colors">Book</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "reviews" && (
          <div className="space-y-3 mb-6">
            {reviews.map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.country}</p>
                  </div>
                  <StarRating rating={t.rating} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        )}

        {tab === "gallery" && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[guide.cover, GUIDES[1].cover, GUIDES[2].cover, GUIDES[3].cover, GUIDES[0].avatar, GUIDES[1].avatar].map((img, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-secondary">
                <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        )}

        {/* Book CTA */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4 sticky bottom-20 md:bottom-4 shadow-lg">
          <div>
            <p className="font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>₱{guide.price.toLocaleString()}<span className="font-normal text-muted-foreground text-sm"> /day</span></p>
            <p className="text-xs text-muted-foreground">Secured by Stellar Escrow</p>
          </div>
          <button onClick={() => setPage("bookings")} className="bg-[#A66A3F] hover:bg-[#8a572f] text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-colors">
            <Calendar className="w-4 h-4" /> Book Tour
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bookings Page ────────────────────────────────────────────────────────────
function BookingsPage() {
  const [tab, setTab] = useState<"upcoming" | "ongoing" | "completed">("upcoming");
  const [bookings, setBookings] = useState<BookingVM[]>(BOOKINGS);

  useEffect(() => {
    supabase.from("bookings").select("*, guides(name, avatar_url)").order("booking_date", { ascending: false })
      .then(({ data }) => {
        if (data && data.length) {
          setBookings(data.map((b: any) => ({
            id: b.code,
            guide: b.guides?.name ?? "Guide",
            destination: b.destination,
            date: b.booking_date,
            status: b.status,
            amount: Number(b.amount),
            milestone: b.milestone ?? "",
            progress: b.progress,
            avatar: b.guides?.avatar_url ?? "",
          })));
        }
      });
  }, []);

  const filtered = bookings.filter(b => b.status === tab);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-5">
        {(["upcoming", "ongoing", "completed"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={b.avatar} alt={b.guide} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground text-sm truncate" style={{ fontFamily: "Poppins, sans-serif" }}>{b.guide}</p>
                    <StatusChip status={b.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {b.destination}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" /> {b.date}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-foreground text-sm">₱{b.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Escrow</p>
                </div>
              </div>

              <MilestoneBar progress={b.progress} label={b.milestone} />

              {/* Escrow timeline */}
              <div className="flex items-center gap-1.5 mt-4">
                {["Escrow Funded", "Tour Start", "Day Complete", "Payment Released"].map((m, i) => {
                  const done = b.progress >= (i + 1) * 25;
                  return (
                    <div key={m} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? "bg-primary" : "bg-secondary border-2 border-border"}`}>
                        {done && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-[9px] text-muted-foreground text-center leading-tight hidden sm:block">{m}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border px-4 py-3 flex gap-2">
              {b.status === "upcoming" && (
                <>
                  <button className="flex-1 border border-border text-foreground text-xs font-bold py-2 rounded-xl hover:bg-secondary transition-colors">Message Guide</button>
                  <button className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-xl hover:bg-[#245530] transition-colors flex items-center justify-center gap-1">
                    <QrCode className="w-3.5 h-3.5" /> View QR
                  </button>
                </>
              )}
              {b.status === "ongoing" && (
                <>
                  <button className="flex-1 border border-border text-foreground text-xs font-bold py-2 rounded-xl hover:bg-secondary transition-colors flex items-center justify-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-orange-500" /> Safety Flag
                  </button>
                  <button className="flex-1 bg-[#A66A3F] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#8a572f] transition-colors">Track Tour</button>
                </>
              )}
              {b.status === "completed" && (
                <>
                  <button className="flex-1 border border-border text-foreground text-xs font-bold py-2 rounded-xl hover:bg-secondary transition-colors">View Receipt</button>
                  <button className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-xl hover:bg-[#245530] transition-colors flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5" /> Leave Review
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Book new */}
      <button className="mt-6 w-full border-2 border-dashed border-primary/30 text-primary font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors text-sm">
        <Plus className="w-5 h-5" /> Book a New Tour
      </button>
    </div>
  );
}

// ─── Guide Dashboard ──────────────────────────────────────────────────────────
function GuideDashboardPage() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary to-[#4F8A52] rounded-2xl p-5 text-white mb-5 flex items-center justify-between">
        <div>
          <p className="text-white/70 text-xs font-medium">Good morning,</p>
          <h2 className="text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>Maria Santos</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <VerifiedBadge />
            <span className="text-white/70 text-xs">847 tours completed</span>
          </div>
        </div>
        <img src={GUIDES[0].avatar} alt="Maria" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30" />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "This Month", value: "₱42,800", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Escrow Waiting", value: "₱12,300", icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Upcoming Tours", value: "6", icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Reputation", value: "4.97", icon: Star, color: "text-primary", bg: "bg-secondary" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="font-bold text-foreground text-base" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Today's Check-ins */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>Today's Check-ins</h3>
          <span className="text-xs text-primary font-semibold">Jul 5, 2025</span>
        </div>
        <div className="space-y-3">
          {[
            { tourist: "Hana Tanaka", tour: "Sunrise Trek", time: "5:30 AM", status: "checked-in" },
            { tourist: "Chris Müller", tour: "Batad Walk", time: "9:00 AM", status: "pending" },
            { tourist: "Group of 4", tour: "Cordillera Trek", time: "1:00 PM", status: "pending" },
          ].map((c) => (
            <div key={c.tourist} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${c.status === "checked-in" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                {c.status === "checked-in" ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{c.tourist}</p>
                <p className="text-xs text-muted-foreground">{c.tour} · {c.time}</p>
              </div>
              {c.status === "pending" && (
                <button className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                  <QrCode className="w-3 h-3" /> Scan
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Chart placeholder */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>Revenue Overview</h3>
          <select className="text-xs text-muted-foreground bg-secondary border-0 rounded-lg px-2 py-1">
            <option>Last 6 months</option>
          </select>
        </div>
        <div className="flex items-end gap-2 h-24">
          {[35, 62, 48, 78, 55, 90].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-lg bg-primary/80 transition-all hover:bg-primary" style={{ height: `${h}%` }} />
              <span className="text-[9px] text-muted-foreground">{["Feb", "Mar", "Apr", "May", "Jun", "Jul"][i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Add Tour", icon: Plus, color: "bg-primary text-white" },
          { label: "View Requests", icon: BookOpen, color: "bg-secondary text-primary" },
          { label: "My Reputation", icon: TrendingUp, color: "bg-secondary text-primary" },
          { label: "Safety Center", icon: Shield, color: "bg-secondary text-primary" },
        ].map(({ label, icon: Icon, color }) => (
          <button key={label} className={`${color} rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity`}>
            <Icon className="w-5 h-5" />
            <span className="text-xs font-bold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tourism Officer Dashboard ────────────────────────────────────────────────
function OfficerDashboardPage() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-foreground to-[#5a4a43] rounded-2xl p-5 text-white mb-5">
        <p className="text-white/60 text-xs">Tourism Officer · Cordillera Region</p>
        <h2 className="text-xl font-bold mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>Officer Bautista</h2>
        <div className="flex flex-wrap gap-3 mt-3">
          {[{ label: "Verified Guides", value: "124" }, { label: "Open Cases", value: "3" }, { label: "Safety Alerts", value: "1" }].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl px-3 py-2">
              <p className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</p>
              <p className="text-white/60 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Queue */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>Verification Queue</h3>
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">5 pending</span>
        </div>
        <div className="space-y-3">
          {[
            { name: "Eduardo Ramos", location: "Sagada, Mountain Province", submitted: "Jul 3, 2025", docs: "Complete" },
            { name: "Liza Gonzales", location: "Batanes Islands", submitted: "Jul 4, 2025", docs: "Incomplete" },
            { name: "Pedro Navarro", location: "Baguio City", submitted: "Jul 5, 2025", docs: "Complete" },
          ].map((g) => (
            <div key={g.name} className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm truncate">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.location} · {g.submitted}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.docs === "Complete" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{g.docs}</span>
                <button className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">Review</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Disputes */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>Active Disputes</h3>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">3 open</span>
        </div>
        <div className="space-y-3">
          {[
            { id: "DSP-041", tourist: "James Park", guide: "Luis Ferrer", amount: "₱4,200", reason: "No-show", priority: "High" },
            { id: "DSP-039", tourist: "Sarah Lee", guide: "Minda Cruz", amount: "₱1,800", reason: "Service dispute", priority: "Medium" },
          ].map((d) => (
            <div key={d.id} className="border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-muted-foreground">{d.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.priority === "High" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>{d.priority}</span>
              </div>
              <p className="text-sm text-foreground font-semibold">{d.tourist} vs {d.guide}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{d.reason} · Escrow: {d.amount}</p>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 border border-border text-foreground text-xs font-bold py-1.5 rounded-xl hover:bg-secondary transition-colors">View Evidence</button>
                <button className="flex-1 bg-primary text-white text-xs font-bold py-1.5 rounded-xl hover:bg-[#245530] transition-colors">Resolve</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Alert */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-700 text-sm">Safety Alert · Sagada</p>
          <p className="text-red-600 text-xs mt-1">Unverified individual claiming to be a licensed guide near Echo Valley. Tourist filed report 2h ago.</p>
          <button className="mt-2 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">Investigate</button>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
// ─── PWA Install Banner ───────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[60] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 512 512" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M80 380 L200 200 L260 280 L320 180 L440 380 Z" fill="#4F8A52"/>
            <circle cx="256" cy="178" r="22" fill="#D8B26E"/>
            <path d="M256 200 L256 240" stroke="#D8B26E" strokeWidth="14" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>Install Tahak</p>
          <p className="text-xs text-muted-foreground mt-0.5">Add to your home screen for the best experience — works offline too.</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={async () => {
                if (!prompt) return;
                await prompt.prompt();
                const { outcome } = await prompt.userChoice;
                if (outcome === "accepted") setPrompt(null);
                else setDismissed(true);
              }}
              className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-xl hover:bg-[#245530] transition-colors"
            >
              Install App
            </button>
            <button onClick={() => setDismissed(true)} className="px-3 text-xs text-muted-foreground hover:text-foreground">
              Later
            </button>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0 -mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── PWA Meta Injector ────────────────────────────────────────────────────────
function usePWAMeta() {
  useEffect(() => {
    // Inject manifest link
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "/manifest.webmanifest";
      document.head.appendChild(link);
    }
    // Theme color
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = "#2F6B3C";
      document.head.appendChild(meta);
    }
    // Apple PWA tags
    const appleCapable = document.createElement("meta");
    appleCapable.name = "apple-mobile-web-app-capable";
    appleCapable.content = "yes";
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]'))
      document.head.appendChild(appleCapable);

    const appleStatus = document.createElement("meta");
    appleStatus.name = "apple-mobile-web-app-status-bar-style";
    appleStatus.content = "default";
    if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]'))
      document.head.appendChild(appleStatus);

    const appleTitle = document.createElement("meta");
    appleTitle.name = "apple-mobile-web-app-title";
    appleTitle.content = "Tahak";
    if (!document.querySelector('meta[name="apple-mobile-web-app-title"]'))
      document.head.appendChild(appleTitle);

    // Viewport fix for mobile
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head.appendChild(viewport);
    }
    viewport.content = "width=device-width, initial-scale=1, viewport-fit=cover";

    document.title = "Tahak – Philippine Tour Guide Platform";

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => { /* SW registration failed silently */ });
    }
  }, []);
}

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [role, setRole] = useState<Role>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);

  usePWAMeta();

  const isLanding = page === "landing";
  const isWallet = page === "wallet-connect";
  const showAppShell = !isLanding && !isWallet;

  const handleSetPage = (p: Page) => setPage(p);

  const goToGuide = (id: string) => {
    setSelectedGuideId(id);
    setPage("guide-profile");
  };

  const renderPage = () => {
    switch (page) {
      case "landing": return <LandingPage setPage={handleSetPage} setRole={setRole} goToGuide={goToGuide} />;
      case "wallet-connect": return <WalletConnectPage setPage={handleSetPage} setRole={setRole} />;
      case "explore": return <ExplorePage setPage={handleSetPage} goToGuide={goToGuide} />;
      case "guide-profile": return <GuideProfilePage setPage={handleSetPage} guideId={selectedGuideId} />;
      case "bookings": return <BookingsPage />;
      case "guide-dashboard": return <GuideDashboardPage />;
      case "officer-dashboard": return <OfficerDashboardPage />;
      default: return <LandingPage setPage={handleSetPage} setRole={setRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Demo role switcher */}
      {showAppShell && (
        <div className="hidden md:flex fixed top-3 right-3 z-50 items-center gap-1.5 bg-card border border-border rounded-xl p-1 shadow-sm">
          <span className="text-[10px] text-muted-foreground px-2 font-medium">Demo:</span>
          {(["tourist", "guide", "officer"] as Role[]).map((r) => (
            <button key={r} onClick={() => { setRole(r); if (r === "guide") setPage("guide-dashboard"); else if (r === "officer") setPage("officer-dashboard"); else setPage("explore"); }} className={`capitalize text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${role === r ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary"}`}>
              {r}
            </button>
          ))}
        </div>
      )}

      {showAppShell && (
        <>
          <Sidebar page={page} setPage={handleSetPage} role={role} />
          <div className="md:pl-64">
            <TopBar page={page} setPage={handleSetPage} role={role} />
            <main className="pb-20 md:pb-6">
              {renderPage()}
            </main>
          </div>
          <BottomNav page={page} setPage={handleSetPage} role={role} />
        </>
      )}

      {!showAppShell && renderPage()}

      <PWAInstallBanner />
    </div>
  );
}
