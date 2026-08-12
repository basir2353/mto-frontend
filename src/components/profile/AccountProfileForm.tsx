"use client";

import { useEffect, useRef, useState } from "react";
import { ChipToggle, FieldLabel, TextInput } from "@/components/FormControls";
import PostalCodeInput from "@/components/maps/PostalCodeInput";
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

function applyUserToForm(
  user: User,
  setters: {
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
  },
) {
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
  embedded = false,
  showChrome = true,
}: {
  backHref?: string;
  backLabel?: string;
  title?: string;
  subtitle?: string;
  moverNote?: string;
  /** When true, skips outer page scroll/background so parent can own layout. */
  embedded?: boolean;
  /** When false, hides back link + page title (parent provides them). */
  showChrome?: boolean;
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
        address:
          street.trim() && city.trim()
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

  const body = (
    <>
      {showChrome && (
        <>
          {backHref ? (
            <a href={backHref} className={styles.back}>
              ← {backLabel}
            </a>
          ) : null}
          <h1 className={styles.pageTitle}>{title}</h1>
          <p className={styles.pageSubtitle}>{subtitle}</p>
        </>
      )}

      {moverNote ? <div className={styles.note}>{moverNote}</div> : null}

      {error ? <div className={`${styles.alert} ${styles.alertError}`}>{error}</div> : null}
      {success ? <div className={`${styles.alert} ${styles.alertSuccess}`}>{success}</div> : null}

      {loading ? (
        <BlockLoader label="Loading profile…" minHeight={220} />
      ) : (
        <>
          <section className={styles.hero} aria-label="Account identity">
            <div className={styles.heroRow}>
              <div className={styles.avatarRing}>
                <UserAvatar name={displayName} imageUrl={avatarPreview} size={88} />
              </div>
              <div className={styles.heroMeta}>
                <div className={styles.heroEyebrow}>Your account</div>
                <div className={styles.heroName}>{displayName}</div>
                <div className={styles.heroEmail}>{user?.email ?? "—"}</div>
              </div>
            </div>
            <button type="button" className={styles.photoBtn} onClick={() => avatarInputRef.current?.click()}>
              {avatarPreview ? "Change photo" : "Upload photo"}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </section>

          <div className={styles.panel}>
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Personal information</h2>
                <span className={styles.sectionHint}>Shown to movers</span>
              </div>
              <div className={styles.stack}>
                <div className={styles.grid2}>
                  <TextInput label="First name" value={firstName} onChange={setFirstName} placeholder="Jane" />
                  <TextInput label="Last name" value={lastName} onChange={setLastName} placeholder="Customer" />
                </div>
                <PhoneInput label="Phone" value={phone} onChange={setPhone} defaultIso="CA" />
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <div className={styles.emailReadonly}>{user?.email ?? "—"}</div>
                  <div className={styles.emailHint}>Email cannot be changed here.</div>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Home address</h2>
                <span className={styles.sectionHint}>Default location</span>
              </div>
              <div className={styles.stack}>
                <TextInput label="Street" value={street} onChange={setStreet} placeholder="123 Main Street" />
                <div className={styles.grid2}>
                  <TextInput label="City" value={city} onChange={setCity} placeholder="Toronto" />
                  <TextInput label="Province" value={province} onChange={setProvince} placeholder="ON" />
                </div>
                <div className={styles.grid2}>
                  <PostalCodeInput
                    label="Postal code"
                    value={postalCode}
                    onChange={setPostalCode}
                    placeholder="M5V 2T6"
                    height={42}
                  />
                  <TextInput label="Country" value={country} onChange={setCountry} placeholder="Canada" />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Language</h2>
              </div>
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

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Notifications</h2>
                <span className={styles.sectionHint}>How we reach you</span>
              </div>
              <div className={styles.toggleList}>
                <ToggleRow label="Push notifications" active={notifications.push} onToggle={() => toggleNotification("push")} />
                <ToggleRow label="Email updates" active={notifications.email} onToggle={() => toggleNotification("email")} />
                <ToggleRow label="SMS alerts" active={notifications.sms} onToggle={() => toggleNotification("sms")} />
                <ToggleRow
                  label="Booking & move updates"
                  active={notifications.bookingUpdates}
                  onToggle={() => toggleNotification("bookingUpdates")}
                />
                <ToggleRow label="Promotions" active={notifications.promotions} onToggle={() => toggleNotification("promotions")} />
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Privacy</h2>
                <span className={styles.sectionHint}>Visibility & marketing</span>
              </div>
              <div className={styles.toggleList}>
                <ToggleRow
                  label="Show my profile to movers/drivers"
                  active={privacy.showProfile}
                  onToggle={() => togglePrivacy("showProfile")}
                />
                <ToggleRow
                  label="Share activity for better matches"
                  active={privacy.shareActivity}
                  onToggle={() => togglePrivacy("shareActivity")}
                />
                <ToggleRow
                  label="Allow marketing messages"
                  active={privacy.allowMarketing}
                  onToggle={() => togglePrivacy("allowMarketing")}
                />
              </div>
            </section>

            <div className={styles.saveBar}>
              <button type="button" className={styles.saveBtn} onClick={() => void save()} disabled={busy}>
                {busy ? "Saving…" : "Save profile"}
              </button>
              <div className={styles.saveHint}>Movers see your name, photo, phone, and address during negotiations.</div>
            </div>
          </div>
        </>
      )}
    </>
  );

  if (embedded) {
    return <div className={styles.wrap}>{body}</div>;
  }

  return (
    <div className={styles.wrapPage}>
      <div className={styles.pageInner}>{body}</div>
    </div>
  );
}

function ToggleRow({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={styles.toggleRow} onClick={onToggle} aria-pressed={active}>
      <span className={styles.toggleLabel}>{label}</span>
      <span className={`${styles.switch} ${active ? styles.switchOn : ""}`} aria-hidden>
        <span className={styles.switchKnob} />
      </span>
    </button>
  );
}
