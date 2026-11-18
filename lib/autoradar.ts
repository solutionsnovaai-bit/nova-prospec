import "server-only";
import { COUNTRIES, INTL_NICHES, type Lang } from "./countries";
import { db } from "./db";
import { auditLead, checkSite, listLeads, saveFound } from "./leads";
import { NICHES, searchPhrase, TARGET_GROUPS } from "./niches";
import { REGIONS } from "./regions";
import { runSearch } from "./sources";
import type { FoundPlace } from "./types";

/**
 * Radar automático: todo dia faz algumas buscas sozinho, girando nicho e cidade
 * (Brasil inteiro e exterior), confere o site de cada empresa e salva só os quentes.
 * Gasta a cota grátis das fontes de busca (1 busca = 1 crédito grátis).
 */
export interface AutoRadarState {
  cursorBr: number;
  cursorIntl: number;
  min: number; // score mínimo para salvar
  perDayBr: number;
  perDayIntl: number;
  enabled: boolean;
  maxQueue: number; // pula a semana se já tiver esse tanto de quentes esperando
  runs: { at: string; scope: string; searches: { q: string; found: number; saved: number; error?: string }[] }[];
}

const DEFAULT: AutoRadarState = { cursorBr: 0, cursorIntl: 0, min: 80, perDayBr: 6, perDayIntl: 4, enabled: true, maxQueue: 100, runs: [] };

/** Quentes com WhatsApp que ainda não foram chamados. */
export async function queueSize() {
  return (await listLeads()).filter((l) => ["novo", "qualificado", "demo"].includes(l.status) && !l.optOut && l.temperature === "quente" && l.phoneKind === "celular").length;
}

const BR_NICHES = NICHES.filter((n) => TARGET_GROUPS.includes(n.group));
const BR_CITIES = [...REGIONS.brasil, ...REGIONS.cidades.filter((c) => !REGIONS.brasil.includes(c)), ...REGIONS.prioridade];
// no exterior, os nichos de mensalidade e o "negócio brasileiro lá fora"
const INTL_IDS = ["law-employment", "law-immigration", "law-injury", "law", "insurance", "mortgage", "realestate", "accounting", "solar", "brazilian"];
const INTL = INTL_NICHES.filter((n) => INTL_IDS.includes(n.id));
// países com WhatsApp forte primeiro (Japão e Coreia ficam por último: lá dominam LINE e KakaoTalk)
const INTL_PLACES = COUNTRIES.filter((c) => !["jp", "kr"].includes(c.id))
  .flatMap((c) => c.cities.slice(0, 3).map((city) => ({ c, city })))
  .concat(COUNTRIES.filter((c) => ["jp", "kr"].includes(c.id)).flatMap((c) => c.cities.slice(0, 2).map((city) => ({ c, city }))));

export async function getAutoRadar(): Promise<AutoRadarState> {
  return { ...DEFAULT, ...((await db.get<AutoRadarState>("config", "autoradar")) ?? {}) };
}

export async function saveAutoRadar(patch: Partial<AutoRadarState>) {
  const cur = await getAutoRadar();
  const next = { ...cur, ...patch };
  await db.put("config", "autoradar", next);
  return next;
}

function brPlan(i: number) {
  const n = BR_NICHES[i % BR_NICHES.length];
  const city = BR_CITIES[Math.floor(i / BR_NICHES.length) % BR_CITIES.length];
  return { niche: searchPhrase(n), nicheId: n.id, location: city, country: undefined as string | undefined, label: `${n.label} · ${city}` };
}

function intlPlan(i: number) {
  // passos diferentes para nicho e cidade: cada rodada cai em países variados
  const n = INTL[i % INTL.length];
  const p = INTL_PLACES[(i * 7 + Math.floor(i / INTL_PLACES.length)) % INTL_PLACES.length];
  const lang: Lang = p.c.lang;
  return { niche: n.q[lang] ?? n.q.en, nicheId: undefined as string | undefined, location: p.city, country: p.c.id, label: `${p.c.flag} ${n.label} · ${p.city}` };
}

async function enrich(list: FoundPlace[]) {
  // confere site e audita em paralelo, com teto de tempo por empresa
  const one = (p: FoundPlace) =>
    Promise.race([checkSite(p).then((c) => (c.audit ? c : auditLead(c))), new Promise<FoundPlace>((r) => setTimeout(() => r(p), 12000))]).catch(() => p);
  return Promise.all(list.map(one));
}

export async function runAutoRadar(opts: { scope?: "br" | "intl" | "all"; br?: number; intl?: number; deadlineMs?: number } = {}) {
  const st = await getAutoRadar();
  const scope = opts.scope ?? "all";
  const nBr = scope === "intl" ? 0 : opts.br ?? st.perDayBr;
  const nIntl = scope === "br" ? 0 : opts.intl ?? st.perDayIntl;
  const deadline = Date.now() + (opts.deadlineMs ?? 230000);
  const known = new Set((await listLeads()).map((l) => l.id));
  const plans = [
    ...Array.from({ length: nIntl }, (_, k) => intlPlan(st.cursorIntl + k)),
    ...Array.from({ length: nBr }, (_, k) => brPlan(st.cursorBr + k)),
  ];
  const log: AutoRadarState["runs"][number]["searches"] = [];
  let doneBr = 0;
  let doneIntl = 0;
  for (const p of plans) {
    if (Date.now() > deadline) break;
    try {
      const out = await runSearch("auto", { niche: p.niche, nicheId: p.nicheId, location: p.location, country: p.country });
      const fresh = out.places.filter((x) => !known.has(x.id) && x.phoneE164);
      const rich = await enrich(fresh.slice(0, 20));
      const hot = rich.filter((x) => x.score >= st.min && x.phoneKind === "celular");
      if (hot.length) await saveFound(hot);
      hot.forEach((h) => known.add(h.id));
      log.push({ q: p.label, found: out.places.length, saved: hot.length });
    } catch (e) {
      log.push({ q: p.label, found: 0, saved: 0, error: e instanceof Error ? e.message.slice(0, 120) : "erro" });
    }
    if (p.country) doneIntl++;
    else doneBr++;
  }
  const runs = [{ at: new Date().toISOString(), scope, searches: log }, ...st.runs].slice(0, 20);
  await saveAutoRadar({ cursorBr: st.cursorBr + doneBr, cursorIntl: st.cursorIntl + doneIntl, runs });
  return { scope, searches: log, saved: log.reduce((s, x) => s + x.saved, 0) };
}
