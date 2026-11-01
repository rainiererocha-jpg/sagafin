# Agente de Trading · Destaques de Trading Sagafin

Agente que lê a tastytrade quatro vezes por dia de pregão, monta candidatos por regras mecânicas,
pede à IA que selecione e redija **estudos educacionais** e publica na página `/trading`.
Nunca envia ordens. Nunca publica cotação bruta em tempo real.

## Arquitetura

```
GitHub Actions (.github/workflows/trading-agent.yml) — 2 crons UTC cobrem EDT/EST; o script só roda na janela certa
  └─ scripts/trading-agent/index.mjs
       tasty.mjs      OAuth2 (refresh token) → market-metrics, cadeias nested, watchlists, instruments, conta
       dxlink.mjs     cotações/greeks via WebSocket DXLink (uma sessão curta por slot)
       brasil.mjs     /api/quotes do site (BCB, câmbio, B3) + Yahoo (histórico 1 ano, VIX, S&P) → prêmio/desconto ADR
       calc.mjs       expected move (fórmula tasty), vencimento por horizonte, strikes por delta, estruturas, POP, risco
       screen.mjs     pré-triagem por interesse + candidatos por horizonte (regras, sem IA)
       llm.mjs        Sonnet 5.5 escolhe ≤5 (1 por horizonte) → Opus 5.5 redige → compliance (regex) → Zod-like validação
       publish.mjs    market_snapshots, trade_studies, trade_study_marks (mark-to-market), encerramentos, account_snapshots, trading_runs, post no blog
       screenshot.mjs (opcional, PLAYWRIGHT=on) gráfico da plataforma web → Storage trading-charts
Supabase: supabase/migrations/20261029_trading_destaques.sql e 20261029_trading_contexto.sql
Site: src/pages/Trading.tsx, src/pages/TradingStudy.tsx, src/components/trading/*, src/lib/tradingClient.ts, src/pages/admin/Trading.tsx, api/trading-run.js
```

## Slots (horário de Nova York)

| Slot | Alvo | Janela aceita | Cron UTC (EDT) | Cron UTC (EST) |
|---|---|---|---|---|
| pre_open | 09:20 | 08:45–09:45 | 13:20 | 14:20 |
| mid_morning | 11:20 | 10:45–11:45 | 15:20 | 16:20 |
| mid_afternoon | 14:20 | 13:45–14:45 | 18:20 | 19:20 |
| post_close | 16:20 | 16:05–17:00 | 20:20 | 21:20 |

O workflow tem os dois conjuntos de crons; o que cair fora da janela sai sem fazer nada. Feriados da NYSE em
`scripts/trading-agent/config/feriados-nyse.json` (atualizar todo ano). Idempotência por `(trade_date, slot)` em `market_snapshots`.

## Secrets (GitHub → Settings → Secrets → Actions)

| Nome | Obrigatório | Onde obter |
|---|---|---|
| `TASTY_CLIENT_ID`, `TASTY_CLIENT_SECRET`, `TASTY_REFRESH_TOKEN` | sim | my.tastytrade.com → Manage → API Access → criar OAuth app (escopo `read`) → gerar refresh token |
| `ANTHROPIC_API_KEY` | sim | já usado pelo Diário Saga |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | sim | já usados pelo Diário Saga |
| `TASTY_USERNAME`, `TASTY_PASSWORD`, `TASTY_TOTP_SECRET` ou `TASTY_STORAGE_STATE` | não | só para o módulo Playwright (experimental; pode violar o EULA da corretora) |

Na Vercel (para o botão "Rodar agora" em `/admin/trading`): `GITHUB_TOKEN` (fine-grained, permissão *Actions: write* no repo),
`GITHUB_REPO` (`rainiererocha-jpg/sagafin`), `SUPABASE_ANON_KEY` (ou `VITE_SUPABASE_ANON_KEY`), `ADMIN_ALLOWED_EMAILS` (opcional).

## Rodar localmente

```bash
cp .env.example .env   # preencha TASTY_*, ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
set -a; source .env; set +a
DRY_RUN=true FORCE_RUN=true SLOT=post_close node scripts/trading-agent/index.mjs
```

`DRY_RUN=true` imprime candidatos e estudos sem gravar nada (chama a Anthropic, custa centavos). `FORCE_RUN=true` ignora janela/feriado.
`SKIP_ACCOUNT=true` não lê a conta. `MAX_CHAINS=8` reduz o número de cadeias de opções baixadas.

No GitHub: *Actions → Agente de Trading → Run workflow* com `dry_run` marcado para o primeiro teste.

## Regras do agente (resumo)

- Universo: `config/universe.json` ∪ watchlists privadas da conta; filtro `liquidity_rating ≥ 3` (ETFs core passam mesmo sem nota).
- Venda de prêmio só com IV rank ≥ 30 e IVx > HV30; debit spreads com IV rank ≤ 20; sem balanço dentro do DTE (exceto horizonte diário).
- Vencimentos: diário 0–5 DTE (estudo de evento), semanal 6–16, mensal 28–60 (alvo 45), semestral 90–220; longo prazo = ações/ETFs por tendência (MM200, retorno 6–12 m) e desconto de ADR.
- Strikes: delta 25 em spreads, delta 16 em condors/strangles, delta 30 em covered calls; largura ≈ 2,5% do spot.
- Limites: 8 candidatos por horizonte, 5 estudos por slot, 1 estudo novo por horizonte por dia (diário pode renovar por slot), nunca dois abertos no mesmo símbolo+horizonte.
- Encerramento automático: 50% do lucro máximo, invalidação (preço cruza o nível), vencimento ou fim do horizonte. Resultado hipotético = P&L / risco máximo (opções) ou variação do preço (ações), sem custos.

