import L from "leaflet";
import type { Doc } from "@/convex/_generated/dataModel";
import { riskLevel } from "./data";

/* ---------------------------------------------------------------- */
/* Basemaps — real tile providers only                               */
/* ---------------------------------------------------------------- */
export type BasemapId = "standard" | "satellite" | "terrain";

export interface BasemapDef {
  id: BasemapId;
  label: string;
  url: string;
  attribution: string;
  /** Dark page backdrop behind tiles while they load. */
  tileBg: string;
  maxZoom: number;
}

export const BASEMAPS: Record<BasemapId, BasemapDef> = {
  standard: {
    id: "standard",
    label: "Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    tileBg: "#f2f4f7",
    maxZoom: 19,
  },
  satellite: {
    id: "satellite",
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Imagery &copy; Esri, Maxar, Earthstar Geographics — Esri World Imagery",
    tileBg: "#0b1220",
    maxZoom: 18,
  },
  terrain: {
    id: "terrain",
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    tileBg: "#e8eae5",
    maxZoom: 17,
  },
};

export const NER_BOUNDS: [[number, number], [number, number]] = [
  [21.6, 87.9],
  [29.6, 98.3],
];

/* ---------------------------------------------------------------- */
/* ML model coverage — the honesty layer                             */
/* ---------------------------------------------------------------- */
/**
 * Districts where the trained landslide model provides valid predictions.
 * THE SINGLE SOURCE OF TRUTH for the whole app. Everything predictive is
 * gated on this: markers, panels, dashboards, home screen.
 *
 * Currently supported (per the trained model data): Kamrup district, Assam.
 * Add an entry only when the model genuinely covers that district — never
 * to make the map look fuller.
 */
export const MODEL_COVERAGE_DISTRICTS: Record<string, string[]> = {
  Assam: ["Kamrup"],
};

export interface CoverageFlags {
  modelCoverage: boolean;
  historicalDataCoverage: boolean;
  liveMonitoring: boolean;
}

/** True when the model provides valid predictions for this state/district. */
export function hasModelCoverage(
  state: string | undefined,
  district: string | undefined,
): boolean {
  if (!state || !district) return false;
  return (MODEL_COVERAGE_DISTRICTS[state] ?? []).includes(district);
}

/** Capability flags for a district, per the platform data model. */
export function coverageFor(
  state: string | undefined,
  district: string | undefined,
): CoverageFlags {
  return {
    modelCoverage: hasModelCoverage(state, district),
    historicalDataCoverage: Boolean(state && district), // incident/zone records exist per district
    liveMonitoring: hasModelCoverage(state, district),
  };
}

/* ---------------------------------------------------------------- */
/* Overlay layers                                                    */
/* ---------------------------------------------------------------- */
export type OverlayId =
  | "risk"
  | "incidents"
  | "monitoring"
  | "historical";

export interface OverlayDef {
  id: OverlayId;
  label: string;
  description: string;
}

export const OVERLAYS: OverlayDef[] = [
  { id: "risk", label: "ML Risk Prediction", description: "Model-predicted risk markers (covered districts only)" },
  { id: "incidents", label: "Reported Incidents", description: "Citizen and field-officer reports" },
  { id: "monitoring", label: "Monitoring Zones", description: "All registered monitoring zones" },
  { id: "historical", label: "Historical Landslides", description: "Recorded events (where data exists)" },
];

export const DEFAULT_OVERLAYS: OverlayId[] = ["risk", "incidents", "monitoring"];

/* ---------------------------------------------------------------- */
/* Marker icons — filled pin = model prediction available;           */
/* hollow pin = monitoring-only (no model coverage)                  */
/* ---------------------------------------------------------------- */
export const MONO_COLOR = "#8a8f98"; // neutral slate for no-coverage markers

export function coveragePinColor(risk?: number): string {
  if (risk === undefined) return MONO_COLOR;
  const level = riskLevel(risk);
  if (level.level === "Critical") return "#c0392b";
  if (level.level === "High") return "#d35400";
  if (level.level === "Moderate") return "#d9a406";
  return "#1e8449";
}

export function zoneIcon(zone: Doc<"zones">): L.DivIcon {
  const covered = hasModelCoverage(zone.state, zone.district);
  const color = covered ? coveragePinColor(zone.risk) : MONO_COLOR;
  return L.divIcon({
    className: "",
    html: `<div class="dnt-marker${covered ? "" : " dnt-marker--hollow"}" style="--dnt-marker-color: ${color}" title="${
      covered ? "ML prediction available" : "Model coverage unavailable"
    }"><span class="dnt-marker__pin"></span><span class="dnt-marker__dot"></span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

export function incidentIcon(severity?: string): L.DivIcon {
  const color =
    severity === "critical"
      ? "#c0392b"
      : severity === "high"
        ? "#d35400"
        : severity === "moderate"
          ? "#d9a406"
          : severity === "low"
            ? "#1e8449"
            : MONO_COLOR;
  return L.divIcon({
    className: "",
    html: `<div class="dnt-marker dnt-marker--hollow" style="--dnt-marker-color: ${color}"><span class="dnt-marker__pin"></span><span class="dnt-marker__dot"></span></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  });
}