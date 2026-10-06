import re

def fix_patente():
    path = 'src/app/dashboard/coordinacion/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    old_patente = """<div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Patente Vehículo</label>
                  <input
                    type="text"
                    value={form.patente}
                    onChange={(e) => setForm({...form, patente: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                    placeholder="Ej: AB-CD-12"
                  />
                </div>"""
                
    new_patente = """<div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Patente Vehículo</label>
                  <input
                    list="patentes-list"
                    type="text"
                    value={form.patente}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = choferes.find(c => c.patente && c.patente.toLowerCase() === val.toLowerCase());
                      setForm({
                        ...form,
                        patente: val,
                        asignadoA: matched && matched.name ? matched.name : form.asignadoA
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                    placeholder="Ej: AB-CD-12"
                  />
                  <datalist id="patentes-list">
                    {choferes.filter(c => c.patente).map((c, i) => <option key={i} value={c.patente} />)}
                  </datalist>
                </div>"""

    if old_patente in text:
        text = text.replace(old_patente, new_patente)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print("Patched successfully")
    else:
        print("Target string not found")

fix_patente()
