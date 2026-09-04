import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Info,
  MapPin,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  demoAlerts,
  type AlertItem,
  type AlertSeverity,
  type ViewId,
  incidentStatusLabel,
} from "./data";

const SEVERITY_STYLE: Record<
  AlertSeverity,
  { icon: LucideIcon; dot: string; label: string; border: string }
> = {
  critical: {
    icon: AlertTriangle,
    dot: "bg-red-600",
    label: "Critical",
    border: "border-l-red-600",
  },
  high: {
    icon: AlertTriangle,
    dot: "bg-orange-500",
    label: "High",
    border: "border-l-orange-500",
  },
  advisory: {
    icon: Info,
    dot: "bg-amber-500",
    label: "Advisory",
    border: "border-l-amber-500",
  },
  info: {
    icon: Check,
    dot: "bg-emerald-600",
    label: "Information",
    border: "border-l-emerald-600",
  },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "advisory", label: "Advisories" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

function matchesFilter(item: AlertItem, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "critical") return item.severity === "critical" || item.severity === "high";
  return item.severity === "advisory" || item.severity === "info";
}

interface AlertsProps {
  onNavigate: (view: ViewId) => void;
}

export function Alerts({ onNavigate }: AlertsProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const incidents = useQuery(api.incidents.listIncidents);

  const items = useMemo<AlertItem[]>(() => {
    const fromReports: AlertItem[] = (incidents ?? []).map((incident) => ({
      id: incident.id,
      severity: "info",
      title: `${incident.type} reported`,
      body: `${incident.description} · ${incident.district ?? incident.location}`,
      time: formatDistanceToNow(new Date(incident.createdAt), {
        addSuffix: true,
      }),
      source: "Community",
      verified: incident.verified,
      status: incident.status,
    }));
    return [...fromReports, ...demoAlerts];
  }, [incidents]);

  const visible = items.filter((item) => matchesFilter(item, filter));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Advisories & escalations</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Alerts</h1>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Honest data-source note */}
      <p className="rounded-md border border-border bg-card px-4 py-2.5 text-[11px] leading-5 text-muted-foreground">
        Community entries are user reports from this platform. Entries marked
        "Demonstration" are illustrative advisories — no official government
        alert feed is connected yet.
      </p>

      <div className="flex flex-col gap-2.5">
        {visible.length === 0 && (
          <div className="rounded-md border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            No {filter === "all" ? "" : `${filter} `}alerts right now.
          </div>
        )}
        {visible.map((item) => {
          const style = SEVERITY_STYLE[item.severity];
          const isDemo = item.source === "Model";
          return (
            <article
              key={item.id}
              className={`flex gap-3.5 rounded-md border border-border border-l-2 bg-card px-4 py-3.5 ${style.border}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`size-1.5 rounded-full ${style.dot}`} />
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
                  <span>{item.time}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {isDemo ? "Kamrup district" : "User report"}
                  </span>
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 font-medium">
                    {isDemo ? "Demonstration" : "User-reported"}
                  </span>
                  {item.status && (
                    <span className="rounded-sm bg-primary px-1.5 py-0.5 font-medium text-primary-foreground">
                      {incidentStatusLabel(item.status)}
                    </span>
                  )}
                  {item.verified && (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-600 px-1.5 py-0.5 font-medium text-white">
                      <Check className="size-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Incident feed link */}
      <button
        type="button"
        onClick={() => onNavigate("incidents")}
        className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-accent"
      >
        <span className="flex items-center gap-3">
          <ClipboardList className="size-4 text-muted-foreground" />
          <span>
            <span className="block text-sm font-semibold">Incident feed</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Full list of reports with verification status
            </span>
          </span>
        </span>
        <span aria-hidden="true" className="text-xs text-muted-foreground">→</span>
      </button>

      {/* Emergency information */}
      <section className="rounded-md border border-border bg-primary px-5 py-4 text-primary-foreground">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
          <PhoneCall className="size-3.5" />
          Emergency information
        </p>
        <p className="mt-2 text-sm leading-6">
          If there is immediate danger, contact your local emergency
          authorities directly. Do not wait for an alert or report update.
        </p>
        <p className="mt-2 text-[11px] leading-5 text-primary-foreground/60">
          Official emergency numbers and district control-room contacts will be
          listed here only after verification from authoritative sources.
        </p>
      </section>
    </div>
  );
}