import re

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Patente to AddTechModal input (after Estudios)
# Look for <input style={inputStyle} placeholder="Ej: Educación Media Completa" value={form.estudios} onChange={set("estudios")} />
add_estudios_str = """                  <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estudios</label>
                  <input style={inputStyle} placeholder="Ej: Educación Media Completa" value={form.estudios} onChange={set("estudios")} />
                </div>"""

add_estudios_patente = """                  <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estudios</label>
                  <input style={inputStyle} placeholder="Ej: Educación Media Completa" value={form.estudios} onChange={set("estudios")} />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Patente Vehículo</label>
                  <input style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="Ej: AB-CD-12" value={form.patente} onChange={set("patente")} />
                </div>"""

if "Patente Vehículo" not in add_estudios_patente or add_estudios_str in content:
    content = content.replace(add_estudios_str, add_estudios_patente)


# 2. Add Patente to EditTechModal input (after Estudios)
# Look for:
edit_estudios_str = """                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estudios</label>
                <input style={inputStyle} value={form.estudios} onChange={set("estudios")} />
              </div>"""

edit_estudios_patente = """                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estudios</label>
                <input style={inputStyle} value={form.estudios} onChange={set("estudios")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Patente Vehículo</label>
                <input style={{ ...inputStyle, textTransform: "uppercase" }} value={form.patente} onChange={set("patente")} />
              </div>"""

if "Patente Vehículo" not in edit_estudios_patente or edit_estudios_str in content:
    content = content.replace(edit_estudios_str, edit_estudios_patente)

# 3. Add Estudios and Patente to the TechModal (Profile view)
# Currently, it maps over contact fields:
# { icon: MapPin, value: tech.direccion || "—" },
# Let's add them to that list! But wait, we need an icon for them.
# Let's use `Briefcase` for Estudios and `Car` for Patente. Wait, are they imported?
# The imports: User, Search, MapPin, Phone, Mail, FileText, ChevronRight, Download, Plus, AlertCircle, Calendar, Star, Clock, Trash2, X, Upload
# We can just use `FileText` for Estudios and `MapPin` (or `AlertCircle`) for Patente.
# Actually, the user screenshot of the profile view (Nadia) only has CONTACTO and PERFIL DE RENDIMIENTO.
# We should add a new section or add to CONTACTO.
# "CONTACTO" has 4 fields. Let's add it to the array.
contacto_str = """                {[
                  { icon: Phone, value: <a href={`tel:${tech.phone}`} className="text-sm font-medium hover:text-brand-500 transition-colors" style={{ color: "#f1f5f9", textDecoration: "none" }}>{tech.phone}</a> },
                  { icon: Mail, value: <a href={tech.email ? `mailto:${tech.email}` : undefined} className="text-sm font-medium hover:text-brand-500 transition-colors" style={{ color: "#f1f5f9", textDecoration: "none" }}>{tech.email || "—"}</a> },
                  { icon: MapPin, value: tech.comuna || "—" },
                  { icon: MapPin, value: tech.direccion || "—" },
                ].map((item, i) => ("""

contacto_patente = """                {[
                  { icon: Phone, value: <a href={`tel:${tech.phone}`} className="text-sm font-medium hover:text-brand-500 transition-colors" style={{ color: "#f1f5f9", textDecoration: "none" }}>{tech.phone}</a> },
                  { icon: Mail, value: <a href={tech.email ? `mailto:${tech.email}` : undefined} className="text-sm font-medium hover:text-brand-500 transition-colors" style={{ color: "#f1f5f9", textDecoration: "none" }}>{tech.email || "—"}</a> },
                  { icon: MapPin, value: tech.comuna || "—" },
                  { icon: MapPin, value: tech.direccion || "—" },
                  { icon: FileText, value: tech.estudios || "—" },
                  { icon: FileText, value: tech.patente ? `Patente: ${tech.patente}` : "Sin Patente" },
                ].map((item, i) => ("""

content = content.replace(contacto_str, contacto_patente)


# Now about the "Descargar Ficha" button missing...
# In my previous script, I looked for:
# <div className="p-5 flex justify-end gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
# Let's check what was the actual footer!
footer_search = '<div className="p-5 flex justify-end gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>'
if footer_search in content:
    print("Footer search found!")

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch real applied")
