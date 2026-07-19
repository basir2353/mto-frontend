"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { TextInput, FieldLabel } from "@/components/FormControls";
import { PhoneInput, isValidNationalPhone, parsePhoneValue } from "@/components/PhoneInput";
import { AppIcon } from "@/components/ui/Icons";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, verificationApi, ApiError } from "@/lib/api";

type Screen = "login" | "signup" | "verify" | "forgot" | "reset" | "done";

const CARRYOVER_PARAMS = ["pickup", "destination", "pickupLat", "pickupLng", "destinationLat", "destinationLng"];

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, isAuthenticated, user } = useAuth();

  const customerAppHref = (() => {
    const params = new URLSearchParams();
    CARRYOVER_PARAMS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });
    const query = params.toString();
    return query ? `/customer-app?${query}` : "/customer-app";
  })();
  const [screen, setScreen] = useState<Screen>("login");
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [accountType, setAccountType] = useState<"move" | "drive">("move");

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifiedName = fullName.trim().split(" ")[0] || "there";
  const verifiedEmail = signupEmail || loginEmail || forgotEmail || "your email";

  useEffect(() => {
    const h = (window.location.hash || "").replace("#", "");
    if (["login", "signup", "verify", "forgot", "reset", "done"].includes(h)) setScreen(h as Screen);
  }, []);

  useEffect(() => {
    const token = searchParams.get("resetToken") ?? searchParams.get("token");
    if (token) {
      setResetToken(token);
      setScreen("reset");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.roles.includes("admin")) router.replace("/admin");
    else if (user.roles.includes("mover")) router.replace("/driver-app");
    else router.replace(customerAppHref);
  }, [isAuthenticated, user, router, customerAppHref]);

  const redirectByRole = (roles: string[]) => {
    if (roles.includes("admin")) router.push("/admin");
    else if (roles.includes("mover")) router.push("/driver-app");
    else router.push(customerAppHref);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;

    if (!email || !password) {
      setApiError("Enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setApiError("Enter a valid email address (example: you@email.com).");
      return;
    }

    setBusy(true);
    setApiError(null);
    try {
      const u = await login(email, password);
      redirectByRole(u.roles);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setApiError("Invalid email or password. Check your details and try again.");
        } else {
          setApiError(err.messages.join(" "));
        }
      } else {
        setApiError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setApiError(null);
    try {
      if (phone.trim()) {
        const { iso, national } = parsePhoneValue(phone);
        if (!isValidNationalPhone(iso, national)) {
          setApiError("Enter a valid phone number.");
          return;
        }
      }

      const avail = await verificationApi.checkAvailability({
        email: signupEmail.trim(),
        phone: phone.trim() || undefined,
      });
      if (!avail.emailAvailable) {
        setApiError("This email is already registered. Log in instead, or use a different email.");
        setScreen("login");
        setLoginEmail(signupEmail);
        return;
      }
      if (phone.trim() && !avail.phoneAvailable) {
        setApiError("This phone number is already registered. Use a different number or log in.");
        return;
      }

      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] ?? "User";
      const lastName = parts.slice(1).join(" ") || "Account";
      const res = await register({
        email: signupEmail,
        password: signupPassword,
        role: "customer",
        firstName,
        lastName,
        phone: phone || undefined,
      });
      if (res.verificationToken) {
        setVerificationToken(res.verificationToken);
        try {
          await authApi.verifyEmail(res.verificationToken);
        } catch {
          setScreen("verify");
          return;
        }
      }
      setScreen("done");
    } catch (err) {
      if (err instanceof ApiError && (err.statusCode === 409 || err.messages.some((m) => /already registered|already exists/i.test(m)))) {
        const phoneConflict = err.messages.some((m) => /phone/i.test(m));
        setApiError(
          phoneConflict
            ? "This phone number is already registered. Use a different number or log in."
            : "This email is already registered. Log in instead, or use a different email.",
        );
        if (!phoneConflict) {
          setScreen("login");
          setLoginEmail(signupEmail);
        }
      } else {
        setApiError(err instanceof Error ? err.message : "Signup failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setApiError(null);
    try {
      const res = await authApi.forgotPassword(forgotEmail);
      if (res.resetToken) setResetToken(res.resetToken);
      setScreen("reset");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword !== resetPasswordConfirm) {
      setApiError("Passwords do not match");
      return;
    }
    if (!resetToken.trim()) {
      setApiError("Reset token is required");
      return;
    }
    setBusy(true);
    setApiError(null);
    try {
      await authApi.resetPassword(resetToken.trim(), resetPassword);
      setScreen("done");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationToken.trim()) {
      setApiError("Paste your verification token from email");
      return;
    }
    setBusy(true);
    setApiError(null);
    try {
      await authApi.verifyEmail(verificationToken.trim());
      setScreen("done");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCodeChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    setCode((c) => {
      const next = [...c];
      next[i] = digit;
      return next;
    });
    if (digit && i < 5) codeRefs.current[i + 1]?.focus();
  };

  return (
    <div className="mto-auth-page">
      <style>{`
        @keyframes ping{0%{transform:scale(.9);opacity:.7}70%,100%{transform:scale(2.4);opacity:0}}
        @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .mto-auth-page{background:#F5F4EF;min-height:100dvh;width:100%;display:flex;color:#0E0E10}
        .mto-auth-brand{width:560px;flex:none;background:#0E0E10;color:#fff;padding:48px 48px 40px;display:flex;flex-direction:column;position:relative;overflow:hidden}
        .mto-auth-form-side{flex:1;display:flex;align-items:center;justify-content:center;padding:40px;overflow:auto;min-height:0}
        .mto-auth-form{width:400px;max-width:100%}
        .mto-auth-fields-row{display:flex;gap:12px}
        .mto-auth-fields-row>div{flex:1;min-width:0}
        .mto-auth-account-types{display:flex;gap:10px;margin-bottom:20px}
        @media(max-width:900px){
          .mto-auth-page{display:block;background:#F5F4EF}
          .mto-auth-brand{width:100%;height:auto;min-height:0;padding:20px 24px;background:#0E0E10}
          .mto-auth-brand-copy,.mto-auth-brand-glow{display:none}
          .mto-auth-form-side{display:block;padding:40px 24px 56px;overflow:visible}
          .mto-auth-form{margin:0 auto}
        }
        @media(max-width:520px){
          .mto-auth-brand{padding:14px 16px}
          .mto-auth-form-side{padding:28px 16px 44px}
          .mto-auth-fields-row{flex-direction:column;gap:13px}
          .mto-auth-account-types{flex-direction:column}
          .mto-auth-page h1{font-size:28px!important}
        }
      `}</style>
        {/* BRAND PANEL */}
        <div className="mto-auth-brand">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", color: "#fff", position: "relative", zIndex: 2 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", font: "900 19px 'Archivo'", color: "#0E0E10" }}>
              M
            </div>
            <span style={{ font: "800 21px 'Archivo'", letterSpacing: "-.02em" }}>MoveThisOut</span>
          </Link>
          <div className="mto-auth-brand-copy" style={{ marginTop: "auto", position: "relative", zIndex: 2 }}>
            <h2 style={{ margin: "0 0 16px", font: "900 44px/1.02 'Archivo'", letterSpacing: "-.03em" }}>
              Move anything.
              <br />
              Right now.
            </h2>
            <p style={{ margin: "0 0 28px", font: "400 16px/1.55 'Hanken Grotesk'", color: "rgba(255,255,255,.62)", maxWidth: 400 }}>
              Post what you need moved, compare quotes from local drivers, and track it to the
              door — all in one account.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(255,255,255,.06)", borderRadius: 16, padding: "16px 18px", maxWidth: 400 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#3a3a40,#18181c)", flex: "none" }} />
              <div>
                <div style={{ font: "600 14px/1.4 'Hanken Grotesk'" }}>
                  &quot;Booked, quoted and moved in under an hour. Unreal.&quot;
                </div>
                <div style={{ font: "600 12px 'Hanken Grotesk'", color: "rgba(255,255,255,.5)", marginTop: 4 }}>
                  ★★★★★ · Priya, Brooklyn
                </div>
              </div>
            </div>
          </div>
          <div className="mto-auth-brand-glow" style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "var(--accent)", opacity: 0.14, filter: "blur(20px)" }} />
        </div>

        {/* FORM SIDE */}
        <div className="mto-auth-form-side">
          <div className="mto-auth-form">
            {apiError && (
              <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 10, background: "#fff0f0", color: "#b00020", font: "600 13px 'Hanken Grotesk'" }}>
                {apiError}
              </div>
            )}
            {screen === "login" && (
              <div style={{ animation: "rise .3s ease" }}>
                <h1 style={heading}>Welcome back</h1>
                <p style={sub}>Log in to book, track and manage your moves.</p>
                <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 10, background: "#f5f4ef", font: "500 12px/1.45 'Hanken Grotesk'", color: "#5a5a60" }}>
                  Demo: Admin <b>admin@movethisout.com</b> / <b>Admin123!</b> · Customer <b>customer@movethisout.com</b> / <b>Customer123!</b>
                </div>
                <form onSubmit={handleLogin}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <TextInput label="Email" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="ava@email.com" />
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                        <FieldLabel>Password</FieldLabel>
                        <span onClick={() => setScreen("forgot")} style={{ font: "600 12px 'Hanken Grotesk'", color: "#0E0E10", textDecoration: "underline", cursor: "pointer" }}>
                          Forgot?
                        </span>
                      </div>
                      <TextInput value={loginPassword} onChange={setLoginPassword} type="password" placeholder="••••••••" />
                    </div>
                  </div>
                  <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
                    {busy ? "Logging in…" : "Log in →"}
                  </button>
                </form>
                <Divider />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <SocialBtn>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "conic-gradient(#EA4335,#FBBC05,#34A853,#4285F4)" }} />
                    Continue with Google
                  </SocialBtn>
                  <SocialBtn>Continue with Apple</SocialBtn>
                </div>
                <p style={{ margin: "24px 0 0", textAlign: "center", font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
                  New here?{" "}
                  <span onClick={() => setScreen("signup")} style={linkText}>
                    Create an account
                  </span>
                </p>
              </div>
            )}

            {screen === "signup" && (
              <div style={{ animation: "rise .3s ease" }}>
                <h1 style={heading}>Create your account</h1>
                <p style={sub2}>Free to join. Get quotes in minutes.</p>
                <div className="mto-auth-account-types">
                  <div
                    onClick={() => setAccountType("move")}
                    style={{
                      flex: 1,
                      border: accountType === "move" ? "1.5px solid #0E0E10" : "1.5px solid rgba(0,0,0,.14)",
                      borderRadius: 12,
                      padding: 14,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ font: "800 15px 'Archivo'" }}>I need a move</div>
                    <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70" }}>Book local drivers</div>
                  </div>
                  <Link
                    href="/driver-signup"
                    style={{ flex: 1, border: "1.5px solid rgba(0,0,0,.14)", borderRadius: 12, padding: 14, cursor: "pointer", textDecoration: "none", color: "#0E0E10" }}
                  >
                    <div style={{ font: "800 15px 'Archivo'" }}>I want to drive</div>
                    <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70" }}>Earn with your vehicle</div>
                  </Link>
                </div>
                <form onSubmit={handleSignup}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    <TextInput label="Full name" value={fullName} onChange={setFullName} placeholder="Ava Morgan" />
                    <TextInput label="Email" type="email" value={signupEmail} onChange={setSignupEmail} placeholder="ava@email.com" />
                    <div className="mto-auth-fields-row">
                      <div>
                        <PhoneInput label="Phone" height={50} value={phone} onChange={setPhone} />
                      </div>
                      <div>
                        <TextInput label="Password" type="password" height={50} value={signupPassword} onChange={setSignupPassword} placeholder="••••••" />
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
                    {busy ? "Creating account…" : "Create account →"}
                  </button>
                </form>
                <p style={{ margin: "16px 0 0", textAlign: "center", font: "400 12px/1.5 'Hanken Grotesk'", color: "#9a9aa0" }}>
                  By continuing you agree to our{" "}
                  <a href="/terms" style={{ color: "inherit", fontWeight: 600 }}>
                    Terms
                  </a>{" "}
                  &amp;{" "}
                  <a href="/privacy" style={{ color: "inherit", fontWeight: 600 }}>
                    Privacy Policy
                  </a>
                  .
                </p>
                <p style={{ margin: "16px 0 0", textAlign: "center", font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
                  Already have an account?{" "}
                  <span onClick={() => setScreen("login")} style={linkText}>
                    Log in
                  </span>
                </p>
              </div>
            )}

            {screen === "verify" && (
              <div style={{ animation: "rise .3s ease", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: "#0E0E10", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <AppIcon name="mail" size={28} color="var(--accent)" />
                </div>
                <h1 style={heading}>Verify your email</h1>
                <p style={{ margin: "0 0 28px", font: "400 15px/1.5 'Hanken Grotesk'", color: "#6B6B70" }}>
                  Paste the verification token from your email (dev mode shows this in API response).
                </p>
                <TextInput label="Verification token" value={verificationToken} onChange={setVerificationToken} placeholder="Paste token here" />
                <div onClick={handleVerify} style={{ ...primaryBtn, marginTop: 20, opacity: busy ? 0.7 : 1 }}>
                  {busy ? "Verifying…" : "Verify & continue →"}
                </div>
                <p style={{ margin: "18px 0 0", font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
                  Didn&apos;t get it? <span style={linkText}>Resend code</span> ·{" "}
                  <span onClick={() => setScreen("signup")} style={linkText}>
                    Change email
                  </span>
                </p>
              </div>
            )}

            {screen === "forgot" && (
              <div style={{ animation: "rise .3s ease" }}>
                <h1 style={heading}>Reset your password</h1>
                <p style={sub}>Enter your email and we&apos;ll send a reset link.</p>
                <form onSubmit={handleForgot}>
                  <TextInput label="Email" type="email" value={forgotEmail} onChange={setForgotEmail} placeholder="ava@email.com" />
                  <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
                    {busy ? "Sending…" : "Send reset link"}
                  </button>
                </form>
                <p style={{ margin: "20px 0 0", textAlign: "center", font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
                  <span onClick={() => setScreen("login")} style={linkText}>
                    ← Back to log in
                  </span>
                </p>
              </div>
            )}

            {screen === "reset" && (
              <div style={{ animation: "rise .3s ease" }}>
                <h1 style={heading}>Choose a new password</h1>
                <p style={sub}>Paste your reset token and set a new password.</p>
                <form onSubmit={handleReset}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <TextInput label="Reset token" value={resetToken} onChange={setResetToken} placeholder="Paste token from email" />
                    <TextInput label="New password" type="password" value={resetPassword} onChange={setResetPassword} placeholder="••••••••" />
                    <TextInput label="Confirm password" type="password" value={resetPasswordConfirm} onChange={setResetPasswordConfirm} placeholder="••••••••" />
                  </div>
                  <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
                    {busy ? "Saving…" : "Update password →"}
                  </button>
                </form>
                <p style={{ margin: "20px 0 0", textAlign: "center", font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
                  <span onClick={() => setScreen("login")} style={linkText}>
                    ← Back to log in
                  </span>
                </p>
              </div>
            )}

            {screen === "done" && (
              <div style={{ animation: "rise .3s ease", textAlign: "center" }}>
                <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 22px" }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--accent)", animation: "ping 2.4s ease-out infinite" }} />
                  <div style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AppIcon name="checkCircle" size={40} color="#0E0E10" strokeWidth={2.5} />
                  </div>
                </div>
                <h1 style={heading}>You&apos;re all set, {verifiedName}</h1>
                <p style={{ margin: "0 0 28px", font: "400 15px/1.5 'Hanken Grotesk'", color: "#6B6B70" }}>
                  Your account is verified. Let&apos;s get something moved.
                </p>
                <Link
                  href={customerAppHref}
                  style={{ height: 54, borderRadius: 12, background: "#0E0E10", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "800 16px 'Archivo'", textDecoration: "none" }}
                >
                  Go to your dashboard →
                </Link>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

const heading: React.CSSProperties = { margin: "0 0 6px", font: "800 32px 'Archivo'", letterSpacing: "-.025em" };
const sub: React.CSSProperties = { margin: "0 0 28px", font: "400 15px 'Hanken Grotesk'", color: "#6B6B70" };
const sub2: React.CSSProperties = { margin: "0 0 22px", font: "400 15px 'Hanken Grotesk'", color: "#6B6B70" };

const primaryBtn: React.CSSProperties = {
  marginTop: 20,
  height: 54,
  width: "100%",
  border: "none",
  borderRadius: 12,
  background: "var(--accent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  font: "800 16px 'Archivo'",
  color: "#0E0E10",
  cursor: "pointer",
};

const linkText: React.CSSProperties = {
  color: "#0E0E10",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "underline",
};

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,.1)" }} />
      <span style={{ font: "600 12px 'Hanken Grotesk'", color: "#9a9aa0" }}>or</span>
      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,.1)" }} />
    </div>
  );
}

function SocialBtn({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: 50,
        border: "1.5px solid rgba(0,0,0,.14)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        font: "700 14px 'Hanken Grotesk'",
        cursor: "pointer",
      }}
    >
      {children}
    </div>
  );
}
