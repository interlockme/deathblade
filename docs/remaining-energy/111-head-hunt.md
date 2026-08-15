# 111 (Head Hunt) 🔪

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-08-07" markdown>

<div class="build-stats">
<div class="stat"><span class="stat-label">Difficulty</span><span class="stat-value">9 / 10</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width: 90%"></div></div></div>
<div class="stat"><span class="stat-label">Trixion DPS</span><span class="stat-value">1.18 Multiplier</span><div class="stat-bar-track stat-bar-track-teal"><div class="stat-bar-fill stat-bar-fill-teal" style="width: 60%"></div></div></div>
<div class="stat"><span class="stat-label">Playstyle</span><span class="stat-value">Fast & Punishing</span></div>
</div>

**Best For:**{: .best-for } Players who want maximum skill expression and speed.

**Tradeoff:**{: .tradeoff } Unforgiving rotation with very little room for error.

- This is the final form of the old-school Remaining Energy gameplay.
- Head Hunt is used in the rotation, so it may not be available for recovery or counter.
- Similar rotation to Fatal Wave builds, but lower orb generation and fewer recovery options.

</div>
<!-- Build profile pentagon. Order: Difficulty, DPS, Mobility, Recovery, Speed (0-10).
     - DPS 8.5 follows the strict -0.5-per-rank pattern below 333 Ceiling
       (9), consistent with the rest of the RE family.
     - Mobility 5 is standard across all RE builds.
     - Recovery/Speed are this build's own read - edit freely. -->
