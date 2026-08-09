# 313 (High Floor) 💜

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-08-07" markdown>

<div class="build-stats">
<div class="stat"><span class="stat-label">Difficulty</span><span class="stat-value">8 / 10</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width: 80%"></div></div></div>
<div class="stat"><span class="stat-label">Trixion DPS</span><span class="stat-value">1.17 Multiplier</span><div class="stat-bar-track stat-bar-track-teal"><div class="stat-bar-fill stat-bar-fill-teal" style="width: 57%"></div></div></div>
<div class="stat"><span class="stat-label">Playstyle</span><span class="stat-value">Fast & Comfy</span></div>
</div>

**Best For:**{: .best-for } Players who want a simpler, faster, and more forgiving Fatal Wave build.

**Tradeoff:**{: .tradeoff } Lower damage ceiling, but easier to recover from mistakes.

- Head Hunt is always free for counters, recovery, purify, or Adrenaline upkeep.
- Accessible from a 14p Star core as 113 (Arts), a transitional core-limited option.
- Move on to [333 (Ceiling)](333-ceiling.md) when you're ready, or stay here if you prefer!

</div>
<!-- Build profile pentagon. Order: Difficulty, DPS, Mobility, Recovery, Speed (0-10).
     - DPS 8 = second-highest in the RE family (333 Ceiling = 9 is the reference).
     - Mobility 5 is standard across all RE builds.
     - Recovery/Speed are this build's own read - edit freely.
     See javascripts/pentagon-badge.js top comment for the full scale writeup. -->
