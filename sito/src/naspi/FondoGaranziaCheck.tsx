import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, FileText, CalendarClock } from 'lucide-react';

// Regole dalla scheda INPS "Fondo di garanzia del TFR e dei crediti di lavoro"
// (ultimo aggiornamento 19/12/2025) e dalla circolare INPS 70/2023. Verificate il 25/11/2026.

type Datore = '' | 'fallimento' | 'concordato' | 'non-fallibile' | 'attivo' | 'nonso';

const DATORI: { v: Datore; t: string; s: string }[] = [
    { v: 'fallimento', t: 'È fallito o in liquidazione', s: 'Fallimento, liquidazione giudiziale, liquidazione coatta amministrativa, amministrazione straordinaria' },
    { v: 'concordato', t: 'È in concordato', s: 'Concordato preventivo o semplificato' },
    { v: 'non-fallibile', t: 'È piccolo e non può fallire', s: 'Il tribunale ha respinto il fallimento, oppure è una piccola impresa, un\'impresa agricola o cancellata da oltre un anno' },
    { v: 'attivo', t: 'È ancora aperto ma non paga', s: 'Nessuna procedura in tribunale' },
    { v: 'nonso', t: 'Non lo so', s: '' },
];

const mesi = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
const dataIt = (d: Date) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
const parse = (s: string) => { const [y, m, g] = s.split('-').map(Number); return new Date(y, m - 1, g); };

const radioCls = (on: boolean) =>
    `block w-full text-left rounded-xl border-2 p-4 cursor-pointer transition-colors ${on ? 'border-teal-700 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-400'}`;

