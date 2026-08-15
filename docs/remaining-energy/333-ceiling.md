# 333 (Ceiling) ✨

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-08-07" markdown>

<div class="build-stats" data-build="333-ceiling" data-family="re"></div>

**Best For:**{: .best-for } Players who want the highest damage RE build.

**Tradeoff:**{: .tradeoff } Slightly lower orb generation and a less forgiving rotation.

- Uses Fatal Wave as two fast casts (FTF combo) via a skill reset.
- Head Hunt is always free for counters, recovery, purify, or Adrenaline upkeep.
- High gem efficiency, Fatal Wave and Deathly Slash are most of your DPS.
- Susceptible to high ping or low FPS, but you can compensate with a few changes.

</div>
<!-- Build profile pentagon. Order: Difficulty, DPS, Mobility, Recovery, Speed (0-10).
     - Difficulty/DPS match the stat boxes above (DPS here is RE's highest
       -> 9, this is the family's reference build for that scale).
     - Mobility 5 is standard across all RE builds.
     - Recovery/Speed are this build's own read - edit freely.
     See javascripts/pentagon-badge.js top comment for the full scale writeup. -->
<div class="pentagon-badge" data-build="333-ceiling" data-family="re" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[Video Guide](https://youtu.be/Wwm7apTwg84?si=dmO_fvNxoXuoQuf5){ .video-chip } [Gameplay](https://www.youtube.com/watch?v=MP--TuRX3xI){ .video-chip }
</div>
</div>
</div>

## Skill Codes

!!! danger "Before importing"
    Make sure you've read [Essentials](essentials.md), then apply both "Ark Passive" and "Skill" to be safe. For [Gems](#gems), follow the guide.

=== "333 Ceiling ★"

    ```
    8996BED713426C25CB993BCA48EB9CBA2BF93921A91CAA15F463DED8BF367B2AF73535AAC800498B7340CA45735567DFFAA91A4914C7B288362130D9E34634CC
    ```

=== "Orb Circulation 5 (easier)"

    *This is ~3% weaker but more forgiving to play. It uses Legendary Wealth on Soul Absorber as well.*

    ```
    D4D17B7F291340AAD2E9831A065E7F9870B3612FFA798E77FC1FFEE9E4D68E400597FDB2A3DCAA11D5DB53B85812DF1042A685249158B4E08BB87A614E428350
    ```

## Ark Setup

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
        { "id": "unleashedpower", "level": 5, "max": 5 },
        { "id": "releasepotential", "level": 4, "max": 5 },
        { "id": "instantspell", "level": 2, "max": 3 }
      ] },
      { "label": "Tier 2", "nodes": [
        { "id": "danceofnightmares", "level": 3, "max": 3 }
      ] }
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
- Release Potential 3 / Instant Spell 3 / Awakening Amplifier 1 can solve mana issues at a very minor DPS loss.
    - Not as comfortable with +CD% bracelet line and/or low Specialization.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Ark Grid<span class="setup-note-arrow"></span></summary>

- Finish up Star to 17p when you can, Fatal Wave is your highest damage skill.

</details>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Alt</span>Orb Circulation 5<span class="setup-note-arrow"></span></summary>

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
  { "id": "enlightenment", "label": "Enlightenment", "points": 100, "tiers": [
    { "label": "Tier 1", "nodes": [
      { "id": "swiftstrike", "level": 1, "max": 1 }
    ] },
    { "label": "Tier 2", "nodes": [
      { "id": "remainingenergy", "level": 3, "max": 3 }
    ] },
    { "label": "Tier 3", "nodes": [
      { "id": "firmwill", "level": 3, "max": 3 },
      { "id": "swordcraftenhancement", "level": 1, "max": 5 }
    ] },
    { "label": "Tier 4", "nodes": [
      { "id": "extremebodymovement", "level": 2, "max": 3 },
      { "id": "orbcirculation", "level": 5, "max": 5 }
    ] }
  ] }
]
</script>
</div>

</details>

</div>

</div>

## Skill Setup

<div class="setup-panel" data-accent="lavender" markdown>

