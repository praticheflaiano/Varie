import React, { useMemo, useState } from 'react';
import { PiggyBank, AlertTriangle, CheckCircle2, Building2, User, Coins, ArrowRight, Briefcase, XCircle, FileText, CalendarClock } from 'lucide-react';
import { calculateAnticipo } from './calculations';

// Pagina anticipo NASpI. Regole verificate il 24/11/2026 su:
// - scheda INPS "NASpI anticipata" (ultimo aggiornamento 12/06/2026)
// - messaggio INPS n. 1215 del 7/4/2026 (due rate 70% + 30% per le domande dal 1/1/2026)
// - art. 8 d.lgs. 22/2015 come modificato dall'art. 1, c. 176, legge 199/2025
export const ANTICIPO_UPDATED = '2026-11-24';

// Separatore delle migliaia sempre presente (in italiano 7909,48 verrebbe scritto senza punto).
const eur = (n: number) => {
    const [int, dec] = n.toFixed(2).split('.');
    return '€ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec;
};
const dataIt = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
};
const oggi = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const inputCls = 'w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-emerald-400 outline-none';

const AnticipoNaspi: React.FC = () => {
    const [start, setStart] = useState('');
    const [days, setDays] = useState<number>(0);
    const [monthly, setMonthly] = useState<number>(0);
    const [request, setRequest] = useState(oggi());
    const [over55, setOver55] = useState(false);

    const r = useMemo(() => {
        if (!start || !request || days <= 0 || monthly <= 0) return null;
        if (request < start) return null;
        return calculateAnticipo({ naspiStartDate: start, totalDays: days, monthlyGrossAmount: monthly, anticipoRequestDate: request, age: over55 ? 55 : 40 });
    }, [start, days, monthly, request, over55]);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-100 text-emerald-800 rounded-2xl mb-4">
                    <PiggyBank className="w-8 h-8" aria-hidden="true" />
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">Anticipo NASpI 2026: come funziona e quanto ricevi</h1>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                    Se apri una partita IVA, un'impresa o entri in una cooperativa, puoi chiedere all'INPS tutta la NASpI che ti resta. Dal 2026 arriva in <strong>due rate</strong>.
                </p>
                <p className="text-sm text-slate-600 mt-3">Aggiornato al <time dateTime={ANTICIPO_UPDATED}>24 novembre 2026</time></p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">

                    <section aria-labelledby="in-breve" className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 md:p-8">
                        <h2 id="in-breve" className="text-2xl font-bold text-slate-900 mb-4">In breve</h2>
                        <ul className="space-y-3 text-slate-800">
                            <li><strong>Prima rata: 70%</strong> della NASpI che ti resta, quando l'INPS accoglie la domanda.</li>
                            <li><strong>Seconda rata: 30%</strong>, alla fine del periodo in cui avresti preso la NASpI, e comunque <strong>non oltre 6 mesi</strong> dalla domanda.</li>
                            <li><strong>Domanda entro 30 giorni</strong> dall'inizio dell'attività.</li>
                            <li>Se nel frattempo <strong>trovi lavoro come dipendente</strong>, il 30% non arriva e devi restituire anche il 70%.</li>
                            <li>Vale per le domande presentate <strong>dal 1° gennaio 2026</strong>. Prima l'anticipo era pagato tutto insieme.</li>
                        </ul>
                    </section>

                    <a href="/naspi#richiesta-online" className="flex items-center justify-between gap-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl p-5 shadow-lg transition-colors">
                        <span>
                            <span className="block text-lg font-bold">Fai la domanda con noi, è gratis</span>
                            <span className="block text-sm text-emerald-50">Patronato ENASC: NASpI e anticipo, anche a distanza da tutta Italia</span>
                        </span>
                        <ArrowRight className="w-6 h-6 shrink-0" aria-hidden="true" />
                    </a>

                    <section aria-labelledby="chi-puo" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                        <h2 id="chi-puo" className="text-2xl font-bold text-slate-900 mb-2">Chi può chiederlo</h2>
                        <p className="text-slate-700 mb-5">Chi ha diritto alla NASpI e vuole:</p>
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { icon: Briefcase, title: 'Lavoro autonomo', desc: 'Aprire una partita IVA come professionista o lavoratore autonomo.' },
                                { icon: User, title: 'Impresa individuale', desc: 'Avviare una ditta individuale: commercio, artigianato, servizi.' },
                                { icon: Coins, title: 'Cooperativa', desc: 'Sottoscrivere una quota di una cooperativa in cui lavori come socio.' },
                                { icon: Building2, title: 'Attività già avviata', desc: "Portare a tempo pieno un'attività autonoma iniziata prima della fine del lavoro dipendente." },
                            ].map((item) => (
                                <div key={item.title} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-white p-2 rounded-lg shadow-sm"><item.icon className="w-5 h-5 text-emerald-700" aria-hidden="true" /></div>
                                        <h3 className="font-bold text-slate-900">{item.title}</h3>
                                    </div>
                                    <p className="text-sm text-slate-700">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-slate-700 mt-4">Vuoi entrare in una società diversa da una cooperativa? Il caso va valutato: scrivici prima di aprire.</p>
                    </section>

                    <section aria-labelledby="scadenza" className="bg-amber-50 border border-amber-200 rounded-3xl p-6 md:p-8">
                        <div className="flex gap-4 items-start">
                            <div className="bg-amber-100 p-3 rounded-xl shrink-0"><AlertTriangle className="w-6 h-6 text-amber-800" aria-hidden="true" /></div>
                            <div>
                                <h2 id="scadenza" className="text-2xl font-bold text-amber-950 mb-2">Entro quando fare la domanda</h2>
                                <ul className="space-y-2 text-amber-950">
                                    <li><strong>Entro 30 giorni</strong> dall'inizio dell'attività autonoma o dell'impresa, oppure dalla sottoscrizione della quota della cooperativa.</li>
                                    <li>Se l'attività era già iniziata <strong>prima della fine del lavoro dipendente</strong>: entro 30 giorni dalla domanda NASpI.</li>
                                </ul>
                                <p className="text-amber-950 mt-3">Prima serve la NASpI: la domanda di anticipo si fa solo se hai diritto all'indennità.</p>
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="quanto" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                        <h2 id="quanto" className="text-2xl font-bold text-slate-900 mb-4">Quanto ricevi e quando</h2>
                        <p className="text-slate-700 mb-4">L'INPS ti paga la NASpI <strong>che non hai ancora preso</strong>, calcolata come se continuassi a riceverla ogni mese (compresa la riduzione del 3% al mese che scatta dal 6° mese, o dall'8° se hai almeno 55 anni).</p>
                        <ul className="space-y-3 text-slate-700">
                            <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" /><span><strong>70% subito</strong>, quando la domanda viene accolta.</span></li>
                            <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" /><span><strong>30% dopo</strong>: alla fine del periodo teorico della NASpI, al massimo 6 mesi dopo la domanda.</span></li>
                            <li className="flex gap-3"><XCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" /><span><strong>Niente assegno al nucleo familiare</strong> e <strong>niente contributi figurativi</strong> per la pensione sul periodo anticipato.</span></li>
                            <li className="flex gap-3"><XCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" /><span><strong>Si pagano le tasse</strong>: l'INPS trattiene l'IRPEF. Se la somma va tutta nella quota di una cooperativa in cui lavori, invece, non è tassata.</span></li>
                        </ul>
                    </section>

                    <section aria-labelledby="attenzione" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                        <h2 id="attenzione" className="text-2xl font-bold text-slate-900 mb-4">Quando il 30% non arriva o devi restituire</h2>
                        <ul className="space-y-3 text-slate-700">
                            <li><strong>Trovi lavoro come dipendente</strong> prima della fine del periodo teorico della NASpI (o dei 6 mesi): non ricevi il 30% e devi <strong>restituire anche il 70%</strong>. Non vale se il lavoro è con la cooperativa di cui sei socio.</li>
                            <li><strong>Vai in pensione</strong> (pensione diretta) dopo aver preso il 70%: il 30% non ti viene pagato.</li>
                            <li><strong>Hai l'assegno ordinario di invalidità</strong>: devi scegliere. Se tieni l'assegno, perdi il 30%. Se scegli l'anticipo, l'assegno resta sospeso per il periodo teorico della NASpI e poi può ripartire.</li>
                        </ul>
                    </section>

                    <section aria-labelledby="documenti" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                        <h2 id="documenti" className="text-2xl font-bold text-slate-900 mb-4">Cosa serve per la domanda</h2>
                        <ul className="space-y-2 text-slate-700">
                            <li className="flex gap-3"><FileText className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" /><span>Documenti che provano l'avvio dell'attività (per esempio apertura della partita IVA, iscrizione alla Camera di commercio).</span></li>
                            <li className="flex gap-3"><FileText className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" /><span>Estremi di autorizzazioni o iscrizione all'albo, se l'attività li richiede.</span></li>
                            <li className="flex gap-3"><FileText className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" /><span>Per la cooperativa: iscrizione al Registro delle imprese e all'Albo delle cooperative, data di sottoscrizione della quota. Per non pagare le tasse: anche l'estratto dell'elenco soci con la dichiarazione del presidente e la tua dichiarazione che verserai tutta la somma nel capitale.</span></li>
                        </ul>
                        <p className="text-slate-700 mt-4">La domanda si presenta online sul sito INPS, al Contact center (803 164 da fisso, 06 164 164 da cellulare) oppure tramite un patronato.</p>
                    </section>

                    <section aria-labelledby="fonti" className="text-sm text-slate-700">
                        <h2 id="fonti" className="text-lg font-bold text-slate-900 mb-2">Fonti</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Decreto legislativo 4 marzo 2015, n. 22, articolo 8, come modificato dalla legge 30 dicembre 2025, n. 199, articolo 1, comma 176.</li>
                            <li>INPS, messaggio n. 1215 del 7 aprile 2026.</li>
                            <li><a className="underline" href="https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.naspi-anticipata-indennit-di-disoccupazione-erogata-in-50589.naspi-anticipata-indennit-di-disoccupazione-erogata-in-unica-soluzione-lavoratori-licenziati-dal-1-maggio-2015-.html" target="_blank" rel="noopener noreferrer">Scheda INPS "NASpI anticipata"</a> (aggiornata al 12 giugno 2026).</li>
                        </ul>
                    </section>
                </div>

                <div className="lg:col-span-1">
                    <section aria-labelledby="calcolo" className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl lg:sticky lg:top-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/10 p-2 rounded-xl"><CalendarClock className="w-6 h-6 text-emerald-300" aria-hidden="true" /></div>
                            <h2 id="calcolo" className="text-xl font-bold">Calcola le due rate</h2>
                        </div>
                        <p className="text-sm text-slate-300 mb-5">I dati li trovi nella lettera INPS che ha accolto la tua NASpI.</p>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="ant-start" className="block text-sm font-medium text-slate-200 mb-1">Data di inizio della NASpI</label>
                                <input id="ant-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label htmlFor="ant-days" className="block text-sm font-medium text-slate-200 mb-1">Durata totale in giorni</label>
                                <input id="ant-days" type="number" min={1} inputMode="numeric" value={days || ''} onChange={(e) => setDays(+e.target.value)} className={inputCls} placeholder="Es. 360" />
                            </div>
                            <div>
                                <label htmlFor="ant-monthly" className="block text-sm font-medium text-slate-200 mb-1">Importo mensile lordo iniziale (€)</label>
                                <input id="ant-monthly" type="number" min={0} step="0.01" inputMode="decimal" value={monthly || ''} onChange={(e) => setMonthly(+e.target.value)} className={inputCls} placeholder="Es. 1200" />
                            </div>
                            <div>
                                <label htmlFor="ant-request" className="block text-sm font-medium text-slate-200 mb-1">Data della domanda di anticipo</label>
                                <input id="ant-request" type="date" value={request} onChange={(e) => setRequest(e.target.value)} className={inputCls} />
                            </div>
                            <label className="flex items-center gap-3 text-sm text-slate-200 min-h-[24px]">
                                <input type="checkbox" checked={over55} onChange={(e) => setOver55(e.target.checked)} className="w-5 h-5" />
                                Avevo almeno 55 anni quando è finito il lavoro
                            </label>

                            <div className="pt-5 border-t border-slate-700" aria-live="polite">
                                {r ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm"><span className="text-slate-300">NASpI residua lorda</span><span className="font-semibold">{eur(r.totalGrossAmount)}</span></div>
                                        <div className="bg-emerald-500/10 border border-emerald-400/40 rounded-xl p-4">
                                            <span className="block text-emerald-200 text-xs uppercase tracking-wider">Prima rata (70%)</span>
                                            <span className="block text-2xl font-bold text-emerald-300">{eur(r.firstInstallment)}</span>
                                            <span className="block text-xs text-slate-300">quando la domanda viene accolta</span>
                                        </div>
                                        <div className="bg-white/5 border border-slate-600 rounded-xl p-4">
                                            <span className="block text-slate-300 text-xs uppercase tracking-wider">Seconda rata (30%)</span>
                                            <span className="block text-2xl font-bold">{eur(r.secondInstallment)}</span>
                                            <span className="block text-xs text-slate-300">prevista entro il {dataIt(r.secondInstallmentBy)}</span>
                                        </div>
                                        <p className="text-xs text-slate-300">Fine teorica della NASpI: {dataIt(r.naspiEndDate)}. Netto stimato con IRPEF al 23%: {eur(r.estimatedNetAmount)} in tutto. L'IRPEF vera la calcola l'INPS.</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-300">{start && request && request < start ? 'La data della domanda di anticipo non può essere prima dell\'inizio della NASpI.' : 'Compila i campi per vedere le due rate.'}</p>
                                )}
                            </div>

                            <a href="/naspi#richiesta-online" className="w-full bg-emerald-700 hover:bg-emerald-800 py-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2">
                                Fai la domanda con noi <ArrowRight className="w-5 h-5" aria-hidden="true" />
                            </a>
                            <p className="text-xs text-center text-slate-300">Stima indicativa. L'importo esatto è quello del provvedimento INPS.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
export default AnticipoNaspi;
