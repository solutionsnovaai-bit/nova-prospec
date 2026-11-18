import "server-only";
import { COUNTRIES, INTL_NICHES, countryById, type Country, type Region } from "./countries";
import { db } from "./db";
import { auditLead, checkSite, listLeads, saveFound } from "./leads";
import { nicheById, searchPhrase } from "./niches";
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

const DEFAULT: AutoRadarState = { cursorBr: 0, cursorIntl: 0, min: 80, perDayBr: 6, perDayIntl: 8, enabled: true, maxQueue: 100, runs: [] };

/** Quentes com WhatsApp que ainda não foram chamados. */
export async function queueSize() {
  return (await listLeads()).filter((l) => ["novo", "qualificado", "demo"].includes(l.status) && !l.optOut && l.temperature === "quente" && l.phoneKind === "celular").length;
}

// Brasil: advocacia continua a prioridade (1 a cada 2 buscas); no meio, os nichos de mensalidade mais receptivos
const BR_LAW = ["advocacia-trabalhista", "advocacia-previdenciaria", "advocacia-bancaria", "advocacia-familia", "advocacia"];
const BR_OTHER = ["odontologia", "estetica-premium", "energia-solar", "imobiliaria", "escola", "seminovos", "seguros", "credito", "contabilidade", "autoescola", "consorcio", "tributario"];
const BR_CITIES = [...new Set([...REGIONS.brasil, ...REGIONS.cidades, ...REGIONS.prioridade])];

// Mundo: a oferta é site. Metade das buscas é limpeza (cidades onde mais tem empresa de limpeza);
// o resto gira entre construção, Airbnb, imóveis e serviços de casa. Advocacia não entra lá fora.
// 1 a cada 4 buscas é negócio brasileiro lá fora (limpeza na frente).
const CLEAN = ["cleaning", "cleaning-domestic", "cleaning-office", "cleaning-airbnb", "carpet-cleaning"];
const OTHER = ["airbnb-management", "construction", "remodeling", "property-management", "handyman", "plumber", "painting", "roofing", "dental", "moving", "medspa", "realestate", "landscaping", "pest", "accounting", "solar", "insurance"];
const BR_ABROAD = ["br-cleaning", "br-realestate", "br-cleaning", "br-dentist", "br-cleaning", "br-accountant"];
const CLEAN_PLACES: [string, string][] = [
  ["gb", "London"], ["us", "New York, NY"], ["ie", "Dublin"], ["au", "Sydney"], ["gb", "Manchester"], ["ca", "Toronto"],
  ["pt", "Lisboa"], ["us", "Boston, MA"], ["gb", "Birmingham"], ["au", "Melbourne"], ["es", "Madrid"], ["us", "Miami, FL"],
  ["nl", "Amsterdam"], ["ae", "Dubai"], ["gb", "Leeds"], ["ca", "Vancouver"], ["nz", "Auckland"], ["es", "Barcelona"],
  ["us", "Houston, TX"], ["pt", "Porto"], ["au", "Brisbane"], ["ie", "Cork"], ["fr", "Paris"], ["us", "Los Angeles, CA"],
  ["nl", "Rotterdam"], ["us", "Orlando, FL"], ["de", "Berlin"], ["it", "Milano"], ["mx", "Ciudad de México"],
];
const SKIP = ["jp", "kr", "ao", "mz"]; // Japão e Coreia usam LINE e KakaoTalk; ficam só na busca manual
// Europa e Américas aparecem mais; Ásia, Oriente Médio, Oceania e África entram no meio
const PATTERN: Region[] = ["europa", "americas", "asia", "europa", "americas", "oriente", "europa", "americas", "oceania", "africa"];
type Place = { c: Country; city: string };
function roundRobin<T>(lists: T[][]) {
  const out: T[] = [];
  for (let k = 0; lists.some((l) => k < l.length); k++) lists.forEach((l) => k < l.length && out.push(l[k]));
  return out;
}
const US_CITIES = ["New York, NY", "Los Angeles, CA", "Houston, TX", "Chicago, IL", "Dallas, TX", "Atlanta, GA"]; // Miami e Orlando já entram na rota dos brasileiros
const byRegion = new Map<Region, Place[]>(
  PATTERN.map((r) => [r, roundRobin(COUNTRIES.filter((c) => c.region === r && !SKIP.includes(c.id)).map((c) => (c.id === "us" ? US_CITIES : c.cities.slice(0, 2)).map((city) => ({ c, city }))))]),
);
const INTL_PLACES: Place[] = (() => {
  const q = new Map([...byRegion].map(([r, l]) => [r, [...l]]));
  const out: Place[] = [];
  while ([...q.values()].some((l) => l.length)) for (const r of PATTERN) { const x = q.get(r)!.shift(); if (x) out.push(x); }
  return out;
})();
const DIASPORA: [string, string][] = [
  ["us", "Boston, MA"], ["pt", "Lisboa"], ["gb", "London"], ["us", "Newark, NJ"], ["ie", "Dublin"], ["us", "Orlando, FL"],
  ["pt", "Porto"], ["ca", "Toronto"], ["es", "Barcelona"], ["us", "Miami, FL"], ["it", "Milano"], ["au", "Sydney"],
  ["ch", "Zürich"], ["us", "New York, NY"], ["de", "Berlin"], ["fr", "Paris"], ["nl", "Amsterdam"], ["us", "Atlanta, GA"],
];

