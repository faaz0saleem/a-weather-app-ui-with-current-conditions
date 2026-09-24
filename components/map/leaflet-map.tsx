"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polygon, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { MapMarker, WaqtMapProps } from "./types";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const STYLES: Record<MapMarker["kind"], string> = {
  drop: "background:var(--wp-ink);color:var(--wp-cream);",
  restaurant: "background:var(--wp-brand);color:var(--wp-brandInk);",
  rider: "background:var(--wp-mint);color:#fff;",
  me: "background:#2f80ed;color:#fff;",
  pin: "background:var(--wp-brand);color:var(--wp-brandInk);",
};

function iconFor(m: MapMarker) {
  const size = m.kind === "pin" ? 44 : 36;
  const toneRing =
    m.tone === "warn" ? "box-shadow:0 0 0 3px var(--wp-chili);" : m.tone === "muted" ? "opacity:.55;" : "";
  const pulse = m.pulse
    ? `<span style="position:absolute;inset:0;border-radius:9999px;background:inherit;animation:var(--animate-pulse-ring);"></span>`
    : "";
  const body =
    m.kind === "pin"
      ? `<div style="position:relative;width:${size}px;height:${size}px;transform:translateY(-18px)">
           <div style="${STYLES.pin}width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;box-shadow:0 8px 18px -6px rgba(0,0,0,.45);border:3px solid var(--wp-card)">
             <span style="transform:rotate(45deg);font-size:18px">${m.label ?? "📍"}</span>
           </div>
         </div>`
      : `<div style="position:relative;${STYLES[m.kind]}${toneRing}width:${size}px;height:${size}px;border-radius:9999px;display:grid;place-items:center;font-size:17px;font-weight:700;border:3px solid var(--wp-card);box-shadow:0 6px 16px -6px rgba(0,0,0,.5)">${pulse}<span style="position:relative">${m.label ?? ""}</span></div>`;
  return L.divIcon({ html: body, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

function FitBounds({ points, fitKey }: { points?: WaqtMapProps["fitTo"]; fitKey?: string }) {
  const map = useMap();
  const key = fitKey ?? JSON.stringify(points?.map((p) => [p.lat.toFixed(4), p.lng.toFixed(4)]));
  useEffect(() => {
    if (!points || points.length === 0) return;
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], Math.max(map.getZoom(), 15));
    else map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [48, 48], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

function FollowCenter({ center, enabled }: { center: WaqtMapProps["center"]; enabled?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (enabled) map.panTo([center.lat, center.lng], { animate: true });
  }, [center.lat, center.lng, enabled, map]);
  return null;
}

function ClickHandler({ onClick }: { onClick?: WaqtMapProps["onClick"] }) {
  useMapEvents({ click: (e) => onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** Re-measure when the container resizes (bottom sheets, tabs). */
function Resizer() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function DraggableMarker({ m }: { m: MapMarker }) {
  const ref = useRef<L.Marker>(null);
  const icon = useMemo(() => iconFor(m), [m]);
  const handlers = useMemo(
    () => ({
      dragend() {
        const ll = ref.current?.getLatLng();
        if (ll) m.onDragEnd?.({ lat: ll.lat, lng: ll.lng });
      },
      click(e: L.LeafletMouseEvent) {
        if (!m.onClick) return;
        L.DomEvent.stopPropagation(e);
        m.onClick();
      },
    }),
    [m],
  );
  return (
    <Marker
      ref={ref}
      position={[m.position.lat, m.position.lng]}
      icon={icon}
      draggable={!!m.draggable}
      eventHandlers={handlers}
      title={m.title}
      zIndexOffset={m.kind === "pin" ? 1000 : m.kind === "rider" ? 500 : 0}
      keyboard={!!m.draggable}
    />
  );
}

export default function LeafletMap(props: WaqtMapProps) {
  const { center, zoom = 15, markers = [], polygons = [], polylines = [], interactive = true } = props;
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className={props.className}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      attributionControl
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
    >
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
      <Resizer />
      <FitBounds points={props.fitTo} fitKey={props.fitKey} />
      <FollowCenter center={center} enabled={props.followCenter} />
      {props.onClick && <ClickHandler onClick={props.onClick} />}
      {polygons.map((p) => (
        <Polygon
          key={p.id}
          positions={p.points.map((x) => [x.lat, x.lng] as [number, number])}
          pathOptions={{
            color: p.tone === "warn" ? "#E03131" : "#F08A24",
            weight: 2,
            fillOpacity: 0.06,
            dashArray: "6 6",
          }}
        />
      ))}
      {polylines.map((l) => (
        <Polyline
          key={l.id}
          positions={l.points.map((x) => [x.lat, x.lng] as [number, number])}
          pathOptions={{ color: "#F08A24", weight: 4, opacity: 0.85, dashArray: l.dashed ? "2 10" : undefined, lineCap: "round" }}
        />
      ))}
      {markers.map((m) => (
        <DraggableMarker key={m.id} m={m} />
      ))}
    </MapContainer>
  );
}
