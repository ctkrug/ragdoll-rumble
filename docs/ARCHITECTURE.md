# Architecture — Ragdoll Rumble

A map of the codebase for picking up work with fresh context. See `docs/VISION.md` for why it's
built this way and `docs/BACKLOG.md` for what's left.

## Module layout

```
src/
  physics/          Generic, game-agnostic constraint solver. No knowledge of ragdolls.
    vec2.ts           Vec2 math: add/sub/scale/length/normalize/dot/cross.
    point.ts          VerletPoint + integratePoint (position Verlet integration).
    constraint.ts     DistanceConstraint (bone rigidity) + satisfyDistanceConstraint.
    angleConstraint.ts  AngleConstraint (joint limits) + satisfyAngleConstraint.
    capsule.ts        Capsule shape + closestPointsBetweenSegments + resolveCapsuleCollision.
    segment.ts        Segment (a one-sided line) + resolveSegmentCollision: generalizes the old
                       flat-floor clamp to any positioned/tilted line (floor or platform).
    solver.ts         World + step(): integrate, then relax constraints over N iterations,
                       clamping against every World.geometry segment each iteration.
  arena/
    prng.ts           createRng(): seeded mulberry32 generator, so a seed reproduces a layout.
    generator.ts      generateArena(): builds a tilted floor + 1-3 floating platforms from a
                       seed; floorHeightAt() samples the (possibly tilted) floor's height at an x.
  ragdoll/
    skeleton.ts       createRagdoll(): builds a 15-point humanoid rig from the physics
                       primitives (bones, joint limits, and a `limbs` list used for both
                       rendering and collision).
  input/
    keyboard.ts       createKeyboardInput(): tracks key state against a structural
                       KeyEventTarget (so `window` or a test fake both work). Exposes isDown
                       (held) and consumePressed (edge-triggered, once per press).
  duel/
    scene.ts          createDuelScene()/stepDuel(): generates an Arena from a seed, lays out two
                       ragdolls on its floor, and wires ragdoll-vs-ragdoll capsule collision into
                       the solver's iteration loop via World.onIteration. Each stepDuel call also
                       recomputes DuelScene.contactThisStep/contactPoint — whether (and roughly
                       where) a limb pair actually overlapped that step, the real "did a swing
                       land" signal the game loop keys shake/flash/SFX/hitstop off of.
    impulse.ts         applyImpulse(): nudges the limb point for a punch/kick/lunge directly
                       (a Verlet velocity kick, the opposite of a stiffness-relaxed correction).
    controls.ts        ControlScheme + resolveActions()/applyPlayerActions()/facingDirection():
                       maps a player's keymap to edge-triggered actions and aims them at the
                       opponent's current position.
    koDetection.ts     isOffArena()/isPinnedFlat(): frame-level knockout signals read against a
                       Ragdoll + Arena — flung past the playable edge, or lying flat near the
                       floor. Stateless; round.ts owns the pin timer these feed.
    round.ts           MatchState + advanceMatch(): the countdown -> fighting -> roundOver ->
                       (next countdown | matchOver) state machine, scoring, and the pin-on-back
                       accumulator. Mutates its state argument in place like solver.step.
                       recordLandedHit() bumps MatchState.totalHitsLanded, a plain counter the
                       win overlay reads back as a stat.
  ui/
    touchControls.ts  wireTouchControls(): binds on-screen buttons (index.html) to the same
                       applyImpulse path as keyboard input, for the phone-width touch fallback.
                       Gated on match phase the same way keyboard input is; takes an onImpulse
                       hook that fires on every thrown tap (a swing sound), not a landed hit —
                       main.ts checks contactThisStep on the next physics step for that.
    hud.ts             formatScore()/phaseMessage()/matchOverTitle()/matchStatsText() (pure) plus
                       queryHudElements()/renderHud()/triggerWinCelebration() (DOM glue): the
                       round/score panels, countdown, and match-over overlay (title, stats line,
                       K.O. stamp, particle burst) synced from MatchState every frame.
                       renderMuteToggle() is separate — it syncs from the audio engine's mute
                       state, not MatchState, and only runs when that's toggled.
                       triggerWinCelebration() is also one-shot (main.ts calls it exactly once on
                       the roundOver->matchOver transition), since it replaces the DOM particle
                       burst — calling it every frame would restart the animation every frame.
  render/
    canvas.ts         Stage setup: sizes the canvas backing store to devicePixelRatio.
    ragdoll.ts        Draws a Ragdoll's limbs (round-capped strokes) and head (filled circle).
    duel.ts           Clears the frame, draws the arena (floor line + platform bars), renders
                       both ragdolls themed, offset by an optional screen-shake vector, then an
                       optional impact flash on top.
    screenShake.ts     ShakeState + triggerShake()/updateShake()/shakeOffset(): a decaying random
                       offset per docs/DESIGN.md's motion tokens (<=120ms, <=6px). Pure/DOM-free;
                       reduced-motion is a caller-supplied flag, not a matchMedia query in here.
    impactFlash.ts     ImpactFlashState + triggerFlash()/updateFlash()/flashVisual(): a growing,
                       fading white radial burst centered on DuelScene.contactPoint, same
                       decaying-state shape as screenShake.ts. ~100ms per docs/DESIGN.md's
                       game-feedback token.
  audio/
    sfx.ts             SfxEngine + playStep()/playSwing()/playImpact()/playKnockout()/
                       playUiClick(): WebAudio oscillator/noise SFX per docs/DESIGN.md's juice
                       plan, one shared master gain for muting, self-throttled per SFX name.
                       ensureAudioContext() must run from a real user gesture (autoplay policy);
                       every play* function no-ops without a context, so this is safe to import
                       and call in Node (tests) or any environment with no window at all.
                       playStep is still unwired (no locomotion mechanic to key it off); playSwing
                       is now wired to every thrown punch/kick/lunge (see duel/scene.ts above).
  main.ts             Wires it together: creates the stage + duel scene + match state + keyboard
                      input + touch controls + HUD + shake state + impact-flash state + SFX
                      engine, runs a fixed-timestep (1/60s) accumulator loop that gates player
                      input on match phase, freezes physics during "countdown", steps physics,
                      advances the match from koDetection's signals, triggers shake/flash/SFX/a
                      brief hitstop freeze on a confirmed landed hit (not just a thrown swing),
                      fires the win celebration once on match-over, and rebuilds the scene each
                      round.
  style.css           Design tokens (docs/DESIGN.md) as CSS variables, CRT scanline/vignette,
                      touch control + HUD + match-overlay (K.O. stamp, stats, particles) +
                      mute-toggle theming.
```

