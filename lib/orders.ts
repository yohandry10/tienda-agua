import { env } from "cloudflare:workers";
import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { findProduct, districts } from "@/lib/catalog";
import { z } from "zod";
export const statuses=["pendiente","confirmado","en_ruta","entregado","cancelado"] as const;
export type Order = { id:string;name:string;phone:string;address:string;district:string;kind:string;payment:string;notes:string;items:string;total:number;status:string;channel:string;created_at:string;creator_id:string|null };
export function database() { if(!env.DB)throw new Error("Servicio de pedidos temporalmente no disponible."); return env.DB; }
export async function teamRole(user:ChatGPTUser|null):Promise<string|null> {
 if(!user)return null;
 const config=env as unknown as {VAIYO_ADMIN_EMAILS?:string};
 const admins=(config.VAIYO_ADMIN_EMAILS??"").split(",").map(v=>v.trim().toLowerCase()).filter(Boolean);
 if(admins.includes(user.email.toLowerCase()))return "admin";
 if(process.env.NODE_ENV==="development"&&user.email==="seedy@sites.test")return "admin";
 const row=await database().prepare("SELECT role FROM team WHERE email = ?").bind(user.email.toLowerCase()).first<{role:string}>();
 return row?.role??null;
}
export const orderSchema=z.object({
 requestId:z.string().uuid(),
 channel:z.enum(["web","vendedor"]).optional(),
 items:z.array(z.object({id:z.string(),qty:z.number().int().min(1).max(99)}).strict()).min(1).max(4),
 customer:z.object({
 name:z.string().trim().min(2).max(80),
 phone:z.string().trim().max(18).regex(/^[+]?[0-9 ()-]{9,18}$/).refine(v=>v.replace(/\D/g,"").length>=9),
 address:z.string().trim().min(8).max(180),district:z.enum(districts),
 kind:z.enum(["Hogar","Empresa"]),payment:z.enum(["Efectivo al recibir","Yape o Plin","Transferencia"]),
 notes:z.string().trim().max(250).default("")
 }).strict()
}).strict();
export function calculateItems(items:{id:string;qty:number}[]) {
 const seen=new Set<string>();
 return items.map(i=>{
  const p=findProduct(i.id); if(!p||seen.has(i.id)||i.qty<p.min)throw new Error("Revisa los productos y el pedido mínimo de 3 packs.");
  seen.add(i.id); return {id:p.id,name:p.name,qty:i.qty,price:p.price};
 });
}
export function sameOrigin(request:Request) {
 const origin=request.headers.get("origin");
 return !origin || origin===new URL(request.url).origin;
}
export async function identity(){return getChatGPTUser();}
