-- Migração: CRM mínimo da carteira (clientes, interações, indicações).
-- Aplicar no SQL Editor do Supabase (projeto vcmnfnsjgfbudypewvjx).
-- Idempotente: pode ser executada mais de uma vez.
-- Regra do projeto: toda policy tem TO explícito (policy sem TO vale para PUBLIC).

-- ---------------------------------------------------------------
-- Função genérica de updated_at
-- ---------------------------------------------------------------
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
-- public.clientes
-- ---------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text unique,
  email text unique,
  segmento text,
  suitability_texto text,
  aniversario date,
  origem text default 'xp_hub',
  opt_in_email boolean default false,
  opt_in_whatsapp boolean default false,
  consent_at timestamptz,
  opt_out_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  segmento_relacionamento char(1) not null default 'C'
    check (segmento_relacionamento in ('A', 'B', 'C')),
  ultimo_contato_em timestamptz,
  proxima_acao_em date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clientes_telefone_formato
    check (telefone is null or telefone ~ '^55[1-9][0-9]9[0-9]{8}$'),
  constraint clientes_email_minusculo
    check (email is null or email = lower(email))
);

create index if not exists clientes_proxima_acao_idx on public.clientes (proxima_acao_em);
create index if not exists clientes_segmento_rel_idx on public.clientes (segmento_relacionamento);

drop trigger if exists clientes_set_updated_at on public.clientes;
create trigger clientes_set_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- public.interacoes
-- ---------------------------------------------------------------
create table if not exists public.interacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  canal text not null
    check (canal in ('whatsapp', 'email', 'ligacao', 'reuniao', 'presencial', 'outro')),
  tipo text,
  resumo text,
  em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists interacoes_cliente_idx on public.interacoes (cliente_id, em desc);

-- ---------------------------------------------------------------
-- public.indicacoes
-- ---------------------------------------------------------------
create table if not exists public.indicacoes (
  id uuid primary key default gen_random_uuid(),
  indicado_por uuid references public.clientes(id) on delete set null,
  nome text not null,
  telefone text,
  email text,
  status text not null default 'nova'
    check (status in ('nova', 'contatada', 'reuniao', 'cliente', 'descartada')),
  convertido_em timestamptz,
  origem text default 'link',
  created_at timestamptz not null default now()
);

create index if not exists indicacoes_indicado_por_idx on public.indicacoes (indicado_por);

-- ---------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------
alter table public.clientes enable row level security;
alter table public.interacoes enable row level security;
alter table public.indicacoes enable row level security;

-- clientes
drop policy if exists "clientes_select_auth" on public.clientes;
create policy "clientes_select_auth" on public.clientes
  for select to authenticated using (true);
drop policy if exists "clientes_insert_auth" on public.clientes;
create policy "clientes_insert_auth" on public.clientes
  for insert to authenticated with check (true);
drop policy if exists "clientes_update_auth" on public.clientes;
create policy "clientes_update_auth" on public.clientes
  for update to authenticated using (true) with check (true);
drop policy if exists "clientes_all_service" on public.clientes;
create policy "clientes_all_service" on public.clientes
  for all to service_role using (true) with check (true);

-- interacoes
drop policy if exists "interacoes_select_auth" on public.interacoes;
create policy "interacoes_select_auth" on public.interacoes
  for select to authenticated using (true);
drop policy if exists "interacoes_insert_auth" on public.interacoes;
create policy "interacoes_insert_auth" on public.interacoes
  for insert to authenticated with check (true);
drop policy if exists "interacoes_update_auth" on public.interacoes;
create policy "interacoes_update_auth" on public.interacoes
  for update to authenticated using (true) with check (true);
drop policy if exists "interacoes_all_service" on public.interacoes;
create policy "interacoes_all_service" on public.interacoes
  for all to service_role using (true) with check (true);

-- indicacoes (o site, com chave anon, só consegue inserir)
drop policy if exists "indicacoes_select_auth" on public.indicacoes;
create policy "indicacoes_select_auth" on public.indicacoes
  for select to authenticated using (true);
drop policy if exists "indicacoes_insert_auth" on public.indicacoes;
create policy "indicacoes_insert_auth" on public.indicacoes
  for insert to authenticated with check (true);
drop policy if exists "indicacoes_update_auth" on public.indicacoes;
create policy "indicacoes_update_auth" on public.indicacoes
  for update to authenticated using (true) with check (true);
drop policy if exists "indicacoes_insert_anon" on public.indicacoes;
create policy "indicacoes_insert_anon" on public.indicacoes
  for insert to anon with check (status = 'nova' and convertido_em is null);
drop policy if exists "indicacoes_all_service" on public.indicacoes;
create policy "indicacoes_all_service" on public.indicacoes
  for all to service_role using (true) with check (true);

-- Privilégios de tabela (defesa em profundidade além do RLS)
revoke all on public.clientes, public.interacoes, public.indicacoes from anon;
grant insert on public.indicacoes to anon;
grant select, insert, update on public.clientes, public.interacoes, public.indicacoes to authenticated;
grant all on public.clientes, public.interacoes, public.indicacoes to service_role;

-- ---------------------------------------------------------------
-- RPCs de consentimento (chamadas pelo webhook do WhatsApp / admin)
-- ---------------------------------------------------------------
create or replace function public.registrar_opt_in(p_telefone text, p_canal text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clientes
     set opt_in_whatsapp = true,
         opt_in_email = case when p_canal = 'email' then true else opt_in_email end,
         consent_at = now(),
         opt_out_at = null
   where telefone = regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
end;
$$;

create or replace function public.registrar_opt_out(p_telefone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clientes
     set opt_in_email = false,
         opt_in_whatsapp = false,
         opt_out_at = now()
   where telefone = regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
end;
$$;

revoke all on function public.registrar_opt_in(text, text) from public, anon;
revoke all on function public.registrar_opt_out(text) from public, anon;
grant execute on function public.registrar_opt_in(text, text) to service_role, authenticated;
grant execute on function public.registrar_opt_out(text) to service_role, authenticated;

-- ---------------------------------------------------------------
-- View: quem contatar hoje (respeita o RLS de quem consulta)
-- ---------------------------------------------------------------
create or replace view public.clientes_para_contatar_hoje
with (security_invoker = true) as
select *
  from public.clientes
 where proxima_acao_em <= current_date
   and opt_out_at is null
 order by segmento_relacionamento, proxima_acao_em;

revoke all on public.clientes_para_contatar_hoje from anon;
grant select on public.clientes_para_contatar_hoje to authenticated, service_role;
