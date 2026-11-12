import "server-only";
import { getKey, getSettings, type Settings } from "./settings";
import type { AiConfig, KeyName } from "./types";

export const PROVIDERS: Record<AiConfig["provider"], { label: string; baseUrl: string; key: KeyName; suggested: string[]; web?: string; signup: string }> = {
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
    suggested: ["moonshotai/kimi-k2:free", "qwen/qwen3-235b-a22b:free"],
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

export async function chat(opts: {
  messages: ChatMessage[];
  tools?: ToolDef[];
  json?: boolean;
  model?: string;
  web?: boolean; // usar o modelo com busca na web
  temperature?: number;
  maxTokens?: number;
}) {
  const { st, p, baseUrl, key } = await resolve();
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
    const t = setTimeout(() => ctrl.abort(), 55000);
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://nova-prospec.app", "X-Title": "Nova Prospec" },
        body: JSON.stringify(b),
        signal: ctrl.signal,
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
  // limite por minuto ou instabilidade: cada modelo do Groq tem cota própria, então tenta uma vez com outro
  if (!res.ok && [429, 500, 502, 503].includes(res.status) && baseUrl.includes("groq.com") && !opts.web) {
    const alt = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b"].find((m) => m !== model);
    if (alt) {
      const b3: Record<string, unknown> = { ...body, model: alt };
      delete b3.reasoning_format;
      delete b3.reasoning_effort;
      if (/qwen3/i.test(alt)) b3.reasoning_format = "hidden";
      if (/gpt-oss/i.test(alt)) b3.reasoning_effort = "low";
      const r3 = await call(b3).catch(() => null);
      if (r3?.res.ok) {
        ({ res, j, text } = r3);
        used = alt;
      }
    }
  }
  if (!res.ok) {
    const err = (j?.error as { message?: string } | undefined)?.message || text.slice(0, 200);
    if (res.status === 401) throw new AiError("Chave da IA inválida. Confira em Ajustes.", 401);
    if (res.status === 429) throw new AiError("A IA grátis bateu o limite por minuto. Espera uns segundos e tenta de novo.", 429);
    if (res.status === 404 || /model/i.test(err)) throw new AiError(`Modelo "${model}" indisponível: ${err}`, 400);
    throw new AiError(`IA respondeu ${res.status}: ${err}`, res.status);
  }
  const choice = (j?.choices as { message?: { content?: string | null; tool_calls?: ToolCall[] } }[] | undefined)?.[0];
  const msg = choice?.message ?? {};
  return {
    model: used,
    content: msg.content ? stripThink(msg.content) : "",
    toolCalls: msg.tool_calls ?? [],
  };
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
