-- ============================================================================
-- jeffrey-blog · reacciones (T16, FR-005)
--
-- YA APLICADA el 2026-07-17 al proyecto cullwwdkcgnwgqjmfmqn — copia de
-- referencia; NO volver a correr. blog_reactions vive en el proyecto Supabase
-- de bot-salesforce por decisión del usuario (plan.md, Flag A).
-- NUNCA apuntar esto al proyecto de zarix.
--
-- Modelo de acceso: RLS habilitado SIN policies → deny-all para anon y
-- authenticated; solo service_role (que bypassea RLS) opera, siempre desde
-- los route handlers del blog (la key jamás toca el cliente).
-- ============================================================================

create table public.blog_reactions (
  slug text primary key,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.blog_reactions enable row level security;
-- Sin policies a propósito: deny-all para anon/authenticated.

revoke all on table public.blog_reactions from anon, authenticated;

-- Upsert + incremento atómico: una fila por slug, contador nunca negativo.
create or replace function public.blog_increment_reaction(p_slug text)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.blog_reactions as r (slug, count, updated_at)
  values (p_slug, 1, now())
  on conflict (slug) do update
    set count = r.count + 1,
        updated_at = now()
  returning r.count;
$$;

-- EXECUTE solo para service_role.
revoke execute on function public.blog_increment_reaction(text)
  from public, anon, authenticated;
grant execute on function public.blog_increment_reaction(text) to service_role;
