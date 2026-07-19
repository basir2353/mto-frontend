"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Banknote,
  Bell,
  Boxes,
  BriefcaseBusiness,
  Camera,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  CircleStop,
  Clock3,
  Flag,
  Handshake,
  House,
  ImagePlus,
  ListChecks,
  MapPinned,
  MessageCircle,
  Mic,
  Minus,
  Navigation,
  Package,
  Phone,
  Play,
  Plus,
  Route,
  SendHorizontal,
  Settings2,
  Shield,
  Star,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

/** Outline-only Lucide set — never pass fill; stroke icons only. */
export const AppIcons = {
  dashboard: House,
  messages: MessageCircle,
  findJobs: MapPinned,
  myJobs: BriefcaseBusiness,
  wallet: Wallet,
  package: Boxes,
  mapPin: MapPinned,
  check: Check,
  checkCircle: CircleCheck,
  clock: Clock3,
  negotiate: Handshake,
  list: ListChecks,
  camera: Camera,
  play: Play,
  map: Route,
  settings: Settings2,
  pay: Banknote,
  phone: Phone,
  mail: MessageCircle,
  search: MapPinned,
  truck: Truck,
  bell: Bell,
  file: Flag,
  image: ImagePlus,
  close: X,
  mic: Mic,
  send: SendHorizontal,
  arrowRight: ArrowRight,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  plus: Plus,
  minus: Minus,
  square: CircleStop,
  car: CarFront,
  navigation: Navigation,
  alert: CircleAlert,
  shield: Shield,
  star: Star,
  box: Package,
  calendar: CalendarDays,
} as const;

export type AppIconName = keyof typeof AppIcons;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: CSSProperties;
};

export function AppIcon({ name, size = 18, strokeWidth = 1.75, color = "currentColor", style }: AppIconProps) {
  const Icon = AppIcons[name];
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      fill="none"
      absoluteStrokeWidth={false}
      style={style}
      aria-hidden
    />
  );
}

export function renderAppIcon(name: AppIconName, size = 18, color = "currentColor"): ReactNode {
  return <AppIcon name={name} size={size} color={color} />;
}

export function EmptyStateIcon({
  name,
  size = 28,
  color = "#0E0E10",
}: {
  name: AppIconName;
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: "rgba(0,0,0,.05)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
      }}
    >
      <AppIcon name={name} size={size} color={color} strokeWidth={1.5} />
    </div>
  );
}

export function driverTabIcon(tab: "overview" | "messages" | "jobs" | "work" | "pay", active: boolean) {
  const color = active ? "#0E0E10" : "rgba(255,255,255,.75)";
  const map = {
    overview: "dashboard",
    messages: "messages",
    jobs: "findJobs",
    work: "myJobs",
    pay: "wallet",
  } as const satisfies Record<string, AppIconName>;
  return <AppIcon name={map[tab]} size={18} color={color} strokeWidth={active ? 2 : 1.75} />;
}

export function notificationTypeIcon(type: string): LucideIcon {
  if (type.includes("payment")) return Banknote;
  if (type.includes("quote")) return Handshake;
  if (type.includes("booking")) return Boxes;
  if (type.includes("dispute")) return Flag;
  if (type.includes("admin")) return Shield;
  if (type.includes("message")) return MessageCircle;
  return Bell;
}

export function activityTypeIcon(type: string): LucideIcon {
  if (type.includes("payment")) return Banknote;
  if (type.includes("quote")) return Handshake;
  if (type.includes("booking")) return Boxes;
  if (type.includes("request")) return ListChecks;
  if (type.includes("review")) return Star;
  return Bell;
}

export function timelineKindIcon(kind: string): LucideIcon {
  if (kind === "tracking") return MapPinned;
  if (kind === "payment") return Banknote;
  if (kind === "message") return MessageCircle;
  return ListChecks;
}

export function timelineEventIcon(title: string, kind: "status" | "tracking"): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes("complete") || t.includes("deliver")) return CircleCheck;
  if (t.includes("cancel")) return X;
  if (t.includes("progress") || t.includes("start") || t.includes("route") || t.includes("pick")) return Truck;
  if (kind === "tracking") return MapPinned;
  return ListChecks;
}

export function TypeIcon({ icon: Icon, size = 18, color = "#0E0E10" }: { icon: LucideIcon; size?: number; color?: string }) {
  return <Icon size={size} strokeWidth={1.75} color={color} fill="none" aria-hidden />;
}

export function vehicleLucideIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  if (lower.includes("26") || lower.includes("large") || lower.includes("truck")) return Truck;
  if (lower.includes("16") || lower.includes("box")) return Boxes;
  if (lower.includes("pickup")) return Truck;
  if (lower.includes("suv")) return CarFront;
  if (lower.includes("van")) return Package;
  return Truck;
}

export function CheckBadge({
  size = 22,
  iconSize = 12,
  round = true,
  color = "#0E0E10",
}: {
  size?: number;
  iconSize?: number;
  round?: boolean;
  color?: string;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: round ? "50%" : 6,
        background: "var(--accent)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
      }}
    >
      <AppIcon name="check" size={iconSize} color={color} strokeWidth={2.5} />
    </span>
  );
}

/** Interactive or read-only 1–5 star rating (Lucide outline / filled). */
export function StarRating({
  value,
  onChange,
  size = 36,
  gap = 10,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
  gap?: number;
}) {
  const interactive = typeof onChange === "function";
  return (
    <div
      style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", gap }}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            aria-checked={interactive ? active : undefined}
            role={interactive ? "radio" : undefined}
            style={{
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: interactive ? "pointer" : "default",
              lineHeight: 0,
              color: active ? "var(--accent)" : "rgba(0,0,0,.18)",
            }}
          >
            <Star
              size={size}
              strokeWidth={1.75}
              color="currentColor"
              fill={active ? "currentColor" : "none"}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}

export function StarInline({ size = 14, color = "var(--accent)" }: { size?: number; color?: string }) {
  return <Star size={size} strokeWidth={1.75} color={color} fill={color} aria-hidden />;
}
