"use client";

import { useRef, useState } from "react";

type Shape = "rect" | "rounded" | "circle" | "pill";

export default function ImageSlot({
  placeholder,
  shape = "rounded",
  radius = 12,
  src: initialSrc,
  alt = "",
}: {
  placeholder: string;
  shape?: Shape;
  radius?: number;
  /** When set, shows this image instead of the upload placeholder. */
  src?: string;
  alt?: string;
}) {
  const [src, setSrc] = useState<string | null>(initialSrc ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editable = !initialSrc;

  const borderRadius =
    shape === "circle" ? "50%" : shape === "pill" ? 999 : shape === "rect" ? 0 : radius;

  return (
    <div
      onClick={() => {
        if (editable) inputRef.current?.click();
      }}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius,
        overflow: "hidden",
        cursor: editable ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: src ? 0 : 24,
        background: src ? undefined : "linear-gradient(135deg,#e6e4dc,#cfd3c8)",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || placeholder} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span
          style={{
            font: "600 13px var(--font-hanken)",
            color: "rgba(14,14,16,.4)",
          }}
        >
          {placeholder}
        </span>
      )}
      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setSrc(URL.createObjectURL(file));
          }}
        />
      )}
    </div>
  );
}
