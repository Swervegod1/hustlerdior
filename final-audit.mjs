import{readFile,writeFile}from'node:fs/promises';
const file=new URL('./final-audit-v2.json',import.meta.url);
try{await readFile(file);}catch(e){if(e.code!=='ENOENT')throw e;
const output={contributionFloor:Number(process.env.MIN_CONTRIBUTION_RATE??'0.35'),estimates:[]};
for(const variant of [5497843818,5497843821]){for(let attempt=0;attempt<3;attempt++){
const r=await fetch('https://api.printful.com/orders/estimate-costs',{method:'POST',headers:{Authorization:'Bearer '+(process.env.PRINTFUL_API_TOKEN||process.env.PRINTFUL_API_KEY),'X-PF-Store-Id':process.env.PRINTFUL_STORE_ID,'Content-Type':'application/json'},body:JSON.stringify({recipient:{address1:'100 Example Street',city:'Virginia Beach',country_code:'US',state_code:'VA',zip:'23456'},items:[{sync_variant_id:variant,quantity:1}],retail_costs:{currency:'USD'}}),signal:AbortSignal.timeout(25000)});
const b=await r.json();
if((r.status===429||r.status>=500)&&attempt<2){await new Promise(r=>setTimeout(r,30000));continue;}
output.estimates.push({variantId:variant,status:r.status,message:r.ok?'Estimate succeeded':String(b.error?.message??b.result??b.message??'Provider error').slice(0,400)});break;
}}
await writeFile(file,JSON.stringify(output));}