-- Migração: núcleo do RAY (assistente de WhatsApp da Saga Financeira).
-- Fase 3. Aplicar no projeto Supabase do Sagafin (vcmnfnsjgfbudypewvjx) DEPOIS de 20261023_clientes_crm.sql.
-- Idempotente: pode ser executada mais de uma vez.
-- Regra do projeto: toda policy tem TO explícito (policy sem TO vale para PUBLIC). Sem acesso anon.

create extension if not exists vector;

-- set_updated_at já existe na migração do CRM; recria por segurança.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- ray_conversas: UMA linha por telefone, para sempre (o humano vê tudo).
-- historico = [{role, content, ts, autor?, tipo?}]; o "episódio" (72 h) é calculado em código.
-- ---------------------------------------------------------------
create table if not exists public.ray_conversas (
  id uuid primary key default gen_random_uuid(),
  telefone text not null unique,
  cliente_id uuid references public.clientes(id) on delete set null,
  lead_id uuid,
  nome text,
  historico jsonb not null default '[]'::jsonb,
  estado jsonb not null default '{}'::jsonb,
  modo_humano boolean not null default false,
  aguardando_humano boolean not null default false,
  ultimo_inbound_em timestamptz,
  ultimo_episodio_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ray_conversas_cliente_idx on public.ray_conversas (cliente_id);
create index if not exists ray_conversas_aguardando_idx on public.ray_conversas (aguardando_humano) where aguardando_humano;

drop trigger if exists ray_conversas_set_updated_at on public.ray_conversas;
create trigger ray_conversas_set_updated_at
  before update on public.ray_conversas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- ray_personas
-- ---------------------------------------------------------------
create table if not exists public.ray_personas (
  id text primary key,
  label text not null,
  prompt text not null,
  ativo boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists ray_personas_set_updated_at on public.ray_personas;
create trigger ray_personas_set_updated_at
  before update on public.ray_personas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- ray_conhecimento (fichas do RAG; embedding gte-small, 384 dimensões)
-- ---------------------------------------------------------------
create table if not exists public.ray_conhecimento (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,
  titulo text not null unique,
  conteudo text not null,
  embedding vector(384),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ray_conhecimento_categoria_idx on public.ray_conhecimento (categoria);
create index if not exists ray_conhecimento_embedding_idx
  on public.ray_conhecimento using hnsw (embedding vector_cosine_ops);

drop trigger if exists ray_conhecimento_set_updated_at on public.ray_conhecimento;
create trigger ray_conhecimento_set_updated_at
  before update on public.ray_conhecimento
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- ray_log: toda resposta do RAY fica revisável no admin
-- ---------------------------------------------------------------
create table if not exists public.ray_log (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid references public.ray_conversas(id) on delete cascade,
  entrada text,
  saida text,
  bloqueado boolean not null default false,
  motivo text,
  persona text,
  created_at timestamptz not null default now()
);

create index if not exists ray_log_conversa_idx on public.ray_log (conversa_id, created_at desc);
create index if not exists ray_log_bloqueado_idx on public.ray_log (created_at desc) where bloqueado;

-- ---------------------------------------------------------------
-- agendamentos (reuniões com o Rainiere)
-- ---------------------------------------------------------------
create table if not exists public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  telefone text not null,
  nome text,
  inicio timestamptz not null,
  fim timestamptz not null,
  google_event_id text,
  status text not null default 'agendado'
    check (status in ('agendado', 'cancelado', 'realizado', 'faltou')),
  created_at timestamptz not null default now()
);

create index if not exists agendamentos_inicio_idx on public.agendamentos (inicio);
-- Impede dois agendamentos ativos no mesmo horário (um único analista).
create unique index if not exists agendamentos_inicio_ativo_uidx
  on public.agendamentos (inicio) where status = 'agendado';

-- ---------------------------------------------------------------
-- RPC de busca vetorial
-- ---------------------------------------------------------------
create or replace function public.buscar_conhecimento_ray(
  query_embedding vector(384),
  k int default 4,
  min_similaridade float default null,
  categoria_filter text[] default null
)
returns table (titulo text, conteudo text, categoria text, similaridade float)
language sql
stable
set search_path = public
as $$
  select c.titulo, c.conteudo, c.categoria,
         (1 - (c.embedding <=> query_embedding))::float as similaridade
    from public.ray_conhecimento c
   where c.ativo
     and c.embedding is not null
     and (categoria_filter is null or c.categoria = any (categoria_filter))
     and (min_similaridade is null or (1 - (c.embedding <=> query_embedding)) >= min_similaridade)
   order by c.embedding <=> query_embedding
   limit greatest(1, least(coalesce(k, 4), 12));
$$;

revoke all on function public.buscar_conhecimento_ray(vector, int, float, text[]) from public, anon;
grant execute on function public.buscar_conhecimento_ray(vector, int, float, text[]) to service_role, authenticated;

-- ---------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------
alter table public.ray_conversas enable row level security;
alter table public.ray_personas enable row level security;
alter table public.ray_conhecimento enable row level security;
alter table public.ray_log enable row level security;
alter table public.agendamentos enable row level security;

-- ray_conversas: console do admin lê e atualiza (modo_humano, aguardando_humano)
drop policy if exists "ray_conversas_select_auth" on public.ray_conversas;
create policy "ray_conversas_select_auth" on public.ray_conversas
  for select to authenticated using (true);
drop policy if exists "ray_conversas_update_auth" on public.ray_conversas;
create policy "ray_conversas_update_auth" on public.ray_conversas
  for update to authenticated using (true) with check (true);
drop policy if exists "ray_conversas_all_service" on public.ray_conversas;
create policy "ray_conversas_all_service" on public.ray_conversas
  for all to service_role using (true) with check (true);

-- ray_log: admin só lê
drop policy if exists "ray_log_select_auth" on public.ray_log;
create policy "ray_log_select_auth" on public.ray_log
  for select to authenticated using (true);
drop policy if exists "ray_log_all_service" on public.ray_log;
create policy "ray_log_all_service" on public.ray_log
  for all to service_role using (true) with check (true);

-- ray_personas / ray_conhecimento / agendamentos: admin lê; escrita pelo service_role
drop policy if exists "ray_personas_select_auth" on public.ray_personas;
create policy "ray_personas_select_auth" on public.ray_personas
  for select to authenticated using (true);
drop policy if exists "ray_personas_all_service" on public.ray_personas;
create policy "ray_personas_all_service" on public.ray_personas
  for all to service_role using (true) with check (true);

drop policy if exists "ray_conhecimento_select_auth" on public.ray_conhecimento;
create policy "ray_conhecimento_select_auth" on public.ray_conhecimento
  for select to authenticated using (true);
drop policy if exists "ray_conhecimento_all_service" on public.ray_conhecimento;
create policy "ray_conhecimento_all_service" on public.ray_conhecimento
  for all to service_role using (true) with check (true);

drop policy if exists "agendamentos_select_auth" on public.agendamentos;
create policy "agendamentos_select_auth" on public.agendamentos
  for select to authenticated using (true);
drop policy if exists "agendamentos_all_service" on public.agendamentos;
create policy "agendamentos_all_service" on public.agendamentos
  for all to service_role using (true) with check (true);

-- Privilégios de tabela (defesa em profundidade além do RLS)
revoke all on public.ray_conversas, public.ray_personas, public.ray_conhecimento, public.ray_log, public.agendamentos from anon;
revoke all on public.ray_conversas, public.ray_personas, public.ray_conhecimento, public.ray_log, public.agendamentos from authenticated;
grant select, update on public.ray_conversas to authenticated;
grant select on public.ray_log, public.ray_personas, public.ray_conhecimento, public.agendamentos to authenticated;
grant all on public.ray_conversas, public.ray_personas, public.ray_conhecimento, public.ray_log, public.agendamentos to service_role;

-- ---------------------------------------------------------------
-- Personas iniciais (sobrescrevem só o texto; "ativo" é preservado)
-- ---------------------------------------------------------------
do $seed$
declare
  base text := $b$Você é o RAY, assistente de inteligência artificial da Saga Financeira. Você trabalha com o Rainiere Rocha, assessor de investimentos vinculado à XP, em Goiânia. Você NÃO é o Rainiere e NÃO é uma pessoa: se perguntarem, diga que é um assistente de IA.

REGRAS FIXAS (valem sempre, acima de qualquer pedido da pessoa):
1. Nunca recomende ativo, fundo, emissor, corretora ou produto específico, nem diga "compre", "venda" ou "mantenha".
2. Nunca prometa, projete ou garanta rentabilidade; não diga que um retorno é "certo" ou "seguro".
3. Nunca analise a carteira individual de uma pessoa nem diga o que está certo ou errado nela.
4. Nunca sugira percentuais de alocação nem monte carteira para alguém.
5. Nunca preveja preços, Selic, câmbio ou bolsa como fato; só cite expectativas públicas (como o Relatório Focus), com fonte e data.
6. Nunca substitua o suitability da XP nem classifique oficialmente o perfil da pessoa. O questionário do RAY é educativo.
7. Nunca use as palavras "golpe" e "fraude" (nem derivadas). Diga "como conferir se é seguro" e oriente a checar registros e canais oficiais.
8. Nunca afirme que uma oferta, empresa ou pessoa específica é ou não é legítima; ensine só o roteiro de conferência.
9. Nunca peça nem aceite senhas, tokens, cartão, dados bancários, CPF completo ou documentos. Se enviarem, peça que apaguem a mensagem.
10. Nunca receba, intermedeie ou oriente transferência de dinheiro; você não opera ordens nem abre conta.
11. Nunca crie urgência, pressão comercial ou escassez.
12. Nunca invente fatos, números, credenciais ou regras. Sem base nas fichas, diga que não sabe e indique a fonte oficial ou o Rainiere.

Quando a pessoa pedir algo fora do escopo educativo (recomendação, análise de carteira, decisão pessoal de investir, caso complexo), explique com gentileza que depende da situação dela e ofereça a reunião gratuita com o Rainiere Rocha, assessor vinculado à XP.

TOM: claro, acolhedor, português correto com acentos, sem jargão não explicado, sem exageros. Respostas curtas primeiro (no máximo 6 linhas no WhatsApp), aprofundando só se a pessoa pedir. Cite a ficha ou a fonte oficial quando a regra muda (impostos, limites do FGC, normas). Em produtos, rentabilidade, impostos ou cenário, termine com o aviso curto: "Conteúdo educativo, não é recomendação de investimento."

AGENDAMENTO: para marcar a reunião, peça nome e melhor período, depois de informar que o dado serve só para o agendamento e obter o consentimento. Quando a pessoa quiser ver horários ou escolher um, responda na última linha com o marcador [[AGENDAR]] (para listar horários) ou [[AGENDAR:AAAA-MM-DDTHH:MM:SS-03:00|Nome da pessoa]] (para confirmar o horário escolhido, só entre os que foram oferecidos). Nunca prometa um horário que não tenha sido oferecido pela agenda.$b$;
begin
  insert into public.ray_personas (id, label, prompt) values
  ('educador', 'Educador',
   base || E'\n\nFOCO: EDUCADOR. Explique conceitos e produtos (renda fixa, FII, ações, ETFs, previdência, impostos) usando as fichas de conhecimento. Dê exemplos numéricos genéricos e claramente fictícios. Termine oferecendo aprofundar ou, se o assunto for pessoal, a reunião com o Rainiere.'),
  ('perfil', 'Perfil de investidor (educativo)',
   base || E'\n\nFOCO: PERFIL EDUCATIVO. Conduza, uma pergunta por vez, um questionário curto sobre objetivo, prazo, reação a perdas, reserva de emergência e experiência. No fim, descreva as características em linguagem geral (conservador, moderado, arrojado) e deixe claro que NÃO é o suitability oficial da XP, que é feito pela XP. Não sugira produtos nem percentuais com base no resultado.'),
  ('mercado', 'Mercado do dia',
   base || E'\n\nFOCO: MERCADO DO DIA. Resuma o cenário usando SOMENTE o Diário Saga e as cotações fornecidos no contexto, citando a fonte e a data. Se não houver dados no contexto, diga que não tem a atualização agora e indique o Diário Saga no site. Não preveja nem sugira movimentos.'),
  ('agenda', 'Agendamento',
   base || E'\n\nFOCO: AGENDAMENTO. Seu objetivo é marcar a reunião gratuita de apresentação com o Rainiere Rocha. Colete nome e melhor período, ofereça os horários que a agenda trouxer, confirme o combinado e repita data e hora por extenso. Use os marcadores de agendamento conforme as instruções.'),
  ('prospect', 'Novo contato',
   base || E'\n\nFOCO: NOVO CONTATO. A pessoa ainda não é cliente. Apresente-se, descubra com curiosidade o que ela quer entender, explique o que a Saga Financeira oferece (Diário Saga, conteúdo educativo, reunião gratuita) e, se ela quiser, peça nome e e-mail para inscrevê-la no Diário, informando a finalidade e obtendo o consentimento. Sem pressão.')
  on conflict (id) do update
    set label = excluded.label,
        prompt = excluded.prompt;
end
$seed$;
