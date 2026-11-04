---
name: FinHer
colors:
  primary: "#5E1B45"
  accent: "#D6F06A"
  canvas: "#F6F1EA"
  surface: "#FFFDF9"
  ink: "#1C1418"
  dark-section: "#2A0F22"
typography:
  display: Fraunces
  text: Instrument Sans
  label: JetBrains Mono
rounded:
  md: 14px
  button: 9999px
---

# FinHer · caderno de mercado

The look is a market notebook: warm paper, deep plum ink, and a lime highlighter used sparingly. It reads serious enough for finance and does not look like a bank. The tokens live in `src/index.css`. This file explains how to use them.

## References

These came from the DesignMD Discover catalogue. Mobbin needs a paid plan, so it was not used.

- **Mailchimp**: a serif display face over a sans text face, a warm neutral canvas, and pill buttons.
- **Anthropic**: cream paper with near-black ink, restrained colour, and typography doing most of the work.
- **Wise**: one bold accent (lime) on a deep brand colour, used for emphasis and on dark sections.
- **Mercury**: calm spacing, thin borders, and very little shadow.

## Colour

| Role | Light | Dark | Use |
|---|---|---|---|
| `background` | `#F6F1EA` paper | `#150D12` | Page |
| `card` | `#FFFDF9` | `#1F151B` | Cards, inputs, dialogs |
| `foreground` | `#1C1418` ink | `#F3ECE4` | Text; also the strong 1px rules |
| `primary` | `#5E1B45` plum | `#E8AACD` | Primary buttons, links, eyebrows, active states |
| `cta` | `#D6F06A` lime | same | Highlighter, numbered dots, buttons **on dark sections only** |
| `navy` | `#2A0F22` plum-black | `#0D070B` | Dark sections (the token name is historical) |
| `muted-foreground` | `#5F5359` | `#B7A9B0` | Secondary text |
| `chart-1` / `chart-2` | `#7A2A5C` / `#C8741F` | `#D58AB8` / `#E59A4A` | "You today" vs "expected" |

Rules:
- Lime is never body text on paper. Use it as a fill (the highlighter, a badge, a dot) or as text on plum-black.
- On a light background the primary action is plum (`Button` default). Use lime buttons (`variant="cta"`) only inside `bg-navy`.
- Use at most one highlighter per screen.

## Typography

- **Display: Fraunces**, weight 400–500 for big headlines and 600 for UI headings. Italic sets the emphasis words and the big numerals (`01`, `02`).
- **Text: Instrument Sans**, at 16–18px for body text.
- **Labels: JetBrains Mono** through `.label-mono`: 0.72rem, tracking 0.14em, uppercase. Use it for eyebrows ("Nº 02 — O que você encontra"), metadata and the ticker.

## Signature details

- `.highlight` paints a lime marker stroke behind a phrase. In dark mode the phrase turns lime instead.
- **Numbering**: sections carry "Nº 0X" eyebrows, and lists use large italic serif numerals in plum.
- **Ticker**: a plum-black strip under the site header lists what is inside FinHer.
- **Rules over boxes**: on marketing pages, prefer 1px ink rules (`border-foreground`) and dividers to stacked cards. The hero card has an offset lime block behind it.
- **Logo**: the wordmark "Fin" is upright and "*Her*" is italic in plum. The mark is a plum tile with a lime rising line.

## Components

- Buttons are pills (`rounded-full`). Primary is plum on cream text. Outline is a 1px border on the card colour.
- Cards use `rounded-2xl` with a 1px `border` and almost no shadow.
- Badges are pills. `variant="cta"` is solid lime with plum text.
