import re

def fix_bono():
    path = 'src/app/dashboard/coordinacion/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Form label
    old_label = '<label className="block text-xs font-semibold mb-1.5 text-green-400">Bono</label>'
    new_label = '<label className="block text-xs font-semibold mb-1.5 text-green-400">Adicional</label>'
    text = text.replace(old_label, new_label)

    # Table display badge
    old_badge = '{row.bono && <span className="bg-green-500/10 text-green-400 px-2 rounded">Bono: {row.bono}</span>}'
    new_badge = '{row.adicional && <span className="bg-green-500/10 text-green-400 px-2 rounded">Adicional: {row.adicional}</span>}'
    text = text.replace(old_badge, new_badge)
    
    # Internal variables
    text = re.sub(r'\bbono\b', 'adicional', text)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_bono()
print("Fixed Bono -> Adicional")
