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
      instability this run (angle-constraint corrections were injecting momentum and flinging
      the rig off-screen — see `docs/ARCHITECTURE.md`), but there's no active balance yet, so a
      standing ragdoll just collapses into a heap; "controllable" needs Epic 3's player impulses
      to evaluate meaningfully.

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

- [ ] Two-player keyboard input with distinct, non-overlapping control schemes.
- [ ] Touch/tap control fallback for mobile (on-screen directional + action controls).
- [ ] Impulse application: map input actions (punch, kick, lunge) to limb impulses.
- [ ] Win condition detection (knocked off-arena or pinned-on-back past a threshold) plus
      countdown → round → rematch match flow.

## Epic 4 — Juice & ship

Make it feel good and get it in front of people.

- [ ] Movement tweening and impact feedback: bump/flash/shake on collision per the juice plan
      in `docs/DESIGN.md`.
- [ ] WebAudio-synthesized SFX (hit, step, win) with a mute toggle persisted to localStorage.
- [ ] Win celebration overlay (match stats, particles, rematch CTA) plus `prefers-reduced-motion`
      support throughout.
- [ ] Design polish: bring the landing/site page (`site/`) to the same brand and tokens as the
      in-game UI, and verify the static build serves correctly from a subpath.
