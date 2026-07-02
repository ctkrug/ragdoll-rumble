# Vision — Ragdoll Rumble

## The problem

Ragdoll physics is a genuinely fun thing to watch, but almost every hobby implementation of it
is "drop `matter.js` or `Box2D` in and wire up some joints." That's a legitimate way to ship a
game, but it teaches you nothing about *why* ragdolls look the way they do, and it means the
"physics engine" is really just a rendering layer on someone else's math. Ragdoll Rumble exists
to do the harder, more interesting thing: build the constraint solver itself, tune it by hand
until floppy limbs read as funny instead of glitchy, and turn that into a two-player duel.

## Who it's for

- Charlie, as a portfolio piece that demonstrates real algorithms work (a from-scratch
  Verlet/constraint solver is a much stronger flex than "I imported a physics library").
- Anyone who lands on the page wanting sixty seconds of "two ragdolls hit each other and it's
  funny" — the game has to be immediately playable with no explanation required.
- Local two-player: the intended session is two people on one keyboard, goading each other.

## The core idea

A ragdoll is a small graph of point masses (head, torso, upper/lower arms, upper/lower legs)
connected by distance constraints (limb length) and angle constraints (joint limits, so elbows
don't bend backward). Every frame: integrate all points under gravity via Verlet integration,
then relax every constraint several times so the whole graph converges toward a stable, connected
pose. Player input applies impulses to specific limbs (a punch, a kick, a lunge); the solver
resolves everything downstream — the recoil, the stumble, the tangle with the opponent.

Two of these ragdolls share an arena. Arenas vary procedurally (platform layout, floor tilt,
occasional hazards) so a rematch doesn't play out identically. The win condition is simple and
readable at a glance: knock your opponent off the platform or flat on their back for a beat.

## Key design decisions

- **No physics library, ever.** Verlet integration + iterative constraint relaxation
  (Gauss-Seidel-style), built and tested from primitives up (`Vec2` → `VerletPoint` →
  `DistanceConstraint` → world `step`). This is the entire point of the project.
- **Position-based dynamics, not force-based.** Verlet integration keeps velocity implicit
  (current position minus previous position), which makes constraint satisfaction a simple
  positional correction rather than an impulse/force accumulator — dramatically more stable
  for the kind of over-constrained, many-joint system a ragdoll is.
- **Fixed timestep with an accumulator.** Physics stability must not depend on display refresh
  rate; the render loop decouples simulation steps from frame presentation.
- **Canvas 2D, not WebGL.** The visual complexity here is line segments and circles, not
  shaders — Canvas 2D keeps the renderer simple and lets all the engineering budget go to the
  solver.
- **Static, serverless, client-only.** No backend, no matchmaking server — everything (physics,
  rendering, input, audio) runs in the browser so the whole game is a single relocatable static
  build.

## What "v1 done" looks like

- Two fully-rigged ragdolls (head, torso, two arms, two legs) with working joint limits, dueling
  in a single procedurally-varied arena.
- Local two-player keyboard input driving distinct limb impulses per player, with a touch/tap
  fallback for mobile.
- Ragdoll-vs-ragdoll and ragdoll-vs-arena collision that doesn't explode, tunnel, or lock up.
- A clear win condition, a celebratory win screen with match stats, and a rematch flow.
- Full juice pass per `docs/DESIGN.md`: tweened movement, impact feedback, synthesized WebAudio
  SFX with a persisted mute toggle, and `prefers-reduced-motion` support.
- Deployed as a static build under `apps.charliekrug.com/ragdoll-rumble` with relative asset
  paths throughout.
