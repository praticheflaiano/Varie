#!/usr/bin/env python3
"""
Genera le immagini OG 1200x630 degli articoli con lo stesso stile delle
schede già pubblicate (fondo viola o blu notte, etichetta categoria verde
lime, badge rosa del tipo, titolo bianco). Non serve nessuna chiave API.

Uso:
  python3 sito/scripts/genera-og-card.py content/pensioni/2026-11-12-xxx.md [...]
  python3 sito/scripts/genera-og-card.py ARTICOLO --formato quadrato --testo "Testo breve"

Formato og: scrive sito/public/og/<slug>.jpg. Formati quadrato (Facebook/Instagram)
e google (scheda Google): scrivono social/immagini/<slug>-<formato>.jpg. Il titolo della scheda è `og_title` se
presente nel frontmatter, altrimenti `seo_title`, altrimenti `title`.
"""
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RADICE = Path(__file__).resolve().parents[2]
OUT = RADICE / "sito" / "public" / "og"
W, H = 1200, 630

VIOLA = (91, 61, 245)
NOTTE = (20, 21, 42)
ROSA = (255, 92, 137)
LIME = (218, 254, 92)
BIANCO = (255, 255, 255)
GRIGIO = (190, 196, 230)

CATEGORIE = {
    "730-redditi": "730 e redditi",
    "iva": "IVA",
    "isee-dsu": "ISEE",
    "bonus-fiscali": "Bonus",
    "assegno-unico": "Assegno Unico",
    "naspi-disoccupazione": "NASpI",
    "pensioni": "Pensioni",
    "invalidita-civile": "Invalidità",
    "successioni-volture": "Successioni",
    "imu-tributi-locali": "Tributi locali",
    "red-invciv-accas": "RED e INVCIV",
    "detrazioni-deduzioni": "Detrazioni",
    "lavoro-domestico": "Colf e badanti",
}
TIPI = {"informativo": "Info", "scadenza": "Scadenza", "guida": "Guida", "novita": "Novità"}


def font(peso: str, size: int) -> ImageFont.FreeTypeFont:
    nomi = {
        "black": ["InterDisplay-ExtraBold", "Inter-ExtraBold", "InterDisplay-Black", "Inter-Black"],
        "bold": ["InterDisplay-Bold", "Inter-Bold"],
        "regular": ["InterDisplay-Regular", "Inter-Regular"],
    }[peso]
    for base in ["/usr/share/fonts", "/usr/local/share/fonts", str(Path.home() / ".fonts")]:
        for n in nomi:
            trovati = [f for ext in (".otf", ".ttf") for f in Path(base).rglob(n + ext)] if Path(base).exists() else []
            if trovati:
                return ImageFont.truetype(str(trovati[0]), size)
    return ImageFont.truetype("DejaVuSans-Bold.ttf", size)


def frontmatter(percorso: Path) -> dict:
    testo = percorso.read_text(encoding="utf-8")
    blocco = testo.split("---", 2)[1]
    dati = {}
    for riga in blocco.splitlines():
        m = re.match(r'^(\w+):\s*"?(.*?)"?\s*$', riga)
        if m:
            dati[m.group(1)] = m.group(2)
    return dati


def a_capo(draw, testo, fnt, larghezza):
    righe, riga = [], ""
    for parola in testo.split():
        prova = f"{riga} {parola}".strip()
        if draw.textlength(prova, font=fnt) <= larghezza:
            riga = prova
        else:
            righe.append(riga)
            riga = parola
    righe.append(riga)
    return righe


