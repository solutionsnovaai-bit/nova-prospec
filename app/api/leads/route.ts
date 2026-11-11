import { guard } from "@/lib/auth";
import { body, fail, ok } from "@/lib/http";
import { listLeads, saveFound } from "@/lib/leads";
import type { FoundPlace } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const g = await guard();
  if (g) return g;
  try {
    return ok({ leads: await listLeads() });
  } catch (e) {
    return fail(e);
  }
}

/** Salva resultados da busca na base. */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const b = await body<{ places?: FoundPlace[] }>(req);
    const saved = await saveFound((b.places ?? []).slice(0, 200));
    return ok({ saved: saved.length, leads: saved });
  } catch (e) {
    return fail(e);
  }
}
