const { chromium } = require('playwright');
const fs = require('fs');
const F = __dirname + '/fonts/node_modules/@fontsource/';
const font = (fam, file, w) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}') format('woff2')}`;
const css = [
  font('Brico', 'bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2', 800),
  font('Inter', 'inter/files/inter-latin-500-normal.woff2', 500),
  font('Inter', 'inter/files/inter-latin-700-normal.woff2', 700),
].join('\n');
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.setContent(`<html><head><style>${css}
  body{margin:0;width:1080px;height:1350px;background:#F1EEFF;color:#14142B;font-family:Inter;position:relative;overflow:hidden}
  .b1{position:absolute;right:-140px;top:-120px;width:420px;height:420px;border-radius:100px;background:#D4FF4F;transform:rotate(-12deg)}
  .b2{position:absolute;left:-120px;bottom:-160px;width:460px;height:460px;border-radius:110px;background:#5B3DF5;transform:rotate(14deg)}
  .pill{position:absolute;left:72px;top:76px;background:#14142B;color:#fff;font-weight:700;font-size:30px;padding:14px 26px;border-radius:999px}
  h1{position:absolute;left:72px;top:176px;width:880px;margin:0;font-family:Brico;font-weight:800;font-size:104px;line-height:.98;letter-spacing:-3px}
  h1 em{font-style:normal;color:#5B3DF5}
  ul{position:absolute;left:72px;top:${d.listTop||640}px;width:936px;margin:0;padding:0;list-style:none;display:grid;gap:18px}
  li{background:#fff;border-radius:26px;padding:22px 28px;font-size:34px;font-weight:500;line-height:1.25;display:flex;gap:18px;align-items:flex-start;box-shadow:0 2px 0 rgba(20,20,43,.08)}
  li b{font-weight:700}
  li i{flex:none;width:44px;height:44px;border-radius:14px;background:#D4FF4F;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:28px}
  .dead{position:absolute;right:64px;top:${d.deadTop||520}px;background:#FF5C8A;color:#fff;font-weight:700;font-size:34px;padding:16px 26px;border-radius:20px;transform:rotate(4deg)}
  .brand{position:absolute;right:72px;bottom:60px;background:#fff;padding:18px 26px 18px 18px;border-radius:28px;display:flex;align-items:center;gap:18px;font-weight:700;font-size:32px;text-align:left}
  .g{width:72px;height:72px;border-radius:20px;background:#5B3DF5;color:#D4FF4F;font-family:Brico;font-weight:800;font-size:42px;display:grid;place-items:center}
  .sub{font-weight:500;opacity:.75;font-size:25px}
  </style></head><body><div class="b1"></div><div class="b2"></div>
  <span class="pill">${d.pill}</span>
  <h1>${d.title}</h1>
  <span class="dead">${d.dead}</span>
  <ul>${d.items.map(x=>`<li><i>✓</i><span>${x}</span></li>`).join('')}</ul>
  <div class="brand"><span class="g">F</span><span>Pratiche Flaiano<br><span class="sub">CAF UNSIC e Patronato ENASC · Vigne Nuove, Roma</span></span></div>
  </body></html>`);
  await p.waitForTimeout(200);
  await p.screenshot({ path: d.out, type: 'jpeg', quality: 90 });
  await b.close();
})();