Tests mirror this layout 1:1 under `tests/` (`tests/physics/`, `tests/arena/`, `tests/ragdoll/`,
`tests/duel/`, `tests/input/`, `tests/ui/`, `tests/render/`).

## Data flow

1. `main.ts` builds a `Stage` (canvas + 2D context sized to devicePixelRatio), a `DuelScene`
   (an `Arena` generated from a seed, plus two `Ragdoll`s sharing one physics `World`), a
   `MatchState` (`createMatchState`, starts in `"countdown"`), a `KeyboardInput` on `window`,
   wires the touch buttons via `wireTouchControls`, and looks up the HUD's DOM elements via
   `queryHudElements`.
2. Each fixed tick, input is gated on `match.phase`: only `"fighting"` calls `applyPlayerActions`
   (edge-triggered punch/kick/lunge → `applyImpulse`, aimed at the opponent's current position,
   returning which actions fired); other phases still drain queued key presses via
   `resolveActions` so a trailing hit doesn't fire the instant the round resumes, and a
   punch/kick/lunge from either player during `"matchOver"` is read as a rematch request instead.
   Touch buttons bypass the polling step entirely, call `applyImpulse` directly on `pointerdown`
   (also phase-gated), and fire the same `onImpulse` hook. Either path throwing a swing plays
   `playSwing` immediately; whether it actually connects is checked after the physics step below.
3. Physics is frozen during `"countdown"` (see the gotcha below); otherwise `stepDuel(scene, 1/60)`
   runs (see below). If the swing thrown this tick resolved as real ragdoll-vs-ragdoll contact
   (`scene.contactThisStep`), that's a landed hit: `triggerShake`, `triggerFlash` (at
   `scene.contactPoint`), `playImpact`, `recordLandedHit`, and a ~45ms hitstop all fire, and the
   rest of this tick's match-advancement is skipped (the freeze picks it back up next tick).
   Otherwise `advanceMatch(match, ko, 1/60)` — fed `isOffArena`/`isPinnedFlat` read against the
   now-stepped scene — advances the countdown timer, the pin-on-back accumulator, and phase
   transitions. A `"fighting"` → `"roundOver"` transition (a real KO, not the initial mount) fires
   `playKnockout`; a `"roundOver"` → `"countdown"` transition rebuilds the `DuelScene` with a
   fresh random seed so every round's arena varies, not just every match's; a transition into
   `"matchOver"` fires `triggerWinCelebration` once.
