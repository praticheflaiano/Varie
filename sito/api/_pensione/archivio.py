"""
Archivio riservato delle stime (prospetto PDF, documenti caricati e dati della pratica).
In produzione usa Vercel Blob con store PRIVATO (regione europea); nei test una cartella locale
(STIMA_ARCHIVIO_DIR). I file non hanno URL pubblico: si leggono solo tramite le nostre funzioni.

Cartelle: `stime/<codice>/...` per le pratiche, `email/<impronta>/...` per ritrovare una pratica
dall'email o dal telefono di chi ha pagato (non compaiono in chiaro: solo la loro impronta); `tel/<impronta>/...` allo stesso modo.
"""
import os
import re

CODICE = re.compile(r"^[A-Za-z0-9_-]{16,40}$")
NOME = re.compile(r"[a-z]+\.(pdf|json|bin)")
GRUPPO = re.compile(r"(email|tel)/[a-f0-9]{16,64}|attesa/pratiche|pagamenti/aperti")


def configurato():
    return bool(os.environ.get("STIMA_ARCHIVIO_DIR") or os.environ.get("BLOB_READ_WRITE_TOKEN") or os.environ.get("BLOB_STORE_ID"))


def _percorso(codice, nome):
    if not CODICE.match(codice or "") or not NOME.fullmatch(nome):
        raise ValueError("percorso non valido")
    return f"stime/{codice}/{nome}"


def _scrivi(percorso, dati, tipo, sovrascrivi):
    """Scrive un file. Con sovrascrivi=False la creazione è atomica: False se esiste già."""
    cartella = os.environ.get("STIMA_ARCHIVIO_DIR")
    if cartella:
        destinazione = os.path.join(cartella, percorso)
        os.makedirs(os.path.dirname(destinazione), exist_ok=True)
        try:
            with open(destinazione, "wb" if sovrascrivi else "xb") as f:
                f.write(dati)
        except FileExistsError:
            return False
        return True
    from vercel.blob.sync import BlobError, put_blob
    if sovrascrivi:
        put_blob(percorso, dati, access="private", content_type=tipo, allow_overwrite=True)
        return True
    try:
        put_blob(percorso, dati, access="private", content_type=tipo, allow_overwrite=False)
    except BlobError:
        # Senza sovrascrittura il servizio rifiuta un percorso già occupato: se il file c'è, è quello il motivo.
        if _leggi(percorso) is not None:
            return False
        raise
    return True


def _leggi(percorso):
    cartella = os.environ.get("STIMA_ARCHIVIO_DIR")
    if cartella:
        try:
            with open(os.path.join(cartella, percorso), "rb") as f:
                return f.read()
        except FileNotFoundError:
            return None
    from vercel.blob.sync import BlobNotFoundError, get_blob
    try:
        return bytes(get_blob(_senza_cache(percorso), access="private").body)
    except BlobNotFoundError:
        return None


def _senza_cache(percorso):
    """Indirizzo del file con ?cache=0: dopo una sovrascrittura la cache di Vercel Blob restituisce per un po' la
    versione vecchia, e la funzione che ha appena salvato lo stato della pratica rileggeva quello precedente
    (caso del 12/11/2026: il ricalcolo trovava la pratica ancora "consegnata"). Senza lo store resta il percorso."""
    store = os.environ.get("BLOB_STORE_ID") or ""
    if not store:
        parti = (os.environ.get("BLOB_READ_WRITE_TOKEN") or "").split("_")   # vercel_blob_rw_<store>_<segreto>
        store = parti[3] if len(parti) >= 5 else ""
    store = store.removeprefix("store_").lower()
    if not re.fullmatch(r"[a-z0-9]{8,40}", store):
        return percorso
    from urllib.parse import quote
    return f"https://{store}.private.blob.vercel-storage.com/{quote(percorso, safe='/')}?cache=0"


def salva(codice, nome, dati, tipo):
    _scrivi(_percorso(codice, nome), dati, tipo, True)


def salva_nuovo(codice, nome, dati, tipo):
    """Crea il file solo se non esiste (serve da blocco): True se l'ha creato questa chiamata."""
    return _scrivi(_percorso(codice, nome), dati, tipo, False)


def leggi(codice, nome):
    """Restituisce i byte del file, o None se non esiste."""
    return _leggi(_percorso(codice, nome))


def elimina(codice, nome):
    percorso = _percorso(codice, nome)
    cartella = os.environ.get("STIMA_ARCHIVIO_DIR")
    if cartella:
        try:
            os.remove(os.path.join(cartella, percorso))
        except FileNotFoundError:
            pass
        return
    from vercel.blob.sync import BlobNotFoundError, delete_blob
    try:
        delete_blob(percorso)
    except BlobNotFoundError:
        pass


def _voce(gruppo, codice):
    if not GRUPPO.fullmatch(gruppo) or not CODICE.match(codice or ""):
        raise ValueError("percorso non valido")
    return f"{gruppo}/{codice}.json"


def segna(gruppo, codice, dati=b"{}"):
    """Registra una voce in un gruppo: una pratica sotto l'impronta di email o telefono, una pratica
    in attesa di pagamento (`attesa/pratiche`), un pagamento non ancora abbinato (`pagamenti/aperti`)."""
    _scrivi(_voce(gruppo, codice), dati, "application/json", True)


def voce(gruppo, codice):
    return _leggi(_voce(gruppo, codice))


def togli(gruppo, codice):
    percorso = _voce(gruppo, codice)
    cartella = os.environ.get("STIMA_ARCHIVIO_DIR")
    if cartella:
        try:
            os.remove(os.path.join(cartella, percorso))
        except FileNotFoundError:
            pass
        return
    from vercel.blob.sync import BlobNotFoundError, delete_blob
    try:
        delete_blob(percorso)
    except BlobNotFoundError:
        pass


def elenco(gruppo):
    """Codici delle voci registrate in un gruppo."""
    if not GRUPPO.fullmatch(gruppo):
        raise ValueError("percorso non valido")
    cartella = os.environ.get("STIMA_ARCHIVIO_DIR")
    if cartella:
        try:
            nomi = os.listdir(os.path.join(cartella, gruppo))
        except FileNotFoundError:
            return []
    else:
        from vercel.blob.sync import query_blobs
        nomi = [b.pathname.rsplit("/", 1)[-1] for b in query_blobs(prefix=gruppo + "/")]
    return sorted(n[:-5] for n in nomi if n.endswith(".json") and CODICE.match(n[:-5]))
