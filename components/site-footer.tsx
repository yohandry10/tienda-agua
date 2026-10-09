import { ArrowUpRight, CreditCard, MapPin, MessageCircle, Smartphone, Truck } from "lucide-react";
import { districts, whatsapp } from "@/lib/catalog";
import SocialLinks from "@/components/social-links";

export default function SiteFooter() {
  return <footer className="brand-footer">
    <div className="brand-footer__inner">
      <div className="brand-footer__grid">
        <div className="brand-footer__brand">
          <a className="brand-footer__logo" href="/" aria-label="VAIYO, inicio">
            <img src="/assets/vaiyo-logo.png" alt="VAIYO Alkaline Water" width={200} height={150}/>
          </a>
          <div className="brand-footer__intro">
            <p>Agua alcalina y ozonizada,<br/>para tu hogar y tu empresa.</p>
            <span><MapPin size={14}/> Lima, Perú</span>
          </div>
        </div>

        <div className="brand-footer__middle">
          <div className="brand-footer__navigation">
            <div>
              <h3>Tu VAIYO</h3>
              <nav aria-label="Productos del footer">
                <a href="#productos">Bidón de 20 L</a>
                <a href="#productos">Recarga de 20 L</a>
                <a href="#productos">Caja de 20 L</a>
                <a href="#productos">Pack de 15 botellas</a>
              </nav>
            </div>
            <div>
              <h3>Siempre cerca</h3>
              <nav aria-label="VAIYO del footer">
                <a href="#vaiyo">Somos VAIYO</a>
                <a href="#delivery">Nuestros distritos</a>
                <a href="#empresas">Agua para empresas</a>
                <a href="/cuenta">Mis pedidos</a>
              </nav>
            </div>
          </div>
          <div className="brand-footer__payments" id="pagos" aria-labelledby="footer-payment-title">
            <h3 id="footer-payment-title">Paga a tu manera</h3>
            <p>Paga con tarjeta, Yape o Plin mediante nuestra pasarela de pago.</p>
            <div className="brand-footer__payment-methods" aria-label="Tarjeta, Yape y Plin">
              <span><CreditCard size={18}/> Tarjeta</span>
              <span><Smartphone size={18}/> Yape</span>
              <span><Smartphone size={18}/> Plin</span>
            </div>
          </div>
        </div>

        <div className="brand-footer__contact">
          <div className="brand-footer__contact-copy">
            <h3>Conversemos</h3>
            <p>Tu agua está a un mensaje.<br/>Coordinamos tu próximo pedido.</p>
          </div>
          <a className="brand-footer__whatsapp" href={whatsapp()} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={26}/>
            <span>Escríbenos por WhatsApp<strong>967 232 782</strong></span>
            <ArrowUpRight size={19}/>
          </a>
          <SocialLinks/>
        </div>
      </div>

      <div className="brand-footer__coverage">
        <b><Truck size={18}/> DELIVERY INCLUIDO</b>
        <p>{districts.join(" · ")}</p>
      </div>
      <div className="brand-footer__legal">
        <span>© {new Date().getFullYear()} VAIYO. Todos los derechos reservados.</span>
        <nav aria-label="Información y acceso">
          <a href="/privacidad">Privacidad</a>
          <a href="/condiciones">Condiciones de compra</a>
          <a href="/operaciones">Acceso del equipo <ArrowUpRight size={13}/></a>
        </nav>
      </div>
      <div className="brand-footer__signature" aria-hidden="true">
        <span>VAIYO</span><p>La pureza que va contigo.</p>
      </div>
    </div>
  </footer>;
}
