/** Países da aba Internacional: código do Google (gl), idioma (hl), DDI e cidades sugeridas. */

export type Lang = "pt" | "ptpt" | "es" | "en" | "fr" | "de" | "it" | "nl" | "tr" | "ar" | "id" | "ja" | "ko";

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
  { id: "ca", name: "Canadá", region: "americas", flag: "🇨🇦", hl: "en", lang: "en", ddi: "1", nsnLen: [10, 10], cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton"], currency: "CAD", tz: "America/Toronto" },
  { id: "mx", name: "México", region: "americas", flag: "🇲🇽", hl: "es", lang: "es", ddi: "52", nsnLen: [10, 10], cities: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Querétaro", "Cancún"], currency: "MXN", tz: "America/Mexico_City" },
  { id: "ar", name: "Argentina", region: "americas", flag: "🇦🇷", hl: "es", lang: "es", ddi: "54", nsnLen: [10, 11], cities: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza"], currency: "ARS", tz: "America/Argentina/Buenos_Aires" },
  { id: "cl", name: "Chile", region: "americas", flag: "🇨🇱", hl: "es", lang: "es", ddi: "56", nsnLen: [9, 9], mobile: /^9/, cities: ["Santiago", "Valparaíso", "Concepción"], currency: "CLP", tz: "America/Santiago" },
  { id: "co", name: "Colômbia", region: "americas", flag: "🇨🇴", hl: "es", lang: "es", ddi: "57", nsnLen: [10, 10], mobile: /^3/, cities: ["Bogotá", "Medellín", "Cali", "Barranquilla"], currency: "COP", tz: "America/Bogota" },
  { id: "pe", name: "Peru", region: "americas", flag: "🇵🇪", hl: "es", lang: "es", ddi: "51", nsnLen: [9, 9], mobile: /^9/, cities: ["Lima", "Arequipa", "Trujillo"], currency: "PEN", tz: "America/Lima" },
  { id: "ec", name: "Equador", region: "americas", flag: "🇪🇨", hl: "es", lang: "es", ddi: "593", nsnLen: [9, 9], mobile: /^9/, cities: ["Quito", "Guayaquil"], currency: "USD", tz: "America/Guayaquil" },
  { id: "uy", name: "Uruguai", region: "americas", flag: "🇺🇾", hl: "es", lang: "es", ddi: "598", nsnLen: [8, 8], mobile: /^9/, cities: ["Montevideo", "Punta del Este"], currency: "UYU", tz: "America/Montevideo" },
  { id: "py", name: "Paraguai", region: "americas", flag: "🇵🇾", hl: "es", lang: "es", ddi: "595", nsnLen: [9, 9], mobile: /^9/, cities: ["Asunción", "Ciudad del Este"], currency: "PYG", tz: "America/Asuncion" },
  { id: "pa", name: "Panamá", region: "americas", flag: "🇵🇦", hl: "es", lang: "es", ddi: "507", nsnLen: [8, 8], mobile: /^6/, cities: ["Ciudad de Panamá"], currency: "USD", tz: "America/Panama" },
  { id: "cr", name: "Costa Rica", region: "americas", flag: "🇨🇷", hl: "es", lang: "es", ddi: "506", nsnLen: [8, 8], mobile: /^[5-8]/, cities: ["San José", "Heredia"], currency: "CRC", tz: "America/Costa_Rica" },
  { id: "gt", name: "Guatemala", region: "americas", flag: "🇬🇹", hl: "es", lang: "es", ddi: "502", nsnLen: [8, 8], mobile: /^[3-5]/, cities: ["Ciudad de Guatemala"], currency: "GTQ", tz: "America/Guatemala" },
  { id: "bo", name: "Bolívia", region: "americas", flag: "🇧🇴", hl: "es", lang: "es", ddi: "591", nsnLen: [8, 8], mobile: /^[67]/, cities: ["Santa Cruz de la Sierra", "La Paz"], currency: "BOB", tz: "America/La_Paz" },

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
  { id: "nl", name: "Holanda", region: "europa", flag: "🇳🇱", hl: "nl", lang: "nl", ddi: "31", nsnLen: [9, 9], mobile: /^6/, cities: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht"], currency: "EUR", tz: "Europe/Amsterdam" },
  { id: "se", name: "Suécia", region: "europa", flag: "🇸🇪", hl: "en", lang: "en", ddi: "46", nsnLen: [9, 9], mobile: /^7[02369]/, cities: ["Stockholm", "Göteborg", "Malmö"], currency: "SEK", tz: "Europe/Stockholm" },
  { id: "dk", name: "Dinamarca", region: "europa", flag: "🇩🇰", hl: "en", lang: "en", ddi: "45", nsnLen: [8, 8], mobile: /^(2|3[01]|4[0-2]|5[0-3]|6[01]|71|81|9[1-3])/, cities: ["København", "Aarhus"], currency: "DKK", tz: "Europe/Copenhagen" },
  { id: "no", name: "Noruega", region: "europa", flag: "🇳🇴", hl: "en", lang: "en", ddi: "47", nsnLen: [8, 8], mobile: /^[49]/, cities: ["Oslo", "Bergen", "Trondheim"], currency: "NOK", tz: "Europe/Oslo" },
  { id: "lu", name: "Luxemburgo", region: "europa", flag: "🇱🇺", hl: "fr", lang: "fr", ddi: "352", nsnLen: [6, 11], mobile: /^6\d{8}$/, cities: ["Luxembourg"], currency: "EUR", tz: "Europe/Luxembourg" },
  { id: "tr", name: "Turquia", region: "europa", flag: "🇹🇷", hl: "tr", lang: "tr", ddi: "90", nsnLen: [10, 10], mobile: /^5/, cities: ["İstanbul", "Ankara", "İzmir", "Antalya"], currency: "TRY", tz: "Europe/Istanbul" },

  // Ásia
  { id: "jp", name: "Japão", region: "asia", flag: "🇯🇵", hl: "ja", lang: "ja", ddi: "81", nsnLen: [9, 10], mobile: /^[789]0/, cities: ["東京", "大阪", "名古屋", "横浜", "浜松"], currency: "JPY", tz: "Asia/Tokyo" },
  { id: "kr", name: "Coreia do Sul", region: "asia", flag: "🇰🇷", hl: "ko", lang: "ko", ddi: "82", nsnLen: [9, 10], mobile: /^1/, cities: ["서울", "부산", "인천"], currency: "KRW", tz: "Asia/Seoul" },
  { id: "sg", name: "Singapura", region: "asia", flag: "🇸🇬", hl: "en", lang: "en", ddi: "65", nsnLen: [8, 8], mobile: /^[89]/, cities: ["Singapore"], currency: "SGD", tz: "Asia/Singapore" },
  { id: "in", name: "Índia", region: "asia", flag: "🇮🇳", hl: "en", lang: "en", ddi: "91", nsnLen: [10, 10], mobile: /^[6-9]/, cities: ["Mumbai", "Bangalore", "New Delhi", "Hyderabad"], currency: "INR", tz: "Asia/Kolkata" },
  { id: "my", name: "Malásia", region: "asia", flag: "🇲🇾", hl: "en", lang: "en", ddi: "60", nsnLen: [9, 10], mobile: /^1/, cities: ["Kuala Lumpur", "Johor Bahru", "Penang"], currency: "MYR", tz: "Asia/Kuala_Lumpur" },
  { id: "id", name: "Indonésia", region: "asia", flag: "🇮🇩", hl: "id", lang: "id", ddi: "62", nsnLen: [9, 12], mobile: /^8/, cities: ["Jakarta", "Surabaya", "Bali", "Bandung"], currency: "IDR", tz: "Asia/Jakarta" },
  { id: "hk", name: "Hong Kong", region: "asia", flag: "🇭🇰", hl: "en", lang: "en", ddi: "852", nsnLen: [8, 8], mobile: /^[5-9]/, cities: ["Hong Kong"], currency: "HKD", tz: "Asia/Hong_Kong" },
  { id: "ph", name: "Filipinas", region: "asia", flag: "🇵🇭", hl: "en", lang: "en", ddi: "63", nsnLen: [10, 10], mobile: /^9/, cities: ["Manila", "Makati", "Cebu"], currency: "PHP", tz: "Asia/Manila" },

  // Oceania
  { id: "au", name: "Austrália", region: "oceania", flag: "🇦🇺", hl: "en", lang: "en", ddi: "61", nsnLen: [9, 9], mobile: /^4/, cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Gold Coast"], currency: "AUD", tz: "Australia/Sydney" },
  { id: "nz", name: "Nova Zelândia", region: "oceania", flag: "🇳🇿", hl: "en", lang: "en", ddi: "64", nsnLen: [8, 10], mobile: /^2/, cities: ["Auckland", "Wellington", "Christchurch"], currency: "NZD", tz: "Pacific/Auckland" },
  // Oriente Médio
  { id: "ae", name: "Emirados Árabes", region: "oriente", flag: "🇦🇪", hl: "en", lang: "en", ddi: "971", nsnLen: [9, 9], mobile: /^5/, cities: ["Dubai", "Abu Dhabi", "Sharjah"], currency: "AED", tz: "Asia/Dubai" },
  { id: "il", name: "Israel", region: "oriente", flag: "🇮🇱", hl: "en", lang: "en", ddi: "972", nsnLen: [9, 9], mobile: /^5/, cities: ["Tel Aviv", "Jerusalem", "Haifa"], currency: "ILS", tz: "Asia/Jerusalem" },
  { id: "sa", name: "Arábia Saudita", region: "oriente", flag: "🇸🇦", hl: "ar", lang: "ar", ddi: "966", nsnLen: [9, 9], mobile: /^5/, cities: ["الرياض", "جدة", "الدمام"], currency: "SAR", tz: "Asia/Riyadh" },
  { id: "qa", name: "Catar", region: "oriente", flag: "🇶🇦", hl: "en", lang: "en", ddi: "974", nsnLen: [8, 8], mobile: /^[3567]/, cities: ["Doha"], currency: "QAR", tz: "Asia/Qatar" },
  { id: "kw", name: "Kuwait", region: "oriente", flag: "🇰🇼", hl: "en", lang: "en", ddi: "965", nsnLen: [8, 8], mobile: /^[569]/, cities: ["Kuwait City"], currency: "KWD", tz: "Asia/Kuwait" },
  { id: "bh", name: "Bahrein", region: "oriente", flag: "🇧🇭", hl: "en", lang: "en", ddi: "973", nsnLen: [8, 8], mobile: /^3/, cities: ["Manama"], currency: "BHD", tz: "Asia/Bahrain" },

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
  if (lang === "ja" || lang === "ko" || lang === "tr") return `${location} ${niche}`;
  const prep: Record<Lang, string> = { pt: "em", ptpt: "em", es: "en", en: "in", fr: "à", de: "in", it: "a", nl: "in", tr: "", ar: "في", id: "di", ja: "", ko: "" };
  return `${niche} ${prep[lang]} ${location}`;
}

/** Nichos para buscar fora do Brasil: termo no idioma local. Os grupos alvo vêm primeiro. */
export const INTL_NICHES: { id: string; label: string; q: Partial<Record<Lang, string>> & { en: string } }[] = [
  // serviços de casa: lá fora vivem de site e WhatsApp (limpeza é o carro-chefe, ex.: Reino Unido)
  { id: "cleaning", label: "Limpeza", q: { en: "cleaning company", es: "empresa de limpieza", ptpt: "empresa de limpezas", fr: "entreprise de nettoyage", de: "Reinigungsfirma", it: "impresa di pulizie", nl: "schoonmaakbedrijf", tr: "temizlik şirketi", ar: "شركة تنظيف", id: "jasa kebersihan", ja: "清掃会社", ko: "청소 업체" } },
  { id: "roofing", label: "Telhados", q: { en: "roofing contractor", es: "empresa de techos", ptpt: "empresa de telhados", fr: "couvreur", de: "Dachdecker", it: "impresa coperture tetti", nl: "dakdekker", tr: "çatı ustası", ar: "مقاول أسقف", id: "jasa atap", ja: "屋根工事", ko: "지붕 공사" } },
  { id: "remodeling", label: "Reformas", q: { en: "home remodeling contractor", es: "empresa de reformas", ptpt: "empresa de remodelações", fr: "entreprise de rénovation", de: "Renovierungsfirma", it: "impresa di ristrutturazioni", nl: "renovatiebedrijf", tr: "tadilat şirketi", ar: "شركة ترميم", id: "jasa renovasi rumah", ja: "リフォーム会社", ko: "인테리어 리모델링" } },
  { id: "handyman", label: "Faz-tudo / manutenção", q: { en: "handyman", es: "mantenimiento del hogar", ptpt: "faz-tudo", fr: "homme à tout faire", de: "Hausmeisterservice", it: "tuttofare", nl: "klusjesman", tr: "tamirci", ar: "صيانة منازل", id: "jasa tukang", ja: "便利屋", ko: "집수리" } },
  { id: "plumber", label: "Encanador", q: { en: "plumber", es: "plomería", ptpt: "canalizador", fr: "plombier", de: "Klempner", it: "idraulico", nl: "loodgieter", tr: "tesisatçı", ar: "سباك", id: "tukang ledeng", ja: "水道工事", ko: "배관 수리" } },
  { id: "painting", label: "Pintura", q: { en: "painter and decorator", es: "pintor de casas", ptpt: "pintor de construção civil", fr: "peintre en bâtiment", de: "Malerbetrieb", it: "imbianchino", nl: "schildersbedrijf", tr: "boya badana", ar: "دهان منازل", id: "jasa cat rumah", ja: "塗装店", ko: "도장 공사" } },
  { id: "moving", label: "Mudanças", q: { en: "moving company", es: "empresa de mudanzas", ptpt: "empresa de mudanças", fr: "déménageur", de: "Umzugsfirma", it: "ditta traslochi", nl: "verhuisbedrijf", tr: "nakliyat", ar: "شركة نقل عفش", id: "jasa pindahan", ja: "引越し業者", ko: "이삿짐센터" } },
  { id: "landscaping", label: "Jardinagem", q: { en: "landscaping company", es: "jardinería", ptpt: "jardinagem", fr: "paysagiste", de: "Garten- und Landschaftsbau", it: "giardiniere", nl: "hovenier", tr: "peyzaj", ar: "تنسيق حدائق", id: "jasa taman", ja: "造園", ko: "조경" } },
  { id: "pest", label: "Dedetização", q: { en: "pest control", es: "control de plagas", ptpt: "controlo de pragas", fr: "désinsectisation", de: "Schädlingsbekämpfung", it: "disinfestazione", nl: "ongediertebestrijding", tr: "ilaçlama", ar: "مكافحة حشرات", id: "jasa pest control", ja: "害虫駆除", ko: "해충 방제" } },
  { id: "law", label: "Advocacia", q: { en: "law firm", nl: "advocatenkantoor", tr: "avukatlık bürosu", ar: "مكتب محاماة", id: "kantor hukum", es: "abogados", ptpt: "advogados", fr: "cabinet d'avocats", de: "Rechtsanwalt", it: "studio legale", ja: "法律事務所", ko: "법률사무소" } },
  { id: "law-employment", label: "Advocacia trabalhista", q: { en: "employment lawyer", nl: "advocaat arbeidsrecht", tr: "iş hukuku avukatı", ar: "محامي عمالي", id: "pengacara ketenagakerjaan", es: "abogado laboral", ptpt: "advogado direito do trabalho", fr: "avocat droit du travail", de: "Fachanwalt Arbeitsrecht", it: "avvocato del lavoro", ja: "労働問題 弁護士", ko: "노동 변호사" } },
  { id: "law-injury", label: "Acidentes / danos pessoais", q: { en: "personal injury lawyer", nl: "letselschade advocaat", tr: "trafik kazası avukatı", ar: "محامي حوادث", id: "pengacara kecelakaan", es: "abogado de accidentes", ptpt: "advogado acidentes", fr: "avocat dommage corporel", de: "Anwalt Verkehrsrecht", it: "avvocato infortuni", ja: "交通事故 弁護士", ko: "교통사고 변호사" } },
  { id: "law-immigration", label: "Imigração", q: { en: "immigration lawyer", nl: "immigratie advocaat", tr: "göçmenlik avukatı", ar: "محامي هجرة وإقامة", id: "konsultan imigrasi", es: "abogado de inmigración", ptpt: "advogado imigração", fr: "avocat immigration", de: "Anwalt Ausländerrecht", it: "avvocato immigrazione", ja: "ビザ 行政書士", ko: "이민 변호사" } },
  { id: "insurance", label: "Seguros", q: { en: "insurance agency", nl: "verzekeringsadviseur", tr: "sigorta acentesi", ar: "وكالة تأمين", id: "agen asuransi", es: "agencia de seguros", ptpt: "mediador de seguros", fr: "courtier en assurance", de: "Versicherungsmakler", it: "agenzia assicurativa", ja: "保険代理店", ko: "보험 대리점" } },
  { id: "mortgage", label: "Crédito / hipoteca", q: { en: "mortgage broker", nl: "hypotheekadviseur", tr: "kredi danışmanı", ar: "تمويل عقاري", id: "konsultan KPR", es: "asesor hipotecario", ptpt: "intermediário de crédito", fr: "courtier en crédit immobilier", de: "Baufinanzierung Berater", it: "mediatore creditizio", ja: "住宅ローン 相談", ko: "대출 상담" } },
  { id: "realestate", label: "Imobiliária", q: { en: "real estate agency", nl: "makelaar", tr: "emlak ofisi", ar: "مكتب عقاري", id: "agen properti", es: "inmobiliaria", ptpt: "imobiliária", fr: "agence immobilière", de: "Immobilienmakler", it: "agenzia immobiliare", ja: "不動産会社", ko: "부동산 중개" } },
  { id: "accounting", label: "Contabilidade", q: { en: "accounting firm", nl: "accountantskantoor", tr: "mali müşavir", ar: "مكتب محاسبة", id: "kantor akuntan", es: "asesoría contable", ptpt: "contabilidade", fr: "cabinet comptable", de: "Steuerberater", it: "commercialista", ja: "税理士事務所", ko: "세무사 사무소" } },
  { id: "solar", label: "Energia solar", q: { en: "solar installer", nl: "zonnepanelen installateur", tr: "güneş paneli kurulumu", ar: "تركيب ألواح شمسية", id: "pemasangan panel surya", es: "instalación paneles solares", ptpt: "painéis solares", fr: "installateur panneaux solaires", de: "Photovoltaik Installateur", it: "installatore fotovoltaico", ja: "太陽光発電 施工", ko: "태양광 설치" } },
  { id: "dental", label: "Odontologia", q: { en: "dental clinic", nl: "tandartspraktijk", tr: "diş kliniği", ar: "عيادة أسنان", id: "klinik gigi", es: "clínica dental", ptpt: "clínica dentária", fr: "cabinet dentaire", de: "Zahnarztpraxis", it: "studio dentistico", ja: "歯科医院", ko: "치과" } },
  { id: "medspa", label: "Estética", q: { en: "med spa", nl: "esthetische kliniek", tr: "estetik kliniği", ar: "عيادة تجميل", id: "klinik kecantikan", es: "clínica estética", ptpt: "clínica de estética", fr: "clinique esthétique", de: "Ästhetische Klinik", it: "clinica estetica", ja: "美容クリニック", ko: "피부과 클리닉" } },
  { id: "br-cleaning", label: "Limpeza de brasileiros", q: { en: "brazilian cleaning company", es: "limpieza brasileña", ptpt: "limpezas brasileira", fr: "nettoyage brésilien", de: "brasilianische Reinigung", it: "pulizie brasiliane", nl: "Braziliaanse schoonmaak", tr: "Brezilyalı temizlik", ar: "شركة تنظيف برازيلية", id: "jasa kebersihan Brasil" } },
  { id: "br-dentist", label: "Dentista brasileiro", q: { en: "brazilian dentist", nl: "Braziliaanse tandarts", tr: "Brezilyalı diş hekimi", ar: "طبيب أسنان برازيلي", id: "dokter gigi Brasil", es: "dentista brasileño", ptpt: "dentista brasileiro", fr: "dentiste brésilien", de: "brasilianischer Zahnarzt", it: "dentista brasiliano", ja: "ブラジル人 歯科", ko: "브라질 치과" } },
  { id: "br-accountant", label: "Contador brasileiro", q: { en: "brazilian accountant", nl: "Braziliaanse boekhouder", tr: "Brezilyalı muhasebeci", ar: "محاسب برازيلي", id: "akuntan Brasil", es: "contador brasileño", ptpt: "contabilista brasileiro", fr: "comptable brésilien", de: "brasilianischer Steuerberater", it: "commercialista brasiliano", ja: "ブラジル人 会計", ko: "브라질 회계" } },
  { id: "br-realestate", label: "Imobiliária de brasileiros", q: { en: "brazilian real estate agent", nl: "Braziliaanse makelaar", tr: "Brezilyalı emlakçı", ar: "وسيط عقاري برازيلي", id: "agen properti Brasil", es: "inmobiliaria brasileña", ptpt: "imobiliária brasileira", fr: "agent immobilier brésilien", de: "brasilianischer Immobilienmakler", it: "agenzia immobiliare brasiliana", ja: "ブラジル人 不動産", ko: "브라질 부동산" } },
  { id: "br-lawyer", label: "Advogado para brasileiros", q: { en: "brazilian immigration lawyer", nl: "Braziliaanse advocaat", tr: "Brezilyalı avukat", ar: "محامي برازيلي", id: "pengacara Brasil", es: "abogado para brasileños", ptpt: "advogado brasileiro", fr: "avocat brésilien", de: "brasilianischer Anwalt", it: "avvocato brasiliano", ja: "ブラジル人 行政書士", ko: "브라질 변호사" } },
  { id: "restaurant", label: "Restaurante", q: { en: "restaurant", nl: "restaurant", tr: "restoran", ar: "مطعم", id: "restoran", es: "restaurante", ptpt: "restaurante", fr: "restaurant", de: "Restaurant", it: "ristorante", ja: "レストラン", ko: "레스토랑" } },
];

export function intlNicheId(id: string) {
  return id.startsWith("br-") ? "brasileiros-exterior" : undefined; // vira o nicho "brasileiro no exterior" (mensagem em PT-BR)
}

export function intlQuery(nicheId: string, lang: Lang) {
  const n = INTL_NICHES.find((x) => x.id === nicheId);
  return n ? n.q[lang] ?? n.q.en : undefined;
}
