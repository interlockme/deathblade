# 111 (Classic) 🦁

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-09-24" markdown>

<!-- Difficulty/Trixion/Playstyle stats above, AND the pentagon badge below,
     both read from javascripts/build-data.js (window.DB_BUILD_DATA) - there is
     nothing to hand-edit in either div itself. Find this build by its
     data-build id there and edit pentagon/difficulty/trixion/bestFor/etc.;
     the stat row, the pentagon badge, and the essentials.md comparison table
     all update together from that one place. -->
<div class="build-stats" data-build="111-classic" data-family="surge"></div>

**Best For:**{: .best-for } Players who enjoy building up to one massive, satisfying hit.

**Tradeoff:**{: .tradeoff } All your eggs are in one basket (Surge) + Maelstrom management.

- Powerful burst windows with the Breaking Moon combo.
- No need to hold <span class="skill-mention" data-glossary-id="counter">Counter</span>, it charges up to two stacks.
- Very high gem efficiency: Surge is nearly all of your DPS.
- Accessible from zero <span class="skill-mention" data-glossary-id="arkgrid">Ark Grid</span> cores with minor adjustments.
- Must constantly balance Surge <span class="skill-mention" data-glossary-id="backattack">back attack</span> rate with Surge <span class="skill-mention" data-glossary-id="cpm">CPM</span>.

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

Make sure you've read [Essentials](essentials.md), then apply both "<span class="skill-mention" data-glossary-id="arkpassive">Ark Passive</span>" and "Skill" to be safe. For [Gems](#gems), follow the guide.

</details>

</div>
</div>

=== "111 Classic ★"

    ```
    2D89F44CB0B24806735E07C73478C083707228B4DA81D81F51074C802D5C5D795500F1C3281A6873549CD74ED4CB4E8BD59BE03D263B86A22C024C157D52B6F2
    ```

