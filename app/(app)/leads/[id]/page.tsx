"use client";
import { ArrowLeft, Bot, ExternalLink, Globe, MapPin, RefreshCw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pains, Score, Spinner, toast, WhatsAppButton } from "@/components/ui";
import { api, fillMessage, fmt, patchLeadCache, relTime, useLead, useSettings } from "@/lib/client";
import { contactWindow } from "@/lib/niches";
import { WEBSITE_LABEL } from "@/lib/phone";
import { siteIsWeak, suggestProject } from "@/lib/score";
import { STATUS_LABEL, STATUS_ORDER, type Lead, type LeadStatus } from "@/lib/types";

export default function LeadPage() {
  const { id: raw } = useParams<{ id: string }>();
  const id = decodeURIComponent(raw);
  const router = useRouter();
  const { lead, isLoading, error } = useLead(id);
  const { settings } = useSettings();
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [demo, setDemo] = useState("");
  const [msg, setMsg] = useState("");
  const [ig, setIg] = useState("");

  useEffect(() => {
    if (!lead) return;
    setNotes(lead.notes ?? "");
    setDemo(lead.demoUrl ?? "");
    setIg(lead.instagram?.handle ?? "");
  }, [lead?.id, lead?.notes, lead?.demoUrl, lead?.instagram?.handle]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (lead && settings) setMsg(fillMessage(lead.ai?.mensagem || settings.messageBase, lead, settings.signature));
  }, [lead?.id, lead?.ai?.at, lead?.demoUrl, settings?.messageBase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="notice neg">{error.message}</div>;
  if (isLoading || !lead) return <div className="muted"><Spinner /> carregando…</div>;
  const l = lead;
  const isSample = l.source === "exemplo";

  const patch = async (json: Record<string, unknown>, ok?: string) => {
    try {
      const r = await api<{ lead: Lead }>(`/api/leads/${encodeURIComponent(l.id)}`, { method: "PATCH", json });
      patchLeadCache(r.lead);
      if (ok) toast(ok);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", true);
    }
  };

  const act = async (key: string, fn: () => Promise<{ lead?: Lead; leads?: Lead[] }>, ok: string) => {
    setBusy(key);
    try {
      const r = await fn();
      const nl = r.lead ?? r.leads?.[0];
      if (nl) patchLeadCache(nl);
      toast(ok);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", true);
    } finally {
      setBusy(null);
    }
  };

  const analyze = (web: boolean) => act(web ? "iaweb" : "ia", () => api("/api/ai/analyze", { method: "POST", json: { id: l.id, web } }), "Análise pronta");
  const audit = () => act("audit", () => api("/api/audit", { method: "POST", json: { ids: [l.id] } }), "Site auditado");
  const findIg = () => act("ig", () => api("/api/enrich", { method: "POST", json: { ids: [l.id] } }), "Instagram verificado");
  const remove = async () => {
    if (!window.confirm(`Apagar ${l.name} da base?`)) return;
    await api(`/api/leads/${encodeURIComponent(l.id)}`, { method: "DELETE" });
    router.push("/leads");
  };

  const weak = siteIsWeak(l.audit);
  const sug = l.ai?.projeto ?? suggestProject(l);
  const a = l.audit;
  const win = contactWindow(`${l.category ?? ""} ${l.name}`, l.niche);

  return (
    <>
      <Link href="/leads" className="muted" style={{ display: "inline-flex", gap: 6, alignItems: "center", marginBottom: 12 }}>
        <ArrowLeft size={14} /> Leads
      </Link>

      <section className="panel" style={{ marginBottom: "var(--gap)" }}>
        <div className="panel-b" style={{ paddingTop: 18, display: "flex", gap: 16, justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ minWidth: 0, flex: "1 1 320px" }}>
            <h1 style={{ fontSize: 22, lineHeight: "28px", margin: 0, fontWeight: 600 }}>{l.name}</h1>
            <div className="dim" style={{ marginTop: 4 }}>
              {[l.category, l.district, l.city].filter(Boolean).join(" · ")}
              {l.rating ? <> · <span className="num">{l.rating.toFixed(1)}</span> com <span className="num">{fmt.format(l.reviews ?? 0)}</span> avaliações</> : null}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
              <Score value={l.score} temp={l.temperature} />
              <Pains pains={l.pains} max={6} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select className="select" style={{ width: 150 }} value={l.status} onChange={(e) => patch({ status: e.target.value as LeadStatus })} aria-label="Status">
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            {l.mapsUrl && (
              <a className="btn" href={l.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={14} strokeWidth={1.6} /> Maps</a>
            )}
            <button className="btn icon danger" onClick={remove} aria-label="Apagar lead"><Trash2 size={15} strokeWidth={1.6} /></button>
          </div>
        </div>
      </section>

      <div className="grid g-2-1" style={{ alignItems: "start" }}>
        <div className="stack">
          <section className="panel">
            <div className="panel-h">
              <h2>Análise da IA</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn sm" disabled={!!busy || isSample} onClick={() => analyze(true)} title="Pesquisa o negócio na internet antes de analisar">
                  {busy === "iaweb" ? <Spinner size={12} /> : <Search size={13} strokeWidth={1.6} />} Com pesquisa web
                </button>
                <button className="btn sm gold" disabled={!!busy || isSample} onClick={() => analyze(false)}>
                  {busy === "ia" ? <Spinner size={12} /> : <Bot size={13} strokeWidth={1.6} />} {l.ai ? "Refazer" : "Analisar"}
                </button>
              </div>
            </div>
            <div className="panel-b">
              {l.ai ? (
                <div style={{ display: "grid", gap: 14, fontSize: 14, lineHeight: "22px" }}>
                  <p style={{ margin: 0 }}>{l.ai.resumo}</p>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Dores</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>{l.ai.dores.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </div>
                  <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 14 }}>
                    <div className="muted" style={{ fontSize: 12 }}>Peça para mostrar</div>
                    <div style={{ fontWeight: 600, marginTop: 2 }}><span className="gold">{l.ai.projeto.tipo}</span> — {l.ai.projeto.titulo}</div>
                    <div className="dim" style={{ marginTop: 2 }}>{l.ai.projeto.porque}</div>
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>{l.ai.projeto.elementos.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </div>
                  <div className="kv">
                    <dt>Oferecer depois</dt><dd>{l.ai.ofertas.join(" → ") || "—"}</dd>
                    <dt>Ângulo</dt><dd>{l.ai.abordagem || "—"}</dd>
                    <dt>Prioridade</dt><dd>{l.ai.prioridade}</dd>
                  </div>
                  {l.ai.objecoes?.length ? (
                    <div>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Se ele disser…</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>{l.ai.objecoes.map((d, i) => <li key={i}>{d}</li>)}</ul>
                    </div>
                  ) : null}
                  <div className="muted" style={{ fontSize: 12 }}>{l.ai.model} · {relTime(l.ai.at)}</div>
                </div>
              ) : (
                <div className="empty">
                  <span>
                    {isSample ? "Lead de exemplo: a IA só analisa leads reais." : "Ainda sem análise."} Sugestão automática: <b>{sug.tipo}</b> — {sug.titulo}.
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-h"><h2>Abordagem</h2><span className="meta">{win.now ? <span className="pos">bom horário agora · </span> : null}melhor horário: {win.label}</span></div>
            <div className="panel-b" style={{ display: "grid", gap: 12 }}>
              <label className="field">
                <span>Link da prévia que você montou</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input" placeholder="https://…vercel.app" value={demo} onChange={(e) => setDemo(e.target.value)} />
                  <button className="btn" disabled={demo === (l.demoUrl ?? "")} onClick={() => patch({ demoUrl: demo }, "Prévia salva")}>Salvar</button>
                </div>
              </label>
              <label className="field">
                <span>Mensagem (edite antes de enviar)</span>
                <textarea className="textarea" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} />
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <WhatsAppButton lead={l} template={msg} onSent={(m) => patch({ event: "mensagem", message: m })} label="Abrir no WhatsApp" />
                <button className="btn" onClick={() => navigator.clipboard.writeText(msg).then(() => toast("Mensagem copiada"))}>Copiar</button>
                <label className="check" style={{ marginLeft: "auto" }}>
                  <input type="checkbox" checked={!!l.optOut} onChange={(e) => patch({ optOut: e.target.checked }, e.target.checked ? "Não será mais abordado" : "Liberado")} />
                  Pediu para não receber
                </label>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-h"><h2>Notas</h2></div>
            <div className="panel-b" style={{ display: "grid", gap: 10 }}>
              <textarea className="textarea" rows={3} placeholder="Nome do dono, o que ele respondeu, combinado…" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div><button className="btn sm" disabled={notes === (l.notes ?? "")} onClick={() => patch({ notes }, "Nota salva")}>Salvar nota</button></div>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-h"><h2>Contato e presença</h2></div>
            <div className="panel-b">
              <dl className="kv">
                <dt>Telefone</dt>
                <dd>{l.phone ? <><span className="num">{l.phone}</span> <span className={l.phoneKind === "celular" ? "pos" : "muted"}>{l.phoneKind}</span></> : <span className="muted">—</span>}</dd>
                <dt>Endereço</dt><dd>{l.address ?? <span className="muted">—</span>}</dd>
                <dt>Presença</dt>
                <dd>
                  <span className={l.websiteKind === "proprio" ? "" : "gold"}>{WEBSITE_LABEL[l.websiteKind]}</span>
                  {l.website && <> · <a className="link" href={l.website} target="_blank" rel="noreferrer">abrir <ExternalLink size={11} /></a></>}
                </dd>
                <dt>Instagram</dt>
                <dd>
                  {l.instagram ? (
                    <a className="link" href={l.instagram.url} target="_blank" rel="noreferrer">@{l.instagram.handle}</a>
                  ) : (
                    <span className="muted">{l.instagramChecked ? "não encontrado" : "não verificado"}</span>
                  )}
                  {l.instagram?.followers !== undefined && <> · <span className="num">{fmt.format(l.instagram.followers)}</span> seguidores</>}
                </dd>
                <dt>Horário</dt><dd>{l.hours?.length ? l.hours.slice(0, 2).join(" · ") : <span className="muted">não informado no Google</span>}</dd>
              </dl>
              <div className="hr" />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input className="input" style={{ flex: "1 1 140px" }} placeholder="@ do Instagram" value={ig} onChange={(e) => setIg(e.target.value)} />
                <button className="btn sm" style={{ height: 34 }} disabled={ig.replace(/^@/, "") === (l.instagram?.handle ?? "")} onClick={() => patch({ instagramHandle: ig }, "Instagram salvo")}>Salvar</button>
                <button className="btn sm" style={{ height: 34 }} disabled={!!busy || isSample} onClick={findIg} title="Gasta 1 crédito de busca">
                  {busy === "ig" ? <Spinner size={12} /> : <Search size={13} strokeWidth={1.6} />} Procurar
                </button>
              </div>
            </div>
          </section>

          {(l.websiteKind === "proprio" || l.websiteKind === "construtor") && (
            <section className="panel">
              <div className="panel-h">
                <h2>Raio-x do site</h2>
                <button className="btn sm" disabled={!!busy || isSample} onClick={audit}>
                  {busy === "audit" ? <Spinner size={12} /> : <RefreshCw size={13} strokeWidth={1.6} />} {a ? "Refazer" : "Auditar"}
                </button>
              </div>
              <div className="panel-b">
                {a ? (
                  <dl className="kv">
                    <dt>Situação</dt><dd>{a.ok ? <span className="pos">no ar</span> : <span className="neg">{a.error ?? `erro ${a.status}`}</span>}{weak.length ? <span className="gold"> · {weak.join(", ")}</span> : null}</dd>
                    <dt>Celular</dt><dd>{a.mobile === undefined ? "—" : a.mobile ? "adaptado" : <span className="neg">não adaptado</span>}</dd>
                    <dt>Cadeado (https)</dt><dd>{a.https === undefined ? "—" : a.https ? "sim" : <span className="neg">não</span>}</dd>
                    <dt>Velocidade</dt><dd className="num">{a.ms ? `${(a.ms / 1000).toFixed(1)} s` : "—"}</dd>
                    <dt>Feito em</dt><dd>{a.platform ?? "—"}{a.copyrightYear ? ` · rodapé ${a.copyrightYear}` : ""}</dd>
                    <dt>Pixel da Meta</dt><dd>{a.metaPixel ? "tem" : <span className="gold">não tem</span>}</dd>
                    <dt>Google</dt><dd>{a.googleAds ? "anuncia (tag Ads)" : a.googleTag ? "só Analytics" : <span className="gold">sem tag</span>}</dd>
                    <dt>Loja/carrinho</dt><dd>{a.ecommerce ? "tem" : "não"}</dd>
                    <dt>Botão WhatsApp</dt><dd>{a.whatsappButton ? "tem" : "não"}</dd>
                  </dl>
                ) : (
                  <div className="empty"><span><Globe size={14} /> Ainda não auditado.</span></div>
                )}
              </div>
            </section>
          )}

          <section className="panel">
            <div className="panel-h"><h2>Histórico</h2></div>
            <div className="panel-b" style={{ display: "grid", gap: 8 }}>
              {(l.history ?? []).slice(0, 12).map((h, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 12 }}>
                  <span className="muted" style={{ fontSize: 12 }}>{relTime(h.at)}</span>
                  <span className="dim" style={{ overflowWrap: "anywhere" }}>{h.text}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
