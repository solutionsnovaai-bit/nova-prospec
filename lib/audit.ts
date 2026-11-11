import "server-only";
import type { SiteAudit } from "./types";

const UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const MAX_BYTES = 1_500_000;

const PLATFORMS: [string, RegExp][] = [
  ["Shopify", /cdn\.shopify\.com|Shopify\.theme/i],
  ["Nuvemshop", /nuvemshop|tiendanube|d26lpennugtm8s\.cloudfront\.net/i],
  ["Loja Integrada", /lojaintegrada/i],
  ["Tray", /tray\.com\.br|traycorp/i],
  ["VTEX", /vtex(assets|commerce|img)/i],
  ["Wix", /wix\.com|wixstatic|_wixCssImports/i],
  ["WordPress", /wp-content|wp-includes|wordpress/i],
  ["Webflow", /webflow\.(com|io)|data-wf-page/i],
  ["Framer", /framerusercontent|framer\.com\/m\//i],
  ["Squarespace", /squarespace/i],
  ["Site123", /site123/i],
  ["Google Sites", /sites\.google\.com/i],
  ["Next.js", /__NEXT_DATA__|\/_next\/static/i],
];

function pick(html: string, re: RegExp) {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, " ").trim().slice(0, 160) : undefined;
}

export async function auditSite(url: string): Promise<SiteAudit> {
  const at = new Date().toISOString();
  let target = url.trim();
  if (!/^https?:\/\//i.test(target)) target = "http://" + target;
  try {
    const host = new URL(target).hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1|0\.0\.0\.0)/i.test(host))
      return { at, url, ok: false, error: "endereço interno ignorado" };
  } catch {
    return { at, url, ok: false, error: "endereço inválido" };
  }
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(target, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9", Accept: "text/html,*/*" },
      cache: "no-store",
    });
    // lê no máximo MAX_BYTES
    let html = "";
    if (res.body) {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        html += dec.decode(value, { stream: true });
        if (total > MAX_BYTES) {
          ctrl.abort();
          break;
        }
      }
    }
    const ms = Date.now() - started;
    const finalUrl = res.url || target;
    const low = html.toLowerCase();
    const year = new Date().getFullYear();
    const years = [...html.matchAll(/(?:©|&copy;|copyright)[^0-9]{0,40}((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}))?/gi)]
      .map((m) => Number(m[2] || m[1]))
      .filter((y) => y > 1995 && y <= year);
    const ig = html.match(/instagram\.com\/([A-Za-z0-9._]{2,30})/);
    const fb = html.match(/facebook\.com\/([A-Za-z0-9.\-_]{2,60})/);
    const tt = html.match(/tiktok\.com\/@([A-Za-z0-9._]{2,30})/);
    const wa = html.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=|whatsapp\.com\/send\?phone=)(\d{10,13})/);
    const badIg = ["p", "reel", "explore", "accounts", "stories", "sharer"];
    return {
      at,
      url,
      finalUrl,
      ok: res.ok,
      status: res.status,
      ms,
      https: finalUrl.startsWith("https://"),
      mobile: /<meta[^>]+name=["']?viewport/i.test(html),
      title: pick(html, /<title[^>]*>([^<]{1,200})<\/title>/i),
      description: pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})/i),
      metaPixel: /connect\.facebook\.net\/[^"']+\/fbevents\.js|fbq\(\s*['"]init/i.test(html),
      googleTag: /googletagmanager\.com\/(gtag|gtm)\.js|google-analytics\.com|gtag\(\s*['"]config/i.test(html),
      googleAds: /AW-\d{6,}/.test(html),
      tiktokPixel: /analytics\.tiktok\.com|ttq\.load/i.test(html),
      whatsappButton: /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/send/i.test(low),
      platform: PLATFORMS.find(([, re]) => re.test(html))?.[0],
      ecommerce: /add[-_ ]?to[-_ ]?cart|adicionar ao carrinho|comprar agora|\/carrinho|\/cart\b|woocommerce|cdn\.shopify|nuvemshop|lojaintegrada|vtex/i.test(html),
      copyrightYear: years.length ? Math.max(...years) : undefined,
      socials: {
        instagram: ig && !badIg.includes(ig[1].toLowerCase()) ? ig[1] : undefined,
        facebook: fb && !["sharer", "tr", "plugins", "dialog"].includes(fb[1].toLowerCase()) ? fb[1] : undefined,
        tiktok: tt?.[1],
        whatsapp: wa?.[1],
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? (e.name === "AbortError" ? "não respondeu em 9 s" : e.message) : "erro";
    return { at, url, ok: false, ms: Date.now() - started, error: friendlyNetError(msg) };
  } finally {
    clearTimeout(timer);
  }
}

function friendlyNetError(msg: string) {
  if (/ENOTFOUND|getaddrinfo/i.test(msg)) return "domínio não existe mais";
  if (/certificate|SSL|TLS/i.test(msg)) return "certificado inválido";
  if (/ECONNREFUSED|ECONNRESET|fetch failed/i.test(msg)) return "servidor não responde";
  return msg.slice(0, 80);
}

/** Lê seguidores/publicações do trecho que o Google mostra de um perfil do Instagram. */
export function parseInstagramSnippet(text: string): { followers?: number; posts?: number } {
  const num = (raw: string, unit?: string) => {
    const s = raw.replace(/\s/g, "");
    let n: number;
    if (unit) n = parseFloat(s.replace(/\./g, "").replace(",", ".")) || parseFloat(s.replace(",", "."));
    else n = parseInt(s.replace(/[.,]/g, ""), 10);
    if (/^(mil|k)$/i.test(unit ?? "")) n *= 1000;
    if (/^(mi|m|milhões|milhão)$/i.test(unit ?? "")) n *= 1_000_000;
    return Math.round(n);
  };
  const f = text.match(/([\d.,]+)\s*(mil|k|mi|m|milhões|milhão)?\s*(?:seguidores|followers)/i);
  const p = text.match(/([\d.,]+)\s*(mil|k)?\s*(?:publicaç(?:ões|ão)|posts?)/i);
  return {
    followers: f ? num(f[1], f[2]) : undefined,
    posts: p ? num(p[1], p[2]) : undefined,
  };
}
