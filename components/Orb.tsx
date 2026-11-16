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
    const bars = new Float32Array(72); // altura suavizada de cada barra do espectro
    // pontos do núcleo, espalhados em espiral de Fibonacci: [x, y, z, ângulo, tamanho]
    const sph: number[][] = [];
    for (let i = 0; i < 760; i++) {
      const y = 1 - (i / 759) * 2, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
      sph.push([Math.cos(a) * r, y, Math.sin(a) * r, a, 0.6 + ((i * 7919) % 97) / 97]);
    }

    const blob = (t: number, a: number, phase: number, scale: number) => {
      ctx.beginPath();
      for (let i = 0; i <= 180; i++) {
        const th = (i / 180) * Math.PI * 2;
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
      amp += (targetAmp - amp) * Math.min(1, dt * 6.5);
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
        // anéis orgânicos: nascem finos no núcleo, abrem devagar e somem; a borda ondula com a voz
        const e = s === "listening" ? live : 0.35 + talk * 0.65;
        for (let i = 0; i < 4; i++) {
          const k = (t * 0.42 + i / 4) % 1;
          const ease = 1 - Math.pow(1 - k, 2.2);
          const rr = R * (1.12 + ease * 1.45);
          const wob = 0.012 + e * 0.03 * (1 - k);
          ctx.beginPath();
          for (let j = 0; j <= 90; j++) {
            const th = (j / 90) * Math.PI * 2;
            const r2 = rr * (1 + wob * Math.sin(5 * th + t * 3.2 + i * 1.9) + wob * 0.6 * Math.sin(3 * th - t * 2.1 + i));
            const x = c + Math.cos(th) * r2, y = c + Math.sin(th) * r2;
            if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          }
          const al = Math.pow(1 - k, 1.8) * Math.min(1, k * 6) * 0.6 * lk;
          ctx.strokeStyle = s === "listening" ? `rgba(62,207,142,${al})` : `rgba(226,193,114,${al})`;
          ctx.lineWidth = 0.6 + (1 - k) * 1.8;
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
          // espelhado esquerda/direita e suavizado no tempo: parece voz, não ruído
          const m = i <= 36 ? i : 72 - i;
          const n = 0.5 + 0.5 * Math.sin(t * 5.1 + m * 0.62) * Math.sin(t * 2.3 + m * 0.21) + 0.25 * Math.sin(t * 8.7 + m * 1.3);
          const target = R * (0.05 + energy * (0.14 + 0.5 * Math.max(0, n)));
          bars[i] += (target - bars[i]) * Math.min(1, dt * 14);
          const h = bars[i] * lk;
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

      // núcleo: esfera de partículas dourada (parente do globo), que ondula com a voz
      const Rn = R * (1 + 0.08 * lk);
      blob(t, amp * 0.5, 0, 1 + 0.08 * lk);
      const g = ctx.createRadialGradient(c - R * 0.32, c - R * 0.36, R * 0.04, c, c, Rn * 1.12);
      g.addColorStop(0, "rgba(150,116,48,0.96)");
      g.addColorStop(0.5, "rgba(62,46,18,0.96)");
      g.addColorStop(1, "rgba(16,12,5,0.94)");
      ctx.fillStyle = g;
      ctx.shadowColor = "rgba(214,178,94,0.6)";
      ctx.shadowBlur = 30 * glow;
      ctx.fill();
      ctx.shadowBlur = 0;
      const ang = spin * 0.5, crY = Math.cos(ang), srY = Math.sin(ang), ctX = Math.cos(-0.4), stX = Math.sin(-0.4);
      const px = Math.max(0.7, size / 330);
      for (let i = 0; i < sph.length; i++) {
        const p = sph[i];
        const x1 = p[0] * crY + p[2] * srY, z1 = -p[0] * srY + p[2] * crY;
        const y2 = p[1] * ctX - z1 * stX, z2 = p[1] * stX + z1 * ctX;
        if (z2 < -0.04) continue;
        const n = Math.sin(p[3] * 3 + t * 1.3) * 0.5 + Math.sin(p[1] * 6 - t * 0.9 + p[3]) * 0.3 + Math.sin(p[3] * 2 + t * 0.6) * 0.2;
        const rr = Rn * (1 + amp * 1.5 * n);
        const k = 1 / (1 - z2 * 0.2);
        const d = 0.28 + z2 * 0.72;
        const lit = Math.max(0.25, 0.62 - x1 * 0.4 + y2 * 0.5 + z2 * 0.25);
        ctx.fillStyle = `rgba(255,${(228 + 16 * lit) | 0},${(160 + 54 * lit) | 0},${Math.min(1, d * lit * (0.75 + glow * 0.35))})`;
        const s2 = px * p[4] * (0.7 + d * 1.1);
        ctx.beginPath();
        ctx.arc(c + x1 * rr * k, c - y2 * rr * k, s2 / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // brilho de cima e borda acesa
      const sp = ctx.createRadialGradient(c - Rn * 0.4, c - Rn * 0.46, 0, c - Rn * 0.4, c - Rn * 0.46, Rn * 0.95);
      sp.addColorStop(0, `rgba(255,246,216,${0.2 + 0.12 * glow})`);
      sp.addColorStop(1, "rgba(255,246,216,0)");
      ctx.fillStyle = sp;
      ctx.beginPath();
      ctx.arc(c, c, Rn, 0, Math.PI * 2);
      ctx.fill();
      const rim = ctx.createRadialGradient(c, c, Rn * 0.86, c, c, Rn * 1.1);
      rim.addColorStop(0, "rgba(233,207,143,0)");
      rim.addColorStop(0.7, `rgba(233,207,143,${0.24 * glow})`);
      rim.addColorStop(1, "rgba(233,207,143,0)");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(c, c, Rn * 1.1, 0, Math.PI * 2);
      ctx.fill();

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
