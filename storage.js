import {createClient} from '@supabase/supabase-js';
import {cloudConfig} from './cloud-config.js';
import {DATA_KEY,emptyData,migrate} from './model.js';
export const cloud=createClient(cloudConfig.url,cloudConfig.key);
export let data=emptyData(),session=null,status='仅保存在此设备',storageProblem='';
export const pendingKey=DATA_KEY+'-pending';
try {const raw=localStorage.getItem(DATA_KEY);if(raw)data=migrate(JSON.parse(raw));} catch {storageProblem='本机记录无法读取。原始数据没有被覆盖，请先导出原始备份。';}
let queue=Promise.resolve(),version=0;
export let onStatus=()=>{},onLoad=()=>{};
export function subscribe(statusFn,loadFn){onStatus=statusFn;onLoad=loadFn;}
export const pending=()=>session&&localStorage.getItem(pendingKey)===session.user.id;
function setStatus(s){status=s;onStatus(s);}
export function replace(next){data=migrate(next);storageProblem='';}
export async function save(){
 if(storageProblem)throw Error(storageProblem);
 const snapshot=JSON.stringify(data),v=++version,user=session?.user.id;
 try {localStorage.setItem(DATA_KEY,snapshot);if(user)localStorage.setItem(pendingKey,user);}catch{throw Error('设备空间不足，照片可能较多。请先导出备份并减少照片。');}
 if(!user){setStatus('仅保存在此设备');return true;}
 setStatus(navigator.onLine?'同步中':'离线，待同步');
 const job=async()=>{let ok=false;if(navigator.onLine)try{const {error}=await cloud.from('life_records').upsert({user_id:user,payload:JSON.parse(snapshot),updated_at:new Date().toISOString()});ok=!error;}catch{}
 if(v===version&&session?.user.id===user){if(ok)localStorage.removeItem(pendingKey);setStatus(ok?'已同步':'本机已保存，待同步');}return ok;};
 queue=queue.then(job,job);return queue;
}
export async function pull(force=false){
 if(storageProblem)throw Error(storageProblem);
 if(pending()&&!force){setStatus('本机有待同步记录');return;}
 const before=version;
 const {data:row,error}=await cloud.from('life_records').select('payload').eq('user_id',session.user.id).maybeSingle();
 if(error)throw Error('暂时无法连接云端，本机记录已保留。');
 if(before!==version){setStatus('本机记录已更新，请在“我的”中同步');return;}
 if(row){const next=migrate(row.payload);localStorage.setItem(DATA_KEY,JSON.stringify(next));data=next;localStorage.removeItem(pendingKey);}else if(!await save())throw Error('首次上传失败，本机记录已保留。');
 setStatus('已同步');
}
export async function login(email,password){const {data:auth,error}=await cloud.auth.signInWithPassword({email,password});if(error)throw Error('登录失败，请检查邮箱、密码和网络。');session=auth.session;}
export async function logout(){await cloud.auth.signOut();session=null;setStatus('仅保存在此设备');}
export async function initialize(){const {data:auth}=await cloud.auth.getSession();session=auth.session;if(session)try{await pull();}catch(e){setStatus('暂时无法同步');}onLoad();}
