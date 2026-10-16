import {test,expect} from '@playwright/test';
const nav=(page,name)=>page.getByRole('navigation',{name:'主要导航'}).getByRole('button',{name,exact:false});
const record=async(page,name)=>{await nav(page,'快速记录').click();await page.getByRole('button',{name,exact:false}).click();};
const waitWorker=page=>page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
const base={tasks:[],habits:[],journals:{},checks:{},expenses:[]};
const userId='11111111-1111-4111-8111-111111111111';
async function mockUser(page,payload=base){let uploaded;await page.addInitScript(({userId})=>{const key='sb-gnchomdjicbcjwnsluvq-auth-token';if(!localStorage.getItem(key)){const exp=Math.floor(Date.now()/1000)+86400,token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:userId,exp}))+'.mock';localStorage.setItem(key,JSON.stringify({access_token:token,refresh_token:'mock',token_type:'bearer',expires_at:exp,user:{id:userId,email:'test@example.com',aud:'authenticated'}}));}},{userId});await page.route('**/rest/v1/life_records**',route=>{if(route.request().method()==='POST'){uploaded=route.request().postDataJSON();return route.fulfill({status:201,body:''});}return route.fulfill({contentType:'application/json',body:JSON.stringify({payload})});});return ()=>uploaded;}

test('five destinations and legacy records survive the upgrade',async({page})=>{
 const legacy={...base,tasks:[{id:'old-task',text:'旧版待办',date:'2026-10-16',done:false}],habits:[{id:'english',name:'学一点英语',icon:'Aa'}],journals:{'2026-10-16':{text:'以前写的日记',mood:3}},expenses:[{id:'old-money',date:'2026-10-16',type:'expense',amount:12.5,category:'餐饮',note:'午餐'}]};
 await page.addInitScript(x=>{if(!localStorage.getItem('daylight-v1'))localStorage.setItem('daylight-v1',JSON.stringify(x));},legacy);
 await page.goto('/');await page.locator('#date').fill('2026-10-16');await expect(page.locator('nav button')).toHaveCount(5);await expect(page.locator('.task')).toContainText('旧版待办');await expect(page.locator('.diary-snippet')).toContainText('以前写的日记');
 await nav(page,'回顾').click();await page.getByRole('button',{name:'收支报表',exact:true}).click();await expect(page.locator('.transaction')).toContainText('12.50');
 await nav(page,'今天').click();await page.getByRole('textbox',{name:'新任务'}).fill('新版本待办');await page.getByRole('button',{name:'添加',exact:true}).click();await page.reload();await expect(page.locator('.task')).toHaveCount(2);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('daylight-v1')).version)).toBe(2);
});

test('cloud login errors are shown without asking for public signup',async({page})=>{
 await page.route('**/auth/v1/token**',r=>r.fulfill({status:400,contentType:'application/json',body:JSON.stringify({code:'invalid_credentials',message:'Invalid login credentials'})}));await page.goto('/');await nav(page,'我的').click();await page.getByLabel('邮箱',{exact:true}).fill('test@example.com');await page.getByLabel('密码',{exact:true}).fill('test-password');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'登录并同步'}).click();await expect(page.locator('#notice')).toContainText('登录失败');
});

