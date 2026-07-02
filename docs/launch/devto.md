# I built a ragdoll fighting game with a physics engine written from scratch

Most browser physics toys start the same way: `npm install matter-js`, wire up some joints, done.
That is a perfectly good way to ship a game, but it always bugged me that the "physics engine" in
those projects is really someone else's math with a render layer on top. So for
[Ragdoll Rumble](https://apps.charliekrug.com/ragdoll-rumble/) I gave myself one rule: no physics
library. Just Verlet integration and constraint relaxation, built up from `Vec2` primitives, tuned
by hand until two floppy stick figures could stagger around and knock each other over.

It is a two-player game. You and a friend share a keyboard, throw punches, kicks, and lunges, and
try to fling each other off the arena. The code is [on GitHub](https://github.com/ctkrug/ragdoll-rumble).
Here are the two bugs that taught me the most.

## Collision has to happen inside the relaxation loop

A ragdoll is a small graph of point masses connected by distance constraints (limb lengths) and
angle constraints (so elbows do not bend backward). Each frame you integrate every point under
gravity, then relax the constraints several times so the whole graph converges to a connected pose.

My first version resolved ragdoll-vs-ragdoll collision once per frame, after all the bone
constraints had already settled. It looked fine for about two seconds, and then both ragdolls
launched themselves into orbit. The reason is that pushing two overlapping limbs apart moves points
that the bone constraints had just carefully positioned. On the next frame the bones correct back,
the collision pushes apart again, and that back-and-forth quietly injects energy every frame until
the whole thing detonates.

The fix was to run collision resolution as one more step _inside_ the relaxation iterations,
alongside the bones and joints, so every correction is negotiated against every other correction in
the same convergence pass instead of fighting across frames. I exposed it as an `onIteration` hook
on the solver so the generic physics core stays unaware of ragdolls. That one change turned "explodes
instantly" into "settles into a heap," which is exactly what you want from a ragdoll.

## A one-sided platform tried to eat everyone

Platforms are one-sided line segments: you can jump up through one and land on top, but you should
not pass through it going down. To do that, a point needs to know which side of the segment it was
on at the start of the frame, so the collision only fires on a genuine crossing.

My mistake was reusing `point.prevPos` (the previous frame's position) for that "which side" check.
It seemed obvious, but the angle constraints deliberately shift `prevPos` mid-frame to keep their
corrections velocity-neutral. Under sustained joint tension, `prevPos` drifts along with the current
position, so the check kept reading "this point started above the platform" every iteration, and the
platform reached out and pulled distant ragdolls straight into it. They would spawn, get yanked into
the nearest floating platform, and fling off-screen within a few frames.

The real fix was to snapshot each point's position once, right after integration and before any
relaxation, and use that fixed snapshot for the crossing test. `prevPos` is the wrong tool here
because it is intentionally not the value it looks like.

## What surprised me, and what is next

The thing I did not expect: because the rig has no active balancing (nothing holds it upright), a
standing ragdoll collapses on its own in about two seconds. That is correct ragdoll behavior, but it
meant that during the three-second "3, 2, 1, FIGHT" countdown, both fighters would melt to the floor
before either player could move, sometimes triggering an instant knockout. The fix was almost funny:
freeze the simulation entirely during the countdown so the round only starts once players can act.

If I keep going, the next step is active muscle control so a ragdoll can try to stand, which turns
"flail wildly" into something closer to a skill. A computer opponent for solo play is the other
obvious gap, since right now it is strictly couch multiplayer.

If you want to try it, it runs entirely in the browser with no install:
[apps.charliekrug.com/ragdoll-rumble](https://apps.charliekrug.com/ragdoll-rumble/). Source and the
full architecture notes are [on GitHub](https://github.com/ctkrug/ragdoll-rumble).
