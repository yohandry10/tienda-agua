# VAIYO

Tienda de agua para hogares y empresas de Lima. React 19, Vite 8 y Vinext; Worker con D1 para conservar pedidos y permisos del equipo.

## Desarrollo

Node 22.13 o superior. Instalar con `npm run install:ci`, iniciar con `npm run dev -- --port 5180` y compilar con `npm run build`. La vista previa portátil usa una identidad de prueba únicamente en desarrollo; producción usa la autenticación de Sites.

## Pedidos y equipo

- El servidor calcula precios y mínimos. Cada envío usa una clave de idempotencia para evitar pedidos duplicados.
- Los clientes autenticados ven sus pedidos en `/cuenta`. Los vendedores ven los suyos en `/operaciones`; logística cambia estados; administración gestiona el equipo.
- Configurar `VAIYO_ADMIN_EMAILS` como variable secreta del servidor. Nunca incluirla en código del cliente.
- La migración D1 está en `drizzle/0000_lucky_tyger_tiger.sql`.
- Efectivo, Yape/Plin y transferencia se coordinan por WhatsApp y requieren confirmación del equipo. El footer presenta tarjeta, Yape y Plin mediante pasarela, según el contenido solicitado para la implementación prevista hoy. La integración de cobro sigue pendiente: el texto comercial no conecta un proveedor ni activa una opción de tarjeta en el checkout.

## Imágenes y marca

`public/assets` contiene el logo y las tres imágenes entregadas por el cliente, SVG originales y un fondo de agua generado. `pack-etiqueta-real.png` es la composición ilustrativa de 15 botellas con tapa blanca y la etiqueta azul de la botella real de 500 ml. Se usa en el catálogo y el carrito. La generación se documenta en `docs/asset-prompts.md` y `docs/asset-metadata.json`. Las variantes antiguas no se utilizan para el pack publicado.

El footer enlaza a Facebook, TikTok e Instagram oficiales, entregados por el cliente.

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
