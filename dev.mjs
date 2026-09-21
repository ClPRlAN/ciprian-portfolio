import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath, ['build.mjs'], { stdio:'inherit' });
const root=path.resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.pdf':'application/pdf','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  let url=decodeURIComponent(req.url.split('?')[0]);
  let file=path.join(root,url);
  if (url.endsWith('/')) file=path.join(file,'index.html');
  else if (!path.extname(file)) file=path.join(file,'index.html');
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);return res.end('Not found');}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);
  });
}).listen(4173,()=>console.log('Preview: http://localhost:4173'));
