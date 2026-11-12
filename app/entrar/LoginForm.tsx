"use client";
import { useState } from "react";
import { Mark } from "@/components/Mark";
import { api } from "@/lib/client";

/** Radar desenhado em SVG: anéis, varredura e os pontos (negócios) acesos pela dor. */
function RadarArt() {
  const dots = [
    [62, 34, 1], [71, 58, 0], [44, 66, 1], [30, 40, 0], [55, 79, 0], [80, 42, 1], [38, 24, 0], [66, 70, 1], [24, 62, 0], [48, 48, 0],
  ];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d6b25e" stopOpacity=".10" />
          <stop offset="70%" stopColor="#d6b25e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sweep" x1="0" x2="1">
          <stop offset="0%" stopColor="#d6b25e" stopOpacity="0" />
          <stop offset="100%" stopColor="#d6b25e" stopOpacity=".28" />
        </linearGradient>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .06 0" />
        </filter>
      </defs>
      <rect width="100" height="100" fill="#0d0d10" />
      <circle cx="50" cy="52" r="46" fill="url(#glow)" />
      {[10, 20, 30, 40].map((r) => (
        <circle key={r} cx="50" cy="52" r={r} fill="none" stroke="#2a2930" strokeWidth=".2" />
      ))}
      <line x1="50" y1="6" x2="50" y2="98" stroke="#222127" strokeWidth=".15" />
      <line x1="4" y1="52" x2="96" y2="52" stroke="#222127" strokeWidth=".15" />
      <g style={{ transformOrigin: "50px 52px", animation: "sweep 7s linear infinite" }}>
        <path d="M50 52 L90 52 A40 40 0 0 0 78.3 23.7 Z" fill="url(#sweep)" />
        <line x1="50" y1="52" x2="90" y2="52" stroke="#d6b25e" strokeOpacity=".7" strokeWidth=".18" />
      </g>
      {dots.map(([x, y, hot], i) => (
        <g key={i}>
          {hot ? <circle cx={x} cy={y} r="2.2" fill="#d6b25e" fillOpacity=".12" /> : null}
          <circle cx={x} cy={y} r={hot ? 0.75 : 0.45} fill={hot ? "#d6b25e" : "#6d6e74"} />
        </g>
      ))}
      <rect width="100" height="100" filter="url(#grain)" />
      <style>{`@keyframes sweep { to { transform: rotate(-360deg); } } @media (prefers-reduced-motion: reduce){ g{animation:none!important} }`}</style>
    </svg>
  );
}

export function LoginForm({ hasPassword }: { hasPassword: boolean }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const setup = !hasPassword;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (setup && pw !== pw2) return setErr("As senhas não batem.");
    setBusy(true);
    try {
      await api("/api/auth", { method: "POST", json: { password: pw, mode: setup ? "setup" : "login" } });
      window.location.href = "/";
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu.");
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="art">
        <RadarArt />
        <div style={{ position: "absolute", left: 32, bottom: 28, right: 32 }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Nova AI Solutions</div>
          <div style={{ fontSize: 22, lineHeight: "30px", fontWeight: 500, maxWidth: 420, marginTop: 4 }}>
            Os comércios que estão perdendo cliente na internet, achados e organizados.
          </div>
        </div>
      </div>
      <div className="form">
        <form className="box" onSubmit={submit}>
          <Mark size={190} />
          <h1 style={{ fontSize: 24, lineHeight: "30px", margin: "6px 0 0", fontWeight: 600 }}>{setup ? "Crie sua senha" : "Entrar"}</h1>
          <p className="dim" style={{ margin: 0 }}>
            {setup ? "Primeiro acesso: essa senha protege o painel e as suas chaves." : "Painel pessoal de prospecção."}
          </p>
          <label className="field">
            <span>Senha</span>
            <input className="input" type="password" autoFocus autoComplete={setup ? "new-password" : "current-password"} value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} required />
          </label>
          {setup && (
            <label className="field">
              <span>Repita a senha</span>
              <input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={6} required />
            </label>
          )}
          {err && <div className="notice neg">{err}</div>}
          <button className="btn primary" disabled={busy} style={{ justifyContent: "center", height: 40 }}>
            {busy ? "Entrando…" : setup ? "Criar senha e entrar" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
