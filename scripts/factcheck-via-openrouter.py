#!/usr/bin/env python3
"""
Fact-check fallback via OpenRouter / DeepSeek V4 Pro.
Usato quando i subagent Anthropic sono bloccati dal monthly usage limit.

Per ogni articolo .md passato come argomento, manda a DeepSeek:
- testo integrale
- lista fonti ufficiali da validare
- richiesta strutturata (JSON output) con: verdetto, errori, correzioni proposte

Output: file JSON in /tmp/factcheck-<slug>.json con il report.

Le correzioni NON sono applicate automaticamente: l'umano (o Claude Code)
le valuta prima di applicare.
"""
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "deepseek/deepseek-chat-v3-0324"  # non-reasoning stabile, 163k ctx, multi-provider
API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not API_KEY:
    print("ERROR: set OPENROUTER_API_KEY env var", file=sys.stderr)
    sys.exit(1)

SYSTEM_PROMPT = """Sei un fact-checker specializzato in materia fiscale e previdenziale italiana.
Verifichi articoli per il blog di un CAF (Centro di Assistenza Fiscale) italiano.

Regola fondamentale del progetto: ZERO INVENZIONI.
Ogni dato (data, importo, percentuale, riferimento normativo, codice tributo)
deve essere verificabile su fonti ufficiali (agenziaentrate.gov.it, inps.it,
gazzettaufficiale.it, normattiva.it).

Restituisci ESCLUSIVAMENTE un JSON valido con questa struttura:
{
  "verdict": "PUBBLICABILE" | "PUBBLICABILE_CON_CORREZIONI" | "DA_RIVEDERE",
  "summary": "frase di sintesi",
  "errors_blocking": [
    {"location": "linea o sezione", "issue": "...", "fix": "..."}
  ],
  "warnings": [
    {"location": "...", "issue": "...", "fix": "..."}
  ],
  "info": [
    {"location": "...", "note": "..."}
  ],
  "verified_data": [
    "lista dati che hai potuto confermare come corretti"
  ]
}

Niente prosa fuori dal JSON. Niente markdown ```json ... ``` wrapper.
"""

def build_user_prompt(article_path: Path, sources_hint: str) -> str:
    text = article_path.read_text(encoding="utf-8")
    return f"""ARTICOLO da verificare (markdown completo):

---ARTICOLO INIZIO---
{text}
---ARTICOLO FINE---

FONTI UFFICIALI DA CUI VALIDARE i dati:
{sources_hint}

CONTESTO: l'articolo e gia stato scritto con cura citando le fonti.
Il tuo compito e fare una doppia verifica: trovare eventuali errori sfuggiti,
date scorrette, importi non rivalutati, riferimenti normativi imprecisi.

Restituisci il JSON di fact-check come da formato system."""

def factcheck(article_path: Path, sources_hint: str) -> dict:
    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(article_path, sources_hint)},
        ],
        "max_tokens": 4000,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://praticheflaiano-sito.vercel.app",
            "X-Title": "Centro Pratiche Flaiano fact-check",
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

    raw = data["choices"][0]["message"].get("content")
    if not raw:
        # Reasoning models put output in 'reasoning' if content is empty
        raw = data["choices"][0]["message"].get("reasoning", "")
    if not raw:
        return {"_error": "empty content and reasoning", "_raw_response": data}
    # Strip markdown JSON wrapper if present
    raw_clean = raw.strip()
    if raw_clean.startswith("```"):
        raw_clean = raw_clean.split("\n", 1)[1] if "\n" in raw_clean else raw_clean
        if raw_clean.endswith("```"):
            raw_clean = raw_clean.rsplit("```", 1)[0]
        raw_clean = raw_clean.strip()
    if raw_clean.startswith("json\n"):
        raw_clean = raw_clean[5:]
    try:
        parsed = json.loads(raw_clean)
    except json.JSONDecodeError as e:
        return {"_error": f"JSON parse failed: {e}", "_raw": raw[:2000]}

    parsed["_usage"] = data.get("usage", {})
    parsed["_model"] = data.get("model", MODEL)
    return parsed


