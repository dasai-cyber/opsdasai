import re

def fix_nullish():
    path = 'src/app/dashboard/coordinacion/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # In fetchData:
    old_mapping = """          valorDia: dt.valorDia || dt.descuento || "",
          adicional: dt.adicional || dt.bono || "",
          vueltas: dt.vueltas || "" """
    
    new_mapping = """          valorDia: dt.valorDia ?? dt.descuento ?? "",
          adicional: dt.adicional ?? dt.bono ?? "",
          vueltas: dt.vueltas ?? "" """
    
    text = text.replace(old_mapping, new_mapping)

    # In table rendering:
    # {row.valorDia && ...} evaluates to falsy if row.valorDia === 0
    # Let's change to {row.valorDia !== "" && row.valorDia !== undefined && row.valorDia !== null && ...}
    # Wait, simple: {row.valorDia ? ...} is bad if it's 0.
    
    # Let's just fix the JSX condition
    old_jsx1 = '{row.valorDia && <span className="bg-purple-500/10 text-purple-400 px-2 rounded">Valor día: {row.valorDia}</span>}'
    new_jsx1 = '{(row.valorDia || row.valorDia === 0 || row.valorDia === "0") && <span className="bg-purple-500/10 text-purple-400 px-2 rounded">Valor día: {row.valorDia}</span>}'
    text = text.replace(old_jsx1, new_jsx1)

    old_jsx2 = '{row.adicional && <span className="bg-green-500/10 text-green-400 px-2 rounded">Adicional: {row.adicional}</span>}'
    new_jsx2 = '{(row.adicional || row.adicional === 0 || row.adicional === "0") && <span className="bg-green-500/10 text-green-400 px-2 rounded">Adicional: {row.adicional}</span>}'
    text = text.replace(old_jsx2, new_jsx2)

    old_jsx3 = '{row.vueltas && <span className="bg-blue-500/10 text-blue-400 px-2 rounded">Vueltas: {row.vueltas}</span>}'
    new_jsx3 = '{(row.vueltas || row.vueltas === 0 || row.vueltas === "0") && <span className="bg-blue-500/10 text-blue-400 px-2 rounded">Vueltas: {row.vueltas}</span>}'
    text = text.replace(old_jsx3, new_jsx3)
    
    old_cond = '{(row.valorDia || row.adicional || row.vueltas) ? ('
    new_cond = '{((row.valorDia !== "" && row.valorDia !== undefined) || (row.adicional !== "" && row.adicional !== undefined) || (row.vueltas !== "" && row.vueltas !== undefined)) ? ('
    text = text.replace(old_cond, new_cond)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_nullish()
print("Fixed nullish evaluation")
