/** Catálogo de nichos: rótulo, grupo (decide o projeto ideal) e tags do OpenStreetMap. */

export type NicheGroup = "juridico" | "consorcio" | "financeiro" | "consultoria" | "imobiliario" | "energia" | "comida" | "varejo" | "servico" | "saude" | "auto";

export interface Niche {
  id: string;
  label: string;
  group: NicheGroup;
  words: string[]; // palavras que identificam o nicho na categoria do Google
  osm: string[]; // filtros Overpass, ex.: 'shop=pet'
  q?: string; // termo exato pesquisado no Google Maps (quando difere do rótulo)
}

/**
 * Alvo principal da prospecção: negócios em que um cliente fechado vale milhares de reais
 * e que pagam mensalidade por agendamento no WhatsApp (modelo Diferencial / Construtax).
 * Ficam no topo da lista para o reconhecimento automático pegar o nicho certo primeiro.
 */
export const TARGET_GROUPS: NicheGroup[] = ["juridico", "consorcio", "financeiro", "consultoria", "imobiliario", "energia"];

export const NICHES: Niche[] = [
  { id: "advocacia-trabalhista", label: "Advocacia trabalhista", group: "juridico", words: ["trabalhist", "employment law", "labor law", "laboral"], osm: ["office=lawyer"], q: "advogado trabalhista" },
  { id: "advocacia-previdenciaria", label: "Advocacia previdenciária", group: "juridico", words: ["previdenci", "aposentadoria", "inss", "seguridad social", "social security"], osm: ["office=lawyer"], q: "advogado previdenciário" },
  { id: "advocacia-bancaria", label: "Advocacia bancária e consumidor", group: "juridico", words: ["bancári", "bancari", "consumidor", "revisional", "superendivid"], osm: ["office=lawyer"], q: "advogado bancário" },
  { id: "advocacia-familia", label: "Advocacia de família", group: "juridico", words: ["família", "familia", "divórcio", "divorcio", "pensão aliment", "inventário"], osm: ["office=lawyer"], q: "advogado de família" },
  { id: "advocacia", label: "Advocacia (geral)", group: "juridico", words: ["advoca", "advogad", "jurídic", "juridic", "lawyer", "attorney", "law firm", "law office", "solicitor", "abogad", "bufete", "avocat", "rechtsanw", "anwalt", "kanzlei", "avvocat", "studio legale", "弁護士", "法律事務所", "변호사", "법률"], osm: ["office=lawyer"], q: "escritório de advocacia" },
  { id: "consorcio-porto", label: "Consórcio Porto", group: "consorcio", words: ["porto seguro cons", "porto consórcio", "portobank", "porto bank"], osm: ['office][name~"Porto",i'], q: "Porto Seguro consórcio corretora" },
  { id: "consorcio-embracon", label: "Consórcio Embracon", group: "consorcio", words: ["embracon"], osm: ['office][name~"Embracon",i'], q: "Embracon consórcio" },
  { id: "consorcio-ademicon", label: "Consórcio Ademicon", group: "consorcio", words: ["ademicon"], osm: ['office][name~"Ademicon",i'], q: "Ademicon consórcio" },
  { id: "consorcio-rodobens", label: "Consórcio Rodobens", group: "consorcio", words: ["rodobens"], osm: ['office][name~"Rodobens",i'], q: "Rodobens consórcio" },
  { id: "consorcio", label: "Consórcio (outras administradoras)", group: "consorcio", words: ["consórcio", "consorcio", "carta contemplada", "cartas contempladas"], osm: ['office][name~"cons[oó]rcio",i'], q: "consórcio" },
  { id: "precatorios", label: "Precatórios", group: "financeiro", words: ["precatóri", "precatori"], osm: ["office=financial"], q: "precatórios compra" },
  { id: "credito", label: "Crédito e correspondente bancário", group: "financeiro", words: ["correspondente banc", "consignado", "empréstimo", "emprestimo", "crédito", "credito", "financeira", "mortgage", "hipotec", "crédit immobilier", "baufinanzierung", "mediatore credit", "住宅ローン", "대출"], osm: ["office=financial"], q: "correspondente bancário consignado" },
  { id: "seguros", label: "Corretora de seguros e planos de saúde", group: "financeiro", words: ["corretora de seguro", "corretor de seguro", "seguros", "plano de saúde", "planos de saúde", "insurance", "aseguradora", "assurance", "versicherung", "assicura", "保険", "보험"], osm: ["office=insurance"], q: "corretora de seguros" },
  { id: "tributario", label: "Consultoria tributária", group: "consultoria", words: ["tributári", "tributari", "recuperação tribut", "fiscal", "tax "], osm: ["office=tax_advisor"], q: "consultoria tributária" },
  { id: "contabilidade", label: "Contabilidade", group: "consultoria", words: ["contab", "contador", "accountant", "accounting", "cpa", "contable", "comptab", "steuerberat", "commercialist", "税理士", "세무"], osm: ["office=accountant"], q: "escritório de contabilidade" },
  { id: "imobiliaria", label: "Imobiliária e corretor", group: "imobiliario", words: ["imobili", "imóve", "corretor de imóveis", "real estate", "realtor", "inmobiliari", "immobili", "不動産", "부동산"], osm: ["office=estate_agent"], q: "imobiliária" },
  { id: "energia-solar", label: "Energia solar", group: "energia", words: ["energia solar", "fotovolt", "solar install", "solar energy", "solar panel", "placas solares", "paneles solares", "panneaux solaires", "photovoltaik", "fotovoltaic", "太陽光", "태양광"], osm: ['shop][name~"solar",i'], q: "energia solar" },
  { id: "hamburgueria", label: "Hamburgueria", group: "comida", words: ["hamburg", "burger", "lanche"], osm: ['amenity=fast_food][cuisine~"burger"', 'amenity=restaurant][cuisine~"burger"'] },
  { id: "pizzaria", label: "Pizzaria", group: "comida", words: ["pizza"], osm: ['amenity=restaurant][cuisine~"pizza"', 'amenity=fast_food][cuisine~"pizza"'] },
  { id: "lanchonete", label: "Lanchonete", group: "comida", words: ["lanchonete", "pastel", "salgad"], osm: ["amenity=fast_food"] },
  { id: "restaurante", label: "Restaurante", group: "comida", words: ["restaurante", "comida", "marmita", "self"], osm: ["amenity=restaurant"] },
  { id: "acai", label: "Açaí e sorvete", group: "comida", words: ["açaí", "acai", "sorvet", "gelato"], osm: ["amenity=ice_cream", 'shop=ice_cream'] },
  { id: "doceria", label: "Doceria e confeitaria", group: "comida", words: ["doce", "confeit", "bolo"], osm: ["shop=confectionery", "shop=pastry"] },
  { id: "padaria", label: "Padaria", group: "comida", words: ["padaria", "panific"], osm: ["shop=bakery"] },
  { id: "cafeteria", label: "Cafeteria", group: "comida", words: ["café", "cafe", "cafeteria"], osm: ["amenity=cafe"] },
  { id: "bar", label: "Bar e boteco", group: "comida", words: ["bar", "boteco", "pub", "choper"], osm: ["amenity=bar", "amenity=pub"] },
  { id: "petshop", label: "Pet shop", group: "varejo", words: ["pet", "banho e tosa", "ração", "veterin"], osm: ["shop=pet", "amenity=veterinary"] },
  { id: "roupas", label: "Loja de roupas", group: "varejo", words: ["roupa", "moda", "boutique", "vestuário"], osm: ["shop=clothes", "shop=boutique"] },
  { id: "semijoias", label: "Semijoias e acessórios", group: "varejo", words: ["semijoia", "joia", "bijou", "acessório"], osm: ["shop=jewelry"] },
  { id: "cosmeticos", label: "Cosméticos e perfumaria", group: "varejo", words: ["cosmét", "perfum", "maquiag"], osm: ["shop=cosmetics", "shop=perfumery"] },
  { id: "moveis", label: "Móveis e colchões", group: "varejo", words: ["móve", "moveis", "colch", "decora"], osm: ["shop=furniture", "shop=bed"] },
  { id: "construcao", label: "Material de construção", group: "varejo", words: ["construção", "material", "ferragem", "tintas"], osm: ["shop=hardware", "shop=doityourself", "shop=paint"] },
  { id: "celulares", label: "Celulares e assistência", group: "varejo", words: ["celular", "smartphone", "assistência técnica"], osm: ["shop=mobile_phone", "shop=electronics"] },
  { id: "floricultura", label: "Floricultura", group: "varejo", words: ["flor", "florista"], osm: ["shop=florist"] },
  { id: "otica", label: "Ótica", group: "varejo", words: ["ótica", "otica"], osm: ["shop=optician"] },
  { id: "mercado", label: "Mercadinho e empório", group: "varejo", words: ["mercad", "empório", "hortifruti", "adega"], osm: ["shop=convenience", "shop=greengrocer", "shop=alcohol"] },
  { id: "estetica", label: "Clínica de estética", group: "saude", words: ["estética", "estetica", "harmoniza", "depila", "sobrancelha", "micropig"], osm: ["shop=beauty"] },
  { id: "salao", label: "Salão de beleza", group: "servico", words: ["salão", "salao", "cabelei", "manicure", "esmalt", "unha"], osm: ["shop=hairdresser", "shop=beauty"] },
  { id: "barbearia", label: "Barbearia", group: "servico", words: ["barbear", "barber"], osm: ['shop=hairdresser][hairdresser~"barber"', 'shop=hairdresser][name~"Barb",i'] },
  { id: "academia", label: "Academia e luta", group: "servico", words: ["academia", "crossfit", "jiu", "muay", "pilates", "fitness"], osm: ["leisure=fitness_centre", "leisure=sports_centre"] },
  { id: "dentista", label: "Dentista", group: "saude", words: ["dentist", "odonto"], osm: ["amenity=dentist", "healthcare=dentist"] },
  { id: "clinica", label: "Clínica e consultório", group: "saude", words: ["clínica", "clinica", "fisio", "psicól", "nutri", "médic"], osm: ["amenity=clinic", "amenity=doctors", "healthcare=physiotherapist"] },
  { id: "limpeza", label: "Limpeza e home care", group: "servico", words: ["limpeza", "diarista", "cuidador", "home care"], osm: ['office=company][name~"Limp",i', 'craft=cleaning'] },
  { id: "oficina", label: "Oficina mecânica", group: "auto", words: ["oficina", "mecânic", "funilaria", "auto center"], osm: ["shop=car_repair"] },
  { id: "autopecas", label: "Autopeças e desmonte", group: "auto", words: ["autopeç", "auto peç", "desmonte", "peças"], osm: ["shop=car_parts"] },
  { id: "lavarapido", label: "Lava-rápido e estética automotiva", group: "auto", words: ["lava", "lavagem", "estética automotiva", "polimento"], osm: ["amenity=car_wash"] },
];

