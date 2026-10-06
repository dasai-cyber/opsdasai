import re

def fix_router():
    path = 'src/app/chofer/login/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    text = text.replace('router.push("/aviso-gps");', 'router.push("/chofer/aviso-gps");')
    text = text.replace('router.push("/inicio");', 'router.push("/chofer/inicio");')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_router()
print("Rutas corregidas")