<div class="pentagon-badge" data-build="313-high-floor" data-family="re" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[KR Video Guide](https://www.youtube.com/watch?v=6ez2lS4AI6Q){ .video-chip }
</div>
</div>
</div>

## Skill Codes

!!! danger "Before importing"
    Make sure you've read [Essentials](essentials.md), then apply both "Ark Passive" and "Skill" to be safe. For [Gems](#gems), follow the guide.

=== "313 High Floor ★"

    ```
    3C737E487FD0FDB67FEB883196135CED1CE05F2123097ECB878B14A177BFE26890DDBB5C6AE3B18CB34871BBE1E17D0CC47A0DAFAE4272BEA4FD33FCF57AF2FC
    ```

=== "113 Arts (core-limited)"

    *Requires either a Lv 9+ Fatal Wave CD gem or Optimized Training 1.*

    ```
    E3818904D40CEFE43FC30B0715D4EF6850C4E0C2183E48110767499D73BEC3831EBB750B31176844599B47B861C731968F30681780A45447FAD8F209D8D99517
    ```

## Ark Setup

![313 Ark Passive/Grid tree](../assets/re/argrid-tree.png)

<div class="setup-panel" data-accent="pink" markdown>

<div class="ark-cores" data-family="re" markdown>
<script type="application/json">
[
  { "core": "sun", "label": "Levin Slash", "points": 3 },
  { "core": "moon", "label": "Arts Core", "points": 2 },
  { "core": "star", "label": "Death Sword Energy", "points": 2 }
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span> Ark Grid<span class="setup-note-arrow"></span></summary>

- The minimum requirement is shown above. Raise Moon to 17p for increased QoL and damage when you can.

</details>

<details class="setup-note" data-kind="example" markdown>
<summary><span class="setup-note-tag">Alt</span> Alternative Ark Grid core setup: 113 (Arts)<span class="setup-note-arrow"></span></summary>

<div class="ark-cores" data-family="re" markdown>
<script type="application/json">
[
  { "core": "sun", "label": "Art Master", "points": 0 },
  { "core": "moon", "label": "Arts Core", "points": 0 },
  { "core": "star", "label": "Death Sword Energy", "points": 2 }
]
</script>
</div>

- Same as 313 but **without** the Fatal Wave reset.
- Temporary core-limited option, it only requires a 14p Star.
- Requires Lv 9+ Fatal Wave CD gem or Optimized Training Lv 1.
    - Avoid +CD% bracelet line for this core-limited variant.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Note</span> Adjustments<span class="setup-note-arrow"></span></summary>

- Use the [Ark Passive Calculator](../resources.md#ark-passive-calculator) to optimize Evolution nodes if needed.
- Release Potential 3 / Instant Spell 3 / Awakening Amplifier 1 can solve mana issues at a minor DPS loss.
    - Not as comfortable with +CD% bracelet line and/or low Specialization.

</details>

</div>

</div>

## Skill Setup

<div class="setup-panel" data-accent="lavender" markdown>

<div class="skill-setup" data-family="re" markdown>
<script type="application/json">
[
  {"id": "soulabsorber", "name": "Soul Absorber", "level": 14, "tripods": [3, 1, 2], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "twinshadows", "name": "Twin Shadows", "level": 14, "tripods": [2, 1, 2], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "headhunt", "name": "Head Hunt", "level": 7, "tripods": [1, 2], "rune": {"tier": "legendary", "name": "Focus"}},
  {"id": "turningslash", "name": "Turning Slash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "maelstrom", "name": "Maelstrom", "level": 10, "tripods": [2, 1, 2], "rune": {"tier": "green", "name": "Wealth"}},
  {"id": "fatalwave", "name": "Fatal Wave", "level": 14, "tripods": [1, 3, 2], "rune": {"tier": "legendary", "name": "Wealth"}},
  {"id": "blitzrush", "name": "Blitz Rush", "level": 14, "tripods": [2, 1, 1], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "voidstrike", "name": "Void Strike", "level": 11, "tripods": [3, 1, 2], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "surge", "name": "Deathblade Surge", "subtitle": "Identity"},
  {"id": "deathlyslash", "name": "Deathly Slash", "subtitle": "Technique"},
  {"id": "bladeassault", "name": "Blade Assault", "subtitle": "Awakening"}
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span> Rune Adjustments<span class="setup-note-arrow"></span></summary>

- Use Legendary Galewind, Purify or green Wealth on Head Hunt if you have no mana issues.
- Legendary Focus on Maelstrom can solve mana issues at a minor loss of orb generation.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span> Skill Adjustments<span class="setup-note-arrow"></span></summary>

- You can bring Head Hunt down to Lv 1 and Void Strike up to Lv 14 for +0.5% DPS and lower mana use.
    - However, Lv 7 is more practical and makes recovery much easier and faster. ★
    - At Lv 7, Magick Control tripod can help solve mana issues if you don't need the CDR.
    - Lv 4 Head Hunt (Quick Prep) with Void Strike Lv 13 is a decent overall compromise.

</details>

<details class="setup-note" data-kind="danger" markdown>
<summary><span class="setup-note-tag">Warning</span> Upcoming Balance Patch (September) — build-specific changes<span class="setup-note-arrow"></span></summary>

- Swift Fingers may become the default 1st row tripod for Blitz Rush.
    - ~2% DPS loss but CPM and playability increases may make up for it.
    - Void Strike is raised to Lv 13 and Blitz Rush is lowered to Lv 12.
    - Gem priority of Void Strike and Blitz Rush is swapped.
- Needs live testing, 313 is so fast that it might not benefit fully.
- See [Essentials](essentials.md) for class-wide changes.

</details>

</div>

</div>

## Gems

<div class="gem-priority" markdown>

<div class="gem-col gem-col-dmg" markdown>
**Damage** — *Prioritize Fatal Wave or Surge.*

<div class="gem-row" markdown>
<span class="gem-chip"><span class="gem-num">1</span> ![](../assets/re/icon-surge.png) Surge</span>
<span class="gem-chip"><span class="gem-num">2</span> ![](../assets/re/icon-fatalwave.png) Fatal Wave</span>
<span class="gem-chip"><span class="gem-num">3</span> ![](../assets/re/icon-twinshadows.png) Twin Shadows</span>
<span class="gem-chip"><span class="gem-num">4</span> ![](../assets/re/icon-soulabsorber.png) Soul Absorber</span>
<span class="gem-chip"><span class="gem-num">5</span> ![](../assets/re/icon-turningslash.png) Turning Slash</span>
<span class="gem-chip"><span class="gem-num">6</span> ![](../assets/re/icon-blitzrush.png) Blitz Rush</span>
<span class="gem-chip"><span class="gem-num">7</span> ![](../assets/re/icon-voidstrike.png) Void Strike</span>
</div>
</div>

<div class="gem-col gem-col-cd" markdown>
**Cooldown** — *Playable with Lv 7s, ideally Lv 8s or higher.*

<div class="gem-row" markdown>
<span class="gem-chip"><span class="gem-num">1</span> ![](../assets/re/icon-maelstrom.png) Maelstrom</span>
<span class="gem-chip"><span class="gem-num">2</span> ![](../assets/re/icon-turningslash.png) Turning Slash</span>
</div>
</div>

</div>

**Cooldown (Optional)** — *Pick two, used for easier recovery.*

<div class="gem-row gem-row-optional" markdown>
<span class="gem-chip gem-chip-optional">![](../assets/re/icon-soulabsorber.png) Soul Absorber</span>
<span class="gem-chip gem-chip-optional">![](../assets/re/icon-voidstrike.png) Void Strike</span>
<span class="gem-chip gem-chip-optional">![](../assets/re/icon-blitzrush.png) Blitz Rush</span>
<span class="gem-chip gem-chip-optional">![](../assets/re/icon-twinshadows.png) Twin Shadows</span>
<span class="gem-chip gem-chip-optional">![](../assets/re/icon-fatalwave.png) Fatal Wave</span>
</div>

- Soul Absorber + Void Strike is the default, it grants mindless recovery in the worst case scenario.
- Blitz Rush + Twin Shadows is better for skilled players, it grants faster recovery from smaller mistakes.
- Fatal Wave + Blitz Rush **must** be used for 113 (Arts) or when sharing gems with [333 (Ceiling)](333-ceiling.md).

## Rotation

=== "Cycles"

    Use an **Opener**, then alternate between these two cycles as needed:

    <div class="cycle-card" markdown>
    <div class="cycle-card-header"><span class="cycle-num">1</span><span class="cycle-title">Void Strike + Deathly Slash</span></div>
    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/re/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-voidstrike.png)Void Strike</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-twinshadows.png)Twin Shadows</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-deathlyslash.png)Deathly Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-fatalwave.png)Fatal Wave</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-surge.png)Surge</span>
    </div>
    </div>

    <div class="cycle-card" markdown>
    <div class="cycle-card-header"><span class="cycle-num">2</span><span class="cycle-title">Soul Absorber + Blitz Rush</span></div>
    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/re/icon-soulabsorber.png)Soul Absorber</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-blitzrush.png)Blitz Rush</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-twinshadows.png)Twin Shadows</span><span class="arrow"> → </span><span class="skill skill-situational">![](../assets/re/icon-maelstrom.png)Maelstrom<span class="skill-situational-tag">situational</span></span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-fatalwave.png)Fatal Wave</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-surge.png)Surge</span>
    </div>
    </div>

    Aim to fit up to Cycle <span class="cycle-badge">2</span>'s Twin Shadows under Cycle <span class="cycle-badge">1</span>'s Maelstrom to reach 3 orbs without recasting or using recovery options. If you only landed up to Soul Absorber, an extra Head Hunt cast is usually enough.

    The Maelstrom in Cycle <span class="cycle-badge">2</span> is only cast if you'd otherwise miss 3 orbs. Use your judgment. If cast, it lasts at least until Cycle <span class="cycle-badge">1</span>'s Void Strike; recasting it as it expires aligns cooldowns. If it wasn't needed or it didn't last, nothing changes.

    !!! warning ""
        Void Strike and Maelstrom only give full orb generation up close. Avoid walking by using mobility skills to get closer to the target — e.g. Maelstrom → Twin Shadows → Void Strike and adapt to changes in your rotation.

