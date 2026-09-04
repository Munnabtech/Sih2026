import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AssetImage } from "@/components/AssetImage";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  BookOpen,
  Camera,
  ClipboardList,
  Database,
  Loader2,
  Map,
  MapPin,
  Signal,
  SignalHigh,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  DISTRICT,
  NER_STATES,
  type ViewId,
  incidentStatusLabel,
  riskLevel,
} from "./data";
import {
  MODEL_COVERAGE_DISTRICTS,
  hasModelCoverage,
} from "./map";

interface OverviewProps {
  userName?: string | null;
  onNavigate: (view: ViewId) => void;
  onOpenCatalog: (state?: string) => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function Overview({ userName, onNavigate, onOpenCatalog }: OverviewProps) {
  const [safetyOpen, setSafetyOpen] = useState(false);
  const zones = useQuery(api.zones.listZones);
  const incidents = useQuery(api.incidents.listIncidents);
  const name = userName || "Resident";

  const [coveredState] = Object.keys(MODEL_COVERAGE_DISTRICTS);

  const metrics = useMemo(() => {
    if (!zones || !incidents) return undefined;
    return {
      coveredAreas: coveredState ? MODEL_COVERAGE_DISTRICTS[coveredState].length : 0,
      monitoredDistricts: new Set(zones.map((z) => `${z.state ?? ""}/${z.district}`)).size,
      reported: incidents.length,
      verified: incidents.filter((i) => i.status === "verified").length,
      pending: incidents.filter((i) => (i.status ?? "reported") === "reported").length,
    };
  }, [zones, incidents, coveredState]);

  const stateRows = useMemo(() => {
    if (!zones) return undefined;
    return NER_STATES.map((state) => {
      const rows = zones.filter((z) => z.state === state);
      const risks = rows
        .filter((z) => hasModelCoverage(z.state, z.district))
        .map((z) => z.risk);
      return {
        state,
        count: rows.length,
        peak: risks.length ? Math.max(...risks) : null,
      };
    }).filter((row) => row.count > 0);
  }, [zones]);

  const lastUpdate = useMemo(() => {
    if (!zones || zones.length === 0) return null;
    return Math.max(...zones.map((z) => z.lastUpdated));
  }, [zones]);

  const metricCards = metrics
    ? [
        { label: "Model coverage areas", value: String(metrics.coveredAreas), hint: "Districts with trained model" },
        { label: "Monitored districts", value: String(metrics.monitoredDistricts), hint: `${zones?.length ?? 0} registered zones` },
        { label: "Reported incidents", value: String(metrics.reported), hint: `${metrics.pending} awaiting verification` },
        { label: "Verified incidents", value: String(metrics.verified), hint: "Confirmed by monitoring desk" },
      ]
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight">
            Landslide Risk Monitoring Overview
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            North Eastern Region of India
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 text-xs text-muted-foreground sm:items-end">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            System online
          </span>
          <span>
            Last registry update:{" "}
            {lastUpdate
              ? formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })
              : "—"}
          </span>
        </div>
      </div>

      {/* Coverage transparency banner */}
      <section className="rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <SignalHigh className="mt-0.5 size-4 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold">ML prediction coverage</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                Kamrup, Assam — available ·{" "}
                <span className="text-muted-foreground">
                  remaining NER districts — model not currently available
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("coverage")}
            className="flex w-fit items-center gap-1.5 text-xs font-medium text-primary transition-opacity hover:opacity-80"
          >
            <Database className="size-3.5" />
            View coverage details
          </button>
        </div>
      </section>

      {/* Operational metric strip — real data only */}
      <section>
        <p className="eyebrow mb-2.5">Operational summary</p>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
          {metricCards === undefined
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card px-4 py-3.5">
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton mt-2 h-6 w-12" />
                  <div className="skeleton mt-2 h-2.5 w-28" />
                </div>
              ))
            : metricCards.map((card) => (
                <div key={card.label} className="bg-card px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums leading-7">
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {card.hint}
                  </p>
                </div>
              ))}
        </div>
      </section>

      {/* NER map preview */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="eyebrow">NER situation map</p>
          <button
            type="button"
            onClick={() => onNavigate("map")}
            className="text-xs font-medium text-primary transition-opacity hover:opacity-80"
          >
            Open full map →
          </button>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("map")}
          className="group relative block h-44 w-full overflow-hidden rounded-md border border-border bg-card text-left transition-colors hover:border-ring sm:h-52"
        >
          <ContourBackdrop />
          <span className="absolute inset-0 flex flex-col justify-between p-4">
            <span className="flex items-center justify-between">
              <span className="rounded-sm bg-card px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground shadow-sm">
                8 states · full NER view
              </span>
              <span className="flex items-center gap-1.5 rounded-sm bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm">
                <Map className="size-3" />
                Interactive map
              </span>
            </span>
            <span className="flex items-end justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Standard · Satellite · Terrain
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Risk markers only where model coverage exists
                </span>
              </span>
              <span className="shrink-0 rounded-sm bg-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground transition-transform group-hover:-translate-y-0.5">
                Open
              </span>
            </span>
          </span>
        </button>
      </section>

      {/* State summary table */}
      <section>
        <p className="eyebrow mb-2.5">State-level summary</p>
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">State</th>
                <th className="px-4 py-2.5 text-right font-medium">Zones</th>
                <th className="px-4 py-2.5 text-right font-medium">Model</th>
                <th className="px-4 py-2.5 text-right font-medium">Peak risk*</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stateRows === undefined && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">
                    <Loader2 className="mx-auto size-4 animate-spin" />
                  </td>
                </tr>
              )}
              {stateRows?.map((row) => (
                <tr
                  key={row.state}
                  className="cursor-pointer transition-colors hover:bg-accent"
                  onClick={() => onOpenCatalog(row.state)}
                >
                  <td className="px-4 py-2.5 font-medium">{row.state}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {row.count}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs">
                    {hasModelCoverage(row.state, MODEL_COVERAGE_DISTRICTS[row.state]?.[0]) ? (
                      <span className="text-emerald-700">Available</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {row.peak !== null ? (
                      <span className="inline-flex items-center gap-2 font-semibold tabular-nums">
                        <span className={`size-2 rounded-full ${riskLevel(row.peak).dot}`} />
                        {row.peak}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border px-4 py-2.5">
            <p className="text-[11px] leading-4 text-muted-foreground">
              *Peak risk shown only for districts where the trained model
              provides predictions. All other zones are monitoring-only.
            </p>
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="eyebrow">Recent incidents</p>
            <button
              type="button"
              onClick={() => onNavigate("incidents")}
              className="text-xs font-medium text-primary transition-opacity hover:opacity-80"
            >
              All incidents →
            </button>
          </div>
          {incidents === undefined ? (
            <div className="rounded-md border border-border bg-card px-4 py-8 text-center">
              <div className="skeleton mx-auto h-3 w-32" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-card px-4 py-8 text-center text-xs text-muted-foreground">
              No incidents reported yet.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-card">
              {incidents.slice(0, 4).map((incident) => (
                <button
                  key={incident.id}
                  type="button"
                  onClick={() => onNavigate("incidents")}
                  className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                >
                  <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {incident.type}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {incident.district ?? incident.location} ·{" "}
                      {incidentStatusLabel(incident.status)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="eyebrow">Quick actions</p>
          </div>
          <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-card">
            {[
              { icon: Map, label: "Open risk map", hint: "Standard, satellite, and terrain basemaps", view: "map" as ViewId },
              { icon: BookOpen, label: "Make a prediction", hint: "Model-backed assessment for Kamrup, Assam", view: "catalog" as ViewId },
              { icon: Camera, label: "Report an incident", hint: "Citizen and field-officer reporting", view: "report" as ViewId },
              { icon: Bell, label: "Review alerts", hint: "Latest advisories and escalations", view: "alerts" as ViewId },
              { icon: Database, label: "Data & model coverage", hint: "What is live vs planned", view: "coverage" as ViewId },
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => onNavigate(action.view)}
                className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground">
                  <action.icon className="size-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{action.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {action.hint}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Location pill + safety guide */}
      <section className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate("map")}
          className="flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MapPin className="size-3.5" />
          {DISTRICT}
        </button>
        <button
          type="button"
          onClick={() => setSafetyOpen(true)}
          className="text-xs font-medium text-primary transition-opacity hover:opacity-80"
        >
          Safety guide
        </button>
      </section>

      {/* Safety guide dialog */}
      <AlertDialog open={safetyOpen} onOpenChange={setSafetyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Safety guide</AlertDialogTitle>
            <AssetImage
              id="backgrounds.awareness"
              className="mt-2 h-32 rounded-sm border border-border"
              fallbackLabel="Landslide awareness imagery"
            />
            <AlertDialogDescription className="space-y-3 pt-2">
              {[
                "If you see cracks, bulging ground, or leaning trees on a slope, move away immediately and report it.",
                "During high-risk alerts, keep a go-bag ready: documents, torch, radio, water, and medicines.",
                "Know your evacuation route now — do not wait for a critical alert to learn it.",
                "Never cross a visibly flowing waterway or a blocked road during heavy rain.",
              ].map((tip, i) => (
                <span key={i} className="block text-sm leading-6">
                  <span className="mr-2 font-medium text-foreground">{i + 1}.</span>
                  {tip}
                </span>
              ))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction className="bg-primary text-primary-foreground hover:bg-primary/90">
            Got it
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* Subtle contour backdrop for the map preview tile */
function ContourBackdrop() {
  return (
    <svg
      className="absolute inset-0 h-full w-full text-muted-foreground/10"
      aria-hidden="true"
    >
      <defs>
        <pattern id="dnt-contours" width="56" height="56" patternUnits="userSpaceOnUse">
          <circle cx="28" cy="28" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="28" cy="28" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="28" cy="28" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dnt-contours)" />
    </svg>
  );
}