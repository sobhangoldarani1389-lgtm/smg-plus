const $ = (s) => document.querySelector(s);
const canvas = $('#canvas');
const viewport = $('#stageViewport');
const wrap = $('#stageWrap');
const list = $('#itemsList');

const state = {
  name: 'صحنه جدید', width: 1920, height: 1080, grid: true, snap: false,
  items: [], selected: null, zoom: 1, sceneId: null, editingId: null
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function uid(){ return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2); }
function setStatus(t){ $('#status').textContent = t; }
function escapeSelector(id){ return window.CSS?.escape ? CSS.escape(id) : String(id).replace(/[^a-zA-Z0-9_-]/g,'\\$&'); }

function applyCanvas(){
  canvas.style.width = state.width + 'px';
  canvas.style.height = state.height + 'px';
  canvas.classList.toggle('grid', state.grid);
  wrap.style.width = (state.width * state.zoom) + 'px';
  wrap.style.height = (state.height * state.zoom) + 'px';
  wrap.style.transform = `scale(${state.zoom})`;
  $('#sceneW').value = state.width;
  $('#sceneH').value = state.height;
  $('#gridToggle').checked = state.grid;
  $('#snapToggle').checked = state.snap;
}
function fit(){
  const p = viewport.getBoundingClientRect(), pad = 90;
  state.zoom = clamp(Math.min((p.width-pad)/state.width, (p.height-pad)/state.height), .1, 2);
  updateZoom(); applyCanvas();
}
function updateZoom(){ $('#zoomLabel').textContent = Math.round(state.zoom*100) + '%'; }

function findItem(id){ return state.items.find(x => x.id === id); }
function findEl(id){ return canvas.querySelector(`[data-id="${escapeSelector(id)}"]`); }

function reloadItem(id){
  const i = findItem(id), el = findEl(id);
  if(!i || !el) return;
  const iframe = el.querySelector('iframe');
  if(!iframe) return;
  // Reload is deliberately manual. No drag/resize action calls this function.
  iframe.src = i.url;
  setStatus(`«${i.name}» دوباره بارگذاری شد`);
}

function renderList(){
  list.innerHTML = '';
  if(!state.items.length){ list.innerHTML = '<div class="empty-list">هنوز امکانی اضافه نشده است.</div>'; return; }
  for(const i of state.items){
    const row = document.createElement('div');
    row.className = 'item-row' + (state.selected===i.id ? ' active' : '');
    const main = document.createElement('button');
    main.className = 'item-main'; main.textContent = i.name; main.title = i.url;
    main.onclick = () => selectItem(i.id, true);
    const lock = document.createElement('button');
    lock.className = 'icon-btn lock '+(i.locked?'on':'');
    lock.textContent = i.locked ? '🔒' : '🔓';
    lock.title = i.locked ? 'باز کردن قفل' : 'قفل کردن';
    lock.onclick = (e) => { e.stopPropagation(); i.locked=!i.locked; renderList(); updateItemVisual(i); };
    const reload = document.createElement('button');
    reload.className = 'icon-btn'; reload.textContent = '↻'; reload.title = 'بارگذاری مجدد دستی';
    reload.onclick = (e) => { e.stopPropagation(); reloadItem(i.id); };
    const settings = document.createElement('button');
    settings.className = 'icon-btn'; settings.textContent = '⚙'; settings.title = 'تنظیمات';
    settings.onclick = (e) => { e.stopPropagation(); openModal(i.id); };
    const trash = document.createElement('button');
    trash.className = 'icon-btn danger'; trash.textContent = '🗑'; trash.title = 'حذف کامل امکان';
    trash.onclick = (e) => { e.stopPropagation(); deleteLibraryItem(i.id); };
    row.append(main, lock, reload, settings, trash);
    list.appendChild(row);
  }
}

function updateIframeTransform(i, el){
  if(!el) return;
  const iframe = el.querySelector('iframe');
  if(!iframe) return;
  const sx = i.w / i.virtualWidth;
  const sy = i.h / i.virtualHeight;
  if(i.objectFit === 'contain'){
    const sc = Math.min(sx, sy);
    iframe.style.transform = `scale(${sc})`;
    iframe.style.left = ((i.w-i.virtualWidth*sc)/2)+'px';
    iframe.style.top = ((i.h-i.virtualHeight*sc)/2)+'px';
  }else{
    iframe.style.transform = `scale(${sx},${sy})`;
    iframe.style.left = '0'; iframe.style.top = '0';
  }
}

