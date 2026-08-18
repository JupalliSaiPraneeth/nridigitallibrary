import sqlite3, json, re

conn = sqlite3.connect('backend/library.db')
c = conn.cursor()
c.execute('SELECT chapter_number, title, start_page, end_page, formatted_html FROM chapters WHERE book_id=14 ORDER BY chapter_number')
chs = c.fetchall()

pages = []
for ch_num, title, start_p, end_p, htmlSrc in chs:
    htmlSrc = htmlSrc or ''
    parts = re.split(r'<div class="reader-page-divider"><span>Page (\d+)</span></div>', htmlSrc)
    if len(parts) > 1:
        preamble = parts[0].strip()
        for i in range(1, len(parts), 2):
            pNum = int(parts[i])
            pContent = parts[i+1].strip()
            if i == 1 and preamble:
                pContent = preamble + '\n' + pContent
            pages.append({'pageNum': pNum, 'chapter': title, 'len': len(pContent)})
    else:
        pages.append({'pageNum': start_p or (len(pages)+1), 'chapter': title, 'len': len(htmlSrc)})

print('Total structured pages:', len(pages))
for p in pages[:15]:
    print(f"Page {p['pageNum']} ({p['chapter']}): length {p['len']} chars")
