"use client";
import { useEffect, useState } from "react";
import { BrainLoader, Spinner, toast } from "@/components/ui";
import { api, fmt, useLeads, useSettings, useUsage } from "@/lib/client";
import type { KeyName, PublicSettings } from "@/lib/types";

const KEYS: { id: KeyName; label: string; hint: string; url: string }[] = [
  { id: "groq", label: "Groq (IA: GPT-OSS, Qwen)", hint: "grátis, sem cartão", url: "https://console.groq.com/keys" },
  { id: "serpapi", label: "SerpApi (Google Maps)", hint: "250 buscas grátis por mês", url: "https://serpapi.com/manage-api-key" },
  { id: "serper", label: "Serper (Google Maps e busca)", hint: "2.500 créditos grátis, uma vez", url: "https://serper.dev/api-keys" },
  { id: "tavily", label: "Tavily (pesquisa online da Nova)", hint: "1.000 por mês, grátis, renova", url: "https://app.tavily.com" },
  { id: "searchapi", label: "SearchApi (Google Maps, reserva)", hint: "100 buscas grátis", url: "https://www.searchapi.io" },
  { id: "elevenlabs", label: "ElevenLabs (voz natural da Nova)", hint: "grátis, 10 mil créditos por mês", url: "https://elevenlabs.io/app/settings/api-keys" },
  { id: "fish", label: "Fish Audio (voz reserva)", hint: "API s2.1-pro-free; oferta até 30/11/2026. preencha o ID da voz abaixo", url: "https://fish.audio/app/api-keys" },
  { id: "voicestudio", label: "VoiceStudio (voz e transcrição local)", hint: "preencha a URL e a voz abaixo", url: "https://github.com/debpalash/VoiceStudio" },
  { id: "gemini", label: "Gemini (IA reserva)", hint: "use projeto Free Tier para evitar cobrança", url: "https://aistudio.google.com/apikey" },
  { id: "openrouter", label: "OpenRouter (opcional)", hint: "modelos :free", url: "https://openrouter.ai/settings/keys" },
  { id: "moonshot", label: "Kimi oficial (opcional)", hint: "Moonshot", url: "https://platform.moonshot.ai/console/api-keys" },
];

