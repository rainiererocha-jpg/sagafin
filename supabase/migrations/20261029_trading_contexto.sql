-- RPC pública com o contexto derivado do último snapshot (sem cotações brutas em tempo real).
create or replace function public.trading_contexto()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with ult as (
    select * from public.market_snapshots order by captured_at desc limit 1
  ),
  br as (
    select jsonb_object_agg(k, jsonb_build_object(
      'iv_rank', v->'iv_rank', 'ivx', v->'ivx', 'liquidity', v->'liquidity', 'ref_price', v->'ref_price',
      'premio_pct', (select macro->'adr_premios'->k->'premio_pct' from ult)
    )) as j
    from ult, jsonb_each(ult.metrics) as e(k, v)
    where k in ('EWZ','PBR','PBR.A','VALE','ITUB','BBD','ABEV','ERJ','GGB','SBS','CIG','BSBR','NU','MELI','XP','STNE','PAGS')
  )
  select jsonb_build_object(
    'captured_at', (select captured_at from ult),
    'slot', (select slot from ult),
    'macro', (select macro from ult),
    'brasil', coalesce((select j from br), '{}'::jsonb)
  );
$$;
revoke all on function public.trading_contexto() from public;
grant execute on function public.trading_contexto() to anon, authenticated;
