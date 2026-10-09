import SimplePage from "@/components/simple-page";
import { whatsapp } from "@/lib/catalog";

export default function AccessPending() {
  return <SimplePage title="Estamos cerca de ti.">
    <p>Puedes registrar tu pedido desde la tienda sin crear una cuenta.</p>
    <h2>Para consultar un pedido</h2>
    <p>Escríbenos por WhatsApp con tu número de pedido y te ayudaremos a coordinarlo.</p>
    <a className="button button-primary" href={whatsapp("Hola VAIYO, quisiera consultar mi pedido.")} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>
    <h2>Acceso a cuentas y al equipo</h2>
    <p>El inicio de sesión aún no está disponible en este dominio.</p>
  </SimplePage>;
}
