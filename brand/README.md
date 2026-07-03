# Brand assets

Source of truth for Freenances icons and colors used across web and desktop.

## Colors

| Token | Hex | Usage |
|---|---|---|
| Base | `#030403` | App background |
| Elevated | `#08120c` | Icon circle |
| Accent | `#b8f0b8` | Clover mark |

Defined in `src/ui/tokens/colors.ts` and `src/app/globals.css`.

## Icon mark

The clover comes from `src/ui/patterns/clover-icon.tsx` (four overlapping circles).

Master SVG: `brand/icon-source.svg`

## Regenerate icons

```bash
npm run icons:generate
```

Outputs:

- Web: `public/icons/*`, `src/app/icon.png`, `src/app/apple-icon.png`
- Desktop (Tauri): `desktop/src-tauri/icons/*`
- Source PNG: `desktop/icon-source.png`
