"""
Prove del Report Persona con Openapi e GHL finti (un piccolo server locale) e archivio su cartella.
Esecuzione: python3 -m pytest sito/api/_report/test_report.py
"""
import json, os, sys, tempfile, threading, time
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest

CF_ROSSI = "RSSMRA80A01H501U"
stato = {}


class Finto(BaseHTTPRequestHandler):
    def _json(self, codice, corpo):
        dati = json.dumps(corpo).encode()
        self.send_response(codice)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(dati)))
        self.end_headers()
        self.wfile.write(dati)

    def _corpo(self):
        return self.rfile.read(int(self.headers.get("content-length") or 0))

    def do_GET(self):
        p = self.path
        if p.startswith("/IT-report-persona/") and p.endswith("/download"):
            if not stato["pronto"]:
                return self._json(406, {"success": False, "error": 303})
            dati = b"%PDF-1.4 finto"
            self.send_response(200)
            self.send_header("content-type", "application/pdf")
            self.send_header("content-length", str(len(dati)))
            self.end_headers()
            return self.wfile.write(dati)
        if "/customFields" in p:
            return self._json(200, {"customFields": stato["campi"]})
        if p.startswith("/contacts/") and "?" not in p:
            ident = p.rsplit("/", 1)[-1]
            return self._json(200, {"contact": next(c for c in stato["contatti"] if c["id"] == ident)})
        self._json(404, {})

    def do_POST(self):
        p, corpo = self.path, self._corpo()
        if p == "/IT-report-persona/":
            stato["richieste"].append(json.loads(corpo))
            if stato.get("openapi_errore"):
                return self._json(stato["openapi_errore"], {"success": False, "message": "no"})
            return self._json(200, {"data": {"id": "abc123", "state": "processing"}, "success": True, "message": "", "error": None})
        if p == "/contacts/search":
            d = json.loads(corpo)
            if "filters" in d:
                campo, valore = d["filters"][0]["field"].split(".")[1], d["filters"][0]["value"]
                trovati = [c for c in stato["contatti"] if any(f["id"] == campo and f["value"] == valore for f in c.get("customFields", []))]
            else:
                parole = d["query"].lower().split()
                trovati = [c for c in stato["contatti"] if all(w in f"{c['firstName']} {c['lastName']}".lower() for w in parole)]
            return self._json(200, {"contacts": trovati})
        if p.endswith("/customFields"):
            d = json.loads(corpo)
            campo = {"id": "campo" + str(len(stato["campi"])), "name": d["name"], "dataType": d["dataType"], "fieldKey": "contact." + d["name"].lower().replace(" ", "_")}
            stato["campi"].append(campo)
            return self._json(200, {"customField": campo})
        if p == "/contacts/":
            d = json.loads(corpo)
            nuovo = {"id": "nuovo1", "firstName": d["firstName"], "lastName": d["lastName"], "customFields": d.get("customFields", [])}
            stato["contatti"].append(nuovo)
            return self._json(200, {"contact": nuovo})
        if p.startswith("/forms/upload-custom-files"):
            stato["allegati"].append((p, corpo))
            return self._json(200, {"contact": {}})
        if p.endswith("/notes"):
            stato["note"].append(json.loads(corpo)["body"])
            return self._json(200, {})
        self._json(404, {})

    def do_PUT(self):
        ident = self.path.rsplit("/", 1)[-1]
        contatto = next(c for c in stato["contatti"] if c["id"] == ident)
        contatto.setdefault("customFields", []).extend(json.loads(self._corpo())["customFields"])
        self._json(200, {"contact": contatto})

    def log_message(self, *a):
        pass


@pytest.fixture()
def report(monkeypatch):
    server = HTTPServer(("127.0.0.1", 0), Finto)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    stato.clear()
    stato.update(pronto=False, richieste=[], allegati=[], note=[], contatti=[], campi=[{"id": "cfid", "name": "Codice Fiscale", "dataType": "TEXT", "fieldKey": "contact.codice_fiscale"}])
    cartella = tempfile.mkdtemp()
    for k, v in {"STIMA_ARCHIVIO_DIR": cartella, "REPORT_PERSONA_PASSWORD": "segreta", "OPENAPI_RISK_TOKEN": "t", "OPENAPI_RISK_BASE": base, "GHL_API_TOKEN": "g", "GHL_API_BASE": base}.items():
        monkeypatch.setenv(k, v)
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import report as modulo
    yield modulo
    server.shutdown()


def test_codice_fiscale(report):
    assert report.cf_valido(CF_ROSSI)
    assert not report.cf_valido("RSSMRA80A01H501X")   # carattere di controllo sbagliato
    assert not report.cf_valido("RSSMRA80A01H501")


def test_accesso_e_blocco(report):
    sessione, _ = report.accedi("segreta")
    assert report.sessione_ok({"x-report-sessione": sessione})
    assert not report.sessione_ok({"x-report-sessione": sessione[:-2] + "00"})
    assert not report.sessione_ok({"x-report-sessione": "1." + sessione.split(".")[1]})
    for _ in range(report.MAX_ERRATI):
        assert report.accedi("sbagliata") == (None, "password")
    assert report.accedi("segreta") == (None, "bloccato")   # bloccata anche con la password giusta


