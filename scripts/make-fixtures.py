"""Örnek fiş / fatura görselleri ve PWA ikonları. Sentetik belgelerdir."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
PUBLIC.mkdir(exist_ok=True)

MONO = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 22)
MONO_SM = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 18)
MONO_B = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 24)
SANS = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf", 22)
SANS_B = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf", 26)
SANS_SM = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf", 18)
SERIF = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf", 42)
INK = (28, 28, 28)
MUTED = (70, 70, 70)


def right_text(draw: ImageDraw.ImageDraw, text: str, y: int, font: ImageFont.FreeTypeFont, fill, right: int) -> None:
    box = draw.textbbox((0, 0), text, font=font)
    draw.text((right - (box[2] - box[0]), y), text, font=font, fill=fill)


def center(draw: ImageDraw.ImageDraw, text: str, y: int, font: ImageFont.FreeTypeFont, width: int, fill=INK) -> None:
    box = draw.textbbox((0, 0), text, font=font)
    x = (width - (box[2] - box[0])) // 2
    draw.text((x, y), text, font=font, fill=fill)


def receipt() -> None:
    w, h = 520, 980
    img = Image.new("RGB", (w, h), (246, 243, 236))
    draw = ImageDraw.Draw(img)
    y = 36
    for line, font in (
        ("AKDENİZ AKARYAKIT A.Ş.", MONO_B),
        ("Turhan Cemal Beriker Blv. No:88", MONO_SM),
        ("Seyhan / ADANA", MONO_SM),
        ("VKN: 6123456784", MONO),
        ("SEYHAN VD", MONO),
    ):
        center(draw, line, y, font, w)
        y += 32 if font is MONO_SM else 36
    y += 8
    draw.line((28, y, w - 28, y), fill=INK, width=2)
    y += 16
    draw.text((36, y), "04.11.2026", font=MONO, fill=INK)
    draw.text((300, y), "14:32", font=MONO, fill=INK)
    y += 36
    draw.text((36, y), "FIS NO", font=MONO, fill=INK)
    draw.text((300, y), "004218", font=MONO, fill=INK)
    y += 34
    draw.text((36, y), "Z NO", font=MONO, fill=INK)
    draw.text((160, y), "118", font=MONO, fill=INK)
    draw.text((250, y), "EKU NO", font=MONO, fill=INK)
    draw.text((380, y), "0003", font=MONO, fill=INK)
    y += 40
    draw.line((28, y, w - 28, y), fill=INK, width=1)
    y += 18
    draw.text((36, y), "MOTORIN", font=MONO_B, fill=INK)
    y += 36
    draw.text((36, y), "40,00 LT x 25,00", font=MONO, fill=MUTED)
    y += 40
    draw.text((36, y), "KDV %20", font=MONO, fill=INK)
    y += 40
    draw.line((28, y, w - 28, y), fill=INK, width=1)
    y += 16
    rows = (
        ("MATRAH %20", "1.000,00"),
        ("KDV %20", "*200,00"),
        ("TOPLAM", "*1.200,00"),
        ("NAKIT", "*1.200,00"),
    )
    for label, amount in rows:
        font = MONO_B if label == "TOPLAM" else MONO
        draw.text((36, y), label, font=font, fill=INK)
        box = draw.textbbox((0, 0), amount, font=font)
        draw.text((w - 36 - (box[2] - box[0]), y), amount, font=font, fill=INK)
        y += 38
    y += 8
    draw.line((28, y, w - 28, y), fill=INK, width=2)
    y += 28
    center(draw, "ÖRNEK FİŞ — MALİ DEĞERİ YOKTUR", y, MONO_SM, w, MUTED)
    img.save(PUBLIC / "ornek-fis.png", optimize=True)


def invoice() -> None:
    w, h = 900, 1200
    img = Image.new("RGB", (w, h), (255, 252, 245))
    draw = ImageDraw.Draw(img)
    draw.rectangle((24, 24, w - 24, h - 24), outline=(40, 40, 40), width=3)
    draw.rectangle((40, 40, w - 40, 150), outline=(160, 48, 32), width=2)
    center(draw, "FATURA", 52, SERIF, w, (160, 48, 32))
    center(draw, "ÖRNEK BELGE  ·  MALİ DEĞERİ YOKTUR", 108, SANS_SM, w, MUTED)

    draw.text((56, 180), "ÇUKUROVA GÜBRE TARIM LTD. ŞTİ.", font=SANS_B, fill=INK)
    draw.text((56, 220), "Karataş Yolu 12. km  Yüreğir / Adana", font=SANS, fill=MUTED)
    draw.text((56, 258), "VKN  8450123492", font=SANS, fill=INK)
    draw.text((56, 294), "Vergi dairesi", font=SANS_SM, fill=MUTED)
    draw.text((220, 288), "Yüreğir", font=SANS_B, fill=(30, 48, 110))

    # Bulanık vergi dairesi: modelin düşük güven vermesini örnekleyen leke.
    smudge = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(smudge)
    sd.ellipse((200, 276, 390, 330), fill=(180, 170, 150, 90))
    smudge = smudge.filter(ImageFilter.GaussianBlur(3))
    img.paste(Image.alpha_composite(img.convert("RGBA"), smudge).convert("RGB"))
    draw = ImageDraw.Draw(img)

    draw.rectangle((520, 180, 848, 330), outline=INK, width=2)
    meta = (
        (536, 196, "Fatura no"),
        (536, 228, "CUK2026000000142"),
        (536, 268, "Tarih"),
        (536, 298, "18.11.2026"),
    )
    for x, y, text in meta:
        font = SANS_B if text.startswith("CUK") or text.startswith("18") else SANS_SM
        draw.text((x, y), text, font=font, fill=INK)

    headers_y = 380
    draw.rectangle((48, headers_y, 852, headers_y + 40), fill=(36, 48, 31))
    for x, text in ((64, "Açıklama"), (470, "Matrah"), (620, "KDV"), (740, "Tutar")):
        draw.text((x, headers_y + 8), text, font=SANS_SM, fill=(244, 239, 228))

    lines = (
        ("Üre gübresi 50 kg", "500,00", "%1", "5,00"),
        ("Yaprak gübresi", "250,00", "%10", "25,00"),
    )
    y = 440
    for desc, matrah, oran, kdv in lines:
        draw.text((64, y), desc, font=SANS, fill=INK)
        draw.text((470, y), matrah, font=SANS, fill=INK)
        draw.text((630, y), oran, font=SANS, fill=INK)
        draw.text((740, y), kdv, font=SANS, fill=INK)
        y += 48
        draw.line((48, y, 852, y), fill=(220, 210, 196), width=1)
        y += 12

    y = 640
    draw.text((64, y), "Ödeme: açık hesap", font=SANS, fill=INK)
    box_top = 760
    draw.rectangle((480, box_top, 848, box_top + 180), outline=INK, width=2)
    draw.text((500, box_top + 18), "Satır toplamı", font=SANS_SM, fill=MUTED)
    right_text(draw, "780,00", box_top + 14, SANS, MUTED, 828)
    draw.text((500, box_top + 72), "Genel toplam", font=SANS, fill=INK)
    right_text(draw, "782,00", box_top + 62, SANS_B, (140, 32, 32), 828)
    draw.text((500, box_top + 124), "KDV dahil, TL", font=SANS_SM, fill=MUTED)
    draw.text((64, 980), "El yazısı toplam, satırlarla 2,00 TL ayrışıyor.", font=SANS_SM, fill=MUTED)
    draw.text((64, 1020), "Bu görsel uygulamayı denemek içindir.", font=SANS_SM, fill=MUTED)
    img.save(PUBLIC / "ornek-fatura.png", optimize=True)


def icon(size: int, name: str) -> None:
    img = Image.new("RGB", (size, size), (36, 48, 31))
    draw = ImageDraw.Draw(img)
    pad = int(size * 0.18)
    draw.rounded_rectangle((pad, pad, size - pad, size - pad), radius=int(size * 0.08), fill=(244, 239, 228))
    inner = pad + int(size * 0.06)
    draw.rounded_rectangle(
        (inner, inner + int(size * 0.04), size - inner, size - inner),
        radius=int(size * 0.04),
        outline=(36, 48, 31),
        width=max(2, size // 48),
    )
    # Küçük kil rengi fiş şeridi
    band_h = max(6, size // 18)
    draw.rectangle((inner, inner + int(size * 0.16), size - inner, inner + int(size * 0.16) + band_h), fill=(178, 74, 40))
    img.save(PUBLIC / name, optimize=True)


if __name__ == "__main__":
    receipt()
    invoice()
    icon(192, "icon-192.png")
    icon(512, "icon-512.png")
    icon(180, "apple-touch-icon.png")
    print("wrote fixtures")
