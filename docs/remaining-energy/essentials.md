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

<div class="skills-table" markdown>

| | Skill | Tags | Notes |
|---|---|---|---|
| ![](../assets/re/icon-maelstrom.png) | **Maelstrom**<br>*4201 meter*<br>*self buffed* | <span class="tag tag-util">SYNERGY</span><span class="tag tag-util">BUFF</span><span class="tag tag-warn">NOT PARALYSIS IMMUNE</span> | Increases orb generation and Attack/Move Speed, charges up to two stacks |
| ![](../assets/re/icon-voidstrike.png) | **Void Strike**<br>*6314 meter* | <span class="tag tag-util">ORB GEN</span> | Main orb generator, use under Maelstrom's effect at a short distance from the boss |
| ![](../assets/re/icon-twinshadows.png) | **Twin Shadows**<br>*2227 meter* | <span class="tag tag-util">ORB GEN</span><span class="tag tag-util">RECOVERY</span><span class="tag tag-util">MOBILITY</span> | Charges up to two stacks |
| ![](../assets/re/icon-deathlyslash.png) | **Deathly Slash**<br>*2880 meter* | <span class="tag tag-dmg">DAMAGE</span><span class="tag tag-util">ORB GEN</span><span class="tag tag-util">MOBILITY</span> | Strongest attack per cast |
| ![](../assets/re/icon-turningslash.png) | **Turning Slash**<br>*2228 meter* | <span class="tag tag-util">SYNERGY</span><span class="tag tag-util">ORB GEN</span><span class="tag tag-util">DESTINY</span><span class="tag tag-immune">PUSH IMMUNE</span> | Applies +4% outgoing and +5% directional damage synergy on hit |
| ![](../assets/re/icon-fatalwave.png) | **Fatal Wave**<br>*2217 meter*<br>*3879 for 313* | <span class="tag tag-dmg">DAMAGE</span><span class="tag tag-util">ORB GEN</span><span class="tag tag-util">DESTINY</span> | Resets based on Destiny activation |
| ![](../assets/re/icon-surge.png) | **Surge**<br>*180/s OC2*<br>*450/s OC5* | <span class="tag tag-dmg">DAMAGE</span><span class="tag tag-util">MOBILITY</span><span class="tag tag-util">DESTINY</span><span class="tag tag-immune">PUSH IMMUNE</span> | Consumes orbs to grant the RE buff, Mana Recovery, and skill CDR |
| ![](../assets/re/icon-soulabsorber.png) | **Soul Absorber**<br>*7418 meter* | <span class="tag tag-util">ORB GEN</span><span class="tag tag-util">WEAK POINT</span> | Main orb generator, charge under Maelstrom's effect and aim as needed |
| ![](../assets/re/icon-blitzrush.png) | **Blitz Rush**<br>*3156 meter* | <span class="tag tag-util">ORB GEN</span><span class="tag tag-util">RECOVERY</span> | Flexible ranged skill |
| ![](../assets/re/icon-headhunt.png) | **Head Hunt**<br>*2200 meter* | <span class="tag tag-util">COUNTER</span><span class="tag tag-util">RECOVERY</span><span class="tag tag-warn">NOT PARALYSIS IMMUNE</span> | Most flexible recovery skill |
| ![](../assets/re/icon-bladeassault.png) | **Blade Assault**<br>*20467 meter* | <span class="tag tag-util">AWAKENING</span><span class="tag tag-dmg">DAMAGE</span><span class="tag tag-util">ORB GEN</span><span class="tag tag-immune">PUSH IMMUNE</span><span class="tag tag-immune">STATUS IMMUNE</span> | Hold fully for maximum damage |
| ![](../assets/re/icon-earthcleaver.png) | **Earth Cleaver**<br>*2208 meter* | <span class="tag tag-util">COUNTER</span><span class="tag tag-util">MOBILITY</span><span class="tag tag-util">WEAK POINT</span><span class="tag tag-warn">NOT PARALYSIS IMMUNE</span> | — |
| ![](../assets/re/icon-spincutter.png) | **Spincutter**<br>*592 meter*<br>*per cast* | <span class="tag tag-util">MOBILITY</span> | Can be cast up to 2-3 times |
| ![](../assets/re/icon-deathsentence.png) | **Death Sentence**<br>*1760 meter* | <span class="tag tag-dmg">DAMAGE</span><span class="tag tag-util">STAGGER</span><span class="tag tag-util">MOBILITY</span> | — |

</div>

<div class="tag-legend" markdown>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-dmg"></span>Damage</span>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-util"></span>Utility</span>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-immune"></span>Immune</span>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-warn"></span>Warning</span>
</div>