function createItemElement(i){
  const el = document.createElement('div');
  el.className = 'overlay-shell'; el.dataset.id = i.id;
  el.style.left=i.x+'px'; el.style.top=i.y+'px'; el.style.width=i.w+'px'; el.style.height=i.h+'px';
  const iframe = document.createElement('iframe');
  iframe.src=i.url; iframe.title=i.name; iframe.loading='eager'; iframe.allow='autoplay';
  iframe.style.width=i.virtualWidth+'px'; iframe.style.height=i.virtualHeight+'px';
  el.appendChild(iframe);
  updateIframeTransform(i,el);
  el.addEventListener('pointerdown', e=>{
    if(e.target.closest('.delete-handle') || e.target.closest('.resize-handle')) return;
    selectItem(i.id,false);
    if(!i.locked) startDrag(e,i);
  });
  return el;
}

function updateItemVisual(i){
  const el=findEl(i.id); if(!el) return;
  el.classList.toggle('selected', state.selected===i.id);
  el.classList.toggle('locked', i.locked);
  ensureSelectionControls(i,el);
}
function ensureSelectionControls(i,el){
  el.querySelectorAll('.delete-handle,.resize-handle,.lock-badge').forEach(x=>x.remove());
  if(state.selected!==i.id) return;
  const del=document.createElement('button'); del.className='delete-handle'; del.textContent='×'; del.title='حذف از صحنه';
  del.onclick=e=>{
    e.stopPropagation();
    i.inScene=false;
    state.selected=null;
    renderCanvas();
    renderList();
    setStatus(`«${i.name}» فقط از صحنه حذف شد؛ امکان در فهرست باقی ماند`);
  };
  el.appendChild(del);
  if(!i.locked){
    const rh=document.createElement('div'); rh.className='resize-handle'; rh.addEventListener('pointerdown',e=>startResize(e,i)); el.appendChild(rh);
  }else{
    const b=document.createElement('div'); b.className='lock-badge'; b.textContent='🔒 قفل'; el.appendChild(b);
  }
}
function updateAllVisuals(){
  state.items.forEach(updateItemVisual);
  renderList();
}

function renderCanvas(){
  const existing = new Map([...canvas.querySelectorAll('.overlay-shell')].map(el=>[el.dataset.id,el]));
  for(const i of [...state.items].filter(i=>i.inScene!==false).sort((a,b)=>a.z-b.z)){
    let el=existing.get(i.id);
    if(!el){ el=createItemElement(i); canvas.appendChild(el); }
    else{
      el.style.left=i.x+'px'; el.style.top=i.y+'px'; el.style.width=i.w+'px'; el.style.height=i.h+'px';
      const iframe=el.querySelector('iframe');
      if(iframe && iframe.src !== i.url) iframe.src=i.url;
      if(iframe){ iframe.style.width=i.virtualWidth+'px'; iframe.style.height=i.virtualHeight+'px'; updateIframeTransform(i,el); }
    }
    el.style.zIndex=String(i.z+10);
    el.classList.toggle('selected',state.selected===i.id);
    el.classList.toggle('locked',i.locked);
    ensureSelectionControls(i,el);
    existing.delete(i.id);
  }
  existing.forEach(el=>el.remove());
  $('#empty').classList.toggle('hidden',state.items.some(i=>i.inScene!==false));
  applyCanvas();
}

function selectItem(id,fromList=false){
  state.selected=id;
  const i=findItem(id);
  if(fromList && i){
    if(i.inScene===false){
      i.inScene=true;
      const visible=i.x+i.w>0 && i.y+i.h>0 && i.x<state.width && i.y<state.height;
      if(!visible){
        i.x=clamp(i.x,-i.w+40,state.width-40); i.y=clamp(i.y,-i.h+40,state.height-40);
      }
      renderCanvas();
      renderList();
      setStatus(`«${i.name}» دوباره به صحنه اضافه شد`);
      return;
    }
    const visible=i.x+i.w>0 && i.y+i.h>0 && i.x<state.width && i.y<state.height;
    if(!visible){
      // Bring it back to a usable location only when explicitly selected from the list.
      i.x=clamp(i.x,-i.w+40,state.width-40); i.y=clamp(i.y,-i.h+40,state.height-40);
      renderCanvas();
    }
    setStatus(`«${i.name}» انتخاب شد`);
  }
  updateAllVisuals();
}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/state.zoom,y:(e.clientY-r.top)/state.zoom};}
function snap(v){return state.snap?Math.round(v/10)*10:v;}