# Mapping articolo -> fonti da validare (sintesi)
TARGETS = {
    "imu-acconto-16-giugno-2026": {
        "path": "content/imu-tributi-locali/2026-04-29-imu-acconto-16-giugno-2026.md",
        "sources": """- D.Lgs. 504/1992 (disciplina IMU originaria)
- Legge 160/2019 art. 1 commi 738-783 (riforma 'nuova IMU' 2020)
- D.M. 30 ottobre 2012 + Risoluzione AdE 35/E del 12/04/2012 (codici tributo F24)
- D.Lgs. 87/2024 (riforma sanzioni tributarie - sanzione ordinaria 25% dal 1/9/2024)
- D.M. MEF 10 dicembre 2025 (tasso interesse legale 2026 = 1,60%)
- Comune di Roma Capitale (codice catastale H501, aliquote 2026)

DATI CRITICI da verificare:
- Scadenza acconto 16 giugno 2026 (martedi)
- Saldo 16 dicembre 2026
- Coefficienti per categoria catastale (160 per A, 80 per A/10, 140 per B/C3-C5, 55 per C/1, 65 per D, 80 per D/5)
- Aliquote: 0,5% prime case lusso A1/A8/A9, 0,86% altri immobili, 0,1% fabbricati merce
- Range comunale: 0%-1,06% per altri immobili
- Codici tributo F24: 3912, 3913, 3914, 3916, 3918, 3925, 3930
- Sanzioni ravvedimento operoso 2026 post D.Lgs 87/2024:
  * sprint (entro 14gg): 0,083%/giorno
  * breve (15-30gg): 1,25%
  * medio (31-90gg): 1,39%
  * lungo (entro 1 anno): 3,125%
  * ultrannuale (entro 2 anni): 3,572%
  * accertamento ordinario: 25%
- Tasso interesse legale 2026: 1,60%
""",
    },
    "bonus-asilo-nido-2026-3600-euro": {
        "path": "content/bonus-fiscali/2026-04-29-bonus-asilo-nido-2026-3600-euro.md",
        "sources": """- Messaggio INPS 31 marzo 2026, n. 1136 (apertura servizio domanda 2026)
- Notizia INPS 31/03/2026 (Bonus asilo nido 2026: attivo il servizio)
- Legge 205/2017 art. 1 c. 355 (istituzione bonus)
- Legge 207/2024 (Bilancio 2025, importi)

DATI CRITICI:
- Importo MAX 3.600 euro per nati dal 1/1/2024 + ISEE minorenni fino 40.000 + altro figlio sotto 10 anni
- 3 fasce ISEE ordinarie:
  * senza ISEE / oltre 40.000: 1.500 euro/anno (10 rate 136,37 + 1 rata 136,30)
  * 25.001-40.000: 2.500 euro (10 rate 227,28 + 1 rata 227,20)
  * fino 25.000: 3.000 euro (10 rate 272,73 + 1 rata 272,70)
- Maggiorato 3.600: 10 rate 327,27 + 1 rata 327,30
- Domanda aperta dal 31/3/2026 al 31/12/2026
- Caricamento ricevute spese: entro 30 aprile anno successivo
- Cumulabile con AUU
- NON cumulabile con detrazione 19% asilo nido sul 730 (stesse spese)
- Patronato gratuito Legge 152/2001
""",
    },
    "assegno-unico-2026-importi-tabella-isee": {
        "path": "content/assegno-unico/2026-04-29-assegno-unico-2026-importi-tabella-isee.md",
        "sources": """- Circolare INPS n. 7 del 30 gennaio 2026 (importi rivalutati 1,4% ISTAT 2025)
- Notizia INPS 27/02/2026 'Assegno unico 2026'
- Comunicato stampa INPS n. 4002/2026 (PDF)
- D.Lgs. 230/2021 (regolamento AUU)

DATI CRITICI (importi rivalutati 2026 +1,4%):

FIGLI MINORENNI:
- Massimo 203,80 euro (ISEE fino 17.468,51)
- Minimo 58,30 euro (ISEE oltre 46.582,71 o senza ISEE)
- Decrescenza lineare tra le due soglie

FIGLI MAGGIORENNI 18-21 anni:
- Massimo 85 euro
- Minimo 25 euro

FIGLI CON DISABILITA (verifica precisamente):
- Non autosufficiente: maggiorazione +119,60 (?) o altro valore
- Disabilita grave: +108,69 (?)
- Disabilita media: +97,79 (?)
- Dopo 21 anni: ~91,68 (?)

MAGGIORAZIONI:
- Sotto 1 anno: +50%
- 3+ figli ISEE fino 46.582,71: +50% (per figli 1-3 anni)
- 4+ figli forfait: 150 euro/mese
- Madre under 21: +22,80 euro/figlio
- Entrambi genitori lavoratori: fino +34,10 euro/figlio (decrescente, azzerata oltre 46.582,71)

ALTRO:
- Decorrenza dal mese di domanda
- Domanda valida fino a 21 anni senza rinnovo
- ISEE annuale entro 30 giugno per arretrati
- Pagamenti entro fine mese (gen-feb intorno al 17-22)
- Separati/divorziati: 50/50 default
- Patronato gratuito Legge 152/2001
""",
    },
}


def main():
    if len(sys.argv) > 1:
        targets = {sys.argv[1]: TARGETS[sys.argv[1]]}
    else:
        targets = TARGETS

    project_root = Path(__file__).parent.parent if __file__ != "<stdin>" else Path.cwd()

    for slug, info in targets.items():
        article_path = project_root / info["path"]
        if not article_path.exists():
            print(f"SKIP {slug}: file not found {article_path}")
            continue

        print(f"\n=== Fact-checking {slug} ===")
        print(f"  Article: {article_path}")
        print(f"  Words: {len(article_path.read_text(encoding='utf-8').split())}")

        result = factcheck(article_path, info["sources"])

        out_path = Path(f"/tmp/factcheck-{slug}.json")
        out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  Saved: {out_path}")

        if "_error" in result:
            print(f"  ERROR: {result['_error']}")
            continue

        verdict = result.get("verdict", "?")
        n_errors = len(result.get("errors_blocking") or [])
        n_warn = len(result.get("warnings") or [])
        usage = result.get("_usage", {})
        cost = usage.get("cost", 0)
        print(f"  Verdict: {verdict}")
        print(f"  Errors blocking: {n_errors}")
        print(f"  Warnings: {n_warn}")
        print(f"  Cost: ${cost:.4f}")
        if n_errors:
            for e in result["errors_blocking"]:
                print(f"    ERR: {e.get('location', '?')}: {e.get('issue', '?')[:100]}")


if __name__ == "__main__":
    main()
