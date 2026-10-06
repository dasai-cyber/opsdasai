import re

def add_rating_mapping(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Look for the productivity mapping and add rating after it
    if 'productivity: dt.productivity || t.productivity || 0,' in text:
        text = text.replace('productivity: dt.productivity || t.productivity || 0,', 'productivity: dt.productivity || t.productivity || 0,\n            rating: dt.rating || 0,')
    elif 'productivity: d.productivity || 0,' in text:
        text = text.replace('productivity: d.productivity || 0,', 'productivity: d.productivity || 0,\n            rating: d.rating || 0,')
    elif 'productivity: d.productivity || t.productivity || 0,' in text:
        text = text.replace('productivity: d.productivity || t.productivity || 0,', 'productivity: d.productivity || t.productivity || 0,\n            rating: d.rating || 0,')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Patched {path}")

add_rating_mapping('src/app/dashboard/autos/page.tsx')
add_rating_mapping('src/app/dashboard/technicians/page.tsx')