function startDrag(e,i){
  e.preventDefault(); e.stopPropagation();
  const p=canvasPoint(e),sx=i.x,sy=i.y;
  const move=ev=>{
    const q=canvasPoint(ev); i.x=snap(sx+(q.x-p.x)); i.y=snap(sy+(q.y-p.y));
    const el=findEl(i.id); if(el){el.style.left=i.x+'px';el.style.top=i.y+'px';}
    setStatus(`${Math.round(i.x)}، ${Math.round(i.y)} • ${Math.round(i.w)}×${Math.round(i.h)}`);
  };
  const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);renderList();};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
}
function startResize(e,i){
  e.preventDefault();e.stopPropagation();
  const startX=e.clientX,startY=e.clientY,sw=i.w,sh=i.h;
  const move=ev=>{
    i.w=clamp(sw+(ev.clientX-startX)/state.zoom,20,7680); i.h=clamp(sh+(ev.clientY-startY)/state.zoom,20,4320);
    const el=findEl(i.id); if(el){el.style.width=i.w+'px';el.style.height=i.h+'px';updateIframeTransform(i,el);}
    setStatus(`${Math.round(i.w)}×${Math.round(i.h)}`);
  };
  const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);renderList();};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
}

function deleteLibraryItem(id){
  const i=findItem(id); if(!i)return;
  if(!confirm(`«${i.name}» به‌طور کامل از امکانات حذف شود؟\nاین کار آن را از صحنه هم حذف می‌کند.`)) return;
  state.items=state.items.filter(x=>x.id!==id);
  if(state.selected===id)state.selected=null;
  renderList();renderCanvas();setStatus('امکان به‌طور کامل حذف شد');
}

function openModal(id=null){
  state.editingId=id;const i=id&&findItem(id);
  $('#modalTitle').textContent=i?'تنظیمات امکان':'افزودن امکان';
  $('#mName').value=i?.name||'';$('#mUrl').value=i?.url||'';$('#mVW').value=i?.virtualWidth||1920;$('#mVH').value=i?.virtualHeight||1080;$('#mFit').value=i?.objectFit||'fill';
  $('#modal').classList.remove('hidden');$('#mName').focus();
}
function closeModal(){$('#modal').classList.add('hidden');}

