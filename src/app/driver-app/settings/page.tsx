"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { ChipToggle, FieldLabel, TextInput } from "@/components/FormControls";
import { PhoneInput, isValidNationalPhone, parsePhoneValue } from "@/components/PhoneInput";
import LocationField from "@/components/maps/LocationField";
import RouteMap from "@/components/maps/RouteMap";
import { BlockLoader } from "@/components/ui/MtoLoader";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { moversApi, uploadsApi, verificationApi, vehiclesApi } from "@/lib/api";
import type { DocumentType, VehicleType } from "@/lib/api";
import type { MoverProfile } from "@/lib/api/types";
import type { MapPlace } from "@/lib/maps";
import { toFiniteCoord, toLatLng } from "@/lib/maps";
import styles from "./DriverSettings.module.css";

const DOC_DEFS = [
  { type: "licence", label: "Driver's licence" },
  { type: "insurance", label: "Vehicle insurance" },
  { type: "vehiclePhoto", label: "Photo of your vehicle" },
] as const;

type DocType = (typeof DOC_DEFS)[number]["type"];
type PendingDoc = { name: string; file: File };

function parseVehicleBio(bio?: string | null) {
  const defaults = {
    vehicleType: "Cargo van",
    make: "",
    model: "",
    year: "",
    helpers: "Just me",
  };
  if (!bio?.trim()) return defaults;

  const parts = bio.split(" · ").map((s) => s.trim());
  const vehicleType = parts[0] || defaults.vehicleType;
  const makeModelYear = parts[1] || "";
  const helpers = parts.length >= 4 ? parts[3] || defaults.helpers : parts[2] || defaults.helpers;

  const match = makeModelYear.match(/^(.+?)\s+(\d{4})$/);
  if (match) {
    const words = match[1].trim().split(/\s+/);
    return {
      vehicleType,
      make: words[0] || "",
      model: words.slice(1).join(" "),
      year: match[2],
      helpers,
    };
  }

  return { vehicleType, make: makeModelYear, model: "", year: "", helpers };
}

function buildVehicleBio(input: {
  vehicleType: string;
  make: string;
  model: string;
  year: string;
  helpers: string;
}) {
  const vehicle = [input.make, input.model, input.year].filter(Boolean).join(" ");
  return `${input.vehicleType} · ${vehicle} · ${input.helpers}`;
}

function vehicleCapacityHint(v: VehicleType) {
  const parts: string[] = [];
  if (v.maxVolumeM3) parts.push(`${v.maxVolumeM3} m³`);
  if (v.maxWeightKg) parts.push(`${Math.round(v.maxWeightKg)} kg`);
  return parts.join(" · ");
}

export default function DriverSettingsPage() {
  return (
    <AuthGuard roles={["mover"]}>
      <DriverSettingsContent />
    </AuthGuard>
  );
}

