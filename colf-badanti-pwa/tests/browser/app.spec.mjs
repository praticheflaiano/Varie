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
 await expect(page.getByTestId("ccnl-base")).toHaveText(/8,30/);
 await page.locator('[data-help-key="field.hours"]').click();
 await expect(page.locator("#context-help-popover")).toContainText("Cosa determina");
 await context.setOffline(false);
});
test("stringhe importate non diventano HTML",async({page})=>{
 const content=JSON.stringify({application:"flaiano-domestico",schema:1,rulesYear:2026,input:{scenario:'<img src=x onerror=alert(1)>',employer:'<script>alert(1)</script>'}});
 await page.locator("#import-file").setInputFiles({name:"test.json",mimeType:"application/json",buffer:Buffer.from(content)});
 await page.locator("#save-button").click();await page.locator('[data-page="archive"]').click();
 await expect(page.locator(".archive-card img")).toHaveCount(0);
 await expect(page.locator(".archive-card h2")).toContainText("<img");
});

test("tutti i campi hanno una guida e mantengono un nome accessibile",async({page})=>{
 const fields=await page.locator("#calculator-form").evaluate(form=>[...form.querySelectorAll("input[name],select[name],textarea[name]")].map(input=>({
  name:input.name,hidden:input.type==="hidden",label:input.labels?.[0]?.textContent.trim()||"",
  helpers:form.querySelectorAll('.help-trigger[data-help-key="field.'+input.name+'"]').length
 })));
 expect(fields.length).toBe(66);
 expect(fields.filter(f=>f.helpers!==1)).toEqual([]);
 expect(fields.filter(f=>!f.hidden&&!f.label)).toEqual([]);
 await expect(page.locator("label .help-trigger")).toHaveCount(0);
 for(const tab of ["payslip","employer","contributions","composition"]){
  await page.locator('[data-detail="'+tab+'"]').click();
  const missing=await page.locator("#results .data-table td:first-child").evaluateAll(cells=>cells.filter(c=>!c.querySelector(".help-trigger")).map(c=>c.textContent));
  expect(missing).toEqual([]);
 }
});
test("guida con tastiera, chiusura e spiegazione collegata al campo",async({page})=>{
 const trigger=page.locator('[data-help-key="field.hours"]'),panel=page.locator("#context-help-popover");
 await trigger.scrollIntoViewIfNeeded();await trigger.focus();
 await expect(panel).toBeVisible();
 await expect(panel).toContainText("Che cos’è");await expect(panel).toContainText("Quando indicarlo");
 await expect(panel).toContainText("Cosa determina");await expect(panel).toContainText("oltre 24 ore");
 await page.keyboard.press("Enter");
 await expect(page.getByRole("button",{name:"Chiudi spiegazione"})).toBeFocused();
 await page.keyboard.press("Escape");
 await expect(panel).toBeHidden();await expect(trigger).toBeFocused();
 await expect(trigger).toHaveAttribute("aria-expanded","false");
 await page.waitForTimeout(250);await expect(panel).toBeHidden();
 await page.keyboard.press("Tab");await expect(page.locator('[name="hours"]')).toBeFocused();
 await page.locator('[data-mode="gross"]').click();
 await page.locator('[data-help-key="field.pay"]').click();
 await expect(panel).toContainText("Lordo ordinario concordato");
 await expect(panel).toContainText("prima delle trattenute");
});
test("aiuto delle spunte e dei risultati non modifica i dati",async({page})=>{
 const checkbox=page.locator('[name="multiple"]'),help=page.locator('[data-help-key="field.multiple"]');
 await page.locator("details").evaluateAll(nodes=>nodes.forEach(d=>d.open=true));
 const before=await page.getByTestId("total-cost").innerText();
 await expect(checkbox).not.toBeChecked();await help.click();
 await expect(page.locator("#context-help-popover")).toContainText(/più persone/i);
 await expect(checkbox).not.toBeChecked();
 await page.getByRole("button",{name:"Chiudi spiegazione"}).click();
 await page.locator('[data-help-key="result.totalCost"]').click();
 await expect(page.locator("#context-help-popover")).toContainText("Come si determina");
 await expect(page.getByTestId("total-cost")).toHaveText(before);
 await page.locator(".page-intro h1").click();
 await expect(page.locator("#context-help-popover")).toBeHidden();
});
test("guide leggibili nel viewport e nel dialogo di esportazione",async({page})=>{
 const trigger=page.locator('[data-help-key="field.hours"]');
 await trigger.click();
 const panel=page.locator("#context-help-popover");
 const bounds=await panel.evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight,scroll:n.scrollWidth,width:n.clientWidth};});
 expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.y).toBeGreaterThanOrEqual(0);
 expect(bounds.right).toBeLessThanOrEqual(bounds.w+1);expect(bounds.bottom).toBeLessThanOrEqual(bounds.h+1);
 expect(bounds.scroll).toBeLessThanOrEqual(bounds.width+1);
 await page.keyboard.press("Escape");await page.locator("#open-export").click();
 await page.locator('[data-help-key="export.xlsx"]').click();
 await expect(page.locator("#export-dialog #context-help-popover")).toBeVisible();
 await expect(panel).toContainText("foglio di calcolo");
 await page.keyboard.press("Escape");await expect(panel).toBeHidden();
 await expect(page.locator("#export-dialog")).toBeVisible();
 await page.locator('[data-close="export-dialog"]').click();
 await expect(page.locator("#export-dialog")).toBeHidden();
});
test("paga base CCNL distinta dall'accordo e coerente per ogni regime",async({page})=>{
 const base=page.getByTestId("ccnl-base");
 await expect(base).toHaveText(/8,30.*\/ora/);
 await expect(page.getByTestId("gross-hourly")).toHaveText(/10,33/);
 await page.locator('[name="contract"]').selectOption("fixed");await expect(base).toHaveText(/8,30/);
 await page.locator('[name="level"]').selectOption("A");await expect(base).toHaveText(/6,51/);
 await page.locator('[name="regime"]').selectOption("livein");await expect(base).toHaveText(/908,10.*\/mese/);
 await page.locator('[name="level"]').selectOption("DS");await expect(base).toHaveText(/1.682,42/);
 await expect(page.locator("#contract-base-summary")).toContainText("1.474,73");await expect(page.locator("#contract-base-summary")).toContainText("207,69");
 await page.locator('[name="regime"]').selectOption("reduced");await expect(base).toHaveText(/737,39/);
 await page.locator('[name="regime"]').selectOption("night");await expect(base).toHaveText(/1.211,38/);
 await page.locator('[name="regime"]').selectOption("presence");await expect(base).toHaveText(/811,09/);
 await page.locator('[name="regime"]').selectOption("replacement");await expect(base).toHaveText(/8,91.*\/ora/);
 await page.locator('[data-page="levels"]').click();
 await expect(page.locator(".minimum-table tbody tr")).toHaveCount(8);
 await expect(page.locator('.minimum-table [data-help-minimum="DS.night"]')).toContainText("1.695,99");
 await expect(page.locator('.minimum-table [data-help-minimum="DS.replacement"]')).toContainText("10,75");
 await expect(page.locator(".presence-minimum")).toContainText("811,09");
 await expect(page.locator("#minimum-reference-table")).toContainText("Non prevista");
 await page.locator('[data-help-key="minimum.DS.livein"]').first().click();
 await expect(page.locator("#context-help-popover")).toContainText("non sommarla due volte");
});

