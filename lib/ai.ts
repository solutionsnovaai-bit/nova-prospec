import "server-only";
import { getKey, getSettings, type Settings } from "./settings";
import type { AiConfig, KeyName } from "./types";

export const PROVIDERS: Record<AiConfig["provider"], { label: string; baseUrl: string; key: KeyName; suggested: string[]; web?: string; signup: string }> = {
  gemini: { label: "Gemini (Free Tier)", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", key: "gemini", suggested: ["gemini-3.5-flash-lite"], signup: "https://aistudio.google.com/apikey" },
  groq: {
    label: "Groq (grátis)",
    baseUrl: "https://api.groq.com/openai/v1",
    key: "groq",
    suggested: ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"],
    web: "groq/compound-mini",
    signup: "https://console.groq.com/keys",
  },
  openrouter: {
    label: "OpenRouter (modelos :free)",
    baseUrl: "https://openrouter.ai/api/v1",
    key: "openrouter",
    suggested: ["openrouter/free"],
    signup: "https://openrouter.ai/settings/keys",
  },
  moonshot: {
    label: "Kimi oficial (Moonshot)",
    baseUrl: "https://api.moonshot.ai/v1",
    key: "moonshot",
    suggested: ["kimi-k2.6", "kimi-k2-turbo-preview"],
    signup: "https://platform.moonshot.ai/console/api-keys",
  },
  custom: {
    label: "Outro (compatível com OpenAI)",
    baseUrl: "",
    key: "custom",
    suggested: [],
    signup: "",
  },
};

export class AiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ToolDef {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

async function resolve(s?: Settings) {
  const st = s ?? (await getSettings());
  const p = PROVIDERS[st.ai.provider] ?? PROVIDERS.groq;
  const baseUrl = (st.ai.baseUrl || p.baseUrl).replace(/\/+$/, "");
  const key = await getKey(p.key, st);
  if (!key) throw new AiError(`Coloque a chave da IA (${p.label}) em Ajustes.`, 400);
  if (!baseUrl) throw new AiError("Informe o endereço (base URL) da IA em Ajustes.", 400);
  return { st, p, baseUrl, key };
}

function stripThink(s: string) {
  return s.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

type ChatOptions = {
  messages: ChatMessage[];
  tools?: ToolDef[];
  json?: boolean;
  model?: string;
  web?: boolean; // usar o modelo com busca na web
  temperature?: number;
  maxTokens?: number;
  deadline?: number;
  task?: "analysis" | "chat";
};

async function chatOnce(opts: ChatOptions, settings: Settings) {
  const { st, p, baseUrl, key } = await resolve(settings);
  const model = opts.web ? st.ai.webModel || p.web || st.ai.model : opts.model || st.ai.model;
  let used = model;
  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 2400,
  };
  if (opts.tools?.length) {
    body.tools = opts.tools;
    body.tool_choice = "auto";
  }
  if (opts.json) body.response_format = { type: "json_object" };
  if (/qwen3/i.test(model) && baseUrl.includes("groq.com")) body.reasoning_format = "hidden";
  if (/gpt-oss/i.test(model)) body.reasoning_effort = "low"; // raciocínio curto: sobra espaço para a resposta

  const call = async (b: Record<string, unknown>) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), Math.max(1, Math.min(12000, (opts.deadline ?? Date.now() + 12000) - Date.now())));
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://nova-prospec.app", "X-Title": "Nova Prospec" },
        body: JSON.stringify(b),
        signal: ctrl.signal,
        redirect: "error",
      });
      const text = await res.text();
      let j: Record<string, unknown> | null = null;
      try {
        j = JSON.parse(text);
      } catch {
        /* */
      }
      return { res, j, text };
    } finally {
      clearTimeout(t);
    }
  };

  let { res, j, text } = await call(body);
  // alguns modelos não aceitam json_object ou reasoning_format: tenta de novo sem
  if (!res.ok && res.status === 400 && (body.response_format || body.reasoning_format || body.reasoning_effort)) {
    const b2 = { ...body };
    delete b2.response_format;
    delete b2.reasoning_format;
    delete b2.reasoning_effort;
    ({ res, j, text } = await call(b2));
  }
  if (!res.ok) {
    const err = "Resposta inválida do provedor";
    if (res.status === 401) throw new AiError("Chave da IA inválida. Confira em Ajustes.", 401);
    if (res.status === 429) throw new AiError("A IA grátis bateu o limite por minuto. Espera uns segundos e tenta de novo.", 429);
    if (res.status === 404 || /model/i.test(err)) throw new AiError(`Modelo "${model}" indisponível.`, 404);
    throw new AiError(`IA respondeu ${res.status}: ${err}`, res.status);
  }
  const choice = (j?.choices as { message?: { content?: string | null; tool_calls?: ToolCall[] } }[] | undefined)?.[0];
  const msg = choice?.message ?? {};
  if (!msg.content && !msg.tool_calls?.length) throw new AiError("A IA retornou resposta vazia.", 502);
  if (opts.json && (!msg.content || !parseJsonLoose(msg.content))) throw new AiError("A IA não retornou JSON válido.", 502);
  return {
    provider: st.ai.provider,
    model: used,
    content: msg.content ? stripThink(msg.content) : "",
    toolCalls: msg.tool_calls ?? [],
  };
}

