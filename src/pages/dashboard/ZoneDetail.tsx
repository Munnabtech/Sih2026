import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Camera,
  Cpu,
  MapPin,
  Signal,
  SignalHigh,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ModelAssessmentForm } from "./MlStatusCard";
import { hasModelCoverage } from "./map";
import { riskLevel } from "./data";
import { RiskGauge } from "./RiskGauge";

interface ZoneDetailProps {
  zone?: Doc<"zones">;
  onBack: () => void;
  onReport: (location: string) => void;
}

export function ZoneDetail({ zone, onBack, onReport }: ZoneDetailProps) {
  if (!zone) {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={onBack}
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to predictions
        </button>
        <div className="rounded-md border border-dashed border-border bg-card px-6 py-14 text-center text-sm text-muted-foreground">
          Zone not found.
        </div>
      </div>
    );
  }

  const covered = hasModelCoverage(zone.state, zone.district);
  const level = riskLevel(zone.risk);

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to predictions
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-muted-foreground">{zone.code}</span>
            <Badge variant="outline" className="rounded-sm text-[10px] font-medium">
              {zone.status === "monitored" ? "Monitored" : "Standby"}
            </Badge>
          </div>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight">{zone.name}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {zone.district} · {zone.state ?? "—"} · {zone.type}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => onReport(`${zone.name}, ${zone.district} district`)}
        >
          <Camera className="size-4" />
          Report here
        </Button>
      </div>

      {/* Assessment or honest no-coverage state */}
      {covered ? (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col items-center rounded-md border border-border bg-primary px-6 py-7 text-primary-foreground">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary-foreground/60">
              Current model assessment
            </p>
            <RiskGauge score={zone.risk} size={210} />
            <p className={`mt-2 text-base font-semibold uppercase tracking-[0.16em] ${level.text}`}>
              {level.level} risk
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-primary-foreground/60">
              {zone.risk} / 100 · updated{" "}
              {formatDistanceToNow(new Date(zone.lastUpdated), { addSuffix: true })}
            </p>
          </div>

          <div className="flex flex-col rounded-md border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Contributing context
              </p>
              <Badge className="gap-1 rounded-sm bg-emerald-600 text-[10px] font-medium text-white">
                <SignalHigh className="size-3" />
                Model coverage active
              </Badge>
            </div>
            <ul className="flex flex-1 flex-col justify-center divide-y divide-border">
              {[
                `${zone.type} profile in ${zone.district} — monitoring code ${zone.code}.`,
                "Risk value is maintained by the monitoring desk on the covered model output.",
                zone.risk >= 61
                  ? "Field officers advise avoiding non-essential travel through this zone during intense rainfall."
                  : "Current readings are within the expected seasonal range for this zone.",
              ].map((f, i) => (
                <li key={i} className="flex gap-3 px-5 py-3">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/40" />
                  <span className="text-sm leading-6 text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-border bg-card px-6 py-8">
          <div className="flex flex-col items-start gap-3">
            <span className="flex size-9 items-center justify-center rounded-sm border border-border text-muted-foreground">
              <Signal className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Model coverage unavailable</p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                Prediction model is not currently trained or available for this
                district. Monitoring and incident reporting remain active for
                this zone; no predicted risk value is shown.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col divide-y divide-border border-t border-border pt-2">
            {[
              { k: "Monitoring status", v: zone.status === "monitored" ? "Active" : "Standby" },
              { k: "Zone type", v: zone.type },
              { k: "Last registry update", v: formatDistanceToNow(new Date(zone.lastUpdated), { addSuffix: true }) },
            ].map((row) => (
              <div key={row.k} className="flex items-baseline justify-between gap-4 py-2">
                <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  {row.k}
                </span>
                <span className="text-[13px] font-medium">{row.v}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ML assessment — only meaningful where the model is trained */}
      {covered && (
        <section>
          <p className="eyebrow mb-2.5 flex items-center gap-1.5">
            <Cpu className="size-3.5" />
            Run live model assessment
          </p>
          <ModelAssessmentForm />
        </section>
      )}
    </div>
  );
}