"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export type AnchorRect = {
  top: number;
  left: number;
  width: number;
  bottom: number;
};

/** Keep a fixed popover aligned under an anchor (survives overflow:auto parents). */
export function useAnchoredPanel(open: boolean, anchorRef: RefObject<HTMLElement | null>): AnchorRect {
  const [rect, setRect] = useState<AnchorRect>({ top: 0, left: 0, width: 280, bottom: 0 });

  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = Math.max(r.width, 260);
      let left = r.left;
      const maxLeft = window.innerWidth - width - 12;
      if (left > maxLeft) left = Math.max(12, maxLeft);
      if (left < 12) left = 12;

      let top = r.bottom + 8;
      const estimatedHeight = 320;
      if (top + estimatedHeight > window.innerHeight - 12) {
        top = Math.max(12, r.top - estimatedHeight - 8);
      }

      setRect({ top, left, width, bottom: r.bottom });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef]);

  return rect;
}
