import { guard } from "@/lib/auth";
import { db } from "@/lib/db";
import { body, fail, ok } from "@/lib/http";
import { listLeads } from "@/lib/leads";
import { nicheById } from "@/lib/niches";
import { runSearch, type SearchSource } from "@/lib/sources";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const b = await body<{ niche?: string; nicheId?: string; location?: string; source?: SearchSource; page?: number }>(req);
    const niche = String(b.niche || nicheById(b.nicheId)?.label || "").trim();
    const location = String(b.location ?? "").trim();
    if (!niche || !location) return fail(Object.assign(new Error("Informe o nicho e o local."), { status: 400 }));
    const out = await runSearch(b.source ?? "auto", { niche, nicheId: b.nicheId, location, page: b.page ?? 0 });
    const saved = new Set((await listLeads()).map((l) => l.id));
    const places = out.places.map((p) => ({ ...p, saved: saved.has(p.id) }));
    await db.put("searches", `${Date.now()}`, { at: new Date().toISOString(), niche, location, source: out.used, count: places.length });
    return ok({ ...out, places });
  } catch (e) {
    return fail(e, 400);
  }
}
