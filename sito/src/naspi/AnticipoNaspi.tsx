import React, { useMemo, useState, useId } from 'react';
import { CalendarClock, ArrowRight } from 'lucide-react';
import { calculateAnticipo, parseItNumber } from './calculations';

// Calcolatore anticipo NASpI (grafica rifatta il 26/11/2026 per la pagina impaginata come gli articoli: ToolGuideLayout).
// Il testo con le regole sta nella pagina /anticipo-naspi. Regole verificate il 24/11/2026 e ricontrollate il 26/11/2026 su:
// - scheda INPS "NASpI anticipata" (ultimo aggiornamento 12/06/2026)
// - messaggio INPS n. 1215 del 7/4/2026 (due rate 70% + 30% per le domande dal 1/1/2026)
// - art. 8 d.lgs. 22/2015 come modificato dall'art. 1, c. 176, legge 199/2025
// - messaggio INPS n. 3649 del 10/11/2026: l'anticipazione NASpI ha tassazione separata (art. 17 TUIR)
// Calcolo in calculations.ts (calculateAnticipo): residuo giorno per giorno dalla data della domanda.
export const ANTICIPO_UPDATED = '2026-11-26';

// separatore delle migliaia sempre presente (toLocaleString in italiano non lo mette sotto 10.000)
const eur = (n: number) => { const [i, d] = (Math.round(n * 100) / 100).toFixed(2).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + d + ' €'; };
const dataIt = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
};
const oggi = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const campo = 'w-full p-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 focus:border-blue-600 outline-none';
const etichetta = 'block text-sm font-bold text-slate-900 mb-1';

const AnticipoNaspi: React.FC = () => {
    const [start, setStart] = useState('');
    const [days, setDays] = useState<number>(0);
    const [monthlyRaw, setMonthlyRaw] = useState('');
    const [request, setRequest] = useState(oggi());
    const [over55, setOver55] = useState(false);
    const id = useId();
    const ids = (s: string) => `${id}-${s}`;

    const monthly = monthlyRaw.trim() ? parseItNumber(monthlyRaw) : 0;
    const importoNonValido = isNaN(monthly);

    // Il calcolo restituisce sempre un risultato: se manca qualcosa o le date non tornano, r.error spiega cosa correggere.
    const r = useMemo(
        () => calculateAnticipo({ naspiStartDate: start, totalDays: days, monthlyGrossAmount: importoNonValido ? 0 : monthly, anticipoRequestDate: request, age: over55 ? 55 : 40 }),
        [start, days, monthly, importoNonValido, request, over55],
    );

    return (
        <div className="bg-white rounded-3xl border-2 border-slate-900 overflow-hidden" style={{ boxShadow: '0 6px 0 #14142B' }}>
            <div className="bg-slate-900 text-white px-5 py-4 md:px-7">
                <h2 className="text-xl md:text-2xl font-extrabold m-0 flex items-center gap-2"><CalendarClock className="w-6 h-6" aria-hidden="true" /> Calcola le due rate dell'anticipo</h2>
                <p className="text-sm text-slate-200 mt-1 mb-0">I dati li trovi nella lettera INPS che ha accolto la tua NASpI.</p>
            </div>

            <div className="p-5 md:p-7 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label htmlFor={ids('start')} className={etichetta}>Data di inizio della NASpI</label>
                        <input id={ids('start')} type="date" value={start} onChange={(e) => setStart(e.target.value)} className={campo} />
                    </div>
                    <div>
                        <label htmlFor={ids('days')} className={etichetta}>Durata totale in giorni</label>
                        <input id={ids('days')} type="number" min={1} max={728} inputMode="numeric" value={days || ''} onChange={(e) => setDays(+e.target.value)} className={campo} placeholder="es. 360" />
                    </div>
                    <div>
                        <label htmlFor={ids('monthly')} className={etichetta}>Importo mensile lordo iniziale (€)</label>
                        <input id={ids('monthly')} type="text" inputMode="decimal" value={monthlyRaw} onChange={(e) => setMonthlyRaw(e.target.value)} className={campo} placeholder="es. 1.200,00" aria-invalid={importoNonValido || undefined} aria-describedby={importoNonValido ? ids('monthly-err') : undefined} />
                        {importoNonValido && <p id={ids('monthly-err')} className="text-sm text-red-800 mt-1">Scrivi l'importo solo con numeri, per esempio 1200 oppure 1.200,50.</p>}
                    </div>
                    <div>
                        <label htmlFor={ids('request')} className={etichetta}>Data della domanda di anticipo</label>
                        <input id={ids('request')} type="date" value={request} onChange={(e) => setRequest(e.target.value)} className={campo} />
                    </div>
                    <div className="flex items-start gap-3">
                        <input id={ids('55')} type="checkbox" checked={over55} onChange={(e) => setOver55(e.target.checked)} className="w-5 h-5 mt-0.5" />
                        <label htmlFor={ids('55')} className="text-sm text-slate-900">Alla data della domanda NASpI avevo almeno 55 anni</label>
                    </div>
                </div>

                <div aria-live="polite" className="flex flex-col gap-3">
                    {!r.error ? (
                        <>
                            <div className="flex justify-between gap-3 text-sm bg-slate-50 border border-slate-200 rounded-xl p-3"><span className="text-slate-800">NASpI residua lorda</span><b className="text-slate-900">{eur(r.totalGrossAmount)}</b></div>
                            <div className="bg-blue-600 text-white rounded-2xl p-4">
                                <span className="block text-blue-50 text-xs font-bold uppercase tracking-wider">Prima rata (70%)</span>
                                <span className="block text-3xl font-extrabold">{eur(r.firstInstallment)}</span>
                                <span className="block text-sm text-blue-50">quando la domanda viene accolta</span>
                            </div>
                            <div className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-4">
                                <span className="block text-slate-800 text-xs font-bold uppercase tracking-wider">Seconda rata (30%)</span>
                                <span className="block text-3xl font-extrabold text-slate-900">{eur(r.secondInstallment)}</span>
                                <span className="block text-sm text-slate-800">prevista entro il {dataIt(r.secondInstallmentBy)}</span>
                            </div>
                            <p className="text-xs text-slate-700 m-0">Fine teorica della NASpI: {dataIt(r.naspiEndDate)}. Calcolo su {r.daysRemaining} giorni, dal giorno della domanda. Netto stimato con una ritenuta del 23%: {eur(r.estimatedNetAmount)} in tutto. L'anticipo ha tassazione separata: l'imposta vera la calcola il Fisco.</p>
                        </>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800">{r.error}</div>
                    )}
                    <a href="/naspi#richiesta-online" className="mt-auto bg-slate-900 hover:bg-slate-800 py-3 px-5 rounded-full font-bold text-white flex items-center justify-center gap-2 no-underline">
                        Fai la domanda con noi <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </a>
                    <p className="text-xs text-slate-700 m-0">Stima indicativa. L'importo esatto è quello del provvedimento INPS.</p>
                </div>
            </div>
        </div>
    );
};
export default AnticipoNaspi;
