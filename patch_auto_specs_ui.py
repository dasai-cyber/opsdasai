import re

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    tech = f.read()

tech = tech.replace(
    '''            {/* Patente */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                Patente Vehículo
              </label>
              <input style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="Ej: AB-CD-12" value={form.patente} onChange={set("patente")} />
            </div>''',
    '''            {/* Vehículo info */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Patente
                </label>
                <input style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="EJ: AB-CD-12" value={form.patente} onChange={set("patente")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Modelo
                </label>
                <input style={inputStyle} placeholder="Ej: Kia Rio" value={form.modeloAuto} onChange={set("modeloAuto")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Año
                </label>
                <input style={inputStyle} placeholder="Ej: 2018" value={form.anioAuto} onChange={set("anioAuto")} />
              </div>
            </div>'''
)

with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(tech)
