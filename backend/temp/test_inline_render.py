import re, html

def render_rich_line(text_line):
    # Split by inline img markers
    parts = re.split(r'(\[\[INLINE_IMG:.*?\]\])', text_line)
    rendered_parts = []
    for p in parts:
        m = re.match(r'^\[\[INLINE_IMG:(.*?)\]\]$', p)
        if m:
            url = m.group(1).strip()
            rendered_parts.append(f'<img src="{url}" class="reader-inline-logo" alt="Logo" loading="lazy" />')
        else:
            if p:
                rendered_parts.append(html.escape(p))
    return "".join(rendered_parts)

test_str = "[[INLINE_IMG:/storage/images/test_logo.png]] is a trade mark of RPS Publishing"
print("Result:", render_rich_line(test_str))
