import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * ML bridge — DHARANETRA model inference.
 *
 * The .pkl models run inside a Python/FastAPI service (see backend/ml_fastapi/).
 * This module is the only place the web app talks to that service:
 *
 *   browser (React)  ->  Convex action (this file)  ->  FastAPI  ->  .pkl models
 *
 * It never loads or executes model files itself, and it never fabricates
 * predictions: when the backend is unreachable, misconfigured, or returns an
 * invalid payload, the frontend receives an explicit error result and must
 * show an honest "backend not reachable / insufficient data" state.
 *
 * Configure via the project Keys UI:
 *   ML_API_URL  — e.g. https://dharanetra-ml.example.com
 *   ML_API_KEY  — optional bearer token the FastAPI service accepts
 */

const ML_BASE_URL = process.env.ML_API_URL;
const ML_API_KEY = process.env.ML_API_KEY;
const TIMEOUT_MS = 10_000;

const REQUIRED_ENV = ["ML_API_URL"] as const;

export type MlFailureReason =
  | "not_configured"
  | "unreachable"
  | "http_error"
  | "invalid_response"
  | "insufficient_data";

export interface MlFailure {
  ok: false;
  reason: MlFailureReason;
  message: string;
  httpStatus?: number;
}

async function mlFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${ML_BASE_URL}${path}`;
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "content-type": "application/json",
      ...(ML_API_KEY ? { authorization: `Bearer ${ML_API_KEY}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Shared error mapper for every ML call. */
async function asFailure(res: Response): Promise<MlFailure> {
  let detail = "";
  try {
    const body = (await res.json()) as unknown;
    if (isObject(body)) {
      detail =
        typeof body.detail === "string"
          ? body.detail
          : JSON.stringify(body.detail);
    }
  } catch {
    // non-JSON error body; keep the generic message
  }
  return {
    ok: false,
    reason: res.status === 422 ? "insufficient_data" : "http_error",
    httpStatus: res.status,
    message:
      detail ||
      (res.status === 422
        ? "The model backend rejected the supplied features."
        : `Model service returned HTTP ${res.status}.`),
  };
}

/** GET /api/v1/ml/status — model registry health, never fake. */
export const mlStatus = action({
  args: {},
  handler: async (): Promise<
    | { ok: true; backend: string; models: unknown[]; thresholds: unknown }
    | MlFailure
  > => {
    if (!ML_BASE_URL) {
      return {
        ok: false,
        reason: "not_configured",
        message: `ML_API_URL is not configured. Set it in the project Keys UI, then restart. Required: ${REQUIRED_ENV.join(", ")}`,
      };
    }
    try {
      const res = await mlFetch("/api/v1/ml/status");
      if (!res.ok) return asFailure(res);
      const body = (await res.json()) as unknown;
      if (!isObject(body) || typeof body.backend !== "string") {
        return {
          ok: false,
          reason: "invalid_response",
          message: "Model service returned an unexpected status payload.",
        };
      }
      return {
        ok: true,
        backend: body.backend,
        models: Array.isArray(body.models) ? body.models : [],
        thresholds: body.thresholds,
      };
    } catch (error) {
      return {
        ok: false,
        reason: "unreachable",
        message:
          error instanceof Error && error.name === "TimeoutError"
            ? "Model service timed out."
            : "Model backend not reachable.",
      };
    }
  },
});

/** POST /api/v1/ml/landslide — real inference for the landslide model. */
export const predictLandslide = action({
  args: { features: v.record(v.string(), v.number()) },
  handler: async (_ctx, { features }): Promise<
    | {
        ok: true;
        prediction: string;
        risk_probability: number;
        risk_percentage: number;
        risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
        model: string;
      }
    | MlFailure
  > => {
    if (!ML_BASE_URL) {
      return {
        ok: false,
        reason: "not_configured",
        message: "ML_API_URL is not configured.",
      };
    }
    try {
      const res = await mlFetch("/api/v1/ml/landslide", {
        method: "POST",
        body: JSON.stringify({ features }),
      });
      if (!res.ok) return asFailure(res);
      const body = (await res.json()) as unknown;
      if (
        !isObject(body) ||
        typeof body.prediction !== "string" ||
        typeof body.risk_probability !== "number" ||
        typeof body.risk_percentage !== "number" ||
        typeof body.risk_level !== "string"
      ) {
        return {
          ok: false,
          reason: "invalid_response",
          message: "Model service returned an unexpected prediction payload.",
        };
      }
      return {
        ok: true,
        prediction: body.prediction,
        risk_probability: body.risk_probability,
        risk_percentage: body.risk_percentage,
        risk_level: body.risk_level as "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
        model: typeof body.model === "string" ? body.model : "unknown",
      };
    } catch (error) {
      return {
        ok: false,
        reason: "unreachable",
        message:
          error instanceof Error && error.name === "TimeoutError"
            ? "Model service timed out."
            : "Model backend not reachable.",
      };
    }
  },
});

/** POST /api/v1/ml/satellite — satellite-derived risk inference. */
export const predictSatellite = action({
  args: { features: v.record(v.string(), v.number()) },
  handler: async (_ctx, { features }): Promise<
    | { ok: true; prediction: string; risk_percentage: number; model: string }
    | MlFailure
  > => {
    if (!ML_BASE_URL) {
      return {
        ok: false,
        reason: "not_configured",
        message: "ML_API_URL is not configured.",
      };
    }
    try {
      const res = await mlFetch("/api/v1/ml/satellite", {
        method: "POST",
        body: JSON.stringify({ features }),
      });
      if (!res.ok) return asFailure(res);
      const body = (await res.json()) as unknown;
      if (
        !isObject(body) ||
        typeof body.prediction !== "string" ||
        typeof body.risk_percentage !== "number"
      ) {
        return {
          ok: false,
          reason: "invalid_response",
          message: "Model service returned an unexpected satellite payload.",
        };
      }
      return {
        ok: true,
        prediction: body.prediction,
        risk_percentage: body.risk_percentage,
        model: typeof body.model === "string" ? body.model : "unknown",
      };
    } catch (error) {
      return {
        ok: false,
        reason: "unreachable",
        message: "Model backend not reachable.",
      };
    }
  },
});

/** POST /api/v1/ml/iot-alert — IoT telemetry anomaly inference. */
export const predictIotAlert = action({
  args: { features: v.record(v.string(), v.number()) },
  handler: async (_ctx, { features }): Promise<
    | { ok: true; prediction: string; risk_percentage: number; model: string }
    | MlFailure
  > => {
    if (!ML_BASE_URL) {
      return {
        ok: false,
        reason: "not_configured",
        message: "ML_API_URL is not configured.",
      };
    }
    try {
      const res = await mlFetch("/api/v1/ml/iot-alert", {
        method: "POST",
        body: JSON.stringify({ features }),
      });
      if (!res.ok) return asFailure(res);
      const body = (await res.json()) as unknown;
      if (
        !isObject(body) ||
        typeof body.prediction !== "string" ||
        typeof body.risk_percentage !== "number"
      ) {
        return {
          ok: false,
          reason: "invalid_response",
          message: "Model service returned an unexpected IoT payload.",
        };
      }
      return {
        ok: true,
        prediction: body.prediction,
        risk_percentage: body.risk_percentage,
        model: typeof body.model === "string" ? body.model : "unknown",
      };
    } catch (error) {
      return {
        ok: false,
        reason: "unreachable",
        message: "Model backend not reachable.",
      };
    }
  },
});