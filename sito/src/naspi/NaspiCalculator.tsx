import React, { useState, useRef, useId } from 'react';
import { Calculator, FileText, Upload, ArrowRight, AlertTriangle, TrendingDown, Calendar, Info } from 'lucide-react';
import { analyzeContributionDocument } from './geminiService';
import { calculateNaspiEligibility, calculateNaspiFromDecree, parseItNumber } from './calculations';
import { TerminationReason, VoluntaryException } from './types';
import type { NaspiResult, UserInputData, CalculatorMode } from './types';
import LegalDisclaimer from './LegalDisclaimer';
import ConversionCTA from './ConversionCTA';

/**
 * Calcolatore NASpI (grafica rifatta il 26/11/2026 per la pagina impaginata come gli articoli: ToolGuideLayout).
 * Logica e fonti in calculations.ts. Il testo che spiega le regole sta nella pagina /calcolo-naspi, non qui.
 */

const PASSI = ['Scegli', 'Documento', 'Dati', 'Risultato'];
const MAX_FILE_BYTES = 3 * 1024 * 1024;
// separatore delle migliaia sempre presente (toLocaleString in italiano non lo mette sotto 10.000)
const eur = (n: number) => { const [i, d] = (Math.round(n * 100) / 100).toFixed(2).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + d; };
const dal = (d: string) => (/^(8|11)\b/.test(d) ? "dall'" : 'dal ') + d;
const oggi = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const campo = "w-full p-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 focus:border-blue-600 outline-none";
const etichetta = "block text-sm font-bold text-slate-900 mb-1";
const aiuto = "text-xs text-slate-600 mt-1";

