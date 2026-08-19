"use client";

import { apiOrigin } from "@/lib/env";
import { resolveVehicleTypePhoto } from "@/lib/vehicleVisuals";

type Props = {
  name?: string;
  imageUrl?: string | null;
  active?: boolean;
  size?: number;
};

/** Vehicle picker icon — uses admin-uploaded image when set. */
export function VehicleTypeIcon({ name = "", imageUrl, active = false, size = 72 }: Props) {
  const src = resolveVehicleTypePhoto({ name, imageUrl }, apiOrigin);

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
