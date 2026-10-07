# VAIYO SVG assets

Original, code-native SVG geometry. No external dependencies, fonts, scripts, embedded images, or actual logo artwork.

- `wave-separator-soft.svg` — broad rolling wave; viewBox `0 0 1440 120`; `currentColor` fill.
- `wave-separator-sweep.svg` — long asymmetric wave; viewBox `0 0 1440 120`; `currentColor` fill.
- `wave-divider-layered.svg` — three flowing layers at opacity 0.18, 0.38, and 0.68; viewBox `0 0 1440 160`; `currentColor` fill.
- `favicon.svg` — geometric blue droplet `#0057FF` on pale blue `#E6F4FF`; viewBox `0 0 64 64`.
- `icons/` — 18 outline UI icons: `drop`, `waves`, `heart`, `leaf`, `shield-check`, `truck`, `home`, `building`, `bottle`, `recycle`, `calendar`, `cart`, `user`, `location`, `package`, `check`, `plus`, `minus`.

Icons share a 24 × 24 viewBox, a 1.6-unit `currentColor` stroke, round caps and joins, and no fill. Use `waves.svg` for the purity benefit. Use `bottle.svg` for a generic reusable water container.

Suggested colors: brand blue `#0057FF`, cyan `#00B6FF`, deep blue `#002A6B`, and pale blue `#E6F4FF`. Inline SVGs inherit CSS `color`. External SVG images keep their own default `currentColor`; use inline SVG or a CSS mask when inheriting a page color.

For section separators, display as a block at full width. Flip with `transform: rotate(180deg)` when needed. Mark decorative icons and dividers `aria-hidden="true"`; provide the surrounding button/link with an accessible label when an icon is its only content.

Validation: every SVG was parsed successfully as XML and checked for the expected SVG namespace, dimensions, stroke/fill properties, and absence of scripts or external references.