test('today saves tasks, mood, water, weight, sleep and a meal by date',async({page})=>{
 await page.goto('/');await page.getByLabel('新任务').fill('英语二十分钟');await page.getByRole('button',{name:'添加',exact:true}).click();await page.getByRole('button',{name:'完成 英语二十分钟',exact:true}).click();await page.getByRole('button',{name:'学一点英语',exact:false}).click();await page.getByRole('button',{name:'开心',exact:true}).click();await page.getByRole('button',{name:'＋200 ml',exact:true}).click();
 for(const [kind,value] of [['weight','55.2'],['sleep','7.5']]){await page.locator(`[data-record="${kind}"]`).click();await page.getByRole('dialog').getByRole('spinbutton').fill(value);await page.getByRole('button',{name:'保存记录',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();}
 await page.locator('[data-record="meal"][data-slot="早餐"]').click();await page.getByLabel('吃了什么').fill('鸡蛋和牛奶');await page.getByRole('button',{name:'保存记录',exact:true}).click();await page.reload();
 await expect(page.getByRole('button',{name:'取消完成 英语二十分钟'})).toBeVisible();await expect(page.getByRole('button',{name:'学一点英语',exact:false})).toContainText('今天已完成');await expect(page.locator('.health-value').filter({hasText:'55.2'})).toBeVisible();await expect(page.locator('.health-value').filter({hasText:'7.5'})).toBeVisible();await expect(page.locator('.meal-slot').first()).toContainText('鸡蛋和牛奶');
 await page.locator('#date').fill('2025-01-01');await expect(page.locator('.task')).toHaveCount(0);await expect(page.locator('.meal-slot').first()).toContainText('拍照或记下来');
});

test('English progress updates a long-term plan and monthly reports',async({page})=>{
 await page.goto('/');await nav(page,'计划').click();await page.getByRole('button',{name:'新建目标',exact:false}).click();await page.getByLabel('目标名称').fill('英语听力计划');await page.getByRole('dialog').getByRole('combobox',{name:'目标分类',exact:true}).selectOption('english');await page.getByLabel('目标数量').fill('60');await page.getByRole('button',{name:'保存目标'}).click();await expect(page.locator('.goal-card')).toContainText('英语听力计划');await page.getByRole('button',{name:'记录一次进展',exact:false}).click();await page.getByLabel('活动名称').fill('听力练习');await page.getByLabel('时长（分钟）').fill('20');await page.getByRole('button',{name:'保存记录'}).click();await expect(page.locator('.goal-numbers')).toContainText('33%');
 await nav(page,'回顾').click();await page.getByRole('button',{name:'学习运动统计',exact:true}).click();await expect(page.locator('.report-stats section').first()).toContainText('20');await expect(page.locator('.activity-row')).toContainText('听力练习');
});

test('quick diary, mood, finance and timeline share the same records',async({page})=>{
 await page.goto('/');await record(page,'写日记');await page.getByRole('dialog').getByRole('button',{name:'超棒',exact:true}).click();await page.getByLabel('今天的故事').fill('今天认真照顾了自己。');await page.getByRole('button',{name:'保存记录'}).click();
 await page.getByRole('button',{name:'记一笔账',exact:false}).click();await page.getByLabel('金额（元）').fill('28.50');await page.getByLabel('备注',{exact:true}).fill('午餐');await page.getByRole('button',{name:'保存记录'}).click();await nav(page,'回顾').click();await page.getByRole('button',{name:'日记时间线',exact:true}).click();await expect(page.locator('.timeline')).toContainText('今天认真照顾了自己。');await expect(page.locator('.timeline')).toContainText('超棒');await page.getByRole('button',{name:'收支报表',exact:true}).click();await expect(page.locator('.transaction')).toContainText('28.50');await expect(page.locator('.report-stats section').first()).toContainText('28.50');
});

test('meal photo is compressed, saved, reviewed and included in a backup',async({page})=>{
 await page.goto('/');await record(page,'拍餐食');await page.locator('#meal-photo').setInputFiles('public/app-192.png');await expect(page.locator('#meal-preview')).toBeVisible();await page.getByLabel('吃了什么').fill('水果酸奶');await page.getByRole('button',{name:'保存记录'}).click();await nav(page,'今天').click();await expect(page.locator('.meal-slot img')).toBeVisible();await nav(page,'回顾').click();await expect(page.locator('.meal-thumb')).toBeVisible();await nav(page,'我的').click();const pendingDownload=page.waitForEvent('download');await page.getByRole('button',{name:'导出完整备份',exact:true}).click();const download=await pendingDownload;const stream=await download.createReadStream();let raw='';for await(const chunk of stream)raw+=chunk;const backup=JSON.parse(raw);expect(backup.meals[0].photo.startsWith('data:image/jpeg;base64,')).toBe(true);expect(backup.meals[0].text).toBe('水果酸奶');
});

test('module customization hides cards but preserves records',async({page})=>{
 await page.goto('/');await page.getByLabel('新任务').fill('不应删除');await page.getByRole('button',{name:'添加',exact:true}).click();await nav(page,'我的').click();await page.locator('[data-module="tasks"]').uncheck();await nav(page,'今天').click();await expect(page.getByLabel('新任务')).toHaveCount(0);await nav(page,'我的').click();await page.locator('[data-module="tasks"]').check();await nav(page,'今天').click();await expect(page.locator('.task')).toContainText('不应删除');
});

test('all themes and five tabs fit a small phone; photo icons can be replaced',async({page})=>{
 await page.setViewportSize({width:320,height:667});await page.goto('/');
 for(const theme of ['kitty','star','photo']){await page.getByLabel('外观主题').selectOption(theme);for(const name of ['今天','计划','快速记录','回顾','我的']){await nav(page,name).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}
 await page.getByText('📷 设置面剂子照片主题',{exact:true}).click();await page.locator('[data-theme-photo="today"]').setInputFiles('public/app-192.png');await expect(page.locator('#photo-theme-status')).toContainText('已替换照片');await expect(nav(page,'今天').locator('img')).toBeVisible();await page.reload();await expect(nav(page,'今天').locator('img')).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-theme','photo');
});

test('local app lock verifies a PIN and protects the interface after reopening',async({page})=>{
 await page.goto('/');await nav(page,'我的').click();await page.getByLabel('6位数字密码',{exact:true}).fill('123456');await page.getByLabel('再次输入密码').fill('123456');await page.getByRole('button',{name:'开启应用锁'}).click();await page.getByRole('button',{name:'立即锁定'}).click();await expect(page.locator('#lock-gate')).toBeVisible();await page.getByLabel('应用锁密码',{exact:true}).fill('000000');await page.getByRole('button',{name:'解锁',exact:true}).click();await expect(page.locator('#unlock-error')).toContainText('密码不正确');await page.getByLabel('应用锁密码',{exact:true}).fill('123456');await page.getByRole('button',{name:'解锁',exact:true}).click();await expect(page.locator('#lock-gate')).toHaveCount(0);await page.reload();await expect(page.locator('#lock-gate')).toBeVisible();await page.getByLabel('应用锁密码',{exact:true}).fill('123456');await page.getByRole('button',{name:'解锁',exact:true}).click();await expect(page.locator('nav')).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('daylight-lock-v1'))).not.toContain('123456');
});

test('reminders are saved and a due foreground reminder appears once',async({page})=>{
 await page.goto('/');await nav(page,'我的').click();await page.getByLabel('提醒时间',{exact:true}).fill('00:00');await page.getByLabel('提醒内容',{exact:true}).fill('写一句日记');await page.getByRole('button',{name:'添加提醒',exact:true}).click();await expect(page.locator('.reminder-row')).toContainText('写一句日记');await expect(page.locator('#notice')).toContainText('写一句日记',{timeout:20000});
});

test('offline shell preserves pending cloud edits after reopening',async({page,context})=>{
 test.skip(process.env.TEST_PRODUCTION!=='1','Requires production offline shell.');const uploaded=await mockUser(page);await page.goto('/');await expect(page.locator('#sync-state')).toHaveText('已同步');await waitWorker(page);await context.setOffline(true);await page.getByLabel('新任务').fill('离线的新记录');await page.getByRole('button',{name:'添加',exact:true}).click();await expect(page.locator('#sync-state')).toContainText('待同步');await page.reload();await expect(page.locator('.task')).toContainText('离线的新记录');await context.setOffline(false);await nav(page,'我的').click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'上传本机记录'}).click();await expect(page.locator('#sync-state')).toHaveText('已同步');expect(uploaded().payload.tasks[0].text).toBe('离线的新记录');expect(await page.evaluate(()=>localStorage.getItem('daylight-v1-pending'))).toBeNull();
});

