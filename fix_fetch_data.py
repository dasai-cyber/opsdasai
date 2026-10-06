import re

def fix_fetch_data():
    path = 'src/app/dashboard/coordinacion/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    old_parsed = """      const parsed: CoordinacionRow[] = rows.map(r => ({
        id: r.id,
        ...(r.data || {})
      }));"""

    new_parsed = """      const parsed: CoordinacionRow[] = rows.map(r => {
        const dt = r.data || {};
        return {
          id: r.id,
          patente: dt.patente || "",
          fecha: dt.fecha || "",
          horaInicio: dt.horaInicio || "",
          horaTermino: dt.horaTermino || "",
          local: dt.local || "",
          folio: dt.folio || dt.guias || "",
          puntos: dt.puntos || "",
          comuna: dt.comuna || "",
          asignadoA: dt.asignadoA || "",
          valorDia: dt.valorDia || dt.descuento || "",
          adicional: dt.adicional || dt.bono || "",
          vueltas: dt.vueltas || ""
        };
      });"""

    text = text.replace(old_parsed, new_parsed)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_fetch_data()
print("Fixed fetch mapping")
