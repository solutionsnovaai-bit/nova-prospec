import { guard } from "@/lib/auth";
import { body, fail } from "@/lib/http";
import { generateSpeech } from "@/lib/speech";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function POST(req: Request) {
  const g = await guard(); if (g) return g;
  try {
    const input = await body<{ text?: string; testProvider?: string }>(req);
    const text = input.testProvider === "fish" ? "Olá, Victor. Este é um teste da voz Fish Audio no Nova Prospec." : String(input.text ?? "").trim().slice(0, 900);
    if (!text) return fail(Object.assign(new Error("Texto vazio."), { status: 400 }));
    const audio = await generateSpeech(text, input.testProvider === "fish" ? "fish" : undefined);
    if (audio) return new Response(audio.data, { headers: { "Content-Type": audio.type, "Cache-Control": "no-store", "x-voice": audio.via } });
    return fail(Object.assign(new Error("Sem voz natural disponível. Use a voz do navegador."), { status: 503 }));
  } catch (e) { return fail(e, 503); }
}
