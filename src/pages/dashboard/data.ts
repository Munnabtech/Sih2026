import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";

export type ViewId =
  | "overview"
  | "alerts"
  | "weather"
  | "map"
  | "report"
  | "catalog"
  | "zone"
  | "admin"
  | "settings";

export const DISTRICT = "Kamrup District, Assam";

/* ---------------------------------------------------------------- */
/* Live telemetry (demo data — wire to a weather API for live data)  */
/* ---------------------------------------------------------------- */
export const liveWeather = {
  rainfall: "18 mm/hr",
  temp: "24°C",
  humidity: "86%",
  wind: "12 km/h",
};

export const risk = {
  score: 72,
  level: "High",
};

export const riskFactors = [
  "Heavy rainfall and terrain — 38 mm recorded in the last 6 hours.",
  "Soil saturation at 86%, approaching the 90% failure threshold.",
  "Slope 4A-11 infiltration rate at 12 mm/hr, above the district norm.",
  "Two historical landslide points within 400 m of settlements.",
];

/** Hourly rainfall (mm/hr) for the last 24 hours, index 0 = now-23h. */
export const rainfallTrend = [
  2, 1, 0, 0, 1, 3, 5, 8, 12, 18, 22, 19, 14, 10, 8, 6, 9, 13, 11, 7, 4, 2, 1,
  0,
];

export interface ForecastDay {
  day: string;
  icon: LucideIcon;
  hi: number;
  lo: number;
  rain: number; // %
}

export const forecast: ForecastDay[] = [
  { day: "Today", icon: CloudRain, hi: 26, lo: 21, rain: 85 },
  { day: "Thu", icon: CloudSun, hi: 28, lo: 22, rain: 40 },
  { day: "Fri", icon: Sun, hi: 30, lo: 23, rain: 10 },
  { day: "Sat", icon: Cloud, hi: 29, lo: 23, rain: 25 },
  { day: "Sun", icon: CloudDrizzle, hi: 27, lo: 22, rain: 60 },
  { day: "Mon", icon: CloudLightning, hi: 25, lo: 21, rain: 80 },
  { day: "Tue", icon: CloudFog, hi: 24, lo: 20, rain: 55 },
];

/* ---------------------------------------------------------------- */
/* Alerts                                                            */
/* ---------------------------------------------------------------- */
export type AlertSeverity = "critical" | "high" | "advisory" | "info";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  time: string;
  source: "Model" | "Community";
  verified?: boolean;
}

export const demoAlerts: AlertItem[] = [
  {
    id: "a1",
    severity: "high",
    title: "High risk — Sonapur slope",
    body: "Heavy rainfall intensification on slope 4A-11. Monitoring frequency increased.",
    time: "16 minutes ago",
    source: "Model",
  },
  {
    id: "a2",
    severity: "critical",
    title: "Critical — historical landslide point",
    body: "Rainfall above 20 mm/hr sustained for 3 hours near recorded slide points.",
    time: "29 minutes ago",
    source: "Model",
  },
  {
    id: "a3",
    severity: "advisory",
    title: "Road slip reported on NH-27",
    body: "Field team dispatched. Expect delays between mileposts 14 and 18.",
    time: "41 minutes ago",
    source: "Community",
  },
  {
    id: "a4",
    severity: "high",
    title: "Soil saturation alert — Rangia",
    body: "Saturation at 91% on slopes 2B-03 and 2B-04. Pre-emptive advisory issued.",
    time: "1 hour ago",
    source: "Model",
  },
  {
    id: "a5",
    severity: "advisory",
    title: "Flash flood watch — Kulsi river basin",
    body: "River stage rising 4 cm/hr. Avoid low-lying crossings overnight.",
    time: "2 hours ago",
    source: "Model",
  },
  {
    id: "a6",
    severity: "info",
    title: "Vegetation clearing verified — Chamaria",
    body: "Field officer confirmed drainage channel cleared. Risk contribution reduced.",
    time: "3 hours ago",
    source: "Community",
  },
];

/* ---------------------------------------------------------------- */
/* Safety guide                                                      */
/* ---------------------------------------------------------------- */
export const safetyTips = [
  "If you see cracks, bulging ground, or leaning trees on a slope, move away immediately and report it.",
  "During high-risk alerts, keep a go-bag ready: documents, torch, radio, water, and medicines.",
  "Know your evacuation route now — do not wait for a critical alert to learn it.",
  "Never cross a visibly flowing waterway or a blocked road during heavy rain.",
];

export const incidentTypes = [
  "Landslide",
  "Road slip",
  "Flash flood",
  "Structural damage",
  "Other",
];

/* ---------------------------------------------------------------- */
/* Risk levels                                                       */
/* ---------------------------------------------------------------- */
export interface RiskLevel {
  level: "Low" | "Moderate" | "High" | "Critical";
  dot: string; // tailwind bg class for the level dot
  text: string; // tailwind text class
}

export function riskLevel(score: number): RiskLevel {
  if (score >= 81) return { level: "Critical", dot: "bg-red-600", text: "text-red-600" };
  if (score >= 61) return { level: "High", dot: "bg-orange-500", text: "text-orange-600" };
  if (score >= 41) return { level: "Moderate", dot: "bg-amber-500", text: "text-amber-600" };
  return { level: "Low", dot: "bg-emerald-600", text: "text-emerald-700" };
}