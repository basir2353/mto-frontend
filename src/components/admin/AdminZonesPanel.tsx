"use client";

import { useEffect, useState } from "react";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { TextInput } from "@/components/FormControls";
import LocationField from "@/components/maps/LocationField";
import { zonesApi, type ServiceZone } from "@/lib/api";
import { hasGoogleMaps } from "@/lib/env";
import { CANADA_BOUNDS, type MapPlace } from "@/lib/maps";
import styles from "./AdminZonesPanel.module.css";

type ZoneFormState = {
  name: string;
  description: string;
  locationLabel: string;
  lat: string;
  lng: string;
  radiusKm: string;
  baseFee: string;
  multiplier: string;
};

const DEFAULT_FORM: ZoneFormState = {
  name: "",
  description: "",
  locationLabel: "Toronto, ON, Canada",
  lat: "43.6532",
  lng: "-79.3832",
  radiusKm: "40",
  baseFee: "25",
  multiplier: "1.35",
};

function circleCoords(zone: ServiceZone) {
  const boundary = zone.boundary?.coordinates;
  if (!boundary || Array.isArray(boundary)) return null;
  return boundary;
}

function formFromZone(zone: ServiceZone): ZoneFormState {
  const coords = circleCoords(zone);
  return {
    name: zone.name,
    description: zone.description ?? "",
    locationLabel: zone.name,
    lat: coords ? String(coords.lat) : DEFAULT_FORM.lat,
    lng: coords ? String(coords.lng) : DEFAULT_FORM.lng,
    radiusKm: coords ? String(coords.radiusKm) : DEFAULT_FORM.radiusKm,
    baseFee: String(zone.baseFee),
    multiplier: String(zone.basePriceMultiplier),
  };
}

