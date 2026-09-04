import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Check,
  Info,
  MapPin,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { demoAlerts, type AlertItem, type AlertSeverity } from "./data";

const SEVERITY_STYLE: Record<
  AlertSeverity,
  { icon: LucideIcon; box: string; dot: string }
> = {
  critical: {
    icon: AlertTriangle,
    box: "bg-red-600/10 text-red-600",
    dot: "bg-red-600",
  },
  high: {
    icon: AlertTriangle,
    box: "bg-orange-500/10 text-orange-600",
    dot: "bg-orange-500",
  },
  advisory: {
    icon: Info,
    box: "bg-amber-500/10 text-amber-600",
    dot: "bg-amber-500",
  },
  info: {
    icon: ShieldCheck,
    box: "bg-emerald-600/10 text-emerald-700",
    dot: "bg-emerald-600",
  },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "advisory", label: "Advisory" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

function matchesFilter(item: AlertItem, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "critical") return item.severity === "critical" || item.severity === "high";
  return item.severity === "advisory" || item.severity === "info";
}

export function Alerts() {
  const [filter, setFilter] = useState<Filter>("all");
  const incidents = useQuery(api.incidents.listIncidents);

  const items = useMemo<AlertItem[]>(() => {
    const fromReports: AlertItem[] = (incidents ?? []).map((incident) => ({
      id: incident.id,
      severity: "info",
      title: `${incident.type} reported`,
      body: `${incident.description} · ${incident.location}`,
      time: formatDistanceToNow(new Date(incident.createdAt), {
        addSuffix: true,
      }),
      source: "Community",
      verified: incident.verified,
    }));
    return [...fromReports, ...demoAlerts];
  }, [incidents]);

  const visible = items.filter((item) => matchesFilter(item, filter));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">District feed</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Alerts</h1>
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

      <div className="flex flex-col divide-y divide-border border border-border">
        {visible.length === 0 && (
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">
            No {filter === "all" ? "" : `${filter} `}alerts right now.
          </div>
        )}
        {visible.map((item) => {
          const style = SEVERITY_STYLE[item.severity];
          return (
            <article
              key={item.id}
              className="flex gap-4 bg-background px-5 py-4 transition-colors hover:bg-accent/50"
            >
              <div
                className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md ${style.box}`}
              >
                <style.icon className="size-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <span className={`size-1.5 rounded-full ${style.dot}`} />
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{item.time}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {item.source === "Community" ? "Community report" : "Model"}
                  </span>
                  {item.source === "Community" && (
                    <Badge variant="outline" className="rounded-sm px-1.5 py-0 text-[10px] font-medium">
                      Field report
                    </Badge>
                  )}
                  {item.verified && (
                    <Badge className="gap-1 rounded-sm bg-emerald-600 px-1.5 py-0 text-[10px] font-medium text-white">
                      <Check className="size-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}