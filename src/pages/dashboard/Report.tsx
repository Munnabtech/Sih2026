import { api } from "@/convex/_generated/api";
import { AssetImage } from "@/components/AssetImage";
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
import { useMutation } from "convex/react";
import { Check, ChevronLeft, ChevronRight, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DISTRICT,
  NER_STATES,
  SEVERITIES,
  STATE_DISTRICTS,
  incidentTypes,
} from "./data";

interface ReportProps {
  initialLocation?: string;
}

const STEPS = [
  { n: "01", title: "Report details" },
  { n: "02", title: "Incident location" },
  { n: "03", title: "Incident information" },
  { n: "04", title: "Impact assessment" },
  { n: "05", title: "Review & submit" },
] as const;

type Severity = "low" | "moderate" | "high" | "critical";

export function Report({ initialLocation }: ReportProps) {
  const reportIncident = useMutation(api.incidents.reportIncident);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  // Step 1 — reporter details
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  // Step 2 — location
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [location, setLocation] = useState(initialLocation ?? DISTRICT);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Step 3 — incident info
  const [type, setType] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() =>
    new Date().toTimeString().slice(0, 5),
  );
  const [description, setDescription] = useState("");

  // Step 4 — impact
  const [severity, setSeverity] = useState<Severity | "">("");
  const [roadBlocked, setRoadBlocked] = useState("unknown");
  const [infrastructure, setInfrastructure] = useState("");
  const [casualties, setCasualties] = useState("");
  const [peopleAffected, setPeopleAffected] = useState("");
  const [assistance, setAssistance] = useState(false);

  // Step 5 — evidence is acknowledged but honestly not stored
  const [evidenceNote, setEvidenceNote] = useState(false);

  const knownDistricts = state ? (STATE_DISTRICTS[state] ?? []) : [];

  const canContinue = (() => {
    switch (step) {
      case 0:
        return anonymous || contact.trim().length >= 5;
      case 1:
        return state !== "" && district.trim() !== "";
      case 2:
        return type !== "" && description.trim().length >= 10;
      case 3:
        return severity !== "";
      default:
        return true;
    }
  })();

  const submit = async () => {
    setSubmitting(true);
    try {
      const id = await reportIncident({
        type: type.trim(),
        description: description.trim(),
        location: `${district}, ${state}`.trim(),
        state,
        district,
        severity: (severity || undefined) as Severity | undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      });
      setSubmitted(id);
      toast.success("Report submitted", {
        description: "Filed as REPORTED — awaiting verification by the monitoring desk.",
      });
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast.error("Could not submit report", {
        description: "Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------ Success state ------------------------------ */
  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-md border border-emerald-600/30 bg-emerald-600/5 px-5 py-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Check className="size-4" />
            Report submitted
          </p>
          <div className="mt-3 flex flex-col gap-1.5 text-sm">
            <span className="flex justify-between gap-4">
              <span className="text-muted-foreground">Incident ID</span>
              <span className="font-mono font-medium">
                INC-{submitted.slice(-6).toUpperCase()}
              </span>
            </span>
            <span className="flex justify-between gap-4">
              <span className="text-muted-foreground">Current status</span>
              <span className="font-medium">REPORTED</span>
            </span>
          </div>
          <p className="mt-3 border-t border-emerald-600/20 pt-3 text-xs leading-5 text-muted-foreground">
            The report has not yet been verified. A field officer from the
            monitoring desk will review it and update the status. Thank you for
            contributing to district situational awareness.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setSubmitted(null)}>
            File another report
          </Button>
        </div>

        {/* Educational awareness imagery on the confirmation screen */}
        <AssetImage
          id="backgrounds.awareness"
          className="h-36 rounded-md border border-border"
          fallbackLabel="Landslide awareness imagery"
        />
      </div>
    );
  }

  /* ------------------------------ Step form ------------------------------ */
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Official incident reporting</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          Report an incident
        </h1>
      </div>

      {/* Progress */}
      <div className="rounded-md border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.n}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex min-w-0 items-center gap-2 text-left ${i <= step ? "" : "opacity-40"}`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-sm text-[10px] font-semibold ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "border border-primary text-primary"
                      : "border border-border text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="size-3" strokeWidth={3} /> : s.n}
              </span>
              <span
                className={`hidden text-[11px] font-medium sm:block ${
                  i === step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card px-5 py-5">
        {/* STEP 1 */}
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold">01 — Report details</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Reports can be filed anonymously, but a contact number lets the
                monitoring desk reach you for verification.
              </p>
            </div>
            <label className="flex items-center gap-3 rounded-md border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => {
                  setAnonymous(e.target.checked);
                  if (e.target.checked) setContact("");
                }}
                className="size-4 accent-[oklch(0.26_0.055_264)]"
              />
              <span className="text-sm">
                File anonymously
                <span className="block text-xs text-muted-foreground">
                  Your name will not appear on the public incident record.
                </span>
              </span>
            </label>
            {!anonymous && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="r-name" className="text-xs font-medium">
                    Name
                  </label>
                  <Input
                    id="r-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name (optional)"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="r-contact" className="text-xs font-medium">
                    Contact number <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="r-contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="10-digit mobile number"
                    inputMode="tel"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold">02 — Incident location</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Coordinates are optional but make field verification much
                faster. Use a phone GPS app if unsure.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">
                  State <span className="text-destructive">*</span>
                </label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NER_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">
                  District <span className="text-destructive">*</span>
                </label>
                <Input
                  list="report-districts"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={state ? "e.g. Kamrup" : "Select state first"}
                  disabled={!state}
                />
                <datalist id="report-districts">
                  {knownDistricts.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="r-loc" className="text-xs font-medium">
                Location description
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="r-loc"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-9"
                  placeholder="Road name, landmark, distance from village…"
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="r-lat" className="text-xs font-medium">
                  Latitude <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="r-lat"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="26.1445"
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="r-lng" className="text-xs font-medium">
                  Longitude <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="r-lng"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="91.7362"
                  className="font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold">03 — Incident information</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Describe what you observed. Include road names, landmarks, and
                approximate distances.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">
                  Incident type <span className="text-destructive">*</span>
                </label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="r-date" className="text-xs font-medium">
                  Date <span className="text-destructive">*</span>
                </label>
                <Input
                  id="r-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="r-time" className="text-xs font-medium">
                  Time <span className="text-destructive">*</span>
                </label>
                <Input
                  id="r-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="r-desc" className="text-xs font-medium">
                Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="r-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="What did you see? Cracks, movement, water seepage, blocked road…"
              />
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold">04 — Impact assessment</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Estimate where possible — this helps the desk prioritise
                verification.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">
                Estimated severity <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`rounded-sm border px-3 py-2.5 text-sm font-medium transition-colors ${
                      severity === s.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Road blocked?</label>
              <div className="grid grid-cols-3 gap-2">
                {["yes", "no", "unknown"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRoadBlocked(v)}
                    className={`rounded-sm border px-3 py-2 text-sm capitalize transition-colors ${
                      roadBlocked === v
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="r-infra" className="text-xs font-medium">
                  Houses / infrastructure affected
                </label>
                <Input
                  id="r-infra"
                  value={infrastructure}
                  onChange={(e) => setInfrastructure(e.target.value)}
                  placeholder="Describe or leave blank"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="r-cas" className="text-xs font-medium">
                  Casualties reported
                </label>
                <Input
                  id="r-cas"
                  value={casualties}
                  onChange={(e) => setCasualties(e.target.value)}
                  placeholder="Leave blank if none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="r-ppl" className="text-xs font-medium">
                  People potentially affected
                </label>
                <Input
                  id="r-ppl"
                  value={peopleAffected}
                  onChange={(e) => setPeopleAffected(e.target.value)}
                  placeholder="Estimate or leave blank"
                />
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-md border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={assistance}
                onChange={(e) => setAssistance(e.target.checked)}
                className="size-4 accent-[oklch(0.26_0.055_264)]"
              />
              <span className="text-sm">
                Immediate assistance required
                <span className="block text-xs text-muted-foreground">
                  In immediate danger, contact local emergency authorities
                  directly — do not wait for the desk.
                </span>
              </span>
            </label>
          </div>
        )}

        {/* STEP 5 */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold">05 — Review & submit</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Verify the details below before submitting. Reports enter the
                system as REPORTED and are verified by the monitoring desk.
              </p>
            </div>
            <div className="flex flex-col divide-y divide-border rounded-md border border-border">
              {[
                { k: "Reporter", v: anonymous ? "Anonymous" : name || "Named (contact provided)" },
                { k: "Location", v: `${district}, ${state} — ${location}` },
                {
                  k: "Coordinates",
                  v:
                    latitude && longitude
                      ? `${latitude}, ${longitude}`
                      : "Not provided",
                },
                { k: "Type", v: type },
                { k: "Date & time", v: `${date} ${time}` },
                { k: "Severity", v: severity ? SEVERITIES.find((s) => s.value === severity)?.label! : "—" },
                { k: "Road blocked", v: roadBlocked },
                { k: "Description", v: description },
              ].map((row) => (
                <div key={row.k} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {row.k}
                  </span>
                  <span className="text-sm">{row.v}</span>
                </div>
              ))}
            </div>
            <label className="flex items-start gap-3 rounded-md border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.checked)}
                className="mt-0.5 size-4 accent-[oklch(0.26_0.055_264)]"
              />
              <span className="text-sm leading-5">
                Photo/video upload is not yet connected to secure storage. I
                understand evidence can be shared with the monitoring desk
                through official channels.
                <span className="block text-xs text-muted-foreground">
                  Required — this keeps the platform honest about what is
                  stored.
                </span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:block">
            Step {step + 1} of {STEPS.length}
          </span>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue}
              className="gap-1.5"
            >
              Continue
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={submit}
              disabled={submitting || !evidenceNote}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Submit report
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}