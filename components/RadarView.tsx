"use client";
import { Check, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Pains, Score, Spinner, toast, WebLabel } from "./ui";
import { api, fmt, useLeads, useSettings, useUsage } from "@/lib/client";
import { AutoRadarCard } from "./AutoRadarCard";
import { ProductPreview } from "./product-preview";
import { NICHES } from "@/lib/niches";
import { REGIONS } from "@/lib/regions";
import { COUNTRIES, INTL_NICHES, REGION_LABEL, intlQuery, type Region } from "@/lib/countries";
import type { FoundPlace, SourceId } from "@/lib/types";

type Src = "auto" | "serpapi" | "serper" | "searchapi" | "osm";
const QUICK = ["advocacia-trabalhista", "advocacia-previdenciaria", "advocacia", "consorcio-porto", "consorcio-embracon", "consorcio-ademicon", "consorcio-rodobens", "consorcio"];

export function RadarView({ intl = false }: { intl?: boolean }) {
  const { settings } = useSettings();
  const { usage, reload: reloadUsage } = useUsage();
  const { reload: reloadLeads } = useLeads();
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState<Src>("auto");
  const [busy, setBusy] = useState(false);
  const [auditing, setAuditing] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<FoundPlace[]>([]);
  const [meta, setMeta] = useState<{ used?: SourceId; note?: string; hasMore?: boolean; page: number; q?: { niche: string; nicheId?: string; location: string } }>({ page: 0 });
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [onlyMobile, setOnlyMobile] = useState(false);
  const [onlyNoSite, setOnlyNoSite] = useState(false);
  const [err, setErr] = useState("");
  const [region, setRegion] = useState<Region>("americas");
  const [country, setCountry] = useState("us");
  const [intlNiche, setIntlNiche] = useState("law");
  const cty = COUNTRIES.find((c) => c.id === country) ?? COUNTRIES[0];

  const nicheId = intl ? undefined : NICHES.find((n) => n.label.toLowerCase() === niche.trim().toLowerCase())?.id;
  const loc = location.trim() || (intl ? cty.cities[0] : settings?.defaultCity) || "";
  const places = loc.split(";").map((s) => s.trim()).filter(Boolean);

  const auditBatch = async (list: FoundPlace[]) => {
    const own = (p: FoundPlace) => ["proprio", "construtor"].includes(p.websiteKind);
    // audita quem tem site e confere (grátis) se quem aparece "sem site" não tem mesmo
    const need = list.filter((p) => (own(p) ? p.website && !p.audit : !p.siteCheck));
    for (let i = 0; i < need.length; i += 6) {
      const chunk = need.slice(i, i + 6);
      setAuditing((s) => new Set([...s, ...chunk.map((c) => c.id)]));
      try {
        const r = await api<{ places: FoundPlace[] }>("/api/audit", { method: "POST", json: { places: chunk } });
        const map = new Map(r.places.map((p) => [p.id, p]));
        setResults((cur) => cur.map((p) => (map.has(p.id) ? { ...map.get(p.id)!, saved: p.saved } : p)).sort((a, b) => b.score - a.score));
      } catch {
        /* segue sem auditoria */
      } finally {
        setAuditing((s) => {
          const n = new Set(s);
          chunk.forEach((c) => n.delete(c.id));
          return n;
        });
      }
    }
  };

  const run = async (page = 0, q: { niche: string; nicheId?: string; location: string } = { niche: niche.trim() || (intl ? intlQuery(intlNiche, cty.lang) ?? "" : NICHES.find((n) => n.id === nicheId)?.label || ""), nicheId, location: loc }) => {
    if (!q.niche) return setErr("Escolha ou digite um nicho.");
    if (!q.location) return setErr("Digite o bairro e a cidade.");
    const locs = q.location.split(";").map((s) => s.trim()).filter(Boolean);
    if (locs.length > 1 && page === 0 && source !== "osm" && !window.confirm(`Isso vai usar ${locs.length} buscas da cota grátis (uma por bairro). Continuar?`)) return;
    setErr("");
    setBusy(true);
    if (page === 0) {
      setResults([]);
      setSel(new Set());
    }
    try {
      let all: FoundPlace[] = page === 0 ? [] : results;
      let last: { used?: SourceId; note?: string; hasMore?: boolean } = {};
      for (const l of locs) {
        const r = await api<{ places: FoundPlace[]; used: SourceId; note?: string; hasMore: boolean }>("/api/search", {
          method: "POST",
          json: { niche: q.niche, nicheId: q.nicheId, location: l, source, page, country: intl ? country : undefined },
        });
        const seen = new Set(all.map((p) => p.id));
        all = [...all, ...r.places.filter((p) => !seen.has(p.id))].sort((a, b) => b.score - a.score);
        setResults(all);
        last = r;
      }
      setMeta({ ...last, page, q: { ...q } });
      reloadUsage();
      if (!all.length) toast("Nenhum resultado. Tente outro termo ou um bairro vizinho.");
      await auditBatch(all);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro na busca");
    } finally {
      setBusy(false);
    }
  };

  const visible = useMemo(
    () => results.filter((p) => (!onlyMobile || p.phoneKind === "celular") && (!onlyNoSite || p.pains.includes("sem_site") || p.pains.includes("site_fraco"))),
    [results, onlyMobile, onlyNoSite],
  );

  const save = async (list: FoundPlace[]) => {
    if (!list.length) return;
    try {
      const r = await api<{ saved: number }>("/api/leads", { method: "POST", json: { places: list } });
      const ids = new Set(list.map((p) => p.id));
      setResults((cur) => cur.map((p) => (ids.has(p.id) ? { ...p, saved: true } : p)));
      setSel(new Set());
      reloadLeads();
      toast(`${r.saved} salvos na base`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao salvar", true);
    }
  };

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const u = (id: SourceId) => usage?.find((x) => x.id === id);
  const srcLabel = (id: Src) => {
    if (id === "auto") return "Automático";
    const x = u(id as SourceId);
    if (id === "osm") return "OpenStreetMap";
    if (!x?.configured) return `${x?.label ?? id} · sem chave`;
    return `${x.label} · ${x.left === null || x.left === undefined ? "—" : fmt.format(x.left)}`;
  };
  const hot = visible.filter((p) => p.temperature === "quente" && !p.saved);

  return (
    <>
      <div className="titlerow">
        <div>
          <h1>{intl ? "Internacional" : "Radar"}</h1>
          <div className="sub">
            {intl
              ? "Busca fora do Brasil no idioma de cada país. A Bia dispara a mensagem já traduzida; fechou em outra moeda, vale."
              : "Brasil inteiro, com foco em advocacia, consórcio e outros nichos de mensalidade: quem tem volume, WhatsApp celular e verba vem primeiro."}
          </div>
        </div>
      </div>

      <AutoRadarCard onSaved={reloadLeads} />

      <section className="panel" style={{ marginBottom: "var(--gap)" }}>
        <form
          className="panel-b"
          style={{ paddingTop: 20, display: "grid", gap: 14 }}
          onSubmit={(e) => {
            e.preventDefault();
            run(0);
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr) auto", gap: 12, alignItems: "end" }} className="radar-form">
            <label className="field">
              <span>Nicho</span>
              <input
                className="input"
                list={intl ? undefined : "nichos"}
                placeholder={intl ? `${intlQuery(intlNiche, cty.lang)} (ou digite no idioma local)` : "ex.: advocacia trabalhista, consórcio Porto"}
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
              <datalist id="nichos">
                {NICHES.map((n) => (
                  <option key={n.id} value={n.label} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>{intl ? `Cidade em ${cty.name} (várias: separe com ;)` : "Bairro e cidade (vários: separe com ;)"}</span>
              <input className="input" placeholder={intl ? `ex.: ${cty.cities[0]}` : "ex.: Tatuapé, São Paulo"} value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
            <button className="btn primary" disabled={busy} style={{ height: 34 }}>
              {busy ? <Spinner /> : <Search size={15} strokeWidth={1.7} />} Buscar
            </button>
          </div>
          {intl ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div className="chips" style={{ alignItems: "center" }}>
                <span className="muted" style={{ fontSize: 12, width: 96 }}>Região</span>
                {(Object.keys(REGION_LABEL) as Region[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    className="chip"
                    aria-pressed={region === r}
                    onClick={() => {
                      setRegion(r);
                      const first = COUNTRIES.find((c) => c.region === r);
                      if (first) { setCountry(first.id); setLocation(""); }
                    }}
                  >
                    {REGION_LABEL[r]}
                  </button>
                ))}
              </div>
              <div className="chips" style={{ alignItems: "center" }}>
                <span className="muted" style={{ fontSize: 12, width: 96 }}>País</span>
                {COUNTRIES.filter((c) => c.region === region).map((c) => (
                  <button type="button" key={c.id} className="chip" aria-pressed={country === c.id} onClick={() => { setCountry(c.id); setLocation(""); }}>
                    {c.flag} {c.name}
                  </button>
                ))}
              </div>
              <div className="chips" style={{ alignItems: "center" }}>
                <span className="muted" style={{ fontSize: 12, width: 96 }}>Cidade</span>
                {cty.cities.map((c) => (
                  <button type="button" key={c} className="chip" aria-pressed={location === c} onClick={() => setLocation(c)}>{c}</button>
                ))}
              </div>
              <div className="chips" style={{ alignItems: "center" }}>
                <span className="muted" style={{ fontSize: 12, width: 96 }}>Nicho</span>
                {INTL_NICHES.map((n) => (
                  <button type="button" key={n.id} className="chip" aria-pressed={intlNiche === n.id && !niche} onClick={() => { setIntlNiche(n.id); setNiche(""); }}>
                    {n.label}
                  </button>
                ))}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                Busca como <b>{niche.trim() || intlQuery(intlNiche, cty.lang)}</b> em {loc} · mensagem da Bia em {({ en: "inglês", es: "espanhol", ptpt: "português de Portugal", fr: "francês", de: "alemão", it: "italiano", ja: "japonês", ko: "coreano", pt: "português" } as const)[cty.lang]} · moeda local {cty.currency}
                {(cty.id === "jp" || cty.id === "kr") && " · lá o WhatsApp é pouco usado (LINE/KakaoTalk dominam), espere menos respostas"}
              </div>
            </div>
          ) : (
            <>
              <div className="chips">
                {QUICK.map((id) => {
                  const n = NICHES.find((x) => x.id === id)!;
                  return (
                    <button type="button" key={id} className="chip" aria-pressed={nicheId === id} onClick={() => setNiche(n.label)}>
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <details className="moreopts">
            <summary>Mais opções: {intl ? "fonte da busca" : "regiões e fonte da busca"}</summary>
            <div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
              {!intl && (
                <>
              <div style={{ display: "grid", gap: 6 }}>
                  {([["Prioridade", REGIONS.prioridade], ["SP e interior", REGIONS.cidades], ["Brasil", REGIONS.brasil], ["Regional SP", REGIONS.regional]] as const).map(([label, list]) => (
                    <div key={label} className="chips" style={{ alignItems: "center" }}>
                      <span className="muted" style={{ fontSize: 12, width: 96 }}>{label}</span>
                      {list.map((r) => (
                        <button type="button" key={r} className="chip" aria-pressed={location === r} onClick={() => setLocation(r)}>{r.split(",")[0]}</button>
                      ))}
                    </div>
                  ))}
                </div>
                  </>
              )}
          <div className="tabs" role="tablist" aria-label="Fonte">
                {((intl ? ["auto", "serpapi", "serper", "searchapi"] : ["auto", "serpapi", "serper", "searchapi", "osm"]) as Src[]).map((s) => (
                  <button type="button" key={s} role="tab" aria-selected={source === s} onClick={() => setSource(s)}>
                    {srcLabel(s)}
                  </button>
                ))}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {source === "osm"
                  ? "OpenStreetMap: grátis e ilimitado, mas com menos telefones e sem avaliações."
                  : `Cada busca traz até 20 empresas e gasta 1 crédito grátis${places.length > 1 ? ` por bairro (${places.length} no total)` : ""}. No automático: SerpApi → Serper → SearchApi → OpenStreetMap.`}
              </div>
                </div>
          </details>
          {err && <div className="notice neg">{err}</div>}
        </form>
      </section>

      {(results.length > 0 || busy) && (
        <section className="panel">
          <div className="panel-h" style={{ flexWrap: "wrap" }}>
            <h2>
              {busy && !results.length ? "Buscando…" : `${visible.length} negócios`}
              {meta.q && <span className="muted" style={{ fontWeight: 400, fontSize: 13, marginLeft: 8 }}>{meta.q.niche} · {meta.q.location}{meta.used ? ` · via ${meta.used}` : ""}</span>}
            </h2>
            <div className="chips">
              <button className="chip" aria-pressed={onlyMobile} onClick={() => setOnlyMobile((v) => !v)}>Só celular</button>
              <button className="chip" aria-pressed={onlyNoSite} onClick={() => setOnlyNoSite((v) => !v)}>Sem site ou site fraco</button>
            </div>
          </div>
          {meta.note && <div className="panel-b"><div className="notice">{meta.note}</div></div>}
          <div className="table-head found-grid">
            <span />
            <span>Negócio</span>
            <span className="c-phone">Telefone</span>
            <span>Presença</span>
            <span className="c-pains">Dores</span>
            <span title="Pontuação de presença digital; não mede necessidade de sistemas internos">Score digital</span>
          </div>
          <div className="list">
            {busy && !results.length
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="lrow found-grid" style={{ cursor: "default" }}>
                    <span />
                    <span><span className="skel" style={{ width: "60%", height: 14 }} /></span>
                    <span className="c-phone"><span className="skel" style={{ width: 110, height: 12 }} /></span>
                    <span><span className="skel" style={{ width: 70, height: 12 }} /></span>
                    <span className="c-pains"><span className="skel" style={{ width: 140, height: 18 }} /></span>
                    <span><span className="skel" style={{ width: 80, height: 12 }} /></span>
                  </div>
                ))
              : visible.map((p) => (
                  <div key={p.id} className="lrow found-grid" onClick={() => !p.saved && toggle(p.id)}>
                    <span onClick={(e) => e.stopPropagation()}>
                      {p.saved ? (
                        <Check size={15} className="pos" aria-label="Já está na base" />
                      ) : (
                        <input type="checkbox" className="cbx" checked={sel.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Selecionar ${p.name}`} />
                      )}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="name ellipsis">{p.name}</div>
                      <div className="sub ellipsis">
                        {[p.category, p.district || p.address].filter(Boolean).join(" · ")}
                        {p.rating ? <> · <span className="num">{p.rating.toFixed(1)}</span> ({fmt.format(p.reviews ?? 0)})</> : null}
                        {p.saved ? <> · <span className="pos">na base</span></> : null}
                      </div>
                      <ProductPreview place={p} />
                    </div>
                    <div className="c-phone" style={{ minWidth: 0 }}>
                      {p.phone ? (
                        <>
                          <div className="num ellipsis">{p.phone}</div>
                          <div className="sub" style={{ fontSize: 12 }}>{p.phoneKind === "celular" ? <span className="pos">celular</span> : <span className="muted">fixo</span>}</div>
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </div>
                    <div className="ellipsis">
                      {auditing.has(p.id) ? <span className="muted"><Spinner size={12} /> auditando</span> : <WebLabel l={p} />}
                    </div>
                    <div className="c-pains" style={{ minWidth: 0 }}>
                      <Pains pains={p.pains} max={3} />
                    </div>
                    <Score value={p.score} temp={p.temperature} />
                  </div>
                ))}
          </div>
          {meta.hasMore && !busy && (
            <div className="panel-b" style={{ paddingTop: 12 }}>
              <button className="btn sm" onClick={() => meta.q && run(meta.page + 1, meta.q)}>
                Mais 20 resultados (1 crédito)
              </button>
            </div>
          )}
          {busy && results.length > 0 && (
            <div className="panel-b muted" style={{ paddingTop: 12 }}>
              <Spinner /> buscando mais…
            </div>
          )}
        </section>
      )}

      {results.length > 0 && (
        <div className="sel-bar">
          <span className="dim" style={{ marginRight: "auto" }}>
            {sel.size ? `${sel.size} selecionados` : `${hot.length} quentes ainda fora da base`}
          </span>
          {sel.size > 0 && (
            <button className="btn sm" onClick={() => setSel(new Set())}>
              Limpar
            </button>
          )}
          <button className="btn sm" disabled={!hot.length} onClick={() => save(hot)}>
            Salvar os {hot.length} quentes
          </button>
          <button className="btn sm gold" disabled={!sel.size} onClick={() => save(results.filter((p) => sel.has(p.id)))}>
            Salvar selecionados
          </button>
          <Link href={intl ? "/leads?origem=intl" : "/leads?origem=br"} className="btn sm ghost">{intl ? "Ver leads do Mundo" : "Ver leads do Brasil"}</Link>
        </div>
      )}
      <style>{`@media (max-width: 760px){ .radar-form{ grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
