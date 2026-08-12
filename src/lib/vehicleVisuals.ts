import pickupImg from "@/assets/vehicles/pickup-uber.png";
import cargoVanImg from "@/assets/vehicles/cargo-van-uber.png";
import boxTruckImg from "@/assets/vehicles/box-truck-uber.png";
import carSuvImg from "@/assets/vehicles/car-suv-uber.png";

export type VehicleVisualKind = "pickup" | "cargoVan" | "boxTruck" | "carSuv";

type Img = string | { src: string };

function imgSrc(img: Img): string {
  return typeof img === "string" ? img : img.src;
}

export function kindForVehicleTypeName(name: string): VehicleVisualKind {
  const n = name.toLowerCase();
  if (n.includes("pickup") || n.includes("pick-up")) return "pickup";
  if (n.includes("cargo") || (n.includes("van") && !n.includes("car"))) return "cargoVan";
  if (n.includes("box") || n.includes("truck")) return "boxTruck";
  if (n.includes("suv") || n.includes("car")) return "carSuv";
  return "boxTruck";
}

/** Bundled Uber-style 3D vehicle renders (content-hashed — no stale browser cache). */
export const vehicleTypePhotos: Record<VehicleVisualKind, string> = {
  pickup: imgSrc(pickupImg),
  cargoVan: imgSrc(cargoVanImg),
  boxTruck: imgSrc(boxTruckImg),
  carSuv: imgSrc(carSuvImg),
};

export function photoForVehicleTypeName(name: string): string {
  return vehicleTypePhotos[kindForVehicleTypeName(name)];
}

export function formatCapacityLabel(
  maxVolumeM3: number | string | null | undefined,
  maxWeightKg: number | string | null | undefined,
): string {
  const vol = toMoneyNumber(maxVolumeM3, NaN);
  const weight = toMoneyNumber(maxWeightKg, NaN);
  const parts: string[] = [];
  if (Number.isFinite(vol) && vol > 0) {
    parts.push(`${Number.isInteger(vol) ? vol : vol.toFixed(1)} m³`);
  }
  if (Number.isFinite(weight) && weight > 0) {
    parts.push(`${Math.round(weight)} kg`);
  }
  return parts.join(" · ");
}

function toMoneyNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Route estimate — API decimals often arrive as strings ("89.00"). */
export function estimateVehicleTripPrice(
  distanceKm: number | null | undefined,
  basePrice: number | string | null | undefined,
  pricePerKm: number | string | null | undefined,
): number {
  const base = toMoneyNumber(basePrice, 55);
  const perKm = toMoneyNumber(pricePerKm, 2);
  const kmRaw = distanceKm == null ? NaN : Number(distanceKm);
  const km = Number.isFinite(kmRaw) && kmRaw >= 0 ? kmRaw : 8;
  return Math.max(0, Math.round(base + km * perKm));
}
