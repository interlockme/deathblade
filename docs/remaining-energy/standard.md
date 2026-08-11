# Standard 🌱

<div class="build-card-row" markdown>
<div class="build-card" data-updated="2026-08-09" markdown>

<div class="build-stats">
<div class="stat"><span class="stat-label">Difficulty</span><span class="stat-value">7 / 10</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width: 70%"></div></div></div>
<div class="stat"><span class="stat-label">Trixion DPS</span><span class="stat-value">Not measured</span></div>
<div class="stat"><span class="stat-label">Playstyle</span><span class="stat-value">AFK Simulator</span></div>
</div>

**Best For:**{: .best-for } Brand-new Remaining Energy players with no Ark Grid yet.

**Tradeoff:**{: .tradeoff } Legacy build with some downtime and little to no recovery.

- Last bastion of the classic Remaining Energy gameplay, now powercrept.
- Counter is used in rotation often, you must hold it when necessary.
- Simple to learn and execute, with better mobility than modern builds.

</div>
<!-- Build profile pentagon. Order: Difficulty, DPS, Mobility, Recovery, Speed (0-10).
     - DPS 8.5 follows the strict -0.5-per-rank pattern below 333 Ceiling
       (9), consistent with the rest of the RE family.
     - Mobility 5 is standard across all RE builds.
     - Recovery/Speed are this build's own read - edit freely. -->
