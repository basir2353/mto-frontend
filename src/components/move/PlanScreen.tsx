"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker, { formatMoveDate } from "@/components/DatePicker";
import PlaceAutocompleteInput from "@/components/maps/PlaceAutocompleteInput";
import RouteMap from "@/components/maps/RouteMap";
import { useForm } from "@/contexts/MoveFormContext";
import { useNearbyMovers } from "@/hooks/useNearbyMovers";
import { hasGoogleMaps } from "@/lib/env";
import { zonesApi, type NearbyMoversSortBy } from "@/lib/api/public";
import type { VehicleType } from "@/lib/api";
import { isWithinCanadaBounds, type MapPlace } from "@/lib/maps";
import { MapPill, SoftNotice, WizardShell } from "@/components/move/WizardChrome";
import { useRouteMetrics } from "@/hooks/useRouteMetrics";
import { VehicleTypeIcon } from "@/components/move/VehicleTypeIcon";
import {
  estimateVehicleTripPrice,
  formatCapacityLabel,
} from "@/lib/vehicleVisuals";

function localIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PlanScreen({ onNext }: { onNext: () => void }) {
  const f = useForm();
  const [sortBy] = useState<NearbyMoversSortBy>("distance");
  const [error, setError] = useState<string | null>(null);
  const [whenOpen, setWhenOpen] = useState(false);
  const [pickupBias, setPickupBias] = useState<{ lat: number; lng: number } | null>(null);
  const [coverageStatus, setCoverageStatus] = useState<{
    key: string;
    tone: "ok" | "warn";
    text: string;
  } | null>(null);
  const nearby = useNearbyMovers({
    pickup: f.pickupPlace,
    destination: f.destinationPlace,
    vehicleFilter: f.vehicleFilter,
    sortBy,
  });
  const route = useRouteMetrics(f.pickupPlace, f.destinationPlace);
  const tripKm = route.tripKm;

  const onlineCount = nearby.summary.onlineCount;
  const pickupHasCoords = f.pickupPlace.lat != null && f.pickupPlace.lng != null;
  const destinationHasCoords = f.destinationPlace.lat != null && f.destinationPlace.lng != null;
  const pickupInCanada = pickupHasCoords ? isWithinCanadaBounds(f.pickupPlace) : false;
  const destinationInCanada = destinationHasCoords ? isWithinCanadaBounds(f.destinationPlace) : false;
  const canadianPlacesReady = !hasGoogleMaps || (pickupHasCoords && pickupInCanada && destinationHasCoords && destinationInCanada);
  const zoneLookupKey =
    pickupHasCoords && destinationHasCoords
      ? `${f.pickupPlace.lat}:${f.pickupPlace.lng}:${f.destinationPlace.lat}:${f.destinationPlace.lng}`
      : "";
  const localZoneStatus = useMemo(() => {
    if (!hasGoogleMaps) return null;
    if (pickupHasCoords && !pickupInCanada) {
      return { tone: "warn" as const, text: "Pickup location must be inside Canada." };
    }
    if (destinationHasCoords && !destinationInCanada) {
      return { tone: "warn" as const, text: "Drop-off location must be inside Canada." };
    }
    if (!pickupHasCoords) {
      return {
        tone: "warn" as const,
        text: "Select a pickup address from the Canada suggestions to check zone coverage.",
      };
    }
    if (!destinationHasCoords) {
      return {
        tone: "warn" as const,
        text: "Select a destination from the Canada suggestions to check coverage for the full route.",
      };
    }
    return null;
  }, [destinationHasCoords, destinationInCanada, pickupHasCoords, pickupInCanada]);
  const zoneStatus =
    localZoneStatus ??
    (zoneLookupKey && coverageStatus?.key === zoneLookupKey
      ? { tone: coverageStatus.tone, text: coverageStatus.text }
      : { tone: "ok" as const, text: "Checking service zone coverage..." });
  const zoneCheckReady = !hasGoogleMaps || Boolean(localZoneStatus) || coverageStatus?.key === zoneLookupKey;
  const zoneAllowsContinue = zoneStatus.tone !== "warn";
  const canContinue = Boolean(f.pickup.trim() && f.destination.trim() && canadianPlacesReady && zoneCheckReady && zoneAllowsContinue);

  useEffect(() => {
    let cancelled = false;

    if (!hasGoogleMaps || localZoneStatus || !pickupHasCoords || !destinationHasCoords) {
      return;
    }

    Promise.all([
      zonesApi.check(Number(f.pickupPlace.lat), Number(f.pickupPlace.lng)),
      zonesApi.check(Number(f.destinationPlace.lat), Number(f.destinationPlace.lng)),
    ])
      .then(([pickupResult, destinationResult]) => {
        if (cancelled) return;
        if (pickupResult.outsideCanada || destinationResult.outsideCanada) {
          setCoverageStatus({
            key: zoneLookupKey,
            tone: "warn",
            text: "Both pickup and destination must be inside Canada.",
          });
          return;
        }
        if (!pickupResult.covered || !destinationResult.covered) {
          const missing =
            !pickupResult.covered && !destinationResult.covered
              ? "Pickup and destination are"
              : !pickupResult.covered
                ? "Pickup is"
                : "Destination is";
          setCoverageStatus({
            key: zoneLookupKey,
            tone: "warn",
            text: `Outside service area: ${missing} not within an active zone. Choose covered locations or contact support.`,
          });
          return;
        }
        const pickupZone = pickupResult.zones[0]?.name;
        const destinationZone = destinationResult.zones[0]?.name;
        const zoneLabel =
          pickupZone && destinationZone
            ? pickupZone === destinationZone
              ? pickupZone
              : `${pickupZone} to ${destinationZone}`
            : null;
        setCoverageStatus({
          key: zoneLookupKey,
          tone: "ok",
          text: zoneLabel ? `Route covered: ${zoneLabel}.` : "Route covered: both locations are in active service zones.",
        });
      })
      .catch(() => {
        if (cancelled) return;
        setCoverageStatus({
          key: zoneLookupKey,
          tone: "warn",
          text: "Could not verify zone coverage right now. Please try again.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    destinationHasCoords,
    f.destinationPlace.lat,
    f.destinationPlace.lng,
    f.pickupPlace.lat,
    f.pickupPlace.lng,
    localZoneStatus,
    pickupHasCoords,
    zoneLookupKey,
  ]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPickupBias({ lat: coords.latitude, lng: coords.longitude }),
      () => {},
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!f.vehicleFilter && nearby.vehicleTypes[0]) {
      const first = nearby.vehicleTypes[0];
      f.setVehicleFilter(first.name);
      f.setSelectedVehicleId(first.id);
      f.setSelectedVehicleName(first.name);
    }
  }, [f.vehicleFilter, nearby.vehicleTypes]);

  const handleContinue = () => {
    if (!canContinue) {
      setError(zoneStatus.tone === "warn" ? zoneStatus.text : "Select valid Canadian pickup and drop-off locations to continue.");
      return;
    }
    setError(null);
    onNext();
  };

  const swapLocations = () => {
    const pickup = f.pickup;
    const pickupPlace = f.pickupPlace;
    f.setPickup(f.destination);
    f.setPickupPlace(f.destinationPlace);
    f.setDestination(pickup);
    f.setDestinationPlace(pickupPlace);
  };

  const selectPickNow = () => {
    f.setMoveType("now");
    f.setWhenChoice("today");
    f.setMoveDate(localIsoDate(new Date()));
  };

  const selectScheduled = () => {
    f.setMoveType("scheduled");
    if (f.whenChoice === "today" || !f.moveDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      f.setWhenChoice("tomorrow");
      f.setMoveDate(localIsoDate(tomorrow));
    }
  };

  return (
    <WizardShell
      mobileSheetSize="compact"
      left={
        <>
          <div className="plan-sheet-body" style={{ flex: 1, overflow: "auto", padding: "26px 28px 18px" }}>
            <h1 className="plan-heading plan-sheet-heading" style={{ margin: "0 0 8px", font: "800 34px/1.05 'Archivo'", letterSpacing: "-.025em" }}>
              Where are you
              <br />
              moving to?
            </h1>
            <p className="plan-sheet-sub" style={{ margin: "0 0 20px", font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
              Get competing quotes from verified movers near you.
            </p>

            <div className="plan-location-card plan-sheet-locations" style={{ border: "1.5px solid rgba(0,0,0,.14)", borderRadius: 12, position: "relative" }}>
              <PickupField
                value={f.pickup}
                biasLocation={pickupBias}
                onChange={(value) => {
                  f.setPickup(value);
                  f.setPickupPlace({ address: value });
                }}
                onPlaceSelect={(place) => {
                  f.setPickupPlace(place);
                  f.setPickup(place.address);
                }}
              />
              <div style={{ height: 1, background: "rgba(0,0,0,.08)" }} />
              <DestinationField
                value={f.destination}
                biasLocation={
                  f.pickupPlace.lat != null && f.pickupPlace.lng != null
                    ? { lat: Number(f.pickupPlace.lat), lng: Number(f.pickupPlace.lng) }
                    : pickupBias
                }
                onChange={(value) => {
                  f.setDestination(value);
                  f.setDestinationPlace({ address: value });
                }}
                onPlaceSelect={(place) => {
                  f.setDestinationPlace(place);
                  f.setDestination(place.address);
                }}
              />
              <button
                type="button"
                onClick={swapLocations}
                aria-label="Swap pickup and destination"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 14,
                  transform: "translateY(-50%)",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,.1)",
                  background: "#F5F4EF",
                  cursor: "pointer",
                  font: "700 14px 'Hanken Grotesk'",
                }}
              >
                ⇅
              </button>
            </div>

            <div className="plan-sheet-options" style={{ marginTop: 20 }}>
              <div style={{ font: "700 11px var(--font-hanken, 'Hanken Grotesk')", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 8 }}>
                When
              </div>
              <WhenDropdown
                open={whenOpen}
                onOpenChange={setWhenOpen}
                moveType={f.moveType}
                summary={
                  f.moveType === "now"
                    ? "Pick now"
                    : formatMoveDate(f.moveDate)
                      ? `Scheduled · ${formatMoveDate(f.moveDate)}`
                      : "Scheduled"
                }
                onPickNow={() => {
                  selectPickNow();
                  setWhenOpen(false);
                }}
                onScheduled={() => {
                  selectScheduled();
                  setWhenOpen(false);
                }}
              />
              {f.moveType === "scheduled" && (
                <div style={{ marginTop: 10 }}>
                  <DatePicker
                    value={f.moveDate}
                    onChange={(v) => {
                      f.setMoveDate(v);
                      f.setWhenChoice("custom");
                    }}
                    placeholder="Select date"
                    disablePast
                    displayFormat="long"
                  />
                </div>
              )}
            </div>

            <div className="plan-sheet-options" style={{ marginTop: 20 }}>
              <div style={{ font: "700 11px var(--font-hanken, 'Hanken Grotesk')", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 8 }}>
                Vehicle preference
              </div>
              {tripKm != null ? (
                <div style={{ marginBottom: 10, font: "600 12px var(--font-hanken, 'Hanken Grotesk')", color: "#6B6B70" }}>
                  Est. trip {tripKm.toFixed(1)} km
                  {route.tripMinutes != null ? ` · ~${route.tripMinutes} min` : ""}
                  {route.resolving ? " · updating…" : ""}
                </div>
              ) : (
                <div style={{ marginBottom: 10, font: "600 12px var(--font-hanken, 'Hanken Grotesk')", color: "#8A8A90" }}>
                  Add pickup & drop-off to see route prices
                </div>
              )}
              <div className="plan-vehicle-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {nearby.vehicleTypes.map((vehicle) => (
                  <VehicleListRow
                    key={vehicle.id}
                    vehicle={vehicle}
                    tripKm={tripKm}
                    active={f.vehicleFilter === vehicle.name}
                    onClick={() => {
                      f.setVehicleFilter(vehicle.name);
                      f.setSelectedVehicleId(vehicle.id);
                      f.setSelectedVehicleName(vehicle.name);
                    }}
                  />
                ))}
              </div>
            </div>

            {onlineCount > 0 && (
              <div
                className="plan-sheet-status"
                style={{
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "rgba(255,222,46,.15)",
                  border: "1.5px solid rgba(255,222,46,.5)",
                  font: "700 13px 'Hanken Grotesk'",
                  color: "#3a3a40",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1f6b1f" }} />
                {onlineCount} movers online nearby
              </div>
            )}
            {zoneStatus && (
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: zoneStatus.tone === "ok" ? "#e7f5ea" : "#fff4df",
                  border: zoneStatus.tone === "ok" ? "1.5px solid rgba(31,107,31,.18)" : "1.5px solid rgba(138,90,0,.2)",
                  font: "700 13px 'Hanken Grotesk'",
                  color: zoneStatus.tone === "ok" ? "#1f6b1f" : "#8a5a00",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: zoneStatus.tone === "ok" ? "#1f6b1f" : "#8a5a00",
                  }}
                />
                {zoneStatus.text}
              </div>
            )}
          </div>

          <div className="plan-primary-action plan-sheet-footer" style={{ flex: "none", padding: "16px 28px 22px", borderTop: "1px solid rgba(0,0,0,.07)" }}>
            <SoftNotice>{error}</SoftNotice>
            <div
              onClick={handleContinue}
              style={{
                height: 58,
                borderRadius: 12,
                background: canContinue ? "var(--accent)" : "rgba(0,0,0,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                font: "800 17px 'Archivo'",
                color: canContinue ? "#0E0E10" : "#8A8A90",
                cursor: canContinue ? "pointer" : "not-allowed",
              }}
            >
              Continue →
            </div>
          </div>
        </>
      }
      right={
        <>
          <RouteMap pickup={f.pickupPlace} destination={f.destinationPlace} nearbyMovers={nearby.mapMovers} />
          {onlineCount > 0 && <MapPill position="bottom-left">{onlineCount} movers online nearby</MapPill>}
        </>
      }
    >
      <style>{`
        @media(max-width:900px){
          .plan-sheet-body{padding-top:24px!important;padding-bottom:12px!important}
          .wizard-sheet-collapsed .plan-sheet-footer,
          .wizard-sheet-collapsed .plan-primary-action{display:none!important}
          .wizard-sheet-expanded .plan-sheet-footer,
          .wizard-sheet-expanded .plan-primary-action{
            display:block!important;
            padding:10px 16px 14px!important;
            border-top:1px solid rgba(0,0,0,.07);
            background:#fff;
          }
          .wizard-sheet-expanded .plan-primary-action>div:last-child{
            height:44px!important;
            border-radius:12px!important;
            font:800 14px 'Archivo'!important;
          }
          .wizard-sheet-collapsed .plan-sheet-body{flex:0 0 auto!important;overflow:visible!important;height:auto!important;min-height:0!important;padding:2px 16px 14px!important}
          .plan-chip-scroller{flex-wrap:nowrap!important;overflow-x:auto;padding-bottom:3px;scrollbar-width:none;margin-right:-20px;padding-right:20px}
          .plan-chip-scroller::-webkit-scrollbar{display:none}
          .plan-chip-scroller>button{flex:none}
          .plan-vehicle-list{gap:8px!important}
          .plan-location-card{border-width:2px!important;box-shadow:0 5px 18px rgba(0,0,0,.06)}
        }
        @media(max-width:560px){
          .plan-heading{font-size:26px!important}
          .plan-heading br{display:none}
          .plan-sheet-body>p{margin-bottom:14px!important}
          .plan-sheet-body>div[style*="margin-top: 20px"]{margin-top:14px!important}
        }
      `}</style>
    </WizardShell>
  );
}

