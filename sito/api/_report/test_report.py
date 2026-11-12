"""
Prove del Report Persona con Openapi e GHL finti (un piccolo server locale) e archivio su cartella.
Esecuzione: python3 -m pytest sito/api/_report/test_report.py
"""
import json, os, sys, tempfile, threading, time
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest

CF_ROSSI = "RSSMRA80A01H501U"


def planimetria_successione(c):
    per_id = {v["id"]: v for v in c["voci"]}
    return per_id["doc-planimetria"]["successione"] and not per_id["doc-protesti"]["successione"] and per_id["catasto-visura-soggetto"]["successione"]
stato = {}
CATALOGO = [
    {"id": "doc-protesti", "name": "Protests Report", "category": "Camerali", "isSync": True, "hasSearch": False, "searchPrice": 0, "documentPrice": 0.9, "totalPrice": 0.9,
     "options": [{"name": "Storico", "price": 1.5}],
     "requestStructure": {"help": "<p>Visura <b>protesti</b></p>", "fields": {
         "field0": {"name": "Tax code", "nameIT": "Codice fiscale", "type": "taxCode", "required": True, "options": None, "help": ""},
         "field1": {"name": "Type", "nameIT": "Tipo", "type": "optionCode", "required": False, "options": [{"code": "A", "description": "Attuale"}], "help": ""}}}},
    {"id": "doc-planimetria", "name": "Planimetria Catastale", "category": "Catastali", "isSync": False, "hasSearch": True, "searchPrice": 0.1, "documentPrice": 6.9, "totalPrice": 7.0, "options": None,
     "requestStructure": {"fields": {"field0": {"name": "ID", "nameIT": "Documento di identità", "type": "file", "required": True, "options": None, "help": ""}}}},
]


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
        if p == "/richiesta/q1":
            return self._json(200, {"success": True, "data": {"id": "q1", "stato": stato["catasto_stato"], "esito": {"codice": 200, "info": "OK"}, "risultato": {"soggetti": [
                {"denominazione": "ROSSI MARIO", "cf": CF_ROSSI, "id_soggetto": "abc", "catasti": [{"citta": "ROMA", "provincia": "RM", "fabbricati": 2, "terreni": 0}]}]} if stato["catasto_stato"] == "evasa" else None}})
        if p == "/visura_catastale/v1":
            return self._json(200, {"success": True, "data": {"id": "v1", "stato": stato["catasto_stato"], "documento": "v1.pdf" if stato["catasto_stato"] == "evasa" else None}})
        if p == "/visura_catastale/v1/documento":
            dati = b"%PDF visura ufficiale"
            self.send_response(200)
            self.send_header("content-type", "application/PDF")
            self.send_header("content-length", str(len(dati)))
            self.end_headers()
            return self.wfile.write(dati)
        if p == "/ipotecarie/i1":
            return self._json(200, {"success": True, "data": {"id": "i1", "stato": "evasa", "esito": {"codice": 404, "info": "nessuna formalita"}, "risultato": None, "documento": None}})
        if p == "/documents":
            stato["letture_catalogo"] = stato.get("letture_catalogo", 0) + 1
            return self._json(200, {"success": True, "data": CATALOGO})
        if p == "/requests/d1/documents":
            if stato["doc_stato"] != "DONE":
                return self._json(422, {"success": False, "error": 225})
            base = f"http://127.0.0.1:{self.server.server_port}"
            return self._json(200, {"data": [{"fileName": "visura protesti.pdf", "mimeType": "application/pdf", "downloadUrl": base + "/scarica/a"},
                                             {"fileName": "allegato.zip", "mimeType": "application/zip", "downloadUrl": base + "/scarica/b"}]})
        if p == "/requests/d1":
            return self._json(200, {"data": {"id": "d1", "state": stato["doc_stato"], "totalPrice": 0.9, "results": stato.get("risultati"), "resultId": stato.get("scelto")}})
        if p.startswith("/scarica/"):
            dati = b"%PDF finto " + p[-1].encode()
            self.send_response(200)
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
        if p == "/richiesta/ricerca_nazionale/":
            stato["richieste"].append(json.loads(corpo))
            return self._json(200, {"success": True, "data": {"id": "q1", "stato": "in_erogazione", "risultato": None}})
        if p == "/visura_catastale":
            stato["richieste"].append(json.loads(corpo))
            return self._json(200, {"success": True, "data": {"id": "v1", "stato": stato["catasto_stato"], "documento": "v1.pdf" if stato["catasto_stato"] == "evasa" else None}})
        if p in ("/ipotecarie-dettaglio-nota", "/ipotecarie-elenco-note"):
            stato["richieste"].append(json.loads(corpo))
            return self._json(200, {"success": True, "data": {"id": "i1", "stato": "in_erogazione"}})
        if p == "/requests":
            stato["richieste"].append(json.loads(corpo))
            return self._json(200, {"success": True, "data": {"id": "d1", "state": stato["doc_stato"], "totalPrice": 0.9, "optionsPrice": 0, "results": stato.get("risultati")}})
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

    def do_PATCH(self):
        stato["scelto"] = json.loads(self._corpo())["resultId"]
        stato["doc_stato"] = "DONE"
        self._json(200, {"success": True, "data": {"id": "d1", "state": "DONE", "totalPrice": 0.9, "resultId": stato["scelto"]}})

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
    stato.update(pronto=False, doc_stato="WAIT", catasto_stato="in_erogazione", richieste=[], allegati=[], note=[], contatti=[], campi=[{"id": "cfid", "name": "Codice Fiscale", "dataType": "TEXT", "fieldKey": "contact.codice_fiscale"}])
    cartella = tempfile.mkdtemp()
    for k, v in {"STIMA_ARCHIVIO_DIR": cartella, "REPORT_PERSONA_PASSWORD": "segreta", "OPENAPI_TOKEN": "t", "OPENAPI_RISK_BASE": base, "OPENAPI_DOCUENGINE_BASE": base, "OPENAPI_CATASTO_BASE": base, "GHL_API_TOKEN": "g", "GHL_API_BASE": base}.items():
        monkeypatch.setenv(k, v)
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import report as modulo

    def persona(nome, cognome, cf, finalita, nota):
        """Richiesta di un Report Persona, come la fa la funzione della pagina."""
        v = modulo.voce(modulo.REPORT_PERSONA)
        ricerca, leggibili, opzioni, costo = modulo.prepara(v, {"nome": nome, "cognome": cognome, "cf": cf}, [])
        return modulo.richiedi(v, ricerca, leggibili, opzioni, costo, {"nome": nome, "cognome": cognome, "cf": cf}, finalita, nota)
    modulo.persona = persona
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
    r = report.persona("Mario", "Rossi", CF_ROSSI, "successione", "")
    assert r["stato"] == "in_lavorazione" and r["openapi"] == "abc123"
    assert stato["richieste"][0] == {"name": "Mario", "surname": "Rossi", "taxCode": CF_ROSSI}   # niente logo, niente avviso fuori produzione
    r = report.cerca_contatto(r)
    assert r["ghl"]["stato"] == "trovato" and r["ghl"]["come"] == "nome e cognome" and r["ghl"]["cf_aggiunto"]
    assert stato["contatti"][0]["customFields"] == [{"id": "cfid", "value": CF_ROSSI}]
    assert report.controlla(r)["stato"] == "in_lavorazione"   # Openapi risponde 406: non ancora pronto
    stato["pronto"] = True
    r = report.controlla(r)
    assert r["stato"] == "pronto" and report.file(r["codice"], 0).startswith(b"%PDF")
    assert r["ghl"]["allegato"] and len(stato["allegati"]) == 1 and "contactId=c1" in stato["allegati"][0][0]
    assert b"%PDF-1.4 finto" in stato["allegati"][0][1] and "Successione" in stato["note"][0] and "REPORT PERSONA" in stato["note"][0]
    assert any(c["name"] == "Documenti Openapi" and c["dataType"] == "FILE_UPLOAD" for c in stato["campi"])
    report.allega(r)
    assert len(stato["allegati"]) == 1   # non allega due volte
    assert report.doppione(report.REPORT_PERSONA, {"nome": "Mario", "cognome": "Rossi", "cf": CF_ROSSI})["codice"] == r["codice"]


