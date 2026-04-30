#!/usr/bin/env python3
"""
Genera immagini OG (Open Graph) per gli articoli del blog via OpenRouter
+ Google Gemini 2.5 Flash Image (Nano Banana).

Output 1200x630 PNG salvati in sito/public/og/<slug>.png.

Riutilizzabile: aggiungere nuovi articoli al dict PROMPTS e rilanciare.

Usage:
  export OPENROUTER_API_KEY='sk-or-...'
  python3 generate-og-via-openrouter.py <slug>     # genera 1
  python3 generate-og-via-openrouter.py            # genera tutti
"""
import base64
import json
import os
import sys
import urllib.request
import urllib.error
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: serve Pillow. Installa con: pip install Pillow", file=sys.stderr)
    sys.exit(1)

API_URL = "https://openrouter.ai/api/v1/chat/completions"
# Gemini 3 Pro Image: qualita superiore, ~$0.10/img (vs $0.04 di Flash).
# Per il quality del Centro Pratiche Flaiano vale la differenza.
MODEL = "google/gemini-3-pro-image-preview"

API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not API_KEY:
    print("ERROR: OPENROUTER_API_KEY env var non impostata", file=sys.stderr)
    sys.exit(1)

# Stile coerente per tutte le immagini del sito principale
# (Adriatic Blue palette, editoriale italiano sobrio).
COMMON_STYLE = """
Style: Modern editorial illustration, sober Italian magazine style (think
Internazionale, Il Post, Repubblica). Adriatic Blue palette only:
- deep blue #0A4DA2
- water blue #18A0D8
- warm gold #E8B547
- cream paper #EEF3F8
- ink #0C1B2E

Composition: Wide horizontal 1200x630 (Open Graph format). Negative space on
left half (where the website overlays the article title). Main subject on the
right half.

Strict rules:
- NO human faces, NO people, NO realistic photos
- NO readable text, NO numbers, NO letters as design elements
- NO logos, NO brand names, NO trademark-like marks
- NO purple, NO pink, NO neon, NO chromatic aberration
- NO AI-slop tropes (no glowing orbs, no rainbow gradients, no cyber-tech
  motifs, no stock-illustration smiling characters)
- Hand-drawn illustration feel with gentle vector shapes
- Subtle paper grain texture acceptable
- Italian institutional sober mood, calm, trustworthy

Output: 1200x630 PNG, suitable as Open Graph hero image for a tax services blog.
"""


PROMPTS = {
    "precompilata-2026-30-aprile-14-maggio": (
        "Editorial illustration for an Italian tax services blog article about "
        "'730 Precompilato 2026' (the pre-filled income tax return).\n\n"
        "Subject: Abstract symbolic composition — a stack of paper documents "
        "in muted blue and cream, partially overlapping. A wall calendar in the "
        "upper right with two abstract circle marks. A geometric calculator "
        "silhouette in deep blue on the right edge. Soft natural light from "
        "upper right. Pencil-like illustration finish.\n"
        + COMMON_STYLE
    ),
    "guida-730-2026-documenti-scadenze": (
        "Editorial illustration about the Italian 730 tax return guide: which "
        "documents to collect.\n\n"
        "Subject: A neat folder open on a desk, papers fanning out (receipts, "
        "medical bills abstracted as colored rectangles, a blank pay-slip "
        "stylized in cream). A coffee cup in the upper right corner. Geometric "
        "and clean. Late afternoon light from the right.\n"
        + COMMON_STYLE
    ),
    "dichiarazione-iva-2026-scadenza-30-aprile": (
        "Editorial illustration about the Italian VAT (IVA) annual declaration "
        "deadline.\n\n"
        "Subject: A tall stack of ledger-style accounting papers in deep blue "
        "tones, an abstract stamp shape in warm gold next to it (suggesting "
        "official approval). A pen lying diagonally. No readable text or "
        "numbers. Clean studio setup.\n"
        + COMMON_STYLE
    ),
    "rottamazione-quinquies-2026": (
        "Editorial illustration about an Italian tax amnesty program "
        "('Rottamazione Quinquies' tax debts cancellation).\n\n"
        "Subject: A folder of papers being lifted, with smaller paper "
        "fragments floating away in the air (suggesting cancellation, "
        "lightness). Background a quiet cream. A gold ribbon-like accent. "
        "Calm hopeful mood without being saccharine.\n"
        + COMMON_STYLE
    ),
    "isee-2026-dsu-30-giugno-arretrati-assegno-unico": (
        "Editorial illustration about the Italian ISEE/DSU income statement "
        "for family benefits, with a deadline of June 30.\n\n"
        "Subject: An abstract family-shaped silhouette (no faces, just "
        "geometric forms) on the right, paired with a single document and a "
        "calendar showing one circled day in gold. Soft pastel cream "
        "background. Calm warmth.\n"
        + COMMON_STYLE
    ),
    "assegno-unico-2026-importi-tabella-isee": (
        "Editorial illustration about the Italian Universal Single Allowance "
        "(Assegno Unico Universale) for children, with amount tables.\n\n"
        "Subject: A horizontal abstract bar-chart pattern in alternating blue "
        "shades (tall to short, suggesting amounts decreasing by income "
        "bracket), accompanied by a single small paper-airplane in gold "
        "floating gently. No text on the bars. Clean minimal.\n"
        + COMMON_STYLE
    ),
    "bonus-asilo-nido-2026-3600-euro-domanda-inps": (
        "Editorial illustration about the Italian nursery school subsidy "
        "(Bonus Asilo Nido).\n\n"
        "Subject: A small abstract building shape (suggesting a nursery, very "
        "geometric, no signage) on the right, with three colored geometric "
        "blocks at its base (suggesting playful blocks, in deep blue, water "
        "blue and gold). Soft sunlight from above. Warm but institutional.\n"
        + COMMON_STYLE
    ),
    "imu-acconto-16-giugno-2026": (
        "Editorial illustration about the Italian property tax (IMU) advance "
        "payment due June 16.\n\n"
        "Subject: A simplified geometric architectural facade of an Italian "
        "apartment building, in cream-blue tones, with a single window in "
        "warm gold light. Beside it, a small abstract bill or receipt. "
        "Sober institutional mood.\n"
        + COMMON_STYLE
    ),
    "checklist-primi-7-giorni-perdita-lavoro-roma": (
        "Editorial illustration about a 7-day checklist for someone who just "
        "lost their job in Italy (NASpI process).\n\n"
        "Subject: An abstract checklist composition — seven horizontal lines, "
        "the first two with completed checkmarks in gold, the others empty. "
        "On the side, a small paper folder. No people, no faces. Soft hopeful "
        "atmosphere.\n"
        + COMMON_STYLE
    ),
    "naspi-2026-patronato-vs-caf-cosa-fa-cosa": (
        "Editorial illustration about the difference between Italian Patronato "
        "(welfare advisory) and CAF (tax advisory) services.\n\n"
        "Subject: Two parallel paper documents standing upright, one slightly "
        "in front of the other, one tinted deep blue and one cream. A subtle "
        "thin gold line connects them at the base. Suggests cooperation and "
        "distinct roles. Studio composition.\n"
        + COMMON_STYLE
    ),
}


