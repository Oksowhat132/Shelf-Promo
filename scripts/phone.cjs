const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const QRCode = require('qrcode');
const root=path.resolve(__dirname,'..');
process.chdir(root);
let server;
let tunnel;
async function run() {
 try {await fetch('http://127.0.0.1:3000');}
 catch {server=spawn(process.execPath,['server.cjs'],{stdio:'inherit',windowsHide:true});await new Promise(r=>setTimeout(r,1000));}
 const exe=path.join(root,'.tools','cloudflared.exe');
 if(!fs.existsSync(exe)) throw new Error('Missing .tools/cloudflared.exe. Download cloudflared for Windows first.');
 tunnel=spawn(exe,['tunnel','--url','http://127.0.0.1:3000','--no-autoupdate'],{windowsHide:true});
 let output='';let published=false;
 tunnel.stderr.on('data',async chunk=>{
  output+=chunk.toString();
  const match=output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if(match&&!published){
   published=true;const url=match[0];
   fs.writeFileSync('public/phone.json',JSON.stringify({url}));
   await QRCode.toFile('public/phone-qr.png',url,{width:300,margin:2});
   console.log('\nPhone: '+url+'\nComputer / QR code: http://localhost:3000/target.html\nKeep this terminal open. Ctrl+C stops the phone link.');
  }
 });
 tunnel.on('error',console.error);
 tunnel.on('exit',code=>{console.log('Phone tunnel stopped:',code);server?.kill();});
}
process.on('SIGINT',()=>{tunnel?.kill();server?.kill();process.exit();});
run().catch(error=>{console.error(error.message);server?.kill();process.exitCode=1;});
