"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { hasGoogleMaps } from "@/lib/env";
import { DEFAULT_MAP_CENTER, toLatLng, type MapPlace } from "@/lib/maps";
import styles from "./DriverNavMap.module.css";

export type DriverNavTelemetry = {
  speedMps: number | null;
  heading: number | null;
  accuracy: number | null;
};

type DriverNavMapProps = {
  pickup?: MapPlace | null;
  destination?: MapPlace | null;
  driver?: MapPlace | null;
  /** Which stop the driver is currently navigating toward. */
  navigateTo?: "pickup" | "dropoff";
  telemetry?: DriverNavTelemetry | null;
  stopLabel?: string;
  fullscreen?: boolean;
  onOpenExternalNav?: () => void;
  onToggleFullscreen?: () => void;
  onOpenDetails?: () => void;
  onMessage?: () => void;
  onClose?: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionBusy?: boolean;
};

function TrafficLayer() {
  const map = useMap();
  useEffect(() => {
    if (!map || typeof google === "undefined") return;
    const layer = new google.maps.TrafficLayer();
    layer.setMap(map);
    return () => layer.setMap(null);
  }, [map]);
  return null;
}

function NavRoute({
  origin,
  destination,
}: {
  origin?: MapPlace | null;
  destination?: MapPlace | null;
}) {
  const map = useMap();
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const originCoords = toLatLng(origin);
  const destinationCoords = toLatLng(destination);

  useEffect(() => {
    if (!map || !originCoords || !destinationCoords) return;
    if (typeof google === "undefined" || !google.maps?.DirectionsService) return;

    const renderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: "#1a73e8",
        strokeWeight: 6,
        strokeOpacity: 0.95,
      },
    });
    rendererRef.current = renderer;

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: originCoords,
        destination: destinationCoords,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          renderer.setDirections(result);
        }
      },
    );

    return () => {
      renderer.setMap(null);
      rendererRef.current = null;
    };
  }, [map, originCoords?.lat, originCoords?.lng, destinationCoords?.lat, destinationCoords?.lng]);

  return null;
}

function FollowCamera({
  driver,
  heading,
  follow,
}: {
  driver?: MapPlace | null;
  heading?: number | null;
  follow: boolean;
}) {
  const map = useMap();
  const coords = toLatLng(driver);

  useEffect(() => {
    if (!map || !coords || !follow) return;
    map.panTo(coords);
    const zoom = map.getZoom() ?? 16;
    if (zoom < 15) map.setZoom(16);
    if (typeof heading === "number" && Number.isFinite(heading) && typeof map.setHeading === "function") {
      try {
        map.setHeading(heading);
        if (typeof map.setTilt === "function") map.setTilt(45);
      } catch {
        /* heading/tilt need vector mapId in some environments */
      }
    }
  }, [map, coords?.lat, coords?.lng, heading, follow]);

  return null;
}

function DriverArrowMarker({
  position,
  heading,
}: {
  position: { lat: number; lng: number };
  heading: number | null;
}) {
  const rotation = heading != null && Number.isFinite(heading) ? heading : 0;
  const icon =
    typeof google !== "undefined"
      ? {
          path: "M 0 -28 L 14 16 L 0 8 L -14 16 Z",
          fillColor: "#1a73e8",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 1.15,
          rotation,
          anchor: new google.maps.Point(0, 0),
        }
      : undefined;

  return <Marker position={position} title="You" icon={icon} zIndex={999} />;
}

function formatSpeed(speedMps: number | null | undefined) {
  if (speedMps == null || !Number.isFinite(speedMps) || speedMps < 0) return "—";
  const kmh = Math.round(speedMps * 3.6);
  return String(kmh);
}

/** Compact duration for the small ETA badge, e.g. 42m, 5h, 11d. */
function formatEtaShort(minutes: number | null | undefined) {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return "—";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  return `${Math.round(days)}d`;
}

/** Full duration for the trip meta line, e.g. 42 min, 5 h 20 min, 11 d 4 h. */
function formatEtaLong(minutes: number | null | undefined) {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const totalHours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (totalHours < 24) return mins > 0 ? `${totalHours} h ${mins} min` : `${totalHours} h`;
  const days = Math.floor(totalHours / 24);
  const hrs = totalHours % 24;
  return hrs > 0 ? `${days} d ${hrs} h` : `${days} d`;
}

function formatDistance(km: number | null | undefined) {
  if (km == null || !Number.isFinite(km) || km < 0) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}

