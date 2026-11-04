-- Migração: Destaques de Trading Sagafin (agente tastytrade + página /trading).
-- Aplicar no SQL Editor do Supabase (projeto vcmnfnsjgfbudypewvjx) ou via MCP apply_migration.
-- Idempotente: pode ser executada mais de uma vez.
--
-- Modelo de acesso:
--   * service_role (GitHub Actions / funções /api)  → tudo.
--   * anon (site público)                           → só a VIEW trade_studies_public e as RPCs.
--   * authenticated (painel /admin, magic link)     → leitura de runs, conta e estudos; update de reviewed.

-- ---------------------------------------------------------------
-- 1) market_snapshots — foto do mercado a cada slot (4x/dia)
-- ---------------------------------------------------------------
create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  trade_date date not null,
  slot text not null check (slot in ('pre_open', 'mid_morning', 'mid_afternoon', 'post_close')),
  universe text[] not null default '{}',
  metrics jsonb not null default '{}'::jsonb,   -- por símbolo: ivx, iv_rank, iv_pct, hv30, liquidity, beta, earnings, expected_move, ref_price
  macro jsonb not null default '{}'::jsonb,     -- SPY, VIX, EWZ, USD/BRL, IBOV, prêmio/desconto ADR
  unique (trade_date, slot)
);
alter table public.market_snapshots enable row level security;
drop policy if exists "market_snapshots_service_all" on public.market_snapshots;
create policy "market_snapshots_service_all" on public.market_snapshots for all to service_role using (true) with check (true);
drop policy if exists "market_snapshots_admin_read" on public.market_snapshots;
create policy "market_snapshots_admin_read" on public.market_snapshots for select to authenticated using (true);
revoke all on public.market_snapshots from anon;

-- ---------------------------------------------------------------
-- 2) trade_studies — os estudos (cards) por horizonte
-- ---------------------------------------------------------------
create table if not exists public.trade_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'open' check (status in ('draft', 'open', 'closed', 'invalidated')),
  horizon text not null check (horizon in ('daily', 'weekly', 'monthly', 'semiannual', 'long_term')),
  symbol text not null,
  asset_class text not null check (asset_class in ('etf_us', 'stock_us', 'adr_br', 'etf_br')),
  strategy_type text not null,                  -- short_put_spread, iron_condor, short_strangle, covered_call, call_spread, put_spread, calendar, diagonal, pmcc, collar, shares_trend, shares_mean_reversion, event_study, other
  direction text not null check (direction in ('neutral', 'bullish', 'bearish')),
  title text not null,
  thesis_public text not null,                  -- resumo curto, público
  thesis_full text,                             -- tese completa, liberada por e-mail
  legs jsonb not null default '[]'::jsonb,      -- [{side, right, strike, expiration, delta, qty}]
  metrics jsonb not null default '{}'::jsonb,   -- ivx, iv_rank, iv_pct, hv30, liquidity, dte, expected_move, expected_move_pct, ref_price, ref_time, earnings_within_dte
  risk jsonb not null default '{}'::jsonb,      -- max_loss, max_profit, breakevens[], pop_estimate, bp_effect, credit_or_debit, risk_notes
  invalidation text,
  management text,
  confidence text check (confidence in ('baixa', 'media', 'alta')),
  scenario_bull text,
  scenario_base text,
  scenario_bear text,
  snapshot_id uuid references public.market_snapshots (id) on delete set null,
  entry_ref_price numeric,
  published_at timestamptz not null default now(),
  expires_at date,
  closed_at timestamptz,
  close_ref_price numeric,
  close_reason text,                            -- target | invalidation | expiry | horizon_end | manual
  result_pct numeric,                           -- hipotético, sobre risco máximo (opções) ou preço de referência (ações)
  result_note text,
  chart_url text,
  model text,
  reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trade_studies_status_horizon_idx on public.trade_studies (status, horizon, published_at desc);
create index if not exists trade_studies_symbol_idx on public.trade_studies (symbol);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists trade_studies_set_updated_at on public.trade_studies;
create trigger trade_studies_set_updated_at before update on public.trade_studies
  for each row execute function public.set_updated_at();

alter table public.trade_studies enable row level security;
drop policy if exists "trade_studies_service_all" on public.trade_studies;
create policy "trade_studies_service_all" on public.trade_studies for all to service_role using (true) with check (true);
drop policy if exists "trade_studies_admin_read" on public.trade_studies;
create policy "trade_studies_admin_read" on public.trade_studies for select to authenticated using (true);
drop policy if exists "trade_studies_admin_update" on public.trade_studies;
create policy "trade_studies_admin_update" on public.trade_studies for update to authenticated using (true) with check (true);
revoke all on public.trade_studies from anon;

