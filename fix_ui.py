import re

def fix_ui(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # AddTechModal & EditTechModal replacements
    
    # 1. State init for AddTechModal
    if "estudios: ''," in text and "nLocal: ''," not in text:
        text = text.replace("estudios: '',", "estudios: '',\n    nLocal: '',")
        
    # 2. State init for EditTechModal (inside useEffect)
    if "estudios: tech.estudios || ''," in text and "nLocal: tech.nLocal" not in text:
        text = text.replace("estudios: tech.estudios || '',", "estudios: tech.estudios || '',\n      nLocal: tech.nLocal || '',")
    
    # 3. Add UI elements next to Estado civil
    # Find block containing Estado civil / Estudios / Tipo Servicio
    # and replace grid-cols-3 with grid-cols-4 and add the new div.
    
    pattern1 = r"(<div className=\"grid grid-cols-3 gap-3\">\s*<div>\s*<label[^>]*>\s*Estado civil\s*</label>)"
    new_div1 = r"""<div className="grid grid-cols-4 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  N° Local
                </label>
                <input style={inputStyle} placeholder="Ej: 123" value={form.nLocal || ''} onChange={set("nLocal")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Estado civil
                </label>"""
    text = re.sub(pattern1, new_div1, text)

    pattern2 = r"(<div className=\"grid grid-cols-3 gap-3\">\s*<div>\s*<label[^>]*>\s*Estado Civil\s*</label>)"
    new_div2 = r"""<div className="grid grid-cols-4 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  N° Local
                </label>
                <input style={inputStyle} placeholder="Ej: 123" value={form.nLocal || ''} onChange={set("nLocal")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Estado Civil
                </label>"""
    text = re.sub(pattern2, new_div2, text)

    # 4. Save Logic in handleAdd
    if "tipoServicio: form.tipoServicio," in text and "nLocal: form.nLocal" not in text:
        text = text.replace("tipoServicio: form.tipoServicio,", "tipoServicio: form.tipoServicio,\n        nLocal: form.nLocal,")

    # 5. Save Logic in handleSave (Edit)
    if "tipoServicio: form.tipoServicio," in text and "nLocal: form.nLocal" not in text:
        text = text.replace("tipoServicio: form.tipoServicio,", "tipoServicio: form.tipoServicio,\n        nLocal: form.nLocal,")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_ui('src/app/dashboard/technicians/page.tsx')
print("Fixed UI")
