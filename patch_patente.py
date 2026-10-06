import re

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Interface update
content = content.replace(
    'estudios?: string;',
    'estudios?: string;\n  patente?: string;'
)

# 2. AddTechModal form initial state
content = content.replace(
    'estudios: "",',
    'estudios: "",\n    patente: "",'
)

# 3. EditTechModal form initial state
content = content.replace(
    'estudios: tech.estudios || "",',
    'estudios: tech.estudios || "",\n    patente: tech.patente || "",'
)

# 4. Add UI field in AddTechModal (around line 140, just after estudios)
estudios_input = """              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Nivel de Estudios</label>
                <input
                  type="text"
                  value={formData.estudios}
                  onChange={(e) => setFormData({ ...formData, estudios: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500 transition-colors"
                  placeholder="Ej: Media completa"
                />
              </div>"""

estudios_and_patente_input = """              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Nivel de Estudios</label>
                <input
                  type="text"
                  value={formData.estudios}
                  onChange={(e) => setFormData({ ...formData, estudios: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500 transition-colors"
                  placeholder="Ej: Media completa"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Patente Vehículo</label>
                <input
                  type="text"
                  value={formData.patente}
                  onChange={(e) => setFormData({ ...formData, patente: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500 transition-colors uppercase"
                  placeholder="Ej: AB-CD-12"
                />
              </div>"""

content = content.replace(estudios_input, estudios_and_patente_input)

# 5. Show it in TechModal
estudios_display = """                  <div>
                    <div className="text-xs mb-1" style={{ color: "#94a3b8" }}>Nivel de Estudios</div>
                    <div className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{tech.estudios || "—"}</div>
                  </div>"""

estudios_and_patente_display = """                  <div>
                    <div className="text-xs mb-1" style={{ color: "#94a3b8" }}>Nivel de Estudios</div>
                    <div className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{tech.estudios || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: "#94a3b8" }}>Patente Vehículo</div>
                    <div className="text-sm font-medium uppercase" style={{ color: "#f1f5f9" }}>{tech.patente || "—"}</div>
                  </div>"""

content = content.replace(estudios_display, estudios_and_patente_display)


with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added patente field successfully")
