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
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import {
  INCIDENT_STATUSES,
  NER_STATES,
  type IncidentItem,
  incidentStatusLabel,
  severityLabel,
} from "./data";
import { BasemapSwitcher } from "./MapControls";
import { MapChrome } from "./MapShared";
import { NER_BOUNDS, type BasemapId, incidentIcon } from "./map";

interface IncidentsProps {
  onOpen: (incident: IncidentItem) => void;
}

export function Incidents({ onOpen }: IncidentsProps) {
  const incidents = useQuery(api.incidents.listIncidents);
  const [view, setView] = useState<"list" | "map">("list");
  const [basemap, setBasemap] = useState<BasemapId>("standard");
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
      if (status !== "all" && (incident.status ?? "reported") !== status) return false;
      if (severity !== "all" && incident.severity !== severity) return false;
      return true;
    });
  }, [incidents, state, district, status, severity]);

  const mappable = visible?.filter(
    (i) => i.latitude !== undefined && i.longitude !== undefined,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Citizen & field reports</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Incidents</h1>
        </div>
        {incidents && (
          <p className="text-xs tabular-nums text-muted-foreground">
            {visible?.length ?? 0} of {incidents.length} reports
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="h-10 text-xs">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All states</SelectItem>
            {NER_STATES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="h-10 text-xs">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All districts</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
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
            <SelectItem value="all" className="text-xs">All severities</SelectItem>
            {["low", "moderate", "high", "critical"].map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {severityLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List / map toggle */}
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as "list" | "map")}>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>
        </Tabs>
        {view === "map" && mappable !== undefined && (
          <p className="text-[11px] text-muted-foreground">
            {mappable.length} with coordinates
            {visible && visible.length > mappable.length
              ? ` · ${visible.length - mappable.length} without coordinates not shown`
              : ""}
          </p>
        )}
      </div>

      {view === "list" && (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
          {visible === undefined && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              Loading incidents…
            </div>
          )}
          {visible !== undefined && visible.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No incidents reported for the selected area.
            </div>
          )}
          {visible?.map((incident) => (
            <button
              key={incident.id}
              type="button"
              onClick={() => onOpen(incident)}
              className="group flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{incident.type}</h3>
                  <Badge className="rounded-sm bg-primary text-[10px] font-medium text-primary-foreground">
                    {incidentStatusLabel(incident.status)}
                  </Badge>
                  <Badge variant="outline" className="rounded-sm text-[10px] font-medium">
                    {severityLabel(incident.severity)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {incident.state ? `${incident.state} · ` : ""}
                  {incident.district ?? incident.location} ·{" "}
                  {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      )}

      {view === "map" && (
        <div className="relative z-0 h-[420px] overflow-hidden rounded-md border border-border sm:h-[520px]">
          <MapContainer
            bounds={NER_BOUNDS}
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
            {mappable?.map((incident) => (
              <Marker
                key={incident.id}
                position={[incident.latitude!, incident.longitude!]}
                icon={incidentIcon(incident.severity)}
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
                      <span className="dnt-popup__k">Severity</span>
                      <span className="dnt-popup__v">
                        {severityLabel(incident.severity)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="dnt-popup__btn"
                      onClick={() => onOpen(incident)}
                    >
                      Open assessment
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div className="absolute right-3 top-3 z-[500]">
            <BasemapSwitcher value={basemap} onChange={setBasemap} />
          </div>
        </div>
      )}
    </div>
  );
}