import { guard } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { getKey } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Transcreve a fala (Whisper do Groq) quando o navegador não tem reconhecimento de voz. */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const key = await getKey("groq");
    if (!key) return fail(Object.assign(new Error("A transcrição usa a chave do Groq. Coloque em Ajustes."), { status: 400 }));
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob) || file.size < 800) return ok({ text: "" });
    if (file.size > 8_000_000) return fail(Object.assign(new Error("Áudio longo demais."), { status: 413 }));
    const fd = new FormData();
    fd.append("file", file, (file as File).name || "fala.webm");
    fd.append("model", "whisper-large-v3-turbo");
    fd.append("language", "pt");
    fd.append("response_format", "json");
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: fd });
    const j = (await res.json().catch(() => ({}))) as { text?: string; error?: { message?: string } };
    if (!res.ok) return fail(Object.assign(new Error(j.error?.message ?? `Transcrição falhou (${res.status})`), { status: 400 }));
    return ok({ text: j.text ?? "" });
  } catch (e) {
    return fail(e, 400);
  }
}
