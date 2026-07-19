"use client";

import { createContext, useContext } from "react";
import type { MoveType } from "@/components/booking/MoveTimingTabs";
import type { MapPlace } from "@/lib/maps";

export type Photo = { name: string; url: string };
export type WhenChoice = "today" | "tomorrow" | "custom";

export type FormState = {
  pickup: string;
  setPickup: (v: string) => void;
  pickupPlace: MapPlace;
  setPickupPlace: (v: MapPlace) => void;
  destination: string;
  setDestination: (v: string) => void;
  destinationPlace: MapPlace;
  setDestinationPlace: (v: MapPlace) => void;
  moveType: MoveType;
  setMoveType: (v: MoveType) => void;
  whenChoice: WhenChoice;
  setWhenChoice: (v: WhenChoice) => void;
  moveDate: string;
  setMoveDate: (v: string) => void;
  timeWindow: string;
  setTimeWindow: (v: string) => void;
  timeZone: string;
  setTimeZone: (v: string) => void;
  flexibleTime: boolean;
  setFlexibleTime: (v: boolean) => void;
  vehicleFilter: string;
  setVehicleFilter: (v: string) => void;
  selectedVehicleId: string | null;
  setSelectedVehicleId: (v: string | null) => void;
  selectedVehicleName: string;
  setSelectedVehicleName: (v: string) => void;
  estimatedLoad: string;
  setEstimatedLoad: (v: string) => void;
  moveDescription: string;
  setMoveDescription: (v: string) => void;
  photos: Photo[];
  addPhoto: (photo: Photo) => void;
  stars: number;
  setStars: (v: number) => void;
  ratingTags: string[];
  toggleRatingTag: (v: string) => void;
  reviewText: string;
  setReviewText: (v: string) => void;
  tip: string;
  setTip: (v: string) => void;
  customTip: string;
  setCustomTip: (v: string) => void;
};

export const FormCtx = createContext<FormState | null>(null);

export function useForm() {
  const ctx = useContext(FormCtx);
  if (!ctx) throw new Error("useForm must be used within FormCtx.Provider");
  return ctx;
}