<div class="skill-setup" data-family="re" markdown>
<script type="application/json">
[
  {"id": "soulabsorber", "level": 14, "tripods": [3, 1, 2], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "twinshadows", "level": 14, "tripods": [2, 1, 2], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "headhunt", "level": 7, "tripods": [1, 2], "rune": {"tier": "green", "name": "Wealth"}},
  {"id": "turningslash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "maelstrom", "level": 10, "tripods": [2, 1, 2], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "fatalwave", "level": 14, "tripods": [2, 3, 2], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "blitzrush", "level": 14, "tripods": [2, 1, 1], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "voidstrike", "level": 11, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Wealth"}},
  {"id": "surge", "subtitle": "Identity"},
  {"id": "deathlyslash", "subtitle": "Technique"},
  {"id": "bladeassault", "subtitle": "Awakening"}
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Runes<span class="setup-note-arrow"></span></summary>

- Use Legendary Galewind, Focus or Purify on Head Hunt if you prefer.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Optional<span class="setup-note-arrow"></span></summary>

- You can bring Head Hunt down to Lv 1 and Void Strike up to Lv 14 for +0.4% DPS and lower mana use.
    - However, Lv 7 is more practical and makes recovery much easier and faster. ★
    - At Lv 7, Magick Control tripod can help solve mana issues if you don't need the CDR.
    - Lv 4 Head Hunt (Quick Prep) with Void Strike Lv 13 is a decent overall compromise.

</details>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Alt</span>Fatal Wealth<span class="setup-note-arrow"></span></summary>

- Wealth rune on Fatal Wave can make this build more forgiving at a ~4% DPS loss.
- It won't cycle as smoothly, but the reduced stress and urgency may suit some people.
- Consider playing Surge instead of this or any 333 build with Fatal Wave Orb Control tripod.

