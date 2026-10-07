import { requireChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { database, type Order } from "@/lib/orders";
import { money } from "@/lib/catalog";
import { ArrowUpRight } from "lucide-react";
export const dynamic="force-dynamic";
export default async function Account(){
 const user=await requireChatGPTUser("/cuenta");
 let orders:Order[]=[];let unavailable=false;
 try{orders=(await database().prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").bind(user.userId).all<Order>()).results;}catch{unavailable=true;}
 return <main className="dashboard"><header className="dashboard-header"><a href="/"><img className="brand-logo" src="/assets/vaiyo-logo.png" alt="VAIYO"/></a><nav className="dashboard-nav"><a href="/">Volver a la tienda</a><a href="/operaciones">Acceso del equipo</a><a href={chatGPTSignOutPath()}>Cerrar sesión</a></nav></header><div className="dashboard-heading"><span className="eyebrow">TU CUENTA VAIYO</span><h1>Hola, {user.fullName?.split(" ")[0]??"bienvenido"}.</h1><p>Aquí están los pedidos que registraste con esta cuenta.</p></div>{orders.length?<div className="orders-table"><table><thead><tr><th>Pedido</th><th>Fecha</th><th>Entrega</th><th>Total</th><th>Estado</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><b>{o.id}</b><small>{JSON.parse(o.items).map((i:{name:string;qty:number})=>i.qty+" × "+i.name).join(", ")}</small></td><td>{new Date(o.created_at).toLocaleDateString("es-PE",{timeZone:"America/Lima"})}</td><td>{o.district}<small>{o.address}</small></td><td>{money(o.total)}</td><td><span className="status-tag" data-status={o.status}>{o.status.replace("_"," ")}</span></td></tr>)}</tbody></table></div>:<div className="dashboard-empty"><h2>{unavailable?"Tus pedidos no están disponibles en este momento.":"Tu próximo pedido empieza aquí."}</h2><p>{unavailable?"Vuelve a intentarlo en un momento.":"Elige tu presentación favorita y registra tu primer pedido."}</p><a className="button button-primary" href="/">Explorar VAIYO <ArrowUpRight size={18}/></a></div>}</main>
}

