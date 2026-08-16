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
- Counter is used in rotation, you must hold it when necessary.
- Very high gem efficiency, Surge and Deathly Slash are nearly all of your DPS.
- Must constantly balance Surge and Deathly Slash back-attack rate with Surge CPM.

</div>
<div class="pentagon-badge" data-build="222-speedy" data-family="surge" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[Video Guide](https://www.youtube.com/watch?v=pzFa5zOuNik){ .video-chip } [Gameplay](https://www.youtube.com/watch?v=lbBLRwdEvgk){ .video-chip }
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

=== "222 Speedy ★"

    ```
    0F5512B16D6B98BF848E17761E6E268E0C697EFF64D0DFBC464CB1EEA1C0EED282E9768BD1CBD8925E7EF1A397F319F846CCAF9C823948DD188BCC67E0E6D0BE
    ```

=== "Upper Slash"

    *Alternative skill setup that may be more comfortable for some.*

    ```
    DCDFB3E872FB4DD3E910EFA0CAE35A3D30CDFB850D8280939B84BD32CBC8AA21D5F83501E60BDC9F1689AD68BA7FF12C867FFD1A6ED480726DE7CA09B38FEEA9
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
        { "id": "orbcontrol", "level": 1, "max": 5 },
        { "id": "limitbreakenl", "level": 3, "max": 3 }
      ] },
      { "label": "Tier 4", "nodes": [
        { "id": "chaosinfusion", "level": 1, "max": 5 },
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
- This build is capable of using Raid Captain + Mass Increase with the least drawbacks.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Ark Grid<span class="setup-note-arrow"></span></summary>

- Damage and QoL will be lacking if you settle for the minimum core requirements.

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
  {"id": "surpriseattack", "level": 10, "tripods": [1, 1, 1], "rune": {"tier": "legendary", "name": "Rage"}},
  {"id": "windcut", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "spincutter", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "bladedance", "level": 14, "tripods": [1, 1, 2], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "darkaxel", "level": 10, "tripods": [1, 1, 2], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "earthcleaver", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Vision"}},
  {"id": "turningslash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "legendary", "name": "Poison"}},
  {"id": "maelstrom", "level": 10, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Focus"}},
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

- Use Legendary Purify on Spincutter if needed.
- Use Legendary Bleed on Surprise Attack if you prefer it.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Optional<span class="setup-note-arrow"></span></summary>

- Earth Explosion tripod on Earth Cleaver is up to personal preference.
    - Increased cast speed and extra stack, lowered mobility and damage.
- Thick Sword Energy tripod increases Wind Cut range but builds less stacks.
- Head Hunt can be used instead of Earth Cleaver at a DPS loss if you prefer it.
- You can replace Spincutter or Dark Axel for literally any skill you prefer.

</details>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Alt</span>Upper Slash<span class="setup-note-arrow"></span></summary>

- You can gain more comfort at a DPS loss by replacing Spincutter or Dark Axel for Upper Slash.
- Upper Slash is a push immune skill that generates 5 stacks and allows you to skip Earth Cleaver casts.
- Replace both Earth Cleaver gems for Upper Slash CD and any other gem you prefer.
- Optionally, replace Earth Cleaver entirely for Lv 1 Head Hunt and max Surprise Attack.

<div class="skill-setup" data-family="surge" markdown>
<script type="application/json">
[
  {"id": "upperslash", "level": 14, "tripods": [2, 3, 2], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "earthcleaver", "level": 10, "rune": {"tier": "legendary", "name": "Vision"}}
]
</script>
</div>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>🐆 vs 🐯<span class="setup-note-arrow"></span></summary>

![222 vs 333](../assets/leopardvstiger.png){ .setup-note-image .zoomable-image loading=lazy }

</details>

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
    { "id": "earthcleaver", "alts": [
      { "id": "upperslash", "note": "Optional in the Upper Slash build." }
    ] },
    "turningslash",
    { "id": "windcut", "alts": [
      { "id": "darkaxel", "note": "Swap this to Dark Axel CD if you prefer." }
    ] }
  ] },
  { "col": "cd", "label": "Cooldown", "items": [
    "windcut",
    "surpriseattack",
    "bladedance",
    "turningslash",
    { "id": "earthcleaver", "alts": [
      { "id": "upperslash", "note": "Required in the Upper Slash build." }
    ] },
    "maelstrom"
  ] }
]
</script>
</div>

</div>

## Rotation

<!-- Each `.rotation-line` is a compact JSON step list of skill ids in
     order - names/icons resolve automatically, same id vocabulary as Skill
     Setup and Gems above. Full schema (situational steps, swapNext,
     cycleRef, trailing suffix, etc.) is in javascripts/rotation-line.js's
     "EASY EDIT GUIDE" comment. -->

There's an optimal skill order, but you have flexibility when facing downtime or weaving in mobility skills.

Use Spincutter and Dark Axel to guarantee back attacks on Deathly Slash and Surge.

'Destiny: Sharp Senses' can be stacked up to 5 times by using [Normal] skills to empower Deathly Slash.

Apply damage synergy if needed, then use the main cycle and repeat it relentlessly.

*From 3 orbs:*
{ .lead }

=== "Main Cycle"

    <div class="rotation-line" markdown>
    <script type="application/json">
    ["windcut", "deathtrance", "maelstrom", "surpriseattack", "windcut", "turningslash", "earthcleaver", "bladedance", "deathlyslash", "surpriseattack", "surge"]
    </script>
    </div>

    - Cast <span class="skill-chip">![](../assets/shared/icon-spincutter.png)Spincutter</span> instead of <span class="skill-chip">![](../assets/shared/icon-earthcleaver.png)Earth Cleaver</span> as needed.
    - Cast <span class="skill-chip">![](../assets/shared/icon-bladeassault.png)Blade Assault</span> whenever you want, I'm not your mom.
    - You don't strictly have to precast Wind Cut before Death Trance for this build.
        - If you Surged right after Deathly Slash in the previous cycle, it might be smoother to skip the precast.

=== "Upper Slash"

    *Main cycle for the Upper Slash skill setup.*
    { .lead }

    <div class="rotation-line" markdown>
    <script type="application/json">
    ["windcut", "deathtrance", "maelstrom", "surpriseattack", "windcut", "upperslash", "turningslash", "bladedance", "deathlyslash", "surpriseattack", "surge"]
    </script>
    </div>

    - Cast <span class="skill-chip">![](../assets/shared/icon-bladeassault.png)Blade Assault</span> whenever you want, I'm not your mom.
    - You don't strictly have to precast Wind Cut before Death Trance for this build.
        - If you Surged right after Deathly Slash in the previous cycle, it might be smoother to skip the precast.

    <div class="setup-panel" data-accent="lavender" markdown>
    <div class="setup-notes" markdown>

    <details class="setup-note" data-kind="example" markdown>
    <summary><span class="setup-note-tag">Alt</span>Beast Mode<span class="setup-note-arrow"></span></summary>

    Alternate between these two cycles:

    <div class="cycle-card" markdown>
    <div class="cycle-card-header"><span class="cycle-num cycle-num-1">1</span><span class="cycle-title">Surprise Skip</span></div>
    <div class="rotation-line" markdown>
    <script type="application/json">
    ["windcut", "deathtrance", "surpriseattack","maelstrom", "windcut", "upperslash", "turningslash", "bladedance", "deathlyslash", "surge"]
    </script>
    </div>
    </div>

    <div class="cycle-card" markdown>
    <div class="cycle-card-header"><span class="cycle-num cycle-num-2">2</span><span class="cycle-title">Wind Cut Skip</span></div>
    <div class="rotation-line" markdown>
    <script type="application/json">
    ["surpriseattack", "deathtrance", "windcut","maelstrom", "surpriseattack", "upperslash", "turningslash", "bladedance", "deathlyslash", "surge"]
    </script>
    </div>
    </div>

    </details>

    </div>
    </div>

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
<div class="dps-chart" data-show-icons data-labels="Surge,Deathly Slash,Blade Dance,Earth Cleaver,Turning Slash,Wind Cut" data-values="47.67,30.59,6.64,4.79,3.09,3" data-ids="surge,deathlyslash,bladedance,earthcleaver,turningslash,windcut"></div>
</div>
</div>