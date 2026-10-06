import re

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Find where productivity is mapped and insert rating after it
    pattern = r"(productivity:\s*[^,]+,)"
    
    # only insert if rating: is not already there
    if 'rating:' not in text.split('productivity:')[1][:100]:
        text = re.sub(pattern, r"\1\n            rating: dt.rating || 0,", text)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Fixed {path}")
    else:
        print(f"Already fixed {path}")

fix('src/app/dashboard/autos/page.tsx')
fix('src/app/dashboard/technicians/page.tsx')
