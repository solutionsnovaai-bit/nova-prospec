"use client";
import useSWR, { mutate } from "swr";
import type { Lead, ProviderUsage, PublicSettings } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...(init?.headers ?? {}) },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
  });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== "undefined" && !url.startsWith("/api/auth")) {
    window.location.href = "/entrar";
  }
  if (!res.ok) throw new ApiError((j as { error?: string }).error ?? `Erro ${res.status}`, res.status);
  return j as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetcher = (url: string): Promise<any> => api(url);

export function useLeads() {
  const r = useSWR<{ leads: Lead[] }>("/api/leads", fetcher, { revalidateOnFocus: true });
  return { leads: r.data?.leads, error: r.error as Error | undefined, isLoading: r.isLoading, reload: r.mutate };
}

export function useLead(id: string) {
  const r = useSWR<{ lead: Lead }>(`/api/leads/${encodeURIComponent(id)}`, fetcher);
  return { lead: r.data?.lead, error: r.error as Error | undefined, isLoading: r.isLoading, reload: r.mutate };
}

export interface ProviderInfo {
  label: string;
  baseUrl: string;
  suggested: string[];
  signup: string;
  web?: string;
}

export function useSettings() {
  const r = useSWR<{ settings: PublicSettings; providers: Record<string, ProviderInfo> }>("/api/settings", fetcher);
  return { settings: r.data?.settings, providers: r.data?.providers, error: r.error as Error | undefined, reload: r.mutate };
}

export function useUsage() {
  const r = useSWR<{ providers: ProviderUsage[] }>("/api/usage", fetcher, { revalidateOnFocus: false });
  return { usage: r.data?.providers, reload: r.mutate };
}

/** Atualiza um lead no cache da lista sem recarregar tudo. */
export function patchLeadCache(lead: Lead) {
  mutate(
    "/api/leads",
    (cur: { leads: Lead[] } | undefined) => {
      if (!cur) return cur;
      const has = cur.leads.some((l) => l.id === lead.id);
      return { leads: has ? cur.leads.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...cur.leads] };
    },
    { revalidate: false },
  );
  mutate(`/api/leads/${encodeURIComponent(lead.id)}`, { lead }, { revalidate: false });
}

export function fillMessage(tpl: string, l: Lead, signature?: string) {
  const projeto = l.ai?.projeto.tipo ? l.ai.projeto.tipo.toLowerCase() : "um site";
  return tpl
    .replaceAll("{empresa}", l.name)
    .replaceAll("{nome}", l.name)
    .replaceAll("{bairro}", l.district ?? "")
    .replaceAll("{projeto}", projeto)
    .replaceAll("{demo}", l.demoUrl ?? "[link da prévia]")
    .replaceAll("{assinatura}", signature ?? "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function relTime(iso?: string) {
  if (!iso) return "—";
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "agora";
  if (d < 3600) return `há ${Math.floor(d / 60)} min`;
  if (d < 86400) return `há ${Math.floor(d / 3600)} h`;
  const days = Math.floor(d / 86400);
  return days === 1 ? "ontem" : `há ${days} dias`;
}

export const fmt = new Intl.NumberFormat("pt-BR");
