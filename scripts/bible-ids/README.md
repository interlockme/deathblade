# Bible id decoder

`docs/javascripts/bible-decode.js` reads a Bible character page's own structured loadout data
(raid loadout, or Bible's estimated raid loadout when the last raid snapshot has no gems), so the
importer no longer depends on which loadout tab the page was showing.

- `extract_tables.mjs` regenerates `docs/javascripts/bible-id-tables.js` from a saved LOA-SIM chunk.
  Open https://loa-sim.vercel.app/ with F12, search all files for `11012`, open that chunk's URL and
  save it. Run `node scripts/bible-ids/extract_tables.mjs saved-chunk.js`.
- `test_decode.mjs` runs the real `buildPayload` through the text path and the decoded path on every
  fixture in `scripts/regression/fixtures/` and prints each field that differs. `--strict` exits 1 on
  a difference not listed in its EXPECTED map.

An id the decoder cannot read with certainty makes it refuse; the importer then reads the visible text
and adds a warning with the reason.

## Game-data archive (not shipped)

`extract_game_data.mjs` writes `game-data.json` from the same saved chunk: 29 tables, about 240 KB,
loaded by nothing on the site. It is the reference for decode work the importer does not do yet, so
a table used later is moved into `extract_tables.mjs` (shipped as `bible-id-tables.js`) rather than
re-extracted. It holds the stat type names, item names (706), Ark Grid astrogem cores, weapon names
and Weapon Power by honing, Bracer tables, attack and support bracelet effects, accessory lines and
roll values, engraving names and values, LOA-SIM's constants block, honing and upgrade tables,
materials, raids and skills. The variable names in the chunk are minified and change between builds:
a missing name or a table whose shape changed makes the script fail instead of writing a gap.

## Facts read from the page data (checked against the fixtures unless marked)

- Loadout `stats[]`: type 3, 4, 5 are STR, DEX, INT (the Deathblade's DEX is the large one) and type
  7, 8, 9 are their multipliers in basis points (10000 = x1.00). The two non-main multipliers carry
  only the Stronghold Pet's +1% (10100 on every fixture); the main one adds the equipped skins, so
  Main Stat % = (type 8 - 10000) / 100: 9 on three fixtures (8% skins) and 5 on two (4% skins).
  Nothing on the page text shows it, so the decoder is the only source. The pet and the skins cannot
  be told apart in the data, and the calculator's field wants their sum.
- LOA-SIM reads the skin bonus the same way (main multiplier minus the other two, in half-percent
  steps up to 8) because the equipped `avatar_*` items are overridden by outfit items; the item ids
  therefore say nothing about the bonus.
- Items have a `slot`: weapon, head, upper_body, lower_body, hand, shoulder (honing, advancedHoning),
  neck, ear1, ear2, finger1, finger2 (stats), ability_stone, bracelet, the `avatar_*` slots (dye
  only) and `trinity_core`. A `bracer` (or `vambrace`) slot with item ids 134xxxxxx is the Korea-only
  preview: the grade is the digit at 10^5 minus 3 (0 epic, 1 legendary, 2 relic, 3 ancient) and the
  honing level is `data.honing` (epic 0-10, legendary 10-15, relic 15-20, ancient 20-25). The archive's
  `bracerStatsByHoning[honing]` is [main stat, vitality, weapon power, flat attack power]. None of
  this is checked against a real Bracer yet: no fixture has one.
- The multiplier slots are positional: a STR character's fixture has STR (type 3) as its large base
  stat and its multiplier at type 7 (10400, the others 10100), so type 3/4/5 pairs with 7/8/9.
- A T3 bracelet (item ids 2133xxxxx) carries only type 2 stat lines (for example indexes 15 and 18)
  and no type 3 effect entries; T4 bracelets (2134xxxxx) carry the type 3 effect ids (11xxx) the
  tables cover. A support's T4 bracelet has a base stat at index 6 (a Deathblade's bracelet stat indexes are 11-20);
  the class check now refuses such a page first, so that index is no longer what the importer reports.
- The INT pairing is confirmed too: a support page has INT (type 5) as its large base stat and type 9 at 10900 (the others 10100), which is the 9% the game shows. All three positions (STR 3/7, DEX 4/8, INT 5/9) are now seen on real pages.
- A loadout can carry no type 7-9 entries at all (the Chaos Dungeon loadout of the T3 other-class page); the decoder only reads the raid or estimated raid loadout, and mainStatPercent returns null when they are missing.
- Engravings: `engrave_grade05` is relic (20 points); `engrave_grade04` is legendary and its `progress` is the displayed points (Adrenaline progress 10 shows 10/20 on the page).
- T3 Deathblade bracelets are not modelled. They decode as no bracelet effects without a warning; Crit comes from the loadout Crit total (type 15), Specialization has no calculator field.
- Every loadout object carries `classId` (`blade` is the Deathblade; `force_master` and `yinyangshi` are the other two seen), plus `lastUpdated`, `itemLevel` and `apPoints`. The decoder checks `classId` first and refuses any other class as `notDeathblade`.
