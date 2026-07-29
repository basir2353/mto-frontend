"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TextInput, ChipToggle, Checkbox, Slider, FieldLabel } from "@/components/FormControls";
import LocationField from "@/components/maps/LocationField";
import RouteMap from "@/components/maps/RouteMap";
import { authApi, moversApi, uploadsApi, verificationApi, ApiError } from "@/lib/api";
import { compressImageFile } from "@/lib/compressImage";
import type { MapPlace } from "@/lib/maps";
import { toLatLng } from "@/lib/maps";
import { setTokens } from "@/lib/session";
import { AppIcon } from "@/components/ui/Icons";
import { PhoneInput, isValidNationalPhone, parsePhoneValue } from "@/components/PhoneInput";
import { YearPicker } from "@/components/YearPicker";

const stepDefs = [
  { n: 1, label: "Account", sub: "Your details" },
  { n: 2, label: "Vehicle", sub: "What you drive" },
  { n: 3, label: "Documents", sub: "Licence & insurance" },
  { n: 4, label: "Service area", sub: "Exact location" },
  { n: 5, label: "Verify", sub: "Selfie & submit" },
];

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CURRENT_YEAR = new Date().getFullYear();

type PendingDoc = { name: string; file: File };

type Docs = {
  licence: PendingDoc | null;
  insurance: PendingDoc | null;
  vehiclePhoto: PendingDoc | null;
};

type FieldErrors = Record<string, string>;

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v.trim());
}

function isPhone(v: string) {
  const { iso, national } = parsePhoneValue(v);
  return isValidNationalPhone(iso, national);
}

function isName(v: string) {
  return /^[A-Za-z][A-Za-z\s'-]{1,39}$/.test(v.trim());
}

function isStrongPassword(v: string) {
  return v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v);
}

function isPlate(v: string) {
  return /^[A-Z0-9][A-Z0-9\s-]{2,11}$/i.test(v.trim());
}

function isYear(v: string) {
  const n = Number(v);
  return /^\d{4}$/.test(v) && n >= 1990 && n <= CURRENT_YEAR + 1;
}

