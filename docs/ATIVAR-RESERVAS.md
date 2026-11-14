# Ativar as reservas do Nova Prospec

A configuração principal de IA e a ElevenLabs foram preservadas. Esta atualização não cria contas, não adiciona saldo e não instala aplicativos no computador.

## IA — configuração em poucos minutos

1. Abra **Ajustes → Chaves**.
2. Mantenha a chave Groq existente. Crie uma chave [OpenRouter](https://openrouter.ai/settings/keys) e outra [Gemini](https://aistudio.google.com/apikey); cole nos campos correspondentes e salve. No Google use um projeto **Free Tier**. A integração não consegue identificar se a conta tem faturamento habilitado; a mesma chamada pode custar dinheiro numa conta paga.
3. Mantenha seu modelo principal. Deixe **Trocar automaticamente de IA quando falhar** marcado.

Sequência: principal atual → Groq GPT-OSS 20B → OpenRouter `openrouter/free` → Gemini `gemini-3.5-flash-lite`. Só entram provedores com chave. Modelos repetidos são ignorados. Erro de rede, falta de saldo, limite, indisponibilidade ou resposta JSON inválida acionam a próxima opção, dentro de um prazo total.

Kimi/Moonshot e endpoint personalizado seguem disponíveis como principal; não entram automaticamente como reservas pagas. Pedidos que exigem pesquisa nativa na web mantêm o provedor original para não fingir que houve pesquisa. O copiloto usa suas ferramentas de pesquisa e pode alternar normalmente.

## Voz — sem instalar nada primeiro

1. [Crie a chave Fish Audio](https://fish.audio/app/api-keys).
2. No Fish, crie/escolha uma voz e copie o ID de referência. [Guia oficial de clonagem](https://docs.fish.audio/features/voice-cloning).
3. Em Ajustes, salve a chave Fish e preencha **Reservas de voz → ID da voz Fish Audio**.
4. Use a fala do assistente. ElevenLabs continua em primeiro lugar; Fish só é chamado se ela falhar. A resposta HTTP indica o provedor no cabeçalho `x-voice`.

O código chama exclusivamente `s2.1-pro-free`; nunca muda silenciosamente para um modelo Fish pago. Oferta anunciada até **30/11/2026**, sujeita a uso justo, sem garantia de latência. Quando indisponível, segue para VoiceStudio/navegador. Não usamos LMNT; a antiga chave salva não é apagada.

## VoiceStudio — opcional, instalação intermediária

- [Baixar instalador oficial para seu sistema](https://github.com/debpalash/VoiceStudio/releases/latest).
- Instale, abra e baixe um modelo pelo próprio aplicativo; depois crie a voz. O volume de download e a velocidade dependem do modelo/hardware.
- [Guia de API privada](https://github.com/debpalash/VoiceStudio/blob/main/docs/production-private-api.md).
- Em Ajustes, configure chave, URL, ID da voz e modelo. A chave corresponde à `OMNIVOICE_API_KEY` do serviço. Modelo inicial `omnivoice`; confirme o identificador disponível na sua instalação.
- O servidor do Nova Prospec precisa alcançar a URL. **localhost na Vercel não é seu PC**. Para uso remoto, precisa de acesso HTTPS autenticado; não basta abrir a porta 3900 publicamente. Se o computador desligar, essa reserva deixa de responder.

A integração usa `/v1/audio/speech` para fala e `/v1/audio/transcriptions` para transcrição. Transcrição: Groq → VoiceStudio. Fala: ElevenLabs → Fish → VoiceStudio → voz do navegador (sem clonagem).

## Os nove projetos enviados

| Projeto | Como começar | Dificuldade / decisão |
|---|---|---|
| [VoiceStudio](https://github.com/debpalash/VoiceStudio) | Instalador nas Releases; API opcional | Média; integração preparada nesta atualização |
| [OpenWhispr](https://github.com/OpenWhispr/openwhispr) | Instalador nas Releases; configurar modelo local ou API | Baixa/média; ditado no computador |
| [Cap](https://github.com/CapSoftware/Cap) | Aplicativo de gravação; consultar opções de download no README | Baixa; demonstrações comerciais, não reserva de IA |
| [AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) | Aplicativo desktop; servidor colaborativo é outra instalação | Baixa no desktop; organização externa |
| [Open Generative AI](https://github.com/Anil-matcha/Open-Generative-AI) | Seguir README; configurar API ou modelos locais | Média/alta; código aberto não torna APIs gratuitas |
| [OpenSEO](https://github.com/every-app/open-seo) | Docker ou Cloudflare + chave DataForSEO | Média; dados pagos, não instalado |
| [OpenProject](https://github.com/opf/openproject) | Servidor/Docker conforme documentação oficial | Alta; gestão posterior à venda |
| [Chatwoot](https://github.com/chatwoot/chatwoot) | Servidor com banco e serviços; integrar canais | Alta; atendimento futuro, canais podem ter custos |
| [Cal.diy](https://github.com/calcom/cal.diy) | Hospedagem própria seguindo README | Alta; mantenedores recomendam uso pessoal, fora de produção |

Não é necessário instalar os nove para utilizar as reservas. Para começar agora bastam as chaves OpenRouter/Gemini/Fish e o ID da voz Fish.

## Verificação e limites desta entrega

Testes automatizados simulam falhas reais de protocolo/rede, troca entre provedores, JSON inválido, falta de chave, voz e transcrição, além de diagnóstico e identidade de empresas. Não foram usadas chaves de produção nem realizadas clonagens/gerações faturáveis. A latência/qualidade real depende de um teste com suas contas e voz.

A deduplicação é conservadora: nome, telefone e endereço iguais; não migra nem apaga duplicatas antigas. Orçamento do copiloto limita chamadas de ferramentas; ainda não é um controle financeiro global nem um contador atômico de quotas entre instâncias. Não substitui os limites da conta do provedor.
