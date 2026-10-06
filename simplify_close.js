const fs = require('fs');
let file = fs.readFileSync('src/app/dashboard/autos/page.tsx', 'utf8');

const oldConfirm = `  const confirmClose = () => {
    if (window.confirm("¿Deseas GUARDAR los datos antes de salir? (Aceptar = Guardar, Cancelar = No guardar)")) {
      handleSave();
    } else {
      if (window.confirm("¿Deseas salir sin guardar y perder los cambios?")) {
        onClose();
      }
    }
  };`;

const newConfirm = `  const confirmClose = () => {
    if (window.confirm("¿Deseas guardar los cambios antes de salir?\\n\\n[Aceptar] = Guardar y cerrar\\n[Cancelar] = Cerrar sin guardar")) {
      handleSave();
    } else {
      onClose();
    }
  };`;

file = file.replace(oldConfirm, newConfirm);
fs.writeFileSync('src/app/dashboard/autos/page.tsx', file);

// Also do it for technicians page
let file2 = fs.readFileSync('src/app/dashboard/technicians/page.tsx', 'utf8');
file2 = file2.replace(oldConfirm, newConfirm);
// Note: technicians page might have it twice (AddTechModal and EditTechModal)
file2 = file2.replace(oldConfirm, newConfirm);
fs.writeFileSync('src/app/dashboard/technicians/page.tsx', file2);

console.log("Simplified confirmClose");
