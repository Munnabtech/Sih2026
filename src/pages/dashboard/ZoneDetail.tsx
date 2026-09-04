import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CloudRain,
  Camera,
  Droplets,
  MapPin,
  Thermometer,
  Wind,
} from "lucide-react";
import { liveWeather, riskLevel } from "./data";
import { ModelAssessmentForm } from "./MlStatusCard";
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
          Back to catalog
        </button>
        <div className="rounded-lg border border-border px-6 py-14 text-center text-sm text-muted-foreground">
          Zone not found.
        </div>
      </div>
    );
  }

  const level = riskLevel(zone.risk);

  const telemetry = [
    { icon: CloudRain, label: "Rainfall", value: liveWeather.rainfall },
    { icon: Thermometer, label: "Temp", value: liveWeather.temp },
    { icon: Droplets, label: "Humidity", value: liveWeather.humidity },
    { icon: Wind, label: "Wind", value: liveWeather.wind },
  ];

  const factors = [
    `${zone.type} in ${zone.district} — ${zone.code} is on the ${level.level.toLowerCase()} watch list.`,
    "Rainfall has kept soil saturation above the normal range for this zone over the past 24 hours.",
    zone.risk >= 61
      ? "Field officers recommend avoiding non-essential travel through this zone until rainfall eases."
      : "Current readings are within the expected seasonal range for this zone.",
  ];

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to catalog
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-muted-foreground">
              {zone.code}
            </span>
            <Badge variant="outline" className="rounded-sm text-[10px] font-medium">
              {zone.status === "monitored" ? "Monitored" : "Standby"}
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {zone.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {zone.type} · {zone.district} district
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

      {/* Risk + telemetry */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex flex-col items-center rounded-lg border border-border bg-foreground px-6 py-8 text-background">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-background/50">
            Current risk — {zone.code}
          </p>
          <RiskGauge score={zone.risk} size={230} />
          <p className={`mt-3 text-lg font-semibold tracking-[0.2em] uppercase ${level.text}`}>
            {level.level} risk
          </p>
          <p className="mt-1 text-sm tabular-nums text-background/50">
            {zone.risk} / 100
          </p>
        </div>

        <div className="flex flex-col rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <p className="eyebrow">Live telemetry</p>
            <span className="text-[11px] text-muted-foreground">
              Demo values · no weather API connected
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
            {telemetry.map((s) => (
              <div key={s.label} className="flex items-center gap-3 px-5 py-4">
                <s.icon className="size-4.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-0.5 truncate text-base font-semibold tabular-nums">
                    {s.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <ul className="flex flex-1 flex-col justify-center divide-y divide-border">
            {factors.map((f, i) => (
              <li key={i} className="flex gap-3 px-6 py-3.5">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/30" />
                <span className="text-sm leading-6 text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Model risk assessment — real inference when the ML service is up */}
      <ModelAssessmentForm />
    </div>
  );
}