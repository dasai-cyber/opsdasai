import re

def fix_guias():
    path = 'src/app/dashboard/coordinacion/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Form label
    old_label = '<label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Guías</label>'
    new_label = '<label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Folio</label>'
    text = text.replace(old_label, new_label)

    # Table header
    old_th = '<th className="px-4 py-3 font-semibold">Local / Guías</th>'
    new_th = '<th className="px-4 py-3 font-semibold">Local / Folio</th>'
    text = text.replace(old_th, new_th)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_guias()
print("Fixed Guias -> Folio")