function WhenDropdown({
  open,
  onOpenChange,
  moveType,
  summary,
  onPickNow,
  onScheduled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moveType: "now" | "scheduled";
  summary: string;
  onPickNow: () => void;
  onScheduled: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 48,
          padding: "10px 14px",
          borderRadius: 12,
          border: "1.5px solid rgba(0,0,0,.14)",
          background: "#fff",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ flex: 1, font: "700 15px var(--font-hanken, 'Hanken Grotesk')", color: "#0E0E10" }}>
          {summary}
        </span>
        <span
          aria-hidden
          style={{
            font: "700 12px var(--font-hanken, 'Hanken Grotesk')",
            color: "#6B6B70",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s ease",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="When"
          style={{
            position: "absolute",
            zIndex: 40,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            borderRadius: 12,
            border: "1.5px solid rgba(0,0,0,.12)",
            background: "#fff",
            boxShadow: "0 10px 28px rgba(0,0,0,.12)",
            overflow: "hidden",
          }}
        >
          <WhenOption
            title="Pick now"
            subtitle="Find movers as soon as you're ready"
            active={moveType === "now"}
            onClick={onPickNow}
          />
          <div style={{ height: 1, background: "rgba(0,0,0,.08)" }} />
          <WhenOption
            title="Scheduled"
            subtitle="Choose a date for your move"
            active={moveType === "scheduled"}
            onClick={onScheduled}
          />
        </div>
      )}
    </div>
  );
}

