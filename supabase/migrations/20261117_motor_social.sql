-- Motor social diário + funil "comente EU QUERO" → /manual. Projeto: vcmnfnsjgfbudypewvjx. Idempotente.
-- Ver docs/motor-social.md.

-- 1) Fila de aprovação: campos novos para Facebook, stories, aprovação por link e rastreio de origem.
alter table public.pending_approvals
  add column if not exists caption_facebook text,
  add column if not exists story_urls text[],
  add column if not exists approval_token uuid default gen_random_uuid(),
  add column if not exists source_post_slug text,
  add column if not exists pilar text,
  add column if not exists cta_keyword text,
  add column if not exists utm_content text,
  add column if not exists expires_at timestamptz,
  add column if not exists blotato_ids jsonb,
  add column if not exists publish_error text;

create unique index if not exists pending_approvals_token_idx on public.pending_approvals (approval_token);
create index if not exists pending_approvals_status_idx on public.pending_approvals (status, created_at desc);

-- 2) Leads: marca de envio do manual por e-mail (api/manual-enviar, um envio por cadastro).
alter table public.leads add column if not exists manual_enviado_at timestamptz;

-- 3) Eventos do webhook da Meta (comentário com palavra-chave → DM). Dedup por comentário.
create table if not exists public.social_dm_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  platform text not null check (platform in ('instagram', 'facebook')),
  comment_id text not null unique,
  media_id text,
  user_id text,
  username text,
  keyword text,
  comment_text text,
  dm_status text not null default 'pending',   -- pending | sent | failed | skipped
  dm_error text,
  public_reply_status text,
  utm_content text,
  reminder_sent_at timestamptz
);
create index if not exists social_dm_events_media_idx on public.social_dm_events (media_id, created_at desc);

alter table public.social_dm_events enable row level security;
drop policy if exists "social_dm_events_service_all" on public.social_dm_events;
create policy "social_dm_events_service_all" on public.social_dm_events for all to service_role using (true) with check (true);
drop policy if exists "social_dm_events_admin_read" on public.social_dm_events;
create policy "social_dm_events_admin_read" on public.social_dm_events for select to authenticated using (true);

-- 4) Storage: bucket público para os PNGs dos carrosséis e stories.
insert into storage.buckets (id, name, public)
values ('social', 'social', true)
on conflict (id) do update set public = true;

-- 5) Conversão por post: cada peça leva utm_content = id da fila; junta DMs e leads.
create or replace view public.v_conversao_posts
with (security_invoker = true) as
select
  pa.id,
  pa.created_at::date as dia,
  pa.pilar,
  pa.format,
  pa.title,
  pa.hook,
  pa.status,
  pa.posted_at,
  coalesce(pa.utm_content, pa.id::text) as utm_content,
  (select count(*) from public.social_dm_events e where e.utm_content = coalesce(pa.utm_content, pa.id::text)) as dms,
  (select count(*) from public.leads l where l.utm_content = coalesce(pa.utm_content, pa.id::text)) as leads,
  (select count(*) from public.leads l
     where l.utm_content = coalesce(pa.utm_content, pa.id::text)
       and l.investment_range in ('100-300k', '300k-1m', 'acima-1m')) as leads_qualificados
from public.pending_approvals pa;

-- Reversão:
--   drop view if exists public.v_conversao_posts;
--   drop table if exists public.social_dm_events;
--   alter table public.leads drop column if exists manual_enviado_at;
--   alter table public.pending_approvals drop column if exists caption_facebook, drop column if exists story_urls,
--     drop column if exists approval_token, drop column if exists source_post_slug, drop column if exists pilar,
--     drop column if exists cta_keyword, drop column if exists utm_content, drop column if exists expires_at,
--     drop column if exists blotato_ids, drop column if exists publish_error;
