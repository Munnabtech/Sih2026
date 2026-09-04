import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Camera,
  CloudRain,
  Droplets,
  Eye,
  MapPin,
  Mountain,
  Radio,
  ShieldCheck,
  Thermometer,
  WifiOff,
  Wind,
} from "lucide-react";
import { Link } from "react-router";
import { DharanetraMark } from "@/components/DharanetraMark";

/* Contour-line decoration used behind the hero and CTA */
function ContourField({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 600"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {[
        "M-80 520 C 200 380, 420 560, 720 420 S 1180 300, 1320 380",
        "M-80 560 C 220 430, 460 610, 760 470 S 1200 350, 1340 430",
        "M-80 480 C 180 340, 400 520, 700 380 S 1160 260, 1300 340",
        "M-80 440 C 160 300, 380 480, 680 340 S 1140 220, 1280 300",
        "M-80 400 C 140 260, 360 440, 660 300 S 1120 180, 1260 260",
        "M-80 360 C 120 220, 340 400, 640 260 S 1100 140, 1240 220",
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity={0.35 - i * 0.05}
        />
      ))}
      <path
        d="M600 560 C 660 480, 720 520, 800 440"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
    </svg>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

const NAV_LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Risk levels", href: "#risk" },
  { label: "Alerts", href: "#alerts" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ------------------------------------------------ Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <DharanetraMark className="size-7" />
            <span className="text-sm font-semibold tracking-[0.28em]">
              DHARANETRA
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Open app
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ Hero */}
      <section className="relative overflow-hidden">
        <ContourField className="pointer-events-none absolute inset-x-0 top-0 h-full w-full text-border/70" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <motion.p
            {...fadeUp}
            className="eyebrow flex items-center gap-2.5"
          >
            <span className="inline-block size-1.5 rounded-full bg-foreground" />
            AI-powered landslide risk monitoring
          </motion.p>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
          >
            Know the risk
            <br />
            before the ground moves.
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-base leading-7 text-muted-foreground text-pretty sm:text-lg"
          >
            Dharanetra fuses satellite terrain analysis, live rainfall
            telemetry, and community field reports into one clear risk signal
            — built for the people of Assam and the wider North East Region,
            where the ground moves and networks don&apos;t always reach.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              to="/dashboard"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-7 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Enter command center
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-11 items-center rounded-md border border-border bg-background px-7 text-sm font-medium transition-colors hover:bg-accent"
            >
              See how it works
            </a>
          </motion.div>
        </div>

        {/* Stat band */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="relative mx-auto w-full max-w-6xl px-6 pb-20"
        >
          <div className="grid grid-cols-2 divide-x divide-border border border-border bg-background md:grid-cols-4">
            {[
              {
                label: "Current risk",
                value: "72 / 100",
                accent: true,
              },
              { label: "Rainfall, now", value: "18 mm/hr" },
              { label: "Soil saturation", value: "86%" },
              { label: "Districts monitored", value: "6" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 px-6 py-5 text-left"
              >
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {stat.label}
                </span>
                <span
                  className={
                    stat.accent
                      ? "text-2xl font-semibold tracking-tight text-red-600"
                      : "text-2xl font-semibold tracking-tight"
                  }
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ------------------------------------------------ Features */}
      <section id="alerts" className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <motion.div {...fadeUp} className="max-w-xl">
            <p className="eyebrow">One signal, four feeds</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to stay ahead of the slope.
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Radio,
                title: "Predictive alerts",
                body: "Model risk from rainfall intensity, terrain steepness, and soil saturation — hours before a slide, not after.",
              },
              {
                icon: CloudRain,
                title: "Live telemetry",
                body: "Rainfall, temperature, humidity, and wind streamed per zone, so the risk picture is always current.",
              },
              {
                icon: Camera,
                title: "Field reporting",
                body: "Residents and field officers report incidents with one tap. Every report sharpens the district-wide picture.",
              },
              {
                icon: WifiOff,
                title: "Offline resilience",
                body: "Cached maps and GPS continue to work when the network drops — critical in the hills that need it most.",
              },
            ].map((f) => (
              <div key={f.title} className="group bg-background p-7">
                <div className="flex size-10 items-center justify-center rounded-md border border-border transition-colors group-hover:bg-foreground group-hover:text-background">
                  <f.icon className="size-4.5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-6 text-base font-semibold">{f.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ How it works */}
      <section id="how" className="border-t border-border bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <motion.div {...fadeUp} className="max-w-xl">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              From sensor to signal in three steps.
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-12 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: Mountain,
                title: "Sense",
                body: "Satellite-derived terrain models, district rainfall gauges, and community reports feed a continuously updating hazard baseline.",
              },
              {
                n: "02",
                icon: Eye,
                title: "Model",
                body: "An AI risk engine weighs slope, soil moisture, and rainfall intensity to score every monitored zone from 0 to 100.",
              },
              {
                n: "03",
                icon: Bell,
                title: "Respond",
                body: "Crossing a threshold triggers targeted alerts to residents and field teams — with evacuation guidance attached.",
              },
            ].map((step) => (
              <motion.div key={step.n} {...fadeUp} className="relative">
                <div className="flex items-baseline justify-between border-b border-border pb-4">
                  <span className="text-sm font-semibold tracking-[0.2em] text-muted-foreground">
                    {step.n}
                  </span>
                  <step.icon
                    className="size-5 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Risk scale */}
      <section id="risk" className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <motion.div {...fadeUp} className="max-w-xl">
            <p className="eyebrow">The risk scale</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Four levels. Zero ambiguity.
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                level: "Low",
                range: "0 – 40",
                color: "bg-emerald-600",
                body: "Normal monsoon conditions. Standard vigilance.",
              },
              {
                level: "Moderate",
                range: "41 – 60",
                color: "bg-amber-500",
                body: "Sustained rainfall. Monitor sensitive slopes.",
              },
              {
                level: "High",
                range: "61 – 80",
                color: "bg-orange-500",
                body: "Alert residents. Field teams on standby.",
              },
              {
                level: "Critical",
                range: "81 – 100",
                color: "bg-red-600",
                body: "Immediate action. Evacuation guidance issued.",
              },
            ].map((r) => (
              <div key={r.level} className="bg-background p-7">
                <div className="flex items-center gap-2.5">
                  <span className={`size-2 rounded-full ${r.color}`} />
                  <span className="text-sm font-semibold">{r.level}</span>
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {r.range}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {r.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ CTA */}
      <section className="border-t border-border bg-foreground text-background">
        <div className="relative overflow-hidden">
          <ContourField className="pointer-events-none absolute inset-0 h-full w-full text-background/15" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-24 text-center">
            <motion.div {...fadeUp}>
              <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-background/25">
                <ShieldCheck className="size-5" strokeWidth={1.5} />
              </div>
              <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Be the first line of defense.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-background/60 sm:text-base">
                Predict • Alert • Respond • Protect. Sign in once and your
                session stays secure — the app always opens straight back to
                your district&apos;s risk, no matter what happened last time.
              </p>
              <Link
                to="/dashboard"
                className="mt-10 inline-flex h-11 items-center gap-2 rounded-md bg-background px-7 text-sm font-medium text-foreground transition-opacity hover:opacity-85"
              >
                Open the command center
                <ArrowRight className="size-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <DharanetraMark className="size-6" />
            <span className="text-xs font-semibold tracking-[0.28em]">
              DHARANETRA
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" /> Kamrup, Assam
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Droplets className="size-3.5" /> 86% saturation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Thermometer className="size-3.5" /> 24°C
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wind className="size-3.5" /> 12 km/h
            </span>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <AlertTriangle className="size-3.5" />
            View live risk
          </Link>
        </div>
      </footer>
    </div>
  );
}