def test_contatto_per_codice_fiscale(report):
    stato["contatti"] += [{"id": "c1", "firstName": "Mario", "lastName": "Rossi", "customFields": []},
                          {"id": "c2", "firstName": "M.", "lastName": "Rossi Bianchi", "customFields": [{"id": "cfid", "value": CF_ROSSI}]}]
    r = report.cerca_contatto(report.persona("Mario", "Rossi", CF_ROSSI, "altro", "prova"))
    assert r["ghl"]["stato"] == "trovato" and r["ghl"]["contatto"] == "c2" and r["ghl"]["come"] == "codice fiscale"


def test_omonimi_e_codice_diverso(report):
    stato["contatti"] += [{"id": "c1", "firstName": "Mario", "lastName": "Rossi", "customFields": []},
                          {"id": "c2", "firstName": "MARIO", "lastName": "ROSSI", "customFields": [{"id": "cfid", "value": "RSSMRA70A01H501P"}]}]
    r = report.cerca_contatto(report.persona("Mario", "Rossi", CF_ROSSI, "successione", ""))
    assert r["ghl"]["stato"] == "da_scegliere" and len(r["ghl"]["candidati"]) == 2
    assert stato["contatti"][0]["customFields"] == []   # nessuna scrittura automatica
    assert report.collega(r, contatto="altro") is None
    r = report.collega(r, contatto="c2")
    assert r["ghl"]["stato"] == "trovato" and "diverso" in r["ghl"]["avviso"]
    assert stato["contatti"][1]["customFields"] == [{"id": "cfid", "value": "RSSMRA70A01H501P"}]   # mai sovrascritto


