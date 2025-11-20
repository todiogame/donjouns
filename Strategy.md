# Strategy Guide for Donjouns

This document is meant as a playbook for both humans and bots so we can grow a stronger AI. It focuses on the default rules implemented in this codebase: draft items, gear up, dive the dungeon, and score by defeating monsters.

## Objective and Scoring
- Win the current run by ending the dungeon with the highest monster tally; each defeated monster is 1 point, with item bonuses (for example, Golden Golem adds +1).
- Medals track round wins; dying makes you lose one medal if you have any, so survival has meta value.
- Players who flee are excluded from the final count unless everyone else also leaves or dies; poncing (emptying) the dungeon guarantees inclusion.

## Turn Structure Recap
- Phase order: Draft/Selection -> Setup (HP, start-of-game item effects, panoply bonus of +1 HP per color with 3+ items) -> Dungeon loop -> End-of-run scoring.
- On your turn in the dungeon you may either pick the top dungeon card or attempt to escape. After resolving a card, you may pass the turn to the next living player.
- Dungeon cards are either Monsters (fight/execute) or Events (immediate choice/effect). Some events set traps or bonuses for the next monster.

## Core Resources to Track
- HP: base 3 + item bonuses + start-of-game effects; active items often cost themselves, while broken items remove their HP bonus.
- Items: passive (no break) vs active (break after use). Categories: execute, damage reduction, survival/cheat death, HP gain, escape modifiers, scoring, and card control (peek/return).
- Escape roll: 1d6 plus modifiers; must meet/exceed monster power. Some items penalize escape (monkey, heavy gear) or forbid it at low HP (slayer belt).
- Dungeon state: remaining deck size, discard pile top (for Inception/Evil Mirror), and your own defeated stack (Evil Mirror copies top card; Puller puts the top back on the deck).
- Medal pressure: Medal Grinder scales with total medals; protect medals by avoiding lethal trades when you hold one.

## Draft and Item Selection
- Default server config drafts 7 items per player; aim for a balanced kit: one execute vs odd/even or key types (Golem, Lich, Dragon), one survival (aegis, fairy_potion, dragon_potion, noob_ring), one damage reducer (dragon_shield, ice_potion), and at least one escape modifier if your kit adds escape penalties.
- Prioritize HP-rich passive items when you expect long runs or small lobbies; in larger lobbies, tempo executes (glass_axe, bard, pickaxe, hammer) help you stay ahead on monster count.
- Avoid stacking too many active, breakable items without support (repair, mana_potion) or you will run out of answers mid-run.
- Watch color sets: three items of a color at setup grant +1 HP; choose a third of an existing color if the power drop is small.

## Setup Phase Priorities
- Resolve items that require choices before entering (vorpal sword/dagger number or type, printer copy target, belt/amulet picks). Missing these blocks the start of the run.
- Apply start-of-game executes and HP gains early to lock in a safer opening hand.
- If multiple players start the run in the code, `startGame` flags can reorder the first player; coordinate with hosts/bots as needed.

## Dungeon Loop Decisions
- Draw vs escape: draw when HP is comfortable for the likely damage profile of the deck; escape when HP would drop to 0-1 on the next moderate hit and you already lead on points, or when medal protection matters.
- Passing: after clearing a monster it's possible to pass. It's usually the best strategy to play slowly as you usually want to know the final score of your opponents so you dont take unnecessary risks. Sometimes it's still worth it to play again: if you execute the next monster, or know that it will be a small monster.
- Deck pressure: with few cards left, prefer drawing; emptying the dungeon includes you in scoring even if others fled.

## Combat Tactics and Item Use
- Use free/passive executes first (hammer, pickaxe on odd, sacred_book on skeletons, lich_bane, torches, rings) because they do not break and preserve HP.
- Use passive damage reduction when it saves 2+ HP over the coming hits (golem_heart, fire_armor, mage_armor).
- Active executes (glass_axe, bard, bahn, totem, boomerang, dragon_mask, midas, chainsaw, whip) are best spent on: lethal hits, monsters with bad on-hit effects (Puller, Medal Grinder, Rat Rider), or mid-high power when your HP would drop below 50%.
- Survival items (aegis, fairy_potion, dragon_potion, noob_ring) are for lethal blows only; do not burn them to save chip damage.
- Reduction/inversion (ice_potion, dragon_shield) shine against large single hits; if the deck still contains Dragons or 9-power threats, reserve at least one reducer.
- Card control (hourglass, tp scroll, shield effects that replay monsters) can push deadly cards to another player or deeper into the deck; use when behind on HP or ahead on score.
- Resource sacrifice: vs Gluttonous Ooze, sacrifice the lowest future value item (spent active, low HP bonus, or narrow execute you no longer need).

## Events: Accept or Decline
- Accept healing or item gain events when below 60% HP or with <4 intact items (Secret Shop, Healing Angel, Handyman).
- Decline risky gambles when low (Wheel of Fortune at <4 HP), but take them when behind on score and still healthy.
- For Evil Trap, plan to tank or reduce the next monster (execute is blocked); for Ally, wait to draw so you can cash the free execute on a chunky enemy.
- Dragon Skinner/Clay Injection: accept if you hold the relevant monster types to convert them into items/HP; decline if it would give opponents more value than you.

## Escape Policy
- Attempt to escape before drawing if your escape roll modifier puts you near certain success against mid-power monsters (5-7) and dying would drop a medal or remove you from final scoring.
- With escape penalties (monkey, heavy gear), avoid greed: either stack positive modifiers (noob_geta) or commit to fighting.
- Do not try to flee when slayer_belt blocks it under 6 HP; prioritize healing or survival items first.
- If another player passes you a monster on their death/flee, you may still roll to escape without drawing; judge against your current HP and escape modifier.

## Special Monsters to Respect
- Medal Grinder: power equals total medals; execute or reduce immediately to avoid medal loss.
- Rat Rider: +2 damage on top of power 1; treat as a 3-damage spike.
- Puller: on-hit returns your top killed monster to the deck; execute if your top kill is high value.
- Sleeping Dragon: rolls to 9 power half the time; treat as lethal unless you have reduction.
- Mimic: power equals your intact items; firing narrow executes after shedding cheap items can shrink it.
- Evil Mirror: copies your top defeated monster; if your top card is large, prioritize execute or damage reduction.
- Fairy: forces you to pass after beating it; plan turn order so you do not feed a strong chain to the next player.

## Endgame Awareness
- Score = defeated monsters + item bonuses; calculate current lead each turn. If ahead and low HP, escape is often correct; if behind, you must keep drawing and press item efficiency.
- Bots should recalculate score deltas when someone flees (they leave the final count) and when the deck shrinks (poncing includes you automatically).

## Bot Improvement Hooks
- Threat model: compute incoming damage, medal risk, and score delta; only tank hits that keep you alive and ahead in points.
- Item valuation: rank items by saved HP and future coverage; prefer consuming the cheapest coverage first.
- Event policy: simulate expected HP delta and potential opponent gain; accept only if EV is positive or you are behind.
- Escape heuristic: check `escapeRoll + modifier` vs known power bands and pending trap status; avoid burning a turn on low-probability escapes unless death is certain.
- Sacrifice choice: when forced to break an item, pick the one with lowest remaining HP contribution + utility.

Use this guide as the baseline behavior spec for AI iterations and as a checklist for human playtests.
