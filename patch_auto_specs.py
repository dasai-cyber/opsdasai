import re

with open('src/types/index.ts', 'r', encoding='utf-8') as f:
    types = f.read()

types = types.replace(
    '  patente?: string;',
    '  patente?: string;\n  modeloAuto?: string;\n  anioAuto?: string;'
)

with open('src/types/index.ts', 'w', encoding='utf-8') as f:
    f.write(types)

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    tech = f.read()

# AddTechModal state
tech = tech.replace(
    '    estudios: "",\n    patente: "",',
    '    estudios: "",\n    patente: "",\n    modeloAuto: "",\n    anioAuto: "",'
)

# AddTechModal input UI
tech = tech.replace(
    '''            {/* Patente */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                Patente Vehículo
              </label>
              <input style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="EJ: AB-CD-12" value={form.patente} onChange={set("patente")} />
            </div>''',
    '''            {/* Vehículo info */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Patente Vehículo
                </label>
                <input style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="EJ: AB-CD-12" value={form.patente} onChange={set("patente")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Modelo
                </label>
                <input style={inputStyle} placeholder="Ej: Kia Rio" value={form.modeloAuto} onChange={set("modeloAuto")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Año
                </label>
                <input style={inputStyle} placeholder="Ej: 2018" value={form.anioAuto} onChange={set("anioAuto")} />
              </div>
            </div>'''
)

# AddTechModal newTech mapping
tech = tech.replace(
    '        patente: form.patente.trim().toUpperCase(),\n        email: form.email.trim(),',
    '        patente: form.patente.trim().toUpperCase(),\n        modeloAuto: form.modeloAuto.trim(),\n        anioAuto: form.anioAuto.trim(),\n        email: form.email.trim(),'
)

# EditTechModal state
tech = tech.replace(
    '    estudios: tech.estudios || "",\n    patente: tech.patente || "",',
    '    estudios: tech.estudios || "",\n    patente: tech.patente || "",\n    modeloAuto: tech.modeloAuto || "",\n    anioAuto: tech.anioAuto || "",'
)

# EditTechModal input UI
tech = tech.replace(
    '''            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Patente Vehículo</label>
                <input style={{ ...inputStyle, textTransform: "uppercase" }} value={form.patente} onChange={set("patente")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estado</label>
                <select style={inputStyle} value={form.status} onChange={set("status")}>
                  <option value="disponible">Disponible</option>
                  <option value="en ruta">En ruta</option>
                  <option value="trabajando">Trabajando</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>''',
    '''            <div className="grid grid-cols-3 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Patente Vehículo</label>
                <input style={{ ...inputStyle, textTransform: "uppercase" }} value={form.patente} onChange={set("patente")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Modelo Auto</label>
                <input style={inputStyle} value={form.modeloAuto} onChange={set("modeloAuto")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Año Auto</label>
                <input style={inputStyle} value={form.anioAuto} onChange={set("anioAuto")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estado</label>
                <select style={inputStyle} value={form.status} onChange={set("status")}>
                  <option value="disponible">Disponible</option>
                  <option value="en ruta">En ruta</option>
                  <option value="trabajando">Trabajando</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>'''
)

# TechCard Download text
tech = tech.replace(
    '      `Patente Vehículo: ${tech.patente || "---"}\\n\\n` +',
    '      `Patente Vehículo: ${tech.patente || "---"}\\n` +\n      `Modelo Auto: ${tech.modeloAuto || "---"}\\n` +\n      `Año Auto: ${tech.anioAuto || "---"}\\n\\n` +'
)

# fetchAll mapping
tech = tech.replace(
    '            estudios: dt.estudios || \'\',\n            patente: dt.patente || \'\',',
    '            estudios: dt.estudios || \'\',\n            patente: dt.patente || \'\',\n            modeloAuto: dt.modeloAuto || \'\',\n            anioAuto: dt.anioAuto || \'\','
)

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(tech)

print("Patch applied for auto specs")
