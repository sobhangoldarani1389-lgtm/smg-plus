const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = process.env.SMG_DATA_DIR ? path.resolve(process.env.SMG_DATA_DIR) : path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'scenes.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}', 'utf8');

const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'};
function readScenes(){try{return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')||'{}')}catch{return {}}}
function writeScenes(s){const tmp=DATA_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(s,null,2));fs.renameSync(tmp,DATA_FILE)}
function num(v,f){const n=Number(v);return Number.isFinite(n)?n:f}
function cleanScene(body = {}) {
  const width = Math.max(320, Math.min(7680, Math.round(num(body.width, 1920))));
  const height = Math.max(180, Math.min(4320, Math.round(num(body.height, 1080))));
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 200) : [];
  const items = rawItems.map((i, index) => ({
    id: String(i.id || crypto.randomUUID()).slice(0, 80),
    name: String(i.name || 'Overlay').slice(0, 100),
    url: String(i.url || '').slice(0, 5000),
    x: num(i.x, 0), y: num(i.y, 0),
    w: Math.max(20, Math.min(7680, num(i.w, 400))),
    h: Math.max(20, Math.min(4320, num(i.h, 200))),
    z: Math.round(num(i.z, index)),
    locked: i.locked === true,
    virtualWidth: Math.max(1, Math.min(7680, Math.round(num(i.virtualWidth, 1920)))),
    virtualHeight: Math.max(1, Math.min(4320, Math.round(num(i.virtualHeight, 1080)))),
    objectFit: ['contain', 'fill'].includes(i.objectFit) ? i.objectFit : 'fill'
  })).filter(i => /^https?:\/\//i.test(i.url));
  return {
    name: String(body.name || 'Untitled Scene').slice(0, 100),
    width, height,
    background: String(body.background || 'transparent').slice(0, 80),
    grid: body.grid !== false,
    snap: body.snap === true,
    items
  };
}
function send(res,status,data,type='application/json; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(type.startsWith('application/json')?JSON.stringify(data):data)}
function readBody(req){return new Promise((resolve,reject)=>{let d='';req.on('data',c=>{d+=c;if(d.length>5e6){req.destroy();reject(new Error('body too large'))}});req.on('end',()=>{try{resolve(d?JSON.parse(d):{})}catch(e){reject(e)}});req.on('error',reject)})}
async function api(req,res,p){
  try{
    if(req.method==='GET'&&p==='/api/health')return send(res,200,{ok:true,version:'1.3.0'});
    if(req.method==='GET'&&p==='/api/scenes'){
      const scenes=readScenes();
      const list=Object.entries(scenes).map(([id,s])=>({id,name:s.name||'صحنه بدون نام',width:s.width,height:s.height,itemsCount:Array.isArray(s.items)?s.items.length:0,createdAt:s.createdAt||s.updatedAt||Date.now(),updatedAt:s.updatedAt||s.createdAt||Date.now()})).sort((a,b)=>b.updatedAt-a.updatedAt);
      return send(res,200,list);
    }
    if(req.method==='GET'&&/^\/api\/scenes\/[^/]+$/.test(p)){const id=p.split('/').pop();const s=readScenes()[id];return s?send(res,200,{...s,id}):send(res,404,{error:'Scene not found'})}
    if((req.method==='POST'&&p==='/api/scenes')||(req.method==='PUT'&&/^\/api\/scenes\/[^/]+$/.test(p))){const body=await readBody(req);const scenes=readScenes();const id=req.method==='POST'?crypto.randomBytes(8).toString('hex'):p.split('/').pop();if(req.method==='PUT'&&!scenes[id])return send(res,404,{error:'Scene not found'});scenes[id]={...cleanScene(body),createdAt:scenes[id]?.createdAt||Date.now(),updatedAt:Date.now()};writeScenes(scenes);return send(res,200,{ok:true,id,url:`http://${req.headers.host}/overlay/${id}`})}
    if(req.method==='DELETE'&&/^\/api\/scenes\/[^/]+$/.test(p)){const id=p.split('/').pop();const scenes=readScenes();if(!scenes[id])return send(res,404,{error:'Scene not found'});delete scenes[id];writeScenes(scenes);return send(res,200,{ok:true,id})}
    send(res,404,{error:'Not found'});
  }catch(e){send(res,400,{error:e.message})}
}
function safeFile(p){const clean=path.normalize(p).replace(/^([.][.][/\\])+/, '');const file=path.join(PUBLIC,clean);return file.startsWith(PUBLIC)?file:null}
const server=http.createServer(async(req,res)=>{const parsed=url.parse(req.url);const p=parsed.pathname||'/';if(p.startsWith('/api/'))return api(req,res,p);if(req.method!=='GET'){return send(res,405,{error:'Method not allowed'})}if(/^\/overlay\/[^/]+$/.test(p))return serve(path.join(PUBLIC,'overlay.html'),res);let file=safeFile(p==='/'?'index.html':p.slice(1));if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile())return send(res,404,'Not found','text/plain; charset=utf-8');return serve(file,res)});
function serve(file,res){const ext=path.extname(file).toLowerCase();res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res)}
server.listen(PORT, HOST, ()=>console.log(`SMG Plus server running at http://${HOST}:${PORT}`));