$('#addBtn').onclick=()=>openModal();$('#closeModal').onclick=closeModal;$('#cancelModal').onclick=closeModal;
$('#saveModal').onclick=()=>{
  const name=$('#mName').value.trim()||'امکان جدید',url=$('#mUrl').value.trim();
  if(!/^https?:\/\//i.test(url)){alert('آدرس باید با http:// یا https:// شروع شود.');return;}
  const vw=clamp(Math.round(Number($('#mVW').value)||1920),1,7680),vh=clamp(Math.round(Number($('#mVH').value)||1080),1,4320),fit=$('#mFit').value;
  if(state.editingId){
    const i=findItem(state.editingId); if(!i)return;
    const oldUrl=i.url;Object.assign(i,{name,url,virtualWidth:vw,virtualHeight:vh,objectFit:fit});
    renderList();renderCanvas();
    if(oldUrl!==url) setStatus('آدرس تغییر کرد؛ بارگذاری خودکار انجام نشد. برای بارگذاری ↻ را بزنید.');
  }else{
    state.items.push({id:uid(),name,url,x:40,y:40,w:400,h:200,z:state.items.length,locked:false,inScene:true,virtualWidth:vw,virtualHeight:vh,objectFit:fit});
    renderList();renderCanvas();
  }
  closeModal();
};

$('#sceneName').oninput=e=>state.name=e.target.value;
$('#sceneW').onchange=e=>{state.width=clamp(Math.round(Number(e.target.value)||1920),320,7680);applyCanvas();};
$('#sceneH').onchange=e=>{state.height=clamp(Math.round(Number(e.target.value)||1080),180,4320);applyCanvas();};
$('#gridToggle').onchange=e=>{state.grid=e.target.checked;applyCanvas();};
$('#snapToggle').onchange=e=>state.snap=e.target.checked;
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{const[w,h]=b.dataset.size.split('x').map(Number);state.width=w;state.height=h;applyCanvas();});
$('#zoomIn').onclick=()=>{state.zoom=clamp(state.zoom*1.15,.1,3);updateZoom();applyCanvas();};
$('#zoomOut').onclick=()=>{state.zoom=clamp(state.zoom/1.15,.1,3);updateZoom();applyCanvas();};
$('#fitBtn').onclick=fit;
$('#frontBtn').onclick=()=>{const i=findItem(state.selected);if(!i)return;i.z=Math.max(...state.items.map(x=>x.z),0)+1;renderCanvas();};
$('#backBtn').onclick=()=>{const i=findItem(state.selected);if(!i)return;i.z=Math.min(...state.items.map(x=>x.z),0)-1;renderCanvas();};
$('#duplicateBtn').onclick=()=>{const i=findItem(state.selected);if(!i)return;const n={...i,id:uid(),name:i.name+' - کپی',x:i.x+25,y:i.y+25,z:Math.max(...state.items.map(x=>x.z),0)+1,locked:false,inScene:true};state.items.push(n);state.selected=n.id;renderList();renderCanvas();};

async function fetchScenes(){
  const r=await fetch('/api/scenes',{cache:'no-store'});
  if(!r.ok) throw new Error('خطا در دریافت صحنه‌ها');
  return await r.json();
}
function formatSceneDate(ts){
  try{return new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(ts));}
  catch{return '';}
}
async function renderScenesLibrary(){
  const box=$('#scenesList');
  box.innerHTML='<div class="empty-list">در حال دریافت صحنه‌ها...</div>';
  try{
    const scenes=await fetchScenes();
    if(!scenes.length){box.innerHTML='<div class="empty-list">هنوز هیچ صحنه‌ای ذخیره نشده است.</div>';return;}
    box.innerHTML='';
    for(const sc of scenes){
      const row=document.createElement('div');row.className='scene-row'+(state.sceneId===sc.id?' active':'');
      const info=document.createElement('div');info.className='scene-info';
      const title=document.createElement('b');title.textContent=sc.name;
      const meta=document.createElement('small');meta.textContent=`${sc.width} × ${sc.height} • ${sc.itemsCount} امکان • ${formatSceneDate(sc.updatedAt)}`;
      info.append(title,meta);
      const actions=document.createElement('div');actions.className='scene-row-actions';
      const open=document.createElement('button');open.className='primary';open.textContent='باز کردن';open.onclick=()=>loadSavedScene(sc.id);
      const del=document.createElement('button');del.className='icon-btn danger';del.textContent='🗑';del.title='حذف صحنه ذخیره‌شده';del.onclick=()=>deleteSavedScene(sc);
      actions.append(open,del);row.append(info,actions);box.appendChild(row);
    }
  }catch(err){box.innerHTML='<div class="empty-list">دریافت صحنه‌ها ناموفق بود.</div>';console.error(err);}
}
async function loadSavedScene(id){
  if(state.items.length && !confirm('صحنه فعلی با صحنه ذخیره‌شده جایگزین شود؟ تغییرات ذخیره‌نشده از بین می‌رود.')) return;
  const r=await fetch('/api/scenes/'+encodeURIComponent(id),{cache:'no-store'});
  if(!r.ok){alert('باز کردن صحنه ناموفق بود.');return;}
  const d=await r.json();
  const loadedItems=Array.isArray(d.items)?d.items.map(item=>({...item,inScene:item.inScene!==false})):[];
  Object.assign(state,{name:d.name||'صحنه جدید',width:d.width||1920,height:d.height||1080,grid:d.grid!==false,snap:d.snap===true,items:loadedItems,selected:null,sceneId:d.id||id,editingId:null});
  $('#sceneName').value=state.name;
  $('#scenesModal').classList.add('hidden');
  renderList();renderCanvas();fit();
  setStatus(`«${state.name}» باز شد`);
}
async function deleteSavedScene(sc){
  if(!confirm(`صحنه «${sc.name}» از فهرست صحنه‌های ذخیره‌شده حذف شود؟`))return;
  const r=await fetch('/api/scenes/'+encodeURIComponent(sc.id),{method:'DELETE'});
  if(!r.ok){alert('حذف صحنه ناموفق بود.');return;}
  if(state.sceneId===sc.id){state.sceneId=null;setStatus('صحنه ذخیره‌شده حذف شد؛ نسخه فعلی هنوز در ویرایشگر باز است.');}
  await renderScenesLibrary();
}
$('#scenesBtn').onclick=async()=>{$('#scenesModal').classList.remove('hidden');await renderScenesLibrary();};
$('#closeScenes').onclick=()=>$('#scenesModal').classList.add('hidden');
$('#refreshScenes').onclick=renderScenesLibrary;
$('#newFromScenes').onclick=()=>{$('#scenesModal').classList.add('hidden');$('#newBtn').click();};

