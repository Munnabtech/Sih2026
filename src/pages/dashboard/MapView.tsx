import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { riskLevel } from "./data";

/* North East Region of India: Sikkim (W) to Arunachal Pradesh (E),
   Bhutan/Bangladesh borders at the south-west edge of the viewport. */
const NER_BOUNDS: [[number, number], [number, number]] = [
  [21.6, 87.9],
  [29.6, 98.3],
];

const MARKER_COLORS = {
  red: "#c94f42",
  orange: "#d97a3c",
  green: "#7e9c7e",
} as const;

const LEGEND = [
  { color: MARKER_COLORS.red, label: "High / Critical" },
  { color: MARKER_COLORS.orange, label: "Moderate" },
  { color: MARKER_COLORS.green, label: "Low" },
];

function markerColor(risk: number): string {
  if (risk >= 61) return MARKER_COLORS.red;
  if (risk >= 41) return MARKER_COLORS.orange;
  return MARKER_COLORS.green;
}

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div class="dnt-marker" style="--dnt-marker-color: ${color}"><span class="dnt-marker__pin"></span><span class="dnt-marker__dot"></span></div>`,
    iconSize: [26, 36],
    iconAnchor: [13, 34],
    popupAnchor: [0, -36],
  });
}

/** Re-fits the view to the whole North East Region when signalled. */
function FitToBounds({
  bounds,
  signal,
}: {
  bounds: [[number, number], [number, number]];
  signal: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (signal > 0) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [signal, map, bounds]);
  return null;
}

interface MapViewProps {
  onSelect: (zone: Doc<"zones">) => void;
}

export function MapView({ onSelect }: MapViewProps) {
  const zones = useQuery(api.zones.listZones);
  const [query, setQuery] = useState("");
  const [fitSignal, setFitSignal] = useState(0);

  const markers = useMemo(() => {
    if (!zones) return undefined;
    const q = query.trim().toLowerCase();
    return zones.filter((zone) => {
      if (zone.latitude === undefined || zone.longitude === undefined) {
        return false;
      }
      if (!q) return true;
      return [zone.name, zone.code, zone.state ?? "", zone.district, zone.type]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [zones, query]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Zones</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Risk map</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-background">
        {/* Search */}
        <div className="relative border-b border-border">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter markers by name, code, state, or district"
            className="h-12 w-full bg-transparent pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Interactive map */}
        <div className="relative z-0 h-[420px] sm:h-[500px]">
          <MapContainer
            bounds={NER_BOUNDS}
            className="h-full w-full"
            attributionControl={true}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Standard">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                  attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <FitToBounds bounds={NER_BOUNDS} signal={fitSignal} />

            {markers?.map((zone) => {
              const lat = zone.latitude;
              const lng = zone.longitude;
              if (lat === undefined || lng === undefined) return null;
              const level = riskLevel(zone.risk);
              return (
                <Marker
                  key={zone._id}
                  position={[lat, lng]}
                  icon={makeIcon(markerColor(zone.risk))}
                >
                  <Popup>
                    <div className="dnt-popup">
                      <p className="dnt-popup__name">{zone.name}</p>
                      <p className="dnt-popup__code">{zone.code}</p>
                      <div className="dnt-popup__grid">
                        <span className="dnt-popup__k">State</span>
                        <span className="dnt-popup__v">{zone.state ?? "—"}</span>
                        <span className="dnt-popup__k">District</span>
                        <span className="dnt-popup__v">{zone.district}</span>
                        <span className="dnt-popup__k">Coordinates</span>
                        <span className="dnt-popup__v dnt-popup__code">
                          {lat.toFixed(4)}, {lng.toFixed(4)}
                        </span>
                        <span className="dnt-popup__k">Risk level</span>
                        <span
                          className={`dnt-popup__risk dnt-popup__v ${level.text}`}
                        >
                          {level.level.toUpperCase()}
                        </span>
                        <span className="dnt-popup__k">Risk probability</span>
                        <span className="dnt-popup__v">
                          {zone.risk}%
                        </span>
                        <span className="dnt-popup__k">Status</span>
                        <span className="dnt-popup__v">
                          {zone.status === "monitored"
                            ? "Actively monitoring"
                            : "Standby"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="dnt-popup__btn"
                        onClick={() => onSelect(zone)}
                      >
                        View details
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGEND.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
          <Button
            type="button"
            className="gap-2"
            onClick={() => setFitSignal((s) => s + 1)}
          >
            <LocateFixed className="size-4" />
            Summary
          </Button>
        </div>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Interactive map of monitored zones across the eight North East Region
        states. Markers are placed at real district monitoring coordinates;
        click a marker for details, or use the layer switcher for satellite
        imagery.
      </p>
    </div>
  );
}