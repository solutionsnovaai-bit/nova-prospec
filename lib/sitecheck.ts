import "server-only";
import { parseInstagramSnippet } from "./audit";
import { classifyWebsite } from "./phone";
import { accepts, DIRECTORY, domainCandidates, hostLooksLike, hostOf, pageEvidence, searchQuery, type MatchLead } from "./sitematch";
import { webSearch } from "./sources";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const MAX_BYTES = 400_000;
const isOwn = (url: string) => ["proprio", "construtor"].includes(classifyWebsite(url).kind) && !DIRECTORY.test(hostOf(url));
const home = (url: string) => {
  try {
    return new URL(url).origin + "/";
  } catch {
    return url;
  }
};

async function fetchPage(url: string, ms: number): Promise<{ url: string; html: string } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      cache: "no-store",
      headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9", Accept: "text/html,*/*" },
    });
    if (!res.ok || !res.body) return null;
    const type = res.headers.get("content-type") ?? "";
    if (type && !/html|text\/plain/i.test(type)) return null;
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let html = "";
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      html += dec.decode(value, { stream: true });
      if (total > MAX_BYTES) {
        ctrl.abort();
        break;
      }
    }
    return { url: res.url || url, html };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface SiteFinding {
  found?: string;
  how?: "dominio" | "google";
  google: boolean; // a busca no Google foi feita
  instagram?: { handle: string; followers?: number; posts?: number };
}

/**
 * Procura o site próprio de um negócio que o Google Maps mostra sem site (ou só com Instagram, WhatsApp, link na bio).
 * 1) grátis: testa os endereços prováveis pelo nome e pelo @ (nome.com.br, nome.com) e só aceita com prova na página;
 * 2) com `google`: 1 busca por "nome + bairro" e confere os resultados cujo endereço parece com o nome.
 */
export async function findSite(l: MatchLead, opts: { google?: boolean } = {}): Promise<SiteFinding> {
  const tries = await Promise.all(domainCandidates(l).map(async (d) => (await fetchPage(`https://${d}`, 4000)) ?? (await fetchPage(`https://www.${d}`, 3000))));
  for (const p of tries) if (p && isOwn(p.url) && accepts(pageEvidence(l, p.html), "dominio")) return { found: home(p.url), how: "dominio", google: false };
  if (!opts.google) return { google: false };

  let results: { title?: string; link?: string; snippet?: string }[];
  try {
    results = await webSearch(searchQuery(l));
  } catch {
    return { google: false }; // sem chave ou sem cota: fica para a próxima
  }
  const known = l.instagram?.handle?.toLowerCase();
  let instagram: SiteFinding["instagram"];
  if (known) {
    const hit = results.find((r) => classifyWebsite(r.link).instagram?.toLowerCase() === known);
    if (hit) instagram = { handle: known, ...parseInstagramSnippet(`${hit.title ?? ""} ${hit.snippet ?? ""}`) };
  }
  const homes = [...new Set(results.map((r) => r.link ?? "").filter((u) => u && isOwn(u) && hostLooksLike(l, u)).map(home))].slice(0, 3);
  const pages = await Promise.all(homes.map((u) => fetchPage(u, 5000)));
  for (const p of pages) if (p && isOwn(p.url) && accepts(pageEvidence(l, p.html), "google")) return { found: home(p.url), how: "google", google: true, instagram };
  return { google: true, instagram };
}
