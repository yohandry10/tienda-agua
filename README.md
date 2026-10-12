# VAIYO

Tienda de agua para hogares y empresas de Lima. React 19, Vite 8 y Vinext; Worker con D1 para conservar pedidos y permisos del equipo.

## Desarrollo

Node 22.13 o superior. Instalar con `npm run install:ci`, iniciar con `npm run dev -- --port 5180` y compilar con `npm run build`. La vista previa portátil usa una identidad de prueba únicamente en desarrollo; producción usa la autenticación de Sites.

## Pedidos y equipo

- El servidor calcula precios y mínimos. Cada envío usa una clave de idempotencia para evitar pedidos duplicados.
- Los clientes autenticados ven sus pedidos en `/cuenta`. Los vendedores ven los suyos en `/operaciones`; logística cambia estados; administración gestiona el equipo.
- Configurar `VAIYO_ADMIN_EMAILS` como variable secreta del servidor. Nunca incluirla en código del cliente.
- La migración D1 está en `drizzle/0000_lucky_tyger_tiger.sql`.
- El pago online usa el formulario alojado de Izipay. Las firmas HMAC-SHA-256 se calculan en el servidor y se verifican en la IPN, contrastando tienda, modo, importe, moneda y transacción. El retorno del navegador nunca confirma el pago. La migración `0001_izipay_payments.sql` separa los intentos y el estado de pago del reparto.
- Izipay permanece en **TEST por petición del propietario**. Los pagos de prueba no cobran dinero, no confirman entregas y no aparecen en el panel de reparto. No activar PRODUCCIÓN sin que el propietario lo solicite. Efectivo, Yape/Plin y transferencia siguen disponibles para coordinación por WhatsApp.
- Variables: `IZIPAY_MODE=TEST`, `IZIPAY_SITE_ID=26648318`, `IZIPAY_PUBLIC_URL=https://aguavaiyo.com`. `IZIPAY_TEST_KEY` y, cuando corresponda, `IZIPAY_PRODUCTION_KEY` son secretos de Cloudflare, nunca código del cliente. La producción requiere cambiar el modo y configurar la clave correspondiente; no necesita otro checkout.
- URLs de retorno: `/api/payments/return`; notificaciones de API Formulario: `/api/payments/ipn`, tanto test como producción. Activar notificación al final del pago, abandono y cambios del Back Office/batch. El resultado se muestra en `/pago`. Cada formulario también firma `vads_url_check` para notificar al endpoint del sitio. La regla del Back Office sigue siendo necesaria para reenvíos manuales, abandono y modificaciones posteriores. En la afiliación observada están Visa, Mastercard, Diners y American Express; Yape y Plin no aparecen en el formulario y se coordinan por WhatsApp hasta que Izipay confirme su habilitación online.

## Imágenes y marca

`public/assets` contiene el logo y las tres imágenes entregadas por el cliente, SVG originales y un fondo de agua generado. `pack-etiqueta-real.png` es la composición ilustrativa de 15 botellas con tapa blanca y la etiqueta azul de la botella real de 500 ml. Se usa en el catálogo y el carrito. La generación se documenta en `docs/asset-prompts.md` y `docs/asset-metadata.json`. Las variantes antiguas no se utilizan para el pack publicado.

El footer enlaza a Facebook, TikTok e Instagram oficiales, entregados por el cliente.

La portada revela el título por palabras y hace entrar los envases desde los lados. El desplazamiento los mueve hacia afuera y los devuelve al subir, sin atravesar el texto; en tablet y móvil se sitúan debajo. Las ocho secciones revelan sus títulos al entrar, con secuencias suaves en tarjetas, productos y distritos. El contenido permanece visible sin JavaScript. Según la preferencia explícita del propietario, el movimiento está activado por defecto incluso cuando el navegador solicita movimiento reducido. El control «Reducir movimiento» del footer permite desactivarlo y conserva esa elección entre visitas; se aplica antes de mostrar el contenido. No se añaden dependencias.

## Verificación

TypeScript y compilación de producción. `checks/orders.mjs` verifica 17 casos de precios, mínimos, cobertura, origen, idempotencia, permisos y estados contra un Worker local en 5181 con D1 de prueba aislado. Sus identidades son ficticias y se usan únicamente contra localhost.

Las capturas de escritorio y móvil están en `outputs/` (ignoradas por Git). Los datos de prueba y `.wrangler/` tampoco se publican.

## Publicación

### Cloudflare

Producción: `https://aguavaiyo.com` y `https://www.aguavaiyo.com`. El repositorio `yohandry10/tienda-agua` despliega la rama `main` con `npm run build:cloudflare` y `npx wrangler deploy --config dist/server/wrangler.json`.

`cloudflare.config.json` contiene los identificadores públicos del Worker, los dominios y la base D1 `vaiyo-pedidos`. La migración inicial ya está aplicada en esa base. Compilar localmente con `npm run build:cloudflare` y desplegar con `npm run deploy:cloudflare` requiere la sesión de Wrangler del propietario; no se guardan credenciales en Git.

Los pedidos de invitados se guardan en D1. La identidad de ChatGPT corresponde al alojamiento Sites; la instalación independiente en Cloudflare descarta esas cabeceras externas y necesita un proveedor de acceso verificado para habilitar las cuentas y el panel del equipo. Nunca aceptar cabeceras de identidad enviadas por el visitante como autenticación.

### Sites

Proyecto Sites registrado en `.openai/hosting.json`. Usar el flujo nativo para guardar el código exacto y empaquetar `dist`; conservar la audiencia privada existente. Nunca guardar tokens ni credenciales en archivos.

### Estado de validación Izipay (12/10/2026)

- Compilación y TypeScript correctos; 13 pruebas del vector de firma oficial, 52 casos de backend de pagos y 17 regresiones de pedidos pasaron en D1 local aislado.
- En Izipay TEST se verificaron aprobación Mastercard con 3DS (`AUTHORISED`), confirmación automática por IPN, rechazo (`REFUSED`), abandono (`ABANDONED`) y recuperación del mismo pedido tras un rechazo. Los pagos TEST no confirman entregas. Se corrigió el código de éxito oficial `00`, la fuente de reenvíos `RETRY` y la ausencia documentada de `vads_operation_type` en un abandono.
- Guardados en el Back Office: marca VAIYO, dominio y teléfono de soporte, retornos HTTPS, logo/paleta de la pantalla de pago y reglas de pago finalizado, abandono, actualización del vendedor y actualización por lote con reintentos automáticos. Se eliminaron los intentos adicionales dentro de una misma sesión de Izipay: cada reintento desde VAIYO genera otra sesión conservando el pedido.
- VISA TEST continúa rechazando las tarjetas de aprobación oficiales con `227: Autenticación imposible`. El historial 3DS registra abandono del challenge, sin autorización bancaria. Ocurre también en la pestaña visible y solicitando autenticación fuerte; requiere revisión del simulador/cuenta por Izipay. No se desactivó 3DS ni se regeneraron claves. Véase `docs/izipay-test-validation.md`. No presentar la integración como validada para producción; solo está instalado el secreto TEST.
