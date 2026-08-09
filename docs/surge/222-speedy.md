# 222 (Speedy) 🐆

<p class="page-banner page-banner-warning">Not available in NA servers yet</p>

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-08-07" markdown>

<div class="build-stats">
<div class="stat"><span class="stat-label">Difficulty</span><span class="stat-value">7 / 10</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width: 70%"></div></div></div>
<div class="stat"><span class="stat-label">Trixion DPS</span><span class="stat-value">1.22 Multiplier</span><div class="stat-bar-track stat-bar-track-teal"><div class="stat-bar-fill stat-bar-fill-teal" style="width: 73%"></div></div></div>
<div class="stat"><span class="stat-label">Playstyle</span><span class="stat-value">Max Mobility</span></div>
</div>

**Best For:**{: .best-for } Players who want something easy to pick up but difficult to master.

**Tradeoff:**{: .tradeoff } Increased back attack stress and uptime requirements.

- Simple uptime-focused gameplay with no gimmicks.
- Highest mobility of all Deathblade builds by far.
- Counter is used in rotation, you must hold it when necessary.
- Very high gem efficiency, Surge and Deathly Slash are nearly all of your DPS.
- Must constantly balance Surge and Deathly Slash back attack rate with Surge CPM.

</div>
<!-- Build profile pentagon. Order: Difficulty, DPS, Mobility, Exposure, Speed (0-10).
     - DPS 8.5 = second-highest in the Surge family (111 Classic = 9 is
       the family's reference, standardized against 333 Ceiling in RE -
       see javascripts/pentagon-badge.js top comment).
     - Exposure (not Recovery) for Surge builds: back-attack/positional
       risk, HIGHER IS WORSE here unlike every other axis - keep the
       data-caption below in sync if you tweak this value.
     - Mobility/Speed are this build's own read - edit freely. -->