def test_giro_completo_contatto_per_nome(report):
    stato["contatti"].append({"id": "c1", "firstName": "Mario", "lastName": "Rossi", "customFields": []})
    r = report.richiedi("Mario", "Rossi", CF_ROSSI, "successione", "")
    assert r["stato"] == "in_lavorazione" and r["openapi"] == "abc123"
    assert stato["richieste"][0] == {"name": "Mario", "surname": "Rossi", "taxCode": CF_ROSSI}   # niente logo, niente avviso fuori produzione
    r = report.cerca_contatto(r)
    assert r["ghl"]["stato"] == "trovato" and r["ghl"]["come"] == "nome e cognome" and r["ghl"]["cf_aggiunto"]
    assert stato["contatti"][0]["customFields"] == [{"id": "cfid", "value": CF_ROSSI}]
    assert report.controlla(r)["stato"] == "in_lavorazione"   # Openapi risponde 406: non ancora pronto
    stato["pronto"] = True
    r = report.controlla(r)
    assert r["stato"] == "pronto" and report.pdf(r["codice"]).startswith(b"%PDF")
    assert r["ghl"]["allegato"] and len(stato["allegati"]) == 1 and "contactId=c1" in stato["allegati"][0][0]
    assert b"%PDF-1.4 finto" in stato["allegati"][0][1] and "Successione" in stato["note"][0]
    assert any(c["name"] == "Report Persona" and c["dataType"] == "FILE_UPLOAD" for c in stato["campi"])
    report.allega(r)
    assert len(stato["allegati"]) == 1   # non allega due volte
    assert report.doppione(CF_ROSSI)["codice"] == r["codice"]


def test_contatto_per_codice_fiscale(report):
    stato["contatti"] += [{"id": "c1", "firstName": "Mario", "lastName": "Rossi", "customFields": []},
                          {"id": "c2", "firstName": "M.", "lastName": "Rossi Bianchi", "customFields": [{"id": "cfid", "value": CF_ROSSI}]}]
    r = report.cerca_contatto(report.richiedi("Mario", "Rossi", CF_ROSSI, "altro", "prova"))
    assert r["ghl"]["stato"] == "trovato" and r["ghl"]["contatto"] == "c2" and r["ghl"]["come"] == "codice fiscale"


def test_omonimi_e_codice_diverso(report):
    stato["contatti"] += [{"id": "c1", "firstName": "Mario", "lastName": "Rossi", "customFields": []},
                          {"id": "c2", "firstName": "MARIO", "lastName": "ROSSI", "customFields": [{"id": "cfid", "value": "RSSMRA70A01H501P"}]}]
    r = report.cerca_contatto(report.richiedi("Mario", "Rossi", CF_ROSSI, "successione", ""))
    assert r["ghl"]["stato"] == "da_scegliere" and len(r["ghl"]["candidati"]) == 2
    assert stato["contatti"][0]["customFields"] == []   # nessuna scrittura automatica
    assert report.collega(r, contatto="altro") is None
    r = report.collega(r, contatto="c2")
    assert r["ghl"]["stato"] == "trovato" and "diverso" in r["ghl"]["avviso"]
    assert stato["contatti"][1]["customFields"] == [{"id": "cfid", "value": "RSSMRA70A01H501P"}]   # mai sovrascritto


def test_un_solo_omonimo_con_codice_diverso_non_viene_toccato(report):
    stato["contatti"].append({"id": "c2", "firstName": "Mario", "lastName": "Rossi", "customFields": [{"id": "cfid", "value": "RSSMRA70A01H501P"}]})
    r = report.cerca_contatto(report.richiedi("Mario", "Rossi", CF_ROSSI, "successione", ""))
    assert r["ghl"]["stato"] == "da_scegliere"


def test_nessun_contatto_e_creazione(report):
    stato["campi"].clear()   # nel CRM non c'è ancora il campo del codice fiscale
    r = report.cerca_contatto(report.richiedi("Anna", "Verdi", CF_ROSSI, "successione", ""))
    assert r["ghl"]["stato"] == "nessuno"
    r = report.collega(r, crea=True)
    assert r["ghl"]["contatto"] == "nuovo1" and stato["contatti"][0]["customFields"][0]["value"] == CF_ROSSI
    assert any(c["name"] == "Codice Fiscale" for c in stato["campi"])


def test_openapi_rifiuta(report):
    stato["openapi_errore"] = 402
    r = report.richiedi("Mario", "Rossi", CF_ROSSI, "successione", "")
    assert r["stato"] == "errore" and "credito" in r["errore"] and r["costo"] == 0
    assert report.doppione(CF_ROSSI) is None


def test_pulizia_dopo_12_mesi(report):
    r = report.richiedi("Mario", "Rossi", CF_ROSSI, "successione", "")
    stato["pronto"] = True
    r = report.controlla(r)
    assert report.pulizia() == 0
    r["creata"] = report.iso(report.adesso() - report.timedelta(days=366))
    report._scrivi_json(f"report/richieste/{r['codice']}.json", r)
    assert report.pulizia() == 1 and report.tutte() == [] and report.pdf(r["codice"]) is None


def test_vista_senza_dati_interni(report):
    v = report.vista(report.richiedi("Mario", "Rossi", CF_ROSSI, "successione", ""))
    assert "openapi" not in v and v["finalita"] == "Successione" and v["scade"] > v["creata"][:10]
