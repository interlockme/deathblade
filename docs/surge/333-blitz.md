# 333 (Blitz) <span class="tiger-emoji" title="rawr">🐯</span>

<p class="page-banner page-banner-warning">This build is not viable and no one plays it, so information here WILL be wrong. Do not disrespect the tiger, however.</p>

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-09-16" markdown>

<!-- Difficulty/Trixion/Playstyle stats above, AND the pentagon badge below,
     both read from javascripts/build-data.js (window.DB_BUILD_DATA) - there is
     nothing to hand-edit in either div itself. Find this build by its
     data-build id there and edit pentagon/difficulty/trixion/bestFor/etc.;
     the stat row, the pentagon badge, and the essentials.md comparison table
     all update together from that one place. -->
<div class="build-stats" data-build="333-blitz" data-family="surge"></div>

**Best For:**{: .best-for } Please do not play this.

**Tradeoff:**{: .tradeoff } The juice is not worth the squeeze.

- Uses Blitz Rush as two fast casts (<span class="skill-mention" data-glossary-id="btbcombo">BTB</span> combo) via a skill reset.
- High gem efficiency: Surge and Blitz Rush are most of your DPS.
- Must balance Surge, Blitz Rush, and Deathly Slash <span class="skill-mention" data-glossary-id="backattack">back attack</span> rate with Surge <span class="skill-mention" data-glossary-id="cpm">CPM</span>.

</div>
<div class="pentagon-badge" data-build="333-blitz" data-family="surge" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[Video Guide](https://www.youtube.com/watch?v=pzFa5zOuNik){ .video-chip } [Gameplay](../assets/tiger.mp4){ .video-chip }
</div>
</div>
</div>

<div class="setup-panel" data-accent="lavender" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>But why male models? 🐯<span class="setup-note-arrow"></span></summary>

![333 Blitz meme](../assets/blitz-meme.png){ .setup-note-image .zoomable-image loading=lazy }

</details>

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

=== "333 Blitz"

    ```
    C2BFAC917391343DBC2FDFE774F012CA68D052E6BBDF24E99D94CB2304E39E6307031C2D86DDF93D1770D4AFD97E52786C90EECBF9E6A04C76B7DF6B0289ED3F
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
  { "core": "sun", "label": "Deathblade Rush", "points": 2 },
  { "core": "moon", "label": "Death Blitz", "points": 3 },
  { "core": "star", "label": "Frostfire Blade", "points": 0 }
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Ark Passive<span class="setup-note-arrow"></span></summary>

- Use the [Ark Passive Calculator](../resources.md#ark-passive-calculator) to optimize Evolution nodes.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span><span class="skill-mention" data-glossary-id="arkgrid">Ark Grid</span><span class="setup-note-arrow"></span></summary>

- Damage will be lacking if you settle for the minimum core requirements.

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
  {"id": "surpriseattack", "level": 10, "tripods": [1, 1, 1], "rune": {"tier": "legendary", "name": "Poison"}},
  {"id": "windcut", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "spincutter", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "bladedance", "level": 14, "tripods": [1, 1, 2], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "earthcleaver", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Vision"}},
  {"id": "turningslash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "legendary", "name": "Rage"}},
  {"id": "maelstrom", "level": 10, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Focus"}},
  {"id": "blitzrush", "level": 14, "tripods": [2, 1, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
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

- Use <span class="skill-mention" data-rune-name="Purify">Purify</span> on Spincutter if needed.
- Use <span class="skill-mention" data-rune-name="Bleed" data-rune-tier="legendary">Legendary Bleed</span> on Maelstrom if you use mana food instead of wine.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Note</span>Options & Tripods<span class="setup-note-arrow"></span></summary>

- You can use the Weak Point Detection <span class="skill-mention" data-glossary-id="tripod">tripod</span> on Blade Dance.
    - Requires Lv 10 CD gem and/or raid downtime for it not to become a bottleneck.
    - You must swap Wind Cut CD gem to Blade Dance CD, it's a marginal DPS increase.
- Earth Explosion tripod on Earth Cleaver is up to personal preference.
    - Increased cast speed, but greatly lowers its mobility and damage.

</details>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Alt</span>🐆 vs 🐯<span class="setup-note-arrow"></span></summary>

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
  { "col": "dmg", "items": [
    "surge", "blitzrush", "earthcleaver", "bladedance", "turningslash", { "id": "windcut", "alts": [
      { "id": "spincutter", "note": "Use Spincutter CD gem instead if you prefer, Wind Cut has a very low damage share." },
      { "id": "bladedance", "note": "Use Blade Dance CD gem instead if you set its tripod to Weak Point Detection." }
    ] }
  ] },
  { "col": "cd", "items": [
    "blitzrush", "earthcleaver", "windcut", "maelstrom", "surpriseattack"
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

Spincutter is your main mobility skill and backup stack builder. Use it to guarantee back attacks on your major skills.

Apply damage <span class="skill-mention" data-glossary-id="synergy">synergy</span> if needed, then repeat the rotation cycle as best you can.

*From 3 orbs:*
{ .lead }

<div class="rotation-line" markdown>
<script type="application/json">
["windcut", "deathtrance", "maelstrom", "surpriseattack", "windcut", "earthcleaver", "bladedance", "deathlyslash", "blitzrush", "turningslash", "blitzrush",
{ "id": "surpriseattack", "situational": "stack recovery" },
"surge"]
</script>
</div>

1. The final Surprise Attack can often be skipped with surplus stacks and expected raid downtime.
2. Consider delaying Maelstrom by 1 to 3 skills when uptime drops to ensure it covers Surge (<span class="skill-mention" data-skill-id="raidcaptain">Raid Captain</span>).
3. <span class="skill-mention" data-skill-id="bladeassault">Blade Assault</span> scales much worse on Surge than on Remaining Energy and takes too long to cast.
      - It's still useful for <span class="skill-mention" data-skill-id="atropine">Atropine</span> openers, or it can be saved to greed with <span class="skill-mention" data-glossary-id="pushimmunity">push immunity</span>/Hyper Awakening.

<div class="setup-panel" data-accent="lavender" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Alt</span>🐯 Mode (Optional)<span class="setup-note-arrow"></span></summary>
![tiger mode](../assets/tigermode.png){ .setup-note-image .zoomable-image loading=lazy }
</details>

</div>
</div>

*From zero orbs:*
{ .lead }

1. Use a <span class="food-req-item">![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant</span> (recommended) or proceed to #2.
      - Rat Pack: Use Maelstrom's Orb Control tripod and <span class="skill-mention" data-skill-id="flashblink">Flash Blink</span> awakening.
2. Generate one orb, build at least 40 stacks, then Surge to refill all 3 orbs.

## DPS Spread

<!-- data-labels / data-values / data-ids are three parallel comma-separated
     lists, ordered highest % first - update after a fresh Trixion recording
     or a balance pass. Full schema is in javascripts/dps-chart.js's
     "EASY EDIT GUIDE" comment. -->

<p class="dps-showcase-caption">Ancient cores, full Lv 10 gems in Trixion</p>

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-show-icons data-values="42,29.8,12.9,4,2.6,2.6,2.1" data-ids="surge,blitzrush,deathlyslash,earthcleaver,bladedance,turningslash,windcut"></div>
</div>
</div>