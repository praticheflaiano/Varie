# Configurazione di produzione di praticheflaiano.it (progetto Vercel `info-praticheflaiano`)

Il deploy di produzione NON usa sito/vercel.json: usa questi due file, caricati con un deploy "files".
- `build.sh`: scarica il tar del ramo `nuova-grafica-info`, fa la build in `sito/` e copia `dist` in `public`.
- `vercel.json`: rimandi dal vecchio sito GHL (301/308), rimandi temporanei verso shop.praticheflaiano.it, header.

Per cambiare un rimando: modificare `vercel.json` qui, poi fare un deploy di produzione con questi due file
(create_deployment con `files`; build.sh si può indicare per sha). Un semplice redeploy riusa il vercel.json del deploy precedente.

Ultimo aggiornamento: 14/11/2026, aggiunto /luce-e-gas → /luce-gas (deploy dpl_9SCTMqVj66XznGESi4bcgbG3nd3G).
Aggiornamento 18/11/2026: aggiunto il rimando esplicito della radice di info.praticheflaiano.it (rispondeva 200 con la home invece di 308; le altre pagine di info. rimandavano già).