export function AdminZonesPanel({
  onError,
  onUpdated,
}: {
  onError: (msg: string) => void;
  onUpdated?: () => void;
}) {
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneFormState>(DEFAULT_FORM);

  const setField = <K extends keyof ZoneFormState>(key: K, value: ZoneFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const load = async () => {
    setLoading(true);
    try {
      try {
        setZones(await zonesApi.listManaged());
      } catch {
        setZones(await zonesApi.list());
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not load zones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const applyPlace = (place: MapPlace) => {
    setForm((prev) => ({
      ...prev,
      locationLabel: place.address,
      lat: place.lat != null ? place.lat.toFixed(6) : prev.lat,
      lng: place.lng != null ? place.lng.toFixed(6) : prev.lng,
      name: prev.name.trim() ? prev.name : place.address.split(",")[0]?.trim() || prev.name,
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    const radiusKm = Number(form.radiusKm);
    const baseFee = Number(form.baseFee);
    const basePriceMultiplier = Number(form.multiplier);

    if (!form.name.trim()) {
      onError("Zone name is required");
      return;
    }
    if (![lat, lng, radiusKm, baseFee, basePriceMultiplier].every(Number.isFinite)) {
      onError("Enter a valid map location, radius, and rates");
      return;
    }
    if (radiusKm < 1 || radiusKm > 40) {
      onError("Zone radius must be between 1 and 40 km");
      return;
    }

    const duplicate = zones.find(
      (z) => z.id !== editingId && z.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
    );
    if (duplicate) {
      onError(`A zone named "${duplicate.name}" already exists. Click Edit all fields on that zone to update it.`);
      return;
    }

    setBusy(true);
    onError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        boundary: {
          type: "circle" as const,
          coordinates: { lat, lng, radiusKm },
        },
        baseFee,
        basePriceMultiplier,
        isActive: true,
        isAvailable: true,
      };

      if (editingId) {
        const existing = zones.find((z) => z.id === editingId);
        await zonesApi.update(editingId, {
          ...payload,
          isActive: existing?.isActive ?? true,
          isAvailable: existing?.isAvailable ?? true,
        });
      } else {
        await zonesApi.create(payload);
      }

      resetForm();
      await load();
      onUpdated?.();
    } catch (err) {
      onError(err instanceof Error ? err.message : editingId ? "Could not update zone" : "Could not create zone");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (zone: ServiceZone) => {
    setEditingId(zone.id);
    setForm(formFromZone(zone));
    onError("");
  };

  const toggle = async (zone: ServiceZone, field: "isActive" | "isAvailable") => {
    setBusy(true);
    onError("");
    try {
      await zonesApi.update(zone.id, { [field]: !zone[field] });
      await load();
      onUpdated?.();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not update zone");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this zone?")) return;
    setBusy(true);
    onError("");
    try {
      await zonesApi.remove(id);
      if (editingId === id) resetForm();
      await load();
      onUpdated?.();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not delete zone");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <ZonePricingPreview />
      <div className={styles.layout} style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
        <form
          className={styles.form}
          onSubmit={save}
          style={{
            flex: "1 1 360px",
            maxWidth: 480,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "#fff",
            border: "1.5px solid rgba(0,0,0,.1)",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <div>
            <h3 style={{ margin: 0, font: "800 18px 'Archivo'" }}>
              {editingId ? "Update service zone" : "Create service zone"}
            </h3>
            <p style={{ margin: "6px 0 0", font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>
              Search a Canadian place or click the map. You can update name, location, radius, and rates anytime.
            </p>
          </div>

          <TextInput label="Zone name" value={form.name} onChange={(v) => setField("name", v)} placeholder="Greater Toronto Area" />
          <TextInput
            label="Description"
            value={form.description}
            onChange={(v) => setField("description", v)}
            placeholder="Primary launch zone"
          />

          <LocationField
            label="Zone location (maps)"
            value={form.locationLabel}
            onChange={(value) => setField("locationLabel", value)}
            onPlaceSelect={applyPlace}
            placeholder="Search city or address in Canada"
          />

          <div className={styles.twoColumns} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <TextInput label="Center lat" value={form.lat} onChange={(v) => setField("lat", v)} />
            <TextInput label="Center lng" value={form.lng} onChange={(v) => setField("lng", v)} />
          </div>

          <TextInput label="Radius (km)" value={form.radiusKm} onChange={(v) => setField("radiusKm", v)} />

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "#f8f7f2",
              border: "1px solid rgba(0,0,0,.08)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90" }}>
              Map radius
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={form.radiusKm}
              onChange={(e) => setField("radiusKm", e.target.value)}
            />
            <div style={{ font: "600 12px 'Hanken Grotesk'", color: "#6B6B70" }}>
              Radius: {Number(form.radiusKm || 0).toFixed(0)} km (max 40). Search a place or click the map to move the center.
            </div>
          </div>

          <div className={styles.twoColumns} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <TextInput label="Base fee ($)" value={form.baseFee} onChange={(v) => setField("baseFee", v)} />
            <TextInput label="Price multiplier" value={form.multiplier} onChange={(v) => setField("multiplier", v)} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 12,
                border: "none",
                background: "var(--accent)",
                font: "800 15px 'Archivo'",
                cursor: busy ? "wait" : "pointer",
              }}
            >
              {busy ? "Saving…" : editingId ? "Update zone" : "Create zone"}
            </button>
            {editingId && (
              <button
                type="button"
                disabled={busy}
                onClick={resetForm}
                style={{
                  height: 46,
                  padding: "0 16px",
                  borderRadius: 12,
                  border: "1.5px solid rgba(0,0,0,.14)",
                  background: "#fff",
                  font: "700 13px 'Hanken Grotesk'",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div style={{ flex: "1 1 420px", minWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, padding: "20px 22px" }}>
            <h3 style={{ margin: 0, font: "800 18px 'Archivo'" }}>Zone map</h3>
            <p style={{ margin: "6px 0 14px", font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>
              Location field and map stay in sync. Service area is locked to Canada.
            </p>
            <ZoneDraftMap
              lat={Number(form.lat)}
              lng={Number(form.lng)}
              radiusKm={Number(form.radiusKm)}
              onChange={(nextLat, nextLng) => {
                setForm((prev) => ({
                  ...prev,
                  lat: nextLat.toFixed(6),
                  lng: nextLng.toFixed(6),
                  locationLabel: `${nextLat.toFixed(4)}, ${nextLng.toFixed(4)}`,
                }));
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? (
              <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#8A8A90" }}>Loading zones…</div>
            ) : zones.length === 0 ? (
              <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#8A8A90" }}>No zones configured.</div>
            ) : (
              zones.map((z) => (
                <ZoneCard
                  key={z.id}
                  zone={z}
                  busy={busy}
                  editing={editingId === z.id}
                  onEdit={startEdit}
                  onToggle={toggle}
                  onRemove={remove}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ZonePricingPreview() {
  const [locationLabel, setLocationLabel] = useState("Toronto, ON, Canada");
  const [lat, setLat] = useState("43.6532");
  const [lng, setLng] = useState("-79.3832");
  const [distanceKm, setDistanceKm] = useState("12");
  const [result, setResult] = useState<{ covered: boolean; total?: number; subtotal?: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const preview = async () => {
    setBusy(true);
    try {
      const check = await zonesApi.check(Number(lat), Number(lng));
      if (!check.covered) {
        setResult({ covered: false });
        return;
      }
      const pricing = await zonesApi.pricing(Number(lat), Number(lng), Number(distanceKm));
      setResult({ covered: true, total: Number(pricing.total), subtotal: Number(pricing.subtotal ?? pricing.total) });
    } catch {
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.preview} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, padding: "20px 22px" }}>
      <h3 style={{ margin: "0 0 6px", font: "800 18px 'Archivo'" }}>Rate preview calculator</h3>
      <p style={{ margin: "0 0 16px", font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>
        Search a map location to preview what a customer would pay before changing zone settings.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 2fr) repeat(auto-fit, minmax(120px, 1fr))", gap: 12, alignItems: "end" }}>
        <LocationField
          label="Preview location"
          value={locationLabel}
          onChange={setLocationLabel}
          onPlaceSelect={(place) => {
            setLocationLabel(place.address);
            if (place.lat != null) setLat(place.lat.toFixed(6));
            if (place.lng != null) setLng(place.lng.toFixed(6));
          }}
          placeholder="Search Canadian address"
        />
        <TextInput label="Latitude" value={lat} onChange={setLat} />
        <TextInput label="Longitude" value={lng} onChange={setLng} />
        <TextInput label="Trip km" value={distanceKm} onChange={setDistanceKm} />
        <button
          type="button"
          onClick={() => void preview()}
          disabled={busy}
          style={{
            height: 42,
            borderRadius: 10,
            border: "none",
            background: "#0E0E10",
            color: "#fff",
            font: "700 13px 'Hanken Grotesk'",
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "Calculating…" : "Preview price"}
        </button>
      </div>
      {result && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 12,
            background: result.covered ? "#e7f5ea" : "#fff4df",
            font: "600 14px 'Hanken Grotesk'",
          }}
        >
          {result.covered
            ? `Covered zone · Estimated total $${result.total?.toFixed(2)}${result.subtotal != null ? ` (subtotal $${result.subtotal.toFixed(2)})` : ""}`
            : "Location is outside all active zones."}
        </div>
      )}
    </div>
  );
}

function ZoneDraftMap({
  lat,
  lng,
  radiusKm,
  onChange,
}: {
  lat: number;
  lng: number;
  radiusKm: number;
  onChange: (lat: number, lng: number) => void;
}) {
  if (!hasGoogleMaps || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div
        style={{
          height: 320,
          borderRadius: 14,
          border: "1.5px dashed rgba(0,0,0,.16)",
          background: "#f8f7f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 20,
          font: "600 13px 'Hanken Grotesk'",
          color: "#6B6B70",
        }}
      >
        Google Maps preview is unavailable. Use the location search field to place the zone inside Canada.
      </div>
    );
  }

  return (
    <div style={{ height: 320, borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(0,0,0,.08)" }}>
      <Map
        defaultCenter={{ lat, lng }}
        defaultZoom={9}
        gestureHandling="greedy"
        disableDefaultUI={false}
        restriction={{ latLngBounds: CANADA_BOUNDS, strictBounds: true }}
        onClick={(event) => {
          const coords = event.detail.latLng;
          if (!coords) return;
          onChange(coords.lat, coords.lng);
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoneDraftCircle lat={lat} lng={lng} radiusKm={radiusKm} />
        <Marker position={{ lat, lng }} title="Zone center" />
      </Map>
    </div>
  );
}

function ZoneDraftCircle({
  lat,
  lng,
  radiusKm,
}: {
  lat: number;
  lng: number;
  radiusKm: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === "undefined" || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const circle = new google.maps.Circle({
      map,
      center: { lat, lng },
      radius: Math.max(radiusKm, 1) * 1000,
      fillColor: "#ffde2e",
      fillOpacity: 0.22,
      strokeColor: "#0E0E10",
      strokeOpacity: 0.8,
      strokeWeight: 2,
    });

    map.setCenter({ lat, lng });

    return () => {
      circle.setMap(null);
    };
  }, [lat, lng, map, radiusKm]);

  return null;
}

function ZoneCard({
  zone,
  busy,
  editing,
  onEdit,
  onToggle,
  onRemove,
}: {
  zone: ServiceZone;
  busy: boolean;
  editing: boolean;
  onEdit: (zone: ServiceZone) => void;
  onToggle: (zone: ServiceZone, field: "isActive" | "isAvailable") => void;
  onRemove: (id: string) => void;
}) {
  const coords = circleCoords(zone);
  const center = coords ? `${coords.lat}, ${coords.lng} · ${coords.radiusKm}km` : "Custom boundary";

  return (
    <div
      className={styles.zoneCard}
      style={{
        background: "#fff",
        border: editing ? "1.5px solid #0E0E10" : "1.5px solid rgba(0,0,0,.1)",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <div className={styles.zoneHeading} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ font: "800 16px 'Archivo'" }}>{zone.name}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <Chip active={zone.isActive} label={zone.isActive ? "Active" : "Inactive"} onClick={() => onToggle(zone, "isActive")} />
          <Chip
            active={zone.isAvailable}
            label={zone.isAvailable ? "Available" : "Unavailable"}
            onClick={() => onToggle(zone, "isAvailable")}
          />
        </div>
      </div>
      {zone.description && (
        <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 6 }}>{zone.description}</div>
      )}
      <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8A8A90", marginTop: 8 }}>{center}</div>
      <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#3a3a40", marginTop: 8 }}>
        Base fee ${Number(zone.baseFee).toFixed(2)} · Multiplier {Number(zone.basePriceMultiplier).toFixed(2)}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => onEdit(zone)}
          style={{
            height: 40,
            padding: "0 14px",
            borderRadius: 10,
            border: "none",
            background: editing ? "var(--accent)" : "#0E0E10",
            color: editing ? "#0E0E10" : "#fff",
            font: "700 13px 'Hanken Grotesk'",
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {editing ? "Editing…" : "Edit all fields"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onRemove(zone.id)}
          style={{
            height: 40,
            padding: "0 14px",
            borderRadius: 10,
            border: "none",
            background: "transparent",
            color: "#a8442a",
            font: "700 13px 'Hanken Grotesk'",
            cursor: "pointer",
          }}
        >
          Delete zone
        </button>
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 28,
        padding: "0 10px",
        borderRadius: 999,
        border: "none",
        background: active ? "#e7f5ea" : "#fff4df",
        color: active ? "#1f6b1f" : "#8a5a00",
        font: "700 11px 'Hanken Grotesk'",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
