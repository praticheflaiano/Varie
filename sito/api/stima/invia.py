"""
Stima e Calcolo della pensione - invio del questionario PRIMA del pagamento.
Salva risposte e documenti nell'archivio riservato, crea la pratica (stato "ricevuta") e
restituisce `next`: il link di pagamento del prodotto GHL (60 € o 65 €). Sulle anteprime, se il
link non è configurato, `next` è la pagina della pratica, dove il pagamento si può simulare.
In produzione risponde solo se STIMA_PENSIONE_ATTIVA=1. Non scrive nei log dati del cliente.
"""
import os, sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_pensione"))
import archivio  # noqa: E402
import pratiche  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        pratiche.rispondi(self, 200, {"ok": True, "attivo": pratiche.attivo(), "archivio": archivio.configurato(),
                                      "pagamento": {str(c): bool(pratiche.link_pagamento(c)) for c in (6000, 6500)}})

    def do_POST(self):
        sito = pratiche.origine(self.headers)
        if not sito:
            return pratiche.rispondi(self, 403, {"errore": "origine"})
        if not pratiche.attivo() or not archivio.configurato():
            return pratiche.rispondi(self, 503, {"errore": "non-attivo"})
        if not pratiche.entro_limite(("invia", pratiche.ip(self.headers)), 6):
            return pratiche.rispondi(self, 429, {"errore": "troppi-invii"})
        dati = pratiche.corpo_json(self, 4_500_000)
        if dati is None:
            return pratiche.rispondi(self, 400, {"errore": "dimensione"})
        try:
            pratiche.rispondi(self, *pratiche.crea(dati, sito))
        except Exception as e:
            print("invia: errore", type(e).__name__)
            pratiche.rispondi(self, 500, {"errore": "archivio"})

    def log_message(self, *args):
        pass
