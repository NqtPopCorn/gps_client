export interface POI {
  id: string;
  name: string;
  description: string;
  image: string;
  lat: number;
  lng: number;
  rating: number;
  duration: string;
  visited?: boolean;
}

export type Screen =
  | "home"
  | "scan"
  | "history"
  | "profile"
  | "poi_detail"
  | "audio_player";