def test_un_solo_omonimo_con_codice_diverso_non_viene_toccato(report):
    stato["contatti"].append({"id": "c2", "firstName": "Mario", "lastName": "Rossi", "customFields": [{"id": "cfid", "value": "RSSMRA70A01H501P"}]})
    r = report.cerca_contatto(report.persona("Mario", "Rossi", CF_ROSSI, "successione", ""))
    assert r["ghl"]["stato"] == "da_scegliere"


def test_nessun_contatto_e_creazione(report):
    stato["campi"].clear()   # nel CRM non c'è ancora il campo del codice fiscale
    r = report.cerca_contatto(report.persona("Anna", "Verdi", CF_ROSSI, "successione", ""))
    assert r["ghl"]["stato"] == "nessuno"
    r = report.collega(r, crea=True)
    assert r["ghl"]["contatto"] == "nuovo1" and stato["contatti"][0]["customFields"][0]["value"] == CF_ROSSI
    assert any(c["name"] == "Codice Fiscale" for c in stato["campi"])


def test_openapi_rifiuta(report):
    stato["openapi_errore"] = 402
    r = report.persona("Mario", "Rossi", CF_ROSSI, "successione", "")
    assert r["stato"] == "errore" and "credito" in r["errore"] and r["costo"] == 0
    assert report.doppione(report.REPORT_PERSONA, {"nome": "Mario", "cognome": "Rossi", "cf": CF_ROSSI}) is None


def test_pulizia_dopo_12_mesi(report):
    r = report.persona("Mario", "Rossi", CF_ROSSI, "successione", "")
    stato["pronto"] = True
    r = report.controlla(r)
    assert report.pulizia() == 0
    r["creata"] = report.iso(report.adesso() - report.timedelta(days=366))
    report._scrivi_json(f"report/richieste/{r['codice']}.json", r)
    assert report.pulizia() == 1 and report.tutte() == [] and report.file(r["codice"], 0) is None


def test_vista_senza_dati_interni(report):
    v = report.vista(report.persona("Mario", "Rossi", CF_ROSSI, "successione", ""))
    assert "openapi" not in v and v["finalita"] == "Successione" and v["scade"] > v["creata"][:10] and v["titolo"] == "Report Persona"


def test_catalogo_letto_da_openapi(report):
    c = report.catalogo()
    assert [v["id"] for v in c["voci"]] == [report.DOCUMENTO_DI_PROVA, report.REPORT_PERSONA] + [v["id"] for v in report.VOCI_CATASTO] + ["doc-protesti", "doc-planimetria"]
    assert all("catasto" not in v for v in c["voci"]) and planimetria_successione(c)   # per categoria, poi per nome and c["errore"] is None
    protesti, planimetria = report.voce("doc-protesti"), report.voce("doc-planimetria")
    assert protesti["prezzo"] == 90 and protesti["immediato"] and protesti["tempi"] == "subito" and protesti["descrizione"].startswith("Visura protesti: assegni e cambiali")
    assert protesti["campi"][0] == {"chiave": "field0", "nome": "Codice fiscale", "tipo": "taxCode", "obbligatorio": True, "aiuto": "", "scelte": []}
    assert protesti["opzioni"] == [{"nome": "Storico", "prezzo": 150}]
    assert planimetria["descrizione"].startswith("Planimetria catastale: il disegno")   # spiegazione scelta dal nome
    assert planimetria["prezzo"] == 700 and planimetria["prezzo_ricerca"] == 10 and not planimetria["immediato"] and not planimetria["richiedibile"]
    report.catalogo()
    assert stato["letture_catalogo"] == 1   # resta in archivio: non si rilegge a ogni apertura
    report.catalogo(rinnova=True)
    assert stato["letture_catalogo"] == 2


