import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ArrowLeft, Crosshair, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import {
  type IncidentItem,
  haversineKm,
  incidentStatusLabel,
  severityLabel,
} from "./data";
import { BasemapSwitcher } from "./MapControls";
import { MapChrome } from "./MapShared";
import {
  type BasemapId,
  incidentIcon,
  zoneIcon,
} from "./map";

interface IncidentIntelProps {
  incident?: IncidentItem | null;
  onBack: () => void;
}

const RADII = [1, 5, 10, 25] as const;

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </p>
        {note && <span className="text-[10px] text-muted-foreground">{note}</span>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-[13px] font-medium">{value}</span>
    </div>
  );
}

function UnavailableRow({ label }: { label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-xs italic text-muted-foreground">
        Data unavailable
      </span>
    </div>
  );
}

/** Centers the map on the incident when signalled. */
function FocusIncident({
  lat,
  lng,
  signal,
}: {
  lat: number;
  lng: number;
  signal: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (signal > 0) {
      map.setView([lat, lng], Math.max(map.getZoom(), 13), { animate: true });
    }
  }, [signal, lat, lng, map]);
  return null;
}

export function IncidentIntel({ incident, onBack }: IncidentIntelProps) {
  const zones = useQuery(api.zones.listZones);
  const [basemap, setBasemap] = useState<BasemapId>("satellite");
  const [radius, setRadius] = useState<number>(10);
  const [focusSignal, setFocusSignal] = useState(0);

  const hasCoords =
    incident?.latitude !== undefined && incident?.longitude !== undefined;

  const nearby = useMemo(() => {
    if (!incident || !hasCoords || !zones) return undefined;
    return zones
      .filter((z) => z.latitude !== undefined && z.longitude !== undefined)
      .map((z) => ({
        zone: z,
        distance: haversineKm(
          incident.latitude!,
          incident.longitude!,
          z.latitude!,
          z.longitude!,
        ),
      }))
      .filter(({ distance }) => distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }, [incident, zones, radius, hasCoords]);

  if (!incident) {
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={onBack}
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to incidents
        </button>
        <div className="rounded-md border border-dashed border-border bg-card px-6 py-14 text-center text-sm text-muted-foreground">
          Incident not found.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to incidents
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              INC-{incident.id.slice(-6).toUpperCase()}
            </span>
            <Badge className="rounded-sm bg-primary text-[10px] font-medium text-primary-foreground">
              {incidentStatusLabel(incident.status)}
            </Badge>
            <Badge variant="outline" className="rounded-sm text-[10px] font-medium">
              {severityLabel(incident.severity)}
            </Badge>
          </div>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight">
            {incident.type}
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {incident.state ? `${incident.state} · ` : ""}
            {incident.district ?? incident.location} · reported{" "}
            {format(new Date(incident.createdAt), "d MMM yyyy, HH:mm")}
          </p>
        </div>
      </div>

      {/* Three-column layout: info / map / context */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)_minmax(0,4fr)]">
        {/* LEFT — incident information */}
        <div className="flex flex-col gap-4">
          <Section title="Incident information">
            <div className="flex flex-col divide-y divide-border">
              <Row label="Status" value={incidentStatusLabel(incident.status)} />
              <Row label="Severity" value={severityLabel(incident.severity)} />
              <Row label="Time reported" value={format(new Date(incident.createdAt), "d MMM yyyy, HH:mm")} />
              <Row label="District" value={incident.district ?? "Not stated"} />
              <Row
                label="Coordinates"
                value={
                  hasCoords
                    ? `${incident.latitude!.toFixed(5)}, ${incident.longitude!.toFixed(5)}`
                    : "Not provided"
                }
              />
              <Row label="Reporter" value={incident.reporterName} />
            </div>
          </Section>

          <Section title="Description">
            <p className="px-4 py-3 text-sm leading-6 text-muted-foreground">
              {incident.description}
            </p>
          </Section>

          <Section title="Verification status" note="Never automatic">
            <div className="px-4 py-3">
              <p className="text-sm leading-6 text-muted-foreground">
                {incident.status === "verified"
                  ? "Verified by the monitoring desk."
                  : incident.status === "under_verification"
                    ? "Verification is in progress."
                    : "This is a citizen or field report. It has not been independently verified yet."}
              </p>
            </div>
          </Section>
        </div>

        {/* CENTER — the map */}
        <div className="flex flex-col gap-2">
          <div className="relative z-0 h-[320px] overflow-hidden rounded-md border border-border lg:h-[480px]">
            {hasCoords ? (
              <MapContainer
                center={[incident.latitude!, incident.longitude!]}
                zoom={13}
                className="h-full w-full"
                attributionControl
              >
                <MapChrome basemap={basemap} />
                <TileLayer
                  key={basemap}
                  url={
                    basemap === "satellite"
                      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      : basemap === "terrain"
                        ? "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  }
                  attribution={
                    basemap === "satellite"
                      ? "Imagery &copy; Esri, Maxar, Earthstar Geographics"
                      : basemap === "terrain"
                        ? "&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)"
                        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  }
                  maxZoom={basemap === "satellite" ? 18 : basemap === "terrain" ? 17 : 19}
                />
                <FocusIncident
                  lat={incident.latitude!}
                  lng={incident.longitude!}
                  signal={focusSignal}
                />
                <Marker
                  position={[incident.latitude!, incident.longitude!]}
                  icon={incidentIcon(incident.severity)}
                />
                {nearby?.map(({ zone }) =>
                  zone.latitude !== undefined && zone.longitude !== undefined ? (
                    <Marker
                      key={zone._id}
                      position={[zone.latitude, zone.longitude]}
                      icon={zoneIcon(zone)}
                    />
                  ) : null,
                )}
              </MapContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted/40 px-6 text-center">
                <MapPin className="size-5 text-muted-foreground" />
                <p className="text-sm font-medium">No coordinates reported</p>
                <p className="max-w-56 text-xs leading-5 text-muted-foreground">
                  Map context becomes available once the incident location is
                  geotagged during verification.
                </p>
              </div>
            )}

            {hasCoords && (
              <div className="absolute right-3 top-3 z-[500] flex flex-col items-end gap-2">
                <BasemapSwitcher value={basemap} onChange={setBasemap} />
                <button
                  type="button"
                  aria-label="Zoom to incident"
                  onClick={() => setFocusSignal((s) => s + 1)}
                  className="map-panel flex size-9 items-center justify-center bg-card text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Crosshair className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — risk & monitoring context */}
        <div className="flex flex-col gap-4">
          <Section title="Current risk context" note="Telemetry not connected">
            <div className="flex flex-col divide-y divide-border">
              <UnavailableRow label="Landslide risk" />
              <UnavailableRow label="Rainfall condition" />
              <UnavailableRow label="Terrain / slope" />
              <UnavailableRow label="Historical landslides" />
            </div>
          </Section>

          <Section
            title="Nearby monitoring"
            note={hasCoords ? `${nearby?.length ?? 0} zones within ${radius} km` : undefined}
          >
            {!hasCoords ? (
              <p className="px-4 py-3 text-xs leading-5 text-muted-foreground">
                Requires incident coordinates.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
                  <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    Radius
                  </span>
                  <div className="flex gap-1">
                    {RADII.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRadius(r)}
                        className={`rounded-sm px-2 py-1 text-[11px] font-medium transition-colors ${
                          radius === r
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col divide-y divide-border">
                  {nearby !== undefined && nearby.length === 0 && (
                    <p className="px-4 py-3 text-xs leading-5 text-muted-foreground">
                      No monitored zones within {radius} km.
                    </p>
                  )}
                  {nearby?.slice(0, 5).map(({ zone, distance }) => (
                    <div key={zone._id} className="flex items-center gap-2.5 px-4 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">
                          {zone.name}
                        </span>
                        <span className="block font-mono text-[10px] text-muted-foreground">
                          {zone.code}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                        {distance.toFixed(1)} km
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>

          <Section title="Impact assessment" note="Authoritative data only">
            <div className="flex flex-col divide-y divide-border">
              <UnavailableRow label="Roads affected" />
              <UnavailableRow label="Settlements nearby" />
              <UnavailableRow label="Infrastructure" />
              <UnavailableRow label="Population exposure" />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}