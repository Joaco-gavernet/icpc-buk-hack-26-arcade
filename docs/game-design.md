# 1v1 Snake Arcade – Game Design (Final)

## Core mechanics

- **Two snakes**: Player 1 and Player 2 share one arena (same screen).
- **Controls**
  - Player 1: **WASD** (W up, S down, A left, D right).
  - Player 2: **Arrow keys**.
- **Movement**
  - Grid-based; cell size fixed (e.g. 16px).
  - Fixed tick rate: 8–10 steps per second (configurable).
  - Direction change applied on next tick (input buffering).
  - **No 180° reversal**: cannot go from UP to DOWN or LEFT to RIGHT in one step (avoids self-collision bugs).
- **Growth**
  - Collecting **food** (single pellet on grid) adds one segment; food respawns in a free cell.
  - Optional: **Growth bomb** power-up makes opponent grow for a short time.
- **Lose conditions (round end)**
  - Hit **wall** → you die.
  - Hit **own body** → you die.
  - Hit **opponent body** → you die.
  - **Head-on** (both heads same cell): both die → round draw (no point); or optional “last input wins” for tie-break.
- **Scoring**
  - Best-of-N (e.g. first to **3** round wins).
  - Each round win = 1 point; draw = 0.
  - Score HUD always visible (e.g. “P1 2 – 1 P2”).

## Power-ups (2–3)

1. **Speed boost** – Your snake moves faster for ~3 s. Higher risk (harder to turn in time).
2. **Ghost** – You pass through walls and bodies for ~2–3 s. Clear visual (e.g. flicker / outline).
3. **Growth bomb** – Opponent gains extra segments over ~2 s (e.g. +1 segment per tick for 1 s). Visual indicator on opponent.

Spawn: one power-up at a time; random free cell; respawn after collect or after ~15 s. Only one of each type active per snake.

## Arena

- **Default**: Rectangle with solid walls (no obstacles).
- **Variant (optional)**: Central obstacle or corner blocks so each round can feel slightly different.
- Grid dimensions: e.g. 25×19 cells (400×304 px at 16px/cell) to fit 800×600 with HUD.

## Round and match flow

- **Round start**: 3 – 2 – 1 – GO countdown (inputs locked until GO).
- **Round end**: One or both die → brief “Round winner” or “Draw” → short delay → next round or match end.
- **Match end**: “Player X wins” + final score; prominent **Play again / Revancha** button (Enter or key).

## Replayability and variation

- **“One more”**: Big “Play again” after match.
- **Variation**: Random power-up spawn type/position; optional random arena layout; **comeback**: losing player gets slight speed bonus (e.g. +5% move rate) until score ties.

## Balance (target)

- Base speed: 8–10 ticks/s. Speed power-up: ~12–14 ticks/s.
- Food: one on field; respawn in &lt;1 s in free cell.
- Power-up duration and spawn interval tuned so rounds stay 30–90 s and matches &lt;2 min.

## Claridad and feedback

- **Visual**: P1 snake one color (e.g. cyan/green), P2 other (e.g. magenta/pink); distinct head; walls and power-ups readable; HUD minimal but clear.
- **Audio**: Move tick (optional subtle), collect food, collect power-up, collision/death, round win, match win.
- **No ambiguity**: Round winner and match winner clearly stated; rules consistent every round.

## Creatividad (bonus)

- Twist: **1v1 competitive snake** with power-ups (ghost, growth bomb, speed) and optional comeback mechanic.
- One memorable moment: e.g. ghost phase dash through opponent, or clutch round win on match point.
