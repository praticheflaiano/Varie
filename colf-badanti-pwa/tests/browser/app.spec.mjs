import {test,expect} from "@playwright/test";
test.beforeEach(async({page})=>{await page.goto("/");});
test("calcolo iniziale, conversione a 20 ore e assenza di errori JS",async({page})=>{
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await expect(page.getByTestId("gross-hourly")).toHaveText(/10,33/);
 await page.locator('[name="hours"]').fill("20");await page.locator('[name="hours"]').blur();
 await expect(page.getByTestId("gross-hourly")).toHaveText(/10,50/);
 await expect(page.getByTestId("net-pay")).toHaveText(/866,67/);
 expect(errors).toEqual([]);
});
test("nessun risultato obsoleto dopo un errore",async({page})=>{
 await page.locator('[name="hours"]').fill("0");await page.locator('[name="hours"]').blur();
 await expect(page.getByRole("alert")).toContainText("ore");
 await expect(page.getByTestId("total-cost")).toHaveCount(0);
 await expect(page.locator("#open-export")).toBeDisabled();
});
test("esportazioni vere DOCX, XLSX, PDF, JSON",async({page})=>{
 await page.locator("#open-export").click();
 for(const ext of ["docx","xlsx","pdf","json"]){
  const event=page.waitForEvent("download");await page.locator('[data-export="'+ext+'"]').click();
  const d=await event;expect(d.suggestedFilename()).toMatch(new RegExp("\\."+ext+"$"));
  expect(await d.failure()).toBeNull();
 }
});
test("salva, riapre, confronta senza perdere dati",async({page})=>{
 await page.locator("#save-button").click();await page.locator('[data-page="archive"]').click();
 await expect(page.locator(".archive-card")).toHaveCount(1);
 await page.getByRole("button",{name:"Riapri",exact:true}).click();
 await page.locator('[data-action="compare"]').click();await page.locator('[data-page="compare"]').click();
 await expect(page.locator(".compare-table")).toContainText("10,33");
});
test("convivente usa minimo mensile e vitto/alloggio",async({page})=>{
 await page.locator('[name="regime"]').selectOption("livein");
 await expect(page.getByTestId("gross-hourly")).toBeVisible();
 await expect(page.locator('[name="hours"]')).toHaveValue("54");
 await expect(page.locator('[name="payUnit"]')).toHaveValue("month");
 await expect(page.locator('[name="meal"]')).toBeChecked();
 await page.locator('[data-detail="composition"]').click();
 await expect(page.locator("#results")).toContainText("1.193,84");
});
test("layout mobile senza overflow",async({page})=>{
 const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width+1);
});
test("PWA registra service worker e funziona offline",async({page,context})=>{
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await page.reload();await expect(page.getByTestId("gross-hourly")).toBeVisible();
 await context.setOffline(true);await page.reload();
 await expect(page.getByTestId("gross-hourly")).toHaveText(/10,33/);
 await page.locator('[name="hours"]').fill("20");await page.locator('[name="hours"]').blur();
 await expect(page.getByTestId("gross-hourly")).toHaveText(/10,50/);
 await context.setOffline(false);
});
test("stringhe importate non diventano HTML",async({page})=>{
 const content=JSON.stringify({application:"flaiano-domestico",schema:1,rulesYear:2026,input:{scenario:'<img src=x onerror=alert(1)>',employer:'<script>alert(1)</script>'}});
 await page.locator("#import-file").setInputFiles({name:"test.json",mimeType:"application/json",buffer:Buffer.from(content)});
 await page.locator("#save-button").click();await page.locator('[data-page="archive"]').click();
 await expect(page.locator(".archive-card img")).toHaveCount(0);
 await expect(page.locator(".archive-card h2")).toContainText("<img");
});
