-- Campanha "Manual Pós-Eleições" (04/11/2026): colunas extras na tabela leads. Idempotente.
-- Rodar no SQL Editor do projeto vcmnfnsjgfbudypewvjx ANTES do deploy da landing /pos-eleicoes.
-- Não altera RLS: a política leads_insert_anon já permite o INSERT; leitura segue só para service_role.
alter table public.leads
  add column if not exists campaign text,
  add column if not exists where_invests text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists landing_path text,
  add column if not exists consent_lgpd boolean default false,
  add column if not exists consent_at timestamptz;

create index if not exists leads_source_idx on public.leads (source, created_at desc);

-- Reversão:
--   alter table public.leads drop column if exists campaign, drop column if exists where_invests,
--     drop column if exists utm_source, drop column if exists utm_medium, drop column if exists utm_campaign,
--     drop column if exists utm_content, drop column if exists landing_path, drop column if exists consent_lgpd,
--     drop column if exists consent_at;
--   drop index if exists leads_source_idx;
