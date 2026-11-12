"use client";
import { Mic, Send, Square, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, fmt, useLeads, useSettings, useUsage } from "@/lib/client";
import { speakNatural, stopSpeaking, useVoice } from "@/lib/voice";
import type { Lead } from "@/lib/types";
import { Orb, type OrbState } from "./Orb";
import { Spinner, toast } from "./ui";

export type Msg = { role: "user" | "assistant"; content: string; steps?: { tool: string; ok: boolean }[]; leadIds?: string[] };

const TOOL: Record<string, string> = {
  buscar_empresas: "buscou empresas",
  listar_leads: "consultou a base",
  resumo_base: "resumiu a base",
  analisar_lead: "analisou lead",
  procurar_instagram: "procurou Instagram",
  atualizar_lead: "atualizou lead",
};

const DAY = 86400000;

/** Briefing do dia, calculado da base (sem gastar IA). */
export function briefing(leads: Lead[] | undefined, name: string) {
  const h = new Date().getHours();
  const greet = `${h < 5 ? "Boa noite" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"}, ${name}.`;
  const all = (leads ?? []).filter((l) => l.status !== "descartado" && !l.optOut);
  if (!all.length) return { greet, text: "A base está vazia. Me diga um nicho e um bairro que eu faço a primeira varredura.", empty: true };
  const open = all.filter((l) => ["novo", "qualificado", "demo"].includes(l.status));
  const hot = open.filter((l) => l.temperature === "quente").length;
  const demo = open.filter((l) => l.demoUrl).length;
  const wait = all.filter((l) => l.status === "abordado" && l.contactedAt && Date.now() - new Date(l.contactedAt).getTime() > 2 * DAY).length;
  const talking = all.filter((l) => ["respondeu", "negociando"].includes(l.status)).length;
  const meet = all.filter((l) => l.status === "reuniao").length;
  const parts = [
    hot ? `${hot} ${hot === 1 ? "lead quente espera" : "leads quentes esperam"} a primeira mensagem` : "nenhum lead quente em aberto",
    demo ? `${demo} já ${demo === 1 ? "tem" : "têm"} prévia pronta` : "",
    wait ? `${wait} sem resposta há mais de dois dias` : "",
    talking ? `${talking} em conversa` : "",
    meet ? `${meet} ${meet === 1 ? "reunião marcada" : "reuniões marcadas"}` : "",
  ].filter(Boolean);
  const next = talking ? "Prioridade: responder quem já está em conversa." : demo ? "Prioridade: mandar as prévias prontas." : hot ? "Prioridade: montar a prévia do lead de maior score." : "Prioridade: uma nova varredura no Radar.";
  return { greet, text: `${parts.join("; ")}. ${next}`.replace(/^./, (c) => c.toUpperCase()), empty: false };
}

export function useCopilot() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const ready = useRef(false);
  const { reload } = useLeads();
  useEffect(() => {
    try {
      const s = sessionStorage.getItem("np_chat");
      if (s) setMsgs(JSON.parse(s));
    } catch {}
    ready.current = true;
  }, []);
  useEffect(() => {
    if (!ready.current) return;
    try {
      sessionStorage.setItem("np_chat", JSON.stringify(msgs.slice(-30)));
    } catch {}
  }, [msgs]);

  const send = useCallback(
    async (text: string): Promise<string | null> => {
      const content = text.trim();
      if (!content || busy) return null;
      const next: Msg[] = [...msgs, { role: "user", content }];
      setMsgs(next);
      setBusy(true);
      try {
        const r = await api<{ reply: string; steps: { tool: string; ok: boolean }[]; leadIds: string[] }>("/api/ai/chat", {
          method: "POST",
          json: { messages: next.map(({ role, content }) => ({ role, content })) },
        });
        setMsgs([...next, { role: "assistant", content: r.reply, steps: r.steps, leadIds: r.leadIds }]);
        if (r.steps.length) reload();
        return r.reply;
      } catch (e) {
        const m = `Não consegui: ${e instanceof Error ? e.message : "erro"}`;
        setMsgs([...next, { role: "assistant", content: m }]);
        return m;
      } finally {
        setBusy(false);
      }
    },
    [msgs, busy, reload],
  );
  return { msgs, busy, send, clear: () => setMsgs([]) };
}

