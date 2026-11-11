import { guard } from "@/lib/auth";
import { body, fail, ok } from "@/lib/http";
import { auditLead, getLead, saveLead, addHistory } from "@/lib/leads";
import type { FoundPlace } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Audita sites: recebe resultados da busca (places) ou ids de leads salvos. */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const b = await body<{ places?: FoundPlace[]; ids?: string[] }>(req);
    if (b.places?.length) {
      const out = await Promise.all(b.places.slice(0, 12).map((p) => auditLead(p).catch(() => p)));
      return ok({ places: out });
    }
    const leads = [];
    for (const id of (b.ids ?? []).slice(0, 12)) {
      const l = await getLead(id);
      if (!l) continue;
      const a = await auditLead(l);
      leads.push(await saveLead(a.audit ? addHistory(a, "auditoria", a.audit.ok ? "Site auditado" : `Site com problema: ${a.audit.error ?? a.audit.status}`) : a));
    }
    return ok({ leads });
  } catch (e) {
    return fail(e);
  }
}
