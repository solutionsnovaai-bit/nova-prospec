"use client";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { api, relTime } from "@/lib/client";
import { Spinner, toast } from "./ui";

type Run = { at: string; scope: string; searches: { q: string; found: number; saved: number; error?: string }[] };
type State = { enabled: boolean; min: number; perDayBr: number; perDayIntl: number; runs: Run[] };

/** Cartão do radar automático: liga/desliga, mostra a última rodada e roda na hora. */
export function AutoRadarCard({ onSaved }: { onSaved?: () => void }) {
  const [st, setSt] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ state: State }>("/api/cron/radar", { method: "POST", json: {} }).then((r) => setSt(r.state)).catch(() => undefined);
  }, []);
  if (!st) return null;
  const last = st.runs[0];
  const saved = last?.searches.reduce((s, x) => s + x.saved, 0) ?? 0;
  const set = async (patch: Partial<State> & { run?: "br" | "intl" | "all" }) => {
    setBusy(true);
    try {
      const r = await api<{ state: State; saved?: number }>("/api/cron/radar", { method: "POST", json: patch });
      setSt(r.state);
      if (patch.run) {
        toast(`${r.saved ?? 0} leads quentes salvos`);
        onSaved?.();
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel autoradar">
      <div className="panel-b" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", paddingTop: 16 }}>
        <span className={`ar-dot ${st.enabled ? "on" : ""}`} aria-hidden />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={15} strokeWidth={1.6} /> Radar automático {st.enabled ? "ligado" : "desligado"}
          </div>
          <div className="sub">
            Todo dia às 8h: {st.perDayBr} buscas no Brasil e {st.perDayIntl} no exterior, salva só quem passa de {st.min}.
            {last ? ` Última rodada ${relTime(last.at)}: ${saved} quentes em ${last.searches.length} buscas.` : " Ainda não rodou."}
          </div>
        </div>
        <button className="btn sm" disabled={busy} onClick={() => set({ enabled: !st.enabled })}>
          {st.enabled ? "Desligar" : "Ligar"}
        </button>
        <button className="btn sm gold" disabled={busy} onClick={() => window.confirm("Rodar agora gasta até 4 buscas grátis. Continuar?") && set({ run: "all" })}>
          {busy ? <Spinner size={13} /> : null} Rodar agora
        </button>
      </div>
      {last && (
        <div className="ar-log">
          {last.searches.map((s, i) => (
            <span key={i} className={`chip ${s.saved ? "hot" : ""}`} title={s.error ?? `${s.found} encontrados`}>
              {s.q} <b>{s.error ? "erro" : `+${s.saved}`}</b>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