function WhenOption({
  title,
  subtitle,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        border: "none",
        background: active ? "rgba(0,0,0,.04)" : "#fff",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "700 14px var(--font-hanken, 'Hanken Grotesk')", color: "#0E0E10" }}>{title}</div>
        <div style={{ marginTop: 2, font: "500 12px var(--font-hanken, 'Hanken Grotesk')", color: "#6B6B70" }}>
          {subtitle}
        </div>
      </div>
      {active && (
        <span style={{ font: "800 14px var(--font-hanken, 'Hanken Grotesk')", color: "#0E0E10" }} aria-hidden>
          ✓
        </span>
      )}
    </button>
  );
}

function VehicleListRow({
  vehicle,
  tripKm,
  active,
  onClick,
}: {
  vehicle: VehicleType;
  tripKm: number | null;
  active: boolean;
  onClick: () => void;
}) {
  const price = estimateVehicleTripPrice(tripKm, vehicle.basePrice, vehicle.pricePerKm);
  const capacity = formatCapacityLabel(vehicle.maxVolumeM3, vehicle.maxWeightKg);
  const movers =
    vehicle.moverCapacity != null && vehicle.moverCapacity > 0
      ? `${vehicle.moverCapacity} mover${vehicle.moverCapacity === 1 ? "" : "s"}`
      : null;
  const isSmallDelivery = /car|suv/i.test(vehicle.name);
  const meta = isSmallDelivery
    ? "Small deliveries only"
    : [movers, capacity].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 14,
        border: active ? "2px solid #0E0E10" : "1.5px solid rgba(0,0,0,.1)",
        background: active ? "#0E0E10" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        boxShadow: active ? "none" : "0 1px 2px rgba(0,0,0,.04)",
      }}
    >
      <VehicleTypeIcon name={vehicle.name} active={active} size={72} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            font: "800 15px var(--font-archivo, Archivo, sans-serif)",
            color: active ? "#fff" : "#0E0E10",
            letterSpacing: "-.01em",
          }}
        >
          {vehicle.name}
        </div>
        <div
          style={{
            marginTop: 3,
            font: "500 12px var(--font-hanken, 'Hanken Grotesk')",
            color: active ? "rgba(255,255,255,.65)" : "#6B6B70",
          }}
        >
          {meta || vehicle.description || "Moving vehicle"}
        </div>
      </div>
      <div style={{ textAlign: "right", flex: "none" }}>
        <div
          style={{
            font: "800 17px var(--font-archivo, Archivo, sans-serif)",
            color: active ? "var(--accent)" : "#0E0E10",
            letterSpacing: "-.02em",
          }}
        >
          ${price}
        </div>
        <div
          style={{
            marginTop: 2,
            font: "600 11px var(--font-hanken, 'Hanken Grotesk')",
            color: active ? "rgba(255,255,255,.55)" : "#8A8A90",
          }}
        >
          est. total
        </div>
      </div>
    </button>
  );
}