export function MsgExtras({ m, leads }: { m: Msg; leads?: Lead[] }) {
  const name = (id: string) => leads?.find((l) => l.id === id)?.name;
  return (
    <>
      {m.steps?.length ? (
        <div className="steps">
          {m.steps.map((s, j) => (
            <span key={j} className={`pill ${s.ok ? "" : "neg"}`}>{TOOL[s.tool] ?? s.tool}</span>
          ))}
        </div>
      ) : null}
      {m.leadIds?.some(name) ? (
        <div className="steps">
          {m.leadIds.filter(name).slice(0, 8).map((id) => (
            <Link key={id} href={`/leads/${encodeURIComponent(id)}`} className="pill line">{name(id)}</Link>
          ))}
        </div>
      ) : null}
    </>
  );
}

const IDEAS = ["Quem eu abordo hoje?", "Varre clínicas de estética no Tatuapé", "Onde está a maior dor da base?"];

/** A Nova: orbe + voz + conversa. `full` mostra a conversa inteira (aba IA); sem ele, só a última troca. */
export function Assistant({ full }: { full?: boolean }) {
  const { leads } = useLeads();
  const { settings } = useSettings();
  const { usage } = useUsage();
  const { msgs, busy, send, clear } = useCopilot();
  const [text, setText] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setVoiceOn(localStorage.getItem("np_voice") !== "off");
    } catch {}
    return () => stopSpeaking();
  }, []);
  useEffect(() => {
    if (full) end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy, full]);

  const natural = !!(settings?.keys.elevenlabs?.set || settings?.keys.lmnt?.set);
  const say = (t: string) => voiceOn && speakNatural(t, natural, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) });
  const ask = async (t: string, spoken = false) => {
    setText("");
    const reply = await send(t);
    if (reply && (spoken || voiceOn)) say(reply);
  };
  const voice = useVoice((t) => ask(t, true), (m) => toast(m, true));

  const b = briefing(leads, settings?.ownerName || "Victor");
  const state: OrbState = voice.listening ? "listening" : busy || voice.working ? "thinking" : speaking ? "speaking" : "idle";
  const lastUser = [...msgs].reverse().find((m) => m.role === "user");
  const lastAi = msgs[msgs.length - 1]?.role === "assistant" ? msgs[msgs.length - 1] : undefined;
  const hint = { idle: "Toque no orbe e fale", listening: "Ouvindo…", thinking: "Trabalhando…", speaking: "Falando · toque para calar" }[state];

  const orbClick = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else voice.toggle();
  };
  const toggleVoice = () => {
    const v = !voiceOn;
    setVoiceOn(v);
    if (!v) stopSpeaking();
    try {
      localStorage.setItem("np_voice", v ? "on" : "off");
    } catch {}
  };

  const search = usage?.filter((u) => u.id !== "osm" && u.configured) ?? [];
  const searchLeft = search.reduce((a, u) => a + (u.left ?? 0), 0);
  const aiOk = settings ? Object.entries(settings.keys).some(([k, v]) => ["groq", "openrouter", "moonshot", "custom"].includes(k) && v.set) : false;

  return (
    <section className={`hero ${full ? "full" : ""}`} data-state={state}>
      {!full && <Circuits />}
      <div className="hero-orb">
        <Orb state={state} level={voice.level} size={full ? 200 : 300} onClick={orbClick} />
        <div className="hero-hint" data-state={state}>{hint}</div>
      </div>

      <div className="hero-body">
        <div className="hero-top">
          <span className="hero-tag">Nova · copiloto de prospecção</span>
          <span style={{ display: "flex", gap: 4 }}>
            {msgs.length > 0 && <button className="btn sm ghost" onClick={() => { clear(); stopSpeaking(); }}>Nova conversa</button>}
            <button className="btn sm ghost icon" onClick={toggleVoice} aria-label={voiceOn ? "Desligar voz" : "Ligar voz"} title={voiceOn ? "Voz ligada" : "Voz desligada"}>
              {voiceOn ? <Volume2 size={15} strokeWidth={1.6} /> : <VolumeX size={15} strokeWidth={1.6} />}
            </button>
          </span>
        </div>

        {full ? (
          <div className="chat hero-chat">
            {msgs.length === 0 && <p className="hero-brief">{b.greet} {b.text}</p>}
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.role === "user" ? "me" : "ai"}`}>
                {m.content}
                <MsgExtras m={m} leads={leads} />
              </div>
            ))}
            {busy && <div className="msg ai muted"><Spinner /> trabalhando…</div>}
            <div ref={end} />
          </div>
        ) : lastUser ? (
          <div className="hero-talk">
            <div className="hero-q">“{lastUser.content}”</div>
            {busy ? (
              <div className="hero-a muted"><Spinner /> trabalhando…</div>
            ) : lastAi ? (
              <div className="hero-a">
                {lastAi.content.length > 520 ? lastAi.content.slice(0, 520) + "…" : lastAi.content}
                <MsgExtras m={lastAi} leads={leads} />
                {msgs.length > 2 || lastAi.content.length > 520 ? <div style={{ marginTop: 8 }}><Link href="/ia" className="link muted">Ver conversa completa</Link></div> : null}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <h1 className="hero-greet">{b.greet}</h1>
            <p className="hero-brief">{b.text}</p>
          </>
        )}

        <form
          className="hero-input"
          onSubmit={(e) => {
            e.preventDefault();
            ask(text);
          }}
        >
          <button type="button" className={`btn icon mic ${voice.listening ? "on" : ""}`} onClick={voice.toggle} aria-label={voice.listening ? "Parar de ouvir" : "Falar"}>
            {voice.listening ? <Square size={14} /> : <Mic size={16} strokeWidth={1.7} />}
          </button>
          <input className="input" placeholder="Fale ou escreva: uma busca, uma lista, uma análise…" value={voice.listening ? voice.interim : text} onChange={(e) => setText(e.target.value)} readOnly={voice.listening} />
          <button className="btn gold icon" disabled={busy || !text.trim()} aria-label="Enviar"><Send size={15} /></button>
        </form>

        {!lastUser && (
          <div className="chips">
            {IDEAS.map((i) => (
              <button key={i} className="chip" onClick={() => ask(i)} disabled={busy}>{i}</button>
            ))}
            {!b.empty && <button className="chip" onClick={() => say(`${b.greet} ${b.text}`)}>Ouvir o briefing</button>}
          </div>
        )}

        <div className="sys">
          <span><i className={`led ${search.length ? "" : "off"}`} />Busca <b className="num">{search.length ? fmt.format(searchLeft) : "sem chave"}</b></span>
          <span><i className={`led ${aiOk ? "" : "off"}`} />IA <b className="mono">{aiOk ? (settings?.ai.model.split("/").pop() ?? "") : "sem chave"}</b></span>
          <span><i className={`led ${settings?.storage.persistent ? "" : "off"}`} />Banco <b>{settings?.storage.kind ?? "—"}</b></span>
          <span><i className={`led ${natural ? "" : "off"}`} />Voz <b>{natural ? "natural" : "do navegador"}</b></span>
          <span><i className="led" />Base <b className="num">{fmt.format(leads?.length ?? 0)}</b></span>
        </div>
      </div>
    </section>
  );
}

const TRACKS = [
  "M0,150 H150 L196,104 H470 L506,68 H1000",
  "M0,150 H128 L186,208 H430 L474,252 H1000",
  "M0,150 H250 L282,118 H640",
  "M0,150 H224 L262,188 H590 L620,218 H860",
  "M0,150 H96 L150,42 H380 L404,18 H760",
  "M0,150 H86 L146,270 H340",
  "M0,150 H520",
];

/** Trilhas de circuito que saem do orbe, com pulsos de luz: o cérebro do logo, em movimento. */
function Circuits() {
  return (
    <svg className="hero-circuits" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="trk" x1="0" x2="1">
          <stop offset="0" stopColor="#d6b25e" />
          <stop offset="0.55" stopColor="#3ecf8e" />
          <stop offset="1" stopColor="#3ecf8e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {TRACKS.map((d, i) => (
        <g key={i}>
          <path d={d} className="trk" stroke="url(#trk)" />
          <path d={d} className="pulse" pathLength={1000} style={{ animationDuration: `${3.2 + (i % 4) * 0.9}s`, animationDelay: `${-i * 0.7}s`, stroke: i % 2 ? "#7ff0bd" : "#ffe2a0" }} />
        </g>
      ))}
    </svg>
  );
}