export default function AjustesPage() {
  const { settings, providers, reload } = useSettings();
  const { usage, reload: reloadUsage } = useUsage();
  const { leads, reload: reloadLeads } = useLeads();
  const [keys, setKeys] = useState<Partial<Record<KeyName, string>>>({});
  const [f, setF] = useState<Pick<PublicSettings, "messageBase" | "signature" | "dailyLimit" | "defaultCity" | "ownerName"> | null>(null);
  const [ai, setAi] = useState<PublicSettings["ai"] | null>(null);
  const [voice, setVoice] = useState<PublicSettings["voice"] | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [pw, setPw] = useState({ current: "", next: "" });

  useEffect(() => {
    if (!settings) return;
    setF({ messageBase: settings.messageBase, signature: settings.signature, dailyLimit: settings.dailyLimit, defaultCity: settings.defaultCity, ownerName: settings.ownerName });
    setAi(settings.ai);
    setVoice(settings.voice);
  }, [settings]);

  const save = async (key: string, json: Record<string, unknown>, ok: string) => {
    setBusy(key);
    try {
      await api("/api/settings", { method: "PATCH", json });
      await reload();
      toast(ok);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", true);
    } finally {
      setBusy(null);
    }
  };

  const loadModels = async () => {
    setBusy("models");
    try {
      const r = await api<{ models: string[] }>("/api/ai/models");
      setModels(r.models);
      toast(`${r.models.length} modelos disponíveis`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", true);
    } finally {
      setBusy(null);
    }
  };

  if (!settings || !f || !ai) return <BrainLoader />;
  const prov = providers?.[ai.provider];
  const modelList = [...new Set([...(prov?.suggested ?? []), ...models, ai.model].filter(Boolean))];
  const samples = (leads ?? []).filter((l) => l.source === "exemplo").length;

  return (
    <>
      <div className="titlerow">
        <div>
          <h1>Ajustes</h1>
          <div className="sub">Chaves, IA, mensagem base e limites.</div>
        </div>
      </div>

      {!settings.storage.persistent && (
        <div className="notice" style={{ marginBottom: "var(--gap)" }}>
          Sem banco conectado: os dados ficam em memória temporária e podem sumir. Conecte o banco (variáveis SUPABASE_URL e SUPABASE_KEY, ou DATABASE_URL) na Vercel.
        </div>
      )}

      <div className="grid g-1-1" style={{ alignItems: "start" }}>
        <div className="stack">
          <section className="panel">
            <div className="panel-h"><h2>Fontes de busca</h2><button className="btn sm ghost" onClick={() => reloadUsage()}>Atualizar</button></div>
            <div className="panel-b" style={{ display: "grid", gap: 14 }}>
              {(usage ?? []).map((u) => (
                <div key={u.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span>{u.label} {u.configured ? null : <span className="muted">· sem chave</span>}</span>
                    <span className="num">{u.limit ? `${fmt.format(u.left ?? 0)} de ${fmt.format(u.limit)}` : "cota não informada"}</span>
                  </div>
                  {u.limit ? <div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${Math.min(100, ((u.left ?? 0) / u.limit) * 100)}%` }} /></div> : null}
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{u.note}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-h"><h2>Chaves</h2><span className="meta">ficam só no servidor</span></div>
            <div className="panel-b" style={{ display: "grid", gap: 12 }}>
              {KEYS.map((k) => {
                const st = settings.keys[k.id];
                return (
                  <label key={k.id} className="field">
                    <span>
                      {k.label} · {st.set ? <span className="pos">ativa {st.hint}{st.fromEnv ? " (Vercel)" : ""}</span> : k.hint} · <a className="link" href={k.url} target="_blank" rel="noreferrer">pegar chave</a>
                    </span>
                    <input className="input mono" type="password" autoComplete="off" disabled={st.fromEnv} placeholder={st.fromEnv ? "definida na Vercel" : st.set ? "colar nova chave para trocar" : "colar chave"} value={keys[k.id] ?? ""} onChange={(e) => setKeys({ ...keys, [k.id]: e.target.value })} />
                  </label>
                );
              })}
              <div>
                <button className="btn primary" disabled={busy === "keys" || !Object.values(keys).some(Boolean)} onClick={() => save("keys", { keys }, "Chaves salvas").then(() => { setKeys({}); reloadUsage(); })}>
                  {busy === "keys" && <Spinner />} Salvar chaves
                </button>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-h"><h2>Reservas de voz</h2></div>
            <div className="panel-b" style={{ display: "grid", gap: 12 }}>
              <p>ElevenLabs → Fish Audio → VoiceStudio → navegador. A transcrição usa Groq → VoiceStudio. Só são usados serviços configurados.</p>
              {voice && ([['fishVoiceId', 'ID da voz Fish Audio'], ['studioUrl', 'URL do VoiceStudio (HTTPS; acessível pelo servidor)'], ['studioVoice', 'ID da voz VoiceStudio'], ['studioModel', 'Modelo VoiceStudio']] as const).map(([id, label]) => <label className="field" key={id}><span>{label}</span><input className="input" value={voice[id]} onChange={e => setVoice({ ...voice, [id]: e.target.value })} /></label>)}
              <small>Fish usa apenas s2.1-pro-free, oferta anunciada até 30/11/2026. Se acabar, passa à próxima reserva. VoiceStudio precisa estar ligado e acessível; localhost na Vercel não é o seu computador.</small>
              <button className="btn" disabled={!voice || busy === "voice"} onClick={() => save("voice", { voice }, "Voz salva")}>Salvar voz</button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-h"><h2>Base</h2><span className="meta">{settings.storage.kind}</span></div>
            <div className="panel-b" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <a className="btn sm" href="/api/export">Exportar CSV</a>
              {samples > 0 && (
                <button className="btn sm danger" onClick={async () => { await api("/api/sample", { method: "DELETE" }); await reloadLeads(); toast("Exemplos apagados"); }}>
                  Apagar {samples} leads de exemplo
                </button>
              )}
              <span className="muted" style={{ fontSize: 12 }}>{fmt.format(leads?.length ?? 0)} leads</span>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-h"><h2>IA</h2><button className="btn sm ghost" onClick={loadModels} disabled={busy === "models"}>{busy === "models" && <Spinner size={12} />} Listar modelos</button></div>
            <div className="panel-b" style={{ display: "grid", gap: 12 }}>
              <label className="field">
                <span>Provedor</span>
                <select className="select" value={ai.provider} onChange={(e) => { const p = e.target.value as PublicSettings["ai"]["provider"]; const d = providers?.[p]; setAi({ ...ai, provider: p, baseUrl: d?.baseUrl ?? "", model: d?.suggested[0] ?? "", webModel: d?.web ?? "" }); setModels([]); }}>
                  {Object.entries(providers ?? {}).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Modelo de análise</span>
                <input className="input mono" list="modelos" value={ai.model} onChange={(e) => setAi({ ...ai, model: e.target.value })} />
                <datalist id="modelos">{modelList.map((m) => <option key={m} value={m} />)}</datalist>
              </label>
              <label className="field">
                <span>Modelo com pesquisa na web (opcional)</span>
                <input className="input mono" value={ai.webModel ?? ""} onChange={(e) => setAi({ ...ai, webModel: e.target.value })} placeholder="groq/compound-mini" />
              </label>
              {ai.provider === "custom" && (
                <label className="field"><span>Base URL</span><input className="input mono" value={ai.baseUrl} onChange={(e) => setAi({ ...ai, baseUrl: e.target.value })} placeholder="https://…/v1" /></label>
              )}
              <label className="field"><span><input type="checkbox" checked={ai.fallbackEnabled !== false} onChange={(e) => setAi({ ...ai, fallbackEnabled: e.target.checked })} /> Trocar automaticamente de IA quando falhar</span><small>Preserva o modelo principal. Reservas com chave: Groq → OpenRouter gratuito → Gemini Flash-Lite. Gemini/Groq devem estar em contas gratuitas; o painel não consulta seu faturamento. Kimi e endpoint personalizado continuam disponíveis como principal.</small></label>
              <div><button className="btn primary" disabled={busy === "ai"} onClick={() => save("ai", { ai }, "IA salva")}>{busy === "ai" && <Spinner />} Salvar IA</button></div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-h"><h2>Abordagem</h2></div>
            <div className="panel-b" style={{ display: "grid", gap: 12 }}>
              <label className="field">
                <span>Mensagem base · variáveis: {"{empresa} {projeto} {demo} {bairro}"}</span>
                <textarea className="textarea" rows={5} value={f.messageBase} onChange={(e) => setF({ ...f, messageBase: e.target.value })} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="field"><span>Limite de abordagens por dia</span><input className="input num" type="number" min={1} max={200} value={f.dailyLimit} onChange={(e) => setF({ ...f, dailyLimit: Number(e.target.value) })} /></label>
                <label className="field"><span>Cidade padrão do Radar</span><input className="input" value={f.defaultCity} onChange={(e) => setF({ ...f, defaultCity: e.target.value })} /></label>
              </div>
              <label className="field"><span>Como a Nova te chama</span><input className="input" value={f.ownerName} onChange={(e) => setF({ ...f, ownerName: e.target.value })} /></label>
              <div><button className="btn primary" disabled={busy === "msg"} onClick={() => save("msg", f, "Salvo")}>{busy === "msg" && <Spinner />} Salvar</button></div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-h"><h2>Senha do painel</h2></div>
            <div className="panel-b" style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <label className="field"><span>Atual</span><input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
              <label className="field"><span>Nova</span><input className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
              <button className="btn" disabled={pw.next.length < 6} onClick={async () => {
                try { await api("/api/auth", { method: "POST", json: { mode: "change", current: pw.current, password: pw.next } }); toast("Senha trocada. Entre de novo."); setTimeout(() => (window.location.href = "/entrar"), 900); }
                catch (e) { toast(e instanceof Error ? e.message : "Erro", true); }
              }}>Trocar</button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
