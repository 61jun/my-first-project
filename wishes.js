import {localDate,wishCategories} from './model.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function setWishDone(data,id,done){
 const wish=data.futureWishes.find(w=>w.id===id);
 if(!wish)return;
 wish.done=done;
 wish.completedDate=done?localDate():'';
 const task=data.tasks.find(t=>t.id===wish.taskId);
 if(task)task.done=done;
}

export function scheduleWish(data,id,day){
 const wish=data.futureWishes.find(w=>w.id===id);
 if(!wish)throw Error('这件想做的事已不存在，请重新打开清单。');
 if(wish.done)throw Error('这件事已经实现了，恢复为未实现后可以再次安排。');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||Number.isNaN(Date.parse(day)))throw Error('请选择安排日期。');
 let task=data.tasks.find(t=>t.id===wish.taskId);
 if(task){task.date=day;task.text=wish.title;task.done=false;}
 else {task={id:crypto.randomUUID(),date:day,text:wish.title,done:false};data.tasks.push(task);wish.taskId=task.id;}
 return task;
}

export function wishesPanel(data,filter,category){
 const waiting=data.futureWishes.filter(w=>!w.done).length,realized=data.futureWishes.length-waiting;
 const entries=data.futureWishes.slice().reverse().filter(w=>(filter==='all'||(filter==='done'?w.done:!w.done))&&(category==='all'||w.category===category)).sort((a,b)=>Number(a.done)-Number(b.done));
 return `<div class="wish-intro"><div><span class="eyebrow">SOMEDAY, IN MY OWN TIME</span><h2>先把想做的事，轻轻收起来。</h2><p>想去的地方，想学的东西，或者一个突然冒出的小念头。<br>不必马上行动，也不必一定有期限。</p><div class="wish-counts"><span>♡ ${waiting} 件等待发生</span><span>✧ ${realized} 件已经实现</span></div></div><span class="wish-illustration" aria-hidden="true">✧<small>some day</small></span><button type="button" class="primary" data-new-wish>＋ 新增想做的事</button></div>
 <div class="wish-toolbar"><div class="filter-tabs" role="group" aria-label="心愿状态">${[['waiting','未实现'],['done','已实现'],['all','全部']].map(([id,title])=>`<button data-wish-filter="${id}" aria-pressed="${filter===id}" class="${filter===id?'active':''}">${title}</button>`).join('')}</div><label class="wish-category-filter"><span>心愿分类</span><select id="wish-category"><option value="all" ${category==='all'?'selected':''}>全部分类</option>${Object.entries(wishCategories).map(([id,title])=>`<option value="${id}" ${category===id?'selected':''}>${title}</option>`).join('')}</select></label></div>
 <div class="wish-grid">${entries.map(w=>{
  const task=data.tasks.find(t=>t.id===w.taskId);
  return `<section class="wish-card ${w.done?'wish-done':''}"><div class="section-title"><span class="category-pill">${wishCategories[w.category]}</span><button class="delete" data-delete="futureWishes:${w.id}" aria-label="删除心愿 ${esc(w.title)}">×</button></div><h2>${esc(w.title)}</h2>${w.notes?`<p class="wish-notes">${esc(w.notes)}</p>`:''}<p class="wish-date">${w.targetDate?'期待日期 · '+esc(w.targetDate):'♡ 不设期限，按自己的节奏来'}</p>${task?`<button class="wish-scheduled" data-wish-task-date="${task.date}">已安排到 ${task.date} 的待办 ↗</button>`:''}${w.done?`<p class="wish-realized">✦ 已实现${w.completedDate?' · '+w.completedDate:''}</p>`:''}<div class="wish-actions"><button class="text-button" data-edit-wish="${w.id}">编辑</button>${!w.done?`<button class="secondary" data-schedule-wish="${w.id}">${task?'调整安排':'安排到某天'}</button>`:''}<button class="${w.done?'secondary':'primary'}" data-toggle-wish="${w.id}" aria-label="${w.done?'恢复未实现':'标记已实现'} ${esc(w.title)}">${w.done?'恢复未实现':'已经实现 ✓'}</button></div></section>`;
 }).join('')||`<section class="wish-empty"><span>✧</span><h2>${data.futureWishes.length?'这里暂时没有符合条件的事':'给未来，留一点期待。'}</h2><p>${data.futureWishes.length?'试试其他状态或分类。':'例如：去海边看日出、学会游泳、和朋友看一次演唱会。'}</p><button class="secondary" data-new-wish>记下一个想法 ＋</button></section>`}</div>`;
}
