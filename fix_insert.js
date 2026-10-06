const fs = require('fs');
let file = fs.readFileSync('src/app/dashboard/programacion/page.tsx', 'utf8');

file = file.replace(
  `        await supabase.from('servicios').update({
          data: payload,
          fecha: form.fecha // Keep root fecha searchable if needed
        }).eq('id', record.id);`,
  `        await supabase.from('servicios').update({
          data: payload
        }).eq('id', record.id);`
);

file = file.replace(
  `        await supabase.from('servicios').insert({
          id,
          cliente: 'N/A', // dummy for not-null constraints if any
          direccion: 'N/A',
          fecha: form.fecha,
          estado: 'creada',
          data: payload
        });`,
  `        await supabase.from('servicios').insert({
          id,
          data: payload
        });`
);

fs.writeFileSync('src/app/dashboard/programacion/page.tsx', file);
console.log("Fixed insert payload for Programacion");
