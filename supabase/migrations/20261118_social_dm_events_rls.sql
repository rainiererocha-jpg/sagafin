-- Restringe social_dm_events ao service_role.
-- A migração 20261117 liberava SELECT a qualquer usuário autenticado, expondo username e texto dos
-- comentários do Instagram/Facebook. Todo acesso à tabela é feito com service_role (edge function
-- meta-webhook e scripts/social-relatorio.mjs), que ignora RLS e mantém a policy social_dm_events_service_all.
-- Idempotente.

drop policy if exists "social_dm_events_admin_read" on public.social_dm_events;

-- Reversão (volta ao estado anterior, que é o mais permissivo):
--   create policy "social_dm_events_admin_read" on public.social_dm_events for select to authenticated using (true);
