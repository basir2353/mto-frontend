"use client";

import { formatMoveRoute } from "@/components/move/MovesSwitcher";

export type StatusBoxItem = {
  id: string;
  kind: "draft" | "active";
  title: string;
  subtitle: string;
  badge: string;
  selected?: boolean;
  onClick: () => void;
};

/** Compact Active/Draft chips — rendered inside every wizard map pane via BookingMapOverlayProvider. */
export function MoveStatusBoxes({ items }: { items: StatusBoxItem[] }) {
  if (!items.length) return null;

  return (
    <div
      className="move-status-boxes"
      style={{
        position: "absolute",
        zIndex: 25,
        top: 16,
        left: 20,
        right: 16,
        display: "flex",
        flexWrap: "nowrap",
        gap: 8,
        overflowX: "auto",
        overflowY: "hidden",
        pointerEvents: "none",
        paddingLeft: 4,
        paddingRight: 8,
        paddingBottom: 4,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {items.map((item) => {
        const selected = !!item.selected;
        const activeTone = item.kind === "active";
        return (
          <button
            key={`${item.kind}-${item.id}`}
            type="button"
            onClick={item.onClick}
            style={{
              width: 200,
              minWidth: 200,
              maxWidth: 200,
              height: 40,
              flex: "0 0 auto",
              pointerEvents: "auto",
              textAlign: "left",
              padding: "0 10px",
              borderRadius: 10,
              border: selected ? "1.5px solid #0E0E10" : "1px solid rgba(0,0,0,.12)",
              background: selected ? "#0E0E10" : "#fff",
              color: selected ? "#fff" : "#0E0E10",
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(0,0,0,.16)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <span
                style={{
                  font: "800 9px var(--font-hanken, 'Hanken Grotesk')",
                  letterSpacing: ".05em",
                  textTransform: "uppercase",
                  flex: "none",
                  color: selected
                    ? activeTone
                      ? "var(--accent)"
                      : "rgba(255,255,255,.75)"
                    : activeTone
                      ? "#1f6b1f"
                      : "#8A8A90",
                }}
              >
                {item.badge}
              </span>
              <span
                style={{
                  font: "600 10px var(--font-hanken, 'Hanken Grotesk')",
                  color: selected ? "rgba(255,255,255,.55)" : "#8A8A90",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {item.subtitle}
              </span>
            </div>
            <div
              style={{
                font: "700 12px var(--font-hanken, 'Hanken Grotesk')",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.15,
              }}
            >
              {item.title}
            </div>
          </button>
        );
      })}
      <style>{`
        .move-status-boxes::-webkit-scrollbar{display:none}
        /* Same row as DISTANCE/DRIVE — start to its right, no wrap below */
        .wizard-map-pane:has(.route-metrics-badge) .move-status-boxes{
          left:168px!important;
          top:16px!important;
        }
        @media(max-width:900px){
          .move-status-boxes{top:12px!important;left:16px!important;right:12px!important}
          .wizard-map-pane:has(.route-metrics-badge) .move-status-boxes{left:168px!important;top:12px!important}
        }
        .wizard-form-hidden .move-status-boxes{
          top:16px!important;
          left:72px!important;
          right:16px!important;
        }
        .wizard-form-hidden .route-metrics-badge{
          left:72px!important;
        }
        .wizard-form-hidden .wizard-map-pane:has(.route-metrics-badge) .move-status-boxes{
          left:220px!important;
        }
        @media(min-width:901px){
          .wizard-shell:not(.wizard-form-hidden) .move-status-boxes{
            left:24px!important;
          }
          .wizard-shell:not(.wizard-form-hidden) .wizard-map-pane:has(.route-metrics-badge) .move-status-boxes{
            left:168px!important;
          }
        }
      `}</style>
    </div>
  );
}

export function draftRouteLabel(pickup: string, destination: string) {
  return formatMoveRoute(pickup || "Pickup", destination || "Destination", 36);
}
