import {chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const page=await browser.newPage();const svg=await readFile('public/icon.svg','utf8');
for(const [size,name] of [[180,'apple-touch-icon'],[192,'app-192'],[512,'app-512']]){
 await page.setViewportSize({width:size,height:size});await page.setContent(`<style>body{margin:0}svg{width:100vw;height:100vh;display:block}</style>${svg}`);await page.screenshot({path:`public/${name}.png`});
}
await browser.close();
