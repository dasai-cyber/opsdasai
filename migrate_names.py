import re

def migrate_names(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # We need to replace `descuento` with `valorDia`
    # and `guias` with `folio`
    # But carefully, so we don't break logic.
    
    # 1. Interfaces
    text = re.sub(r'\bdescuento\b', 'valorDia', text)
    text = re.sub(r'\bguias\b', 'folio', text)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

migrate_names('src/app/dashboard/coordinacion/page.tsx')
print("Migrated names in coordinacion page")
