import type { Lang } from "./countries";

/**
 * Primeira mensagem fora do Brasil, no idioma do país: mesmo começo ("sei que vocês são incrivelmente
 * ocupados"), a mesma pulga atrás da orelha e o mesmo final. {nome} = nome do negócio.
 * O texto é o mesmo da coluna "Mensagem" da planilha da Bia; mudou aqui, mude lá também.
 */
export const INTL_MESSAGES: Record<Exclude<Lang, "pt">, string> = {
  en: `Hi there! I know you're incredibly busy and get tons of messages, but this one takes just 20 seconds to read.

Some businesses already get qualified clients booked on WhatsApp every day, without anyone on the team touching the phone: an AI reaches out, qualifies and books straight into the calendar. I built it.

I found {nome} on Google and one question stuck with me: how many of those clients could be on your calendar?

I'd love to book a quick 30-minute call to show how this could grow your results. I understand if you're busy, but even a short reply would make my day.

Thanks, Victor – NOVA.AI SOLUTIONS`,
  es: `¡Hola! Sé que están increíblemente ocupados y reciben un montón de mensajes, pero este solo toma 20 segundos de leer.

Hay negocios que ya reciben clientes calificados y agendados por WhatsApp todos los días, sin que nadie del equipo toque el teléfono: una IA contacta, califica y agenda directo en la agenda. Yo lo construí.

Encontré {nome} en Google y me quedé con una pregunta: ¿cuántos de esos clientes podrían estar en su agenda?

Me gustaría agendar una charla rápida de 30 minutos para mostrarles cómo esto puede aumentar sus resultados. Entiendo si están ocupados, pero incluso una respuesta corta me alegraría el día.

Gracias, Victor – NOVA.AI SOLUTIONS`,
  ptpt: `Olá! Sei que estão incrivelmente ocupados e recebem imensas mensagens, mas esta leva só 20 segundos a ler.

Há negócios que já recebem clientes qualificados e marcados pelo WhatsApp todos os dias, sem ninguém da equipa tocar no telemóvel: uma IA contacta, qualifica e marca diretamente na agenda. Fui eu que a construí.

Encontrei {nome} no Google e fiquei com uma pergunta: quantos desses clientes podiam estar na vossa agenda?

Gostava de marcar uma conversa rápida de 30 minutos para mostrar como isto pode aumentar os vossos resultados. Compreendo se estiverem ocupados, mas mesmo uma resposta curta deixava-me o dia mais feliz.

Obrigado, Victor – NOVA.AI SOLUTIONS`,
  fr: `Bonjour ! Je sais que vous êtes incroyablement occupés et que vous recevez énormément de messages, mais celui-ci se lit en 20 secondes.

Certaines entreprises reçoivent déjà chaque jour des clients qualifiés avec rendez-vous sur WhatsApp, sans que personne dans l'équipe ne touche au téléphone : une IA contacte, qualifie et réserve directement dans l'agenda. C'est moi qui l'ai construite.

J'ai trouvé {nome} sur Google et une question m'est restée : combien de ces clients pourraient être dans votre agenda ?

J'aimerais organiser un échange rapide de 30 minutes pour vous montrer comment cela peut augmenter vos résultats. Je comprends si vous êtes occupés, mais même une réponse courte me ferait très plaisir.

Merci, Victor – NOVA.AI SOLUTIONS`,
  de: `Hallo! Ich weiß, dass Sie unglaublich beschäftigt sind und viele Nachrichten bekommen, aber diese hier liest sich in 20 Sekunden.

Manche Unternehmen bekommen schon jeden Tag qualifizierte Kunden mit Termin über WhatsApp, ohne dass jemand im Team zum Handy greift: Eine KI nimmt Kontakt auf, qualifiziert und trägt den Termin direkt in den Kalender ein. Ich habe das gebaut.

Ich habe {nome} bei Google gefunden und mich gefragt: Wie viele dieser Kunden könnten in Ihrem Kalender stehen?

Ich würde gern ein kurzes 30-minütiges Gespräch vereinbaren, um Ihnen zu zeigen, wie das Ihre Ergebnisse steigern kann. Ich verstehe, wenn Sie viel zu tun haben, aber schon eine kurze Antwort würde mich sehr freuen.

Danke, Victor – NOVA.AI SOLUTIONS`,
  it: `Ciao! So che siete incredibilmente impegnati e ricevete tantissimi messaggi, ma questo si legge in 20 secondi.

Alcune attività ricevono già ogni giorno clienti qualificati con appuntamento su WhatsApp, senza che nessuno del team tocchi il telefono: un'IA contatta, qualifica e fissa l'appuntamento direttamente in agenda. L'ho costruita io.

Ho trovato {nome} su Google e mi è rimasta una domanda: quanti di questi clienti potrebbero essere nella vostra agenda?

Mi piacerebbe fissare una chiamata veloce di 30 minuti per mostrarvi come questo può aumentare i vostri risultati. Capisco se siete impegnati, ma anche una risposta breve mi renderebbe la giornata più felice.

Grazie, Victor – NOVA.AI SOLUTIONS`,
  ja: `こんにちは！お忙しく、毎日たくさんのメッセージが届いていると思いますが、このメッセージは20秒で読めます。

すでに毎日、見込みの高いお客様の予約をWhatsAppで受けている会社があります。スタッフが電話に触れることなく、AIが連絡し、見込みを判断し、そのままカレンダーに予約を入れます。私が作りました。

Googleで{nome}を見つけて、ひとつ気になりました。そのお客様のうち、何人が御社のカレンダーに入っていたでしょうか？

30分ほどの短いオンライン面談で、どのように成果を伸ばせるかご紹介できれば嬉しいです。お忙しいところ恐縮ですが、短いお返事だけでもいただけたら幸いです。

ありがとうございます。Victor – NOVA.AI SOLUTIONS`,
  ko: `안녕하세요! 정말 바쁘시고 메시지도 많이 받으시겠지만, 이 메시지는 20초면 읽으실 수 있어요.

이미 매일 WhatsApp으로 검증된 고객 예약을 받는 회사들이 있습니다. 직원이 휴대폰을 만지지 않아도 AI가 연락하고, 고객을 선별하고, 바로 캘린더에 예약을 잡아요. 제가 직접 만들었습니다.

Google에서 {nome}을(를) 보고 한 가지 궁금해졌어요. 그 고객들 중 몇 명이 귀사의 캘린더에 들어갈 수 있었을까요?

30분 정도 짧게 이야기 나누며 이것이 어떻게 성과를 높일 수 있는지 보여드리고 싶습니다. 바쁘신 건 이해하지만, 짧은 답장만 주셔도 정말 기쁠 것 같아요.

감사합니다, Victor – NOVA.AI SOLUTIONS`,
};

export function intlMessage(lang: Lang, nome: string) {
  if (lang === "pt") return undefined;
  return INTL_MESSAGES[lang].replaceAll("{nome}", nome);
}
