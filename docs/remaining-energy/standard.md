# Standard 🌱

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-08-09" markdown>

<!-- Difficulty/Trixion/Playstyle stats above, AND the pentagon badge below,
     both read from javascripts/build-data.js (window.DB_BUILD_DATA) - there is
     nothing to hand-edit in either div itself. Find this build by its
     data-build id there and edit pentagon/difficulty/trixion/bestFor/etc.;
     the stat row, the pentagon badge, and the essentials.md comparison table
     all update together from that one place. -->
<div class="build-stats" data-build="standard" data-family="re"></div>

**Best For:**{: .best-for } Brand-new Remaining Energy players with no Ark Grid yet.

**Tradeoff:**{: .tradeoff } Legacy build with some downtime and little to no recovery.

- Last bastion of the classic Remaining Energy gameplay, now powercrept.
- Counter is used in rotation often, you must hold it when necessary.
- Simple to learn and execute, with better mobility than modern builds.

</div>
<div class="pentagon-badge" data-build="standard" data-family="re" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[Video Guide](https://www.youtube.com/watch?v=pZDYek5l1og&t=467s){ .video-chip } [Gameplay](https://www.youtube.com/watch?v=xmxCjwImyrg){ .video-chip }
</div>
</div>
</div>

<div class="setup-panel" data-accent="lavender" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Note</span>About This Build<span class="setup-note-arrow"></span></summary>

Since this is a beginner legacy build, this guide strays slightly from the norm to offer a smoother experience without deep min-maxing. For instance, you won't need mana food or stimulants to enjoy the gameplay.

</details>

</div>
</div>

*New to Deathblade entirely? [Surge](../surge/essentials.md) is generally more beginner-friendly and outperforms RE Standard.*

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

=== "Standard"

    ```
    5F7D5490D9E2C0E26CF09BBA7300EE3738585110117637ED10C8C1ED04B5AF1E35B6428D7172B4FB399678D0F83CE64D3232A844396609F8F5466877D357B98D
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

<div class="ark-passives" data-family="re" markdown>
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
        { "id": "swiftstrike", "level": 1, "max": 1 }
      ] },
      { "label": "Tier 2", "nodes": [
        { "id": "remainingenergy", "level": 3, "max": 3 }
      ] },
      { "label": "Tier 3", "nodes": [
        { "id": "firmwill", "level": 3, "max": 3 }
      ] },
      { "label": "Tier 4", "nodes": [
        { "id": "extremebodymovement", "level": 3, "max": 3 },
        { "id": "orbcirculation", "level": 2, "max": 5 }
      ] }
    ] },
    { "id": "leap", "label": "Leap", "points": 70, "tiers": [
      { "label": "Tier 1", "nodes": [
        { "id": "transcendentpower", "level": 3, "max": 5 },
        { "id": "awakeningamplifier", "level": 1, "max": 3 },
        { "id": "unleashedpower", "level": 5, "max": 5 },
        { "id": "instantspell", "level": 3, "max": 3 }
      ] },
      { "label": "Tier 2", "nodes": [
        { "id": "danceofnightmares", "level": 3, "max": 3 }
      ] }
    ] }
  ]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Ark Passive<span class="setup-note-arrow"></span></summary>

- Use the [Ark Passive Calculator](../resources.md#ark-passive-calculator) to optimize Evolution nodes.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Ark Grid<span class="setup-note-arrow"></span></summary>

- Standard is playable without Ark Grid by design, but you can use the 111 core setup if you already have it.
    - Save your Ark Grid cores for when you're ready to transition to a modern Deathblade build.

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
  {"id": "spincutter", "level": 4, "tripods": [3], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "soulabsorber", "level": 14, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "deathsentence", "level": 14, "tripods": [2, 2, 1], "rune": {"tier": "legendary", "name": "Focus"}},
  {"id": "twinshadows", "level": 14, "tripods": [2, 1, 2], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "earthcleaver", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Vision"}},
  {"id": "turningslash", "level": 13, "tripods": [1, 3, 1], "rune": {"tier": "epic", "name": "Focus"}},
  {"id": "maelstrom", "level": 10, "tripods": [2, 1, 2], "rune": {"tier": "legendary", "name": "Focus"}},
  {"id": "voidstrike", "level": 14, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Wealth"}},
  {"id": "surge", "subtitle": "Identity"},
  {"id": "deathlyslash", "subtitle": "Technique"},
  {"id": "bladeassault", "subtitle": "Awakening"}
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Runes<span class="setup-note-arrow"></span></summary>

- Use Epic Wealth on Soul Absorber for extra orb generation until you're more familiar with the class.

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
    "surge", "soulabsorber", "deathsentence", "voidstrike",
    "earthcleaver", "twinshadows", "turningslash"
  ] },
  { "col": "cd", "label": "Cooldown", "items": [
    "soulabsorber", "deathsentence", "maelstrom", "voidstrike"
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

Cast Spincutter to approach the boss, use the opener and continue to loop the main cycle afterwards.

The opener stacks Adrenaline and applies synergies efficiently as you build up to the encounter's first Surge.

*Opener from zero orbs:*
{ .lead }

<div class="rotation-line" markdown>
<script type="application/json">
["maelstrom", "twinshadows", "turningslash", "soulabsorber", "voidstrike", "deathlyslash", "surge"]
</script>
</div>

*Main repeating cycle:*
{ .lead }

<div class="rotation-line" markdown>
<script type="application/json">
["twinshadows", "deathsentence", "maelstrom",
 { "id": "deathlyslash", "situational": "every other rotation" },
 "turningslash", "earthcleaver", "soulabsorber", "voidstrike", "surge"]
</script>
</div>

- <span class="skill-chip">![](../assets/shared/icon-deathlyslash.png)Deathly Slash</span> is only available every other rotation, just keep going if it's on cooldown.
- Use <span class="skill-chip">![](../assets/shared/icon-spincutter.png)Spincutter</span> during downtime to reposition, or hold it to dodge upcoming attacks.
- Use <span class="skill-chip">![](../assets/shared/icon-bladeassault.png)Blade Assault</span> for damage, or hold it for Hyper Awakening or a clutch recovery.
- The rotation is bottle-necked entirely by Soul Absorber's cooldown, it is what it is.
    - You can skip Earth Cleaver if Soul Absorber's off cooldown already.

*Recovery:*
{ .lead }

- Use spare Twin Shadows or Maelstrom stacks to recover if it'll help you reach 3 orbs.
    - If not, just AFK or Surge with 2 orbs and AFK. Welcome to Standard Remaining Energy.

## DPS Spread

<!-- data-labels / data-values / data-ids are three parallel comma-separated
     lists, ordered highest % first - update after a fresh Trixion recording
     or a balance pass. Full schema is in javascripts/dps-chart.js's
     "EASY EDIT GUIDE" comment. -->

<p class="dps-showcase-caption">Full Lv 10 gems</p>

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-show-icons data-labels="Deathly Slash,Surge,Soul Absorber,Death Sentence,Void Strike,Earth Cleaver,Twin Shadows,Turning Slash,Bleed,Maelstrom" data-values="19.1,18.1,14.3,11.1,11.1,10,8.1,6.5,0.8,0.5" data-ids="deathlyslash,surge,soulabsorber,deathsentence,voidstrike,earthcleaver,twinshadows,turningslash,bleed,maelstrom"></div>
</div>
</div>