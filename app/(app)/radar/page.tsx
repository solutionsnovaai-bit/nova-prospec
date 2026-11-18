"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RadarView } from "@/components/RadarView";

function Radar() {
  const sp = useSearchParams();
  const router = useRouter();
  const mundo = sp.get("mundo") === "1";
  return (
    <>
      <div className="tabs radar-switch" role="tablist" aria-label="Onde buscar">
        <button role="tab" aria-selected={!mundo} onClick={() => router.replace("/radar")}>🇧🇷 Brasil</button>
        <button role="tab" aria-selected={mundo} onClick={() => router.replace("/radar?mundo=1")}>🌎 Mundo</button>
      </div>
      <RadarView key={mundo ? "mundo" : "br"} intl={mundo} />
    </>
  );
}

export default function RadarPage() {
  return (
    <Suspense>
      <Radar />
    </Suspense>
  );
}
