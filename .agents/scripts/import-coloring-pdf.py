"""Render the supplied coloring scans for inspection and online painting."""
from pathlib import Path
import pymupdf
from PIL import Image, ImageChops, ImageDraw, ImageOps

source = Path("attached_assets/DOC110426-11042026094546_1793803853092.pdf")
output = Path("generated-artifacts/coloring-pages")
output.mkdir(parents=True, exist_ok=True)
document = pymupdf.open(source)
sheet = Image.new("RGB", (900, 2 * 640), "white")
draw = ImageDraw.Draw(sheet)
for index, page in enumerate(document):
    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
    image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
    image.save(output / f"page-{index + 1}.png")
    # The scanner's right/bottom edge is not part of the drawings.
    image = image.crop((0, 0, int(image.width * 0.975), int(image.height * 0.975)))
    if index == 1:
        image = image.transpose(Image.Transpose.ROTATE_90)
    # Drop colored notebook rules while retaining neutral graphite and ink.
    red, green, blue = image.split()
    ink = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    ink = ImageOps.autocontrast(ink, cutoff=1)
    ink = ink.point(lambda value: 255 if value > 205 else max(0, int(value * 0.7)))
    bounds = ink.point(lambda value: 255 if value < 160 else 0).getbbox()
    if bounds:
        ink = ink.crop(bounds)
    ink = ImageOps.expand(ink, border=30, fill=255)
    ink.save(output / f"painting-{index + 1}.webp", lossless=True)
    image = ink.convert("RGB")
    image.thumbnail((280, 590))
    x, y = (index % 3) * 300, (index // 3) * 640
    sheet.paste(image, (x, y + 30))
    draw.text((x + 8, y + 8), f"Page {index + 1}", fill="black")
sheet.save(output / "contact-sheet.jpg")
print(f"Rendered {len(document)} coloring pages.")
