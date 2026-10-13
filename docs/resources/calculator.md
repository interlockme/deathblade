---
description: "How the Ark Passive Calculator works: what Top Combinations ranks, how uptimes and the Support are modeled, how Attack Power, crit layers, Ark Grid cores, comparison panels and engravings are valued, and every assumption behind the numbers."
---

# Calculator Guide

This page explains what the [Ark Passive Calculator](../resources.md#ark-passive-calculator) works out, what it assumes, and why. Each section starts in plain terms. Where there is a formula, a collapsed **The math** block holds it with worked examples, so you can check any number yourself. Examples use the default inputs on the RE 333 build unless stated.

## The short version

- **Everything is a ratio against your current setup.** "% of best" and "gain" compare one choice with another while everything else stays equal. The calculator does not predict absolute DPS or simulate a rotation. It models your damage chain: crit, Crit Damage, Evolution Damage, Additional Damage and Attack Power.
- **Top Combinations** scores nine Evolution setups against your stats and shows the best five. Gaps under 0.5 percentage points are a tie, so pick whichever is easier to play.
- **Bonuses that are only on part of the time** (Adrenaline, Back Attack, Flash Orb, Maelstrom) are not averaged before the crit cap. Each on/off combination is capped first, then weighted by how likely it is.
- **A Support is assumed by default**, a generic above-average one. Lines that raise only your own Weapon Power or Main Stat are worth less because of it. Percent Attack Power is not diluted.
- **Comparisons re-pick your best keystones for each option**, so a bracelet gets credit for a keystone change it makes possible. This "realized gain" is never lower than the gain with keystones held fixed.
- **Defaults are typical values from combat logs.** Change them to your own. Everything here is a best-effort estimate from tooltips, in-game tests and logs, not a measurement of your character.

## Top Combinations

The Evolution tree lets you take two of the three Tier 4 keystones (Critical, Master, Pulverize) and split your Limit Break and Keen Sense points. That makes nine setups. The calculator scores all nine against your stats and lists the best five, each as a percentage of the best. Clicking a tab previews a lower-ranked setup. The pin button makes every panel below use it, which is how you test a setup you prefer.

**Close results are a tie.** Gaps under 0.5 percentage points of DPS do not matter in practice, so choose what is easier to play or what you already have. The 0.5 is a rule of thumb, not a measured error bar: the model uses one blended crit rate for the whole fight and cannot resolve much smaller differences.

<div class="ap-acc-table-scroll doc-table-scroll">
<table class="ap-brace-compare-table doc-table doc-table--fit">
<thead>
<tr>
<th class="ap-brace-th-label">Rank</th>
<th class="ap-brace-th-label">Setup</th>
<th>% of best</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>LB1/KS2, Master + Pulverize</td>
<td class="doc-num">100.00%</td>
</tr>
<tr>
<td>2</td>
<td>LB2/KS1, Master + Pulverize</td>
<td class="doc-num">99.81%</td>
</tr>
<tr>
<td>3</td>
<td>LB1/KS2, Critical + Pulverize</td>
<td class="doc-num">99.66%</td>
</tr>
<tr>
<td>4</td>
<td>LB3, Master + Pulverize</td>
<td class="doc-num">99.47%</td>
</tr>
<tr>
<td>5</td>
<td>LB1/KS2, Critical + Master</td>
<td class="doc-num">99.35%</td>
</tr>
</tbody>
</table>
</div>

With the best setup your effective crit rate reads 92.38% (77.38% before the picks), Evolution Damage 81.00% (41.00% before) and Additional Damage 46.86% (38.36% before).

<div class="setup-panel doc-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

Each of the nine cells gets a score:

```text
score = ((1 - c) + c * CritDmg * (1 + onCrit)) * (1 + evo) * (1 + add)
```

then times 0.98 if Keen Blunt Weapon is equipped. "% of best" is a cell's score divided by the best score.

- `c` is your effective crit rate, capped at 100% (how it is averaged is in the next section).
- `CritDmg` is your Crit Damage: base 2.0 plus rings, bracelet, Keen Blunt Weapon, the Swift core and others.
- `onCrit` is the extra damage on crit hits (Crit Hit Damage Synergy and similar). Critical multiplies it by 1.12.
- `evo` is Evolution Damage. Pulverize adds 20% of it.
- `add` is Additional Damage. Master adds 8.5% of it.
- Master also adds 7% crit rate. That shares the 100% cap, so Master is worth less as your crit rate nears the cap.

Keen Blunt Weapon's downside is an expected value, a 10% chance of -20% damage, so a flat x0.98. Optimized Training 1 counts only for its Evolution Damage, not its cooldown reduction.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

One blended crit rate and one multiplier chain for the whole fight, so skill-by-skill differences are not modeled.

</details>

</div>
</div>

## Uptimes and estimated inputs

Many bonuses are only on part of the time. The calculator does not just add "bonus times uptime" to your crit rate. Crit rate is capped at 100%, and averaging before the cap overstates what you get near it. So it works out every on/off combination first, caps each one, and only then averages.

Two inputs are worth knowing exactly. **Adrenaline uptime** is the share of damage dealt at 6 stacks, which is what a DPS meter reports. Its Crit Rate bonus needs all 6 stacks, so it scales with that uptime, while its Attack Power bonus works per stack and gets partial credit as stacks rebuild. **Back Attack Rate** is the figure from the Combat Analyzer's Overview tab. It counts hits, not damage, and only for skills that can back attack.

<div class="setup-panel doc-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

**Crit rate.** Three independent sometimes-on terms: Adrenaline (bonus times uptime), Back Attack (10% times your effective back attack share) and Flash Orb (bonus times uptime). `blendCritTerms` takes every on/off combination, caps each at 100% and weights it by its joint probability. Averaging first is wrong because the cap is concave.

Example (Flash Orb left out for simplicity): base crit 75%, Adrenaline +20% at 97% uptime, Back Attack +10% at 90%. Averaging first gives 75% + 19.4% + 9% = 103.4%, capped to 100.000%. The joint-probability method gives 99.035%:

<div class="ap-acc-table-scroll doc-table-scroll">
<table class="ap-brace-compare-table doc-table doc-table--wide">
<thead>
<tr>
<th class="ap-brace-th-label">Adrenaline</th>
<th class="ap-brace-th-label">Back Attack</th>
<th>Probability</th>
<th class="ap-brace-th-label">Crit rate</th>
</tr>
</thead>
<tbody>
<tr>
<td>on</td>
<td>on</td>
<td class="doc-num">87.3%</td>
<td>105% capped to 100%</td>
</tr>
<tr>
<td>on</td>
<td>off</td>
<td class="doc-num">9.7%</td>
<td>95%</td>
</tr>
<tr>
<td>off</td>
<td>on</td>
<td class="doc-num">2.7%</td>
<td>85%</td>
</tr>
<tr>
<td>off</td>
<td>off</td>
<td class="doc-num">0.3%</td>
<td>75%</td>
</tr>
</tbody>
</table>
</div>

Weighted: 0.873 + 0.09215 + 0.02295 + 0.00225 = 0.99035. [Raid Captain's Move Speed](#engravings-and-raid-captain) works the same way.

**Adrenaline.** Outside 6 stacks you rebuild one stack per cast, so the first five casts average 3 of 6 stacks, or 0.5. The AP half of the bonus uses that:

```text
AP from Adrenaline = full * (U + (1 - U) * 0.5)
full = 6 stacks * (0.9% + stone bonus per stack)
```

At the defaults (4 nodes, no stone) the full value is 5.4% Attack Power:

<div class="ap-acc-table-scroll doc-table-scroll">
<table class="ap-brace-compare-table doc-table doc-table--wide">
<thead>
<tr>
<th class="ap-brace-th-label">Uptime</th>
<th>Adrenaline AP</th>
<th>Adrenaline crit</th>
<th>Effective crit rate (before picks)</th>
<th>Final Attack Power</th>
</tr>
</thead>
<tbody>
<tr>
<td>100%</td>
<td class="doc-num">5.40%</td>
<td class="doc-num">20.0%</td>
<td class="doc-num">77.98%</td>
<td class="doc-num">346,412</td>
</tr>
<tr>
<td>97%</td>
<td class="doc-num">5.32%</td>
<td class="doc-num">19.4%</td>
<td class="doc-num">77.38%</td>
<td class="doc-num">346,161</td>
</tr>
<tr>
<td>80%</td>
<td class="doc-num">4.86%</td>
<td class="doc-num">16.0%</td>
<td class="doc-num">73.98%</td>
<td class="doc-num">344,741</td>
</tr>
<tr>
<td>50%</td>
<td class="doc-num">4.05%</td>
<td class="doc-num">10.0%</td>
<td class="doc-num">67.98%</td>
<td class="doc-num">342,233</td>
</tr>
</tbody>
</table>
</div>

**Back Attack.** The rate is used as the damage share of the skills that can back attack, which holds when their hits are similar in size. On Surge builds the share is 0.95 times the rate. On RE builds the skills that always land as back attacks (Surge, which also scales with Specialization) take their own share, your rate gates the rest, with no double counting.

The 0.5 rebuild share is a derivation, not a measurement. Later skills hit harder and would push it up slightly, by about 0.1 Attack Power points at 80% uptime. The Adrenaline input has no floor: low values are fair what-ifs, but an uptime of 0 still reports half the AP bonus, which cannot happen in a fight.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

The terms are treated as independent. In practice they are usually on together, since you aim to back attack constantly and keep your stacks, while Flash Orb is RNG with low uptime. At high uptimes this does little harm.

</details>

</div>
</div>

## Support

Most raid parties have a Support, and a Support raises your Attack Power. A calculator that ignored this would overvalue upgrades that only raise your own Weapon Power or Main Stat, because the Support's share does not grow with them. So Support is on by default, modeled as a generic one: above average, not maxed, with the same Weapon Power, Main Stat and kind of Ability Stone as you, and the gearing a Support like that would likely have.

When you compare "what if I had this line", the Support stays at its current value, because the line is yours and not your Support's. Lines that raise only your own Weapon Power, Main Stat or flat Attack Power are diluted that way. Percent Attack Power is not. This is the low end of a range: the real answer for your party sits between the number shown and the case where your Support gears up alongside you.

<div class="setup-panel doc-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

```text
AP = floor( ( sqrt(WP * MainStat / 6) * BaseAP + FlatAP + SupportBuff ) * PercentAP )
SupportBuff = sqrt(WP * MainStat / 6) * BaseAP * 0.4 * (SupportUptime / 100)
```

The buff sits inside the bracket, so Percent AP multiplies it too. The 0.4 comes from the reference spreadsheet's Support profile, which has specific gearing. That profile is what is modeled, so the Support bracelet's own "Ally Atk. Power Enhancement" line is not modeled separately.

At the defaults (98% uptime) the Support adds about 39% to your Attack Power: the final readout is 249,529 without it and 346,161 with it, a difference of 96,632. The Support's own term inside the bracket is 86,411, and Percent AP multiplies it like everything else, which is why the final difference is larger. The checkbox also turns on the +14% Evolution Damage that goes with having a Support and the Support's Move Speed bonus (its Attack Speed bonus is not scored), so switching it off changes more than Attack Power. At the defaults it also moves LB2/KS1 Master + Pulverize to first.

**Why some gains are diluted and others are not.** A Weapon Power line acts on only your part of the bracket, while Percent Attack Power multiplies all of it, Support included. From the bracelet table at the defaults:

<div class="ap-acc-table-scroll doc-table-scroll">
<table class="ap-brace-compare-table doc-table doc-table--fit">
<thead>
<tr>
<th class="ap-brace-th-label">Bracelet line</th>
<th>With Support</th>
<th>Without Support</th>
</tr>
</thead>
<tbody>
<tr>
<td>Weapon Power +7200</td>
<td class="doc-num">1.05%</td>
<td class="doc-num">1.45%</td>
</tr>
<tr>
<td>Weapon Power +9000</td>
<td class="doc-num">1.31%</td>
<td class="doc-num">1.81%</td>
</tr>
<tr>
<td>Attack Power +0.4% (percent)</td>
<td class="doc-num">0.37%</td>
<td class="doc-num">0.37%</td>
</tr>
</tbody>
</table>
</div>

The Weapon Power rows keep about 72% of their no-Support value, which is 1 / (1 + 0.4 * 0.98). If the Support gears up alongside you, nothing is diluted. The Attack Power readout shows that end of the range: +5% Weapon Power there, with the Support following your stats, gives +2.45% with a Support and +2.44% without.

**Orbs.** Flash Orb and Strength Orb use an Ether effectiveness of 0.31, from a maxed relic Drops of Ether engraving (16%) plus a Level 2 stone (15%). Flash Orb adds 15% crit rate and Strength Orb adds 10% Attack Power, each times 1.31.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

The 0.4 coefficient and the generic gearing are one reference profile. A much better or worse Support shifts every Weapon Power, Main Stat, flat AP and Base AP row by roughly the same factor.

</details>

</div>
</div>

## Why every comparison is re-optimized

Say you compare two bracelets. A bracelet changes your crit rate, Crit Damage or Additional Damage, and those decide which of the nine keystone setups is best. So the honest question is not "how much better is the new bracelet if I keep my keystones" but "how much better is my best setup with it than my best setup without it". That is what the calculator reports, and it calls it the **realized gain**.

<div class="setup-panel doc-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

For each candidate it finds the best of the nine cells with the candidate and for your current setup, then divides:

```text
realized gain = best(candidate) / best(current) - 1
fixed gain    = candidate in current best cell / best(current) - 1
```

The realized gain is never below the fixed gain. Your current best cell is one of the candidate's options, so the candidate's best is at least as good, and both gains share the same denominator. A check on 4,000 random input sets found no violations. The gap can be real: the largest seen was 3.2 percentage points of DPS. With a pin, both sides use the pinned cell and the two gains are equal.

The best cell flips in cases like Keen Blunt Weapon at the defaults (with it Master + Pulverize at LB1/KS2, without it Critical + Pulverize at LB1/KS2), the Chaos Core Flashy comparison (228 flips in about 180,000 synthetic gear profiles), and bracelet lines such as High Crit Rate or High Additional Damage.

Bracelet vs Bracelet re-optimizes every line that feeds the nine cells: Crit Rate, Crit Damage, Crit Stat and Additional Damage. Back Attack, Outgoing, Stagger and Damage plus Cooldown lines, and the vs Demon/Archdemon half of an Additional Damage line, multiply every cell by the same factor, so they cannot change the winner.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

Realized gain is the gain for a player who re-picks keystones, not a measurement of the gain with fixed ones.

</details>

</div>
</div>

## Reference: how each panel is valued

The sections below cover how individual parts of the calculator are valued. Skip to the one you are checking.

### Attack Power

Attack Power comes from your Weapon Power and Main Stat, scaled by the Base Attack Power % from your gems, plus any flat Attack Power and the Support's buff, all multiplied by your Attack Power %. The readout in the Weapon Power / Main Stat card shows three stages so you can hold it against your character sheet.

<div class="ap-acc-table-scroll doc-table-scroll">
<table class="ap-brace-compare-table doc-table">
<thead>
<tr>
<th class="ap-brace-th-label">Stage</th>
<th>Value</th>
<th class="ap-brace-th-label">What is in it</th>
</tr>
</thead>
<tbody>
<tr>
<td>Base</td>
<td class="doc-num">237,661</td>
<td>What the Character Profile shows in a town: no Adrenaline, no Support, no raid buffs</td>
</tr>
<tr>
<td>With Adrenaline</td>
<td class="doc-num">249,710</td>
<td>Adds Adrenaline at all 6 stacks (5.40%)</td>
</tr>
<tr>
<td>Final</td>
<td class="doc-num">346,161</td>
<td>Adrenaline at your uptime (5.32%), the Support, plus Atropine, Strength Orb and others if set</td>
</tr>
</tbody>
</table>
</div>

The final value is the baseline every Attack Power based comparison uses.

<div class="setup-panel doc-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

The formula is the one in the Support section. Its pieces:

- `BaseAP` is 1 plus your gem Base AP % (summed over every gem, so eleven Lv. 10 gems at 1.2% each is 13.2%), plus 1.5% for the 9/7 or 10/6 Ability Stone.
- `FlatAP` is your flat Attack Power plus the flat half of Chaos Core: Attack.
- `PercentAP` is 1 plus: both Attack Power earrings, Kazeros (2%), Guardian (3%), the Attack % half of Chaos Core: Attack, Astrogem Attack Power, the Attack Power % Other field, Atropine (30% times its uptime), Strength Orb (10% times 1.31 times its uptime) and the Adrenaline model.
- Astrogem Attack Power is level / 120 x 4.4%, rounded down to two decimals as the game shows it (level 35: 1.28%).
- The whole bracket, including the final multiply, sits inside the floor.

**Worked example.** Weapon Power 259,216, Main Stat 854,918, gem Base AP 13.2% plus the 1.5% stone bonus, Chaos Core: Attack at Relic 20 points (+2.13% and 2,700 flat). The square root part is 192,184, times 1.147 is 220,435. Attack Power % is 3.10 (two High earrings) + 2.13 (Chaos Core) + 1.28 (Astrogem) = 6.51, plus Adrenaline. Base is floor((220,435 + 2,700) x 1.0651) = 237,661. Final has the Support's 86,411 inside the bracket, about +96,632 after Percent AP. The first two stages leave out Atropine, Strength Orb and Attack Power % Other so they match the Character Profile.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

Weapon Power and Main Stat are not rebuilt from gear, so a wrong entry shifts every row that uses them.

</details>

</div>
</div>

### Crit and damage layers

Your damage is four layers that multiply: crit rate and Crit Damage, the extra damage on crit hits (Crit Hit Damage), Evolution Damage, and Additional Damage. Each layer is its own multiplier, so a point added to a small layer is worth more than a point added to a big one. Every row on this page changes one of them.

Each keystone changes one layer: Critical boosts the extra damage on crit hits, Master adds crit rate and Additional Damage, and Pulverize adds Evolution Damage. The summary card shows two crit figures. **Eff. Crit Rate** is the capped, probability-weighted value the score uses. **Peak Crit Rate** adds every bonus at full strength with no cap, can read above 100%, and only shows the ceiling in a burst window.

<div class="setup-panel doc-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

The sources of each layer, with the RE 333 default value:

<div class="ap-acc-table-scroll doc-table-scroll">
<table class="ap-brace-compare-table doc-table">
<thead>
<tr>
<th class="ap-brace-th-label">Layer</th>
<th class="ap-brace-th-label">How sources combine</th>
<th class="ap-brace-th-label">Default build</th>
</tr>
</thead>
<tbody>
<tr>
<td>Crit rate</td>
<td>Added, then capped at 100% with the uptime blend</td>
<td>Crit stat 658 gives 23.55% (stat x 0.03579099 / 100 as a fraction, 0.2355 after rounding down to 4 decimals), rings 1.90, bracelet 4.20, Adrenaline 19.40, strike 20, Back Attack 8.33, total 77.38%</td>
</tr>
<tr>
<td>Crit Damage</td>
<td>Added to the base 200%</td>
<td>Rings 8, bracelet 6.8, Keen Blunt Weapon 52, strike 32, total 298.80%</td>
</tr>
<tr>
<td>Crit Hit Damage</td>
<td>Each source multiplies the others</td>
<td>Two bracelet lines at 1.5% and Chaos Core: Flashy Ancient 17P at 1.65% give 1.015 x 1.015 x 1.0165, which is +4.72%</td>
</tr>
<tr>
<td>Evolution Damage</td>
<td>Added</td>
<td>Yearning 14, Evolution Karma rank 6 gives 6, Standing Striker 21, total 41%</td>
</tr>
<tr>
<td>Additional Damage</td>
<td>Added</td>
<td>Pet 1.0, weapon quality 30, necklace 2.6, Astrogem 4.76, total 38.36%</td>
</tr>
</tbody>
</table>
</div>

Other sources: Keen Sense adds Crit Rate (4% per level) and Evolution Damage (5% per level). Limit Break adds 10% Evolution Damage per level. Crit Rate synergies add 10% each, two Crit Hit Damage synergies multiply by 1.08 each, and Optimized Training 1 adds 5% Evolution Damage. Weapon quality adds 10% plus 0.002% times quality squared (quality 100 gives 30%). Astrogem Additional Damage is the level times 8.0834, rounded down, over 10,000 (level 59 gives 4.76%). Keen Blunt Weapon adds 44% to 52% Crit Damage by node and its stone adds 7.5% to 15%.

Check for the best cell at the defaults (LB1/KS2, Master + Pulverize): effective crit 92.38%, Crit Damage 2.988, Crit Hit Damage 1.0472, Evolution 1 + 0.81, Additional 1 + 0.4686.

```text
((1 - 0.9238) + 0.9238 * 2.988 * 1.0472) * 1.81 * 1.4686 * 0.98 = 7.73
```

Only ratios of this number are ever shown, so the absolute value means nothing alone. Doing all nine cells this way by hand gives the same five percentages as the Top Combinations table.

Crit Rate Dual and Crit Damage Dual are the bracelet lines that carry a 1.5% Crit Hit Damage bonus.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

Which sources multiply and which add follows the game's tooltips and in-game tests. A source in a different layer would change its own value, not the rest of the chain. Breaking Moon is folded into Crit Damage as an average per cast.

</details>

</div>
</div>

### Ark Grid cores

The Ark Grid Core Comparison answers one question per core: how much more DPS this core gives than having none of that kind. Each Chaos Core row removes your current core of that kind, adds the candidate at the grade and points shown, and compares the two. Only the damage half of each core counts.

<div class="ap-acc-table-scroll doc-table-scroll">
<table class="ap-brace-compare-table doc-table doc-table--wide">
<thead>
<tr>
<th class="ap-brace-th-label">Chaos Core, 20 points</th>
<th class="doc-th-relic">Relic</th>
<th class="doc-th-ancient">Ancient</th>
<th>Relic to Ancient</th>
</tr>
</thead>
<tbody>
<tr>
<td>Flashy Attack</td>
<td class="doc-num">3.09%</td>
<td class="doc-num">4.14%</td>
<td class="doc-num">+1.03%</td>
</tr>
<tr>
<td>Smoldering Strike</td>
<td class="doc-num">2.60%</td>
<td class="doc-num">3.78%</td>
<td class="doc-num">+1.14%</td>
</tr>
<tr>
<td>Attack</td>
<td class="doc-num">2.84%</td>
<td class="doc-num">3.64%</td>
<td class="doc-num">+0.78%</td>
</tr>
<tr>
<td>Absorbing Strike</td>
<td class="doc-num">1.99%</td>
<td class="doc-num">3.00%</td>
<td class="doc-num">+0.99%</td>
</tr>
<tr>
<td>Stable Attack</td>
<td class="doc-num">1.90%</td>
<td class="doc-num">2.85%</td>
<td class="doc-num">+0.94%</td>
</tr>
<tr>
<td>Crushing Strike</td>
<td class="doc-num">1.84%</td>
<td class="doc-num">2.76%</td>
<td class="doc-num">+0.91%</td>
</tr>
<tr>
<td>Swift Attack</td>
<td class="doc-num">1.81%</td>
<td class="doc-num">2.72%</td>
<td class="doc-num">+0.90%</td>
</tr>
<tr>
<td>Weapon</td>
<td class="doc-num">1.55%</td>
<td class="doc-num">1.98%</td>
<td class="doc-num">+0.43%</td>
</tr>
</tbody>
</table>
</div>

For Order cores, only their 17 point line differs between Relic and Ancient, so that line is the whole comparison.

<div class="setup-panel doc-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

Chaos Core effects unlock at 10, 14, 17, 18, 19 and 20 points. The tables hold the cumulative totals at each level from in-game tooltips and tests. Relic and Ancient are identical below 17 points. Every gain is DPS with the core divided by DPS without it, minus 1, and the last column is

```text
upgrade = (1 + Ancient 20P gain) / (1 + Relic 20P gain) - 1
```

By kind of row:

- Crit Hit Damage (Flashy), Crit Damage (Swift), Crit Rate (Crushing) and Additional Damage (Stable) feed the grid, so both sides use the nine cell search.
- Damage to foes lines (Flashy's Damage %, Smoldering's Boss Damage, Absorbing's Damage) multiply instead of adding. A core's 14, 17 and 18 to 20 point lines combine as (1 + a)(1 + b)(1.0016)^n - 1, about 0.01 to 0.02 points above the plain sum of the tooltip figures.
- Smoldering's Burn half does not depend on points. It is 0.6% of total damage at Relic and 1.25 times that at Ancient, and it multiplies with the Boss Damage half.
- Chaos Core: Attack and Weapon use the Attack Power formula with the Support held fixed. Weapon is folded into your typed Weapon Power: the new value is `WP * (1 + (pct / 100) / WPmult) + flat * WPmult`, where `pct` is the core's Weapon Power % in points and `WPmult` is your Weapon Power multiplier (1 + total Weapon Power % / 100).
- Not modeled: Speed, Stable's damage reduction, Swift's Attack Speed, Absorbing's healing and the non-damage half of Crushing (a weak point utility buff with no DPS value). Crushing's Crit Rate half is valued.

At the defaults, Ancient 20 points: Smoldering is (1 + 3.0028%) x (1 + 0.75%) - 1 = 3.78%, Absorbing is simply 3.00%, and Chaos Core: Weapon turns 259,216 Weapon Power into 273,732 (+5.6%) for a 1.98% gain after the fixed Support dilutes it. Swift's +8.35% Crit Damage reads 2.72%, which a hand computation of the nine cells with and without it also gives.

**Order cores.** With `s` the share of your damage the line touches, `r` the Relic bonus and `a` the Ancient bonus:

```text
relic total = 1 - s + s * (1 + r) / (1 + a)
gain = 1 / relic total - 1
```

The shares are measured with the core already Ancient (they come from the build pages' Trixion damage charts), so the Relic total is the Ancient one with the extra bonus divided back out. A Damage to foes line touches everything (s = 1). A Normal Skill Damage line touches everything except Surge and Awakening, a proxy that leaves a small amount of bleed and other non-skill damage in the share.

- Swift Resolution (222) hits Deathly Slash (35.5% of damage), 15% vs 20%: 1 / (0.645 + 0.355 x 1.15 / 1.20) - 1 = 1.50%.
- Arts Core on RE 111 touches 78.6% of damage (100% minus Surge 19.9% minus Awakening 1.5%) at +5% vs +6%: 0.75%.
- Some cores carry a stack count or a coverage below 100%, which the table's detail line states.

The shares are the build pages' measured chart values, and a script keeps the calculator's copy in step with them.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

Each Order core is judged on one build, the one it is used on, so that table is not a ranking across builds. Smoldering's Burn estimate and the grade tables are the assumptions to watch.

</details>

</div>
</div>

### Bracelet, Accessory and A vs B comparisons

These panels value one line or one whole piece at a time, always as a ratio to a baseline. The Bracelet and Accessory tables answer "what is this line worth". The two A vs B panels are sandboxes: pick two things and see which is better.

<div class="setup-panel doc-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

**Bracelet Line Comparison.** Every row is valued against your setup with your own bracelet removed: bracelet lines off, both Dual checkboxes off, and your Crit Stat reset to a bracelet-free 576 (a character with all side content done, used only so your current bracelet is not counted twice). One candidate line is added, the nine cell search runs for both sides, and the result is the ratio. By kind of row:

- Crit Rate, Crit Damage, Crit Stat and Additional Damage lines go through the full search.
- Back Attack Damage is the tabled value times the 0.95 back attack share (2.5% reads 2.38%). Outgoing Damage plus Damage to Staggered adds the Stagger line at the 5% share (2% + 4% x 0.05 reads 2.20%). Damage plus Cooldown reads the damage value minus 1 point as an estimate for the cooldown half (4.5% reads 3.50%).
- Weapon Power and Attack Power lines use the Attack Power formula with the Support fixed, so a Weapon Power line reads about 72% of its no-Support value.
- Spec Stat has its own model. The gain per point is `(m - 1) / (1735 * m)` where `m = 1 + (0.86 * shareRatio + 0.1528 * awakeningRatio) / 699 * 1735`. The two ratios say how much of your damage comes from the skill Spec scales and from your Awakening, each normalized at a reference Spec of 1855. On RE 333 (17% skill share, 1.5% Awakening) +100 Spec reads 0.67%. It counts damage only, not cooldown reduction.
- A few Weapon Power lines use an assumed stack count, fight length or uptime, listed in the register.

Check: High Crit Rate +5% with its +1.5% Crit Hit Damage bonus reads 5.18% in the table and in a hand computation.

**Accessory Line Comparison.** Same idea, but against your real current gear instead of a bracelet-free baseline. Necklace, earring and ring tables also show the two lines of one piece rolled together (LL, ML, MM, HL, HM, HH, for Low, Mid and High). Earrings are the one case where a line feeds Weapon Power %, so your base Weapon Power is reverse-derived from the total you typed and your Weapon Power % fields, and is only as exact as those fields.

**Bracelet vs Bracelet and Accessory vs Accessory.** Each side is valued as four layers: the keystone, crit and Additional Damage lines (searched), Spec, the flat lines, and Attack Power plus Weapon Power. Each layer is computed alone against the same baseline, and the layers are multiplied. The default bracelet reads +14.73%, about 1.1397 x 1.0067 x 1.0000 x 1.0000 (its lines are Crit Rate, Crit Damage and Additional Damage, so the flat layer is empty). Damage plus Cooldown uses the raw tag in the sandbox unless you tick the box, because the cooldown value is personal. Accessory A is always treated as your equipped piece, and any Main Stat or flat line on it is backed out of the shared baseline. The reference table applies the Damage plus Cooldown penalty, while Bracelet vs Bracelet leaves it to you.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

Layers are treated as independent, so an interaction between, say, Spec and Attack Power is ignored.

</details>

</div>
</div>

### Engravings and Raid Captain

The Engraving Comparison shows what each engraving is worth and which two flexible engravings work best together. Raid Captain depends Move Speed, so its value follows a Move Speed estimate. That estimate uses the same expand-then-cap method as the crit rate, so a high average does not hide the time spent below the cap.

<div class="setup-panel doc-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Math</span>The math<span class="setup-note-arrow"></span></summary>

- Grudge, Cursed Doll and Mass Increase are tabled values by node level, plus your Ability Stone level. Grudge at 4 nodes reads 21.00% and Cursed Doll 17.00%.
- Ambush Master is two multiplying parts: the Back Attack Damage half (15% times your effective back attack share, 0.833 at the defaults) and the book-level Damage half (7.6% at 4 nodes). That is 1.12495 x 1.076 - 1 = 21.04%.
- Adrenaline and Keen Blunt Weapon use a real with-and-without search, so the winning keystone can flip, as in the Ark Grid rows. The Keen Blunt Weapon stone-level preview works the same way.
- Raid Captain's tabled value (48% at 4 nodes) is its bonus at the 140% Move Speed cap. It scales linearly from 0% at 100% Move Speed, so the row is the node value times (expected capped Move Speed minus 100) over 100.
- Mana Food's row is the Main Stat gain through the Attack Power formula, Support fixed. On Surge 111 and 333 it also carries the Maelstrom Bleed rune's +0.75% damage. On RE it is informational and left out of every DPS total.
- Best Combo and Runner-Up search every pair of the flexible engravings (Raid Captain, Keen Blunt Weapon, Cursed Doll, plus Mass Increase on Surge if you opt in), valued together. Raid Captain is in the pool on both specs so you can see its value even if you would not drop it. At the defaults the best pair is Raid Captain plus Keen Blunt Weapon at +39.42%, 0.74% ahead of Raid Captain plus Cursed Doll at +38.40%. The 0.74% compares the two whole setups (1.3942 / 1.3840 - 1), so it is not the 1.02 point difference between the displayed gains.
- Setup A vs Setup B compares two whole loadouts of your choice the same way.

**Move Speed.** Every on/off combination of the sometimes-on sources is capped at 140% and weighted by its joint probability. At the RE 333 defaults the base is 127.32% (106.32 base, 12 class passive, 9 Passionate Dance) and Maelstrom adds 12.8% at 85% uptime. The expected capped Move Speed is 138.10%, shown as Raid Captain Efficiency 95.25% (the share of the way from 100% to the 140% cap). Capping the average instead would read 95.50%. With the Paladin checkbox added (24.6% at a 35% assumed uptime) the true figure is 96.91%, while capping the average would read 100.00% and hide that you are still below the cap part of the time. The Raid Captain row in the engraving table is its node value times that fraction: 0.48 (4 nodes, no stone) times 0.38098 gives 18.29%.

Sources: base 106.32, plus 12 from the class on RE (10 on Surge), Passionate Dance 9 with a Support, Valkyrie or Artist 8, and Vernese Wine 3 on Surge when you do not use Mana Food. The 8 is exactly Valkyrie's Move Speed at 100% uptime. Artist (a skill-based 10% at 70-100% uptime) is grouped in for simplicity, so no uptime or skill input is needed. Maelstrom (12.8), Rage Rune (16 on Surge) and Paladin (24.6) are sometimes-on, at the register's uptimes. The cap is 140.

Mass Increase's Attack Speed drawback is not modeled, which is why it is an opt-in checkbox. Attack Speed is not tracked at all, because nothing on this page depends on it.

**Ability Stone penalties** are not tracked. Attack Power Reduction (2%, 4% or 6% in game) subtracts from your other Attack Power % sources, such as Adrenaline or the Kazeros astrogems, so it would lower every Attack Power based row. Move Speed Reduction (also 2%, 4% or 6%) subtracts from Move Speed, which Raid Captain reads.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Limits</span>Assumptions and limits<span class="setup-note-arrow"></span></summary>

Move Speed sources are treated as independent. Ability Stone penalties and Attack Speed are not tracked.

</details>

</div>
</div>

## Assumption register

Every estimate the calculator uses, where it comes from, and what it moves. "Logs" means typical figures across many players' logs, not measurements of one character. The headline ones: the Support (0.4 coefficient, 98% uptime), Adrenaline at 97% damage coverage, the 0.95 back attack share, and the Keen Blunt Weapon downside.

<div class="setup-panel doc-panel" data-accent="purple" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Table</span>All assumptions<span class="setup-note-arrow"></span></summary>

<div class="ap-acc-table-scroll doc-table-scroll">
<table class="ap-brace-compare-table doc-table doc-table--wide">
<thead>
<tr>
<th class="ap-brace-th-label">Assumption</th>
<th class="ap-brace-th-label">Value</th>
<th class="ap-brace-th-label">Basis</th>
<th class="ap-brace-th-label">Moves</th>
</tr>
</thead>
<tbody>
<tr>
<td>Adrenaline uptime default</td>
<td>97%</td>
<td>Logs; the meter shows damage coverage at 6 stacks</td>
<td>Crit rate, Attack Power</td>
</tr>
<tr>
<td>Adrenaline AP rebuild share</td>
<td>0.5</td>
<td>Average of stacks 1 to 5 of 6</td>
<td>About 0.1 AP points at 80%</td>
</tr>
<tr>
<td>Support Attack Power coefficient</td>
<td>0.4</td>
<td>Reference sheet Support with specific gearing</td>
<td>Every Weapon Power, Main Stat, flat AP and Base AP row</td>
</tr>
<tr>
<td>Support uptime and gearing</td>
<td>98%; same Weapon Power and Main Stat as you</td>
<td>Estimate; a generic Support</td>
<td>Same rows</td>
</tr>
<tr>
<td>Support held fixed for candidate rows</td>
<td>n/a</td>
<td>A bracelet you buy does not upgrade the Support; matches the reference sheet</td>
<td>Rows read at the low end of a range</td>
</tr>
<tr>
<td>Ability Stone row exception</td>
<td>n/a</td>
<td>The Support can share the stone's threshold bonus</td>
<td>That row reads about 39% higher</td>
</tr>
<tr>
<td>Ether effectiveness</td>
<td>0.31</td>
<td>Maxed relic engraving (16%) plus Lv. 2 stone (15%)</td>
<td>Flash Orb, Strength Orb</td>
</tr>
<tr>
<td>Back Attack Rate default</td>
<td>85%</td>
<td>Logs</td>
<td>Crit rate, back attack rows</td>
</tr>
<tr>
<td>Back attack share of DPS</td>
<td>0.95</td>
<td>Assumed</td>
<td>Back Attack rows, Ambush Master</td>
</tr>
<tr>
<td>Stagger share</td>
<td>5%</td>
<td>Assumed</td>
<td>Stagger bracelet rows</td>
</tr>
<tr>
<td>On-hit stacks, periodic fight length, HP-gated uptime</td>
<td>5 of 6, 10 minutes, 99%</td>
<td>Assumed</td>
<td>The matching Weapon Power bracelet lines</td>
</tr>
<tr>
<td>Damage + Cooldown downside</td>
<td>-1 point</td>
<td>Arbitrary estimate</td>
<td>Reference table applies it; Bracelet vs Bracelet leaves it to you</td>
</tr>
<tr>
<td>Keen Blunt Weapon downside</td>
<td>x0.98</td>
<td>10% chance of -20%</td>
<td>Keen Blunt Weapon and what it touches</td>
</tr>
<tr>
<td>Specialization base and reference</td>
<td>1735 and 1855</td>
<td>Reference sheet, confirmed in game</td>
<td>Specialization rows</td>
</tr>
<tr>
<td>Crit stat for a typical non-bracelet build</td>
<td>576</td>
<td>A character with all side content done; only used to back out your current bracelet</td>
<td>Bracelet crit rows</td>
</tr>
<tr>
<td>Awakening damage share</td>
<td>Per build</td>
<td>Fits the latest raid, varies by content</td>
<td>Specialization rows</td>
</tr>
<tr>
<td>Breaking Moon average Crit Damage</td>
<td>+11.25 points</td>
<td>75% Surge share times 1 in 4 casts times 60%; a stricter weighting gives about 11.1 points, about 0.04% DPS</td>
<td>Surge 111 Crit Damage</td>
</tr>
<tr>
<td>Maelstrom, Rage Rune, Paladin uptime</td>
<td>85/80/90, 20%, 35%</td>
<td>Logs and representative values</td>
<td>Move Speed, Raid Captain</td>
</tr>
<tr>
<td>Artist/Valkyrie Move Speed</td>
<td>Flat 8</td>
<td>Exactly Valkyrie at 100% uptime; Artist grouped in</td>
<td>Move Speed, Raid Captain</td>
</tr>
<tr>
<td>Smoldering Burn share</td>
<td>0.6% Relic, 0.75% Ancient</td>
<td>Logs of many players and an in-game dummy test</td>
<td>Smoldering row</td>
</tr>
<tr>
<td>Order core damage shares</td>
<td>Per build and core</td>
<td>Build pages' Trixion charts, kept in step by a script</td>
<td>Order Core table</td>
</tr>
<tr>
<td>Normal Skill Damage share</td>
<td>100% minus Surge minus Awakening</td>
<td>Simplification; bleed and other non-skill damage left in</td>
<td>Arts Core row</td>
</tr>
<tr>
<td>Weapon Power base for earring rows</td>
<td>Reverse-derived from your typed total</td>
<td>Only as exact as your Weapon Power % fields</td>
<td>Earring Line 2 rows</td>
</tr>
<tr>
<td>Raid Captain scaling</td>
<td>Linear, 0% at 100 Move Speed to full at 140</td>
<td>The tabled value is the bonus at the cap</td>
<td>Raid Captain row</td>
</tr>
<tr>
<td>Ability Stone penalties</td>
<td>Not tracked</td>
<td>Rare, and the importer does not read them yet</td>
<td>Attack Power Reduction would lower the Attack Power % total, Move Speed Reduction the Raid Captain Move Speed</td>
</tr>
<tr>
<td>Independent sometimes-on terms</td>
<td>n/a</td>
<td>Stated simplification</td>
<td>Crit rate and Move Speed near their caps</td>
</tr>
<tr>
<td>Independent layers in A vs B panels</td>
<td>n/a</td>
<td>Sandbox simplification</td>
<td>Interactions between layers</td>
</tr>
</tbody>
</table>
</div>

</details>

</div>
</div>

## Known limits and how to challenge it

**Not modeled:** skill-by-skill crit differences, rotation effects, Optimized Training 1's cooldown reduction, each Chaos Core's non-damage half (Speed, damage reduction, healing and Crushing's weak point utility buff), Mass Increase's Attack Speed drawback, Attack Speed in general and Ability Stone penalties.

**What would improve it:** your own measured values. Every default can be changed, and the Combat Analyzer figures (Adrenaline coverage, Back Attack Rate, Raid Captain Efficiency) are the most useful ones to replace. If you think a rule is wrong, report the section, the input values you used and the number you expected.

**How it was checked:** tooltips and in-game tests for Ark Grid and engraving values, combat logs for the estimated rates, and the reference spreadsheets ([1](https://docs.google.com/spreadsheets/d/1RKpzg6sPNe7fuPDudJHAs0qbFukOwSyhMynDOijfoKY/edit?usp=sharing), [2](https://docs.google.com/spreadsheets/d/1_0J7liyM_yw16pyn6TKlF1YGaIt5n_A9hSoLnT3yTUc/edit?usp=sharing)) for formula structure. Credit to their authors: this calculator started from that work and has since moved well beyond it for this class, so the sheets are no longer a current reference.
