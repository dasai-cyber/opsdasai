import re

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update AddTechModal state
content = content.replace(
    'phone: "",\n    estadoCivil: "",',
    'phone: "",\n    phone2: "",\n    estadoCivil: "",'
)

# 2. Update AddTechModal input render
content = content.replace(
    '''            {/* Teléfono / Correo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Teléfono <span style={{ color: "#72b01d" }}>*</span>
                </label>
                <input style={inputStyle} placeholder="Ej: 56944771425" value={form.phone} onChange={set("phone")} />
                {errors.phone && <div style={errStyle}>{errors.phone}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Correo electrónico
                </label>
                <input style={inputStyle} type="email" placeholder="nombre@correo.cl" value={form.email} onChange={set("email")} />
              </div>
            </div>''',
    '''            {/* Teléfono / Teléfono 2 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Teléfono <span style={{ color: "#72b01d" }}>*</span>
                </label>
                <input style={inputStyle} placeholder="Ej: 56944771425" value={form.phone} onChange={set("phone")} />
                {errors.phone && <div style={errStyle}>{errors.phone}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  WhatsApp / Secundario
                </label>
                <input style={inputStyle} placeholder="Ej: 56911223344" value={form.phone2} onChange={set("phone2")} />
              </div>
            </div>

            {/* Correo / vacio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Correo electrónico
                </label>
                <input style={inputStyle} type="email" placeholder="nombre@correo.cl" value={form.email} onChange={set("email")} />
              </div>
            </div>'''
)

# 3. Update newTech in AddTechModal
content = content.replace(
    '        phone: form.phone.trim(),\n        estadoCivil: form.estadoCivil.trim(),',
    '        phone: form.phone.trim(),\n        phone2: form.phone2.trim(),\n        estadoCivil: form.estadoCivil.trim(),'
)

# 4. Update EditTechModal state
content = content.replace(
    '    phone: tech.phone,\n    estadoCivil: tech.estadoCivil || "",',
    '    phone: tech.phone,\n    phone2: tech.phone2 || "",\n    estadoCivil: tech.estadoCivil || "",'
)

# 5. Update EditTechModal input render
content = content.replace(
    '''            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Teléfono</label>
                <input style={inputStyle} value={form.phone} onChange={set("phone")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Correo electrónico</label>
                <input style={inputStyle} value={form.email} onChange={set("email")} />
              </div>
            </div>''',
    '''            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Teléfono</label>
                <input style={inputStyle} value={form.phone} onChange={set("phone")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>WhatsApp / Secundario</label>
                <input style={inputStyle} value={form.phone2} onChange={set("phone2")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Correo electrónico</label>
                <input style={inputStyle} value={form.email} onChange={set("email")} />
              </div>
            </div>'''
)

# 6. Update downloadInfo in TechCard
content = content.replace(
    '      `Teléfono: ${tech.phone || "---"}\\n` +',
    '      `Teléfono: ${tech.phone || "---"}\\n` +\n      `Teléfono Secundario: ${tech.phone2 || "---"}\\n` +'
)

# 7. Update TechCard display
content = content.replace(
    '''        <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
          <Phone size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
          <a href={`tel:${tech.phone}`} onClick={e => e.stopPropagation()} className="truncate hover:text-brand-500 transition-colors">{tech.phone}</a>
        </div>''',
    '''        <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
          <Phone size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
          <a href={`tel:${tech.phone}`} onClick={e => e.stopPropagation()} className="truncate hover:text-brand-500 transition-colors">{tech.phone}</a>
        </div>
        {tech.phone2 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
            <Phone size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
            <a href={`https://wa.me/${tech.phone2.replace(/\\D/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="truncate hover:text-brand-500 transition-colors">{tech.phone2}</a>
          </div>
        )}'''
)

# 8. Update fetchAll mapper
content = content.replace(
    '            phone: dt.phone || t.phone || \'\',\n            estadoCivil: dt.estadoCivil || \'\',',
    '            phone: dt.phone || t.phone || \'\',\n            phone2: dt.phone2 || \'\',\n            estadoCivil: dt.estadoCivil || \'\','
)

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch phone2 applied perfectly")
