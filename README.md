# evil tung tung sahur :: scene girl nightmare at 3 a m

A playful, self-contained HTML5 Canvas game. It is 3 a m. The logs are
walking. Pick one of three scene girls and banish the Evil Tung Tung Sahur
before sunrise. Zero dependencies, runs in any modern browser.

![game preview: three scene-girl cards, neon pink/cyan HUD, wooden log
monsters across a dark indigo arena](./preview.txt "preview not included")

## Run it

ES modules need to be served over HTTP (not `file://`). From the repo root:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

Any other static server works too (`npx serve`, `caddy file-server`, etc.).

## Controls

| Action | Key |
| --- | --- |
| Move | `W A S D` or arrows |
| Aim | mouse |
| Attack | left-click (hold to auto-attack) |
| Dodge roll | `Space` |
| Ultimate | `Shift` |
| Swap scene girl | `1` / `2` / `3`, or `Q` / `E` |
| Level-up pick | `1` / `2` / `3` (or click card) |
| Pause | `P` |
| Mute | `M` |
| Restart (death screen) | `R` |

## The roster

- **Raven** — black-teal teased bangs, studded bat. Big melee arcs, high damage.
  Ultimate: spin AoE.
- **Scarlet** — red-platinum choppy layers, thrown scissor-blades. Piercing
  ranged. Ultimate: blade rain.
- **Violet** — purple-pink mohawk, glitter shotgun. 5-pellet spread.
  Ultimate: glitter nova.

Swap mid-run — all three share one HP/XP pool, but each has a distinct
attack, cooldown, and ultimate. Play the matchup.

## The enemies

- **Shambler** — slow basic log.
- **Shrieker** — ranged, spits `TUNG` word-projectiles.
- **Sprinter** — fast, low HP.
- **Mallet** — heavy, knockback on hit.
- **Emo Tung** — dark charcoal log with a swoopy side-bang and a cracked
  heart pendant. Keeps medium distance, sighs a 3-tear heartbreak fan at
  you, and bursts into a radial tear ring on death. Debuts on wave 3.
- **Mallet King** — mini-boss on waves 5 & 10.
- **Tung Tung Supreme** — final boss on wave 15, three phases.

## Progression

- Kills drop XP shards (cyan diamonds). Get enough to level up and pick
  from 3 random upgrades.
- Rare hearts heal. Rare magnets pull every shard toward you.
- Reach wave 15 and defeat Tung Tung Supreme for the sunrise ending.
- High score (`wave · kills · time · victory?`) is kept in `localStorage`
  under `ettsg.highscore`.

## Structure

```
index.html         canvas + HUD overlay + title/death screens
style.css          scene/emo aesthetic, CRT scanlines, neon UI
js/
  main.js          loop, DOM wiring, level-up flow
  game.js          state: update, collisions, wave pacing
  input.js         keyboard + mouse normalized
  audio.js         Web Audio synth cues + chiptune loop (no files)
  waves.js         wave schedule & spawn tables
  upgrades.js      12 level-up upgrades
  draw.js          scene-girl, tung tung, HUD, pickups, bg
  rng.js           small PRNG helpers
  entities/
    player.js      Player + 3 SceneGirl configs
    enemies.js     enemy types + Boss state machine
    projectile.js  shared Projectile + MeleeArc
    pickup.js      XP / heart / magnet
```

Nothing is fetched from the network at runtime — all art is drawn with Canvas
primitives, all audio is synthesized with Web Audio API.

## Tone

It's a brainrot meme joke about the wooden-log monster that comes for those
still awake at 3 a.m. Imagery is intentionally kept to generic 3 a.m.
horror — moon, streetlamps, alley checkerboard — no religious iconography;
the joke is strictly on the meme creature.
