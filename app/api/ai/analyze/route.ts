import { guard } from "@/lib/auth";
import { analyzeLead } from "@/lib/analyze";
import { body, fail, ok } from "@/lib/http";
import { getLead } from "@/lib/leads";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const b = await body<{ id?: string; web?: boolean }>(req);
    const l = await getLead(String(b.id ?? ""));
    if (!l) return fail(Object.assign(new Error("Lead não encontrado."), { status: 404 }));
    return ok({ lead: await analyzeLead(l, { web: !!b.web }) });
  } catch (e) {
    return fail(e, 400);
  }
}
