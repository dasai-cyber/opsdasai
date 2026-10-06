import re

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # The actual confirmClose code before the patch was:
    old_func = """  const confirmClose = () => {
    if (window.confirm("¿Deseas GUARDAR los datos antes de salir? (Aceptar = Guardar, Cancelar = No guardar)")) {
      handleSave();
    } else {
      if (window.confirm("¿Deseas salir sin guardar y perder los cambios?")) {
        onClose();
      }
    }
  };"""

    # We will use exactly this properly indented literal:
    new_func = """  const confirmClose = () => {
    if (window.confirm("¿Deseas guardar los cambios antes de salir?\\n\\n[Aceptar] = Guardar y cerrar\\n[Cancelar] = Cerrar sin guardar")) {
      handleSave();
    } else {
      onClose();
    }
  };"""

    text = text.replace(old_func, new_func)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed", path)

fix('src/app/dashboard/autos/page.tsx')
fix('src/app/dashboard/technicians/page.tsx')
