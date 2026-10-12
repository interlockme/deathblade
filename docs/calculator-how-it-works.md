---
search:
  exclude: true
description: "How the Ark Passive Calculator works: what Top Combinations ranks, how uptimes and the Support are modeled, how Attack Power, crit layers, Ark Grid cores, comparison panels and engravings are valued, and every assumption behind the numbers."
---

# How the Ark Passive Calculator Works

This page explains what the [Ark Passive Calculator](resources.md) computes, what it assumes, and why. If you only want the idea, read **In short**. Every section after it opens with **In plain terms**. The **The math** blocks (click to open) hold the formulas and worked examples so you can check any number yourself, and **Assumptions** say what is estimated and how that could be wrong. Examples use the calculator's default inputs on the RE 333 build unless stated, so you can reproduce them.

## In short

<div class="setup-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Short</span>Key points<span class="setup-note-arrow"></span></summary>

- **Everything is a ratio against your current setup.** "% of best" and "gain" compare one choice to another with everything else held equal. The calculator never predicts absolute DPS and does not simulate a rotation. It models your damage chain: crit, Crit Damage, Evolution Damage, Additional Damage and Attack Power.
- **Top Combinations** scores nine Evolution setups (three keystone pairs times three point splits) against your own stats and shows the best five. Gaps under 0.5 percentage points are a tie, so pick what is easier to play.
- **Sometimes-on bonuses** (Adrenaline, Back Attack, Flash Orb, Maelstrom) are not averaged before the crit cap. Each on/off combination is worked out, capped, and then weighted by how likely it is.
- **A Support is assumed by default**, a generic above-average one. It raises your Attack Power, so lines that raise only your own Weapon Power or Main Stat are worth less than they would be alone. Percent Attack Power is not diluted.
- **Comparisons re-pick your best keystones for each option.** A bracelet is credited for a keystone change it makes possible. This "realized gain" is never lower than the gain with keystones held fixed.
- **Defaults are typical values from combat logs.** Change them to your own. The numbers are best-effort estimates from in-game tooltips, in-game tests and logs of many players, not a measurement of your character.
- **Not modeled:** skill-by-skill differences, Optimized Training 1's cooldown reduction, Attack Speed, Ability Stone penalties and the Support's own gearing. The full list is at the end.

</details>

</div>
</div>

## Top Combinations

**In plain terms.** The Evolution tree lets you pick two of three Tier 4 keystones (Critical, Master, Pulverize) and split your Limit Break and Keen Sense points. That gives nine setups. The calculator scores all nine against your stats and shows the best five, each as a percentage of the best one. A tab click previews a lower-ranked setup, and the pin button makes the panels below use it, which is how you test a setup you prefer.

<div class="setup-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tie</span>Reading close results<span class="setup-note-arrow"></span></summary>

Gaps under 0.5 percentage points of DPS are a tie for practical purposes: choose by what is easier to play or what you already have. In the example below the first three are inside that band. The 0.5 is a rule of thumb, not a measured error bar. The model uses one blended crit rate for the whole fight, so differences much smaller than that are below what it can resolve.

</details>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

Each of the nine cells (3 keystone pairs times 3 point splits) gets a score:

```text
score = ((1 - c) + c * CritDmg * (1 + onCrit)) * (1 + evo) * (1 + add)
```

then times 0.98 if Keen Blunt Weapon is equipped (its downside, see Assumptions).

- `c` is your effective crit rate, capped at 100%. How it is averaged over uptimes is in the next section.
- `CritDmg` is your total Crit Damage (base 2.0 plus rings, bracelet, Keen Blunt Weapon, Swift core and the other sources).
- `onCrit` is the extra damage on crit hits (Crit Hit Damage Synergy and similar). The Critical keystone multiplies it by 1.12.
- `evo` is Evolution Damage. Pulverize adds 20% of it.
- `add` is Additional Damage. Master adds 8.5% of it.
- Master also adds 7% crit rate. That bonus shares the 100% cap, so Master is worth less as your crit rate approaches the cap.

"% of best" is each cell's score divided by the best cell's score, so the best cell is always 100.00%. The ranking itself ignores the pin. If later edits push a pinned cell below fifth place, it stays visible in the fifth row with its true rank shown, because every panel below is still computed against it.

**Worked example (defaults, RE 333).** The top five are:

| Rank | Setup | % of best |
|---|---|---|
| 1 | LB1/KS2, Master + Pulverize | 100.00% |
| 2 | LB2/KS1, Master + Pulverize | 99.81% |
| 3 | LB1/KS2, Critical + Pulverize | 99.66% |
| 4 | LB3, Master + Pulverize | 99.47% |
| 5 | LB1/KS2, Critical + Master | 99.35% |

With the best cell your effective crit rate reads 92.38% (77.38% before the picks), Evolution Damage 81.00% (41.00% before) and Additional Damage 46.86% (38.36% before).

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

