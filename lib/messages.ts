import type { Lang } from "./countries";
import type { Lead } from "./types";

/**
 * Mensagens fora do Brasil, no idioma do país. Mesmo começo ("sei que vocês são incrivelmente ocupados")
 * e mesmo final; o meio muda pelo estado do site do lead:
 * - nosite: não tem site → oferece site do zero
 * - load: site não abre → oferece site novo
 * - wa: site sem jeito rápido de chamar no WhatsApp → oferece site novo
 * - ai: site bom → máquina de agendamentos (IA no WhatsApp)
 * {empresa} = nome do negócio. A planilha da Bia lê estes mesmos textos na aba "Textos Mundo".
 */
export type SiteVariant = "nosite" | "load" | "wa" | "ai";
type Parts = { start: string; nosite: string; load: string; wa: string; ai: string; end: string; nositeClean: string };

export const INTL_TEXTS: Record<Exclude<Lang, "pt">, Parts> = {
  en: {
    start: "Hi there! I know you're incredibly busy, so I'll be quick:",
    nosite: "I couldn't find a website for {empresa} on Google, and that's where most new clients look first. I build modern sites in a few days, with a WhatsApp button that turns visits into bookings.",
    load: "I took a look at {empresa}'s website and noticed it isn't loading properly. I rebuild sites like that in a few days so visits turn into booked clients.",
    wa: "I took a look at {empresa}'s website and noticed there's no quick way to message you from it. I rebuild sites like that in a few days so visits turn into booked clients.",
    ai: "I built an AI that books qualified clients on WhatsApp every day for businesses like yours. How many of those clients could be on your calendar?",
    end: "Up for a quick 30-min call? Even a short reply would make my day.",
    nositeClean: "I couldn't find a website for {empresa} on Google. I recently built one for a cleaning company in the UK, with a WhatsApp button that turns visits into bookings.",
  },
  es: {
    start: "¡Hola! Sé que están increíblemente ocupados, así que voy directo:",
    nosite: "no encontré un sitio web de {empresa} en Google, y ahí es donde la mayoría de los clientes nuevos busca primero. Hago sitios modernos en pocos días, con un botón de WhatsApp que convierte visitas en citas.",
    load: "revisé el sitio web de {empresa} y noté que no carga bien. Rehago sitios así en pocos días para que las visitas se conviertan en clientes agendados.",
    wa: "revisé el sitio web de {empresa} y noté que no hay una forma rápida de escribirles por WhatsApp desde él. Rehago sitios así en pocos días para que las visitas se conviertan en clientes agendados.",
    ai: "creé una IA que agenda clientes calificados por WhatsApp todos los días para negocios como el suyo. ¿Cuántos de esos clientes podrían estar en su agenda?",
    end: "¿Charlamos 30 min? Incluso una respuesta corta me alegraría el día.",
    nositeClean: "no encontré un sitio web de {empresa} en Google. Hace poco hice el de una empresa de limpieza en el Reino Unido, con un botón de WhatsApp que convierte visitas en citas.",
  },
  ptpt: {
    start: "Olá! Sei que estão incrivelmente ocupados, por isso vou direto:",
    nosite: "não encontrei um site da {empresa} no Google, que é onde a maioria dos novos clientes procura primeiro. Faço sites modernos em poucos dias, com um botão de WhatsApp que transforma visitas em marcações.",
    load: "estive a ver o site da {empresa} e reparei que não está a abrir bem. Refaço sites assim em poucos dias para que as visitas se transformem em clientes marcados.",
    wa: "estive a ver o site da {empresa} e reparei que não há uma forma rápida de vos contactar pelo WhatsApp a partir dele. Refaço sites assim em poucos dias para que as visitas se transformem em clientes marcados.",
    ai: "criei uma IA que marca clientes qualificados pelo WhatsApp todos os dias para negócios como o vosso. Quantos desses clientes podiam estar na vossa agenda?",
    end: "Conversamos 30 min? Mesmo uma resposta curta deixava-me o dia mais feliz.",
    nositeClean: "não encontrei um site da {empresa} no Google. Fiz há pouco o de uma empresa de limpezas no Reino Unido, com um botão de WhatsApp que transforma visitas em marcações.",
  },
  fr: {
    start: "Bonjour ! Je sais que vous êtes très occupés, alors je vais droit au but :",
    nosite: "je n'ai pas trouvé de site web pour {empresa} sur Google, et c'est là que la plupart des nouveaux clients cherchent en premier. Je crée des sites modernes en quelques jours, avec un bouton WhatsApp qui transforme les visites en rendez-vous.",
    load: "j'ai regardé le site de {empresa} et j'ai remarqué qu'il ne se charge pas correctement. Je refais ce genre de site en quelques jours pour que les visites deviennent des clients.",
    wa: "j'ai regardé le site de {empresa} et j'ai remarqué qu'il n'y a pas de moyen rapide de vous écrire sur WhatsApp depuis le site. Je refais ce genre de site en quelques jours pour que les visites deviennent des clients.",
    ai: "j'ai créé une IA qui prend chaque jour des rendez-vous qualifiés sur WhatsApp pour des entreprises comme la vôtre. Combien de ces clients pourraient être dans votre agenda ?",
    end: "On en parle 30 min ? Même une réponse courte me ferait plaisir.",
    nositeClean: "je n'ai pas trouvé de site web pour {empresa} sur Google. J'ai récemment créé celui d'une entreprise de nettoyage au Royaume-Uni, avec un bouton WhatsApp qui transforme les visites en rendez-vous.",
  },
  de: {
    start: "Hallo! Ich weiß, Sie sind sehr beschäftigt, deshalb kurz:",
    nosite: "Ich habe bei Google keine Website von {empresa} gefunden, und genau dort suchen die meisten Neukunden zuerst. Ich baue moderne Websites in wenigen Tagen, mit WhatsApp-Button, der Besucher in Termine verwandelt.",
    load: "Ich habe mir die Website von {empresa} angesehen und bemerkt, dass sie nicht richtig lädt. Ich baue solche Websites in wenigen Tagen neu, damit aus Besuchern gebuchte Kunden werden.",
    wa: "Ich habe mir die Website von {empresa} angesehen und bemerkt, dass man Ihnen von dort nicht schnell per WhatsApp schreiben kann. Ich baue solche Websites in wenigen Tagen neu, damit aus Besuchern gebuchte Kunden werden.",
    ai: "Ich habe eine KI gebaut, die für Unternehmen wie Ihres jeden Tag qualifizierte Termine über WhatsApp vereinbart. Wie viele dieser Kunden könnten in Ihrem Kalender stehen?",
    end: "Kurzes 30-Minuten-Gespräch? Schon eine kurze Antwort würde mich freuen.",
    nositeClean: "Ich habe bei Google keine Website von {empresa} gefunden. Vor Kurzem habe ich eine für eine Reinigungsfirma in Großbritannien gebaut, mit WhatsApp-Button, der Besucher in Termine verwandelt.",
  },
  it: {
    start: "Ciao! So che siete molto impegnati, quindi vado dritto al punto:",
    nosite: "non ho trovato un sito web di {empresa} su Google, ed è lì che la maggior parte dei nuovi clienti cerca per prima. Realizzo siti moderni in pochi giorni, con un pulsante WhatsApp che trasforma le visite in appuntamenti.",
    load: "ho dato un'occhiata al sito di {empresa} e ho notato che non si carica bene. Rifaccio siti così in pochi giorni, così le visite diventano clienti prenotati.",
    wa: "ho dato un'occhiata al sito di {empresa} e ho notato che non c'è un modo rapido per scrivervi su WhatsApp. Rifaccio siti così in pochi giorni, così le visite diventano clienti prenotati.",
    ai: "ho creato un'IA che fissa ogni giorno appuntamenti qualificati su WhatsApp per attività come la vostra. Quanti di questi clienti potrebbero essere nella vostra agenda?",
    end: "Ne parliamo in 30 minuti? Anche una risposta breve mi renderebbe felice.",
    nositeClean: "non ho trovato un sito web di {empresa} su Google. Di recente ho realizzato quello di un'impresa di pulizie nel Regno Unito, con un pulsante WhatsApp che trasforma le visite in appuntamenti.",
  },
  nl: {
    start: "Hallo! Ik weet dat jullie het ontzettend druk hebben, dus ik hou het kort:",
    nosite: "ik kon op Google geen website van {empresa} vinden, en daar zoeken de meeste nieuwe klanten als eerste. Ik bouw moderne websites in een paar dagen, met een WhatsApp-knop die bezoekers omzet in afspraken.",
    load: "ik heb naar de website van {empresa} gekeken en zag dat die niet goed laadt. Ik bouw zulke websites in een paar dagen opnieuw, zodat bezoekers ingeplande klanten worden.",
    wa: "ik heb naar de website van {empresa} gekeken en zag dat bezoekers jullie vanaf de site niet snel via WhatsApp kunnen bereiken. Ik bouw zulke websites in een paar dagen opnieuw, zodat bezoekers ingeplande klanten worden.",
    ai: "ik heb een AI gebouwd die elke dag via WhatsApp gekwalificeerde klanten inplant voor bedrijven zoals dat van jullie. Hoeveel van die klanten zouden in jullie agenda kunnen staan?",
    end: "Zin in een kort gesprek van 30 min? Zelfs een kort antwoord zou mijn dag goedmaken.",
    nositeClean: "ik kon op Google geen website van {empresa} vinden. Onlangs heb ik er een gebouwd voor een schoonmaakbedrijf in het Verenigd Koninkrijk, met een WhatsApp-knop die bezoekers omzet in afspraken.",
  },
  tr: {
    start: "Merhaba! Çok yoğun olduğunuzu biliyorum, o yüzden kısa keseceğim:",
    nosite: "Google'da {empresa} için bir web sitesi bulamadım; yeni müşterilerin çoğu ilk olarak orada arıyor. Birkaç gün içinde, ziyaretleri randevuya dönüştüren WhatsApp butonlu modern siteler yapıyorum.",
    load: "{empresa} web sitesine baktım ve düzgün açılmadığını fark ettim. Bu tür siteleri birkaç gün içinde yeniden yapıyorum, böylece ziyaretler randevulu müşteriye dönüşüyor.",
    wa: "{empresa} web sitesine baktım ve sitede size WhatsApp'tan hızlıca ulaşmanın bir yolu olmadığını fark ettim. Bu tür siteleri birkaç gün içinde yeniden yapıyorum, böylece ziyaretler randevulu müşteriye dönüşüyor.",
    ai: "sizin gibi işletmeler için her gün WhatsApp üzerinden nitelikli müşteri randevusu ayarlayan bir yapay zekâ geliştirdim. Bu müşterilerden kaçı sizin takviminizde olabilirdi?",
    end: "30 dakikalık kısa bir görüşmeye ne dersiniz? Kısa bir yanıt bile günümü güzelleştirir.",
    nositeClean: "Google'da {empresa} için bir web sitesi bulamadım. Kısa süre önce Birleşik Krallık'ta bir temizlik şirketinin sitesini yaptım; ziyaretleri randevuya dönüştüren bir WhatsApp butonu var.",
  },
  ar: {
    start: "مرحبًا! أعلم أنكم مشغولون جدًا، لذا سأدخل في الموضوع مباشرة:",
    nosite: "لم أجد موقعًا إلكترونيًا لـ {empresa} على Google، وهو أول مكان يبحث فيه معظم العملاء الجدد. أصمم مواقع حديثة خلال أيام قليلة، مع زر واتساب يحوّل الزيارات إلى حجوزات.",
    load: "اطلعت على موقع {empresa} ولاحظت أنه لا يفتح بشكل صحيح. أعيد بناء مواقع كهذه خلال أيام قليلة لتتحول الزيارات إلى عملاء بمواعيد محجوزة.",
    wa: "اطلعت على موقع {empresa} ولاحظت أنه لا توجد طريقة سريعة لمراسلتكم عبر واتساب من خلاله. أعيد بناء مواقع كهذه خلال أيام قليلة لتتحول الزيارات إلى عملاء بمواعيد محجوزة.",
    ai: "طوّرت ذكاءً اصطناعيًا يحجز كل يوم مواعيد مع عملاء مؤهلين عبر واتساب لشركات مثل شركتكم. كم من هؤلاء العملاء يمكن أن يكونوا في جدول مواعيدكم؟",
    end: "هل لديكم 30 دقيقة لمكالمة سريعة؟ حتى رد قصير سيسعدني كثيرًا.",
    nositeClean: "لم أجد موقعًا إلكترونيًا لـ {empresa} على Google. صممت مؤخرًا موقع شركة تنظيف في المملكة المتحدة، مع زر واتساب يحوّل الزيارات إلى حجوزات.",
  },
  id: {
    start: "Halo! Saya tahu Anda sangat sibuk, jadi langsung saja:",
    nosite: "saya tidak menemukan website {empresa} di Google, padahal di sanalah kebanyakan klien baru mencari pertama kali. Saya membuat website modern dalam beberapa hari, dengan tombol WhatsApp yang mengubah kunjungan jadi janji temu.",
    load: "saya melihat website {empresa} dan ternyata tidak terbuka dengan baik. Saya membangun ulang website seperti itu dalam beberapa hari agar kunjungan berubah jadi klien yang terjadwal.",
    wa: "saya melihat website {empresa} dan ternyata belum ada cara cepat untuk menghubungi Anda lewat WhatsApp dari situ. Saya membangun ulang website seperti itu dalam beberapa hari agar kunjungan berubah jadi klien yang terjadwal.",
    ai: "saya membuat AI yang setiap hari menjadwalkan klien berkualitas lewat WhatsApp untuk bisnis seperti milik Anda. Berapa banyak klien itu yang bisa masuk ke jadwal Anda?",
    end: "Bisa ngobrol 30 menit? Balasan singkat pun sudah bikin hari saya lebih senang.",
    nositeClean: "saya tidak menemukan website {empresa} di Google. Baru-baru ini saya membuat website untuk perusahaan kebersihan di Inggris, dengan tombol WhatsApp yang mengubah kunjungan jadi janji temu.",
  },
  ja: {
    start: "こんにちは！お忙しいと思うので手短に。",
    nosite: "Googleで{empresa}のウェブサイトが見つかりませんでした。新しいお客様の多くはまずGoogleで探します。WhatsAppボタン付きのモダンなサイトを数日で制作し、閲覧を予約につなげます。",
    load: "{empresa}のウェブサイトを拝見したところ、正しく表示されていないようでした。こうしたサイトを数日で作り直し、閲覧を予約につなげます。",
    wa: "{empresa}のウェブサイトを拝見したところ、WhatsAppですぐ連絡できる導線がありませんでした。こうしたサイトを数日で作り直し、閲覧を予約につなげます。",
    ai: "御社のような会社向けに、WhatsAppで毎日見込み客の予約を自動で入れるAIを作りました。そのお客様が御社のカレンダーに入るとしたら、何人になるでしょうか？",
    end: "30分ほどお話しできませんか？短いお返事だけでも嬉しいです。",
    nositeClean: "Googleで{empresa}のウェブサイトが見つかりませんでした。最近、イギリスの清掃会社のサイトを制作しました。WhatsAppボタンで閲覧を予約につなげています。",
  },
  ko: {
    start: "안녕하세요! 바쁘신 걸 알기에 짧게 말씀드릴게요.",
    nosite: "구글에서 {empresa}의 웹사이트를 찾을 수 없었어요. 새 고객 대부분은 구글에서 먼저 찾습니다. 방문을 예약으로 바꿔주는 WhatsApp 버튼이 있는 모던한 사이트를 며칠 만에 만들어 드려요.",
    load: "{empresa}의 웹사이트를 보니 제대로 열리지 않더라고요. 이런 사이트를 며칠 만에 새로 만들어 방문이 예약 고객으로 이어지게 해 드려요.",
    wa: "{empresa}의 웹사이트를 보니 WhatsApp으로 바로 연락할 방법이 없더라고요. 이런 사이트를 며칠 만에 새로 만들어 방문이 예약 고객으로 이어지게 해 드려요.",
    ai: "귀사 같은 회사를 위해 WhatsApp으로 매일 고객 예약을 잡아주는 AI를 만들었습니다. 그 고객들 중 몇 명이 귀사의 캘린더에 들어갈 수 있을까요?",
    end: "30분 정도 이야기 나눌 수 있을까요? 짧은 답장만 주셔도 정말 기쁠 것 같아요.",
    nositeClean: "구글에서 {empresa}의 웹사이트를 찾을 수 없었어요. 최근 영국의 청소 업체 사이트를 만들었는데, WhatsApp 버튼으로 방문을 예약으로 이어지게 했어요.",
  },
};

