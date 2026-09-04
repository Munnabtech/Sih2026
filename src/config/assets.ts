/* ------------------------------------------------------------------ */
/* DHARANETRA — central image/asset configuration                      */
/*                                                                     */
/* ALL image URLs live in this one file. To add a real image, search   */
/* for the constant names below and paste a publicly accessible HTTPS  */
/* URL — or drop a file into src/assets/images/... and reference it    */
/* locally. Components never hardcode URLs; they only reference slots  */
/* from ASSETS below, so replacing a URL updates the entire app.       */
/*                                                                     */
/* Rules:                                                              */
/*  - External images MUST be HTTPS.                                  */
/*  - Empty string ("") means "no image yet" → graceful fallback.     */
/*  - The satellite/terrain maps are NOT images; they use real tile    */
/*    providers (Esri World Imagery / OpenTopoMap) via Leaflet.        */
/* ------------------------------------------------------------------ */

/* ================================================================== */
/* REPLACE THESE — searchable placeholder constants                    */
/* ================================================================== */

/** Landing hero backdrop — landslide monitoring / NER hill landscape. */
export const LANDSLIDE_HERO_IMAGE_URL = "";

/** About-section image — monitoring station, field team, or terrain view. */
export const DHARANETRA_ABOUT_IMAGE_URL = "";

/** Awareness section — landslide safety / slope-failure illustration. */
export const LANDSLIDE_AWARENESS_IMAGE_URL = "";

/** Historical landslide archive photo (data-source section). */
export const HISTORICAL_LANDSLIDE_IMAGE_URL = "";

/** North East India landscape panorama (data-source section). */
export const NER_LANDSCAPE_IMAGE_URL = "";

/* Incident category illustrations (optional; used in report flow). */
export const INCIDENT_LANDSLIDE_IMAGE_URL = "";
export const INCIDENT_ROAD_SLIP_IMAGE_URL = "";
export const INCIDENT_FLOOD_IMAGE_URL = "";
export const INCIDENT_STRUCTURAL_IMAGE_URL = "";

/* ================================================================== */
/* Local assets — copy files into src/assets/images/... and import     */
/* them here, e.g.  import hero from "@/assets/images/backgrounds/hero.jpg"
   then set  url: hero  in the ASSETS entry. Local imports bypass the  */
/* HTTPS check because Vite bundles them.                              */
/* ================================================================== */

export interface ImageSlot {
  id: string;
  /** External HTTPS URL, Vite-bundled local import, or "" for none. */
  url: string;
  /** Meaningful alt text (used as alt/aria-label). */
  alt: string;
}

/**
 * The single registry every component reads from. Components never embed
 * image URLs directly — they reference ASSETS["<id>"].
 */
export const ASSETS: Record<string, ImageSlot> = {
  /* ---------------- branding ---------------- */
  "branding.logo": {
    id: "branding-logo",
    url: "", // app uses the built-in DharanetraMark SVG component by default
    alt: "Dharanetra logo",
  },

  /* ---------------- backgrounds ---------------- */
  "backgrounds.hero": {
    id: "landslide-monitoring",
    url: LANDSLIDE_HERO_IMAGE_URL,
    alt: "Landslide monitoring area in the North Eastern Region of India",
  },
  "backgrounds.about": {
    id: "dharanetra-about",
    url: DHARANETRA_ABOUT_IMAGE_URL,
    alt: "Dharanetra field monitoring context",
  },
  "backgrounds.awareness": {
    id: "landslide-awareness",
    url: LANDSLIDE_AWARENESS_IMAGE_URL,
    alt: "Landslide awareness illustration",
  },

  /* ---------------- data-source section ---------------- */
  "data.historical": {
    id: "historical-landslide",
    url: HISTORICAL_LANDSLIDE_IMAGE_URL,
    alt: "Historical landslide archive photograph",
  },
  "data.landscape": {
    id: "ner-landscape",
    url: NER_LANDSCAPE_IMAGE_URL,
    alt: "North East India landscape panorama",
  },

  /* ---------------- incident categories ---------------- */
  "incident.landslide": {
    id: "incident-landslide",
    url: INCIDENT_LANDSLIDE_IMAGE_URL,
    alt: "Landslide incident illustration",
  },
  "incident.road-slip": {
    id: "incident-road-slip",
    url: INCIDENT_ROAD_SLIP_IMAGE_URL,
    alt: "Road slip incident illustration",
  },
  "incident.flood": {
    id: "incident-flood",
    url: INCIDENT_FLOOD_IMAGE_URL,
    alt: "Flash flood incident illustration",
  },
  "incident.structural": {
    id: "incident-structural",
    url: INCIDENT_STRUCTURAL_IMAGE_URL,
    alt: "Structural damage incident illustration",
  },
};

/** Resolve a slot by id with a safe fallback. */
export function asset(id: string): ImageSlot {
  return (
    ASSETS[id] ?? {
      id,
      url: "",
      alt: "Dharanetra image",
    }
  );
}

/** True when the slot carries a usable HTTPS or bundled-local URL. */
export function hasImage(id: string): boolean {
  const url = asset(id).url;
  if (!url) return false;
  // Bundled local assets (Vite imports) may resolve to relative or
  // root-absolute paths in builds; external URLs must be https.
  return url.startsWith("https://") || url.startsWith("/");
}