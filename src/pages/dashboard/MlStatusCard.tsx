import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "convex/react";
import { CheckCircle2, Cpu, Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

interface MlStatusModel {
  name?: string;
  capability?: string;
  loaded?: boolean;
  reason?: string;
  capabilities?: string[];
  required_features?: string[];
  classes?: string[];
}

type MlStatusResult =
  | { ok: true; backend: string; models: MlStatusModel[]; thresholds: unknown }
  | { ok: false; reason: string; message: string };

/* ---------------------------------------------------------------- */
/* Compact backend status (Admin -> ML services tab)                 */
/* ---------------------------------------------------------------- */
export function MlStatusCard() {
  const mlStatus = useAction(api.ml.mlStatus);
  const [state, setState] = useState<MlStatusResult | null>(null);

  useEffect(() => {
    let alive = true;
    void mlStatus().then((result) => {
      if (alive) setState(result as MlStatusResult);
    });
    return () => {
      alive = false;
    };
  }, [mlStatus]);

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <p className="text-sm font-semibold">ML model service</p>
        </div>
        {state === null && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Checking…
          </span>
        )}
        {state !== null && (
          <Badge
            className={`rounded-sm text-[10px] font-medium ${
              state.ok && state.backend === "ok"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {state.ok && state.backend === "ok" ? "Online" : "Unavailable"}
          </Badge>
        )}
      </div>

      <div className="px-5 py-4">
        {state === null && (
          <p className="text-sm text-muted-foreground">
            Contacting the prediction service…
          </p>
        )}
        {state !== null && !state.ok && (
          <div className="flex items-start gap-3">
            <WifiOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Backend not reachable</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {state.message} Model predictions are not available; the app
                shows no risk numbers it cannot verify.
              </p>
            </div>
          </div>
        )}
        {state !== null && state.ok && (
          <div className="flex flex-col divide-y divide-border">
            {state.models.length === 0 && (
              <p className="pb-2 text-sm text-muted-foreground">
                No models registered. Place the .pkl files in{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  backend/ml_fastapi/models/
                </code>{" "}
                and restart the service.
              </p>
            )}
            {state.models.map((model, i) => (
              <div
                key={`${model.name ?? "model"}-${i}`}
                className={`flex flex-col gap-1.5 py-3 ${i === 0 ? "pt-0" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold">
                    {model.name ?? "unknown"}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {model.capability ?? "—"}
                  </span>
                  {model.loaded ? (
                    <Badge className="gap-1 rounded-sm bg-emerald-600 text-[10px] font-medium text-white">
                      <CheckCircle2 className="size-3" />
                      Loaded
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-sm text-[10px] font-medium">
                      Not loaded
                    </Badge>
                  )}
                </div>
                {model.loaded ? (
                  <p className="text-xs leading-5 text-muted-foreground">
                    {model.capabilities?.join(", ")} ·{" "}
                    {model.required_features?.length
                      ? `features: ${model.required_features.join(", ")}`
                      : "feature metadata unavailable"}
                    {model.classes?.length
                      ? ` · classes: ${model.classes.join(", ")}`
                      : ""}
                  </p>
                ) : (
                  <p className="text-xs leading-5 text-muted-foreground">
                    {model.reason ?? "Not loaded"}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Dynamic per-zone model assessment form (Zone detail)              */
/* ---------------------------------------------------------------- */
/**
 * Renders number inputs for exactly the features the loaded model reports
 * (from /api/v1/ml/status) and submits them to /api/v1/ml/landslide.
 * Nothing here guesses feature names or prediction values.
 */
export function ModelAssessmentForm() {
  const mlStatus = useAction(api.ml.mlStatus);
  const predictLandslide = useAction(api.ml.predictLandslide);

  const [status, setStatus] = useState<MlStatusResult | null>(null);
  const [features, setFeatures] = useState<Record<string, string>>({});
  const [result, setResult] = useState<
    | { ok: true; prediction: string; risk_percentage: number; risk_level: string; risk_probability: number }
    | { ok: false; reason: string; message: string }
    | null
  >(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let alive = true;
    void mlStatus().then((res) => {
      if (!alive) return;
      setStatus(res as MlStatusResult);
      const model = res.ok
        ? (res.models as MlStatusModel[]).find(
            (m) => m.capability === "landslide" && m.loaded,
          )
        : undefined;
      if (model?.required_features?.length) {
        setFeatures(
          Object.fromEntries(model.required_features.map((f) => [f, ""])),
        );
      }
    });
    return () => {
      alive = false;
    };
  }, [mlStatus]);

  const landslideModel =
    status?.ok && Array.isArray(status.models)
      ? (status.models as MlStatusModel[]).find(
          (m) => m.capability === "landslide" && m.loaded,
        )
      : undefined;
  const featureNames = landslideModel?.required_features ?? [];
  const allFilled =
    featureNames.length > 0 &&
    featureNames.every((f) => features[f] !== undefined && features[f] !== "");

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const payload = Object.fromEntries(
        featureNames.map((f) => [f, Number(features[f])]),
      );
      const res = await predictLandslide({ features: payload });
      setResult(res);
    } catch (error) {
      console.error("Prediction failed:", error);
      setResult({
        ok: false,
        reason: "unreachable",
        message: "Model backend not reachable.",
      });
    } finally {
      setRunning(false);
    }
  };

  if (status === null) {
    return (
      <div className="rounded-lg border border-border bg-background px-5 py-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Contacting the prediction service…
        </p>
      </div>
    );
  }

  if (!status.ok || status.backend !== "ok") {
    return (
      <div className="rounded-lg border border-border bg-background px-5 py-4">
        <p className="text-sm font-medium">Backend not reachable</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {status.ok ? "The model service is degraded." : status.message} Model
          risk assessment is unavailable until the ML service is connected.
        </p>
      </div>
    );
  }

  if (!landslideModel) {
    return (
      <div className="rounded-lg border border-border bg-background px-5 py-4">
        <p className="text-sm font-medium">Landslide model not loaded</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          The prediction service is online but has no loaded landslide model.
          Check the model status tab for load errors.
        </p>
      </div>
    );
  }

  if (featureNames.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background px-5 py-4">
        <p className="text-sm font-medium">Feature metadata unavailable</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          The landslide model does not expose its required features, so the app
          will not guess them. Add a{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            FEATURE_ORDER_OVERRIDES
          </code>{" "}
          entry in the ML service config to enable prediction.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <p className="text-sm font-semibold">Model risk assessment</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {landslideModel.name} · features reported by the model
        </p>
      </div>
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {featureNames.map((f) => (
            <label key={f} className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] text-muted-foreground">
                {f}
              </span>
              <Input
                type="number"
                step="any"
                value={features[f] ?? ""}
                onChange={(e) =>
                  setFeatures((prev) => ({ ...prev, [f]: e.target.value }))
                }
                placeholder="0"
                className="h-9 font-mono text-xs"
              />
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs leading-5 text-muted-foreground">
            Prediction is run by the real model over HTTP — no values are
            generated client-side.
          </p>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={run}
            disabled={running || !allFilled}
          >
            {running ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Cpu className="size-3.5" />
            )}
            Run assessment
          </Button>
        </div>

        {result !== null && (
          <div
            className={`rounded-md border px-4 py-3 text-sm ${
              result.ok
                ? "border-emerald-600/30 bg-emerald-600/5"
                : "border-red-600/30 bg-red-600/5"
            }`}
          >
            {result.ok ? (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-sm font-semibold">
                  {result.risk_level} risk
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {result.risk_percentage}% probability
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {result.prediction}
                </span>
              </div>
            ) : (
              <p>
                <span className="font-medium">Assessment unavailable.</span>{" "}
                <span className="text-muted-foreground">{result.message}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}