- One blended crit rate and one multiplier chain for the whole fight. Skill-by-skill differences are not modeled.
- Optimized Training 1's cooldown reduction is not modeled, only its Evolution Damage.
- The party Damage Synergy scalar from the reference spreadsheets is omitted. It multiplies all nine cells equally, so it cannot change which cell wins or any "% of best".
- Keen Blunt Weapon's downside is an expected value: a 10% chance of -20% damage, a flat x0.98 on the score.

</details>

</div>
</div>

## Uptimes and estimated inputs

**In plain terms.** Many bonuses are only on part of the time: Adrenaline stacks, Back Attack, Flash Orb, Maelstrom. The calculator does not simply add "bonus times uptime" to your crit rate, because crit rate is capped at 100% and averaging before the cap overstates what you get near the cap. It works out every on/off combination first, caps each one, and only then averages.

<div class="setup-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

**Crit rate.** There are three independent sometimes-on terms: Adrenaline (bonus times uptime), Back Attack (10% times your effective back attack share) and Flash Orb (bonus times uptime). `blendCritTerms` enumerates every on/off combination, caps each at 100%, and weights each by its joint probability. Averaging first and capping afterwards would be wrong because the cap is concave.

Example (Flash Orb left out to keep it to two terms): base crit 75%, Adrenaline +20% at 97% uptime, Back Attack +10% at 90%. Averaging first gives 75% + 19.4% + 9% = 103.4%, capped to 100.000%. The joint-probability method gives 99.035%:

| Adrenaline | Back Attack | Probability | Crit rate |
|---|---|---|---|
| on | on | 87.3% | 105% capped to 100% |
| on | off | 9.7% | 95% |
| off | on | 2.7% | 85% |
| off | off | 0.3% | 75% |

Weighted: 0.873 + 0.09215 + 0.02295 + 0.00225 = 0.99035. Raid Captain's Move Speed uses the same expand-then-cap logic, shown in Engravings and Raid Captain.

**Adrenaline.** Your uptime input is the share of damage dealt at 6 stacks, which is the figure a damage meter reports. The Crit Rate bonus needs all 6 stacks, so it scales by that uptime alone. The Attack Power bonus applies per stack, so it gets partial credit while stacks rebuild. Outside 6 stacks you rebuild one stack per cast, so the first five casts average 3 of 6 stacks, or 0.5:

```text
AP from Adrenaline = full * (U + (1 - U) * 0.5)
full = 6 stacks * (0.9% + stone bonus per stack)
```

At the defaults (4 nodes, no stone) the full value is 5.4% Attack Power:

| Uptime | Adrenaline AP | Adrenaline crit | Effective crit rate (before picks) | Final Attack Power |
|---|---|---|---|---|
| 100% | 5.40% | 20.0% | 77.98% | 346,412 |
| 97% | 5.32% | 19.4% | 77.38% | 346,161 |
| 80% | 4.86% | 16.0% | 73.98% | 344,741 |
| 50% | 4.05% | 10.0% | 67.98% | 342,233 |

**Back Attack.** The input is the Back Attack Rate from the Combat Analyzer's Overview tab, which is a hit rate (the share of hits that were back attacks) limited to skills that can back attack. It is not damage-weighted. The calculator uses it as the damage share of those skills, which holds when their hits are similar in size. On Surge builds the share is 0.95 times that rate. On RE builds the skills that always land as back attacks (Surge, which also scales with Specialization) take their own share and the rest is gated by your rate, so the guaranteed back attack is not counted twice.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

- The sometimes-on terms are treated as independent. In practice you aim to back attack as much as possible and keep Adrenaline stacks, so they are usually on together, and Flash Orb is RNG with low uptime. High uptimes make the independence assumption close to harmless.
- The 0.5 rebuild share is a derivation, not a measurement. Later skills hit harder and would push it slightly higher, by about 0.1 Attack Power points at 80% uptime.
- The Adrenaline input has no floor. Very low values are legitimate what-ifs, but an uptime of 0 still reports half the AP bonus, which cannot happen in a fight.
- Defaults (Adrenaline 97%, Support 98%, Back Attack Rate 85%, Maelstrom 85/80/90, Rage Rune 20%, Paladin 35%) are typical values from logs, not claims about your character.

</details>

</div>
</div>

## Support

**In plain terms.** Most raid parties have a Support, and a Support raises your Attack Power. If the calculator ignored that, it would overvalue upgrades that only raise your own Weapon Power or Main Stat, because the Support's share does not grow with them. So Support is on by default, modeled as a generic Support: above average, not maxed, with the same Weapon Power, Main Stat and kind of Ability Stone as you, and the gearing a Support like that would likely have.

When you compare "what if I had this line", the Support is held at its current value, because the line is yours, not your Support's. So lines that raise only your own Weapon Power, Main Stat or flat Attack Power are diluted, and Percent Attack Power is not. This is the low end of a range. The real answer for your party sits between the shown value and the case where your Support gears up alongside you.

