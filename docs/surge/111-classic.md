# 111 (Classic) 🦁

<p class="page-banner page-banner-warning">Not available in NA/EU servers yet, rotations subject to change</p>

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-08-07" markdown>

<div class="build-stats" data-build="111-classic" data-family="surge"></div>

**Best For:**{: .best-for } Players who enjoy building up to one massive, satisfying Surge hit.

**Tradeoff:**{: .tradeoff } All your eggs are in one basket (Surge).

- Satisfying burst windows with the Breaking Moon → Surge combo.
- No need to hold Counter, it charges up to two stacks.
- Very high gem efficiency, Surge is nearly all of your DPS.
- Accessible from zero Ark Grid cores with minor adjustments.
- Must constantly balance Surge back-attack rate with Surge CPM.

</div>
<!-- Build profile pentagon. Order: Difficulty, DPS, Mobility, Exposure, Speed (0-10).
     - DPS 9 = highest in the Surge family, deliberately standardized to
       match 333 Ceiling's 9 in the RE family (Surge/RE DPS isn't
       comparable 1:1 even though both report a Trixion multiplier -
       see javascripts/pentagon-badge.js top comment).
     - Exposure (not Recovery) for Surge builds: back-attack/positional
       risk, HIGHER IS WORSE here unlike every other axis - keep the
       data-caption below in sync if you tweak this value.
     - Mobility/Speed are this build's own read - edit freely. -->
<div class="pentagon-badge" data-build="111-classic" data-family="surge" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[Video Guide](https://www.youtube.com/watch?v=pzFa5zOuNik){ .video-chip } [Gameplay](https://www.youtube.com/watch?v=j-2dGp7PGws){ .video-chip }
</div>
</div>
</div>

## Skill Codes

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
    9AFBA682E2AF248EC0357C6139AB39F73603D1F3583597559FDEB47ED7A071ABD2AE255CB2FF481D09EA6BDF6F653639ADCFB1F1EF01FB11A79379A36DE56B4A
    ```

=== "Pre-Ark Grid"

    *Adds Earth Cleaver CD and uses Blade Dance's Quick Prep tripod to accommodate a lack of Ark Grid.<br>If you're a beginner, swap Raid Captain for Cursed Doll until you're more experienced.*

    ```
    265B124DF8BC69A1937EB6F6DFD9E786F5710527349FFEE44D63AC2FF95F4F719F55127DDD2C326A7B608BEDF91520DB6EB86D2368CD03C3485FD5D50C3250E6
    ```

## Ark Setup

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

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Ark Grid<span class="setup-note-arrow"></span></summary>

- You can level Ark Grid cores to your preference, but 17p Moon grants a second Earth Cleaver stack. This lets you slot a cooldown gem into Blade Dance and use its Weak Point Detection tripod.

</details>

</div>

</div>

## Skill Setup

<div class="setup-panel" data-accent="lavender" markdown>

<div class="skill-setup" data-family="surge" markdown>
<script type="application/json">
[
  {"id": "surpriseattack", "level": 10, "tripods": [1, 1, 1], "rune": {"tier": "legendary", "name": "Rage"}},
  {"id": "windcut", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "spincutter", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "bladedance", "level": 14, "tripods": [1, 2, 2], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "earthcleaver", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Vision"}},
  {"id": "turningslash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "epic", "name": "Rage"}},
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
- Use Legendary Bleed or Poison instead of Rage if you don't use RC or MI engravings.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Optional<span class="setup-note-arrow"></span></summary>

- Earth Explosion tripod on Earth Cleaver is up to personal preference.
    - Increased cast speed and extra stack, lowered mobility and damage.
- Thick Sword Energy tripod increases Wind Cut range but builds less stacks.
- You can use the Quick Prep tripod on Blade Dance as a safety net.
- Dark Axel (1-1-2 tripods) can be used instead of Spincutter if you prefer it.

</details>

</div>

</div>

## Gems

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
    "maelstrom",
    { "id": "bladedance", "alts": [
      { "id": "earthcleaver", "note": "Use Earth Cleaver instead of Blade Dance pre-Ark Grid; set Quick Prep tripod on Blade Dance to compensate." }
    ] },
    "turningslash",
    "surpriseattack"
  ] }
]
</script>
</div>

</div>

## Rotation

There's an optimal skill order, but you have flexibility when facing downtime or weaving in mobility skills.

Spincutter is your main mobility skill and backup stack builder. Use it to guarantee a back attack on Surge.

Breaking Moon grants 60 stacks on hit and empowers your next Surge.

Use the Breaking Moon cycle whenever it's available, then repeat the main cycle whenever it's not.

*From 3 orbs:*
{ .lead }

=== "Opener/Breaking Moon Cycle"

    <div class="rotation-line" markdown>
    <script type="application/json">
    [{ "icons": ["turningslash", "surpriseattack"], "situational": "synergy/adrenaline" },
     "windcut", "deathtrance", "maelstrom", "surpriseattack", "breakingmoon", "surge"]
    </script>
    </div>

    - If you already have a Maelstrom (or Rage) buff of 3 seconds or more, consider skipping it.

=== "Main Cycle"

    <div class="rotation-line" markdown>
    <script type="application/json">
    ["windcut", "deathtrance", "maelstrom", "surpriseattack", "windcut", "earthcleaver", "turningslash", "bladedance", "blitzrush",
     { "id": "surpriseattack", "situational": true },
     "surge"]
    </script>
    </div>

    - Consider delaying Maelstrom by 1 to 3 skills when uptime drops to ensure it covers Surge (Raid Captain).

=== "Main Cycle (RC+MI)"

    *Alternate main cycle meant to try-hard RC+MI efficiency.*
    { .lead }

    <div class="rotation-line" markdown>
    <script type="application/json">
    ["maelstrom", "windcut", "deathtrance", "surpriseattack", "windcut", "earthcleaver", "turningslash", "maelstrom", "bladedance", "blitzrush", "surpriseattack", "surge"]
    </script>
    </div>

    - Use your judgment. Not every skill needs the Maelstrom buff, so prioritize Surge.
    - Consider skipping Maelstrom to conserve a stack for later use if you received a Rage buff.

=== "Awakening Cycle"

    <div class="rotation-line" markdown>
    <script type="application/json">
    ["windcut", "deathtrance", "maelstrom", "surpriseattack", "windcut", "turningslash", "bladedance", "bladeassault", "surge"]
    </script>
    </div>

*From zero orbs:*
{ .lead }

1. Use a ![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant (recommended) or proceed to #2.
2. Generate one orb, build at least 40 stacks, then Surge to refill all 3 orbs.

## DPS Spread

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-show-icons data-labels="Surge,Breaking Moon,Earth Cleaver,Blade Dance,Blitz Rush,Turning Slash" data-values="74.41,6.51,4.22,4.1,2.73,2.55" data-ids="surge,breakingmoon,earthcleaver,bladedance,blitzrush,turningslash"></div>
</div>
</div>