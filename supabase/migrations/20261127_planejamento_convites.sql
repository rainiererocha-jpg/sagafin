-- Migração: convite do Planejamento Financeiro (links pessoais) e respostas do formulário /planejamento.
-- Aplicar no SQL Editor do Supabase (projeto vcmnfnsjgfbudypewvjx). Idempotente.
-- Regra do projeto: toda policy tem TO explícito. Dado financeiro: o anônimo só INSERE, nunca lê.

create table if not exists public.planejamento_convites (
  token uuid primary key default gen_random_uuid(),
  conta bigint not null unique,
  email text not null check (email = lower(email)),
  enviado_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.planejamento_respostas (
  id uuid primary key default gen_random_uuid(),
  token uuid not null references public.planejamento_convites (token),
  respostas jsonb not null,
  consentimento boolean not null check (consentimento is true),
  criado_em timestamptz not null default now()
);

create index if not exists planejamento_respostas_token_idx on public.planejamento_respostas (token);

alter table public.planejamento_convites enable row level security;
alter table public.planejamento_respostas enable row level security;

-- Nada para anon/authenticated nos convites (só a service role, que ignora RLS).
revoke all on public.planejamento_convites from anon, authenticated;
revoke all on public.planejamento_respostas from anon, authenticated;

-- O formulário público só grava. O vínculo com um convite válido é garantido pela chave estrangeira
-- (a verificação da FK não depende de permissão de leitura do anônimo).
grant insert on public.planejamento_respostas to anon;

drop policy if exists planejamento_respostas_insert_anon on public.planejamento_respostas;
create policy planejamento_respostas_insert_anon
  on public.planejamento_respostas
  for insert
  to anon
  with check (consentimento is true);
