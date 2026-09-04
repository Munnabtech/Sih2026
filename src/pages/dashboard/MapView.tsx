import { Button } from "@/components/ui/button";
import {
  Crosshair,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Search,
} from "lucide-react";

const ZONES = [
  {
    name: "Low",
    d: "M 20 340 C 90 280, 150 300, 210 270 C 260 244, 300 270, 340 250 C 380 230, 420 260, 470 240 L 620 300 L 620 380 L 20 380 Z",
    fill: "#7e9c7e",
    label: [180, 330] as const,
  },
  {
    name: "Moderate",
    d: "M 210 270 C 260 244, 300 270, 340 250 C 380 230, 420 260, 470 240 C 490 160, 430 130, 380 110 C 300 80, 250 140, 210 270 Z",
    fill: "#d2a94e",
    label: [330, 200] as const,
  },
  {
    name: "High",
    d: "M 380 110 C 430 130, 490 160, 470 240 C 520 220, 570 170, 600 130 C 590 80, 520 60, 380 110 Z",
    fill: "#d97a3c",
    label: [515, 150] as const,
  },
  {
    name: "Critical",
    d: "M 545 190 C 560 170, 590 180, 600 205 C 605 225, 585 240, 565 235 C 545 230, 535 205, 545 190 Z",
    fill: "#c94f42",
    label: [572, 222] as const,
  },
];

const CONTOURS = [
  "M -10 250 C 120 200, 240 300, 380 240 S 580 140, 660 200",
  "M -10 290 C 130 240, 250 340, 390 280 S 590 180, 660 240",
  "M -10 330 C 140 280, 260 380, 400 320 S 600 220, 660 280",
  "M 150 120 C 260 80, 360 140, 460 90 S 620 60, 660 100",
];

const PINS = [
  { x: 385, y: 130, label: "4A-11" },
  { x: 255, y: 265, label: "2B-03" },
  { x: 565, y: 205, label: "3C-07" },
  { x: 440, y: 320, label: "NH-27" },
  { x: 120, y: 290, label: "Chamaria" },
];

const LEGEND = [
  { color: "#7e9c7e", label: "Low" },
  { color: "#d2a94e", label: "Moderate" },
  { color: "#d97a3c", label: "High" },
  { color: "#c94f42", label: "Critical" },
];

export function MapView() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Zones</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Risk map</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-background">
        {/* Search */}
        <div className="relative border-b border-border">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search district, zone, or landmark"
            className="h-12 w-full bg-transparent pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Map */}
        <div className="relative">
          <svg viewBox="0 0 640 400" className="block w-full">
            {/* Base */}
            <rect width="640" height="400" fill="#fafafa" />
            {CONTOURS.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#dcdcdc"
                strokeWidth="1"
              />
            ))}
            {/* Zones */}
            {ZONES.map((zone) => (
              <g key={zone.name}>
                <path d={zone.d} fill={zone.fill} opacity="0.28" />
                <path d={zone.d} fill="none" stroke={zone.fill} strokeWidth="1" strokeOpacity="0.6" />
                <text
                  x={zone.label[0]}
                  y={zone.label[1]}
                  fontSize="11"
                  fill="#3a3a3a"
                  opacity="0.7"
                  textAnchor="middle"
                  letterSpacing="2"
                >
                  {zone.name.toUpperCase()}
                </text>
              </g>
            ))}
            {/* Rivers */}
            <path
              d="M 0 360 C 160 340, 300 400, 480 350 S 620 320, 640 330"
              fill="none"
              stroke="#b9c4cc"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          {/* Pins */}
          {PINS.map((pin) => (
            <div
              key={pin.label}
              className="absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${(pin.x / 640) * 100}%`, top: `${(pin.y / 400) * 100}%` }}
            >
              <div className="flex flex-col items-center">
                <MapPin className="size-5 fill-foreground text-background" />
                <span className="mt-0.5 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                  {pin.label}
                </span>
              </div>
            </div>
          ))}

          {/* Zoom controls */}
          <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-md border border-border bg-background shadow-sm">
            <button
              type="button"
              aria-label="Zoom in"
              className="flex size-8 items-center justify-center border-b border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              className="flex size-8 items-center justify-center border-b border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Recenter"
              className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Crosshair className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGEND.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
          <Button type="button" className="gap-2">
            <LocateFixed className="size-4" />
            Summary
          </Button>
        </div>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Risk zones are computed from slope angle, soil saturation, and live
        rainfall. Pin positions are indicative — wire a map provider for
        street-accurate tiles.
      </p>
    </div>
  );
}