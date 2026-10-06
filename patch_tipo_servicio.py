import re

with open('src/types/index.ts', 'r', encoding='utf-8') as f:
    types = f.read()

if 'tipoServicio?: string;' not in types:
    types = types.replace(
        '  anioAuto?: string;',
        '  anioAuto?: string;\n  tipoServicio?: string;'
    )
    with open('src/types/index.ts', 'w', encoding='utf-8') as f:
        f.write(types)

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    tech = f.read()

# 1. Update fetchAll
if 'tipoServicio: dt.tipoServicio' not in tech:
    tech = tech.replace(
        "            anioAuto: dt.anioAuto || '',",
        "            anioAuto: dt.anioAuto || '',\n            tipoServicio: dt.tipoServicio || '',"
    )

# 2. AddTechModal state
if 'tipoServicio: ""' not in tech:
    tech = tech.replace(
        '    anioAuto: "",\n    email: "",',
        '    anioAuto: "",\n    tipoServicio: "",\n    email: "",'
    )

# 3. AddTechModal UI
# Find "Estado Civil / Estudios"
if 'value={form.tipoServicio}' not in tech:
    tech = tech.replace(
        '''            {/* Estado Civil / Estudios */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Estado civil
                </label>
                <input style={inputStyle} placeholder="Ej: Soltero" value={form.estadoCivil} onChange={set("estadoCivil")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Estudios
                </label>
                <input style={inputStyle} placeholder="Ej: Educación Media Completa" value={form.estudios} onChange={set("estudios")} />
              </div>
            </div>''',
        '''            {/* Estado Civil / Estudios / Tipo Servicio */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Estado civil
                </label>
                <input style={inputStyle} placeholder="Ej: Soltero" value={form.estadoCivil} onChange={set("estadoCivil")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Estudios
                </label>
                <input style={inputStyle} placeholder="Ej: Media" value={form.estudios} onChange={set("estudios")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Servicio
                </label>
                <select style={inputStyle} value={form.tipoServicio} onChange={set("tipoServicio")}>
                  <option value="">Seleccione...</option>
                  <option value="Paquetería">Paquetería</option>
                  <option value="Supermercado">Supermercado</option>
                  <option value="Ambas">Ambas</option>
                </select>
              </div>
            </div>'''
    )

# 4. AddTechModal payload
if 'tipoServicio: form.tipoServicio' not in tech:
    tech = tech.replace(
        '        anioAuto: form.anioAuto.trim(),\n        email: form.email.trim(),',
        '        anioAuto: form.anioAuto.trim(),\n        tipoServicio: form.tipoServicio,\n        email: form.email.trim(),'
    )

# 5. EditTechModal state
if 'tipoServicio: tech.tipoServicio' not in tech:
    tech = tech.replace(
        '    anioAuto: tech.anioAuto || "",\n    email: tech.email,',
        '    anioAuto: tech.anioAuto || "",\n    tipoServicio: tech.tipoServicio || "",\n    email: tech.email,'
    )

# 6. EditTechModal UI
if 'onChange={set("tipoServicio")}' not in tech:
    tech = tech.replace(
        '''            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estado Civil</label>
                <input style={inputStyle} value={form.estadoCivil} onChange={set("estadoCivil")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estudios</label>
                <input style={inputStyle} value={form.estudios} onChange={set("estudios")} />
              </div>
            </div>''',
        '''            <div className="grid grid-cols-3 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estado Civil</label>
                <input style={inputStyle} value={form.estadoCivil} onChange={set("estadoCivil")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estudios</label>
                <input style={inputStyle} value={form.estudios} onChange={set("estudios")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Servicio</label>
                <select style={inputStyle} value={form.tipoServicio} onChange={set("tipoServicio")}>
                  <option value="">Seleccione...</option>
                  <option value="Paquetería">Paquetería</option>
                  <option value="Supermercado">Supermercado</option>
                  <option value="Ambas">Ambas</option>
                </select>
              </div>
            </div>'''
    )

# 7. Download Ficha
if 'Servicio:' not in tech:
    tech = tech.replace(
        '      `Año Auto: ${tech.anioAuto || "---"}\\n\\n` +',
        '      `Año Auto: ${tech.anioAuto || "---"}\\n` +\n      `Servicio: ${tech.tipoServicio || "---"}\\n\\n` +'
    )

# 8. TechModal detail display
# I will add a badge next to the status badge
if 'tech.tipoServicio &&' not in tech:
    tech = tech.replace(
        '''          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${STATUS_COLOR[tech.status]}20`, color: STATUS_COLOR[tech.status], border: `1px solid ${STATUS_COLOR[tech.status]}40` }}>
              {tech.status.charAt(0).toUpperCase() + tech.status.slice(1)}
            </div>
            <div className="text-sm" style={{ color: "#64748b" }}>
              RUT: {tech.rut}
            </div>
          </div>''',
        '''          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${STATUS_COLOR[tech.status]}20`, color: STATUS_COLOR[tech.status], border: `1px solid ${STATUS_COLOR[tech.status]}40` }}>
              {tech.status.charAt(0).toUpperCase() + tech.status.slice(1)}
            </div>
            {tech.tipoServicio && (
              <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(148, 163, 184, 0.1)", color: "#94a3b8", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
                {tech.tipoServicio}
              </div>
            )}
            <div className="text-sm" style={{ color: "#64748b" }}>
              RUT: {tech.rut}
            </div>
          </div>'''
    )

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(tech)

# Update autos/page.tsx fetchAll
with open('src/app/dashboard/autos/page.tsx', 'r', encoding='utf-8') as f:
    autos = f.read()

if 'tipoServicio: dt.tipoServicio' not in autos:
    autos = autos.replace(
        "            anioAuto: dt.anioAuto || '',",
        "            anioAuto: dt.anioAuto || '',\n            tipoServicio: dt.tipoServicio || '',"
    )
    with open('src/app/dashboard/autos/page.tsx', 'w', encoding='utf-8') as f:
        f.write(autos)

print("Patch applied for tipoServicio")
