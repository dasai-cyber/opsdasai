import re

def fix_state(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # AddTechModal
    text = text.replace('estudios: "",', 'estudios: "",\n    nLocal: "",')
    
    # EditTechModal
    text = text.replace('estudios: tech.estudios || "",', 'estudios: tech.estudios || "",\n      nLocal: tech.nLocal || "",')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_state('src/app/dashboard/technicians/page.tsx')
print("Fixed states")
