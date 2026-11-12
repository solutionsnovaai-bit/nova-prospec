import { guard } from "@/lib/auth";
import { body, fail, ok } from "@/lib/http";
import { checkSite, listLeads, saveLead } from "@/lib/leads";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Confere se leads marcados como "sem site" têm site próprio.
 * Sem `google` é grátis (testa os endereços prováveis); com `google` gasta 1 crédito de busca por lead.
 */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const b = await body<{ ids?: string[]; google?: boolean; limit?: number; hot?: boolean; force?: boolean }>(req);
    const redo = !!b.force && !!b.ids?.length; // refazer só os leads pedidos
    const pending = (await listLeads()).filter(
      (l) =>
        l.source !== "exemplo" &&
        !["proprio", "construtor"].includes(l.websiteKind) &&
        (redo || !l.siteCheck || (!!b.google && !l.siteCheck.google)) &&
        (!b.ids || b.ids.includes(l.id)) &&
        (!b.hot || l.temperature === "quente"),
    );
    const batch = pending.slice(0, Math.max(1, Math.min(b.limit ?? 6, 10)));
    const one = async (l: (typeof batch)[number]) => {
      try {
        const c = await checkSite(l, { google: !!b.google, force: redo });
        return c === l ? l : await saveLead(c);
      } catch {
        return l;
      }
    };
    // com Google vai um por vez, para a contagem de créditos do painel não se perder
    const done: typeof batch = [];
    if (b.google) for (const l of batch) done.push(await one(l));
    else done.push(...(await Promise.all(batch.map(one))));
    return ok({
      checked: batch.length,
      left: pending.length - batch.length,
      found: done.filter((l) => l.siteCheck?.found).map((l) => ({ name: l.name, site: l.website, score: l.score })),
      leads: b.ids ? done : undefined,
    });
  } catch (e) {
    return fail(e);
  }
}
