import re

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add exportToCSV function inside TechniciansPage just before handleAdd
export_func = """
  const exportToCSV = () => {
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
  };

  const handleAdd = (newTech: Technician) => {"""

text = text.replace("  const handleAdd = (newTech: Technician) => {", export_func)


# Add the button in the header
old_header = """        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Plus size={16} /> Agregar chofer
        </button>
      </div>"""

new_header = """        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={exportToCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: 8, color: "#cbd5e1" }}
          >
            <Download size={16} /> Exportar
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={16} /> Agregar chofer
          </button>
        </div>
      </div>"""

text = text.replace(old_header, new_header)

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Added Export button")
