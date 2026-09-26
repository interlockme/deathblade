# 222 (Speedy) 🐆

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-09-21" markdown>

<!-- Difficulty/Trixion/Playstyle stats above, AND the pentagon badge below,
     both read from javascripts/build-data.js (window.DB_BUILD_DATA) - there is
     nothing to hand-edit in either div itself. Find this build by its
     data-build id there and edit pentagon/difficulty/trixion/bestFor/etc.;
     the stat row, the pentagon badge, and the essentials.md comparison table
     all update together from that one place. -->
<div class="build-stats" data-build="222-speedy" data-family="surge"></div>

**Best For:**{: .best-for } Players who want something easy to pick up but difficult to master.

**Tradeoff:**{: .tradeoff } Increased <span class="skill-mention" data-glossary-id="backattack">back attack</span> stress and uptime requirements.

- Simple uptime-focused gameplay with no gimmicks.
- Incorporates Dark Axel for higher mobility and utility.
- Lots of <span class="skill-mention" data-glossary-id="pushimmunity">push immunity</span>, excess stacks and skill expression.
- Very high gem efficiency: Surge and Deathly Slash are nearly all of your DPS.
- Must constantly balance Surge and Deathly Slash back attack rate with Surge <span class="skill-mention" data-glossary-id="cpm">CPM</span>.

