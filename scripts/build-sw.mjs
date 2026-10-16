import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files=(await readdir('dist',{recursive:true,withFileTypes:true})).filter(f=>f.isFile()&&f.name!=='sw.js').map(f=>`${f.parentPath||f.path}/${f.name}`.replaceAll('\\','/'));
const hash=createHash('sha256');for(const file of files.sort())hash.update(await readFile(file));
const assets=files.map(f=>'/'+f.replace(/^dist\//,''));
const source=`const CACHE='daylight-${hash.digest('hex').slice(0,12)}';
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('daylight-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 // Never intercept Supabase authentication, private data, or other external requests.
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html')));return;
 }
 if(ASSETS.includes(url.pathname))event.respondWith(caches.match(event.request,{ignoreVary:true}).then(hit=>hit||fetch(event.request)));
});
`;
await writeFile('dist/sw.js',source);console.log(`Offline shell prepared: ${assets.length} files`);
