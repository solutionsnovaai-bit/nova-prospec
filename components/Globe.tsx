"use client";

import { useEffect, useRef } from "react";

type V3 = [number, number, number];

/**
 * Globo da Visão geral: esfera de partículas em 3D (com perspectiva), malha de
 * meridianos, rotas em arco entre pontos e órbitas, nas cores da marca.
 * Acompanha o ponteiro de leve. Canvas 2D puro, sem bibliotecas.
 */
export function Globe() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const N = 1900;
    const pts: { v: V3; g: number; s: number }[] = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * ga;
      const n = Math.sin(a * 0.9 + y * 5.3) + Math.sin(y * 9.1 - a * 0.37) + Math.sin(a * 0.21 + y * 2.2);
      pts.push({ v: [Math.cos(a) * r, y, Math.sin(a) * r], g: n > 0.55 ? 1 : 0, s: 0.6 + ((i * 7919) % 97) / 97 });
    }
    const land = pts.filter((p) => p.g);
    const beacons: V3[] = Array.from({ length: 8 }, (_, i) => land[(i * 37 + 11) % land.length].v);
    const routes: [V3, V3][] = beacons.map((b, i) => [b, beacons[(i + 3) % beacons.length]]);
    const stars = Array.from({ length: 70 }, (_, i) => ({ x: ((i * 9301 + 49297) % 233280) / 233280, y: ((i * 4273 + 1013) % 71993) / 71993, p: i * 1.37 }));

    let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
    const t0 = performance.now();
    let mx = 0, my = 0, tx = 0, ty = 0;
    const size = () => {
      const b = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, b.width); h = Math.max(1, b.height);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; kick(); });
    io.observe(cv);
    const onMove = (e: PointerEvent) => { tx = (e.clientX / window.innerWidth) * 2 - 1; ty = (e.clientY / window.innerHeight) * 2 - 1; };
    window.addEventListener("pointermove", onMove, { passive: true });

    let cr = 1, sr = 0, ct = 1, st = 0, R = 1, cx = 0, cy = 0;
    // rotação em Y (giro + ponteiro) e X (inclinação), depois perspectiva
    const proj = (v: V3, lift = 1): [number, number, number] => {
      const x = v[0] * lift, y = v[1] * lift, z = v[2] * lift;
      const x1 = x * cr + z * sr, z1 = -x * sr + z * cr;
      const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      const k = 1 / (1 - z2 * 0.22);
      return [cx + x1 * R * k, cy - y2 * R * k, z2];
    };
    const slerp = (a: V3, b: V3, u: number): V3 => {
      const d = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      const om = Math.acos(d), so = Math.sin(om) || 1;
      const ka = Math.sin((1 - u) * om) / so, kb = Math.sin(u * om) / so;
      return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
    };
    const glowDot = (x: number, y: number, r: number, col: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, col); g.addColorStop(1, "rgba(255,240,190,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    };
    const orbit = (rx: number, ry: number, rot: number, col: string, phase: number, front: boolean) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, R * rx, R * ry, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); ctx.stroke();
      const s = Math.sin(phase);
      if (s > 0 === front) glowDot(Math.cos(phase) * R * rx, s * R * ry, 10, "rgba(255,240,190,0.95)");
      ctx.restore();
    };

    function draw(now: number) {
      raf = 0;
      const t = (now - t0) / 1000;
      mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      R = Math.min(w, h) * 0.37; cx = w / 2 + mx * 6; cy = h / 2 + my * 4;
      const rot = t * 0.14 + mx * 0.5, tilt = -0.36 + my * 0.22;
      cr = Math.cos(rot); sr = Math.sin(rot); ct = Math.cos(tilt); st = Math.sin(tilt);

      for (const s of stars) {
        const a = 0.18 + 0.22 * Math.sin(t * 1.3 + s.p);
        ctx!.fillStyle = `rgba(220,240,230,${a})`;
        ctx!.fillRect(s.x * w - mx * 10, s.y * h - my * 6, 1.2, 1.2);
      }
      const halo = ctx!.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.7);
      halo.addColorStop(0, "rgba(62,207,142,0.24)"); halo.addColorStop(0.4, "rgba(62,207,142,0.08)"); halo.addColorStop(1, "rgba(62,207,142,0)");
      ctx!.fillStyle = halo; ctx!.fillRect(0, 0, w, h);

      orbit(1.5, 0.36, -0.32, "rgba(214,178,94,0.2)", t * 0.5, false);
      orbit(1.26, 0.22, 0.42, "rgba(62,207,142,0.18)", -t * 0.7 + 2, false);

      const Rk = R * 1.04;
      const body = ctx!.createRadialGradient(cx - Rk * 0.4, cy - Rk * 0.45, Rk * 0.05, cx, cy, Rk);
      body.addColorStop(0, "rgba(34,78,58,0.95)"); body.addColorStop(0.55, "rgba(9,26,20,0.96)"); body.addColorStop(1, "rgba(2,7,6,0.98)");
      ctx!.fillStyle = body; ctx!.beginPath(); ctx!.arc(cx, cy, Rk, 0, Math.PI * 2); ctx!.fill();

      // malha: paralelos e meridianos, mais fortes na frente
      ctx!.lineWidth = 1;
      const seg = (f: (u: number) => V3) => {
        let prev: [number, number, number] | null = null;
        for (let i = 0; i <= 72; i++) {
          const p = proj(f((i / 72) * Math.PI * 2));
          if (prev && prev[2] > 0 && p[2] > 0) {
            ctx!.strokeStyle = `rgba(90,220,160,${0.03 + 0.11 * Math.min(prev[2], p[2])})`;
            ctx!.beginPath(); ctx!.moveTo(prev[0], prev[1]); ctx!.lineTo(p[0], p[1]); ctx!.stroke();
          }
          prev = p;
        }
      };
      for (let la = -60; la <= 60; la += 30) { const y = Math.sin((la * Math.PI) / 180), r = Math.cos((la * Math.PI) / 180); seg((u) => [Math.cos(u) * r, y, Math.sin(u) * r]); }
      for (let lo = 0; lo < 180; lo += 30) { const c = Math.cos((lo * Math.PI) / 180), s = Math.sin((lo * Math.PI) / 180); seg((u) => [Math.cos(u) * c, Math.sin(u), Math.cos(u) * s]); }

      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const q = proj(p.v);
        if (q[2] < -0.02) continue;
        const d = 0.3 + q[2] * 0.7;
        const light = Math.max(0.22, 0.6 - ((q[0] - cx) / R) * 0.45 + ((q[1] - cy) / R) * 0.5 + q[2] * 0.25);
        const a = Math.min(1, d * light) * (p.g ? 1 : 0.55);
        ctx!.fillStyle = p.g ? `rgba(232,196,108,${a})` : `rgba(72,214,150,${a})`;
        const s = (p.g ? 1.6 : 1.05) * p.s * (0.55 + d * 0.75);
        ctx!.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
      }

      // rotas: arcos que sobem da superfície, com um cometa viajando
      for (let i = 0; i < routes.length; i++) {
        const [a, b] = routes[i];
        let prev: [number, number, number] | null = null;
        for (let j = 0; j <= 28; j++) {
          const u = j / 28;
          const p = proj(slerp(a, b, u), 1 + 0.26 * Math.sin(Math.PI * u));
          if (prev && (prev[2] > -0.1 || p[2] > -0.1)) {
            ctx!.strokeStyle = `rgba(232,196,108,${0.1 + 0.28 * Math.max(0, Math.min(prev[2], p[2]) + 0.1)})`;
            ctx!.beginPath(); ctx!.moveTo(prev[0], prev[1]); ctx!.lineTo(p[0], p[1]); ctx!.stroke();
          }
          prev = p;
        }
        const u = (t * 0.22 + i * 0.37) % 1;
        const c = proj(slerp(a, b, u), 1 + 0.26 * Math.sin(Math.PI * u));
        if (c[2] > -0.1) glowDot(c[0], c[1], 7, `rgba(255,244,200,${0.5 + 0.5 * Math.max(0, c[2])})`);
      }
      for (let i = 0; i < beacons.length; i++) {
        const q = proj(beacons[i]);
        if (q[2] < 0.05) continue;
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7);
        glowDot(q[0], q[1], 5 + pulse * 8, `rgba(255,236,170,${0.85 * q[2]})`);
        ctx!.strokeStyle = `rgba(255,236,170,${0.35 * q[2] * (1 - pulse)})`;
        ctx!.beginPath(); ctx!.arc(q[0], q[1], 4 + pulse * 14, 0, Math.PI * 2); ctx!.stroke();
      }

      // brilho especular e borda acesa
      const spec = ctx!.createRadialGradient(cx - Rk * 0.45, cy - Rk * 0.5, 0, cx - Rk * 0.45, cy - Rk * 0.5, Rk * 0.9);
      spec.addColorStop(0, "rgba(190,255,225,0.13)"); spec.addColorStop(1, "rgba(190,255,225,0)");
      ctx!.fillStyle = spec; ctx!.beginPath(); ctx!.arc(cx, cy, Rk, 0, Math.PI * 2); ctx!.fill();
      const rim = ctx!.createRadialGradient(cx, cy, Rk * 0.9, cx, cy, Rk * 1.08);
      rim.addColorStop(0, "rgba(120,255,190,0)"); rim.addColorStop(0.7, "rgba(120,255,190,0.2)"); rim.addColorStop(1, "rgba(120,255,190,0)");
      ctx!.fillStyle = rim; ctx!.beginPath(); ctx!.arc(cx, cy, Rk * 1.08, 0, Math.PI * 2); ctx!.fill();

      orbit(1.5, 0.36, -0.32, "rgba(214,178,94,0.34)", t * 0.5, true);
      orbit(1.26, 0.22, 0.42, "rgba(62,207,142,0.3)", -t * 0.7 + 2, true);

      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(draw);
    }
    function kick() { if (visible && !raf && !reduce && !document.hidden) raf = requestAnimationFrame(draw); }
    document.addEventListener("visibilitychange", kick);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", kick); window.removeEventListener("pointermove", onMove); };
  }, []);

  return <canvas ref={ref} className="globe" aria-hidden />;
}
