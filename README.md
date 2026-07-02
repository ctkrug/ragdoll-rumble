# Ragdoll Rumble

A slapstick physics duel: two ragdolls swing at each other with wild, floppy momentum in
procedurally varied arenas. No physics engine is imported — the constraint solver that keeps
every limb attached (and every punch believable) is built from scratch in TypeScript.

## Why

Ragdoll physics is usually "install Box2D/Matter.js and drag some joints around." That's a
solved problem if you're willing to depend on someone else's solver. Ragdoll Rumble solves it
itself: a Verlet-integration particle system plus iterative distance/angle constraints, tuned
until two skeletons can stagger, flail, and knock each other over in a way that reads as funny
rather than broken. The physics _is_ the game.

## What it is

- Two humanoid ragdolls, each built from a chain of point masses and constraints (think:
  a stick figure made of rope, not rigid bones).
- Player(s) apply impulses to one ragdoll's limbs; physics resolves everything else — momentum,
  collisions, floor friction, and the inevitable comedic collapse.
- Arenas are procedurally varied: shifting platform layouts, tilted floors, occasional hazards,
  so no two rumbles resolve the same way even with identical inputs.
- Entirely canvas-rendered, entirely client-side, zero server, zero physics library dependency.

## Planned features

- Verlet-integration point-mass system with configurable gravity, damping, and substeps.
- Distance constraints (limb rigidity) and angle constraints (joint limits) solved iteratively
  (Gauss-Seidel-style relaxation) for stable, non-exploding ragdolls.
- Capsule/circle collision against arena geometry and against the opposing ragdoll.
- Procedural arena generation (platform placement, tilt, hazards) with a fixed seed per match
  for reproducible replays.
- Local two-player input (keyboard, split control scheme) driving limb impulses.
- Juicy game feel: impact shake, hit-stop, synthesized WebAudio SFX, and a proper win screen.

## Stack

- **TypeScript** for the engine and game logic — no framework, no runtime dependency beyond
  the DOM/Canvas APIs.
- **Vite** for dev server and static production builds (outputs a single relocatable `dist/`).
- **Vitest** for unit tests against the physics core (points, constraints, solver stability).
- **GitHub Actions** for CI (typecheck, lint, test, build) on every push.

## Status

The physics core (Verlet points, distance constraints, angle/joint-limit constraints, capsule
collision) is built and tested, and two fully-rigged humanoid ragdolls duel in a shared arena
with ragdoll-vs-ragdoll collision. No player input yet — the next milestone is impulse-driven
controls. See [`docs/VISION.md`](docs/VISION.md) for the full design rationale,
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for a map of the code, and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Developing

```sh
npm install
npm run dev       # local dev server with hot reload
npm test          # run the physics unit tests
npm run build     # produce a static dist/ build
```
