import { fetchJson, SourceError } from "./common";

/** Tavily: pesquisa na web feita para IA, 1.000 créditos grátis por mês. Primeira opção da Nova. */
export async function tavilyWeb(key: string, q: string) {
  const r = await fetchJson("https://api.tavily.com/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, max_results: 6, search_depth: "basic", include_answer: true }),
    timeoutMs: 20000,
  });
  if (!r.ok) {
    if (r.status === 401) throw new SourceError("Chave do Tavily inválida. Confira em Ajustes.", 401);
    if ([429, 432, 433].includes(r.status)) throw new SourceError("Os créditos grátis do Tavily deste mês acabaram.", 402);
    throw new SourceError(`Tavily respondeu ${r.status}`, r.status);
  }
  const j = r.json as { answer?: string; results?: { title?: string; url?: string; content?: string }[] } | null;
  const head = j?.answer ? [{ title: "Resumo da pesquisa", link: "", snippet: j.answer }] : [];
  return head.concat((j?.results ?? []).map((o) => ({ title: o.title ?? "", link: o.url ?? "", snippet: (o.content ?? "").slice(0, 500) })));
}
