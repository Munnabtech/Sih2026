import { useState } from "react";
import { createPortal } from "react-dom";
import { Check, Layers, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BASEMAPS,
  OVERLAYS,
  type BasemapId,
  type OverlayId,
} from "./map";

/* ---------------------------------------------------------------- */
/* Basemap switcher — compact GIS-style segmented control            */
/* ---------------------------------------------------------------- */
export function BasemapSwitcher({
  value,
  onChange,
}: {
  value: BasemapId;
  onChange: (id: BasemapId) => void;
}) {
  return (
    <div
      className="map-panel flex overflow-hidden"
      role="group"
      aria-label="Map type"
    >
      {(Object.keys(BASEMAPS) as BasemapId[]).map((id) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={cn(
              "px-2.5 py-1.5 text-[11px] font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {BASEMAPS[id].label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Overlay panel — popover of toggleable data layers                 */
/* ---------------------------------------------------------------- */
export function OverlayPanel({
  active,
  onToggle,
  coverageNote,
}: {
  active: OverlayId[];
  onToggle: (id: OverlayId) => void;
  coverageNote?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Map layers"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "map-panel flex size-9 items-center justify-center transition-colors",
          open
            ? "bg-primary text-primary-foreground"
            : "bg-card text-muted-foreground hover:text-foreground",
        )}
      >
        <Layers className="size-4" strokeWidth={1.75} />
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[900]"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="map-panel fixed inset-x-3 bottom-3 z-[1000] p-3 sm:static sm:inset-auto sm:mt-1 sm:w-64 sm:p-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <MapIcon className="size-3" />
                Map overlays
              </p>
              <div className="flex flex-col divide-y divide-border">
                {OVERLAYS.map((overlay) => {
                  const on = active.includes(overlay.id);
                  return (
                    <label
                      key={overlay.id}
                      className="flex cursor-pointer items-start gap-2.5 py-2 first:pt-0 last:pb-0"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-card",
                        )}
                      >
                        {on && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => onToggle(overlay.id)}
                        className="sr-only"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium leading-4">
                          {overlay.label}
                        </span>
                        <span className="block text-[11px] leading-4 text-muted-foreground">
                          {overlay.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {coverageNote && (
                <p className="mt-2 border-t border-border pt-2 text-[11px] leading-4 text-muted-foreground">
                  {coverageNote}
                </p>
              )}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}