function PickupField({
  value,
  biasLocation,
  onChange,
  onPlaceSelect,
}: {
  value: string;
  biasLocation?: { lat: number; lng: number } | null;
  onChange: (v: string) => void;
  onPlaceSelect: (place: MapPlace) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #0E0E10", flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "700 9px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90" }}>Pickup</div>
        <PlaceAutocompleteInput
          value={value}
          onChange={onChange}
          onPlaceSelect={onPlaceSelect}
          biasLocation={biasLocation}
          placeholder="Enter pickup address"
          height={26}
          containerStyle={{ border: "none", height: 26, padding: 0 }}
          inputStyle={{ font: "600 14px 'Hanken Grotesk'" }}
        />
      </div>
    </div>
  );
}

function DestinationField({
  value,
  biasLocation,
  onChange,
  onPlaceSelect,
}: {
  value: string;
  biasLocation?: { lat: number; lng: number } | null;
  onChange: (v: string) => void;
  onPlaceSelect: (place: MapPlace) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--accent)", flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "700 9px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90" }}>Destination</div>
        <PlaceAutocompleteInput
          value={value}
          onChange={onChange}
          onPlaceSelect={onPlaceSelect}
          biasLocation={biasLocation}
          placeholder="Enter destination address"
          height={26}
          containerStyle={{ border: "none", height: 26, padding: 0 }}
          inputStyle={{ font: "600 14px 'Hanken Grotesk'" }}
        />
      </div>
    </div>
  );
}
