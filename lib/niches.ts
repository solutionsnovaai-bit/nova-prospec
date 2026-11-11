/** Catálogo de nichos: rótulo, grupo (decide o projeto ideal) e tags do OpenStreetMap. */

export type NicheGroup = "comida" | "varejo" | "servico" | "saude" | "auto";

export interface Niche {
  id: string;
  label: string;
  group: NicheGroup;
  words: string[]; // palavras que identificam o nicho na categoria do Google
  osm: string[]; // filtros Overpass, ex.: 'shop=pet'
}

export const NICHES: Niche[] = [
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
  { id: "advocacia", label: "Advocacia", group: "servico", words: ["advoca", "advogad", "jurídic"], osm: ["office=lawyer"] },
  { id: "contabilidade", label: "Contabilidade", group: "servico", words: ["contab", "contador"], osm: ["office=accountant"] },
  { id: "imobiliaria", label: "Imobiliária", group: "servico", words: ["imobili", "imóve"], osm: ["office=estate_agent"] },
  { id: "limpeza", label: "Limpeza e home care", group: "servico", words: ["limpeza", "diarista", "cuidador", "home care"], osm: ['office=company][name~"Limp",i', 'craft=cleaning'] },
  { id: "oficina", label: "Oficina mecânica", group: "auto", words: ["oficina", "mecânic", "funilaria", "auto center"], osm: ["shop=car_repair"] },
  { id: "autopecas", label: "Autopeças e desmonte", group: "auto", words: ["autopeç", "auto peç", "desmonte", "peças"], osm: ["shop=car_parts"] },
  { id: "lavarapido", label: "Lava-rápido e estética automotiva", group: "auto", words: ["lava", "lavagem", "estética automotiva", "polimento"], osm: ["amenity=car_wash"] },
];

export function nicheById(id?: string) {
  return NICHES.find((n) => n.id === id);
}

/** Descobre o nicho pela categoria/nome que veio do Google. */
export function guessNiche(text: string, hint?: string): Niche | undefined {
  const h = nicheById(hint);
  if (h) return h;
  const t = text.toLowerCase();
  return NICHES.find((n) => n.words.some((w) => t.includes(w)));
}

export const GROUP_PROJECT: Record<NicheGroup, { tipo: string; titulo: string }> = {
  comida: { tipo: "Cardápio digital", titulo: "Cardápio digital com pedido no WhatsApp" },
  varejo: { tipo: "Loja virtual", titulo: "Catálogo online com vitrine e pedido no WhatsApp" },
  servico: { tipo: "Landing page", titulo: "Página com serviços, fotos e agendamento no WhatsApp" },
  saude: { tipo: "Landing page", titulo: "Página com procedimentos, antes e depois e agendamento" },
  auto: { tipo: "Landing page", titulo: "Página com serviços, estoque e orçamento no WhatsApp" },
};

/** Janela sugerida para a primeira mensagem: fora do pico de atendimento de cada tipo de negócio. */
const HOURS: Record<NicheGroup, { label: string; windows: [number, number][] }> = {
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
