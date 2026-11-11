"use client";
import { Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui";
import { api, useLeads, useSettings } from "@/lib/client";

type Msg = { role: "user" | "assistant"; content: string; steps?: { tool: string; ok: boolean }[]; leadIds?: string[] };

const IDEAS = [
  "Quais são os 5 melhores leads pra eu abordar hoje e por quê?",
  "Busca hamburguerias no Itaim Paulista, São Paulo e me diz quais estão sem cardápio online",
  "Me dá um resumo da base: onde está a maior dor?",
  "Analisa os 3 leads com maior score que ainda não têm análise",
];
const TOOL: Record<string, string> = {
  buscar_empresas: "buscou empresas",
  listar_leads: "consultou a base",
  resumo_base: "resumiu a base",
  analisar_lead: "analisou lead",
  procurar_instagram: "procurou Instagram",
  atualizar_lead: "atualizou lead",
};

export default function IaPage() {
  const { settings } = useSettings();
  const { leads, reload } = useLeads();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem("np_chat");
      if (s) setMsgs(JSON.parse(s));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem("np_chat", JSON.stringify(msgs.slice(-30)));
    } catch {}
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  const send = async (t: string) => {
    const content = t.trim();
    if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      const r = await api<{ reply: string; steps: { tool: string; ok: boolean }[]; leadIds: string[] }>("/api/ai/chat", {
        method: "POST",
        json: { messages: next.map(({ role, content }) => ({ role, content })) },
      });
      setMsgs([...next, { role: "assistant", content: r.reply, steps: r.steps, leadIds: r.leadIds }]);
      if (r.steps.length) reload();
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: `Não consegui: ${e instanceof Error ? e.message : "erro"}` }]);
    } finally {
      setBusy(false);
    }
  };

  const hasKey = settings ? Object.entries(settings.keys).some(([k, v]) => ["groq", "openrouter", "moonshot", "custom"].includes(k) && v.set) : true;
  const name = (id: string) => leads?.find((l) => l.id === id)?.name;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 150px)" }}>
      <div className="titlerow">
        <div>
          <h1>Copiloto</h1>
          <div className="sub">Busca, consulta e analisa a base por você. Modelo: <span className="mono">{settings?.ai.model ?? "—"}</span></div>
        </div>
        {msgs.length > 0 && <button className="btn sm" onClick={() => setMsgs([])}>Nova conversa</button>}
      </div>

      {!hasKey && (
        <div className="notice" style={{ marginBottom: 16 }}>
          Falta a chave da IA. <Link className="link" href="/ajustes">Colocar em Ajustes</Link>
        </div>
      )}

      <div className="chat" style={{ flex: 1 }}>
        {msgs.length === 0 && (
          <div className="chips" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            {IDEAS.map((i) => (
              <button key={i} className="chip" style={{ height: "auto", padding: "8px 14px", whiteSpace: "normal", textAlign: "left", lineHeight: "18px" }} onClick={() => send(i)}>{i}</button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role === "user" ? "me" : "ai"}`}>
            {m.content}
            {m.steps?.length ? (
              <div className="steps">
                {m.steps.map((s, j) => <span key={j} className={`pill ${s.ok ? "" : "neg"}`}>{TOOL[s.tool] ?? s.tool}</span>)}
              </div>
            ) : null}
            {m.leadIds?.length ? (
              <div className="steps">
                {m.leadIds.filter(name).slice(0, 8).map((id) => (
                  <Link key={id} href={`/leads/${encodeURIComponent(id)}`} className="pill line">{name(id)}</Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {busy && <div className="msg ai muted"><Spinner /> pensando…</div>}
        <div ref={end} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        style={{ position: "sticky", bottom: 12, display: "flex", gap: 8, marginTop: 16, background: "var(--ground)", paddingTop: 8 }}
      >
        <input className="input" style={{ height: 42, borderRadius: 999, paddingLeft: 18 }} placeholder="Peça uma busca, uma lista ou uma análise…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn gold icon" style={{ width: 42, height: 42 }} disabled={busy || !text.trim()} aria-label="Enviar"><Send size={16} /></button>
      </form>
    </div>
  );
}