def forma_ruotata(img, box, colore, angolo, raggio=40):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    tile = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(tile).rounded_rectangle((0, 0, w - 1, h - 1), radius=raggio, fill=colore)
    tile = tile.rotate(angolo, expand=True, resample=Image.BICUBIC)
    img.alpha_composite(tile, (x0 - (tile.width - w) // 2, y0 - (tile.height - h) // 2))


def pillola(img, xy, testo, fnt, fondo, colore, angolo=0, ancora_destra=False):
    d = ImageDraw.Draw(img)
    tw = d.textlength(testo, font=fnt)
    pw, ph = int(tw + 44), max(50, int(fnt.size * 2.2))
    tile = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    td = ImageDraw.Draw(tile)
    td.rounded_rectangle((0, 0, pw - 1, ph - 1), radius=ph // 2, fill=fondo)
    td.text((pw / 2, ph / 2), testo, font=fnt, fill=colore, anchor="mm")
    if angolo:
        tile = tile.rotate(angolo, expand=True, resample=Image.BICUBIC)
    x, y = xy
    if ancora_destra:
        x -= tile.width
    img.alpha_composite(tile, (x, y))


FORMATI = {"og": (1200, 630), "quadrato": (1080, 1080), "google": (1200, 900)}


def genera(percorso: Path, formato: str = "og", testo: str | None = None) -> Path:
    global W, H
    W, H = FORMATI[formato]
    fm = frontmatter(percorso)
    slug = fm["slug"]
    titolo = testo or fm.get("og_title") or fm.get("seo_title") or fm["title"]
    scuro = sum(map(ord, slug)) % 2 == 1
    fondo, forma = (NOTTE, VIOLA) if scuro else (VIOLA, NOTTE)

    img = Image.new("RGBA", (W, H), fondo + (255,))
    forma_ruotata(img, (W - 390, -90, W - 250, 70), ROSA + (255,), -8, 34)
    forma_ruotata(img, (W - 320, H - 300, W + 60, H + 70), forma + (255,), 12, 60)

    pillola(img, (70, 64), CATEGORIE.get(fm.get("category", ""), "Blog"), font("bold", 22), LIME + (255,), (17, 17, 17))
    pillola(img, (W - 70, 70), TIPI.get(fm.get("type", ""), "Info"), font("bold", 22), ROSA + (255,), BIANCO, angolo=-4, ancora_destra=True)

    d = ImageDraw.Draw(img)
    larg = W - 380 if formato == "og" else W - 160
    max_righe = 4 if formato == "og" else (6 if formato == "quadrato" else 4)
    sizes = (74, 66, 58, 52) if formato == "og" else (108, 98, 88, 80, 72, 64)
    for size in sizes:
        fnt = font("black", size)
        righe = a_capo(d, titolo, fnt, larg)
        if len(righe) <= max_righe:
            break
    y = 150 if formato == "og" else 170
    for riga in righe:
        d.text((70, y), riga, font=fnt, fill=BIANCO)
        y += int(size * 1.12)

    if formato != "og":
        pillola(img, (70, y + 40), "Leggi la guida su praticheflaiano.it", font("bold", 30), LIME + (255,), (17, 17, 17))

    fy = H - 108
    d.rounded_rectangle((70, fy, 122, fy + 52), radius=12, fill=VIOLA if scuro else NOTTE)
    d.text((96, fy + 26), "F", font=font("black", 28), fill=LIME, anchor="mm")
    d.text((136, fy), "Pratiche Flaiano", font=font("bold", 22), fill=BIANCO)
    d.text((136, fy + 30), "CAF UNSIC e Patronato ENASC · Roma", font=font("regular", 19), fill=GRIGIO)

    if formato == "og":
        OUT.mkdir(parents=True, exist_ok=True)
        dest = OUT / f"{slug}.jpg"
    else:
        cartella = RADICE / "social" / "immagini"
        cartella.mkdir(parents=True, exist_ok=True)
        dest = cartella / f"{slug}-{formato}.jpg"
    img.convert("RGB").save(dest, "JPEG", quality=88, optimize=True)
    return dest


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("articoli", nargs="+")
    ap.add_argument("--formato", choices=sorted(FORMATI), default="og",
                    help="og 1200x630 (sito), quadrato 1080x1080 (Facebook/Instagram), google 1200x900 (scheda Google)")
    ap.add_argument("--testo", help="testo da stampare al posto del titolo (solo con un articolo)")
    a = ap.parse_args()
    for arg in a.articoli:
        print(genera(Path(arg), a.formato, a.testo))
