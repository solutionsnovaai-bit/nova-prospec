# Nova Prospec

Painel pessoal de prospecção: acha pequenos comércios no Google Maps, audita o site de cada um, mede a dor (sem site, site fraco, Instagram fraco, não anuncia, sem cardápio ou loja) e organiza quem abordar pelo WhatsApp. Uma IA integrada analisa o negócio e indica a peça visual para mostrar.

## Abas

- **Visão**: quem abordar hoje, funil e mapa de dor por nicho.
- **Radar**: busca por nicho e bairro (SerpApi → Serper → OpenStreetMap), auditoria automática dos sites e score.
- **Leads**: base com filtros por dor, nicho, score e status; visão em funil; exportar CSV.
- **Abordar**: fila do dia com a mensagem pronta; abre a conversa no seu WhatsApp, um por um.
- **IA**: copiloto que busca, consulta e analisa a base.
- **Ajustes**: chaves, modelo da IA, mensagem base e limite diário.

## Variáveis de ambiente (Vercel)

| Variável | Para quê |
| --- | --- |
| `GROQ_API_KEY` | IA (Kimi, Qwen, GPT-OSS) |
| `SERPAPI_KEY` | Google Maps, 250 buscas grátis por mês |
| `SERPER_KEY` | Google Maps e busca, 2.500 créditos grátis |
| `SUPABASE_URL`, `SUPABASE_KEY`, `NP_DB_SECRET` | banco (ou `DATABASE_URL` de qualquer Postgres) |
| `SESSION_SECRET` | assinatura do login |

As chaves também podem ser coladas em Ajustes. Sem banco, os dados ficam em arquivo temporário.

## Rodar

```
npm install
npm run dev
```
