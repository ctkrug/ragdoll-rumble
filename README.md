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
- Two-player local duel: keyboard (split control scheme) or on-screen touch controls throw
  punches, kicks, and lunges; physics resolves everything else — momentum, collisions, floor
  friction, and the inevitable comedic collapse.
- A best-of-3 round/match flow with a countdown, knockout detection (flung off-arena or pinned
  on your back), score HUD, and a win-celebration overlay with match stats.
- Impact feedback: screen shake, an impact flash at the point of contact, a brief hitstop
  freeze-frame, and synthesized WebAudio SFX with a persisted mute toggle.
- Arenas are procedurally varied: shifting platform layouts and tilted floors driven by a seed,
  so no two rumbles resolve the same way (and a seed reproduces one exactly).
- Entirely canvas-rendered, entirely client-side, zero server, zero physics library dependency.

## Stack

- **TypeScript** for the engine and game logic — no framework, no runtime dependency beyond
  the DOM/Canvas APIs.
- **Vite** for dev server and static production builds (outputs a single relocatable `dist/`).
- **Vitest** for unit tests against the physics core (points, constraints, solver stability).
- **GitHub Actions** for CI (format, lint, typecheck, test, build) on every push.

## Status

Feature-complete and in QA hardening: the physics core (Verlet points, distance/angle
constraints, capsule collision), procedural arenas, two-player input, the full countdown ->
round -> match loop, and the juice pass (shake, impact flash, hitstop, SFX, win celebration)
are all built and tested. See [`docs/VISION.md`](docs/VISION.md) for the full design rationale,
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for a map of the code, and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for what's left.

## Developing

```sh
npm install
npm run dev         # local dev server with hot reload
npm test            # run the unit test suite
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier --check
npm run build       # produce a static dist/ build
```

## Playing

Open the dev server in a browser. Two players share the keyboard:

| Action | Player 1 | Player 2 |
| ------ | -------- | -------- |
| Punch  | `F`      | `/`      |
| Kick   | `G`      | `.`      |
| Lunge  | `H`      | `,`      |

On a phone-width viewport, on-screen touch buttons replace the keyboard controls. First to 2
round wins takes the match; hit Rematch (or throw a punch/kick/lunge) to go again.