def test_controlli_sui_dati(report):
    v = report.voce("doc-protesti")
    assert report.prepara(v, {}, [])[0] is None
    assert report.prepara(v, {"field0": "RSSMRA80A01H501X"}, [])[0] is None            # codice fiscale sbagliato
    assert report.prepara(v, {"field0": CF_ROSSI, "field1": "Z"}, [])[0] is None      # scelta non ammessa
    assert report.prepara(report.voce("doc-planimetria"), {}, [])[0] is None           # servono allegati
    ricerca, leggibili, opzioni, costo = report.prepara(v, {"field0": " rssmra80a01h501u ", "field1": "A", "altro": "x"}, ["Storico", "Inventata"])
    assert ricerca == {"field0": CF_ROSSI, "field1": "A"} and opzioni == ["Storico"] and costo == 240
    assert leggibili == [{"nome": "Codice fiscale", "valore": CF_ROSSI}, {"nome": "Tipo", "valore": "Attuale"}]
    assert report.prepara(v, {"field0": "12485671007"}, [])[3] == 90                   # partita IVA ammessa


def test_documento_immediato_con_piu_file(report):
    stato["doc_stato"] = "DONE"
    stato["contatti"].append({"id": "c1", "firstName": "Mario", "lastName": "Rossi", "customFields": []})
    v = report.voce("doc-protesti")
    ricerca, leggibili, opzioni, costo = report.prepara(v, {"field0": CF_ROSSI}, ["Storico"])
    r = report.richiedi(v, ricerca, leggibili, opzioni, costo, {"nome": "Mario", "cognome": "Rossi", "cf": CF_ROSSI}, "altro", "prova")
    assert stato["richieste"][0] == {"documentId": "doc-protesti", "search": {"field0": CF_ROSSI}, "selectedOptions": ["Storico"]}
    assert r["stato"] == "pronto" and r["costo"] == 90 and [f["nome"] for f in r["file"]] == ["visura_protesti.pdf", "allegato.zip"]
    assert report.file(r["codice"], 1) == b"%PDF finto b"
    r = report.allega(report.cerca_contatto(r))
    assert len(stato["allegati"]) == 2 and "PROTESTS REPORT" in stato["note"][0]
    v = report.vista(r)
    assert v["stato"] == "pronto" and len(v["file"]) == 2 and v["persona"] == "Mario Rossi"


def test_documento_in_differita_e_scelta_del_risultato(report):
    stato["risultati"] = [{"id": "r1", "indirizzo": "Via Roma 1", "foglio": 12}, {"id": "r2", "indirizzo": "Via Milano 2"}]
    v = report.voce("doc-protesti")
    ricerca, leggibili, opzioni, costo = report.prepara(v, {"field0": "12485671007"}, [])
    r = report.richiedi(v, ricerca, leggibili, opzioni, costo, {}, "altro", "prova")
    assert r["stato"] == "da_scegliere" and r["risultati"][0] == {"id": "r1", "testo": "Via Roma 1 · 12"}
    assert report.cerca_contatto(r)["ghl"]["stato"] == "senza_persona"   # documento su un'azienda: nessun contatto
    assert report.scegli(r, "inventato") is None
    r = report.scegli(r, "r2")
    assert stato["scelto"] == "r2" and r["stato"] == "pronto" and len(r["file"]) == 2


def test_documento_in_attesa_poi_pronto(report):
    v = report.voce("doc-protesti")
    ricerca, leggibili, opzioni, costo = report.prepara(v, {"field0": CF_ROSSI}, [])
    r = report.richiedi(v, ricerca, leggibili, opzioni, costo, {}, "altro", "prova")
    assert r["stato"] == "in_lavorazione" and report.controlla(r)["stato"] == "in_lavorazione"
    stato["doc_stato"] = "CANCELLED"
    assert report.controlla(r)["stato"] == "annullata" and r["costo"] == 0