<div class="setup-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

```text
AP = floor( ( sqrt(WP * MainStat / 6) * BaseAP + FlatAP + SupportBuff ) * PercentAP )
SupportBuff = sqrt(WP * MainStat / 6) * BaseAP * 0.4 * (SupportUptime / 100)
```

The Support's buff is a flat amount inside the bracket, so Percent AP multiplies it too. The 0.4 comes from the reference spreadsheet's Support profile with specific gearing. That profile is the one modeled, rather than gearing a Support ourselves, so the Support bracelet's own "Ally Atk. Power Enhancement" line is not modeled separately.

At the defaults (98% uptime) the Support adds about 39% to your Attack Power: the final readout is 249,529 without it and 346,161 with it, a difference of 96,632. The Support's own term inside the bracket is 86,411; the Percent AP multiplier then applies to it like everything else in the bracket, which is why the final difference is larger. The checkbox also turns on the +14% Evolution Damage that goes with having a Support and the Support's Move Speed bonus (its Attack Speed bonus is not scored, see Engravings and Raid Captain), so switching it off changes more than Attack Power. At the defaults it also changes the ranking: LB2/KS1 Master + Pulverize moves to first.

**Why it dilutes some gains and not others.** A bracelet line that raises your Weapon Power acts on only your part of the bracket. Percent Attack Power multiplies the whole bracket, Support included. From the bracelet table at the defaults:

| Bracelet line | With Support | Without Support |
|---|---|---|
| Weapon Power +7200 | 1.05% | 1.45% |
| Weapon Power +9000 | 1.31% | 1.81% |
| Attack Power +0.4% (percent) | 0.37% | 0.37% |

The Weapon Power rows keep about 72% of their no-Support value, which is 1 / (1 + 0.4 * 0.98). A calculator that ignored the Support would rank Weapon Power and Main Stat lines too high against percent and crit lines. At the other end of the range, a Support that gears up alongside you keeps its share of the bracket and nothing is diluted. The Attack Power readout shows that end: raising your Weapon Power by 5% there, with the Support following your stats, gives +2.45% with a Support and +2.44% without.

**Other Support inputs.** Flash Orb and Strength Orb use an Ether effectiveness of 0.31, from a maxed relic Drops of Ether engraving (16%) plus a Level 2 stone (15%). Flash Orb adds 15% crit rate and Strength Orb adds 10% Attack Power, each times 1.31. Both default to 0.

**One deliberate exception.** The Ability Stone Base AP row recomputes the Support buff with the stone's +1.5% Base AP included. Each stone engraving has a level from 1 to 4 (6, 7, 9 or 10 nodes), and the bonus applies when the two levels add up to 5 or more, as on a 9/7 or 10/6 stone. The row checks the two stone slots you set in the Engraving Comparison. The assumption is that a Support in your party can have such a stone as well. At the defaults the row reads +1.325% instead of the +0.952% the fixed-Support rule would give. Personal gear upgrades are not shared with the Support this way.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

- The 0.4 coefficient and the generic gearing are one reference profile. A Support that is much better or worse shifts every Weapon Power, Main Stat, flat AP and Base AP row by roughly the same factor.
- The Support is assumed to match your Weapon Power and Main Stat. A Support that itemizes Weapon Power harder or not does not change the model, since both reach similar maximums. Support uptime defaults to 98%.

</details>

</div>
</div>

## Why every comparison is re-optimized

**In plain terms.** Suppose you compare two bracelets. A bracelet changes your crit rate, Crit Damage or Additional Damage, and those decide which of the nine keystone setups is best. So the honest question is not "how much better is the new bracelet if I keep my keystones" but "how much better is my best setup with it than my best setup without it". That is what the calculator reports, and it calls it the realized gain: the DPS you actually get if you re-pick keystones for each option.

<div class="setup-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

For each candidate the calculator searches all nine cells for the best one with the candidate, searches all nine again for your current setup, and divides:

```text
realized gain = best(candidate) / best(current) - 1
```

The alternative, a fixed-keystone gain, evaluates the candidate in your current best cell:

```text
fixed gain = candidate in current best cell / best(current) - 1
```

The realized gain is never below the fixed gain. Your current best cell is one of the candidate's options, so the candidate's best is at least as good, and both gains share the same denominator. This was also checked on 4,000 random input sets with no violations. The difference can be real: the largest gap seen was 3.2 percentage points of DPS. When you pin a combination, both sides use the pinned cell, so the two gains are equal by construction.

Cases where the best cell actually flips: Keen Blunt Weapon at the default settings (with it the best cell is Master + Pulverize at LB1/KS2, without it Critical + Pulverize at LB1/KS2), the Chaos Core Flashy comparison (228 flips in about 180,000 synthetic gear profiles), and bracelet lines such as High Crit Rate or High Additional Damage.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

