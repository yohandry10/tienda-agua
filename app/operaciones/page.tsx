import { requireChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { teamRole } from "@/lib/orders";
import Operations from "@/components/operations";
export const dynamic="force-dynamic";
export default async function TeamPage(){
 const user=await requireChatGPTUser("/operaciones");let role:string|null=null;let unavailable=false;
 try{role=await teamRole(user);}catch{unavailable=true;}
 return <main className="dashboard"><header className="dashboard-header"><a href="/"><img className="brand-logo" src="/assets/vaiyo-logo.png" alt="VAIYO"/></a><nav className="dashboard-nav"><a href="/">Tienda</a><a href="/cuenta">Mi cuenta</a><a href={chatGPTSignOutPath()}>Cerrar sesión</a></nav></header>{role?<Operations role={role}/>:<div className="dashboard-empty"><span className="eyebrow centered">ACCESO DEL EQUIPO</span><h2>{unavailable?"No pudimos cargar tu acceso.":"Esta cuenta aún no pertenece al equipo."}</h2><p>{unavailable?"Vuelve a intentarlo en un momento.":"Pide a administración que añada el correo de tu cuenta como vendedor o logística."}</p><a className="button button-primary" href="/">Volver a VAIYO</a></div>}</main>
}

