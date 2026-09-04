import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  Camera,
  ChevronDown,
  ChevronRight,
  CloudRain,
  Droplets,
  Map,
  MapPin,
  ShieldCheck,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
  DISTRICT,
  liveWeather,
  risk,
  riskFactors,
  safetyTips,
  type ViewId,
} from "./data";
import { RiskGauge } from "./RiskGauge";

interface OverviewProps {
  userName?: string | null;
  onNavigate: (view: ViewId) => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function Overview({ userName, onNavigate }: OverviewProps) {
  const [safetyOpen, setSafetyOpen] = useState(false);
  const name = userName || "Resident";

  const weatherStats = [
    { icon: CloudRain, label: "Rainfall", value: liveWeather.rainfall },
    { icon: Thermometer, label: "Temp", value: liveWeather.temp },
    { icon: Droplets, label: "Humidity", value: liveWeather.humidity },
    { icon: Wind, label: "Wind", value: liveWeather.wind },
  ];

  const quickActions: {
    icon: LucideIcon;
    label: string;
    hint: string;
    view: ViewId | null;
  }[] = [
    { icon: Map, label: "Risk map", hint: "Zone-by-zone view", view: "map" },
    { icon: Bell, label: "Alerts", hint: "District feed", view: "alerts" },
    { icon: Camera, label: "Report incident", hint: "Share what you see", view: "report" },
    { icon: ShieldCheck, label: "Safety guide", hint: "Stay prepared", view: null },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
            {name}
          </h1>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Bell className="size-4.5" strokeWidth={1.75} />
          <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-red-600" />
        </button>
      </div>

      {/* Location */}
      <button
        type="button"
        onClick={() => onNavigate("map")}
        className="flex w-fit items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <MapPin className="size-3.5" />
        {DISTRICT}
        <ChevronDown className="size-3.5" />
      </button>

      {/* Live weather */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Live weather</p>
          <button
            type="button"
            onClick={() => onNavigate("weather")}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Details →
          </button>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border border border-border sm:grid-cols-4">
          {weatherStats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 px-5 py-4">
              <s.icon
                className="size-4.5 shrink-0 text-muted-foreground"
                strokeWidth={1.5}
              />
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
      </section>

      {/* Current risk */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex flex-col items-center rounded-lg border border-border bg-foreground px-6 py-8 text-background">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-background/50">
            Current landslide risk
          </p>
          <RiskGauge score={risk.score} size={230} />
          <p className="mt-3 text-lg font-semibold tracking-[0.2em] uppercase">
            <span className="text-[#e07a3c]">{risk.level} risk</span>
          </p>
          <p className="mt-1 text-sm tabular-nums text-background/50">
            {risk.score} / 100
          </p>
        </div>

        <div className="flex flex-col rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <p className="eyebrow">Why risk is high</p>
            <span className="rounded-full bg-red-600/10 px-2.5 py-0.5 text-[11px] font-medium text-red-600">
              {risk.level}
            </span>
          </div>
          <ul className="flex flex-1 flex-col justify-center divide-y divide-border">
            {riskFactors.map((f, i) => (
              <li key={i} className="flex gap-3 px-6 py-3.5">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/30" />
                <span className="text-sm leading-6 text-muted-foreground">
                  {f}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <p className="eyebrow mb-3">Quick actions</p>
        <div className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
          {quickActions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() =>
                a.view ? onNavigate(a.view) : setSafetyOpen(true)
              }
              className="group flex flex-col items-start gap-5 bg-background px-6 py-5 text-left transition-colors hover:bg-accent"
            >
              <div className="flex size-10 items-center justify-center rounded-md border border-border transition-colors group-hover:border-foreground">
                <a.icon className="size-4.5" strokeWidth={1.75} />
              </div>
              <div className="flex w-full items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.hint}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Safety guide dialog */}
      <AlertDialog open={safetyOpen} onOpenChange={setSafetyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Safety guide</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              {safetyTips.map((tip, i) => (
                <span key={i} className="block text-sm leading-6">
                  <span className="mr-2 font-medium text-foreground">
                    {i + 1}.
                  </span>
                  {tip}
                </span>
              ))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction className="bg-foreground text-background hover:bg-foreground/90">
            Got it
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}