import re

with open('src/app/dashboard/coordinacion/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Interface
content = content.replace('  nombreChofer: string;\n', '')

# 2. Form state
content = content.replace('patente: "", nombreChofer: "",', 'patente: "",')
content = content.replace('patente: form.patente,\n        nombreChofer: form.nombreChofer,', 'patente: form.patente,')

# 3. Table Headers
content = content.replace('<th className="px-4 py-3 font-semibold">Chofer</th>\n', '')

# 4. Table Body
content = content.replace('<td className="px-4 py-3 font-medium text-brand-400">{row.nombreChofer || "—"}</td>\n', '')

# 5. Modal Input
# Remove the div for Nombre Chofer completely
modal_input = """                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Nombre Chofer</label>
                  <input
                    type="text"
                    list="choferes-list"
                    value={form.nombreChofer}
                    onChange={(e) => setForm({...form, nombreChofer: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                    placeholder="Escriba o seleccione..."
                  />
                  <datalist id="choferes-list">
                    {choferes.map((c, i) => <option key={i} value={c} />)}
                  </datalist>
                </div>"""

# Replace it with nothing. Wait, we still need the `<datalist id="choferes-list">` for the "Asignado a" field!
# I will move the datalist inside the "Asignado a" field instead of removing it completely.

# First, remove the "Nombre Chofer" div
content = content.replace(modal_input, '')

# Now, add the datalist to "Asignado a"
asignado_a_input = """                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Asignado a</label>
                  <input
                    type="text"
                    list="choferes-list"
                    value={form.asignadoA}
                    onChange={(e) => setForm({...form, asignadoA: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                    placeholder="Escriba o seleccione..."
                  />
                </div>"""

asignado_a_with_datalist = """                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Asignado a</label>
                  <input
                    type="text"
                    list="choferes-list"
                    value={form.asignadoA}
                    onChange={(e) => setForm({...form, asignadoA: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                    placeholder="Escriba o seleccione..."
                  />
                  <datalist id="choferes-list">
                    {choferes.map((c, i) => <option key={i} value={c} />)}
                  </datalist>
                </div>"""

if "<datalist id=\"choferes-list\">" not in content:
    content = content.replace(asignado_a_input, asignado_a_with_datalist)

with open('src/app/dashboard/coordinacion/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed nombreChofer")