export function nicheById(id?: string) {
  return NICHES.find((n) => n.id === id);
}

/** Termo que vai para o Google Maps: o "q" do catálogo quando existe, senão o rótulo. */
export function searchPhrase(n: Niche) {
  return n.q ?? n.label;
}

export function isTargetNiche(text: string, hint?: string) {
  const n = guessNiche(text, hint);
  return !!n && TARGET_GROUPS.includes(n.group);
}

/**
 * "Pulga atrás da orelha" da primeira mensagem: mostra que o vizinho já tem a máquina rodando,
 * sem citar nome de cliente. Mesmo texto da coluna "gancho" da planilha da Bia.
 */
export function caseLine(name: string, text: string, hint?: string) {
  const g = guessNiche(text, hint)?.group;
  if (g === "juridico")
    return `Hoje tem escritório trabalhista e previdenciário recebendo consulta agendada todo dia pelo WhatsApp, sem ninguém da equipe encostar no celular: uma IA chama, qualifica o caso e já entrega na agenda do advogado. Fui eu que montei.\n\nVi ${name} no Google e fiquei com uma pergunta: quantos desses clientes podiam estar na agenda de vocês?`;
  if (g === "consorcio")
    return `Hoje tem operação de consórcio recebendo lead pronto todo dia pelo WhatsApp: uma IA dispara pras listas, qualifica crédito e lance e entrega o cliente quente direto pro consultor. Fui eu que montei.\n\nVi ${name} no Google e fiquei com uma pergunta: quantas dessas vendas podiam estar saindo daí?`;
  if (g && TARGET_GROUPS.includes(g))
    return `Hoje tem escritório de advocacia e operação de consórcio recebendo cliente agendado todo dia pelo WhatsApp, sem ninguém da equipe encostar no celular: uma IA chama, qualifica e já entrega na agenda. Fui eu que montei, e a mesma máquina roda no seu tipo de negócio.\n\nVi ${name} no Google e fiquei com uma pergunta: quantos clientes estão ficando na mesa hoje?`;
  return `Vi ${name} no Google e quis te contar: aqui na NOVA.AI SOLUTIONS a gente tem uma IA no WhatsApp que responde, qualifica e agenda clientes sozinha, 24h.`;
}

