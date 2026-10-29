# Preparación del píxel de Meta

La integración permanece desactivada hasta recibir el ID numérico del píxel o conjunto de datos del cliente. El administrador del negocio debe garantizar que el píxel correcto esté asociado a la cuenta publicitaria y proporcionar acceso para verificarlo en el Administrador de eventos. El ID de la cuenta publicitaria no se introduce en el código. No se necesitan contraseñas ni tokens de la API de conversiones para el píxel del navegador.

1. Comprobar si la web publicada ya tiene un píxel o etiqueta mediante Meta Pixel Helper y el Administrador de eventos, para evitar mediciones duplicadas.
2. Escribir el ID en `lib/meta-config.ts` (`META_PIXEL_ID`). Este dato es público. Compilar y desplegar la versión revisada con el procedimiento habitual de Cloudflare.
3. En el Administrador de eventos, usar **Probar eventos**, aceptar la preferencia publicitaria de la web y verificar `PageView`, `AddToCart` e `InitiateCheckout`. Un pedido sin pago online registra `Lead`: está pendiente de confirmación y no es una compra pagada. `Purchase` se envía únicamente desde el retorno de Izipay cuando el estado verificado por el servidor es `pagado` o `autorizado` y el modo es `PRODUCTION`. Los pagos TEST no generan `Purchase`.
4. Confirmar que al rechazar la preferencia no se envíen eventos y que se pueda cambiar desde el pie. Evitar un cobro real durante las pruebas. Para verificar `Purchase` de extremo a extremo se requiere un pago real autorizado o una prueba controlada sin alterar el modo de producción y sin generar datos falsos.

Los importes del sitio están en céntimos; los eventos los envían en soles (`PEN`). No se envían nombres, teléfonos, direcciones, correos ni el token de retorno. El token se retira de la dirección en el navegador y se conserva en la entrada del historial para la consulta y recarga del pago. Los eventos solo se envían con consentimiento, y las compras se deduplican por pedido en el navegador. Esto no garantiza una medición completa: el navegador debe volver a la página de resultado, tener consentimiento y poder cargar Meta. Para una medición del lado servidor haría falta una integración separada de Conversions API, deduplicación y credenciales apropiadas.

Verificaciones locales: `node checks/meta-pixel.mjs`, `npx tsc --noEmit` y `npm run build:cloudflare`.
