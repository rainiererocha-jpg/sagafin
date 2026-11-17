# Motor social diário + funil "comente EU QUERO"

Transforma o conteúdo que já existe (Diário Saga, Biblioteca, Destaques de Trading) em carrossel + stories + legendas para
Instagram, Facebook e LinkedIn, com aprovação em 1 clique, e leva quem comenta **EU QUERO / MANUAL / GUIA** até o
**Manual Completo do Investidor** (`/manual`), capturando nome, e-mail, WhatsApp e faixa de patrimônio.

```
Diário Saga (09:10) ─┐
Biblioteca (ter/qui) ├─► scripts/social-diario.mjs (09:40) ─► Claude (JSON) ─► compliance ─► PNG (Playwright)
Trading (sex) ───────┘                                      ─► Supabase Storage + pending_approvals ─► e-mail de aprovação
                                                                                                     │
                       api/aprovar-post.js  ◄── clique "Aprovar" ◄──────────────────────────────────┘
                              │ Blotato: carrossel IG + FB + LinkedIn agora; 4 stories IG de 3 em 3 h
                              ▼
   comentário "EU QUERO" ─► supabase/functions/meta-webhook ─► DM com link /manual?utm… + resposta pública
                              ▼
   /manual (ManualPage) ─► leads (source manual-investidor, UTM) ─► api/manual-enviar (PDF por e-mail) + Diário Saga
                              ▼
   segunda 08:17 ─► scripts/social-relatorio.mjs ─► ranking de peças por leads (v_conversao_posts)
```

## Calendário editorial (`scripts/social/pilares.mjs`)
| Dia | Carrossel | Stories |
|---|---|---|
| Seg, Qua | Diário Saga (mercado do dia) | 2 dados + 1 insight + CTA |
| Ter, Qui | Tema evergreen da Biblioteca (rodízio de 13 temas, um capítulo do manual cada) | idem |
| Sex | Resumo dos Destaques de Trading (cai para o Diário se não houver) | idem |

Peças de mercado expiram às 11h do mesmo dia; evergreen fica 3 dias na fila. Nada vai ao ar sem aprovação.

## Configuração (uma vez)

### 1. Banco
Aplicar `supabase/migrations/20261117_motor_social.sql` no projeto `vcmnfnsjgfbudypewvjx` (SQL Editor ou `supabase db push`).
Cria colunas na `pending_approvals`, a tabela `social_dm_events`, o bucket público `social` e a view `v_conversao_posts`.

### 2. Blotato
1. Conectar no Blotato: Instagram, **página do Facebook** e LinkedIn.
2. Gerar a API key em Settings → API.
3. Descobrir os ids: `curl -H "blotato-api-key: $KEY" https://backend.blotato.com/v2/users/me/accounts`
   (para o Facebook, também o `pageId` da página).

### 3. Secrets
**GitHub (Settings → Secrets → Actions):** `APROVADOR_EMAIL` (quem recebe a prévia). Os demais (`ANTHROPIC_API_KEY`,
`RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) já existem por causa do Diário.

**Vercel (projeto sagafin → Environment Variables):** `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `BLOTATO_API_KEY`,
`BLOTATO_IG_ACCOUNT_ID`, `BLOTATO_FB_ACCOUNT_ID`, `BLOTATO_FB_PAGE_ID`, `BLOTATO_LI_ACCOUNT_ID`, opcional `BLOTATO_LI_PAGE_ID`
(página de empresa) e `BLOTATO_FB_STORIES=on` (stories também no Facebook).

### 4. Comentário → DM (app Meta)
1. Criar um app em developers.facebook.com (tipo Business) ligado à página do Facebook e à conta profissional do Instagram.
2. Produtos: **Webhooks** + **Messenger** + **Instagram**.
3. Permissões: `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`, `pages_show_list`,
   `pages_read_engagement`, `pages_manage_engagement`, `pages_messaging`.
4. Publicar a função: `supabase functions deploy meta-webhook --no-verify-jwt`.
5. Secrets da função: `supabase secrets set META_APP_SECRET=… META_VERIFY_TOKEN=… META_PAGE_ID=… META_PAGE_TOKEN=… META_IG_USER_ID=…`
   (`META_PAGE_TOKEN` = token de página de longa duração).
6. Webhooks: URL `https://vcmnfnsjgfbudypewvjx.supabase.co/functions/v1/meta-webhook`, token = `META_VERIFY_TOKEN`.
   Assinar `instagram → comments` e `page → feed`.
7. **App Review**: pedir acesso avançado às permissões acima. Sem isso, a DM só funciona para contas com papel no app.
   Na submissão: gravar um vídeo comentando "EU QUERO" num post e recebendo a DM, e explicar que a mensagem é enviada só
   para quem pediu, uma vez por comentário (private reply).

Até o App Review sair, o funil funciona pelo link nas legendas, nos stories e na bio (`sagafin.com.br/manual`).

### 5. Manual
`node scripts/generate-manual-investidor.cjs` (precisa do Playwright) regera o PDF e a imagem OG a partir de
`scripts/manual-investidor/conteudo.cjs`. **Revisar o texto a cada mudança de regra tributária.**

## Operação
- **Testar sem publicar:** Actions → Motor Social → Run workflow → `dry_run` marcado. Os PNG/JSON ficam no artefato `saida-social`.
- **Localmente:** `DRY_RUN=true FORCE_RUN=true PILAR=mercado node scripts/social-diario.mjs` (precisa de `ANTHROPIC_API_KEY`
  e Supabase), ou com `FIXTURE=conteudo.json` para testar só o visual.
- **Testes:** `node --test scripts/social/social.test.mjs`.
- **Fila antiga:** os 11 itens `pending` de julho (pipeline Python local antigo) podem ser arquivados com
  `update pending_approvals set status='archived' where status='pending' and created_at < '2026-08-01';`.

## Atribuição
- Link da legenda/stories: `utm_content` = 8 primeiros caracteres do id da peça (`pending_approvals.utm_content`).
- Link da DM: `utm_source=instagram-dm|facebook-dm`, `utm_content` = id da mídia comentada.
- `v_conversao_posts` junta peça → DMs → leads (e leads com R$ 100 mil+).

## Compliance
Todo texto passa por `checarCompliance()` (`scripts/lib/compliance.mjs`) e o prompt proíbe recomendação, preço-alvo e números
que não estejam na fonte. Toda legenda termina com "Conteúdo educacional. Não é recomendação de investimento."