test('malformed imports cannot replace existing records or run HTML',async({page})=>{
 await page.goto('/');await page.getByLabel('新任务').fill('<img src=x onerror=alert(1)>');await page.getByRole('button',{name:'添加',exact:true}).click();await expect(page.locator('.task img')).toHaveCount(0);await nav(page,'我的').click();await page.locator('#import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...base,health:{'2026-10-16':{weight:'bad'}}}))});await expect(page.locator('#notice')).toContainText('不兼容');await nav(page,'今天').click();await expect(page.locator('.task')).toContainText('<img');
});
test('valid backups restore health and plans; CSV exports health, activities and safe text',async({page})=>{
 const backup={...base,version:2,health:{'2026-10-16':{water:1200,weight:55.2,sleep:8}},goals:[{id:'g',title:'读书',category:'study',target:60,unit:'分钟',deadline:''}],activities:[{id:'a',date:'2026-10-16',category:'study',name:'读书',minutes:15,goalId:'g'}],tasks:[{id:'t',date:'2026-10-16',text:'=1+1',done:false}]};
 await page.goto('/');await nav(page,'我的').click();page.once('dialog',d=>d.accept());await page.locator('#import').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await expect(page.locator('#notice')).toContainText('备份已导入');await nav(page,'计划').click();await expect(page.locator('.goal-numbers')).toContainText('25%');await nav(page,'今天').click();await page.locator('#date').fill('2026-10-16');await expect(page.locator('.health-value').filter({hasText:'55.2'})).toBeVisible();await nav(page,'我的').click();const event=page.waitForEvent('download');await page.getByRole('button',{name:'导出 CSV 表格'}).click();const stream=await(await event).createReadStream();let csv='';for await(const chunk of stream)csv+=chunk;expect(csv).toContain("'=1+1");expect(csv).toContain('1200');expect(csv).toContain('读书');
});
test('unreadable local data is never overwritten by subsequent edits',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('daylight-v1'))localStorage.setItem('daylight-v1','broken original data');});await page.goto('/');await page.getByLabel('新任务').fill('不能覆盖原始文件');await page.getByRole('button',{name:'添加',exact:true}).click();await page.getByRole('button',{name:'添加',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('daylight-v1'))).toBe('broken original data');await nav(page,'我的').click();await expect(page.getByRole('button',{name:'导出原始备份'})).toBeVisible();
});
