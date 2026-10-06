import re

def fix_coordinacion():
    path = 'src/app/dashboard/coordinacion/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Change table display
    old_table = '{row.descuento && <span className="bg-red-500/10 text-red-400 px-2 rounded">Desc: {row.descuento}</span>}'
    new_table = '{row.descuento && <span className="bg-purple-500/10 text-purple-400 px-2 rounded">Valor día: {row.descuento}</span>}'
    text = text.replace(old_table, new_table)

    # Change form label and styles
    old_form = """<label className="block text-xs font-semibold mb-1.5 text-red-400">Descuento</label>
                    <input
                      type="text"
                      value={form.descuento}
                      onChange={(e) => setForm({...form, descuento: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-slate-200 outline-none focus:border-red-500"
                      placeholder="$0"
                    />"""
    
    new_form = """<label className="block text-xs font-semibold mb-1.5 text-purple-400">Valor día</label>
                    <input
                      type="text"
                      value={form.descuento}
                      onChange={(e) => setForm({...form, descuento: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-purple-500/20 bg-purple-500/5 text-sm text-slate-200 outline-none focus:border-purple-500"
                      placeholder="$0"
                    />"""
    text = text.replace(old_form, new_form)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_coordinacion()
print("Fixed coordinacion page")