- Realized gain assumes you will re-pick your keystones. It is the gain for a player who does, not a measurement of the gain with fixed keystones.
- Bracelet vs Bracelet re-optimizes every line that feeds the nine cells: Crit Rate, Crit Damage, Crit Stat and Additional Damage (any number of Additional Damage lines on one bracelet). Back Attack, Outgoing, Stagger and Damage plus Cooldown lines multiply every cell by the same factor, so they cannot change which cell wins and need no search. The vs Demon/Archdemon half of the Additional Damage line is that kind of factor too.

</details>

</div>
</div>

## Reference: how each panel is valued

The sections below describe how individual parts of the calculator are valued. Skip to the one you are checking.

### Attack Power

**In plain terms.** Attack Power comes from your Weapon Power and Main Stat, scaled up by the Base Attack Power % from your gems, plus any flat Attack Power and the Support's buff, all multiplied by your Attack Power %. The readout in the Weapon Power / Main Stat card shows it in three stages so you can hold it against your character sheet.

<div class="setup-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

The formula is the one in the Support section. Its pieces:

- `BaseAP` is 1 plus your gem Base AP % (a sum over every gem, for example eleven Lv. 10 gems at 1.2% each is 13.2%), plus 1.5% if your Ability Stone has the 9/7 or 10/6 roll.
- `FlatAP` is your flat Attack Power plus the flat half of Chaos Core: Attack.
- `PercentAP` is 1 plus the sum of: both Attack Power earrings, Kazeros (2%), Guardian (3%), the Attack % half of Chaos Core: Attack, Astrogem Attack Power, the Attack Power % Other field, Atropine (30% times its uptime), Strength Orb (10% times 1.31 times its uptime) and the Adrenaline model from the Uptimes section.
- Astrogem Attack Power is the level over 120 times 4.4%, rounded down to two decimals, which is how the game shows it. Level 35 reads 1.28%.
- The whole bracket, including the final multiply, sits inside the floor.

**Worked example (defaults, RE 333).** Weapon Power 259,216, Main Stat 854,918, gem Base AP 13.2% plus the 1.5% stone bonus, Chaos Core: Attack at Relic 20 points (+2.13% and 2,700 flat). The square root part is 192,184, times 1.147 is 220,435. Attack Power % is 3.10 (two High earrings) + 2.13 (Chaos Core) + 1.28 (Astrogem) = 6.51, plus Adrenaline.

| Stage | Value | What is in it |
|---|---|---|
| Base | 237,661 | floor((220,435 + 2,700) x 1.0651). What the Character Profile shows: no Adrenaline, no Support, no raid buffs |
| With Adrenaline | 249,710 | Adds Adrenaline at all 6 stacks (5.40%), whatever the uptime input says |
| Final | 346,161 | Adrenaline at your uptime (5.32%), the Support (86,411 inside the bracket, about +96,632 on the final value after Percent AP), plus Atropine, Strength Orb and Attack Power % Other if set |

The final value is the baseline every Attack Power based comparison uses. The first two stages leave out Atropine, Strength Orb and Attack Power % Other so they match what the Character Profile displays.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

The Adrenaline middle stage is display only. Weapon Power and Main Stat are what you type: the calculator does not rebuild them from gear, so a wrong entry shifts every row that depends on them.

</details>

</div>
</div>

### Crit and damage layers

**In plain terms.** Your damage chain is four layers that multiply: how often you crit and how hard (crit rate and Crit Damage), the extra damage on crit hits (Crit Hit Damage), Evolution Damage, and Additional Damage. Each layer is its own multiplier, so a point added to a small layer is worth more than a point added to a big one. The summary card shows all of them, and every row on this page changes one of them.

<div class="setup-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

The sources of each layer, with the RE 333 default value:

| Layer | How sources combine | Default build |
|---|---|---|
| Crit rate | Added, then capped at 100% with the uptime blend from the Uptimes section | Crit stat 658 gives 23.55% (stat x 0.03579099 / 100 as a fraction, 0.2355 after rounding down to 4 decimals), rings 1.90, bracelet 4.20, Adrenaline 19.40, strike 20, Back Attack 8.33, total 77.38% |
| Crit Damage | Added to the base 200% | Rings 8, bracelet 6.8, Keen Blunt Weapon 52, strike 32, total 298.80% |
| Crit Hit Damage | Each source multiplies the others | Two bracelet lines at 1.5% and Chaos Core: Flashy Ancient 17P at 1.65% give 1.015 x 1.015 x 1.0165, which is +4.72% |
| Evolution Damage | Added | Yearning 14, Evolution Karma rank 6 gives 6, Standing Striker 21, total 41% |
| Additional Damage | Added | Pet 1.0, weapon quality 30, necklace 2.6, Astrogem 4.76, total 38.36% |

