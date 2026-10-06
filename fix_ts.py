import re

def fix_ts():
    path = 'src/app/dashboard/coordinacion/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    text = text.replace('{(row.valorDia || row.valorDia === 0 || row.valorDia === "0") &&', '{(row.valorDia !== "" && row.valorDia !== undefined) &&')
    text = text.replace('{(row.adicional || row.adicional === 0 || row.adicional === "0") &&', '{(row.adicional !== "" && row.adicional !== undefined) &&')
    text = text.replace('{(row.vueltas || row.vueltas === 0 || row.vueltas === "0") &&', '{(row.vueltas !== "" && row.vueltas !== undefined) &&')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_ts()
