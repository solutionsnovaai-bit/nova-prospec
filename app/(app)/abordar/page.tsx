"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Pains, Score, toast, WebLabel, WhatsAppButton } from "@/components/ui";
import { api, fillMessage, patchLeadCache, relTime, useLeads, useSettings } from "@/lib/client";
import type { Lead } from "@/lib/types";

const DAY = 86400000;

export default function AbordarPage() {
  const { leads, isLoading } = useLeads();
  const { settings } = useSettings();
  const limit = settings?.dailyLimit ?? 25;

  const d = useMemo(() => {
    const all = (leads ?? []).filter((l) => !l.optOut && l.source !== "exemplo");
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const sentToday = all.filter((l) => l.history?.some((h) => h.type === "mensagem" && new Date(h.at) >= start)).length;
    const queue = all
      .filter((l) => ["novo", "qualificado", "demo"].includes(l.status) && l.phoneE164)
      .sort((a, b) => Number(!!b.demoUrl) - Number(!!a.demoUrl) || Number(b.phoneKind === "celular") - Number(a.phoneKind === "celular") || b.score - a.score);
    const follow = all
      .filter((l) => l.status === "abordado" && l.contactedAt && Date.now() - new Date(l.contactedAt).getTime() > 2 * DAY)
      .sort((a, b) => (a.contactedAt ?? "").localeCompare(b.contactedAt ?? ""));
    return { sentToday, queue, follow };
  }, [leads]);

  const sent = async (l: Lead, message: string) => {
    try {
      const r = await api<{ lead: Lead }>(`/api/leads/${encodeURIComponent(l.id)}`, { method: "PATCH", json: { event: "mensagem", message } });
      patchLeadCache(r.lead);
      toast(`${l.name}: marcado como abordado`);
    } catch {
      /* o WhatsApp abriu mesmo assim */
    }
  };

  const left = Math.max(0, limit - d.sentToday);
  const tpl = (l: Lead) => l.ai?.mensagem || settings?.messageBase || "";
  const follow = (l: Lead) => `Oi! Passando pra saber se você conseguiu ver a prévia que te mandei da ${l.name}. Posso te explicar em 2 minutos como ficaria?`;

  const Row = ({ l, fu }: { l: Lead; fu?: boolean }) => (
    <div className="lrow queue-grid" style={{ cursor: "default" }}>
      <Link href={`/leads/${encodeURIComponent(l.id)}`} style={{ minWidth: 0 }}>
        <div className="name ellipsis">{l.name}</div>
        <div className="sub ellipsis">
          {[l.category, l.district].filter(Boolean).join(" · ")} · {fu ? `abordado ${relTime(l.contactedAt)}` : <WebLabel l={l} />}
        </div>
        <div className="sub ellipsis only-phone" style={{ marginTop: 4 }}>{fillMessage(fu ? follow(l) : tpl(l), l, settings?.signature).slice(0, 90)}…</div>
      </Link>
      <div className="c-pains" style={{ minWidth: 0 }}>
        {l.demoUrl ? <span className="pill accent">Prévia pronta</span> : l.ai ? <span className="pill">{l.ai.projeto.tipo}</span> : <Pains pains={l.pains} max={2} />}
      </div>
      <div className="c-score"><Score value={l.score} temp={l.temperature} /></div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <WhatsAppButton lead={l} small template={fu ? follow(l) : tpl(l)} signature={settings?.signature} onSent={(m) => sent(l, m)} label={fu ? "Retomar" : l.demoUrl ? "Mandar prévia" : "Abordar"} />
      </div>
    </div>
  );

  return (
    <>
      <div className="titlerow">
        <div>
          <h1>Abordar</h1>
          <div className="sub">
            Abre a conversa no seu WhatsApp com a mensagem pronta. Um por um, sem disparo em massa: é isso que protege o número.
          </div>
        </div>
      </div>

      <div className="kpis" style={{ marginBottom: "var(--gap)" }}>
        <div className="kpi lead">
          <div className="l">Ainda pode abordar hoje</div>
          <div className="v">{left}<small>de {limit}</small></div>
        </div>
        <div className="kpi"><div className="l">Enviadas hoje</div><div className="v">{d.sentToday}</div></div>
        <div className="kpi"><div className="l">Na fila</div><div className="v">{d.queue.length}</div></div>
        <div className="kpi"><div className="l">Sem resposta há 2+ dias</div><div className="v">{d.follow.length}</div></div>
      </div>

      {left === 0 && <div className="notice" style={{ marginBottom: "var(--gap)" }}>Limite de hoje atingido. Passar disso com número novo ou pessoal aumenta o risco de bloqueio. Dá pra mudar o limite em Ajustes.</div>}

      <div className="stack">
        <section className="panel">
          <div className="panel-h"><h2>Fila</h2><span className="meta">prévia pronta primeiro, depois celular e score</span></div>
          {isLoading ? (
            <div className="panel-b muted">carregando…</div>
          ) : d.queue.length ? (
            <div className="list">{d.queue.slice(0, 40).map((l) => <Row key={l.id} l={l} />)}</div>
          ) : (
            <div className="panel-b"><div className="empty">Fila vazia. Salve leads com telefone no Radar.<Link href="/radar" className="btn sm">Ir ao Radar</Link></div></div>
          )}
        </section>

        {d.follow.length > 0 && (
          <section className="panel">
            <div className="panel-h"><h2>Retomar</h2><span className="meta">abordados que não responderam</span></div>
            <div className="list">{d.follow.slice(0, 20).map((l) => <Row key={l.id} l={l} fu />)}</div>
          </section>
        )}
      </div>
    </>
  );
}
