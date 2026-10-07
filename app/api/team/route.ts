import { database, identity, teamRole, sameOrigin, statuses } from "@/lib/orders";
import { z } from "zod";
export const dynamic="force-dynamic";
export async function GET(){
 const user=await identity();if(!user)return Response.json({error:"Inicia sesión."},{status:401});
 try{const role=await teamRole(user);if(!role)return Response.json({error:"Sin acceso del equipo."},{status:403});
 const db=database();
 const orders=role==="vendedor"?await db.prepare("SELECT * FROM orders WHERE creator_id = ? ORDER BY created_at DESC LIMIT 100").bind(user.userId).all():await db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100").all();
 const members=role==="admin"?(await db.prepare("SELECT email, role FROM team ORDER BY email").all()).results:[];
 return Response.json({orders:orders.results,role,members});}catch{ return Response.json({error:"No pudimos cargar los pedidos."},{status:503});}
}
export async function PATCH(request:Request){
 try{
 const input=await request.json();
 if(!sameOrigin(request))return Response.json({error:"Origen no permitido."},{status:403});
 const user=await identity();if(!user)return Response.json({error:"Inicia sesión."},{status:401});
 const role=await teamRole(user);if(!["admin","logistica"].includes(role??""))return Response.json({error:"Solo logística puede cambiar el estado."},{status:403});
 const data=z.object({id:z.string().regex(/^VA-[A-F0-9]{8}$/),status:z.enum(statuses)}).strict().parse(input);
 const result=await database().prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").bind(data.status,new Date().toISOString(),data.id).run();
 if(!result.meta.changes)return Response.json({error:"Pedido no encontrado."},{status:404});return Response.json({ok:true});
 }catch{return Response.json({error:"No pudimos actualizar el pedido."},{status:400});}
}
export async function POST(request:Request){
 try{
 const input=await request.json();
 if(!sameOrigin(request))return Response.json({error:"Origen no permitido."},{status:403});
 const user=await identity();if(!user)return Response.json({error:"Inicia sesión."},{status:401});
 if(await teamRole(user)!=="admin")return Response.json({error:"Solo administración puede añadir miembros."},{status:403});
 const data=z.object({email:z.string().trim().email().max(150),role:z.enum(["vendedor","logistica"])}).strict().parse(input);
 await database().prepare("INSERT INTO team (email, role, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET role=excluded.role").bind(data.email.toLowerCase(),data.role,new Date().toISOString()).run();
 return Response.json({ok:true});}catch{return Response.json({error:"Revisa el correo del miembro."},{status:400});}
}
