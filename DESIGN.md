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
  label: Instrument Sans, caps
rounded:
  md: 14px
  button: 9999px
---

# FinHer · caderno de mercado

The look is a market notebook: warm paper, deep plum ink and a touch of lime. It is clean, calm and refined. It is serious enough for finance without looking like a bank, and it never shouts. **Light mode is the default.** Dark mode exists only when the reader picks it. The tokens live in `src/index.css`. This file explains how to use them.

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
| `foreground` | `#1C1418` ink | `#F3ECE4` | Text |
| `primary` | `#5E1B45` plum | `#E8AACD` | Primary buttons, links, eyebrows, active states |
| `cta` | `#D6F06A` lime | same | Small accents: numbered dots, a soft badge tint, buttons **on dark sections only** |
| `navy` | `#2A0F22` plum-black | `#0D070B` | Dark sections (the token name is historical) |
| `muted-foreground` | `#5F5359` | `#B7A9B0` | Secondary text |
| `chart-1` / `chart-2` | `#7A2A5C` / `#C8741F` | `#D58AB8` / `#E59A4A` | "You today" vs "expected" |

Rules:
- Lime is never body text on paper. Use it as a small fill (a dot, a 45% badge tint) or as text on plum-black.
- On a light background the primary action is plum (`Button` default). Use lime buttons (`variant="cta"`) only inside `bg-navy`.
- Keep it quiet: one dark section per page at most, soft borders (`border`, never ink-black rules), and no stacked decorations.

## Typography

- **Display: Fraunces**, upright only. Use weight 300 (`font-light`) for big headlines and 500–600 for UI headings.
- **Text: Instrument Sans**, at 16–18px for body text.
- **Labels:** `.label-mono` (the name is historical) is Instrument Sans at 0.72rem, weight 600, tracking 0.16em, uppercase. Use it for eyebrows and metadata.
- **No italics anywhere.** `em` and `i` render upright at weight 600, and emphasis comes from weight or plum colour.

## Signature details

- **Hero:** the second sentence of the headline is set in plum.
- **Numbering:** lists use small tabular numerals (`01`, `02`) in plum above a thin rule.
- **Logo:** the wordmark is "Fin" in ink and "Her" in plum, both upright. The mark is a plum tile with a lime rising line.
- **Calm surfaces:** cards have a 1px soft border and at most one soft shadow. The hero card is the only element with a shadow.

## Components

- Buttons are pills (`rounded-full`). Primary is plum on cream text. Outline is a 1px border on the card colour.
- Cards use `rounded-2xl` with a 1px `border` and almost no shadow.
- Badges are pills. `variant="cta"` is a 45% lime tint with ink text.
- The active item in the app menu is a plum-tinted pill (`bg-primary/8`), not a solid block.