<div class="skill-setup" data-family="re" markdown>
<script type="application/json">
[
  {"id": "fatalwave", "level": 14, "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "voidstrike", "level": 11, "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "soulabsorber", "level": 14, "rune": {"tier": "legendary", "name": "Wealth"}},
  {"id": "twinshadows", "level": 14, "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "maelstrom", "level": 10, "rune": {"tier": "green", "name": "Wealth"}}
]
</script>
</div>

<div class="ark-passives ark-passives-compact" data-family="re" markdown>
<script type="application/json">
[
  { "id": "leap", "label": "Leap", "points": 70, "tiers": [
    { "label": "Tier 1", "nodes": [
      { "id": "awakeningamplifier", "level": 1, "max": 3 },
      { "id": "unleashedpower", "level": 5, "max": 5 },
      { "id": "releasepotential", "level": 3, "max": 5 },
      { "id": "instantspell", "level": 3, "max": 3 }
    ] },
    { "label": "Tier 2", "nodes": [
      { "id": "danceofnightmares", "level": 3, "max": 3 }
    ] }
  ] }
]
</script>
</div>

</details>

<details class="setup-note" data-kind="danger" markdown>
<summary><span class="setup-note-tag">Warn</span>Balance Patch<span class="setup-note-arrow"></span></summary>

- Swift Fingers will become the default 1st row tripod for Blitz Rush.
    - ~1.5% DPS loss but CPM and playability increases make up for it.
    - Void Strike is raised to Lv 13 and Blitz Rush is lowered to Lv 12.
    - Gem priority of Void Strike and Blitz Rush is swapped.
- Apply changes manually if the guide is not updated in time.
- See [Essentials](essentials.md) for class-wide changes.

</details>

</div>

</div>

## Gems

<div class="setup-panel" data-accent="lavender" markdown>

<div class="gem-priority" markdown>
<script type="application/json">
[
  { "col": "dmg", "label": "Damage", "items": [
    "fatalwave", "surge", "twinshadows", "soulabsorber",
    "turningslash", "blitzrush", "voidstrike"
  ] },
  { "col": "cd", "label": "Cooldown", "items": [
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

=== "Cycles"

    Use an **Opener**, then alternate between these two cycles as needed:

    <div class="cycle-card" markdown>
    <div class="cycle-card-header"><span class="cycle-num cycle-num-1">1</span><span class="cycle-title">Void Strike + Deathly Slash</span></div>
    <div class="rotation-line" markdown>
    <script type="application/json">
    ["maelstrom", "voidstrike", "twinshadows", "deathlyslash", "fatalwave", "turningslash", "fatalwave", "surge"]
    </script>
    </div>
    </div>

    <div class="cycle-card" markdown>
    <div class="cycle-card-header"><span class="cycle-num cycle-num-2">2</span><span class="cycle-title">Soul Absorber + Blitz Rush</span></div>
    <div class="rotation-line" markdown>
    <script type="application/json">
    ["soulabsorber", "blitzrush", "twinshadows",
     { "id": "maelstrom", "situational": true },
     "fatalwave", "turningslash", "fatalwave", "surge"]
    </script>
    </div>
    </div>

    Aim to fit up to Cycle **2**'s Twin Shadows under Cycle **1**'s Maelstrom to reach 3 orbs without recasting or using recovery options. If you only landed up to Soul Absorber, an extra Head Hunt cast is usually enough.

    The Maelstrom in Cycle **2** is only cast if you'd otherwise miss 3 orbs. Use your judgment. If cast, it lasts at least until Cycle **1**'s Void Strike; recasting it as it expires aligns cooldowns. If it wasn't needed or it didn't last, nothing changes.

=== "Openers"

    Openers stack Adrenaline and apply synergies efficiently. If it feels overwhelming, just apply synergy and Surge at full orbs; that's all you need to start the alternating cycles.

    *From 3 orbs (![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant):*
    { .lead }

    <div class="rotation-line" markdown>
    <script type="application/json">
    [{ "id": "headhunt", "swapNext": true }, "twinshadows", "maelstrom", "turningslash", "deathlyslash", "fatalwave", "surge",
     { "cycleRef": 2, "title": "Soul Absorber + Blitz Rush Cycle" },
     { "cycleRef": 1, "title": "Void Strike + Deathly Slash Cycle" },
     { "suffix": "etc." }]
    </script>
    </div>

    - <span class="skill-chip">![](../assets/shared/icon-bladeassault.png)Blade Assault</span> + <span class="skill-chip">![](../assets/shared/icon-fatalwave.png)![](../assets/shared/icon-turningslash.png)![](../assets/shared/icon-fatalwave.png)FTF</span> is interchangeable with Cycle **2** if it's available.
    - It's efficient to use ![](../assets/shared/icon-atropine.png){: .skill-icon } Atropine after Deathly Slash, with Blade Assault available.

    *From zero/partial orbs:*
    { .lead }

    - Cycle **1** if Deathly Slash is available, otherwise start from Maelstrom + Cycle **2**.
    - Prioritize the FTF combo earlier for better party synergy uptime.

=== "Recovery"

    !!! example ""
        Watch this 2-minute [333 recovery video](https://www.youtube.com/watch?v=4478vFVX4VA) and read the segment titles.

    - Use <span class="skill-chip">![](../assets/shared/icon-headhunt.png)Head Hunt</span> when a little short on orbs, just cast if unsure.
    - Use spare Twin Shadows/Maelstrom stacks and/or Blitz Rush if you miss major skills.
    - Use <span class="skill-chip">![](../assets/shared/icon-headhunt.png)Head Hunt</span> instead of <span class="skill-chip">![](../assets/shared/icon-twinshadows.png)Twin Shadows</span> for a cycle to recover stacks if they run out.
    - Use Maelstrom + FTF combo earlier if waiting on main orb generation skills.
    - Hold Deathly Slash until the next Cycle **1** if it's out of sync. DPS loss, but easier.

=== "TL;DR:"
    ![333 TL;DR flowchart](../assets/tldr-333.png){ loading=lazy }

## DPS Spread

<p class="dps-showcase-caption">Ancient cores, full Lv 10 gems</p>

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-show-icons data-labels="Fatal Wave,Deathly Slash,Surge,Twin Shadows,Soul Absorber,Turning Slash,Blitz Rush,Void Strike,Bleed,Maelstrom" data-values="34.6,17.8,15.5,7.7,6.7,6.5,5.6,4.7,0.5,0.3" data-ids="fatalwave,deathlyslash,surge,twinshadows,soulabsorber,turningslash,blitzrush,voidstrike,bleed,maelstrom"></div>
</div>
</div>