test("trimestre da presenze con confronto avviso e trattenute",async({page})=>{
 await page.locator('[data-page="quarter"]').click();await page.locator("#q-copy").click();
 await expect(page.getByTestId("quarter-total")).toHaveCount(0);
 await page.locator("#q-fill").click();await page.locator("#q-confirmed").check();
 await expect(page.getByTestId("quarter-total")).toHaveText(/422,50/);
 await page.locator("#q-officialInps").fill("403");await page.locator("#q-officialCassa").fill("19.5");await page.locator("#q-withheldInps").fill("100.74");
 await expect(page.locator("#q-results")).toContainText("Importi coincidenti");
 await expect(page.locator("#q-results tr").filter({hasText:"Saldo INPS lavoratore"})).toContainText("0,01");
 await page.locator("#q-officialCassa").fill("19.49");await expect(page.locator("#q-results")).toContainText("Scostamento");
 await page.locator('[data-week="0"][data-column="inpsHours"]').fill("");
 await expect(page.getByTestId("quarter-total")).toHaveCount(0);
 await expect(page.locator('[data-quarter-export="xlsx"]')).toBeDisabled();
});
test("esportazioni trimestrali modificabili e file riapribile",async({page})=>{
 await page.locator('[data-page="quarter"]').click();await page.locator("#q-copy").click();await page.locator("#q-fill").click();await page.locator("#q-confirmed").check();
 let jsonDownload;
 for(const type of ["docx","xlsx","pdf","json"]){
  const event=page.waitForEvent("download");await page.locator('[data-quarter-export="'+type+'"]').click();const file=await event;
  expect(file.suggestedFilename()).toMatch(new RegExp("\\."+type+"$"));expect(await file.failure()).toBeNull();
  if(type==="json")jsonDownload=file;
 }
 await page.locator("#q-file").setInputFiles(await jsonDownload.path());
 await expect(page.locator("#q-confirmed")).not.toBeChecked();
 await page.locator("#q-confirmed").check();await expect(page.getByTestId("quarter-total")).toHaveText(/422,50/);
 await page.locator('[data-help-key="quarter.hours"]').first().click();
 await expect(page.locator("#context-help-popover")).toContainText("una sola volta");
});
test("trimestre disponibile offline e senza overflow della pagina",async({page,context})=>{
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();
 await context.setOffline(true);await page.reload();
 await page.locator('[data-page="quarter"]').click();await page.locator("#q-copy").click();await page.locator("#q-fill").click();await page.locator("#q-confirmed").check();
 await expect(page.getByTestId("quarter-total")).toHaveText(/422,50/);
 const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));expect(size.scroll).toBeLessThanOrEqual(size.width+1);
 await context.setOffline(false);
});

