import { api } from "@/convex/_generated/api";
import { AssetImage } from "@/components/AssetImage";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { Check, Loader2, Minus, Satellite } from "lucide-react";
import {
  NER_STATES,
  STATE_DISTRICTS,
} from "./data";
import {
  MODEL_COVERAGE_DISTRICTS,
  hasModelCoverage,
} from "./map";

function StatusBadge({ covered }: { covered: boolean }) {
  return covered ? (
    <Badge className="gap-1 rounded-sm bg-emerald-600 text-[10px] font-medium text-white">
      <Check className="size-3" />
      Available
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 rounded-sm text-[10px] font-medium text-muted-foreground">
      <Minus className="size-3" />
      Not available
    </Badge>
  );
}

export function Coverage() {
  const zones = useQuery(api.zones.listZones);

  const rows = NER_STATES.map((state) => {
    const districts = new Set<string>([
      ...(STATE_DISTRICTS[state] ?? []),
      ...(zones ?? [])
        .filter((z) => z.state === state)
        .map((z) => z.district),
    ]);
    return { state, districts: [...districts].sort() };
  });

  const coveredCount = rows.reduce(
    (acc, row) =>
      acc + row.districts.filter((d) => hasModelCoverage(row.state, d)).length,
    0,
  );
  const totalDistricts = rows.reduce((acc, row) => acc + row.districts.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <p className="eyebrow">Scientific transparency</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          Model &amp; data coverage
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
          Dharanetra shows predictive output only where the trained model has
          been validated. This page states exactly where predictions are
          available, where monitoring exists without predictions, and what is
          planned — nothing is overstated.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
        <div className="bg-card px-4 py-3.5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            States covered
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {Object.keys(MODEL_COVERAGE_DISTRICTS).length}
            <span className="text-xs font-normal text-muted-foreground"> / 8</span>
          </p>
        </div>
        <div className="bg-card px-4 py-3.5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Districts with model
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {coveredCount}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}of {totalDistricts} known
            </span>
          </p>
        </div>
        <div className="bg-card px-4 py-3.5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Registered zones
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {zones === undefined ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              zones.length
            )}
          </p>
        </div>
        <div className="bg-card px-4 py-3.5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Model service
          </p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Backend not reachable
          </p>
        </div>
      </div>

      {/* Coverage matrix */}
      <section>
        <p className="eyebrow mb-3">Current model coverage by district</p>
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">State</th>
                <th className="px-4 py-2.5 font-medium">District</th>
                <th className="px-4 py-2.5 text-right font-medium">
                  ML prediction
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.flatMap((row) =>
                row.districts.length === 0 ? (
                  <tr key={row.state} className="text-muted-foreground">
                    <td className="px-4 py-2.5 font-medium">{row.state}</td>
                    <td className="px-4 py-2.5 text-xs" colSpan={2}>
                      No registered districts yet
                    </td>
                  </tr>
                ) : (
                  row.districts.map((district, i) => (
                    <tr key={`${row.state}-${district}`}>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {i === 0 ? row.state : ""}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{district}</td>
                      <td className="px-4 py-2.5 text-right">
                        <StatusBadge
                          covered={hasModelCoverage(row.state, district)}
                        />
                      </td>
                    </tr>
                  ))
                ),
              )}
            </tbody>
          </table>
          <div className="border-t border-border px-4 py-3">
            <p className="text-[11px] leading-4 text-muted-foreground">
              The current trained model provides valid predictions for Kamrup
              district, Assam. Districts appear here from the monitoring-zone
              registry; a district is added to model coverage only after the
              model is genuinely trained and validated for it.
            </p>
          </div>
        </div>
      </section>

      {/* Expansion */}
      <section>
        <p className="eyebrow mb-3">Planned geographic expansion</p>
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <AssetImage
            id="data.landscape"
            className="h-40 border-b border-border sm:h-48"
            fallbackLabel="NER landscape imagery — add NER_LANDSCAPE_IMAGE_URL in src/config/assets.ts"
          />
          <div className="flex items-start gap-3 px-4 py-4">
            <Satellite className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">North Eastern Region of India</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Extending model coverage across the remaining seven states
                requires state-specific terrain, rainfall, and historical
                landslide datasets for training and validation. Until that
                validation completes, these areas are shown as monitoring-only:
                zones and incident reporting stay active, and no predicted risk
                values are displayed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data source transparency */}
      <section>
        <p className="eyebrow mb-3">Data sources &amp; status</p>
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex flex-col divide-y divide-border">
            {[
              {
                name: "Landslide risk model (FastAPI service)",
                status: "Unavailable",
                detail:
                  "The .pkl model service is not connected to this deployment. Predictions activate automatically when ML_API_URL is configured and the service is reachable.",
                tone: "muted" as const,
              },
              {
                name: "Monitoring-zone registry (Convex)",
                status: "Connected",
                detail:
                  "Zone locations, districts, and admin-entered risk scores for covered districts.",
                tone: "ok" as const,
              },
              {
                name: "Incident reports (Convex)",
                status: "Connected",
                detail:
                  "Citizen and field-officer reports with full verification lifecycle.",
                tone: "ok" as const,
              },
              {
                name: "Base maps & satellite imagery",
                status: "Connected",
                detail:
                  "OpenStreetMap standard, Esri World Imagery satellite, OpenTopoMap terrain.",
                tone: "ok" as const,
              },
              {
                name: "Live weather feed",
                status: "Planned",
                detail:
                  "Weather cards currently show clearly-labelled demonstration values.",
                tone: "muted" as const,
              },
              {
                name: "IoT sensor telemetry",
                status: "Planned",
                detail: "No sensor feed is connected; no sensor data is displayed.",
                tone: "muted" as const,
              },
              {
                name: "Historical landslide inventory",
                status: "Planned",
                detail:
                  "Structure is in place; an authoritative dataset is not yet loaded. Archive imagery can be added via HISTORICAL_LANDSLIDE_IMAGE_URL.",
                tone: "muted" as const,
              },
              {
                name: "Official government alert feeds",
                status: "Planned",
                detail:
                  "Not connected. Institutional references are informational only.",
                tone: "muted" as const,
              },
            ].map((source) => (
              <div key={source.name} className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{source.name}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {source.detail}
                  </p>
                </div>
                <Badge
                  className={`mt-1 shrink-0 rounded-sm text-[10px] font-medium sm:mt-0 ${
                    source.tone === "ok"
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {source.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
