"use client";

import type { VehicleVisualKind } from "@/lib/vehicleVisuals";
import { kindForVehicleTypeName, vehicleTypePhotos } from "@/lib/vehicleVisuals";

type Props = {
  name?: string;
  kind?: VehicleVisualKind;
  active?: boolean;
  size?: number;
};

/** Uber-style 3D vehicle product renders. */
export function VehicleTypeIcon({ name = "", kind, active = false, size = 72 }: Props) {
  const resolved = kind ?? kindForVehicleTypeName(name);
  const src = vehicleTypePhotos[resolved];

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: active ? "rgba(255,255,255,.1)" : "#E8E8EA",
        display: "grid",
        placeItems: "center",
        flex: "none",
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          objectPosition: "center 55%",
          display: "block",
          transform: "scale(1.08)",
        }}
        draggable={false}
      />
    </div>
  );
}
