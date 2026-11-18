import { countryById } from "./countries";
import type { WebsiteKind } from "./types";

/** Telefone de fora do Brasil: E.164 sem "+" pelo DDI do país; celular só quando o país tem regra clara. */
export function normalizeIntlPhone(raw: string | null | undefined, country: string): { e164?: string; kind?: "celular" | "fixo"; pretty?: string } {
  const c = countryById(country);
  if (!raw || !c) return normalizePhone(raw);
  let d = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+") || d.startsWith("00")) d = d.replace(/^00/, "");
  else if (d.startsWith(c.ddi) && d.length > c.nsnLen[1]) {
    /* já veio com DDI */
  } else d = c.ddi + d.replace(/^0+/, "");
  if (!d.startsWith(c.ddi)) return { pretty: raw };
  const nsn = d.slice(c.ddi.length);
  if (nsn.length < c.nsnLen[0] - 1 || nsn.length > c.nsnLen[1] + 1) return { pretty: raw };
  // EUA/Canadá: o Google não diz se é celular; WhatsApp funciona em boa parte, então conta como celular
  const kind = c.mobile ? (c.mobile.test(nsn) ? "celular" : "fixo") : "celular";
  return { e164: d, kind, pretty: `+${c.ddi} ${nsn}` };
}

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
