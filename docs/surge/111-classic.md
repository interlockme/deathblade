# 111 (Classic) 🦁

<p class="page-banner page-banner-warning">Not available in NA servers yet</p>

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-08-07" markdown>

<div class="build-stats">
<div class="stat"><span class="stat-label">Difficulty</span><span class="stat-value">7.5 / 10</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width: 75%"></div></div></div>
<div class="stat"><span class="stat-label">Trixion DPS</span><span class="stat-value">1.23 Multiplier</span><div class="stat-bar-track stat-bar-track-teal"><div class="stat-bar-fill stat-bar-fill-teal" style="width: 77%"></div></div></div>
<div class="stat"><span class="stat-label">Playstyle</span><span class="stat-value">Burst Combo</span></div>
</div>

**Best For:**{: .best-for } Players who enjoy building up to one massive, satisfying Surge hit.

**Tradeoff:**{: .tradeoff } All your eggs are in one basket (Surge).

- Satisfying burst windows with the Breaking Moon → Surge combo.
- No need to hold Counter, it charges up to two stacks.
- Very high gem efficiency, Surge is nearly all of your DPS.
- Accessible from zero Ark Grid cores with minor adjustments.
- Must constantly balance Surge back attack rate with Surge CPM.

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

!!! danger "Before importing"
    Make sure you've read [Essentials](essentials.md), then apply both "Ark Passive" and "Skill" to be safe. For [Gems](#gems), follow the guide.

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
        { "name": "Path of the Blade", "level": 3, "max": 3, "icon": "ap-icons/path-of-the-blade.png" }
      ] }
    ] }
  ]
}
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

<details class="setup-note" data-kind="note" open markdown>
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
  {"id": "surpriseattack", "name": "Surprise Attack", "level": 10, "tripods": [1, 1, 1], "rune": {"tier": "legendary", "name": "Rage"}},
  {"id": "windcut", "name": "Wind Cut", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "spincutter", "name": "Spincutter", "level": 10, "tripods": [3, 3, 1], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "bladedance", "name": "Blade Dance", "level": 14, "tripods": [1, 2, 2], "rune": {"tier": "epic", "name": "Galewind"}},
  {"id": "earthcleaver", "name": "Earth Cleaver", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Vision"}},
  {"id": "turningslash", "name": "Turning Slash", "level": 14, "tripods": [1, 3, 1], "rune": {"tier": "epic", "name": "Rage"}},
  {"id": "maelstrom", "name": "Maelstrom", "level": 10, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Focus"}},
  {"id": "blitzrush", "name": "Blitz Rush", "level": 14, "tripods": [1, 1, 2], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "deathtrance", "name": "Death Trance", "subtitle": "Identity"},
  {"id": "breakingmoon", "name": "Breaking Moon", "subtitle": "Technique"},
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
- Dark Axel (1-1-2 tripods) can be used instead of Spincutter if you prefer it.

</details>

</div>

</div>

## Gems

<div class="setup-panel" data-accent="lavender" markdown>

<div class="gem-priority" markdown>

<div class="gem-col gem-col-dmg" markdown>
<div class="gem-col-header" markdown>
![](../assets/shared/damagegem.png){: .gem-type-icon } <span class="gem-col-title">Damage</span>
</div>

<div class="gem-row" markdown>
<span class="gem-chip"><span class="gem-num">1</span> ![](../assets/surge/icon-surge.png) Surge</span>
<span class="gem-chip"><span class="gem-num">2</span> ![](../assets/surge/icon-earthcleaver.png) Earth Cleaver</span>
<span class="gem-chip"><span class="gem-num">3</span> ![](../assets/surge/icon-bladedance.png) Blade Dance</span>
<span class="gem-chip"><span class="gem-num">4</span> ![](../assets/surge/icon-blitzrush.png) Blitz Rush</span>
<span class="gem-chip"><span class="gem-num">5</span> ![](../assets/surge/icon-turningslash.png) Turning Slash</span>
</div>
</div>

<div class="gem-col gem-col-cd" markdown>
<div class="gem-col-header" markdown>
![](../assets/shared/cooldowngem.png){: .gem-type-icon } <span class="gem-col-title">Cooldown</span>
</div>

<div class="gem-row" markdown>
<span class="gem-chip"><span class="gem-num">1</span> ![](../assets/surge/icon-windcut.png) Wind Cut</span>
<span class="gem-chip"><span class="gem-num">2</span> ![](../assets/surge/icon-blitzrush.png) Blitz Rush</span>
<span class="gem-chip"><span class="gem-num">3</span> ![](../assets/surge/icon-maelstrom.png) Maelstrom</span>
<span class="gem-chip"><span class="gem-num">4</span> ![](../assets/surge/icon-bladedance.png) Blade Dance</span>
<span class="gem-chip"><span class="gem-num">5</span> ![](../assets/surge/icon-turningslash.png) Turning Slash</span>
<span class="gem-chip"><span class="gem-num">6</span> ![](../assets/surge/icon-surpriseattack.png) Surprise Attack</span>
</div>
</div>

</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Gem Basics<span class="setup-note-arrow"></span></summary>

- Level your #1 priority gem in each column first.
- Playable with Lv 7s, ideally Lv 8s or higher.

</details>

<details class="setup-note" data-kind="note" markdown>
<summary><span class="setup-note-tag">Note</span>Pre-Ark Grid<span class="setup-note-arrow"></span></summary>

- Earth Cleaver CD must be used instead of Blade Dance CD pre-Ark Grid.
    - Use Quick Prep tripod on Blade Dance to compensate.

</details>

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
    <span class="skill skill-situational">![](../assets/surge/icon-turningslash.png) or ![](../assets/surge/icon-surpriseattack.png)<span class="skill-situational-tag">synergy/adrenaline</span></span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathtrance.png)Death Trance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surpriseattack.png)Surprise Attack</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-breakingmoon.png)Breaking Moon</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surge.png)Surge</span>
    </div>

    - If you already have a Maelstrom (or Rage) buff of 3 seconds or more, do not cast it.

