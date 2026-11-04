import {readFile,writeFile,open,unlink} from 'node:fs/promises';
const base = new URL('./',import.meta.url);
try { await readFile(new URL('margin-done.json',base)); console.log('Margin audit already attempted'); }
catch(e) {
 if(e.code!=='ENOENT')throw e;
 const lock=await open(new URL('margin.lock',base),'wx').catch(()=>null);
 if(lock) {
  try { if(process.env.PRINTFUL_STORE_ID!=='18747907')throw Error('Store mismatch'); await import('./margin-audit.mjs'); }
  catch { process.exitCode=1; console.error('Margin audit stopped; inspect checkpoint'); }
  finally { await writeFile(new URL('margin-done.json',base),JSON.stringify({at:new Date().toISOString(),exitCode:process.exitCode??0})); await lock.close(); await unlink(new URL('margin.lock',base));}
 }
}