<div class="pentagon-badge" data-build="standard" data-family="re" markdown>
<div class="pentagon-badge-title">Build Profile</div>
<div class="pentagon-svg-mount"></div>
<div class="pentagon-badge-extra" markdown>
[Video Guide](https://www.youtube.com/watch?v=pZDYek5l1og&t=467s){ .video-chip } [Gameplay](https://www.youtube.com/watch?v=xmxCjwImyrg){ .video-chip }
</div>
</div>
</div>

!!! info ""
    Since this is a beginner legacy build, this guide strays slightly from the norm to offer a smoother experience without deep min-maxing. For instance, you won't need mana food or stimulants to enjoy the gameplay.

    *New to Deathblade entirely? [Surge](../surge/essentials.md) is generally more beginner-friendly and outperforms RE Standard.*

## Skill Codes

!!! danger "Before importing"
    Make sure you've read [Essentials](essentials.md), then apply both "Ark Passive" and "Skill" to be safe. For [Gems](#gems), follow the guide.

=== "Standard"

    ```
    5F7D5490D9E2C0E26CF09BBA7300EE3738585110117637ED10C8C1ED04B5AF1E35B6428D7172B4FB399678D0F83CE64D3232A844396609F8F5466877D357B98D
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
        { "name": "Firm Will", "level": 3, "max": 3, "icon": "ap-icons/firm-will.png" }
      ] },
      { "label": "Tier 4", "nodes": [
        { "name": "Extreme Body Movement", "level": 3, "max": 3, "icon": "ap-icons/extreme-body-movement.png" },
        { "name": "Orb Circulation", "level": 2, "max": 5, "icon": "ap-icons/orb-circulation.png" }
      ] }
    ] },
    { "id": "leap", "label": "Leap", "points": 70, "tiers": [
      { "label": "Tier 1", "nodes": [
        { "name": "Transcendent Power", "level": 3, "max": 5, "icon": "ap-icons/transcendent-power.png" },
        { "name": "Awakening Amplifier", "level": 1, "max": 3, "icon": "ap-icons/awakening-amplifier.png" },
        { "name": "Unleashed Power", "level": 5, "max": 5, "icon": "ap-icons/unleashed-power.png" },
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

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Ark Passive<span class="setup-note-arrow"></span></summary>

- Use the [Ark Passive Calculator](../resources.md#ark-passive-calculator) to optimize Evolution nodes.

</details>

<details class="setup-note" data-kind="note" open markdown>
<summary><span class="setup-note-tag">Note</span>Ark Grid<span class="setup-note-arrow"></span></summary>

- Standard is playable without Ark Grid by design, but you can use the 111 core setup if you already have it.
    - Save your Ark Grid cores for when you're ready to transition to a modern Deathblade build.

</details>

</div>

</div>

## Skill Setup

<div class="setup-panel" data-accent="lavender" markdown>

<div class="skill-setup" data-family="re" markdown>
<script type="application/json">
[
  {"id": "spincutter", "name": "Spincutter", "level": 4, "tripods": [3], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "soulabsorber", "name": "Soul Absorber", "level": 14, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Galewind"}},
  {"id": "deathsentence", "name": "Death Sentence", "level": 14, "tripods": [2, 2, 1], "rune": {"tier": "legendary", "name": "Focus"}},
  {"id": "twinshadows", "name": "Twin Shadows", "level": 14, "tripods": [2, 1, 2], "rune": {"tier": "epic", "name": "Wealth"}},
  {"id": "earthcleaver", "name": "Earth Cleaver", "level": 14, "tripods": [3, 3, 1], "rune": {"tier": "legendary", "name": "Vision"}},
  {"id": "turningslash", "name": "Turning Slash", "level": 13, "tripods": [1, 3, 1], "rune": {"tier": "epic", "name": "Focus"}},
  {"id": "maelstrom", "name": "Maelstrom", "level": 10, "tripods": [2, 1, 2], "rune": {"tier": "legendary", "name": "Focus"}},
  {"id": "voidstrike", "name": "Void Strike", "level": 14, "tripods": [3, 1, 2], "rune": {"tier": "legendary", "name": "Wealth"}},
  {"id": "surge", "name": "Surge", "subtitle": "Identity"},
  {"id": "deathlyslash", "name": "Deathly Slash", "subtitle": "Technique"},
  {"id": "bladeassault", "name": "Blade Assault", "subtitle": "Awakening"}
]
</script>
</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Runes<span class="setup-note-arrow"></span></summary>

- Use Epic Wealth on Soul Absorber for extra orb generation until you're more familiar with the class.

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

<div class="gem-list" markdown>
<div class="gem-item" data-rank="1" markdown>
<span class="gem-item-rank">1</span>
![](../assets/re/icon-surge.png){: .gem-item-icon } <span class="gem-item-name">Surge</span>
</div>
<div class="gem-item" data-rank="2" markdown>
<span class="gem-item-rank">2</span>
![](../assets/re/icon-soulabsorber.png){: .gem-item-icon } <span class="gem-item-name">Soul Absorber</span>
</div>
<div class="gem-item" data-rank="3" markdown>
<span class="gem-item-rank">3</span>
![](../assets/re/icon-deathsentence.png){: .gem-item-icon } <span class="gem-item-name">Death Sentence</span>
</div>
<div class="gem-item" data-rank="4" markdown>
<span class="gem-item-rank">4</span>
![](../assets/re/icon-voidstrike.png){: .gem-item-icon } <span class="gem-item-name">Void Strike</span>
</div>
<div class="gem-item" data-rank="5" markdown>
<span class="gem-item-rank">5</span>
![](../assets/re/icon-earthcleaver.png){: .gem-item-icon } <span class="gem-item-name">Earth Cleaver</span>
</div>
<div class="gem-item" data-rank="6" markdown>
<span class="gem-item-rank">6</span>
![](../assets/re/icon-twinshadows.png){: .gem-item-icon } <span class="gem-item-name">Twin Shadows</span>
</div>
<div class="gem-item" data-rank="7" markdown>
<span class="gem-item-rank">7</span>
![](../assets/re/icon-turningslash.png){: .gem-item-icon } <span class="gem-item-name">Turning Slash</span>
</div>
</div>
</div>

<div class="gem-col gem-col-cd" markdown>
<div class="gem-col-header" markdown>
![](../assets/shared/cooldowngem.png){: .gem-type-icon } <span class="gem-col-title">Cooldown</span>
</div>

<div class="gem-list" markdown>
<div class="gem-item" data-rank="1" markdown>
<span class="gem-item-rank">1</span>
![](../assets/re/icon-soulabsorber.png){: .gem-item-icon } <span class="gem-item-name">Soul Absorber</span>
</div>
<div class="gem-item" data-rank="2" markdown>
<span class="gem-item-rank">2</span>
![](../assets/re/icon-deathsentence.png){: .gem-item-icon } <span class="gem-item-name">Death Sentence</span>
</div>
<div class="gem-item" data-rank="3" markdown>
<span class="gem-item-rank">3</span>
![](../assets/re/icon-maelstrom.png){: .gem-item-icon } <span class="gem-item-name">Maelstrom</span>
</div>
<div class="gem-item" data-rank="4" markdown>
<span class="gem-item-rank">4</span>
![](../assets/re/icon-voidstrike.png){: .gem-item-icon } <span class="gem-item-name">Void Strike</span>
</div>
</div>
</div>

</div>

<div class="setup-notes" markdown>

<details class="setup-note" data-kind="tip" open markdown>
<summary><span class="setup-note-tag">Tip</span>Gem Basics<span class="setup-note-arrow"></span></summary>

- Level your #1 priority gem in each column first.
- Playable with Lv 7s, ideally Lv 8s or higher.

</details>

</div>

</div>

## Rotation

Cast Spincutter to approach the boss, use the opener and continue to loop the main cycle afterwards.

The opener stacks Adrenaline and applies synergies efficiently as you build up to the encounter's first Surge.

*Opener from zero orbs:*
{ .lead }

<div class="rotation-line" markdown>
<span class="skill">![](../assets/re/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-twinshadows.png)Twin Shadows</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-soulabsorber.png)Soul Absorber</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-voidstrike.png)Void Strike</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-deathlyslash.png)Deathly Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-surge.png)Surge</span>
</div>

*Main repeating cycle:*
{ .lead }

<div class="rotation-line" markdown>
<span class="skill">![](../assets/re/icon-twinshadows.png)Twin Shadows</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-deathsentence.png)Death Sentence</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-maelstrom.png)Maelstrom</span><span class="arrow"> → </span><span class="skill skill-situational">![](../assets/re/icon-deathlyslash.png)Deathly Slash<span class="skill-situational-tag">**every other rotation**</span></span><span class="skill">![](../assets/re/icon-turningslash.png)Turning Slash</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-earthcleaver.png)Earth Cleaver</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-soulabsorber.png)Soul Absorber</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-voidstrike.png)Void Strike</span><span class="arrow"> → </span><span class="skill">![](../assets/re/icon-surge.png)Surge</span>
</div>

- <span class="skill-chip">![](../assets/re/icon-deathlyslash.png)Deathly Slash</span> is only available every other rotation, just keep going if it's on cooldown.
- Use <span class="skill-chip">![](../assets/re/icon-spincutter.png)Spincutter</span>  during downtime to reposition, or hold it to dodge upcoming attacks.
- Use <span class="skill-chip">![](../assets/re/icon-bladeassault.png)Blade Assault</span> for damage, or hold it for Hyper Awakening or a clutch recovery.
- The rotation is bottle-necked entirely by Soul Absorber's cooldown, it is what it is.
    - You can skip Earth Cleaver if Soul Absorber's off cooldown already.

*Recovery:*
{ .lead }

- Use spare Twin Shadows or Maelstrom stacks to recover if it'll help you reach 3 orbs.
    - If not, just AFK or Surge with 2 orbs and AFK. Welcome to Standard Remaining Energy.

## DPS Spread

<p class="dps-showcase-caption">Full Lv 10 gems</p>

<div class="dps-showcase" markdown>
<div class="dps-showcase-frame" markdown>
<div class="dps-chart" data-icon-base="re" data-labels="Deathly Slash,Surge,Soul Absorber,Death Sentence,Void Strike,Earth Cleaver,Twin Shadows,Turning Slash,Bleed,Maelstrom" data-values="19.1,18.1,14.3,11.1,11.1,10,8.1,6.5,0.8,0.5"></div>
</div>
</div>