## Compliance

- `scripts/lib/compliance.mjs`: `PROIBIDAS` + `PROIBIDAS_TRADING` (imperativos de execução). Qualquer ocorrência em título, tese, cenários, invalidação ou gestão reprova o estudo; o run segue, mas aquele estudo não é publicado.
- Linguagem: "estudo", "hipótese", "a estrutura ganha se / perde se". Nunca "compre", "venda", "monte", "entre", "preço-alvo".
- A página pública mostra só métricas derivadas e preços de referência arredondados com horário; posições e saldo ficam em `/admin/trading`.
- Assessor de investimentos (Res. CVM 178/23) não pode recomendar nem emitir relatório de análise (Res. CVM 20). Se o conteúdo passar a ser cobrado, assinado como recomendação ou distribuído com habitualidade comercial, é preciso um analista CNPI responsável e revisão jurídica. Os dados da tastytrade/NYSE são licenciados para uso pessoal: a página publica análise derivada, não redistribui cotações.

## Custos estimados

Por execução: ~1 chamada Sonnet 5.5 (≈10–20k tokens de entrada) + 1 chamada Opus 5.5 (≈6–10k entrada, 3–5k saída) ≈ US$ 0,15–0,35. Quatro execuções por dia ≈ US$ 0,6–1,4/dia. O valor fica em `trading_runs.cost_usd_estimate`.

## Lições do primeiro run real (28/10/2026)

O primeiro `post_close` real rodou com sucesso, mas publicou só um estudo (JKS, longo prazo, confiança baixa). A leitura do snapshot mostrou cinco defeitos, corrigidos em seguida:

| Defeito | Efeito | Correção |
|---|---|---|
| `historical-volatility-30-day` vem em **percentual** (84,5) e `implied-volatility-index` em **decimal** (0,43) | `ivx > hv30` nunca era verdadeiro: zero estudos de venda de prêmio | `tasty.mjs` normaliza HV e `iv-hv-30-day-difference` para decimal |
| PBR = **2** ações PETR3 por ADR | prêmio do ADR calculado em +100% | `universe.json`: `ratio: 2` em PBR e PBR.A |
| Watchlists da conta somavam ~300 símbolos | universo de 348 nomes, candidatos exóticos | só entram até `max_watchlist` (40) com liquidez ≥ 3 |
| Longo prazo ignorava balanço iminente | estudo publicado dois dias antes do resultado | exclui símbolos com balanço em até `earnings_dias_longo_prazo` (7) dias; reversão à média só em nome do núcleo/ADR com liquidez 4 |
| `price-earnings-ratio = -99999.99` | sentinela aparecia como P/E | vira `null` |

A triagem também passou a priorizar EWZ/ADR com POP teórica ≥ 65% e liquidez 4, e o prompt prefere venda de prêmio com risco definido a estudos de ações de baixa confiança.

## Painel "Exterior em foco" (EWZ e dólar)

Primeira dobra de `/trading`. Dados em `api/trading-panel.js` (função Vercel, cache de borda de 15 minutos; cada fonte falha isolada):

- **Yahoo Finance**: séries diárias de 1 ano de `EWZ`, `BRL=X`, `^BVSP`, `^GSPC` → preço, variações, MM200, 52 semanas, vol. realizada 30 d, base 100 (S&P 500 convertido em reais × Ibovespa × EWZ × dólar), correlações de retornos diários e quantos meses de queda do Ibovespa tiveram alta do dólar.
- **BCB – Expectativas de Mercado (Focus)** via Olinda (`ExpectativasMercadoAnuais`, `baseCalculo eq 0`): mediana de Câmbio, Selic e IPCA para fim de 2026 e 2027, sempre exibida com a data da pesquisa e o número de instituições. Licença ODbL: citar "Fonte: BCB – Expectativas de Mercado (Focus)". É a única "projeção" do painel; o site não faz projeção própria.
- **BCB SGS**: Selic (432) e CDI (4389).
- **Snapshot do agente** (`trading_contexto()`): IV rank e IVx de EWZ → cone teórico de 30 dias, `preço × IV × √(dias/365)`, 1σ e 2σ, rotulado como faixa implícita nas opções e não projeção de preço.

Números estáticos do bloco "Por que olhar para fora" e suas fontes: Brasil = 0,25% do MSCI ACWI IMI (jun/2026); piso de 16% no exterior (FGVcef, set/2026); fundos locais com exposição externa ≈ 15% do patrimônio (jul/2026). Revisar a cada semestre.

CTA principal: WhatsApp do assessor com mensagem pré-preenchida sobre investir no exterior pela XP. CTA secundário: cadastro no Diário Saga (libera os estudos). Rodapé com aviso de remuneração por distribuição (Res. CVM 179/23).
