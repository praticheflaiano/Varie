"""
Archivio riservato delle stime (prospetto PDF + dati della pratica).
In produzione usa Vercel Blob con store PRIVATO (regione europea); nei test una cartella locale
(STIMA_ARCHIVIO_DIR). I file non hanno URL pubblico: si leggono solo tramite le nostre funzioni.
"""
import os
import re

CODICE = re.compile(r"^[A-Za-z0-9_-]{16,40}$")


def configurato():
    return bool(os.environ.get("STIMA_ARCHIVIO_DIR") or os.environ.get("BLOB_READ_WRITE_TOKEN") or os.environ.get("BLOB_STORE_ID"))


def _percorso(codice, nome):
    if not CODICE.match(codice or "") or not re.fullmatch(r"[a-z]+\.(pdf|json)", nome):
        raise ValueError("percorso non valido")
    return f"stime/{codice}/{nome}"


def salva(codice, nome, dati, tipo):
    percorso = _percorso(codice, nome)
    cartella = os.environ.get("STIMA_ARCHIVIO_DIR")
    if cartella:
        destinazione = os.path.join(cartella, percorso)
        os.makedirs(os.path.dirname(destinazione), exist_ok=True)
        with open(destinazione, "wb") as f:
            f.write(dati)
        return
    from vercel.blob.sync import put_blob
    put_blob(percorso, dati, access="private", content_type=tipo, allow_overwrite=True)


def leggi(codice, nome):
    """Restituisce i byte del file, o None se non esiste."""
    percorso = _percorso(codice, nome)
    cartella = os.environ.get("STIMA_ARCHIVIO_DIR")
    if cartella:
        try:
            with open(os.path.join(cartella, percorso), "rb") as f:
                return f.read()
        except FileNotFoundError:
            return None
    from vercel.blob.sync import BlobNotFoundError, get_blob
    try:
        return bytes(get_blob(percorso, access="private").body)
    except BlobNotFoundError:
        return None