const NaspiCalculator: React.FC = () => {
    const [mode, setMode] = useState<CalculatorMode | null>(null);
    const [step, setStep] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [inputData, setInputData] = useState<UserInputData>({ age: 30, weeksWorkedLast4Years: 0, totalGrossWagesLast4Years: 0, terminationReason: TerminationReason.INVOLUNTARY, voluntaryException: VoluntaryException.NONE, hasWorked30DaysLastYear: true, terminationDate: oggi(), approvedStartDate: '', approvedDaysDuration: 0, approvedMonthlyAmount: 0 });
    const [wagesRaw, setWagesRaw] = useState<string>('');
    const [monthlyRaw, setMonthlyRaw] = useState<string>('');
    const [result, setResult] = useState<NaspiResult | null>(null);
    const [avvisi, setAvvisi] = useState<string[]>([]);
    const [erroreLettura, setErroreLettura] = useState<string>('');
    const [erroreCampi, setErroreCampi] = useState<string>('');
    const [letto, setLetto] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const id = useId();
    const ids = (s: string) => `${id}-${s}`;

    const set = (p: Partial<UserInputData>) => setInputData(prev => ({ ...prev, ...p }));

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !mode) return;
        setAvvisi([]);
        setErroreLettura('');
        if (file.size > MAX_FILE_BYTES) {
            setErroreLettura('Il file è troppo grande (massimo 3 MB). Carica un PDF più leggero o inserisci i dati a mano.');
            return;
        }
        setLoading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Content = (reader.result as string).split(',')[1];
            const data = await analyzeContributionDocument(base64Content, file.type, mode, inputData.terminationDate);
            if (data.errore) {
                setErroreLettura(data.errore);
                setLoading(false);
                return;
            }
            if (mode === 'forecast') {
                set({ weeksWorkedLast4Years: data.weeks || 0, totalGrossWagesLast4Years: data.wages || 0 });
                setWagesRaw(data.wages ? eur(data.wages) : '');
            } else {
                set({ approvedStartDate: data.startDate || '', approvedDaysDuration: data.days || 0, approvedMonthlyAmount: data.monthlyAmount || 0 });
                setMonthlyRaw(data.monthlyAmount ? eur(data.monthlyAmount) : '');
            }
            setAvvisi(data.avvisi || []);
            setLetto(true);
            setLoading(false);
            setStep(2);
        };
        reader.readAsDataURL(file);
    };

    const handleCalculate = () => {
        setErroreCampi('');
        const dati = { ...inputData };
        if (mode === 'forecast') {
            const w = wagesRaw.trim() ? parseItNumber(wagesRaw) : 0;
            if (isNaN(w)) { setErroreCampi("Scrivi l'imponibile solo con numeri, per esempio 45000 oppure 45.000,00."); return; }
            dati.totalGrossWagesLast4Years = w;
        } else {
            const m = monthlyRaw.trim() ? parseItNumber(monthlyRaw) : 0;
            if (isNaN(m)) { setErroreCampi("Scrivi l'importo mensile solo con numeri, per esempio 1200 oppure 1.200,50."); return; }
            dati.approvedMonthlyAmount = m;
        }
        setInputData(dati);
        setResult(mode === 'forecast' ? calculateNaspiEligibility(dati) : calculateNaspiFromDecree(dati));
        setStep(3);
    };

    const reset = () => { setStep(0); setResult(null); setMode(null); setAvvisi([]); setErroreLettura(''); setErroreCampi(''); setLetto(false); };

    return (
        <div className="bg-white rounded-3xl border-2 border-slate-900 overflow-hidden relative" style={{ boxShadow: '0 6px 0 #14142B' }}>
            {/* intestazione dello strumento */}
            <div className="bg-slate-900 text-white px-5 py-4 md:px-7 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl md:text-2xl font-extrabold m-0 flex items-center gap-2"><Calculator className="w-6 h-6" aria-hidden="true" /> Calcola la tua NASpI 2026</h2>
                <ol className="flex gap-2 m-0 p-0 list-none text-sm" aria-label="Passi del calcolo">
                    {PASSI.map((p, i) => (
                        <li key={p} aria-current={i === step ? 'step' : undefined} className={`px-3 py-1 rounded-full font-bold ${i === step ? 'bg-white text-slate-900' : i < step ? 'bg-white/20 text-white' : 'text-slate-300'}`}>
                            {i + 1}<span className="hidden sm:inline">. {p}</span>
                        </li>
                    ))}
                </ol>
            </div>

            {loading && (
                <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-8 text-center" role="status">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-xl font-bold mb-2">Lettura del documento in corso...</p>
                    <p className="text-slate-600">Estraiamo settimane e importi: ci vuole qualche secondo.</p>
                </div>
            )}

            <div className="p-5 md:p-7">
                {step === 0 && (
                    <div>
                        <p className="text-lg font-bold text-slate-900 mb-4">Cosa vuoi fare?</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <button type="button" onClick={() => { setMode('forecast'); setStep(1); }} className="p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-left transition-colors">
                                <span className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-3"><Calculator className="w-6 h-6" aria-hidden="true" /></span>
                                <span className="block font-bold text-lg text-slate-900 mb-1">Stimare la NASpI</span>
                                <span className="block text-sm text-slate-700">Ho perso o sto per perdere il lavoro: quanto prendo e per quanto tempo?</span>
                            </button>
                            <button type="button" onClick={() => { setMode('analysis'); setStep(1); }} className="p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-left transition-colors">
                                <span className="w-12 h-12 bg-teal-100 text-teal-800 rounded-xl flex items-center justify-center mb-3"><FileText className="w-6 h-6" aria-hidden="true" /></span>
                                <span className="block font-bold text-lg text-slate-900 mb-1">Leggere la lettera INPS</span>
                                <span className="block text-sm text-slate-700">Ho già la NASpI accolta: voglio il piano dei pagamenti mese per mese.</span>
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <p className="text-lg font-bold text-slate-900 mb-2">{mode === 'forecast' ? "Carica l'estratto conto contributivo INPS" : 'Carica la lettera INPS di accoglimento'}</p>
                        <p className="text-slate-700 mb-5">{mode === 'forecast' ? 'Leggiamo le righe degli ultimi 4 anni e contiamo settimane e retribuzioni.' : 'Leggiamo data di inizio, giorni spettanti e importo mensile.'}</p>
                        {mode === 'forecast' && (
                            <div className="max-w-xs mb-5">
                                <label htmlFor={ids('fine0')} className={etichetta}>Ultimo giorno di lavoro</label>
                                <input id={ids('fine0')} type="date" value={inputData.terminationDate} onChange={e => set({ terminationDate: e.target.value })} className={campo} />
                                <p className={aiuto}>Serve per contare i 4 anni precedenti.</p>
                            </div>
                        )}
                        {erroreLettura && <div role="alert" className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">{erroreLettura}</div>}
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-8 hover:border-blue-600 hover:bg-blue-50 transition-colors mb-4 text-center">
                            <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" aria-hidden="true" />
                            <span className="font-bold text-slate-900 block">Scegli il file</span>
                            <span className="text-sm text-slate-700 mt-1 block">PDF o foto, massimo 3 MB</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" aria-label="Carica il documento" />
                        <p className="text-sm text-slate-700 mb-4">Il documento viene inviato a un servizio di lettura automatica solo per estrarre i dati del calcolo. Noi non lo conserviamo.</p>
                        <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={() => { setLetto(false); setAvvisi([]); setStep(2); }} className="px-5 py-3 rounded-full bg-slate-900 text-white font-bold">Scrivo i dati a mano</button>
                            <button type="button" onClick={reset} className="px-5 py-3 rounded-full border-2 border-slate-900 text-slate-900 font-bold">Indietro</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5">
                        {letto && (
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
                                <p className="font-bold mb-1">Dati letti dal documento: controllali prima di calcolare.</p>
                                {avvisi.length > 0 && <ul className="list-disc pl-5 space-y-1">{avvisi.map((a, i) => <li key={i}>{a}</li>)}</ul>}
                            </div>
                        )}
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor={ids('eta')} className={etichetta}>Età alla data della domanda NASpI</label>
                                <input id={ids('eta')} type="number" inputMode="numeric" min={14} max={99} value={inputData.age} onChange={e => set({ age: +e.target.value })} className={campo} aria-describedby={ids('eta-h')} />
                                <p id={ids('eta-h')} className={aiuto}>Da 55 anni la riduzione del 3% parte più tardi.</p>
                            </div>
                            {mode === 'forecast' && (
                                <div>
                                    <label htmlFor={ids('fine')} className={etichetta}>Ultimo giorno di lavoro</label>
                                    <input id={ids('fine')} type="date" value={inputData.terminationDate} onChange={e => set({ terminationDate: e.target.value })} className={campo} />
                                </div>
                            )}
                        </div>

                        {mode === 'forecast' ? (
                            <>
                                <fieldset className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200">
                                    <legend className="font-bold text-slate-900 px-1">Contributi degli ultimi 4 anni</legend>
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div>
                                            <label htmlFor={ids('sett')} className={etichetta}>Settimane di contributi</label>
                                            <input id={ids('sett')} aria-describedby={ids('sett-h')} type="number" inputMode="numeric" min={0} max={208} value={inputData.weeksWorkedLast4Years || ''} onChange={e => set({ weeksWorkedLast4Years: +e.target.value })} className={campo} placeholder="es. 156" />
                                            <p id={ids('sett-h')} className={aiuto}>Un anno pieno sono 52 settimane; al massimo 208 in 4 anni. Ne servono almeno 13.</p>
                                        </div>
                                        <div>
                                            <label htmlFor={ids('imp')} className={etichetta}>Imponibile previdenziale totale (€)</label>
                                            <input id={ids('imp')} aria-describedby={ids('imp-h')} type="text" inputMode="decimal" value={wagesRaw} onChange={e => setWagesRaw(e.target.value)} className={campo} placeholder="es. 72.000" />
                                            <p id={ids('imp-h')} className={aiuto}>La somma delle retribuzioni lorde su cui hai pagato i contributi in quei 4 anni (estratto conto INPS o buste paga, voce "imponibile INPS").</p>
                                        </div>
                                    </div>
                                </fieldset>

                                <div>
                                    <label htmlFor={ids('motivo')} className={etichetta}>Come è finito il lavoro</label>
                                    <select id={ids('motivo')} value={inputData.terminationReason} onChange={e => set({ terminationReason: e.target.value as TerminationReason, voluntaryException: VoluntaryException.NONE })} className={campo}>
                                        <option value={TerminationReason.INVOLUNTARY}>Licenziamento o fine del contratto a termine</option>
                                        <option value={TerminationReason.VOLUNTARY}>Dimissioni</option>
                                        <option value={TerminationReason.CONSENSUAL}>Risoluzione consensuale (accordo con l'azienda)</option>
                                    </select>
                                </div>
                                {inputData.terminationReason === TerminationReason.VOLUNTARY && (
                                    <div>
                                        <label htmlFor={ids('dim')} className={etichetta}>Che tipo di dimissioni?</label>
                                        <select id={ids('dim')} value={inputData.voluntaryException} onChange={e => set({ voluntaryException: e.target.value as VoluntaryException })} className={campo} aria-describedby={ids('dim-h')}>
                                            <option value={VoluntaryException.NONE}>Dimissioni normali</option>
                                            <option value={VoluntaryException.JUST_CAUSE}>Per giusta causa (es. stipendi non pagati)</option>
                                            <option value={VoluntaryException.PROTECTED_PERIOD}>Nel periodo tutelato di maternità o paternità</option>
                                        </select>
                                        <p id={ids('dim-h')} className={aiuto}>Con le dimissioni normali la NASpI non spetta.</p>
                                    </div>
                                )}

                                <details className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                                    <summary className="font-bold text-slate-900 cursor-pointer">Altri dati (facoltativi, per un calcolo più preciso)</summary>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label htmlFor={ids('usate')} className={etichetta}>Settimane già usate per una NASpI precedente negli ultimi 4 anni</label>
                                            <input id={ids('usate')} type="number" inputMode="numeric" min={0} max={208} value={inputData.weeksAlreadyUsed ?? ''} onChange={e => set({ weeksAlreadyUsed: e.target.value === '' ? undefined : +e.target.value })} className={campo} placeholder="0" />
                                            <p className={aiuto}>Non contano per la durata della nuova NASpI.</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <input id={ids('dim12')} type="checkbox" className="mt-1 w-5 h-5" checked={!!inputData.resignedPermanentJobLast12Months} onChange={e => set({ resignedPermanentJobLast12Months: e.target.checked })} />
                                            <label htmlFor={ids('dim12')} className="text-sm text-slate-900">Nei 12 mesi prima mi ero dimesso (o avevo firmato una risoluzione consensuale) da un altro lavoro a tempo indeterminato</label>
                                        </div>
                                        {inputData.resignedPermanentJobLast12Months && (
                                            <div>
                                                <label htmlFor={ids('dopo')} className={etichetta}>Settimane di contributi da quelle dimissioni a oggi</label>
                                                <input id={ids('dopo')} type="number" inputMode="numeric" min={0} max={60} value={inputData.weeksSinceResignation ?? ''} onChange={e => set({ weeksSinceResignation: e.target.value === '' ? undefined : +e.target.value })} className={campo} />
                                                <p className={aiuto}>Dal 2025 ne servono almeno 13.</p>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            </>
                        ) : (
                            <fieldset className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200">
                                <legend className="font-bold text-slate-900 px-1">Dati della lettera INPS</legend>
                                <div className="grid sm:grid-cols-3 gap-5">
                                    <div>
                                        <label htmlFor={ids('dec')} className={etichetta}>Data di inizio (decorrenza)</label>
                                        <input id={ids('dec')} type="date" value={inputData.approvedStartDate} onChange={e => set({ approvedStartDate: e.target.value })} className={campo} />
                                    </div>
                                    <div>
                                        <label htmlFor={ids('gg')} className={etichetta}>Giorni spettanti</label>
                                        <input id={ids('gg')} type="number" inputMode="numeric" min={0} max={728} value={inputData.approvedDaysDuration || ''} onChange={e => set({ approvedDaysDuration: +e.target.value })} className={campo} placeholder="es. 540" />
                                    </div>
                                    <div>
                                        <label htmlFor={ids('mese')} className={etichetta}>Importo mensile lordo (€)</label>
                                        <input id={ids('mese')} type="text" inputMode="decimal" value={monthlyRaw} onChange={e => setMonthlyRaw(e.target.value)} className={campo} placeholder="es. 1.250,40" />
                                    </div>
                                </div>
                            </fieldset>
                        )}

                        {erroreCampi && <div role="alert" className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">{erroreCampi}</div>}
                        <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={handleCalculate} className="flex-1 min-w-[220px] bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full font-bold text-lg flex items-center justify-center gap-2">
                                Calcola la mia NASpI <ArrowRight className="w-5 h-5" aria-hidden="true" />
                            </button>
                            <button type="button" onClick={reset} className="px-5 py-3 rounded-full border-2 border-slate-900 text-slate-900 font-bold">Ricomincia</button>
                        </div>
                    </div>
                )}

                {step === 3 && result && (
                    <div className="space-y-6" aria-live="polite">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                            <p className="text-2xl font-extrabold text-slate-900 m-0">Il tuo risultato</p>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setStep(2)} className="px-4 py-2 rounded-full border-2 border-slate-900 text-slate-900 font-bold text-sm">Modifica i dati</button>
                                <button type="button" onClick={reset} className="px-4 py-2 rounded-full bg-slate-900 text-white font-bold text-sm">Nuovo calcolo</button>
                            </div>
                        </div>

                        {!result.isEligible ? (
                            <div className={`${result.missingData ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-red-50 border-red-200 text-red-800'} border p-5 rounded-2xl flex gap-4`}>
                                <AlertTriangle className="w-7 h-7 shrink-0" aria-hidden="true" />
                                <div><p className="font-bold text-lg mb-1">{result.missingData ? 'Mancano alcuni dati' : 'La NASpI probabilmente non spetta'}</p><p>{result.ineligibilityReason}</p></div>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="bg-blue-600 text-white p-5 rounded-2xl">
                                    <p className="text-sm font-bold uppercase tracking-wide m-0 text-blue-50">Importo mensile lordo</p>
                                    <p className="text-4xl font-extrabold my-2">{eur(result.grossMonthlyAmount)} €</p>
                                    <p className="flex gap-2 items-center text-sm bg-white/15 p-2 rounded-lg m-0">
                                        <TrendingDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                                        {result.firstReductionDate ? <span>{dal(result.firstReductionDate).replace(/^d/, 'D')} scende del 3% ogni mese</span> : <span>Finisce prima della riduzione del 3%</span>}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                                    <p className="text-sm font-bold uppercase tracking-wide m-0 text-slate-700">Durata</p>
                                    <p className="text-4xl font-extrabold text-slate-900 my-2">{result.totalDaysDuration} <span className="text-xl font-normal text-slate-700">giorni</span></p>
                                    <p className="text-sm text-slate-700 flex flex-wrap gap-x-4 gap-y-1 m-0">
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" aria-hidden="true" /> {dal(result.startDate).replace(/^d/, 'D')}</span>
                                        <span>al {result.endDate}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {result.warnings && result.warnings.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-5">
                                <p className="font-bold flex items-center gap-2 mb-2"><Info className="w-5 h-5" aria-hidden="true" /> Da sapere sul tuo caso</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm m-0">{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                            </div>
                        )}

                        {result.isEligible && (
                            <>
                                <ConversionCTA
                                    headline={`Ti spettano circa ${eur(result.grossMonthlyAmount)} € lordi al mese`}
                                    subline={`Per ${result.totalDaysDuration} giorni, ${dal(result.startDate)} al ${result.endDate}. La domanda va presentata entro 68 giorni dalla fine del lavoro${result.applicationDeadline ? ` (entro il ${result.applicationDeadline})` : ''}: la facciamo noi, gratis.`}
                                />
                                <div>
                                    <p className="font-bold text-slate-900 mb-3 text-lg">Pagamenti stimati mese per mese</p>
                                    <div className="rounded-2xl border border-slate-200 overflow-x-auto" tabIndex={0} role="region" aria-label="Pagamenti stimati mese per mese">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-100 text-slate-900">
                                                <tr>
                                                    <th scope="col" className="p-3">Mese</th>
                                                    <th scope="col" className="p-3">Lordo</th>
                                                    <th scope="col" className="p-3">Netto stimato*</th>
                                                    <th scope="col" className="p-3">Note</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.schedule.map((row, i) => (
                                                    <tr key={i} className="border-t border-slate-200">
                                                        <td className="p-3 font-bold text-slate-900">{row.monthYear}</td>
                                                        <td className="p-3">{eur(row.grossAmount)} €</td>
                                                        <td className="p-3">{eur(row.netAmount)} €</td>
                                                        <td className="p-3 text-xs">{row.reductionApplied ? `ridotto del ${row.reductionPercentage}%` : ''}{row.daysPaid < 28 ? `${row.reductionApplied ? ' · ' : ''}${row.daysPaid} giorni` : ''}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-slate-700 mt-2">* Il netto è indicativo: dipende dalle detrazioni e non comprende la somma non imponibile che l'INPS aggiunge per redditi fino a 20.000 € (messaggio INPS 3649/2026).</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                    <p className="font-bold text-slate-900 text-lg mb-1">Dopo la domanda: il SIISL</p>
                                    <p className="text-slate-800 mb-2">Quando la NASpI parte, entro 15 giorni devi entrare nella piattaforma SIISL, compilare il curriculum e firmare il patto di attivazione digitale.</p>
                                    <a href="/siisl" className="font-bold text-blue-700 underline">Cosa fare sul SIISL</a>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <LegalDisclaimer variant="compact" className="mt-6" />
            </div>
        </div>
    );
};
export default NaspiCalculator;
