import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ChevronRight, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import {
  INCIDENT_STATUSES,
  NER_STATES,
  type IncidentItem,
  incidentStatusLabel,
  severityLabel,
} from "./data";

const NER_BOUNDS: [[number, number], [number, number]] = [
  [21.6, 87.9],
  [29.6, 98.3],
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#c94f42",
  high: "#d97a3c",
  moderate: "#d9b53c",
  low: "#7e9c7e",
};

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div class="dnt-marker" style="--dnt-marker-color: ${color}"><span class="dnt-marker__pin"></span><span class="dnt-marker__dot"></span></div>`,
    iconSize: [26, 36],
    iconAnchor: [13, 34],
    popupAnchor: [0, -36],
  });
}

interface IncidentsProps {
  onOpen: (incident: IncidentItem) => void;
}

export function Incidents({ onOpen }: IncidentsProps) {
  const incidents = useQuery(api.incidents.listIncidents);
  const [view, setView] = useState<"list" | "map">("list");
  const [state, setState] = useState("all");
  const [district, setDistrict] = useState("all");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");

  const districts = useMemo(() => {
    const set = new Set<string>();
    (incidents ?? []).forEach((i) => {
      if (i.district) set.add(i.district);
    });
    return [...set].sort();
  }, [incidents]);

  const visible = useMemo(() => {
    if (!incidents) return undefined;
    return incidents.filter((incident) => {
      if (state !== "all" && incident.state !== state) return false;
      if (district !== "all" && incident.district !== district) return false;
      if (status !== "all" && (incident.status ?? "reported") !== status)
        return false;
      if (severity !== "all" && incident.severity !== severity) return false;
      return true;
    });
  }, [incidents, state, district, status, severity]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Incident feed</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Incidents
          </h1>
        </div>
        {incidents && (
          <p className="text-xs tabular-nums text-muted-foreground">
            {visible?.length ?? 0} of {incidents.length} incidents
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="h-10 text-xs">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All states
            </SelectItem>
            {NER_STATES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="h-10 text-xs">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All districts
            </SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d} className="text-xs">
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All statuses
            </SelectItem>
            {INCIDENT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="h-10 text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All severities
            </SelectItem>
            {["low", "moderate", "high", "critical"].map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {severityLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List / map toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as "list" | "map")}>
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "list" && (
        <div className="flex flex-col divide-y divide-border border border-border">
          {visible === undefined && (
            <div className="px-6 py-14 text-center text-sm text-muted-foreground">
              Loading incidents…
            </div>
          )}
          {visible !== undefined && visible.length === 0 && (
            <div className="px-6 py-14 text-center text-sm text-muted-foreground">
              No incidents match the current filters.
            </div>
          )}
          {visible?.map((incident) => (
            <button
              key={incident.id}
              type="button"
              onClick={() => onOpen(incident)}
              className="group flex items-center gap-4 bg-background px-5 py-4 text-left transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{incident.type}</h3>
                  <Badge className="rounded-sm bg-foreground text-[10px] font-medium text-background">
                    {incidentStatusLabel(incident.status)}
                  </Badge>
                  <Badge variant="outline" className="rounded-sm text-[10px] font-medium">
                    {severityLabel(incident.severity)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {incident.state ? `${incident.state} · ` : ""}
                  {incident.district ?? incident.location} ·{" "}
                  {formatDistanceToNow(new Date(incident.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      )}

      {view === "map" && (
        <div className="relative z-0 h-[420px] overflow-hidden rounded-lg border border-border bg-background sm:h-[500px]">
          <MapContainer
            bounds={NER_BOUNDS}
            className="h-full w-full"
            attributionControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {visible?.map((incident) => {
              const lat = incident.latitude;
              const lng = incident.longitude;
              if (lat === undefined || lng === undefined) return null;
              const color =
                SEVERITY_COLORS[incident.severity ?? ""] ?? "#8a8f98";
              return (
                <Marker
                  key={incident.id}
                  position={[lat, lng]}
                  icon={makeIcon(color)}
                >
                  <Popup>
                    <div className="dnt-popup">
                      <p className="dnt-popup__name">{incident.type}</p>
                      <p className="dnt-popup__code">Incident · {incident.id.slice(-6)}</p>
                      <div className="dnt-popup__grid">
                        <span className="dnt-popup__k">State</span>
                        <span className="dnt-popup__v">{incident.state ?? "—"}</span>
                        <span className="dnt-popup__k">District</span>
                        <span className="dnt-popup__v">{incident.district ?? incident.location}</span>
                        <span className="dnt-popup__k">Status</span>
                        <span className="dnt-popup__v">{incidentStatusLabel(incident.status)}</span>
                        <span className="dnt-popup__k">Severity</span>
                        <span className="dnt-popup__v">{severityLabel(incident.severity)}</span>
                      </div>
                      <button
                        type="button"
                        className="dnt-popup__btn"
                        onClick={() => onOpen(incident)}
                      >
                        Open assessment
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
          {visible !== undefined && visible.length > 0 && (
            <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-border bg-background/95 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
              Only incidents with coordinates can be placed on the map.
            </div>
          )}
        </div>
      )}

      <p className="text-xs leading-5 text-muted-foreground">
        Incident locations are placed only from reported coordinates. Incidents
        without coordinates remain in the list view with an honest “no
        coordinates” state.
      </p>
    </div>
  );
}