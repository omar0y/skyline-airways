"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function FlightGridMotion({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = root.querySelectorAll(".grid-item");
    if (!items.length) return;

    if (reduced) {
      gsap.set(items, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(items, {
        opacity: 0,
        scale: 0.92,
        y: 16,
        duration: 0.4,
        stagger: { each: 0.06, from: "start" },
        ease: "back.out(1.4)",
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="grid gap-4">
      {children}
    </div>
  );
}
