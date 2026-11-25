import React, { useState, useRef, useId } from 'react';
import { Calculator, FileText, Upload, CheckCircle, Info, ArrowRight, HelpCircle, AlertTriangle, TrendingDown, Calendar, Briefcase } from 'lucide-react';
import { analyzeContributionDocument } from './geminiService';
import { calculateNaspiEligibility, calculateNaspiFromDecree } from './calculations';
import { TerminationReason, VoluntaryException } from './types';
import type { NaspiResult, UserInputData, CalculatorMode } from './types';
import LegalDisclaimer from './LegalDisclaimer';
import ConversionCTA from './ConversionCTA';

const InfoCard = ({ title, desc }: { title: string, desc: string }) => (
    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4 text-sm">
        <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-1"><Info className="w-4 h-4" /> {title}</h4>
        <p className="text-blue-800 opacity-90">{desc}</p>
    </div>
);

const StepIndicator = ({ step, current }: { step: number, current: number }) => {
    const isCompleted = current > step;
    const isActive = current === step;
    return (
        <div className={`flex items-center gap-2 ${isActive ? 'text-blue-600 font-bold' : isCompleted ? 'text-green-600' : 'text-slate-300'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-blue-600 bg-blue-50' : isCompleted ? 'border-green-600 bg-green-50' : 'border-slate-300'}`}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : step + 1}
            </div>
            <div className="hidden md:block text-sm text-slate-600">Fase {step + 1}</div>
        </div>
    );
};

const MAX_FILE_BYTES = 3 * 1024 * 1024;