/** Mantém a escolha principal; reservas só usam provedores com chave configurada. */
export async function chat(opts: ChatOptions) {
  const settings = await getSettings();
  const deadline = Math.min(opts.deadline ?? Infinity, Date.now() + 45000);
  const selected = !opts.web && opts.task && settings.ai.taskProviders?.[opts.task];
  const preferred = selected && selected !== settings.ai.provider && selected !== "custom" && selected !== "moonshot" && await getKey(PROVIDERS[selected].key, settings)
    ? { ...settings.ai, provider: selected, baseUrl: PROVIDERS[selected].baseUrl, model: PROVIDERS[selected].suggested[0] }
    : settings.ai;
  const targets: AiConfig[] = [preferred];
  if (preferred !== settings.ai && settings.ai.fallbackEnabled !== false) targets.push(settings.ai);
  if (settings.ai.fallbackEnabled !== false && !opts.web) {
    for (const [provider, model] of [
      ["groq", "openai/gpt-oss-20b"],
      ["openrouter", "openrouter/free"],
      ["gemini", "gemini-3.5-flash-lite"],
    ] as const) {
      if (await getKey(provider, settings)) targets.push({ provider, model, baseUrl: PROVIDERS[provider].baseUrl });
    }
  }
  let last: unknown = new AiError("Nenhuma IA disponível. Confira as chaves em Ajustes.", 503);
  const seen = new Set<string>();
  for (const target of targets) {
    const model = target === preferred ? opts.model ?? target.model : target.model;
    const id = JSON.stringify([target.provider, target.baseUrl, model]);
    if (seen.has(id) || Date.now() >= deadline) continue;
    seen.add(id);
    try {
      return await chatOnce({ ...opts, model, deadline }, { ...settings, ai: target });
    } catch (e) {
      last = e;
      if (e instanceof AiError && ![400,401,402,403,404,408,422,429,500,502,503,504].includes(e.status)) throw e;
    }
  }
  if (last instanceof AiError) throw last;
  throw new AiError("As IAs disponíveis não responderam a tempo. Tente novamente.", 503);
}

export function parseJsonLoose<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

export async function listModels(): Promise<string[]> {
  const { baseUrl, key } = await resolve();
  const res = await fetch(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
  if (!res.ok) throw new AiError(`Não consegui listar modelos (${res.status}).`, res.status);
  const j = (await res.json()) as { data?: { id: string; active?: boolean }[] };
  return (j.data ?? [])
    .filter((m) => m.active !== false)
    .map((m) => m.id)
    .filter((id) => !/whisper|tts|guard|embed|vision-preview|playai|orpheus|prompt-guard/i.test(id))
    .sort();
}
