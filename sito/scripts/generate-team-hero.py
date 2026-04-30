#!/usr/bin/env python3
"""
Genera l'illustrazione editoriale del team CAF Centro Pratiche Flaiano
per la sezione hero della home (4 persone in ufficio).

Output: 1200x960 JPEG (aspect 5:4) salvato in
sito/public/img/hero/team-front-desk.jpg.

Usage:
  export OPENROUTER_API_KEY='sk-or-...'
  python3 generate-team-hero.py
"""
import base64
import json
import os
import sys
import urllib.request
import urllib.error
from io import BytesIO
from pathlib import Path

from PIL import Image

API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-3-pro-image-preview"

API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not API_KEY:
    print("ERROR: OPENROUTER_API_KEY env var non impostata", file=sys.stderr)
    sys.exit(1)

PROMPT = """Editorial illustration of a small Italian tax-services office team
(CAF / Patronato), in the style of high-end Italian newspaper editorial
illustrations (Internazionale, Il Post, Repubblica weekend supplement).

Composition: Four people, slightly cropped at the waist, standing or sitting
around a clean modern desk in a bright, calm office. Warm natural light from
upper right, soft shadows. Sober institutional mood, friendly but professional.

Cast (left to right):
- A woman in her thirties with shoulder-length dark hair, navy blazer over
  a cream blouse, smiling warmly.
- A man in his forties with short dark hair, light blue shirt and a thin
  navy tie, calm friendly smile.
- A woman in her late twenties with light brown hair tied back, white shirt
  and a soft gold blazer, gentle smile.
- A woman in her fifties with short greyish hair, warm and welcoming
  expression, navy cardigan over white shirt.

All four faces clearly visible, friendly, looking towards the viewer or
slightly off-camera. NO logos, NO readable text on screens or papers, NO
brand names. Professional Italian office attire (NO ties of bright colors,
NO casual t-shirts, NO uniforms). Subtle hint of paperwork or a laptop on
the desk.

Background: a hint of a window with very soft warm daylight; a small
indoor plant at the edge. Empty negative space on the left side suitable for
text overlay.

Style: Modern editorial flat illustration, slightly textured paper feel,
hand-drawn linework, soft shading. Adriatic Blue palette ONLY:
- deep blue #0A4DA2 (suits, blazers)
- water blue #18A0D8 (subtle accents)
- warm gold #E8B547 (light, single soft accent)
- cream paper #EEF3F8 (skin highlights, paper, blouses)
- warm beige skin tones #E8C5A8 / #D9A981 / #F0CDB0
- ink #0C1B2E (linework, hair shadows)

STRICT rules:
- No purple, no pink, no neon, no rainbow gradients.
- No glowing orbs, no chromatic aberration.
- No realistic photograph look, no 3D render look. Hand-drawn vector
  illustration only.
- No tongues out, no exaggerated cartoon expressions, no Pixar style.
- All four characters human and realistic-proportioned.
- Output: high quality, suitable as 1200x960 hero image (aspect 5:4)."""

OUTPUT = Path(__file__).resolve().parent.parent / "public" / "img" / "hero" / "team-front-desk.jpg"
TARGET_W, TARGET_H = 1200, 960  # aspect 5:4


def main():
    body = {
        "model": MODEL,
        "messages": [{"role": "user", "content": PROMPT}],
        "modalities": ["image", "text"],
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://praticheflaiano-sito.vercel.app",
            "X-Title": "Centro Pratiche Flaiano team hero",
        },
        method="POST",
    )
    print("Generating team hero illustration...")
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    msg = data["choices"][0]["message"]
    images = msg.get("images") or []
    if not images:
        print("ERROR: no images returned")
        print(json.dumps(data, indent=2)[:1000])
        sys.exit(2)

    img_url = images[0].get("image_url", {}).get("url", "")
    _, _, b64data = img_url.partition(",")
    png_bytes = base64.b64decode(b64data)

    src = Image.open(BytesIO(png_bytes))
    w, h = src.size
    target_ratio = TARGET_W / TARGET_H
    src_ratio = w / h
    if src_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        src = src.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        src = src.crop((0, top, w, top + new_h))
    final = src.resize((TARGET_W, TARGET_H), Image.LANCZOS).convert("RGB")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    final.save(OUTPUT, format="JPEG", quality=88, optimize=True, progressive=True)

    size_kb = OUTPUT.stat().st_size / 1024
    cost = data.get("usage", {}).get("cost", 0)
    print(f"OK: {OUTPUT}  size={size_kb:.1f} KB  cost=${cost:.4f}")


if __name__ == "__main__":
    main()
