# Backlog — Ragdoll Rumble

High-level epic/story breakdown to guide build runs. Stories are intentionally coarse; each
should still be small enough to land as a focused set of commits in one build session.

## Epic 1 — Ragdoll rig

Turn the generic physics core (`src/physics/`) into an actual humanoid.

- [x] Define a ragdoll skeleton: head, torso, upper/lower arms, upper/lower legs as points
      connected by distance constraints, built on top of the existing `VerletPoint` /
      `DistanceConstraint` primitives. (`src/ragdoll/skeleton.ts`)
- [x] Add angle constraints for joint limits so elbows and knees don't hyperextend or bend
      backward. (`src/physics/angleConstraint.ts`, wired into `solver.step`)
- [x] Add capsule/circle collision shapes per limb segment for opponent collision.
      (`src/physics/capsule.ts`, used by `duel/scene.ts` for ragdoll-vs-ragdoll). Arena-geometry
      collision (vs. platforms) landed in Epic 2 (`src/physics/segment.ts`).
- [ ] Design polish: tune stiffness, damping, and constraint iteration count until the rig
      reads as floppy-but-controllable rather than either rigid or spaghetti. Fixed a real
      instability early on (angle-constraint corrections were injecting momentum and flinging
      the rig off-screen — see `docs/ARCHITECTURE.md`); there's still no active balance, so a
      standing ragdoll collapses into a heap on its own. Epic 3's impulses now exist to evaluate
      "controllable" against, but haven't been playtested/tuned for it yet.

## Epic 2 — Arena & collision

Give the ragdolls somewhere to fight and something to collide with besides a flat floor.

- [x] Procedural arena generator: platform layout and floor tilt driven by a seed, reproducible
      per match. (`src/arena/prng.ts`, `src/arena/generator.ts`)
- [x] Arena geometry collision against line-segment platforms and tilted floors (replace the
      scaffold's flat `floorY` clamp with real segment collision). (`src/physics/segment.ts`,
      `World.geometry` in `src/physics/solver.ts`)
- [x] Ragdoll-vs-ragdoll collision resolution so limbs push apart instead of interpenetrating.
      (landed in Epic 1 as `resolveRagdollCollisions` in `duel/scene.ts`; verified here with
      `tests/duel/scene.test.ts`'s overlap test)
- [x] Design polish: arena visuals (background, platform styling, lighting) match the tokens
      and aesthetic direction in `docs/DESIGN.md`. (platforms render as square-capped bars with a
      bright top-edge light strip in `src/render/duel.ts`; background/CRT overlay predate this
      epic and already matched)

## Epic 3 — Duel loop

Turn two rigged ragdolls into an actual playable match.

- [x] Two-player keyboard input with distinct, non-overlapping control schemes.
      (`src/input/keyboard.ts`, `src/duel/controls.ts`'s `PLAYER_ONE_CONTROLS`/
      `PLAYER_TWO_CONTROLS`)
- [x] Touch/tap control fallback for mobile (on-screen action controls). (`src/ui/touchControls.ts`,
      the `#touch-controls` buttons in `index.html`). No directional pad yet — there's no
      locomotion mechanic for one to control (see the next unchecked item and
      `docs/ARCHITECTURE.md`'s balance/muscle-control note); revisit if movement lands.
- [x] Impulse application: map input actions (punch, kick, lunge) to limb impulses.
      (`src/duel/impulse.ts`, wired into `main.ts`'s fixed-timestep loop via
      `applyPlayerActions`/`wireTouchControls`)
- [x] Win condition detection (knocked off-arena or pinned-on-back past a threshold) plus
      countdown → round → rematch match flow. (`src/duel/koDetection.ts`'s `isOffArena`/
      `isPinnedFlat`, `src/duel/round.ts`'s `MatchState`/`advanceMatch` state machine, wired into
      `main.ts`'s tick loop; HUD in `src/ui/hud.ts` + `index.html`'s `#hud`/`#match-overlay`.
      Best-of-3 rounds, a simultaneous KO draws the round, rematch via the on-screen button or a
      punch/kick/lunge from either player once `matchOver` settles.) Along the way, found and
      fixed a real physics bug this depended on: platforms were sucking in any point below them
      from any distance rather than only a genuine crossing, flinging every ragdoll into orbit
      within a couple of frames — see `docs/ARCHITECTURE.md`'s `resolveSegmentCollision` gotcha.
- [x] Design polish: playtested impulse magnitudes in `duel/impulse.ts` against real matches.
      The magnitudes themselves read fine — a punch/kick/lunge lands as a clear, deliberate hit,
      and a flurry can realistically fling a ragdoll off-arena within a few exchanges, which
      matches the "slapstick" brief. What actually needed fixing wasn't the impulses: `main.ts`
      stepped physics unconditionally every tick, including through the 3-second countdown, so
      with no active balance (Epic 1) both ragdolls could collapse — sometimes hard enough to
      trigger an instant pin-KO or off-arena draw — before `"fighting"` ever unlocked input.
      Freezing physics during `"countdown"` (`docs/ARCHITECTURE.md`'s gotcha) fixed that; no pin
      threshold or KO geometry retuning was needed once round outcomes reflected real play.

## Epic 4 — Juice & ship

Make it feel good and get it in front of people.

- [x] Movement tweening: already inherent — every limb is a real Verlet point rendered every
      frame, so motion is continuous, never a teleport. Impact feedback, fully landed this pass:
      screen shake (`src/render/screenShake.ts`, ≤120ms/≤6px per `docs/DESIGN.md`,
      `prefers-reduced-motion` aware), an impact flash at the point of contact
      (`src/render/impactFlash.ts`), and a ~45ms hitstop freeze-frame (`main.ts`) — all three now
      fire only on a confirmed landed hit (`DuelScene.contactThisStep`), not just a thrown swing.
- [x] WebAudio-synthesized SFX (`src/audio/sfx.ts`): step/swing/impact/knockout/uiClick
      oscillator+noise SFX, one shared gain node, self-throttled, mute toggle in the HUD
      persisted to `localStorage`, `AudioContext` created lazily on first user gesture. Wired
      into gameplay: `playSwing` on every thrown punch/kick/lunge, `playImpact` on a confirmed
      landed hit, `playKnockout` on a real KO, `playUiClick` on the mute/rematch buttons.
      `playStep` is still unwired — no locomotion mechanic to key it off (see
      `docs/ARCHITECTURE.md`'s gotcha).
- [x] Win celebration overlay (match stats, particles, rematch CTA) plus `prefers-reduced-motion`
      support throughout. The overlay now leads with a rotated "K.O." stamp-card moment that
      thumps into place, a stats line (rounds played, total hits landed via
      `MatchState.totalHitsLanded`), and a particle burst themed to the winner's color
      (`src/ui/hud.ts`'s `triggerWinCelebration`), before the existing title + rematch CTA.
      Reduced motion drops the stamp animation and particles, keeps the text.
- [x] Design polish: because the game is servable, its landing page is the app page itself. A
      static `.about` marketing/SEO section lives below the fold in `index.html` (wordmark, View on
      GitHub CTA, benefit-framed features, control reference, "how it's built", FAQ, and a
      portfolio cross-promo link), sharing `docs/DESIGN.md`'s tokens so game and page are one
      brand. Verified the built output serves correctly with only relative asset paths, at desktop
      and phone widths. (An earlier standalone `public/site/` landing was folded into this section
      and removed, since the served front door is the game, not a separate page.)
