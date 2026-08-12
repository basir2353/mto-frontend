"use client";

import { useEffect, useRef } from "react";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { hasGoogleMaps } from "@/lib/env";
import {
  DEFAULT_MAP_CENTER,
  mapCenterFromPlaces,
  mapZoomFromPlaces,
  toLatLng,
  type MapPlace,
} from "@/lib/maps";

type RouteMapProps = {
  pickup?: MapPlace | null;
  destination?: MapPlace | null;
  driver?: MapPlace | null;
  nearbyMovers?: Array<MapPlace & { id?: string }>;
  className?: string;
  style?: React.CSSProperties;
  fallbackLabel?: string;
  showRoute?: boolean;
};

const fallbackMapStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "repeating-linear-gradient(0deg, transparent 0 78px, rgba(0,0,0,.04) 78px 79px), repeating-linear-gradient(90deg, transparent 0 78px, rgba(0,0,0,.04) 78px 79px)",
};

/** Map/Satellite under zoom (+/−) on the right, Google-style spacing. */
function MapControlsBottomRight() {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps?.ControlPosition) return;

    map.setOptions({
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
    });

    const wrap = document.createElement("div");
    wrap.className = "mto-map-type-ctrl";
    wrap.style.cssText = [
      "margin:10px 10px 10px 0",
      "display:flex",
      "background:#fff",
      "border-radius:8px",
      "overflow:hidden",
      "box-shadow:0 1px 4px rgba(0,0,0,.3)",
      "font:600 13px Roboto,Arial,sans-serif",
      "user-select:none",
    ].join(";");

    const mkBtn = (label: string, type: string) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.style.cssText = [
        "border:0",
        "margin:0",
        "padding:8px 12px",
        "background:transparent",
        "cursor:pointer",
        "color:#565656",
        "font:inherit",
        "line-height:1.2",
      ].join(";");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        map.setMapTypeId(type);
        paint();
      });
      return btn;
    };

    const mapBtn = mkBtn("Map", "roadmap");
    const satBtn = mkBtn("Satellite", "hybrid");
    const divider = document.createElement("div");
    divider.style.cssText = "width:1px;background:rgba(0,0,0,.12);align-self:stretch;margin:6px 0";
    wrap.append(mapBtn, divider, satBtn);

    const paint = () => {
      const id = String(map.getMapTypeId() ?? "roadmap");
      const onRoad = id === "roadmap" || id === "terrain";
      mapBtn.style.fontWeight = onRoad ? "700" : "500";
      mapBtn.style.color = onRoad ? "#0E0E10" : "#565656";
      satBtn.style.fontWeight = !onRoad ? "700" : "500";
      satBtn.style.color = !onRoad ? "#0E0E10" : "#565656";
    };
    paint();

    const controls = map.controls[google.maps.ControlPosition.RIGHT_BOTTOM];
    // index 0 = bottom of stack → sits under +/- with same right gutter
    controls.insertAt(0, wrap);

    const listener = map.addListener("maptypeid_changed", paint);

    return () => {
      google.maps.event.removeListener(listener);
      for (let i = controls.getLength() - 1; i >= 0; i -= 1) {
        if (controls.getAt(i) === wrap) {
          controls.removeAt(i);
          break;
        }
      }
    };
  }, [map]);

  return null;
}

