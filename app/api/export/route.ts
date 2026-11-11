import { guard } from "@/lib/auth";
import { listLeads } from "@/lib/leads";
import { WEBSITE_LABEL } from "@/lib/phone";
import { PAIN_LABEL } from "@/lib/score";
import { STATUS_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = v === undefined || v === null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  const g = await guard();
  if (g) return g;
  const ids = new URL(req.url).searchParams.get("ids")?.split(",").filter(Boolean);
  let leads = await listLeads();
  if (ids?.length) leads = leads.filter((l) => ids.includes(l.id));
  const head = ["Nome", "Categoria", "Bairro", "Cidade", "Telefone", "WhatsApp", "Tipo", "Site", "Presença", "Instagram", "Seguidores", "Nota", "Avaliações", "Score", "Dores", "Status", "Projeto (IA)", "Prévia", "Google Maps"];
  const rows = leads.map((l) => [
    l.name, l.category, l.district, l.city, l.phone, l.phoneE164 ? `https://wa.me/${l.phoneE164}` : "", l.phoneKind,
    l.website, WEBSITE_LABEL[l.websiteKind], l.instagram ? `@${l.instagram.handle}` : "", l.instagram?.followers,
    l.rating, l.reviews, l.score, l.pains.map((p) => PAIN_LABEL[p]).join(", "), STATUS_LABEL[l.status],
    l.ai?.projeto.titulo, l.demoUrl, l.mapsUrl,
  ]);
  const csv = "﻿" + [head, ...rows].map((r) => r.map(esc).join(";")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nova-prospec-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
