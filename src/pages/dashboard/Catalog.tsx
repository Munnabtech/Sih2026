import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "convex/react";
import { ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { riskLevel } from "./data";

interface CatalogProps {
  onSelect: (zone: Doc<"zones">) => void;
}

export function Catalog({ onSelect }: CatalogProps) {
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
    if (!q) return zones;
    return zones.filter((zone) =>
      [zone.name, zone.code, zone.district, zone.type]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [zones, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Monitored zones</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Risk catalog
          </h1>
        </div>
        {zones && (
          <p className="text-xs tabular-nums text-muted-foreground">
            {zones.length} zones · {zones.filter((z) => z.status === "monitored").length} monitored
          </p>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, code, district, or type"
          className="h-11 w-full rounded-md border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring"
        />
      </div>

      {/* Zone list */}
      <div className="flex flex-col divide-y divide-border border border-border">
        {visible === undefined && (
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">
            Loading zones…
          </div>
        )}
        {visible !== undefined && visible.length === 0 && (
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">
            No zones match “{query}”.
          </div>
        )}
        {visible?.map((zone) => {
          const level = riskLevel(zone.risk);
          return (
            <button
              key={zone._id}
              type="button"
              onClick={() => onSelect(zone)}
              className="group flex items-center gap-4 bg-background px-5 py-4 text-left transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs text-muted-foreground">
                    {zone.code}
                  </span>
                  <h3 className="truncate text-sm font-semibold">{zone.name}</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {zone.type} · {zone.district}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {zone.status === "standby" && (
                  <Badge variant="outline" className="rounded-sm text-[10px] font-medium">
                    Standby
                  </Badge>
                )}
                <span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
                  <span className={`size-2 rounded-full ${level.dot}`} />
                  {zone.risk}
                  <span className="text-xs font-normal text-muted-foreground">
                    / 100
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}