# Motore conteggi pensionistici

`conteggi_pensione.py` è il motore deterministico della skill `conteggi-pensionistici`
(parametri versione 2026-11-09), copiato senza modifiche. Sarà usato dal servizio
"Stima e Calcolo della pensione" (`/stima-pensione`).

- I parametri normativi stanno solo nel blocco `PARAMS`: aggiornarli lì, con fonte,
  e tenerli allineati alla skill.
- `python3 api/_pensione/test_regressione.py` verifica il caso di riferimento.
- La cartella inizia con `_`: Vercel non la espone come endpoint.
