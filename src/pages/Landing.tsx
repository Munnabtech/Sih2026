import { DharanetraMark } from "@/components/DharanetraMark";
import { AssetImage } from "@/components/AssetImage";
import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ClipboardList,
  Database,
  Map,
  Satellite,
  SignalHigh,
} from "lucide-react";

const NAV = [
  { label: "Monitoring", href: "#monitoring" },
  { label: "Coverage", href: "#coverage" },
  { label: "Reporting", href: "#reporting" },
  { label: "Data sources", href: "#data" },
];

const FEATURES = [
  {
    icon: Map,
    title: "Regional risk map",
    body: "Interactive GIS map of the eight North Eastern states with standard, satellite, and terrain basemaps, monitoring-zone markers, and reported incidents.",
  },
  {
    icon: SignalHigh,
    title: "Model-backed prediction",
    body: "Landslide risk assessment from a trained machine-learning model, served over a documented API. Predictions appear only where the model is validated.",
  },
  {
    icon: ClipboardList,
    title: "Incident reporting",
    body: "Structured citizen and field-officer reporting with a guided flow, GPS coordinates, impact assessment, and a full verification lifecycle.",
  },
  {
    icon: Bell,
    title: "Verification workflow",
    body: "Reports enter as REPORTED and progress through verification, response, and resolution by the monitoring desk — never auto-confirmed.",
  },
];

const COVERAGE_ROWS = [
  { area: "Kamrup district, Assam", model: "Available", state: true },
  { area: "Other Assam districts", model: "Not currently available", state: false },
  { area: "Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura", model: "Not currently available", state: false },
];

