import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DISTRICT, incidentTypes } from "./data";

export function Report() {
  const reportIncident = useMutation(api.incidents.reportIncident);
  const incidents = useQuery(api.incidents.listIncidents);

  const [location, setLocation] = useState(DISTRICT);
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!type.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await reportIncident({
        type: type.trim(),
        description: description.trim(),
        location: location.trim() || DISTRICT,
      });
      toast.success("Report submitted", {
        description: "Field teams have been notified. Thank you.",
      });
      setType("");
      setDescription("");
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast.error("Could not submit report", {
        description: "Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="eyebrow">Field reporting</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Report incident
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="report-location"
              className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
            >
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="report-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="report-type"
              className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
            >
              Incident type
            </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="report-type" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="report-description"
            className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
          >
            Description
          </label>
          <Textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you see? Include road names, landmarks, and approximate distance from the road."
            rows={4}
            required
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">
            Reports are shared with the district monitoring desk and visible in
            the alerts feed.
          </p>
          <Button
            type="submit"
            disabled={submitting || !type.trim() || !description.trim()}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Report
          </Button>
        </div>
      </form>

      <section>
        <p className="eyebrow mb-3">Recent field reports</p>
        {incidents === undefined ? (
          <div className="rounded-lg border border-border px-5 py-10 text-center text-sm text-muted-foreground">
            Loading reports…
          </div>
        ) : incidents.length === 0 ? (
          <div className="rounded-lg border border-border px-5 py-10 text-center text-sm text-muted-foreground">
            No field reports yet. Be the first to share what you see.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border border border-border">
            {incidents.map((incident) => (
              <article key={incident.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{incident.type}</h3>
                  <span className="text-xs text-muted-foreground">
                    {incident.location}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {incident.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {incident.reporterName} ·{" "}
                  {formatDistanceToNow(new Date(incident.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}