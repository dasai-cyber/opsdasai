import re

with open('src/app/dashboard/autos/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the specific block
old_inputs = """              <DocInput label="Revisión Técnica" field="revisionTecnica" currentUrl={tech.autoDocumentos?.revisionTecnica} />
              <DocInput label="Gases" field="gases" currentUrl={tech.autoDocumentos?.gases} />
              <DocInput label="Permiso de Circulación" field="permisoCirculacion" currentUrl={tech.autoDocumentos?.permisoCirculacion} />
            </div>"""

new_inputs = """              <DocInput label="Revisión Técnica" field="revisionTecnica" currentUrl={tech.autoDocumentos?.revisionTecnica} />
              <DocInput label="Gases" field="gases" currentUrl={tech.autoDocumentos?.gases} />
              <DocInput label="Permiso de Circulación" field="permisoCirculacion" currentUrl={tech.autoDocumentos?.permisoCirculacion} />
              <DocInput label="SOAP" field="soap" currentUrl={tech.autoDocumentos?.soap} />
              <DocInput label="Padrón del Vehículo" field="padron" currentUrl={tech.autoDocumentos?.padron} />
            </div>"""

if old_inputs in text:
    text = text.replace(old_inputs, new_inputs)
else:
    print("Could not find old_inputs")

with open('src/app/dashboard/autos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Added SOAP and Padrón to the modal.")
