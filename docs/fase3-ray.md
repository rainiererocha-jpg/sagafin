# Fase 3: RAY no WhatsApp

Este guia explica o que foi construído para o RAY (o assistente de inteligência artificial da Saga Financeira), quais senhas e chaves precisam ser criadas, em que ordem colocar tudo no ar e como testar antes de o número definitivo (TIM) ficar pronto.

Nada disso foi publicado ainda. Os arquivos estão prontos no projeto, mas nenhuma migração foi aplicada, nenhuma função foi enviada ao Supabase e nenhuma mensagem foi disparada.

## 1. O que cada peça faz

| Peça | O que faz, em português simples |
|---|---|
| **Banco do RAY** (`20261023_ray_core.sql`) | Cria as "gavetas" do RAY: uma conversa por telefone, as 5 personas (educador, perfil, mercado, agenda, novo contato), as fichas de conhecimento, o registro de tudo que o RAY respondeu e os agendamentos. Só você (logado no admin) lê; o público não tem acesso a nada. |
| **ray-webhook** | A "porta de entrada": recebe cada mensagem que chega no número do WhatsApp. Confere que a mensagem veio mesmo da Meta, trata PARAR e SIM antes de qualquer coisa, guarda a conversa e liga o telefone ao cliente da sua lista. Se a conversa estiver em modo humano, só registra e não responde. |
| **ray-agent** | O cérebro. Escolhe a persona pelo assunto, busca as fichas de conhecimento parecidas com a pergunta, lê o Diário do dia e as cotações quando o assunto é mercado, e escreve a resposta. Antes e depois, passa pelo guarda-corpo. |
| **Guarda-corpo** (`guarda.ts`) | Regras em código, não só no texto do prompt. Antes do RAY pensar: pedidos como "devo comprar", "qual ação", "minha carteira", "50% em FII" viram um encaminhamento gentil para você. Depois que o RAY escreve: se a resposta tiver "golpe", "fraude", "compre", "venda agora", promessa de retorno ou indicação de papel, ela é trocada por uma resposta segura. Quando o assunto é produto, rentabilidade ou imposto, o aviso curto vai no fim. |
| **ray-send** | Quem de fato envia pelo WhatsApp. Só manda mensagem livre dentro das 24 horas depois que o cliente falou, só manda modelo (template) para quem deu SIM, e no máximo 20 modelos por dia. Cada envio vira uma linha no histórico do cliente. |
| **ray-agendar** | Olha a sua agenda do Google (segunda a sexta, 9h às 18h, blocos de 30 minutos, próximos 7 dias), oferece até 6 horários e, quando a pessoa escolhe, cria o evento e registra o agendamento. Nunca marca dois clientes no mesmo horário. |
| **admin-conhecimento** | Recebe uma ficha de conhecimento e a guarda já "indexada" para o RAY encontrar. |
| **Carregador de fichas** (`scripts/ray-carregar-fichas.mjs`) | Lê as 24 fichas da pasta `ray-conhecimento` e envia todas de uma vez para o admin-conhecimento. |

### Quando o RAY chama você

O RAY avisa você no seu WhatsApp pessoal quando: a pessoa pede para falar com um humano; a pessoa insiste duas vezes em pedir recomendação pessoal; a agenda falha; uma reunião é marcada; ou o RAY teve um problema técnico. Nos três primeiros casos a conversa também fica marcada como "aguardando humano" no banco, para o console do admin mostrar.

Atenção: a Meta só deixa o número do RAY enviar texto livre para você se você tiver falado com ele nas últimas 24 horas. Fora disso o aviso só chega se existir um modelo aprovado (veja o segredo `RAY_TEMPLATE_ALERTA` abaixo). Por isso, mande um "oi" para o número do RAY ao começar o dia.

## 2. Segredos que precisam ser criados

Todos ficam no Supabase do Sagafin (projeto `vcmnfnsjgfbudypewvjx`), em **Edge Functions > Secrets**. Nenhum vai para o código nem para o chat.

| Segredo | Onde conseguir | Obrigatório |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com > API Keys (crie uma chave só do Sagafin) | Sim |
| `WHATSAPP_TOKEN` | Meta for Developers > seu app > WhatsApp > Configuração da API (token permanente de usuário do sistema; o temporário de 24h serve só para teste) | Sim |
| `WHATSAPP_PHONE_NUMBER_ID` | Mesma tela da Meta ("ID do número de telefone") | Sim |
| `WHATSAPP_VERIFY_TOKEN` | Você inventa uma frase longa; ela é digitada de novo na Meta ao configurar o webhook | Sim |
| `WHATSAPP_APP_SECRET` | Meta for Developers > Configurações do app > Básico > "Chave secreta do app" | Sim (sem ele o webhook recusa tudo) |
| `WHATSAPP_API_VERSION` | Ex.: `v21.0` (se não criar, usa v21.0) | Não |
| `RAY_OWNER_PHONE` | Seu WhatsApp com DDI e DDD, só números, ex.: `5562999999999` | Sim |
| `RAY_TEMPLATE_ALERTA` | Nome de um modelo aprovado de aviso interno com uma variável | Opcional |
| `GOOGLE_CLIENT_ID` | Google Cloud > APIs e serviços > Credenciais > ID do cliente OAuth | Sim (agenda) |
| `GOOGLE_CLIENT_SECRET` | Mesma tela | Sim (agenda) |
| `GOOGLE_REFRESH_TOKEN` | Gerado uma vez ao autorizar a conta do Google da agenda, com a permissão de Calendar | Sim (agenda) |
| `GOOGLE_CALENDAR_ID` | E-mail da agenda; se não criar, usa a agenda principal | Não |
| `ADMIN_ALLOWED_EMAILS` | Seu e-mail (vários separados por vírgula) | Recomendado |
| `SAGAFIN_SITE_URL` | `https://sagafin.com.br` (se não criar, usa esse) | Não |

