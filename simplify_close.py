import re

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Replace the confirmClose function
    pattern = r"const confirmClose = \(\) => \{\n\s*if \(window\.confirm\(\"¿Deseas GUARDAR[\s\S]*?\}\n\s*\};\n"
    
    new_func = """const confirmClose = () => {
    if (window.confirm("¿Deseas guardar los cambios antes de salir?\\n\\n[Aceptar] = Guardar y cerrar\\n[Cancelar] = Cerrar sin guardar")) {
      handleSave();
    } else {
      onClose();
    }
  };\n"""
    
    if re.search(pattern, text):
        text = re.sub(pattern, new_func, text)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Fixed {path}")
    else:
        print(f"Could not find pattern in {path}")

fix_file('src/app/dashboard/autos/page.tsx')
fix_file('src/app/dashboard/technicians/page.tsx')
