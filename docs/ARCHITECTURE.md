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
                       the solver's iteration loop via World.onIteration.
    impulse.ts         applyImpulse(): nudges the limb point for a punch/kick/lunge directly
                       (a Verlet velocity kick, the opposite of a stiffness-relaxed correction).
    controls.ts        ControlScheme + resolveActions()/applyPlayerActions()/facingDirection():
                       maps a player's keymap to edge-triggered actions and aims them at the
                       opponent's current position.
  ui/
    touchControls.ts  wireTouchControls(): binds on-screen buttons (index.html) to the same
                       applyImpulse path as keyboard input, for the phone-width touch fallback.
  render/
    canvas.ts         Stage setup: sizes the canvas backing store to devicePixelRatio.
    ragdoll.ts        Draws a Ragdoll's limbs (round-capped strokes) and head (filled circle).
    duel.ts           Clears the frame, draws the arena (floor line + platform bars), renders
                       both ragdolls themed.
  main.ts             Wires it together: creates the stage + duel scene + keyboard input + touch
                      controls, runs a fixed-timestep (1/60s) accumulator loop that polls both
                      players' actions before each physics step, rebuilds the scene on resize.
  style.css           Design tokens (docs/DESIGN.md) as CSS variables, CRT scanline/vignette,
                      touch control button theming.
```

Tests mirror this layout 1:1 under `tests/` (`tests/physics/`, `tests/arena/`, `tests/ragdoll/`,
`tests/duel/`, `tests/input/`, `tests/ui/`).

## Data flow

1. `main.ts` builds a `Stage` (canvas + 2D context sized to devicePixelRatio), a `DuelScene`
   (an `Arena` generated from a seed, plus two `Ragdoll`s sharing one physics `World`), a
   `KeyboardInput` on `window`, and wires the touch buttons via `wireTouchControls`.
2. Each animation frame, the fixed-timestep accumulator polls each player's `ControlScheme`
   (`applyPlayerActions`) — any edge-triggered punch/kick/lunge becomes an `applyImpulse` call on
   that player's ragdoll, aimed at the opponent's current position — then calls
   `stepDuel(scene, 1/60)` zero or more times, then renders once. Touch buttons bypass the polling
   step and call `applyImpulse` directly on `pointerdown`, since a tap is already a discrete event.
3. `stepDuel` → `solver.step`: integrates every point under gravity, then runs
   `CONSTRAINT_ITERATIONS` (12) rounds of: satisfy every bone (`DistanceConstraint`), satisfy
   every joint limit (`AngleConstraint`), run `World.onIteration` (ragdoll-vs-ragdoll capsule
   collision), then clamp every point against every `World.geometry` segment (the arena's floor
   and platforms) via `resolveSegmentCollision`, with friction.
4. `renderDuelScene` clears to the background color, draws the arena (the floor as a thin glowing
   line, platforms as thicker square-capped bars with a bright top edge), and calls
   `renderRagdoll` for each rig, which strokes every `Limb` as a round-capped line sized to its
   collision radius and fills the head as a circle.

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

## Running it

```sh
npm install
npm run dev       # local dev server with hot reload
npm test          # vitest, physics/ragdoll/duel unit tests
npm run typecheck # tsc --noEmit
npm run lint      # eslint
npm run build     # tsc --noEmit && vite build -> dist/
```
