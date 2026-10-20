import {chromium} from "@playwright/test";
import {writeFile,mkdir} from "node:fs/promises";
const sha=process.env.GITHUB_SHA;
const url="https://rawcdn.githack.com/praticheflaiano/Varie/"+sha+"/colf-badanti-pwa/index.html";
const result={url,verified:false,checkedAt:new Date().toISOString()};
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
 if(!await page.locator("#calculator-form").count()){
  console.log("Pagina iniziale hosting: "+(await page.locator("body").innerText()).slice(0,2000));
  const button=page.getByRole("button",{name:/continue|proceed|confirm|open|continu|apri|conferma/i}).first();
  const link=page.getByRole("link",{name:/continue|proceed|confirm|open|continu|apri|conferma/i}).first();
  if(await button.count())await button.click();
  else if(await link.count())await link.click();
 }
 await page.locator('[data-testid="gross-hourly"]').waitFor({timeout:15000});
 const gross=await page.locator('[data-testid="gross-hourly"]').innerText();
 if(!gross.includes("10,33"))throw new Error("Risultato iniziale inatteso: "+gross);
 const base=await page.locator('[data-testid="ccnl-base"]').innerText();
 if(!base.includes("8,30"))throw new Error("Paga base CCNL inattesa: "+base);
 await page.locator('[name="hours"]').fill("20");await page.locator('[name="hours"]').blur();
 await page.waitForFunction(()=>document.querySelector('[data-testid="gross-hourly"]')?.textContent.includes("10,50"));
 await page.evaluate(async()=>{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error("Service worker non attivo")),12000))]);});
 await page.reload({waitUntil:"networkidle"});
 await page.context().setOffline(true);
 await page.reload({waitUntil:"domcontentloaded"});
 await page.locator('[data-testid="gross-hourly"]').waitFor({timeout:10000});
 await page.locator('[name="hours"]').fill("20");await page.locator('[name="hours"]').blur();
 await page.waitForFunction(()=>document.querySelector('[data-testid="gross-hourly"]')?.textContent.includes("10,50"));
 await page.locator('[data-help-key="field.hours"]').click();
 const help=page.locator("#context-help-popover");
 await help.waitFor({state:"visible"});
 if(!(await help.innerText()).includes("Cosa determina"))throw new Error("Guida offline non disponibile");
 await page.keyboard.press("Escape");
 await page.locator("#open-export").click();
 const dl=page.waitForEvent("download");
 await page.locator('[data-export="pdf"]').click();
 const download=await dl;
 if(await download.failure())throw new Error("PDF offline non disponibile");
 await page.locator('[data-close="export-dialog"]').click();
 await page.context().setOffline(false);
 result.verified=true;result.offline=true;result.exportPdf=true;result.tooltipsOffline=true;result.ccnlBase=base;result.title=await page.title();
 await page.screenshot({path:"pwa-test-artifacts/preview-desktop.png",fullPage:true});
 console.log("ANTEPRIMA_VERIFICATA "+url);
}catch(error){result.error=error.message;console.log("ANTEPRIMA_NON_VERIFICATA "+error.message);}
finally{await mkdir("pwa-test-artifacts",{recursive:true});await writeFile("pwa-test-artifacts/hosted-preview.json",JSON.stringify(result,null,2));await browser.close();}
