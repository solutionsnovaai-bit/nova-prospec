"use client";
import { useEffect, useRef, useState } from "react";

/** Fundo do painel: espaço azul-esverdeado em loop, no clima do logo original. Feito no Higgsfield. */
const POSTER = "https://d8j0ntlcm91z4.cloudfront.net/user_34imSY1MU9eMUrKGNUV5ULpEPmX/hf_20261118_031328_73735fe5-6ea9-4bb7-9df5-1c237f55b4d1.png";
const VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_34imSY1MU9eMUrKGNUV5ULpEPmX/hf_20261118_031351_c1f0aa5b-4d13-4c24-983a-0909be819089.mp4";

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
