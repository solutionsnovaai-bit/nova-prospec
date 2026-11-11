"use client";
import { Download, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { MATRIX_FILTER, nicheLabel } from "@/components/PainMatrix";
import { Pains, Score, Spinner, StatusPill, toast, WebLabel } from "@/components/ui";
import { api, fmt, relTime, useLeads } from "@/lib/client";
import { PAIN_LABEL, PAIN_ORDER } from "@/lib/score";
import { STATUS_LABEL, STATUS_ORDER, type Lead, type LeadStatus, type PainKey } from "@/lib/types";

const KANBAN: LeadStatus[] = ["novo", "qualificado", "demo", "abordado", "respondeu", "negociando", "fechado"];

function LeadsInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const { leads, isLoading, reload } = useLeads();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<LeadStatus | "todos">((sp.get("status") as LeadStatus) || "todos");
  const [pains, setPains] = useState<string[]>(sp.get("dor") ? [sp.get("dor")!] : []);
  const [nicho, setNicho] = useState(sp.get("nicho") ?? "");
  const [onlyMobile, setOnlyMobile] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [view, setView] = useState<"lista" | "funil">(sp.get("view") === "funil" ? "funil" : "lista");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  useEffect(() => setSel(new Set()), [status, pains, nicho, onlyMobile, minScore, q]);

  const all = leads ?? [];
  const niches = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of all) m.set(nicheLabel(l), (m.get(nicheLabel(l)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const base = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((l) => {
      if (term && !`${l.name} ${l.category} ${l.district} ${l.phone} ${l.instagram?.handle ?? ""}`.toLowerCase().includes(term)) return false;
      if (nicho && nicheLabel(l) !== nicho) return false;
      if (onlyMobile && l.phoneKind !== "celular") return false;
      if (l.score < minScore) return false;
      for (const p of pains) {
        const keys = (MATRIX_FILTER[p] ?? [p]) as PainKey[];
        if (!keys.some((k) => l.pains.includes(k))) return false;
      }
      return true;
    });
  }, [all, q, nicho, onlyMobile, minScore, pains]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: base.filter((l) => l.status !== "descartado").length };
    for (const s of STATUS_ORDER) c[s] = base.filter((l) => l.status === s).length;
    return c;
  }, [base]);

  const rows = useMemo(
    () => base.filter((l) => (status === "todos" ? l.status !== "descartado" : l.status === status)),
    [base, status],
  );

  const painCount = (p: PainKey) => base.filter((l) => l.pains.includes(p)).length;

  const bulk = async (action: "status" | "delete", st?: LeadStatus) => {
    if (!sel.size) return;
    if (action === "delete" && !window.confirm(`Apagar ${sel.size} leads da base? Não dá pra desfazer.`)) return;
    setBusy(true);
    try {
      const r = await api<{ changed: number }>("/api/leads/bulk", { method: "POST", json: { ids: [...sel], action, status: st } });
      await reload();
      setSel(new Set());
      toast(action === "delete" ? `${r.changed} apagados` : `${r.changed} movidos para ${STATUS_LABEL[st!]}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", true);
    } finally {
      setBusy(false);
    }
  };

  const findIg = async () => {
    const ids = [...sel].slice(0, 10);
    if (!ids.length) return;
    setBusy(true);
    try {
      await api("/api/enrich", { method: "POST", json: { ids } });
      await reload();
      toast(`Instagram procurado em ${ids.length} leads (${ids.length} créditos)`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", true);
    } finally {
      setBusy(false);
    }
  };

  const move = async (id: string, st: LeadStatus) => {
    try {
      await api(`/api/leads/${encodeURIComponent(id)}`, { method: "PATCH", json: { status: st } });
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", true);
    }
  };

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allSel = rows.length > 0 && rows.every((r) => sel.has(r.id));

  return (
    <>
      <div className="titlerow">
        <div>
          <h1>Leads</h1>
          <div className="sub">
            {isLoading ? <span className="skel" style={{ width: 220, height: 14 }} /> : <>{fmt.format(counts.todos)} na base · ordenados pela oportunidade</>}
          </div>
        </div>
        <div className="actions">
          <div className="tabs" style={{ borderBottom: 0 }} role="tablist" aria-label="Visualização">
            <button role="tab" aria-selected={view === "lista"} onClick={() => setView("lista")}>Lista</button>
            <button role="tab" aria-selected={view === "funil"} onClick={() => setView("funil")}>Funil</button>
          </div>
          <a className="btn sm" href={`/api/export${sel.size ? `?ids=${[...sel].map(encodeURIComponent).join(",")}` : ""}`}>
            <Download size={14} strokeWidth={1.6} /> CSV
          </a>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: "var(--gap)" }}>
        <div className="panel-b" style={{ paddingTop: 16, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr) 160px", gap: 10 }} className="lf">
            <label className="field" style={{ position: "relative" }}>
              <span className="sr">Buscar</span>
              <Search size={14} style={{ position: "absolute", left: 12, top: 10, color: "var(--muted)" }} />
              <input className="input" style={{ paddingLeft: 34 }} placeholder="Nome, bairro, telefone ou @" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <select className="select" value={nicho} onChange={(e) => setNicho(e.target.value)} aria-label="Nicho">
              <option value="">Todos os nichos</option>
              {niches.map(([n, c]) => (
                <option key={n} value={n}>{n} ({c})</option>
              ))}
            </select>
            <select className="select" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} aria-label="Score mínimo">
              <option value={0}>Qualquer score</option>
              <option value={45}>Morno ou quente (45+)</option>
              <option value={65}>Só quentes (65+)</option>
            </select>
          </div>
          <div className="chips">
            {PAIN_ORDER.map((p) => (
              <button key={p} className="chip" aria-pressed={pains.includes(p)} onClick={() => setPains((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))}>
                {PAIN_LABEL[p]} <span className="n">{painCount(p)}</span>
              </button>
            ))}
            <button className="chip" aria-pressed={onlyMobile} onClick={() => setOnlyMobile((v) => !v)}>
              Só celular
            </button>
            {pains.some((p) => !PAIN_ORDER.includes(p as PainKey)) && (
              <button className="chip" aria-pressed onClick={() => setPains([])}>Filtro do mapa de dor ×</button>
            )}
          </div>
        </div>
      </section>

      {view === "lista" ? (
        <section className="panel">
          <div className="tabs" style={{ padding: "0 20px" }} role="tablist" aria-label="Status">
            {(["todos", ...STATUS_ORDER] as const).map((s) => (
              <button key={s} role="tab" aria-selected={status === s} onClick={() => setStatus(s)}>
                {s === "todos" ? "Todos" : STATUS_LABEL[s]}
                <span className="count">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="table-head lead-grid" style={{ paddingTop: 12 }}>
            <input type="checkbox" className="cbx" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(rows.map((r) => r.id)))} aria-label="Selecionar todos" />
            <span>Negócio</span>
            <span className="c-pains">Dores</span>
            <span>Score</span>
            <span className="c-web">Presença</span>
            <span className="c-phone">Telefone</span>
            <span className="c-act">Status</span>
          </div>
          <div className="list">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="lrow lead-grid" style={{ cursor: "default" }}>
                  <span />
                  <span><span className="skel" style={{ width: "55%", height: 14 }} /></span>
                  <span className="c-pains"><span className="skel" style={{ width: 150, height: 18 }} /></span>
                  <span><span className="skel" style={{ width: 80, height: 12 }} /></span>
                </div>
              ))
            ) : rows.length === 0 ? (
              <div className="panel-b">
                <div className="empty">
                  {all.length ? "Nenhum lead com esses filtros." : "Base vazia."}
                  <Link href="/radar" className="btn sm">Buscar no Radar</Link>
                </div>
              </div>
            ) : (
              rows.slice(0, 300).map((l) => <LeadRow key={l.id} l={l} checked={sel.has(l.id)} onCheck={() => toggle(l.id)} onOpen={() => router.push(`/leads/${encodeURIComponent(l.id)}`)} />)
            )}
          </div>
          {rows.length > 300 && <div className="panel-b muted" style={{ paddingTop: 12 }}>Mostrando 300 de {fmt.format(rows.length)}. Use os filtros.</div>}
        </section>
      ) : (
        <div className="kanban">
          {KANBAN.map((s) => {
            const col = base.filter((l) => l.status === s);
            return (
              <div
                key={s}
                className={`kcol ${overCol === s ? "drop" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(s);
                }}
                onDragLeave={() => setOverCol(null)}
                onDrop={() => {
                  setOverCol(null);
                  if (dragId) move(dragId, s);
                  setDragId(null);
                }}
              >
                <h3>
                  {STATUS_LABEL[s]} <span className="num muted">{col.length}</span>
                </h3>
                {col.slice(0, 60).map((l) => (
                  <div key={l.id} className="kcard" draggable onDragStart={() => setDragId(l.id)} onClick={() => router.push(`/leads/${encodeURIComponent(l.id)}`)}>
                    <div className="ellipsis" style={{ fontWeight: 500 }}>{l.name}</div>
                    <div className="muted ellipsis" style={{ fontSize: 12 }}>{[nicheLabel(l), l.district].filter(Boolean).join(" · ")}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 8 }}>
                      <Score value={l.score} temp={l.temperature} />
                      <span className="muted" style={{ fontSize: 11 }}>{relTime(l.updatedAt)}</span>
                    </div>
                  </div>
                ))}
                {!col.length && <div className="muted" style={{ padding: "0 14px 14px", fontSize: 12 }}>Vazio</div>}
              </div>
            );
          })}
        </div>
      )}

      {sel.size > 0 && (
        <div className="sel-bar">
          <span className="dim" style={{ marginRight: "auto" }}>{sel.size} selecionados</span>
          {busy && <Spinner />}
          <button className="btn sm" disabled={busy} onClick={findIg} title="1 crédito de busca por lead (máx. 10)">
            Procurar Instagram
          </button>
          <select className="select" style={{ height: 28, width: 170, fontSize: 12 }} value="" onChange={(e) => e.target.value && bulk("status", e.target.value as LeadStatus)} disabled={busy} aria-label="Mover para">
            <option value="">Mover para…</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <button className="btn sm danger" disabled={busy} onClick={() => bulk("delete")}>Apagar</button>
        </div>
      )}
      <style>{`@media (max-width: 760px){ .lf{ grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}

function LeadRow({ l, checked, onCheck, onOpen }: { l: Lead; checked: boolean; onCheck: () => void; onOpen: () => void }) {
  return (
    <div className="lrow lead-grid" onClick={onOpen}>
      <span onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" className="cbx" checked={checked} onChange={onCheck} aria-label={`Selecionar ${l.name}`} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="name ellipsis">{l.name}</div>
        <div className="sub ellipsis">
          {[nicheLabel(l), l.district].filter(Boolean).join(" · ")}
          {l.rating ? <> · <span className="num">{l.rating.toFixed(1)}</span> ({fmt.format(l.reviews ?? 0)})</> : null}
          {l.source === "exemplo" ? <> · <span className="gold">exemplo</span></> : null}
        </div>
      </div>
      <div className="c-pains" style={{ minWidth: 0 }}>
        <Pains pains={l.pains} max={3} />
      </div>
      <Score value={l.score} temp={l.temperature} />
      <div className="c-web ellipsis">
        <WebLabel l={l} />
        {l.instagram && <div className="sub ellipsis" style={{ fontSize: 12, color: "var(--muted)" }}>@{l.instagram.handle}{l.instagram.followers !== undefined ? ` · ${fmt.format(l.instagram.followers)}` : ""}</div>}
      </div>
      <div className="c-phone" style={{ minWidth: 0 }}>
        {l.phone ? (
          <>
            <div className="num ellipsis">{l.phone}</div>
            <div className="sub" style={{ fontSize: 12 }}>{l.phoneKind === "celular" ? <span className="pos">celular</span> : <span className="muted">fixo</span>}</div>
          </>
        ) : (
          <span className="muted">—</span>
        )}
      </div>
      <div className="c-act">
        <StatusPill status={l.status} />
      </div>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={null}>
      <LeadsInner />
    </Suspense>
  );
}
