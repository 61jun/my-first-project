const LOCK='daylight-lock-v1';
let unlocked=false;
export function lockEnabled(){return !!localStorage.getItem(LOCK);}
export const isLocked=()=>lockEnabled()&&!unlocked;
export const lockNow=()=>{unlocked=false;window.dispatchEvent(new Event('daylight-lock'));};
const toHex=b=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
async function derive(pin,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);return toHex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:210000,hash:'SHA-256'},key,256));}
export async function setPin(pin){if(!/^\d{6}$/.test(pin))throw Error('请设置6位数字密码。');const salt=toHex(crypto.getRandomValues(new Uint8Array(16)));localStorage.setItem(LOCK,JSON.stringify({salt,hash:await derive(pin,salt)}));unlocked=true;}
export async function verify(pin){const raw=localStorage.getItem(LOCK);if(!raw){unlocked=true;return true;}const record=JSON.parse(raw);if(record.blockUntil>Date.now())throw Error('尝试次数较多，请稍后再试。');if(await derive(pin,record.salt)===record.hash){unlocked=true;localStorage.setItem(LOCK,JSON.stringify({salt:record.salt,hash:record.hash}));return true;}record.attempts=(record.attempts||0)+1;if(record.attempts>=5){record.blockUntil=Date.now()+60000;record.attempts=0;}localStorage.setItem(LOCK,JSON.stringify(record));return false;}
export function removeLock(){if(!unlocked)throw Error('请先解锁。');localStorage.removeItem(LOCK);}
let hiddenAt=0;document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=Date.now();else if(hiddenAt&&Date.now()-hiddenAt>60000&&lockEnabled())lockNow();});
