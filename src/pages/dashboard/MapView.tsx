import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  Camera,
  Crosshair,
  Search,
  ShieldAlert,
  Signal,
  SignalHigh,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, useMapEvents } from "react-leaflet";
import {
  NER_STATES,
  type IncidentItem,
  incidentStatusLabel,
} from "./data";
import {
  BasemapSwitcher,
  OverlayPanel,
} from "./MapControls";
import {
  BasemapTileLayer,
  FitBounds,
  MapChrome,
  MapLegend,
} from "./MapShared";
import {
  DEFAULT_OVERLAYS,
  MODEL_COVERAGE_DISTRICTS,
  NER_BOUNDS,
  type BasemapId,
  type OverlayId,
  coverageFor,
  hasModelCoverage,
  incidentIcon,
  zoneIcon,
} from "./map";

interface MapViewProps {
  onSelect: (zone: Doc<"zones">) => void;
  onReport: (location: string) => void;
  onOpenIncident: (incident: IncidentItem) => void;
}

interface Selection {
  kind: "zone" | "district";
  zone?: Doc<"zones">;
  state: string;
  district: string;
  signal: number;
}

function PanelRows({ rows }: { rows: { k: string; v: React.ReactNode }[] }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {rows.map((row) => (
        <div key={row.k} className="flex items-baseline justify-between gap-4 py-2 first:pt-0">
          <span className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {row.k}
          </span>
          <span className="text-right text-sm font-medium">{row.v}</span>
        </div>
      ))}
    </div>
  );
}

