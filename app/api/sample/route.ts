import { guard } from "@/lib/auth";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { sampleLeads } from "@/lib/sample";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST() {
  const g = await guard();
  if (g) return g;
  try {
    const leads = sampleLeads();
    await db.putMany("leads", leads.map((l) => ({ id: l.id, data: l })));
    return ok({ added: leads.length });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE() {
  const g = await guard();
  if (g) return g;
  const all = await db.all<Lead>("leads");
  let n = 0;
  for (const l of all)
    if (l.source === "exemplo") {
      await db.del("leads", l.id);
      n++;
    }
  return ok({ removed: n });
}