export function greeting(at = new Date()) {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(at));
  return h < 12 ? "bom dia" : h < 18 ? "boa tarde" : "boa noite";
}

/** Descobre o nicho pela categoria/nome que veio do Google. */
export function guessNiche(text: string, hint?: string): Niche | undefined {
  const h = nicheById(hint);
  if (h) return h;
  const t = text.toLowerCase();
  return NICHES.find((n) => n.words.some((w) => t.includes(w)));
}

export const GROUP_PROJECT: Record<NicheGroup, { tipo: string; titulo: string }> = {
  juridico: { tipo: "Assistente IA", titulo: "IA no WhatsApp que qualifica e agenda consultas" },
  consorcio: { tipo: "Assistente IA", titulo: "Disparo + IA no WhatsApp que entrega lead qualificado ao consultor" },
  financeiro: { tipo: "Assistente IA", titulo: "IA no WhatsApp que qualifica e passa o cliente pronto pro fechamento" },
  consultoria: { tipo: "Assistente IA", titulo: "IA no WhatsApp que agenda diagnóstico com o consultor" },
  imobiliario: { tipo: "Assistente IA", titulo: "IA no WhatsApp que qualifica e agenda visita" },
  energia: { tipo: "Assistente IA", titulo: "IA no WhatsApp que qualifica conta de luz e agenda visita técnica" },
  comida: { tipo: "Cardápio digital", titulo: "Cardápio digital com pedido no WhatsApp" },
  varejo: { tipo: "Loja virtual", titulo: "Catálogo online com vitrine e pedido no WhatsApp" },
  servico: { tipo: "Landing page", titulo: "Página com serviços, fotos e agendamento no WhatsApp" },
  saude: { tipo: "Landing page", titulo: "Página com procedimentos, antes e depois e agendamento" },
  auto: { tipo: "Landing page", titulo: "Página com serviços, estoque e orçamento no WhatsApp" },
};