$('#saveBtn').onclick=async()=>{
  const body={name:state.name,width:state.width,height:state.height,grid:state.grid,snap:state.snap,items:state.items};
  const method=state.sceneId?'PUT':'POST',url=state.sceneId?'/api/scenes/'+state.sceneId:'/api/scenes';
  const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok){alert('ذخیره صحنه ناموفق بود.');return;}
  const d=await r.json();state.sceneId=d.id||state.sceneId;setStatus('صحنه با موفقیت ذخیره شد ✓');
  // Saved scenes are persistent entries in the library. Saving again updates the same entry.
};
$('#urlBtn').onclick=async()=>{
  if(!state.sceneId)await $('#saveBtn').onclick();
  if(!state.sceneId)return;
  $('#obsUrl').value=location.origin+'/overlay/'+state.sceneId;
  $('#obsSizeHint').textContent=`اندازه پیشنهادی Browser Source: ${state.width} × ${state.height}`;
  $('#urlModal').classList.remove('hidden');
};
$('#closeUrl').onclick=()=>$('#urlModal').classList.add('hidden');
$('#copyUrl').onclick=async()=>{await navigator.clipboard.writeText($('#obsUrl').value);setStatus('آدرس کپی شد ✓');};
$('#newBtn').onclick=async()=>{
  if(state.items.length && !state.sceneId){
    const saveFirst=confirm('صحنه فعلی هنوز ذخیره نشده است. قبل از ساخت صحنه جدید ذخیره شود؟\n\nتأیید = ذخیره و سپس صحنه جدید\nلغو = ماندن در صحنه فعلی');
    if(saveFirst){await $('#saveBtn').onclick();if(!state.sceneId)return;}
  }
  Object.assign(state,{name:'صحنه جدید',width:1920,height:1080,grid:true,snap:false,items:[],selected:null,sceneId:null});
  $('#sceneName').value=state.name;renderList();renderCanvas();fit();setStatus('صحنه جدید آماده شد');
};

window.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
  const i=findItem(state.selected);
  if(e.key==='Escape'){state.selected=null;updateAllVisuals();return;}
  if(!i)return;
  if(e.key==='Delete'&&!i.locked){i.inScene=false;state.selected=null;renderList();renderCanvas();setStatus(`«${i.name}» فقط از صحنه حذف شد`);return;}
  if(i.locked)return;
  const step=e.shiftKey?10:1,map={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
  if(map[e.key]){e.preventDefault();i.x+=map[e.key][0];i.y+=map[e.key][1];const el=findEl(i.id);if(el){el.style.left=i.x+'px';el.style.top=i.y+'px';}renderList();}
});

$('#modal').addEventListener('pointerdown',e=>{if(e.target===$('#modal'))closeModal();});
$('#urlModal').addEventListener('pointerdown',e=>{if(e.target===$('#urlModal'))$('#urlModal').classList.add('hidden');});
$('#scenesModal').addEventListener('pointerdown',e=>{if(e.target===$('#scenesModal'))$('#scenesModal').classList.add('hidden');});

$('#sceneName').value=state.name;renderList();renderCanvas();fit();
