#!/usr/bin/env python3
"""Test di regressione del motore: stesso input + stessi parametri = stesso risultato.
Uso: python3 api/_pensione/test_regressione.py   (richiede python-dateutil)
Se cambiano PARAMS o il codice, verificare le differenze e rigenerare il file atteso."""
import json, sys
from pathlib import Path

qui = Path(__file__).parent
sys.path.insert(0, str(qui))
from conteggi_pensione import calcola  # noqa: E402

atteso = json.loads((qui / "test_regressione.atteso.json").read_text())
ottenuto = json.loads(json.dumps(calcola(json.loads((qui / "test_regressione.input.json").read_text())), ensure_ascii=False))

if ottenuto != atteso:
    for k in sorted(set(atteso) | set(ottenuto)):
        if atteso.get(k) != ottenuto.get(k):
            print(f"DIVERSO: {k}")
    sys.exit(1)
print(f"OK: motore {ottenuto['versione_parametri']}, impronta {ottenuto['impronta_input']}")