=== "Pre-Ark Grid"

    ```
    6E22435EC38A3B36B27F6EE93801A0ADC45A582A1D8C1F6C3B8D7052A57696552DA526A2AAE1EB722ED1F929BE107E3749DAB4E7C0737BCC237D520B3D040A34
    ```

    - Adds Earth Cleaver CD instead of Wind Cut DMG to accommodate a lack of Ark Grid.
    - If you're a beginner, swap <span class="skill-mention" data-skill-id="raidcaptain">Raid Captain</span> for <span class="skill-mention" data-skill-id="curseddoll">Cursed Doll</span> until you're more experienced with the class.

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
      { "id": "orbcontrol", "level": 1 },
      { "id": "limitbreakenl", "level": 3 },
      { "id": "chaosinfusion", "level": 1 },
      { "id": "chaoticpower", "level": 3 }
    ] },
    { "id": "leap", "nodes": [
      { "id": "awakeningamplifier", "level": 1 },
      { "id": "unleashedpower", "level": 5 },
      { "id": "releasepotential", "level": 3 },
      { "id": "instantspell", "level": 3 },
      { "id": "pathoftheblade", "level": 3 }
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
- <span class="skill-mention" data-ap-id="releasepotential" data-level="3">Release Potential 3</span> is taken because downtime, raid phasing, or death can occasionally enable an extra use.
    - The alternative is <span class="skill-mention" data-ap-id="transcendentpower" data-level="3">Transcendent Power 3</span>, which is only really useful for guardians or your fourth non-gold HW raid.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Ark Grid<span class="setup-note-arrow"></span></summary>

- You can level Ark Grid cores to your preference, but 17p Surge Core grants a second Earth Cleaver stack. This frees up a gem slot and allows you to cast Earth Cleaver without needing to hold it for an upcoming raid mechanic.

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
  {"id": "bladedance", "level": 14, "tripods": [1, 1, 2], "rune": {"tier": "epic", "name": "Galewind"}},
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

- Use <span class="skill-mention" data-rune-name="Purify">Purify</span> on Spincutter if needed.
- <span class="skill-mention" data-rune-name="Focus" data-rune-tier="legendary">Focus</span> on Maelstrom + wine handles most mana needs, since Breaking Moon cycles restore it.
    - Use mana food instead if you don't trust your or your support's uptime (spec bards), or for trixion-like content.
- Alternatively, <span class="skill-mention" data-rune-name="Bleed" data-rune-tier="legendary">Legendary Bleed</span> on Maelstrom + mana food: higher ceiling/lower floor, even with Raid Captain.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Note</span>Options & Tripods<span class="setup-note-arrow"></span></summary>

- You can use the Weak Point Detection <span class="skill-mention" data-glossary-id="tripod">tripod</span> on Blade Dance.
    - Requires Lv 10 CD gem and/or raid downtime for it not to become a bottleneck.
    - You must swap Wind Cut CD gem to Blade Dance CD, and it's a marginal DPS increase.
- Earth Explosion tripod on Earth Cleaver is up to personal preference.
    - Increased cast speed, but greatly lowers its mobility and damage.
- Dark Axel (1-1-2) can be used instead of Spincutter, but offers **no** recovery.

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
    "surge", "earthcleaver", "blitzrush", "bladedance", "turningslash", { "id": "windcut", "alts": [
      { "id": "spincutter", "note": "Use Spincutter CD gem instead if you prefer, Wind Cut has a very low damage share." },
      { "id": "earthcleaver", "note": "Use Earth Cleaver CD gem instead pre-Ark Grid as you won't have its second stack." },
      { "id": "bladedance", "note": "Use Blade Dance CD gem instead if you set its tripod to Weak Point Detection or wish to have it available sooner as a safety net." }
    ] }
  ] },
  { "col": "cd", "items": [
    "blitzrush",
    "windcut",
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

Use the Breaking Moon cycle and its follow-up when available, then repeat the regular cycle otherwise.

*From 3 orbs:*
{ .lead }

<div class="cycle-card cycle-card-multi" markdown>
<div class="cycle-card-header"><span class="cycle-num cycle-num-1">1</span><span class="cycle-title">Breaking Moon Cycle + Follow-Up</span></div>
<div class="rotation-line" markdown>
<script type="application/json">
[{ "stageLabel": "B.M. Cycle >" }, { "skills": ["turningslash", "surpriseattack"], "situational": "adre/syn for openers" }, "windcut", "deathtrance", "maelstrom", "surpriseattack", "breakingmoon", "surge"]
</script>
</div>
<div class="rotation-line" markdown>
<script type="application/json">
[{ "stageLabel": "Follow-up >" }, "windcut", "deathtrance", { "id": "maelstrom", "situational": "used if you have 2 stacks" }, { "id": "surpriseattack", "situational": "safety stack buffer" }, "earthcleaver", "turningslash", "bladedance", "blitzrush", "surpriseattack", "surge"]
</script>
</div>
<!-- Alternate Follow-up path, not a third stage: kept OUT of the Cycle ->
     Follow-up sequential read/drill (see extra.css's .cycle-alt-branch
     comment and rotation-practice.js's getLines/getSteps comment for why
     this wrapper is what excludes it). Now a <details> so it's collapsed
     by default (same <details>/<summary> instinct as .gem-item-expandable/
     .engraving-card elsewhere on the site) instead of always rendering its
     full chip row inside the card - closed, only the <summary>'s gold
     "Alt \u00b7 Awakening Follow-Up" tag shows, in the exact same spot/size the
     old always-open version's leading stageLabel pseudo-step used to sit;
     open, it drops down into the identical rotation-line the old version
     showed permanently. markdown="span" on <summary> is required for the
     "&middot;" entity to actually parse - see .gem-item-expandable's own
     comment on this same fix. -->
<details class="cycle-alt-branch" markdown>
<summary markdown="span">Alternative &middot; Awakening Follow-Up<span class="cycle-alt-arrow"></span></summary>
<div class="rotation-line" markdown>
<script type="application/json">
["windcut", "deathtrance", { "id": "maelstrom", "situational": "used if you have 2 stacks" }, "turningslash", "bladedance", "bladeassault", "surge"]
</script>
</div>
</details>
</div>

<div class="cycle-card" markdown>
<div class="cycle-card-header"><span class="cycle-num cycle-num-2">2</span><span class="cycle-title">Regular Cycle</span><span class="cycle-repeat-badge" data-repeat-tip="Repeat this cycle 2 times"><span class="cycle-repeat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg></span>&times;2</span></div>
<div class="rotation-line" markdown>
<script type="application/json">
["windcut", "deathtrance", "maelstrom", "surpriseattack", "windcut", "earthcleaver", "turningslash", "bladedance", "blitzrush", "surpriseattack", "surge"]
</script>
</div>
</div>

1. Stack are tight in the follow-up: cast Maelstrom (if 2 stacks), the first Surprise Attack or Spincutter if needed.
    - This mostly applies to the raid's first follow-up, you naturally gather spare stacks through the fight for the rest.
    - Casting Turning Slash in the opener, or using the Awakening follow-up is also enough to create a safety buffer.
2. Do NOT worry about Raid Captain efficiency; Keen Blunt Weapon is just as inefficient or worse!
    - Breaking Moon's Critical Damage bonus to the next Surge (biggest hit) is additive to Keen Blunt Weapon.
    - Raid Captain fully buffs the empowered Surge and can make use of <span class="skill-mention" data-rune-name="Rage" data-rune-tier="legendary">Rage</span>/<span class="skill-mention" data-skill-id="atropine">Atropine</span> for the follow-up.
3. <span class="skill-mention" data-skill-id="bladeassault">Blade Assault</span> scales much worse on Surge than on Remaining Energy and takes too long to cast.
      - It's still useful for <span class="skill-mention" data-skill-id="atropine">Atropine</span> openers, or it can be saved to greed with <span class="skill-mention" data-glossary-id="pushimmunity">push immunity</span>/Hyper Awakening.
4. It seems more complicated than it really is, watch [this video](https://www.youtube.com/watch?v=4bwhDT--0fo) to see how a full rotation plays out.

<!-- Community-contributed alternative: a full replacement for both cycles
     above (not a recommendation over them), for players who'd rather keep
     a Stack reserve than chase max CPM. Self-contained: Cycles 1/2 here
     are its own local cycle-cards (Cycle 1 is the opener STAGE only, no
     Follow-Up), not shared with the page's cycle-num-1/2 above, plus its
     own new Cycles 3/4 (cycle-num-4 added in extra.css for this). No
     overview line above the cards (matches the page's main Cycle 1/2
     pair above) - the loop is just "repeat Cycle 2 twice", carried by
     Cycle 2's own title-bar repeat badge below rather than a separate
     "1 -> 2x2 -> 3 -> etc." map line up top. -->

<div class="setup-panel" data-accent="lavender" markdown>
<div class="setup-notes" markdown>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Alt</span>Stack Reserve Rotation<span class="setup-note-arrow"></span></summary>

An alternative to the default rotation. It builds a stack reserve, so you're never short on them. Goes 1>2>2>3>1, etc.

<div class="cycle-card" markdown>
<div class="cycle-card-header"><span class="cycle-num cycle-num-1">1</span><span class="cycle-title">Breaking Moon Cycle</span></div>
<div class="rotation-line" markdown>
<script type="application/json">
[{ "id": "maelstrom", "situational": "buff for openers" }, { "skills": ["turningslash", "surpriseattack"], "situational": "adre/syn for openers" }, { "id": "windcut", "situational": "precast for openers" }, "deathtrance", "surpriseattack", "breakingmoon", "surge"]
</script>
</div>
</div>

<div class="cycle-card" markdown>
<div class="cycle-card-header"><span class="cycle-num cycle-num-2">2</span><span class="cycle-title">Regular Cycle</span><span class="cycle-repeat-badge" data-repeat-tip="Repeat this cycle 2 times"><span class="cycle-repeat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg></span>&times;2</span></div>
<div class="rotation-line" markdown>
<script type="application/json">
["windcut", "deathtrance", "maelstrom", "surpriseattack", "windcut", "earthcleaver", "turningslash", "bladedance", "blitzrush", "surpriseattack", "surge"]
</script>
</div>
</div>

<div class="cycle-card" markdown>
<div class="cycle-card-header"><span class="cycle-num cycle-num-3">3</span><span class="cycle-title">Pre-Breaking Moon Cycle</span></div>
<div class="rotation-line" markdown>
<script type="application/json">
["windcut", "deathtrance", "earthcleaver", "surpriseattack", "windcut", "turningslash", "bladedance", "maelstrom", "blitzrush", { "id": "spincutter", "situational": "stack recovery/reposition" }, "surge"]
</script>
</div>
</div>

</details>

</div>
</div>

*From zero orbs:*
{ .lead }

1. Use a <span class="food-req-item">![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant</span> (recommended) or proceed to #2.
      - Rat Pack: Use Maelstrom's Orb Control tripod and <span class="skill-mention" data-skill-id="flashblink">Flash Blink</span> awakening.
2. Generate one orb, build at least 40 stacks, then Surge to refill all 3 orbs.

*Atropine usage:*
{ .lead }

1. Fit three Surges into a 10 second window. Use <span class="food-req-item">![](../assets/shared/icon-atropine.png){: .skill-icon } Atropine</span> right before the first Surge hits.
2. The second or third Surge must be part of a Breaking Moon cycle or you won't make it.
3. Stacks and the environment vary, so a fixed rotation would just be a shackle.

## DPS Spread

<!-- data-labels / data-values / data-ids are three parallel comma-separated
     lists, ordered highest % first - update after a fresh Trixion recording
     or a balance pass. Full schema is in javascripts/dps-chart.js's
     "EASY EDIT GUIDE" comment. -->

<p class="dps-showcase-caption">Ancient cores, full Lv 10 gems</p>

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-show-icons data-values="75,6.5,4,2.7,2.6,2.6, 2.5" data-ids="surge,breakingmoon,earthcleaver,blitzrush,bladedance,turningslash,windcut"></div>
</div>
</div>