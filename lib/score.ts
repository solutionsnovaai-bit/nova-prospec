import { productIdeas } from "./opportunities";
import { GROUP_PROJECT, guessNiche, TARGET_GROUPS } from "./niches";
import { normalizeIntlPhone, normalizePhone } from "./phone";
import { regionTier } from "./regions";
import type { Lead, PainKey } from "./types";

export const PAIN_LABEL: Record<PainKey, string> = {
  sem_site: "Sem site",
  site_fraco: "Site fraco",
  sem_trafego: "Rastreamento não identificado",
  sem_whatsapp: "Site sem botão de WhatsApp",
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
  "sem_whatsapp",
  "google_fraco",
];

const W: Record<PainKey, number> = {
  sem_site: 25,
  site_fraco: 18,
  sem_cardapio: 6,
  sem_loja: 6,
  sem_instagram: 4,
  instagram_fraco: 4,
  sem_trafego: 4,
  sem_whatsapp: 4,
  google_fraco: 0,
};

/** Pesos para advocacia e consórcio: a dor é atendimento/captação, não falta de site. */
const W_TARGET: Record<PainKey, number> = {
  sem_whatsapp: 12,
  sem_site: 12,
  sem_trafego: 8,
  site_fraco: 8,
  sem_instagram: 4,
  instagram_fraco: 4,
  google_fraco: 0,
  sem_loja: 0,
  sem_cardapio: 0,
};

/** Nome com cara de profissional dono do próprio escritório: a mensagem tende a cair direto em quem decide. */
const OWNER_HINT = /(\bdra?\b\.?|\bdoutora?\b|\badvogad[oa]s?\b|\badv\.|\bconsultora?\b|\bcorretora?\b|associados|sociedade de advogados)/i;

/** Limpeza em qualquer idioma (lá fora é o carro-chefe da oferta de site). */
export const CLEANING_RX = /clean|limpez|limpie|nettoy|reinig|schoonmaak|pulizi|temizlik|تنظيف|kebersihan|清掃|청소/i;

export function isTargetLead(l: Pick<Lead, "category" | "name" | "niche"> & { country?: string }) {
  const n = guessNiche(`${l.category ?? ""} ${l.name}`, l.niche);
  // lá fora a oferta é site: advocacia sai do foco, o resto entra
  if (l.country && l.country !== "br") return n?.group !== "juridico";
  return !!n && TARGET_GROUPS.includes(n.group);
}

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
  if (l.audit?.ok && l.audit.whatsappButton === false && !l.audit.socials?.whatsapp) p.add("sem_whatsapp");

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

const temperatureOf = (score: number): Lead["temperature"] => (score >= 80 ? "quente" : score >= 55 ? "morno" : "frio");

/** Contato (até 35): celular é o que faz a Bia conseguir falar com o lead. */
const contactPts = (l: Scorable & { country?: string }) =>
  l.phoneKind === "celular" ? (["us", "ca"].includes(l.country ?? "") ? 22 : 35) : l.phoneKind === "fixo" ? 8 : 0; // EUA/Canadá: o número pode não ter WhatsApp

/**
 * Régua do calor (0–100). O lead perfeito chega a 95–100; quente a partir de 80, morno de 55 a 79.
 * Nichos-alvo (advocacia, consórcio, crédito, seguros, contabilidade, imobiliária, energia solar):
 * contato 35 + porte 25 + reputação 5 + investe em presença 10 + decisor 5 + dor de atendimento 20.
 * Exemplo de 96: WhatsApp celular, 50+ avaliações nota 4,6, site e Instagram, "Dra." no nome,
 * site sem botão de WhatsApp e sem pixel.
 */
function targetScore(l: Scorable, pains: PainKey[]) {
  const r = l.reviews ?? 0;
  const porte = r >= 100 ? 25 : r >= 50 ? 21 : r >= 20 ? 16 : r >= 8 ? 10 : r >= 3 ? 5 : 0;
  const rep = (l.rating ?? 0) >= 4.5 ? 5 : (l.rating ?? 0) >= 4 ? 3 : 0;
  const presenca = (l.websiteKind === "proprio" ? 6 : 0) + (l.instagram ? 4 : 0);
  const decisor = OWNER_HINT.test(l.name) ? 5 : 0;
  const dor = Math.min(20, pains.reduce((s, k) => s + W_TARGET[k], 0));
  return contactPts(l) + porte + rep + presenca + decisor + dor;
}

/**
 * Demais nichos: contato 35 + movimento 20 + reputação 5 + negócio ativo 5 + dor digital 35.
 * Exemplo de 100: celular, 100+ avaliações nota 4,5+, horário preenchido, sem site e sem cardápio.
 */
