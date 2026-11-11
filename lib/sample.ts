import { rescore } from "./score";
import type { Lead, SiteAudit } from "./types";

/** Leads fictícios para ver o painel funcionando antes das chaves. Ficam marcados como exemplo. */
const day = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

const okSite = (url: string, extra: Partial<SiteAudit> = {}): SiteAudit => ({
  at: day(1),
  url,
  finalUrl: url,
  ok: true,
  status: 200,
  ms: 1800,
  https: true,
  mobile: true,
  metaPixel: false,
  googleTag: false,
  googleAds: false,
  whatsappButton: true,
  ...extra,
});

type Seed = Partial<Lead> & Pick<Lead, "name" | "websiteKind">;

const seeds: Seed[] = [
  { name: "Brasa Smash Burger", category: "Hamburgueria", niche: "hamburgueria", district: "Itaim Paulista", rating: 4.7, reviews: 312, phone: "(11) 99999-0101", phoneKind: "celular", websiteKind: "delivery", website: "https://www.ifood.com.br/delivery/sao-paulo-sp/brasa-smash-exemplo", instagram: { handle: "brasasmash.exemplo", url: "#", followers: 2140, posts: 96, source: "busca", quality: "ok" }, instagramChecked: true, status: "demo", demoUrl: "https://exemplo.vercel.app/brasa" },
  { name: "Pet Mimo Banho e Tosa", category: "Pet shop", niche: "petshop", district: "Vila Curuçá", rating: 4.8, reviews: 87, phone: "(11) 99999-0102", phoneKind: "celular", websiteKind: "nenhum", instagramChecked: true, status: "novo" },
  { name: "Studio Lívia Sobrancelhas", category: "Clínica de estética", niche: "estetica", district: "Guaianases", rating: 5, reviews: 41, phone: "(11) 99999-0103", phoneKind: "celular", websiteKind: "instagram", website: "https://instagram.com/studiolivia.exemplo", instagram: { handle: "studiolivia.exemplo", url: "#", followers: 860, posts: 210, source: "google", quality: "fraco" }, instagramChecked: true, status: "abordado", contactedAt: day(2) },
  { name: "Oficina do Jair Auto Center", category: "Oficina mecânica", niche: "oficina", district: "Itaim Paulista", rating: 4.5, reviews: 156, phone: "(11) 2999-0104", phoneKind: "fixo", websiteKind: "proprio", website: "http://oficinadojair-exemplo.com.br", audit: okSite("http://oficinadojair-exemplo.com.br", { https: false, mobile: false, ms: 5200, copyrightYear: 2019, platform: "WordPress", whatsappButton: false }), instagramChecked: true, status: "novo" },
  { name: "Doce Encanto Confeitaria", category: "Confeitaria", niche: "doceria", district: "São Miguel Paulista", rating: 4.9, reviews: 64, phone: "(11) 99999-0105", phoneKind: "celular", websiteKind: "agregador", website: "https://linktr.ee/doceencanto.exemplo", instagram: { handle: "doceencanto.exemplo", url: "#", followers: 3900, posts: 410, source: "site", quality: "ok" }, instagramChecked: true, status: "respondeu", contactedAt: day(4) },
  { name: "Barbearia Navalha de Ouro", category: "Barbearia", niche: "barbearia", district: "Lajeado", rating: 4.6, reviews: 203, phone: "(11) 99999-0106", phoneKind: "celular", websiteKind: "nenhum", instagram: { handle: "navalhadeouro.exemplo", url: "#", followers: 640, posts: 58, source: "busca", quality: "fraco" }, instagramChecked: true, status: "qualificado" },
  { name: "Empório Vila Curuçá", category: "Empório", niche: "mercado", district: "Vila Curuçá", rating: 4.3, reviews: 29, phone: "(11) 99999-0107", phoneKind: "celular", websiteKind: "facebook", website: "https://facebook.com/emporio.exemplo", instagramChecked: true, status: "novo" },
  { name: "Ótica Visão Leste", category: "Ótica", niche: "otica", district: "Itaim Paulista", rating: 4.4, reviews: 18, phone: "(11) 2999-0108", phoneKind: "fixo", websiteKind: "construtor", website: "https://oticavisaoleste-exemplo.negocio.site", instagramChecked: false, status: "novo" },
  { name: "Açaí da Praça", category: "Loja de açaí", niche: "acai", district: "Jardim Helena", rating: 4.6, reviews: 122, phone: "(11) 99999-0109", phoneKind: "celular", websiteKind: "delivery", website: "https://anota.ai/acaidapraca-exemplo", instagram: { handle: "acaidapraca.exemplo", url: "#", followers: 1250, posts: 77, source: "busca", quality: "ok" }, instagramChecked: true, status: "novo" },
  { name: "Clínica Sorriso Pleno", category: "Dentista", niche: "dentista", district: "Guaianases", rating: 4.9, reviews: 98, phone: "(11) 99999-0110", phoneKind: "celular", websiteKind: "proprio", website: "https://sorrisopleno-exemplo.com.br", audit: okSite("https://sorrisopleno-exemplo.com.br", { metaPixel: true, googleTag: true, ms: 1400, platform: "Wix" }), instagram: { handle: "sorrisopleno.exemplo", url: "#", followers: 6800, posts: 520, source: "site", quality: "bom" }, instagramChecked: true, status: "novo" },
  { name: "Moda Bella Boutique", category: "Loja de roupas", niche: "roupas", district: "São Miguel Paulista", rating: 4.2, reviews: 37, phone: "(11) 99999-0111", phoneKind: "celular", websiteKind: "instagram", website: "https://instagram.com/modabella.exemplo", instagram: { handle: "modabella.exemplo", url: "#", followers: 4100, posts: 980, source: "google", quality: "ok" }, instagramChecked: true, status: "negociando", contactedAt: day(6) },
  { name: "CT Leão Jiu-Jítsu", category: "Academia de artes marciais", niche: "academia", district: "Itaim Paulista", rating: 5, reviews: 46, phone: "(11) 99999-0112", phoneKind: "celular", websiteKind: "nenhum", instagramChecked: false, status: "novo" },
  { name: "Pizzaria Forno a Lenha Leste", category: "Pizzaria", niche: "pizzaria", district: "Jardim Helena", rating: 4.1, reviews: 412, phone: "(11) 2999-0113", phoneKind: "fixo", websiteKind: "delivery", website: "https://www.ifood.com.br/delivery/sao-paulo-sp/forno-lenha-exemplo", instagramChecked: true, status: "perdido" },
  { name: "Dra. Paula Harmonização", category: "Clínica de estética", niche: "estetica", district: "Penha", rating: 4.9, reviews: 23, phone: "(11) 99999-0114", phoneKind: "celular", websiteKind: "agregador", website: "https://linktr.ee/drapaula.exemplo", instagram: { handle: "drapaula.exemplo", url: "#", followers: 2900, posts: 330, source: "site", quality: "ok" }, instagramChecked: true, status: "fechado", contactedAt: day(9) },
];

export function sampleLeads(): Lead[] {
  return seeds.map((s, i) => {
    const id = `exemplo:${i + 1}`;
    const base = {
      ...s,
      id,
      source: "exemplo" as const,
      address: `Rua de Exemplo, ${100 + i * 7} - ${s.district}, São Paulo - SP`,
      city: "São Paulo",
      hours: s.reviews && s.reviews > 30 ? ["segunda a sábado: 10:00–20:00"] : undefined,
      phoneE164: undefined,
      status: s.status ?? "novo",
      createdAt: day(10 - (i % 10)),
      updatedAt: day(i % 5),
      history: [{ at: day(10), type: "criado" as const, text: "Lead de exemplo" }],
      query: "exemplo",
    };
    return rescore(base as Lead) as Lead;
  });
}