O Supabase já fornece sozinho `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

## 3. Ordem para colocar no ar

1. **Rotacionar a chave exposta** (pendência da Fase 0) antes de qualquer coisa.
2. **Aplicar as duas migrações** no SQL Editor do Supabase, nesta ordem: `20261023_clientes_crm.sql` (se ainda não foi) e depois `20261023_ray_core.sql`. As duas podem ser repetidas sem risco.
3. **Criar os segredos** da tabela acima (pelo menos os obrigatórios; os do Google podem esperar se você for testar sem agenda).
4. **Enviar as funções** pelo CLI do Supabase, sempre no projeto do Sagafin, nesta ordem: `ray-send`, `ray-agendar`, `ray-agent`, `admin-conhecimento`, `ray-webhook`. Todas com a opção `--no-verify-jwt`: elas conferem a chave por conta própria, e a Meta não manda login.
   Exemplo: `supabase functions deploy ray-send --no-verify-jwt --project-ref vcmnfnsjgfbudypewvjx`
5. **Carregar as fichas**: primeiro `node scripts/ray-carregar-fichas.mjs --dry-run` (só lista as 24), depois sem `--dry-run`.
6. **Conectar o webhook na Meta**: Meta for Developers > WhatsApp > Configuração > Webhook. URL de retorno: `https://vcmnfnsjgfbudypewvjx.supabase.co/functions/v1/ray-webhook`. Token de verificação: o valor de `WHATSAPP_VERIFY_TOKEN`. Assine o campo **messages**.
7. **Testar** (seção seguinte) e só então ligar o número definitivo.

## 4. Como testar com o número de teste da Meta (antes do chip da TIM)

A Meta dá um número de teste grátis em WhatsApp > Configuração da API. Ele só conversa com até 5 números que você cadastrar como destinatários.

1. Na tela "Configuração da API", cadastre o seu WhatsApp como destinatário (a Meta manda um código de confirmação).
2. Use o ID desse número de teste em `WHATSAPP_PHONE_NUMBER_ID` e o token de teste em `WHATSAPP_TOKEN` (o token de teste dura 24 horas; renove ao testar de novo).
3. Cadastre o seu telefone como cliente de teste (pode ser uma linha em `clientes` com o seu número no padrão de 13 dígitos). Assim o RAY reconhece você como cliente.
4. Do seu WhatsApp, mande mensagem para o número de teste. Roteiro de conferência:
   - "oi": recebe a apresentação do RAY e o aviso.
   - "o que é CDB?": explicação curta com o aviso no fim.
   - "como está o mercado hoje?": resumo com base no Diário e nas cotações.
   - "compro PETR4?": recusa gentil e convite para a reunião.
   - "quero marcar uma reunião": lista de horários; escolha um; confira se o evento apareceu no Google Calendar.
   - "quero falar com o Rainiere": a conversa fica como aguardando humano e o aviso chega no seu WhatsApp.
   - "PARAR": confirmação, e no banco `opt_in_whatsapp` vira falso e `opt_out_at` fica preenchido.
   - Para testar o SIM: com o seu cliente de teste em `opt_in_whatsapp = false`, mande "SIM".
5. Confira o registro de tudo na tabela `ray_log` (entrada, saída, se foi bloqueado e por quê).

**Limites do teste:** o número de teste não envia modelos (templates) para qualquer pessoa, só para os cadastrados, e a janela de 24 horas vale igual: o RAY só responde dentro dela.

Ao trocar para o número da TIM: crie o WABA do Sagafin, verifique o negócio, aprove os 4 modelos da Fase 0, troque `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_TOKEN` e aponte o webhook do novo número para a mesma URL.

## 5. O que ainda não existe

- Console de atendimento no admin (as tabelas já permitem a leitura e a troca de `modo_humano` e `aguardando_humano`; a tela é a Fase 3b).
- `ray-follow-up`, lembretes de reunião 24h e 2h antes, e `ray-aprendiz` (sugestão noturna de fichas).
- Mais fichas: as 24 iniciais cobrem os temas essenciais; a meta é chegar a 50.
- O trecho "Pergunte ao RAY" no Diário depende do RAY estar no ar.
- Compliance XP: a resposta ao e-mail ainda precisa chegar antes do lançamento público.

## 6. Testes automáticos

`npm test` roda 110 verificações do guarda-corpo, do telefone, da memória por episódio, da agenda e do carregador de fichas. Rode sempre que mexer em qualquer regra.
