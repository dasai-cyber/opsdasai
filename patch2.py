import sys

def exact_replace(content, old, new):
    if old not in content:
        print(f"Warning: could not find segment:\n{old[:100]}...")
        return content
    return content.replace(old, new)

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. uploadDocument
uploadHelper = """
const uploadDocument = async (file: File | null, id: string, name: string) => {
  if (!file) return undefined;
  const fileExt = file.name.split('.').pop();
  const filePath = `${id}/${name}-${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage.from('choferes_docs').upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from('choferes_docs').getPublicUrl(filePath);
  return data.publicUrl;
};

// ─── Add Technician Modal"""
if 'uploadDocument' not in content:
    content = content.replace('// ─── Add Technician Modal', uploadHelper)

# 2. AddTechModal states
old_add_states = """  });
  const [certifications, setCertifications] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const addCert = () => {
    const c = form.certInput.trim();
    if (c && !certifications.includes(c)) {
      setCertifications((prev) => [...prev, c]);
      setForm((f) => ({ ...f, certInput: "" }));
    }
  };

  const validate = () => {"""

new_add_states = """  });
  const [docs, setDocs] = useState({
    hojaConductor: null as File | null,
    licencia: null as File | null,
    carnet: null as File | null,
    certificadoAntecedentes: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {"""
content = exact_replace(content, old_add_states, new_add_states)

# 3. AddTechModal handleSave
old_add_save = """  const handleSave = async () => {
    if (!validate()) return;
    const newId = `tech-${Date.now()}`;
    const newTech: Technician = {
      id: newId,
      name: form.name.trim(),
      rut: form.rut.trim(),
      direccion: form.direccion.trim(),
      comuna: form.comuna.trim(),
      phone: form.phone.trim(),
      estadoCivil: form.estadoCivil.trim(),
      estudios: form.estudios.trim(),
      email: form.email.trim(),
      status: form.status,
      completedOrders: 0,
      avgTime: 0,
      productivity: 0,
    };
    // Guardar en Supabase
    const { error: insertError } = await supabase.from('tecnicos').insert({
      id: newId,
      data: newTech
    });
    if (insertError) {
      setSaveError('Error al guardar: ' + insertError.message);
      return;
    }
    setSaved(true);
    setTimeout(() => {
      onAdd(newTech);
      onClose();
    }, 900);
  };"""

new_add_save = """  const handleSave = async () => {
    if (!validate()) return;
    setSaveError("");
    setUploading(true);
    const newId = `tech-${Date.now()}`;
    
    try {
      const docsUrls: any = {};
      if (docs.hojaConductor) docsUrls.hojaConductor = await uploadDocument(docs.hojaConductor, newId, 'hojaConductor');
      if (docs.licencia) docsUrls.licencia = await uploadDocument(docs.licencia, newId, 'licencia');
      if (docs.carnet) docsUrls.carnet = await uploadDocument(docs.carnet, newId, 'carnet');
      if (docs.certificadoAntecedentes) docsUrls.certificadoAntecedentes = await uploadDocument(docs.certificadoAntecedentes, newId, 'certificadoAntecedentes');

      const newTech: Technician = {
        id: newId,
        name: form.name.trim(),
        rut: form.rut.trim(),
        direccion: form.direccion.trim(),
        comuna: form.comuna.trim(),
        phone: form.phone.trim(),
        estadoCivil: form.estadoCivil.trim(),
        estudios: form.estudios.trim(),
        email: form.email.trim(),
        status: form.status,
        completedOrders: 0,
        avgTime: 0,
        productivity: 0,
        documentos: docsUrls,
      };
      
      const { error: insertError } = await supabase.from('tecnicos').insert({ id: newId, data: newTech });
      if (insertError) {
        setSaveError('Error al guardar: ' + insertError.message);
        setUploading(false);
        return;
      }
      setSaved(true);
      setTimeout(() => { onAdd(newTech); onClose(); }, 900);
    } catch (e: any) {
      setSaveError("Error al subir archivos: " + e.message);
    } finally {
      setUploading(false);
    }
  };"""
content = exact_replace(content, old_add_save, new_add_save)

docsUI = """            {/* Documentos */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)", marginBottom: 12 }}>
              <div className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>Documentos Adjuntos (PDF o Imagen)</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'hojaConductor', label: 'Hoja de Conductor' },
                  { key: 'licencia', label: 'Licencia (Ambos lados)' },
                  { key: 'carnet', label: 'Carnet (Ambos lados)' },
                  { key: 'certificadoAntecedentes', label: 'Cert. de Antecedentes' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>{label}</label>
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      style={{ fontSize: 12, color: "#e2e8f0", width: "100%" }} 
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setDocs(d => ({ ...d, [key]: file }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>"""