<div class="pentagon-badge" data-build="111-head-hunt" data-family="re" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[Video Guide](https://www.youtube.com/watch?v=z8KE3HG_ggg){ .video-chip } [Gameplay](https://www.youtube.com/watch?v=4O9THIPhVuY){ .video-chip }
</div>
</div>
</div>

## Skill Codes

!!! danger "Before importing"
    Make sure you've read [Essentials](essentials.md), then apply both "Ark Passive" and "Skill" to be safe. For [Gems](#gems), follow the guide.

=== "111 Head Hunt"

    ```
    C289D8EB08E331EA88A2C65A57DD383C979E48ABE184E47D357E8FB1E3E01A8DF959893AEA9B7713908581D63D17398B194369FAE09C50791B5BF3022A729D92
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
        { "id": "firmwill", "level": 3, "max": 3 },
        { "id": "swordcraftenhancement", "level": 1, "max": 5 }
      ] },
      { "label": "Tier 4", "nodes": [
        { "id": "extremebodymovement", "level": 2, "max": 3 },
        { "id": "orbcirculation", "level": 5, "max": 5 }
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
        { "id": "danceofnightmares", "level": 3, "max": 3 }
      ] }
    ] }
  ]
</script>
</div>

<div class="ark-cores" data-family="re" markdown>
<script type="application/json">
[
  { "core": "sun", "label": "Art Master", "points": 0 },
  { "core": "moon", "label": "Arts Core", "points": 3 },
  { "core": "star", "label": "Basics", "points": 0 }
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

- Playable with zero Ark Grid investment, but not recommended.

</details>

</div>

</div>

## Skill Setup

<div class="setup-panel" data-accent="lavender" markdown>

<div class="skill-setup" data-family="re" markdown>
<script type="application/json">
[
  {"id": "soulabsorber", "level": 14, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Wealth"}},
  {"id": "deathsentence", "level": 14, "tripods": [2, 2, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "twinshadows", "level": 14, "tripods": [2, 1, 2], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "headhunt", "level": 7, "tripods": [2, 2], "rune": {"tier": "green", "name": "Wealth"}},
  {"id": "turningslash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "maelstrom", "level": 10, "tripods": [2, 1, 2], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "blitzrush", "level": 14, "tripods": [2, 1, 1], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "voidstrike", "level": 11, "tripods": [3, 1, 2], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "surge", "subtitle": "Identity"},
  {"id": "deathlyslash", "subtitle": "Technique"},
  {"id": "bladeassault", "subtitle": "Awakening"}
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Runes<span class="setup-note-arrow"></span></summary>

- Use Purify on Head Hunt if absolutely necessary.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Optional<span class="setup-note-arrow"></span></summary>

- You can swap Head Hunt's tripod to Quick Prep and gain an extra gem slot.
    - Change your Head Hunt CD gem to Twin Shadows CD. Enjoy slightly easier recovery!
    - This setup may run into mana issues, use a Focus rune on Head Hunt if necessary.

</details>

</div>

</div>

## Gems

<div class="setup-panel" data-accent="lavender" markdown>

<div class="gem-priority" markdown>
<script type="application/json">
[
  { "col": "dmg", "label": "Damage", "items": [
    "surge", "deathsentence", "twinshadows", "turningslash",
    "soulabsorber", "blitzrush", "voidstrike"
  ] },
  { "col": "cd", "label": "Cooldown", "items": [
    "maelstrom", "blitzrush", "headhunt", "turningslash"
  ] }
]
</script>
</div>

</div>

## Rotation

=== "Cycles"

    Use an **Opener**, then alternate between these two cycles as needed:

    <div class="cycle-card" markdown>
    <div class="cycle-card-header"><span class="cycle-num cycle-num-1">1</span><span class="cycle-title">Void Strike + Deathly Slash</span></div>
    <div class="rotation-line" markdown>
    <script type="application/json">
    ["maelstrom", "voidstrike", "twinshadows", "headhunt", "deathlyslash", "deathsentence", "turningslash", "surge"]
    </script>
    </div>
    </div>

    <div class="cycle-card" markdown>
    <div class="cycle-card-header"><span class="cycle-num cycle-num-2">2</span><span class="cycle-title">Soul Absorber + Blitz Rush</span></div>
    <div class="rotation-line" markdown>
    <script type="application/json">
    ["soulabsorber", "blitzrush", "twinshadows", "deathsentence", "turningslash",
     { "id": "headhunt", "situational": true },
     "surge"]
    </script>
    </div>
    </div>

    Aim to fit up to Cycle **2**'s Twin Shadows under Cycle **1**'s Maelstrom to reach 3 orbs without recasting or using recovery options. If you don't, an extra Head Hunt cast is required at the end of Cycle **2**.

    Using Head Hunt in Cycle **2** may force you to cast it at the end of the next Cycle **1**, which creates downtime.

    Maelstrom management is extremely important when the rotation fails, you should cast it as it expires if needed.

    Due to limited orb generation, Turning Slash's after-effects may need to carry over to the following cycle.

=== "Openers"

    Openers stack Adrenaline and apply synergies efficiently. If it feels overwhelming, just apply synergy and Surge at full orbs; that's all you need to start the alternating cycles.

    *From 3 orbs (![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant):*
    { .lead }

    <div class="rotation-line" markdown>
    <script type="application/json">
    ["headhunt", "twinshadows", "deathsentence", "maelstrom", "turningslash", "deathlyslash", "surge",
     { "cycleRef": 2, "title": "Soul Absorber + Blitz Rush Cycle" },
     { "cycleRef": 1, "title": "Void Strike + Deathly Slash Cycle" },
     { "suffix": "etc." }]
    </script>
    </div>

    - <span class="skill-chip">![](../assets/shared/icon-bladeassault.png)Blade Assault</span> is interchangeable with Cycle **2** if it's available.
    - It's efficient to use ![](../assets/shared/icon-atropine.png){: .skill-icon } Atropine after Deathly Slash, with Blade Assault available.

    *From zero/partial orbs:*
    { .lead }

    - Cycle **1** if Deathly Slash is available, otherwise start from Maelstrom + Cycle **2**.

=== "Recovery"

    !!! example ""
        Watch this 54-minute [111 recovery video](https://www.youtube.com/watch?v=z8KE3HG_ggg) or consider an easier build.

    - Use spare Twin Shadows/Maelstrom stacks and/or Blitz Rush if you miss major skills.

## DPS Spread

<p class="dps-showcase-caption">Ancient cores, full Lv 10 gems</p>

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-show-icons data-labels="Deathly Slash,Surge,Death Sentence,Turning Slash,Twin Shadows,Soul Absorber,Blitz Rush,Void Strike,Bleed,Head Hunt,Maelstrom" data-values="21,18.8,16.6,11.6,10.6,8,6.6,5.5,0.6,0.3,0.3" data-ids="deathlyslash,surge,deathsentence,turningslash,twinshadows,soulabsorber,blitzrush,voidstrike,bleed,headhunt,maelstrom"></div>
</div>
</div>