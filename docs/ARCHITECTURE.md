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
    solver.ts         World + step(): integrate, then relax constraints over N iterations.
  ragdoll/
    skeleton.ts       createRagdoll(): builds a 15-point humanoid rig from the physics
                       primitives (bones, joint limits, and a `limbs` list used for both
                       rendering and collision).
  duel/
    scene.ts          createDuelScene()/stepDuel(): lays out two ragdolls sharing one World,
                       wires ragdoll-vs-ragdoll capsule collision into the solver's iteration
                       loop via World.onIteration.
  render/
    canvas.ts         Stage setup: sizes the canvas backing store to devicePixelRatio.
    ragdoll.ts        Draws a Ragdoll's limbs (round-capped strokes) and head (filled circle).
    duel.ts           Clears the frame, draws the floor line, renders both ragdolls themed.
  main.ts             Wires it together: creates the stage + duel scene, runs a fixed-timestep
                      (1/60s) accumulator loop, rebuilds the scene on resize.
  style.css           Design tokens (docs/DESIGN.md) as CSS variables, CRT scanline/vignette.
```

Tests mirror this layout 1:1 under `tests/` (`tests/physics/`, `tests/ragdoll/`, `tests/duel/`).

## Data flow

1. `main.ts` builds a `Stage` (canvas + 2D context sized to devicePixelRatio) and a `DuelScene`
   (two `Ragdoll`s sharing one physics `World`).
2. Each animation frame, the fixed-timestep accumulator calls `stepDuel(scene, 1/60)` zero or
   more times, then renders once.
3. `stepDuel` → `solver.step`: integrates every point under gravity, then runs
   `CONSTRAINT_ITERATIONS` (12) rounds of: satisfy every bone (`DistanceConstraint`), satisfy
   every joint limit (`AngleConstraint`), run `World.onIteration` (ragdoll-vs-ragdoll capsule
   collision), then clamp any point below the floor back onto it (with horizontal friction).
4. `renderDuelScene` clears to the background color, draws the floor line, and calls
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
- **Floor collision applies friction** (`FLOOR_FRICTION` in `solver.ts`) by bleeding a point's
  horizontal implied velocity when it's clamped to the floor. Without it a resting ragdoll slides
  indefinitely instead of stopping.
- **Ragdoll scale is capped by both arena height and width** (`duel/scene.ts`). Sizing purely off
  height let a ragdoll's arm-reach exceed the gap between the two starting positions on a narrow
  (phone) viewport, so a fully splayed arm collided at full force on the first frame.
- **No active balance/muscle control yet.** A ragdoll's joints only resist over-bending; nothing
  holds it upright. Dropped from a standing pose it immediately collapses into a heap — this is
  correct for the current feature set (Epic 3, player-applied impulses, isn't built yet) and is
  the expected look until input lands.
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
