"""
Stima e Calcolo della pensione - avviso di pagamento da GHL (azione "Webhook" di un workflow
che parte dall'ordine del prodotto). Richiede l'intestazione x-stima-token = STIMA_PENSIONE_TOKEN.
Corpo JSON: email del contatto (`email`, oppure `contact.email`) e/o telefono (`phone`); facoltativi
`riferimento` (numero d'ordine) e `importo` (solo annotati: con un coupon l'incasso può essere 0).
Segna pagata la pratica in attesa più recente con quella email o, in mancanza, quel telefono.
Ripetibile senza effetti.
"""
import os, sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_pensione"))
import pratiche  # noqa: E402


def campo(dati, *nomi):
    """Primo valore non vuoto tra i nomi dati, cercato anche dentro contact/customData/order."""
    for contenitore in (dati, *(dati.get(k) for k in ("customData", "contact", "order"))):
        if isinstance(contenitore, dict):
            for nome in nomi:
                if contenitore.get(nome) not in (None, ""):
                    return str(contenitore[nome])
    return ""


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if not pratiche.token_ok(self.headers):
            return pratiche.rispondi(self, 403, {"errore": "non-autorizzato"})
        dati = pratiche.corpo_json(self, 200_000) or {}
        email, telefono = campo(dati, "email"), campo(dati, "phone", "telefono")
        if not pratiche.EMAIL.match(email) and not pratiche.impronta_telefono(telefono):
            return pratiche.rispondi(self, 400, {"errore": "contatto"})
        try:
            codice = pratiche.paga_da_contatto(email, telefono, campo(dati, "riferimento", "order_id", "orderId", "id"), campo(dati, "importo", "amount", "total"))
        except Exception as e:
            print("pagamento: errore", type(e).__name__)
            return pratiche.rispondi(self, 500, {"errore": "archivio"})
        if not codice:
            # Nessuna pratica in attesa: avviso ripetuto (già registrato) oppure email diversa da quella del questionario.
            print("pagamento: nessuna pratica in attesa per il contatto ricevuto; campi:", sorted(dati)[:40])
            return pratiche.rispondi(self, 200, {"ok": True, "pratica": False})
        pratiche.rispondi(self, 200, {"ok": True, "pratica": True})

    def log_message(self, *args):
        pass
