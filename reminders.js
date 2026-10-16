import {localDate} from './model.js';
const KEY='daylight-reminders';
export function reminders(){try{return JSON.parse(localStorage.getItem(KEY))||[];}catch{return [];}}
export function saveReminders(items){localStorage.setItem(KEY,JSON.stringify(items));}
export function checkReminders(now=new Date()){
 const today=localDate(now),time=now.getHours()*60+now.getMinutes(),fired=JSON.parse(localStorage.getItem('daylight-reminded')||'{}'),due=[];
 for(const r of reminders()){const [h,m]=r.time.split(':').map(Number);if(r.enabled&&time>=h*60+m&&fired[r.id]!==today){due.push(r);fired[r.id]=today;}}
 localStorage.setItem('daylight-reminded',JSON.stringify(fired));return due;
}