Other sources in the same layers: Keen Sense adds Crit Rate (4% per level) and Evolution Damage (5% per level), Limit Break adds 10% Evolution Damage per level, Crit Rate synergies add 10% each, two Crit Hit Damage synergies multiply by 1.08 each, and Optimized Training 1 adds 5% Evolution Damage. Weapon quality adds 10% plus 0.002% times quality squared (quality 100 gives 30%). Astrogem Additional Damage is the level times 8.0834, rounded down, over 10,000 (level 59 gives 4.76%). Keen Blunt Weapon adds 44% to 52% Crit Damage by node, its stone adds 7.5% to 15%, and its downside is the single x0.98 on the score described under Top Combinations.

The three keystones then change one layer each. Critical multiplies the Crit Hit Damage layer by 1.12. Master adds 7% crit rate and 8.5% Additional Damage. Pulverize adds 20% Evolution Damage.

The summary card shows two crit figures. Eff. Crit Rate is the capped, probability-weighted value from the Uptimes section, and it is the one the score uses. Peak Crit Rate adds every bonus at full strength with no cap and can read above 100%. It shows the ceiling in a burst window and is never used in the score.

Check at the defaults for the best cell (LB1/KS2, Master + Pulverize): effective crit 92.38%, Crit Damage 2.988, Crit Hit Damage 1.0472, Evolution 1 + 0.81, Additional 1 + 0.4686.

```text
((1 - 0.9238) + 0.9238 * 2.988 * 1.0472) * 1.81 * 1.4686 * 0.98 = 7.73
```

Only ratios of this number are ever shown, so the absolute value means nothing on its own. Reproducing all nine cells this way by hand gives the same five percentages as the Top Combinations table.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

- Which sources multiply and which add follows the game's own tooltips and in-game tests. A source that turns out to sit in a different layer would change its value but not the rest of the chain.
- Breaking Moon (Surge 111 only) is folded into Crit Damage as an average per cast, see the assumption register.
- Crit Rate Dual and Crit Damage Dual are the bracelet lines that carry a 1.5% Crit Hit Damage bonus. A bracelet can roll two Crit Rate or two Crit Damage lines, and both are modeled.

</details>

</div>
</div>

### Ark Grid cores

**In plain terms.** The Ark Grid Core Comparison answers one question per core: how much more DPS would this core give than having none of that kind. Each Chaos Core row removes your current core of that kind, adds the candidate at the grade and point level shown, and compares the two. Only the damage half of each core counts.

<div class="setup-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

Chaos Core effects unlock at 10, 14, 17, 18, 19 and 20 points. The tables hold the cumulative totals at each level from in-game tooltips and tests. Relic and Ancient are identical below 17 points. Every gain is DPS with the core divided by DPS without it, minus 1, and the Relic to Ancient column is

```text
upgrade = (1 + Ancient 20P gain) / (1 + Relic 20P gain) - 1
```

How each row is valued:

