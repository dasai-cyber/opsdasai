import re
with open('src/app/dashboard/autos/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('rating: dt.rating || 0,\n            rating: dt.rating || 0,', 'rating: dt.rating || 0,')
with open('src/app/dashboard/autos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('rating: dt.rating || 0,\n            rating: dt.rating || 0,', 'rating: dt.rating || 0,')
with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Removed duplicates")