const FondoGaranziaCheck: React.FC = () => {
    const [privato, setPrivato] = useState<'' | 'si' | 'no'>('');
    const [finito, setFinito] = useState<'' | 'si' | 'no'>('');
    const [datore, setDatore] = useState<Datore>('');
    const [fine, setFine] = useState('');
    const [rif, setRif] = useState('');

    // Le ultime 3 mensilità devono cadere nei 12 mesi prima della domanda di apertura della procedura
    // (o del deposito del ricorso per l'esecuzione individuale): art. 2, c. 1, d.lgs. 80/1992.
    const finestra = useMemo(() => {
        if (!fine || !rif) return null;
        const f = parse(fine), r = parse(rif);
        if (f > r) return { stato: 'dopo' as const };
        const inizioTre = mesi(f, -3);
        const limite = mesi(r, -12);
        if (inizioTre >= limite) return { stato: 'si' as const, limite };
        if (f > limite) return { stato: 'parte' as const, limite };
        return { stato: 'no' as const, limite };
    }, [fine, rif]);

    const stop = privato === 'no' || finito === 'no';

    return (
        <div className="not-prose bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl my-8">
            <div className="flex items-center gap-3 mb-2">
                <CalendarClock className="w-7 h-7 text-teal-300" aria-hidden="true" />
                <h2 className="text-2xl font-bold">Verifica: puoi chiedere il Fondo di garanzia?</h2>
            </div>
            <p className="text-slate-300 mb-6">Quattro domande. Nessun dato viene salvato.</p>

            <fieldset className="mb-6">
                <legend className="font-bold mb-3">1. Eri dipendente di un datore di lavoro privato?</legend>
                <div className="grid sm:grid-cols-2 gap-3 text-slate-900">
                    <label className={radioCls(privato === 'si')}><input type="radio" name="fg-privato" className="mr-2" checked={privato === 'si'} onChange={() => setPrivato('si')} />Sì (anche apprendista o dirigente)</label>
                    <label className={radioCls(privato === 'no')}><input type="radio" name="fg-privato" className="mr-2" checked={privato === 'no'} onChange={() => setPrivato('no')} />No: autonomo, collaboratore o pubblico</label>
                </div>
            </fieldset>

            <fieldset className="mb-6">
                <legend className="font-bold mb-3">2. Il rapporto di lavoro è finito?</legend>
                <div className="grid sm:grid-cols-2 gap-3 text-slate-900">
                    <label className={radioCls(finito === 'si')}><input type="radio" name="fg-finito" className="mr-2" checked={finito === 'si'} onChange={() => setFinito('si')} />Sì, licenziamento o dimissioni</label>
                    <label className={radioCls(finito === 'no')}><input type="radio" name="fg-finito" className="mr-2" checked={finito === 'no'} onChange={() => setFinito('no')} />No, lavoro ancora lì</label>
                </div>
            </fieldset>

            {stop ? (
                <div className="bg-white/10 border border-white/20 rounded-2xl p-5 [&_a]:!text-white" aria-live="polite">
                    <p className="flex gap-3 font-bold text-lg mb-2"><XCircle className="w-6 h-6 text-red-300 shrink-0" aria-hidden="true" />Il Fondo di garanzia non può intervenire</p>
                    {privato === 'no' ? (
                        <p className="text-slate-200">Sono esclusi i lavoratori autonomi, i collaboratori (parasubordinati) e i dipendenti di Stato, Regioni, Province, Comuni ed enti pubblici non economici. Esclusi anche impiegati e dirigenti di aziende agricole e operai agricoli a tempo determinato.</p>
                    ) : (
                        <p className="text-slate-200">Il Fondo paga solo quando il rapporto di lavoro è finito. Se lo stipendio non arriva da mesi, puoi fare le <a className="underline text-white" href="/dimissioni-online">dimissioni per giusta causa</a>: possono dare diritto anche alla NASpI.</p>
                    )}
                </div>
            ) : (
                <>
                    <fieldset className="mb-6">
                        <legend className="font-bold mb-3">3. In che situazione è il datore di lavoro?</legend>
                        <div className="grid sm:grid-cols-2 gap-3 text-slate-900">
                            {DATORI.map((d) => (
                                <label key={d.v} className={radioCls(datore === d.v)}>
                                    <input type="radio" name="fg-datore" className="mr-2" checked={datore === d.v} onChange={() => setDatore(d.v)} />
                                    <span className="font-semibold">{d.t}</span>
                                    {d.s && <span className="block text-sm text-slate-600 mt-1">{d.s}</span>}
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className="mb-6">
                        <legend className="font-bold mb-1">4. Per gli stipendi non pagati: le date</legend>
                        <p className="text-sm text-slate-300 mb-3">Serve solo per le ultime tre mensilità. Per il TFR non conta.</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="fg-fine" className="block text-sm font-medium text-slate-200 mb-1">Ultimo giorno di lavoro</label>
                                <input id="fg-fine" type="date" value={fine} onChange={(e) => setFine(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white" />
                            </div>
                            <div>
                                <label htmlFor="fg-rif" className="block text-sm font-medium text-slate-200 mb-1">Data della domanda di fallimento o del tuo ricorso in tribunale</label>
                                <input id="fg-rif" type="date" value={rif} onChange={(e) => setRif(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white" />
                            </div>
                        </div>
                    </fieldset>

                    <div className="space-y-4" aria-live="polite">
                        {privato === 'si' && finito === 'si' && datore && (
                            <div className="bg-white text-slate-900 rounded-2xl p-5">
                                {datore === 'fallimento' && (
                                    <>
                                        <p className="flex gap-3 font-bold text-lg mb-3"><CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" aria-hidden="true" />Sì, puoi chiedere TFR e ultime tre mensilità</p>
                                        <p className="mb-2"><strong>Prima</strong> il tuo credito deve essere ammesso allo <strong>stato passivo</strong> (la domanda di insinuazione al passivo si presenta al curatore).</p>
                                        <p className="mb-2"><strong>Quando</strong>: dal <strong>31° giorno</strong> dopo il deposito dello stato passivo reso esecutivo. Se ci sono opposizioni sul tuo credito, dal 31° giorno dopo la decisione.</p>
                                        <p className="font-semibold mt-3 mb-1">Documenti</p>
                                        <ul className="list-disc pl-5 space-y-1 text-sm">
                                            <li>Copia autentica dello stato passivo esecutivo, anche per estratto (per alcune grandi procedure dei tribunali di Roma, Velletri e Civitavecchia la manda il tribunale).</li>
                                            <li>Modello SR52 compilato e firmato dal curatore (se rifiuta: documenti tuoi e modello SR54).</li>
                                            <li>Dichiarazione che il credito non è stato contestato: si fa direttamente nella domanda online.</li>
                                        </ul>
                                    </>
                                )}
                                {datore === 'concordato' && (
                                    <>
                                        <p className="flex gap-3 font-bold text-lg mb-3"><CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" aria-hidden="true" />Sì, dopo l'omologazione del concordato</p>
                                        <p className="mb-2"><strong>Quando</strong>: dal giorno dopo la pubblicazione del decreto o della sentenza di omologazione.</p>
                                        <p className="font-semibold mt-3 mb-1">Documenti</p>
                                        <ul className="list-disc pl-5 space-y-1 text-sm">
                                            <li>Modello SR52 (o SR196 per i concordati del Codice della crisi) firmato dal commissario giudiziale.</li>
                                            <li>Copia autentica del decreto o della sentenza di omologazione.</li>
                                            <li>Buste paga dei mesi non pagati, se manca il modello SR52.</li>
                                        </ul>
                                    </>
                                )}
                                {datore === 'non-fallibile' && (
                                    <>
                                        <p className="flex gap-3 font-bold text-lg mb-3"><AlertTriangle className="w-6 h-6 text-amber-700 shrink-0" aria-hidden="true" />Sì, ma prima devi provare a farti pagare</p>
                                        <p className="mb-2">Servono un <strong>titolo esecutivo</strong> (per esempio decreto ingiuntivo esecutivo, sentenza definitiva, conciliazione resa esecutiva, diffida accertativa dell'Ispettorato diventata esecutiva) e un <strong>pignoramento andato a vuoto</strong>.</p>
                                        <p className="mb-2"><strong>Quando</strong>: dal giorno dopo il verbale di pignoramento negativo (o dopo il decreto del tribunale che respinge il fallimento, se arriva dopo).</p>
                                        <p className="font-semibold mt-3 mb-1">Documenti</p>
                                        <ul className="list-disc pl-5 space-y-1 text-sm">
                                            <li>Modello SR53 compilato da te.</li>
                                            <li>Copia conforme del titolo esecutivo e verbale di pignoramento negativo.</li>
                                            <li>Decreto che respinge il fallimento, salvo i casi in cui non serve (piccole SRL e imprese individuali con i requisiti di legge, impresa agricola, cancellata da oltre un anno).</li>
                                            <li>Dichiarazione sui beni immobili del datore: <strong>non serve se chiedi meno di 5.000 € lordi</strong> in tutto.</li>
                                        </ul>
                                    </>
                                )}
                                {datore === 'attivo' && (
                                    <>
                                        <p className="flex gap-3 font-bold text-lg mb-3"><AlertTriangle className="w-6 h-6 text-amber-700 shrink-0" aria-hidden="true" />Non ancora: il Fondo interviene solo se il datore è insolvente</p>
                                        <p className="mb-2">Prima bisogna ottenere un titolo esecutivo (per esempio un decreto ingiuntivo o una diffida accertativa dell'Ispettorato del lavoro) e provare a farsi pagare. Se il pignoramento va a vuoto o si apre una procedura in tribunale, allora puoi chiedere il Fondo.</p>
                                        <p>Muoviti presto: per le ultime tre mensilità contano i 12 mesi prima del ricorso in tribunale.</p>
                                    </>
                                )}
                                {datore === 'nonso' && (
                                    <>
                                        <p className="flex gap-3 font-bold text-lg mb-3"><AlertTriangle className="w-6 h-6 text-amber-700 shrink-0" aria-hidden="true" />Prima va capito in che stato è l'azienda</p>
                                        <p>Si controlla in visura camerale se c'è una procedura aperta (fallimento, liquidazione, concordato). Possiamo farlo noi con te.</p>
                                    </>
                                )}
                            </div>
                        )}

                        {finestra && (
                            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 [&_strong]:text-white">
                                <p className="font-bold mb-1">Ultime tre mensilità</p>
                                {finestra.stato === 'si' && <p className="text-slate-100">Le ultime tre mensilità cadono nei 12 mesi richiesti (dal {dataIt(finestra.limite)} in poi): <strong>possono essere pagate dal Fondo</strong>, entro il tetto di legge.</p>}
                                {finestra.stato === 'parte' && <p className="text-slate-100">Solo una parte degli ultimi tre mesi cade nei 12 mesi richiesti (dal {dataIt(finestra.limite)} in poi). Il Fondo copre la parte che ci rientra: va verificato sui documenti.</p>}
                                {finestra.stato === 'no' && <p className="text-slate-100">Gli ultimi tre mesi sono fuori dai 12 mesi richiesti (dal {dataIt(finestra.limite)} in poi): <strong>gli stipendi non sono coperti</strong>. Il TFR resta garantito.</p>}
                                {finestra.stato === 'dopo' && <p className="text-slate-100">Hai lavorato anche dopo la data della procedura o del ricorso: in questo caso le regole cambiano (contano i 12 mesi prima della fine del lavoro, se hai lavorato davvero dopo l'apertura). Va verificato caso per caso.</p>}
                            </div>
                        )}
                    </div>
                </>
            )}

            <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <a href="/prenota" className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 !text-white !no-underline font-bold rounded-xl py-4 px-4 transition-colors">
                    Prenota: ti aiutiamo noi <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </a>
                <a href="#documenti" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 !text-white !no-underline font-bold rounded-xl py-4 px-4 border border-white/30 transition-colors">
                    <FileText className="w-5 h-5" aria-hidden="true" /> Tutti i documenti
                </a>
            </div>
            <p className="text-xs text-slate-300 mt-3">Risultato indicativo: la decisione spetta all'INPS sui documenti presentati.</p>
        </div>
    );
};

export default FondoGaranziaCheck;
