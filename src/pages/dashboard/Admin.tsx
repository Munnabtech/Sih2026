import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Check, Info, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { riskLevel } from "./data";

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
/* Field reports                                                     */
/* ---------------------------------------------------------------- */
function FieldReports() {
  const incidents = useQuery(api.incidents.listIncidents);
  const verifyIncident = useMutation(api.incidents.verifyIncident);
  const deleteIncident = useMutation(api.incidents.deleteIncident);
  const [busyId, setBusyId] = useState<Id<"incidents"> | null>(null);

  const handleVerify = async (id: Id<"incidents">) => {
    setBusyId(id);
    try {
      await verifyIncident({ id });
      toast.success("Report verified", { description: "It now shows as confirmed in the alerts feed." });
    } catch (error) {
      console.error("Failed to verify report:", error);
      toast.error("Could not verify report");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: Id<"incidents">) => {
    setBusyId(id);
    try {
      await deleteIncident({ id });
      toast.success("Report removed", { description: "It has been taken out of the district feed." });
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
      {incidents.map((incident) => (
        <div key={incident.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{incident.type}</h3>
              {incident.verified ? (
                <Badge className="rounded-sm gap-1 bg-emerald-600 text-white text-[10px] font-medium">
                  <Check className="size-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-sm text-[10px] font-medium">
                  Unverified
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {incident.description}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {incident.location} · {incident.reporterName} ·{" "}
              {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!incident.verified && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={busyId === incident.id}
                onClick={() => handleVerify(incident.id)}
              >
                <ShieldCheck className="size-3.5" />
                Verify
              </Button>
            )}
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
      ))}
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
        <p className="eyebrow">Monitoring desk</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Admin</h1>
      </div>

      <Alert className="border-border bg-background py-3">
        <Info className="size-4 text-muted-foreground" />
        <AlertTitle className="text-sm font-medium">Demo build</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground">
          This desk is shown to every signed-in user for now. In production it
          is restricted to district administrators.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="zones">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="zones" className="flex-1 sm:flex-none">
            Zones
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 sm:flex-none">
            Field reports
          </TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  );
}