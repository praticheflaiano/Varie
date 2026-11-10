/**
 * Recensioni lasciate dai clienti sulla scheda Google dell'ufficio, trascritte così come sono
 * (controllo del 10/11/2026: 5,0 su 299 recensioni). Nome e iniziale del cognome, per riservatezza.
 * Chiunque può verificarle aprendo REVIEWS_URL. Non aggiungere recensioni che non siano su Google.
 * Niente dati strutturati "Review"/"AggregateRating": Google non li ammette per le recensioni
 * pubblicate dall'attività su se stessa.
 */
export const REVIEWS_URL =
  "https://www.google.com/maps/place/Caf+-+Patronato+-+servizi+Centro+Pratiche+Flaiano/@41.959997,12.5400172,17z/data=!4m8!3m7!1s0x46d04e715f296db7:0xc820722ea75f368b!8m2!3d41.959997!4d12.5400172!9m1!1b1!16s%2Fg%2F11sjdrkl3h";

export const RECENSIONI: { nome: string; testo: string }[] = [
  { nome: "Silvia P.", testo: "Consiglio assolutamente questo CAF. Mi hanno assistito per il 730 con grandissima professionalità. Un ringraziamento speciale alla ragazza che ha seguito la mia pratica: estremamente gentile e preparata. Sicuramente tornerò anche il prossimo anno." },
  { nome: "Giordano L.", testo: "Questo CAF segue mia mamma da anni e così ha aiutato me a richiedere e produrre documentazione di vario genere per me e per lei. Mi hanno seguito tre persone diverse nel corso del tempo e tutte e tre sono state sempre gentili, competenti e puntuali anche aiutandomi oltre le aspettative." },
  { nome: "Miriam E.", testo: "CAF a 5 stelle per professionalità, gentilezza e disponibilità. Lo staff si distingue per cortesia e attenzione alle esigenze del cliente, offrendo un supporto chiaro e puntuale. Un punto di riferimento affidabile, dove sentirsi seguiti con competenza e rispetto." },
  { nome: "Eleonora D. F.", testo: "Velocissimi, sistema di prenotazione eccellente, super efficienti. Grazie!" },
  { nome: "Rodolfo P.", testo: "Addetti professionali e simpatici dotati di estrema pazienza per chi come me non ha nessuna competenza in materia. Ottimo servizio." },
  { nome: "Stefania M.", testo: "senza l’aiuto, il supporto e la professionalità di Antonio e dei suoi colleghi non avrei saputo come fare…. Mille grazie a tutti per la vostra competenza e disponibilità." },
  { nome: "Rossana R.", testo: "Personale gentile e molto professionale, veramente bravi." },
  { nome: "Antonio R.", testo: "Capaci Professionali Risolutivi lo consiglio. Antonio molto disponibile Flavia Top Priscilla molto brava" },
  { nome: "Melissa", testo: "Molto bravi e disponibili. Consiglio" },
];
