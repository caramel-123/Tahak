import { describe, it, expect, vi } from "vitest";

vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-anon-key");

const { guideRowToVM } = await import("./supabase");

describe("guideRowToVM", () => {
  it("maps a Supabase guide row to the view model shape used by the UI", () => {
    const row = {
      id: "abc-123",
      name: "Maria Santos",
      location: "Banaue, Ifugao",
      specialty: "Rice Terraces & Hiking",
      bio: "12 years guiding the Cordillera highlands.",
      avatar_url: "https://example.com/avatar.jpg",
      cover_url: "https://example.com/cover.jpg",
      rating: "4.97",
      review_count: 312,
      tours_completed: 847,
      price_per_day: "2800.00",
      languages: ["Filipino", "English"],
      specialties: ["Rice Terraces", "Mountain Trekking"],
      badges: ["DOT Accredited"],
      verified: true,
    };

    const vm = guideRowToVM(row as any);

    expect(vm.id).toBe("abc-123");
    expect(vm.rating).toBe(4.97);
    expect(vm.price).toBe(2800);
    expect(vm.reviews).toBe(312);
    expect(vm.tours).toBe(847);
  });

  it("falls back to empty arrays/strings when optional fields are null", () => {
    const row = {
      id: "xyz-789",
      name: "New Guide",
      location: "Cebu",
      specialty: "City Tours",
      bio: null,
      avatar_url: null,
      cover_url: null,
      rating: 0,
      review_count: 0,
      tours_completed: 0,
      price_per_day: 0,
      languages: null,
      specialties: null,
      badges: null,
      verified: false,
    };

    const vm = guideRowToVM(row as any);

    expect(vm.bio).toBe("");
    expect(vm.avatar).toBe("");
    expect(vm.languages).toEqual([]);
    expect(vm.badges).toEqual([]);
  });
});
