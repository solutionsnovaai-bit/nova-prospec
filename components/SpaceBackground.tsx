"use client";
import { useEffect, useRef, useState } from "react";

/** Fundo do painel: a nebulosa azul e verde da arte do logo, sem o logo, em loop. Feito no Higgsfield. */
const POSTER = "https://d8j0ntlcm91z4.cloudfront.net/user_34imSY1MU9eMUrKGNUV5ULpEPmX/hf_20261118_031946_cded3cb2-946e-4876-b7bb-53c8018dc0e3.png";
const VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_34imSY1MU9eMUrKGNUV5ULpEPmX/hf_20261118_032010_b44a7e63-b5fa-48a1-a905-579c0cd04d19.mp4";

export function SpaceBackground() {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [still, setStill] = useState(true);
  useEffect(() => {
    // movimento reduzido ou economia de dados: fica só a imagem parada
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const save = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setStill(!!(reduce || save));
    const v = ref.current;
    const onVis = () => { if (!v) return; if (document.hidden) v.pause(); else v.play().catch(() => undefined); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return (
    <div className="spacebg" aria-hidden style={{ backgroundImage: `url(${POSTER})` }}>
      {!still && <video ref={ref} src={VIDEO} poster={POSTER} autoPlay muted loop playsInline preload="auto" />}
    </div>
  );
}