function FitBounds({
  pickup,
  destination,
  driver,
}: {
  pickup?: MapPlace | null;
  destination?: MapPlace | null;
  driver?: MapPlace | null;
}) {
  const map = useMap();
  const pickupCoords = toLatLng(pickup);
  const destinationCoords = toLatLng(destination);
  const driverCoords = toLatLng(driver);
  const pickupLat = pickupCoords?.lat;
  const pickupLng = pickupCoords?.lng;
  const destinationLat = destinationCoords?.lat;
  const destinationLng = destinationCoords?.lng;
  const driverLat = driverCoords?.lat;
  const driverLng = driverCoords?.lng;

  useEffect(() => {
    if (!map) return;

    const points = [
      pickupLat != null && pickupLng != null ? { lat: pickupLat, lng: pickupLng } : null,
      destinationLat != null && destinationLng != null ? { lat: destinationLat, lng: destinationLng } : null,
      driverLat != null && driverLng != null ? { lat: driverLat, lng: driverLng } : null,
    ].filter((point): point is { lat: number; lng: number } => point != null);

    if (points.length === 0) return;

    // Zoom only to the active trip points — nearby movers stay visible as markers
    // but must not pull the camera out to a city/world view.
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const point of points) bounds.extend(point);
    map.fitBounds(bounds, { top: 56, right: 48, bottom: 56, left: 48 });
    const listener = google.maps.event.addListenerOnce(map, "idle", () => {
      const z = map.getZoom();
      if (z == null) return;
      // Keep route annotations readable — avoid city-wide zoom-out and street-level noise.
      if (z < 11) map.setZoom(11);
      if (z > 15) map.setZoom(15);
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, pickupLat, pickupLng, destinationLat, destinationLng, driverLat, driverLng]);

  return null;
}

function DrivingRoute({
  pickup,
  destination,
}: {
  pickup?: MapPlace | null;
  destination?: MapPlace | null;
}) {
  const map = useMap();
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const pickupCoords = toLatLng(pickup);
  const destinationCoords = toLatLng(destination);

  useEffect(() => {
    if (!map || !pickupCoords || !destinationCoords) return;
    if (typeof google === "undefined" || !google.maps?.DirectionsService) return;

    const renderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: "#1d4ed8",
        strokeWeight: 5,
        strokeOpacity: 0.9,
      },
    });
    rendererRef.current = renderer;

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: pickupCoords,
        destination: destinationCoords,
        travelMode: google.maps.TravelMode.DRIVING,
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
  }, [map, pickupCoords?.lat, pickupCoords?.lng, destinationCoords?.lat, destinationCoords?.lng]);

  return null;
}

export default function RouteMap({
  pickup,
  destination,
  driver,
  nearbyMovers,
  style,
  fallbackLabel = "Map preview",
  showRoute = false,
}: RouteMapProps) {
  if (!hasGoogleMaps) {
    return (
      <div style={{ ...fallbackMapStyle, ...style }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            font: "600 13px var(--font-hanken)",
            color: "#6B6B70",
          }}
        >
          {fallbackLabel}
        </div>
      </div>
    );
  }

  const pickupCoords = toLatLng(pickup);
  const destinationCoords = toLatLng(destination);
  const driverCoords = toLatLng(driver);
  const center = mapCenterFromPlaces(pickup, destination);
  const zoom = mapZoomFromPlaces(pickup, destination);
  const safeCenter =
    center && Number.isFinite(center.lat) && Number.isFinite(center.lng) ? center : DEFAULT_MAP_CENTER;
  const shouldShowRoute = showRoute || Boolean(pickupCoords && destinationCoords);

  return (
    <div style={{ position: "absolute", inset: 0, ...style }}>
      <Map
        defaultCenter={safeCenter}
        defaultZoom={zoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        zoomControl
        scaleControl
        streetViewControl={false}
        fullscreenControl={false}
        clickableIcons={false}
        style={{ width: "100%", height: "100%" }}
      >
        <MapControlsBottomRight />
        <FitBounds pickup={pickup} destination={destination} driver={driver} />
        {shouldShowRoute && <DrivingRoute pickup={pickup} destination={destination} />}
        {pickupCoords && <Marker position={pickupCoords} title={pickup?.address ?? "Pickup"} label={{ text: "P", color: "#0E0E10", fontWeight: "800" }} />}
        {destinationCoords && (
          <Marker position={destinationCoords} title={destination?.address ?? "Destination"} label={{ text: "D", color: "#0E0E10", fontWeight: "800" }} />
        )}
        {driverCoords && <Marker position={driverCoords} title={driver?.address ?? "Driver"} label={{ text: "M", color: "#0E0E10", fontWeight: "800" }} />}
        {(nearbyMovers ?? []).map((mover, index) => {
          const coords = toLatLng(mover);
          if (!coords) return null;
          return (
            <Marker
              key={mover.id ?? `${mover.address}-${index}`}
              position={coords}
              title={mover.address || "Nearby mover"}
            />
          );
        })}
      </Map>
    </div>
  );
}
