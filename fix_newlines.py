import re

def fix_newlines(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # We need to replace actual physical newlines inside the window.confirm with \n
    # Look for window.confirm("... \n\n[Aceptar] = Guardar y cerrar\n[Cancelar] = Cerrar sin guardar")
    # Actually, it's easier to just re-replace the whole function!
    
    # We will use regex to find confirmClose
    pattern = r"const confirmClose = \(\) => \{\n\s*if \(window\.confirm\(\"¿Deseas guardar los cambios antes de salir\?[\s\S]*?sin guardar\"\)\) \{\n\s*handleSave\(\);\n\s*\} else \{\n\s*onClose\(\);\n\s*\}\n\s*\};"
    
    new_func = """const confirmClose = () => {
    if (window.confirm("¿Deseas guardar los cambios antes de salir?\\n\\n[Aceptar] = Guardar y cerrar\\n[Cancelar] = Cerrar sin guardar")) {
      handleSave();
    } else {
      onClose();
    }
  };"""
    
    text = re.sub(pattern, new_func, text)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    
    print(f"Fixed newlines in {path}")

fix_newlines('src/app/dashboard/autos/page.tsx')
fix_newlines('src/app/dashboard/technicians/page.tsx')
