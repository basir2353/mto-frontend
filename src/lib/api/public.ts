import { api, apiPublic } from "./client";
import type { NearbyMoversResponse, ServiceZone, VehicleType } from "./types";

export type NearbyMoversSortBy = "distance" | "price" | "rating" | "arrival";

export const vehiclesApi = {
  listTypes: () => apiPublic<VehicleType[]>("/vehicle-types"),

  getType: (id: string) => apiPublic<VehicleType>(`/vehicle-types/${id}`),

  getRecommendations: () =>
    apiPublic<{ guidance: string; vehicleTypes: VehicleType[] }>("/vehicle-recommendations"),

  calculateRecommendation: (items: Array<{ name: string; quantity?: number }>, distanceKm?: number) =>
    apiPublic<{
      totals: { weightKg: number; volumeM3: number };
      vehicleType: VehicleType;
      estimatedPrice: number;
      alternatives: VehicleType[];
    }>("/vehicle-recommendations/calculate", {
      method: "POST",
      body: JSON.stringify({ items, distanceKm }),
    }),
};

export const zonesApi = {
  list: () => apiPublic<ServiceZone[]>("/zones"),

  check: (latitude: number, longitude: number) =>
    apiPublic<{ covered: boolean; outsideCanada?: boolean; zones: ServiceZone[] }>(
      `/zones/check?latitude=${latitude}&longitude=${longitude}`,
    ),

  pricing: (latitude: number, longitude: number, distanceKm?: number) =>
    apiPublic<{ total: number; zone?: unknown; subtotal?: number }>(
      `/zones/pricing?latitude=${latitude}&longitude=${longitude}${distanceKm != null ? `&distanceKm=${distanceKm}` : ""}`,
    ),

  availability: (latitude: number, longitude: number, scheduledAt?: string) => {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
    });
    if (scheduledAt) params.set("scheduledAt", scheduledAt);
    return apiPublic<{ available: boolean; outsideCanada?: boolean; zones: ServiceZone[] }>(`/zones/availability?${params}`);
  },

  create: (body: {
    name: string;
    description?: string;
    boundary: ServiceZone["boundary"];
    basePriceMultiplier?: number;
    baseFee?: number;
    isActive?: boolean;
    isAvailable?: boolean;
  }) => api<ServiceZone>("/zones", { method: "POST", body: JSON.stringify(body) }),

  update: (
    id: string,
    body: Partial<{
      name: string;
      description: string;
      boundary: ServiceZone["boundary"];
      basePriceMultiplier: number;
      baseFee: number;
      isActive: boolean;
      isAvailable: boolean;
    }>,
  ) => api<ServiceZone>(`/zones/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  remove: (id: string) => api<{ message: string }>(`/zones/${id}`, { method: "DELETE" }),
};

export const discoveryApi = {
  nearbyMovers: (params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    vehicleTypeId?: string;
    sortBy?: NearbyMoversSortBy;
    destinationLatitude?: number;
    destinationLongitude?: number;
  }) => {
    const search = new URLSearchParams({
      latitude: String(params.latitude),
      longitude: String(params.longitude),
    });
    if (params.radiusKm != null) search.set("radiusKm", String(params.radiusKm));
    if (params.vehicleTypeId) search.set("vehicleTypeId", params.vehicleTypeId);
    if (params.sortBy) search.set("sortBy", params.sortBy);
    if (params.destinationLatitude != null) {
      search.set("destinationLatitude", String(params.destinationLatitude));
    }
    if (params.destinationLongitude != null) {
      search.set("destinationLongitude", String(params.destinationLongitude));
    }
    return apiPublic<NearbyMoversResponse>(`/movers/nearby?${search.toString()}`);
  },
};

export const platformApi = {
  health: () => apiPublic<{ status: string; service: string; timestamp: string }>("/health"),
};
