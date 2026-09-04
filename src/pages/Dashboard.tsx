import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DharanetraMark } from "@/components/DharanetraMark";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Bell,
  BookOpen,
  Camera,
  ClipboardList,
  CloudRain,
  Home,
  LogOut,
  Map,
  Settings as SettingsIcon,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Admin } from "./dashboard/Admin";
import { Alerts } from "./dashboard/Alerts";
import { Catalog } from "./dashboard/Catalog";
import { DISTRICT, type IncidentItem, type ViewId } from "./dashboard/data";
import { IncidentIntel } from "./dashboard/IncidentIntel";
import { Incidents } from "./dashboard/Incidents";
import { MapView } from "./dashboard/MapView";
import { Overview } from "./dashboard/Overview";
import { Report } from "./dashboard/Report";
import { Settings } from "./dashboard/Settings";
import { Weather } from "./dashboard/Weather";
import { ZoneDetail } from "./dashboard/ZoneDetail";

const NAV_ITEMS: { id: ViewId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "incidents", label: "Incidents", icon: ClipboardList },
  { id: "weather", label: "Weather", icon: CloudRain },
  { id: "catalog", label: "Risk catalog", icon: BookOpen },
  { id: "map", label: "Risk map", icon: Map },
  { id: "report", label: "Report", icon: Camera },
  { id: "admin", label: "Admin", icon: ShieldCheck },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

/* Mobile bottom bar — Map, Weather, and Admin stay reachable via the
   Overview quick actions, the Weather details link, and Settings. */
const MOBILE_NAV: { id: ViewId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Home", icon: Home },
  { id: "catalog", label: "Catalog", icon: BookOpen },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function initialsOf(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "R").toUpperCase();
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewId>("overview");
  const [selectedZone, setSelectedZone] = useState<Doc<"zones"> | null>(null);
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentItem | null>(null);
  const [catalogState, setCatalogState] = useState("all");
  const [reportLocation, setReportLocation] = useState(DISTRICT);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const name = user?.name ?? null;
  const email = user?.email ?? null;
  const image = user?.image ?? null;

  const goTo = (next: ViewId) => {
    if (next === "zone" && !selectedZone) return;
    setView(next);
  };

  const openZone = (zone: Doc<"zones">) => {
    setSelectedZone(zone);
    setView("zone");
  };

  const openIncident = (incident: IncidentItem) => {
    setSelectedIncident(incident);
    setView("incident");
  };

  const openCatalog = (state?: string) => {
    if (state) setCatalogState(state);
    setView("catalog");
  };

  const reportAt = (location: string) => {
    setReportLocation(location);
    setView("report");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ------------------------------------------------ Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-6">
          <DharanetraMark className="size-7" />
          <span className="text-xs font-semibold tracking-[0.28em]">
            DHARANETRA
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-6">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                view === item.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="size-4.5" strokeWidth={1.75} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar className="size-9">
              {image && <AvatarImage src={image} alt={name ?? ""} />}
              <AvatarFallback className="rounded-full bg-muted text-xs font-semibold">
                {initialsOf(name, email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {name || "Resident"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {email || "Guest account"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------ Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => setView("overview")}
          className="flex items-center gap-2.5"
        >
          <DharanetraMark className="size-6" />
          <span className="text-[11px] font-semibold tracking-[0.28em]">
            DHARANETRA
          </span>
        </button>
        <button type="button" onClick={() => setView("settings")}>
          <Avatar className="size-8">
            {image && <AvatarImage src={image} alt={name ?? ""} />}
            <AvatarFallback className="rounded-full bg-muted text-[11px] font-semibold">
              {initialsOf(name, email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </header>

      {/* ------------------------------------------------ Content */}
      <main className="px-4 pb-24 pt-8 sm:px-6 lg:pb-12 lg:pl-[264px] lg:pt-12">
        <div className="mx-auto w-full max-w-5xl">
          {view === "overview" && (
            <Overview
              userName={name}
              onNavigate={setView}
              onOpenCatalog={openCatalog}
            />
          )}
          {view === "alerts" && <Alerts onNavigate={setView} />}
          {view === "incidents" && <Incidents onOpen={openIncident} />}
          {view === "incident" && (
            <IncidentIntel
              incident={selectedIncident}
              onBack={() => setView("incidents")}
            />
          )}
          {view === "weather" && <Weather />}
          {view === "catalog" && (
            <Catalog
              onSelect={openZone}
              stateFilter={catalogState}
              onStateFilterChange={setCatalogState}
            />
          )}
          {view === "zone" && (
            <ZoneDetail
              zone={selectedZone ?? undefined}
              onBack={() => setView("catalog")}
              onReport={reportAt}
            />
          )}
          {view === "map" && <MapView onSelect={openZone} />}
          {view === "report" && (
            <Report initialLocation={reportLocation} />
          )}
          {view === "admin" && <Admin />}
          {view === "settings" && (
            <Settings
              userName={name}
              userEmail={email}
              userImage={image}
              onNavigate={setView}
            />
          )}
        </div>
      </main>

      {/* ------------------------------------------------ Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur-sm lg:hidden">
        {MOBILE_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goTo(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
              view === item.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="size-5" strokeWidth={1.75} />
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setView("report")}
          aria-label="Report incident"
          className="flex flex-col items-center justify-center"
        >
          <span
            className={cn(
              "-mt-6 flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-md transition-transform",
              view === "report" && "scale-105",
            )}
          >
            <Camera className="size-5" strokeWidth={1.75} />
          </span>
          <span className="text-[10px] font-medium text-foreground">Report</span>
        </button>
      </nav>
    </div>
  );
}