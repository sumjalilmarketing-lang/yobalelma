import {readFile} from "node:fs/promises";

const lock=JSON.parse(await readFile(new URL("../package-lock.json",import.meta.url),"utf8"));
const dependencies={};
for(const [path,entry] of Object.entries(lock.packages??{})){
  if(!path.startsWith("node_modules/")||!entry?.version)continue;
  const name=path.slice("node_modules/".length);
  if(name.includes("/node_modules/"))continue;
  dependencies[name]=[entry.version];
}
const response=await fetch("https://registry.npmjs.org/-/npm/v1/security/advisories/bulk",{method:"POST",headers:{"content-type":"application/json","user-agent":"yobalelma-security-audit"},body:JSON.stringify(dependencies),signal:AbortSignal.timeout(30_000)});
if(!response.ok)throw new Error(`Dependency audit unavailable (${response.status}).`);
const advisories=await response.json();
const findings=Object.entries(advisories).flatMap(([dependency,items])=>(Array.isArray(items)?items:[]).map((item)=>({dependency,severity:item.severity??"unknown",title:item.title??"Advisory",url:item.url??null,vulnerableVersions:item.vulnerable_versions??null}))).sort((a,b)=>severity(b.severity)-severity(a.severity));
const summary={critical:0,high:0,moderate:0,low:0,unknown:0};
for(const finding of findings)summary[finding.severity in summary?finding.severity:"unknown"]+=1;
console.log(JSON.stringify({source:"npm advisory bulk API",packagesChecked:Object.keys(dependencies).length,summary,findings},null,2));
if(summary.critical||summary.high)process.exitCode=1;

function severity(value){return {critical:5,high:4,moderate:3,low:2,info:1}[value]??0;}
