import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import { spawnSync } from "node:child_process";
const base="http://127.0.0.1:5181";
// CHECK_MODE=PRODUCTION runs the same cases against a local Worker configured with a fake production key (CHECK_VARS).
const mode=process.env.CHECK_MODE??"TEST";
const vars=await readFile(process.env.CHECK_VARS??new URL("../.dev.vars",import.meta.url),"utf8");
const secret=JSON.parse(vars.match(new RegExp("^IZIPAY_"+mode+"_KEY=(.+)$","m"))[1]);
let checks=0;
function equal(actual,expected){assert.equal(actual,expected);checks++;}
const customer={name:"QA Izipay",phone:"999999999",address:"Dirección ficticia de prueba 123",district:"Miraflores",kind:"Hogar",payment:"Pago online (Izipay)",email:"qa-izipay@example.test",notes:"PRUEBA SIN ENTREGA"};
const payload=()=>({requestId:crypto.randomUUID(),items:[{id:"bidon",qty:1}],customer});
async function call(path,body,extra={}){const response=await fetch(base+path,{method:body?"POST":"GET",headers:{"Content-Type":"application/json",...extra},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};}
function sign(fields){return createHmac("sha256",secret).update(Object.keys(fields).filter(k=>k.startsWith("vads_")).sort().map(k=>fields[k]).join("+")+"+"+secret).digest("base64");}
function result(payment,status="CAPTURED",extras={}){const fields={...payment.fields,vads_trans_status:status,vads_result:"00",vads_operation_type:"DEBIT",vads_url_check_src:"PAY",vads_trans_uuid:payment.token,...extras};fields.signature=sign(fields);return fields;}
async function ipn(fields){return fetch(base+"/api/payments/ipn",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(fields)});}
const config=await call("/api/payments/config");equal(config.data.mode,mode);equal(config.data.available,true);
equal((await call("/api/payments/prepare",payload(),{origin:"https://evil.example"})).status,403);
equal((await call("/api/payments/prepare",{...payload(),items:[{id:"pack",qty:1}]})).status,400);
const missing=payload();delete missing.customer.email;equal((await call("/api/payments/prepare",missing)).status,400);customer.email="qa-izipay@example.test";
const request=payload();const [first,repeat]=await Promise.all([call("/api/payments/prepare",request),call("/api/payments/prepare",request)]);
equal(first.status,200);equal(repeat.status,200);equal(first.data.id,repeat.data.id);equal(first.data.token,repeat.data.token);equal(first.data.fields.vads_amount,"3000");equal(first.data.fields.vads_currency,"604");equal(first.data.fields.signature,sign(first.data.fields));
equal(first.data.fields.vads_ctx_mode,mode);equal(first.data.fields.vads_order_info,"1 x Bidón de 20 L");equal(first.data.fields.vads_order_info2,"Hogar · Distrito: Miraflores");equal(first.data.fields.vads_order_info3,"PRUEBA SIN ENTREGA");equal(first.data.fields.vads_cust_district,"Miraflores");equal(first.data.fields.vads_cust_address2,"Distrito: Miraflores");
const receipt=(await call("/api/payments/status?token="+first.data.token)).data;
assert.deepEqual(receipt.items,[{name:"Bidón de 20 L",qty:1,price:3000}]);checks++;
assert.deepEqual(Object.keys(receipt).sort(),["id","total","mode","state","items"].sort());checks++;
equal((await ipn({...result(first.data),signature:"forged"})).status,400);
equal((await ipn(result(first.data,"CAPTURED",{vads_amount:"1"}))).status,400);
equal((await ipn(result(first.data,"CAPTURED",{vads_currency:"840"}))).status,400);
equal((await ipn(result(first.data,"CAPTURED",{vads_site_id:"00000000"}))).status,400);
equal((await ipn(result(first.data,"CAPTURED",{vads_ctx_mode:mode==="TEST"?"PRODUCTION":"TEST"}))).status,400);
equal((await ipn(result(first.data,"CAPTURED",{vads_operation_type:"CREDIT"}))).status,200);equal((await call("/api/payments/status?token="+first.data.token)).data.state,"pendiente");
equal((await ipn({...result(first.data,"CAPTURED",{vads_operation_type:"CREDIT"}),signature:"forged"})).status,400);
equal((await ipn(result(first.data,"CAPTURED",{vads_url_check_src:""}))).status,400);
equal((await ipn(result(first.data,"AUTHORISED",{vads_result:"0"}))).status,400);
equal((await ipn(result(first.data,"AUTHORISED",{vads_result:"05"}))).status,400);
equal((await ipn(result(first.data,"ACCEPTED"))).status,200);equal((await call("/api/payments/status?token="+first.data.token)).data.state,"pendiente");
const browserReturn=await fetch(base+"/api/payments/return",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(result(first.data)),redirect:"manual"});equal(browserReturn.status,303);equal((await call("/api/payments/status?token="+first.data.token)).data.state,"pendiente");
equal((await ipn(result(first.data,"AUTHORISED"))).status,200);equal((await call("/api/payments/status?token="+first.data.token)).data.state,"autorizado");
equal((await call("/api/payments/retry",{token:first.data.token})).data.redirect,"/pago?token="+first.data.token);
equal((await ipn(result(first.data,"CAPTURED",{vads_url_check_src:"RETRY"}))).status,200);equal((await ipn(result(first.data))).status,200);equal((await call("/api/payments/status?token="+first.data.token)).data.state,"pagado");
equal((await call("/api/payments/prepare",request)).data.redirect,"/pago?token="+first.data.token);
equal((await ipn(result(first.data,"REFUSED"))).status,200);equal((await call("/api/payments/status?token="+first.data.token)).data.state,"pagado");
equal((await ipn(result(first.data,"ABANDONED"))).status,200);equal((await call("/api/payments/status?token="+first.data.token)).data.state,"pagado");
equal((await call("/api/payments/retry",{token:first.data.token})).data.redirect,"/pago?token="+first.data.token);
const rejected=(await call("/api/payments/prepare",payload())).data;
equal((await ipn(result(rejected,"REFUSED",{vads_result:"05"}))).status,200);equal((await call("/api/payments/status?token="+rejected.token)).data.state,"rechazado");
const [retried,concurrentRetry]=await Promise.all([call("/api/payments/retry",{token:rejected.token}),call("/api/payments/retry",{token:rejected.token})]);
equal(retried.data.id,rejected.id);assert.notEqual(retried.data.token,rejected.token);checks++;
equal(concurrentRetry.status,200);equal(concurrentRetry.data.id,rejected.id);equal(concurrentRetry.data.token,retried.data.token);
equal((await ipn(result(retried.data))).status,200);equal((await ipn(result(rejected,"ABANDONED"))).status,200);
const abandoned=(await call("/api/payments/prepare",payload())).data;
equal((await ipn(result(abandoned,"ABANDONED",{vads_operation_type:"CREDIT"}))).status,200);equal((await call("/api/payments/status?token="+abandoned.token)).data.state,"pendiente");
equal((await ipn(result(abandoned,"CAPTURED",{vads_operation_type:""}))).status,400);
equal((await ipn(result(abandoned,"ABANDONED",{vads_operation_type:""}))).status,200);equal((await call("/api/payments/status?token="+abandoned.token)).data.state,"cancelado");
const duplicate=new URLSearchParams(result(abandoned)).toString()+"&vads_amount=1";equal((await fetch(base+"/api/payments/ipn",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:duplicate})).status,400);
equal((await call("/api/payments/status?token="+crypto.randomUUID())).status,404);
const cancelled=(await call("/api/payments/prepare",payload())).data;
equal((await ipn(result(cancelled,"AUTHORISED",{vads_url_check_src:"RETRY"}))).status,200);
equal((await call("/api/payments/status?token="+cancelled.token)).data.state,"autorizado");
equal((await ipn(result(cancelled,"CAPTURED",{vads_url_check_src:"BATCH"}))).status,200);
equal((await ipn(result(cancelled,"CANCELLED",{vads_result:"17",vads_url_check_src:"RETRY"}))).status,200);
equal((await call("/api/payments/status?token="+cancelled.token)).data.state,"cancelado");
if(mode==="PRODUCTION"){
 // Paid PRODUCTION orders are confirmed for delivery; a later cancellation returns the order to pending.
 const sql="SELECT id,status,payment_status FROM orders WHERE id IN ('"+[first.data.id,retried.data.id,cancelled.id].join("','")+"')";
 const out=spawnSync(process.execPath,["node_modules/wrangler/bin/wrangler.js","d1","execute","DB","--local","--config","dist/server/wrangler.json","--persist-to",process.env.CHECK_PERSIST,"--json","--command",sql],{encoding:"utf8"});
 const rows=Object.fromEntries(JSON.parse(out.stdout)[0].results.map(row=>[row.id,row]));
 equal(rows[first.data.id].status,"confirmado");equal(rows[first.data.id].payment_status,"pagado");
 equal(rows[retried.data.id].status,"confirmado");
 equal(rows[cancelled.id].status,"pendiente");equal(rows[cancelled.id].payment_status,"cancelado");
}
console.log(JSON.stringify({result:"PASS",checks,orders:[first.data.id,rejected.id,abandoned.id],mode}));
