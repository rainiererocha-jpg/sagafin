-- =====================================================================
-- Saga Studio — setup do banco da central de gestão de conteúdo
-- Projeto Supabase: ojesmvryqehcmaolkbsd  (fila de aprovação/automação)
-- Idempotente: pode rodar quantas vezes quiser (cole no SQL Editor do Supabase).
--
-- IMPORTANTE (ordem de deploy): ao ligar RLS, os watchers locais
-- (approval_watcher.py / generation_watcher.py / sync_blotato.py) PRECISAM
-- usar a SERVICE ROLE KEY (env SUPABASE_SERVICE_ROLE), porque a anon key
-- passa a ser bloqueada nas escritas. A service_role ignora RLS.
-- O painel web usa a sessão autenticada (role = authenticated).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) pending_approvals  (já existe — garante colunas usadas pelo painel)
-- ---------------------------------------------------------------------
create table if not exists public.pending_approvals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.pending_approvals add column if not exists topic_id text;
alter table public.pending_approvals add column if not exists format text;            -- reel | carousel
alter table public.pending_approvals add column if not exists title text;
alter table public.pending_approvals add column if not exists hook text;
alter table public.pending_approvals add column if not exists status text default 'pending'; -- pending|approved|rejected|processing|posted|failed
alter table public.pending_approvals add column if not exists slides_urls text[];
alter table public.pending_approvals add column if not exists video_url text;
alter table public.pending_approvals add column if not exists thumb_url text;
alter table public.pending_approvals add column if not exists caption_instagram text;
alter table public.pending_approvals add column if not exists caption_linkedin text;
alter table public.pending_approvals add column if not exists cover_idx int;
alter table public.pending_approvals add column if not exists cover_label text;
alter table public.pending_approvals add column if not exists scheduled_for timestamptz;
alter table public.pending_approvals add column if not exists posted_ig_url text;
alter table public.pending_approvals add column if not exists posted_li_url text;
alter table public.pending_approvals add column if not exists approved_at timestamptz;
alter table public.pending_approvals add column if not exists posted_at timestamptz;
alter table public.pending_approvals add column if not exists notes text;

-- ---------------------------------------------------------------------
-- 2) generation_requests  (painel pede geração; generation_watcher executa)
-- ---------------------------------------------------------------------
create table if not exists public.generation_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null,                       -- daily_post | weekly_video | batch_posts
  params jsonb not null default '{}'::jsonb,
  status text not null default 'queued',    -- queued | running | done | failed
  result_summary text,
  error text,
  requested_by text,
  started_at timestamptz,
  finished_at timestamptz
);
create index if not exists idx_genreq_status on public.generation_requests (status, created_at desc);

-- ---------------------------------------------------------------------
-- 3) social_posts  (cache do Blotato — alimenta Calendário e Métricas)
--    Populado por sync_blotato.py (upsert por blotato_id).
-- ---------------------------------------------------------------------
create table if not exists public.social_posts (
  blotato_id text primary key,
  account_id text,
  platform text,                            -- instagram | linkedin | ...
  status text,                              -- scheduled | published | failed
  text text,
  media_urls jsonb,
  scheduled_for timestamptz,
  posted_at timestamptz,
  post_url text,
  error_message text,
  synced_at timestamptz not null default now()
);
create index if not exists idx_social_status_time on public.social_posts (status, scheduled_for);
create index if not exists idx_social_platform on public.social_posts (platform);

-- ---------------------------------------------------------------------
-- 4) social_commands  (painel pede reagendar/deletar; sync_blotato.py executa)
-- ---------------------------------------------------------------------
create table if not exists public.social_commands (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  action text not null,                     -- delete | reschedule
  blotato_id text not null,
  new_time timestamptz,                     -- usado em reschedule
  status text not null default 'queued',    -- queued | done | failed
  error text,
  executed_at timestamptz
);
create index if not exists idx_cmd_status on public.social_commands (status, created_at);

-- =====================================================================
-- RLS — painel (authenticated) tem acesso total; service_role ignora RLS.
-- =====================================================================
alter table public.pending_approvals   enable row level security;
alter table public.generation_requests enable row level security;
alter table public.social_posts         enable row level security;
alter table public.social_commands      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['pending_approvals','generation_requests','social_posts','social_commands']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_authenticated_all', t
    );
  end loop;
end $$;

-- =====================================================================
-- Realtime (opcional): permite o painel receber updates ao vivo.
-- =====================================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.pending_approvals;   exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.generation_requests; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.social_posts;        exception when duplicate_object then null; end;
  end if;
end $$;