old_add_ui = """            {/* Estado */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                Estado inicial
              </label>"""
new_add_ui = f"{docsUI}\n\n{old_add_ui}"
content = content.replace(old_add_ui, new_add_ui, 1)

old_add_button = """                {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {saved ? "¡Guardado!" : "Guardar Chofer"}
              </button>"""
new_add_button = """                {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {uploading ? "Subiendo..." : saved ? "¡Guardado!" : "Guardar Chofer"}
              </button>"""
content = content.replace(old_add_button, new_add_button, 1)

old_edit_states = """  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");"""
new_edit_states = """  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [docs, setDocs] = useState({
    hojaConductor: null as File | null,
    licencia: null as File | null,
    carnet: null as File | null,
    certificadoAntecedentes: null as File | null,
  });"""
content = exact_replace(content, old_edit_states, new_edit_states)

old_edit_save = """  const handleSave = async () => {
    setSaving(true); setSaveError("");
    const updated = { ...tech, ...form };
    const { error } = await supabase.from('tecnicos').update({
      data: updated
    }).eq('id', tech.id);
    if (error) { setSaveError('Error: ' + error.message); setSaving(false); return; }
    setSaved(true);
    setTimeout(() => { onSave(updated); onClose(); }, 800);
    setSaving(false);
  };"""
new_edit_save = """  const handleSave = async () => {
    setSaving(true); setSaveError("");
    try {
      const docsUrls = { ...(tech.documentos || {}) };
      if (docs.hojaConductor) docsUrls.hojaConductor = await uploadDocument(docs.hojaConductor, tech.id, 'hojaConductor');
      if (docs.licencia) docsUrls.licencia = await uploadDocument(docs.licencia, tech.id, 'licencia');
      if (docs.carnet) docsUrls.carnet = await uploadDocument(docs.carnet, tech.id, 'carnet');
      if (docs.certificadoAntecedentes) docsUrls.certificadoAntecedentes = await uploadDocument(docs.certificadoAntecedentes, tech.id, 'certificadoAntecedentes');

      const updated = { ...tech, ...form, documentos: docsUrls };
      const { error } = await supabase.from('tecnicos').update({ data: updated }).eq('id', tech.id);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => { onSave(updated); onClose(); }, 800);
    } catch (e: any) {
      setSaveError('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };"""
content = exact_replace(content, old_edit_save, new_edit_save)

old_edit_ui = """            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estado</label>"""
new_edit_ui = f"{docsUI}\n\n{old_edit_ui}"
content = content.replace(old_edit_ui, new_edit_ui, 1) # EditTechModal is the second match, but wait, since I did AddTechModal as well, wait! AddTechModal had `{/* Estado */}`. I'll just use exact string.

old_edit_button = """                {saving ? <CheckCircle2 size={16} /> : <Save size={16} />}
                Guardar Cambios
              </button>"""
new_edit_button = """                {saving ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {saving ? "Subiendo..." : "Guardar Cambios"}
              </button>"""
content = content.replace(old_edit_button, new_edit_button)

displayDocsUI = """
              {/* Documentos */}
              {(tech.documentos?.hojaConductor || tech.documentos?.licencia || tech.documentos?.carnet || tech.documentos?.certificadoAntecedentes) && (
                <div style={{ marginBottom: 16 }}>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>Documentos Adjuntos</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'hojaConductor', label: 'Hoja de Conductor', url: tech.documentos?.hojaConductor },
                      { key: 'licencia', label: 'Licencia', url: tech.documentos?.licencia },
                      { key: 'carnet', label: 'Carnet', url: tech.documentos?.carnet },
                      { key: 'certificadoAntecedentes', label: 'Antecedentes', url: tech.documentos?.certificadoAntecedentes }
                    ].filter(d => d.url).map((d) => (
                      <a 
                        key={d.key} 
                        href={d.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg" 
                        style={{ background: "rgba(114,176,29,0.1)", color: "#93c947", fontSize: 12, textDecoration: "none" }}
                      >
                        <Search size={14} /> Ver {d.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
"""
content = content.replace('{/* Certificaciones eliminadas */}', displayDocsUI)

old_mapper = """            productivity: dt.productivity || t.productivity || 0,
          };"""
new_mapper = """            productivity: dt.productivity || t.productivity || 0,
            documentos: dt.documentos || {},
          };"""
content = exact_replace(content, old_mapper, new_mapper)

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
