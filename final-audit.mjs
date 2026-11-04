import{readFile,writeFile,open,unlink}from'node:fs/promises';
const base=new URL('./',import.meta.url);
async function run(){
try{await readFile(new URL('final-audit.json',base));return;}catch(e){if(e.code!=='ENOENT')throw e;}
const lock=await open(new URL('final-audit.lock',base),'wx').catch(()=>null);if(!lock)return;
try{
if(process.env.PRINTFUL_STORE_ID!=='18747907')throw Error('Store mismatch');
const output={contributionFloor:Number(process.env.MIN_CONTRIBUTION_RATE??'0.35'),estimates:[]};
for(const variant of [5497843818,5497843821]){
const r=await fetch('https://api.printful.com/orders/estimate-costs',{method:'POST',headers:{Authorization:'Bearer '+(process.env.PRINTFUL_API_TOKEN||process.env.PRINTFUL_API_KEY),'X-PF-Store-Id':process.env.PRINTFUL_STORE_ID,'Content-Type':'application/json'},body:JSON.stringify({recipient:{address1:'100 Example Street',city:'Virginia Beach',country_code:'US',state_code:'VA',zip:'23456'},items:[{sync_variant_id:variant,quantity:1}],retail_costs:{currency:'USD'}}),signal:AbortSignal.timeout(25000)});
const b=await r.json();output.estimates.push({variantId:variant,status:r.status,message:r.ok?'Estimate succeeded':String(b.error?.message??b.result??b.message??'Unspecified provider error').replace(/https?:\x2f\x2f\S+/g,'[URL omitted]').slice(0,400)});
}
await writeFile(new URL('final-audit.json',base),JSON.stringify(output));
}finally{await lock.close();await unlink(new URL('final-audit.lock',base));}}
await run().catch(()=>{console.error('Audit stopped; credentials omitted.');process.exitCode=1;});