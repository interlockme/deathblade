# 333 (Blitz) <span class="tiger-emoji" title="rawr">🐯</span>

<p class="page-banner page-banner-warning">Not available in NA/EU servers yet</p>

??? danger "But why male models? 🐯 "
    ![333 Blitz meme](../assets/surge/blitz-meme.png)

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-08-07" markdown>

<div class="build-stats">
<div class="stat"><span class="stat-label">Difficulty</span><span class="stat-value">8 / 10</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width: 80%"></div></div></div>
<div class="stat"><span class="stat-label">Trixion DPS</span><span class="stat-value">1.20 Multiplier</span><div class="stat-bar-track stat-bar-track-teal"><div class="stat-bar-fill stat-bar-fill-unconfirmed" style="width: 67%"></div></div></div>
<div class="stat"><span class="stat-label">Playstyle</span><span class="stat-value">Skill Reset</span></div>
</div>

**Best For:**{: .best-for } Erm.

**Tradeoff:**{: .tradeoff } The juice is not worth the squeeze.

- Uses Blitz Rush as two fast casts (BTB combo) via a skill reset.
- High gem efficiency, Surge and Blitz Rush are most of your DPS.
- Must balance Surge, Blitz Rush, and Deathly Slash back attack rate with Surge CPM.

</div>
<!-- Build profile pentagon. Order: Difficulty, DPS, Mobility, Exposure, Speed (0-10).
     - DPS 8 = third/lowest in the Surge family (111 Classic = 9 is the
       reference); unconfirmed same as the underlying Trixion multiplier
       above - bump this once that's confirmed.
     - Mobility 8.5 (nudged down 0.5 from the other Surge builds' usual
       step - was 9, nerfed per a manual call, not a formula).
     - Exposure (not Recovery) for Surge builds: back-attack/positional
       risk, HIGHER IS WORSE here unlike every other axis - keep the
       data-caption below in sync if you tweak this value.
     - Speed is this build's own read - edit freely. -->
<div class="pentagon-badge" data-build="333-blitz" data-family="surge" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[Video Guide](https://www.youtube.com/watch?v=pzFa5zOuNik){ .video-chip } [Gameplay](../assets/surge/tiger.mp4){ .video-chip }
</div>
</div>
</div>

## Skill Codes

!!! danger "Before importing"
    Make sure you've read [Essentials](essentials.md), then apply both "Ark Passive" and "Skill" to be safe. For [Gems](#gems), follow the guide.

=== "333 Blitz"

    ```
    99BD58624912EBBA0541BB2C16E16B2414D9FA6C556F53629FEB8DE2EA19F8A88692799FB7847B4E33257BC8D5A3480A36B6DE069816AB3CC2DEAC0F7570A7EF
    ```

## Ark Setup

<div class="setup-panel" data-accent="lavender" markdown>

<div class="ark-passives" data-family="surge" markdown>
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
        { "name": "Surge Enhancement", "level": 1, "max": 1, "icon": "ap-icons/surge-enhancement.png" }
      ] },
      { "label": "Tier 2", "nodes": [
        { "name": "Orb Compression", "level": 3, "max": 3, "icon": "ap-icons/orb-compression.png" }
      ] },
      { "label": "Tier 3", "nodes": [
        { "name": "Orb Control", "level": 1, "max": 5, "icon": "ap-icons/orb-control.png" },
        { "name": "Limit Break", "level": 3, "max": 3, "icon": "ap-icons/limit-break-enl.png" }
      ] },
      { "label": "Tier 4", "nodes": [
        { "name": "Chaos Infusion", "level": 1, "max": 5, "icon": "ap-icons/chaos-infusion.png" },
        { "name": "Chaotic Power", "level": 3, "max": 3, "icon": "ap-icons/chaotic-power.png" }
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
        { "name": "Dance of Screams", "level": 3, "max": 3, "icon": "ap-icons/dance-of-screams.png" }
      ] }
    ] }
  ]
}
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
<summary><span class="setup-note-tag">Note</span>Ark Grid<span class="setup-note-arrow"></span></summary>

- Damage will be lacking if you settle for the minimum core requirements.

</details>

</div>

</div>

## Skill Setup

<div class="setup-panel" data-accent="lavender" markdown>

