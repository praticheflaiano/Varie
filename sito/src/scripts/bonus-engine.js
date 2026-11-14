// Motore "Cosa ti spetta": filtra le misure di src/data/bonus.json in base alle risposte.
// Nessun accesso a rete, storage o DOM: funzioni pure, provate anche con node.

export var FASCE_ISEE = {
  nonso: null,
  f1: [0, 6500],
  f2: [6500, 9796],
  f3: [9796, 10140],
  f4: [10140, 15000],
  f5: [15000, 20668],
  f6: [20668, 28340],
  f7: [28340, 40000],
  f8: [40000, 46583],
  f9: [46583, Infinity]
};
export var FASCE_ETA = {
  e18: [18, 29], e30: [30, 59], e60: [60, 64], e65: [65, 69], e70: [70, 74], e75: [75, 79], e80: [80, 120]
};
var RANK = { italia: 1, lazio: 2, roma: 3 };
export var URGENZA_GIORNI = 60;

// "oggi" come giorno di calendario locale, senza ore
export function giorniA(dataIso, oggi) {
  var p = String(dataIso).split('-');
  var a = Date.UTC(+p[0], +p[1] - 1, +p[2]);
  var b = Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  return Math.round((a - b) / 86400000);
}

function toSet(lista) {
  var s = {};
  (lista || []).forEach(function (f) { s[f] = true; });
  return s;
}
function espandiFigli(lista) {
  var s = {};
  (lista || []).forEach(function (f) { s[f] = true; });
  if (s.nato_2026_entro_120gg) s.sotto_3 = true;
  if (s.sotto_3) s.minorenni = true;
  return s;
}
function espandiDisab(lista) {
  var s = {};
  (lista || []).forEach(function (f) { s[f] = true; });
  if (s.invalidita_100) { s.invalidita_74 = true; }
  if (s.invalidita_74) { s.invalidita_67 = true; }
  return s;
}
function haUno(set, arr) {
  for (var i = 0; i < arr.length; i++) if (set[arr[i]]) return true;
  return false;
}
function qualcuno(set) { for (var k in set) if (set[k]) return true; return false; }

// Valuta una misura: ritorna null (non mostrare) oppure { dubbi: [...] }
export function valuta(m, a) {
  var r = m.requisiti || {};
  var dubbi = [];
  var figli = espandiFigli(a.figli);
  var nFigli = a.figli && a.figli.length ? (a.nFigli || 1) : 0;
  var disab = espandiDisab(a.disabilita);
  var eta = FASCE_ETA[a.eta];

  // residenza
  if (r.residenza && RANK[a.residenza] < RANK[r.residenza]) return null;

  // ISEE
  var soglia = r.isee_max;
  if (soglia != null && nFigli >= 4 && r.isee_max_con_4_figli != null) soglia = r.isee_max_con_4_figli;
  if (soglia != null) {
    var fa = FASCE_ISEE[a.isee];
    if (!fa) dubbi.push('isee_nonso');
    else if (fa[0] >= soglia) return null;
    else if (fa[1] > soglia) dubbi.push('isee');
  }

  // eta
  var etaOk = true;
  if (r.eta && eta) {
    if (r.eta.min != null) {
      if (eta[1] < r.eta.min) etaOk = false;
      else if (eta[0] < r.eta.min) dubbi.push('eta');
    }
    if (r.eta.max != null) {
      if (eta[0] > r.eta.max) etaOk = false;
      else if (eta[1] > r.eta.max) dubbi.push('eta');
    }
  }
  if (!etaOk) {
    if (r.eta_o_figli_sotto3 && figli.sotto_3) {
      // percorso "bambino sotto 3 anni": qui conta l'ISEE
      var fb = FASCE_ISEE[a.isee];
      if (r.isee_max_percorso_figli != null) {
        if (!fb) dubbi.push('isee_nonso');
        else if (fb[0] >= r.isee_max_percorso_figli) return null;
        else if (fb[1] > r.isee_max_percorso_figli) dubbi.push('isee');
      }
    } else return null;
  }

  // lavoro
  if (r.lavoro && r.lavoro.length && r.lavoro.indexOf(a.lavoro) < 0) return null;

  // disabilita (O dentro l'elenco)
  if (r.disabilita && r.disabilita.length && !haUno(disab, r.disabilita)) return null;

  // casa / utenze
  if (r.casa && r.casa.length && !haUno(toSet(a.casa), r.casa)) return null;

  // universitario: chi risponde e' studente oppure c'e' un figlio universitario
  // (il lavoratore dipendente che studia lui stesso, per EBIT, non e' coperto dalle 7 domande)
  if (r.universitario) {
    var uni = !!figli.universitario_fino_30 || a.lavoro === 'studente';
    if (!uni) return null;
  }

  // figli
  if (r.figli && r.figli.richiede_uno_tra && r.figli.richiede_uno_tra.length) {
    var ok = haUno(figli, r.figli.richiede_uno_tra);
    if (!ok && r.figli.o_disabilita_o_over60) {
      if (qualcuno(disab) || (eta && eta[0] >= 60)) ok = true;
      else dubbi.push('figli_altro');
    } else if (!ok) return null;
    if (ok && r.figli.min_numero && nFigli < r.figli.min_numero) return null;
    if (ok && r.figli.nota && r.figli.min_numero && !figli.sotto_3 && !r.figli.o_disabilita_o_over60) dubbi.push('figli_eta');
  }

  // requisiti che il test non puo' verificare
  if (r.altro_requisiti || (r.eta && r.eta.nota && r.eta.min == null && r.eta.max == null) || r.reddito_max_personale || r.esclusi_se || m.nota_motore) {
    if (m.stato !== 'finestra_chiusa') dubbi.push('altro');
  }
  return { dubbi: dubbi };
}

// Ritorna { urgenti, probabili, dipende, riapre, nonsoIsee }; ogni voce { m, dubbi, giorni, stato }
export function trova(misure, a, oggi) {
  var out = { urgenti: [], probabili: [], dipende: [], riapre: [], nonsoIsee: a.isee === 'nonso' };
  misure.forEach(function (m) {
    var giorni = null;
    if (m.scadenza && m.scadenza.data) {
      giorni = giorniA(m.scadenza.data, oggi);
      if (giorni < 0) return; // scaduta: non si mostra
    }
    var v = valuta(m, a);
    if (!v) return;
    var item = { m: m, dubbi: v.dubbi, giorni: giorni, stato: v.dubbi.length ? 'dipende' : 'probabile' };
    if (m.stato === 'finestra_chiusa') { out.riapre.push(item); return; }
    if (giorni !== null && giorni <= URGENZA_GIORNI) out.urgenti.push(item);
    else if (item.stato === 'probabile') out.probabili.push(item);
    else out.dipende.push(item);
  });
  function ord(x, y) {
    var gx = x.giorni === null ? 1e9 : x.giorni, gy = y.giorni === null ? 1e9 : y.giorni;
    if (gx !== gy) return gx - gy;
    return 0;
  }
  ['urgenti', 'probabili', 'dipende', 'riapre'].forEach(function (k) { out[k].sort(ord); });
  return out;
}

export var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
export function dataLunga(iso) {
  var p = iso.split('-');
  return +p[2] + ' ' + MESI[+p[1] - 1] + ' ' + p[0];
}
export function testoGiorni(g) {
  if (g === 0) return 'scade oggi';
  if (g === 1) return 'scade domani';
  return 'mancano ' + g + ' giorni';
}
