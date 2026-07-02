# Backlog — Ragdoll Rumble

High-level epic/story breakdown to guide build runs. Stories are intentionally coarse; each
should still be small enough to land as a focused set of commits in one build session.

## Epic 1 — Ragdoll rig

Turn the generic physics core (`src/physics/`) into an actual humanoid.

- [ ] Define a ragdoll skeleton: head, torso, upper/lower arms, upper/lower legs as points
      connected by distance constraints, built on top of the existing `VerletPoint` /
      `DistanceConstraint` primitives.
- [ ] Add angle constraints for joint limits so elbows and knees don't hyperextend or bend
      backward.
- [ ] Add capsule/circle collision shapes per limb segment for arena and opponent collision.
- [ ] Design polish: tune stiffness, damping, and constraint iteration count until the rig
      reads as floppy-but-controllable rather than either rigid or spaghetti.

## Epic 2 — Arena & collision

Give the ragdolls somewhere to fight and something to collide with besides a flat floor.

- [ ] Procedural arena generator: platform layout and floor tilt driven by a seed, reproducible
      per match.
- [ ] Arena geometry collision against line-segment platforms and tilted floors (replace the
      scaffold's flat `floorY` clamp with real segment collision).
- [ ] Ragdoll-vs-ragdoll collision resolution so limbs push apart instead of interpenetrating.
- [ ] Design polish: arena visuals (background, platform styling, lighting) match the tokens
      and aesthetic direction in `docs/DESIGN.md`.

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
