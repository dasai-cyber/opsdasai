-- POLÍTICAS DE SEGURIDAD (RLS) PARA CONTROL DE VUELTAS

-- Habilitar RLS en todas las tablas
alter table control_choferes enable row level security;
alter table control_tipos_carga enable row level security;
alter table control_vehiculos enable row level security;
alter table control_puntos_entrega enable row level security;
alter table control_vueltas enable row level security;

-- Función de seguridad para comprobar si el usuario actual es administrador (lee de tu tabla profiles)
create or replace function control_is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and rol = 'administrador'
  );
end;
$$ language plpgsql security definer;

-- =====================================
-- POLÍTICAS PARA CHOFERES (APLICACIÓN MÓVIL)
-- =====================================
-- Un chofer autenticado puede ver su propio perfil
create policy "Choferes pueden ver su propio perfil" on control_choferes for select using (auth.uid() = id);

-- Un chofer autenticado puede ver catálogos
create policy "Choferes pueden ver tipos de carga" on control_tipos_carga for select using (auth.role() = 'authenticated');
create policy "Choferes pueden ver vehiculos" on control_vehiculos for select using (auth.role() = 'authenticated');
create policy "Choferes pueden ver puntos de entrega" on control_puntos_entrega for select using (auth.role() = 'authenticated');

-- Un chofer solo ve, inserta y actualiza sus propias vueltas
create policy "Choferes pueden ver sus propias vueltas" on control_vueltas for select using (auth.uid() = chofer_id);
create policy "Choferes pueden insertar sus propias vueltas" on control_vueltas for insert with check (auth.uid() = chofer_id);
create policy "Choferes pueden actualizar sus propias vueltas en ruta" on control_vueltas for update using (auth.uid() = chofer_id and estado = 'en_ruta') with check (auth.uid() = chofer_id);

-- =====================================
-- POLÍTICAS PARA ADMINISTRADORES (PANEL WEB)
-- =====================================

create policy "Admins ven todos los perfiles de choferes" on control_choferes for select using (control_is_admin());
create policy "Admins insertan perfiles de choferes" on control_choferes for insert with check (control_is_admin());
create policy "Admins actualizan perfiles de choferes" on control_choferes for update using (control_is_admin());
create policy "Admins eliminan perfiles de choferes" on control_choferes for delete using (control_is_admin());

create policy "Admins insertan tipos_carga" on control_tipos_carga for insert with check (control_is_admin());
create policy "Admins actualizan tipos_carga" on control_tipos_carga for update using (control_is_admin());
create policy "Admins eliminan tipos_carga" on control_tipos_carga for delete using (control_is_admin());

create policy "Admins insertan vehiculos" on control_vehiculos for insert with check (control_is_admin());
create policy "Admins actualizan vehiculos" on control_vehiculos for update using (control_is_admin());
create policy "Admins eliminan vehiculos" on control_vehiculos for delete using (control_is_admin());

create policy "Admins insertan puntos_entrega" on control_puntos_entrega for insert with check (control_is_admin());
create policy "Admins actualizan puntos_entrega" on control_puntos_entrega for update using (control_is_admin());
create policy "Admins eliminan puntos_entrega" on control_puntos_entrega for delete using (control_is_admin());

create policy "Admins ven todas las vueltas" on control_vueltas for select using (control_is_admin());
create policy "Admins actualizan todas las vueltas" on control_vueltas for update using (control_is_admin());
create policy "Admins eliminan todas las vueltas" on control_vueltas for delete using (control_is_admin());
