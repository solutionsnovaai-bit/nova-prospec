import type { Lead } from "./types";

/** Regras puras para decidir se um endereço na web é o site de um negócio (sem rede, fácil de testar). */
export type MatchLead = Pick<Lead, "name"> & Partial<Pick<Lead, "address" | "district" | "city" | "query" | "phone" | "phoneE164" | "instagram">>;

export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const toks = (s: string) => norm(s).replace(/\([^)]*\)/g, " ").split(/[^a-z0-9]+/).filter(Boolean);

const STOP = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "na", "no", "em", "por", "para", "sua", "seu"]);
const GENERIC = new Set(["estetica", "avancada", "beleza", "beauty", "center", "cabeleireiro", "cabeleireiros", "pet", "shop", "spa", "boutique", "bazar", "salon", "hamburgueria", "restaurante", "pizzaria", "padaria", "lanchonete", "cafeteria", "sorveteria", "acougue", "clinica", "consultorio", "salao", "barbearia", "studio", "estudio", "espaco", "loja", "petshop", "academia", "oficina", "farmacia", "otica", "dr", "dra", "doutor", "doutora", "instituto", "atelie", "emporio"]);
const TAIL = new Set(["unidade", "loja", "matriz", "filial", "ltda", "me", "eireli", "oficial", "delivery", "sp", "rj", "rs"]);
const STREET_PREFIX = new Set(["r", "rua", "av", "avenida", "al", "alameda", "praca", "pc", "pca", "estr", "estrada", "rod", "rodovia", "travessa", "tv", "largo", "lgo"]);

/** Sites que listam negócios de terceiros: nunca contam como site próprio. */
export const DIRECTORY =
  /(google\.|youtube\.|tiktok\.|kwai\.|linkedin\.|twitter\.|pinterest\.|tripadvisor\.|yelp\.|foursquare\.|baressp\.|guiadasemana\.|vejasp|abril\.com|timeout\.|apontador\.|telelistas\.|guiamais\.|solutudo\.|cnpj|econodata\.|casadosdados\.|empresaqui|consultasocio|reclameaqui\.|mercadolivre\.|olx\.|booking\.|airbnb\.|uber\.|99app\.|wanderlog\.|restaurantguru\.|kekanto\.|cylex\.|infobel\.|encontra[a-z]*\.com\.br|listamais|hagah|wikipedia\.|jusbrasil\.|glassdoor\.|indeed\.|infojobs\.|catho\.|gov\.br|uol\.com\.br|globo\.com|terra\.com\.br|r7\.com|estadao\.|folha\.|doctoralia\.|boaconsulta\.|booksy\.|trinks\.|gympass|wellhub|getninjas\.|habitissimo|waze\.|moovit|tudogostoso|saopaulosecreto|diariodolitoral)/i;

const PARKED =
  /(dominio|domain)[^.]{0,60}(a venda|for sale|disponivel para|is available|expirou|expired|parked)|buy this domain|compre este dominio|site em construcao|estamos em construcao|em breve no ar|coming soon|under construction|pagina padrao|default (web )?page|welcome to nginx|apache2 \w+ default|index of \/|conta suspensa|account suspended/;

/** Bairro: o que o painel já tem, ou o trecho "- Bairro, Cidade - UF" do endereço, ou o local da busca. */
export function neighborhood(l: MatchLead): string | undefined {
  if (l.district && !/^\d/.test(l.district)) return l.district;
  const m = l.address?.match(/-\s*([^,\-\d][^,\-]*),\s*[^,]+-\s*[A-Z]{2}\b/);
  if (m) return m[1].trim();
  const q = l.query?.split(/\s+em\s+/i)[1]?.split(",")[0]?.trim();
  return q || undefined;
}

function locTokens(l: MatchLead) {
  const qLoc = l.query?.split(/\s+em\s+/i)[1] ?? "";
  return new Set(toks(`${neighborhood(l) ?? ""} ${l.city ?? ""} ${qLoc}`));
}

const distinct = (t: string[], loc: Set<string>) => t.filter((x) => x.length >= 3 && !GENERIC.has(x) && !STOP.has(x) && !TAIL.has(x) && !loc.has(x));

/** Parte do nome que identifica o negócio: "Petshop - Vila Carrão - 4 Patas Club" vira "4 Patas Club". */
export function mainName(l: MatchLead): string {
  const loc = locTokens(l);
  const parts = l.name
    .replace(/\([^)]*\)/g, " ")
    .split(/\s*[|–—•]\s*|\s+-\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.find((p) => distinct(toks(p), loc).length > 0) ?? parts[0] ?? l.name;
}

/** Nome sem o bairro/cidade no fim: "Dead burger Tatuapé" vira ["dead", "burger"]. */
export function baseTokens(l: MatchLead): string[] {
  const loc = locTokens(l);
  const all = toks(mainName(l));
  const t = [...all];
  while (t.length > 1 && (loc.has(t[t.length - 1]) || TAIL.has(t[t.length - 1]))) t.pop();
  // "Barbearia da Mooca": o bairro é o próprio nome, então fica
  return distinct(t, loc).length || !distinct(all, new Set()).length ? t : all;
}

