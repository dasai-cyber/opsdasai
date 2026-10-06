-- Agregar columna patente a los choferes de la PWA
ALTER TABLE control_choferes ADD COLUMN IF NOT EXISTS patente TEXT;
