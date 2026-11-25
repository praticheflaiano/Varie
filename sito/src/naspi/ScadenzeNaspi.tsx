import React, { useMemo, useState } from 'react';
import { CalendarClock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

// Regole dalla scheda INPS "NASpI: indennità mensile di disoccupazione" (ultimo aggiornamento 2/2/2026)
// e dall'art. 6, c. 2, d.lgs. 22/2015. Verificate il 25/11/2026.
// - domanda entro 68 giorni dalla cessazione; per il licenziamento per giusta causa dal 30° giorno dopo la cessazione
// - decorrenza: 8° giorno dopo la cessazione se la domanda è presentata entro quel giorno (38° per il licenziamento
//   per giusta causa), altrimenti dal giorno successivo alla domanda

type Motivo = 'normale' | 'giusta-causa-lic';

const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const add = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const diff = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000);
const it = (d: Date) => d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const oggi = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };

const ScadenzeNaspi: React.FC = () => {
    const [fine, setFine] = useState('');
    const [motivo, setMotivo] = useState<Motivo>('normale');
    const [domanda, setDomanda] = useState(oggi());

    const r = useMemo(() => {
        if (!fine || !domanda) return null;
        const f = parse(fine), d = parse(domanda);
        if (d < f) return { errore: true as const };
        const inizioTermine = motivo === 'giusta-causa-lic' ? add(f, 30) : f;
        const scadenza = add(inizioTermine, 68);
        const giornoBase = add(f, motivo === 'giusta-causa-lic' ? 38 : 8);
        const decorrenza = d <= giornoBase ? giornoBase : add(d, 1);
        return {
            errore: false as const,
            scadenza,
            giornoBase,
            decorrenza,
            inRitardo: d > scadenza,
            persi: Math.max(0, diff(giornoBase, decorrenza)),
            restano: diff(d, scadenza),
        };
    }, [fine, motivo, domanda]);

    return (
        <div className="not-prose bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl my-8">
            <div className="flex items-center gap-3 mb-2">
                <CalendarClock className="w-7 h-7 text-teal-300" aria-hidden="true" />
                <h2 className="text-2xl font-bold">Le tue scadenze NASpI</h2>
            </div>
            <p className="text-slate-300 mb-6">Scrivi l'ultimo giorno di lavoro: vedi entro quando fare la domanda e da quando parte la NASpI.</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="sc-fine" className="block text-sm font-medium text-slate-200 mb-1">Ultimo giorno di lavoro</label>
                    <input id="sc-fine" type="date" value={fine} onChange={(e) => setFine(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white" />
                </div>
                <div>
                    <label htmlFor="sc-domanda" className="block text-sm font-medium text-slate-200 mb-1">Giorno in cui presenti la domanda</label>
                    <input id="sc-domanda" type="date" value={domanda} onChange={(e) => setDomanda(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white" />
                </div>
            </div>
            <fieldset className="mb-6">
                <legend className="text-sm font-medium text-slate-200 mb-2">Come è finito il lavoro</legend>
                <div className="grid sm:grid-cols-2 gap-3">
                    <label className={`rounded-xl border-2 p-3 cursor-pointer ${motivo === 'normale' ? 'border-teal-300 bg-white/10' : 'border-slate-600'}`}>
                        <input type="radio" name="sc-motivo" className="mr-2" checked={motivo === 'normale'} onChange={() => setMotivo('normale')} />
                        Licenziamento, fine contratto, dimissioni per giusta causa
                    </label>
                    <label className={`rounded-xl border-2 p-3 cursor-pointer ${motivo === 'giusta-causa-lic' ? 'border-teal-300 bg-white/10' : 'border-slate-600'}`}>
                        <input type="radio" name="sc-motivo" className="mr-2" checked={motivo === 'giusta-causa-lic'} onChange={() => setMotivo('giusta-causa-lic')} />
                        Licenziamento per giusta causa (disciplinare)
                    </label>
                </div>
            </fieldset>

            <div aria-live="polite" className="space-y-3 [&_strong]:text-white">
                {!r && <p className="text-slate-300">Inserisci l'ultimo giorno di lavoro.</p>}
                {r && r.errore && <p className="text-slate-200">La domanda non si può fare prima della fine del lavoro.</p>}
                {r && !r.errore && (
                    <>
                        <div className={`rounded-2xl p-4 border ${r.inRitardo ? 'bg-red-900/40 border-red-300/50' : 'bg-white/10 border-white/20'}`}>
                            <p className="text-sm text-slate-300">Ultimo giorno per la domanda</p>
                            <p className="text-xl font-bold">{it(r.scadenza)}</p>
                            {r.inRitardo ? (
                                <p className="flex gap-2 mt-2 text-slate-100"><AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" aria-hidden="true" />In quella data il termine è già scaduto. In alcuni casi però parte più tardi o si ferma (maternità, malattia o infortunio indennizzati, preavviso pagato, vertenza): scrivici prima di rinunciare.</p>
                            ) : (
                                <p className="text-sm text-slate-300 mt-1">Dalla data della domanda mancano {r.restano} giorni alla scadenza.</p>
                            )}
                        </div>
                        {!r.inRitardo && (
                            <div className="rounded-2xl p-4 bg-white/10 border border-white/20">
                                <p className="text-sm text-slate-300">La NASpI parte dal</p>
                                <p className="text-xl font-bold">{it(r.decorrenza)}</p>
                                {r.persi > 0 ? (
                                    <p className="flex gap-2 mt-2 text-slate-100"><AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" aria-hidden="true" />Presentando la domanda entro {it(r.giornoBase)} sarebbe partita da quel giorno: con questa data perdi <strong>{r.persi} giorni</strong> di NASpI.</p>
                                ) : (
                                    <p className="flex gap-2 mt-2 text-slate-100"><CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" aria-hidden="true" />Domanda in tempo per non perdere nessun giorno.</p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <a href="/naspi#richiesta-online" className="mt-6 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 !text-white !no-underline font-bold rounded-xl py-4 px-4 transition-colors">
                Fai la domanda con noi, è gratis <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </a>
            <p className="text-xs text-slate-300 mt-3">Calcolo indicativo. Se c'erano maternità, malattia, infortunio o preavviso pagato dopo la fine del lavoro, i termini partono dalla loro fine.</p>
        </div>
    );
};

export default ScadenzeNaspi;