<div class="skill-setup" data-family="surge" markdown>
<script type="application/json">
[
  {"id": "surpriseattack", "name": "Surprise Attack", "level": 10, "tripods": [1, 1, 1], "rune": {"tier": "epic", "name": "Rage"}},
  {"id": "windcut", "name": "Wind Cut", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "spincutter", "name": "Spincutter", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "bladedance", "name": "Blade Dance", "level": 14, "tripods": [1, 2, 2], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "earthcleaver", "name": "Earth Cleaver", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Vision"}},
  {"id": "turningslash", "name": "Turning Slash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "legendary", "name": "Rage"}},
  {"id": "maelstrom", "name": "Maelstrom", "level": 10, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Focus"}},
  {"id": "blitzrush", "name": "Blitz Rush", "level": 14, "tripods": [2, 1, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "deathtrance", "name": "Death Trance", "subtitle": "Identity"},
  {"id": "deathlyslash", "name": "Deathly Slash", "subtitle": "Technique"},
  {"id": "bladeassault", "name": "Blade Assault", "subtitle": "Awakening"},
  {"id": "surge", "name": "Surge", "subtitle": "Identity"}
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
- Head Hunt can be used instead of Earth Cleaver at a DPS loss if you prefer it.

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
![](../assets/surge/icon-surge.png){: .gem-item-icon } <span class="gem-item-name">Surge</span>
</div>
<div class="gem-item" data-rank="2" markdown>
<span class="gem-item-rank">2</span>
![](../assets/surge/icon-blitzrush.png){: .gem-item-icon } <span class="gem-item-name">Blitz Rush</span>
</div>
<div class="gem-item" data-rank="3" markdown>
<span class="gem-item-rank">3</span>
![](../assets/surge/icon-bladedance.png){: .gem-item-icon } <span class="gem-item-name">Blade Dance</span>
</div>
<div class="gem-item" data-rank="4" markdown>
<span class="gem-item-rank">4</span>
![](../assets/surge/icon-earthcleaver.png){: .gem-item-icon } <span class="gem-item-name">Earth Cleaver</span>
</div>
<div class="gem-item" data-rank="5" markdown>
<span class="gem-item-rank">5</span>
![](../assets/surge/icon-turningslash.png){: .gem-item-icon } <span class="gem-item-name">Turning Slash</span>
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
![](../assets/surge/icon-windcut.png){: .gem-item-icon } <span class="gem-item-name">Wind Cut</span>
</div>
<div class="gem-item" data-rank="2" markdown>
<span class="gem-item-rank">2</span>
![](../assets/surge/icon-blitzrush.png){: .gem-item-icon } <span class="gem-item-name">Blitz Rush</span>
</div>
<div class="gem-item" data-rank="3" markdown>
<span class="gem-item-rank">3</span>
![](../assets/surge/icon-bladedance.png){: .gem-item-icon } <span class="gem-item-name">Blade Dance</span>
</div>
<div class="gem-item" data-rank="4" markdown>
<span class="gem-item-rank">4</span>
![](../assets/surge/icon-surpriseattack.png){: .gem-item-icon } <span class="gem-item-name">Surprise Attack</span>
</div>
<div class="gem-item" data-rank="5" markdown>
<span class="gem-item-rank">5</span>
![](../assets/surge/icon-maelstrom.png){: .gem-item-icon } <span class="gem-item-name">Maelstrom</span>
</div>
<div class="gem-item" data-rank="6" markdown>
<span class="gem-item-rank">6</span>
![](../assets/surge/icon-earthcleaver.png){: .gem-item-icon } <span class="gem-item-name">Earth Cleaver</span>
</div>
</div>
</div>

</div>

</div>

## Rotation

There's an optimal skill order, but you have flexibility when facing downtime or weaving in mobility skills.

Spincutter is your main mobility skill and backup stack builder. Use it to guarantee back attacks on your major skills.

Apply damage synergy if needed, then use the main cycle and repeat it as best you can.

*From 3 orbs:*
{ .lead }

=== "Main Cycle"

    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathtrance.png)Death Trance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surpriseattack.png)Surprise Attack</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-earthcleaver.png)Earth Cleaver</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-bladedance.png)Blade Dance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathlyslash.png)Deathly Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-blitzrush.png)Blitz Rush</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-blitzrush.png)Blitz Rush</span><span class="arrow"> → </span><span class="skill skill-situational">![](../assets/surge/icon-surpriseattack.png)Surprise Attack<span class="skill-situational-tag">situational</span></span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surge.png)Surge</span>
    </div>

    - Consider delaying Maelstrom by 1 to 3 skills when uptime drops to ensure it covers Surge.

=== "Awakening Cycle"

    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathtrance.png)Death Trance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surpriseattack.png)Surprise Attack</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-bladeassault.png)Blade Assault</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathlyslash.png)Deathly Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-blitzrush.png)Blitz Rush</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surge.png)Surge</span>
    </div>

*From zero orbs:*
{ .lead }

1. Use a ![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant (recommended) or proceed to #2.
2. Generate one orb, build at least 40 stacks, then Surge to refill all 3 orbs.

## DPS Spread

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-icon-base="surge" data-labels="Surge,Blitz Rush,Deathly Slash,Blade Dance,Earth Cleaver" data-values="43.89,26.99,12.85,4.21,4.04"></div>
</div>
</div>