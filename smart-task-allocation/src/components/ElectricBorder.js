"use client";

import { useEffect, useId, useLayoutEffect, useRef } from "react";

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Animated electric/flaming border. Wrap any element; the stroke is rendered as
// a displaced, glowing outline driven by an animated SVG turbulence filter.
export default function ElectricBorder({
  color = "#5227FF",
  speed = 1,
  chaos = 1,
  thickness = 2,
  showOnHover = false,
  className = "",
  style,
  children,
}) {
  const rawId = useId().replace(/[:]/g, "");
  const filterId = `electric-${rawId}`;
  const svgRef = useRef(null);
  const rootRef = useRef(null);
  const strokeRef = useRef(null);

  const updateAnim = () => {
    const svg = svgRef.current;
    const host = rootRef.current;
    if (!svg || !host) return;

    if (strokeRef.current) {
      strokeRef.current.style.filter = `url(#${filterId})`;
    }

    const width = Math.max(1, Math.round(host.clientWidth || host.getBoundingClientRect().width || 0));
    const height = Math.max(1, Math.round(host.clientHeight || host.getBoundingClientRect().height || 0));

    const dyAnims = Array.from(svg.querySelectorAll('feOffset > animate[attributeName="dy"]'));
    if (dyAnims.length >= 2) {
      dyAnims[0].setAttribute("values", `${height}; 0`);
      dyAnims[1].setAttribute("values", `0; -${height}`);
    }

    const dxAnims = Array.from(svg.querySelectorAll('feOffset > animate[attributeName="dx"]'));
    if (dxAnims.length >= 2) {
      dxAnims[0].setAttribute("values", `${width}; 0`);
      dxAnims[1].setAttribute("values", `0; -${width}`);
    }

    const dur = Math.max(0.001, 6 / (speed || 1));
    [...dyAnims, ...dxAnims].forEach((anim) => anim.setAttribute("dur", `${dur}s`));

    const disp = svg.querySelector("feDisplacementMap");
    if (disp) disp.setAttribute("scale", String(30 * (chaos || 1)));

    requestAnimationFrame(() => {
      [...dyAnims, ...dxAnims].forEach((anim) => {
        if (typeof anim.beginElement === "function") {
          try {
            anim.beginElement();
          } catch {
            // some browsers throw if not yet in document; safe to ignore
          }
        }
      });
    });
  };

  useEffect(() => {
    updateAnim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, chaos]);

  useLayoutEffect(() => {
    if (!rootRef.current) return undefined;
    const observer = new ResizeObserver(() => updateAnim());
    observer.observe(rootRef.current);
    updateAnim();
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inheritRadius = { borderRadius: style?.borderRadius ?? "inherit" };
  const strokeStyle = {
    ...inheritRadius,
    borderWidth: thickness,
    borderStyle: "solid",
    borderColor: color,
    filter: `url(#${filterId})`,
  };
  const glow1 = {
    ...inheritRadius,
    borderWidth: thickness,
    borderStyle: "solid",
    borderColor: hexToRgba(color, 0.6),
    filter: "blur(1px)",
    opacity: 0.6,
  };
  const glow2 = {
    ...inheritRadius,
    borderWidth: thickness + 1,
    borderStyle: "solid",
    borderColor: color,
    filter: "blur(6px)",
    opacity: 0.8,
  };
  // Wider, hotter bloom for a flaming look.
  const glow3 = {
    ...inheritRadius,
    borderWidth: thickness + 2,
    borderStyle: "solid",
    borderColor: color,
    filter: "blur(16px)",
    opacity: 0.7,
  };
  const bgGlow = {
    ...inheritRadius,
    transform: "scale(1.1)",
    filter: "blur(42px)",
    opacity: 0.55,
    zIndex: -1,
    background: `linear-gradient(-30deg, ${hexToRgba(color, 0.9)}, transparent, ${color})`,
  };

  return (
    <div ref={rootRef} className={`group relative isolate ${className}`} style={style}>
      <svg
        ref={svgRef}
        className="pointer-events-none fixed -left-[10000px] -top-[10000px] h-[10px] w-[10px] opacity-[0.001]"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
            <feOffset in="noise1" dx="0" dy="0" result="offset1">
              <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
            <feOffset in="noise2" dx="0" dy="0" result="offset2">
              <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feBlend in="offset1" in2="offset2" mode="color-dodge" result="part1" />

            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise3" seed="2" />
            <feOffset in="noise3" dx="0" dy="0" result="offset3">
              <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise4" seed="2" />
            <feOffset in="noise4" dx="0" dy="0" result="offset4">
              <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feBlend in="offset3" in2="offset4" mode="color-dodge" result="part2" />

            <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="combinedNoise"
              scale="30"
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>
        </defs>
      </svg>

      <div
        className={`absolute inset-0 ${
          showOnHover
            ? "opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            : ""
        }`}
        style={inheritRadius}
      >
        <div ref={strokeRef} className="absolute inset-0 box-border" style={strokeStyle} />
        <div className="absolute inset-0 box-border" style={glow1} />
        <div className="absolute inset-0 box-border" style={glow2} />
        <div
          className="absolute inset-0 box-border animate-[electric-flicker_2.6s_ease-in-out_infinite]"
          style={glow3}
        />
        <div
          className="absolute inset-0 animate-[electric-flicker_3.4s_ease-in-out_infinite]"
          style={bgGlow}
        />
      </div>

      <div className="relative" style={inheritRadius}>
        {children}
      </div>
    </div>
  );
}
