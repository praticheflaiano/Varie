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
 await page.locator('[name="hours"]').fill("20");await page.locator('[name="hours"]').blur();
 await page.waitForFunction(()=>document.querySelector('[data-testid="gross-hourly"]')?.textContent.includes("10,50"));
 result.verified=true;result.title=await page.title();
 await page.screenshot({path:"pwa-test-artifacts/preview-desktop.png",fullPage:true});
 console.log("ANTEPRIMA_VERIFICATA "+url);
}catch(error){result.error=error.message;console.log("ANTEPRIMA_NON_VERIFICATA "+error.message);}
finally{await mkdir("pwa-test-artifacts",{recursive:true});await writeFile("pwa-test-artifacts/hosted-preview.json",JSON.stringify(result,null,2));await browser.close();}
