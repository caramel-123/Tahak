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
