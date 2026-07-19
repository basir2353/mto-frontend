"use client";

import { useEffect, useState } from "react";
import { TextInput } from "@/components/FormControls";
import { zonesApi, type ServiceZone } from "@/lib/api";
import styles from "./AdminZonesPanel.module.css";

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("43.6532");
  const [lng, setLng] = useState("-79.3832");
  const [radiusKm, setRadiusKm] = useState("45");
  const [baseFee, setBaseFee] = useState("25");
  const [multiplier, setMultiplier] = useState("1.35");

  const load = async () => {
    setLoading(true);
    try {
      setZones(await zonesApi.list());
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not load zones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    onError("");
    try {
      await zonesApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        boundary: {
          type: "circle",
          coordinates: { lat: Number(lat), lng: Number(lng), radiusKm: Number(radiusKm) },
        },
        baseFee: Number(baseFee),
        basePriceMultiplier: Number(multiplier),
        isActive: true,
        isAvailable: true,
      });
      setName("");
      setDescription("");
      await load();
      onUpdated?.();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not create zone");
    } finally {
      setBusy(false);
    }
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

  const updateRate = async (zone: ServiceZone, nextFee: string, nextMult: string) => {
    setBusy(true);
    onError("");
    try {
      await zonesApi.update(zone.id, {
        baseFee: Number(nextFee),
        basePriceMultiplier: Number(nextMult),
      });
      await load();
      onUpdated?.();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not update rates");
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
      <form className={styles.form} onSubmit={create} style={{ flex: "1 1 360px", maxWidth: 480, display: "flex", flexDirection: "column", gap: 14, background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, padding: "20px 22px" }}>
        <div>
          <h3 style={{ margin: 0, font: "800 18px 'Archivo'" }}>Create service zone</h3>
          <p style={{ margin: "6px 0 0", font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>
            Set base fee and price multiplier to control commission and rates in each area.
          </p>
        </div>
        <TextInput label="Zone name" value={name} onChange={setName} placeholder="Greater Toronto Area" />
        <TextInput label="Description" value={description} onChange={setDescription} placeholder="Primary launch zone" />
        <div className={styles.twoColumns} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <TextInput label="Center lat" value={lat} onChange={setLat} />
          <TextInput label="Center lng" value={lng} onChange={setLng} />
        </div>
        <TextInput label="Radius (km)" value={radiusKm} onChange={setRadiusKm} />
        <div className={styles.twoColumns} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <TextInput label="Base fee ($)" value={baseFee} onChange={setBaseFee} />
          <TextInput label="Price multiplier" value={multiplier} onChange={setMultiplier} />
        </div>
        <button type="submit" disabled={busy} style={{ height: 46, borderRadius: 12, border: "none", background: "var(--accent)", font: "800 15px 'Archivo'", cursor: busy ? "wait" : "pointer" }}>
          {busy ? "Saving…" : "Create zone"}
        </button>
      </form>

      <div style={{ flex: "1 1 420px", display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#8A8A90" }}>Loading zones…</div>
        ) : zones.length === 0 ? (
          <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#8A8A90" }}>No zones configured.</div>
        ) : (
          zones.map((z) => (
            <ZoneCard key={z.id} zone={z} busy={busy} onToggle={toggle} onUpdateRate={updateRate} onRemove={remove} />
          ))
        )}
      </div>
      </div>
    </div>
  );
}

function ZonePricingPreview() {
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
        Test what a customer would pay at a location before changing zone settings.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, alignItems: "end" }}>
        <TextInput label="Latitude" value={lat} onChange={setLat} />
        <TextInput label="Longitude" value={lng} onChange={setLng} />
        <TextInput label="Trip km" value={distanceKm} onChange={setDistanceKm} />
        <button type="button" onClick={() => void preview()} disabled={busy} style={{ height: 42, borderRadius: 10, border: "none", background: "#0E0E10", color: "#fff", font: "700 13px 'Hanken Grotesk'", cursor: busy ? "wait" : "pointer" }}>
          {busy ? "Calculating…" : "Preview price"}
        </button>
      </div>
      {result && (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: result.covered ? "#e7f5ea" : "#fff4df", font: "600 14px 'Hanken Grotesk'" }}>
          {result.covered
            ? `Covered zone · Estimated total $${result.total?.toFixed(2)}${result.subtotal != null ? ` (subtotal $${result.subtotal.toFixed(2)})` : ""}`
            : "Location is outside all active zones."}
        </div>
      )}
    </div>
  );
}

function ZoneCard({
  zone,
  busy,
  onToggle,
  onUpdateRate,
  onRemove,
}: {
  zone: ServiceZone;
  busy: boolean;
  onToggle: (zone: ServiceZone, field: "isActive" | "isAvailable") => void;
  onUpdateRate: (zone: ServiceZone, fee: string, mult: string) => void;
  onRemove: (id: string) => void;
}) {
  const [fee, setFee] = useState(String(zone.baseFee));
  const [mult, setMult] = useState(String(zone.basePriceMultiplier));

  useEffect(() => {
    setFee(String(zone.baseFee));
    setMult(String(zone.basePriceMultiplier));
  }, [zone.baseFee, zone.basePriceMultiplier]);

  const boundary = zone.boundary?.coordinates;
  const center =
    boundary && !Array.isArray(boundary)
      ? `${boundary.lat}, ${boundary.lng} · ${boundary.radiusKm}km`
      : "Custom boundary";

  return (
    <div className={styles.zoneCard} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 14, padding: "16px 18px" }}>
      <div className={styles.zoneHeading} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ font: "800 16px 'Archivo'" }}>{zone.name}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <Chip active={zone.isActive} label={zone.isActive ? "Active" : "Inactive"} onClick={() => onToggle(zone, "isActive")} />
          <Chip active={zone.isAvailable} label={zone.isAvailable ? "Available" : "Unavailable"} onClick={() => onToggle(zone, "isAvailable")} />
        </div>
      </div>
      {zone.description && <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 6 }}>{zone.description}</div>}
      <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8A8A90", marginTop: 8 }}>{center}</div>

      <div className={styles.rateGrid} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginTop: 14, alignItems: "end" }}>
        <TextInput label="Base fee" value={fee} onChange={setFee} />
        <TextInput label="Multiplier" value={mult} onChange={setMult} />
        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdateRate(zone, fee, mult)}
          style={{ height: 42, padding: "0 14px", borderRadius: 10, border: "none", background: "#0E0E10", color: "#fff", font: "700 13px 'Hanken Grotesk'", cursor: busy ? "wait" : "pointer" }}
        >
          Save rates
        </button>
      </div>

      <button type="button" disabled={busy} onClick={() => onRemove(zone.id)} style={{ marginTop: 12, border: "none", background: "transparent", color: "#a8442a", font: "700 13px 'Hanken Grotesk'", cursor: "pointer" }}>
        Delete zone
      </button>
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
