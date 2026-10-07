# VAIYO

Tienda de agua para hogares y empresas de Lima. React 19, Vite 8 y Vinext; Worker con D1 para conservar pedidos y permisos del equipo.

## Desarrollo

Node 22.13 o superior. Instalar con `npm run install:ci`, iniciar con `npm run dev -- --port 5180` y compilar con `npm run build`. La vista previa portátil usa una identidad de prueba únicamente en desarrollo; producción usa la autenticación de Sites.

## Pedidos y equipo

- El servidor calcula precios y mínimos. Cada envío usa una clave de idempotencia para evitar pedidos duplicados.
- Los clientes autenticados ven sus pedidos en `/cuenta`. Los vendedores ven los suyos en `/operaciones`; logística cambia estados; administración gestiona el equipo.
- Configurar `VAIYO_ADMIN_EMAILS` como variable secreta del servidor. Nunca incluirla en código del cliente.
- La migración D1 está en `drizzle/0000_lucky_tyger_tiger.sql`.
- Efectivo, Yape/Plin y transferencia requieren confirmación del equipo. No hay pasarela de tarjetas conectada.

## Imágenes y marca

`public/assets` contiene el logo y las tres imágenes entregadas por el cliente, SVG originales y un fondo de agua generado. El pack de 15 es ilustrativo: cuenta 15 botellas y conserva el diseño previo de tapa azul. La generación se documenta en `docs/asset-prompts.md` y `docs/asset-metadata.json`. La variante de 10 botellas no se utiliza como pack de 15.

## Verificación

TypeScript y compilación de producción. `checks/orders.mjs` verifica 17 casos de precios, mínimos, cobertura, origen, idempotencia, permisos y estados contra un Worker local en 5181 con D1 de prueba aislado. Sus identidades son ficticias y se usan únicamente contra localhost.

Las capturas de escritorio y móvil están en `outputs/` (ignoradas por Git). Los datos de prueba y `.wrangler/` tampoco se publican.

## Publicación

Proyecto Sites registrado en `.openai/hosting.json`. Usar el flujo nativo para guardar el código exacto y empaquetar `dist`; conservar la audiencia privada existente. Nunca guardar tokens ni credenciales en archivos.
