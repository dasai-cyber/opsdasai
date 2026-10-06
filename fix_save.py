import re

with open('src/app/dashboard/programacion/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(
    r"await supabase\.from\('servicios'\)\.update\(\{[\s\S]*?\}\)\.eq\('id', record\.id\);",
    "await supabase.from('servicios').update({ data: payload }).eq('id', record.id);",
    text
)

text = re.sub(
    r"await supabase\.from\('servicios'\)\.insert\(\{[\s\S]*?data: payload\n\s*\}\);",
    "await supabase.from('servicios').insert({ id, data: payload });",
    text
)

with open('src/app/dashboard/programacion/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done via python")
