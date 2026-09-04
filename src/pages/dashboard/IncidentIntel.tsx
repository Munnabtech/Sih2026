import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ArrowLeft, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type IncidentItem,
  haversineKm,
  incidentStatusLabel,
  riskLevel,
  severityLabel,
} from "./data";

interface IncidentIntelProps {
  incident?: IncidentItem | null;
  onBack: () => void;
}

const RADII = [1, 5, 10, 25] as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-3">
      <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function Unavailable({ label }: { label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-3">
      <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-xs italic text-muted-foreground">
        Data unavailable
      </span>
    </div>
  );
}

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
      <p className="text-sm font-semibold">{title}</p>
      {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
    </div>
  );
}

/** Desk guidance per lifecycle status — procedural, never fabricated telemetry. */
function deskGuidance(status?: string): string {
  switch (status) {
    case "reported":
      return "Citizen report received. Field verification required before this incident is treated as confirmed.";
    case "under_verification":
      return "Verification in progress. Continue monitoring rainfall and slope movement in the area.";
    case "verified":
      return "Verified by the monitoring desk. Keep the incident under observation and track any secondary slope movement.";
    case "response_in_progress":
      return "Response underway. Track road clearance, accessibility, and any new ground movement near the site.";
    case "resolved":
      return "Closed. Retain the incident record for the historical landslide inventory.";
    case "false_duplicate":
      return "Marked as false or duplicate. No further action; the record stays for audit.";
    default:
      return "Field verification required.";
  }
}

