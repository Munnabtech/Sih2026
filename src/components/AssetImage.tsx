import { asset, hasImage } from "@/config/assets";
import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AssetImageProps {
  /** Asset slot id from src/config/assets.ts, e.g. "backgrounds.hero". */
  id: string;
  className?: string;
  /** Extra classes for the fallback panel. */
  fallbackClassName?: string;
  /** Short caption shown inside the fallback state. */
  fallbackLabel?: string;
  /** Rendered above the image when loaded (e.g. gradients, chips). */
  children?: React.ReactNode;
  /** Use cover (background-style) vs natural sizing. Default cover. */
  fit?: "cover" | "contain";
}

/**
 * The single image component for the app.
 *
 * - Renders the configured image when the slot has a valid HTTPS/bundled URL.
 * - Shows a neutral, professional fallback (never a broken-image icon) when
 *   the slot is empty, the URL is not HTTPS, loading fails, or the src 404s.
 * - Preserves aspect ratio via object-cover/object-contain and is responsive.
 */
export function AssetImage({
  id,
  className,
  fallbackClassName,
  fallbackLabel,
  children,
  fit = "cover",
}: AssetImageProps) {
  const slot = asset(id);
  const usable = hasImage(id);
  const [state, setState] = useState<"loading" | "loaded" | "error">(
    usable ? "loading" : "error",
  );

  // Reset when the configured URL changes (e.g. after you paste a URL).
  useEffect(() => {
    setState(usable ? "loading" : "error");
  }, [slot.url, usable]);

  return (
    <div className={cn("relative overflow-hidden bg-muted/60", className)}>
      {usable && state !== "error" && (
        <img
          src={slot.url}
          alt={slot.alt}
          aria-label={slot.alt}
          loading="lazy"
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          className={cn(
            "h-full w-full transition-opacity duration-500",
            fit === "cover" ? "object-cover" : "object-contain",
            state === "loaded" ? "opacity-100" : "opacity-0",
          )}
        />
      )}

      {/* Loading shimmer */}
      {usable && state === "loading" && (
        <div className="absolute inset-0 skeleton" aria-hidden="true" />
      )}

      {/* Professional fallback — neutral panel, subtle icon, caption */}
      {(!usable || state === "error") && (
        <div
          role="img"
          aria-label={slot.alt}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1.5 border border-dashed border-border/70 bg-muted/40 px-4 text-center",
            fallbackClassName,
          )}
        >
          <ImageOff className="size-4 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-[10px] leading-4 text-muted-foreground/80">
            {fallbackLabel ?? slot.alt}
          </p>
        </div>
      )}

      {children && state === "loaded" && (
        <div className="absolute inset-0">{children}</div>
      )}
    </div>
  );
}