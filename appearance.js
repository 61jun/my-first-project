import {readPhoto} from './photos.js';
export const themes={kitty:{name:'蝴蝶结小猫',subtitle:'樱花粉 · 奶油白 · 甜甜的陪伴',color:'#fff1f6',mascot:'/kitty.svg'},star:{name:'奶油星星',subtitle:'奶油黄 · 闪闪的小日子',color:'#fff8e2',mascot:'/star.svg'},photo:{name:'面剂子照片',subtitle:'选择自己的照片，装饰生活小天地',color:'#f6efff',mascot:'/kitty.svg'}};
const PHOTO_KEY='daylight-theme-photos';
let theme='kitty',photos={};
try{const t=localStorage.getItem('daylight-theme');if(themes[t])theme=t;photos=JSON.parse(localStorage.getItem(PHOTO_KEY))||{};}catch{}
const safePhoto=s=>typeof s==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s);
const slots={hero:'首页大图',avatar:'我的头像',today:'今天图标',plans:'计划图标',quick:'快速记录图标',review:'回顾图标',mine:'我的图标'};
function picture(slot){const p=photos[slot];return safePhoto(p)?p:'';}
export function navImage(id){const p=theme==='photo'?picture(id):'';return p?`<img src="${p}" alt="" class="photo-nav-icon">`:'';}
export function applyTheme(next=theme){
 if(!themes[next])return;theme=next;document.documentElement.dataset.theme=theme;
 document.querySelector('meta[name="theme-color"]').content=themes[theme].color;
 try{localStorage.setItem('daylight-theme',theme);}catch{}
 document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme)));
 document.querySelectorAll('[data-mascot]').forEach(img=>{const p=theme==='photo'?picture(img.hasAttribute('data-avatar')?'avatar':'hero'):'';img.src=p||themes[theme].mascot;img.classList.toggle('custom-photo',!!p);});
 document.querySelectorAll('nav [data-page]').forEach(b=>{const icon=b.querySelector('.nav-icon');if(icon){const id=b.dataset.page;icon.innerHTML=navImage(id)||{today:'☀',plans:'⚑',quick:'＋',review:'▦',mine:'♡'}[id];}});
 const select=document.querySelector('#theme-select');if(select)select.value=theme;
}
export function themeSelect(){return `<label class="quick-theme"><span>换个心情</span><select id="theme-select" aria-label="外观主题">${Object.entries(themes).map(([id,t])=>`<option value="${id}" ${id===theme?'selected':''}>${{kitty:'🎀',star:'⭐',photo:'📷'}[id]} ${t.name}</option>`).join('')}</select></label>`;}
export function themeSettings(){return `<div class="appearance-settings"><div class="settings-heading"><span>✧ MAKE IT YOURS</span><h2>把小天地装扮成喜欢的样子</h2><p>主题和外观照片只保存在这台设备，切换不会改变生活记录。</p></div><div class="theme-cards">${Object.entries(themes).map(([id,t])=>`<button class="theme-card theme-${id}" data-theme-choice="${id}" aria-pressed="${theme===id}"><img src="${id==='photo'?picture('hero')||'/star.svg':t.mascot}" alt="" width="120" height="100"><span><strong>${t.name}</strong><small>${t.subtitle}</small></span><b class="theme-tick" aria-hidden="true">✓</b></button>`).join('')}</div><details class="photo-settings"><summary>📷 设置面剂子照片主题</summary><p class="muted">从相册选择你想用的照片，上传后切换到“面剂子照片”主题。尚未加入网络照片；没有照片的位置保留现有插画或符号。</p><div class="photo-slot-grid">${Object.entries(slots).map(([slot,name])=>`<div class="photo-slot">${picture(slot)?`<img src="${picture(slot)}" alt="${name}预览">`:'<span class="photo-placeholder">＋</span>'}<label class="secondary">${name}<input type="file" accept="image/*" data-theme-photo="${slot}" hidden></label><button type="button" class="text-button" data-remove-photo="${slot}">移除</button></div>`).join('')}</div><p id="photo-theme-status" role="status"></p></details></div>`;}
export function mascot(){return `<img class="mascot" data-mascot src="${themes[theme].mascot}" alt="" width="360" height="300"><span class="sticker sticker-one">a little happy, every day</span><span class="sticker sticker-two">✦ 今天也很可爱 ✦</span>`;}
export function bindAppearance(){
 document.querySelectorAll('[data-theme-choice]').forEach(b=>b.onclick=()=>applyTheme(b.dataset.themeChoice));
 const select=document.querySelector('#theme-select');if(select)select.onchange=()=>applyTheme(select.value);
 document.querySelectorAll('[data-theme-photo]').forEach(input=>input.onchange=async()=>{
  const status=document.querySelector('#photo-theme-status');if(!input.files[0])return;status.textContent='照片处理中…';
  try{const src=await readPhoto(input.files[0]);const next={...photos,[input.dataset.themePhoto]:src};localStorage.setItem(PHOTO_KEY,JSON.stringify(next));photos=next;const slot=input.closest('.photo-slot');const old=slot.querySelector('img,.photo-placeholder');const img=document.createElement('img');img.src=src;img.alt='照片预览';old.replaceWith(img);applyTheme('photo');status.textContent='已替换照片并切换到照片主题。外观照片只保存在这台设备。';}catch(e){status.textContent=e.message.includes('quota')?'设备空间不足，请移除一些照片。':e.message;}finally{input.value='';}
 });
 document.querySelectorAll('[data-remove-photo]').forEach(b=>b.onclick=()=>{const next={...photos};delete next[b.dataset.removePhoto];try{localStorage.setItem(PHOTO_KEY,JSON.stringify(next));photos=next;const preview=b.closest('.photo-slot').querySelector('img');if(preview){const placeholder=document.createElement('span');placeholder.className='photo-placeholder';placeholder.textContent='＋';preview.replaceWith(placeholder);}applyTheme();document.querySelector('#photo-theme-status').textContent='照片已移除。';}catch{document.querySelector('#photo-theme-status').textContent='暂时无法修改本机照片。';}});
}
applyTheme();
