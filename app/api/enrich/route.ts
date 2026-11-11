import { guard } from "@/lib/auth";
import { body, fail, ok } from "@/lib/http";
import { findInstagram, getLead } from "@/lib/leads";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Procura Instagram de um ou mais leads (1 crédito de busca cada). */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const b = await body<{ ids?: string[] }>(req);
    const leads = [];
    for (const id of (b.ids ?? []).slice(0, 10)) {
      const l = await getLead(id);
      if (l) leads.push(await findInstagram(l));
    }
    return ok({ leads });
  } catch (e) {
    return fail(e, 400);
  }
}
