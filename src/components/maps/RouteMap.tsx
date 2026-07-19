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
            font: "600 13px 'Hanken Grotesk'",
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
        mapTypeControl
        zoomControl
        scaleControl
        streetViewControl={false}
        fullscreenControl={false}
        clickableIcons
        style={{ width: "100%", height: "100%" }}
      >
        <FitBounds pickup={pickup} destination={destination} driver={driver} />
        {shouldShowRoute && <DrivingRoute pickup={pickup} destination={destination} />}
        {pickupCoords && <Marker position={pickupCoords} title={pickup?.address ?? "Pickup"} />}
        {destinationCoords && (
          <Marker position={destinationCoords} title={destination?.address ?? "Destination"} />
        )}
        {driverCoords && <Marker position={driverCoords} title={driver?.address ?? "Driver"} />}
        {(nearbyMovers ?? []).map((mover, index) => {
          const coords = toLatLng(mover);
          if (!coords) return null;
          return (
            <Marker
              key={mover.id ?? `${mover.address}-${index}`}
              position={coords}
              title={mover.address}
            />
          );
        })}
      </Map>
    </div>
  );
}
