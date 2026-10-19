"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { WaqtMapProps } from "./types";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => <div className="skeleton size-full" />,
});

/** The one map component the app uses. Swap provider inside, not at call sites. */
export function WaqtMap({ className, ...props }: WaqtMapProps) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-muted", className)}>
      <LeafletMap {...props} />
    </div>
  );
}

export type { MapMarker, MapPolygon, MapPolyline, WaqtMapProps } from "./types";
