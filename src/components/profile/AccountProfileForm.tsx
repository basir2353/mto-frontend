"use client";

import { useEffect, useRef, useState } from "react";
import { ChipToggle, FieldLabel, TextInput } from "@/components/FormControls";
import { PhoneInput } from "@/components/PhoneInput";
import { UserAvatar } from "@/components/ui/AppUi";
import { BlockLoader } from "@/components/ui/MtoLoader";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { uploadsApi, usersApi } from "@/lib/api";
import type { User } from "@/lib/api/types";
import { customerDisplayName } from "@/lib/displayNames";
import { disablePushNotifications, enablePushNotifications } from "@/lib/push";
import styles from "./AccountProfileForm.module.css";

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "ur", label: "Urdu" },
  { id: "fr", label: "French" },
  { id: "es", label: "Spanish" },
];

type NotificationKey = "push" | "email" | "sms" | "bookingUpdates" | "promotions";
type PrivacyKey = "showProfile" | "shareActivity" | "allowMarketing";

function boolSetting(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function applyUserToForm(user: User, setters: {
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setPhone: (v: string) => void;
  setAvatarUrl: (v: string) => void;
  setStreet: (v: string) => void;
  setCity: (v: string) => void;
  setProvince: (v: string) => void;
  setPostalCode: (v: string) => void;
  setCountry: (v: string) => void;
  setLanguage: (v: string) => void;
  setNotifications: (v: Record<NotificationKey, boolean>) => void;
  setPrivacy: (v: Record<PrivacyKey, boolean>) => void;
}) {
  const profile = user.customerProfile;
  const address = (profile?.address ?? {}) as Record<string, string>;
  const notifications = (profile?.notificationSettings ?? {}) as Record<string, unknown>;
  const privacy = (profile?.privacy ?? {}) as Record<string, unknown>;

  setters.setFirstName(profile?.firstName ?? "");
  setters.setLastName(profile?.lastName ?? "");
  setters.setPhone(profile?.phone ?? user.moverProfile?.phone ?? "");
  setters.setAvatarUrl(profile?.avatarUrl ?? user.moverProfile?.avatarUrl ?? "");
  setters.setStreet(address.street ?? "");
  setters.setCity(address.city ?? "");
  setters.setProvince(address.province ?? "");
  setters.setPostalCode(address.postalCode ?? "");
  setters.setCountry(address.country ?? "Canada");
  setters.setLanguage(profile?.language ?? "en");
  setters.setNotifications({
    push: boolSetting(notifications.push, true),
    email: boolSetting(notifications.email, true),
    sms: boolSetting(notifications.sms, false),
    bookingUpdates: boolSetting(notifications.bookingUpdates, true),
    promotions: boolSetting(notifications.promotions, false),
  });
  setters.setPrivacy({
    showProfile: boolSetting(privacy.showProfile, true),
    shareActivity: boolSetting(privacy.shareActivity, false),
    allowMarketing: boolSetting(privacy.allowMarketing, false),
  });
}

export function AccountProfileForm({
  backHref,
  backLabel = "Back",
  title = "My profile",
  subtitle = "Update your personal information, photo, and app preferences.",
  moverNote,
}: {
  backHref: string;
  backLabel?: string;
  title?: string;
  subtitle?: string;
  moverNote?: string;
}) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Canada");
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    push: true,
    email: true,
    sms: false,
    bookingUpdates: true,
    promotions: false,
  });
  const [privacy, setPrivacy] = useState<Record<PrivacyKey, boolean>>({
    showProfile: true,
    shareActivity: false,
    allowMarketing: false,
  });

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await usersApi.getProfile();
      applyUserToForm(profile, {
        setFirstName,
        setLastName,
        setPhone,
        setAvatarUrl,
        setStreet,
        setCity,
        setProvince,
        setPostalCode,
        setCountry,
        setLanguage,
        setNotifications,
        setPrivacy,
      });
    } catch {
      if (user) {
        applyUserToForm(user, {
          setFirstName,
          setLastName,
          setPhone,
          setAvatarUrl,
          setStreet,
          setCity,
          setProvince,
          setPostalCode,
          setCountry,
          setLanguage,
          setNotifications,
          setPrivacy,
        });
      } else {
        setError("Could not load your profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProfile(), 0);
    return () => window.clearTimeout(timer);
  }, [user?.id]);

  const toggleNotification = (key: NotificationKey) =>
    setNotifications((n) => ({ ...n, [key]: !n[key] }));

  const togglePrivacy = (key: PrivacyKey) => setPrivacy((p) => ({ ...p, [key]: !p[key] }));

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required");
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

      await usersApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: nextAvatarUrl,
        address: street.trim() && city.trim()
          ? {
              street: street.trim(),
              city: city.trim(),
              province: province.trim() || undefined,
              postalCode: postalCode.trim() || undefined,
              country: country.trim() || undefined,
            }
          : undefined,
      });

      await usersApi.updateLanguage(language);
      await usersApi.updateNotificationSettings(notifications);
      if (notifications.push) {
        await enablePushNotifications();
      } else {
        await disablePushNotifications();
      }
      await usersApi.updatePrivacy(privacy);
      await usersApi.updatePreferences({ distanceUnit: "km", currency: "CAD" });

      await refreshUser();
      setAvatarFile(null);
      setSuccess("Profile saved successfully");
      toast.success("Profile saved", "Your MoveThisOut details are up to date.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile");
      toast.error("Couldn’t save profile", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const displayName = customerDisplayName(user);
  const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl || null;

  return (
    <div style={{ flex: 1, overflow: "auto", background: "#F5F4EF", minHeight: 0 }}>
      <div className={styles.container} style={{ maxWidth: 760, margin: "0 auto", padding: "32px 28px 48px" }}>
        <a href={backHref} style={{ font: "700 13px 'Hanken Grotesk'", color: "#6B6B70", textDecoration: "none" }}>
          ← {backLabel}
        </a>
        <h1 style={{ margin: "16px 0 6px", font: "900 34px 'Archivo'", letterSpacing: "-.025em" }}>{title}</h1>
        <p style={{ margin: "0 0 24px", font: "500 15px 'Hanken Grotesk'", color: "#6B6B70" }}>{subtitle}</p>

        {moverNote && (
          <div style={{ marginBottom: 20, padding: 14, borderRadius: 12, background: "#fff", border: "1.5px solid rgba(0,0,0,.08)", font: "600 13px 'Hanken Grotesk'", color: "#6B6B70" }}>
            {moverNote}
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: "#fff0f0", color: "#b00020", font: "600 14px 'Hanken Grotesk'" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: "rgba(31,107,31,.08)", color: "#1f6b1f", font: "600 14px 'Hanken Grotesk'" }}>
            {success}
          </div>
        )}

        {loading ? (
          <BlockLoader label="Loading profile…" minHeight={220} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <section style={sectionStyle}>
              <SectionTitle title="Photo & account" />
              <div className={styles.photoRow} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <UserAvatar name={displayName} imageUrl={avatarPreview} size={72} />
                <div>
                  <div style={{ font: "700 15px 'Hanken Grotesk'" }}>{displayName}</div>
                  <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>{user?.email}</div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    style={{ marginTop: 10, height: 38, padding: "0 14px", borderRadius: 10, border: "1.5px solid rgba(0,0,0,.14)", background: "#fff", font: "700 13px 'Hanken Grotesk'", cursor: "pointer" }}
                  >
                    {avatarPreview ? "Change photo" : "Upload photo"}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            </section>

            <section style={sectionStyle}>
              <SectionTitle title="Personal information" />
              <div className={styles.twoColumns} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <TextInput label="First name" value={firstName} onChange={setFirstName} placeholder="Jane" />
                <TextInput label="Last name" value={lastName} onChange={setLastName} placeholder="Customer" />
              </div>
              <div style={{ marginTop: 12 }}>
                <PhoneInput label="Phone" value={phone} onChange={setPhone} defaultIso="US" />
              </div>
              <div style={{ marginTop: 12 }}>
                <FieldLabel>Email</FieldLabel>
                <div style={{ height: 52, borderRadius: 12, border: "1.5px solid rgba(0,0,0,.1)", background: "#F5F4EF", display: "flex", alignItems: "center", padding: "0 14px", font: "600 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
                  {user?.email ?? "—"}
                </div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8A8A90", marginTop: 6 }}>Email cannot be changed here.</div>
              </div>
            </section>

            <section style={sectionStyle}>
              <SectionTitle title="Home address" />
              <TextInput label="Street" value={street} onChange={setStreet} placeholder="123 Main Street" />
              <div className={styles.twoColumns} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <TextInput label="City" value={city} onChange={setCity} placeholder="Toronto" />
                <TextInput label="Province" value={province} onChange={setProvince} placeholder="ON" />
              </div>
              <div className={styles.twoColumns} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <TextInput label="Postal code" value={postalCode} onChange={setPostalCode} placeholder="M5V 2T6" />
                <TextInput label="Country" value={country} onChange={setCountry} placeholder="Canada" />
              </div>
            </section>

            <section style={sectionStyle}>
              <SectionTitle title="Language" />
              <ChipToggle
                label="Preferred language"
                options={LANGUAGES.map((l) => l.label)}
                selected={LANGUAGES.find((l) => l.id === language)?.label ?? "English"}
                onSelect={(label) => {
                  const match = LANGUAGES.find((l) => l.label === label);
                  if (match) setLanguage(match.id);
                }}
              />
            </section>

            <section style={sectionStyle}>
              <SectionTitle title="Notifications" />
              <ToggleRow label="Push notifications" active={notifications.push} onToggle={() => toggleNotification("push")} />
              <ToggleRow label="Email updates" active={notifications.email} onToggle={() => toggleNotification("email")} />
              <ToggleRow label="SMS alerts" active={notifications.sms} onToggle={() => toggleNotification("sms")} />
              <ToggleRow label="Booking & move updates" active={notifications.bookingUpdates} onToggle={() => toggleNotification("bookingUpdates")} />
              <ToggleRow label="Promotions" active={notifications.promotions} onToggle={() => toggleNotification("promotions")} />
            </section>

            <section style={sectionStyle}>
              <SectionTitle title="Privacy" />
              <ToggleRow label="Show my profile to movers/drivers" active={privacy.showProfile} onToggle={() => togglePrivacy("showProfile")} />
              <ToggleRow label="Share activity for better matches" active={privacy.shareActivity} onToggle={() => togglePrivacy("shareActivity")} />
              <ToggleRow label="Allow marketing messages" active={privacy.allowMarketing} onToggle={() => togglePrivacy("allowMarketing")} />
            </section>

            <button
              type="button"
              onClick={() => void save()}
              disabled={busy}
              style={{
                height: 54,
                borderRadius: 12,
                border: "none",
                background: busy ? "rgba(0,0,0,.12)" : "var(--accent)",
                font: "800 16px 'Archivo'",
                color: "#0E0E10",
                cursor: busy ? "wait" : "pointer",
              }}
            >
              {busy ? "Saving…" : "Save profile"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ font: "800 16px 'Archivo'", marginBottom: 14 }}>{title}</div>
  );
}

function ToggleRow({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 0",
        border: "none",
        borderBottom: "1px solid rgba(0,0,0,.06)",
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ font: "600 14px 'Hanken Grotesk'" }}>{label}</span>
      <span
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          background: active ? "#0E0E10" : "rgba(0,0,0,.12)",
          position: "relative",
          flex: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: active ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .15s ease",
          }}
        />
      </span>
    </button>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid rgba(0,0,0,.08)",
  borderRadius: 16,
  padding: 20,
};
