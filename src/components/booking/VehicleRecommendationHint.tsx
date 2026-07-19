"use client";

import { useEffect, useState } from "react";
import { vehiclesApi, type VehicleType } from "@/lib/api";

type Item = { name: string; qty: number };

export function VehicleRecommendationHint({
  items,
  distanceKm,
}: {
  items: Item[];
  distanceKm?: number | null;
}) {
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<VehicleType | null>(null);
  const [alternatives, setAlternatives] = useState<VehicleType[]>([]);
  const [totals, setTotals] = useState<{ weightKg: number; volumeM3: number } | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      setGuidance(null);
      setRecommended(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const payload = items.map((i) => ({ name: i.name, quantity: i.qty }));
        const calc = await vehiclesApi.calculateRecommendation(payload, distanceKm ?? undefined);
        if (cancelled) return;
        setRecommended(calc.vehicleType);
        setAlternatives(calc.alternatives ?? []);
        setTotals(calc.totals);
        setEstimatedPrice(calc.estimatedPrice);
        const hint = await vehiclesApi.getRecommendations();
        if (!cancelled) setGuidance(hint.guidance);
      } catch {
        if (!cancelled) {
          setRecommended(null);
          setAlternatives([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [items, distanceKm]);

  if (items.length === 0) return null;

  return (
    <div style={{ border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 12, padding: "16px 18px", background: "#fafaf8" }}>
      <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 10 }}>
        Vehicle sizing guide
      </div>

      {loading && <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#8A8A90" }}>Calculating best fit…</div>}

      {!loading && recommended && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <div>
              <div style={{ font: "800 18px 'Archivo'" }}>{recommended.name}</div>
              {recommended.description && (
                <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>{recommended.description}</div>
              )}
            </div>
            {estimatedPrice != null && (
              <div style={{ textAlign: "right", flex: "none" }}>
                <div style={{ font: "800 20px 'Archivo'" }}>~${Math.round(estimatedPrice)}</div>
                <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#8A8A90" }}>vehicle estimate</div>
              </div>
            )}
          </div>

          {totals && (
            <div style={{ display: "flex", gap: 16, marginTop: 12, font: "600 13px 'Hanken Grotesk'", color: "#6B6B70" }}>
              <span>Load ~{totals.weightKg.toFixed(0)} kg</span>
              <span>~{totals.volumeM3.toFixed(1)} m³</span>
              {recommended.maxWeightKg != null && <span>Max {recommended.maxWeightKg} kg</span>}
            </div>
          )}

          {alternatives.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ font: "700 11px 'Hanken Grotesk'", color: "#8A8A90", marginBottom: 8 }}>ALSO CONSIDER</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {alternatives.map((v) => (
                  <span
                    key={v.id}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(0,0,0,.12)",
                      background: "#fff",
                      font: "600 12px 'Hanken Grotesk'",
                    }}
                  >
                    {v.name} · from ${Number(v.basePrice).toFixed(0)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {guidance && (
            <p style={{ margin: "14px 0 0", font: "500 13px/1.5 'Hanken Grotesk'", color: "#6B6B70" }}>{guidance}</p>
          )}
        </>
      )}

      {!loading && !recommended && (
        <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#8A8A90" }}>
          Add item names so we can suggest the right truck size.
        </div>
      )}
    </div>
  );
}