=== "Main Cycle"

    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathtrance.png)Death Trance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surpriseattack.png)Surprise Attack</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-earthcleaver.png)Earth Cleaver</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-bladedance.png)Blade Dance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-blitzrush.png)Blitz Rush</span><span class="arrow"> → </span><span class="skill skill-situational">![](../assets/surge/icon-surpriseattack.png)Surprise Attack<span class="skill-situational-tag">situational</span></span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surge.png)Surge</span>
    </div>

    - Consider delaying Maelstrom by 1 to 3 skills when uptime drops to ensure it covers Surge (Raid Captain).

=== "Main Cycle (RC+MI)"

    *Alternate main cycle meant to try-hard RC+MI efficiency.*
    { .lead }

    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/surge/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathtrance.png)Death Trance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surpriseattack.png)Surprise Attack</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-earthcleaver.png)Earth Cleaver</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-bladedance.png)Blade Dance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-blitzrush.png)Blitz Rush</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surpriseattack.png)Surprise Attack</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surge.png)Surge</span>
    </div>

    - Use your judgment. Not every skill needs the Maelstrom buff, so prioritize Surge.
    - Consider skipping Maelstrom to conserve a stack for later use if you received a Rage buff.

=== "Awakening Cycle"

    <div class="rotation-line" markdown>
    <span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-deathtrance.png)Death Trance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surpriseattack.png)Surprise Attack</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-windcut.png)Wind Cut</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-bladedance.png)Blade Dance</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-bladeassault.png)Blade Assault</span><span class="arrow"> → </span><span class="skill">![](../assets/surge/icon-surge.png)Surge</span>
    </div>

*From zero orbs:*
{ .lead }

1. Use a ![](../assets/shared/icon-stimulant.png){: .skill-icon } Stimulant (recommended) or proceed to #2.
2. Generate one orb, build at least 40 stacks, then Surge to refill all 3 orbs.

## DPS Spread

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-icon-base="surge" data-labels="Surge,Breaking Moon,Earth Cleaver,Blade Dance,Blitz Rush,Turning Slash" data-values="74.41,6.51,4.22,4.1,2.73,2.55"></div>
</div>
</div>