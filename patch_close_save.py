import re

# 1. Update technicians page
with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    tech = f.read()

# AddTechModal: replace confirmClose
old_confirm_add = '''  const confirmClose = () => {
    if (window.confirm("¿Estás seguro de que deseas cerrar? Se perderán los cambios no guardados."))
      onClose();
  };'''

new_confirm_add = '''  const confirmClose = () => {
    if (window.confirm("¿Deseas GUARDAR los datos antes de salir? (Aceptar = Guardar, Cancelar = No guardar)")) {
      handleAdd();
    } else {
      if (window.confirm("¿Deseas salir sin guardar y perder los cambios?")) {
        onClose();
      }
    }
  };'''

tech = tech.replace(old_confirm_add, new_confirm_add)

# EditTechModal: replace confirmClose
old_confirm_edit = '''  const confirmClose = () => {
    if (window.confirm("¿Estás seguro de que deseas cerrar? Se perderán los cambios no guardados."))
      onClose();
  };'''

new_confirm_edit = '''  const confirmClose = () => {
    if (window.confirm("¿Deseas GUARDAR los datos antes de salir? (Aceptar = Guardar, Cancelar = No guardar)")) {
      handleSave();
    } else {
      if (window.confirm("¿Deseas salir sin guardar y perder los cambios?")) {
        onClose();
      }
    }
  };'''

tech = tech.replace(old_confirm_edit, new_confirm_edit)

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(tech)

# 2. Update autos page
with open('src/app/dashboard/autos/page.tsx', 'r', encoding='utf-8') as f:
    autos = f.read()

autos = autos.replace(old_confirm_edit, new_confirm_edit)

with open('src/app/dashboard/autos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(autos)

print("Double confirm patch applied")