</div>
<div class="pentagon-badge" data-build="222-speedy" data-family="surge" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[Video Guide](https://www.youtube.com/watch?v=V1UQhE37Yjs){ .video-chip } [Gameplay](https://www.youtube.com/watch?v=JQISLdCtXjQ){ .video-chip }
</div>
</div>
</div>

## Skill Codes

<!-- Paste the exported skill-code string (from the in-game loadout share
     feature) into the fenced code block below. Each `=== "Tab Name"` block is
     a separate tab holding its own code + optional italic note above it -
     copy that pattern to add another import option (e.g. an easier variant). -->

<div class="setup-panel" data-accent="lavender" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="danger" open markdown>
<summary><span class="setup-note-tag">Warn</span>Before Importing<span class="setup-note-arrow"></span></summary>

Make sure you've read [Essentials](essentials.md), then apply both "<span class="skill-mention" data-glossary-id="arkpassive">Ark Passive</span>" and "Skill" to be safe. For [Gems](#gems), follow the guide.

</details>

</div>
</div>

=== "222 Speedy"

    ```
    529EFCAD5AADC38E0F6BA8A7F7781C136E88697BFAF5999811D8898564A010617FD14F6822C637C0A2B745A010DF50CE26CBEA0A8F493EAF49317C90E2806F53
    ```

## Ark Setup

<!-- ark-passives / ark-cores JSON below use the site-wide node/core id
     vocabulary - each ark-passives node only needs its id + invested level,
     tier/max/name/icon all resolve from ap-node-names.js. Full schema is
     documented in javascripts/ark-passive-tree.js and ark-core-badge.js's
     "EASY EDIT GUIDE" comments. A nested "Alt" details block (e.g. an
     easier/optional variant) can carry its own compact ark-passives/
     skill-setup pair for that alternative - copy the existing pattern
     rather than editing the main tree in place. -->

<div class="setup-panel" data-accent="lavender" markdown>

<div class="ark-passives" data-family="surge" markdown>
<script type="application/json">
[
    { "id": "evolution", "nodes": [
      { "id": "crit", "level": 10 },
      { "id": "specialization", "level": 30 },
      { "id": "keensense", "level": 2 },
      { "id": "limitbreakevo", "level": 1 },
      { "id": "strike", "level": 2 },
      { "id": "master", "level": 1 },
      { "id": "pulverize", "level": 1 },
      { "id": "standingstriker", "level": 2 }
    ] },
    { "id": "enlightenment", "nodes": [
      { "id": "surgeenhancement", "level": 1 },
      { "id": "orbcompression", "level": 3 },
      { "id": "orbcontrol", "level": 2 },
      { "id": "limitbreakenl", "level": 3 },
      { "id": "chaoticpower", "level": 3 }
    ] },
    { "id": "leap", "nodes": [
      { "id": "awakeningamplifier", "level": 1 },
      { "id": "unleashedpower", "level": 5 },
      { "id": "releasepotential", "level": 3 },
      { "id": "instantspell", "level": 3 },
      { "id": "danceofscreams", "level": 3 }
    ] }
  ]
</script>
</div>

<div class="ark-cores" data-family="surge" markdown>
<script type="application/json">
[
  { "core": "sun", "label": "Slaughter Spectacle", "points": 0 },
  { "core": "moon", "label": "Twin Swords Dance", "points": 0 },
  { "core": "star", "label": "Swift Resolution", "points": 1 }
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Ark Passive<span class="setup-note-arrow"></span></summary>

- Use the [Ark Passive Calculator](../resources.md#ark-passive-calculator) to optimize Evolution nodes.
- <span class="skill-mention" data-ap-id="chaosinfusion" data-level="1">Chaos Infusion 1</span> + <span class="skill-mention" data-ap-id="orbcontrol" data-level="1">Orb Control 1</span> can be used if your Surge DPS share is consistently over 50%.
- This build is capable of using <span class="skill-mention" data-skill-id="raidcaptain">Raid Captain</span> + <span class="skill-mention" data-skill-id="massincrease">Mass Increase</span> with the least drawbacks.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span><span class="skill-mention" data-glossary-id="arkgrid">Ark Grid</span><span class="setup-note-arrow"></span></summary>

- Damage and QoL will be seriously lacking if you settle for the minimum core requirements.

</details>

</div>

</div>

## Skill Setup

<!-- Full skill-setup schema (id/level/tripods/rune/subtitle/picks) is in
     javascripts/skill-setup.js's "EASY EDIT GUIDE" comment. Names, icons, and
     tags resolve automatically by id from skill-data.js - only add "name" to
     override the display text for a genuine one-off case. -->

<div class="setup-panel" data-accent="lavender" markdown>

<div class="skill-setup" data-family="surge" markdown>
<script type="application/json">
[
  {"id": "surpriseattack", "level": 14, "tripods": [1, 1, 1], "rune": {"tier": "legendary", "name": "Rage"}},
  {"id": "windcut", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "upperslash", "level": 14, "tripods": [2, 3, 2], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "bladedance", "level": 14, "tripods": [1, 1, 2], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "darkaxel", "level": 10, "tripods": [1, 1, 2], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "headhunt", "level": 4, "tripods": [1], "rune": {"tier": "legendary", "name": "Vision"}},
  {"id": "turningslash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "legendary", "name": "Poison"}},
  {"id": "maelstrom", "level": 13, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Bleed"}},
  {"id": "deathtrance", "subtitle": "Identity"},
  {"id": "deathlyslash", "subtitle": "Technique"},
  {"id": "bladeassault", "subtitle": "Awakening"},
  {"id": "surge", "subtitle": "Identity"}
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Runes<span class="setup-note-arrow"></span></summary>

- Use <span class="skill-mention" data-rune-name="Purify">Purify</span> on Head Hunt if needed.
- Use <span class="skill-mention" data-rune-name="Focus" data-rune-tier="legendary">Focus</span> on Maelstrom if you experience mana issues.
- Use <span class="skill-mention" data-rune-name="Vision" data-rune-tier="legendary">Legendary Vision</span> on Surprise Attack if you find it more useful than <span class="skill-mention" data-rune-name="Rage" data-rune-tier="legendary">Rage</span>.
    - Increases chance of getting an extra stack on Surprise Attack precast.
    - Give Head Hunt the next best <span class="skill-mention" data-rune-name="Galewind">Galewind</span> or <span class="skill-mention" data-rune-name="Vision">Vision</span> rune that's available.

*Note: Don't equip <span class="skill-mention" data-rune-name="Galewind" data-rune-tier="legendary">Legendary Galewind</span> on Blade Dance for this build. It doesn't benefit from a rune rarity above Epic (or even above <span class="skill-mention" data-rune-name="Vision" data-rune-tier="legendary">Legendary Vision</span>) due to the way the game [rounds down](https://www.inven.co.kr/board/lostark/5497/175825) cast time reductions to 0.05s intervals.*

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Note</span>Options & Tripods<span class="setup-note-arrow"></span></summary>

- You can bring Head Hunt down to Lv 1 for lower mana use.
    - Raising it past Lv 4 is not ideal as you lose a stack and increase mana use for little reason.
- You can use Wide Attack <span class="skill-mention" data-glossary-id="tripod">tripod</span> on Surprise Attack for noticeably increased quality of life.
    - With Wide Attack, you **must** cast Turning Slash early on openers to apply synergy.
    - This is more viable than ever as Turning Slash's lingering hits now extend its uptime.
- Earth Cleaver can be used instead of Head Hunt if you prefer its mobility or utility.
    - It's a slower, more vulnerable skill cast that consumes significantly more mana.
    - Set Maelstrom and Upper Slash to Lv 10, then raise Earth Cleaver (3-3-1) to Lv 10.

</details>

<details class="setup-note" data-kind="example" open markdown>
<summary><span class="setup-note-tag">Alt</span>Dark Axel vs Spincutter<span class="setup-note-arrow"></span></summary>

<div class="skill-compare-row" markdown>
<div class="skill-compare-col" markdown>
<span class="skill-compare-title"><span class="skill-inline" data-skill-id="darkaxel"><span class="skill-inline-name">Dark Axel</span></span> · Default</span>

The build's signature. It recreates RE's Surge using two skills: Dark Axel carries you over the boss, then Deathly Slash precisely slams you into its back.

**In the rotation:**

- Usually better <span class="skill-mention" data-glossary-id="cpm">CPM</span> when repositioning; faster than 2 or more casts of (tapped) Spincutter.
- Always cast right before Deathly Slash and Surge, leaving very little to chance.
- Push immunity panic button that saves your spacebar and lets you greed twice as much.
    - Using it that way limits your mobility for the cycle, but increases uptime on the boss.

**Best For:**{: .best-for } Getting the most out of the build.

**Tradeoff:**{: .tradeoff } Takes practice, and pays off most once you're used to the advanced skip cycles.

</div>
<div class="skill-compare-col" markdown>
<span class="skill-compare-title"><span class="skill-inline" data-skill-id="spincutter"><span class="skill-inline-name">Spincutter</span></span> (3-3-1) · Alternative</span>

Can replace Dark Axel if you find it more useful on bosses with a small hitbox or Mordum Extreme.

**In the rotation:**

- Repositioning with it loses <span class="skill-mention" data-glossary-id="cpm">CPM</span> compared to Dark Axel when cast 2 or more times (tapped). A single cast is slightly faster than Dark Axel.
- Repositioning with it while skipping Upper Slash costs you the free <span class="skill-mention" data-glossary-id="pushimmunity">push immune</span> window, one of the build's core benefits. You still have skills left to cast, so you're out of luck if the boss turns.
- Moves you around the boss, so you aim outward toward its back, risking a miss from Deathly Slash's forward movement.

**Best For:**{: .best-for } Players who prefer simplicity: a single cycle is easier to loop if you don't wish to learn the advanced skip cycles or their recovery options.

</div>
<div class="skill-compare-foot" markdown>
**Best of both:** Swap freely by content, or :ratJAM: run Lv 4 Spincutter instead of <span class="skill-mention" data-skill-id="headhunt">Head Hunt</span> when <span class="skill-mention" data-glossary-id="counter">Counter</span> isn't needed.
</div>
</div>

</details>

</div>

</div>

## Gems

<!-- Ranked skill-id lists per column (dmg/cd), top = highest priority.
     Full schema, including the expandable "alts" form for a swappable
     alternative, is in javascripts/gem-priority.js's "EASY EDIT GUIDE"
     comment. -->

<div class="setup-panel" data-accent="lavender" markdown>

<div class="gem-priority" markdown>
<script type="application/json">
[
  { "col": "dmg", "items": [
    "surge",
    "bladedance",
    "turningslash",
    "windcut"
  ] },
  { "col": "cd", "items": [
    "upperslash",
    "surpriseattack",
    "maelstrom",
    "bladedance",
    "windcut",
    "turningslash",
    { "id": "darkaxel", "alts": [
      { "id": "surpriseattack", "note": "Use Surprise Attack DMG instead if you prefer, or even another class's Lv 10 gem." },
      { "id": "spincutter", "note": "Use if you decide to go with Spincutter." }
    ] }
  ] }
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Note</span>Gem Requirements<span class="setup-note-arrow"></span></summary>

- To reach its ceiling, this build requires higher investment in cooldown gems than the others.
    - <span class="skill-mention" data-skill-id="massincrease">Mass Increase</span> and/or <span class="skill-mention" data-ap-id="optimizedtraining" data-level="1">Optimized Training 1</span> help smooth things out at low investment levels.
    - +CD% <span class="skill-mention" data-glossary-id="bracelet">bracelet</span> increases gem level requirements by 1, low <span class="skill-mention" data-glossary-id="specializationstat">Specialization</span> is not recommended.
    - Once Blade Dance and Maelstrom CD are at Lv 9, Wind Cut CD priority increases significantly.
    - The gem priority list above assumes you will be using a rotation with the advanced skip cycles.

</details>

</div>

</div>

## Rotation

<!-- Each `.rotation-line` is a compact JSON step list of skill ids in
     order - names/icons resolve automatically, same id vocabulary as Skill
     Setup and Gems above. Full schema (situational steps, swapNext,
     cycleRef, trailing suffix, etc.) is in javascripts/rotation-line.js's
     "EASY EDIT GUIDE" comment. -->

There's an optimal skill order, but you have flexibility when facing downtime or weaving in mobility skills.

'Destiny: Enhanced Sharpness' can be stacked up to 5 times by using (Normal) skills to empower Deathly Slash.

Use Dark Axel to guarantee back attacks on Deathly Slash and Surge if needed.

Use the Opener cycle and either loop it forever (easy) or continue on to the advanced skip cycles (ceiling DPS).

*From 3 orbs:*
{ .lead }

<div class="cycle-card" markdown>
<div class="cycle-card-header"><span class="cycle-num cycle-num-1">1</span><span class="cycle-title">Opener/Overstack Cycle - 68 Stacks</span></div>
<div class="rotation-line" markdown>
<script type="application/json">
["windcut", "deathtrance", "surpriseattack", "maelstrom", "windcut", "upperslash", "turningslash", "bladedance", "deathlyslash", "surpriseattack", "surge"]
</script>
</div>
</div>

1. This opener chains into the cycles below, but it's fine by itself if you prefer simplicity and don't mind downtime.
2. Surprise Attack always goes before Maelstrom on cycles with a Surprise Attack finisher so its CDs line up.

<div class="setup-panel" data-accent="lavender" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Leopard Mode (Recommended)<span class="setup-note-arrow"></span></summary>

After the opener, alternate between these two cycles as needed for ceiling DPS:

<div class="cycle-card" markdown>
<div class="cycle-card-header"><span class="cycle-num cycle-num-2">2</span><span class="cycle-title">Surprise Skip Cycle - 61 Stacks</span></div>
<div class="rotation-line" markdown>
<script type="application/json">
["windcut", "deathtrance", "maelstrom", "surpriseattack", "windcut", "upperslash", "turningslash", "bladedance", "deathlyslash", "surge"]
</script>
</div>
</div>

<div class="cycle-card" markdown>
<div class="cycle-card-header"><span class="cycle-num cycle-num-3">3</span><span class="cycle-title">Wind Cut Skip Cycle - 60 Stacks</span></div>
<div class="rotation-line" markdown>
<script type="application/json">
["deathtrance", "surpriseattack","maelstrom", "windcut", "upperslash", "turningslash", "bladedance", "deathlyslash", "surpriseattack", "surge"]
</script>
</div>
</div>

1. Cycle **2** offers safety by leaving Surprise Attack as a recovery option; Cycle **3** offers higher CPM.
2. Rotating **2>3>2>3** is ideal, but based on boss patterns, variations like **2>3>3>2** or **2>2>3>3** are valid.
      - Cycle **3** is preferred during risky boss patterns because Wind Cut lacks Paralysis Immunity.
      - Recover with Wind Cut or Surprise Attack, and decide your next cycle based on the available one.
3. You can skip a Surprise Attack finisher whenever you're at 49+ stacks before Deathly Slash.
      - Same for 40+ stacks before Blade Dance, 30+ stacks before Upper Slash, and so on.
      - If you have 8+ stacks before you activate Death Trance, you can skip both WC precast and SA finisher.
      - At 15+ stacks before Death Trance, you can skip both the WC precast and SA finisher for two cycles in a row.
4. It seems more complicated than it really is, watch [this video](https://www.youtube.com/watch?v=V1UQhE37Yjs) to see how a full rotation plays out.

It helps to think of everything within <span class="skill-inline" data-skill-id="deathtrance"><span class="skill-inline-name">Death Trance</span></span> and <span class="skill-inline" data-skill-id="deathlyslash"><span class="skill-inline-name">Deathly Slash</span></span> as 53 stacks, and the Wind Cut Precast or Surprise Attack finisher as flexible options that give you the 7+ stacks needed to complete a 60+ stack Surge.
</details>

</div>
</div>

1. Depending on attack speed/latency, your Wind Cut precast may grant 7 stacks instead of 8.
2. With lower Attack Speed (<span class="skill-mention" data-skill-id="massincrease">Mass Increase</span>), Deathly Slash may grant 12 stacks instead of 11.
3. It's better to cast a ~59 stack Surge if the alternative is waiting more than 1.5 seconds.
4. Delaying Deathly Slash + Surge by more than 1.75 seconds to ensure a back attack is a DPS loss.
5. Delaying *only* Surge by more than 1 second to ensure a back attack is also a DPS loss.
6. <span class="skill-mention" data-skill-id="bladeassault">Blade Assault</span> scales much worse on Surge than on Remaining Energy and takes too long to cast.
      - It's still useful for openers, or it can be saved to greed with <span class="skill-mention" data-glossary-id="pushimmunity">push immunity</span>/Hyper Awakening.

*Note: The timing to enter Death Trance in cycles without a precast is right as Surge hits. It's unforgiving but it can be improved with a macro that fires the Identity key 2-3x very quickly without any downsides, increasing CPM/QoL.*

*From zero orbs:*
{ .lead }

1. Use a <span class="food-req-item">![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant</span> (recommended) or proceed to #2.
      - Rat Pack: Use Maelstrom's Orb Control tripod and <span class="skill-mention" data-skill-id="flashblink">Flash Blink</span> awakening.
2. Generate one orb, build at least 40 stacks, then Surge to refill all 3 orbs.

*Atropine usage:*
{ .lead }

1. Use <span class="food-req-item">![](../assets/shared/icon-atropine.png){: .skill-icon } Atropine</span> right before Deathly Slash, and fit two Deathly Slash + Surge pairs in a 10 second window.
2. Execute your fastest cycles while adapting to your stack count and boss patterns.

## DPS Spread

<!-- data-labels / data-values / data-ids are three parallel comma-separated
     lists, ordered highest % first - update after a fresh Trixion recording
     or a balance pass. Full schema is in javascripts/dps-chart.js's
     "EASY EDIT GUIDE" comment. -->

<p class="dps-showcase-caption">Ancient cores, full Lv 10 gems in Trixion</p>

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-show-icons data-values="47.8,35.5,7.1,3.2,2.4,0.8" data-ids="surge,deathlyslash,bladedance,turningslash,windcut,surpriseattack"></div>
</div>
</div>