def test_ambiente_riconosciuto_dal_token(report, monkeypatch):
    """Un token di prova è rifiutato (401) in produzione: la pagina passa da sola agli ambienti di prova e lo ricorda."""
    chiamate = []

    def finto(servizio, metodo, percorso, corpo=None, attesa=30):
        chiamate.append(report._base(servizio))
        if "test." not in report._base(servizio):
            raise report.urllib.error.HTTPError("u", 401, "no", {}, __import__("io").BytesIO(b"{}"))
        return __import__("json").dumps({"success": True, "data": CATALOGO}).encode()
    monkeypatch.delenv("OPENAPI_DOCUENGINE_BASE")
    monkeypatch.delenv("OPENAPI_RISK_BASE")
    monkeypatch.setenv("OPENAPI_TOKEN", "token-di-prova")
    monkeypatch.setattr(report, "_openapi", finto)
    report._ambiente.clear()
    assert not report.in_prova()
    c = report.catalogo()
    assert chiamate == ["https://docuengine.openapi.com", "https://test.docuengine.openapi.com"]
    assert c["prova"] and len(c["voci"]) == 4 + len(report.VOCI_CATASTO) and c["errore"] is None and report.configurazione()["prova"]
    assert report._base("risk") == "https://test.risk.openapi.com"
    report._ambiente.clear()                      # nuova esecuzione della funzione: lo rilegge dall'archivio
    assert report.in_prova()
    monkeypatch.setenv("OPENAPI_TOKEN", "token-vero")   # token cambiato: si riparte dalla produzione
    assert not report.in_prova()
    monkeypatch.setenv("OPENAPI_PROVA", "1")      # la variabile, se c'è, comanda
    assert report.in_prova()


def test_spiegazioni(report):
    assert "bilancio depositato" in report.spiegazione("Bilancio ottico")
    assert report.spiegazione("Visura Camerale Storica - società di capitale").startswith("Visura camerale storica")
    assert report.spiegazione("Visura Camerale Ordinaria - impresa individuale").startswith("Visura camerale ordinaria")
    assert report.spiegazione("Visura Protesti Persona").startswith("Visura protesti")
    assert report.spiegazione("Visura catastale per soggetto").startswith("Visura catastale")
    assert report.spiegazione("Qualcosa di ignoto") == ""
    lunga = "Testo di Openapi abbastanza lungo da essere usato com'è."
    assert report.spiegazione("Bilancio", lunga) == lunga


def test_documento_di_prova_senza_openapi(report, monkeypatch):
    monkeypatch.setattr(report, "_openapi", lambda *a, **k: (_ for _ in ()).throw(AssertionError("non deve chiamare Openapi")))
    stato["contatti"].append({"id": "c1", "firstName": "Mario", "lastName": "Rossi", "customFields": []})
    v = report.VOCE_PROVA
    ricerca, leggibili, opzioni, costo = report.prepara(v, {"testo": "prova del 12 novembre"}, [])
    r = report.richiedi(v, ricerca, leggibili, opzioni, costo, {"nome": "Mario", "cognome": "Rossi", "cf": CF_ROSSI}, "altro", "prova")
    assert r["stato"] == "pronto" and r["costo"] == 0 and r["prova"] and report.file(r["codice"], 0).startswith(b"%PDF")
    r = report.allega(report.cerca_contatto(r))
    assert r["ghl"]["allegato"] and len(stato["allegati"]) == 1 and "DOCUMENTO DI PROVA" in stato["note"][0]


def chiedi(report, ident, valori, persona=None):
    v = report.voce(ident)
    ricerca, leggibili, opzioni, costo = report.prepara(v, valori, [])
    assert ricerca is not None, leggibili
    return report.richiedi(v, ricerca, leggibili, opzioni, costo, persona or {}, "successione", "")


