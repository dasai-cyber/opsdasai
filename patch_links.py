import re

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update TechCard links
phone_span_card = '<span className="truncate">{tech.phone}</span>'
phone_link_card = '<a href={`tel:${tech.phone}`} onClick={e => e.stopPropagation()} className="truncate hover:text-brand-500 transition-colors">{tech.phone}</a>'
content = content.replace(phone_span_card, phone_link_card)

email_span_card = '<span className="truncate">{tech.email}</span>'
email_link_card = '<a href={`mailto:${tech.email}`} onClick={e => e.stopPropagation()} className="truncate hover:text-brand-500 transition-colors">{tech.email}</a>'
content = content.replace(email_span_card, email_link_card)

# 2. Update TechModal links
phone_span_modal = '<div className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{tech.phone}</div>'
phone_link_modal = '<a href={`tel:${tech.phone}`} className="text-sm font-medium hover:text-brand-500 transition-colors" style={{ color: "#f1f5f9", textDecoration: "none" }}>{tech.phone}</a>'
content = content.replace(phone_span_modal, phone_link_modal)

email_span_modal = '<div className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{tech.email || "—"}</div>'
email_link_modal = '<a href={tech.email ? `mailto:${tech.email}` : undefined} className="text-sm font-medium hover:text-brand-500 transition-colors" style={{ color: "#f1f5f9", textDecoration: "none" }}>{tech.email || "—"}</a>'
content = content.replace(email_span_modal, email_link_modal)

# 3. Add Download function inside TechModal
tech_modal_start = 'function TechModal({ tech, onClose, onUpdateStatus, onEdit, onDelete }: {'
download_fn = """
  const downloadInfo = () => {
    const text = `FICHA DE CHOFER - OPSDASAI\\n\\n` +
      `Nombre: ${tech.name}\\n` +
      `RUT: ${tech.rut}\\n` +
      `Teléfono: ${tech.phone}\\n` +
      `Email: ${tech.email || "—"}\\n` +
      `Estado: ${tech.status.toUpperCase()}\\n` +
      `Comuna: ${tech.comuna || "—"}\\n` +
      `Dirección: ${tech.direccion || "—"}\\n` +
      `Estado Civil: ${tech.estadoCivil || "—"}\\n` +
      `Nivel de Estudios: ${tech.estudios || "—"}\\n` +
      `Patente Vehículo: ${tech.patente || "—"}\\n\\n` +
      `Métricas:\\n` +
      `- Coordinaciones: ${tech.completedOrders}\\n` +
      `- Productividad: ${tech.productivity}%\\n`;
      
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Chofer_${tech.name.replace(/\\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
"""

content = content.replace(
    '  onDelete: () => void;\n}) {',
    '  onDelete: () => void;\n}) {\n' + download_fn
)

# 4. Add Download button in TechModal footer
# Currently the footer is:
footer_start = """        {/* Botones de acción */}
        <div className="p-5 flex justify-end gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
          <button className="btn-primary" onClick={onEdit}>Editar Perfil</button>
        </div>"""

footer_new = """        {/* Botones de acción */}
        <div className="p-5 flex justify-between items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button className="px-4 py-2 rounded-lg font-medium text-sm transition-colors" style={{ background: "rgba(114, 176, 29, 0.15)", color: "#93c947", border: "1px solid rgba(114, 176, 29, 0.3)" }} onClick={downloadInfo}>
            Descargar Ficha
          </button>
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={onClose}>Cerrar</button>
            <button className="btn-primary" onClick={onEdit}>Editar Perfil</button>
          </div>
        </div>"""

content = content.replace(footer_start, footer_new)

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied for download and links")
