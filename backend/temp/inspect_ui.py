import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

div_ids = re.findall(r'id=["\']([^"\']+)["\']', content)
print("Matching IDs:")
for i in div_ids:
    if any(k in i.lower() for k in ['reader', 'pdf', 'viewer', 'modal', 'book', 'flip']):
        print(" -", i)

funcs = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', content)
print("\nMatching Functions:")
for fn in funcs:
    if any(k in fn.lower() for k in ['reader', 'pdf', 'book', 'render', 'chapter', 'open', 'view', 'read']):
        print(" -", fn)
