import { GROUP_PROJECT, guessNiche } from "./niches";
import { regionTier } from "./regions";
import type { Lead, PainKey } from "./types";

export const PAIN_LABEL: Record<PainKey, string> = {
  sem_site: "Sem site",
  site_fraco: "Site fraco",
  sem_trafego: "Rastreamento não identificado",
  sem_instagram: "Sem Instagram",
  instagram_fraco: "Instagram fraco",
  google_fraco: "Google fraco",
  sem_loja: "Sem loja online",
  sem_cardapio: "Sem cardápio online",
};

export const PAIN_ORDER: PainKey[] = [
  "sem_site",
  "site_fraco",
  "sem_cardapio",
  "sem_loja",
  "sem_instagram",
  "instagram_fraco",
  "sem_trafego",
  "google_fraco",
];

const W: Record<PainKey, number> = {
  sem_site: 30,
  site_fraco: 18,
  sem_cardapio: 8,
  sem_loja: 8,
  sem_instagram: 10,
  instagram_fraco: 8,
  sem_trafego: 8,
  google_fraco: 6,
};

type Scorable = Pick<
  Lead,
  | "websiteKind"
  | "audit"
  | "instagram"
  | "instagramChecked"
  | "rating"
  | "reviews"
  | "hours"
  | "phoneKind"
  | "category"
  | "name"
  | "niche"
> &
  Partial<Pick<Lead, "address" | "district" | "city" | "query">>;

export function siteIsWeak(a?: Lead["audit"]): string[] {
  if (!a) return [];
  const why: string[] = [];
  if (!a.ok) why.push(a.error ? `fora do ar (${a.error})` : `erro ${a.status ?? ""}`.trim());
  else {
    if (a.https === false) why.push("sem cadeado (http)");
    if (a.mobile === false) why.push("sem indicação de viewport móvel");
    if ((a.ms ?? 0) > 4000) why.push(`HTML demorou (${((a.ms ?? 0) / 1000).toFixed(1)} s)`);
    if (a.copyrightYear && a.copyrightYear <= new Date().getFullYear() - 3) why.push(`rodapé de ${a.copyrightYear}`);
  }
  return why;
}

export function computePains(l: Scorable): PainKey[] {
  const p = new Set<PainKey>();
  const ownSite = l.websiteKind === "proprio";
  if (!ownSite && l.websiteKind !== "construtor") p.add("sem_site");
  if (l.websiteKind === "construtor") p.add("site_fraco");
  if (ownSite && siteIsWeak(l.audit).length) p.add("site_fraco");

  // Ausência de tag é indício sobre rastreamento, nunca prova de ausência de anúncios.
  if (l.audit?.ok && !l.audit.metaPixel && !l.audit.googleAds && !l.audit.googleTag) p.add("sem_trafego");

  if (l.instagram) {
    const f = l.instagram.followers;
    if (l.instagram.quality === "fraco" || (typeof f === "number" && f < 1000)) p.add("instagram_fraco");
  } else if (l.instagramChecked) p.add("sem_instagram");

  const reviews = l.reviews;
  if ((reviews !== undefined && reviews < 20) || (l.rating !== undefined && l.rating < 4.2)) p.add("google_fraco");

  const niche = guessNiche(`${l.category ?? ""} ${l.name}`, l.niche);
  const hasShop = !!l.audit?.ecommerce || l.websiteKind === "delivery";
  if (niche?.group === "varejo" && !hasShop) p.add("sem_loja");
  if (niche?.group === "comida" && !hasShop) p.add("sem_cardapio");

  return PAIN_ORDER.filter((k) => p.has(k));
}

/** Score 0–100 = dor (até ~75) + viabilidade (até 25: dá pra chamar no WhatsApp e o negócio é ativo). */
export function computeScore(l: Scorable, pains = computePains(l)) {
  let dor = pains.reduce((s, k) => s + W[k], 0);
  if (pains.includes("sem_site") && pains.includes("site_fraco")) dor -= W.site_fraco;
  dor = Math.min(dor, 75);

  let via = 0;
  if (l.phoneKind === "celular") via += 11;
  else if (l.phoneKind === "fixo") via += 4;
  const r = l.reviews ?? 0;
  if (r >= 10 && r <= 600) via += 8;
  else if (r >= 3) via += 4;
  if ((l.rating ?? 0) >= 4) via += 4;
  if (l.hours?.length) via += 2;
  const tier = regionTier(`${l.district ?? ""} ${l.address ?? ""} ${l.city ?? ""}`) ?? regionTier(l.query);
  if (tier === "prioridade") via += 8;
  if (tier === "regional") via -= 8;

  const score = Math.max(0, Math.min(100, Math.round(dor + via)));
  const temperature: Lead["temperature"] = score >= 65 ? "quente" : score >= 45 ? "morno" : "frio";
  return { score, temperature };
}

export function rescore<T extends Scorable>(l: T): T & Pick<Lead, "pains" | "score" | "temperature"> {
  const pains = computePains(l);
  return { ...l, pains, ...computeScore(l, pains) };
}

/** Projeto visual sugerido sem IA (a IA refina na análise). */
export function suggestProject(l: Scorable & { pains?: PainKey[] }) {
  const niche = guessNiche(`${l.category ?? ""} ${l.name}`, l.niche);
  const pains = l.pains ?? computePains(l);
  if (niche) {
    const base = GROUP_PROJECT[niche.group];
    if (pains.includes("site_fraco") && !pains.includes("sem_site"))
      return { tipo: "Site novo", titulo: `Site novo no lugar do atual — ${base.titulo.toLowerCase()}` };
    return base;
  }
  if (pains.includes("instagram_fraco") || pains.includes("sem_instagram"))
    return { tipo: "Identidade visual", titulo: "Logo premium e 6 posts de feed no padrão da marca" };
  return { tipo: "Landing page", titulo: "Página de apresentação com WhatsApp" };
}
