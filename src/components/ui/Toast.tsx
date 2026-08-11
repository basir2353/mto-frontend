"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ToastTone = "success" | "error" | "info" | "warn";

export type ToastInput = {
  title: string;
  message?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
  tone: ToastTone;
};

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type ToastContextValue = {
  toast: (input: ToastInput | string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warn: (title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { bar: string; iconBg: string; icon: string }> = {
  success: { bar: "#1f6b1f", iconBg: "rgba(31,107,31,.12)", icon: "✓" },
  error: { bar: "#a8442a", iconBg: "rgba(168,68,42,.12)", icon: "!" },
  info: { bar: "#0E0E10", iconBg: "rgba(14,14,16,.08)", icon: "i" },
  warn: { bar: "var(--accent)", iconBg: "rgba(255,222,46,.28)", icon: "!" },
};

let toastSeq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    // SSR guard: the toast/confirm portal target (document.body) only exists client-side.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput | string) => {
      const payload: ToastInput = typeof input === "string" ? { title: input } : input;
      const id = `mto-toast-${++toastSeq}`;
      const item: ToastItem = {
        id,
        title: payload.title,
        message: payload.message,
        tone: payload.tone ?? "info",
        durationMs: payload.durationMs ?? 4200,
      };
      setToasts((prev) => [item, ...prev].slice(0, 4));
      const timer = setTimeout(() => dismiss(id), item.durationMs);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const success = useCallback((title: string, message?: string) => toast({ title, message, tone: "success" }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ title, message, tone: "error", durationMs: 5600 }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ title, message, tone: "info" }), [toast]);
  const warn = useCallback((title: string, message?: string) => toast({ title, message, tone: "warn" }), [toast]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const value = useMemo(
    () => ({ toast, success, error, info, warn, confirm }),
    [toast, success, error, info, warn, confirm],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <>
            <div
              aria-live="polite"
              aria-relevant="additions"
              className="mto-toast-stack"
              style={{
                position: "fixed",
                zIndex: 12000,
                top: "max(16px, env(safe-area-inset-top))",
                right: 16,
                left: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 10,
                pointerEvents: "none",
              }}
            >
              {toasts.map((item) => {
                const tone = TONE_STYLES[item.tone];
                return (
                  <div
                    key={item.id}
                    role="status"
                    style={{
                      pointerEvents: "auto",
                      width: "min(100%, 380px)",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      padding: "14px 14px 14px 12px",
                      borderRadius: 14,
                      background: "#fff",
                      border: "1.5px solid rgba(0,0,0,.1)",
                      boxShadow: "0 18px 44px rgba(14,14,16,.18)",
                      animation: "rise .22s ease-out",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        background: tone.bar,
                      }}
                    />
                    <span
                      aria-hidden
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: tone.iconBg,
                        color: "#0E0E10",
                        display: "grid",
                        placeItems: "center",
                        font: "800 14px var(--font-archivo)",
                        flex: "none",
                      }}
                    >
                      {tone.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                      <div style={{ font: "800 14px var(--font-archivo)", color: "#0E0E10" }}>{item.title}</div>
                      {item.message && (
                        <div style={{ font: "500 13px/1.4 var(--font-hanken)", color: "#6B6B70", marginTop: 4 }}>
                          {item.message}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss"
                      onClick={() => dismiss(item.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#8A8A90",
                        cursor: "pointer",
                        font: "700 18px var(--font-hanken)",
                        lineHeight: 1,
                        padding: 0,
                        width: 44,
                        height: 44,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "none",
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
            <style>{`
              @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
              @media (max-width: 820px) {
                .mto-toast-stack {
                  top: auto !important;
                  bottom: max(16px, env(safe-area-inset-bottom)) !important;
                  align-items: stretch !important;
                }
              }
              @media (prefers-reduced-motion: reduce) {
                .mto-toast-stack > * { animation: none !important; }
              }
            `}</style>

            {confirmState && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="mto-confirm-title"
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 13000,
                  background: "rgba(14,14,16,.48)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 20,
                }}
                onClick={() => {
                  confirmState.resolve(false);
                  setConfirmState(null);
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "min(100%, 420px)",
                    background: "#fff",
                    borderRadius: 18,
                    border: "1.5px solid rgba(0,0,0,.1)",
                    boxShadow: "0 28px 70px rgba(14,14,16,.28)",
                    overflow: "hidden",
                    animation: "rise .2s ease-out",
                  }}
                >
                  <div style={{ padding: "22px 22px 8px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div
                      aria-hidden
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: "var(--accent)",
                        color: "#0E0E10",
                        display: "grid",
                        placeItems: "center",
                        font: "900 20px var(--font-archivo)",
                        flex: "none",
                      }}
                    >
                      M
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div id="mto-confirm-title" style={{ font: "800 18px var(--font-archivo)", color: "#0E0E10" }}>
                        {confirmState.title}
                      </div>
                      {confirmState.message && (
                        <div style={{ font: "500 14px/1.45 var(--font-hanken)", color: "#6B6B70", marginTop: 8 }}>
                          {confirmState.message}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, padding: 18 }}>
                    <button
                      type="button"
                      onClick={() => {
                        confirmState.resolve(false);
                        setConfirmState(null);
                      }}
                      style={btnStyle(false)}
                    >
                      {confirmState.cancelLabel ?? "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        confirmState.resolve(true);
                        setConfirmState(null);
                      }}
                      style={btnStyle(true, confirmState.tone === "danger")}
                    >
                      {confirmState.confirmLabel ?? "Confirm"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

function btnStyle(primary: boolean, danger = false): CSSProperties {
  if (!primary) {
    return {
      flex: 1,
      height: 48,
      borderRadius: 12,
      border: "1.5px solid rgba(0,0,0,.16)",
      background: "#fff",
      color: "#0E0E10",
      font: "700 14px var(--font-hanken)",
      cursor: "pointer",
    };
  }
  return {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    border: "none",
    background: danger ? "#a8442a" : "var(--accent)",
    color: danger ? "#fff" : "#0E0E10",
    font: "800 15px var(--font-archivo)",
    cursor: "pointer",
  };
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
