import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Check, Info, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  INCIDENT_STATUSES,
  incidentStatusLabel,
  riskLevel,
  severityLabel,
} from "./data";
import { MlStatusCard } from "./MlStatusCard";
import { AssetImage } from "@/components/AssetImage";

/* ---------------------------------------------------------------- */
/* Zone row                                                          */
/* ---------------------------------------------------------------- */
function ZoneRow({ zone }: { zone: Doc<"zones"> }) {
  const updateZone = useMutation(api.zones.updateZone);
  const [risk, setRisk] = useState(zone.risk);
  const [status, setStatus] = useState(zone.status);
  const [saving, setSaving] = useState(false);
  const dirty = risk !== zone.risk || status !== zone.status;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateZone({ id: zone._id, risk, status });
      toast.success(`${zone.code} updated`, {
        description: `Risk set to ${risk}/100 · ${status === "monitored" ? "monitoring" : "standby"}.`,
      });
    } catch (error) {
      console.error("Failed to update zone:", error);
      toast.error("Could not save changes", { description: "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-xs text-muted-foreground">{zone.code}</span>
        <h3 className="text-sm font-semibold">{zone.name}</h3>
        <span className="text-xs text-muted-foreground">{zone.type}</span>
        <span className="ml-auto flex items-center gap-2 text-sm font-semibold tabular-nums">
          <span className={`size-2 rounded-full ${riskLevel(risk).dot}`} />
          {risk}
          <span className="text-xs font-normal text-muted-foreground">/ 100</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-52 flex-1 items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={risk}
            onChange={(e) => setRisk(Number(e.target.value))}
            aria-label={`${zone.code} risk score`}
            className="w-full accent-foreground"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Switch
            checked={status === "monitored"}
            onCheckedChange={(checked) =>
              setStatus(checked ? "monitored" : "standby")
            }
          />
          {status === "monitored" ? "Monitored" : "Standby"}
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="gap-1.5"
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Field reports with lifecycle workflow                             */
/* ---------------------------------------------------------------- */
function FieldReports() {
  const incidents = useQuery(api.incidents.listIncidents);
  const setIncidentStatus = useMutation(api.incidents.setIncidentStatus);
  const deleteIncident = useMutation(api.incidents.deleteIncident);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<Id<"incidents"> | null>(null);

  const handleStatus = async (id: Id<"incidents">, status: string) => {
    setBusyId(id);
    try {
      await setIncidentStatus({
        id,
        status: status as
          | "reported"
          | "under_verification"
          | "verified"
          | "response_in_progress"
          | "resolved"
          | "false_duplicate",
      });
      toast.success(`Status set to ${incidentStatusLabel(status)}`);
      setDraft((prev) => ({ ...prev, [id]: status }));
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Could not update status");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: Id<"incidents">) => {
    setBusyId(id);
    try {
      await deleteIncident({ id });
      toast.success("Report removed", { description: "It has been taken out of the feeds." });
    } catch (error) {
      console.error("Failed to delete report:", error);
      toast.error("Could not remove report");
    } finally {
      setBusyId(null);
    }
  };

  if (incidents === undefined) {
    return (
      <div className="border border-border px-6 py-14 text-center text-sm text-muted-foreground">
        Loading reports…
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="border border-border px-6 py-14 text-center text-sm text-muted-foreground">
        No field reports to review yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border border border-border">
      {incidents.map((incident) => {
        const current = draft[incident.id] ?? incident.status ?? "reported";
        return (
          <div key={incident.id} className="flex flex-col gap-3 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{incident.type}</h3>
              <span className="text-xs text-muted-foreground">
                {incident.state ? `${incident.state} · ` : ""}
                {incident.district ?? incident.location}
              </span>
              <Badge variant="outline" className="rounded-sm text-[10px] font-medium">
                {severityLabel(incident.severity)}
              </Badge>
              <Badge className="rounded-sm bg-foreground text-[10px] font-medium text-background">
                {incidentStatusLabel(incident.status)}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {incident.description}
            </p>
            <p className="text-xs text-muted-foreground">
              {incident.reporterName} ·{" "}
              {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
              {incident.latitude !== undefined && incident.longitude !== undefined
                ? ` · ${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`
                : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Select value={current} onValueChange={(v) => handleStatus(incident.id, v)}>
                <SelectTrigger
                  aria-label={`${incident.type} status`}
                  className="h-9 w-52 text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1.5 text-destructive hover:text-destructive"
                disabled={busyId === incident.id}
                onClick={() => handleDelete(incident.id)}
              >
                {busyId === incident.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Remove
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Data sources — transparency, never overstating availability       */
/* ---------------------------------------------------------------- */
function DataSources() {
  const available = [
    "Monitored zone registry (Convex) — zones, states, districts, risk scores",
    "Field incident reports (Convex) — citizen and field-officer reports with lifecycle status",
    "Risk classification thresholds — configured once in the ML service",
    "ML predictions — only when the FastAPI model service is reachable",
  ];
  const planned = [
    "Live IoT sensors — no sensor telemetry is connected",
    "Official rainfall API — no weather API is connected; weather cards show demo values",
    "Real-time government alerts — no government feed is connected",
    "Satellite imagery pipelines — no satellite data pipeline is connected",
    "Authoritative district boundaries (GeoJSON) — structure is ready, data not connected",
  ];

  const row = (label: string, items: string[]) => (
    <div className="px-5 py-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/30" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex flex-col divide-y divide-border border border-border">
      {row("Available data", available)}
      {row("Planned / future integration", planned)}
      <div className="px-5 py-4">
        <p className="text-xs leading-5 text-muted-foreground">
          Dharanetra only labels data as live when a verified source is
          connected. Nothing in this list is claimed to be operational unless
          it is listed under available data.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Admin page                                                        */
/* ---------------------------------------------------------------- */
export function Admin() {
  const zones = useQuery(api.zones.listZones);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">About the platform</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          About &amp; administration
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
          Dharanetra is a decision-support platform for landslide risk
          monitoring in the North Eastern Region of India. It combines a
          monitoring-zone registry, citizen and field incident reporting with
          a verification workflow, and a trained landslide prediction model
          served over a FastAPI backend. It is an independent platform and is
          not operated by or officially affiliated with any government body.
        </p>
      </div>

      {/* About image — DHARANETRA_ABOUT_IMAGE_URL in src/config/assets.ts */}
      <AssetImage
        id="backgrounds.about"
        className="h-44 rounded-md border border-border sm:h-52"
        fallbackLabel="Platform monitoring imagery — add DHARANETRA_ABOUT_IMAGE_URL in src/config/assets.ts"
      />

      <Alert className="border-border bg-card py-3">
        <Info className="size-4 text-muted-foreground" />
        <AlertTitle className="text-sm font-medium">Demonstration access</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground">
          This administration desk is open to every signed-in user in this
          build. In production it is restricted to district administrators,
          and incident status changes are logged per operator.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="zones">
        <TabsList className="w-full overflow-x-auto sm:w-fit">
          <TabsTrigger value="zones" className="flex-1 sm:flex-none">
            Zones
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 sm:flex-none">
            Field reports
          </TabsTrigger>
          <TabsTrigger value="ml" className="flex-1 sm:flex-none">
            ML services
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex-1 sm:flex-none">
            Data sources
          </TabsTrigger>
        </TabsList>
        {/* About / platform overview content for the primary nav entry */}

        <TabsContent value="zones" className="mt-4">
          <div className="flex flex-col divide-y divide-border border border-border">
            {zones === undefined ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                Loading zones…
              </div>
            ) : (
              zones.map((zone) => <ZoneRow key={zone._id} zone={zone} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <FieldReports />
        </TabsContent>

        <TabsContent value="ml" className="mt-4">
          <div className="flex flex-col gap-3">
            <MlStatusCard />
            <p className="px-1 text-xs leading-5 text-muted-foreground">
              Connect the ML service by setting <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">ML_API_URL</code> in the
              project Keys UI, then restart the service. Predictions shown in
              the app always come from the model over HTTP — there is no
              client-side fallback.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <DataSources />
        </TabsContent>
      </Tabs>
    </div>
  );
}