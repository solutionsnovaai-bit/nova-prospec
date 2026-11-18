import type { Lang } from "./countries";

/**
 * Primeira mensagem fora do Brasil, no idioma do país: mesmo começo ("sei que vocês são incrivelmente
 * ocupados"), a mesma pulga atrás da orelha e o mesmo final. {nome} = nome do negócio.
 * O texto é o mesmo da coluna "Mensagem" da planilha da Bia; mudou aqui, mude lá também.
 */
export const INTL_MESSAGES: Record<Exclude<Lang, "pt">, string> = {
  en: `Hi there! I know you're incredibly busy, so I'll be quick: I built an AI that books qualified clients on WhatsApp every day for businesses like yours. How many of those clients could be on your calendar?

Up for a quick 30-min call? Even a short reply would make my day.

Victor – NOVA.AI SOLUTIONS`,
  es: `¡Hola! Sé que están increíblemente ocupados, así que voy directo: creé una IA que agenda clientes calificados por WhatsApp todos los días para negocios como el suyo. ¿Cuántos de esos clientes podrían estar en su agenda?

¿Charlamos 30 min? Incluso una respuesta corta me alegraría el día.

Victor – NOVA.AI SOLUTIONS`,
  ptpt: `Olá! Sei que estão incrivelmente ocupados, por isso vou direto: criei uma IA que marca clientes qualificados pelo WhatsApp todos os dias para negócios como o vosso. Quantos desses clientes podiam estar na vossa agenda?

Conversamos 30 min? Mesmo uma resposta curta deixava-me o dia mais feliz.

Victor – NOVA.AI SOLUTIONS`,
  fr: `Bonjour ! Je sais que vous êtes très occupés, alors je vais droit au but : j'ai créé une IA qui prend chaque jour des rendez-vous qualifiés sur WhatsApp pour des entreprises comme la vôtre. Combien de ces clients pourraient être dans votre agenda ?

On en parle 30 min ? Même une réponse courte me ferait plaisir.

Victor – NOVA.AI SOLUTIONS`,
  de: `Hallo! Ich weiß, Sie sind sehr beschäftigt, deshalb kurz: Ich habe eine KI gebaut, die für Unternehmen wie Ihres jeden Tag qualifizierte Termine über WhatsApp vereinbart. Wie viele dieser Kunden könnten in Ihrem Kalender stehen?

Kurzes 30-Minuten-Gespräch? Schon eine kurze Antwort würde mich freuen.

Victor – NOVA.AI SOLUTIONS`,
  it: `Ciao! So che siete molto impegnati, quindi vado dritto al punto: ho creato un'IA che fissa ogni giorno appuntamenti qualificati su WhatsApp per attività come la vostra. Quanti di questi clienti potrebbero essere nella vostra agenda?

Ne parliamo in 30 minuti? Anche una risposta breve mi renderebbe felice.

Victor – NOVA.AI SOLUTIONS`,
  ja: `こんにちは！お忙しいと思うので手短に。御社のような会社向けに、WhatsAppで毎日見込み客の予約を自動で入れるAIを作りました。そのお客様が御社のカレンダーに入るとしたら、何人になるでしょうか？

30分ほどお話しできませんか？短いお返事だけでも嬉しいです。

Victor – NOVA.AI SOLUTIONS`,
  ko: `안녕하세요! 바쁘신 걸 알기에 짧게 말씀드릴게요. 귀사 같은 회사를 위해 WhatsApp으로 매일 고객 예약을 잡아주는 AI를 만들었습니다. 그 고객들 중 몇 명이 귀사의 캘린더에 들어갈 수 있을까요?

30분 정도 이야기 나눌 수 있을까요? 짧은 답장만 주셔도 정말 기쁠 것 같아요.

Victor – NOVA.AI SOLUTIONS`,
};

export function intlMessage(lang: Lang, nome: string) {
  if (lang === "pt") return undefined;
  return INTL_MESSAGES[lang].replaceAll("{nome}", nome);
}
