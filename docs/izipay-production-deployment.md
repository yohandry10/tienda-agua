# Despliegue Izipay en producción

Fecha: 12/10/2026. Autorización del propietario: «sube todo a produccion y dejalo completamente listo».

- Worker: `tienda-agua`.
- Versión publicada: `f3b34c2b-686f-4a94-9a5b-61e9797abf2a`.
- Código desplegado: commit `3d73f74`.
- Dominios: https://aguavaiyo.com y https://www.aguavaiyo.com.
- Ambos endpoints `/api/payments/config` devuelven `available: true`, `mode: PRODUCTION`.
- `IZIPAY_PRODUCTION_KEY` se leyó de la clave existente del Back Office y se envió directamente a Wrangler por stdin. No se regeneró ni se guardó en un archivo del proyecto.
- La clave TEST se conserva para comprobar notificaciones de intentos TEST anteriores.
- Firmas TEST y PRODUCCIÓN: HMAC-SHA-256.

## Comprobación sin cobro

La compra de verificación `VA-A630A334` se identificó expresamente como «QA VAIYO - NO ENTREGAR», con dirección ficticia y notas de revisión técnica sin compra ni entrega. Izipay aceptó la firma de producción y abrió el selector de tarjetas y el formulario VISA, sin lista de tarjetas de prueba. No se introdujeron datos de tarjeta ni se pulsó la validación del pago.

Al usar «Anular y volver a la tienda», VAIYO mostró «El pago se canceló». D1 confirmó `payment_mode=PRODUCTION`, `payment_status=cancelado`, intento `cancelado`, `gateway_status=ABANDONED`. La orden de verificación se dejó además con estado de reparto `cancelado` para evitar que se trate como un pedido de entrega.

La regla «URL de notificación al final del pago» está activa, con reejecución ante fallo y endpoint de API Formulario en producción `https://aguavaiyo.com/api/payments/ipn`. Las reglas de abandono, modificación por vendedor y modificación por lote también están activas.

TypeScript y las 13 comprobaciones de firma volvieron a pasar antes de publicar. La batería previa de idempotencia, importes, autenticidad de IPN y separación TEST/PRODUCCIÓN se conserva.

Prueba visual local: `outputs/izipay-production-visa.png`.

## Límite de la comprobación

No se hizo una compra real. La autorización bancaria, el cargo y la captura de dinero real solo se verificarán con una compra real posterior del propietario o cliente. El propietario informó que Claude había dejado resuelta VISA en TEST; esa aprobación no se reprodujo durante este despliegue.

Yape y Plin siguen por WhatsApp; la pantalla alojada de esta afiliación muestra Visa, Mastercard, Diners y American Express.
