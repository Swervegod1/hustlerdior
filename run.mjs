import {gunzipSync} from 'node:zlib';
import {open,readFile,writeFile,unlink} from 'node:fs/promises';
const base=new URL('./',import.meta.url);
async function run(){
 try { await readFile(new URL('done-v2.json',base)); console.log('One-time import already attempted; no changes.'); return; } catch(e){if(e.code!=='ENOENT')throw e;}
 const lock=await open(new URL('run-v2.lock',base),'wx').catch(e=>{if(e.code==='EEXIST')return null;throw e;});
 if(!lock){console.log('Import already running');return;}
 try{
  if(process.env.PRINTFUL_STORE_ID!=='18747907')throw new Error('Store mismatch');
  await writeFile(new URL('catalog.json',base),gunzipSync(await readFile(new URL('catalog.json.gz',base))));
  process.argv.push('--catalog',new URL('catalog.json',base).pathname,'--apply','--account','acct_1T2CVABQlp4SmhNo','--mode','live','--output',new URL('manifest.json',base).pathname);
  await writeFile(new URL('catalog-sync.mjs',base),gunzipSync(await readFile(new URL('catalog-sync.mjs.gz',base))));
  await import('./catalog-sync.mjs');
  await writeFile(new URL('done-v2.json',base),JSON.stringify({finishedAt:new Date().toISOString(),exitCode:process.exitCode??0}));
 }catch{console.error('Import stopped; inspect sanitized report.');process.exitCode=1;await writeFile(new URL('done-v2.json',base),JSON.stringify({finishedAt:new Date().toISOString(),exitCode:1}));}
 finally{await lock.close();await unlink(new URL('run-v2.lock',base));}
}
await run().catch(()=>{console.error('Import startup failed; secrets omitted.');process.exitCode=1;});