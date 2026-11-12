import "server-only";
import { auditSite, parseInstagramSnippet } from "./audit";
import { db } from "./db";
import { classifyWebsite } from "./phone";
import { rescore } from "./score";
import { findSite } from "./sitecheck";
import { hostOf } from "./sitematch";
import { webSearch } from "./sources";
import type { FoundPlace, HistoryItem, Lead, LeadStatus } from "./types";

const now = () => new Date().toISOString();

export async function listLeads(): Promise<Lead[]> {
  const all = (await db.all<Lead>("leads")).map((l) => (l.district && /^\d/.test(l.district) ? { ...l, district: undefined } : l));
  return all.sort((a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt));
}

export async function getLead(id: string) {
  return db.get<Lead>("leads", id);
}

export async function saveLead(l: Lead) {
  const next = rescore({ ...l, updatedAt: now() }) as Lead;
  await db.put("leads", l.id, next);
  return next;
}

export function addHistory(l: Lead, type: HistoryItem["type"], text: string): Lead {
  return { ...l, history: [{ at: now(), type, text }, ...(l.history ?? [])].slice(0, 80) };
}

/** Salva resultados da busca como leads (mantém o que já existir: status, notas, IA). */
export async function saveFound(found: FoundPlace[]) {
  const existing = new Map((await db.all<Lead>("leads")).map((l) => [l.id, l]));
  const items: { id: string; data: Lead }[] = [];
  for (const f of found) {
    const { saved: _saved, ...rest } = f;
    const old = existing.get(f.id);
    const lead: Lead = old
      ? rescore({
          ...old,
          ...rest,
          // site achado na conferência vale mais que o link do Google Maps
          ...(old.siteCheck?.found && !["proprio", "construtor"].includes(rest.websiteKind)
            ? { website: old.website, websiteKind: old.websiteKind, mapsWebsite: old.mapsWebsite ?? rest.website, siteCheck: old.siteCheck }
            : {}),
          // dados do usuário ficam
          status: old.status,
          notes: old.notes,
          ai: old.ai,
          demoUrl: old.demoUrl,
          instagram: old.instagram ?? rest.instagram,
          instagramChecked: old.instagramChecked || rest.instagramChecked,
          audit: rest.audit ?? old.audit,
          history: old.history,
          createdAt: old.createdAt,
          updatedAt: now(),
        }) as Lead
      : (rescore({
          ...rest,
          status: "novo",
          createdAt: now(),
          updatedAt: now(),
          history: [{ at: now(), type: "criado", text: `Encontrado em "${rest.query ?? "busca"}"` }],
        }) as Lead);
    items.push({ id: lead.id, data: lead });
  }
  await db.putMany("leads", items);
  return items.map((i) => i.data);
}

export async function setStatus(l: Lead, status: LeadStatus) {
  if (l.status === status) return l;
  let next = addHistory({ ...l, status }, "status", `Status: ${status}`);
  if (status === "abordado" && !l.contactedAt) next = { ...next, contactedAt: now() };
  return saveLead(next);
}

/** Audita o site (se for próprio ou construtor) e aproveita o Instagram que aparecer nele. */
export async function auditLead<T extends FoundPlace | Lead>(l: T): Promise<T> {
  if (!l.website || !["proprio", "construtor"].includes(l.websiteKind)) return l;
  const audit = await auditSite(l.website);
  let instagram = l.instagram;
  if (!instagram && audit.socials?.instagram) {
    const h = audit.socials.instagram;
    instagram = { handle: h, url: `https://instagram.com/${h}`, source: "site" };
  }
  return rescore({ ...l, audit, instagram, instagramChecked: l.instagramChecked || !!instagram }) as T;
}

/**
 * Confere se existe site próprio antes de afirmar "sem site" (o Google Maps muitas vezes só mostra o Instagram).
 * Sem `google` é grátis; com `google` faz 1 busca. Quando acha, troca o link, audita o site e refaz a pontuação.
 */
export async function checkSite<T extends FoundPlace | Lead>(l: T, opts: { google?: boolean; force?: boolean } = {}): Promise<T> {
  if (["proprio", "construtor"].includes(l.websiteKind)) return l;
  if (!opts.force && l.siteCheck && (l.siteCheck.google || !opts.google)) return l;
  const r = await findSite(l, opts);
  const patch: Partial<Lead> = { siteCheck: { at: now(), found: r.found, how: r.how, google: r.google || !!l.siteCheck?.google } };
  const f = r.instagram?.followers;
  if (l.instagram && f !== undefined && l.instagram.followers === undefined)
    patch.instagram = { ...l.instagram, followers: f, posts: r.instagram?.posts ?? l.instagram.posts, quality: f < 1000 ? "fraco" : f < 5000 ? "ok" : "bom", checkedAt: now() };
  if (r.found) {
    patch.mapsWebsite = l.website;
    patch.website = r.found;
    patch.websiteKind = classifyWebsite(r.found).kind;
    patch.audit = await auditSite(r.found);
    if ("history" in l) {
      const old = l as Lead;
      let h = addHistory(old, "auditoria", `Site encontrado na conferência: ${hostOf(r.found)}${l.website ? " (o Google mostrava outro link)" : ""}`);
      if (old.ai) {
        h = addHistory(h, "ia", "Análise anterior descartada: tinha sido feita sem saber do site");
        patch.ai = undefined;
      }
      patch.history = h.history;
    }
  }
  return rescore({ ...l, ...patch }) as T;
}

/** Conferência completa (endereço + Google) de um lead salvo; nunca derruba quem chamou. */
export async function ensureSite(l: Lead): Promise<Lead> {
  try {
    const c = await checkSite(l, { google: true });
    return c === l ? l : await saveLead(c);
  } catch {
    return l;
  }
}

/** Procura o Instagram no Google e lê seguidores pelo trecho do resultado. */
export async function findInstagram(l: Lead): Promise<Lead> {
  const where = l.district || l.city || "";
  const handleKnown = l.instagram?.handle;
  const q = handleKnown ? `site:instagram.com ${handleKnown}` : `site:instagram.com "${l.name}" ${where}`.trim();
  const results = await webSearch(q);
  const hit = results.find((r) => {
    const c = classifyWebsite(r.link);
    if (c.kind !== "instagram" || !c.instagram) return false;
    if (handleKnown) return c.instagram.toLowerCase() === handleKnown.toLowerCase();
    return true;
  });
  let next: Lead;
  if (hit) {
    const handle = classifyWebsite(hit.link).instagram!;
    const stats = parseInstagramSnippet(`${hit.title} ${hit.snippet}`);
    const quality = stats.followers === undefined ? undefined : stats.followers < 1000 ? "fraco" : stats.followers < 5000 ? "ok" : "bom";
    next = {
      ...l,
      instagram: {
        handle,
        url: `https://instagram.com/${handle}`,
        followers: stats.followers ?? l.instagram?.followers,
        posts: stats.posts ?? l.instagram?.posts,
        source: l.instagram?.source ?? "busca",
        quality: quality ?? l.instagram?.quality,
        checkedAt: now(),
      },
      instagramChecked: true,
    };
    next = addHistory(next, "instagram", `Instagram @${handle}${stats.followers !== undefined ? ` · ${stats.followers} seguidores` : ""}`);
  } else {
    next = addHistory({ ...l, instagramChecked: true }, "instagram", "Instagram não encontrado no Google");
  }
  return saveLead(next);
}