def test_catasto_ricerca_nazionale_con_esito_leggibile(report):
    r = chiedi(report, "catasto-ricerca-nazionale", {"cf_piva": CF_ROSSI.lower(), "tipo_catasto": "TF"})
    assert stato["richieste"][0] == {"cf_piva": CF_ROSSI, "tipo_catasto": "TF"}
    assert r["stato"] == "in_lavorazione" and r["stato_openapi"] == "in_erogazione" and r["costo"] == 30
    stato["catasto_stato"] = "evasa"
    r = report.controlla(r)
    assert r["stato"] == "pronto" and [f["nome"][-4:] for f in r["file"]] == [".pdf", "json"]
    assert report.file(r["codice"], 0).startswith(b"%PDF") and b"ROSSI MARIO" in report.file(r["codice"], 1)
    assert list(report._righe({"soggetti": [{"cf": "X", "catasti": [{"citta": "ROMA"}], "vuoto": None}]})) == ["Soggetti:", "    1.", "        Cf: X", "        Catasti:", "            1.", "                Citta: ROMA"]


def test_catasto_visura_soggetto_documento_ufficiale(report):
    stato["catasto_stato"] = "evasa"   # in prova Openapi risponde subito
    r = chiedi(report, "catasto-visura-soggetto", {"cf_piva": CF_ROSSI, "provincia": "rm", "tipo_catasto": "TF", "tipo_visura": "storica"})
    assert stato["richieste"][0] == {"entita": "soggetto", "cf_piva": CF_ROSSI, "provincia": "RM", "tipo_catasto": "TF", "tipo_visura": "storica"}
    assert r["stato"] == "pronto" and len(r["file"]) == 1 and report.file(r["codice"], 0) == b"%PDF visura ufficiale"


def test_catasto_controlli_e_nota(report):
    v = report.voce("catasto-visura-immobile")
    base = {"tipo_catasto": "F", "provincia": "RM", "comune": "ROMA", "foglio": "872", "particella": "405", "tipo_visura": "ordinaria"}
    assert report.prepara(v, {**base, "provincia": "Roma"}, [])[0] is None
    assert report.prepara(v, {**base, "foglio": "12a"}, [])[0] is None
    assert report._corpo_catasto(v, report.prepara(v, base, [])[0])[0] == {"entita": "immobile", **base, "foglio": 872, "particella": 405}
    nota = report.voce("catasto-nota")
    dati = {"cf_piva": CF_ROSSI, "conservatoria": "ROMA 1", "anno": "2019", "tipo_registro": "particolare", "numero": "1234"}
    assert report._corpo_catasto(nota, report.prepara(nota, dati, [])[0])[0] is None   # manca il tipo di nota
    corpo, _ = report._corpo_catasto(nota, report.prepara(nota, {**dati, "tipo_nota": "trascrizioni"}, [])[0])
    assert corpo == {"tipo_restrizione": "soggetto", "cf_piva": CF_ROSSI, "conservatoria": "ROMA 1", "anno": 2019, "tipo_registro": "particolare", "registro_particolare": 1234, "tipo_nota": "trascrizioni"}
    corpo, _ = report._corpo_catasto(nota, report.prepara(nota, {**dati, "tipo_registro": "generale"}, [])[0])
    assert corpo["registro_generale"] == 1234 and "tipo_nota" not in corpo


def test_catasto_evasa_senza_risultati(report):
    r = chiedi(report, "catasto-ipoteche-soggetto", {"cf_piva": CF_ROSSI, "conservatoria": "ROMA 1"})
    assert stato["richieste"][0] == {"entita": "ispezione_soggetto", "cf_piva": CF_ROSSI, "conservatoria": "ROMA 1"}
    r = report.controlla(r)
    assert r["stato"] == "pronto" and "nessuna formalita" in r["avviso"] and report.file(r["codice"], 0).startswith(b"%PDF")


def test_avviso_di_ritorno_sempre_con_headers(report, monkeypatch):
    """In produzione le richieste portano il callback: Openapi lo rifiuta (428) se manca l'oggetto headers."""
    monkeypatch.setenv("REPORT_PERSONA_URL", "https://funzioni.example")
    report.persona("Mario", "Rossi", CF_ROSSI, "successione", "")
    chiedi(report, "catasto-ricerca-nazionale", {"cf_piva": CF_ROSSI, "tipo_catasto": "TF"})
    chiedi(report, "doc-protesti", {"field0": CF_ROSSI})
    assert len(stato["richieste"]) == 3
    for corpo in stato["richieste"]:
        c = corpo["callback"]
        assert c["url"].startswith("https://funzioni.example/api/report/avviso?r=") and c["method"] == "JSON" and isinstance(c["headers"], dict) and c["headers"]
