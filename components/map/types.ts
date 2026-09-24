import type { LatLng } from "@/lib/geo";

/**
 * Provider-agnostic map API. Everything in the app talks to <WaqtMap/> with
 * these props; only components/map/leaflet-map.tsx knows about Leaflet.
 * To switch to Google Maps, add google-map.tsx implementing the same props.
 */
export type MarkerKind = "drop" | "restaurant" | "rider" | "me" | "pin";

export type MapMarker = {
  id: string;
  position: LatLng;
  kind: MarkerKind;
  /** Emoji or short text shown inside the marker. */
  label?: string;
  title?: string;
  draggable?: boolean;
  onDragEnd?: (p: LatLng) => void;
  pulse?: boolean;
  /** Rider heading/"late risk" etc. */
  tone?: "default" | "warn" | "muted";
};

export type MapPolygon = { id: string; points: LatLng[]; tone?: "zone" | "warn" };
export type MapPolyline = { id: string; points: LatLng[]; dashed?: boolean };

export type WaqtMapProps = {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  polygons?: MapPolygon[];
  polylines?: MapPolyline[];
  /** Fit the view to these points (on mount and when the list's identity changes). */
  fitTo?: LatLng[];
  fitKey?: string;
  onClick?: (p: LatLng) => void;
  className?: string;
  interactive?: boolean;
  /** Pan to center when it changes. */
  followCenter?: boolean;
};
