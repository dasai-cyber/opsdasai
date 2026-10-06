import re

def brute_fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Find the confirmClose function
    # It might be present multiple times (e.g. AddTechModal, EditTechModal)
    
    # We will replace all occurrences of a confirmClose function that starts with:
    # const confirmClose = () => {
    # ... any characters ...
    # };
    
    pattern = r"const confirmClose = \(\) => \{.*?\n\s*\};"
    
    # We know what it should be:
    new_func = """const confirmClose = () => {
    if (window.confirm("¿Deseas guardar los cambios antes de salir?\\n\\n[Aceptar] = Guardar y cerrar\\n[Cancelar] = Cerrar sin guardar")) {
      handleSave();
    } else {
      onClose();
    }
  };"""
    
    # Use re.DOTALL to let .* match newlines
    text = re.sub(pattern, new_func, text, flags=re.DOTALL)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

brute_fix('src/app/dashboard/autos/page.tsx')
brute_fix('src/app/dashboard/technicians/page.tsx')
print("Applied brute fix")