const DATA_SOURCES = [
  { name: "Monitoring-zone registry", status: "Connected" },
  { name: "Incident reporting database", status: "Connected" },
  { name: "Landslide prediction model (FastAPI)", status: "When configured" },
  { name: "Base maps & satellite imagery", status: "Connected" },
  { name: "Live weather feed", status: "Planned" },
  { name: "IoT sensor telemetry", status: "Planned" },
  { name: "Historical landslide inventory", status: "Planned" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top information bar */}
      <div className="topbar px-4 py-1.5 text-center text-[11px] tracking-wide lg:px-6">
        Decision Support Platform for Landslide Risk Monitoring — North
        Eastern Region of India
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-sm bg-primary">
              <DharanetraMark className="size-6 text-primary-foreground" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.18em]">
                DHARANETRA
              </span>
              <span className="block text-[10px] text-muted-foreground">
                AI-Powered Landslide Risk Monitoring
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-sm px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="rounded-sm bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open platform
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:px-6 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="eyebrow">Landslide early warning · NER of India</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Predict · Alert · Respond · Protect
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Dharanetra is a decision-support platform for landslide risk
              monitoring across the North Eastern Region — combining an
              interactive GIS risk map, a trained prediction model, and a
              verified incident-reporting workflow for administrators, field
              officers, and citizens.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Open the platform
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#coverage"
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Database className="size-4" />
                Model coverage
              </a>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Guest access available — the full dashboard works without an
              account.
            </p>
          </div>

          {/* Hero image — configure via LANDSLIDE_HERO_IMAGE_URL in
              src/config/assets.ts; shows a clean fallback until set. */}
          <AssetImage
            id="backgrounds.hero"
            className="hidden min-h-64 rounded-md border border-border lg:block"
            fallbackLabel="Landslide monitoring imagery — add LANDSLIDE_HERO_IMAGE_URL in src/config/assets.ts"
          />

          {/* Coverage transparency panel */}
          <div className="rounded-md border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5">
              <p className="text-sm font-semibold">Model & data coverage</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Stated exactly as it is — nothing overstated
              </p>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {COVERAGE_ROWS.map((row) => (
                <div key={row.area} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="text-[13px] leading-5">{row.area}</span>
                  <span
                    className={`shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-medium ${
                      row.state
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.model}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-5 py-3">
              <p className="text-[11px] leading-5 text-muted-foreground">
                Monitoring zones and incident reporting remain active across
                the region. Risk predictions are shown only where the trained
                model is validated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Monitoring capabilities */}
      <section id="monitoring" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6 lg:py-16">
          <p className="eyebrow">Platform capabilities</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight">
            One operational picture for the region
          </h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-card px-5 py-6">
                <span className="flex size-9 items-center justify-center rounded-sm border border-border text-muted-foreground">
                  <feature.icon className="size-4" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage section */}
      <section id="coverage" className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Scientific transparency</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Coverage is stated, never implied
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                The platform distinguishes clearly between model coverage,
                monitoring coverage, and historical data. Where the model is
                not yet trained, Dharanetra says so directly on the map, in
                the dashboard, and on every zone page — rather than displaying
                a number that science does not support.
              </p>
              <ul className="mt-5 flex flex-col gap-2.5">
                {[
                  "Filled map markers: model prediction available",
                  "Hollow markers: monitoring only — no model output",
                  "Every prediction traceable to the model API response",
                  "Planned expansion across the NER listed openly",
                ].map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div id="data" className="rounded-md border border-border bg-card">
              <div className="border-b border-border px-5 py-3.5">
                <p className="text-sm font-semibold">Data sources & status</p>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {DATA_SOURCES.map((source) => (
                  <div key={source.name} className="flex items-center justify-between gap-4 px-5 py-2.5">
                    <span className="text-[13px]">{source.name}</span>
                    <span
                      className={`shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-medium ${
                        source.status === "Connected"
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {source.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reporting section */}
      <section id="reporting" className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2 lg:px-6 lg:py-16">
          <div className="flex flex-col gap-4">
            <AssetImage
              id="backgrounds.awareness"
              className="h-48 rounded-md border border-border"
              fallbackLabel="Landslide awareness imagery — add LANDSLIDE_AWARENESS_IMAGE_URL in src/config/assets.ts"
            />
            <div className="rounded-md border border-border bg-card p-6 lg:p-8">
              <span className="flex size-9 items-center justify-center rounded-sm border border-border text-muted-foreground">
                <AlertTriangle className="size-4" strokeWidth={1.75} />
              </span>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">
                See something on a slope? Report it.
              </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Cracks, bulging ground, leaning trees, sudden seepage — a
              five-minute report helps the monitoring desk verify and respond.
              Reports can be filed anonymously and are never auto-confirmed.
            </p>
            <Link
              to="/auth"
              className="mt-5 inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Report an incident
              <ArrowRight className="size-4" />
            </Link>
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-6 lg:p-8">
            <span className="flex size-9 items-center justify-center rounded-sm border border-border text-muted-foreground">
              <Satellite className="size-4" strokeWidth={1.75} />
            </span>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              Built for the field
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Satellite and terrain basemaps for ground context, district-level
              filtering across all eight states, bottom-sheet details on
              mobile, and honest "data unavailable" states where a feed is not
              connected.
            </p>
            <Link
              to="/auth"
              className="mt-5 inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Explore the risk map
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-sm bg-primary-foreground">
                  <DharanetraMark className="size-6 text-primary" />
                </span>
                <span className="text-sm font-semibold tracking-[0.18em]">
                  DHARANETRA
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-primary-foreground/70">
                An independent decision-support platform for landslide risk
                monitoring in the North Eastern Region of India. Not operated
                by or officially affiliated with any government body;
                institutional references are informational only.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 text-[13px]">
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/50">
                  Platform
                </p>
                <ul className="flex flex-col gap-2 text-primary-foreground/80">
                  <li><a href="#monitoring" className="hover:text-primary-foreground">Monitoring</a></li>
                  <li><a href="#coverage" className="hover:text-primary-foreground">Model coverage</a></li>
                  <li><a href="#reporting" className="hover:text-primary-foreground">Incident reporting</a></li>
                </ul>
              </div>
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/50">
                  Relevant ecosystem
                </p>
                <ul className="flex flex-col gap-2 text-primary-foreground/60">
                  <li>Disaster management authorities</li>
                  <li>State emergency operations centres</li>
                  <li>Geological & meteorological services</li>
                  <li>Remote sensing organisations</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-2 border-t border-primary-foreground/15 pt-5 text-[11px] text-primary-foreground/50 sm:flex-row sm:justify-between">
            <span>Dharanetra · Predict · Alert · Respond · Protect</span>
            <span>Relevant data & institutional ecosystem — references only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
