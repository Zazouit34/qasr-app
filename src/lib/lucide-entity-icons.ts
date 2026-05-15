import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Briefcase,
  Cake,
  Camera,
  Car,
  Coffee,
  Dumbbell,
  Flower2,
  Music,
  Package,
  ParkingCircle,
  Sparkles,
  Tv,
  Utensils,
  Waves,
  Wifi,
} from "lucide-react";

export function amenityIconFor(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/wifi|wi-?fi|internet/.test(n)) return Wifi;
  if (/park|parking|voiture|car/.test(n)) return ParkingCircle;
  if (/piscine|pool|spa|jacuzzi/.test(n)) return Waves;
  if (/café|coffee|boisson|bar/.test(n)) return Coffee;
  if (/enfant|baby|jeux|kid/.test(n)) return Baby;
  if (/fleur|décor|jardin|garden|arch/.test(n)) return Flower2;
  if (/musique|son|dj|audio|micro/.test(n)) return Music;
  if (/écran|tv|video|project/.test(n)) return Tv;
  if (/sport|gym|fitness/.test(n)) return Dumbbell;
  if (/gâteau|gateau|patiss/.test(n)) return Cake;
  if (/repas|menu|traiteur|buffet|cuisine|restauration/.test(n)) return Utensils;
  return Sparkles;
}

export function serviceIconFor(name: string, category?: string | null): LucideIcon {
  const n = `${name} ${category ?? ""}`.toLowerCase();
  if (/photo|vidéo|video|film|drone/.test(n)) return Camera;
  if (/traiteur|buffet|repas|menu|bar|gateau|gâteau|catering/.test(n)) return Utensils;
  if (/fleur|décor|décorat|lumière|light|arch/.test(n)) return Flower2;
  if (/musique|dj|sonor/.test(n)) return Music;
  if (/voiture|transport|navette|car/.test(n)) return Car;
  if (/forfait|package|bundle|pack/.test(n)) return Package;
  return Briefcase;
}