function DriverSettingsContent() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [helpers, setHelpers] = useState("Just me");

  const [baseLocation, setBaseLocation] = useState("");
  const [baseLocationPlace, setBaseLocationPlace] = useState<MapPlace>({ address: "" });

  const [existingDocs, setExistingDocs] = useState<Array<{ type: string; url: string; status?: string }>>([]);
  const [pendingDocs, setPendingDocs] = useState<Partial<Record<DocType, PendingDoc>>>({});

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [profile, types] = await Promise.all([
          moversApi.getProfile(),
          vehiclesApi.listTypes().catch(() => [] as VehicleType[]),
        ]);
        if (cancelled) return;
        const active = types.filter((t) => t.isActive);
        setVehicleTypes(active);
        applyProfile(profile, active);
      } catch {
        const fallback = user?.moverProfile;
        if (fallback) applyProfile(fallback);
        else if (!cancelled) setError("Could not load your profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.moverProfile]);

  const applyProfile = (profile: MoverProfile, types: VehicleType[] = vehicleTypes) => {
    setBusinessName(profile.businessName || "");
    setPhone(profile.phone || "");
    setAvatarUrl(profile.avatarUrl || "");

    const vehicle = parseVehicleBio(profile.bio);
    setMake(vehicle.make);
    setModel(vehicle.model);
    setYear(vehicle.year);
    setHelpers(vehicle.helpers);

    const byName = types.find((t) => t.name === vehicle.vehicleType);
    setSelectedVehicleTypeId(byName?.id || types[0]?.id || "");

    const area = profile.serviceAreas?.[0] || "";
    setBaseLocation(area);
    setBaseLocationPlace({
      address: area,
      lat: toFiniteCoord(profile.latitude) ?? undefined,
      lng: toFiniteCoord(profile.longitude) ?? undefined,
    });

    setExistingDocs(profile.documents || []);
  };

  const selectedVehicleType = vehicleTypes.find((t) => t.id === selectedVehicleTypeId);
  const selectedVehicleTypeName = selectedVehicleType?.name ?? "";

  const save = async () => {
    if (!businessName.trim()) {
      setError("Business / display name is required");
      return;
    }
    if (phone.trim()) {
      const parsed = parsePhoneValue(phone, "CA");
      if (!isValidNationalPhone(parsed.iso, parsed.national)) {
        setError("Enter a valid phone number with country code.");
        return;
      }
    }

    if (!selectedVehicleTypeId) {
      setError("Select a vehicle type");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      let nextAvatarUrl = avatarUrl || undefined;
      if (avatarFile) {
        const uploaded = await uploadsApi.upload(avatarFile);
        nextAvatarUrl = uploaded.url;
      }

      const docMap = new Map(
        existingDocs.filter((d) => d.type !== "registration").map((d) => [d.type, d]),
      );
      for (const def of DOC_DEFS) {
        const pending = pendingDocs[def.type];
        if (!pending) continue;

        if (pending.file.type.startsWith("image/") || def.type === "insurance") {
          if (pending.file.type.startsWith("image/")) {
            const analyzed = await verificationApi.analyzeDocument(
              def.type as DocumentType,
              pending.file,
            );
            if (!analyzed.ok) {
              setError(analyzed.issues[0] || analyzed.summary || `${def.label} failed verification`);
              return;
            }
          }
          if (def.type === "vehiclePhoto") {
            const match = await verificationApi.matchVehicle({
              file: pending.file,
              vehicleType: selectedVehicleTypeName,
              make: make.trim() || "Unknown",
              model: model.trim() || "Unknown",
              year: year.trim() || undefined,
            });
            if (!match.ok) {
              setError(match.issues[0] || match.summary || "Vehicle photo does not match your details");
              return;
            }
          }
        }

        const uploaded = await uploadsApi.upload(pending.file);
        docMap.set(def.type, { type: def.type, url: uploaded.url });
      }
      const documents = Array.from(docMap.values());

      await moversApi.updateProfile({
        businessName: businessName.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: nextAvatarUrl,
        bio: buildVehicleBio({ vehicleType: selectedVehicleTypeName, make, model, year, helpers }),
        serviceAreas: baseLocation.trim() ? [baseLocation.trim()] : ["Local area"],
        documents,
        vehicleTypeIds: [selectedVehicleTypeId],
        latitude: baseLocationPlace.lat,
        longitude: baseLocationPlace.lng,
      });

      setAvatarFile(null);
      setPendingDocs({});
      setExistingDocs(documents);
      if (nextAvatarUrl) setAvatarUrl(nextAvatarUrl);
      await refreshUser();
      setSuccess("Profile updated successfully");
      toast.success("Profile saved", "Your driver profile was updated.");
    } catch (e) {
      if (e instanceof Error && /phone number is already registered/i.test(e.message)) {
        setError("This phone number is already registered to another account.");
        toast.error("Could not save", "This phone number is already registered to another account.");
      } else {
        const message = e instanceof Error ? e.message : "Could not save changes";
        setError(message);
        toast.error("Could not save", message);
      }
    } finally {
      setBusy(false);
    }
  };

  const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl || null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <Link
              href="/driver-app"
              style={{ color: "var(--accent)", font: "700 13px 'Hanken Grotesk'", textDecoration: "none", display: "inline-block", marginBottom: 8 }}
            >
              ← Back to driver app
            </Link>
            <h1 style={{ margin: 0, font: "800 32px 'Archivo'", letterSpacing: "-.02em" }}>Driver profile</h1>
            <p style={{ margin: "6px 0 0", font: "500 14px 'Hanken Grotesk'", color: "rgba(255,255,255,.55)" }}>
              Update your business profile, vehicle, service area, documents, and photo.
            </p>
          </div>
          <button
            type="button"
            className={`${styles.saveButton} ${styles.saveButtonDesktop}`}
            onClick={save}
            disabled={busy || loading}
            style={{
              background: busy || loading ? "rgba(255,255,255,.15)" : "var(--accent)",
              cursor: busy || loading ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>

        {loading && <BlockLoader label="Loading profile…" minHeight={180} />}

        {error && (
          <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, background: "#3a1515", color: "#ffb4b4", font: "600 14px 'Hanken Grotesk'" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, background: "rgba(255,222,46,.12)", color: "var(--accent)", font: "600 14px 'Hanken Grotesk'" }}>
            {success}
          </div>
        )}

        {!loading && (
          <div className={styles.formStack}>
            <Section title="Account">
              <div>
                <FieldLabel>Email</FieldLabel>
                <div
                  style={{
                    height: 52,
                    border: "1.5px solid rgba(0,0,0,.14)",
                    borderRadius: 12,
                    padding: "0 15px",
                    display: "flex",
                    alignItems: "center",
                    font: "600 15px 'Hanken Grotesk'",
                    color: "#6B6B70",
                    background: "#fff",
                  }}
                >
                  {user?.email || "—"}
                </div>
              </div>
              <TextInput label="Business / display name" value={businessName} onChange={setBusinessName} placeholder="Marcus Hale Moving" />
              <PhoneInput label="Phone" value={phone} onChange={setPhone} defaultIso="CA" />
            </Section>

            <Section title="Profile photo">
              <div className={styles.avatarRow}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: avatarPreview ? `url(${avatarPreview}) center/cover` : "rgba(255,255,255,.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    font: "800 22px 'Archivo'",
                    color: "rgba(255,255,255,.5)",
                    flexShrink: 0,
                  }}
                >
                  {!avatarPreview && (businessName[0]?.toUpperCase() || "M")}
                </div>
                <div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAvatarFile(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    style={secondaryBtn}
                  >
                    {avatarFile ? "Change photo" : avatarUrl ? "Replace photo" : "Upload photo"}
                  </button>
                  {avatarFile && (
                    <p style={{ margin: "8px 0 0", font: "500 12px 'Hanken Grotesk'", color: "#8A8A90" }}>
                      {avatarFile.name} — save to apply
                    </p>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Vehicle">
              <div>
                <FieldLabel>Vehicle type</FieldLabel>
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                  {vehicleTypes.map((type) => {
                    const active = selectedVehicleTypeId === type.id;
                    const hint = vehicleCapacityHint(type);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedVehicleTypeId(type.id)}
                        style={{
                          minHeight: 42,
                          padding: hint ? "8px 16px" : "0 18px",
                          borderRadius: 999,
                          background: active ? "var(--accent)" : "rgba(255,255,255,.06)",
                          border: active ? "1.5px solid var(--accent)" : "1.5px solid rgba(255,255,255,.18)",
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          justifyContent: "center",
                          font: active ? "700 14px 'Hanken Grotesk'" : "600 14px 'Hanken Grotesk'",
                          color: active ? "#0E0E10" : "rgba(255,255,255,.75)",
                          cursor: "pointer",
                        }}
                      >
                        <span>{type.name}</span>
                        {hint ? (
                          <span style={{ font: "500 10px 'Hanken Grotesk'", opacity: 0.75, marginTop: 2 }}>{hint}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={styles.fieldsRow}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <TextInput label="Make" value={make} onChange={setMake} placeholder="Ford" />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <TextInput label="Model" value={model} onChange={setModel} placeholder="Transit 250" />
                </div>
                <div style={{ width: 120 }}>
                  <TextInput label="Year" value={year} onChange={setYear} placeholder="2022" />
                </div>
              </div>
              <ChipToggle label="Helpers you can bring" options={["Just me", "+ 1 helper", "+ 2"]} selected={helpers} onSelect={setHelpers} />
            </Section>

            <Section title="Service area">
              <LocationField
                label="Base location"
                value={baseLocation}
                onChange={(v) => {
                  setBaseLocation(v);
                  setBaseLocationPlace({ address: v });
                }}
                onPlaceSelect={(place) => {
                  setBaseLocationPlace({
                    address: place.address,
                    lat: toFiniteCoord(place.lat) ?? undefined,
                    lng: toFiniteCoord(place.lng) ?? undefined,
                  });
                  setBaseLocation(place.address);
                }}
                placeholder="Search your home base or depot"
              />
              {toLatLng(baseLocationPlace) && (
                <div className={styles.map}>
                  <RouteMap pickup={baseLocationPlace} />
                </div>
              )}
            </Section>

            <Section title="Documents">
              <p style={{ margin: "0 0 12px", font: "500 14px 'Hanken Grotesk'", color: "rgba(255,255,255,.55)" }}>
                Replace any document below. New files upload when you save.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {DOC_DEFS.map((def) => (
                  <DocSettingsRow
                    key={def.type}
                    label={def.label}
                    existing={existingDocs.find((d) => d.type === def.type)}
                    pending={pendingDocs[def.type] ?? null}
                    onSelect={(doc) => setPendingDocs((prev) => ({ ...prev, [def.type]: doc }))}
                  />
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>

      <div className={styles.stickySave}>
        <button
          type="button"
          className={styles.saveButton}
          onClick={save}
          disabled={busy || loading}
          style={{
            background: busy || loading ? "rgba(255,255,255,.15)" : "var(--accent)",
            cursor: busy || loading ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 style={{ margin: "0 0 18px", font: "800 22px 'Archivo'" }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </section>
  );
}

function DocSettingsRow({
  label,
  existing,
  pending,
  onSelect,
}: {
  label: string;
  existing?: { type: string; url: string; status?: string };
  pending: PendingDoc | null;
  onSelect: (doc: PendingDoc) => void;
}) {
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasFile = !!pending || !!existing;

  const handleFile = (file: File) => {
    setLocalError(null);
    if (file.size > 10 * 1024 * 1024) {
      setLocalError("File must be 10MB or smaller");
      return;
    }
    onSelect({ name: file.name, file });
  };

  return (
    <div
      style={{
        border: hasFile ? "1.5px solid rgba(0,0,0,.1)" : "1.5px dashed rgba(0,0,0,.24)",
        borderRadius: 16,
        padding: "16px 18px",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ font: "700 15px 'Hanken Grotesk'" }}>{label}</div>
          {pending ? (
            <div style={{ marginTop: 4, font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>
              New: {pending.name}
            </div>
          ) : existing ? (
            <a
              href={existing.url}
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: 4, display: "inline-block", font: "600 13px 'Hanken Grotesk'", color: "#a8442a" }}
            >
              View current document
            </a>
          ) : (
            <div style={{ marginTop: 4, font: "500 13px 'Hanken Grotesk'", color: "#8A8A90" }}>Not uploaded yet</div>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ ...secondaryBtn, color: "#0E0E10", border: "1.5px solid rgba(0,0,0,.18)" }}>
            {existing || pending ? "Replace" : "Upload"}
          </button>
        </div>
      </div>
      {localError && (
        <div style={{ marginTop: 8, font: "600 13px 'Hanken Grotesk'", color: "#a8442a" }}>{localError}</div>
      )}
    </div>
  );
}

const secondaryBtn: React.CSSProperties = {
  height: 40,
  padding: "0 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.2)",
  background: "transparent",
  color: "#fff",
  font: "700 13px 'Hanken Grotesk'",
  cursor: "pointer",
};
