let promptEvent = null;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export function installPanel() {
  return `<div class="install-panel"><span class="install-symbol">↗</span><div><h3>把拾日放进口袋里</h3><p>${standalone()?'你正在独立 App 窗口中使用拾日。':'安装后有独立图标和窗口，点开就能记录今天。'}</p><button type="button" id="install-app" class="primary" ${standalone()?'hidden':''}>添加到手机或电脑</button><div id="install-help" class="install-help" hidden><p><b>iPhone / iPad</b><br>在 Safari 打开此网址 → 分享按钮（方框向上箭头）→ 添加到主屏幕 → 添加。</p><p><b>Windows</b><br>在 Edge 或 Chrome 中，使用地址栏右侧安装图标，或浏览器菜单中的“将此网站安装为应用”。</p><p>添加后请登录同一账户。已有本机记录请先导出备份。联网同步；离线时保留本机记录。</p></div></div></div>`;
}
export function bindInstall() {
  const b=document.querySelector('#install-app'); if(!b)return;
  b.onclick=async()=>{
    if(promptEvent){await promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;}
    else document.querySelector('#install-help').hidden=false;
  };
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;});
window.addEventListener('appinstalled',()=>{const b=document.querySelector('#install-app');if(b)b.hidden=true;});
if('serviceWorker' in navigator && import.meta.env.PROD){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