def generate_og(slug: str, prompt: str, output_path: Path) -> dict:
    """Chiama OpenRouter, salva PNG su disco, ritorna metadata."""
    body = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "modalities": ["image", "text"],
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://praticheflaiano-sito.vercel.app",
            "X-Title": "Centro Pratiche Flaiano OG image generator",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"_error": f"HTTPError {e.code}: {e.read().decode('utf-8')[:500]}"}
    except Exception as e:
        return {"_error": f"{type(e).__name__}: {e}"}

    if "error" in data:
        return {"_error": str(data["error"])}

    # Estrai immagine: OpenRouter mette le immagini in choices[0].message.images
    # ognuna come {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
    msg = data["choices"][0]["message"]
    images = msg.get("images") or []
    if not images:
        return {
            "_error": "no images in response",
            "_raw_message": str(msg)[:500],
            "_usage": data.get("usage"),
        }

    img_obj = images[0]
    img_url = img_obj.get("image_url", {}).get("url", "")
    if not img_url.startswith("data:image/"):
        return {"_error": f"unexpected image url format: {img_url[:80]}"}

    # parse "data:image/png;base64,..."
    header, _, b64data = img_url.partition(",")
    if not b64data:
        return {"_error": "no base64 payload after comma"}

    png_bytes = base64.b64decode(b64data)

    # Post-processing: crop center 16:9 + resize 1200x630 + JPEG quality 88.
    # Gemini Image genera 1024x1024 anche se gli chiedi 1200x630;
    # facciamo noi il fit al formato OG canonico.
    src_img = Image.open(BytesIO(png_bytes))
    w, h = src_img.size
    target_w, target_h = 1200, 630
    target_ratio = target_w / target_h
    src_ratio = w / h
    if src_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        src_img = src_img.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        src_img = src_img.crop((0, top, w, top + new_h))
    final = src_img.resize((target_w, target_h), Image.LANCZOS).convert("RGB")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    # Forziamo estensione .jpg per peso ridotto (target <150 KB)
    jpg_path = output_path.with_suffix(".jpg")
    final.save(jpg_path, "JPEG", quality=88, optimize=True, progressive=True)

    return {
        "ok": True,
        "path": str(jpg_path),
        "size_bytes": jpg_path.stat().st_size,
        "dimensions": f"{target_w}x{target_h}",
        "mime": "image/jpeg",
        "usage": data.get("usage", {}),
    }


def main():
    project_root = Path(__file__).resolve().parent.parent  # sito/
    output_dir = project_root / "public" / "og"

    if len(sys.argv) > 1:
        slug = sys.argv[1]
        if slug not in PROMPTS:
            print(f"ERROR: slug '{slug}' non in PROMPTS. Disponibili:", file=sys.stderr)
            for s in PROMPTS:
                print(f"  - {s}", file=sys.stderr)
            sys.exit(2)
        targets = {slug: PROMPTS[slug]}
    else:
        targets = PROMPTS

    if not targets:
        print("Nessun prompt configurato in PROMPTS. Aggiungi un articolo.")
        sys.exit(0)

    for slug, prompt in targets.items():
        print(f"\n=== Generating OG for {slug} ===")
        out_path = output_dir / f"{slug}.png"
        result = generate_og(slug, prompt, out_path)

        if "_error" in result:
            print(f"  ERROR: {result['_error']}")
            continue

        size_kb = result["size_bytes"] / 1024
        usage = result.get("usage") or {}
        cost = usage.get("cost", 0)
        print(f"  OK: {result['path']}  size={size_kb:.1f} KB  cost=${cost}")


if __name__ == "__main__":
    main()
