import type { ServiceCategory } from "@prisma/client";

export type ServicePresetRow = {
  key: string;
  name: string;
  nameAr?: string;
  category: ServiceCategory;
  suggestedPrice: number;
  unit?: string;
};

/** Default catalogue pitched during onboarding — creates Service rows when selected. */
export const SERVICE_PRESETS: ServicePresetRow[] = [
  { key: "traiteur", name: "Traiteur menu complet", nameAr: "تموين كامل", category: "CATERING", suggestedPrice: 350_000 },
  { key: "buffet_froid", name: "Buffet froid premium", category: "CATERING", suggestedPrice: 280_000 },
  { key: "dj", name: "DJ & sonorisation", nameAr: "دي جي وصوت", category: "MUSIC", suggestedPrice: 150_000, unit: "soirée" },
  { key: "orchestre", name: "Orchestre oriental", category: "MUSIC", suggestedPrice: 220_000 },
  { key: "photo", name: "Photo & Vidéographie", category: "PHOTO_VIDEO", suggestedPrice: 120_000 },
  { key: "decoration", name: "Décoration florale", category: "DECORATION", suggestedPrice: 180_000 },
  { key: "gateau", name: "Gâteau de mariage", category: "CAKE", suggestedPrice: 45_000 },
  { key: "lumiere", name: "Éclairage ambiance", category: "LIGHTING", suggestedPrice: 90_000 },
  { key: "securite", name: "Sécurité / vigiles", category: "SECURITY", suggestedPrice: 35_000, unit: "équipe" },
  { key: "hostess", name: "Hôtesses d’accueil", category: "HOSTING", suggestedPrice: 25_000, unit: "personne" },
];

export type AmenityPresetRow = {
  key: string;
  name: string;
  nameAr?: string;
};

/** Quick amenity catalogue — onboarding creates Venue Amenity rows for checked items. */
export const AMENITY_PRESETS: AmenityPresetRow[] = [
  { key: "parking", name: "Parking", nameAr: "موقف سيارات" },
  { key: "priere", name: "Salle de prière", nameAr: "مصلى" },
  { key: "mariée", name: "Chambre de la mariée", nameAr: "غرفة العروس" },
  { key: "clim", name: "Climatisation", nameAr: "تكييف" },
  { key: "wifi", name: "Wi‑Fi gratuit" },
  { key: "jardin", name: "Espace extérieur / Jardin", nameAr: "حديقة" },
  { key: "acces_rampe", name: "Accès PMR / rampes", nameAr: "دخول المعاقين" },
  { key: "vestiaire", name: "Vestiaires" },
  { key: "cuisine_prep", name: "Espace préparation cuisine" },
  { key: "gardiennage", name: "Gardiennage nuit possible" },
  { key: "vaisselle", name: "Vaisselle incluse", nameAr: "أواني ضيافة" },
  { key: "electricite_scene", name: "Triphasé / régie scène" },
];