- Crit Hit Damage (Flashy), Crit Damage (Swift), Crit Rate (Crushing) and Additional Damage (Stable) feed the grid, so they use the full nine cell search for both sides, as described in the re-optimization section.
- Damage to foes lines (Flashy's Damage %, Smoldering's Boss Damage, Absorbing's Damage) multiply, they do not add. A core's 14 point, 17 point and 18 to 20 point lines combine as (1 + a)(1 + b)(1.0016)^n - 1, which sits about 0.01 to 0.02 points above the plain sum of the tooltip figures.
- Smoldering's Burn half does not depend on points. It is 0.6% of total damage at Relic and 1.25 times that at Ancient, and it multiplies with the Boss Damage half.
- Chaos Core: Attack and Weapon use the Attack Power formula with the Support held fixed. Weapon is folded into your typed Weapon Power: the new Weapon Power is `WP * (1 + (pct / 100) / WPmult) + flat * WPmult`, where `pct` is the core's Weapon Power % in percentage points and `WPmult` is your Weapon Power % multiplier (1 + your total Weapon Power % / 100).
- Speed, Stable's damage reduction, Swift's Attack Speed, Absorbing's healing and the non-damage half of Crushing are not modeled. Crushing's other half is a weak point utility buff, which has no DPS value. Its Crit Rate half is valued.

Examples at the defaults, Ancient 20 points: Smoldering is (1 + 3.0028%) x (1 + 0.75%) - 1 = 3.78%, Absorbing is simply 3.00%, and Chaos Core: Weapon turns 259,216 Weapon Power into 273,732 (+5.6%) for a 1.98% gain after the fixed Support dilutes it. Swift's +8.35% Crit Damage reads 2.72%, which a hand computation of the nine cells with and without it also gives.

| Chaos Core, 20 points | Relic | Ancient | Relic to Ancient |
|---|---|---|---|
| Flashy Attack | 3.09% | 4.14% | +1.03% |
| Smoldering Strike | 2.60% | 3.78% | +1.14% |
| Attack | 2.84% | 3.64% | +0.78% |
| Absorbing Strike | 1.99% | 3.00% | +0.99% |
| Stable Attack | 1.90% | 2.85% | +0.94% |
| Crushing Strike | 1.84% | 2.76% | +0.91% |
| Swift Attack | 1.81% | 2.72% | +0.90% |
| Weapon | 1.55% | 1.98% | +0.43% |

**Order cores** are valued differently, because an Order core changes how much damage one skill does, not a stat. Only the 17 point line differs between Relic and Ancient, so that line is the whole comparison. With `s` the share of your damage the line touches, `r` the Relic bonus and `a` the Ancient bonus:

```text
relic total = 1 - s + s * (1 + r) / (1 + a)
gain = 1 / relic total - 1
```

The shares are measured with the core already Ancient (they come from the build pages' Trixion damage charts), so the Relic total is the Ancient one with the extra bonus divided back out. A Damage to foes line touches everything (s = 1). A Normal Skill Damage line touches everything except Surge and Awakening. That is a proxy: bleed and other non-skill damage stay in the share, a small amount. Example: Swift Resolution on Surge 222 touches Deathly Slash, 35.5% of damage, at +15% versus +20%, so 1 / (0.645 + 0.355 x 1.15 / 1.20) - 1 = 1.50%. Arts Core on RE 111 touches 78.6% of damage (100% minus Surge 19.9% minus Awakening 1.5%) at +5% versus +6%, which gives 0.75%. Some cores carry a stack count or a coverage below 100%, and the table's detail line states it.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

Each Order core is judged on one build, the one it is used on, so the table is not a ranking across builds. The shares come from the build pages' charts, which are measured values, and a script keeps the calculator's copy in step with them. Smoldering's Burn estimate and the grade tables are the assumptions to watch, see the register.

</details>

</div>
</div>

### Bracelet, Accessory and A vs B comparisons

**In plain terms.** The comparison panels value one line or one whole piece at a time, always as a ratio to a baseline. The Bracelet table and the Accessory table answer "what is this line worth". The two A vs B panels are sandboxes: you pick two things and see which is better, without any of it changing your own setup above.

<div class="setup-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

**Bracelet Line Comparison.** Every row is valued against your setup with your own bracelet removed: bracelet lines off, the two Dual checkboxes off, and your Crit Stat reset to a bracelet-free 576 (a character with all side content done, only used so your current bracelet is not counted twice). One candidate line is added, the nine cell search runs for both sides, and the result is the ratio. How the row kinds are valued:

- Crit Rate, Crit Damage, Crit Stat and Additional Damage lines go through the full search.
- Back Attack Damage is the tabled value times the 0.95 back attack share (2.5% reads 2.38%). Outgoing Damage plus Damage to Staggered adds the Stagger line at the 5% share (2% + 4% x 0.05 reads 2.20%). Damage plus Cooldown reads the damage value minus 1 point, an estimate for the cooldown half (4.5% reads 3.50%).
- Weapon Power and Attack Power lines use the Attack Power formula with the Support fixed, so a Weapon Power line reads about 72% of its value without a Support.
- Spec Stat is its own model. The gain per point is `(m - 1) / (1735 * m)` where `m = 1 + (0.86 * shareRatio + 0.1528 * awakeningRatio) / 699 * 1735`. The two ratios say how much of your damage comes from the skill Spec scales and from your Awakening, with each share normalized at a reference Spec of 1855. On RE 333 (17% skill share, 1.5% Awakening) +100 Spec reads 0.67%. It counts damage only, not cooldown reduction, and the row says so.
- A few Weapon Power lines are valued at an assumed stack count, fight length or uptime, listed in the register.

Check: High Crit Rate +5% with its +1.5% Crit Hit Damage bonus reads 5.18% both in the table and in a hand computation of the nine cells with and without it.

**Accessory Line Comparison.** Same idea, but valued against your real current gear rather than a bracelet-free baseline. Necklace, earring and ring tables also show the two lines of one piece rolled together (LL, ML, MM, HL, HM, HH, for Low, Mid and High). Earrings are the one case where a line feeds Weapon Power %, so your base Weapon Power is reverse-derived from the total you typed and your Weapon Power % fields. That is only as exact as those fields.

**Bracelet vs Bracelet and Accessory vs Accessory.** Each side is valued as four layers: the keystone, crit and Additional Damage lines (searched), Spec, the flat lines, and Attack Power plus Weapon Power. Each layer is computed on its own against the same baseline and the layers are multiplied. At the default bracelet the card reads +14.73%, which is about 1.1397 x 1.0067 x 1.0000 x 1.0000 (the default bracelet's lines are Crit Rate, Crit Damage and Additional Damage, so the flat layer is empty). The Damage plus Cooldown line uses the raw tag in the sandbox unless you tick the box, because the cooldown value is personal. Accessory A is always treated as your equipped piece, and any Main Stat or flat line on it is backed out of the shared baseline.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

Layers are treated as independent, so an interaction between, say, Spec and Attack Power is ignored. This is a standard simplification for a sandbox, not a claim about the game. The reference table applies the Damage plus Cooldown penalty and Bracelet vs Bracelet leaves it to you.

</details>

</div>
</div>

### Engravings and Raid Captain

**In plain terms.** The Engraving Comparison shows what each engraving is worth and which two flexible engravings are best together. Raid Captain is the one that depends on how fast you move, so its value follows a Move Speed estimate.

<div class="setup-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

- Grudge, Cursed Doll and Mass Increase are tabled values by node level, plus your Ability Stone level. Grudge at 4 nodes reads 21.00% and Cursed Doll 17.00%.
- Ambush Master is two multiplying parts: the Back Attack Damage half (15% times your effective back attack share, 0.833 at the defaults) and the book-level Damage half (7.6% at 4 nodes). That is 1.12495 x 1.076 - 1 = 21.04%.
- Adrenaline and Keen Blunt Weapon are valued with a real with-and-without search, so the winning keystone can flip, which is the same method as the Ark Grid rows. The Keen Blunt Weapon stone-level preview is searched the same way.
- Raid Captain's tabled value (48% at 4 nodes) is its bonus at the 140% Move Speed cap. It scales linearly from 0% at 100% Move Speed, so the row is the node value times (expected capped Move Speed minus 100) over 100.
- Mana Food's row is the Main Stat gain through the Attack Power formula with the Support fixed. On Surge 111 and 333 it also carries the Maelstrom Bleed rune's +0.75% damage. On Remaining Energy it is shown for information and left out of every DPS total.
- The Best Combo and Runner-Up cards search every pair of the flexible engravings (Raid Captain, Keen Blunt Weapon, Cursed Doll, plus Mass Increase on Surge if you opt in), valued together. Raid Captain is in the pool on both specs so you can see its value even if you would not drop it. At the defaults the best pair is Raid Captain plus Keen Blunt Weapon at +39.42%, 0.74% ahead of Raid Captain plus Cursed Doll at +38.40%. The 0.74% compares the two whole setups (1.3942 / 1.3840 - 1), so it is not the 1.02 point difference between the two displayed gains.
- Setup A vs Setup B compares two whole loadouts of your choice the same way.

**Move Speed.** Raid Captain reads the expected Move Speed, worked out with the same expand-then-cap logic as the crit rate: every on/off combination of the sometimes-on sources is capped at 140% and then weighted by its joint probability. At the RE 333 defaults the base is 127.32% (106.32 base, 12 class passive, 9 Passionate Dance) and Maelstrom adds 12.8% at 85% uptime. The expected capped Move Speed is 138.10%, which the calculator shows as Raid Captain Efficiency 95.25% (the share of the way from 100% to the 140% cap). Capping the average instead would read 95.50%. With the Paladin checkbox added (24.6% at a 35% assumed uptime) the true figure is 96.91%, while capping the average would read 100.00%, which hides that Move Speed is still below the cap part of the time. The Raid Captain row in the engraving table is its node value times that fraction: 0.48 (4 nodes, no stone) times 0.38098 gives 18.29%.

Sources: base 106.32, plus 12 from the class on RE (10 on Surge), Passionate Dance 9 with a Support, Valkyrie or Artist 8 (exactly Valkyrie's Move Speed at 100% uptime; Artist is grouped in for simplicity, since its 10% Move Speed is skill-based at 70-100% uptime and would need an uptime and skill input), Vernese Wine 3 on Surge when you do not use Mana Food. Maelstrom (12.8), Rage Rune (16 on Surge) and Paladin (24.6) are the sometimes-on sources, at the uptimes in the register. The cap is 140.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

- Move Speed sources are treated as independent, as the crit terms are.
- Mass Increase's Attack Speed drawback is not modeled, which is why it is an opt-in checkbox. Attack Speed is not tracked at all, because nothing on this page depends on it.
- Ability Stone penalties are not tracked, because very few characters carry one. Attack Power Reduction (listed in game as 2%, 4% and 6%) subtracts from your other Attack Power % sources, such as Adrenaline or the Kazeros astrogems, so it would lower every Attack Power based row. Move Speed Reduction (also 2%, 4% and 6%) subtracts from Move Speed, which Raid Captain reads. The Bible importer skips the penalty engravings today, so modeling either one also means reading them from the page data.
- The Ability Stone threshold bonus is covered by the exception in the Support section.

</details>

</div>
</div>

## Assumption register

Every estimate the calculator uses, where it comes from, and what it moves. Values from logs are typical figures across many players' logs, not measurements of one character.

| Assumption | Value | Basis | Moves |
|---|---|---|---|
| Adrenaline uptime default | 97% | Logs; the damage meter shows damage coverage at 6 stacks | Crit rate, Attack Power |
| Adrenaline AP rebuild share | 0.5 | Average of stacks 1 to 5 of 6 | About 0.1 AP points at 80% |
| Support Attack Power coefficient | 0.4 | Reference sheet Support with specific gearing | Every Weapon Power, Main Stat, flat AP and Base AP row |
| Support uptime | 98% | Estimate | Same rows |
| Equally geared Support | Same Weapon Power and Main Stat | Generic Support | Same rows |
| Support held fixed for candidate rows | n/a | A bracelet you buy does not upgrade the Support; matches the reference sheet | Rows read at the low end of a range; a Support that gears up alongside you is the other end |
| Ability Stone row exception | n/a | The Support can share the stone's threshold bonus | That row reads about 39% higher |
| Ether effectiveness | 0.31 | Maxed relic engraving (16%) plus Lv. 2 stone (15%) | Flash Orb, Strength Orb |
| Back Attack Rate default | 85% | Logs | Crit rate, back attack rows |
| Back attack share of DPS | 0.95 | Assumed | Back Attack rows, Ambush Master |
| Stagger share | 5% | Reference sheet | Stagger bracelet rows |
| On-hit Weapon Power stacks | 5 of 6 | Reference sheet | That bracelet line |
| Periodic Weapon Power fight length | 10 minutes | Reference sheet | That bracelet line |
| HP-gated Weapon Power uptime | 99% | Reference sheet | That bracelet line |
| Damage + Cooldown downside | -1 point | Arbitrary estimate | Reference table applies it; Bracelet vs Bracelet leaves it to you |
| Keen Blunt Weapon downside | x0.98 | 10% chance of -20% | Keen Blunt Weapon and what it touches |
| Specialization base and reference | 1735 and 1855 | Reference sheet, confirmed in game | Specialization rows |
| Crit stat for a typical non-bracelet build | 576 | A character with all side content done; only used to back out your current bracelet | Bracelet crit rows |
| Awakening damage share | Per build | Fits the latest raid, varies by content | Specialization rows |
| Breaking Moon average Crit Damage | +11.25 points | 75% Surge share times 1 in 4 casts times 60% (a stricter weighting gives about 11.1 points, about 0.04% DPS, so the simpler average stands) | Surge 111 Crit Damage |
| Maelstrom, Rage Rune, Paladin uptime | 85/80/90, 20%, 35% | Logs and representative values | Move Speed, Raid Captain |
| Artist/Valkyrie Move Speed | Flat 8 | Exactly Valkyrie at 100% uptime; Artist grouped in for simplicity | Move Speed, Raid Captain |
| Smoldering Burn share | 0.6% Relic, 0.75% Ancient | Logs of many players and an in-game dummy test | Smoldering row |
| Order core damage shares | Per build and core | Build pages' Trixion charts, kept in step by a script | Order Core table |
| Normal Skill Damage share | 100% minus Surge minus Awakening | Simplification; bleed and other non-skill damage left in | Arts Core row |
| Weapon Power base for earring rows | Reverse-derived from your typed total | Only as exact as your Weapon Power % fields | Earring Line 2 rows |
| Raid Captain scaling | Linear, 0% at 100 Move Speed to full at 140 | Tabled value is the bonus at the cap | Raid Captain row |
| Ability Stone penalties | Not tracked | Rare, and the importer does not read them yet | Attack Power Reduction would lower the Attack Power % total, Move Speed Reduction the Raid Captain Move Speed |
| Independence of sometimes-on crit and Move Speed terms | n/a | Stated simplification | Crit rate and Move Speed near their caps |
| Independent layers in A vs B panels | n/a | Sandbox simplification | Interactions between layers |
| No Optimized Training 1 cooldown reduction | n/a | Not modeled | OT1 cost estimate |

## Known limits and how to challenge it

What is not modeled: skill-by-skill crit differences, rotation effects, Optimized Training 1's cooldown reduction, the party Damage Synergy scalar (it cannot change any ranking), each Chaos Core's non-damage half (Speed, damage reduction, healing and Crushing's weak point utility buff), Mass Increase's Attack Speed drawback, Attack Speed in general, Ability Stone penalties, and the Support bracelet's ally Attack Power line.

What would improve it: your own measured values. Every default above can be changed, and the combat analyzer figures (Adrenaline coverage, Back Attack Rate, Raid Captain Efficiency) are the most useful inputs to replace with your own. If you think a rule is wrong, the most useful report names the section, the input values you used and the number you expected.

How it was checked: tooltips and in-game tests for Ark Grid and engraving values, combat logs for the estimated rates, and the reference spreadsheets ([1](https://docs.google.com/spreadsheets/d/1RKpzg6sPNe7fuPDudJHAs0qbFukOwSyhMynDOijfoKY/edit?usp=sharing), [2](https://docs.google.com/spreadsheets/d/1_0J7liyM_yw16pyn6TKlF1YGaIt5n_A9hSoLnT3yTUc/edit?usp=sharing)) for formula structure. Credit to their authors: this calculator started from that work, and has since moved well beyond it for this class, so the sheets are no longer a current reference for every number here.