4. `stepDuel` → `solver.step`: integrates every point under gravity, then runs
   `CONSTRAINT_ITERATIONS` (12) rounds of: satisfy every bone (`DistanceConstraint`), satisfy
   every joint limit (`AngleConstraint`), run `World.onIteration` (ragdoll-vs-ragdoll capsule
   collision, which also updates `contactThisStep`/`contactPoint`), then clamp every point against
   every `World.geometry` segment (the arena's floor and platforms) via `resolveSegmentCollision`,
   with friction.
5. Screen shake and the impact flash update once per rendered frame using real elapsed time (not
   the fixed physics timestep), so they keep animating smoothly through a hitstop freeze even
   though physics itself is paused. `renderDuelScene` clears to the background color, then —
   inside a save/translate/restore offset by `shakeOffset(shake, prefersReducedMotion)` — draws
   the arena (the floor as a thin glowing line, platforms as thicker square-capped bars with a
   bright top edge), calls `renderRagdoll` for each rig (strokes every `Limb` as a round-capped
   line sized to its collision radius, fills the head as a circle), then the impact flash on top.
   `renderHud` then syncs the score panels, round/countdown text, and match-over overlay
   (title/stats/particles) to the current `MatchState`.

## Key design decisions and gotchas

- **`World.onIteration` exists so collision resolves _inside_ the same relaxation loop as bones
  and joints**, not once after. Resolving ragdoll-vs-ragdoll collision only once per frame, after
  bones had already settled, made the correction fight the bone constraints across frames and
  pump energy into the system — the ragdolls would visibly fling themselves off-screen within a
  couple of seconds. Interleaving it fixed that; see the `git log` for `fix(physics)` /
  `fix(duel)` commits if this regresses.
- **`AngleConstraint.stiffness` must stay < 1.** A hard snap-to-limit correction moves a point's
  `pos` without moving `prevPos`, and Verlet's implicit velocity (`pos - prevPos`) reads that as a
  burst of speed. Since gravity re-violates the same joint the same rotational way every frame, a
  stiffness of 1 keeps re-injecting that burst. `satisfyAngleConstraint` also shifts `prevPos` by
  the same delta as `pos` so a correction is velocity-neutral, but the stiffness relaxation is
  still needed for the whole rig to actually settle rather than creep.
- **Geometry collision applies friction** (`FLOOR_FRICTION` in `solver.ts`, passed into
  `resolveSegmentCollision`) by bleeding a point's tangential (along-the-segment) implied velocity
  when it's clamped onto a floor or platform. Without it a resting ragdoll slides indefinitely
  instead of stopping. The old flat-floor clamp only ever touched a point's `x`; the segment
  version generalizes to "the component along the surface," which reduces to the same thing for a
  horizontal segment.
- **Platforms are one-sided and collide against the whole (infinite-feeling but clamped) segment,
  not a box.** A point that's already past a platform's side (`t` clamped to 0 or 1 in
  `resolveSegmentCollision`) snaps to that end rather than wrapping around it. The current impulse
  magnitudes (`duel/impulse.ts`) aren't tuned to reliably launch a ragdoll into a platform edge,
  but revisit this if a future move (e.g. a stronger lunge) makes that reachable.
- **`resolveSegmentCollision` gates on a frame-start position snapshot, not `point.prevPos`.**
  A one-sided segment with no "did it cross this frame" check reads any point below a _finite_
  floating platform as permanently penetrating from any distance — since platforms always spawn
  above a standing ragdoll's head, this used to suck every ragdoll onto the nearest platform and
  fling it off-screen within a couple of frames. `solver.step` snapshots every point's
  post-integration position before relaxation begins and passes it in as `frameStartPos`; only a
  point that was on the surface's near side at that snapshot gets resolved, letting platforms be
  passed under freely. This can't reuse `point.prevPos` for the same check because
  `satisfyAngleConstraint` deliberately mutates `prevPos` mid-frame to stay velocity-neutral, so
  under sustained joint tension it drifts deeper each relaxation iteration right along with `pos`
  instead of holding still — using it let a hand/foot point escape correction and sink through a
  resting floor entirely. `RESOLVE_TOLERANCE` (`segment.ts`) still allows shallow frame-start
  overlap to resolve, so a point isn't permanently stuck the first time it ends a frame a few
  pixels short of full convergence.
- **Platform height band is deliberately clear of a standing ragdoll's head** (`generator.ts`'s
  `PLATFORM_Y_MIN/MAX_FRACTION`, 0.15-0.35 of arena height) so a platform never spawns overlapping
  a ragdoll at rest. They exist to be landed on/flung into with a strong enough hit.
