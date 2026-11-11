import type { WebsiteKind } from "./types";

/** Normaliza telefone brasileiro para E.164 sem "+" (ex.: 5511987654321) e diz se é celular. */
export function normalizePhone(raw?: string | null): { e164?: string; kind?: "celular" | "fixo"; pretty?: string } {
  if (!raw) return {};
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0") && (d.length === 11 || d.length === 12)) d = d.slice(1); // 0 + DDD
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (!d.startsWith("55") || (d.length !== 12 && d.length !== 13)) return { pretty: raw };
  const ddd = d.slice(2, 4);
  const local = d.slice(4);
  const kind = local.length === 9 && local[0] === "9" ? "celular" : "fixo";
  const pretty =
    local.length === 9
      ? `(${ddd}) ${local.slice(0, 5)}-${local.slice(5)}`
      : `(${ddd}) ${local.slice(0, 4)}-${local.slice(4)}`;
  return { e164: d, kind, pretty };
}

export function waLink(e164: string, text?: string) {
  const base = `https://wa.me/${e164}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

const DELIVERY = /(ifood\.com|anota\.ai|anotaai|goomer|aiqfome|rappi|deliverydireto|menudino|cardapioweb|cardapio\.|olaclick|pedir\.delivery|neemo|saipos|consumer\.app)/i;
const AGGREG = /(linktr\.ee|linktree|bio\.link|beacons\.ai|lnk\.bio|linkme|campsite\.bio|taplink|msha\.ke|direct\.me|solo\.to|allmylinks|linkin\.bio|hoo\.be)/i;
const BUILDER = /(wixsite\.com|site123\.me|negocio\.site|business\.site|webnode|ueniweb|godaddysites|weebly|blogspot|wordpress\.com|carrd\.co|sites\.google\.com|hotmart\.host|my\.canva\.site|canva\.site)/i;

export function classifyWebsite(url?: string | null): { kind: WebsiteKind; instagram?: string } {
  if (!url) return { kind: "nenhum" };
  const u = url.toLowerCase();
  const ig = u.match(/instagram\.com\/([a-z0-9._]{2,30})/i);
  if (ig && !["p", "reel", "explore", "stories", "accounts"].includes(ig[1])) return { kind: "instagram", instagram: ig[1] };
  if (/instagram\.com/.test(u)) return { kind: "instagram" };
  if (/(facebook\.com|fb\.com|fb\.me)/.test(u)) return { kind: "facebook" };
  if (/(wa\.me|api\.whatsapp\.com|whatsapp\.com|wa\.link)/.test(u)) return { kind: "whatsapp" };
  if (DELIVERY.test(u)) return { kind: "delivery" };
  if (AGGREG.test(u)) return { kind: "agregador" };
  if (BUILDER.test(u)) return { kind: "construtor" };
  return { kind: "proprio" };
}

export const WEBSITE_LABEL: Record<WebsiteKind, string> = {
  nenhum: "Sem site",
  proprio: "Site próprio",
  instagram: "Só Instagram",
  facebook: "Só Facebook",
  agregador: "Link na bio",
  whatsapp: "Só WhatsApp",
  delivery: "Só app de delivery",
  construtor: "Site gratuito",
};
