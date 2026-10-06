import re

with open('src/app/dashboard/coordinacion/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

asignado_block = """                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Asignado a</label>
                  <input
                    type="text"
                    list="choferes-list"
                    value={form.asignadoA}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const matched = choferes.find(c => c.name === selectedName);
                      setForm({
                        ...form, 
                        asignadoA: selectedName,
                        patente: matched && matched.patente && !form.patente ? matched.patente : (matched && matched.patente && form.patente !== matched.patente ? matched.patente : form.patente)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                    placeholder="Escriba o seleccione..."
                  />
                  <datalist id="choferes-list">
                    {choferes.map((c, i) => <option key={i} value={c.name} />)}
                  </datalist>
                </div>"""

if asignado_block in content:
    # Remove it from its original place
    content = content.replace(asignado_block, "")
    
    # Insert it at the top of the grid
    grid_start = '<div className="grid grid-cols-2 md:grid-cols-3 gap-5">'
    
    # We want to put it right after grid_start
    content = content.replace(grid_start, grid_start + "\n" + asignado_block)
    
    with open('src/app/dashboard/coordinacion/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Reorder applied successfully")
else:
    print("Asignado block not found. Cannot reorder.")
