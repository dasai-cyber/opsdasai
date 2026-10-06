import re

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    tech = f.read()

tech = tech.replace('      handleAdd();', '      handleSave();')

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(tech)

print("Fixed handleSave")