const NaspiCalculator: React.FC = () => {
    const [mode, setMode] = useState<CalculatorMode | null>(null);
    const [step, setStep] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [inputData, setInputData] = useState<UserInputData>({ age: 30, weeksWorkedLast4Years: 0, totalGrossWagesLast4Years: 0, terminationReason: TerminationReason.INVOLUNTARY, voluntaryException: VoluntaryException.NONE, hasWorked30DaysLastYear: true, terminationDate: new Date().toISOString().split('T')[0], approvedStartDate: '', approvedDaysDuration: 0, approvedMonthlyAmount: 0 });
    const [result, setResult] = useState<NaspiResult | null>(null);
    const [avvisi, setAvvisi] = useState<string[]>([]);
    const [erroreLettura, setErroreLettura] = useState<string>('');
    const [letto, setLetto] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ageId = useId();
    const termDateId = useId();
    const weeksId = useId();
    const weeksHintId = useId();
    const wagesId = useId();
    const wagesHintId = useId();
    const reasonId = useId();
    const daysApprovedId = useId();
    const monthlyApprovedId = useId();
    const startApprovedId = useId();
    const termDateUploadId = useId();

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
            if (mode === 'forecast') setInputData(prev => ({ ...prev, weeksWorkedLast4Years: data.weeks || 0, totalGrossWagesLast4Years: data.wages || 0 }));
            else setInputData(prev => ({ ...prev, approvedStartDate: data.startDate || '', approvedDaysDuration: data.days || 0, approvedMonthlyAmount: data.monthlyAmount || 0 }));
            setAvvisi(data.avvisi || []);
            setLetto(true);
            setLoading(false);
            setStep(2);
        };
        reader.readAsDataURL(file);
    };

    const handleCalculate = () => {
        setResult(mode === 'forecast' ? calculateNaspiEligibility(inputData) : calculateNaspiFromDecree(inputData));
        setStep(3);
    };

    const reset = () => { setStep(0); setResult(null); setMode(null); setAvvisi([]); setErroreLettura(''); setLetto(false); };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* HEADER & PROGRESS */}
            <div className="mb-12 text-center">
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">Calcolatore NASpI 2026</h1>
                <p className="text-slate-500 max-w-2xl mx-auto mb-6">Stima dell'importo e della durata della tua indennità di disoccupazione in base ai parametri INPS 2026.</p>
                <LegalDisclaimer variant="calculator" className="max-w-3xl mx-auto mb-8 text-left" />
                <div className="flex justify-center gap-4 md:gap-12">
                    {[0, 1, 2, 3].map(i => <StepIndicator key={i} step={i} current={step} />)}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">

                {/* MAIN INTERFACE */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative min-h-[500px]">
                    {loading && (
                        <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <h3 className="text-xl font-bold mb-2">Analisi documento in corso...</h3>
                            <p className="text-slate-500">L'Intelligenza Artificiale sta estraendo i dati previdenziali.</p>
                        </div>
                    )}

                    {step === 0 && (
                        <div className="p-8 md:p-12">
                            <h2 className="text-2xl font-bold mb-8 text-center">Cosa vuoi fare oggi?</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <button onClick={() => { setMode('forecast'); setStep(1) }} className="group p-8 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left">
                                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Calculator className="w-7 h-7" /></div>
                                    <h3 className="font-bold text-lg mb-2 text-slate-900">Nuova Previsione</h3>
                                    <p className="text-sm text-slate-500">Non ho ancora la NASpI. Voglio stimare quanto mi spetta in base ai contributi.</p>
                                </button>
                                <button onClick={() => { setMode('analysis'); setStep(1) }} className="group p-8 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50/50 transition-all text-left">
                                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><FileText className="w-7 h-7" /></div>
                                    <h3 className="font-bold text-lg mb-2 text-slate-900">Analisi Lettera INPS</h3>
                                    <p className="text-sm text-slate-500">Ho già la lettera di accoglimento. Voglio analizzare il piano dei pagamenti.</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="p-8 md:p-12 text-center">
                            <h2 className="text-2xl font-bold mb-4">Carica Documento</h2>
                            <p className="text-slate-500 mb-8">{mode === 'forecast' ? "Carica l'Estratto Conto Contributivo INPS: leggiamo le righe e calcoliamo settimane e retribuzioni degli ultimi 4 anni." : 'Carica la lettera INPS di accoglimento della NASpI per compilare i dati automaticamente.'}</p>
                            {mode === 'forecast' && (
                                <div className="max-w-xs mx-auto mb-6 text-left">
                                    <label htmlFor={termDateUploadId} className="block text-sm font-bold text-slate-700 mb-2">Ultimo giorno di lavoro</label>
                                    <input id={termDateUploadId} type="date" value={inputData.terminationDate} onChange={e => setInputData({ ...inputData, terminationDate: e.target.value })} className="w-full p-3 rounded-xl border border-slate-300" />
                                    <p className="text-xs text-slate-500 mt-1">Serve per contare i 4 anni precedenti.</p>
                                </div>
                            )}
                            {erroreLettura && <div role="alert" className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm text-left">{erroreLettura}</div>}

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-12 cursor-pointer hover:border-blue-400 hover:bg-slate-50 transition-colors mb-6 group text-center"
                            >
                                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
                                <span className="font-bold text-slate-700 block">Clicca per caricare</span>
                                <span className="text-sm text-slate-600 mt-2 block">PDF o foto (massimo 3 MB)</span>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" aria-label="Carica documento contributivo" />
                            <p className="text-sm text-slate-600 mb-2">Il documento viene inviato a un servizio di lettura automatica solo per estrarre i dati del calcolo. Noi non lo conserviamo. Se preferisci, inserisci i dati a mano.</p>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                                <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-slate-600">oppure</span></div>
                            </div>

                            <button onClick={() => { setLetto(false); setAvvisi([]); setStep(2); }} className="text-blue-600 font-bold hover:underline mt-2">Inserisci dati manualmente</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="p-8 md:p-12">
                            <h2 className="text-2xl font-bold mb-6">Dati per il calcolo</h2>
                            {letto && (
                                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
                                    <p className="font-bold mb-1">Dati letti dal documento: controllali prima di calcolare.</p>
                                    {avvisi.length > 0 && <ul className="list-disc pl-5 space-y-1">{avvisi.map((a, i) => <li key={i}>{a}</li>)}</ul>}
                                </div>
                            )}
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor={ageId} className="block text-sm font-bold text-slate-700 mb-2">La tua Età</label>
                                        <input id={ageId} type="number" min={14} max={99} value={inputData.age} onChange={e => setInputData({ ...inputData, age: +e.target.value })} className="w-full p-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-300" />
                                    </div>
                                    <div>
                                        <label htmlFor={termDateId} className="block text-sm font-bold text-slate-700 mb-2">Data Licenziamento</label>
                                        <input id={termDateId} type="date" value={inputData.terminationDate} onChange={e => setInputData({ ...inputData, terminationDate: e.target.value })} className="w-full p-4 rounded-xl border border-slate-300 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                </div>

                                {mode === 'forecast' ? (
                                    <>
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                            <h3 className="font-bold text-slate-900 mb-4 flex gap-2"><Briefcase className="w-5 h-5 text-slate-500" aria-hidden="true" /> Dati Contributivi (4 Anni)</h3>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <label htmlFor={weeksId} className="flex items-center gap-1 text-sm font-medium text-slate-600 mb-1">
                                                        Settimane Lavorate
                                                        <HelpCircle className="w-4 h-4 inline text-slate-400" aria-hidden="true" />
                                                    </label>
                                                    <input id={weeksId} aria-describedby={weeksHintId} type="number" min={0} max={208} value={inputData.weeksWorkedLast4Years} onChange={e => setInputData({ ...inputData, weeksWorkedLast4Years: +e.target.value })} className="w-full p-3 rounded-lg border" />
                                                    <p id={weeksHintId} className="text-xs text-slate-500 mt-1">Numero totale di settimane contributive negli ultimi 4 anni.</p>
                                                </div>
                                                <div>
                                                    <label htmlFor={wagesId} className="flex items-center gap-1 text-sm font-medium text-slate-600 mb-1">
                                                        Totale Imponibile Lordo
                                                        <HelpCircle className="w-4 h-4 inline text-slate-400" aria-hidden="true" />
                                                    </label>
                                                    <input id={wagesId} aria-describedby={wagesHintId} type="number" min={0} value={inputData.totalGrossWagesLast4Years} onChange={e => setInputData({ ...inputData, totalGrossWagesLast4Years: +e.target.value })} className="w-full p-3 rounded-lg border" />
                                                    <p id={wagesHintId} className="text-xs text-slate-500 mt-1">Somma delle retribuzioni imponibili ai fini previdenziali.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor={reasonId} className="block text-sm font-bold text-slate-700 mb-2">Motivo Cessazione</label>
                                            <select id={reasonId} value={inputData.terminationReason} onChange={e => setInputData({ ...inputData, terminationReason: e.target.value as TerminationReason })} className="w-full p-4 rounded-xl border border-slate-300 bg-white">
                                                {Object.values(TerminationReason).map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <h3 className="font-bold text-slate-900 mb-4">Dati da Lettera INPS</h3>
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <div>
                                                <label htmlFor={startApprovedId} className="block text-sm">Data di decorrenza</label>
                                                <input id={startApprovedId} type="date" value={inputData.approvedStartDate} onChange={e => setInputData({ ...inputData, approvedStartDate: e.target.value })} className="w-full p-3 rounded-lg border" />
                                            </div>
                                            <div>
                                                <label htmlFor={daysApprovedId} className="block text-sm">Giorni Spettanti</label>
                                                <input id={daysApprovedId} type="number" min={0} value={inputData.approvedDaysDuration} onChange={e => setInputData({ ...inputData, approvedDaysDuration: +e.target.value })} className="w-full p-3 rounded-lg border" />
                                            </div>
                                            <div>
                                                <label htmlFor={monthlyApprovedId} className="block text-sm">Importo Mensile Lordo</label>
                                                <input id={monthlyApprovedId} type="number" min={0} value={inputData.approvedMonthlyAmount} onChange={e => setInputData({ ...inputData, approvedMonthlyAmount: +e.target.value })} className="w-full p-3 rounded-lg border" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button onClick={handleCalculate} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                    Calcola la mia NASpI <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && result && (
                        <div className="bg-slate-50 min-h-[500px]">
                            <div className="bg-white p-8 border-b shadow-sm">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-3xl font-bold text-slate-900">Il tuo Risultato</h2>
                                    <button onClick={reset} className="text-sm font-bold text-slate-500 hover:text-blue-600">Ricalcola</button>
                                </div>

                                {!result.isEligible ? (
                                    <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-800 flex gap-4">
                                        <AlertTriangle className="w-8 h-8 shrink-0" />
                                        <div><h3 className="font-bold text-lg mb-2">Domanda Probabilmente Respinta</h3><p>{result.ineligibilityReason}</p></div>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                            <div className="relative z-10">
                                                <div className="text-blue-100 mb-1 text-sm font-medium uppercase tracking-wide">Importo Mensile Lordo</div>
                                                <div className="text-4xl font-extrabold mb-4">€ {result.grossMonthlyAmount.toLocaleString('it-IT')}</div>
                                                <div className="flex gap-2 text-sm bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                                    <TrendingDown className="w-4 h-4" />
                                                    <span>-3% dal {inputData.age >= 55 ? '8°' : '6°'} mese</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                                            <div className="text-slate-500 mb-1 text-sm font-medium uppercase tracking-wide">Durata Totale</div>
                                            <div className="text-4xl font-extrabold text-slate-900 mb-4">{result.totalDaysDuration} <span className="text-xl text-slate-500 font-normal">giorni</span></div>
                                            <div className="text-sm text-slate-600 flex gap-4">
                                                <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Dal {result.startDate}</div>
                                                <div className="flex items-center gap-1"><ArrowRight className="w-4 h-4" /> Al {result.endDate}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {result.isEligible && (
                                <div className="p-8 space-y-8">
                                    <ConversionCTA
                                        headline={`Puoi ottenere fino a € ${result.grossMonthlyAmount.toLocaleString('it-IT')} al mese`}
                                        subline={`La tua stima NASpI copre ${result.totalDaysDuration} giorni, dal ${result.startDate} al ${result.endDate}. Presenta la domanda entro 68 giorni dalla fine del lavoro: possiamo farla noi per te, gratis.`}
                                    />

                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-4">Piano dei Pagamenti Stimato</h3>
                                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                            <table tabIndex={0} className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                                                    <tr>
                                                        <th className="p-4">Periodo</th>
                                                        <th className="p-4">Lordo</th>
                                                        <th className="p-4 hidden md:table-cell">Netto Stimato*</th>
                                                        <th className="p-4 hidden md:table-cell">Note</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {result.schedule.map((row, i) => (
                                                        <tr key={i} className="hover:bg-slate-50">
                                                            <td className="p-4 font-bold text-slate-700">{row.monthYear}</td>
                                                            <td className="p-4">€ {row.grossAmount.toFixed(2).replace('.', ',')}</td>
                                                            <td className="p-4 hidden md:table-cell text-emerald-800 font-medium">€ {row.netAmount.toFixed(2).replace('.', ',')}</td>
                                                            <td className="p-4 hidden md:table-cell text-xs text-slate-400">
                                                                {row.reductionApplied && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">Ridotto {row.reductionPercentage}%</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className="p-4 bg-slate-50 text-xs text-slate-600 text-center">* Il netto è puramente indicativo e dipende dalle detrazioni personali.</div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                        <h3 className="font-bold text-slate-900 text-lg mb-2">Dopo la domanda: il SIISL</h3>
                                        <p className="text-slate-700 mb-3">Quando la NASpI viene accolta, entro 15 giorni devi entrare nella piattaforma SIISL, compilare il curriculum e firmare il patto di attivazione digitale.</p>
                                        <a href="/siisl" className="font-bold text-blue-700 underline">Leggi cosa fare sul SIISL</a>
                                    </div>
                                    <ConversionCTA
                                        variant="inline"
                                        headline="Non perdere la scadenza di 68 giorni"
                                        subline="Dopo quella data non puoi più presentare la domanda. Affida la pratica al nostro patronato: la presentiamo noi all'INPS, gratis."
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* SIDEBAR */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><HelpCircle className="w-5 h-5" /> Come funziona?</h3>
                        <div className="space-y-4 text-sm text-indigo-100">
                            <p><strong>1. Retribuzione Media:</strong> Calcoliamo la media dei tuoi stipendi degli ultimi 4 anni.</p>
                            <p><strong>2. Coefficiente 75%:</strong> Se la media è fino a €1.456,72, prendi il 75%. Se sopra, si aggiunge il 25% dell'eccedenza.</p>
                            <p><strong>3. Durata:</strong> Spetta per la metà delle settimane lavorate (max 2 anni).</p>
                        </div>
                    </div>

                    <InfoCard title="Settimane Utili" desc="Sono le settimane in cui hai versato contributi negli ultimi 4 anni. Un anno pieno sono 52 settimane. Il minimo per accedere è 13." />
                    <InfoCard title="Imponibile Previdenziale" desc="È la cifra lorda su cui si calcolano i contributi. La trovi nella busta paga sotto 'Imponibile INPS' o nell'estratto conto contributivo." />
                </div>

            </div>
        </div>
    );
};
export default NaspiCalculator;
