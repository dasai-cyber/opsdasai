import re

with open('src/app/dashboard/coordinacion/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update interface
content = content.replace(
    'guias: string;',
    'guias: string;\n  puntos: string;'
)

# 2. Update default form state
content = content.replace(
    'guias: "", comuna:',
    'guias: "", puntos: "", comuna:'
)

# 3. Update payload
content = content.replace(
    'guias: form.guias,',
    'guias: form.guias,\n        puntos: form.puntos,'
)

# 4. Update table headers (Local / Guías -> Local / Guías, maybe we add Puntos?)
# The user wants "agregar un cuadrado mas que se llame Puntos" which means in the form.
# But it's good to show it in the table too. Let's add it next to Comuna.
content = content.replace(
    '<th className="px-4 py-3 font-semibold">Comuna</th>',
    '<th className="px-4 py-3 font-semibold">Comuna</th>\n                <th className="px-4 py-3 font-semibold">Puntos</th>'
)

# Update table body
content = content.replace(
    '<td className="px-4 py-3">{row.comuna || "—"}</td>',
    '<td className="px-4 py-3">{row.comuna || "—"}</td>\n                    <td className="px-4 py-3 text-xs">{row.puntos || "—"}</td>'
)

# 5. Add input square in modal
# The modal has a grid layout: <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
# The `guias` input spans 2 columns: <div className="col-span-2"> ... <label ...>Guías</label> ... </div>
# Let's change `guias` to col-span-1 so `puntos` can fit right next to it, or just add `puntos` as a new col-span-1.
guias_div_old = """                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Guías</label>
                  <input
                    type="text"
                    value={form.guias}
                    onChange={(e) => setForm({...form, guias: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                  />
                </div>"""

guias_div_new = """                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Guías</label>
                  <input
                    type="text"
                    value={form.guias}
                    onChange={(e) => setForm({...form, guias: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Puntos</label>
                  <input
                    type="text"
                    value={form.puntos}
                    onChange={(e) => setForm({...form, puntos: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                  />
                </div>"""

content = content.replace(guias_div_old, guias_div_new)

with open('src/app/dashboard/coordinacion/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added puntos successfully")
