import re

with open('src/app/dashboard/coordinacion/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State array
content = content.replace(
    'const [choferes, setChoferes] = useState<string[]>([]);',
    'const [choferes, setChoferes] = useState<Array<{name: string, patente: string}>>([]);'
)

# 2. Fetch mapping
fetch_str = 'setChoferes(rows.map(r => r.data?.name || "").filter(Boolean));'
fetch_new = 'setChoferes(rows.map(r => ({ name: r.data?.name || "", patente: r.data?.patente || "" })).filter(c => c.name));'
content = content.replace(fetch_str, fetch_new)

# 3. Input mapping
input_str = """                  <input
                    type="text"
                    list="choferes-list"
                    value={form.asignadoA}
                    onChange={(e) => setForm({...form, asignadoA: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                    placeholder="Escriba o seleccione..."
                  />"""

input_new = """                  <input
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
                  />"""
content = content.replace(input_str, input_new)

# 4. Datalist mapping
datalist_str = '{choferes.map((c, i) => <option key={i} value={c} />)}'
datalist_new = '{choferes.map((c, i) => <option key={i} value={c.name} />)}'
content = content.replace(datalist_str, datalist_new)

with open('src/app/dashboard/coordinacion/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch autocomplete patente applied")