/** Janela sugerida para a primeira mensagem: fora do pico de atendimento de cada tipo de negócio. */
const HOURS: Record<NicheGroup, { label: string; windows: [number, number][] }> = {
  juridico: { label: "9h às 11h ou 14h às 17h, fora de audiência e almoço", windows: [[9, 11], [14, 17]] },
  consorcio: { label: "9h às 12h ou 14h às 18h", windows: [[9, 12], [14, 18]] },
  financeiro: { label: "9h às 12h ou 14h às 18h", windows: [[9, 12], [14, 18]] },
  consultoria: { label: "9h às 11h ou 14h às 17h", windows: [[9, 11], [14, 17]] },
  imobiliario: { label: "9h às 12h ou 14h às 18h", windows: [[9, 12], [14, 18]] },
  energia: { label: "8h às 11h ou 14h às 17h", windows: [[8, 11], [14, 17]] },
  comida: { label: "14h às 17h, entre o almoço e o jantar", windows: [[14, 17]] },
  varejo: { label: "10h às 12h ou 15h às 17h", windows: [[10, 12], [15, 17]] },
  servico: { label: "9h às 11h ou 14h às 16h", windows: [[9, 11], [14, 16]] },
  saude: { label: "11h às 13h ou 17h às 19h", windows: [[11, 13], [17, 19]] },
  auto: { label: "8h às 10h ou 16h às 18h", windows: [[8, 10], [16, 18]] },
};

export function contactWindow(text: string, hint?: string, at = new Date()) {
  const g = guessNiche(text, hint)?.group ?? "servico";
  const h = at.getHours() + at.getMinutes() / 60;
  const now = at.getDay() !== 0 && HOURS[g].windows.some(([a, b]) => h >= a && h < b);
  return { label: HOURS[g].label, now };
}
