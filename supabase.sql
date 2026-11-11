-- Mis finanzas · tabla para sincronizar entre dispositivos
-- Pega esto en Supabase → SQL Editor → New query → Run (en un proyecto PERSONAL).

create table if not exists public.finanzas_estado (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data       jsonb       not null,
  rev        bigint      not null default 1,
  updated_at timestamptz not null default now()
);

-- Seguridad: cada usuario solo puede ver y modificar su propia fila.
alter table public.finanzas_estado enable row level security;

create policy "propietario lee"       on public.finanzas_estado for select to authenticated using ((select auth.uid()) = user_id);
create policy "propietario inserta"   on public.finanzas_estado for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "propietario actualiza" on public.finanzas_estado for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "propietario borra"     on public.finanzas_estado for delete to authenticated using ((select auth.uid()) = user_id);
