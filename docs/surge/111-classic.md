# 111 (Classic) 🦁

<p class="page-banner page-banner-warning">Not available in NA/EU servers yet, rotations subject to change</p>

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-08-07" markdown>

<!-- Difficulty/Trixion/Playstyle stats above, AND the pentagon badge below,
     both read from javascripts/build-data.js (window.DB_BUILD_DATA) - there is
     nothing to hand-edit in either div itself. Find this build by its
     data-build id there and edit pentagon/difficulty/trixion/bestFor/etc.;
     the stat row, the pentagon badge, and the essentials.md comparison table
     all update together from that one place. -->
<div class="build-stats" data-build="111-classic" data-family="surge"></div>

**Best For:**{: .best-for } Players who enjoy building up to one massive, satisfying Surge hit.

**Tradeoff:**{: .tradeoff } All your eggs are in one basket (Surge).

- Satisfying burst windows with the Breaking Moon → Surge combo.
- No need to hold Counter, it charges up to two stacks.
- Very high gem efficiency, Surge is nearly all of your DPS.
- Accessible from zero Ark Grid cores with minor adjustments.
- Must constantly balance Surge back attack rate with Surge CPM.

</div>
<div class="pentagon-badge" data-build="111-classic" data-family="surge" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[Video Guide](https://www.youtube.com/watch?v=pzFa5zOuNik){ .video-chip } [Gameplay](https://www.youtube.com/watch?v=j-2dGp7PGws){ .video-chip }
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

=== "111 Classic ★"

    ```
    C3F04234FA32C1729EEDFABA2234BC6B08F047143CF6F3611F2A0C9CC2A608B1E56A5A154C449B6B9BD35AFC0B3E9E3F269BE4AF161CF8CC14B26539511518B5
    ```

=== "Pre-Ark Grid"

    *Adds Earth Cleaver CD and uses Blade Dance's Quick Prep tripod to accommodate a lack of Ark Grid.<br>If you're a beginner, swap Raid Captain for Cursed Doll until you're more experienced.*

    ```
    6E22435EC38A3B36B27F6EE93801A0ADC45A582A1D8C1F6C3B8D7052A57696552DA526A2AAE1EB722ED1F929BE107E3749DAB4E7C0737BCC237D520B3D040A34
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
        { "id": "pathoftheblade", "level": 3, "max": 3 }
      ] }
    ] }
  ]
</script>
</div>

<div class="ark-cores" data-family="surge" markdown>
<script type="application/json">
[
  { "core": "sun", "label": "Deathblade Surge", "points": 0 },
  { "core": "moon", "label": "Surge Core", "points": 0 },
  { "core": "star", "label": "Strike", "points": 0 }
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Ark Passive<span class="setup-note-arrow"></span></summary>

- Use the [Ark Passive Calculator](../resources.md#ark-passive-calculator) to optimize Evolution nodes.
- In some cases (low Specialization, +CD% bracelet) Release Potential 4 + Instant Spell 2 may be preferred.
    - This setting increases mana costs, may require the use of mana food instead of wine.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Ark Grid<span class="setup-note-arrow"></span></summary>

- You can level Ark Grid cores to your preference, but 17p Moon grants a second Earth Cleaver stack. This lets you slot a cooldown gem into Blade Dance and use its Weak Point Detection tripod.

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
  {"id": "windcut", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "spincutter", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "bladedance", "level": 14, "tripods": [1, 2, 2], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "earthcleaver", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Vision"}},
  {"id": "turningslash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "legendary", "name": "Poison"}},
  {"id": "maelstrom", "level": 10, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Focus"}},
  {"id": "blitzrush", "level": 14, "tripods": [1, 1, 2], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "deathtrance", "subtitle": "Identity"},
  {"id": "breakingmoon", "subtitle": "Technique"},
  {"id": "bladeassault", "subtitle": "Awakening"},
  {"id": "surge", "subtitle": "Identity"}
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Runes<span class="setup-note-arrow"></span></summary>

- Use Legendary Purify on Spincutter if needed.
- Use Legendary Bleed on Maelstrom if you use mana food instead of wine.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Optional<span class="setup-note-arrow"></span></summary>

- You can keep the Quick Prep tripod on Blade Dance at lower gem levels.
- Earth Explosion tripod on Earth Cleaver is up to personal preference.
    - Increased cast speed, but greatly lowers mobility and damage.
- Thick Sword Energy tripod increases Wind Cut range but builds less stacks.
- Dark Axel (1-1-2 tripods) can be used instead of Spincutter if you prefer it.

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
    "surge", "earthcleaver", "bladedance", "blitzrush", "turningslash"
  ] },
  { "col": "cd", "label": "Cooldown", "items": [
    "windcut",
    "blitzrush",
    { "id": "bladedance", "alts": [
      { "id": "earthcleaver", "note": "Use Earth Cleaver instead of Blade Dance pre-Ark Grid; set Quick Prep tripod on Blade Dance to compensate." }
    ] },
    "maelstrom",
    "surpriseattack",
    "turningslash"
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

Breaking Moon grants 60 stacks on hit and empowers your next Surge with +60% Critical Damage.

Spincutter is your mobility skill and backup stack builder. Use it to guarantee a back attack on Surge.

Use the Breaking Moon cycle whenever it's available, then repeat the main cycle whenever it's not.

*From 3 orbs:*
{ .lead }
<div class="cycle-card" markdown>
<div class="cycle-card-header"><span class="cycle-num cycle-num-1">1</span><span class="cycle-title">Breaking Moon Cycle</span></div>
<div class="rotation-line" markdown>
<script type="application/json">
[{ "icons": ["turningslash", "surpriseattack"], "situational": "synergy/adrenaline" }, "windcut", "deathtrance", "maelstrom", "surpriseattack", "breakingmoon", "surge"]
</script>
</div>
</div>

1. If you already have a Maelstrom buff of 3 seconds or more, consider skipping it to conserve a stack.

<div class="cycle-card" markdown>
<div class="cycle-card-header"><span class="cycle-num cycle-num-2">2</span><span class="cycle-title">Main Repeating Cycle</span></div>
<div class="rotation-line" markdown>
<script type="application/json">
["windcut", "deathtrance", "maelstrom", "surpriseattack", "windcut", "earthcleaver", "turningslash", "bladedance", "blitzrush", "surpriseattack", "surge"]
</script>
</div>
</div>

1. The final Surprise Attack can often be skipped with surplus stacks and expected raid downtime.
2. Consider delaying Maelstrom by 1 to 3 skills when uptime drops to ensure it covers Surge (Raid Captain).

<div class="setup-panel" data-accent="lavender" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Alt</span>Lion Mode (Optional)<span class="setup-note-arrow"></span></summary>

Alternate main cycle meant to try-hard Raid Captain and Mass Increase efficiency in raids:

<div class="cycle-card" markdown>
<div class="cycle-card-header"><span class="cycle-num cycle-num-2">2</span><span class="cycle-title">Main Repeating Cycle</span></div>
<div class="rotation-line" markdown>
<script type="application/json">
[{ "id": "maelstrom", "situational": true }, "windcut", "deathtrance", "surpriseattack", "windcut", "earthcleaver", "turningslash", { "id": "maelstrom", "situational": true }, "bladedance", "blitzrush", "surpriseattack", "surge"]
</script>
</div>
</div>

1. Just recast Maelstrom as it expires, but some optimal cast spots are suggested.
2. Use your judgment. Not every skill needs the Maelstrom buff, so prioritize Surge.
3. Consider skipping Maelstrom to conserve a stack if you received a Rage buff.
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
<div class="dps-chart" data-show-icons data-labels="Surge,Breaking Moon,Earth Cleaver,Blade Dance,Blitz Rush,Turning Slash" data-values="74.41,6.51,4.22,4.1,2.73,2.55" data-ids="surge,breakingmoon,earthcleaver,bladedance,blitzrush,turningslash"></div>
</div>
</div>