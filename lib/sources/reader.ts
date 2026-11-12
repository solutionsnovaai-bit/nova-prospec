/** Jina Reader: transforma qualquer página em texto limpo. Grátis e sem chave (até 20 leituras por minuto). */
export async function readPage(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, { headers: { Accept: "text/plain", "X-Return-Format": "markdown" }, signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return "";
    const text = await res.text();
    return text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\]\([^)]*\)/g, "]")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 5000);
  } catch {
    return "";
  } finally {
    clearTimeout(t);
  }
}
