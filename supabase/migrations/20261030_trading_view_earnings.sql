-- A view pública passa a expor a data do próximo balanço (já presente em metrics) para o card.
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
    'earnings_date', s.metrics->'earnings_date',
    'pop_estimate', s.risk->'pop_estimate',
    'max_loss', s.risk->'max_loss',
    'max_profit', s.risk->'max_profit',
    'credit_or_debit', s.risk->'credit_or_debit'
  ) as resumo,
  s.published_at, s.expires_at, s.closed_at, s.close_reason, s.result_pct, s.chart_url, s.updated_at
from public.trade_studies s
where s.status <> 'draft';
grant select on public.trade_studies_public to anon, authenticated;