export function IncidentIntel({ incident, onBack }: IncidentIntelProps) {
  const zones = useQuery(api.zones.listZones);
  const [radius, setRadius] = useState<number>(10);

  const nearby = useMemo(() => {
    if (!incident || incident.latitude === undefined || incident.longitude === undefined) {
      return undefined;
    }
    if (!zones) return undefined;
    return zones
      .filter((zone) => {
        if (zone.latitude === undefined || zone.longitude === undefined) return false;
        return (
          haversineKm(
            incident.latitude!,
            incident.longitude!,
            zone.latitude!,
            zone.longitude!,
          ) <= radius
        );
      })
      .map((zone) => ({
        zone,
        distance: haversineKm(
          incident.latitude!,
          incident.longitude!,
          zone.latitude!,
          zone.longitude!,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [incident, zones, radius]);

  if (!incident) {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={onBack}
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to incidents
        </button>
        <div className="rounded-lg border border-border px-6 py-14 text-center text-sm text-muted-foreground">
          Incident not found.
        </div>
      </div>
    );
  }

  const hasCoords =
    incident.latitude !== undefined && incident.longitude !== undefined;

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to incidents
      </button>

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            INC-{incident.id.slice(-6).toUpperCase()}
          </span>
          <Badge className="rounded-sm bg-foreground text-[10px] font-medium text-background">
            {incidentStatusLabel(incident.status)}
          </Badge>
          <Badge variant="outline" className="rounded-sm text-[10px] font-medium">
            {severityLabel(incident.severity)}
          </Badge>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {incident.type}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          {incident.state ? `${incident.state} · ` : ""}
          {incident.district ?? incident.location}
        </p>
      </div>

      {/* Incident summary */}
      <section className="rounded-lg border border-border bg-background">
        <SectionTitle title="Incident summary" />
        <div className="flex flex-col divide-y divide-border">
          <Row label="Incident ID" value={`INC-${incident.id.slice(-6).toUpperCase()}`} />
          <Row label="Status" value={incidentStatusLabel(incident.status)} />
          <Row
            label="Time reported"
            value={format(new Date(incident.createdAt), "d MMM yyyy, HH:mm")}
          />
          <Row label="State" value={incident.state ?? "Not stated"} />
          <Row label="District" value={incident.district ?? "Not stated"} />
          <Row
            label="Exact coordinates"
            value={
              hasCoords
                ? `${incident.latitude!.toFixed(5)}, ${incident.longitude!.toFixed(5)}`
                : "Not provided"
            }
          />
          <Row label="Reporter source" value={incident.reporterName} />
          <Row
            label="Verification status"
            value={
              incident.status === "verified"
                ? "Verified by monitoring desk"
                : incident.status === "under_verification"
                  ? "Under verification"
                  : "Not verified — citizen report"
            }
          />
        </div>
      </section>

      {/* Current risk context */}
      <section className="rounded-lg border border-border bg-background">
        <SectionTitle title="Current risk context" note="Environmental telemetry is not connected" />
        <div className="flex flex-col divide-y divide-border">
          <Unavailable label="Current landslide risk" />
          <Unavailable label="Rainfall condition" />
          <Unavailable label="Terrain / slope" />
          <Unavailable label="Historical landslides nearby" />
          <Unavailable label="Satellite / environmental context" />
        </div>
      </section>

      {/* Impact assessment */}
      <section className="rounded-lg border border-border bg-background">
        <SectionTitle title="Impact assessment" note="Only authoritative data is shown" />
        <div className="flex flex-col divide-y divide-border">
          <Unavailable label="Roads potentially affected" />
          <Unavailable label="Settlements nearby" />
          <Unavailable label="Critical infrastructure nearby" />
          <Unavailable label="Estimated affected zone" />
          <Unavailable label="Population exposure" />
        </div>
      </section>

      {/* Nearby monitoring context */}
      <section className="rounded-lg border border-border bg-background">
        <SectionTitle
          title="Nearby monitoring context"
          note={
            hasCoords
              ? "Computed from the zone registry"
              : "No coordinates reported"
          }
        />
        {!hasCoords && (
          <p className="px-5 py-4 text-sm leading-6 text-muted-foreground">
            This incident has no coordinates, so nearby monitoring zones cannot
            be computed. A field officer can add them during verification.
          </p>
        )}
        {hasCoords && (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
              <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Search radius
              </span>
              <Select
                value={String(radius)}
                onValueChange={(v) => setRadius(Number(v))}
              >
                <SelectTrigger className="h-9 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RADII.map((r) => (
                    <SelectItem key={r} value={String(r)} className="text-xs">
                      {r} km
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {nearby === undefined && (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                Loading zone registry…
              </p>
            )}
            {nearby !== undefined && nearby.length === 0 && (
              <p className="px-5 py-4 text-sm leading-6 text-muted-foreground">
                No monitored zones within {radius} km of this incident.
              </p>
            )}
            {nearby !== undefined && nearby.length > 0 && (
              <div className="flex flex-col divide-y divide-border">
                {nearby.map(({ zone, distance }) => {
                  const level = riskLevel(zone.risk);
                  return (
                    <div key={zone._id} className="flex items-center gap-3 px-5 py-3">
                      <span className={`size-2 shrink-0 rounded-full ${level.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {zone.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {zone.district} · {zone.code}
                        </p>
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {distance.toFixed(1)} km
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {zone.risk}
                        <span className="text-xs font-normal text-muted-foreground">
                          /100
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Post-incident monitoring */}
      <section className="rounded-lg border border-border bg-background">
        <SectionTitle title="Post-incident monitoring" note="Desk guidance" />
        <div className="flex flex-col divide-y divide-border">
          <div className="px-5 py-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {deskGuidance(incident.status)}
            </p>
          </div>
          <Unavailable label="Response status" />
          <Unavailable label="Road clearance status" />
          <Unavailable label="Continued rainfall risk" />
          <Unavailable label="Secondary landslide risk" />
        </div>
      </section>

      {/* AI-assisted assessment */}
      <section className="rounded-lg border border-border bg-background">
        <SectionTitle title="AI-assisted assessment" note="From the ML service when connected" />
        <div className="px-5 py-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Model-based assessment is not available for this incident. It will
            appear here only when the ML backend is reachable and the required
            environmental inputs are supplied. ML output is never treated as
            incident verification.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onBack}
          >
            Back to incident feed
          </Button>
        </div>
      </section>
    </div>
  );
}