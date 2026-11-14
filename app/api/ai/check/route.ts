import { guard } from "@/lib/auth";
import { getKey } from "@/lib/settings";
import { PROVIDERS } from "@/lib/ai";
import { ok } from "@/lib/http";
export const maxDuration = 15;
export async function POST() {
  const g = await guard(); if (g) return g;
  const results = await Promise.all((["groq", "openrouter", "gemini"] as const).map(async provider => {
    const key = await getKey(provider);
    if (!key) return { provider, status: "sem chave" };
    try {
      const res = await fetch(`${PROVIDERS[provider].baseUrl}/models`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000), redirect: "error", cache: "no-store" });
      // Some catalog endpoints are public: this is connectivity, not a guarantee of generation quota.
      return { provider, status: res.ok ? "catálogo acessível; geração/cota não testadas" : `erro HTTP ${res.status}` };
    } catch { return { provider, status: "não respondeu" }; }
  }));
  return ok({ results });
}
