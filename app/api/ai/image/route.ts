import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { generateFreeConcept } from "@/lib/image-generation";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const denied = await guard(); if (denied) return denied;
  const raw = await req.text();
  if (raw.length > 4096) return NextResponse.json({error:"Briefing muito longo."},{status:400});
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({error:"Briefing inválido."},{status:400}); }
  if (!body || ["name","product","title"].some(k=>typeof body[k] !== "string" || !(body[k] as string).trim() || (body[k] as string).length > 240)) return NextResponse.json({error:"Informe empresa e produto válidos."},{status:400});
  try {
    return NextResponse.json({image:await generateFreeConcept(body.name as string, body.product as string, body.title as string)}, {headers:{"Cache-Control":"no-store"}});
  } catch(e) {
    const message = e instanceof Error && !["TimeoutError","AbortError","TypeError"].includes(e.name) ? e.message : "A imagem demorou ou a conexão falhou. Use a prévia PNG; nenhum modelo pago foi selecionado.";
    return NextResponse.json({error:message},{status:503});
  }
}