<div class="pentagon-badge" data-build="222-speedy" data-family="surge" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[KR Video Guide](https://www.youtube.com/watch?v=pzFa5zOuNik){ .video-chip } [Video Gameplay](https://www.youtube.com/watch?v=lbBLRwdEvgk){ .video-chip }
</div>
</div>
</div>

## Skill Codes

!!! danger "Before importing"
    Make sure you've read [Essentials](essentials.md), then apply both "Ark Passive" and "Skill" to be safe. For [Gems](#gems), follow the guide.

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

![222 Ark Passive/Grid tree](../assets/surge/argrid-tree-222.png)

<div class="setup-panel" data-accent="pink" markdown>

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

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Note</span>Ark Grid<span class="setup-note-arrow"></span></summary>

- Damage and QoL will be lacking if you settle for the minimum core requirements.

</details>

</div>

</div>

## Skill Setup

<div class="setup-panel" data-accent="lavender" markdown>

<div class="skill-setup" data-family="surge" markdown>
<script type="application/json">
[
  {"id": "surpriseattack", "name": "Surprise Attack", "level": 10, "tripods": [1, 1, 1], "rune": {"tier": "legendary", "name": "Rage"}},
  {"id": "windcut", "name": "Wind Cut", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "spincutter", "name": "Spincutter", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "bladedance", "name": "Blade Dance", "level": 14, "tripods": [1, 1, 2], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "darkaxel", "name": "Dark Axel", "level": 10, "tripods": [1, 1, 2], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "earthcleaver", "name": "Earth Cleaver", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Vision"}},
  {"id": "turningslash", "name": "Turning Slash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "legendary", "name": "Poison"}},
  {"id": "maelstrom", "name": "Maelstrom", "level": 10, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Focus"}},
  {"id": "surge", "name": "Deathblade Surge", "subtitle": "Identity"},
  {"id": "deathlyslash", "name": "Deathly Slash", "subtitle": "Technique"},
  {"id": "bladeassault", "name": "Blade Assault", "subtitle": "Awakening"}
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
<summary><span class="setup-note-tag">Alternative</span>Upper Slash<span class="setup-note-arrow"></span></summary>

- You can gain more comfort at a DPS loss by replacing Spincutter or Dark Axel for Upper Slash.
- Upper Slash is a push immune skill that generates 5 stacks and allows you to skip Earth Cleaver casts.
    - Set Upper Slash to use 2-3-2 tripods and give it an Epic Galewind rune.
    - Lower Earth Cleaver's skill level to 10 and raise Upper Slash to level 14.
    - Replace both Earth Cleaver gems for Upper Slash CD and another gem of your liking.
    - Alternatively, keep Earth Cleaver as is and only use Upper Slash as a safety net.

</details>

</div>

</div>

## Gems

<div class="gem-priority" markdown>

<div class="gem-col gem-col-dmg" markdown>
**Damage** — *Prioritize Surge. Surge is everything.*

<div class="gem-row" markdown>
<span class="gem-chip"><span class="gem-num">1</span> ![](../assets/surge/icon-surge.png) Surge</span>
<span class="gem-chip"><span class="gem-num">2</span> ![](../assets/surge/icon-bladedance.png) Blade Dance</span>
<span class="gem-chip"><span class="gem-num">3</span> ![](../assets/surge/icon-earthcleaver.png) Earth Cleaver</span>
<span class="gem-chip"><span class="gem-num">4</span> ![](../assets/surge/icon-turningslash.png) Turning Slash</span>
<span class="gem-chip"><span class="gem-num">5</span> ![](../assets/surge/icon-windcut.png) Wind Cut</span>
</div>

You can replace Wind Cut damage for Dark Axel CD.

</div>

<div class="gem-col gem-col-cd" markdown>
**Cooldown** — *Playable with Lv 7s, ideally Lv 8s or higher.*

<div class="gem-row" markdown>
<span class="gem-chip"><span class="gem-num">1</span> ![](../assets/surge/icon-windcut.png) Wind Cut</span>
<span class="gem-chip"><span class="gem-num">2</span> ![](../assets/surge/icon-surpriseattack.png) Surprise Attack</span>
<span class="gem-chip"><span class="gem-num">3</span> ![](../assets/surge/icon-bladedance.png) Blade Dance</span>
<span class="gem-chip"><span class="gem-num">4</span> ![](../assets/surge/icon-turningslash.png) Turning Slash</span>
<span class="gem-chip"><span class="gem-num">5</span> ![](../assets/surge/icon-earthcleaver.png) Earth Cleaver</span>
<span class="gem-chip"><span class="gem-num">6</span> ![](../assets/surge/icon-maelstrom.png) Maelstrom</span>
</div>
</div>

</div>

## Rotation

There's an optimal skill order, but you have flexibility when facing downtime or weaving in mobility skills.

Use Spincutter and Dark Axel to guarantee back attacks on Deathly Slash and Surge.

'Destiny: Sharp Senses' can be stacked up to 5 times by using [Normal] skills to empower Deathly Slash.

Apply damage synergy if needed, then use the main cycle and repeat it relentlessly.

*From 3 orbs:*
{ .lead }

=== "Main Cycle"

    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathtrance.png)Death Trance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surpriseattack.png)Surprise Attack</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-earthcleaver.png)Earth Cleaver</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-bladedance.png)Blade Dance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathlyslash.png)Deathly Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surpriseattack.png)Surprise Attack</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surge.png)Surge</span>
    </div>

    - Cast <span class="skill-chip">![](../assets/surge/icon-spincutter.png)Spincutter</span> instead of <span class="skill-chip">![](../assets/surge/icon-earthcleaver.png)Earth Cleaver</span> as needed.
    - Cast <span class="skill-chip">![](../assets/surge/icon-bladeassault.png)Blade Assault</span> whenever you want, I'm not your mom.
    - You don't strictly have to cast Wind Cut before Death Trance for this build.

=== "Upper Slash"

    *Main cycle for the Upper Slash skill setup.*
    { .lead }

    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathtrance.png)Death Trance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surpriseattack.png)Surprise Attack</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-upperslash.png)Upper Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-bladedance.png)Blade Dance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathlyslash.png)Deathly Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surpriseattack.png)Surprise Attack</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surge.png)Surge</span>
    </div>

    - Cast <span class="skill-chip">![](../assets/surge/icon-bladeassault.png)Blade Assault</span> whenever you want, I'm not your mom.
    - You don't strictly have to cast Wind Cut before Death Trance for this build.

*From zero orbs:*
{ .lead }

1. Use a ![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant (recommended) or proceed to #2.
2. Generate one orb, build at least 40 stacks, then Surge to refill all 3 orbs.

## DPS Spread

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-icon-base="surge" data-labels="Surge,Deathly Slash,Blade Dance,Earth Cleaver,Turning Slash,Wind Cut" data-values="47.67,30.59,6.64,4.79,3.09,3"></div>
</div>
</div>