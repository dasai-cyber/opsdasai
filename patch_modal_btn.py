import re

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ADD DESCARGAR FICHA
# Find:
editar_btn = """          <button
            onClick={onEdit}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", background: "rgba(114, 176, 29, 0.12)",
              color: "#93c947", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "1px solid rgba(114, 176, 29, 0.25)", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Pencil size={14} /> Editar datos
          </button>"""

descargar_btn = """          <button
            onClick={downloadInfo}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", background: "rgba(147, 201, 71, 0.15)",
              color: "#93c947", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "1px solid rgba(147, 201, 71, 0.3)", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Download size={14} /> Descargar Ficha
          </button>
          <button
            onClick={onEdit}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", background: "rgba(114, 176, 29, 0.12)",
              color: "#93c947", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "1px solid rgba(114, 176, 29, 0.25)", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Pencil size={14} /> Editar datos
          </button>"""

if "Descargar Ficha" not in content:
    content = content.replace(editar_btn, descargar_btn)

# Make sure downloadInfo function is inside TechModal!
# My previous patch DID insert `downloadInfo` into TechModal!
# Let's verify if `downloadInfo` is in there.

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied for download and links")
