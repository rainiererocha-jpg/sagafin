-- Monitor do Dólar: um registro por dia útil com a PTAX de fechamento, o z-score da variação
-- contra a janela de 60 dias e o controle de envio do e-mail (idempotência).
-- Projeto: vcmnfnsjgfbudypewvjx. Idempotente.

create table if not exists public.cambio_diario (
  data date primary key,
  ptax numeric(10,4) not null,
  var_pct numeric(8,4),
  z numeric(8,4),
  media60 numeric(10,6),
  desvio60 numeric(10,6),
  alerta boolean not null default false,
  fonte text not null default 'bcb',
  enviado_at timestamptz,
  destinatarios int,
  created_at timestamptz not null default now()
);

alter table public.cambio_diario enable row level security;

drop policy if exists "cambio_diario_service_all" on public.cambio_diario;
create policy "cambio_diario_service_all" on public.cambio_diario for all to service_role using (true) with check (true);
drop policy if exists "cambio_diario_admin_read" on public.cambio_diario;
create policy "cambio_diario_admin_read" on public.cambio_diario for select to authenticated using (true);
