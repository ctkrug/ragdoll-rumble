# Design — Ragdoll Rumble

Design direction for the whole product: the in-game UI and the landing page (`site/`) both
follow this brief. Change it only deliberately, in its own commit, with a note on why.

## 1. Aesthetic direction

**Ragdoll Rumble is a retro fight-cabinet:** scanlined CRT glow, chunky pixel-edged UI, and
radioactive neon over a dim arcade-hall dark. It should feel like it's running on a beat-up
cabinet in the back of an arcade — a little grimy, a little glowing, unmistakably a _fighting
game_, not a productivity app.

This is deliberately distinct from a generic "dark mode SaaS" look: hard pixel-ish edges instead
of soft rounded cards, neon magenta/cyan instead of a single muted accent, and a literal CRT
scanline/flicker treatment rather than a flat gradient.

## 2. Tokens

**Color**

| Token                             | Value     | Use                                                 |
| --------------------------------- | --------- | --------------------------------------------------- |
| `bg`                              | `#0b0d17` | page background — near-black indigo, not pure black |
| `surface-1`                       | `#161a2b` | panels, HUD frames                                  |
| `surface-2`                       | `#1f2540` | raised elements, hovered panels                     |
| `text`                            | `#f4f6ff` | primary text                                        |
| `text-muted`                      | `#8b93b8` | secondary text, hints                               |
| `accent` (Player 1 / primary CTA) | `#ff2e6d` | hot magenta — P1 color, primary buttons             |
| `accent-support` (Player 2)       | `#29e0ff` | cyan — P2 color, secondary highlights               |
| `success`                         | `#4dff88` | win states, positive feedback                       |
| `danger`                          | `#ff4d4d` | low health, KO warnings                             |

**Type**

- Display font (wordmark, headings, HUD numerals): **"Press Start 2P"** (Google Fonts), fallback
  `"Courier New", monospace`. Used sparingly — large sizes only, it's illegible at body size.
- UI font (body copy, buttons, stats): **"Space Mono"** (Google Fonts), fallback
  `ui-monospace, "SF Mono", monospace`. Monospace throughout keeps the arcade-terminal feel
  consistent between display and body text.
- Type scale: 1.25 ratio — 12 / 15 / 19 / 24 / 30 / 38 / 48px.

**Spacing & shape**

- Spacing unit: 8px scale (8, 16, 24, 32, 48, 64).
- Corner radius: 2px everywhere (a pixel-edged "chunky, not soft" feel) except the win-screen
  card, which gets 8px to read as a distinct "cabinet insert coin" moment.
- Shadow/glow: neon glow via `box-shadow: 0 0 12px <color>` in the element's accent color on
  focus/active states, plus a fixed CRT scanline overlay (`repeating-linear-gradient` at 2px
  intervals, ~4% opacity) and a soft vignette over the whole viewport.

**Motion**

- UI transitions: 150ms ease-out.
- Game feedback (impact flash, button press): 80–120ms ease-out.
- Screen shake on impact: ≤120ms, ≤6px amplitude, decaying.

## 3. Layout intent

The **hero is the arena** — the duel canvas itself, not a hero banner. It must dominate the
viewport; HUD chrome frames it, never competes with it.

**Desktop (1440×900):** the arena canvas fills the center ~65–70% of viewport width at ~70vh.
Chunky bordered HUD panels sit top-left (P1 health/stamina, magenta-framed) and top-right (P2,
cyan-framed), with a compact round/score readout top-center between them. A footer strip below
the canvas shows control hints and the mute toggle. No empty gutters — side margins are filled
with a subtle scanline-textured background, not blank space.

**Phone (390×844):** the arena canvas fills the top ~55–60vh, full width. HUD bars compress into
a single slim strip above the canvas (P1 left / round center / P2 right). Below the canvas, fixed
touch controls: a virtual D-pad (bottom-left) and two action buttons (bottom-right, ≥44px).

## 4. Signature detail

The wordmark **"RAGDOLL RUMBLE"** renders in the display font with a live CRT flicker (opacity
jitter) and a chromatic-aberration split (red/cyan ghost offsets that snap together on
settle) on load and on hover. The win screen is the other signature moment: on knockout the
screen briefly glitches to static, then cuts to a freeze-frame "K.O." stamp card that scale-bounces
in with the winner's accent color and a pixel-particle burst.

## 5. Juice plan

- **Movement tween:** every limb impulse and menu transition interpolates over 80–120ms — no
  teleporting positions.
- **Impact feedback:** on any solid hit — a white flash at the impact point (~80ms), a ~4–6px
  decaying screen shake (≤120ms), and a brief ~40ms hitstop (simulation pause) to sell weight.
- **Goal/success pop:** a knockout freezes the frame for a beat, then punches in a scale-bounced
  "K.O." stamp.
- **Win celebration:** overlay with a pixel-particle burst in the winner's accent color, a stats
  card (hits landed, longest combo, match duration), and one clear "Rematch" CTA.
- **Synth SFX (WebAudio, oscillators/noise — zero binary assets):**
  - _step_: short low sine blip, low volume, rate-throttled.
  - _swing/whiff_: filtered noise burst with fast decay.
  - _impact/hit_: square wave with a fast pitch drop, layered with a short noise "crunch."
  - _knockout_: rising square-wave arpeggio, the one moment allowed to be loud.
  - _UI click_: short triangle-wave blip.
  - All SFX route through a shared gain node; a mute button (HUD footer) toggles it and persists
    to `localStorage`. The `AudioContext` is created lazily on first user gesture (keydown or
    click) and every call site guards for its absence (tests, unsupported environments).
- Respect `prefers-reduced-motion`: drop screen shake and particle bursts, keep flashes/stamps as
  instant state changes instead of animated ones.
