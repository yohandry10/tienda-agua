# Pack VAIYO con la etiqueta real — 9 de octubre de 2026

Generado con la herramienta integrada `image_gen`, con `transparent_background: true`. Referencias inspeccionadas antes de generar:

1. `public/assets/pack.png`: composición anterior de tres filas de cinco botellas.
2. `C:/Users/PC/Downloads/Botella de agua VAIYO 500 ml.png`: envase, tapa blanca y etiqueta oficiales entregados por el cliente.

Resultado: `public/assets/pack-etiqueta-real.png`, 1536 × 1024, PNG con alfa, copiado sin modificaciones desde el original generado. Se usa tanto en la tarjeta del catálogo como en el carrito. La botella individual de la web es una copia idéntica a la de Descargas.

Validación visual: 15 tapas blancas, tres filas de cinco, grupo completo; etiqueta azul con curvas blancas, texto VAIYO, ALKALINE WATER y gota negra de 500 ml. La composición sigue siendo ilustrativa y generada; la etiqueta se basa en la foto real. Las cuatro esquinas tienen alfa 0. Hash y archivo original en `asset-metadata.json`.

## Prompt final

```text
Use case: precise-object-edit / product-mockup. Asset type: transparent ecommerce product cutout for VAIYO website, a pack of exactly 15 bottles of 500 ml. Input image 1 is the EDIT TARGET and composition reference: keep its complete centered arrangement of exactly THREE rows with exactly FIVE bottles in each row (5 rear, 5 middle, 5 front), staggered in depth with all 15 caps visible, same frontal gently elevated camera and balanced product photography. Input image 2 is the authoritative REAL PRODUCT reference and must define the packaging on EVERY bottle. Replace the incorrect white label with the EXACT blue full wrap label from image 2: electric blue background, huge white concentric droplet/sweeping angular curves, white spaced VAIYO lettering, small black ALKALINE WATER lettering, and the small black droplet badge at the lower right saying CONT. 500 ml. Preserve the reference label geometry, proportions and colors faithfully; do not substitute the standalone logo or invent any alternate branding. Every bottle has the same transparent body, molded shoulder shape and pale translucent white cap as reference 2. Entire group fully visible including bottle bases and rear caps; ample transparent margin, studio reflections, clean crisp edge alpha. Keep the composition of target 1 while correcting the product packaging from 2. Background must be genuinely transparent, no blue backdrop or opaque glow, no packaging wrapping, no extra props, no captions outside bottles, no watermark. Count bottles before finishing: exactly 15 (three rows of five).
```

## Información de pago

El usuario confirmó que la integración se realizará hoy y pidió retirar los avisos de disponibilidad futura. El texto de tarjeta, Yape y Plin se presenta únicamente en el footer y en las respuestas sobre pago. La integración de cobro es independiente de estos cambios de contenido; no se añadió un botón de cobro ni una opción de tarjeta activa.
