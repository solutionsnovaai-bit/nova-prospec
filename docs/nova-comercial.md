# Nova AI Solutions — operação comercial

Atualização: 15/11/2026. Cenários preparados e desligados; nenhuma campanha foi disparada nesta montagem.

## Quatro cenários

| Cenário | Função | Situação |
| --- | --- | --- |
| 7043326 — 01 Entrada e revisão | Recebe contato e proposta por chamada sob demanda, deduplica pela chave de contato e salva em revisão | Configurado; entrada do Prospect ainda não ligada |
| 7043336 — 02 Disparo aprovado | Gmail individual; reserva antes de enviar, salva thread e bloqueia repetição de envio incerto | Configurado; 1 contato/30 min, seg–sex 9–17h |
| 7043354 — 03 Respostas e avisos | Relaciona resposta à thread enviada, bloqueia próximos contatos e avisa Victor | Configurado; escolher início do gatilho no editor |
| 7044175 — 04 Agenda e avisos | Monitora alterações de eventos com **Nova AI Solutions** no título e avisa Victor | Configurado; escolher início do gatilho no editor |

Respostas e Agenda verificam a cada 30 minutos, 8–22h. Eventos fora da janela serão processados na próxima janela. A fila de Agenda usa chave de evento + atualização para impedir reenvio automático da mesma versão. Um erro depois da reserva exige revisar `aviso_pendente`; não há promessa de entrega exatamente uma vez.

Os antigos rascunhos de WhatsApp, diagnóstico e recuperação foram removidos. Bruna, Anália e Júlia não foram alteradas.

## Identidade e destinos

- Gmail verificado: solutions.nova.ai@gmail.com. As conexões Gmail/Calendar têm rótulos antigos de Diferencial, mas a conta autenticada é a da Nova. Seus rótulos não foram alterados para preservar os cenários existentes.
- Destino WhatsApp solicitado: 5511951007967. Ainda **não conectado** aos novos cenários.
- Número de envio pretendido: final 3991. Número completo e migração da Júlia ainda precisam ser confirmados. Não reutilizar o canal da Interconectar antes da separação.
- Supabase: conexão solicitada, ainda não autorizada. Fila temporária: data store Make 201977 (1 MB). **Não é sincronização com o Supabase do Prospect.** Migrar fila e identificadores após conectar o projeto correto, sem rodar duas filas simultaneamente.

## Antes de ativar

1. Autorizar a conexão Supabase solicitada no Make para o projeto do Prospect e confirmar tabela/RLS compatível. Não enviar chaves no chat.
2. Confirmar número completo final 3991 e conectar canal exclusivo da Nova depois da migração da Júlia. Acrescentar a rota WhatsApp no cenário 02 e a recepção de respostas/agendamentos no 03, com amostra real de webhook e deduplicação por ID da mensagem.
3. Abrir os gatilhos dos cenários 03/04 e selecionar **A partir de agora**. A integração aceitou a configuração mas não persistiu o cursor, e retornou aviso. Não ativar sem corrigir esse ponto no editor.
4. Entrada: obrigatório empresa, canal (`email` ou `whatsapp`), origem e mensagem. Contato válido conforme canal. A entrada nunca aprova automaticamente. Revisar assunto e proposta antes de alterar `status` para `pendente` e `aprovado` para `true`. Bloqueio/descadastro prevalece.
5. Validar um contato controlado do Victor, inclusive recebimento do aviso e registro da thread, antes de usar uma lista real. Neste trabalho o único teste Make executado foi consulta Gmail sem envio.
6. Eventos comerciais da Agenda precisam conter **Nova AI Solutions** no título. O cenário 04 avisa; não cria reservas, não verifica disponibilidade e não confirma reuniões a partir de uma resposta vaga. Integração de agendamento pelo WhatsApp permanece pendente do canal/webhook.

As respostas são encaminhadas para revisão, sem classificá-las automaticamente como positivas. Uma resposta isolada ou uma mensagem automática não confirma interesse. A classificação semântica e marcação automática de horário não estão implementadas nesta versão.

## Radar e prévias

Cada resultado tem **Produtos e prévia**: ideias por segmento, pergunta para validar necessidade, mensagem copiável, foto da busca quando disponível e PNG conceitual. Empresas com site podem ter oportunidade de catálogo, agenda, orçamento, painel de pedidos ou CRM. Sistemas internos ausentes nunca são inferidos apenas do perfil público. O Score digital continua medindo presença digital; não mede necessidade de sistemas internos.

O PNG é montado no navegador, sem créditos de IA ou operações Make. Não é um site/sistema funcional. As fotos da fonte são exibidas separadamente, com link, e não são copiadas para a proposta.

**Tentar imagem IA grátis** usa a chave OpenRouter já salva. Verifica o preço do endpoint do modelo `recraft/recraft-v4.1-flash-v2:free` antes de gerar uma imagem, fixa o provedor gratuito e não faz fallback pago. Se preço/cota/modelo não puderem ser confirmados, encerra e preserva a opção PNG. O catálogo anuncia retirada em 28/11/2026; esta função é opcional e não sustenta os disparos. Não foi feito teste de geração com a chave real nesta entrega.

## Validação

- 30 testes automatizados: voz, fallback, sugestões, URLs e bloqueio de geração paga.
- TypeScript e build Next aprovados.
- Verificação visual com Chromium não executada: o ambiente bloqueou o socket necessário para iniciar o navegador. Revisar a tela no celular após publicação.
- Fish: modo `balanced`, preservando voz/modelo e orçamento de timeout; fallback de compatibilidade somente em 400/422. Nenhuma medição de latência no telefone foi realizada.