test("cedolino mensilizzato: contributi effettivi e base TFR parziale verificata",async({page})=>{
 await page.locator('[name="regime"]').selectOption("livein");
 await page.locator('[data-mode="net"]').click();await page.locator('[name="pay"]').fill("1200");
 await page.locator('[name="monthMode"]').selectOption("actual");
 await expect(page.getByTestId("total-cost")).toHaveCount(0);
 await page.locator('[name="actualInpsHours"]').fill("270");await page.locator('[name="actualCassaHours"]').fill("270");
 await page.locator('[name="actualContributionsConfirmed"]').check();
 await expect(page.getByTestId("net-pay")).toHaveText(/1.200,00/);
 await page.locator('[name="monthlyFraction"]').fill("0.5");await page.locator('[name="monthlyFraction"]').blur();
 await expect(page.getByTestId("total-cost")).toHaveCount(0);
 await page.locator('[name="actualInpsHours"]').fill("135");await page.locator('[name="actualCassaHours"]').fill("135");await page.locator('[name="actualContributionsConfirmed"]').check();
 await page.locator('[name="useTfrVerifiedBase"]').check();await page.locator('[name="tfrVerifiedBase"]').fill("700");await page.locator('[name="tfrVerifiedBase"]').blur();
 await expect(page.getByTestId("net-pay")).toHaveText(/600,00/);
 await expect(page.locator("#results .accruals")).toContainText("51,85");
});
