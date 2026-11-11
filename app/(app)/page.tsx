"use client";
import { ArrowUpRight, Radar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PainMatrix } from "@/components/PainMatrix";
import { Pains, Score, Spinner, toast, WebLabel, WhatsAppButton } from "@/components/ui";
import { api, fmt, patchLeadCache, useLeads, useSettings } from "@/lib/client";
import { STATUS_LABEL, type Lead, type LeadStatus } from "@/lib/types";

const OPEN: LeadStatus[] = ["novo", "qualificado", "demo"];
const FUNNEL: LeadStatus[] = ["novo", "qualificado", "demo", "abordado", "respondeu", "negociando", "fechado"];

export default function Overview() {
  const { leads, isLoading, error, reload } = useLeads();
  const { settings } = useSettings();
  const router = useRouter();
  const [loadingSample, setLoadingSample] = useState(false);

  const data = useMemo(() => {
    const all = (leads ?? []).filter((l) => l.status !== "descartado");
    const open = all.filter((l) => OPEN.includes(l.status) && !l.optOut);
    const hot = open.filter((l) => l.temperature === "quente");
    // fila: prévia pronta primeiro, depois score
    const queue = [...open]
      .filter((l) => l.phoneE164 || l.source === "exemplo")
      .sort((a, b) => Number(!!b.demoUrl) - Number(!!a.demoUrl) || b.score - a.score)
      .slice(0, 6);
    const weekAgo = Date.now() - 7 * 86400000;
    const contactedWeek = all.filter((l) => l.contactedAt && new Date(l.contactedAt).getTime() > weekAgo).length;
    const contacted = all.filter((l) => l.contactedAt).length;
    const replied = all.filter((l) => ["respondeu", "negociando", "fechado"].includes(l.status)).length;
    const closed = all.filter((l) => l.status === "fechado").length;
    const funnel = FUNNEL.map((s) => ({ s, n: all.filter((l) => l.status === s).length }));
    const noSite = hot.filter((l) => l.pains.includes("sem_site")).length;
    const withDemo = open.filter((l) => l.demoUrl).length;
    return { all, open, hot, queue, contactedWeek, contacted, replied, closed, funnel, noSite, withDemo };
  }, [leads]);

  const loadSample = async () => {
    setLoadingSample(true);
    try {
      await api("/api/sample", { method: "POST" });
      await reload();
      toast("14 leads de exemplo carregados. Dá pra apagar em Ajustes.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", true);
    } finally {
      setLoadingSample(false);
    }
  };

  const markSent = async (l: Lead, message: string) => {
    if (l.source === "exemplo") return;
    try {
      const r = await api<{ lead: Lead }>(`/api/leads/${encodeURIComponent(l.id)}`, { method: "PATCH", json: { event: "mensagem", message } });
      patchLeadCache(r.lead);
    } catch {
      /* o WhatsApp abriu mesmo assim */
    }
  };

  if (error) return <div className="notice neg">Não consegui carregar a base: {error.message}</div>;

  const first = !isLoading && data.all.length === 0;
  const maxFunnel = Math.max(1, ...data.funnel.map((f) => f.n));
  const replyRate = data.contacted ? Math.round((data.replied / data.contacted) * 100) : null;

  return (
    <>
      <div className="titlerow">
        <div>
          <h1>Quem abordar hoje</h1>
          <div className="sub">
            {isLoading ? (
              <span className="skel" style={{ width: 320, height: 14 }} />
            ) : first ? (
              "Base vazia. Comece buscando um nicho num bairro."
            ) : (
              <>
                <span className="gold num">{data.hot.length}</span> leads quentes ainda não abordados
                {data.noSite ? <> · <span className="num">{data.noSite}</span> sem site</> : null}
                {data.withDemo ? <> · <span className="num">{data.withDemo}</span> com prévia pronta</> : null}
              </>
            )}
          </div>
        </div>
        <div className="actions">
          <Link href="/radar" className="btn primary">
            <Radar size={15} strokeWidth={1.6} /> Buscar empresas
          </Link>
          {!first && (
            <Link href="/abordar" className="btn">
              Abrir fila do dia
            </Link>
          )}
        </div>
      </div>

      {first ? (
        <div className="panel" style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600 }}>Como funciona</h2>
          <ol className="dim" style={{ margin: "0 0 18px", paddingLeft: 18, lineHeight: "24px", fontSize: 14 }}>
            <li>No Radar, escolhe o nicho e o bairro. O painel puxa do Google Maps nome, telefone, site, nota e avaliações.</li>
            <li>Ele audita o site de cada um e calcula a dor: sem site, site fraco, Instagram fraco, sem anúncio, sem cardápio ou loja.</li>
            <li>A IA analisa o negócio e diz qual peça visual montar pra impressionar (página, cardápio, loja, identidade).</li>
            <li>Você monta a prévia, cola o link no lead e aborda pelo seu WhatsApp, um por um.</li>
          </ol>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/radar" className="btn gold">
              <Radar size={15} strokeWidth={1.6} /> Primeira busca
            </Link>
            <button className="btn" onClick={loadSample} disabled={loadingSample}>
              {loadingSample ? <Spinner /> : null} Ver com dados de exemplo
            </button>
          </div>
        </div>
      ) : (
        <div className="stack">
          <div className="kpis">
            <div className="kpi lead">
              <div className="l">Quentes para abordar</div>
              <div className="v">{isLoading ? "—" : fmt.format(data.hot.length)}</div>
            </div>
            <div className="kpi">
              <div className="l">Na base</div>
              <div className="v">{isLoading ? "—" : fmt.format(data.all.length)}</div>
            </div>
            <div className="kpi">
              <div className="l">Abordados em 7 dias</div>
              <div className="v">{isLoading ? "—" : fmt.format(data.contactedWeek)}</div>
            </div>
            <div className="kpi">
              <div className="l">Responderam</div>
              <div className="v">
                {isLoading ? "—" : fmt.format(data.replied)}
                <small>{replyRate === null ? "—" : `${replyRate}% dos abordados`}</small>
              </div>
            </div>
            <div className="kpi">
              <div className="l">Fechados</div>
              <div className="v">{isLoading ? "—" : fmt.format(data.closed)}</div>
            </div>
          </div>

          <div className="grid g-2-1" style={{ alignItems: "start" }}>
            <section className="panel">
              <div className="panel-h">
                <h2>Fila de hoje</h2>
                <Link href="/abordar" className="meta link">
                  Ver fila completa
                </Link>
              </div>
              {data.queue.length === 0 ? (
                <div className="panel-b">
                  <div className="empty">
                    Nenhum lead aberto com WhatsApp. Busque mais empresas no Radar.
                    <Link href="/radar" className="btn sm">Ir ao Radar</Link>
                  </div>
                </div>
              ) : (
                <div className="list">
                  {data.queue.map((l) => (
                    <div key={l.id} className="lrow queue-grid" onClick={() => router.push(`/leads/${encodeURIComponent(l.id)}`)}>
                      <div style={{ minWidth: 0 }}>
                        <div className="name ellipsis">{l.name}</div>
                        <div className="sub ellipsis">
                          {[l.category, l.district].filter(Boolean).join(" · ")} · <WebLabel l={l} />
                        </div>
                      </div>
                      <div className="c-pains" style={{ minWidth: 0 }}>
                        {l.demoUrl ? <span className="pill accent">Prévia pronta</span> : <Pains pains={l.pains} max={2} />}
                      </div>
                      <div className="c-score">
                        <Score value={l.score} temp={l.temperature} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                        <WhatsAppButton
                          lead={l}
                          small
                          template={l.ai?.mensagem || settings?.messageBase || ""}
                          signature={settings?.signature}
                          onSent={(m) => markSent(l, m)}
                          label={l.demoUrl ? "Mandar prévia" : "WhatsApp"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-h">
                <h2>Funil</h2>
                <Link href="/leads?view=funil" className="meta link">Abrir</Link>
              </div>
              <div className="panel-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.funnel.map(({ s, n }) => (
                  <Link key={s} href={`/leads?status=${s}`} style={{ display: "grid", gridTemplateColumns: "96px 1fr 36px", gap: 12, alignItems: "center" }}>
                    <span className="dim">{STATUS_LABEL[s]}</span>
                    <span style={{ height: 2, background: "#2a292e", borderRadius: 2, position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(n / maxFunnel) * 100}%`, background: s === "fechado" ? "var(--positive)" : n ? "var(--text-2)" : "transparent", borderRadius: 2 }} />
                    </span>
                    <span className="num" style={{ textAlign: "right" }}>{n}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <section className="panel">
            <div className="panel-h">
              <h2>Onde está a dor</h2>
              <span className="meta">% dos negócios de cada nicho com cada problema</span>
            </div>
            <div className="panel-b mapa-wrap">
              <PainMatrix leads={data.all} />
            </div>
          </section>

          {data.all.some((l) => l.source === "exemplo") && (
            <div className="notice">
              <ArrowUpRight size={15} style={{ marginTop: 2 }} />
              Tem leads de exemplo na base (nomes fictícios, sem telefone real). Apague em Ajustes quando começar a usar de verdade.
            </div>
          )}
        </div>
      )}
    </>
  );
}
