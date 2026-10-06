const fs = require('fs');
let file = fs.readFileSync('src/app/dashboard/programacion/page.tsx', 'utf8');

file = file.replace('<th className="px-4 py-3 font-medium text-center">Ruta</th>', '<th className="px-4 py-3 font-medium text-center">N° LOCAL</th>');
file = file.replace('<label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Ruta (Ej: 95)</label>', '<label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>N° LOCAL (Ej: 95)</label>');
file = file.replace('placeholder="Buscar chofer, ruta, patente..."', 'placeholder="Buscar chofer, n° local, patente..."');

fs.writeFileSync('src/app/dashboard/programacion/page.tsx', file);
console.log("Renamed Ruta to N° LOCAL");
