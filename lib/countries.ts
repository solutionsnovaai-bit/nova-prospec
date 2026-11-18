/** Países da aba Internacional: código do Google (gl), idioma (hl), DDI e cidades sugeridas. */

export type Lang = "pt" | "ptpt" | "es" | "en" | "fr" | "de" | "it" | "ja" | "ko";

export type Region = "americas" | "europa" | "asia" | "oceania" | "oriente" | "africa";

export const REGION_LABEL: Record<Region, string> = {
  americas: "Américas",
  europa: "Europa",
  asia: "Ásia",
  oceania: "Oceania",
  oriente: "Oriente Médio",
  africa: "África",
};

export interface Country {
  id: string; // ISO-2 minúsculo, igual ao "gl" do Google
  name: string;
  region: Region;
  flag: string;
  hl: string;
  lang: Lang;
  ddi: string;
  nsnLen: [number, number]; // tamanho do número nacional sem DDI
  mobile?: RegExp; // número nacional que é celular
  cities: string[];
  currency: string;
  tz: string; // fuso principal, para a janela de envio
}

export const COUNTRIES: Country[] = [
  // Américas
  { id: "us", name: "Estados Unidos", region: "americas", flag: "🇺🇸", hl: "en", lang: "en", ddi: "1", nsnLen: [10, 10], cities: ["Miami, FL", "Orlando, FL", "Boca Raton, FL", "Houston, TX", "Dallas, TX", "Los Angeles, CA", "New York, NY", "Boston, MA", "Newark, NJ", "Atlanta, GA", "Chicago, IL"], currency: "USD", tz: "America/New_York" },
  { id: "ca", name: "Canadá", region: "americas", flag: "🇨🇦", hl: "en", lang: "en", ddi: "1", nsnLen: [10, 10], cities: ["Toronto", "Vancouver", "Montreal", "Calgary"], currency: "CAD", tz: "America/Toronto" },
  { id: "mx", name: "México", region: "americas", flag: "🇲🇽", hl: "es", lang: "es", ddi: "52", nsnLen: [10, 10], cities: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Querétaro", "Cancún"], currency: "MXN", tz: "America/Mexico_City" },
  { id: "ar", name: "Argentina", region: "americas", flag: "🇦🇷", hl: "es", lang: "es", ddi: "54", nsnLen: [10, 11], cities: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza"], currency: "ARS", tz: "America/Argentina/Buenos_Aires" },
  { id: "cl", name: "Chile", region: "americas", flag: "🇨🇱", hl: "es", lang: "es", ddi: "56", nsnLen: [9, 9], mobile: /^9/, cities: ["Santiago", "Valparaíso", "Concepción"], currency: "CLP", tz: "America/Santiago" },
  { id: "co", name: "Colômbia", region: "americas", flag: "🇨🇴", hl: "es", lang: "es", ddi: "57", nsnLen: [10, 10], mobile: /^3/, cities: ["Bogotá", "Medellín", "Cali", "Barranquilla"], currency: "COP", tz: "America/Bogota" },
  { id: "pe", name: "Peru", region: "americas", flag: "🇵🇪", hl: "es", lang: "es", ddi: "51", nsnLen: [9, 9], mobile: /^9/, cities: ["Lima", "Arequipa", "Trujillo"], currency: "PEN", tz: "America/Lima" },
  { id: "ec", name: "Equador", region: "americas", flag: "🇪🇨", hl: "es", lang: "es", ddi: "593", nsnLen: [9, 9], mobile: /^9/, cities: ["Quito", "Guayaquil"], currency: "USD", tz: "America/Guayaquil" },
  { id: "uy", name: "Uruguai", region: "americas", flag: "🇺🇾", hl: "es", lang: "es", ddi: "598", nsnLen: [8, 8], mobile: /^9/, cities: ["Montevideo", "Punta del Este"], currency: "UYU", tz: "America/Montevideo" },
  { id: "py", name: "Paraguai", region: "americas", flag: "🇵🇾", hl: "es", lang: "es", ddi: "595", nsnLen: [9, 9], mobile: /^9/, cities: ["Asunción", "Ciudad del Este"], currency: "PYG", tz: "America/Asuncion" },
  // Europa
  { id: "pt", name: "Portugal", region: "europa", flag: "🇵🇹", hl: "pt-PT", lang: "ptpt", ddi: "351", nsnLen: [9, 9], mobile: /^9/, cities: ["Lisboa", "Porto", "Braga", "Coimbra", "Faro", "Setúbal"], currency: "EUR", tz: "Europe/Lisbon" },
  { id: "es", name: "Espanha", region: "europa", flag: "🇪🇸", hl: "es", lang: "es", ddi: "34", nsnLen: [9, 9], mobile: /^[67]/, cities: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga"], currency: "EUR", tz: "Europe/Madrid" },
  { id: "gb", name: "Reino Unido", region: "europa", flag: "🇬🇧", hl: "en", lang: "en", ddi: "44", nsnLen: [10, 10], mobile: /^7/, cities: ["London", "Manchester", "Birmingham", "Leeds"], currency: "GBP", tz: "Europe/London" },
  { id: "ie", name: "Irlanda", region: "europa", flag: "🇮🇪", hl: "en", lang: "en", ddi: "353", nsnLen: [9, 9], mobile: /^8/, cities: ["Dublin", "Cork", "Galway"], currency: "EUR", tz: "Europe/Dublin" },
  { id: "fr", name: "França", region: "europa", flag: "🇫🇷", hl: "fr", lang: "fr", ddi: "33", nsnLen: [9, 9], mobile: /^[67]/, cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"], currency: "EUR", tz: "Europe/Paris" },
  { id: "be", name: "Bélgica", region: "europa", flag: "🇧🇪", hl: "fr", lang: "fr", ddi: "32", nsnLen: [8, 9], mobile: /^4/, cities: ["Bruxelles", "Liège", "Charleroi"], currency: "EUR", tz: "Europe/Brussels" },
  { id: "de", name: "Alemanha", region: "europa", flag: "🇩🇪", hl: "de", lang: "de", ddi: "49", nsnLen: [10, 11], mobile: /^1[5-7]/, cities: ["Berlin", "München", "Hamburg", "Frankfurt", "Köln"], currency: "EUR", tz: "Europe/Berlin" },
  { id: "at", name: "Áustria", region: "europa", flag: "🇦🇹", hl: "de", lang: "de", ddi: "43", nsnLen: [10, 13], mobile: /^6/, cities: ["Wien", "Graz", "Salzburg"], currency: "EUR", tz: "Europe/Vienna" },
  { id: "ch", name: "Suíça", region: "europa", flag: "🇨🇭", hl: "de", lang: "de", ddi: "41", nsnLen: [9, 9], mobile: /^7/, cities: ["Zürich", "Genève", "Basel", "Bern"], currency: "CHF", tz: "Europe/Zurich" },
  { id: "it", name: "Itália", region: "europa", flag: "🇮🇹", hl: "it", lang: "it", ddi: "39", nsnLen: [9, 11], mobile: /^3/, cities: ["Milano", "Roma", "Torino", "Napoli", "Bologna"], currency: "EUR", tz: "Europe/Rome" },
  { id: "nl", name: "Holanda", region: "europa", flag: "🇳🇱", hl: "en", lang: "en", ddi: "31", nsnLen: [9, 9], mobile: /^6/, cities: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht"], currency: "EUR", tz: "Europe/Amsterdam" },
  // Ásia
  { id: "jp", name: "Japão", region: "asia", flag: "🇯🇵", hl: "ja", lang: "ja", ddi: "81", nsnLen: [9, 10], mobile: /^[789]0/, cities: ["東京", "大阪", "名古屋", "横浜", "浜松"], currency: "JPY", tz: "Asia/Tokyo" },
  { id: "kr", name: "Coreia do Sul", region: "asia", flag: "🇰🇷", hl: "ko", lang: "ko", ddi: "82", nsnLen: [9, 10], mobile: /^1/, cities: ["서울", "부산", "인천"], currency: "KRW", tz: "Asia/Seoul" },
  { id: "sg", name: "Singapura", region: "asia", flag: "🇸🇬", hl: "en", lang: "en", ddi: "65", nsnLen: [8, 8], mobile: /^[89]/, cities: ["Singapore"], currency: "SGD", tz: "Asia/Singapore" },
  { id: "in", name: "Índia", region: "asia", flag: "🇮🇳", hl: "en", lang: "en", ddi: "91", nsnLen: [10, 10], mobile: /^[6-9]/, cities: ["Mumbai", "Bangalore", "New Delhi", "Hyderabad"], currency: "INR", tz: "Asia/Kolkata" },
  // Oceania
  { id: "au", name: "Austrália", region: "oceania", flag: "🇦🇺", hl: "en", lang: "en", ddi: "61", nsnLen: [9, 9], mobile: /^4/, cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Gold Coast"], currency: "AUD", tz: "Australia/Sydney" },
  { id: "nz", name: "Nova Zelândia", region: "oceania", flag: "🇳🇿", hl: "en", lang: "en", ddi: "64", nsnLen: [8, 10], mobile: /^2/, cities: ["Auckland", "Wellington", "Christchurch"], currency: "NZD", tz: "Pacific/Auckland" },
  // Oriente Médio
  { id: "ae", name: "Emirados Árabes", region: "oriente", flag: "🇦🇪", hl: "en", lang: "en", ddi: "971", nsnLen: [9, 9], mobile: /^5/, cities: ["Dubai", "Abu Dhabi", "Sharjah"], currency: "AED", tz: "Asia/Dubai" },
  { id: "il", name: "Israel", region: "oriente", flag: "🇮🇱", hl: "en", lang: "en", ddi: "972", nsnLen: [9, 9], mobile: /^5/, cities: ["Tel Aviv", "Jerusalem", "Haifa"], currency: "ILS", tz: "Asia/Jerusalem" },
  // África
  { id: "ao", name: "Angola", region: "africa", flag: "🇦🇴", hl: "pt-PT", lang: "ptpt", ddi: "244", nsnLen: [9, 9], mobile: /^9/, cities: ["Luanda", "Benguela"], currency: "AOA", tz: "Africa/Luanda" },
  { id: "mz", name: "Moçambique", region: "africa", flag: "🇲🇿", hl: "pt-PT", lang: "ptpt", ddi: "258", nsnLen: [9, 9], mobile: /^8/, cities: ["Maputo", "Beira"], currency: "MZN", tz: "Africa/Maputo" },
  { id: "za", name: "África do Sul", region: "africa", flag: "🇿🇦", hl: "en", lang: "en", ddi: "27", nsnLen: [9, 9], mobile: /^[678]/, cities: ["Johannesburg", "Cape Town", "Durban"], currency: "ZAR", tz: "Africa/Johannesburg" },
];

export function countryById(id?: string) {
  return COUNTRIES.find((c) => c.id === id);
}

/** País pelo número E.164 (maior DDI que casar). Mesma regra da planilha da Bia. */
export function countryByPhone(e164?: string) {
  if (!e164 || e164.startsWith("55")) return undefined;
  return [...COUNTRIES].sort((a, b) => b.ddi.length - a.ddi.length).find((c) => e164.startsWith(c.ddi));
}

/** Idioma da mensagem pelo DDI do número salvo. */
export function langByPhone(e164?: string): Lang {
  if (!e164 || e164.startsWith("55")) return "pt";
  return countryByPhone(e164)?.lang ?? "en";
}

/** Preposição para montar a busca no idioma do país ("law firm in Miami"). */
export function searchQuery(niche: string, location: string, lang: Lang = "pt") {
  if (lang === "ja" || lang === "ko") return `${location} ${niche}`;
  const prep: Record<Lang, string> = { pt: "em", ptpt: "em", es: "en", en: "in", fr: "à", de: "in", it: "a", ja: "", ko: "" };
  return `${niche} ${prep[lang]} ${location}`;
}

/** Nichos para buscar fora do Brasil: termo no idioma local. Os grupos alvo vêm primeiro. */
export const INTL_NICHES: { id: string; label: string; q: Partial<Record<Lang, string>> & { en: string } }[] = [
  { id: "law", label: "Advocacia", q: { en: "law firm", es: "abogados", ptpt: "advogados", fr: "cabinet d'avocats", de: "Rechtsanwalt", it: "studio legale", ja: "法律事務所", ko: "법률사무소" } },
  { id: "law-employment", label: "Advocacia trabalhista", q: { en: "employment lawyer", es: "abogado laboral", ptpt: "advogado direito do trabalho", fr: "avocat droit du travail", de: "Fachanwalt Arbeitsrecht", it: "avvocato del lavoro", ja: "労働問題 弁護士", ko: "노동 변호사" } },
  { id: "law-injury", label: "Acidentes / danos pessoais", q: { en: "personal injury lawyer", es: "abogado de accidentes", ptpt: "advogado acidentes", fr: "avocat dommage corporel", de: "Anwalt Verkehrsrecht", it: "avvocato infortuni", ja: "交通事故 弁護士", ko: "교통사고 변호사" } },
  { id: "law-immigration", label: "Imigração", q: { en: "immigration lawyer", es: "abogado de inmigración", ptpt: "advogado imigração", fr: "avocat immigration", de: "Anwalt Ausländerrecht", it: "avvocato immigrazione", ja: "ビザ 行政書士", ko: "이민 변호사" } },
  { id: "insurance", label: "Seguros", q: { en: "insurance agency", es: "agencia de seguros", ptpt: "mediador de seguros", fr: "courtier en assurance", de: "Versicherungsmakler", it: "agenzia assicurativa", ja: "保険代理店", ko: "보험 대리점" } },
  { id: "mortgage", label: "Crédito / hipoteca", q: { en: "mortgage broker", es: "asesor hipotecario", ptpt: "intermediário de crédito", fr: "courtier en crédit immobilier", de: "Baufinanzierung Berater", it: "mediatore creditizio", ja: "住宅ローン 相談", ko: "대출 상담" } },
  { id: "realestate", label: "Imobiliária", q: { en: "real estate agency", es: "inmobiliaria", ptpt: "imobiliária", fr: "agence immobilière", de: "Immobilienmakler", it: "agenzia immobiliare", ja: "不動産会社", ko: "부동산 중개" } },
  { id: "accounting", label: "Contabilidade", q: { en: "accounting firm", es: "asesoría contable", ptpt: "contabilidade", fr: "cabinet comptable", de: "Steuerberater", it: "commercialista", ja: "税理士事務所", ko: "세무사 사무소" } },
  { id: "solar", label: "Energia solar", q: { en: "solar installer", es: "instalación paneles solares", ptpt: "painéis solares", fr: "installateur panneaux solaires", de: "Photovoltaik Installateur", it: "installatore fotovoltaico", ja: "太陽光発電 施工", ko: "태양광 설치" } },
  { id: "dental", label: "Odontologia", q: { en: "dental clinic", es: "clínica dental", ptpt: "clínica dentária", fr: "cabinet dentaire", de: "Zahnarztpraxis", it: "studio dentistico", ja: "歯科医院", ko: "치과" } },
  { id: "medspa", label: "Estética", q: { en: "med spa", es: "clínica estética", ptpt: "clínica de estética", fr: "clinique esthétique", de: "Ästhetische Klinik", it: "clinica estetica", ja: "美容クリニック", ko: "피부과 클리닉" } },
  { id: "brazilian", label: "Negócio brasileiro no exterior", q: { en: "brazilian", es: "brasileño", ptpt: "brasileiro", fr: "brésilien", de: "brasilianisch", it: "brasiliano", ja: "ブラジル", ko: "브라질" } },
  { id: "restaurant", label: "Restaurante", q: { en: "restaurant", es: "restaurante", ptpt: "restaurante", fr: "restaurant", de: "Restaurant", it: "ristorante", ja: "レストラン", ko: "레스토랑" } },
];

export function intlQuery(nicheId: string, lang: Lang) {
  const n = INTL_NICHES.find((x) => x.id === nicheId);
  return n ? n.q[lang] ?? n.q.en : undefined;
}
