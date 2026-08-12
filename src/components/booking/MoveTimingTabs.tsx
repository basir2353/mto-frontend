"use client";

import { FieldLabel } from "@/components/FormControls";

export type MoveType = "now" | "scheduled";

type MoveTimingTabsProps = {
  moveType: MoveType;
  onChange: (type: MoveType) => void;
};

const TABS = [
  { id: "now" as const, title: "Move now", sub: "Search right away" },
  { id: "scheduled" as const, title: "Schedule", sub: "Pick date & time" },
] as const;

export function MoveTimingTabs({ moveType, onChange }: MoveTimingTabsProps) {
  return (
    <div>
      <FieldLabel>When do you need movers?</FieldLabel>
      <div
        role="tablist"
        aria-label="When do you need movers?"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
          padding: 4,
          borderRadius: 10,
          background: "rgba(0,0,0,.05)",
          border: "1px solid rgba(0,0,0,.08)",
        }}
      >
        {TABS.map((tab) => {
          const active = moveType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "10px 10px",
                textAlign: "left",
                cursor: "pointer",
                background: active ? "#fff" : "transparent",
                boxShadow: active ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                color: "#0E0E10",
                transition: "background .12s ease, box-shadow .12s ease",
              }}
            >
              <div style={{ font: active ? "700 13px 'Hanken Grotesk'" : "600 13px 'Hanken Grotesk'" }}>{tab.title}</div>
              <div
                style={{
                  font: "500 11px 'Hanken Grotesk'",
                  color: active ? "#6B6B70" : "#9a9aa0",
                  marginTop: 2,
                  lineHeight: 1.3,
                }}
              >
                {tab.sub}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
