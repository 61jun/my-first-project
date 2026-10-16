export const DATA_KEY = 'daylight-v1';
export const moduleNames = {tasks:'待办',habits:'习惯打卡',mood:'今日心情',meals:'三餐',water:'饮水',weight:'体重',sleep:'睡眠'};
export const categories = {study:'学习',english:'英语',exercise:'运动',other:'其他'};
export const localDate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const emptyData = () => ({version:2,tasks:[],habits:[{id:'english',name:'学一点英语',icon:'Aa'},{id:'move',name:'动一动身体',icon:'↗'},{id:'food',name:'好好吃饭',icon:'♧'}],checks:{},journals:{},expenses:[],health:{},meals:[],goals:[],activities:[],preferences:{modules:Object.fromEntries(Object.keys(moduleNames).map(k=>[k,true])),waterTarget:2000}});
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const text=x=>typeof x==='string';
const num=x=>Number.isFinite(x)&&x>=0;
const day=x=>text(x)&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x));
const photo=x=>x===undefined||x===''||(text(x)&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x)&&x.length<400000);
export function validData(x){
 if(!object(x)||(x.version!==undefined&&x.version!==2))return false;
 if(!Array.isArray(x.tasks)||!x.tasks.every(t=>object(t)&&text(t.id)&&text(t.text)&&day(t.date)&&typeof t.done==='boolean'))return false;
 if(!Array.isArray(x.habits)||!x.habits.every(h=>object(h)&&text(h.id)&&text(h.name)&&text(h.icon)))return false;
 if(!object(x.journals)||!Object.entries(x.journals).every(([d,j])=>day(d)&&object(j)&&(j.text===undefined||text(j.text))&&(j.mood===undefined||Number.isInteger(j.mood)&&j.mood>=0&&j.mood<=4)))return false;
 if(!object(x.checks)||!Object.entries(x.checks).every(([d,c])=>day(d)&&object(c)&&Object.values(c).every(v=>typeof v==='boolean')))return false;
 if(!Array.isArray(x.expenses)||!x.expenses.every(e=>object(e)&&text(e.id)&&day(e.date)&&text(e.category)&&text(e.note)&&['income','expense'].includes(e.type)&&num(e.amount)&&e.amount>0))return false;
 if(x.health!==undefined&&(!object(x.health)||!Object.entries(x.health).every(([d,h])=>day(d)&&object(h)&&['water','weight','sleep'].every(k=>h[k]===undefined||num(h[k])))))return false;
 if(x.meals!==undefined&&(!Array.isArray(x.meals)||!x.meals.every(m=>object(m)&&text(m.id)&&day(m.date)&&['早餐','午餐','晚餐','加餐'].includes(m.slot)&&text(m.text)&&photo(m.photo))))return false;
 if(x.goals!==undefined&&(!Array.isArray(x.goals)||!x.goals.every(g=>object(g)&&text(g.id)&&text(g.title)&&Object.hasOwn(categories,g.category)&&num(g.target)&&g.target>0&&['分钟','次'].includes(g.unit)&&(g.deadline===''||day(g.deadline)))))return false;
 if(x.activities!==undefined&&(!Array.isArray(x.activities)||!x.activities.every(a=>object(a)&&text(a.id)&&day(a.date)&&Object.hasOwn(categories,a.category)&&text(a.name)&&num(a.minutes)&&a.minutes>0&&(a.goalId===undefined||text(a.goalId)))))return false;
 if(x.preferences!==undefined&&(!object(x.preferences)||(x.preferences.waterTarget!==undefined&&(!num(x.preferences.waterTarget)||x.preferences.waterTarget<=0))||(x.preferences.modules!==undefined&&(!object(x.preferences.modules)||!Object.values(x.preferences.modules).every(v=>typeof v==='boolean')))))return false;
 return true;
}
export function migrate(x){if(!validData(x))throw Error('备份或云端记录格式不兼容，未覆盖本机记录。');const base=emptyData();return {...base,...x,version:2,preferences:{...base.preferences,...x.preferences,modules:{...base.preferences.modules,...x.preferences?.modules}}};}
export const goalProgress=(data,g)=>data.activities.filter(a=>a.goalId===g.id).reduce((s,a)=>s+(g.unit==='次'?1:a.minutes),0);
export function monthlyStats(data,month){const expense=data.expenses.filter(e=>e.date.startsWith(month));const cents=type=>expense.filter(e=>e.type===type).reduce((s,e)=>s+Math.round(e.amount*100),0);const activities=data.activities.filter(a=>a.date.startsWith(month));return {income:cents('income')/100,expense:cents('expense')/100,study:activities.filter(a=>a.category==='study'||a.category==='english').reduce((s,a)=>s+a.minutes,0),exercise:activities.filter(a=>a.category==='exercise').reduce((s,a)=>s+a.minutes,0),activityDays:new Set(activities.map(a=>a.date)).size};}
export function recordDays(data){return new Set([...data.tasks.map(t=>t.date),...Object.keys(data.journals),...Object.entries(data.checks).filter(([,v])=>Object.values(v).some(Boolean)).map(([d])=>d),...Object.keys(data.health),...data.meals.map(m=>m.date),...data.activities.map(a=>a.date),...data.expenses.map(e=>e.date)]);}
export function csv(data){const rows=[['类型','日期','内容','数值','单位','分类','备注']];data.tasks.forEach(t=>rows.push(['待办',t.date,t.text,'','','',t.done?'已完成':'未完成']));Object.entries(data.journals).forEach(([d,j])=>rows.push(['日记',d,j.text||'',j.mood===undefined?'':j.mood,'心情0-4','','']));data.expenses.forEach(e=>rows.push(['记账',e.date,e.note,e.amount,'元',e.category,e.type==='income'?'收入':'支出']));data.meals.forEach(m=>rows.push(['餐食',m.date,m.text,'','',m.slot,m.photo?'含照片（照片保存在JSON备份中）':'']));data.activities.forEach(a=>rows.push(['活动',a.date,a.name,a.minutes,'分钟',categories[a.category],'']));Object.entries(data.health).forEach(([d,h])=>Object.entries(h).forEach(([k,v])=>rows.push([moduleNames[k],d,'',v,{water:'ml',weight:'kg',sleep:'小时'}[k],'',''])));Object.entries(data.checks).forEach(([d,h])=>Object.entries(h).filter(([,v])=>v).forEach(([id])=>rows.push(['打卡',d,data.habits.find(h=>h.id===id)?.name||id,1,'次','',''])));return '\ufeff'+rows.map(r=>r.map(v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}).join(',')).join('\r\n');}