export default function DriverNavMap({
  pickup,
  destination,
  driver,
  navigateTo = "pickup",
  telemetry,
  stopLabel,
  fullscreen = false,
  onOpenExternalNav,
  onToggleFullscreen,
  onOpenDetails,
  onMessage,
  onClose,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionBusy = false,
}: DriverNavMapProps) {
  const [follow, setFollow] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const driverCoords = toLatLng(driver);
  const pickupCoords = toLatLng(pickup);
  const destinationCoords = toLatLng(destination);
  const target = navigateTo === "dropoff" ? destination : pickup;
  const targetCoords = toLatLng(target);
  const routeOrigin = driverCoords ? driver : pickup;
  const center = driverCoords ?? targetCoords ?? pickupCoords ?? destinationCoords ?? DEFAULT_MAP_CENTER;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 820px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const etaHint = useMemo(() => {
    if (!driverCoords || !targetCoords || typeof google === "undefined" || !google.maps?.geometry) return null;
    const meters = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(driverCoords.lat, driverCoords.lng),
      new google.maps.LatLng(targetCoords.lat, targetCoords.lng),
    );
    const km = meters / 1000;
    const speed = telemetry?.speedMps && telemetry.speedMps > 1 ? telemetry.speedMps : 11;
    const minutes = Math.max(1, Math.round((meters / speed) / 60));
    return { km, minutes };
  }, [driverCoords?.lat, driverCoords?.lng, targetCoords?.lat, targetCoords?.lng, telemetry?.speedMps]);

  if (!hasGoogleMaps) {
    return (
      <div className={`${styles.root} liveNavigation ${fullscreen ? styles.fullscreen : ""}`}>
        <div className={styles.fallback}>Turn on Google Maps key to use live navigation.</div>
      </div>
    );
  }

  return (
    <div className={`${styles.root} liveNavigation ${fullscreen ? styles.fullscreen : ""}`}>
      <Map
        defaultCenter={center}
        defaultZoom={16}
        mapTypeId={mapType}
        gestureHandling="greedy"
        mapTypeControl={false}
        zoomControl={!isMobile}
        scaleControl={!isMobile}
        rotateControl={!isMobile}
        streetViewControl={false}
        fullscreenControl={false}
        clickableIcons
        style={{ width: "100%", height: "100%" }}
        onDragstart={() => setFollow(false)}
      >
        {mapType === "roadmap" && <TrafficLayer />}
        <NavRoute origin={routeOrigin} destination={target} />
        <FollowCamera driver={driver} heading={telemetry?.heading ?? null} follow={follow} />
        {pickupCoords && <Marker position={pickupCoords} title={pickup?.address ?? "Pickup"} label="A" />}
        {destinationCoords && <Marker position={destinationCoords} title={destination?.address ?? "Drop-off"} label="B" />}
        {driverCoords && <DriverArrowMarker position={driverCoords} heading={telemetry?.heading ?? null} />}
      </Map>

      <div className={styles.hud}>
        <div className={styles.speedCard}>
          <div className={styles.speedValue}>{formatSpeed(telemetry?.speedMps)}</div>
          <div className={styles.speedUnit}>km/h</div>
        </div>
        <div className={styles.tripCard}>
          <div className={styles.tripEyebrow}>{navigateTo === "dropoff" ? "To drop-off" : "To pickup"}</div>
          <div className={styles.tripTitle}>{stopLabel || target?.address || "Next stop"}</div>
          <div className={styles.tripMeta}>
            {etaHint ? `${formatDistance(etaHint.km)} · ~${formatEtaLong(etaHint.minutes)}` : "Calculating route…"}
            {telemetry?.accuracy != null ? ` · ±${Math.round(telemetry.accuracy)}m` : ""}
          </div>
        </div>
      </div>

      <div className={styles.mapButtons}>
        {onClose && (
          <button type="button" className={styles.roundBtn} onClick={onClose} aria-label="Exit navigation">
            ×
          </button>
        )}
        <button
          type="button"
          className={`${styles.roundBtn} ${styles.mapTypeBtn} ${mapType === "hybrid" ? styles.mapTypeBtnActive : ""}`}
          onClick={() => setMapType((current) => (current === "hybrid" ? "roadmap" : "hybrid"))}
          aria-label={mapType === "hybrid" ? "Show map view" : "Show satellite view"}
          aria-pressed={mapType === "hybrid"}
        >
          {mapType === "hybrid" ? "Map" : "Sat"}
        </button>
        {!follow && (
          <button type="button" className={styles.roundBtn} onClick={() => setFollow(true)} aria-label="Recenter on me">
            ◎
          </button>
        )}
        {onOpenExternalNav && (
          <button type="button" className={styles.roundBtn} onClick={onOpenExternalNav} aria-label="Open in Google Maps">
            ↗
          </button>
        )}
        {onToggleFullscreen && (
          <button type="button" className={`${styles.roundBtn} ${styles.fullscreenToggle}`} onClick={onToggleFullscreen}>
            {fullscreen ? "Exit full" : "Full screen"}
          </button>
        )}
      </div>

      <div className={styles.navPanel}>
        <div className={styles.navPanelTop}>
          <div className={styles.navPanelCopy}>
            <div className={styles.navPanelEyebrow}>
              <span className={styles.liveDot} />
              Live navigation
            </div>
            <div className={styles.navPanelTitle}>
              {navigateTo === "dropoff" ? "Drive to drop-off" : "Drive to pickup"}
            </div>
            <div className={styles.navPanelAddress}>{stopLabel || target?.address || "Next stop"}</div>
          </div>
          <div className={styles.navPanelEta}>
            <strong>{etaHint ? formatEtaShort(etaHint.minutes) : "—"}</strong>
            <span>ETA</span>
          </div>
        </div>

        {primaryActionLabel && onPrimaryAction && (
          <button
            type="button"
            className={styles.primaryAction}
            onClick={onPrimaryAction}
            disabled={primaryActionBusy}
          >
            {primaryActionBusy ? "Updating…" : primaryActionLabel}
          </button>
        )}

        <div className={styles.secondaryActions}>
          {onMessage && (
            <button type="button" onClick={onMessage}>
              Message
            </button>
          )}
          {onOpenDetails && (
            <button type="button" onClick={onOpenDetails}>
              Job details
            </button>
          )}
          {onOpenExternalNav && (
            <button type="button" onClick={onOpenExternalNav}>
              Google Maps
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
