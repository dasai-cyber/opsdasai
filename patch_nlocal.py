import re

def patch_technicians(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Fetch mapping
    text = text.replace("tipoServicio: dt.tipoServicio || '',", "tipoServicio: dt.tipoServicio || '',\n            nLocal: dt.nLocal || '',")

    # 2. AddTechModal initial state
    text = text.replace("tipoServicio: '',", "tipoServicio: '',\n    nLocal: '',")

    # 3. AddTechModal UI
    old_row = """          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Estado civil</label>"""
    new_row = """          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">N° Local</label>
              <input
                type="text"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-white"
                placeholder="Ej: 123"
                value={form.nLocal}
                onChange={e => setForm({ ...form, nLocal: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Estado civil</label>"""
    text = text.replace(old_row, new_row)
    
    # 4. EditTechModal UI
    old_edit_row = """          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Estado Civil</label>"""
    new_edit_row = """          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">N° Local</label>
              <input
                type="text"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-white"
                value={form.nLocal || ''}
                onChange={e => setForm({ ...form, nLocal: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Estado Civil</label>"""
    text = text.replace(old_edit_row, new_edit_row)

    # 5. Export to Excel
    text = text.replace('"Tipo Servicio": t.tipoServicio,', '"Tipo Servicio": t.tipoServicio,\n      "N° Local": t.nLocal,')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Patched {path}")

def patch_autos(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Fetch mapping
    text = text.replace("tipoServicio: dt.tipoServicio || '',", "tipoServicio: dt.tipoServicio || '',\n            nLocal: dt.nLocal || '',")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Patched {path}")

patch_technicians('src/app/dashboard/technicians/page.tsx')
patch_autos('src/app/dashboard/autos/page.tsx')
