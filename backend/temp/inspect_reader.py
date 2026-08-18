with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if any(k in line for k in ['function openInteractiveReader', 'function buildReaderPages', 'function renderReaderPage', 'function processChapterHtml']):
        print(f"--- Line {i+1} ---")
        for j in range(max(0, i-2), min(len(lines), i+80)):
            print(f"{j+1}: {lines[j]}", end="")
