const {app,BrowserWindow,Menu,Tray,nativeImage,shell}=require('electron');
const {fork}=require('child_process');
const net=require('net');
const path=require('path');
const fs=require('fs');
const {autoUpdater}=require('electron-updater');
const isDev=!app.isPackaged;
const serverScript=path.join(__dirname,'..','server.js');
let serverProcess=null,mainWindow=null,tray=null,serverPort=null,quitting=false;
function getDataDir(){const dir=path.join(app.getPath('userData'),'data');fs.mkdirSync(dir,{recursive:true});const f=path.join(dir,'scenes.json');if(!fs.existsSync(f)){const seed=path.join(process.resourcesPath,'resources','scenes.json');if(fs.existsSync(seed))fs.copyFileSync(seed,f);else fs.writeFileSync(f,'{}','utf8');}return dir;}
function getFreePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
function startServer(){return getFreePort().then(port=>new Promise((resolve,reject)=>{serverPort=port;serverProcess=fork(serverScript,[],{env:{...process.env,PORT:String(port),HOST:'127.0.0.1',SMG_DATA_DIR:getDataDir()},stdio:['ignore','pipe','pipe','ipc']});let settled=false;const timer=setTimeout(()=>{if(!settled){settled=true;resolve();}},8000);serverProcess.stdout.on('data',d=>{if(isDev)process.stdout.write('[SMG Server] '+d);if(!settled&&String(d).includes('running at')){settled=true;clearTimeout(timer);resolve();}});serverProcess.stderr.on('data',d=>process.stderr.write('[SMG Server] '+d));serverProcess.once('exit',code=>{if(!settled){settled=true;clearTimeout(timer);reject(new Error('Server exited: '+code));}});}));}
function stopServer(){if(serverProcess){try{serverProcess.kill();}catch{}serverProcess=null;}}
function createTray(){tray=new Tray(nativeImage.createEmpty());tray.setToolTip('SMG Plus');tray.setContextMenu(Menu.buildFromTemplate([{label:'باز کردن SMG Plus',click:()=>{mainWindow?.show();mainWindow?.focus();}},{type:'separator'},{label:'بررسی به‌روزرسانی',click:()=>checkForUpdates(true)},{type:'separator'},{label:'خروج کامل',click:()=>{quitting=true;app.quit();}}]));tray.on('double-click',()=>{mainWindow?.show();mainWindow?.focus();});}
function createWindow(){mainWindow=new BrowserWindow({width:1440,height:900,minWidth:1100,minHeight:700,backgroundColor:'#0b0f17',autoHideMenuBar:true,title:'SMG Plus',webPreferences:{contextIsolation:true,sandbox:true,devTools:isDev}});mainWindow.loadURL(`http://127.0.0.1:${serverPort}/`);mainWindow.webContents.setWindowOpenHandler(({url})=>{if(/^https?:\/\//i.test(url))shell.openExternal(url);return{action:'deny'};});mainWindow.on('close',e=>{if(!quitting){e.preventDefault();mainWindow.hide();}});mainWindow.on('closed',()=>{mainWindow=null;});}
async function checkForUpdates(manual=false){if(isDev){if(manual)mainWindow?.webContents.executeJavaScript("alert('بررسی به‌روزرسانی در نسخه توسعه غیرفعال است.')");return;}try{autoUpdater.autoDownload=true;autoUpdater.autoInstallOnAppQuit=true;await autoUpdater.checkForUpdates();}catch(e){if(manual)mainWindow?.webContents.executeJavaScript(`alert(${JSON.stringify('بررسی به‌روزرسانی انجام نشد.\n'+e.message)})`);}}
autoUpdater.on('update-downloaded',()=>{if(mainWindow){mainWindow.webContents.executeJavaScript("confirm('نسخه جدید SMG Plus آماده نصب است. اکنون برنامه راه‌اندازی مجدد شود؟')").then(ok=>{if(ok)autoUpdater.quitAndInstall();});}});
app.whenReady().then(async()=>{await startServer();createWindow();createTray();if(!isDev)setTimeout(()=>checkForUpdates(false),5000);app.on('activate',()=>{if(!mainWindow)createWindow();else mainWindow.show();});});
app.on('before-quit',()=>{quitting=true;stopServer();});
app.on('window-all-closed',e=>e.preventDefault());
