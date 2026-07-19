"use client";

import { useEffect, useState } from "react";
import { platformApi } from "@/lib/api";

export function PlatformHealthBadge() {
  const [status, setStatus] = useState<"ok" | "down" | "loading">("loading");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await platformApi.health();
        setStatus(res.status === "ok" ? "ok" : "down");
        setCheckedAt(res.timestamp ?? new Date().toISOString());
      } catch {
        setStatus("down");
      }
    };
    void check();
    const t = setInterval(() => void check(), 60000);
    return () => clearInterval(t);
  }, []);

  const color = status === "ok" ? "#1f6b1f" : status === "down" ? "#a8442a" : "#8A8A90";
  const bg = status === "ok" ? "#e7f5ea" : status === "down" ? "rgba(168,68,42,.1)" : "#f0f0ec";

  return (
    <div
      title={checkedAt ? `Last checked ${new Date(checkedAt).toLocaleTimeString()}` : "Checking API…"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        background: bg,
        font: "700 11px 'Hanken Grotesk'",
        color,
        letterSpacing: ".04em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          boxShadow: status === "ok" ? `0 0 0 3px rgba(31,107,31,.2)` : undefined,
        }}
      />
      API {status === "loading" ? "…" : status === "ok" ? "healthy" : "unreachable"}
    </div>
  );
}
