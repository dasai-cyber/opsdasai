-- SCHEMA PARA CONTROL DE VUELTAS (aislado con prefijo control_)

create table control_choferes (
  id uuid primary key references auth.users(id) on delete cascade,
  codigo text unique not null,
  nombre text not null,
  activo boolean not null default true,
  aviso_gps_aceptado_en timestamptz,
  creado_en timestamptz not null default now()
);

create table control_tipos_carga (
  id serial primary key,
  nombre text unique not null,
  activo boolean not null default true
);

create table control_vehiculos (
  id serial primary key,
  patente text unique not null,
  descripcion text,
  activo boolean not null default true
);

create table control_puntos_entrega (
  id serial primary key,
  nombre text not null,
  direccion text,
  lat double precision,
  lng double precision,
  activo boolean not null default true
);

create table control_vueltas (
  id uuid primary key,                       
  chofer_id uuid not null references control_choferes(id),
  vehiculo_id int references control_vehiculos(id),
  numero_vuelta int not null check (numero_vuelta > 0),
  tipo_carga_id int not null references control_tipos_carga(id),
  cantidad int not null check (cantidad > 0),
  punto_entrega_id int references control_puntos_entrega(id),
  estado text not null check (estado in ('en_ruta','entregada')) default 'en_ruta',

  hora_partida timestamptz not null,         
  partida_lat double precision,
  partida_lng double precision,
  partida_precision_m real,

  hora_entrega timestamptz,
  entrega_lat double precision,
  entrega_lng double precision,
  entrega_precision_m real,

  distancia_al_punto_m real,                 
  fuera_de_punto boolean default false,      

  recibido_en_servidor timestamptz not null default now(),
  desfase_reloj_seg int,                     
  creado_offline boolean not null default false,
  observacion text
);

-- Un chofer no puede tener dos vueltas en ruta a la vez
create unique index control_una_vuelta_en_ruta
  on control_vueltas (chofer_id) where estado = 'en_ruta';

create index on control_vueltas (chofer_id, hora_partida desc);
create index on control_vueltas (hora_partida desc);

-- Trigger para calcular la distancia de entrega (Haversine)
CREATE OR REPLACE FUNCTION control_calcula_distancia()
RETURNS TRIGGER AS $$
DECLARE
  punto_lat double precision;
  punto_lng double precision;
  distancia real;
BEGIN
  IF NEW.estado = 'entregada' AND OLD.estado = 'en_ruta' THEN
    -- Obtener coordenadas del punto de entrega
    SELECT lat, lng INTO punto_lat, punto_lng
    FROM control_puntos_entrega
    WHERE id = NEW.punto_entrega_id;

    IF punto_lat IS NOT NULL AND NEW.entrega_lat IS NOT NULL THEN
      -- Formula Haversine para distancia en metros
      distancia := 6371000 * 2 * ASIN(SQRT(
        POWER(SIN((NEW.entrega_lat - punto_lat) * pi()/180 / 2), 2) +
        COS(punto_lat * pi()/180) * COS(NEW.entrega_lat * pi()/180) *
        POWER(SIN((NEW.entrega_lng - punto_lng) * pi()/180 / 2), 2)
      ));
      NEW.distancia_al_punto_m := distancia;
      NEW.fuera_de_punto := distancia > 200;
    END IF;

    -- Calcular desfase de tiempo (servidor vs dispositivo)
    NEW.desfase_reloj_seg := EXTRACT(EPOCH FROM (now() - NEW.hora_entrega));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER control_vueltas_before_update
  BEFORE UPDATE ON control_vueltas
  FOR EACH ROW
  EXECUTE FUNCTION control_calcula_distancia();
