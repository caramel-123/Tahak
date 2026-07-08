import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars are missing — data calls will fail. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Guide = {
  id: string;
  name: string;
  location: string;
  specialty: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  rating: number;
  review_count: number;
  tours_completed: number;
  price_per_day: number;
  languages: string[];
  specialties: string[];
  badges: string[];
  verified: boolean;
};

export type Destination = {
  id: string;
  name: string;
  region: string;
  image_url: string | null;
  guide_count: number;
};

export type Testimonial = {
  id: string;
  guide_id: string | null;
  name: string;
  country: string | null;
  avatar_url: string | null;
  rating: number;
  text: string;
};

export type Booking = {
  id: string;
  code: string;
  guide_id: string | null;
  destination: string;
  booking_date: string | null;
  status: "upcoming" | "ongoing" | "completed" | "cancelled" | "disputed";
  amount: number;
  milestone: string | null;
  progress: number;
  guides?: { name: string; avatar_url: string | null } | null;
};

export type GuideVM = {
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

export function guideRowToVM(g: Guide): GuideVM {
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
    avatar: g.avatar_url ?? "",
    cover: g.cover_url ?? "",
    bio: g.bio ?? "",
    specialties: g.specialties ?? [],
  };
}
