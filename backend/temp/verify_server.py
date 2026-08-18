import urllib.request, json

with urllib.request.urlopen('http://127.0.0.1:8000/api/books') as r:
    data = json.loads(r.read().decode())
    print(f"Total books available: {len(data)}")
    for b in data:
        if 'Physical' in b['title']:
            print(f"Book: ID={b['id']}, Title='{b['title']}', Dept={b['dept']}, Chapters={len(b.get('chapters', []))}, PDF={b.get('pdf_path')}")

with urllib.request.urlopen('http://127.0.0.1:8000/') as r:
    print(f"Root HTML status: {r.status}, length: {len(r.read())}")
