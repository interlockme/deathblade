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
{
  "columns": [
    { "id": "evolution", "label": "Evolution", "points": 140, "tiers": [
      { "label": "Tier 1", "nodes": [
        { "name": "Crit", "level": 10, "max": 30, "icon": "ap-icons/critical.png" },
        { "name": "Specialization", "level": 30, "max": 30, "icon": "ap-icons/specialization.png" }
      ] },
      { "label": "Tier 2", "nodes": [
        { "name": "Keen Sense", "level": 2, "max": 2, "icon": "ap-icons/keen-sense.png" },
        { "name": "Limit Break", "level": 1, "max": 3, "icon": "ap-icons/limit-break-evo.png" }
      ] },
      { "label": "Tier 3", "nodes": [
        { "name": "Strike", "level": 2, "max": 2, "icon": "ap-icons/strike.png" }
      ] },
      { "label": "Tier 4", "nodes": [
        { "name": "Master", "level": 1, "max": 1, "icon": "ap-icons/master.png" },
        { "name": "Pulverize", "level": 1, "max": 1, "icon": "ap-icons/pulverize.png" }
      ] },
      { "label": "Tier 5", "nodes": [
        { "name": "Standing Striker", "level": 2, "max": 2, "icon": "ap-icons/standing-striker.png" }
      ] }
    ] },
    { "id": "enlightenment", "label": "Enlightenment", "points": 100, "tiers": [
      { "label": "Tier 1", "nodes": [
        { "name": "Swift Strike", "level": 1, "max": 1, "icon": "ap-icons/swift-strike.png" }
      ] },
      { "label": "Tier 2", "nodes": [
        { "name": "Remaining Energy", "level": 3, "max": 3, "icon": "ap-icons/remaining-energy.png" }
      ] },
      { "label": "Tier 3", "nodes": [
        { "name": "Firm Will", "level": 3, "max": 3, "icon": "ap-icons/firm-will.png" },
        { "name": "Swordcraft Enhancement", "level": 1, "max": 5, "icon": "ap-icons/swordcraft-enhancement.png" }
      ] },
      { "label": "Tier 4", "nodes": [
        { "name": "Extreme Body Movement", "level": 2, "max": 3, "icon": "ap-icons/extreme-body-movement.png" },
        { "name": "Orb Circulation", "level": 5, "max": 5, "icon": "ap-icons/orb-circulation.png" }
      ] }
    ] },
    { "id": "leap", "label": "Leap", "points": 70, "tiers": [
      { "label": "Tier 1", "nodes": [
        { "name": "Awakening Amplifier", "level": 1, "max": 3, "icon": "ap-icons/awakening-amplifier.png" },
        { "name": "Unleashed Power", "level": 5, "max": 5, "icon": "ap-icons/unleashed-power.png" },
        { "name": "Release Potential", "level": 3, "max": 5, "icon": "ap-icons/release-potential.png" },
        { "name": "Instant Spell", "level": 3, "max": 3, "icon": "ap-icons/instant-spell.png" }
      ] },
      { "label": "Tier 2", "nodes": [
        { "name": "Dance of Nightmares", "level": 3, "max": 3, "icon": "ap-icons/dance-of-nightmares.png" }
      ] }
    ] }
  ]
}
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
  {"id": "soulabsorber", "name": "Soul Absorber", "level": 14, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Wealth"}},
  {"id": "deathsentence", "name": "Death Sentence", "level": 14, "tripods": [2, 2, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "twinshadows", "name": "Twin Shadows", "level": 14, "tripods": [2, 1, 2], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "headhunt", "name": "Head Hunt", "level": 7, "tripods": [2, 2], "rune": {"tier": "green", "name": "Wealth"}},
  {"id": "turningslash", "name": "Turning Slash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "maelstrom", "name": "Maelstrom", "level": 10, "tripods": [2, 1, 2], "rune": {"tier": "blue", "name": "Wealth"}},
  {"id": "blitzrush", "name": "Blitz Rush", "level": 14, "tripods": [2, 1, 1], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "voidstrike", "name": "Void Strike", "level": 11, "tripods": [3, 1, 2], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "surge", "name": "Surge", "subtitle": "Identity"},
  {"id": "deathlyslash", "name": "Deathly Slash", "subtitle": "Technique"},
  {"id": "bladeassault", "name": "Blade Assault", "subtitle": "Awakening"}
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

<div class="gem-col gem-col-dmg" markdown>
<div class="gem-col-header" markdown>
<span class="gem-col-title">Damage</span>
</div>

<div class="gem-list" markdown>
<div class="gem-item" data-rank="1" markdown>
<span class="gem-item-rank">1</span>
![](../assets/shared/icon-surge.png){: .gem-item-icon } <span class="gem-item-name">Surge</span>
</div>
<div class="gem-item" data-rank="2" markdown>
<span class="gem-item-rank">2</span>
![](../assets/shared/icon-deathsentence.png){: .gem-item-icon } <span class="gem-item-name">Death Sentence</span>
</div>
<div class="gem-item" data-rank="3" markdown>
<span class="gem-item-rank">3</span>
![](../assets/shared/icon-twinshadows.png){: .gem-item-icon } <span class="gem-item-name">Twin Shadows</span>
</div>
<div class="gem-item" data-rank="4" markdown>
<span class="gem-item-rank">4</span>
![](../assets/shared/icon-turningslash.png){: .gem-item-icon } <span class="gem-item-name">Turning Slash</span>
</div>
<div class="gem-item" data-rank="5" markdown>
<span class="gem-item-rank">5</span>
![](../assets/shared/icon-soulabsorber.png){: .gem-item-icon } <span class="gem-item-name">Soul Absorber</span>
</div>
<div class="gem-item" data-rank="6" markdown>
<span class="gem-item-rank">6</span>
![](../assets/shared/icon-blitzrush.png){: .gem-item-icon } <span class="gem-item-name">Blitz Rush</span>
</div>
<div class="gem-item" data-rank="7" markdown>
<span class="gem-item-rank">7</span>
![](../assets/shared/icon-voidstrike.png){: .gem-item-icon } <span class="gem-item-name">Void Strike</span>
</div>
</div>
</div>

<div class="gem-col gem-col-cd" markdown>
<div class="gem-col-header" markdown>
<span class="gem-col-title">Cooldown</span>
</div>

<div class="gem-list" markdown>
<div class="gem-item" data-rank="1" markdown>
<span class="gem-item-rank">1</span>
![](../assets/shared/icon-maelstrom.png){: .gem-item-icon } <span class="gem-item-name">Maelstrom</span>
</div>
<div class="gem-item" data-rank="2" markdown>
<span class="gem-item-rank">2</span>
![](../assets/shared/icon-blitzrush.png){: .gem-item-icon } <span class="gem-item-name">Blitz Rush</span>
</div>
<div class="gem-item" data-rank="3" markdown>
<span class="gem-item-rank">3</span>
![](../assets/shared/icon-headhunt.png){: .gem-item-icon } <span class="gem-item-name">Head Hunt</span>
</div>
<div class="gem-item" data-rank="4" markdown>
<span class="gem-item-rank">4</span>
![](../assets/shared/icon-turningslash.png){: .gem-item-icon } <span class="gem-item-name">Turning Slash</span>
</div>
</div>
</div>

</div>

</div>

## Rotation

=== "Cycles"

    Use an **Opener**, then alternate between these two cycles as needed:

    <div class="cycle-card" markdown>
    <div class="cycle-card-header"><span class="cycle-num">1</span><span class="cycle-title">Void Strike + Deathly Slash</span></div>
    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/shared/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-voidstrike.png)Void Strike</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-twinshadows.png)Twin Shadows</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-headhunt.png)Head Hunt</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-deathlyslash.png)Deathly Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-deathsentence.png)Death Sentence</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-surge.png)Surge</span>
    </div>
    </div>

    <div class="cycle-card" markdown>
    <div class="cycle-card-header"><span class="cycle-num">2</span><span class="cycle-title">Soul Absorber + Blitz Rush</span></div>
    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/shared/icon-soulabsorber.png)Soul Absorber</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-blitzrush.png)Blitz Rush</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-twinshadows.png)Twin Shadows</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-deathsentence.png)Death Sentence</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill skill-situational">![](../assets/shared/icon-headhunt.png)Head Hunt<span class="skill-situational-tag">situational</span></span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-surge.png)Surge</span>
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
    <span class="skill">![](../assets/shared/icon-headhunt.png)Head Hunt</span><span class="arrow"> ⇄ </span><span class="skill">![](../assets/shared/icon-twinshadows.png)Twin Shadows</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-deathsentence.png)Death Sentence</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-deathlyslash.png)Deathly Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/shared/icon-surge.png)Surge</span><span class="arrow"> → </span><span class="skill"><span class="cycle-num">2</span><span class="cycle-title">Soul Absorber + Blitz Rush Cycle</span></span><span class="arrow"> → </span><span class="skill"><span class="cycle-num">1</span><span class="cycle-title">Void Strike + Deathly Slash Cycle</span></span><span class="arrow"> → </span>&nbsp;etc.
    </div>

    - <span class="skill-chip">![](../assets/shared/icon-bladeassault.png)Blade Assault</span> is interchangeable with Cycle **2** if it's available.
    - It's efficient to use ![](../assets/shared/icon-atropine.png){: .skill-icon } Atropine after Deathly Slash, with Blade Assault available.

    *From zero/partial orbs:*
    { .lead }

    - Cycle **1** if <span class="skill-chip">![](../assets/shared/icon-deathlyslash.png)Deathly Slash</span> is available, otherwise start from <span class="skill-chip">![](../assets/shared/icon-maelstrom.png)Maelstrom</span> + Cycle **2**.

=== "Recovery"

    !!! example ""
        Watch this 54-minute [111 recovery video](https://www.youtube.com/watch?v=z8KE3HG_ggg) or consider an easier build.

    - Use spare Twin Shadows/Maelstrom stacks and/or Blitz Rush if you miss major skills.

## DPS Spread

<p class="dps-showcase-caption">Ancient cores, full Lv 10 gems</p>

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-show-icons data-labels="Deathly Slash,Surge,Death Sentence,Turning Slash,Twin Shadows,Soul Absorber,Blitz Rush,Void Strike,Bleed,Head Hunt,Maelstrom" data-values="21,18.8,16.6,11.6,10.6,8,6.6,5.5,0.6,0.3,0.3"></div>
</div>
</div>