function generalScore(l: Scorable, pains: PainKey[]) {
  const r = l.reviews ?? 0;
  const mov = r >= 100 ? 20 : r >= 30 ? 16 : r >= 10 ? 11 : r >= 3 ? 5 : 0;
  const rep = (l.rating ?? 0) >= 4.5 ? 5 : (l.rating ?? 0) >= 4 ? 3 : 0;
  const ativo = l.hours?.length ? 5 : 0;
  let dor = pains.reduce((s, k) => s + W[k], 0);
  if (pains.includes("sem_site") && pains.includes("site_fraco")) dor -= W.site_fraco;
  return contactPts(l) + mov + rep + ativo + Math.min(35, dor);
}

/**
 * Fora do Brasil a oferta é site: contato 35 (EUA/Canadá 22) + porte 25 + reputação 5 + decisor 5 + dor de site 30.
 * Sem site 30, site fraco 22, site sem jeito de chamar no WhatsApp 15. Site bom fica morno (vai pro fim da fila).
 */
function siteScore(l: Scorable & { country?: string }, pains: PainKey[]) {
  const r = l.reviews ?? 0;
  const porte = r >= 100 ? 25 : r >= 50 ? 21 : r >= 20 ? 16 : r >= 8 ? 10 : r >= 3 ? 5 : 0;
  const rep = (l.rating ?? 0) >= 4.5 ? 5 : (l.rating ?? 0) >= 4 ? 3 : 0;
  const decisor = OWNER_HINT.test(l.name) ? 5 : 0;
  const dor = pains.includes("sem_site") ? 30 : pains.includes("site_fraco") ? 22 : pains.includes("sem_whatsapp") ? 15 : 0;
  // lá fora: limpeza na frente, advocacia no fim da fila
  const text = `${l.category ?? ""} ${l.name}`;
  const ajuste = CLEANING_RX.test(text) || l.niche === "limpeza" ? 6 : guessNiche(text, l.niche)?.group === "juridico" ? -18 : 0;
  return contactPts(l) + porte + rep + decisor + dor + ajuste;
}

export function computeScore(l: Scorable & { country?: string }, pains = computePains(l)) {
  const abroad = !!l.country && l.country !== "br";
  let score = abroad ? siteScore(l, pains) : isTargetLead(l) ? targetScore(l, pains) : generalScore(l, pains);
  // região só desempata: Brasil inteiro e exterior contam igual
  const tier = regionTier(`${l.district ?? ""} ${l.address ?? ""} ${l.city ?? ""}`) ?? regionTier(l.query);
  if (tier === "regional") score -= 3;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, temperature: temperatureOf(score) };
}

/**
 * Telefone do Google Maps é fixo, mas o site tem botão de WhatsApp: usa o WhatsApp do site,
 * que costuma cair direto em quem atende (e a Bia consegue chamar). O fixo fica guardado.
 */
export function preferWhatsapp<T extends Partial<Lead>>(l: T): T {
  const wa = l.audit?.socials?.whatsapp;
  if (!wa || l.phoneKind === "celular") return l;
  const ph = l.country && l.country !== "br" ? normalizeIntlPhone(wa, l.country) : normalizePhone(wa);
  if (!ph.e164 || ph.kind !== "celular" || ph.e164 === l.phoneE164) return l;
  return { ...l, phoneFixo: l.phoneFixo ?? l.phone, phone: ph.pretty, phoneE164: ph.e164, phoneKind: "celular" };
}

export function rescore<T extends Scorable>(l: T): T & Pick<Lead, "pains" | "score" | "temperature"> {
  const w = preferWhatsapp(l as T & Partial<Lead>) as T;
  const pains = computePains(w);
  return { ...w, pains, ...computeScore(w, pains) };
}

/** Produto sugerido sem chamada de IA. Necessidade operacional sempre precisa ser confirmada. */
export function suggestProject(l: Scorable & { pains?: PainKey[] }) {
  const pains = l.pains ?? computePains(l);
  const niche = guessNiche(`${l.category ?? ""} ${l.name}`, l.niche);
  if (niche && TARGET_GROUPS.includes(niche.group)) return GROUP_PROJECT[niche.group];
  if (pains.includes("site_fraco")) return { tipo: "Site novo", titulo: "Revisão do site com foco nos problemas observados" };
  if (pains.includes("sem_site") && !["comida", "varejo"].includes(niche?.group ?? "")) return { tipo: "Landing page", titulo: "Página de apresentação com serviços e contato" };
  return productIdeas(l)[0];
}
