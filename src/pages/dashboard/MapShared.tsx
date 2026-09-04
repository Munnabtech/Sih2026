import { useEffect } from "react";
import { TileLayer, useMap } from "react-leaflet";
import { BASEMAPS, type BasemapId } from "./map";

/** Basemap tile layer — switching keeps markers/overlays mounted above it. */
export function BasemapTileLayer({
  basemap,
  onError,
}: {
  basemap: BasemapId;
  onError?: () => void;
}) {
  const def = BASEMAPS[basemap];
  return (
    <TileLayer
      key={basemap}
      url={def.url}
      attribution={def.attribution}
      maxZoom={def.maxZoom}
      eventHandlers={{ tileerror: onError ?? (() => {}) }}
    />
  );
}

/** Applies the basemap's backdrop + class so tile gaps never flash white. */
export function MapChrome({ basemap }: { basemap: BasemapId }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const def = BASEMAPS[basemap];
    container.style.background = def.tileBg;
    container.classList.toggle("dnt-satellite", basemap === "satellite");
  }, [map, basemap]);
  return null;
}

/** Re-fits the view to given bounds when signalled (parent passes a counter). */
export function FitBounds({
  bounds,
  signal,
}: {
  bounds: [[number, number], [number, number]];
  signal: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (signal > 0) map.fitBounds(bounds, { padding: [24, 24] });
  }, [signal, map, bounds]);
  return null;
}

/** Smoothly pans/zooms the map to a point when signalled. */
export function FlyToPoint({
  lat,
  lng,
  zoom,
  signal,
}: {
  lat: number;
  lng: number;
  zoom: number;
  signal: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (signal > 0) map.flyTo([lat, lng], zoom, { duration: 0.6 });
  }, [signal, lat, lng, zoom, map]);
  return null;
}

/* ---------------------------------------------------------------- */
/* Legend — coverage explained with shape + text, not colour alone   */
/* ---------------------------------------------------------------- */
export function MapLegend() {
  const rows = [
    { cls: "", label: "ML prediction available" },
    { cls: "dnt-marker--hollow", label: "Monitoring only — model coverage unavailable" },
  ];
  return (
    <div className="map-panel px-3 py-2.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Legend
      </p>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <span
            key={row.label}
            className="inline-flex items-center gap-2 text-[11px] leading-4 text-muted-foreground"
          >
            <span
              className={`dnt-marker dnt-marker--legend ${row.cls}`}
              style={{ "--dnt-marker-color": "#8a8f98" } as React.CSSProperties}
              aria-hidden="true"
            >
              <span className="dnt-marker__pin" />
              <span className="dnt-marker__dot" />
            </span>
            {row.label}
          </span>
        ))}
      </div>
    </div>
  );
}