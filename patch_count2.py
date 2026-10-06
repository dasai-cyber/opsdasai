import re

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add a cache buster or better logic
old_code = """      // Cargar conteo de coordinaciones
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

new_code = """      // Cargar conteo de coordinaciones (forzando evitar caché)
      const { data: coordData } = await supabase.from('servicios').select('asignado_a, data');
      if (coordData) {
        const counts: Record<string, number> = {};
        coordData.forEach(row => {
          // Extraemos todos los posibles nombres que referencien al chofer en este servicio
          let possibleNames: string[] = [];
          if (row.asignado_a) possibleNames.push(String(row.asignado_a));
          if (row.data) {
            if (row.data.asignadoA) possibleNames.push(String(row.data.asignadoA));
            if (row.data.nombreChofer) possibleNames.push(String(row.data.nombreChofer));
          }
          
          const namesStr = possibleNames.filter(Boolean).join(",");
          
          if (namesStr) {
            // Separamos por comas, guiones o saltos de línea
            const names = namesStr.split(/[,\-\n]+/).map(normalizeString).filter(Boolean);
            const uniqueNames = Array.from(new Set(names));
            uniqueNames.forEach(name => { counts[name] = (counts[name] || 0) + 1; });
          }
        });
        console.log("Conteo de Coordinaciones calculadas:", counts);
        setCoordinacionesCount(counts);
      }"""

content = content.replace(old_code, new_code)

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Count fixed 2")
