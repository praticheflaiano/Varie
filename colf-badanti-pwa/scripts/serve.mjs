import http from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,dirname,extname,sep} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json",".svg":"image/svg+xml",".md":"text/plain; charset=utf-8"};
const server=http.createServer(async(req,res)=>{
 try{
  let p=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  if(p==="/")p="/index.html";
  const file=resolve(root,"."+p);
  if(!file.startsWith(root+sep)||!(await stat(file)).isFile()){res.writeHead(404);res.end("File non trovato");return;}
  res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream","Cache-Control":"no-cache","X-Content-Type-Options":"nosniff"});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end("File non trovato");}
});
server.listen(Number(process.env.PORT||4173),"0.0.0.0",()=>console.log("Flaiano Domestico: http://localhost:"+(process.env.PORT||4173)));
