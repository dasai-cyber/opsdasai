import re

with open('src/app/dashboard/autos/page.tsx', 'r', encoding='utf-8') as f:
    autos = f.read()

# 1. EditAutoModal - state for docs
autos = autos.replace(
    '    permisoCirculacion: null as File | null,\n  });',
    '    permisoCirculacion: null as File | null,\n    soap: null as File | null,\n    padron: null as File | null,\n  });'
)

# 2. EditAutoModal - upload docs
autos = autos.replace(
    "      if (docs.permisoCirculacion) autoDocsUrls.permisoCirculacion = await uploadDocument(docs.permisoCirculacion, tech.id, 'permisoCirculacion');",
    "      if (docs.permisoCirculacion) autoDocsUrls.permisoCirculacion = await uploadDocument(docs.permisoCirculacion, tech.id, 'permisoCirculacion');\n      if (docs.soap) autoDocsUrls.soap = await uploadDocument(docs.soap, tech.id, 'soap');\n      if (docs.padron) autoDocsUrls.padron = await uploadDocument(docs.padron, tech.id, 'padron');"
)

# 3. EditAutoModal - UI inputs
autos = autos.replace(
    '            <DocInput label="Permiso de Circulación" field="permisoCirculacion" currentUrl={tech.autoDocumentos?.permisoCirculacion} />\n          </div>',
    '            <DocInput label="Permiso de Circulación" field="permisoCirculacion" currentUrl={tech.autoDocumentos?.permisoCirculacion} />\n            <DocInput label="SOAP" field="soap" currentUrl={tech.autoDocumentos?.soap} />\n            <DocInput label="Padrón del Vehículo" field="padron" currentUrl={tech.autoDocumentos?.padron} />\n          </div>'
)

# 4. AutoCard - UI inputs
autos = autos.replace(
    '        <div className="flex items-center justify-between">\n          <span className="text-xs text-slate-400 flex items-center gap-2"><FileBox size={12} /> Permiso de Circ.</span>\n          {getDocStatus(tech.autoDocumentos?.permisoCirculacion)}\n        </div>\n      </div>',
    '        <div className="flex items-center justify-between">\n          <span className="text-xs text-slate-400 flex items-center gap-2"><FileBox size={12} /> Permiso de Circ.</span>\n          {getDocStatus(tech.autoDocumentos?.permisoCirculacion)}\n        </div>\n        <div className="flex items-center justify-between">\n          <span className="text-xs text-slate-400 flex items-center gap-2"><FileBox size={12} /> SOAP</span>\n          {getDocStatus(tech.autoDocumentos?.soap)}\n        </div>\n        <div className="flex items-center justify-between">\n          <span className="text-xs text-slate-400 flex items-center gap-2"><FileBox size={12} /> Padrón</span>\n          {getDocStatus(tech.autoDocumentos?.padron)}\n        </div>\n      </div>'
)

# 5. Search feature
if 'const [searchQuery, setSearchQuery] = useState("");' not in autos:
    autos = autos.replace(
        '  const [editingTech, setEditingTech] = useState<Technician | null>(null);',
        '  const [editingTech, setEditingTech] = useState<Technician | null>(null);\n  const [searchQuery, setSearchQuery] = useState("");'
    )

if 'const filteredAutos =' not in autos:
    autos = autos.replace(
        '  return (\n    <div className="space-y-6">',
        '  const filteredAutos = technicians.filter(t => \n    (t.patente && t.patente.toLowerCase().includes(searchQuery.toLowerCase())) ||\n    (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase()))\n  );\n\n  return (\n    <div className="space-y-6">'
    )

search_bar = '''      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Documentación de Autos</h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Administra los documentos de los vehículos registrados en la plataforma.
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#64748b" }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por patente o chofer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9", borderRadius: 8, transition: "border 0.2s"
              }}
            />
          </div>
        </div>
      </div>'''

autos = autos.replace(
    '''      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Documentación de Autos</h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Administra los documentos de los vehículos registrados en la plataforma.
          </p>
        </div>
      </div>''',
    search_bar
)

autos = autos.replace(
    '{technicians.map(tech => (',
    '{filteredAutos.map(tech => ('
)

# "No hay autos" vs "No hay resultados"
autos = autos.replace(
    '''      ) : technicians.length === 0 ? (
        <div className="text-center py-12" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)" }}>
          <Car size={40} className="mx-auto mb-3" style={{ color: "#475569" }} />
          <h3 className="text-lg font-medium" style={{ color: "#e2e8f0" }}>No hay autos registrados</h3>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Para que aparezca un auto aquí, debes asignarle una <strong>Patente</strong> a un chofer en su ficha respectiva.
          </p>
        </div>
      ) : (''',
    '''      ) : technicians.length === 0 ? (
        <div className="text-center py-12" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)" }}>
          <Car size={40} className="mx-auto mb-3" style={{ color: "#475569" }} />
          <h3 className="text-lg font-medium" style={{ color: "#e2e8f0" }}>No hay autos registrados</h3>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Para que aparezca un auto aquí, debes asignarle una <strong>Patente</strong> a un chofer en su ficha respectiva.
          </p>
        </div>
      ) : filteredAutos.length === 0 ? (
        <div className="text-center py-12" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3" style={{ color: "#475569" }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <h3 className="text-lg font-medium" style={{ color: "#e2e8f0" }}>No hay resultados</h3>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            No encontramos ningún auto que coincida con "{searchQuery}".
          </p>
        </div>
      ) : ('''
)


with open('src/app/dashboard/autos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(autos)

print("Added SOAP, Padron and search to Autos")
