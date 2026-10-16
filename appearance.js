export const themes = {
  kitty: { name: '蝴蝶结小猫', subtitle: '樱花粉 · 奶油白 · 甜甜的陪伴', color: '#fff1f6', mascot: '/kitty.svg' },
  star: { name: '奶油星星', subtitle: '奶油黄 · 天空蓝 · 闪闪的小日子', color: '#fff8e2', mascot: '/star.svg' },
};
let theme = 'kitty';
try { const saved = localStorage.getItem('daylight-theme'); if (themes[saved]) theme = saved; } catch {}
export function applyTheme(next = theme) {
  if (!themes[next]) return;
  theme = next;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = themes[theme].color;
  try { localStorage.setItem('daylight-theme', theme); } catch {}
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
  });
  document.querySelectorAll('[data-mascot]').forEach(img => { img.src = themes[theme].mascot; });
  const select = document.querySelector('#theme-select'); if (select) select.value = theme;
}
export function themeSelect() {
  return `<label class="quick-theme"><span>换个心情</span><select id="theme-select" aria-label="外观主题">${Object.entries(themes).map(([id,t])=>`<option value="${id}" ${id===theme?'selected':''}>${id==='kitty'?'🎀':'⭐'} ${t.name}</option>`).join('')}</select></label>`;
}
export function themeSettings() {
  return `<div class="appearance-settings"><div class="settings-heading"><span>✧ MAKE IT YOURS</span><h2>把小天地装扮成喜欢的样子</h2><p>挑一个今天的心情，主题只保存在这台设备上。</p></div><div class="theme-cards">${Object.entries(themes).map(([id,t])=>`<button class="theme-card theme-${id}" data-theme-choice="${id}" aria-pressed="${theme===id}"><img src="${t.mascot}" alt="" width="120" height="100"><span><strong>${t.name}</strong><small>${t.subtitle}</small></span><b class="theme-tick" aria-hidden="true">✓</b></button>`).join('')}</div></div>`;
}
export function mascot() { return `<img class="mascot" data-mascot src="${themes[theme].mascot}" alt="" width="360" height="300"><span class="sticker sticker-one">a little happy, every day</span><span class="sticker sticker-two">✦ 今天也很可爱 ✦</span>`; }
export function bindAppearance() {
  document.querySelectorAll('[data-theme-choice]').forEach(b => b.onclick=()=>applyTheme(b.dataset.themeChoice));
  const select = document.querySelector('#theme-select'); if (select) select.onchange=()=>applyTheme(select.value);
}
applyTheme();
