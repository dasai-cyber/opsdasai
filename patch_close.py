import re

# 1. Update technicians page
with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    tech = f.read()

# Add confirmClose to AddTechModal
if 'const confirmClose' not in tech:
    tech = tech.replace(
        '  const [docs, setDocs] = useState({',
        '  const confirmClose = () => {\n    if (window.confirm("¿Estás seguro de que deseas cerrar? Se perderán los cambios no guardados."))\n      onClose();\n  };\n  const [docs, setDocs] = useState({'
    )

# Add confirmClose to EditTechModal
if 'const confirmClose = () => {' not in tech.split('function EditTechModal')[1]:
    tech = tech.replace(
        '  const [saveError, setSaveError] = useState("");',
        '  const [saveError, setSaveError] = useState("");\n  const confirmClose = () => {\n    if (window.confirm("¿Estás seguro de que deseas cerrar? Se perderán los cambios no guardados."))\n      onClose();\n  };'
    )

# Add confirmClose to TechModal
if 'const confirmClose = () => {' not in tech.split('function TechModal')[1]:
    tech = tech.replace(
        '  const [downloading, setDownloading] = useState(false);',
        '  const [downloading, setDownloading] = useState(false);\n  const confirmClose = () => {\n    onClose(); // No need to confirm on details view\n  };'
    )
    
# Replace onClick={onClose} with onClick={confirmClose} in all these modals
# But wait, TechModal doesn't need confirmation since it's just a view.
# Actually, the user said "cada vez que aparezca la x para cerrar algo". Let's do it everywhere in these forms.

# We will just regex replace all `onClick={onClose}` with `onClick={confirmClose}` inside AddTechModal and EditTechModal.
# But it's easier to just do string replacement for the specific buttons.

# AddTechModal close X
tech = tech.replace(
    '<button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}>\n              <X size={20} />\n            </button>',
    '<button onClick={confirmClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}>\n              <X size={20} />\n            </button>'
)
# AddTechModal Cancelar
tech = tech.replace(
    '<button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>',
    '<button onClick={confirmClose} className="btn-secondary text-sm">Cancelar</button>'
)

# EditTechModal close X
tech = tech.replace(
    '<button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}><X size={20} /></button>',
    '<button onClick={confirmClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}><X size={20} /></button>'
)

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(tech)

# 2. Update autos page
with open('src/app/dashboard/autos/page.tsx', 'r', encoding='utf-8') as f:
    autos = f.read()

if 'const confirmClose' not in autos:
    autos = autos.replace(
        '  const [saveError, setSaveError] = useState("");',
        '  const [saveError, setSaveError] = useState("");\n  const confirmClose = () => {\n    if (window.confirm("¿Estás seguro de que deseas cerrar? Se perderán los cambios no guardados."))\n      onClose();\n  };'
    )
    
autos = autos.replace(
    '<button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}><X size={20} /></button>',
    '<button onClick={confirmClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}><X size={20} /></button>'
)
autos = autos.replace(
    '<button onClick={onClose} style={{ background: "transparent", color: "#94a3b8", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 8 }}>\n              Cancelar\n            </button>',
    '<button onClick={confirmClose} style={{ background: "transparent", color: "#94a3b8", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 8 }}>\n              Cancelar\n            </button>'
)

with open('src/app/dashboard/autos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(autos)

print("Patch applied")
