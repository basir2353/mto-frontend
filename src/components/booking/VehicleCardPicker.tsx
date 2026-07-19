"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TypeIcon, vehicleLucideIcon } from "@/components/ui/Icons";
import { vehiclesApi } from "@/lib/api";
import type { VehicleType } from "@/lib/api/types";
import { estimateLocalPrice, haversineKm, type MapPlace } from "@/lib/maps";

function capacityPeople(v: VehicleType) {
  return v.moverCapacity ? String(v.moverCapacity) : "—";
}

function capacityHint(v: VehicleType) {
  const parts: string[] = [];
  if (v.maxWeightKg) parts.push(`up to ${Math.round(v.maxWeightKg)} kg`);
  if (v.maxVolumeM3) parts.push(`${v.maxVolumeM3} m³`);
  return parts.join(" · ");
}

function vehiclePriceMultiplier(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("26") || lower.includes("large")) return 1.45;
  if (lower.includes("16") || lower.includes("box")) return 1.2;
  if (lower.includes("cargo") || lower.includes("van")) return 1;
  if (lower.includes("pickup")) return 1.1;
  return 1.15;
}

function vehicleBlurb(name: string, index: number) {
  const lower = name.toLowerCase();
  if (index === 0) return "Recommended";
  if (lower.includes("26")) return "Best for large homes & heavy loads";
  if (lower.includes("16")) return "Great for apartments & mid-size moves";
  if (lower.includes("cargo") || lower.includes("van")) return "Affordable for small moves & single items";
  return "Ideal for local moves and deliveries";
}

type VehicleCardPickerProps = {
  selectedId: string | null;
  onSelect: (vehicle: VehicleType) => void;
  pickup?: MapPlace | null;
  destination?: MapPlace | null;
};

export function VehicleCardPicker({ selectedId, onSelect, pickup, destination }: VehicleCardPickerProps) {
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autoSelected = useRef(false);

  const distanceKm = useMemo(() => haversineKm(pickup ?? null, destination ?? null), [pickup, destination]);
  const basePrice = useMemo(() => estimateLocalPrice(distanceKm), [distanceKm]);

  useEffect(() => {
    let cancelled = false;
    vehiclesApi
      .listTypes()
      .then((list) => {
        if (!cancelled) {
          setVehicles(list.filter((v) => v.isActive));
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load vehicles");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (autoSelected.current || selectedId || vehicles.length === 0) return;
    autoSelected.current = true;
    onSelect(vehicles[0]);
  }, [vehicles, selectedId, onSelect]);

  if (loading) {
    return (
      <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#8A8A90", padding: "12px 0" }}>
        Loading vehicles…
      </div>
    );
  }

  if (error) {
    return <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#B42318", padding: "8px 0" }}>{error}</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {vehicles.map((vehicle, index) => {
        const active = selectedId === vehicle.id;
        const price = Math.round(basePrice * vehiclePriceMultiplier(vehicle.name));
        const hint = capacityHint(vehicle);
        return (
          <button
            key={vehicle.id}
            type="button"
            onClick={() => onSelect(vehicle)}
            style={{
              width: "100%",
              textAlign: "left",
              border: active ? "2.5px solid #0E0E10" : "1.5px solid rgba(0,0,0,.1)",
              borderRadius: 16,
              background: active ? "#fff" : "#FAFAF8",
              padding: "14px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: active ? "0 8px 22px rgba(0,0,0,.1)" : "none",
            }}
          >
            <div
              style={{
                width: 72,
                height: 52,
                borderRadius: 12,
                background: active ? "rgba(255,222,46,.35)" : "rgba(0,0,0,.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <TypeIcon icon={vehicleLucideIcon(vehicle.name)} size={28} color="#0E0E10" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ font: "800 16px 'Archivo'", color: "#0E0E10" }}>{vehicle.name}</span>
                <span style={{ font: "600 12px 'Hanken Grotesk'", color: "#6B6B70" }}>
                  · {capacityPeople(vehicle)} movers
                </span>
              </div>
              <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 3 }}>
                {vehicleBlurb(vehicle.name, index)}
                {hint ? ` · ${hint}` : ""}
              </div>
            </div>

            <div style={{ flex: "none", textAlign: "right" }}>
              <div style={{ font: "800 17px 'Archivo'", color: "#0E0E10" }}>${price}</div>
              <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#8A8A90" }}>est.</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
