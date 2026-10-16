import {test,expect} from '@playwright/test';
test('settings show login in the deployed build and report authentication errors',async({page})=>{
 await page.route('**/auth/v1/token**',route=>route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({code:'invalid_credentials',message:'Invalid login credentials'})}));
 await page.goto('/');
 await page.locator('.account').click();
 await expect(page.getByRole('button',{name:'登录并同步'})).toBeVisible();
 await expect(page.getByText('云端服务尚未连接。',{exact:false})).toHaveCount(0);
 await page.getByRole('textbox',{name:'邮箱',exact:true}).fill('test@example.com');
 await page.getByLabel('密码',{exact:true}).fill('test-password');
 await page.getByRole('button',{name:'登录并同步'}).click();
 await expect(page.getByRole('status')).toContainText('登录失败');
});
test('personal records persist and remain isolated by date',async({page})=>{
 await page.goto('/');
 await page.getByRole('textbox',{name:'新任务'}).fill('练习英语二十分钟');
 await page.getByRole('button',{name:'添加',exact:true}).click();
 await page.getByRole('button',{name:'完成 练习英语二十分钟',exact:true}).click();
 await page.getByRole('button',{name:'学一点英语',exact:false}).click();
 await page.getByRole('button',{name:'开心',exact:true}).click();
 await page.locator('textarea').fill('今天开始认真记录生活。');
 await page.getByRole('button',{name:'保存日记'}).click();
 await page.reload();
 await expect(page.locator('textarea')).toHaveValue('今天开始认真记录生活。');
 await expect(page.getByRole('button',{name:'取消完成 练习英语二十分钟'})).toBeVisible();
 await expect(page.getByRole('button',{name:'学一点英语',exact:false})).toContainText('今天已完成');
 await page.getByRole('button',{name:'记账本',exact:false}).click();
 await page.getByRole('spinbutton',{name:'金额'}).fill('28.50');
 await page.getByRole('textbox',{name:'备注'}).fill('午餐');
 await page.getByRole('button',{name:'记一笔'}).click();
 await expect(page.locator('.transaction')).toContainText('28.50');
 await page.locator('#date').fill('2025-01-01');
 await expect(page.locator('.transaction')).toHaveCount(0);
 await page.getByRole('button',{name:'日历回顾',exact:false}).click();
 await expect(page.locator('.calendar button')).toHaveCount(31);
});
test('mobile layout fits and user text is escaped',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByRole('textbox',{name:'新任务'}).fill('<img src=x onerror=alert(1)>');
 await page.getByRole('button',{name:'添加',exact:true}).click();
 await expect(page.locator('.task')).toContainText('<img');
 await expect(page.locator('.task img')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('themes persist without losing a diary draft or existing records',async({page})=>{
 await page.goto('/');
 await page.getByRole('textbox',{name:'新任务'}).fill('保留我的记录');
 await page.getByRole('button',{name:'添加',exact:true}).click();
 await page.locator('textarea').fill('换主题时也不要丢掉这段草稿');
 await page.getByLabel('外观主题').selectOption('star');
 await expect(page.locator('html')).toHaveAttribute('data-theme','star');
 await expect(page.locator('textarea')).toHaveValue('换主题时也不要丢掉这段草稿');
 await page.getByRole('button',{name:'保存日记'}).click();
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','star');
 await expect(page.locator('.task')).toContainText('保留我的记录');
 await expect(page.locator('textarea')).toHaveValue('换主题时也不要丢掉这段草稿');
 await page.locator('.account').click();
 await page.getByRole('button',{name:'蝴蝶结小猫',exact:false}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','kitty');
 await page.getByRole('button',{name:'添加到手机或电脑'}).click();
 await expect(page.locator('#install-help')).toBeVisible();
 await expect(page.locator('#install-help')).toContainText('Safari');
});
test('both themes fit small phones and keep settings reachable',async({page})=>{
 await page.setViewportSize({width:320,height:667});await page.goto('/');
 for(const theme of ['kitty','star']){
  await page.getByLabel('外观主题').selectOption(theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.account').click();
  await expect(page.getByRole('button',{name:'添加到手机或电脑'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
test('installed shell opens saved records offline and supplies iPhone icons',async({page,context,request})=>{
 test.skip(process.env.TEST_PRODUCTION!=='1','Service worker is enabled only in production.');
 await page.goto('/');
 await page.getByRole('textbox',{name:'新任务'}).fill('离线也能看见');
 await page.getByRole('button',{name:'添加',exact:true}).click();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 const icon=await request.get('/apple-touch-icon.png');expect(icon.status()).toBe(200);expect(icon.headers()['content-type']).toContain('image/png');
 const manifest=await (await request.get('/manifest.webmanifest')).json();expect(manifest.display).toBe('standalone');expect(manifest.icons.some(i=>i.sizes==='512x512')).toBe(true);
 await context.setOffline(true);await page.reload();
 await expect(page.locator('.task')).toContainText('离线也能看见');
 await page.getByLabel('外观主题').selectOption('star');
 await expect(page.locator('html')).toHaveAttribute('data-theme','star');
 const cached=await page.evaluate(async()=>{const paths=[];for(const name of await caches.keys())for(const r of await (await caches.open(name)).keys())paths.push(new URL(r.url).origin);return paths.every(o=>o===location.origin)});
 expect(cached).toBe(true);
});
test('offline edits by a signed-in user survive reopening and can be uploaded',async({page,context})=>{
 test.skip(process.env.TEST_PRODUCTION!=='1','Requires the production offline shell.');
 const userId='11111111-1111-4111-8111-111111111111';
 await page.addInitScript(({userId})=>{
  const authKey='sb-gnchomdjicbcjwnsluvq-auth-token';
  if(!localStorage.getItem(authKey)){
   const exp=Math.floor(Date.now()/1000)+86400;
   const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:userId,exp}))+'.mock';
   localStorage.setItem(authKey,JSON.stringify({access_token:token,refresh_token:'mock',token_type:'bearer',expires_at:exp,user:{id:userId,email:'test@example.com',aud:'authenticated'}}));
  }
 },{userId});
 const payload={tasks:[],habits:[],journals:{},checks:{},expenses:[]};let uploaded;
 await page.route('**/rest/v1/life_records**',route=>{
  if(route.request().method()==='POST'){uploaded=route.request().postDataJSON();return route.fulfill({status:201,body:''});}
  return route.fulfill({contentType:'application/json',body:JSON.stringify({payload})});
 });
 await page.goto('/');await expect(page.locator('#sync-state')).toHaveText('已同步');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
 await context.setOffline(true);
 await page.getByRole('textbox',{name:'新任务'}).fill('断网时的新记录');await page.getByRole('button',{name:'添加',exact:true}).click();
 await expect(page.locator('#sync-state')).toContainText('待同步');
 await page.reload();await expect(page.locator('.task')).toContainText('断网时的新记录');
 await context.setOffline(false);await page.locator('.account').click();
 await expect(page.getByRole('button',{name:'上传本机记录'})).toBeVisible();
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'上传本机记录'}).click();
 await expect(page.locator('#sync-state')).toHaveText('已同步');
 expect(uploaded.payload.tasks[0].text).toBe('断网时的新记录');
 expect(await page.evaluate(()=>localStorage.getItem('daylight-v1-pending'))).toBeNull();
});