- **Ragdoll scale is capped by both arena height and width** (`duel/scene.ts`). Sizing purely off
  height let a ragdoll's arm-reach exceed the gap between the two starting positions on a narrow
  (phone) viewport, so a fully splayed arm collided at full force on the first frame.
- **No active balance/muscle control.** A ragdoll's joints only resist over-bending; nothing holds
  it upright, and impulses are one-shot kicks to a limb, not a sustained force. Dropped from a
  standing pose it collapses into a heap on its own — that's the intended "ragdoll," not a bug.
- **Impulses are a direct `pos` nudge with `prevPos` untouched** (`duel/impulse.ts`), the mirror
  image of `AngleConstraint`'s correction (which deliberately moves `prevPos` too, to stay
  velocity-neutral). Here the whole point is to inject velocity, so the same Verlet mechanic that
  was a bug for a joint correction is the correct tool for a punch.
- **Keyboard actions are edge-triggered (`consumePressed`), touch taps are not.** Holding a
  keyboard key must fire an action once, not every frame (`60x` a second would be an infinite
  punch machine) — `KeyboardInput.consumePressed` clears its flag on read. A touch `pointerdown`
  is already a single discrete event, so `wireTouchControls` calls `applyImpulse` straight away
  with no separate edge-detection needed.
- **Residual settle drift.** Even with the fixes above, a resting rig can creep a small, bounded
  amount (tens of pixels) before friction damps it out, because the iterative (Gauss-Seidel)
  solver has a solve-order bias that doesn't perfectly cancel. It's not runaway, but it isn't
  zero either — revisit if Epic 1's stiffness/damping/iteration tuning pass calls for it.
- **"Off-arena" is a viewport-edge margin, not a physics boundary.** The floor spans the arena's
  full width and always catches a grounded ragdoll (see the platform-suck-up gotcha above), so it
  can't literally fall off in x. `isOffArena` instead treats a mid-air fling past the visible edge
  (with a small margin) as a KO — catching the moment a hit sends someone off-screen, before
  gravity would otherwise bring them back down onto the same floor.
- **`isPinnedFlat` only checks the floor, not platforms.** Uprightness (torso near-horizontal) and
  height above `floorHeightAt` are cheap, frame-local signals; getting pinned while resting on a
  platform isn't a mechanic yet, so a flat-on-a-platform pose won't accumulate the pin timer. The
  pin timer itself lives in `round.ts`'s `MatchState`, not `koDetection.ts`, since it has to
  persist and reset across frames — `isPinnedFlat` is just this instant's true/false input to it.
- **A simultaneous KO is scored as a draw round**, not resolved by an arbitrary priority order —
  `advanceMatch` checks `koA === koB` before assigning `roundWinner`. The round still ends and a
  new one starts; neither player's score moves.
- **A landed hit is "swing thrown this tick AND `contactThisStep` resolved true," not just a
  thrown action.** `resolveCapsuleCollision`/`resolveRagdollCollisions` now return whether they
  actually found an overlap (plus its midpoint), so `duel/scene.ts` can surface a real "did this
  connect" signal instead of assuming every punch/kick/lunge lands. `playSwing` fires on every
  throw (keyboard or touch) for immediate input feedback; shake/flash/`playImpact`/hitstop only
  fire once the following physics step confirms contact. A swing thrown while the ragdolls are
  already overlapping (e.g. mid-grapple) still reads as a hit — there's no way yet to tell "this
  specific punch reached" from "we were already touching when it was thrown."
- **`playStep` is still unwired** — there's no locomotion mechanic to key it off (see the "no
  active balance/muscle control" gotcha above).
- **Physics is frozen during `"countdown"`** (`main.ts` skips `stepDuel` while `match.phase ===
"countdown"`). It used to run unconditionally every tick, so the full 3-second "3..2..1..FIGHT!"
  window let gravity collapse both standing ragdolls before a single input was accepted (no active
  balance — see above) — occasionally far enough to trigger an instant pin-KO or off-arena draw
  the moment `"fighting"` began, before either player could act. Freezing the spawn pose until
  `"fighting"` starts means a round's outcome depends on what the players actually do.

## Running it

```sh
npm install
npm run dev       # local dev server with hot reload
npm test          # vitest, physics/ragdoll/duel unit tests
npm run typecheck # tsc --noEmit
npm run lint      # eslint
npm run build     # tsc --noEmit && vite build -> dist/
```
