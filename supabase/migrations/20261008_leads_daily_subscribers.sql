-- Migração: tabelas de captação (leads) e assinantes do Diário Saga.
-- Aplicar no SQL Editor do Supabase (projeto vcmnfnsjgfbudypewvjx).
-- Idempotente: pode ser executada mais de uma vez.

-- ---------------------------------------------------------------
-- public.leads — formulários do site (Diário, Diagnóstico IA, etc.)
-- ---------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  investment_range text,
  message text,
  source text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "leads_insert_anon" on public.leads;
create policy "leads_insert_anon"
  on public.leads for insert
  to anon, authenticated
  with check (true);

drop policy if exists "leads_select_service" on public.leads;
create policy "leads_select_service"
  on public.leads for select
  to service_role
  using (true);

revoke select on public.leads from anon, authenticated;

-- ---------------------------------------------------------------
-- public.daily_subscribers — assinantes do Diário Saga (e-mail diário)
-- ---------------------------------------------------------------
create table if not exists public.daily_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  unsubscribe_token uuid not null default gen_random_uuid(),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists daily_subscribers_status_idx on public.daily_subscribers (status);

alter table public.daily_subscribers enable row level security;

-- O site (chave anon) só consegue inserir; nunca ler a lista.
drop policy if exists "daily_subscribers_insert_anon" on public.daily_subscribers;
create policy "daily_subscribers_insert_anon"
  on public.daily_subscribers for insert
  to anon, authenticated
  with check (true);

-- service_role (GitHub Actions / api/unsubscribe) lê e atualiza tudo.
drop policy if exists "daily_subscribers_all_service" on public.daily_subscribers;
create policy "daily_subscribers_all_service"
  on public.daily_subscribers for all
  to service_role
  using (true)
  with check (true);

revoke select, update, delete on public.daily_subscribers from anon, authenticated;

-- Reinscrição de quem já se descadastrou: feita pelo site via RPC
-- (security definer), sem expor a tabela para leitura.
create or replace function public.subscribe_daily(p_email text, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.daily_subscribers (email, name)
  values (lower(trim(p_email)), nullif(trim(p_name), ''))
  on conflict (email) do update
    set status = 'active',
        name = coalesce(excluded.name, public.daily_subscribers.name),
        consent_at = now();
end;
$$;

revoke all on function public.subscribe_daily(text, text) from public;
grant execute on function public.subscribe_daily(text, text) to anon, authenticated;