=== "Openers"

    Openers stack Adrenaline and apply synergies efficiently. If it feels overwhelming, just apply synergy and Surge at full orbs; that's all you need to start the alternating cycles.

    *From 3 orbs (![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant):*
    { .lead }

    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/re/icon-headhunt.png)Head Hunt</span><span class="arrow"> ⇄ </span><span class="skill">![](../assets/re/icon-twinshadows.png)Twin Shadows</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-deathlyslash.png)Deathly Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-surge.png)Surge</span><span class="arrow"> → </span><span class="skill"><span class="cycle-num">2</span><span class="cycle-title">Soul Absorber + Blitz Rush Cycle</span></span><span class="arrow"> → </span><span class="skill"><span class="cycle-num">1</span><span class="cycle-title">Void Strike + Deathly Slash Cycle</span></span><span class="arrow"> → </span>&nbsp;etc.
    </div>

    - <span class="skill-chip">![](../assets/re/icon-bladeassault.png)Blade Assault</span> is interchangeable with Cycle <span class="cycle-badge">2</span> if it's available.
    - It's efficient to use ![](../assets/shared/icon-atropine.png){: .skill-icon } Atropine after Deathly Slash, with Blade Assault available.

    *From zero/partial orbs:*
    { .lead }

    - Cycle <span class="cycle-badge">1</span> if <span class="skill-chip">![](../assets/re/icon-deathlyslash.png)Deathly Slash</span> is available, otherwise start from <span class="skill-chip">![](../assets/re/icon-maelstrom.png)Maelstrom</span> + Cycle <span class="cycle-badge">2</span>.
    - Prioritize Turning Slash earlier for synergy and Deathly Slash last for Adrenaline/RE buff.

=== "Recovery"

    !!! example ""
        Watch this 2-minute [333 recovery video](https://www.youtube.com/watch?v=4478vFVX4VA) and read the segment titles.

    - 313 plays similarly, just Turning Slash → Fatal Wave instead of FTF.
    - Use <span class="skill-chip">![](../assets/re/icon-headhunt.png)Head Hunt</span> when a little short on orbs, just cast if unsure.
    - Use spare Twin Shadows/Maelstrom stacks and/or Blitz Rush if you miss major skills.
    - Use <span class="skill-chip">![](../assets/re/icon-headhunt.png)Head Hunt</span> instead of <span class="skill-chip">![](../assets/re/icon-twinshadows.png)Twin Shadows</span> for a cycle to recover stacks if they run out.
    - Use Maelstrom + Fatal Wave earlier if waiting on main orb generation skills.

=== "TL;DR:"
    ![313 TL;DR flowchart](../assets/re/tldr-313.png)

## DPS Spread

<p class="dps-showcase-caption">Ancient cores, full Lv 10 gems</p>

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-icon-base="re" data-labels="Deathly Slash,Fatal Wave,Surge,Twin Shadows,Soul Absorber,Turning Slash,Blitz Rush,Void Strike,Bleed,Maelstrom" data-values="20.9,20.7,19.1,9.5,8.5,8,6.9,5.5,0.6,0.3"></div>
</div>
</div>