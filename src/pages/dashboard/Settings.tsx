import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  ChevronRight,
  Database,
  LogOut,
  ShieldCheck,
  Volume2,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import type { ViewId } from "./data";

interface SettingsProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  onNavigate: (view: ViewId) => void;
}

function initialsOf(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "R").toUpperCase();
}

export function Settings({ userName, userEmail, userImage, onNavigate }: SettingsProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({
    push: true,
    sound: true,
    offline: false,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const rows = [
    {
      key: "push" as const,
      icon: Bell,
      title: "Push notifications",
      note: "Risk escalations and advisories",
    },
    {
      key: "sound" as const,
      icon: Volume2,
      title: "Sound alerts",
      note: "Audible tone on critical alerts",
    },
    {
      key: "offline" as const,
      icon: WifiOff,
      title: "Offline map cache",
      note: "Keep the district map available without a signal",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="eyebrow">Account &amp; preferences</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Settings</h1>
      </div>

      {/* Profile */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-5 py-4">
        <Avatar className="size-12">
          {userImage && <AvatarImage src={userImage} alt={userName ?? ""} />}
          <AvatarFallback className="rounded-full bg-foreground text-background text-sm font-semibold">
            {initialsOf(userName, userEmail)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {userName || "Resident"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {userEmail || "Guest account"}
          </p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>

      {/* Preferences */}
      <section>
        <p className="eyebrow mb-3">Preferences</p>
        <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-card">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-4 px-5 py-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground">
                <row.icon className="size-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{row.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.note}
                </p>
              </div>
              <Switch
                checked={prefs[row.key]}
                onCheckedChange={(checked) =>
                  setPrefs((prev) => ({ ...prev, [row.key]: checked }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* Workspace */}
      <section>
        <p className="eyebrow mb-3">Platform</p>
        <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-card">
          <button
            type="button"
            onClick={() => onNavigate("admin")}
            className="flex items-center gap-4 bg-card px-5 py-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground">
              <ShieldCheck className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">About &amp; administration</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Platform information, zone management, and verification
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("coverage")}
            className="flex items-center gap-4 bg-card px-5 py-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground">
              <Database className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Data &amp; model coverage</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Where predictions are available, and what is planned
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </div>
      </section>

      {/* Account actions */}
      <section className="flex flex-col divide-y divide-border rounded-md border border-border bg-card">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-4 bg-card px-5 py-4 text-left transition-colors hover:bg-accent"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border text-destructive">
            <LogOut className="size-4" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Sign out</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              End this session
            </p>
          </div>
        </button>
      </section>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Dharanetra</span>
        <span>v1.0.0</span>
      </div>
    </div>
  );
}