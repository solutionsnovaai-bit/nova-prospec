"use client";

import { useEffect, useRef } from "react";

/**
 * Globo de partículas da Visão geral: esfera de pontos girando, com órbitas e brilho,
 * nas cores da marca (ouro e esmeralda). Canvas 2D puro, sem bibliotecas.
 */
export function Globe() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // pontos distribuídos por espiral de Fibonacci
    const N = 1500;
    const pts: { x: number; y: number; z: number; g: number; s: number }[] = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * ga;
      // "continentes": ruído barato decide se o ponto é ouro (terra) ou esmeralda (mar)
      const n = Math.sin(a * 0.9 + y * 5.3) + Math.sin(y * 9.1 - a * 0.37) + Math.sin(a * 0.21 + y * 2.2);
      pts.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r, g: n > 0.55 ? 1 : 0, s: 0.6 + ((i * 7919) % 97) / 97 });
    }
    // alguns "sinais" maiores que piscam (leads no mapa)
    const beacons = Array.from({ length: 9 }, (_, i) => pts[(i * 163 + 71) % N]);

    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, t0 = performance.now();
    const size = () => {
      const b = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, b.width); h = Math.max(1, b.height);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; if (visible && !raf && !reduce) raf = requestAnimationFrame(draw); });
    io.observe(cv);

    const tilt = -0.38, ct = Math.cos(tilt), st = Math.sin(tilt);

    function ring(cx: number, cy: number, R: number, rx: number, ry: number, rot: number, col: string, phase: number) {
      ctx!.save();
      ctx!.translate(cx, cy); ctx!.rotate(rot);
      ctx!.strokeStyle = col; ctx!.lineWidth = 1;
      ctx!.beginPath(); ctx!.ellipse(0, 0, R * rx, R * ry, 0, 0, Math.PI * 2); ctx!.stroke();
      const px = Math.cos(phase) * R * rx, py = Math.sin(phase) * R * ry;
      const g = ctx!.createRadialGradient(px, py, 0, px, py, 9);
      g.addColorStop(0, "rgba(255,240,190,0.95)"); g.addColorStop(1, "rgba(255,240,190,0)");
      ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(px, py, 9, 0, Math.PI * 2); ctx!.fill();
      ctx!.restore();
    }

    function draw(now: number) {
      raf = 0;
      const t = (now - t0) / 1000;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.4, cx = w / 2, cy = h / 2;

      // atmosfera
      const halo = ctx!.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.55);
      halo.addColorStop(0, "rgba(62,207,142,0.20)"); halo.addColorStop(0.45, "rgba(62,207,142,0.07)"); halo.addColorStop(1, "rgba(62,207,142,0)");
      ctx!.fillStyle = halo; ctx!.fillRect(0, 0, w, h);
      // corpo escuro com luz vindo de cima à esquerda
      const body = ctx!.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, "rgba(28,64,48,0.9)"); body.addColorStop(0.6, "rgba(8,22,17,0.92)"); body.addColorStop(1, "rgba(3,9,7,0.96)");
      ctx!.fillStyle = body; ctx!.beginPath(); ctx!.arc(cx, cy, R, 0, Math.PI * 2); ctx!.fill();

      ring(cx, cy, R, 1.42, 0.34, -0.32, "rgba(214,178,94,0.22)", t * 0.5);
      const rot = t * 0.16, cr = Math.cos(rot), sr = Math.sin(rot);
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const x1 = p.x * cr + p.z * sr, z1 = -p.x * sr + p.z * cr;
        const y2 = p.y * ct - z1 * st, z2 = p.y * st + z1 * ct;
        if (z2 < -0.05) continue;
        const d = 0.35 + z2 * 0.65;
        const light = Math.max(0.25, 0.55 + (-x1 * 0.5 - y2 * 0.55 + z2 * 0.3));
        const a = Math.min(1, d * light) * (p.g ? 0.95 : 0.6);
        ctx!.fillStyle = p.g ? `rgba(226,190,104,${a})` : `rgba(72,214,150,${a})`;
        const s = (p.g ? 1.5 : 1.05) * p.s * (0.6 + d * 0.6);
        ctx!.fillRect(cx + x1 * R - s / 2, cy - y2 * R - s / 2, s, s);
      }
      for (let i = 0; i < beacons.length; i++) {
        const p = beacons[i];
        const x1 = p.x * cr + p.z * sr, z1 = -p.x * sr + p.z * cr;
        const y2 = p.y * ct - z1 * st, z2 = p.y * st + z1 * ct;
        if (z2 < 0.1) continue;
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7);
        const bx = cx + x1 * R, by = cy - y2 * R, br = 5 + pulse * 9;
        const g = ctx!.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, `rgba(255,236,170,${0.9 * z2})`); g.addColorStop(1, "rgba(255,236,170,0)");
        ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(bx, by, br, 0, Math.PI * 2); ctx!.fill();
      }
      // brilho da borda (lado iluminado)
      const rim = ctx!.createRadialGradient(cx - R * 0.18, cy - R * 0.2, R * 0.86, cx, cy, R * 1.04);
      rim.addColorStop(0, "rgba(120,255,190,0)"); rim.addColorStop(0.85, "rgba(120,255,190,0.16)"); rim.addColorStop(1, "rgba(120,255,190,0)");
      ctx!.fillStyle = rim; ctx!.beginPath(); ctx!.arc(cx, cy, R * 1.04, 0, Math.PI * 2); ctx!.fill();
      ring(cx, cy, R, 1.2, 0.2, 0.42, "rgba(62,207,142,0.2)", -t * 0.7 + 2);

      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(draw);
    }
    const onVis = () => { if (!document.hidden && visible && !raf && !reduce) raf = requestAnimationFrame(draw); };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  return <canvas ref={ref} className="globe" aria-hidden />;
}
