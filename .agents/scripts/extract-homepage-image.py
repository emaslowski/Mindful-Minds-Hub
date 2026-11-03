from pathlib import Path
import fitz

source = Path("attached_assets/DOC110326-11032026142156_1793733716161.pdf")
output = Path("generated-artifacts/homepage-image")
output.mkdir(parents=True, exist_ok=True)
document = fitz.open(source)
print("Pages:", len(document))
page = document[0]
page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5)).save(output / "page.png")
for index, image in enumerate(page.get_images(full=True)):
    extracted = document.extract_image(image[0])
    target = output / f"image-{index}.{extracted['ext']}"
    target.write_bytes(extracted["image"])
    print(target, extracted["width"], extracted["height"])
