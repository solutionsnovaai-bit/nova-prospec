import { guard } from "@/lib/auth";
import { body, fail, ok } from "@/lib/http";
import { findInstagram, getLead, ensureSite } from "@/lib/leads";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Confere o site e procura o Instagram de um ou mais leads (até 2 créditos de busca cada). */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const b = await body<{ ids?: string[] }>(req);
    const found = (await Promise.all((b.ids ?? []).slice(0, 10).map((id) => getLead(id)))).filter((l) => !!l);
    const checked = await Promise.all(found.map((l) => ensureSite(l)));
    const leads = [];
    for (const l of checked) {
      // a conferência do site já pode ter trazido os seguidores na mesma busca
      const fresh = l.instagram?.checkedAt && Date.now() - Date.parse(l.instagram.checkedAt) < 120_000;
      leads.push(fresh ? l : await findInstagram(l));
    }
    return ok({ leads });
  } catch (e) {
    return fail(e, 400);
  }
}
