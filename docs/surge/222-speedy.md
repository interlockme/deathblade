# 222 (Speedy) 🐆

<p class="page-banner page-banner-warning">Not available in NA/EU servers yet, rotations subject to change</p>

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-08-07" markdown>

<!-- Difficulty/Trixion/Playstyle stats above, AND the pentagon badge below,
     both read from javascripts/build-data.js (window.DB_BUILD_DATA) - there is
     nothing to hand-edit in either div itself. Find this build by its
     data-build id there and edit pentagon/difficulty/trixion/bestFor/etc.;
     the stat row, the pentagon badge, and the essentials.md comparison table
     all update together from that one place. -->
<div class="build-stats" data-build="222-speedy" data-family="surge"></div>

**Best For:**{: .best-for } Players who want something easy to pick up but difficult to master.

**Tradeoff:**{: .tradeoff } Increased back attack stress and uptime requirements.

- Simple uptime-focused gameplay with no gimmicks.
- Highest mobility of all Deathblade builds by far.
- Tons of push immunity, excess stacks and skill expression.
- Very high gem efficiency, Surge and Deathly Slash are nearly all of your DPS.
- Must constantly balance Surge and Deathly Slash back attack rate with Surge CPM.

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

Make sure you've read [Essentials](essentials.md), then apply both "Ark Passive" and "Skill" to be safe. For [Gems](#gems), follow the guide.

</details>

</div>
</div>

=== "222 Speedy"


    ```
    6D03B7F5B7AB4E81B67BD630BEFE4D46E65FAE6571C2E7CC1684E130F17A82D11A503AABF0609CA36C0DB5E35324A0A74A13814A2B30A7A84C7EA2D4EAFECA6E
    ```

## Ark Setup

<!-- ark-passives / ark-cores JSON below use the site-wide node/core id
     vocabulary - full schema (node ids, tier shape, points) is documented in
     javascripts/ark-passive-tree.js and ark-core-badge.js's "EASY EDIT GUIDE"
     comments. A nested "Alt" details block (e.g. an easier/optional variant)
     can carry its own compact ark-passives/skill-setup pair for that
     alternative - copy the existing pattern rather than editing the main
     tree in place. -->

<div class="setup-panel" data-accent="lavender" markdown>

<div class="ark-passives" data-family="surge" markdown>
<script type="application/json">
[
    { "id": "evolution", "label": "Evolution", "points": 140, "tiers": [
      { "label": "Tier 1", "nodes": [
        { "id": "crit", "level": 10, "max": 30 },
        { "id": "specialization", "level": 30, "max": 30 }
      ] },
      { "label": "Tier 2", "nodes": [
        { "id": "keensense", "level": 2, "max": 2 },
        { "id": "limitbreakevo", "level": 1, "max": 3 }
      ] },
      { "label": "Tier 3", "nodes": [
        { "id": "strike", "level": 2, "max": 2 }
      ] },
      { "label": "Tier 4", "nodes": [
        { "id": "master", "level": 1, "max": 1 },
        { "id": "pulverize", "level": 1, "max": 1 }
      ] },
      { "label": "Tier 5", "nodes": [
        { "id": "standingstriker", "level": 2, "max": 2 }
      ] }
    ] },
    { "id": "enlightenment", "label": "Enlightenment", "points": 100, "tiers": [
      { "label": "Tier 1", "nodes": [
        { "id": "surgeenhancement", "level": 1, "max": 1 }
      ] },
      { "label": "Tier 2", "nodes": [
        { "id": "orbcompression", "level": 3, "max": 3 }
      ] },
      { "label": "Tier 3", "nodes": [
        { "id": "orbcontrol", "level": 2, "max": 5 },
        { "id": "limitbreakenl", "level": 3, "max": 3 }
      ] },
      { "label": "Tier 4", "nodes": [
        { "id": "chaoticpower", "level": 3, "max": 3 }
      ] }
    ] },
    { "id": "leap", "label": "Leap", "points": 70, "tiers": [
      { "label": "Tier 1", "nodes": [
        { "id": "awakeningamplifier", "level": 1, "max": 3 },
        { "id": "unleashedpower", "level": 5, "max": 5 },
        { "id": "releasepotential", "level": 3, "max": 5 },
        { "id": "instantspell", "level": 3, "max": 3 }
      ] },
      { "label": "Tier 2", "nodes": [
        { "id": "danceofscreams", "level": 3, "max": 3 }
      ] }
    ] }
  ]
</script>
</div>

