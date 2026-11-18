"use client";
import { useEffect, useRef } from "react";

/**
 * Abertura: o cérebro do logotipo se monta a partir dos próprios pixels.
 * As partículas saem de uma órbita (como o globo), convergem com ease-out forte,
 * o logo nítido assume, uma faixa de luz passa por ele e uma onda de choque fecha.
 * Canvas 2D, sem bibliotecas; com movimento reduzido mostra o logo pronto.
 */
export function LogoForge({ src = "/logo-mark.webp", size = 220 }: { src?: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = size * 1.5; // folga para a órbita e a onda
    cv.width = W * dpr; cv.height = W * dpr;
    cv.style.width = `${W}px`; cv.style.height = `${W}px`;
    const c = W / 2;
    const img = new Image();
    img.src = src;
    let raf = 0;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
    const easeInOut = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2);

    img.onload = () => {
      const S = size;
      const off = document.createElement("canvas");
      off.width = S; off.height = S;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      o.drawImage(img, 0, 0, S, S);
      const data = o.getImageData(0, 0, S, S).data;
      type P = { sx: number; sy: number; tx: number; ty: number; col: string; d: number; z: number };
      const parts: P[] = [];
      const step = 3;
      for (let y = 0; y < S; y += step)
        for (let x = 0; x < S; x += step) {
          const i = (y * S + x) * 4;
          const a = data[i + 3];
          const lum = data[i] + data[i + 1] + data[i + 2];
          if (a < 150 || lum < 90) continue; // só o que é brilho do logo
          const ang = Math.random() * Math.PI * 2;
          const rad = S * (0.62 + Math.random() * 0.25);
          parts.push({
            sx: c + Math.cos(ang) * rad, sy: c + Math.sin(ang) * rad * 0.42 - S * 0.04, // órbita achatada, como o anel do globo
            tx: c - S / 2 + x, ty: c - S / 2 + y,
            col: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`,
            d: Math.random() * 0.32, z: 0.8 + Math.random() * 1.1,
          });
        }
      const t0 = performance.now();
      const FORM = 1.15, LOCK = 1.25, END = 2.4;

      const frame = (now: number) => {
        const t = (now - t0) / 1000;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, W);

        // 1) partículas convergindo
        const pf = Math.max(0, 1 - (t - LOCK) / 0.45); // somem depois que o logo assume
        if (pf > 0) {
          ctx.globalCompositeOperation = "lighter";
          for (const p of parts) {
            const u = easeOut(Math.min(1, Math.max(0, (t - p.d) / (FORM - p.d * 0.5))));
            const swirl = (1 - u) * 0.9;
            const x = p.sx + (p.tx - p.sx) * u + Math.sin(t * 3 + p.d * 20) * swirl * 6;
            const y = p.sy + (p.ty - p.sy) * u + Math.cos(t * 3 + p.d * 20) * swirl * 6;
            ctx.globalAlpha = Math.min(1, t * 3) * pf * (0.45 + 0.55 * u);
            ctx.fillStyle = p.col;
            const s = p.z * (1.8 - u * 0.6);
            ctx.fillRect(x - s / 2, y - s / 2, s, s);
          }
          ctx.globalCompositeOperation = "source-over";
        }

        // 2) logo nítido assume
        const la = Math.min(1, Math.max(0, (t - (LOCK - 0.15)) / 0.4));
        if (la > 0) {
          const sc = 0.96 + 0.04 * easeOut(la);
          ctx.globalAlpha = la;
          ctx.drawImage(img, c - (S * sc) / 2, c - (S * sc) / 2, S * sc, S * sc);
        }

        // 3) faixa de luz passando só por cima do logo
        const sw = (t - (LOCK + 0.1)) / 0.7;
        if (sw > 0 && sw < 1) {
          ctx.globalCompositeOperation = "source-atop";
          ctx.globalAlpha = 0.85;
          const x = c - S + easeInOut(sw) * S * 2;
          const g = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
          g.addColorStop(0, "rgba(255,248,220,0)"); g.addColorStop(0.5, "rgba(255,248,220,0.9)"); g.addColorStop(1, "rgba(255,248,220,0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, W);
          ctx.globalCompositeOperation = "source-over";
        }

        // 4) onda de choque dourada quando trava
        const sk = (t - LOCK) / 0.9;
        if (sk > 0 && sk < 1) {
          ctx.globalAlpha = (1 - sk) * 0.7;
          ctx.strokeStyle = "#e8c46c";
          ctx.lineWidth = 2 * (1 - sk) + 0.5;
          ctx.beginPath();
          ctx.arc(c, c, S * (0.42 + easeOut(sk) * 0.32), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = (1 - sk) * 0.35;
          ctx.strokeStyle = "#3ecf8e";
          ctx.beginPath();
          ctx.arc(c, c, S * (0.38 + easeOut(Math.max(0, sk - 0.12)) * 0.3), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        if (t < END) raf = requestAnimationFrame(frame);
      };
      if (reduce) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.drawImage(img, c - S / 2, c - S / 2, S, S);
      } else raf = requestAnimationFrame(frame);
    };
    return () => cancelAnimationFrame(raf);
  }, [src, size]);
  return <canvas ref={ref} className="forge-canvas" aria-hidden />;
}
