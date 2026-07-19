"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FieldLabel } from "@/components/FormControls";
import { filterItemSuggestions, quickPickItems } from "@/lib/moveItems";

export function ItemSuggestionsField({
  items,
  loadType,
  onAdd,
  onRemove,
  onUpdateQty,
}: {
  items: Array<{ name: string; qty: number }>;
  loadType?: string;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onUpdateQty?: (name: string, qty: number) => void;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const existing = items.map((i) => i.name);
  const suggestions = useMemo(() => filterItemSuggestions(value, existing), [value, existing]);
  const quickPicks = useMemo(
    () => quickPickItems(loadType).filter((name) => !existing.some((e) => e.toLowerCase() === name.toLowerCase())),
    [loadType, existing],
  );

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const commit = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
    setOpen(false);
  };

  const showDropdown = open && value.trim().length > 0 && suggestions.length > 0;

  return (
    <div>
      <FieldLabel>Items</FieldLabel>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <div style={{ border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 12, overflow: "hidden" }}>
          {items.map((item, i) => (
            <div key={item.name}>
              {i > 0 && <div style={{ height: 1, background: "rgba(0,0,0,.07)" }} />}
              <div className="item-suggestion-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", font: "600 14px 'Hanken Grotesk'", gap: 10 }}>
                <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{item.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
                  {onUpdateQty ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.name, Math.max(1, item.qty - 1))}
                        disabled={item.qty <= 1}
                        style={qtyBtn}
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        −
                      </button>
                      <span style={{ minWidth: 28, textAlign: "center", font: "800 14px 'Archivo'" }}>×{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.name, item.qty + 1)}
                        style={qtyBtn}
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: "#6B6B70" }}>×{item.qty}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(item.name)}
                    style={{ border: "none", background: "none", color: "#a8442a", cursor: "pointer", font: "600 12px 'Hanken Grotesk'", padding: 0 }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div style={{ height: 1, background: "rgba(0,0,0,.07)" }} />
          <div style={{ display: "flex", gap: 8, padding: "10px 16px", background: "#faf9f4" }}>
            <input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setActiveIdx(0);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (showDropdown && suggestions[activeIdx]) commit(suggestions[activeIdx]);
                  else commit(value);
                  return;
                }
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Type item name — e.g. sofa, boxes, fridge"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              name="mto-move-item"
              aria-label="Add move item"
              aria-autocomplete="list"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", font: "600 14px 'Hanken Grotesk'" }}
            />
            <button
              type="button"
              onClick={() => commit(value)}
              style={{ border: "none", background: "none", font: "700 14px 'Hanken Grotesk'", color: "#0E0E10", cursor: "pointer", padding: 0 }}
            >
              + Add
            </button>
          </div>
        </div>

        {showDropdown && (
          <div
            role="listbox"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 6px)",
              background: "#fff",
              border: "1.5px solid rgba(0,0,0,.1)",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(0,0,0,.12)",
              zIndex: 20,
              overflow: "hidden",
            }}
          >
            {suggestions.map((name, i) => (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={i === activeIdx}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => commit(name)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderBottom: i < suggestions.length - 1 ? "1px solid rgba(0,0,0,.06)" : "none",
                  background: i === activeIdx ? "rgba(255,222,46,.25)" : "#fff",
                  padding: "11px 14px",
                  font: "600 14px 'Hanken Grotesk'",
                  cursor: "pointer",
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {quickPicks.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".06em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 8 }}>
            Quick add
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {quickPicks.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => commit(name)}
                style={{
                  height: 34,
                  padding: "0 12px",
                  borderRadius: 999,
                  border: "1.5px solid rgba(0,0,0,.12)",
                  background: "#fff",
                  font: "600 13px 'Hanken Grotesk'",
                  cursor: "pointer",
                }}
              >
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}
      <style>{`
        @media(max-width:420px){
          .item-suggestion-row{align-items:flex-start!important;flex-direction:column}
          .item-suggestion-row>div{width:100%;justify-content:space-between}
        }
      `}</style>
    </div>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1.5px solid rgba(0,0,0,.12)",
  background: "#fff",
  font: "900 16px 'Archivo'",
  color: "#0E0E10",
  cursor: "pointer",
  padding: 0,
};
