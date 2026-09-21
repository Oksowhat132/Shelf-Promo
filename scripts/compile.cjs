const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage();
  page.on('pageerror', e=>console.error(e));
  await page.goto('http://localhost:3000/compile.html');
  const result=await page.evaluate(()=>window.buildTarget());
  fs.writeFileSync('public/target.mind',Buffer.from(result.mind));
  console.log('Target compiled:',result.mind.length,'bytes');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
