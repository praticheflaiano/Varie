// Independent transcription of the ministerial 2026 table for the audit matrix.
// https://www.lavoro.gov.it/temi-e-priorita-rapporti-di-lavoro-e-relazioni-industriali/focus/tabella-lavoro-domestico-2026
const hourly={A:6.51,AS:6.76,B:7.01,BS:7.45,C:7.86,CS:8.30,D:9.57,DS:9.97};
const monthly={A:908.10,AS:958.55,B:983.16,BS:1053.39,C:1123.63,CS:1193.84,D:1612.20,DS:1682.42};
export const AUDIT_CONTRACTS=[
 ...Object.entries(hourly).flatMap(([level,base])=>[20,25].map(hours=>({name:`C-${level}-${hours}`,input:{level,regime:'hourly',hours,days:5},minimum:base*hours*52/12}))),
 ...Object.entries(monthly).map(([level,minimum])=>({name:`A-${level}`,input:{level,regime:'livein',hours:54,days:6,meal:true,dinner:true,room:true},minimum})),
 ...Object.entries({B:702.25,BS:737.39,C:814.60}).map(([level,minimum])=>({name:`B-${level}`,input:{level,regime:'reduced',hours:20,days:5,meal:true,dinner:true,room:true},minimum})),
 ...Object.entries({CS:8.91,DS:10.75}).map(([level,base])=>({name:`G-${level}`,input:{level,regime:'replacement',hours:20,days:5},minimum:base*20*52/12})),
 ...Object.entries({BS:1211.38,CS:1372.91,DS:1695.99}).map(([level,minimum])=>({name:`D-${level}`,input:{level,regime:'night',hours:60,days:5,nightsWeek:5,specialConfirmed:true,specialInpsHours:30,meal:true,dinner:true,room:true},minimum})),
 {name:'E-presenza',input:{level:'CS',regime:'presence',hours:66,days:6,nightsWeek:6,specialConfirmed:true,specialInpsHours:30,room:true},minimum:811.09}
];
