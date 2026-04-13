-- ============================================================
-- Sagafin — Biblioteca de Skills & Ebooks
-- Execute este SQL no Supabase SQL Editor do projeto Sagafin
-- ============================================================

-- 1. Tabela de leads da biblioteca
create table if not exists public.leads_biblioteca (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  nome          text not null,
  email         text not null,
  item_id       text not null,
  item_titulo   text not null,
  item_tipo     text not null check (item_tipo in ('skill', 'ebook')),
  item_categoria text not null
);

-- 2. Índice para busca por email
create index if not exists leads_biblioteca_email_idx
  on public.leads_biblioteca (email);

-- 3. Índice para analytics por item
create index if not exists leads_biblioteca_item_idx
  on public.leads_biblioteca (item_id);

-- 4. RLS — habilita segurança a nível de linha
alter table public.leads_biblioteca enable row level security;

-- 5. Política: qualquer pessoa pode inserir (anon insert para o formulário público)
create policy "anon_insert_leads"
  on public.leads_biblioteca
  for insert
  to anon
  with check (true);

-- 6. Política: apenas autenticados (você) podem ler os leads
create policy "auth_read_leads"
  on public.leads_biblioteca
  for select
  to authenticated
  using (true);

-- ============================================================
-- Storage — bucket para os arquivos da biblioteca
-- ============================================================

-- Crie o bucket "biblioteca" no Supabase Dashboard:
-- Storage > New Bucket > Nome: "biblioteca" > Public: true
--
-- Estrutura de pastas dentro do bucket:
--   biblioteca/
--     skills/
--       discernimento-estrategico.zip
--       sagafin-newsletter.zip
--       rainiere-auto-content.zip
--       ... (uma pasta .zip por skill)
--     ebooks/
--       ... (um .pdf por ebook)
--
-- Política de leitura pública (já incluída ao marcar Public: true)
-- ============================================================

-- ============================================================
-- View analítica (opcional) — downloads por item
-- ============================================================
create or replace view public.biblioteca_analytics as
select
  item_id,
  item_titulo,
  item_tipo,
  item_categoria,
  count(*) as total_downloads,
  count(distinct email) as leads_unicos,
  max(created_at) as ultimo_download
from public.leads_biblioteca
group by item_id, item_titulo, item_tipo, item_categoria
order by total_downloads desc;
