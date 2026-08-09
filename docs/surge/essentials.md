# Essentials

??? danger "Upcoming (September Balance Patch)"
    - Death Trance no longer auto-deactivates mid-stack via a side node.
    - Stack cap increased from 60 to 80. Extra stacks now roll over.
    - Breaking Moon changes to a Normal skill and gives 60 stacks on hit.
    - Complete rework of 222 cores and playstyle. It's actually good now.
    - Blitz Rush gains a 27% cast speed tripod and 20% more attack range.
    - Turning Slash and Surprise Attack's after-effects now also apply Synergy.
    - Overall damage increases, Surge is now competitive with RE.
    - Surge post-cast delay was removed, animation cancelling is no longer needed.

!!! tip "Quick Tips"
    - Optimize Ark Passive nodes or compare bracelet lines [here!](../resources.md#ark-passive-calculator)
    - All Deathblade builds run a pet with the Specialization stat bonus.
    - Always press the next skill during your current skill's animation (skill queuing).
    - Trixion practice requires equipping maxed Spirit Absorption and Max MP engravings.
    - The Bartender on Peyto Island sells ![](../assets/surge/icon-vernesewine.png){: .skill-icon } Vernese Wine and ![](../assets/surge/icon-ealynsblessing.png){: .skill-icon } Ealyn's Blessing.
    - Optimized Training 1 may help smooth things out at lower gem levels.

## Build Comparison

*Note: Trixion DPS is just a dummy test. Real raid performance is what actually matters!*

<div class="build-compare" data-family="surge"></div>

## Engravings

| Category | Options |
|---|---|
| Engravings | Grudge · Adrenaline · Ambush Master |
| Choose Two | Raid Captain ★ · Keen Blunt Weapon ★ · Mass Increase · Cursed Doll |

<div class="grid cards engraving-cards" markdown>

-   **Raid Captain** ★

    ---

    ![](../assets/shared/icon-feast.png){: .skill-icon } Atk/Move Speed feast + ![](../assets/surge/icon-vernesewine.png){: .skill-icon } Vernese Wine is **required**
    { .food-req }

    May require additional Maelstrom management.

-   **Keen Blunt Weapon** ★

    ---

    A safe and efficient choice
    { .food-req }

    Pair this with Cursed Doll if you're a newer player.

-   **Mass Increase**

    ---

    ![](../assets/shared/icon-feast.png){: .skill-icon } Atk/Move Speed feast + ![](../assets/surge/icon-ealynsblessing.png){: .skill-icon } Ealyn's Blessing is **required**
    { .food-req }

    May require additional Maelstrom management and player skill. Fewer drawbacks for [222 (Speedy)](222-speedy.md) 🐆

-   **Raid Captain + Mass Increase**

    ---

    ![](../assets/surge/icon-vernesewine.png){: .skill-icon } Vernese Wine with Bard or Paladin
    { .food-req }

    ![](../assets/surge/icon-ealynsblessing.png){: .skill-icon } Ealyn's Blessing with Artist or Valkyrie
    { .food-req }

    If you can handle the drawbacks, this is ceiling.

</div>

## Gameplay

### Identity

- Orb Generation: Normal skills generate Death Orbs when they hit.
- Death Trance: Press [Z] with 1+ orbs to enter Death Trance.
- Stack Generation: Skills generate Surge stacks while in Death Trance.
- Stack Cap: You can hold up to 80 stacks.
- Surge: Press [Z] to consume 60 stacks. Extra stacks roll over to the next cycle.
- Stack Requirement: Surge must be cast with 40+ stacks to refund all 3 Death Orbs.

### Death Trance Buffs

- 10/15/20% Attack Speed.
- 10% Move Speed.
- 8/16/24% Attack Power.
- 15/25/45% Mana Restoration.
- 10/30/50% Cooldown Reduction.

Aim to enter Death Trance with 3 orbs whenever possible.

### Party Synergies

- Turning Slash: +4% outgoing and +5% directional damage for 12s.
- Surprise Attack: +4% outgoing and +5% directional damage for 6s.
- Maelstrom: +12.8% Attack/Move Speed for 6s.

### Playstyle

Surge is a repeating cycle:

3 Orbs → Death Trance → Build Stacks → Surge → Repeat.

Build toward 60 stacks using your multi-hit skills, then land Surge as a Back Attack.

The 80-stack cap and rollover give you flexibility. You don't need to stop or force a skill just to hit exactly 60.

Knowing roughly how many stacks each skill generates is important for adapting your rotation.

### Combat Performance

**Surge Casts Per Minute (CPM)** and back attack rate are useful measures of how efficiently you cycle Surge.

Only compare CPM between the **same encounter and build**, as boss uptime and mechanics heavily affect it.

## Surge Skills

<div class="skills-table" data-family="surge" markdown>
<script type="application/json">
[
  { "id": "windcut", "name": "Wind Cut", "lines": ["up to 8-9 stacks"] },
  { "id": "deathtrance", "name": "Death Trance" },
  { "id": "maelstrom", "name": "Maelstrom", "lines": ["up to 7 stacks"] },
  { "id": "surpriseattack", "name": "Surprise Attack", "lines": ["up to 7 stacks"] },
  { "id": "breakingmoon", "name": "Breaking Moon", "lines": ["60 stacks"] },
  { "id": "surge", "name": "Surge" },
  { "id": "bladedance", "name": "Blade Dance", "lines": ["up to 9 stacks"] },
  { "id": "blitzrush", "name": "Blitz Rush", "lines": ["up to 7 stacks", "or 1 stack \uD83D\uDC2F"] },
  { "id": "earthcleaver", "name": "Earth Cleaver", "lines": ["2 to 3 stacks"] },
  { "id": "spincutter", "name": "Spincutter", "lines": ["2 stacks", "per cast"] },
  { "id": "turningslash", "name": "Turning Slash", "lines": ["up to 5 stacks"] },
  { "id": "bladeassault", "name": "Blade Assault", "lines": ["up to 20 stacks"] },
  { "id": "deathlyslash", "name": "Deathly Slash", "lines": ["up to 8-12 stacks"] },
  { "id": "darkaxel", "name": "Dark Axel", "lines": ["2 to 3 stacks"] },
  { "id": "upperslash", "name": "Upper Slash", "lines": ["up to 5 stacks"] },
  { "id": "fallstar", "name": "Fallstar", "lines": ["up to 8 stacks"] }
]
</script>
</div>

<div class="tag-legend" markdown>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-dmg"></span>Damage</span>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-util"></span>Utility</span>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-immune"></span>Immune</span>
<span class="tag-legend-item"><span class="tag-legend-dot tag-legend-warn"></span>Warning</span>
</div>