-- ---------------------------------------------------------------
-- 3) trade_study_marks — marcação a mercado de cada estudo aberto (série)
-- ---------------------------------------------------------------
create table if not exists public.trade_study_marks (
  id bigserial primary key,
  study_id uuid not null references public.trade_studies (id) on delete cascade,
  marked_at timestamptz not null default now(),
  slot text,
  ref_price numeric,
  pnl_pct numeric
);
create index if not exists trade_study_marks_study_idx on public.trade_study_marks (study_id, marked_at);
alter table public.trade_study_marks enable row level security;
drop policy if exists "trade_study_marks_service_all" on public.trade_study_marks;
create policy "trade_study_marks_service_all" on public.trade_study_marks for all to service_role using (true) with check (true);
drop policy if exists "trade_study_marks_admin_read" on public.trade_study_marks;
create policy "trade_study_marks_admin_read" on public.trade_study_marks for select to authenticated using (true);
revoke all on public.trade_study_marks from anon;

-- ---------------------------------------------------------------
-- 4) account_snapshots — conta tastytrade (PRIVADO: só admin)
-- ---------------------------------------------------------------
create table if not exists public.account_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  account_number text,
  net_liq numeric,
  option_bp numeric,
  stock_bp numeric,
  pl_day numeric,
  pl_ytd numeric,
  positions jsonb not null default '[]'::jsonb
);
create index if not exists account_snapshots_captured_idx on public.account_snapshots (captured_at desc);
alter table public.account_snapshots enable row level security;
drop policy if exists "account_snapshots_service_all" on public.account_snapshots;
create policy "account_snapshots_service_all" on public.account_snapshots for all to service_role using (true) with check (true);
drop policy if exists "account_snapshots_admin_read" on public.account_snapshots;
create policy "account_snapshots_admin_read" on public.account_snapshots for select to authenticated using (true);
revoke all on public.account_snapshots from anon;

-- ---------------------------------------------------------------
-- 5) trading_runs — log de cada execução do agente
-- ---------------------------------------------------------------
create table if not exists public.trading_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  trade_date date,
  slot text,
  status text not null default 'running' check (status in ('running', 'done', 'failed', 'skipped', 'dry_run')),
  error text,
  n_symbols int default 0,
  n_candidates int default 0,
  n_published int default 0,
  n_closed int default 0,
  cost_usd_estimate numeric,
  log text
);
create index if not exists trading_runs_started_idx on public.trading_runs (started_at desc);
alter table public.trading_runs enable row level security;
drop policy if exists "trading_runs_service_all" on public.trading_runs;
create policy "trading_runs_service_all" on public.trading_runs for all to service_role using (true) with check (true);
drop policy if exists "trading_runs_admin_read" on public.trading_runs;
create policy "trading_runs_admin_read" on public.trading_runs for select to authenticated using (true);
revoke all on public.trading_runs from anon;

-- ---------------------------------------------------------------
-- 6) VIEW pública: só o resumo (o site anon lê daqui)
-- ---------------------------------------------------------------
create or replace view public.trade_studies_public as
select
  s.slug, s.status, s.horizon, s.symbol, s.asset_class, s.strategy_type, s.direction,
  s.title, s.thesis_public, s.confidence,
  jsonb_build_object(
    'iv_rank', s.metrics->'iv_rank',
    'ivx', s.metrics->'ivx',
    'iv_pct', s.metrics->'iv_pct',
    'liquidity', s.metrics->'liquidity',
    'dte', s.metrics->'dte',
    'expected_move_pct', s.metrics->'expected_move_pct',
    'ref_price', s.metrics->'ref_price',
    'ref_time', s.metrics->'ref_time',
    'pop_estimate', s.risk->'pop_estimate',
    'max_loss', s.risk->'max_loss',
    'max_profit', s.risk->'max_profit',
    'credit_or_debit', s.risk->'credit_or_debit'
  ) as resumo,
  s.published_at, s.expires_at, s.closed_at, s.close_reason, s.result_pct, s.chart_url, s.updated_at
from public.trade_studies s
where s.status <> 'draft';
grant select on public.trade_studies_public to anon, authenticated;

