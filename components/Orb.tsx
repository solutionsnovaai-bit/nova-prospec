"use client";
import { useEffect, useRef } from "react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

/** Orbe da Nova: núcleo vivo que respira, reage à voz e gira os anéis do radar quando pensa. */
export function Orb({ state, level = 0, size = 220, onClick, label }: { state: OrbState; level?: number; size?: number; onClick?: () => void; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ state, level });
  st.current = { state, level };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = size * dpr;
    cv.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = size / 2;
    const R = size * 0.2;
    let raf = 0;
    let amp = 0.02;
    let spin = 0;
    let glow = 0.5;
    let lk = 0; // 0→1 quando está ouvindo ou falando (entrada e saída suaves)
    let last = performance.now();

    const blob = (t: number, a: number, phase: number, scale: number) => {
      ctx.beginPath();
      for (let i = 0; i <= 96; i++) {
        const th = (i / 96) * Math.PI * 2;
        const n = Math.sin(3 * th + t * 1.3 + phase) * 0.5 + Math.sin(5 * th - t * 0.9 + phase * 2) * 0.3 + Math.sin(2 * th + t * 0.6) * 0.2;
        const r = R * scale * (1 + a * n);
        const x = c + Math.cos(th) * r;
        const y = c + Math.sin(th) * r;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.closePath();
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const { state: s, level: lv } = st.current;
      const talk = 0.5 + 0.5 * Math.sin(t * 9) * Math.sin(t * 2.3 + 1);
      const live = Math.max(lv, 0.4 + 0.3 * Math.sin(t * 7) * Math.sin(t * 3.1)); // mexe o tempo todo enquanto ouve
      const targetAmp = s === "listening" ? 0.06 + live * 0.26 : s === "speaking" ? 0.06 + talk * 0.16 : s === "thinking" ? 0.035 : 0.018 + 0.008 * Math.sin(t * 1.2);
      const targetGlow = s === "idle" ? 0.5 + 0.08 * Math.sin(t * 1.2) : s === "thinking" ? 0.75 : 0.85 + (s === "listening" ? lv * 0.3 : talk * 0.2);
      amp += (targetAmp - amp) * Math.min(1, dt * 10);
      lk += ((s === "listening" || s === "speaking" ? 1 : 0) - lk) * Math.min(1, dt * 7);
      glow += (targetGlow - glow) * Math.min(1, dt * 6);
      spin += dt * (s === "thinking" ? 2.6 : s === "idle" ? 0.25 : 0.7);

      ctx.clearRect(0, 0, size, size);

      // halo
      const h = ctx.createRadialGradient(c, c, R * 0.5, c, c, R * 2.5);
      h.addColorStop(0, `rgba(214,178,94,${0.26 * glow})`);
      h.addColorStop(1, "rgba(214,178,94,0)");
      ctx.fillStyle = h;
      ctx.fillRect(0, 0, size, size);

      // ondas de voz: saem do núcleo enquanto ouve (verde) ou fala (ouro)
      if (s === "listening" || s === "speaking") {
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.55 + i / 3) % 1;
          ctx.beginPath();
          ctx.arc(c, c, R * (1.15 + k * 1.3), 0, Math.PI * 2);
          ctx.strokeStyle = s === "listening" ? `rgba(62,207,142,${(1 - k) * 0.55})` : `rgba(226,193,114,${(1 - k) * 0.55})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // espectro: barras ao redor do núcleo que dançam com a voz
      if (lk > 0.02) {
        const energy = s === "listening" ? live : s === "speaking" ? 0.35 + talk * 0.65 : 0.2;
        ctx.lineCap = "round";
        ctx.lineWidth = Math.max(1.5, size / 150);
        const r0 = R * 1.26;
        for (let i = 0; i < 72; i++) {
          const th = (i / 72) * Math.PI * 2 - Math.PI / 2;
          const n = 0.5 + 0.5 * Math.sin(t * 6.3 + i * 1.7) * Math.sin(t * 2.9 + i * 0.37);
          const h = R * (0.05 + energy * (0.16 + 0.5 * n)) * lk;
          ctx.beginPath();
          ctx.moveTo(c + Math.cos(th) * r0, c + Math.sin(th) * r0);
          ctx.lineTo(c + Math.cos(th) * (r0 + h), c + Math.sin(th) * (r0 + h));
          ctx.strokeStyle = s === "speaking" ? `rgba(233,207,143,${0.85 * lk})` : i % 2 ? `rgba(62,207,142,${0.9 * lk})` : `rgba(233,207,143,${0.75 * lk})`;
          ctx.stroke();
        }
        ctx.lineWidth = 1;
      }

      // anéis de radar
      ctx.lineCap = "round";
      const rings: [number, number, number, number, number][] = [
        [1.55, 1, 0.2, 4.6, 0.55],
        [1.95, -0.6, 1.4, 3.1, 0.3],
        [2.32, 0.35, 3.0, 5.4, 0.2],
      ];
      for (const [k, dir, off, len, a] of rings) {
        ctx.beginPath();
        ctx.arc(c, c, R * k, spin * dir + off, spin * dir + off + len);
        ctx.strokeStyle = k === 1.95 ? `rgba(62,207,142,${(a + 0.18) * (0.6 + glow * 0.5)})` : `rgba(214,178,94,${a * (0.6 + glow * 0.5)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // marcas do anel externo
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      for (let i = 0; i < 48; i++) {
        const th = (i / 48) * Math.PI * 2 - spin * 0.1;
        const r1 = R * 2.42;
        const r2 = R * (i % 4 === 0 ? 2.5 : 2.46);
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(th) * r1, c + Math.sin(th) * r1);
        ctx.lineTo(c + Math.cos(th) * r2, c + Math.sin(th) * r2);
        ctx.stroke();
      }
      // satélite
      const sa = spin + 0.2;
      ctx.beginPath();
      ctx.arc(c + Math.cos(sa) * R * 1.55, c + Math.sin(sa) * R * 1.55, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = "#e9cf8f";
      ctx.fill();

      const sb = -spin * 0.6 + 2.4;
      ctx.beginPath();
      ctx.arc(c + Math.cos(sb) * R * 1.95, c + Math.sin(sb) * R * 1.95, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#5fe0a6";
      ctx.fill();

      // camada externa do núcleo
      blob(t * 0.8, amp * 1.6, 1.7, 1.16 + 0.08 * lk);
      ctx.strokeStyle = `rgba(62,207,142,${0.42 * glow})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // núcleo
      blob(t, amp, 0, 1 + 0.08 * lk);
      const g = ctx.createRadialGradient(c - R * 0.25, c - R * 0.3, R * 0.05, c, c, R * 1.15);
      g.addColorStop(0, `rgba(255,244,214,${0.95})`);
      g.addColorStop(0.45, `rgba(226,193,114,${0.85})`);
      g.addColorStop(1, `rgba(150,112,40,${0.25})`);
      ctx.fillStyle = g;
      ctx.shadowColor = "rgba(214,178,94,0.55)";
      ctx.shadowBlur = 26 * glow;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (!still) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <button type="button" className="orb" onClick={onClick} aria-label={label ?? "Falar com a Nova"} style={{ width: size, height: size }} data-state={state}>
      <canvas ref={ref} style={{ width: size, height: size, display: "block" }} />
    </button>
  );
}