export const SIGNATURE = "Victor – NOVA.AI SOLUTIONS";

/** Brasileiro lá fora (português do Brasil): o gancho que entra depois de "então vou direto:". */
export const DIASPORA_SITE: Record<Exclude<SiteVariant, "ai"> | "nositeClean", string> = {
  nositeClean: "não achei site da {empresa} no Google. Fiz há pouco o de uma empresa de limpeza no Reino Unido, com botão de WhatsApp que transforma visita em agendamento.",
  nosite: "não achei site da {empresa} no Google, que é onde a maioria dos clientes procura primeiro. Faço site moderno em poucos dias, com botão de WhatsApp que transforma visita em agendamento.",
  load: "olhei o site da {empresa} e vi que ele não está abrindo direito. Refaço sites assim em poucos dias pra visita virar cliente agendado.",
  wa: "olhei o site da {empresa} e vi que não tem um jeito rápido de chamar vocês no WhatsApp por ele. Refaço sites assim em poucos dias pra visita virar cliente agendado.",
};

const NO_SITE_KINDS = ["nenhum", "instagram", "facebook", "agregador", "whatsapp", "delivery"];

/** Estado do site do lead (mesma regra da planilha): define qual mensagem vai. */
export function siteVariant(l: Pick<Lead, "website" | "websiteKind" | "audit">): SiteVariant {
  if (!l.website || NO_SITE_KINDS.includes(l.websiteKind ?? "")) return "nosite";
  if (l.audit && l.audit.ok === false) return "load";
  if (l.audit?.ok && l.audit.whatsappButton === false && !l.audit.socials?.whatsapp) return "wa";
  return "ai";
}

/** Empresa de limpeza (qualquer idioma): sem site, a mensagem cita o case de uma limpeza no Reino Unido, sem nome nem link. */
export { CLEANING_RX } from "./score";

export function intlMessage(lang: Lang, nome: string, variant: SiteVariant = "ai", cleaning = false) {
  if (lang === "pt") return undefined;
  const t = INTL_TEXTS[lang];
  const sep = lang === "ja" ? "" : " ";
  const mid = variant === "nosite" && cleaning ? t.nositeClean : t[variant];
  return `${t.start}${sep}${mid.replaceAll("{empresa}", nome)}\n\n${t.end}\n\n${SIGNATURE}`;
}
