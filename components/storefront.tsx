"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, ArrowRight, Check, ShoppingBag, UserRound, Menu, Plus, Minus, Trash2, Truck, Droplets, Recycle, Heart, Building2, MapPin, MessageCircle, PackageCheck, ChevronRight, ShieldCheck } from "lucide-react";
import SiteFooter from "@/components/site-footer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { products, districts, money, findProduct, whatsapp, type CartItem, type ProductId } from "@/lib/catalog";

const benefits = [
 { icon: Truck, title: "A tu puerta, sin costo extra", text: "Delivery incluido en nuestros 11 distritos de Lima." },
 { icon: Droplets, title: "Pureza para tu día a día", text: "Agua alcalina y ozonizada, en cada presentación." },
 { icon: Recycle, title: "Recarga. Reutiliza. Repite.", text: "Dale una nueva vida a tu bidón retornable de 20 L." },
 { icon: Heart, title: "Para los que más quieres", text: "Una opción práctica para tu hogar y tu equipo." },
];
const faq = [
 ["¿Cuánto cuesta el bidón?", "La primera compra cuesta S/ 30 e incluye el bidón de 20 litros con caño. La recarga cuesta S/ 16. El delivery está incluido dentro de nuestra cobertura."],
 ["¿Cuántas botellas trae el pack?", "Cada pack trae 15 botellas de 500 ml. El pedido mínimo es de 3 packs, a S/ 30 cada uno."],
 ["¿Cómo coordinamos la entrega?", "Registra tu pedido con tu dirección y distrito. Nuestro equipo te contactará por WhatsApp para coordinar la fecha y el horario."],
 ["¿Cómo puedo pagar?", "Puedes pagar con tarjeta, Yape o Plin mediante nuestra pasarela de pago. También puedes coordinar efectivo al recibir o transferencia con nuestro equipo por WhatsApp."],
 ["¿También atienden a empresas?", "Sí. Atendemos hogares, oficinas y negocios. Escríbenos para coordinar cantidades y entregas para tu empresa."],
];
function Wave({className = ""}:{className?:string}) { return <svg className={"wave " + className} viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0,45 C160,135 245,-10 430,55 S700,135 880,55 S1120,25 1260,70 S1370,70 1440,45 L1440,120 L0,120 Z" fill="currentColor"/></svg>; }
function DistrictSelect({value,onChange,label}:{value:string;onChange:(v:string)=>void;label:string}) { return <Select value={value} onValueChange={onChange}><SelectTrigger className="district-select" aria-label={label}><SelectValue placeholder="Elige tu distrito" /></SelectTrigger><SelectContent position="popper">{districts.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>; }

export default function Storefront() {
 const [cart,setCart] = useState<CartItem[]>([]);
 const [cartOpen,setCartOpen] = useState(false);
 const [menuOpen,setMenuOpen] = useState(false);
 const [footerInView,setFooterInView] = useState(false);
 const [checkout,setCheckout] = useState(false);
 const [district,setDistrict] = useState("");
 const [deliveryDistrict,setDeliveryDistrict] = useState("");
 const [variant,setVariant] = useState<ProductId>("bidon");
 const [busy,setBusy] = useState(false);
 const [error,setError] = useState("");
 const [receipt,setReceipt] = useState<{id:string;total:number;message:string}|null>(null);
 const [draft,setDraft] = useState({name:"",phone:"",address:"",payment:"Efectivo al recibir",notes:"",kind:"Hogar"});
 const idempotency = useRef("");
 useEffect(()=>{idempotency.current=""},[draft,district]);
 const cartRef = useRef(cart); cartRef.current = cart;
 const count = cart.reduce((n,i)=>n+i.qty,0);
 const total = cart.reduce((n,i)=>n+(findProduct(i.id)?.price??0)*i.qty,0);
 function add(id: ProductId, quantity?:number) {
  const p=findProduct(id); if (!p) throw new Error("Producto no disponible.");
  const qty=quantity??p.min;
  if (!Number.isInteger(qty)||qty<p.min||qty>99) throw new Error("Cantidad inválida.");
  setCart(c=>{const current=c.find(i=>i.id===id); if ((current?.qty??0)+qty>99) return c; return current?c.map(i=>i.id===id?{...i,qty:i.qty+qty}:i):[...c,{id,qty}];});
  idempotency.current=""; setReceipt(null); setCartOpen(true);
 }
 function change(id:ProductId,delta:number) { const p=findProduct(id)!; setCart(c=>c.map(i=>i.id===id?{...i,qty:Math.max(p.min,Math.min(99,i.qty+delta))}:i)); idempotency.current=""; }
 useEffect(()=>{
  const observer = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("is-visible");observer.unobserve(e.target)}}),{threshold:.1});
  document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
  return ()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const footer=document.querySelector(".brand-footer");
  if(!footer)return;
  const observer=new IntersectionObserver(([entry])=>setFooterInView(entry.isIntersecting));
  observer.observe(footer);
  return ()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const ctx=(document as unknown as {modelContext?:{registerTool:(tool:object,options:object)=>Promise<void>|void}}).modelContext;
  if(!ctx?.registerTool) return;
  const lifecycle=new AbortController();
  const register=(tool:object)=>{try {Promise.resolve(ctx.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
  register({name:"read_vaiyo_catalog",description:"Read VAIYO products, prices in PEN cents, minimum quantities and delivery districts.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({products:products.map(({id,name,price,min})=>({id,name,price,min})),districts})});
  register({name:"stage_vaiyo_cart",description:"Add a product to the visible cart. Does not place an order or send a message.",inputSchema:{type:"object",properties:{productId:{type:"string",enum:products.map(p=>p.id)},quantity:{type:"integer",minimum:1,maximum:99}},required:["productId","quantity"],additionalProperties:false},annotations:{readOnlyHint:false},execute:async(input:unknown)=>{const data=input as {productId:string;quantity:number}; if(!data || !findProduct(data.productId))throw new Error("Producto inválido."); add(data.productId as ProductId,data.quantity); await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))); return {cart:cartRef.current};}});
  register({name:"read_vaiyo_cart",description:"Read the current visible shopping cart.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({items:cartRef.current,total:cartRef.current.reduce((sum,i)=>sum+(findProduct(i.id)?.price??0)*i.qty,0)})});
  return ()=>lifecycle.abort();
 },[]);
 async function submit(event:FormEvent) {
  event.preventDefault(); setError("");
  if(!district){setError("Elige tu distrito para coordinar la entrega.");return}
  if(!cart.length){setError("Agrega un producto a tu pedido.");return}
  setBusy(true); idempotency.current ||= crypto.randomUUID();
  try {
   const result=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:cart,customer:{...draft,district},requestId:idempotency.current})});
   const data=await result.json() as {id:string;total:number;error?:string};
   if(!result.ok)throw new Error(data.error||"No pudimos guardar tu pedido. Inténtalo nuevamente.");
   const summary=cart.map(i=>i.qty+" × "+findProduct(i.id)!.name).join("\n");
   setReceipt({id:data.id,total:data.total,message:"Hola VAIYO, registré el pedido "+data.id+".\n"+summary+"\nTotal: "+money(data.total)+"\nNombre: "+draft.name+"\nDistrito: "+district+"\nDirección: "+draft.address+"\nPago: "+draft.payment+"\nQuisiera coordinar la entrega."});
   setCart([]); idempotency.current="";
  } catch(err) {setError(err instanceof Error?err.message:"No pudimos guardar el pedido.");} finally {setBusy(false)}
 }
 return <>
  <div className="announcement"><Truck size={14}/><span>Delivery incluido en Lima</span><i>·</i><span>Para tu hogar y tu empresa</span></div>
  <header className="site-header">
   <a href="/" aria-label="VAIYO, inicio"><img className="brand-logo" src="/assets/vaiyo-logo.png" alt="VAIYO Alkaline Water" width={120} height={90}/></a>
   <nav aria-label="Navegación principal"><a href="#productos">Nuestros productos</a><a href="#vaiyo">Somos VAIYO</a><a href="#delivery">Delivery</a><a href="#empresas">Empresas</a></nav>
   <div className="header-actions"><a className="account-link" href="/cuenta" aria-label="Mi cuenta"><UserRound size={21}/></a><button className="cart-button" onClick={()=>setCartOpen(true)} aria-label={"Abrir carrito, "+count+" productos"}><ShoppingBag size={20}/><span className="cart-label">Mi pedido</span>{count>0&&<b>{count}</b>}</button><button className="mobile-menu" aria-label="Abrir menú" onClick={()=>setMenuOpen(true)}><Menu size={24}/></button></div>
  </header>
  <main>
   <section className="hero" aria-labelledby="hero-title" onPointerMove={e=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const rect=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty("--mx",((e.clientX-rect.left)/rect.width-.5)*16+"px");e.currentTarget.style.setProperty("--my",((e.clientY-rect.top)/rect.height-.5)*12+"px")}} onPointerLeave={e=>{e.currentTarget.style.setProperty("--mx","0px");e.currentTarget.style.setProperty("--my","0px")}}>
    <div className="hero-water-scene" aria-hidden="true"/><div className="hero-wordmark" aria-hidden="true">VAIYO</div>
    <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-orbit orbit-three"/>
    <div className="hero-copy"><div className="eyebrow"><Droplets size={14}/> ALCALINA + OZONIZADA</div><h1 id="hero-title">La pureza que<br/><em>va contigo.</em></h1><p>El agua de todos tus días, con una calidad<br className="desktop-break"/> que se siente. De nuestra planta a tu puerta.</p><a className="button button-primary" href="#productos">Encuentra tu VAIYO <ArrowUpRight size={18}/></a><div className="hero-note"><Truck size={16}/> Delivery incluido. Así de simple.</div></div>
    <div className="hero-products" aria-hidden="true"><img className="hero-jug" src="/assets/bidon.png" alt="" fetchPriority="high" width={1024} height={1536}/><img className="hero-bottle" src="/assets/botella.png" alt="" fetchPriority="high" width={943} height={1684}/></div>
    <span className="hero-caption caption-left">20 litros de pureza.<br/><b>Infinitas formas de disfrutar.</b></span><span className="hero-caption caption-right">Tu pausa.<br/><b>Tu agua. Tu VAIYO.</b></span>
    <Wave className="hero-wave"/>
   </section>
   <div className="trust-strip"><span><Droplets size={18}/> Agua alcalina y ozonizada</span><span><Truck size={18}/> Delivery incluido</span><span><Recycle size={18}/> Bidones retornables</span><span><MessageCircle size={18}/> Atención por WhatsApp</span></div>
   <section className="section benefits-section" id="vaiyo">
    <div className="section-heading centered reveal"><span className="eyebrow">BIENESTAR EN LO SIMPLE</span><h2>Más que agua.<br/><span>Una buena costumbre.</span></h2><p>Pequeñas decisiones que hacen mejor tu día.</p></div>
    <div className="benefits-grid">
     {benefits.slice(0,2).map(({icon:Icon,title,text})=><article className="benefit reveal" key={title}><span className="icon-bubble"><Icon size={28} strokeWidth={1.5}/></span><h3>{title}</h3><p>{text}</p></article>)}
     <div className="benefit-product reveal"><div className="bottle-ring"/><div className="bottle-ring inner"/><img src="/assets/botella.png" alt="Botella VAIYO de 500 ml" width={943} height={1684} loading="lazy"/><span className="product-caption">Pura. Práctica. VAIYO.</span></div>
     {benefits.slice(2).map(({icon:Icon,title,text})=><article className="benefit reveal" key={title}><span className="icon-bubble"><Icon size={28} strokeWidth={1.5}/></span><h3>{title}</h3><p>{text}</p></article>)}
    </div>
   </section>
   <section className="brand-story"><div className="story-image"><img className="story-water" src="/assets/hero-water.png" alt="Agua cristalina en movimiento" loading="lazy"/><img className="story-bottle" src="/assets/botella.png" alt="Botella VAIYO de 500 ml" loading="lazy"/><span className="story-image-caption">HECHA PARA ACOMPAÑARTE.</span></div><div className="story-copy reveal"><span className="eyebrow">LA ESENCIA DE VAIYO</span><h2>Una pausa.<br/>Un nuevo <span>comienzo.</span></h2><p>Hay cosas que no necesitan complicarse. Agua pura, una presentación para cada momento y la tranquilidad de recibirla en casa.</p><div className="story-values"><span><Droplets size={22}/> Alcalina y ozonizada</span><span><Recycle size={22}/> Un envase que vuelve a empezar</span><span><Heart size={22}/> Cerca de ti, todos los días</span></div><a className="text-action" href="#productos">Encuentra la tuya <ArrowUpRight size={19}/></a></div></section>
   <section className="products-section" id="productos">
    <Wave className="section-wave-top"/>
    <div className="section product-section-inner">
     <div className="section-heading centered reveal"><span className="eyebrow">TU AGUA, A TU MANERA</span><h2>Elige tu <span>presentación.</span></h2><p>Para la mesa, para tu mochila, para todo tu equipo.</p></div>
     <div className="product-grid">
      <article className="product-card jug-card reveal"><div className="product-top"><span className="product-pill">EL FAVORITO DE CASA</span><span className="volume">20 L</span></div><div className="jug-photo"><div className="product-halo"/><img src="/assets/bidon.png" alt="Bidón VAIYO de 20 litros con caño" width={1024} height={1536} loading="lazy"/></div><div className="product-info"><span className="product-kicker">COMPARTE LA PUREZA</span><h3>Un bidón.<br/>Muchos buenos días.</h3><p>Tu agua de siempre, en un envase que vuelve a empezar.</p><div className="variant-toggle" aria-label="Tipo de compra"><button aria-pressed={variant==="bidon"} className={variant==="bidon"?"active":""} onClick={()=>setVariant("bidon")}>Primera compra</button><button aria-pressed={variant==="recarga"} className={variant==="recarga"?"active":""} onClick={()=>setVariant("recarga")}>Recarga</button></div><div className="buy-row"><div><strong>{money(findProduct(variant)!.price)}</strong><small>{variant==="bidon"?"Incluye agua + envase":"Solo recarga de agua"}</small></div><button className="round-add" onClick={()=>add(variant)} aria-label={"Agregar "+findProduct(variant)!.name}><Plus size={23}/></button></div></div></article>
      <article className="product-card box-card reveal"><div className="product-mini-visual"><img src="/assets/caja.png" alt="Caja VAIYO de 20 litros, presentación completa" width={1136} height={1391} loading="lazy"/></div><div className="product-mini-info"><span className="product-kicker">PUREZA EN CADA ESPACIO</span><h3>Caja de 20 L</h3><p>Práctica para tu hogar o tu lugar de trabajo.</p><div className="mini-buy"><div><strong>{money(2400)}</strong><small>Delivery incluido</small></div><button className="round-add" onClick={()=>add("caja")} aria-label="Agregar Caja de 20 L"><Plus size={23}/></button></div></div></article>
      <article className="product-card pack-card reveal"><div className="product-mini-visual"><img src="/assets/pack-etiqueta-real.png" alt="Pack ilustrativo completo de 15 botellas VAIYO de 500 ml" width={1536} height={1024} loading="lazy"/></div><div className="product-mini-info"><span className="product-kicker">LLÉVALA CONTIGO</span><h3>Pack de 15</h3><p>Botellas de 500 ml.<br/>Listas para seguirte el ritmo.</p><div className="mini-buy"><div><strong>{money(3000)}</strong><small>Por pack · Mínimo 3 packs</small></div><button className="round-add" onClick={()=>add("pack")} aria-label="Agregar 3 packs"><Plus size={23}/></button></div></div></article>
     </div>
     <div className="delivery-promise reveal"><Truck size={21}/><span>Lo que ves es lo que pagas. <b>Delivery incluido dentro de nuestra cobertura.</b></span></div>
    </div><Wave className="products-wave-bottom"/>
   </section>
   <section className="section process-section">
    <div className="process-heading reveal"><span className="eyebrow">MENOS VUELTAS. MÁS AGUA.</span><h2>De aquí a tu puerta.<br/><span>Así de fácil.</span></h2><p>Haz tu pedido y nosotros coordinamos el resto.</p></div>
    <div className="steps">{[{title:"Elige tu VAIYO",text:"Bidón, recarga, caja o botellas.",icon:ShoppingBag},{title:"Cuéntanos dónde",text:"Tu nombre, distrito y dirección.",icon:MapPin},{title:"Coordinamos contigo",text:"Entrega y pago por WhatsApp.",icon:MessageCircle},{title:"Disfruta la pureza",text:"Tu agua llega a tu puerta.",icon:PackageCheck}].map(({title,text,icon:Icon},i)=><article className="step reveal" key={title}><span className="step-number">0{i+1}</span><div className="step-icon"><Icon size={26} strokeWidth={1.5}/></div><h3>{title}</h3><p>{text}</p></article>)}</div>
   </section>
   <section className="enterprise-section" id="empresas"><div className="enterprise-copy reveal"><span className="eyebrow">VAIYO PARA EMPRESAS</span><h2>Un equipo hidratado.<br/><span>Un gran comienzo.</span></h2><p>Agua para tu oficina, tu negocio y las personas que lo hacen posible. Coordinamos tus pedidos con atención cercana.</p><div className="enterprise-checks"><span><Check size={17}/> Entregas coordinadas</span><span><Check size={17}/> Diferentes presentaciones</span><span><Check size={17}/> Atención para tu negocio</span></div><a className="button button-white" href={whatsapp("Hola VAIYO, quisiera coordinar un pedido de agua para mi empresa.")} target="_blank" rel="noopener noreferrer">Hablemos de tu empresa <ArrowUpRight size={18}/></a></div><div className="enterprise-art reveal"><div className="enterprise-orbit"/><span className="enterprise-watermark">VAIYO</span><img className="enterprise-box" src="/assets/caja.png" alt="Caja VAIYO para tu empresa" loading="lazy" width={1136} height={1391}/><img className="enterprise-bottle" src="/assets/botella.png" alt="Botella VAIYO de 500 ml" loading="lazy" width={943} height={1684}/><div className="enterprise-label"><Building2 size={21}/><span>Pureza que acompaña<br/><b>a todo tu equipo.</b></span></div></div></section>
   <section className="section delivery-section" id="delivery"><div className="delivery-copy reveal"><span className="eyebrow">CERCA DE TI</span><h2>Lima, llegamos<br/><span>a tu puerta.</span></h2><p>Tenemos delivery incluido en estos 11 distritos. Elige el tuyo y empieza tu pedido.</p><DistrictSelect label="Consultar cobertura de delivery" value={deliveryDistrict} onChange={setDeliveryDistrict}/>{deliveryDistrict&&<div className="coverage-result" role="status"><Check size={20}/><span>¡Llegamos a {deliveryDistrict}!<br/><b>Tu delivery está incluido.</b></span></div>}<a className="text-action" href="#productos">Elegir mis productos <ArrowRight size={18}/></a></div><div className="district-cloud reveal"><div className="delivery-center"><Truck size={38} strokeWidth={1.4}/><b>DELIVERY<br/>QUE VA<br/>CONTIGO.</b><span>11 distritos. Cero costo extra.</span></div><div className="district-tags">{districts.map(d=><button key={d} className={deliveryDistrict===d?"selected":""} onClick={()=>setDeliveryDistrict(d)}><MapPin size={13}/>{d}</button>)}</div><span className="delivery-ring ring-a"/><span className="delivery-ring ring-b"/></div></section>
   <section className="section faq-section"><div className="reveal"><span className="eyebrow">TODO CLARO</span><h2>Lo que necesitas<br/><span>saber.</span></h2><p>Y si te queda una duda,<br/>estamos a un mensaje.</p><a className="text-action" href={whatsapp()} target="_blank" rel="noopener noreferrer">Conversemos <MessageCircle size={18}/></a></div><Accordion type="single" collapsible className="faq-list reveal">{faq.map(([q,a],i)=><AccordionItem key={q} value={"q"+i}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent>{a}</AccordionContent></AccordionItem>)}</Accordion></section>
   <section className="final-cta"><div className="cta-circle"/><span className="eyebrow">QUE NO FALTE LO ESENCIAL</span><h2>Tu próximo buen hábito<br/><span>empieza con VAIYO.</span></h2><a className="button button-primary" href="#productos">Quiero mi VAIYO <ArrowUpRight size={19}/></a><img src="/assets/botella.png" className="cta-bottle" alt="" aria-hidden="true" loading="lazy" width={943} height={1684}/><Wave className="cta-wave"/></section>
  </main>
  <SiteFooter/>
  <a className={"whatsapp-float"+(footerInView?" whatsapp-float--footer-visible":"")} href={whatsapp()} aria-label="Hablar con VAIYO por WhatsApp" aria-hidden={footerInView} tabIndex={footerInView?-1:undefined} target="_blank" rel="noopener noreferrer"><MessageCircle size={27}/></a>
  <Sheet open={menuOpen} onOpenChange={setMenuOpen}><SheetContent side="left" className="mobile-sheet"><SheetHeader><SheetTitle><img src="/assets/vaiyo-logo.png" alt="VAIYO" width={90} height={65}/></SheetTitle><SheetDescription>La pureza que va contigo.</SheetDescription></SheetHeader><nav>{[["#productos","Nuestros productos"],["#vaiyo","Somos VAIYO"],["#delivery","Delivery"],["#empresas","Empresas"],["/cuenta","Mi cuenta"]].map(([href,label])=><a key={href} href={href} onClick={()=>setMenuOpen(false)}>{label}<ChevronRight size={18}/></a>)}</nav></SheetContent></Sheet>
  <Sheet open={cartOpen} onOpenChange={setCartOpen}><SheetContent className="cart-sheet"><SheetHeader><SheetTitle>Tu pedido VAIYO</SheetTitle><SheetDescription>Pureza para tus próximos días.</SheetDescription></SheetHeader>{cart.length===0?<div className="cart-empty"><ShoppingBag size={46} strokeWidth={1.2}/><h3>Aquí empieza tu pedido.</h3><p>Elige la presentación que mejor va contigo.</p><button className="button button-primary" onClick={()=>{setCartOpen(false);document.getElementById("productos")?.scrollIntoView({behavior:"smooth"})}}>Explorar productos <ArrowRight size={18}/></button></div>:<><div className="cart-items">{cart.map(item=>{const p=findProduct(item.id)!;return <div className="cart-item" key={item.id}><img src={p.image} alt={p.name} width={68} height={90}/><div className="cart-item-copy"><b>{p.name}</b><span>{money(p.price)} {p.id==="pack"?"por pack":""}</span><div className="quantity"><button aria-label={"Reducir "+p.name} disabled={item.qty<=p.min} onClick={()=>change(item.id,-1)}><Minus size={14}/></button><span>{item.qty}</span><button aria-label={"Aumentar "+p.name} disabled={item.qty>=99} onClick={()=>change(item.id,1)}><Plus size={14}/></button></div>{p.min>1&&<small>Mínimo {p.min} packs</small>}</div><div className="cart-item-end"><b>{money(p.price*item.qty)}</b><button aria-label={"Quitar "+p.name} onClick={()=>{setCart(c=>c.filter(i=>i.id!==item.id));idempotency.current=""}}><Trash2 size={17}/></button></div></div>})}</div><div className="cart-summary"><span>Delivery <b>Incluido*</b></span><span className="cart-total">Total <b>{money(total)}</b></span><p>*Dentro de los 11 distritos de cobertura.</p><button className="button button-primary full-button" onClick={()=>{setCartOpen(false);setCheckout(true);setError("");setReceipt(null)}}>Continuar mi pedido <ArrowRight size={18}/></button><span className="safe-note"><ShieldCheck size={15}/> Coordinamos contigo antes de entregar.</span></div></>}</SheetContent></Sheet>
  <Dialog open={checkout} onOpenChange={setCheckout}><DialogContent className="checkout-dialog"><DialogHeader><DialogTitle>{receipt?"¡Tu pedido está registrado!":"Un paso más hacia tu VAIYO"}</DialogTitle><DialogDescription>{receipt?"Nuestro equipo coordinará la entrega y confirmará tu pedido.":"Completa tus datos. Coordinaremos la entrega y el pago contigo."}</DialogDescription></DialogHeader>{receipt?<div className="receipt"><span className="receipt-check"><Check size={35}/></span><b className="receipt-number">{receipt.id}</b><p>Total: <strong>{money(receipt.total)}</strong><br/>Estado: pendiente de confirmación.</p><a className="button button-primary full-button" href={whatsapp(receipt.message)} target="_blank" rel="noopener noreferrer">Coordinar por WhatsApp <MessageCircle size={19}/></a><button className="text-action" onClick={()=>setCheckout(false)}>Seguir explorando <ArrowRight size={17}/></button></div>:<form className="checkout-form" onSubmit={submit}><div className="form-two"><label>Tu nombre<input required maxLength={80} autoComplete="name" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Nombre y apellido"/></label><label>Tu WhatsApp<input required type="tel" pattern="[+]?[0-9 ()-]{9,18}" maxLength={18} autoComplete="tel" value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})} placeholder="Ej. 987 654 321"/></label></div><div className="form-two"><label>Distrito<DistrictSelect label="Distrito de entrega" value={district} onChange={setDistrict}/></label><label>Pedido para<select value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value})}><option>Hogar</option><option>Empresa</option></select></label></div><label>Dirección de entrega<input required minLength={8} maxLength={180} autoComplete="street-address" value={draft.address} onChange={e=>setDraft({...draft,address:e.target.value})} placeholder="Calle, número, departamento"/></label><label>¿Cómo prefieres pagar?<select value={draft.payment} onChange={e=>setDraft({...draft,payment:e.target.value})}><option>Efectivo al recibir</option><option>Yape o Plin</option><option>Transferencia</option></select></label><label>Referencia o indicación <span>(opcional)</span><input maxLength={250} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})} placeholder="Algo que debamos saber para la entrega"/></label><div className="checkout-total"><span>{count} {count===1?"producto":"productos"} · Delivery incluido</span><b>{money(total)}</b></div>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button button-primary full-button" disabled={busy} type="submit">{busy?"Registrando tu pedido…":"Registrar mi pedido"}{!busy&&<ArrowRight size={18}/>}</button><p className="privacy-note">Al registrar tu pedido aceptas las <a href="/condiciones">condiciones de compra</a> y el uso de tus datos para atenderlo según nuestra <a href="/privacidad">política de privacidad</a>.</p></form>}</DialogContent></Dialog>
 </>;
}




