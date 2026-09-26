# 333 (Ceiling) ✨

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-09-15" markdown>

<!-- Difficulty/Trixion/Playstyle stats above, AND the pentagon badge below,
     both read from javascripts/build-data.js (window.DB_BUILD_DATA) - there is
     nothing to hand-edit in either div itself. Find this build by its
     data-build id there and edit pentagon/difficulty/trixion/bestFor/etc.;
     the stat row, the pentagon badge, and the essentials.md comparison table
     all update together from that one place. -->
<div class="build-stats" data-build="333-ceiling" data-family="re"></div>

**Best For:**{: .best-for } Players who want the highest damage RE build.

**Tradeoff:**{: .tradeoff } Slightly lower orb generation and a less forgiving rotation.

- Uses Fatal Wave as two fast casts (<span class="skill-mention" data-glossary-id="ftfcombo">FTF</span> combo) via a skill reset.
- Head Hunt is always free for counters, recovery, purify, or <span class="skill-mention" data-skill-id="adrenaline">Adrenaline</span> upkeep.
- High gem efficiency: Fatal Wave and Deathly Slash are most of your DPS.
- Susceptible to high ping or low FPS, but you can compensate with a few changes.

</div>
<div class="pentagon-badge" data-build="333-ceiling" data-family="re" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[Video Guide](https://youtu.be/Wwm7apTwg84?si=dmO_fvNxoXuoQuf5){ .video-chip } [Gameplay](https://www.youtube.com/watch?v=MP--TuRX3xI){ .video-chip }
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

=== "333 Ceiling ★"

    ```
    900CC6DEE164317B007DB080728058559F253356D493D9068FC9464270019E2DA0657696B30F009427D2603F2E13AB070E8A77607E775659BE0F35EF964A9929
    ```

=== "Orb Circulation 5 (easier)"

    ```
    76A1B31F95DC1F7B50FB830D485E547AE6140D5427029F9729DD63D83C3AAE2A3EEF991E2263BA7AC3B9D67056DB26958AC8DB67D4D0E20EB22F0A70C1E86A35
    ```

    - Uses <span class="skill-mention" data-ap-id="orbcirculation" data-level="5">Orb Circulation 5</span>, which makes this build more forgiving at a ~3% DPS loss.
    - Additionally, it uses <span class="skill-mention" data-rune-name="Wealth" data-rune-tier="legendary">Legendary Wealth</span> on Soul Absorber, which would not be possible otherwise.

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

<div class="ark-passives" data-family="re" markdown>
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
      { "id": "swiftstrike", "level": 1 },
      { "id": "remainingenergy", "level": 3 },
      { "id": "firmwill", "level": 3 },
      { "id": "extremebodymovement", "level": 3 },
      { "id": "orbcirculation", "level": 2 }
    ] },
    { "id": "leap", "nodes": [
      { "id": "unleashedpower", "level": 5 },
      { "id": "releasepotential", "level": 4 },
      { "id": "instantspell", "level": 2 },
      { "id": "danceofnightmares", "level": 3 }
    ] }
  ]
</script>
</div>

