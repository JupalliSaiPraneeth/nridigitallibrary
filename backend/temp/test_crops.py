import sys, os, pymupdf
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open('backend/storage/pdfs/bad23b4c76_Physical Pharmacy - ajprd.pdf')
page5 = doc[4]
os.makedirs('backend/storage/images', exist_ok=True)

# Test cropping the logo on page 5
logo_rect = pymupdf.Rect(42.0, 138.5, 68.0, 154.0)
pix = page5.get_pixmap(clip=logo_rect, matrix=pymupdf.Matrix(3.0, 3.0), alpha=False)
pix.save('backend/storage/images/test_php_logo.png')
print("Saved test_php_logo.png size:", pix.width, "x", pix.height)

# Test cropping Fig 1.1 and Fig 1.2 on page 13
page13 = doc[12]
fig1_rect = pymupdf.Rect(110.0, 42.0, 406.0, 310.0)
pix1 = page13.get_pixmap(clip=fig1_rect, matrix=pymupdf.Matrix(2.0, 2.0), alpha=False)
pix1.save('backend/storage/images/test_fig1_1.png')
print("Saved test_fig1_1.png size:", pix1.width, "x", pix1.height)

fig2_rect = pymupdf.Rect(110.0, 330.0, 406.0, 598.0)
pix2 = page13.get_pixmap(clip=fig2_rect, matrix=pymupdf.Matrix(2.0, 2.0), alpha=False)
pix2.save('backend/storage/images/test_fig1_2.png')
print("Saved test_fig1_2.png size:", pix2.width, "x", pix2.height)
