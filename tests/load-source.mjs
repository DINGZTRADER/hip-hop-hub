import fs from 'node:fs';
import path from 'node:path';
import Module, {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
export function loadSource(file, aliases={}) {
 const cache=new Map();
 function load(filename) {
  filename=path.resolve(filename);if(cache.has(filename)) return cache.get(filename).exports;
  const loaded=new Module(filename);cache.set(filename,loaded);
  loaded.require=id=>{if(Object.hasOwn(aliases,id)) return aliases[id]; if(id.startsWith('@/')||id.startsWith('.')) {const base=id.startsWith('@/')?path.resolve('src',id.slice(2)):path.resolve(path.dirname(filename),id);for(const ext of ['', '.ts','.tsx','/index.ts']) if(fs.existsSync(base+ext)&&fs.statSync(base+ext).isFile()) return load(base+ext);}return require(id);};
  loaded._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);return loaded.exports;
 }return load(file);
}