-- ---------------------------------------------------------------
-- 7) RPC get_trade_study(slug, email): detalhe completo só para assinante ativo
-- ---------------------------------------------------------------
create or replace function public.get_trade_study(p_slug text, p_email text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_study public.trade_studies%rowtype;
  v_unlocked boolean := false;
  v_marks jsonb := '[]'::jsonb;
  v_out jsonb;
begin
  select * into v_study from public.trade_studies where slug = p_slug and status <> 'draft';
  if not found then
    return null;
  end if;

  if p_email is not null and length(trim(p_email)) > 3 then
    select exists (
      select 1 from public.daily_subscribers
      where email = lower(trim(p_email)) and status = 'active'
    ) into v_unlocked;
  end if;

  v_out := jsonb_build_object(
    'slug', v_study.slug, 'status', v_study.status, 'horizon', v_study.horizon,
    'symbol', v_study.symbol, 'asset_class', v_study.asset_class,
    'strategy_type', v_study.strategy_type, 'direction', v_study.direction,
    'title', v_study.title, 'thesis_public', v_study.thesis_public,
    'confidence', v_study.confidence, 'metrics', v_study.metrics,
    'published_at', v_study.published_at, 'expires_at', v_study.expires_at,
    'closed_at', v_study.closed_at, 'close_reason', v_study.close_reason,
    'result_pct', v_study.result_pct, 'result_note', v_study.result_note,
    'chart_url', v_study.chart_url, 'updated_at', v_study.updated_at,
    'unlocked', v_unlocked
  );

  if v_unlocked then
    select coalesce(jsonb_agg(jsonb_build_object('marked_at', m.marked_at, 'ref_price', m.ref_price, 'pnl_pct', m.pnl_pct) order by m.marked_at), '[]'::jsonb)
      into v_marks
      from public.trade_study_marks m where m.study_id = v_study.id;
    v_out := v_out || jsonb_build_object(
      'thesis_full', v_study.thesis_full, 'legs', v_study.legs, 'risk', v_study.risk,
      'invalidation', v_study.invalidation, 'management', v_study.management,
      'scenario_bull', v_study.scenario_bull, 'scenario_base', v_study.scenario_base,
      'scenario_bear', v_study.scenario_bear, 'entry_ref_price', v_study.entry_ref_price,
      'close_ref_price', v_study.close_ref_price, 'marks', v_marks
    );
  end if;

  return v_out;
end;
$$;
revoke all on function public.get_trade_study(text, text) from public;
grant execute on function public.get_trade_study(text, text) to anon, authenticated;

-- ---------------------------------------------------------------
-- 8) RPC trading_track_record(): agregados dos estudos encerrados (hipotéticos)
-- ---------------------------------------------------------------
create or replace function public.trading_track_record()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with fechados as (
    select horizon, result_pct
    from public.trade_studies
    where status in ('closed', 'invalidated') and result_pct is not null
  ),
  por_horizonte as (
    select horizon,
      count(*) as n,
      count(*) filter (where result_pct > 0) as wins,
      round(avg(result_pct)::numeric, 2) as media,
      round((percentile_cont(0.5) within group (order by result_pct))::numeric, 2) as mediana,
      round(max(result_pct)::numeric, 2) as melhor,
      round(min(result_pct)::numeric, 2) as pior
    from fechados group by horizon
  )
  select jsonb_build_object(
    'total', jsonb_build_object(
      'n', (select count(*) from fechados),
      'wins', (select count(*) filter (where result_pct > 0) from fechados),
      'media', (select round(avg(result_pct)::numeric, 2) from fechados),
      'mediana', (select round((percentile_cont(0.5) within group (order by result_pct))::numeric, 2) from fechados)
    ),
    'por_horizonte', coalesce((select jsonb_object_agg(horizon, to_jsonb(p) - 'horizon') from por_horizonte p), '{}'::jsonb),
    'abertos', (select count(*) from public.trade_studies where status = 'open'),
    'metodo', 'Resultado hipotético em % sobre o risco máximo (opções) ou sobre o preço de referência (ações), medido do preço de referência da publicação ao encerramento, sem custos, comissões ou impostos. Não representa operações reais.'
  );
$$;
revoke all on function public.trading_track_record() from public;
grant execute on function public.trading_track_record() to anon, authenticated;

-- ---------------------------------------------------------------
-- 9) Storage: bucket público para gráficos gerados pelo agente
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('trading-charts', 'trading-charts', true)
on conflict (id) do update set public = excluded.public;
drop policy if exists "trading_charts_public_read" on storage.objects;
create policy "trading_charts_public_read" on storage.objects for select using (bucket_id = 'trading-charts');
