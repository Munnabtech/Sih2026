import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DharanetraMark } from "@/components/DharanetraMark";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  Bell,
  BookOpen,
  Camera,
  ClipboardList,
  CloudRain,
  Database,
  Ellipsis,
  Home,
  LogOut,
  Map,
  Settings as SettingsIcon,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Admin } from "./dashboard/Admin";
import { Alerts } from "./dashboard/Alerts";
import { Catalog } from "./dashboard/Catalog";
import { Coverage } from "./dashboard/Coverage";
import { DISTRICT, type IncidentItem, type ViewId } from "./dashboard/data";
import { IncidentIntel } from "./dashboard/IncidentIntel";
import { Incidents } from "./dashboard/Incidents";
import { MapView } from "./dashboard/MapView";
import { Overview } from "./dashboard/Overview";
import { Report } from "./dashboard/Report";
import { Settings } from "./dashboard/Settings";
import { Weather } from "./dashboard/Weather";
import { ZoneDetail } from "./dashboard/ZoneDetail";

type NavItem = { id: ViewId; label: string; icon: LucideIcon };

const PRIMARY_NAV: NavItem[] = [
  { id: "overview", label: "Dashboard", icon: Home },
  { id: "map", label: "Risk Map", icon: Map },
  { id: "catalog", label: "Predictions", icon: BookOpen },
  { id: "incidents", label: "Incidents", icon: ClipboardList },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "coverage", label: "Data & Coverage", icon: Database },
  { id: "admin", label: "About", icon: ShieldCheck },
];

const SECONDARY_NAV: NavItem[] = [
  { id: "weather", label: "Weather", icon: CloudRain },
  { id: "report", label: "Report Incident", icon: Camera },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

/* Mobile "More" sheet contents — everything beyond Home/Map/Report/Alerts */
const MOBILE_MORE: ViewId[] = [
  "catalog",
  "incidents",
  "weather",
  "coverage",
  "admin",
  "settings",
];

function initialsOf(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "R").toUpperCase();
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="tabular-nums">
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
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
  const [moreOpen, setMoreOpen] = useState(false);

  const incidents = useQuery(api.incidents.listIncidents);
  const pendingCount =
    incidents?.filter((i) => (i.status ?? "reported") === "reported").length ??
    0;

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
    if (next === "incident" && !selectedIncident) return;
    setView(next);
    setMoreOpen(false);
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

  const navButton = (item: NavItem) => {
    const active =
      view === item.id ||
      (item.id === "incidents" && view === "incident") ||
      (item.id === "catalog" && view === "zone");
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => goTo(item.id)}
        className={cn(
          "flex items-center gap-2.5 rounded-sm px-3 py-2 text-[13px] font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
        {item.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ------------------------------------------------ Institutional top bar */}
      <div className="topbar sticky top-0 z-50 hidden h-8 items-center justify-between px-6 text-[11px] tracking-wide lg:flex">
        <span>
          Decision Support Platform for Landslide Risk Monitoring — North
          Eastern Region of India
        </span>
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            System Online
          </span>
          <Clock />
        </span>
      </div>

      {/* ------------------------------------------------ Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-sidebar lg:top-8 lg:flex">
        <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-sm bg-sidebar-primary">
            <DharanetraMark className="size-6 text-sidebar-primary-foreground" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[0.2em] text-sidebar-foreground">
              DHARANETRA
            </p>
            <p className="truncate text-[10px] text-sidebar-foreground/50">
              AI-Powered Landslide Risk Monitoring
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
          <div className="flex flex-col gap-0.5">
            <p className="eyebrow mb-1.5 px-3 text-sidebar-foreground/40">
              Monitoring
            </p>
            {PRIMARY_NAV.map(navButton)}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="eyebrow mb-1.5 px-3 text-sidebar-foreground/40">
              Operations
            </p>
            {SECONDARY_NAV.map(navButton)}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-sm px-2 py-2">
            <Avatar className="size-8">
              {image && <AvatarImage src={image} alt={name ?? ""} />}
              <AvatarFallback className="rounded-full bg-sidebar-accent text-[11px] font-semibold text-sidebar-accent-foreground">
                {initialsOf(name, email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-sidebar-foreground">
                {name || "Resident"}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/50">
                {email || "Guest account"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex size-8 shrink-0 items-center justify-center rounded-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------ Mobile header */}
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar lg:hidden">
        <div className="topbar flex h-7 items-center justify-between px-4 text-[10px]">
          <span>Decision Support Platform — NER of India</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-emerald-400" />
            Online
          </span>
        </div>
        <div className="flex h-12 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setView("overview")}
            className="flex items-center gap-2"
          >
            <span className="flex size-7 items-center justify-center rounded-sm bg-sidebar-primary">
              <DharanetraMark className="size-5 text-sidebar-primary-foreground" />
            </span>
            <span className="text-xs font-semibold tracking-[0.2em] text-sidebar-foreground">
              DHARANETRA
            </span>
          </button>
          <button type="button" onClick={() => setView("settings")}>
            <Avatar className="size-7">
              {image && <AvatarImage src={image} alt={name ?? ""} />}
              <AvatarFallback className="rounded-full bg-sidebar-accent text-[10px] font-semibold text-sidebar-accent-foreground">
                {initialsOf(name, email)}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------ Content */}
      <main className="px-4 pb-24 pt-5 sm:px-6 lg:pb-10 lg:pl-[264px] lg:pt-6">
        <div className="mx-auto w-full max-w-6xl">
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
          {view === "map" && (
            <MapView
              onSelect={openZone}
              onReport={reportAt}
              onOpenIncident={openIncident}
            />
          )}
          {view === "report" && <Report initialLocation={reportLocation} />}
          {view === "coverage" && <Coverage />}
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
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => goTo("overview")}
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
            view === "overview" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Home className="size-5" strokeWidth={1.75} />
          Home
        </button>
        <button
          type="button"
          onClick={() => goTo("map")}
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
            view === "map" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Map className="size-5" strokeWidth={1.75} />
          Map
        </button>
        <button
          type="button"
          onClick={() => setView("report")}
          aria-label="Report incident"
          className="flex flex-col items-center justify-center"
        >
          <span
            className={cn(
              "-mt-6 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform",
              view === "report" && "scale-105",
            )}
          >
            <Camera className="size-5" strokeWidth={1.75} />
          </span>
          <span className="text-[10px] font-medium text-primary">Report</span>
        </button>
        <button
          type="button"
          onClick={() => goTo("alerts")}
          className={cn(
            "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
            view === "alerts" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Bell className="size-5" strokeWidth={1.75} />
          Alerts
          {pendingCount > 0 && (
            <span className="absolute right-4 top-1.5 size-1.5 rounded-full bg-destructive" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
            MOBILE_MORE.includes(view) || view === "zone" || view === "incident"
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          <Ellipsis className="size-5" strokeWidth={1.75} />
          More
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-lg border-t border-border bg-card p-4 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">More</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="text-xs text-muted-foreground"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[...PRIMARY_NAV, ...SECONDARY_NAV]
                .filter((item) => MOBILE_MORE.includes(item.id))
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(item.id)}
                    className="flex items-center gap-2.5 rounded-md border border-border px-3 py-3 text-left text-xs font-medium transition-colors hover:bg-accent"
                  >
                    <item.icon
                      className="size-4 text-muted-foreground"
                      strokeWidth={1.75}
                    />
                    {item.label}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
