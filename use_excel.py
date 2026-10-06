import re

def rewrite_export(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Add import * as XLSX from 'xlsx'; at the top
    if "import * as XLSX from 'xlsx';" not in text:
        text = text.replace('import { supabase } from "@/lib/supabase";', 'import { supabase } from "@/lib/supabase";\nimport * as XLSX from "xlsx";')
        
    old_export = """  const exportToCSV = () => {
    if (technicians.length === 0) return;

    const headers = [
      "ID", "Nombre", "RUT", "Dirección", "Comuna", "Teléfono 1", "Teléfono 2",
      "Estado Civil", "Estudios", "Patente", "Modelo Auto", "Año Auto", "Tipo Servicio",
      "Email", "Estado"
    ];

    const rows = technicians.map(t => [
      t.id, t.name, t.rut, t.direccion, t.comuna, t.phone, t.phone2,
      t.estadoCivil, t.estudios, t.patente, t.modeloAuto, t.anioAuto, t.tipoServicio,
      t.email, t.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(","))
    ].join("\\n");

    const blob = new Blob(["\\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Choferes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };"""

    new_export = """  const exportToExcel = () => {
    if (technicians.length === 0) return;

    const data = technicians.map(t => ({
      ID: t.id,
      Nombre: t.name,
      RUT: t.rut,
      "Dirección": t.direccion,
      Comuna: t.comuna,
      "Teléfono 1": t.phone,
      "Teléfono 2": t.phone2,
      "Estado Civil": t.estadoCivil,
      Estudios: t.estudios,
      Patente: t.patente,
      "Modelo Auto": t.modeloAuto,
      "Año Auto": t.anioAuto,
      "Tipo Servicio": t.tipoServicio,
      Email: t.email,
      Estado: t.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Choferes");

    XLSX.writeFile(workbook, `Choferes_${new Date().toISOString().split("T")[0]}.xlsx`);
  };"""

    text = text.replace(old_export, new_export)
    
    # Update button onClick
    text = text.replace('onClick={exportToCSV}', 'onClick={exportToExcel}')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

rewrite_export('src/app/dashboard/technicians/page.tsx')
print("Patched to use Excel export")