<div class="ark-cores" data-family="re" markdown>
<script type="application/json">
[
  { "core": "sun", "label": "Levin Slash", "points": 3 },
  { "core": "moon", "label": "Deathblade Wave", "points": 3 },
  { "core": "star", "label": "Death Sword Energy", "points": 2 }
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Ark Passive<span class="setup-note-arrow"></span></summary>

- Use the [Ark Passive Calculator](../resources.md#ark-passive-calculator) to optimize Evolution nodes.
- <span class="skill-mention" data-ap-id="releasepotential" data-level="3">Release Potential 3</span> / <span class="skill-mention" data-ap-id="instantspell" data-level="3">Instant Spell 3</span> / <span class="skill-mention" data-ap-id="awakeningamplifier" data-level="1">Awakening Amplifier 1</span> can solve mana issues at a very minor DPS loss.
    - Not as comfortable with +CD% <span class="skill-mention" data-glossary-id="bracelet">bracelet</span> line and/or low <span class="skill-mention" data-glossary-id="specializationstat">Specialization</span>.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span><span class="skill-mention" data-glossary-id="arkgrid">Ark Grid</span><span class="setup-note-arrow"></span></summary>

- Finish up Death Sword Energy to 17p when you can, Fatal Wave is your highest damage skill.

</details>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Alt</span><span class="skill-mention" data-ap-id="orbcirculation" data-level="5">Orb Circulation 5</span><span class="setup-note-arrow"></span></summary>

- Makes this build more forgiving at a ~3% DPS loss by increasing passive orb generation.

<div class="skill-setup" data-family="re" markdown>
<script type="application/json">
[
  {"id": "soulabsorber", "level": 14, "rune": {"tier": "legendary", "name": "Wealth"}}
]
</script>
</div>

<div class="ark-passives ark-passives-compact" data-family="re" markdown>
<script type="application/json">
[
  { "id": "enlightenment", "nodes": [
    { "id": "swiftstrike", "level": 1 },
    { "id": "remainingenergy", "level": 3 },
    { "id": "firmwill", "level": 3 },
    { "id": "swordcraftenhancement", "level": 1 },
    { "id": "extremebodymovement", "level": 2 },
    { "id": "orbcirculation", "level": 5 }
  ] }
]
</script>
</div>

</details>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Alt</span>NA/EU 333 Standard<span class="setup-note-arrow"></span></summary>

- Alternative that aims to keep a similar playstyle to Standard RE, with Spincutter and excess meter.
    - It's an improvement over Standard RE, but playstyle is incompatible with modern RE and falls short in DPS.
    - Recommended if you cannot perform well with any other build or prefer the familiar legacy gameplay.
    - Its guide and all relevant information are maintained [here](https://docs.google.com/document/d/1vs1YC_7adaYwtfN9cHO3x2KuMPq6GcKRlGo5vnsN4Lk/edit) and neither hosted nor supported on this site.

</details>

</div>

</div>

## Skill Setup

<!-- Full skill-setup schema (id/level/tripods/rune/subtitle/picks) is in
     javascripts/skill-setup.js's "EASY EDIT GUIDE" comment. Names, icons, and
     tags resolve automatically by id from skill-data.js - only add "name" to
     override the display text for a genuine one-off case. -->

<div class="setup-panel" data-accent="lavender" markdown>

<div class="skill-setup" data-family="re" markdown>
<script type="application/json">
[
  {"id": "soulabsorber", "level": 14, "tripods": [3, 1, 2], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "twinshadows", "level": 14, "tripods": [2, 1, 2], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "headhunt", "level": 7, "tripods": [2, 2], "rune": {"tier": "uncommon", "name": "Wealth"}},
  {"id": "turningslash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "rare", "name": "Wealth"}},
  {"id": "maelstrom", "level": 10, "tripods": [2, 1, 2], "rune": {"tier": "rare", "name": "Wealth"}},
  {"id": "fatalwave", "level": 14, "tripods": [2, 3, 2], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "blitzrush", "level": 12, "tripods": [1, 1, 1], "rune": {"tier": "rare", "name": "Wealth"}},
  {"id": "voidstrike", "level": 13, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Wealth"}},
  {"id": "surge", "subtitle": "Identity"},
  {"id": "deathlyslash", "subtitle": "Technique"},
  {"id": "bladeassault", "subtitle": "Awakening"}
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Runes<span class="setup-note-arrow"></span></summary>

- Use <span class="skill-mention" data-rune-name="Galewind" data-rune-tier="legendary">Legendary Galewind</span>, <span class="skill-mention" data-rune-name="Focus" data-rune-tier="legendary">Focus</span> or <span class="skill-mention" data-rune-name="Purify">Purify</span> on Head Hunt if you prefer.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Note</span>Options & Tripods<span class="setup-note-arrow"></span></summary>

- Orb Control tripod on Fatal Wave is **not viable** and you shouldn't use it.
- You can use Quick Prep <span class="skill-mention" data-glossary-id="tripod">tripod</span> on Head Hunt if you have no mana issues.
- You can bring Head Hunt down to Lv 1 for lower mana use and added mobility.
    - However, Lv 7 is more practical and makes recovery much easier and faster.

</details>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Alt</span>Fatal Wealth<span class="setup-note-arrow"></span></summary>

- <span class="skill-mention" data-rune-name="Wealth" data-rune-tier="epic">Epic Wealth</span> rune on Fatal Wave can make this build more forgiving at a ~4% DPS loss.
- It won't cycle as smoothly, but the reduced stress and urgency may suit some people.
- Honestly, don't play this; 333 with <span class="skill-mention" data-ap-id="orbcirculation" data-level="5">OC 5</span>, 313, or literally any Surge build will perform better.

<div class="skill-setup" data-family="re" markdown>
<script type="application/json">
[
  {"id": "fatalwave", "level": 14, "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "voidstrike", "level": 11, "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "soulabsorber", "level": 14, "rune": {"tier": "legendary", "name": "Wealth"}},
  {"id": "twinshadows", "level": 14, "rune": {"tier": "rare", "name": "Wealth"}},
  {"id": "maelstrom", "level": 10, "rune": {"tier": "uncommon", "name": "Wealth"}}
]
</script>
</div>

<div class="ark-passives ark-passives-compact" data-family="re" markdown>
<script type="application/json">
[
  { "id": "leap", "nodes": [
    { "id": "awakeningamplifier", "level": 1 },
    { "id": "unleashedpower", "level": 5 },
    { "id": "releasepotential", "level": 3 },
    { "id": "instantspell", "level": 3 },
    { "id": "danceofnightmares", "level": 3 }
  ] }
]
</script>
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
    "fatalwave", "surge", "twinshadows", "soulabsorber",
    "turningslash", "voidstrike", "blitzrush"
  ] },
  { "col": "cd", "items": [
    "maelstrom", "blitzrush", "turningslash", "fatalwave"
  ] }
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Gem Sharing<span class="setup-note-arrow"></span></summary>

- You can share this gem setup with [313 (High Floor)](313-high-floor.md) and 113 (Arts) alts if needed.

</details>

</div>

</div>

## Rotation

<!-- Each `.rotation-line` is a compact JSON step list of skill ids in
     order - names/icons resolve automatically, same id vocabulary as Skill
     Setup and Gems above. Full schema (situational steps, swapNext,
     cycleRef, trailing suffix, etc.) is in javascripts/rotation-line.js's
     "EASY EDIT GUIDE" comment. -->

=== "Cycles"

    Use an **Opener**, then alternate between these two cycles as needed:

    <div class="cycle-card">

    <div class="cycle-card-header"><span class="cycle-num cycle-num-1">1</span><span class="cycle-title">Void Strike + Deathly Slash Cycle</span></div>

    <div class="rotation-line">

    <script type="application/json">
    ["maelstrom", "voidstrike", "twinshadows", "deathlyslash", "fatalwave", "turningslash", "fatalwave", "surge"]
    </script>

    </div>

    </div>

    <div class="cycle-card">

    <div class="cycle-card-header"><span class="cycle-num cycle-num-2">2</span><span class="cycle-title">Soul Absorber + Blitz Rush Cycle</span></div>

    <div class="rotation-line">

    <script type="application/json">
    ["soulabsorber", "blitzrush", "twinshadows",
     { "id": "maelstrom", "situational": "recovery" },
     "fatalwave", "turningslash", "fatalwave", "surge"]
    </script>

    </div>

    </div>

    Aim to fit up to Cycle **2**'s Twin Shadows under Cycle **1**'s Maelstrom to reach 3 orbs without recasting or using recovery options. If you only landed up to Soul Absorber, an extra Head Hunt cast is usually enough.

    The Maelstrom in Cycle **2** is only cast if you'd otherwise miss 3 orbs. Use your judgment. If cast, it lasts at least until Cycle **1**'s Void Strike; recasting it as it expires aligns cooldowns. If it wasn't needed or it didn't last, nothing changes.

=== "Openers"

    Openers stack <span class="skill-mention" data-skill-id="adrenaline">Adrenaline</span> and apply <span class="skill-mention" data-glossary-id="synergy">synergies</span> efficiently. If it feels overwhelming, just apply synergy and Surge at full orbs; that's all you need to start the alternating cycles.

    *From 3 orbs (<span class="food-req-item">![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant</span>):*
    { .lead }

    <div class="rotation-line">

    <script type="application/json">
    [{ "id": "headhunt", "swapNext": true }, "twinshadows", "maelstrom", "turningslash", "deathlyslash", "fatalwave", "surge",
     { "cycleRef": 2, "title": "Soul Absorber + Blitz Rush Cycle" },
     { "cycleRef": 1, "title": "Void Strike + Deathly Slash Cycle" },
     { "suffix": "etc." }]
    </script>

    </div>

    1. If available, <span class="skill-inline" data-skill-id="bladeassault"><span class="skill-inline-name">Blade Assault</span></span> + <span class="skill-inline"><span class="skill-inline-name">FTF</span></span> is interchangeable with Cycle **2**.
    2. It's efficient to use <span class="food-req-item">![](../assets/shared/icon-atropine.png){: .skill-icon } Atropine</span> after Deathly Slash, with Blade Assault available.

    *From zero/partial orbs:*
    { .lead }

    1. Cycle **1** if Deathly Slash is available, otherwise start from Maelstrom + Cycle **2**.
    2. Prioritize the FTF combo earlier for better party synergy uptime.

=== "Recovery"

    <div class="setup-panel" data-accent="lavender">

    <div class="setup-notes">

    <details class="setup-note" data-kind="tip" open>

    <summary><span class="setup-note-tag">Tip</span>Recovery Video<span class="setup-note-arrow"></span></summary>

    Watch this 2-minute [333 recovery video](https://www.youtube.com/watch?v=4478vFVX4VA) and read the segment titles.

    </details>

    </div>

    </div>

    1. Use <span class="skill-inline" data-skill-id="headhunt"><span class="skill-inline-name">Head Hunt</span></span> when a little short on orbs, just cast if unsure.
    2. Use spare Twin Shadows/Maelstrom stacks and/or Blitz Rush if you miss major skills.
    3. Use <span class="skill-inline" data-skill-id="headhunt"><span class="skill-inline-name">Head Hunt</span></span> instead of <span class="skill-inline" data-skill-id="twinshadows"><span class="skill-inline-name">Twin Shadows</span></span> for a cycle to recover stacks if they run out.
    4. Use Maelstrom + FTF combo earlier if waiting on main orb generation skills.
    5. Hold Deathly Slash until the next Cycle **1** if it's out of sync. DPS loss, but easier.

=== "TL;DR:"

    ![333 TL;DR flowchart](../assets/tldr-333.png){ .zoomable-image loading=lazy }

## DPS Spread

<!-- data-labels / data-values / data-ids are three parallel comma-separated
     lists, ordered highest % first - update after a fresh Trixion recording
     or a balance pass. Full schema is in javascripts/dps-chart.js's
     "EASY EDIT GUIDE" comment. -->

<p class="dps-showcase-caption">Ancient cores, full Lv 10 gems in Trixion</p>

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-show-icons data-values="34.3,17.2,16.6,7.7,7,6.5,5,4" data-ids="fatalwave,deathlyslash,surge,twinshadows,soulabsorber,turningslash,voidstrike,blitzrush"></div>
</div>
</div>