import "server-only";
import { bumpUsage, getKey, getSettings, monthKey } from "../settings";
import type { ProviderUsage, SourceId } from "../types";
import { SourceError, type SearchInput, type SearchOutput } from "./common";
import { osmSearch } from "./osm";
import { searchapiSearch } from "./searchapi";
import { tavilyWeb } from "./tavily";
import { serpapiAccount, serpapiSearch, serpapiWeb } from "./serpapi";
import { serperSearch, serperWeb } from "./serper";

export { SourceError };

export type SearchSource = "auto" | "serpapi" | "serper" | "searchapi" | "osm";

export async function runSearch(source: SearchSource, input: SearchInput): Promise<SearchOutput & { used: SourceId }> {
  const s = await getSettings();
  const serpapi = await getKey("serpapi", s);
  const serper = await getKey("serper", s);

  const searchapi = await getKey("searchapi", s);
  const has: Partial<Record<SourceId, unknown>> = { serpapi, serper, searchapi, osm: true };
  const order: SourceId[] = source === "auto" ? (["serpapi", "serper", "searchapi", "osm"] as SourceId[]).filter((x) => has[x]) : [source];

  let lastErr: unknown;
  for (const src of order) {
    try {
      if (src === "serpapi") {
        if (!serpapi) throw new SourceError("Coloque a chave da SerpApi em Ajustes.", 400);
        const out = await serpapiSearch(serpapi, input);
        await bumpUsage("serpapi", out.cost ?? 1);
        return { ...out, used: "serpapi" };
      }
      if (src === "serper") {
        if (!serper) throw new SourceError("Coloque a chave do Serper em Ajustes.", 400);
        const out = await serperSearch(serper, input);
        await bumpUsage("serper", out.cost ?? 1);
        await bumpUsage("serper_total", out.cost ?? 1);
        return { ...out, used: "serper" };
      }
      if (src === "searchapi") {
        if (!searchapi) throw new SourceError("Coloque a chave da SearchApi em Ajustes.", 400);
        const out = await searchapiSearch(searchapi, input);
        await bumpUsage("searchapi_total", out.cost ?? 1);
        return { ...out, used: "searchapi" };
      }
      const out = await osmSearch(input);
      return { ...out, used: "osm" };
    } catch (e) {
      lastErr = e;
      // no modo automático, cota zerada ou chave ruim passa para a próxima fonte
      if (source !== "auto") throw e;
      if (e instanceof SourceError && ![401, 402, 429].includes(e.status)) throw e;
    }
  }
  throw lastErr ?? new SourceError("Nenhuma fonte disponível.");
}

/** Busca na web (Google) — usada para achar o Instagram do negócio. */
export async function webSearch(q: string) {
  const s = await getSettings();
  const serper = await getKey("serper", s);
  const serpapi = await getKey("serpapi", s);
  if (serper) {
    try {
      const r = await serperWeb(serper, q);
      await bumpUsage("serper", 1);
      await bumpUsage("serper_total", 1);
      return r;
    } catch (e) {
      if (!serpapi) throw e;
    }
  }
  if (serpapi) {
    const r = await serpapiWeb(serpapi, q);
    await bumpUsage("serpapi", 1);
    return r;
  }
  throw new SourceError("Para procurar Instagram, coloque a chave do Serper ou da SerpApi em Ajustes.", 400);
}

/** Pesquisa para a Nova: Tavily primeiro (renova todo mês); sem chave ou com erro, cai no Google como antes. */
export async function webAnswer(q: string): Promise<{ title?: string; link?: string; snippet?: string }[]> {
  const tavily = await getKey("tavily");
  if (tavily) {
    try {
      const r = await tavilyWeb(tavily, q);
      await bumpUsage("tavily", 1);
      if (r.length) return r;
    } catch {
      /* cai no Google */
    }
  }
  return webSearch(q);
}

export async function providersUsage(): Promise<ProviderUsage[]> {
  const s = await getSettings();
  const m = monthKey();
  const serpapi = await getKey("serpapi", s);
  const serper = await getKey("serper", s);
  const searchapi = await getKey("searchapi", s);
  const acc = serpapi ? await serpapiAccount(serpapi).catch(() => null) : null;
  const local = (id: string) => (s.usage?.[id]?.month === m ? s.usage[id].count : 0);
  const serperTotal = s.usage?.serper_total?.count ?? 0;
  return [
    {
      id: "serpapi",
      label: "SerpApi",
      configured: !!serpapi,
      left: acc?.left ?? (serpapi ? Math.max(0, 250 - local("serpapi")) : null),
      limit: acc?.limit ?? 250,
      used: acc?.used ?? local("serpapi"),
      note: "Grátis: 250 buscas por mês, renova todo mês",
    },
    {
      id: "serper",
      label: "Serper",
      configured: !!serper,
      left: serper ? Math.max(0, 2500 - serperTotal) : null,
      limit: 2500,
      used: serperTotal,
      note: "Grátis: 2.500 créditos uma vez (contagem feita pelo painel)",
    },
    {
      id: "searchapi",
      label: "SearchApi",
      configured: !!searchapi,
      left: searchapi ? Math.max(0, 100 - (s.usage?.searchapi_total?.count ?? 0)) : null,
      limit: 100,
      used: s.usage?.searchapi_total?.count ?? 0,
      note: "Grátis: 100 buscas no cadastro (contagem feita pelo painel)",
    },
    { id: "osm", label: "OpenStreetMap", configured: true, left: null, limit: null, used: null, note: "Grátis e sem chave, com menos telefones" },
  ];
}
