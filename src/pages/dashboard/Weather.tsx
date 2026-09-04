import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2 } from "lucide-react";
import { forecast, rainfallTrend } from "./data";

const HOUR_LABELS = [
  "12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p",
];

function RainfallChart() {
  const max = Math.max(...rainfallTrend);
  const peakIndex = rainfallTrend.indexOf(max);
  const width = 640;
  const height = 180;
  const padBottom = 24;
  const barW = 16;
  const gap = (width - barW * rainfallTrend.length) / (rainfallTrend.length - 1);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Rainfall over the last 24 hours"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1="0"
            x2={width}
            y1={height - padBottom - (height - padBottom) * f}
            y2={height - padBottom - (height - padBottom) * f}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        ))}
        {rainfallTrend.map((value, i) => {
          const h = (value / max) * (height - padBottom - 10);
          const x = i * gap;
          const isPeak = i === peakIndex;
          return (
            <rect
              key={i}
              x={x}
              y={height - padBottom - h}
              width={barW}
              height={Math.max(h, 2)}
              rx="1.5"
              fill={isPeak ? "currentColor" : "currentColor"}
              opacity={isPeak ? 1 : 0.22}
            />
          );
        })}
        {/* Hour labels */}
        {HOUR_LABELS.map((label, i) => {
          const x = i * (width / (HOUR_LABELS.length - 1)) - 10;
          return (
            <text
              key={label}
              x={x}
              y={height - 6}
              fontSize="10"
              fill="currentColor"
              opacity="0.45"
            >
              {label}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>Peak {max} mm/hr at hour {peakIndex.toString().padStart(2, "0")}:00</span>
        <span>24-hour total: {rainfallTrend.reduce((a, b) => a + b, 0)} mm</span>
      </div>
    </div>
  );
}

function SoilMoisture() {
  const layers = [
    { depth: "0 – 10 cm", value: 88, note: "Surface saturation" },
    { depth: "10 – 30 cm", value: 79, note: "Root zone" },
    { depth: "30 – 60 cm", value: 64, note: "Deep layer" },
    { depth: "60 – 120 cm", value: 48, note: "Bedrock interface" },
  ];
  return (
    <div className="flex flex-col divide-y divide-border border border-border">
      {layers.map((layer) => (
        <div key={layer.depth} className="px-5 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm font-medium">{layer.depth}</p>
            <p className="text-xs text-muted-foreground">{layer.note}</p>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Progress
              value={layer.value}
              className="h-1.5 bg-foreground/15"
            />
            <span className="w-10 text-right text-sm font-semibold tabular-nums">
              {layer.value}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ForecastList() {
  return (
    <div className="flex flex-col divide-y divide-border border border-border">
      {forecast.map((day) => (
        <div
          key={day.day}
          className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[80px_1fr_auto_auto]"
        >
          <p className="text-sm font-medium">{day.day}</p>
          <div className="hidden items-center gap-3 sm:flex">
            <day.icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">
              {day.lo}° / {day.hi}°
            </span>
          </div>
          <div className="flex items-center gap-3 sm:hidden">
            <day.icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold tabular-nums">
              {day.rain}%
            </span>
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              rain
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Weather() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Environmental telemetry</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Weather</h1>
        </div>
        <span className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
          Demo data — no weather API connected
        </span>
        <button
          type="button"
          aria-label="Share"
          className="flex size-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Share2 className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <Tabs defaultValue="rainfall">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="rainfall" className="flex-1 sm:flex-none">
            Rainfall
          </TabsTrigger>
          <TabsTrigger value="soil" className="flex-1 sm:flex-none">
            Soil
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex-1 sm:flex-none">
            Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rainfall" className="mt-4">
          <div className="rounded-lg border border-border bg-background px-5 py-6">
            <p className="eyebrow mb-6">Rainfall trend · last 24 hours</p>
            <RainfallChart />
          </div>
          <div className="mt-6">
            <p className="eyebrow mb-3">Next 7 days</p>
            <ForecastList />
          </div>
        </TabsContent>

        <TabsContent value="soil" className="mt-4">
          <p className="eyebrow mb-3">Soil saturation by depth</p>
          <SoilMoisture />
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Saturation above 90% in the root zone is treated as a high-risk
            trigger for slope movement. Values shown are illustrative until a
            soil-monitoring feed is connected.
          </p>
        </TabsContent>

        <TabsContent value="forecast" className="mt-4">
          <ForecastList />
        </TabsContent>
      </Tabs>
    </div>
  );
}