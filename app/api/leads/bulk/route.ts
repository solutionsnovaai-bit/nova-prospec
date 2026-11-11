import { guard } from "@/lib/auth";
import { db } from "@/lib/db";
import { body, fail, ok } from "@/lib/http";
import { getLead, setStatus } from "@/lib/leads";
import { STATUS_ORDER, type LeadStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const b = await body<{ ids?: string[]; action?: "status" | "delete"; status?: LeadStatus }>(req);
    const ids = (b.ids ?? []).slice(0, 500);
    let n = 0;
    for (const id of ids) {
      if (b.action === "delete") {
        await db.del("leads", id);
        n++;
      } else if (b.action === "status" && b.status && STATUS_ORDER.includes(b.status)) {
        const l = await getLead(id);
        if (l) {
          await setStatus(l, b.status);
          n++;
        }
      }
    }
    return ok({ changed: n });
  } catch (e) {
    return fail(e);
  }
}
