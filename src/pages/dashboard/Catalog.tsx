import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { ChevronRight, Search, Signal, SignalHigh } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NER_STATES, riskLevel } from "./data";
import { hasModelCoverage } from "./map";

interface CatalogProps {
  onSelect: (zone: Doc<"zones">) => void;
  stateFilter?: string;
  onStateFilterChange?: (state: string) => void;
}

export function Catalog({
  onSelect,
  stateFilter = "all",
  onStateFilterChange,
}: CatalogProps) {
  const zones = useQuery(api.zones.listZones);
  const ensureDefaultZones = useMutation(api.zones.ensureDefaultZones);
  const [query, setQuery] = useState("");

  // Seed the catalog once so a fresh deployment starts populated, and
  // backfill geo fields on zones created before coordinates existed.
  useEffect(() => {
    if (
      zones !== undefined &&
      (zones.length === 0 ||
        zones.some(
          (z) =>
            z.latitude === undefined ||
            z.longitude === undefined ||
            z.state === undefined,
        ))
    ) {
      void ensureDefaultZones();
    }
  }, [zones, ensureDefaultZones]);

  const visible = useMemo(() => {
    if (!zones) return undefined;
    const q = query.trim().toLowerCase();
    return zones.filter((zone) => {
      if (stateFilter !== "all" && zone.state !== stateFilter) return false;
      if (!q) return true;
      return [zone.name, zone.code, zone.district, zone.type, zone.state ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [zones, query, stateFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Model-backed assessments</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Predictions
          </h1>
        </div>
        {zones && (
          <p className="text-xs tabular-nums text-muted-foreground">
            {visible?.length ?? 0} of {zones.length} zones ·{" "}
            {zones.filter((z) => hasModelCoverage(z.state, z.district)).length}{" "}
            with model coverage
          </p>
        )}
      </div>

      {/* Search + state filter */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, code, district, state, or type"
            className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
          />
        </div>
        <Select value={stateFilter} onValueChange={(v) => onStateFilterChange?.(v)}>
          <SelectTrigger className="h-10 w-full text-xs sm:w-52">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All states (NER)
            </SelectItem>
            {NER_STATES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Zone list */}
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
        {visible === undefined && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            Loading zones…
          </div>
        )}
        {visible !== undefined && visible.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No zones match the current search
            {query ? ` for \u201C${query}\u201D` : ""}
            {stateFilter !== "all" ? ` in ${stateFilter}` : ""}.
          </div>
        )}
        {visible?.map((zone) => {
          const covered = hasModelCoverage(zone.state, zone.district);
          const level = riskLevel(zone.risk);
          return (
            <button
              key={zone._id}
              type="button"
              onClick={() => onSelect(zone)}
              className="group flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {zone.code}
                  </span>
                  <h3 className="truncate text-sm font-semibold">{zone.name}</h3>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {zone.type} · {zone.district}, {zone.state ?? "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {covered ? (
                  <span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
                    <span className={`size-2 rounded-full ${level.dot}`} />
                    {zone.risk}
                    <span className="text-xs font-normal text-muted-foreground">/100</span>
                  </span>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 rounded-sm text-[10px] font-medium text-muted-foreground"
                  >
                    <Signal className="size-3" />
                    No model coverage
                  </Badge>
                )}
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Risk values appear only for districts where the trained model provides
        predictions (currently Kamrup, Assam). Other zones are registered for
        monitoring and incident reporting.
      </p>
    </div>
  );
}