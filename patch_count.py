import sys

def exact_replace(content, old, new):
    if old not in content:
        print("Warning: could not find segment")
        return content
    return content.replace(old, new)

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """      // Cargar conteo de coordinaciones
      const { data: coordData } = await supabase.from('servicios').select('asignado_a');
      if (coordData) {
        const counts: Record<string, number> = {};
        coordData.forEach(row => {
          if (row.asignado_a) {
            const names = String(row.asignado_a).split(/[,\-]+/).map(normalizeString).filter(Boolean);
            names.forEach(name => { counts[name] = (counts[name] || 0) + 1; });
          }
        });
        setCoordinacionesCount(counts);
      }"""

new_code = """      // Cargar conteo de coordinaciones
      const { data: coordData } = await supabase.from('servicios').select('asignado_a, data');
      if (coordData) {
        const counts: Record<string, number> = {};
        coordData.forEach(row => {
          const namesStr = [
            row.asignado_a, 
            row.data?.asignadoA, 
            row.data?.nombreChofer
          ].filter(Boolean).join(",");
          
          if (namesStr) {
            // Separa por comas o guiones y normaliza para evitar duplicar por espacios extra
            const names = namesStr.split(/[,\-]+/).map(normalizeString).filter(Boolean);
            // Evitar contar al mismo chofer dos veces en el mismo servicio si está en nombreChofer y asignadoA
            const uniqueNames = Array.from(new Set(names));
            uniqueNames.forEach(name => { counts[name] = (counts[name] || 0) + 1; });
          }
        });
        setCoordinacionesCount(counts);
      }"""

content = exact_replace(content, old_code, new_code)

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Count fixed")