<div class="ark-cores" data-family="surge" markdown>
<script type="application/json">
[
  { "core": "sun", "label": "Deadly Feast", "points": 0 },
  { "core": "moon", "label": "Dual Blade Dance", "points": 0 },
  { "core": "star", "label": "Swift Resolution", "points": 1 }
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Ark Passive<span class="setup-note-arrow"></span></summary>

- Use the [Ark Passive Calculator](../resources.md#ark-passive-calculator) to optimize Evolution nodes.
- Chaos Infusion 1 + Orb Control 1 can be used if your Surge dps share is consistently over 50%.
- This build is capable of using Raid Captain + Mass Increase with the least drawbacks.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Ark Grid<span class="setup-note-arrow"></span></summary>

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
  {"id": "headhunt", "level": 5, "tripods": [1], "rune": {"tier": "legendary", "name": "Vision"}},
  {"id": "turningslash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "legendary", "name": "Poison"}},
  {"id": "maelstrom", "level": 13, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Focus"}},
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

- Use Legendary Purify on Head Hunt if needed.
- Use Legendary Bleed on Maelstrom if you don't experience mana issues.
    - Bleed is about 0.75% DPS in exchange for playing skillfully or using mana food.
- Use Legendary Vision on Surprise Attack if you don't use RC or MI engravings.
    - Increases chance of getting an extra stack on Surprise Attack precast.
    - Give Head Hunt the next best Galewind or Vision rune that's available.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Optional<span class="setup-note-arrow"></span></summary>

- You can bring Head Hunt down to Lv 1 for lower mana use.
- Earth Cleaver can be used instead of Head Hunt if you prefer.
- You can replace Dark Axel for Spincutter if you find it more useful.
- You can use Wide Attack tripod on Surprise Attack if your uptime with Turning Slash is good.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>🐆 vs 🐯<span class="setup-note-arrow"></span></summary>

![222 vs 333](../assets/leopardvstiger.png){ .setup-note-image .zoomable-image loading=lazy }

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
  { "col": "dmg", "label": "Damage", "items": [
    "surge",
    "bladedance",
    "turningslash",
    "windcut",
    { "id": "surpriseattack", "alts": [
      { "id": "darkaxel", "note": "Use Dark Axel CD instead if you prefer, or even another character's Lv 10 gem... it doesn't matter." }
    ] }
  ] },
  { "col": "cd", "label": "Cooldown", "items": [
    "upperslash",
    "surpriseattack",
    "maelstrom",
    "bladedance",
    "windcut",
    "turningslash"
  ] }
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Note</span>Gem Requirements<span class="setup-note-arrow"></span></summary>

- To reach its ceiling, this build requires higher level cooldown gems than the others.
    - Mass Increase and/or Optimized Training 1 help smooth things out at low investment levels.
    - +CD% bracelet increases gem level requirements by 1, low Specialization is not recommended.
    - Once Blade Dance and Maelstrom CD are at Lv 9, Wind Cut CD priority increases significantly.

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

'Destiny: Sharp Senses' can be stacked up to 5 times by using (Normal) skills to empower Deathly Slash.

Use Dark Axel to guarantee back attacks on Deathly Slash and Surge if needed.

Use the Opener cycle and either loop it forever (easy) or continue on to the advanced cycles (ceiling).

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

<div class="setup-panel" data-accent="lavender" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Leopard Mode (Optional)<span class="setup-note-arrow"></span></summary>

Alternate between these two cycles as needed for ceiling DPS:

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
      - Recover stacks with Wind Cut or Surprise Attack, decide your next cycle based on which one is available.
3. You can skip a Surprise Attack finisher whenever you're at 49+ stacks before Deathly Slash.
      - Same for 40+ stacks before Blade Dance, 30+ stacks before Upper Slash, etc.
      - If you have 7+ stacks at the moment you activate Death Arts, you can skip it.
      - Be mindful of missed Maelstrom/Wind Cut hits from boss patterns and movement.

It helps to think of everything within <span class="skill-chip">![](../assets/shared/icon-deathtrance.png)Death Trance</span> and <span class="skill-chip">![](../assets/shared/icon-deathlyslash.png)Deathly Slash</span> as 53 stacks, and the Wind Cut Precast or Surprise Attack finisher as flexible options that give you the 7+ stacks needed to complete a 60+ stack Surge.
</details>

</div>
</div>

1. Depending on attack speed/latency, your Wind Cut precast may grant 7 stacks instead of 8.
2. With lower Attack Speed (Mass Increase), Deathly Slash may grant 12 stacks instead of 11.
3. It's better to cast a ~59 stack Surge if the alternative is waiting more than 1.5 seconds.
4. Delaying Deathly Slash + Surge by more than 1.75 seconds to ensure a back attack is a DPS loss.
5. Delaying *only* Surge by more than 1 second to ensure a back attack is also a DPS loss.

*From zero orbs:*
{ .lead }

1. Use a ![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant (recommended) or proceed to #2.
2. Generate one orb, build at least 40 stacks, then Surge to refill all 3 orbs.

## DPS Spread

<!-- data-labels / data-values / data-ids are three parallel comma-separated
     lists, ordered highest % first - update after a fresh Trixion recording
     or a balance pass. Full schema is in javascripts/dps-chart.js's
     "EASY EDIT GUIDE" comment. -->

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-show-icons data-labels="Surge,Deathly Slash,Blade Dance,Turning Slash,Wind Cut,Surprise Attack" data-values="50.07,32.13,6.97,3.25,3.15,0.79" data-ids="surge,deathlyslash,bladedance,turningslash,windcut,surpriseattack"></div>
</div>
</div>