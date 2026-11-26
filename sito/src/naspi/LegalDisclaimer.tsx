import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { LAST_UPDATED, REFERENCE_YEAR } from './constants';

interface LegalDisclaimerProps {
    variant?: 'calculator' | 'guide' | 'compact';
    className?: string;
}

const formatItalianDate = (iso: string): string => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ variant = 'calculator', className = '' }) => {
    const updated = formatItalianDate(LAST_UPDATED);

    if (variant === 'compact') {
        return (
            <p className={`text-xs text-slate-500 ${className}`}>
                Stima non ufficiale — parametri INPS {REFERENCE_YEAR} aggiornati al {updated}. Fa fede il calcolo
                dell&apos;<a href="https://www.inps.it" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">INPS</a>.
            </p>
        );
    }

    const copy = variant === 'calculator'
        ? `Importi e durate qui indicati sono una stima basata sui parametri INPS ${REFERENCE_YEAR} ` +
          `(massimo mensile 1.584,70 €, retribuzione di riferimento 1.456,72 €, circolare INPS n. 4/2026). ` +
          `Non sostituiscono il calcolo ufficiale dell'INPS riportato nel decreto di liquidazione.`
        : `Contenuti allineati alla normativa ${REFERENCE_YEAR} (D.Lgs. 22/2015 e successive circolari INPS). ` +
          `Le informazioni hanno scopo divulgativo e non costituiscono consulenza legale o fiscale.`;

    return (
        <div
            role="note"
            className={`flex gap-3 items-start bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm ${className}`}
        >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
                <p className="font-semibold mb-1">Stima informativa — aggiornata al {updated}</p>
                <p className="leading-relaxed">
                    {copy}{' '}
                    <a
                        href="https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.50593.naspi-indennit-mensile-di-disoccupazione.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium hover:text-amber-700"
                    >
                        Consulta la scheda ufficiale INPS
                    </a>.
                </p>
            </div>
        </div>
    );
};

export default LegalDisclaimer;
