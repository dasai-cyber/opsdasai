import sys

def exact_replace(content, old, new):
    if old not in content:
        print(f"Warning: could not find segment:\n{old[:100]}...")
        return content
    return content.replace(old, new)

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# AddTechModal states
old_add_states = """  const [docs, setDocs] = useState({
    hojaConductor: null as File | null,
    licencia: null as File | null,
    carnet: null as File | null,
    certificadoAntecedentes: null as File | null,
  });"""
new_add_states = """  const [docs, setDocs] = useState({
    hojaConductor: null as File | null,
    licenciaFrontal: null as File | null,
    licenciaTrasera: null as File | null,
    carnetFrontal: null as File | null,
    carnetTrasera: null as File | null,
    certificadoAntecedentes: null as File | null,
  });"""
content = exact_replace(content, old_add_states, new_add_states)

# AddTechModal save
old_add_save = """      if (docs.hojaConductor) docsUrls.hojaConductor = await uploadDocument(docs.hojaConductor, newId, 'hojaConductor');
      if (docs.licencia) docsUrls.licencia = await uploadDocument(docs.licencia, newId, 'licencia');
      if (docs.carnet) docsUrls.carnet = await uploadDocument(docs.carnet, newId, 'carnet');
      if (docs.certificadoAntecedentes) docsUrls.certificadoAntecedentes = await uploadDocument(docs.certificadoAntecedentes, newId, 'certificadoAntecedentes');"""
new_add_save = """      if (docs.hojaConductor) docsUrls.hojaConductor = await uploadDocument(docs.hojaConductor, newId, 'hojaConductor');
      if (docs.licenciaFrontal) docsUrls.licenciaFrontal = await uploadDocument(docs.licenciaFrontal, newId, 'licenciaFrontal');
      if (docs.licenciaTrasera) docsUrls.licenciaTrasera = await uploadDocument(docs.licenciaTrasera, newId, 'licenciaTrasera');
      if (docs.carnetFrontal) docsUrls.carnetFrontal = await uploadDocument(docs.carnetFrontal, newId, 'carnetFrontal');
      if (docs.carnetTrasera) docsUrls.carnetTrasera = await uploadDocument(docs.carnetTrasera, newId, 'carnetTrasera');
      if (docs.certificadoAntecedentes) docsUrls.certificadoAntecedentes = await uploadDocument(docs.certificadoAntecedentes, newId, 'certificadoAntecedentes');"""
content = exact_replace(content, old_add_save, new_add_save)

# EditTechModal save
old_edit_save = """      if (docs.hojaConductor) docsUrls.hojaConductor = await uploadDocument(docs.hojaConductor, tech.id, 'hojaConductor');
      if (docs.licencia) docsUrls.licencia = await uploadDocument(docs.licencia, tech.id, 'licencia');
      if (docs.carnet) docsUrls.carnet = await uploadDocument(docs.carnet, tech.id, 'carnet');
      if (docs.certificadoAntecedentes) docsUrls.certificadoAntecedentes = await uploadDocument(docs.certificadoAntecedentes, tech.id, 'certificadoAntecedentes');"""
new_edit_save = """      if (docs.hojaConductor) docsUrls.hojaConductor = await uploadDocument(docs.hojaConductor, tech.id, 'hojaConductor');
      if (docs.licenciaFrontal) docsUrls.licenciaFrontal = await uploadDocument(docs.licenciaFrontal, tech.id, 'licenciaFrontal');
      if (docs.licenciaTrasera) docsUrls.licenciaTrasera = await uploadDocument(docs.licenciaTrasera, tech.id, 'licenciaTrasera');
      if (docs.carnetFrontal) docsUrls.carnetFrontal = await uploadDocument(docs.carnetFrontal, tech.id, 'carnetFrontal');
      if (docs.carnetTrasera) docsUrls.carnetTrasera = await uploadDocument(docs.carnetTrasera, tech.id, 'carnetTrasera');
      if (docs.certificadoAntecedentes) docsUrls.certificadoAntecedentes = await uploadDocument(docs.certificadoAntecedentes, tech.id, 'certificadoAntecedentes');"""
content = exact_replace(content, old_edit_save, new_edit_save)

# UI Docs mapping array
old_ui_map = """                {[
                  { key: 'hojaConductor', label: 'Hoja de Conductor' },
                  { key: 'licencia', label: 'Licencia (Ambos lados)' },
                  { key: 'carnet', label: 'Carnet (Ambos lados)' },
                  { key: 'certificadoAntecedentes', label: 'Cert. de Antecedentes' }
                ].map(({ key, label }) => ("""
new_ui_map = """                {[
                  { key: 'hojaConductor', label: 'Hoja de Conductor' },
                  { key: 'licenciaFrontal', label: 'Licencia (Frontal)' },
                  { key: 'licenciaTrasera', label: 'Licencia (Trasera)' },
                  { key: 'carnetFrontal', label: 'Carnet (Frontal)' },
                  { key: 'carnetTrasera', label: 'Carnet (Trasera)' },
                  { key: 'certificadoAntecedentes', label: 'Cert. de Antecedentes' }
                ].map(({ key, label }) => ("""
content = exact_replace(content, old_ui_map, new_ui_map)
content = exact_replace(content, old_ui_map, new_ui_map) # Run twice for EditTechModal and AddTechModal


# Display Docs mapping array
old_display = """              {(tech.documentos?.hojaConductor || tech.documentos?.licencia || tech.documentos?.carnet || tech.documentos?.certificadoAntecedentes) && (
                <div style={{ marginBottom: 16 }}>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>Documentos Adjuntos</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'hojaConductor', label: 'Hoja de Conductor', url: tech.documentos?.hojaConductor },
                      { key: 'licencia', label: 'Licencia', url: tech.documentos?.licencia },
                      { key: 'carnet', label: 'Carnet', url: tech.documentos?.carnet },
                      { key: 'certificadoAntecedentes', label: 'Antecedentes', url: tech.documentos?.certificadoAntecedentes }
                    ].filter(d => d.url).map((d) => ("""
new_display = """              {(tech.documentos?.hojaConductor || tech.documentos?.licenciaFrontal || tech.documentos?.licenciaTrasera || tech.documentos?.carnetFrontal || tech.documentos?.carnetTrasera || tech.documentos?.certificadoAntecedentes) && (
                <div style={{ marginBottom: 16 }}>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>Documentos Adjuntos</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'hojaConductor', label: 'Hoja de Conductor', url: tech.documentos?.hojaConductor },
                      { key: 'licenciaFrontal', label: 'Licencia (Frontal)', url: tech.documentos?.licenciaFrontal },
                      { key: 'licenciaTrasera', label: 'Licencia (Trasera)', url: tech.documentos?.licenciaTrasera },
                      { key: 'carnetFrontal', label: 'Carnet (Frontal)', url: tech.documentos?.carnetFrontal },
                      { key: 'carnetTrasera', label: 'Carnet (Trasera)', url: tech.documentos?.carnetTrasera },
                      { key: 'certificadoAntecedentes', label: 'Antecedentes', url: tech.documentos?.certificadoAntecedentes }
                    ].filter(d => d.url).map((d) => ("""
content = exact_replace(content, old_display, new_display)

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied")