function handleOf(l: MatchLead) {
  return l.instagram?.handle ? norm(l.instagram.handle).replace(/[^a-z0-9]/g, "") : "";
}

/** Endereços prováveis do site, do mais ao menos provável (no máximo 8). */
export function domainCandidates(l: MatchLead): string[] {
  const base = baseTokens(l);
  const loc = locTokens(l);
  const h = handleOf(l);
  const slugs = [base.join(""), toks(mainName(l)).join(""), GENERIC.has(base[0]) && base.length > 1 ? base.slice(1).join("") : "", h, base.length > 1 ? base.join("-") : ""];
  for (const t of loc) if (h && t.length >= 4 && h.endsWith(t)) slugs.push(h.slice(0, -t.length));
  const ok = [...new Set(slugs)].filter((s) => s.length >= 5 && s.length <= 40).slice(0, 5);
  return [...ok.map((s) => `${s}.com.br`), ...ok.slice(0, 3).map((s) => `${s}.com`)];
}

export function hostOf(url: string) {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function hostCore(url: string) {
  const h = hostOf(url).replace(/\.(com|net|org|app|art|eco|ind|srv)\.br$|\.(com|net|org|br|app|site|online|store|shop|io|co|me|digital|food|menu)$/, "");
  return (h.split(".").pop() ?? "").replace(/-/g, "");
}

/** O endereço parece com o nome do negócio (ou com o @ do Instagram)? */
export function hostLooksLike(l: MatchLead, url: string): boolean {
  const core = hostCore(url);
  if (core.length < 5) return false;
  const base = baseTokens(l).join("");
  const full = toks(mainName(l)).join("");
  const h = handleOf(l);
  const near = (name: string) => !!name && (core === name || (name.length >= 5 && core.includes(name)) || (name.includes(core) && core.length >= Math.max(5, Math.ceil(base.length * 0.7))));
  return near(base) || near(full) || near(h);
}

function streetKey(addr?: string) {
  const t = toks(addr?.split(",")[0] ?? "");
  while (t.length && STREET_PREFIX.has(t[0])) t.shift();
  return t.length >= 2 || (t.length === 1 && t[0].length >= 7) ? t.join(" ") : "";
}

export interface Evidence {
  phone: boolean;
  street: boolean;
  ig: boolean;
  nameInTitle: boolean;
  hood: boolean;
  city: boolean;
  parked: boolean;
}

/** O que a página tem em comum com o negócio. */
export function pageEvidence(l: MatchLead, html: string): Evidence {
  const raw = norm(html);
  const title = `${raw.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? ""} ${raw.match(/property=["']og:site_name["'][^>]*content=["']([^"']*)/)?.[1] ?? ""}`;
  const text = raw
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const d8 = (l.phoneE164 ?? l.phone ?? "").replace(/\D/g, "").slice(-8);
  const phone = d8.length === 8 && new RegExp(`${d8.slice(0, 4)}[\\s.\\-]{0,3}${d8.slice(4)}`).test(raw);
  const street = streetKey(l.address);
  const h = l.instagram?.handle?.toLowerCase();
  const base = baseTokens(l);
  const nb = norm(neighborhood(l) ?? "");
  const city = norm(l.city ?? "");
  return {
    phone,
    street: !!street && text.includes(street),
    ig: !!h && raw.includes(`instagram.com/${h}`),
    nameInTitle: (() => {
      const words = new Set(title.split(/[^a-z0-9]+/));
      const key = distinct(base, new Set());
      const need = key.length ? key : base;
      const joined = base.join("");
      return (need.length > 0 && need.every((t) => words.has(t))) || (joined.length >= 6 && title.replace(/[^a-z0-9]/g, "").includes(joined));
    })(),
    hood: nb.length >= 4 && text.includes(nb),
    city: city.length >= 4 && text.includes(city),
    parked: text.length < 150 || PARKED.test(text.slice(0, 1500)),
  };
}

/**
 * Aceita a página como site do negócio?
 * - endereço adivinhado pelo nome: precisa de prova forte (telefone, rua ou @) ou do nome no título junto com o bairro;
 * - endereço que o Google trouxe para "nome + bairro": basta o nome no título e a cidade.
 */
export function accepts(e: Evidence, mode: "dominio" | "google") {
  if (e.parked) return false;
  if (e.phone || e.street || e.ig) return true;
  return mode === "google" ? e.nameInTitle && (e.hood || e.city) : e.nameInTitle && e.hood;
}

export function searchQuery(l: MatchLead) {
  const where = neighborhood(l) ?? l.city ?? "";
  const name = mainName(l);
  return norm(name).includes(norm(where)) ? name : `${name} ${where}`.trim();
}
