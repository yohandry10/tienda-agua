import { database, orderSchema, calculateItems, sameOrigin, identity, teamRole } from "@/lib/orders";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 try{
  const input=await request.json();
  if(!sameOrigin(request))return Response.json({error:"Origen no permitido."},{status:403});
  const data=orderSchema.parse(input);
  const user=await identity();
  const channel=data.channel??"web";
  if(channel==="vendedor"&&!await teamRole(user))return Response.json({error:"Se requiere acceso del equipo."},{status:403});
  const items=calculateItems(data.items); const total=items.reduce((s,i)=>s+i.price*i.qty,0);
  const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify({items,customer:data.customer,user:user?.userId??null,channel}))))).map(v=>v.toString(16).padStart(2,"0")).join("");
  const db=database();
  const previous=await db.prepare("SELECT id, total, fingerprint FROM orders WHERE request_id = ?").bind(data.requestId).first<{id:string;total:number;fingerprint:string}>();
  if(previous){if(previous.fingerprint!==fingerprint)return Response.json({error:"Este intento ya corresponde a otro pedido. Abre un pedido nuevo."},{status:409});return Response.json({id:previous.id,total:previous.total});}
  const id="VA-"+crypto.randomUUID().slice(0,8).toUpperCase();const now=new Date().toISOString();const c=data.customer;
  await db.prepare("INSERT INTO orders (id, request_id, fingerprint, user_id, creator_id, name, phone, address, district, kind, payment, notes, items, total, status, channel, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(request_id) DO NOTHING").bind(id,data.requestId,fingerprint,channel==="web"?user?.userId??null:null,user?.userId??null,c.name,c.phone,c.address,c.district,c.kind,c.payment,c.notes,JSON.stringify(items),total,"pendiente",channel,now,now).run();
  const saved=await db.prepare("SELECT id, total, fingerprint FROM orders WHERE request_id = ?").bind(data.requestId).first<{id:string;total:number;fingerprint:string}>();
  if(!saved||saved.fingerprint!==fingerprint)return Response.json({error:"No se pudo registrar este intento."},{status:409});
  return Response.json({id:saved.id,total:saved.total},{status:201});
 }catch(error){
  if(error instanceof Error&&(error.name==="ZodError"||error.message.startsWith("Revisa")))return Response.json({error:"Revisa tus datos, la cobertura de entrega y el mínimo de 3 packs."},{status:400});
  console.error("Order save failed",error instanceof Error?error.message:"unknown");
  return Response.json({error:"No pudimos registrar tu pedido. Tus datos siguen aquí; vuelve a intentarlo."},{status:503});
 }
}
