import { guard } from "@/lib/auth";
import { db } from "@/lib/db";
import { body, fail, ok } from "@/lib/http";
import { addHistory, getLead, saveLead, setStatus } from "@/lib/leads";
import { classifyWebsite, normalizePhone } from "@/lib/phone";
import { STATUS_ORDER, type Lead, type LeadStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  const l = await getLead(decodeURIComponent(id));
  return l ? ok({ lead: l }) : fail(Object.assign(new Error("Lead não encontrado."), { status: 404 }));
}

export async function PATCH(req: Request, ctx: Ctx) {
  const g = await guard();
  if (g) return g;
  try {
    const { id } = await ctx.params;
    let l = await getLead(decodeURIComponent(id));
    if (!l) return fail(Object.assign(new Error("Lead não encontrado."), { status: 404 }));
    const b = await body<Partial<Lead> & { event?: "mensagem"; message?: string; instagramHandle?: string; instagramFollowers?: number }>(req);

    if (b.status && STATUS_ORDER.includes(b.status as LeadStatus)) l = await setStatus(l, b.status as LeadStatus);
    const next: Lead = { ...l };
    if (typeof b.notes === "string" && b.notes !== l.notes) {
      next.notes = b.notes;
    }
    if (typeof b.demoUrl === "string" && b.demoUrl !== l.demoUrl) {
      next.demoUrl = b.demoUrl.trim() || undefined;
      if (next.demoUrl && ["novo", "qualificado"].includes(next.status)) next.status = "demo";
      Object.assign(next, addHistory(next, "demo", next.demoUrl ? `Prévia: ${next.demoUrl}` : "Prévia removida"));
    }
    if (typeof b.phone === "string") {
      const p = normalizePhone(b.phone);
      next.phone = p.pretty ?? b.phone;
      next.phoneE164 = p.e164;
      next.phoneKind = p.kind;
    }
    if (typeof b.website === "string") {
      next.website = b.website.trim() || undefined;
      next.websiteKind = classifyWebsite(next.website).kind;
      next.audit = undefined;
    }
    if (typeof b.instagramHandle === "string") {
      const h = b.instagramHandle.replace(/^@/, "").replace(/^.*instagram\.com\//i, "").replace(/[/?].*$/, "").trim();
      next.instagram = h
        ? {
            handle: h,
            url: `https://instagram.com/${h}`,
            source: "manual",
            followers: typeof b.instagramFollowers === "number" ? b.instagramFollowers : l.instagram?.handle === h ? l.instagram.followers : undefined,
            quality: typeof b.instagramFollowers === "number" ? (b.instagramFollowers < 1000 ? "fraco" : b.instagramFollowers < 5000 ? "ok" : "bom") : undefined,
          }
        : undefined;
      next.instagramChecked = true;
    }
    if (typeof b.optOut === "boolean") next.optOut = b.optOut;
    if (b.event === "mensagem") {
      Object.assign(next, addHistory(next, "mensagem", (b.message ?? "Mensagem enviada no WhatsApp").slice(0, 400)));
      if (["novo", "qualificado", "demo"].includes(next.status)) {
        next.status = "abordado";
        next.contactedAt = next.contactedAt ?? new Date().toISOString();
      }
    }
    return ok({ lead: await saveLead(next) });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  await db.del("leads", decodeURIComponent(id));
  return ok({ ok: true });
}
