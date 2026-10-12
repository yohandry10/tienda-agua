# Validación Izipay TEST — VAIYO

Fecha: 12 de octubre de 2026. Sitio: https://aguavaiyo.com. Tienda: 26648318. Afiliación: 500015821 (Procesos ISO). Moneda: PEN (604). No se hicieron cobros reales.

## Recorrido confirmado

- Pedido VA-C6AD32F8: Mastercard oficial terminada en 0114; 3D_SUCCESS, autorización aprobada, IPN automática aceptada por VAIYO y pantalla «Prueba completada».
- Pedido VA-EF5CAAB2: Mastercard aprobada tras un rechazo VISA en la misma sesión. La IPN inicial falló por esperar `0` en vez del código oficial `00`; corregido y reenvío del Back Office confirmado con éxito.
- Pedido VA-3F281BD3: abandono antes de introducir tarjeta; IPN firmada `ABANDONED`, estado `cancelado` y botón para reintentar el mismo pedido.
- Pedido VA-B417C10B: rechazo VISA seguido de una sesión nueva Mastercard aprobada; conserva referencia y evita otro pedido.
- D1 mantiene estos pedidos en TEST y sin confirmar reparto. El importe y la moneda proceden del servidor; el retorno del navegador no confirma pagos.
- Verificación local: 57 comprobaciones de pagos, 13 de firma y 17 de pedidos; compilación y TypeScript correctos.
- Idempotencia comprobada: dos preparaciones simultáneas con la misma clave devuelven un pedido/intento; dos reintentos simultáneos de un rechazo reutilizan un intento nuevo; repetir preparación o reintentar un pago autorizado/capturado devuelve su resultado, sin abrir otro pago. Una clave reutilizada con datos distintos se rechaza con 409. Las IPN duplicadas y los rechazos atrasados no degradan un pago capturado.

## Configuración guardada

Nombre VAIYO, https://aguavaiyo.com, teléfono público +51 967 232 782, logo y colores de marca. Retorno TEST/PRODUCCIÓN: https://aguavaiyo.com/api/payments/return. IPN de API Formulario V1/V2: https://aguavaiyo.com/api/payments/ipn.

Activadas y parametrizadas las reglas de pago finalizado, abandono, modificación por vendedor y modificación por lote, con reejecución automática ante fallo. Los intentos adicionales en la sesión del proveedor están en cero; VAIYO permite reintentar con un identificador nuevo y la misma referencia de pedido.

La web sigue en TEST. Configurar direcciones de retorno e IPN de producción no activa cobros. La clave de producción no se ha instalado y las claves existentes no se regeneraron. El formulario de esta afiliación muestra Visa, Mastercard, Diners y American Express; Yape/Plin siguen por coordinación de WhatsApp.

## Incidencia pendiente de Izipay: VISA TEST

Las tarjetas oficiales VISA que deberían simular aprobación (terminaciones 0210, 0228 y 1029) reciben `227: Autenticación imposible`. Se comprobó también una tarjeta sin enrolamiento (0048), una sesión en la pestaña visible del usuario y una petición con `vads_threeds_mpi=3` para solicitar autenticación fuerte. La variante no resolvió el rechazo; la configuración final conserva la preferencia del emisor y las protecciones 3DS.

Ejemplo verificable en Gestión → Transacciones de TEST:

- Pedido VA-B417C10B, transacción 055031.
- UUID: f803fb4350fd4dc8a485be72a994623d.
- VISA terminada en 0210; importe 30,00 PEN.
- Código 227, sin código de autorización del adquirente.
- Pestaña 3D Secure: «Rango de la tarjeta presente en el cache 3DS2 Visa» y «Abandono de la autenticación (CHALLENGE) por parte del comprador». El resumen indica «3D Secure desactivado en la consulta», aunque la solicitud estándar no desactiva 3DS.

Estos datos identifican dónde se detiene el proceso; no prueban por sí solos si la causa está en el simulador o en el enrolamiento/configuración VISA de la tienda. Izipay debe revisar ambos. Mastercard completa 3DS y autoriza en esa misma cuenta.

### Texto preparado para soporte

«Necesitamos revisar VISA en TEST para la tienda 26648318, afiliación 500015821, sitio aguavaiyo.com. Las tarjetas de aprobación oficiales terminadas en 0210/0228/1029 reciben error 227 (Autenticación imposible), antes de autorización bancaria. Ejemplo: pedido VA-B417C10B, transacción 055031, UUID f803fb4350fd4dc8a485be72a994623d, 30,00 PEN. El historial 3DS informa abandono del challenge; no aparece una pantalla de challenge que permita completarlo. Reproducido también en la pestaña visible y solicitando autenticación fuerte. Mastercard terminada en 0114 completa 3DS y autoriza correctamente con IPN automática. ¿Pueden revisar el simulador y la configuración/enrolamiento VISA de esta tienda? También necesitamos confirmar la disponibilidad y habilitación de Yape/Plin online para esta afiliación.»

Este mensaje está preparado; no se ha enviado a terceros.

## Referencias oficiales

- [Diccionario de datos](https://secure.micuentaweb.pe/doc/es-PE/form-payment/reference/sitemap.html): `vads_result=00`, `vads_url_check_src=RETRY`, y ausencia de `vads_operation_type` al abandonar un pago.
- [Tarjetas de prueba](https://secure.micuentaweb.pe/doc/es-PE/form-payment/test-cards/sitemap.html).
- [Guía 3D Secure](https://secure.micuentaweb.pe/doc/es-PE/guides/3DSecure/sitemap.html).

El paso posterior a producción requiere autorización del propietario, clave de producción, cambio de modo y una comprobación final del entorno real. El test no sustituye esa comprobación.