export async function getAutoRadar(): Promise<AutoRadarState> {
  return { ...DEFAULT, ...((await db.get<AutoRadarState>("config", "autoradar")) ?? {}) };
}

export async function saveAutoRadar(patch: Partial<AutoRadarState>) {
  const cur = await getAutoRadar();
  const next = { ...cur, ...patch };
  await db.put("config", "autoradar", next);
  return next;
}

const shift = (k: number, len: number) => (k + Math.floor(k / len)) % len; // anda 1 por vez e desloca a cada volta

function brPlan(i: number) {
  const id = i % 2 === 0 ? BR_LAW[(i / 2) % BR_LAW.length] : BR_OTHER[((i - 1) / 2) % BR_OTHER.length];
  const n = nicheById(id)!;
  const city = BR_CITIES[(i * 5 + Math.floor(i / BR_CITIES.length)) % BR_CITIES.length];
  return { niche: searchPhrase(n), nicheId: n.id, location: city, country: undefined as string | undefined, label: `${n.label} · ${city}` };
}

function intlPlan(i: number) {
  const round = Math.floor(i / 4);
  const slot = i % 4; // 0 e 2: limpeza · 1: outros · 3: brasileiro lá fora
  const pick = (id: string, cid: string, city: string, nicheId?: string) => {
    const n = INTL_NICHES.find((x) => x.id === id)!;
    const c = countryById(cid)!;
    return { niche: n.q[c.lang] ?? n.q.en, nicheId, location: city, country: c.id, label: `${c.flag} ${n.label} · ${city}` };
  };
  if (slot === 3) {
    const [cid, city] = DIASPORA[shift(round, DIASPORA.length)];
    return pick(BR_ABROAD[round % BR_ABROAD.length], cid, city, "brasileiros-exterior");
  }
  if (slot === 1) {
    const p = INTL_PLACES[shift(round, INTL_PLACES.length)];
    return pick(OTHER[round % OTHER.length], p.c.id, p.city);
  }
  const c = round * 2 + (slot === 2 ? 1 : 0);
  const [cid, city] = CLEAN_PLACES[shift(c, CLEAN_PLACES.length)];
  return pick(CLEAN[c % CLEAN.length], cid, city);
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
      const hot = rich.filter((x) => x.score >= (p.country ? Math.min(st.min, 75) : st.min) && x.phoneKind === "celular");
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
