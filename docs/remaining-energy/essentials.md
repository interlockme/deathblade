# Essentials

??? danger "Upcoming (September Balance Patch)"
    - Blitz Rush gains a 27% cast speed tripod and 20% more attack range.
    - Turning Slash's after-effect now also applies Synergy.
    - Surge's buffed coefficient increases DPS for all RE builds by ~1%.
    - Buffed Ark Grid cores increase 111 HH DPS by ~2% and 313 DPS by ~1%.
    - See [333 (Ceiling)](333-ceiling.md) or [313 (High Floor)](313-high-floor.md) for build-specific tripod/gem adjustments.

!!! info ""
    - Mana food or Azena's Blessing are **required** to play Remaining Energy optimally.

        ![](../assets/re/icon-skewers.png){: .skill-icon } Chewy Grilled Skewers &nbsp;&nbsp; ![](../assets/re/icon-steak.png){: .skill-icon } Herb Steak Meal &nbsp;&nbsp; ![](../assets/re/icon-azena.png){: .skill-icon } Azena's Blessing (P2W)

??? danger "You can lower mana use at a DPS loss to save gold and skip food"
    | Where | Change |
    |---|---|
    | Evolution Ark | Raise Illicit Spell instead of Limit Break (unimportant content only) |
    | Leap Ark | Release Potential 3 / Instant Spell 3 / Awakening Amplifier 1 ★ |
    | Head Hunt | Magick Control tripod, Focus rune, or simply use it at Lv 1 |
    | Maelstrom | Focus rune (on easier builds with excess orb generation) |

!!! tip "Quick Tips"
    - Optimize Ark Passive nodes or compare bracelet lines [here!](../resources.md#ark-passive-calculator)
    - All Deathblade builds run a pet with the Specialization stat bonus.
    - Always press the next skill during your current skill's animation (skill queuing).
    - Trixion practice requires equipping maxed Spirit Absorption and Max MP engravings.
    - Optimized Training 1 may help smooth things out at lower gem levels.

## Build Comparison

*New to Deathblade entirely? [Surge](../surge/essentials.md) is generally more beginner-friendly.*

*Note: Trixion DPS is just a dummy test. Real raid performance is what actually matters!*

<div class="build-compare" data-family="re"></div>

## Engravings

| Category | Options |
|---|---|
| Engravings | Grudge · Adrenaline · Ambush Master · Raid Captain |
| Choose One | Keen Blunt Weapon ★ · Cursed Doll |

<div class="grid cards engraving-cards" markdown>

-   **Raid Captain**

    ---

    ![](../assets/shared/icon-feast.png){: .skill-icon } Atk/Move Speed feast is required for all content
    { .food-req }

    Feast also makes your rotations smoother.

-   **Keen Blunt Weapon**

    ---

    A safe and efficient choice
    { .food-req }

    Stronger than Cursed Doll by ~0.7% to 1% late game.

</div>

## Specialization

| Spec | Status | Notes |
|---|---|---|
| 1830+ | ✓ Magic number | Ideal and future-proof, but not required |
| 1818+ | ✓ Breakpoint | No Deathly Slash downtime on [333 (Ceiling)](333-ceiling.md) |
| +CD% bracelet | ⚠ Raises gem/leap reqs | Release Potential 4 needed for Fatal Wave builds |

- Lower values are fine, but may experience some downtime.
- In Trixion, aim for your build's Surge CPM goal to check for downtime or orb issues:
    - For [111 (Head Hunt)](111-head-hunt.md) and [313 (High Floor)](313-high-floor.md), try to approach 16 Surge CPM.
    - For [333 (Ceiling)](333-ceiling.md), try to approach 14.5 Surge CPM (15 after the September update).
    - Use the [DPS Meter](https://github.com/snoww/loa-logs) and remember to equip maxed Spirit Absorption and Max MP engravings!

## Gameplay

### Identity
- Orb Generation: Skills generate Death Orbs when they hit.
- Surge: Press [Z] with 1+ orbs to consume them and activate the skill.
- 3 Orbs: Aim to always Surge with 3 orbs for the strongest buffs and cooldown reduction.

### Identity Buffs

- +12% Attack Speed.
- +12% Move Speed.
- Attack Power based on orbs consumed.
- Cooldown Reduction and Mana Restoration based on orbs consumed.

The cooldown reduction is the core of the class: the cycle resets so you can start generating your next set of orbs.

### Party Synergies

- Turning Slash: +4% outgoing and +5% directional damage for 12s.
- Maelstrom: +12.8% Attack/Move Speed for 6s and improves orb generation.

### Playstyle

Remaining Energy is a continuous cycle:

Generate Orbs → 3 Orbs → Surge → Repeat.

Prioritize consistent uptime and good use of Maelstrom's buffs over back attacks. Use Surge to reposition.



### Combat Performance

**Surge Casts Per Minute (CPM)** is a useful measure of how efficiently you are playing and generating orbs.

Only compare CPM between the **same encounter and build**, as boss uptime and mechanics heavily affect it.

## FPS/Latency

- Higher FPS increases CPM and helps fit skills under Maelstrom buff.
- High latency or low FPS hinders skill queuing and can cause 2.9 orbs.
- Graphics settings on Low/OFF and forced 21:9 can increase FPS in some cases.
- Join lobbies closer to your region or avoid builds with very tight orb generation.

## Remaining Energy Skills

*Values recorded at 1830 Specialization with no runes or Maelstrom buff, 3 orbs is 30000 meter.*

<div class="skills-table" data-family="re" markdown>
<script type="application/json">
[
  { "id": "maelstrom", "name": "Maelstrom", "lines": ["4201 meter", "self buffed"] },
  { "id": "voidstrike", "name": "Void Strike", "lines": ["6314 meter"] },
  { "id": "twinshadows", "name": "Twin Shadows", "lines": ["2227 meter"] },
  { "id": "deathlyslash", "name": "Deathly Slash", "lines": ["2880 meter"] },
  { "id": "turningslash", "name": "Turning Slash", "lines": ["2228 meter"] },
  { "id": "fatalwave", "name": "Fatal Wave", "lines": ["2217 meter", "3879 for 313"] },
  { "id": "surge", "name": "Surge", "lines": ["180/s OC2", "450/s OC5"] },
  { "id": "soulabsorber", "name": "Soul Absorber", "lines": ["7418 meter"] },
  { "id": "blitzrush", "name": "Blitz Rush", "lines": ["3156 meter"] },
  { "id": "headhunt", "name": "Head Hunt", "lines": ["2200 meter"] },
  { "id": "bladeassault", "name": "Blade Assault", "lines": ["20467 meter"] },
  { "id": "earthcleaver", "name": "Earth Cleaver", "lines": ["2208 meter"] },
  { "id": "spincutter", "name": "Spincutter", "lines": ["592 meter", "per cast"] },
  { "id": "deathsentence", "name": "Death Sentence", "lines": ["1760 meter"] }
]
</script>
</div>

<div class="tag-legend" markdown>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-dmg"></span>Damage</span>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-util"></span>Utility</span>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-immune"></span>Immune</span>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-warn"></span>Warning</span>
</div>