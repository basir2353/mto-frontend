"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RouteMap from "@/components/maps/RouteMap";
import { useGeocodedPlace } from "@/hooks/useGeocodedPlace";
import { bookingsApi, type BookingTracking } from "@/lib/api";
import type { MapPlace } from "@/lib/maps";

function addressPlace(address?: Record<string, unknown> | null): MapPlace | null {
  if (!address) return null;
  const label = String(address.formattedAddress ?? address.street ?? address.address ?? "").trim();
  const latitude = Number(address.latitude ?? address.lat);
  const longitude = Number(address.longitude ?? address.lng);
  return {
    address: label,
    ...(Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { lat: latitude, lng: longitude }
      : {}),
  };
}

export default function SharedTrackingPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [tracking, setTracking] = useState<BookingTracking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setTracking(await bookingsApi.getSharedTracking(token));
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This tracking link is invalid or expired.");
    }
  }, [token]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 10_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  const pickup = useGeocodedPlace(addressPlace(tracking?.pickupAddress));
  const destination = useGeocodedPlace(addressPlace(tracking?.destinationAddress));
  const latitude = Number(tracking?.currentLocation?.latitude);
  const longitude = Number(tracking?.currentLocation?.longitude);
  const driver =
    Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { address: tracking?.mover?.businessName ?? "Mover", lat: latitude, lng: longitude }
      : null;

  if (error) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#F5F4EF" }}>
        <div style={{ maxWidth: 520, padding: 28, borderRadius: 18, background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", textAlign: "center" }}>
          <h1 style={{ margin: "0 0 10px", font: "900 28px var(--font-archivo)" }}>Tracking unavailable</h1>
          <p style={{ margin: 0, color: "#6B6B70", font: "500 15px/1.5 var(--font-hanken)" }}>{error}</p>
        </div>
      </main>
    );
  }

  if (!tracking) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F5F4EF", font: "700 15px var(--font-hanken)" }}>
        Loading live tracking…
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F5F4EF", padding: 20 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ marginBottom: 16 }}>
          <div style={{ font: "900 23px var(--font-archivo)" }}>MoveThisOut</div>
          <div style={{ color: "#6B6B70", font: "600 13px var(--font-hanken)" }}>Shared live tracking · read only</div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: 16 }}>
          <section style={{ padding: 22, borderRadius: 18, background: "#fff", border: "1.5px solid rgba(0,0,0,.1)" }}>
            <div style={{ display: "inline-flex", padding: "6px 10px", borderRadius: 999, background: "var(--accent)", font: "800 11px var(--font-hanken)", marginBottom: 14 }}>
              {tracking.status.replace(/_/g, " ").toUpperCase()}
            </div>
            <h1 style={{ margin: "0 0 6px", font: "900 27px var(--font-archivo)" }}>{tracking.mover?.businessName ?? "Your mover"}</h1>
            <p style={{ margin: "0 0 20px", color: "#6B6B70", font: "500 14px var(--font-hanken)" }}>
              Last updated {tracking.lastUpdatedAt ? new Date(tracking.lastUpdatedAt).toLocaleString() : "just now"}
            </p>

            <RouteRow label="Pickup" value={pickup?.address || "Pickup location"} />
            <RouteRow label="Destination" value={destination?.address || "Destination"} />

            <div style={{ marginTop: 22, font: "800 13px var(--font-archivo)" }}>Move progress</div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {tracking.events.length ? tracking.events.slice(-6).reverse().map((event) => (
                <div key={event.id} style={{ padding: "10px 12px", borderRadius: 10, background: "#F5F4EF" }}>
                  <div style={{ font: "700 13px var(--font-hanken)" }}>{event.status.replace(/_/g, " ")}</div>
                  <div style={{ color: "#8A8A90", font: "500 11px var(--font-hanken)", marginTop: 3 }}>
                    {new Date(event.createdAt).toLocaleString()}
                  </div>
                </div>
              )) : (
                <div style={{ color: "#8A8A90", font: "500 13px var(--font-hanken)" }}>Waiting for the next update.</div>
              )}
            </div>
          </section>

          <section style={{ minHeight: 560, position: "relative", overflow: "hidden", borderRadius: 18, background: "#e8e8e3", border: "1.5px solid rgba(0,0,0,.1)" }}>
            <RouteMap pickup={pickup} destination={destination} driver={driver} showRoute fallbackLabel="Live map unavailable" />
          </section>
        </div>
      </div>
      <style>{`
        @media(max-width:760px){
          main>div>div{grid-template-columns:1fr!important}
          main>div>div>section:last-child{min-height:420px!important}
        }
      `}</style>
    </main>
  );
}

function RouteRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: "#8A8A90", font: "800 10px var(--font-hanken)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ font: "600 14px/1.35 var(--font-hanken)" }}>{value}</div>
    </div>
  );
}