export default function DriverSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // step 2
  const [vehicleType, setVehicleType] = useState("Cargo van");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");

  // step 3
  const [docs, setDocs] = useState<Docs>({ licence: null, insurance: null, vehiclePhoto: null });
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // step 4 — Google Places exact location only
  const [baseLocation, setBaseLocation] = useState("");
  const [baseLocationPlace, setBaseLocationPlace] = useState<MapPlace>({ address: "" });
  const [radius, setRadius] = useState(15);
  const [days, setDays] = useState<string[]>(["Mon", "Tue", "Thu", "Fri", "Sat"]);

  // step 5 — selfie + review
  const [selfie, setSelfie] = useState<PendingDoc | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [selfiePreview]);

  const toggleDay = (d: string) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]));

  const clearError = (key: string) =>
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const validateStep = (n: number): boolean => {
    const errors: FieldErrors = {};

    if (n === 1) {
      if (!isName(firstName)) errors.firstName = "Enter a valid first name (letters only, min 2).";
      if (!isName(lastName)) errors.lastName = "Enter a valid last name (letters only, min 2).";
      if (!isEmail(email)) errors.email = "Enter a valid email address.";
      if (!isPhone(phone)) errors.phone = "Select your country and enter a valid mobile number.";
      if (!isStrongPassword(password)) {
        errors.password = "Min 8 chars with upper, lower, and a number.";
      }
    }

    if (n === 2) {
      if (!vehicleType) errors.vehicleType = "Select a vehicle type.";
      if (make.trim().length < 2) errors.make = "Make is required (min 2 characters).";
      if (model.trim().length < 1) errors.model = "Model is required.";
      if (!isYear(year)) errors.year = `Enter a valid year (1990–${CURRENT_YEAR + 1}).`;
      if (!isPlate(plate)) errors.plate = "Enter a valid licence plate (3–12 chars).";
    }

    if (n === 3) {
      if (!docs.licence) errors.licence = "Driver's licence photo is required.";
      if (!docs.insurance) errors.insurance = "Vehicle insurance document is required.";
      if (!docs.vehiclePhoto) errors.vehiclePhoto = "Vehicle photo is required.";
    }

    if (n === 4) {
      if (!baseLocation.trim() || baseLocationPlace.lat == null || baseLocationPlace.lng == null) {
        errors.baseLocation = "Select an exact address from the Google Places suggestions.";
      }
      if (radius < 1 || radius > 50) errors.radius = "Service radius must be 1–50 miles.";
      if (days.length === 0) errors.days = "Select at least one available day.";
    }

    if (n === 5) {
      if (!selfie) errors.selfie = "Take or upload a clear selfie of your face for licence matching.";
      if (!agreed) errors.agreed = "You must agree to the driver terms and background check.";
    }

    setFieldErrors(errors);
    setApiError(null);
    return Object.keys(errors).length === 0;
  };

  const next = async () => {
    if (!validateStep(step)) return;

    setBusy(true);
    setApiError(null);
    try {
      if (step === 1) {
        const avail = await verificationApi.checkAvailability({
          email: email.trim(),
          phone: phone.trim(),
        });
        const errors: FieldErrors = {};
        if (!avail.emailAvailable) {
          errors.email = "Email already in use — use another email or log in.";
        }
        if (!avail.phoneAvailable) {
          errors.phone = "Phone number already in use — use another number or log in.";
        }
        if (Object.keys(errors).length) {
          setFieldErrors(errors);
          setApiError("Email or phone is already registered.");
          return;
        }
      }

      if (step === 3) {
        try {
          for (const [type, doc] of Object.entries(docs) as Array<[keyof Docs, PendingDoc | null]>) {
            if (!doc) continue;
            if (type === "insurance" && doc.file.type === "application/pdf") {
              // PDF insurance: basic size check already done; skip vision
              continue;
            }
            const result = await verificationApi.analyzeDocument(
              type === "licence" ? "licence" : type === "insurance" ? "insurance" : "vehiclePhoto",
              doc.file,
            );
            if (!result.ok) {
              const msg = result.issues[0] || result.summary || "Could not verify this document.";
              setFieldErrors({ [type]: msg });
              setApiError(result.summary || "Document verification failed. Fix the highlighted file and try again.");
              return;
            }
          }

          if (docs.vehiclePhoto) {
            const match = await verificationApi.matchVehicle({
              file: docs.vehiclePhoto.file,
              vehicleType,
              make: make.trim(),
              model: model.trim(),
              year: year.trim() || undefined,
            });
            if (!match.ok) {
              const msg = match.issues[0] || match.summary || "Vehicle photo does not match your details.";
              setFieldErrors({ vehiclePhoto: msg });
              setApiError(match.summary || "Vehicle photo must match the make/model you entered.");
              return;
            }
          }
        } catch (e) {
          // Phone/WebView often drops large multipart requests — don't block signup.
          // Admin still reviews documents after submit.
          if (e instanceof ApiError && e.statusCode === 0) {
            setApiError(null);
            setStep((s) => (s < 5 ? s + 1 : 6));
            return;
          }
          throw e;
        }
      }

      setStep((s) => (s < 5 ? s + 1 : 6));
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Verification failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };
  const back = () => {
    setFieldErrors({});
    setApiError(null);
    if (step <= 1) {
      router.push("/drive");
      return;
    }
    setStep((s) => s - 1);
  };

  const setSelfieFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFieldErrors((e) => ({ ...e, selfie: "Selfie must be an image (JPG or PNG)." }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFieldErrors((e) => ({ ...e, selfie: "Selfie must be 10MB or smaller." }));
      return;
    }
    const compressed = await compressImageFile(file, { maxEdge: 1280, maxBytes: 900_000 });
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfie({ name: compressed.name || "driver-selfie.jpg", file: compressed });
    setSelfiePreview(URL.createObjectURL(compressed));
    clearError("selfie");
  };

  const submitApplication = async () => {
    if (!validateStep(5)) return;

    setBusy(true);
    setApiError(null);
    try {
      if (selfie && docs.licence) {
        try {
          const face = await verificationApi.faceMatch(selfie.file, docs.licence.file);
          if (!face.ok) {
            const msg = face.issues[0] || face.summary || "Selfie does not match your licence photo.";
            setFieldErrors({ selfie: msg });
            setApiError(face.summary || "Face check failed — retake a clearer selfie that matches your licence.");
            return;
          }
        } catch (e) {
          if (!(e instanceof ApiError && e.statusCode === 0)) throw e;
          // Network failure: continue — admin will review selfie vs licence.
        }
      }

      const businessName = `${firstName} ${lastName}`.trim();
      const reg = await authApi.register({
        email: email.trim(),
        password,
        role: "mover",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        businessName,
      });
      setTokens(reg.tokens.accessToken, reg.tokens.refreshToken);

      const docList: Array<{ type: string; url: string }> = [];
      const pending = Object.entries(docs).filter(
        (entry): entry is [string, PendingDoc] => entry[1] != null,
      );
      for (const [type, doc] of pending) {
        const uploaded = await uploadsApi.upload(doc.file);
        docList.push({ type, url: uploaded.url });
      }

      const selfieUpload = await uploadsApi.upload(selfie!.file);
      docList.push({ type: "selfie", url: selfieUpload.url });

      await moversApi.upsertProfile({
        businessName,
        phone: phone.trim(),
        avatarUrl: selfieUpload.url,
        serviceAreas: [baseLocation.trim()],
        documents: docList,
        availability: { days, hours: "8:00-20:00" },
        bio: `${vehicleType} · ${make} ${model} ${year} · ${plate}`,
        latitude: baseLocationPlace.lat,
        longitude: baseLocationPlace.lng,
      });

      if (reg.verificationToken) {
        try {
          await authApi.verifyEmail(reg.verificationToken);
        } catch {
          // admin/mover verify may still be required
        }
      }

      setStep(6);
    } catch (e) {
      if (e instanceof ApiError && (e.statusCode === 409 || e.messages.some((m) => /already registered|already exists/i.test(m)))) {
        const phoneConflict = e.messages.some((m) => /phone/i.test(m));
        setApiError(
          phoneConflict
            ? "This phone number is already registered. Use a different number or log in."
            : "This email is already registered. Log in instead, or use a different email.",
        );
        setFieldErrors(
          phoneConflict
            ? { phone: "Phone already in use — use another number or log in." }
            : { email: "Email already in use — use another email or log in." },
        );
        setStep(1);
      } else {
        setApiError(e instanceof Error ? e.message : "Could not submit application");
      }
    } finally {
      setBusy(false);
    }
  };

  const displayName = firstName || "Driver";
  const displayLastName = lastName || "";
  const displayEmail = email || "—";
  const displayMake = make || "—";
  const displayModel = model || "";
  const displayYear = year || "—";
  const displayPlate = plate || "—";
  const docCount = Object.values(docs).filter(Boolean).length + (selfie ? 1 : 0);
  const canSubmit = step !== 5 || (agreed && !!selfie);

  return (
    <div className="mto-driver-signup">
      <style>{`
        @keyframes ping{0%{transform:scale(.9);opacity:.7}70%,100%{transform:scale(2.4);opacity:0}}
        @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .mto-driver-signup{background:#F5F4EF;height:100dvh;width:100%;overflow:hidden;display:flex;color:#0E0E10}
        .mto-driver-signup-sidebar{width:392px;flex:none;background:#0E0E10;color:#fff;padding:44px 40px;display:flex;flex-direction:column}
        .mto-driver-signup-logo{display:flex;align-items:center;gap:11px;text-decoration:none;color:#fff;margin-bottom:44px}
        .mto-driver-signup-progress{display:block}
        .mto-driver-signup-step{display:flex;gap:14px}
        .mto-driver-signup-step-copy{padding-bottom:18px}
        .mto-driver-signup-main{flex:1;display:flex;flex-direction:column;min-height:0;min-width:0}
        .mto-driver-signup-content{flex:1;overflow:auto;padding:52px 60px}
        .mto-driver-signup-form{max-width:620px}
        .mto-driver-signup-footer{flex:none;border-top:1px solid rgba(0,0,0,.1);background:#fff;padding:18px 60px;display:flex;align-items:center;gap:14px;position:relative;z-index:30}
        .mto-driver-signup-back{width:130px;height:52px;border-radius:12px;border:1.5px solid rgba(0,0,0,.18);background:#fff;color:#0E0E10;display:flex;align-items:center;justify-content:center;font:700 15px 'Hanken Grotesk';cursor:pointer;appearance:none;-webkit-appearance:none;touch-action:manipulation}
        .mto-driver-signup-count{margin-left:auto;font:600 13px 'Hanken Grotesk';color:#8A8A90}
        .mto-driver-signup-next{min-width:220px;height:52px;padding:0 28px;border:none;border-radius:12px;display:flex;align-items:center;justify-content:center;font:800 16px 'Archivo';cursor:pointer;appearance:none;-webkit-appearance:none;touch-action:manipulation}
        .mto-driver-row{display:flex;gap:14px;align-items:flex-start}
        .mto-driver-row>div{flex:1;min-width:0}
        .mto-driver-doc{border-radius:16px;padding:18px;display:flex;align-items:center;gap:16px}
        .mto-driver-doc-copy{flex:1;min-width:0;overflow-wrap:anywhere}
        .mto-driver-review{border:1.5px solid rgba(0,0,0,.1);border-radius:14px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;gap:16px}
        .mto-driver-review>div{min-width:0;overflow-wrap:anywhere}
        @media(max-width:900px){
          .mto-driver-signup{height:auto;min-height:100dvh;display:block;overflow:visible}
          .mto-driver-signup-sidebar{width:100%;padding:18px 24px 14px;display:block}
          .mto-driver-signup-logo{margin-bottom:16px}
          .mto-driver-signup-eyebrow,.mto-driver-signup-help{display:none}
          .mto-driver-signup-progress{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
          .mto-driver-signup-step{display:block;flex:1;text-align:center}
          .mto-driver-signup-step-line{display:none}
          .mto-driver-signup-step-circle{margin:0 auto}
          .mto-driver-signup-step-copy{padding:7px 0 0}
          .mto-driver-signup-step-copy>div:first-child{font-size:12px!important}
          .mto-driver-signup-step-copy>div:last-child{display:none}
          .mto-driver-signup-main{display:block}
          .mto-driver-signup-content{overflow:visible;padding:36px 24px 120px}
          .mto-driver-signup-form{max-width:620px;margin:0 auto}
          .mto-driver-signup-footer{position:fixed;z-index:20;left:0;right:0;bottom:0;padding:12px 24px calc(12px + env(safe-area-inset-bottom));box-shadow:0 -8px 24px rgba(0,0,0,.08)}
        }
        @media(max-width:560px){
          .mto-driver-signup-sidebar{padding:14px 16px 12px}
          .mto-driver-signup-logo{margin-bottom:12px}
          .mto-driver-signup-logo>span{font-size:18px!important}
          .mto-driver-signup-step-copy>div:first-child{font-size:10px!important}
          .mto-driver-signup-content{padding:28px 16px 116px}
          .mto-driver-signup-content h1{font-size:27px!important}
          .mto-driver-row{flex-direction:column;gap:14px}
          .mto-driver-row>div{width:100%}
          .mto-driver-signup-footer{padding:10px 16px calc(10px + env(safe-area-inset-bottom));gap:10px}
          .mto-driver-signup-back{width:94px;height:50px}
          .mto-driver-signup-count{display:none}
          .mto-driver-signup-next{min-width:0;flex:1;height:50px;padding:0 14px;font-size:14px}
          .mto-driver-doc{padding:14px;gap:12px;align-items:flex-start;flex-wrap:wrap}
          .mto-driver-doc-icon{width:46px!important;height:46px!important}
          .mto-driver-doc-action{margin-left:58px}
          .mto-driver-review{align-items:flex-start}
          .mto-driver-review>span{flex:none}
          .mto-driver-selfie-media{height:220px!important}
          .mto-driver-selfie-actions button{flex:1;min-width:120px}
        }
      `}</style>
        <div className="mto-driver-signup-sidebar">
          <Link href="/drive" className="mto-driver-signup-logo">
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", font: "900 19px 'Archivo'", color: "#0E0E10" }}>
              M
            </div>
            <span style={{ font: "800 21px 'Archivo'", letterSpacing: "-.02em" }}>MoveThisOut</span>
          </Link>
          <div className="mto-driver-signup-eyebrow" style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 22 }}>
            Become a driver
          </div>
          <div className="mto-driver-signup-progress">{stepDefs.map((d, i) => {
            const done = step > d.n;
            const active = step === d.n;
            const bg = done ? "var(--accent)" : active ? "var(--accent)" : "transparent";
            const fg = done || active ? "#0E0E10" : "rgba(255,255,255,.6)";
            const bd = done || active ? "var(--accent)" : "rgba(255,255,255,.28)";
            const txt = done || active ? "#fff" : "rgba(255,255,255,.55)";
            const line = i === stepDefs.length - 1 ? "transparent" : done ? "var(--accent)" : "rgba(255,255,255,.18)";
            return (
              <div key={d.n} className="mto-driver-signup-step">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="mto-driver-signup-step-circle" style={{ width: 30, height: 30, borderRadius: "50%", background: bg, color: fg, border: `1.5px solid ${bd}`, display: "flex", alignItems: "center", justifyContent: "center", font: "800 13px 'Archivo'", flex: "none" }}>
                    {done ? <AppIcon name="check" size={14} color="#0E0E10" strokeWidth={3} /> : d.n}
                  </div>
                  <div className="mto-driver-signup-step-line" style={{ width: 2, flex: 1, minHeight: 26, background: line }} />
                </div>
                <div className="mto-driver-signup-step-copy">
                  <div style={{ font: "700 15px 'Hanken Grotesk'", color: txt }}>{d.label}</div>
                  <div style={{ font: "500 12px 'Hanken Grotesk'", color: "rgba(255,255,255,.4)", marginTop: 2 }}>{d.sub}</div>
                </div>
              </div>
            );
          })}</div>
          <div className="mto-driver-signup-help" style={{ marginTop: "auto", font: "500 13px/1.5 'Hanken Grotesk'", color: "rgba(255,255,255,.5)" }}>
            Need help applying?
            <br />
            <span style={{ color: "#fff", fontWeight: 700 }}>Chat with us →</span>
          </div>
        </div>

        <div className="mto-driver-signup-main">
          <div className="mto-driver-signup-content">
            <div className="mto-driver-signup-form">
              {apiError && (
                <div
                  style={{
                    marginBottom: 18,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "rgba(168,68,42,.08)",
                    border: "1px solid rgba(168,68,42,.35)",
                    color: "#a8442a",
                    font: "600 14px 'Hanken Grotesk'",
                  }}
                >
                  {apiError}
                  {/already registered/i.test(apiError) && (
                    <div style={{ marginTop: 8 }}>
                      <Link href="/auth?role=mover" style={{ color: "#0E0E10", fontWeight: 800, textDecoration: "underline" }}>
                        Log in to your driver account →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div style={{ animation: "rise .3s ease" }}>
                  <h1 style={heading}>Create your driver account</h1>
                  <p style={sub}>Start earning with the vehicle you already have.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Row>
                      <TextInput
                        label="First name"
                        value={firstName}
                        onChange={(v) => {
                          setFirstName(v);
                          clearError("firstName");
                        }}
                        placeholder="Marcus"
                        error={fieldErrors.firstName}
                        autoComplete="given-name"
                      />
                      <TextInput
                        label="Last name"
                        value={lastName}
                        onChange={(v) => {
                          setLastName(v);
                          clearError("lastName");
                        }}
                        placeholder="Hale"
                        error={fieldErrors.lastName}
                        autoComplete="family-name"
                      />
                    </Row>
                    <TextInput
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(v) => {
                        setEmail(v);
                        clearError("email");
                      }}
                      placeholder="marcus@email.com"
                      error={fieldErrors.email}
                      autoComplete="email"
                    />
                    <Row>
                      <PhoneInput
                        label="Phone"
                        value={phone}
                        onChange={(v) => {
                          setPhone(v);
                          clearError("phone");
                        }}
                        error={fieldErrors.phone}
                        defaultIso="CA"
                      />
                      <TextInput
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(v) => {
                          setPassword(v);
                          clearError("password");
                        }}
                        placeholder="Min 8 · A-z · 0-9"
                        error={fieldErrors.password}
                        autoComplete="new-password"
                      />
                    </Row>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ animation: "rise .3s ease" }}>
                  <h1 style={heading}>Your vehicle</h1>
                  <p style={sub}>Tell us what you&apos;ll be driving. You can add more later.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <ChipToggle label="Vehicle type" options={["SUV", "Cargo van", "Pickup", "Box truck"]} selected={vehicleType} onSelect={setVehicleType} />
                    {fieldErrors.vehicleType && <FieldHint error>{fieldErrors.vehicleType}</FieldHint>}
                    <Row>
                      <TextInput
                        label="Make"
                        value={make}
                        onChange={(v) => {
                          setMake(v);
                          clearError("make");
                        }}
                        placeholder="Ford"
                        error={fieldErrors.make}
                      />
                      <TextInput
                        label="Model"
                        value={model}
                        onChange={(v) => {
                          setModel(v);
                          clearError("model");
                        }}
                        placeholder="Transit 250"
                        error={fieldErrors.model}
                      />
                    </Row>
                    <YearPicker
                      label="Model year"
                      value={year}
                      onChange={(v) => {
                        setYear(v);
                        clearError("year");
                      }}
                      error={fieldErrors.year}
                    />
                    <TextInput
                      label="Licence plate"
                      value={plate}
                      onChange={(v) => {
                        setPlate(v.toUpperCase());
                        clearError("plate");
                      }}
                      placeholder="ABC 1234"
                      error={fieldErrors.plate}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ animation: "rise .3s ease" }}>
                  <h1 style={heading}>Upload your documents</h1>
                  <p style={sub}>
                    We run an AI check on these photos before admin approval. Approved in ~48 hours.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <DocRow
                      title="Driver's licence"
                      required
                      doc={docs.licence}
                      error={fieldErrors.licence}
                      accept="image/*"
                      hint="Clear photo of the photo ID page — used for face match"
                      onSelected={(doc) => {
                        setDocs((d) => ({ ...d, licence: doc }));
                        clearError("licence");
                      }}
                      inputRef={(el) => (fileInputs.current.licence = el)}
                    />
                    <DocRow
                      title="Vehicle insurance"
                      required
                      doc={docs.insurance}
                      error={fieldErrors.insurance}
                      onSelected={(doc) => {
                        setDocs((d) => ({ ...d, insurance: doc }));
                        clearError("insurance");
                      }}
                      inputRef={(el) => (fileInputs.current.insurance = el)}
                    />
                    <DocRow
                      title="Photo of your vehicle"
                      required
                      doc={docs.vehiclePhoto}
                      error={fieldErrors.vehiclePhoto}
                      accept="image/*"
                      hint="Must match the make/model you entered"
                      onSelected={(doc) => {
                        setDocs((d) => ({ ...d, vehiclePhoto: doc }));
                        clearError("vehiclePhoto");
                      }}
                      inputRef={(el) => (fileInputs.current.vehiclePhoto = el)}
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div style={{ animation: "rise .3s ease" }}>
                  <h1 style={heading}>Where &amp; when you&apos;ll drive</h1>
                  <p style={sub}>Pick your exact base from Google Places — typed city names alone won&apos;t work.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                    <LocationField
                      label="Exact base location"
                      value={baseLocation}
                      onChange={(v) => {
                        setBaseLocation(v);
                        // typing clears confirmed coords until a Places suggestion is picked
                        setBaseLocationPlace({ address: v });
                        clearError("baseLocation");
                      }}
                      onPlaceSelect={(place) => {
                        setBaseLocationPlace(place);
                        setBaseLocation(place.address);
                        clearError("baseLocation");
                      }}
                      placeholder="Start typing and select from Google suggestions"
                      error={fieldErrors.baseLocation}
                    />
                    {toLatLng(baseLocationPlace) && (
                      <div style={{ position: "relative", height: 220, borderRadius: 16, overflow: "hidden", border: "1.5px solid rgba(0,0,0,.1)" }}>
                        <RouteMap pickup={baseLocationPlace} />
                        <div
                          style={{
                            position: "absolute",
                            bottom: 12,
                            left: 12,
                            background: "#0E0E10",
                            color: "#fff",
                            borderRadius: 10,
                            padding: "8px 12px",
                            font: "600 12px 'Hanken Grotesk'",
                            zIndex: 2,
                          }}
                        >
                          Exact pin · {toLatLng(baseLocationPlace)!.lat.toFixed(5)}, {toLatLng(baseLocationPlace)!.lng.toFixed(5)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <FieldLabel>Service radius</FieldLabel>
                        <div style={{ font: "800 14px 'Archivo'" }}>{radius} mi</div>
                      </div>
                      <Slider value={radius} onChange={setRadius} min={1} max={30} />
                      {fieldErrors.radius && <FieldHint error>{fieldErrors.radius}</FieldHint>}
                    </div>
                    <div>
                      <FieldLabel>Days you&apos;re available</FieldLabel>
                      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                        {ALL_DAYS.map((d) => {
                          const active = days.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                toggleDay(d);
                                clearError("days");
                              }}
                              style={{
                                height: 42,
                                width: 52,
                                borderRadius: 12,
                                background: active ? "var(--accent)" : "#fff",
                                border: active ? "1.5px solid var(--accent)" : "1.5px solid rgba(0,0,0,.14)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                font: active ? "700 14px 'Hanken Grotesk'" : "600 14px 'Hanken Grotesk'",
                                color: active ? "#0E0E10" : "#3a3a40",
                                cursor: "pointer",
                              }}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                      {fieldErrors.days && <FieldHint error>{fieldErrors.days}</FieldHint>}
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div style={{ animation: "rise .3s ease" }}>
                  <h1 style={heading}>Verify your identity</h1>
                  <p style={sub}>
                    Take a live selfie. Our automated system matches it with your driver&apos;s licence photo before approval.
                  </p>

                  <SelfieCapture
                    previewUrl={selfiePreview}
                    error={fieldErrors.selfie}
                    onCaptured={setSelfieFile}
                  />

                  <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90" }}>
                      Application review
                    </div>
                    <ReviewRow
                      label="Account"
                      value={`${displayName} ${displayLastName} · ${displayEmail}`}
                      sub={phone || "No phone"}
                      onEdit={() => setStep(1)}
                    />
                    <ReviewRow
                      label="Vehicle"
                      value={`${vehicleType} · ${displayMake} ${displayModel} (${displayYear})`}
                      sub={displayPlate}
                      onEdit={() => setStep(2)}
                    />
                    <ReviewRow
                      label="Documents"
                      value="Licence, insurance & vehicle photo"
                      sub={`${docCount} file${docCount === 1 ? "" : "s"} · selfie ${selfie ? "ready" : "missing"}`}
                      onEdit={() => setStep(3)}
                    />
                    <ReviewRow
                      label="Service area"
                      value={`${baseLocation || "Select location"} · ${radius} mi radius`}
                      sub={
                        baseLocationPlace.lat != null
                          ? `${days.join(", ")} · ${baseLocationPlace.lat.toFixed(4)}, ${baseLocationPlace.lng?.toFixed(4)}`
                          : days.join(", ") || "No days selected"
                      }
                      onEdit={() => setStep(4)}
                    />
                    <Checkbox
                      checked={agreed}
                      onChange={(v) => {
                        setAgreed(v);
                        clearError("agreed");
                      }}
                    >
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" style={{ color: "inherit", fontWeight: 700 }}>
                        Terms
                      </Link>{" "}
                      &amp;{" "}
                      <Link href="/privacy" target="_blank" style={{ color: "inherit", fontWeight: 700 }}>
                        Privacy Policy
                      </Link>{" "}
                      and a background check.
                    </Checkbox>
                    {fieldErrors.agreed && <FieldHint error>{fieldErrors.agreed}</FieldHint>}
                  </div>
                </div>
              )}

              {step === 6 && (
                <div style={{ animation: "rise .3s ease", maxWidth: 520 }}>
                  <div style={{ position: "relative", width: 76, height: 76, marginBottom: 22 }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--accent)", animation: "ping 2.4s ease-out infinite" }} />
                    <div style={{ position: "relative", width: 76, height: 76, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AppIcon name="checkCircle" size={38} color="#0E0E10" strokeWidth={2.5} />
                    </div>
                  </div>
                  <h1 style={heading}>Application submitted</h1>
                  <p style={{ margin: "0 0 28px", font: "400 15px/1.55 'Hanken Grotesk'", color: "#6B6B70" }}>
                    Thanks, {displayName}. We&apos;re matching your selfie to your licence photo and verifying documents — most drivers are cleared within 48 hours.
                  </p>
                  <div style={{ border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, padding: "20px 22px", background: "#fff", marginBottom: 26 }}>
                    <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 16 }}>
                      What happens next
                    </div>
                    <TimelineItem title="Application received" sub="Just now" state="done" last={false} />
                    <TimelineItem title="Selfie ↔ licence face match" sub="Automated verification" state="done" last={false} />
                    <TimelineItem title="Background & document check" sub="Within 48 hours" state="idle" last={false} />
                    <TimelineItem title="Approved — start driving" sub="" state="idle" last />
                  </div>
                  <Link
                    href="/driver-app"
                    style={{ height: 54, borderRadius: 12, background: "#0E0E10", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 28px", font: "800 16px 'Archivo'", textDecoration: "none" }}
                  >
                    Explore the driver app →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {step <= 5 && (
            <div className="mto-driver-signup-footer">
              <button type="button" onClick={back} className="mto-driver-signup-back" disabled={busy}>
                ← Back
              </button>
              <div className="mto-driver-signup-count">
                Step {Math.min(step, 5)} of 5
              </div>
              <button
                type="button"
                onClick={() => {
                  if (busy) return;
                  if (step < 5) void next();
                  else void submitApplication();
                }}
                className="mto-driver-signup-next"
                disabled={busy || (step === 5 && !canSubmit)}
                style={{
                  background: canSubmit || step < 5 ? "var(--accent)" : "rgba(0,0,0,.12)",
                  color: canSubmit || step < 5 ? "#0E0E10" : "#9a9aa0",
                  cursor: busy ? "wait" : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy
                  ? step === 1
                    ? "Checking…"
                    : step === 3
                      ? "Verifying photos…"
                      : step === 5
                        ? "Submitting…"
                        : "Please wait…"
                  : step < 5
                    ? "Continue →"
                    : "Submit application"}
              </button>
            </div>
          )}
        </div>
    </div>
  );
}

const heading: React.CSSProperties = { margin: "0 0 4px", font: "800 30px 'Archivo'", letterSpacing: "-.025em" };
const sub: React.CSSProperties = { margin: "0 0 28px", font: "400 15px 'Hanken Grotesk'", color: "#6B6B70" };

function FieldHint({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div style={{ marginTop: 6, font: "600 12px 'Hanken Grotesk'", color: error ? "#a8442a" : "#6B6B70" }}>{children}</div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className="mto-driver-row">
      {items.map((child, i) => (
        <div key={i}>
          {child}
        </div>
      ))}
    </div>
  );
}

function SelfieCapture({
  previewUrl,
  error,
  onCaptured,
}: {
  previewUrl: string | null;
  error?: string;
  onCaptured: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setCamError("Camera access denied. You can still upload a selfie from your device.");
    }
  };

  const snap = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCaptured(new File([blob], `driver-selfie-${Date.now()}.jpg`, { type: "image/jpeg" }));
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div
      style={{
        border: error ? "1.5px solid #a8442a" : "1.5px solid rgba(0,0,0,.1)",
        borderRadius: 16,
        padding: 18,
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div>
          <div style={{ font: "800 16px 'Archivo'" }}>Driver selfie</div>
          <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>
            Face clearly lit · no sunglasses · will match licence photo
          </div>
        </div>
        <AppIcon name="camera" size={22} color="#0E0E10" />
      </div>

      <div
        className="mto-driver-selfie-media"
        style={{
          position: "relative",
          height: 260,
          borderRadius: 14,
          overflow: "hidden",
          background: "#0E0E10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {cameraOn ? (
          <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Driver selfie preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,.65)", font: "600 14px 'Hanken Grotesk'", padding: 24 }}>
            Open your camera or upload a photo
          </div>
        )}
      </div>

      <div className="mto-driver-selfie-actions" style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        {!cameraOn ? (
          <button type="button" onClick={() => void startCamera()} style={btnDark}>
            Open camera
          </button>
        ) : (
          <>
            <button type="button" onClick={snap} style={btnAccent}>
              Take photo
            </button>
            <button type="button" onClick={stopCamera} style={btnGhost}>
              Cancel
            </button>
          </>
        )}
        <button type="button" onClick={() => fileRef.current?.click()} style={btnGhost}>
          {previewUrl ? "Replace upload" : "Upload photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onCaptured(f);
            e.target.value = "";
          }}
        />
      </div>
      {(error || camError) && <FieldHint error>{error || camError}</FieldHint>}
    </div>
  );
}

const btnDark: React.CSSProperties = {
  height: 42,
  padding: "0 18px",
  borderRadius: 10,
  border: "none",
  background: "#0E0E10",
  color: "#fff",
  font: "700 13px 'Hanken Grotesk'",
  cursor: "pointer",
};
const btnAccent: React.CSSProperties = {
  ...btnDark,
  background: "var(--accent)",
  color: "#0E0E10",
};
const btnGhost: React.CSSProperties = {
  height: 42,
  padding: "0 18px",
  borderRadius: 10,
  border: "1.5px solid rgba(0,0,0,.14)",
  background: "#fff",
  color: "#0E0E10",
  font: "700 13px 'Hanken Grotesk'",
  cursor: "pointer",
};

function DocRow({
  title,
  doc,
  onSelected,
  inputRef,
  required,
  error,
  accept = "image/*,.pdf",
  hint,
}: {
  title: string;
  doc: PendingDoc | null;
  onSelected: (doc: PendingDoc) => void;
  inputRef: (el: HTMLInputElement | null) => void;
  required?: boolean;
  error?: string;
  accept?: string;
  hint?: string;
}) {
  const [localError, setLocalError] = useState<string | null>(null);
  const done = !!doc;

  const handleFile = (file: File) => {
    setLocalError(null);
    if (file.size > 10 * 1024 * 1024) {
      setLocalError("File must be 10MB or smaller");
      return;
    }
    if (accept.includes("image/") && !accept.includes(".pdf") && !file.type.startsWith("image/")) {
      setLocalError("Please upload an image file");
      return;
    }
    void (async () => {
      try {
        const prepared =
          file.type.startsWith("image/")
            ? await compressImageFile(file)
            : file;
        onSelected({ name: prepared.name, file: prepared });
      } catch {
        setLocalError("Could not process this file. Try another photo.");
      }
    })();
  };

  return (
    <div
      className="mto-driver-doc"
      style={{
        border: error || localError ? "1.5px solid #a8442a" : done ? "1.5px solid rgba(0,0,0,.1)" : "1.5px dashed rgba(0,0,0,.24)",
      }}
    >
      <div
        className="mto-driver-doc-icon"
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: done ? "var(--accent)" : undefined,
          border: done ? undefined : "1.5px dashed rgba(0,0,0,.24)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {done ? <AppIcon name="check" size={18} color="#0E0E10" strokeWidth={3} /> : <AppIcon name="plus" size={22} color="#a09b90" />}
      </div>
      <div className="mto-driver-doc-copy">
        <div style={{ font: "700 15px 'Hanken Grotesk'" }}>
          {title}
          {required ? <span style={{ color: "#a8442a" }}> *</span> : null}
        </div>
        <div style={{ font: "500 13px 'Hanken Grotesk'", color: error || localError ? "#a8442a" : "#6B6B70" }}>
          {error || localError || doc?.name || hint || "PNG, JPG or PDF · up to 10MB"}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <span
        className="mto-driver-doc-action"
        onClick={(e) => (e.currentTarget.previousSibling as HTMLInputElement)?.click()}
        style={
          done
            ? { font: "700 13px 'Hanken Grotesk'", color: "#0E0E10", textDecoration: "underline", cursor: "pointer" }
            : { height: 40, padding: "0 18px", borderRadius: 10, background: "#0E0E10", color: "#fff", display: "inline-flex", alignItems: "center", font: "700 13px 'Hanken Grotesk'", cursor: "pointer" }
        }
      >
        {done ? "Replace" : "Upload"}
      </span>
    </div>
  );
}

function ReviewRow({ label, value, sub, onEdit }: { label: string; value: string; sub: string; onEdit: () => void }) {
  return (
    <div className="mto-driver-review">
      <div>
        <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", color: "#8A8A90", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
        <div style={{ font: "600 15px 'Hanken Grotesk'" }}>{value}</div>
        <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>{sub}</div>
      </div>
      <span onClick={onEdit} style={{ font: "700 13px 'Hanken Grotesk'", textDecoration: "underline", cursor: "pointer" }}>
        Edit
      </span>
    </div>
  );
}

function TimelineItem({
  title,
  sub,
  state,
  last,
}: {
  title: string;
  sub: string;
  state: "done" | "idle";
  last: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: state === "done" ? "var(--accent)" : undefined,
            border: state === "done" ? "2px solid #0E0E10" : "2px solid rgba(0,0,0,.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0E0E10",
          }}
        >
          {state === "done" ? <AppIcon name="check" size={12} color="#0E0E10" strokeWidth={3} /> : null}
        </div>
        {!last && <div style={{ width: 2, flex: 1, background: state === "done" ? "#0E0E10" : "rgba(0,0,0,.15)" }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 16 }}>
        <div style={{ font: "700 14px 'Hanken Grotesk'", color: state === "done" ? "#0E0E10" : "#9a9aa0" }}>{title}</div>
        {sub && <div style={{ font: "500 12px 'Hanken Grotesk'", color: state === "done" ? "#6B6B70" : "#9a9aa0" }}>{sub}</div>}
      </div>
    </div>
  );
}
