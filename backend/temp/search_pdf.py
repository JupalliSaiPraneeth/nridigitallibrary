with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re
matches = [m.start() for m in re.finditer(r'pdf_path|pdfUrl|\.pdf', content)]
print(f"Found {len(matches)} occurrences of pdf in index.html")
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'pdf' in line.lower() and any(k in line.lower() for k in ['btn', 'open', 'view', 'href', 'iframe', 'download', 'storage']):
        print(f"Line {i+1}: {line.strip()[:120]}")
