const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/dashboard/technicians/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Helper
if (!content.includes('uploadDocument')) {
  content = content.replace('// ─── Add Technician Modal', `
const uploadDocument = async (file: File | null, id: string, name: string) => {
  if (!file) return undefined;
  const fileExt = file.name.split('.').pop();
  const filePath = \`\${id}/\${name}-\${Date.now()}.\${fileExt}\`;
  const { error } = await supabase.storage.from('choferes_docs').upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from('choferes_docs').getPublicUrl(filePath);
  return data.publicUrl;
};

// ─── Add Technician Modal`);
}

// AddTechModal states
content = content.replace(`  const [certifications, setCertifications] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");`, `  const [docs, setDocs] = useState({
    hojaConductor: null as File | null,
    licencia: null as File | null,
    carnet: null as File | null,
    certificadoAntecedentes: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");`);

// AddTechModal set & validate
content = content.replace(`  const addCert = () => {
    const c = form.certInput.trim();
    if (c && !certifications.includes(c)) {
      setCertifications((prev) => [...prev, c]);
      setForm((f) => ({ ...f, certInput: "" }));
    }
  };`, ``);

// AddTechModal handleSave
content = content.replace(`  const handleSave = async () => {
    if (!validate()) return;
    const newId = \`tech-\${Date.now()}\`;
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
  };`, `  const handleSave = async () => {
    if (!validate()) return;
    setSaveError("");
    setUploading(true);
    const newId = \`tech-\${Date.now()}\`;
    
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
  };`);

const docsUI = `            {/* Documentos */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)" }}>
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
            </div>`;

// AddTechModal UI
content = content.replace(`            {/* Estado */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                Estado inicial
              </label>`, `${docsUI}\n\n            {/* Estado */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                Estado inicial
              </label>`);

// AddTechModal UI Button
content = content.replace(`{saved ? "¡Guardado!" : "Guardar Chofer"}`, `{uploading ? "Subiendo..." : saved ? "¡Guardado!" : "Guardar Chofer"}`);


// EditTechModal states
content = content.replace(`  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");`, `  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [docs, setDocs] = useState({
    hojaConductor: null as File | null,
    licencia: null as File | null,
    carnet: null as File | null,
    certificadoAntecedentes: null as File | null,
  });`);

// EditTechModal handleSave
content = content.replace(`  const handleSave = async () => {
    setSaving(true); setSaveError("");
    const updated = { ...tech, ...form };
    const { error } = await supabase.from('tecnicos').update({
      data: updated
    }).eq('id', tech.id);
    if (error) { setSaveError('Error: ' + error.message); setSaving(false); return; }
    setSaved(true);
    setTimeout(() => { onSave(updated); onClose(); }, 800);
    setSaving(false);
  };`, `  const handleSave = async () => {
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
  };`);

// EditTechModal UI docs
content = content.replace(`            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estado</label>`, `${docsUI}\n\n            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estado</label>`);

// EditTechModal button
content = content.replace(`{saving ? <CheckCircle2 size={16} /> : <Save size={16} />}
                Guardar Cambios`, `{saving ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {saving ? "Subiendo..." : "Guardar Cambios"}`);


// TechModal Display docs
const displayDocsUI = `
              {/* Documentos */}
              {(tech.documentos?.hojaConductor || tech.documentos?.licencia || tech.documentos?.carnet || tech.documentos?.certificadoAntecedentes) && (
                <div>
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
`;

content = content.replace(`{/* Certificaciones eliminadas */}`, displayDocsUI);

// fetchAll mapper
content = content.replace(`productivity: dt.productivity || t.productivity || 0,
          };`, `productivity: dt.productivity || t.productivity || 0,
            documentos: dt.documentos || {},
          };`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Success");
