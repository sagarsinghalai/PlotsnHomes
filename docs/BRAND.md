# PlotsnHomes — Brand & Design Book

Inspired by the **MyHome** real-estate aesthetic: deep **navy**, warm **cream**, and a
muted **teal** accent. The feel is elegant, coastal, and premium — confident but calm.

## Typography
- **Display / headings:** *Cormorant Garamond* (serif), weight 500–600. Large, airy,
  title case. Emphasis words may be set in teal italic.
- **Body / UI:** *Inter* (sans), 400–600. Clean and highly legible.

## Color palette

### Primary — Navy  (Tailwind token: `pine-*`, legacy name)
| Token | Hex | Use |
|---|---|---|
| `pine-950` | `#15293D` | footer, darkest sections |
| `pine-900` | `#1B365D` | primary buttons, dark bands, heading emphasis |
| `pine-800` | `#223C66` | |
| `pine-700` | `#2D4A7C` | |
| `pine-600` | `#3D5A8C` | hover / secondary navy |
| `pine-100` | `#D3DEEB` | light text on navy |

### Accent — Teal  (Tailwind token: `gold-*`, legacy name)
| Token | Hex | Use |
|---|---|---|
| `gold` (DEFAULT) | `#5D9E9B` | eyebrow labels, prices, links, highlights |
| `gold-dark` | `#45817E` | accent text on light |
| `gold-light` | `#7FB8B5` | |
| `gold-50` | `#E7F0ED` | pale tint backgrounds |

### Neutrals — Cream & Taupe
| Token | Hex | Use |
|---|---|---|
| `cream-50` | `#FAF7F1` | page background |
| `cream-100` | `#F5F1EA` | section background |
| `cream-200` | `#E2DCD3` | borders / dividers |
| `cream-white` | `#FFFFFF` | cards |
| `sage` | `#7D7267` | muted body text (taupe) |
| ink | `#2D2D2D` | primary text |

## Usage rules
- **Primary buttons:** navy (`bg-pine-900`) with white text, rounded-full.
- **Eyebrow labels:** uppercase, letter-spaced, teal (`text-gold-dark`).
- **Headings:** Cormorant serif, navy ink; emphasis words in teal italic.
- **Cards:** white, soft shadow, `rounded-2xl`.
- **Dark sections / footer:** navy (`bg-pine-950`).
- **Admin:** `brand` token is navy, matching the public primary.

> Note: the Tailwind token names (`pine`, `gold`, `sage`) are kept from the previous
> theme to avoid a large rename; their *values* now encode navy / teal / taupe.
> Values live in `tailwind.config.ts`; changing them re-themes the whole app.
