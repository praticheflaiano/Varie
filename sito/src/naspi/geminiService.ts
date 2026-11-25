import type { ExtractedData, CalculatorMode } from './types';

// Lettura dei documenti: /api/analyze-document (Mistral OCR per i PDF, Claude Sonnet per trascrivere,
// conti fatti dal codice). Il nome del file resta per compatibilità con gli import.
// Sul sito l'indirizzo /api/naspi/analyze-document è girato alla funzione del portale NASpI (vedi vercel.json).
const API_ENDPOINT = '/api/naspi/analyze-document';

const EMPTY_RESULT: ExtractedData = { weeks: 0, wages: 0, days: 0, monthlyAmount: 0, avvisi: [] };

export const analyzeContributionDocument = async (
    base64Data: string,
    mimeType: string,
    mode: CalculatorMode,
    terminationDate?: string,
): Promise<ExtractedData> => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data, mimeType: mimeType || 'application/octet-stream', mode, terminationDate }),
        });
        if (!response.ok) {
            const msg = response.status === 413
                ? 'Il file è troppo grande: carica un PDF più leggero (massimo 3 MB) o inserisci i dati a mano.'
                : response.status === 429
                    ? 'Hai fatto troppe letture in poco tempo: riprova tra un po\' o inserisci i dati a mano.'
                    : 'Non siamo riusciti a leggere il documento: controlla i dati o inseriscili a mano.';
            return { ...EMPTY_RESULT, errore: msg };
        }
        const data = await response.json();
        return { ...EMPTY_RESULT, ...data } as ExtractedData;
    } catch {
        return { ...EMPTY_RESULT, errore: 'Non siamo riusciti a leggere il documento: controlla la connessione o inserisci i dati a mano.' };
    }
};