/** Click-anywhere readout: resolves the clicked point to state/district coverage. */
function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function MapView({ onSelect, onReport, onOpenIncident }: MapViewProps) {
  const zones = useQuery(api.zones.listZones);
  const incidents = useQuery(api.incidents.listIncidents);

  const [basemap, setBasemap] = useState<BasemapId>("standard");
  const [overlays, setOverlays] = useState<OverlayId[]>(DEFAULT_OVERLAYS);
  const [state, setState] = useState("all");
  const [district, setDistrict] = useState("all");
  const [query, setQuery] = useState("");
  const [fitSignal, setFitSignal] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [mobileSheet, setMobileSheet] = useState(false);
  const [tileError, setTileError] = useState(false);

  // Basemap switch never resets the selection; tile errors reset only the flag.
  useEffect(() => setTileError(false), [basemap]);

  const toggleOverlay = (id: OverlayId) =>
    setOverlays((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id],
    );

  const districtsInState = useMemo(() => {
    const set = new Set<string>();
    (zones ?? []).forEach((zone) => {
      if (state !== "all" && zone.state !== state) return;
      set.add(zone.district);
    });
    if (state !== "all") (MODEL_COVERAGE_DISTRICTS[state] ?? []).forEach((d) => set.add(d));
    return [...set].sort();
  }, [zones, state]);

  const visibleZones = useMemo(() => {
    if (!zones) return undefined;
    const q = query.trim().toLowerCase();
    return zones.filter((zone) => {
      if (state !== "all" && zone.state !== state) return false;
      if (district !== "all" && zone.district !== district) return false;
      if (!q) return true;
      return [zone.name, zone.code, zone.state ?? "", zone.district, zone.type]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [zones, state, district, query]);

  const visibleIncidents = useMemo(() => {
    if (!incidents) return undefined;
    return incidents.filter((incident) => {
      if (state !== "all" && incident.state !== state) return false;
      if (district !== "all" && incident.district !== district) return false;
      return incident.latitude !== undefined && incident.longitude !== undefined;
    });
  }, [incidents, state, district]);

  const riskMarkers =
    overlays.includes("risk") && overlays.includes("monitoring")
      ? visibleZones
      : overlays.includes("risk")
        ? visibleZones?.filter((z) => hasModelCoverage(z.state, z.district))
        : overlays.includes("monitoring")
          ? visibleZones?.filter((z) => !hasModelCoverage(z.state, z.district))
          : [];

  const pickPoint = (lat: number, lng: number) => {
    // Reverse-resolve crudely against known zones: nearest district label.
    const near = (zones ?? [])
      .filter((z) => z.latitude !== undefined && z.longitude !== undefined)
      .map((z) => ({
        z,
        d: Math.hypot((z.latitude! - lat) * 111, (z.longitude! - lng) * 100),
      }))
      .sort((a, b) => a.d - b.d)[0];
    if (near && near.d < 120) {
      setSelection({
        kind: "district",
        state: near.z.state ?? "Unknown",
        district: near.z.district,
        signal: 0,
      });
    } else {
      setSelection({
        kind: "district",
        state: "Outside registered districts",
        district: `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
        signal: 0,
      });
    }
    setMobileSheet(true);
  };

  const selectZone = (zone: Doc<"zones">) => {
    setSelection({
      kind: "zone",
      zone,
      state: zone.state ?? "Unknown",
      district: zone.district,
      signal: 0,
    });
    setMobileSheet(true);
  };

  const panel = selection ? (
    selection.kind === "zone" && selection.zone ? (
      <ZonePanel
        zone={selection.zone}
        onViewDetails={() => selection.zone && onSelect(selection.zone)}
        onReport={() =>
          selection.zone &&
          onReport(`${selection.zone.name}, ${selection.zone.district} district`)
        }
      />
    ) : (
      <DistrictPanel
        state={selection.state}
        district={selection.district}
        zones={(zones ?? []).filter(
          (z) => z.state === selection.state && z.district === selection.district,
        )}
        incidents={(incidents ?? []).filter(
          (i) => i.state === selection.state && i.district === selection.district,
        )}
        onOpenIncident={onOpenIncident}
        onReport={() =>
          onReport(`${selection.district}, ${selection.state}`)
        }
      />
    )
  ) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Geographic situation awareness</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Risk map — North Eastern Region
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Signal className="size-3.5" />
          {zones === undefined ? "Loading map data…" : `${visibleZones?.length ?? 0} zones in view`}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search zones, districts, or states"
            className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex">
          <Select
            value={state}
            onValueChange={(v) => {
              setState(v);
              setDistrict("all");
            }}
          >
            <SelectTrigger className="h-10 w-full text-xs lg:w-44">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All states (NER)</SelectItem>
              {NER_STATES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="h-10 w-full text-xs lg:w-44">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All districts</SelectItem>
              {districtsInState.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* The map dominates */}
      <div className="relative z-0 h-[calc(100vh-16rem)] min-h-[440px] overflow-hidden rounded-md border border-border lg:h-[calc(100vh-15rem)]">
        {zones === undefined ? (
          <div className="flex h-full items-center justify-center bg-muted/40">
            <div className="text-center">
              <div className="skeleton mx-auto h-1.5 w-40" />
              <p className="mt-3 text-xs text-muted-foreground">Loading map…</p>
            </div>
          </div>
        ) : (
          <MapContainer
            bounds={NER_BOUNDS}
            className="h-full w-full"
            attributionControl
          >
            <MapChrome basemap={basemap} />
            <BasemapTileLayer basemap={basemap} onError={() => setTileError(true)} />
            <FitBounds bounds={NER_BOUNDS} signal={fitSignal} />
            <ClickCapture onPick={pickPoint} />

            {riskMarkers?.map((zone) => {
              if (zone.latitude === undefined || zone.longitude === undefined) return null;
              return (
                <Marker
                  key={zone._id}
                  position={[zone.latitude, zone.longitude]}
                  icon={zoneIcon(zone)}
                  eventHandlers={{ click: () => selectZone(zone) }}
                >
                  <Popup>
                    <div className="dnt-popup">
                      <p className="dnt-popup__name">{zone.name}</p>
                      <p className="dnt-popup__code">{zone.code} · {zone.district}</p>
                      {hasModelCoverage(zone.state, zone.district) ? (
                        <div className="dnt-popup__grid">
                          <span className="dnt-popup__k">Risk level</span>
                          <span className="dnt-popup__v dnt-popup__risk">
                            {zone.risk} / 100
                          </span>
                          <span className="dnt-popup__k">Source</span>
                          <span className="dnt-popup__v">Model assessment</span>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                          ML model coverage currently unavailable for this
                          district.
                        </p>
                      )}
                      <button
                        type="button"
                        className="dnt-popup__btn"
                        onClick={() => selectZone(zone)}
                      >
                        Open details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {overlays.includes("incidents") &&
              visibleIncidents?.map((incident) => (
                <Marker
                  key={incident.id}
                  position={[incident.latitude!, incident.longitude!]}
                  icon={incidentIcon(incident.severity)}
                  eventHandlers={{ click: () => onOpenIncident(incident) }}
                >
                  <Popup>
                    <div className="dnt-popup">
                      <p className="dnt-popup__name">{incident.type}</p>
                      <p className="dnt-popup__code">
                        {incident.district ?? incident.location}
                      </p>
                      <div className="dnt-popup__grid">
                        <span className="dnt-popup__k">Status</span>
                        <span className="dnt-popup__v">
                          {incidentStatusLabel(incident.status)}
                        </span>
                        <span className="dnt-popup__k">Reported</span>
                        <span className="dnt-popup__v">
                          {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="dnt-popup__btn"
                        onClick={() => onOpenIncident(incident)}
                      >
                        Open incident
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        )}

        {/* Floating controls — top right */}
        <div className="absolute right-3 top-3 z-[500] flex flex-col items-end gap-2">
          <BasemapSwitcher value={basemap} onChange={setBasemap} />
          <OverlayPanel
            active={overlays}
            onToggle={toggleOverlay}
            coverageNote="ML risk markers appear only where the trained model provides predictions."
          />
          <button
            type="button"
            aria-label="Reset view to full NER"
            onClick={() => setFitSignal((s) => s + 1)}
            className="map-panel flex size-9 items-center justify-center bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <Crosshair className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Legend — bottom left */}
        <div className="absolute bottom-3 left-3 z-[500] hidden sm:block">
          <MapLegend />
        </div>

        {/* Tile error — honest recovery */}
        {tileError && (
          <div className="absolute inset-x-3 top-3 z-[600] flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 shadow-sm lg:left-24">
            <p className="text-xs text-muted-foreground">
              Some map tiles failed to load.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => setBasemap("standard")}
            >
              Use Standard map
            </Button>
          </div>
        )}

        {/* Desktop info panel — right side */}
        {panel && (
          <div className="absolute inset-y-0 right-0 z-[500] hidden w-80 overflow-y-auto border-l border-border bg-card lg:block">
            <div className="p-4">{panel}</div>
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      <Sheet open={mobileSheet && panel !== null} onOpenChange={setMobileSheet}>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto rounded-t-lg">
          <SheetHeader className="sr-only">
            <SheetTitle>Location details</SheetTitle>
          </SheetHeader>
          {panel}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Zone panel                                                        */
/* ---------------------------------------------------------------- */
function ZonePanel({
  zone,
  onViewDetails,
  onReport,
}: {
  zone: Doc<"zones">;
  onViewDetails: () => void;
  onReport: () => void;
}) {
  const covered = hasModelCoverage(zone.state, zone.district);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-mono text-[11px] text-muted-foreground">{zone.code}</p>
        <h2 className="mt-0.5 text-base font-semibold leading-5">{zone.name}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {zone.district} · {zone.state ?? "—"}
        </p>
      </div>

      <div className="rounded-md border border-border px-3 py-2.5">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Model coverage
        </p>
        {covered ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <SignalHigh className="size-3.5" /> Available
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Signal className="size-3.5" /> Unavailable
          </span>
        )}
      </div>

      {covered ? (
        <div className="rounded-md border border-border px-3 py-2.5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Current risk — model assessment
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{zone.risk}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <PanelRows
            rows={[
              { k: "Type", v: zone.type },
              {
                k: "Last updated",
                v: formatDistanceToNow(new Date(zone.lastUpdated), { addSuffix: true }),
              },
              {
                k: "Monitoring",
                v: zone.status === "monitored" ? "Active" : "Standby",
              },
            ]}
          />
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border px-3 py-3">
          <p className="text-xs leading-5 text-muted-foreground">
            No trained prediction model is currently available for this area.
            Monitoring and incident reporting remain active.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" size="sm" onClick={onViewDetails}>
          View details
        </Button>
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onReport}>
          <Camera className="size-3.5" />
          Report
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* District panel                                                    */
/* ---------------------------------------------------------------- */
function DistrictPanel({
  state,
  district,
  zones,
  incidents,
  onOpenIncident,
  onReport,
}: {
  state: string;
  district: string;
  zones: Doc<"zones">[];
  incidents: IncidentItem[];
  onOpenIncident: (incident: IncidentItem) => void;
  onReport: () => void;
}) {
  const coverage = coverageFor(
    state === "Outside registered districts" ? undefined : state,
    district,
  );
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold leading-5">{district}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{state}</p>
      </div>

      <div className="rounded-md border border-border px-3 py-2.5">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Coverage
        </p>
        <PanelRows
          rows={[
            {
              k: "Model",
              v: coverage.modelCoverage ? (
                <span className="text-emerald-700">Available</span>
              ) : (
                <span className="text-muted-foreground">Not available</span>
              ),
            },
            {
              k: "Monitoring",
              v: coverage.liveMonitoring ? (
                <span className="text-emerald-700">Active</span>
              ) : (
                <span className="text-muted-foreground">Registration only</span>
              ),
            },
          ]}
        />
      </div>

      {!coverage.modelCoverage && (
        <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs leading-5 text-muted-foreground">
          ML model coverage is currently unavailable for this district. No risk
          predictions are shown.
        </p>
      )}

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Registered zones ({zones.length})
        </p>
        {zones.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
            No registered monitoring zones here yet.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-md border border-border">
            {zones.map((zone) => (
              <span key={zone._id} className="flex items-center gap-2 px-3 py-2 text-xs">
                <span className="font-mono text-[10px] text-muted-foreground">{zone.code}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{zone.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {hasModelCoverage(zone.state, zone.district) ? zone.risk : "—"}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <ShieldAlert className="size-3" />
          Recent incidents ({incidents.length})
        </p>
        {incidents.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
            No incidents reported for the selected area.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-md border border-border">
            {incidents.slice(0, 4).map((incident) => (
              <button
                key={incident.id}
                type="button"
                onClick={() => onOpenIncident(incident)}
                className="flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{incident.type}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {incidentStatusLabel(incident.status)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onReport}>
        <Camera className="size-3.5" />
        Report incident here
      </Button>
    </div>
  );
}
