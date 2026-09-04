# Additional Resources

![313 sticker](assets/shared/sticker-313.png)

## Bonus Skill Codes

=== "Paradise"

    === "Early Levels"

        ```
        6DA43AC633E2CEC99E42A67CC7C650EF321176822375B4CE0FFFFD98E40F5C56F2FBEE9A1A60DBB0DE1D6F4FA2F83C63D4350F09E0A43F4536D632FEFD5E1B05
        ```

    === "Late Levels"

        ```
        BFE03CBB4F77DF0F01E5140695FA2010C9B1D47B03BBE27D7855E04EE259B1CA012D2AFD8D558CB98EE607B5D6FDB071244ABF56DDE760D513AC66FC26C6FBC8
        ```

=== "Chaos Dungeon"

    ```
    5BC069F349F703CA2B9B9B732BB3629E493826BE8BEA2FF11FF1575D1258D07FAA57A9FADBF188946EF1E2DB1CD6779759FF6F7EA4138A86EB19F6505242CC98
    ```

=== "111 (Void Skip)"

    *Alternative to Standard RE, KR guide available in Useful Links below.*

    ```
    FB388C4F19F70DE5311D21E59D93BE5D1B9935691AB3B6F2457D466875600C7A581AE3DFA172017D17440BEC09FB7A05BEE420C68F6788139A428497A91B802E
    ```

## Ark Passive Calculator

*Finds the optimal Evolution nodes for your deathblade and team setup. See spreadsheet [1](https://docs.google.com/spreadsheets/d/1RKpzg6sPNe7fuPDudJHAs0qbFukOwSyhMynDOijfoKY/edit?usp=sharing) or [2](https://docs.google.com/spreadsheets/d/1_0J7liyM_yw16pyn6TKlF1YGaIt5n_A9hSoLnT3yTUc/edit?usp=sharing) for verification.*

<div class="ap-calc">

<div class="ap-calc-layout">

<!-- Fixed Gear: filled out once to match your character, organized by
     which final stat each field feeds - not by which item slot it's on,
     since a ring's Crit Rate roll and its Crit Dmg roll matter for
     completely different totals and were previously scattered across
     unrelated groups (Rings/Bracelet/Ark Grid/Engravings). -->
<div class="ap-calc-gear">

  <!-- Crit Rate -->
  <div class="ap-calc-group ap-calc-group--crit-rate">
    <div class="ap-calc-group-title">Crit Rate</div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-crit-stat">Crit Stat</label>
      <span class="ap-value-display" data-for="ap-crit-stat"></span>
      <input type="number" id="ap-crit-stat" class="ap-crit-stat" min="0" max="750" step="1" value="658">
    </div>
    <div class="ap-calc-field-row ap-calc-field-row-pair">
      <label class="ap-calc-field-label">Rings</label>
      <div class="ap-calc-pair">
        <select id="ap-ring1-rate" class="ap-ring1-rate">
          <option value="None">None</option>
          <option value="Low">0.40%</option>
          <option value="Mid" selected>0.95%</option>
          <option value="High">1.55%</option>
        </select>
        <select id="ap-ring2-rate" class="ap-ring2-rate">
          <option value="None">None</option>
          <option value="Low">0.40%</option>
          <option value="Mid" selected>0.95%</option>
          <option value="High">1.55%</option>
        </select>
      </div>
    </div>
    <div class="ap-calc-field-row ap-calc-field-row-pair">
      <label class="ap-calc-field-label">Bracelet</label>
      <div class="ap-calc-pair">
        <select id="ap-bracelet-rate" class="ap-bracelet-rate">
          <option value="None">None</option>
          <option value="Low">3.40%</option>
          <option value="Mid" selected>4.20%</option>
          <option value="High">5.00%</option>
        </select>
        <select id="ap-bracelet-rate-2" class="ap-bracelet-rate-2">
          <option value="None" selected>None</option>
          <option value="Low">3.40%</option>
          <option value="Mid">4.20%</option>
          <option value="High">5.00%</option>
        </select>
      </div>
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-crushing-core" title="Chaos Core: Crushing's Crit Rate. A different Chaos Core slot from Flashy/Stable/Swift (Crit Hit Damage / Crit Damage cards), so picking a tier here doesn't reset those. In-game it's actually mutually exclusive with Absorbing/Smoldering instead, but neither of those has a tracked field here to enforce that against.">Chaos Core: Crushing</label>
      <span class="ap-value-display" data-for="ap-crushing-core"></span>
      <select id="ap-crushing-core" class="ap-crushing-core">
        <option value="None|0P" selected>None</option>
        <option value="Relic|14P">Relic 14P</option>
        <option value="Relic|17P">Relic 17P</option>
        <option value="Relic|18P">Relic 18P</option>
        <option value="Relic|19P">Relic 19P</option>
        <option value="Relic|20P">Relic 20P</option>
        <option value="Ancient|14P">Ancient 14P</option>
        <option value="Ancient|17P">Ancient 17P</option>
        <option value="Ancient|18P">Ancient 18P</option>
        <option value="Ancient|19P">Ancient 19P</option>
        <option value="Ancient|20P">Ancient 20P</option>
      </select>
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-adrenaline">Adrenaline</label>
      <span class="ap-value-display" data-for="ap-adrenaline"></span>
      <select id="ap-adrenaline" class="ap-adrenaline">
        <option value="Not Used">Not Used</option>
        <option value="0 Nodes">0 Nodes</option>
        <option value="1 Nodes">1 Nodes</option>
        <option value="2 Nodes">2 Nodes</option>
        <option value="3 Nodes">3 Nodes</option>
        <option value="4 Nodes" selected>4 Nodes</option>
      </select>
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-adrenaline-uptime">Adrenaline Uptime %</label>
      <input type="number" id="ap-adrenaline-uptime" class="ap-adrenaline-uptime" min="0" max="100" step="1" value="100">
    </div>
  </div>

  <!-- Crit Damage -->
  <div class="ap-calc-group ap-calc-group--crit-dmg">
    <div class="ap-calc-group-title">Crit Damage</div>
    <div class="ap-calc-field-row ap-calc-field-row-pair">
      <label class="ap-calc-field-label">Rings</label>
      <div class="ap-calc-pair">
        <select id="ap-ring1-dmg" class="ap-ring1-dmg">
          <option value="None">None</option>
          <option value="Low">1.20%</option>
          <option value="Mid">2.40%</option>
          <option value="High" selected>4.00%</option>
        </select>
        <select id="ap-ring2-dmg" class="ap-ring2-dmg">
          <option value="None">None</option>
          <option value="Low">1.20%</option>
          <option value="Mid">2.40%</option>
          <option value="High" selected>4.00%</option>
        </select>
      </div>
    </div>
    <div class="ap-calc-field-row ap-calc-field-row-pair">
      <label class="ap-calc-field-label">Bracelet</label>
      <div class="ap-calc-pair">
        <select id="ap-bracelet-dmg" class="ap-bracelet-dmg">
          <option value="None">None</option>
          <option value="Low" selected>6.80%</option>
          <option value="Mid">8.40%</option>
          <option value="High">10.00%</option>
        </select>
        <select id="ap-bracelet-dmg-2" class="ap-bracelet-dmg-2">
          <option value="None" selected>None</option>
          <option value="Low">6.80%</option>
          <option value="Mid">8.40%</option>
          <option value="High">10.00%</option>
        </select>
      </div>
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-swift-core" title="Chaos Core: Swift's Crit Dmg. Mutually exclusive with Chaos Core: Flashy Attack and Chaos Core: Stable Attack in the Crit Hit Damage card below - only one Chaos Core equips at a time, so picking a real tier here resets those back to None, and vice versa.">Chaos Core: Swift</label>
      <span class="ap-value-display" data-for="ap-swift-core"></span>
      <select id="ap-swift-core" class="ap-swift-core">
        <option value="None|0P" selected>None</option>
        <option value="Relic|14P">Relic 14P</option>
        <option value="Relic|17P">Relic 17P</option>
        <option value="Relic|18P">Relic 18P</option>
        <option value="Relic|19P">Relic 19P</option>
        <option value="Relic|20P">Relic 20P</option>
        <option value="Ancient|14P">Ancient 14P</option>
        <option value="Ancient|17P">Ancient 17P</option>
        <option value="Ancient|18P">Ancient 18P</option>
        <option value="Ancient|19P">Ancient 19P</option>
        <option value="Ancient|20P">Ancient 20P</option>
      </select>
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-kbw">Keen Blunt Weapon</label>
      <span class="ap-value-display" data-for="ap-kbw"></span>
      <select id="ap-kbw" class="ap-kbw">
        <option value="Not Used">Not Used</option>
        <option value="0 Nodes">0 Nodes</option>
        <option value="1 Nodes">1 Nodes</option>
        <option value="2 Nodes">2 Nodes</option>
        <option value="3 Nodes">3 Nodes</option>
        <option value="4 Nodes" selected>4 Nodes</option>
      </select>
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-kbw-stone">Ability Stone: Keen Blunt Weapon</label>
      <span class="ap-value-display" data-for="ap-kbw-stone"></span>
      <select id="ap-kbw-stone" class="ap-kbw-stone">
        <option value="0 Lv." selected>Lv. 0</option>
        <option value="1 Lv.">Lv. 1</option>
        <option value="2 Lv.">Lv. 2</option>
        <option value="3 Lv.">Lv. 3</option>
        <option value="4 Lv.">Lv. 4</option>
      </select>
    </div>
  </div>

  <!-- Crit Hit Damage -->
  <div class="ap-calc-group ap-calc-group--oncrit-dmg">
    <div class="ap-calc-group-title">Crit Hit Damage</div>
    <div class="ap-calc-field-row ap-calc-field-row-pair">
      <label class="ap-calc-field-label">Bracelet</label>
      <div class="ap-calc-pair ap-calc-pair-checks">
        <label class="ap-calc-pair-check">
          <input type="checkbox" id="ap-crit-rate-dual" class="ap-crit-rate-dual" checked>
          <span class="ap-calc-pair-check-label">1</span>
          <span class="ap-value-display">(1.50%)</span>
        </label>
        <label class="ap-calc-pair-check">
          <input type="checkbox" id="ap-crit-dmg-dual" class="ap-crit-dmg-dual" checked>
          <span class="ap-calc-pair-check-label">2</span>
          <span class="ap-value-display">(1.50%)</span>
        </label>
      </div>
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-flashy-atk">Chaos Core: Flashy Attack</label>
      <span class="ap-value-display" data-for="ap-flashy-atk"></span>
      <select id="ap-flashy-atk" class="ap-flashy-atk">
        <option value="None">None</option>
        <option value="Epic-Leg 10P">Epic-Leg 10P</option>
        <option value="Relic 17P">Relic 17P</option>
        <option value="Ancient 17P" selected>Ancient 17P</option>
      </select>
    </div>
  </div>

  <!-- Additional Damage -->
  <div class="ap-calc-group ap-calc-group--add-dmg">
    <div class="ap-calc-group-title">Additional Damage</div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-weapon-quality">Weapon Quality</label>
      <span class="ap-value-display" data-for="ap-weapon-quality"></span>
      <input type="number" id="ap-weapon-quality" class="ap-weapon-quality" min="0" max="100" step="1" value="100">
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-necklace">Necklace</label>
      <select id="ap-necklace" class="ap-necklace">
        <option value="None">None</option>
        <option value="Low">0.70%</option>
        <option value="Mid">1.60%</option>
        <option value="High" selected>2.60%</option>
      </select>
    </div>
    <div class="ap-calc-field-row ap-calc-field-row-pair">
      <label class="ap-calc-field-label">Bracelet</label>
      <div class="ap-calc-pair">
        <select id="ap-bracelet-addA" class="ap-bracelet-addA">
          <option value="None" selected>None</option>
          <option value="Low">3.00%</option>
          <option value="Mid">3.50%</option>
          <option value="High">4.00%</option>
        </select>
        <select id="ap-bracelet-addB" class="ap-bracelet-addB" title="vs Demons">
          <option value="None" selected>None</option>
          <option value="Low">2.50%</option>
          <option value="Mid">3.00%</option>
          <option value="High">3.50%</option>
        </select>
      </div>
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-astrogem-lv">Astrogem Level</label>
      <span class="ap-value-display" data-for="ap-astrogem-lv"></span>
      <input type="number" id="ap-astrogem-lv" class="ap-astrogem-lv" min="0" max="100" step="1" value="59">
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-sh-pet">Stronghold Pet</label>
      <span class="ap-value-display" data-for="ap-sh-pet"></span>
      <select id="ap-sh-pet" class="ap-sh-pet">
        <option value="None">None</option>
        <option value="Low">Rare</option>
        <option value="Mid">Epic</option>
        <option value="High" selected>Legendary</option>
      </select>
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-stable-atk">Chaos Core: Stable Attack</label>
      <span class="ap-value-display" data-for="ap-stable-atk"></span>
      <select id="ap-stable-atk" class="ap-stable-atk">
        <option value="None|0P" selected>None</option>
        <option value="Legend|14P">Legend 14P</option>
        <option value="Relic|14P">Relic 14P</option>
        <option value="Relic|17P">Relic 17P</option>
        <option value="Relic|18P">Relic 18P</option>
        <option value="Relic|19P">Relic 19P</option>
        <option value="Relic|20P">Relic 20P</option>
        <option value="Ancient|14P">Ancient 14P</option>
        <option value="Ancient|17P">Ancient 17P</option>
        <option value="Ancient|18P">Ancient 18P</option>
        <option value="Ancient|19P">Ancient 19P</option>
        <option value="Ancient|20P">Ancient 20P</option>
      </select>
    </div>
  </div>

    <!-- Leap Rank is the only field feeding Evolution Damage directly (Yearning,
       the other Evo Dmg source, lives in Party & Positioning instead) - a full
       bordered group for one dropdown was mostly empty box, so it's a slim
       tagged strip spanning the gear column instead of its own card. -->
  <div class="ap-calc-mini-field ap-calc-mini-field--evo-dmg">
    <span class="ap-calc-mini-field-tag">Evo Dmg</span>
    <label class="ap-calc-field-label" for="ap-evo-karma">Karmic Leap Rank</label>
    <span class="ap-value-display" data-for="ap-evo-karma"></span>
    <select id="ap-evo-karma" class="ap-evo-karma">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6" selected>6</option>
    </select>
  </div>

</div> <!-- end ap-calc-gear -->

<!-- Live: the stuff you actually re-toggle per pull/party, plus the result
     grid and verification numbers it feeds - kept together so nothing you
     change often is more than a glance away from its effect. -->
<div class="ap-calc-live">

  <div class="ap-calc-party-card">
    <div class="ap-calc-group-title">Party &amp; Positioning</div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-crit-syn1">Crit Rate Synergy 1</label>
      <span class="ap-value-display" data-for="ap-crit-syn1"></span>
      <input type="checkbox" id="ap-crit-syn1" class="ap-crit-syn1">
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-crit-syn2">Crit Rate Synergy 2</label>
      <span class="ap-value-display" data-for="ap-crit-syn2"></span>
      <input type="checkbox" id="ap-crit-syn2" class="ap-crit-syn2">
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-crit-hit-syn-1">Crit Hit Damage Synergy 1</label>
      <span class="ap-value-display" data-for="ap-crit-hit-syn-1"></span>
      <input type="checkbox" id="ap-crit-hit-syn-1" class="ap-crit-hit-syn-1">
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-crit-hit-syn-2">Crit Hit Damage Synergy 2</label>
      <span class="ap-value-display" data-for="ap-crit-hit-syn-2"></span>
      <input type="checkbox" id="ap-crit-hit-syn-2" class="ap-crit-hit-syn-2">
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-yearning">Support: Passionate Dance (Evo Dmg)</label>
      <span class="ap-value-display" data-for="ap-yearning"></span>
      <input type="checkbox" id="ap-yearning" class="ap-yearning" checked>
    </div>
    <div class="ap-calc-field-row">
      <label class="ap-calc-field-label" for="ap-back-attack-rate">Back Attack Rate % (Crit Rate)</label>
      <input type="number" id="ap-back-attack-rate" class="ap-back-attack-rate" min="0" max="100" step="1" value="90">
    </div>
  </div>

  <!-- Top 3 combinations, ranked by % of the best. Replaces the old 3x3
       grid + progress bars: with 9 cells the only things that mattered
       were "what's my best combo" and "what am I giving up if I run
       something else", so a ranked list answers both directly instead of
       asking the reader to scan a matrix for the highlighted cell. -->
  <div class="ap-calc-results">
    <div class="ap-calc-results-title">Top Combinations</div>
    <div class="ap-calc-result-row" data-rank="1">
      <span class="ap-result-rank">1</span>
      <span class="ap-result-combo">—</span>
      <span class="ap-result-delta">—</span>
      <span class="ap-result-pct">—</span>
    </div>
    <div class="ap-calc-result-row" data-rank="2">
      <span class="ap-result-rank">2</span>
      <span class="ap-result-combo">—</span>
      <span class="ap-result-delta">—</span>
      <span class="ap-result-pct">—</span>
    </div>
    <div class="ap-calc-result-row" data-rank="3">
      <span class="ap-result-rank">3</span>
      <span class="ap-result-combo">—</span>
      <span class="ap-result-delta">—</span>
      <span class="ap-result-pct">—</span>
    </div>
  </div>

  <!-- Verification + Result -->
  <div class="ap-calc-summary">
    <div class="ap-calc-stat-cards">

      <div class="ap-stat-card">
        <div class="ap-stat-card-title">Base Setup</div>
        <div class="ap-stat-card-row"><span class="ap-summary-label ap-summary-label--critrate">Crit Rate</span><span class="ap-summary-base-critrate ap-summary-value">—</span></div>
        <div class="ap-stat-card-row"><span class="ap-summary-label ap-summary-label--critdmg">Crit Dmg</span><span class="ap-summary-base-critdmg ap-summary-value">—</span></div>
        <div class="ap-stat-card-row"><span class="ap-summary-label ap-summary-label--oncrit">Crit Hit Dmg</span><span class="ap-summary-base-oncrit ap-summary-value">—</span></div>
        <div class="ap-stat-card-row"><span class="ap-summary-label ap-summary-label--evodmg">Evo Dmg</span><span class="ap-summary-base-evodmg ap-summary-value">—</span></div>
        <div class="ap-stat-card-row"><span class="ap-summary-label ap-summary-label--adddmg">Add Dmg</span><span class="ap-summary-base-adddmg ap-summary-value">—</span></div>
        <div class="ap-stat-card-row ap-stat-card-row--kbw-base ap-stat-card-row--hidden"><span class="ap-summary-label ap-summary-label--critdmg">KBW Dmg</span><span class="ap-summary-base-kbw ap-summary-value">—</span></div>
        <div class="ap-stat-card-row ap-stat-card-row--kbwstone-base ap-stat-card-row--hidden"><span class="ap-summary-label ap-summary-label--critdmg">KBW Stone Dmg</span><span class="ap-summary-base-kbwstone ap-summary-value">—</span></div>
      </div>

      <div class="ap-stat-card ap-stat-card-best">
        <div class="ap-stat-card-title">Best Setup <span class="ap-summary-best-label ap-stat-card-subtitle">—</span></div>
        <div class="ap-stat-card-row"><span class="ap-summary-label ap-summary-label--critrate">Crit Rate</span><span class="ap-summary-best-crit ap-summary-value">—</span></div>
        <div class="ap-stat-card-row"><span class="ap-summary-label ap-summary-label--oncrit">Crit Hit Dmg</span><span class="ap-summary-best-oncrit ap-summary-value">—</span></div>
        <div class="ap-stat-card-row"><span class="ap-summary-label ap-summary-label--evodmg">Evo Dmg</span><span class="ap-summary-best-evodmg ap-summary-value">—</span></div>
        <div class="ap-stat-card-row"><span class="ap-summary-label ap-summary-label--adddmg">Add Dmg</span><span class="ap-summary-best-adddmg ap-summary-value">—</span></div>
        <div class="ap-stat-card-row ap-stat-card-row--kbw-best ap-stat-card-row--hidden"><span class="ap-summary-label ap-summary-label--critdmg">KBW Dmg</span><span class="ap-summary-best-kbw ap-summary-value">—</span></div>
        <div class="ap-stat-card-row ap-stat-card-row--kbwstone-best ap-stat-card-row--hidden"><span class="ap-summary-label ap-summary-label--critdmg">KBW Stone Dmg</span><span class="ap-summary-best-kbwstone ap-summary-value">—</span></div>
      </div>

    </div>
  </div>

  <p class="ap-calc-footnote">Your inputs are saved in this browser so they're still here next visit.
  <span class="ap-calc-preset-group" role="group" aria-label="Preset slot">Preset <button type="button" class="ap-calc-preset" data-preset="1">1</button><button type="button" class="ap-calc-preset" data-preset="2">2</button><button type="button" class="ap-calc-preset" data-preset="3">3</button></span>
  <button type="button" class="ap-calc-export">Export</button>
  <button type="button" class="ap-calc-import">Import</button>
  <button type="button" class="ap-calc-reset">Reset to defaults</button>
  <span class="ap-calc-popover" data-popover="export" hidden>
    <span class="ap-calc-popover-title">Export Preset <span class="ap-calc-popover-preset-num"></span></span>
    <textarea class="ap-calc-popover-textarea" readonly rows="4" spellcheck="false"></textarea>
    <span class="ap-calc-popover-actions">
      <button type="button" class="ap-calc-popover-copy">Copy to Clipboard</button>
      <button type="button" class="ap-calc-popover-download">Download .json</button>
      <button type="button" class="ap-calc-popover-close">Close</button>
    </span>
    <span class="ap-calc-popover-msg" aria-live="polite"></span>
  </span>
  <span class="ap-calc-popover" data-popover="import" hidden>
    <span class="ap-calc-popover-title">Import into Preset <span class="ap-calc-popover-preset-num"></span></span>
    <textarea class="ap-calc-popover-textarea" rows="4" spellcheck="false" placeholder="Paste exported JSON here, or choose a file below."></textarea>
    <input type="file" class="ap-calc-popover-file" accept="application/json,.json">
    <span class="ap-calc-popover-actions">
      <button type="button" class="ap-calc-popover-load">Load</button>
      <button type="button" class="ap-calc-popover-close">Cancel</button>
    </span>
    <span class="ap-calc-popover-msg" aria-live="polite"></span>
  </span>
  </p>


</div> <!-- end ap-calc-live -->

</div> <!-- end ap-calc-layout -->

<!-- Visual break between the Ark Passive setup above (feeds the grid/
     summary in .ap-calc-live) and the gear-comparison tools below
     (Gearing inputs + Bracelet/Accessory Line Comparison) - these read as
     one continuous block of cards otherwise, with nothing signaling that
     everything past this point is a different mode of the calculator
     (per-item "is this piece worth using" questions, not the "what's my
     best Ark Passive setup" question above). A plain horizontal rule
     wasn't enough to read as a SECTION break rather than just another
     rule between cards, so this pairs the line with a label. -->
<div class="ap-section-divider">
  <span class="ap-section-divider-label">Gear Comparisons</span>
</div>

<!-- Gearing: shared Weapon Power / Attack Power inputs, read straight off
     your character panel. Lives as its OWN top-level section (not nested
     inside Bracelet Line Comparison below) because it's not
     bracelet-specific - it's the shared input set for all three
     "value my actual gear pieces" panels (Bracelet, and eventually
     Accessories / Ark Grid), each computed independently in the JS but
     all reading these same fields. Collapsed by default, same as before -
     most readers using the panels below are only here for the Ark
     Passive setup above and don't need this expanded. Base AP% still
     folds together its few small sources rather than tracking each one
     separately (hover the label for the full source list); Attack
     Power% used to work the same way but is now split into individual
     source fields below instead, so the running total is derived
     rather than hand-typed. -->
<details class="ap-gear-inputs">
  <summary>
    <span class="ap-gear-title">Character Data</span>
    <span class="ap-gear-optional-badge" title="Not part of your Ark Passive setup above. Only used by the Bracelet, Accessory, and Ark Grid comparisons below - skip this if you're not using those.">Optional</span>
  </summary>
  <div class="ap-brace-compare-inputs">
    <!-- Two cards side by side, same visual language as the Ark Passive
         grid's own Crit Rate/Crit Damage/etc. category cards above
         (.ap-calc-group inside .ap-calc-gear) - title + border-left
         accent, fields stacked in a single column inside each card (see
         the .ap-gear-card rules for why the old chip-style field-row
         layout was dropped in favor of that). The side-by-side placement
         itself used to be a plain 2-column grid with its own fixed
         collapse-to-1-column breakpoint, PLUS a second fixed breakpoint
         on each card to un-squeeze its pair rows and long label/select
         rows once narrow - two independently hand-picked numbers that
         didn't line up, so there was a band of widths where 2-up was
         still active but neither card had reached its own comfortable
         width yet, and fields visibly jumped between inline/stacked
         resizing through it (the same kind of threshold mismatch
         flagged in skill-setup.js's MASONRY_MIN_WIDTH note). Replaced
         with a single auto-fit grid (see .ap-gear-cards below) that
         only ever gives a card its minmax() minimum or more - so a card
         can never be squeezed narrower than its own content needs in
         the first place, and the "drop to 1 column" case falls out of
         that same rule instead of a second breakpoint to keep in sync. -->
    <div class="ap-gear-cards">
      <div class="ap-gear-card ap-gear-card--basics">
        <p class="ap-gear-card-title">Weapon Power / Main Stat / Misc</p>
        <div class="ap-calc-field-row ap-calc-field-row-pair">
          <label class="ap-calc-field-label" title="Affects only the flat Weapon Power granted by lines below, not your Weapon Power stat itself.">Earrings</label>
          <div class="ap-calc-pair">
            <select id="ap-gear-wp-earring1" class="ap-gear-wp-earring1">
              <option value="None">None</option>
              <option value="Low">0.8%</option>
              <option value="Mid" selected>1.8%</option>
              <option value="High">3%</option>
            </select>
            <select id="ap-gear-wp-earring2" class="ap-gear-wp-earring2">
              <option value="None">None</option>
              <option value="Low">0.8%</option>
              <option value="Mid" selected>1.8%</option>
              <option value="High">3%</option>
            </select>
          </div>
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-wp">Weapon Power</label>
          <input type="number" id="ap-gear-wp" class="ap-gear-wp ap-gear-input-wide" min="0" max="1000000" step="1" value="259216">
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-wp-karma-lv" title="+0.1% Weapon Power per level, up to Lv.30 (+3%). Affects only the flat Weapon Power granted by lines below, not your Weapon Power stat itself.">Karmic Enlightenment Level</label>
          <span class="ap-value-display" data-for="ap-gear-wp-karma-lv"></span>
          <input type="number" id="ap-gear-wp-karma-lv" class="ap-gear-wp-karma-lv ap-gear-input-narrow" min="0" max="30" step="1" value="30">
        </div>
        <div class="ap-calc-field-row ap-gear-ap-select-row">
          <label class="ap-calc-field-label" for="ap-gear-weapon-core" title="Chaos Core: Weapon's Weapon Power % AND Flat WP, both at once. Mutually exclusive with Chaos Core: Attack below - only one Chaos Core equips at a time, so picking a real tier here resets that one back to None, and vice versa.">Chaos Core: Weapon</label>
          <span class="ap-value-display" data-for="ap-gear-weapon-core"></span>
          <select id="ap-gear-weapon-core" class="ap-gear-weapon-core">
            <option value="None|0P" selected>None</option>
            <option value="Relic|14P">Relic 14P</option>
            <option value="Relic|17P">Relic 17P</option>
            <option value="Relic|18P">Relic 18P</option>
            <option value="Relic|19P">Relic 19P</option>
            <option value="Relic|20P">Relic 20P</option>
            <option value="Ancient|14P">Ancient 14P</option>
            <option value="Ancient|17P">Ancient 17P</option>
            <option value="Ancient|18P">Ancient 18P</option>
            <option value="Ancient|19P">Ancient 19P</option>
            <option value="Ancient|20P">Ancient 20P</option>
          </select>
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-main-stat">Main Stat (STR/DEX/INT)</label>
          <input type="number" id="ap-gear-main-stat" class="ap-gear-main-stat ap-gear-input-wide" min="0" max="2000000" step="1" value="854918">
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-main-stat-pct" title="Stronghold Pet (+1%) + Skin bonuses: Legendary +2% each (up to +8%) and Epic +1% each (up to +4%). Affects only the flat Main Stat granted by lines below, not your Main Stat stat itself.">Main Stat %</label>
          <input type="number" id="ap-gear-main-stat-pct" class="ap-gear-main-stat-pct ap-gear-input-narrow" min="0" max="15" step="0.1" value="9">
        </div>
        <div class="ap-calc-field-row ap-calc-field-row-pair">
          <label class="ap-calc-field-label ap-gear-gem-base-ap-label" title="The SUM of every socketed gem's Base AP% bonus (Lv.7 +0.6% / Lv.8 +0.8% / Lv.9 +1% / Lv.10 +1.2% each).">Gem Base AP %</label>
          <div class="ap-calc-pair ap-gear-gem-base-ap-pair">
            <span class="ap-value-display" data-for="ap-gear-gem-base-ap"></span>
            <input type="number" id="ap-gear-gem-base-ap" class="ap-gear-gem-base-ap ap-gear-input-narrow" min="0" max="13.2" step="0.1" value="13.2" title="Gem Base AP % - the SUM across all your socketed gems.">
            <label class="ap-calc-pair-check" title="Check to add your stone's Base AP % bonus if available (+1.5%).">
              <span class="ap-calc-pair-check-label">Ability Stone</span>
              <input type="checkbox" id="ap-gear-ability-stone-base-ap" class="ap-gear-ability-stone-base-ap" checked>
            </label>
          </div>
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-flat-ap" title="Low +80 / Mid +195 / High +390.">Accessory Flat AP Bonuses</label>
          <input type="number" id="ap-gear-flat-ap" class="ap-gear-flat-ap ap-gear-input-narrow" min="0" max="2000" step="1" value="0">
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-support-uptime" title="Assumes an equally-geared support providing their AP buff.">Support AP Buff Uptime %</label>
          <input type="number" id="ap-gear-support-uptime" class="ap-gear-support-uptime ap-gear-input-narrow" min="0" max="100" step="1" value="98">
        </div>
      </div>

      <!-- Attack Power % sources: every field that folds into the running
           Attack Power % total lives in this one card - Ability Stone:
           Adrenaline and Atropine included, since they used to sit in a
           separate area below purely as a leftover from how each was
           implemented (its own toggle/table), not a real conceptual
           difference from Kazeros/Guardian/etc (see
           gearAttackPowerPercentTotal's own comment in the JS for how they
           fold in). Support is deliberately NOT in this card: it buffs
           Attack Power through a completely different mechanism (a flat
           AP-equivalent amount derived from your own Weapon Power/Main
           Stat, added before the Attack Power % multiply rather than being
           a term inside it - see supportApBuff's own comment in the JS),
           so it has no "% value" to contribute here and would just be dead
           weight inside a card titled "sources". It sits in the card on
           the left instead, alongside Weapon Power/Main Stat/etc. -->
      <div class="ap-gear-card ap-gear-card--ap-sources ap-gear-ap-section">
        <p class="ap-gear-card-title ap-gear-ap-sources-heading">Attack Power %<span class="ap-value-display ap-gear-ap-total-display" data-for="ap-gear-ap-total"></span></p>
        <div class="ap-calc-field-row ap-calc-field-row-pair">
          <label class="ap-calc-field-label" >Earrings</label>
          <div class="ap-calc-pair">
            <select id="ap-gear-ap-earring1" class="ap-gear-ap-earring1">
              <option value="None">None</option>
              <option value="Low">0.4%</option>
              <option value="Mid">0.95%</option>
              <option value="High" selected>1.55%</option>
            </select>
            <select id="ap-gear-ap-earring2" class="ap-gear-ap-earring2">
              <option value="None">None</option>
              <option value="Low">0.4%</option>
              <option value="Mid">0.95%</option>
              <option value="High" selected>1.55%</option>
            </select>
          </div>
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-ap-kazeros" title="Kazeros Raid Contribution buff, +2% Attack Power.">Kazeros Raid Contribution</label>
          <span class="ap-value-display" data-for="ap-gear-ap-kazeros"></span>
          <input type="checkbox" id="ap-gear-ap-kazeros" class="ap-gear-ap-kazeros">
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-ap-guardian" title="Guardian Raid Contribution buff, +3% Attack Power.">Guardian Raid Contribution</label>
          <span class="ap-value-display" data-for="ap-gear-ap-guardian"></span>
          <input type="checkbox" id="ap-gear-ap-guardian" class="ap-gear-ap-guardian">
        </div>
        <div class="ap-calc-field-row ap-gear-ap-select-row">
          <label class="ap-calc-field-label" for="ap-gear-ap-chaos-star" title="Chaos Core: Attack's Atk. Power % AND Flat AP, both at once.">Chaos Core: Attack</label>
          <span class="ap-value-display" data-for="ap-gear-ap-chaos-star"></span>
          <select id="ap-gear-ap-chaos-star" class="ap-gear-ap-chaos-star">
            <option value="None|0P">None</option>
            <option value="Any|10P">10 Points</option>
            <option value="Relic|14P">Relic 14P</option>
            <option value="Relic|17P">Relic 17P</option>
            <option value="Relic|18P">Relic 18P</option>
            <option value="Relic|19P">Relic 19P</option>
            <option value="Relic|20P" selected>Relic 20P</option>
            <option value="Ancient|14P">Ancient 14P</option>
            <option value="Ancient|17P">Ancient 17P</option>
            <option value="Ancient|18P">Ancient 18P</option>
            <option value="Ancient|19P">Ancient 19P</option>
            <option value="Ancient|20P">Ancient 20P</option>
          </select>
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-ap-astrogem-lv" >Astrogem Atk. Power Level</label>
          <span class="ap-value-display" data-for="ap-gear-ap-astrogem-lv"></span>
          <input type="number" id="ap-gear-ap-astrogem-lv" class="ap-gear-ap-astrogem-lv" min="0" max="100" step="1" value="35">
        </div>
        <div class="ap-calc-field-row ap-gear-ap-select-row">
          <label class="ap-calc-field-label" for="ap-adrenaline-stone" title="A fixed 0.9% per stack, assuming the full 6 stacks, plus this stone's own bonus (Lv.1 +0.48% / Lv.2 +0.60% / Lv.3 +0.83% / Lv.4 +0.95% per stack).">Ability Stone: Adrenaline</label>
          <span class="ap-value-display" data-for="ap-adrenaline-stone"></span>
          <select id="ap-adrenaline-stone" class="ap-adrenaline-stone">
            <option value="0 Lv." selected>Lv. 0</option>
            <option value="1 Lv.">Lv. 1</option>
            <option value="2 Lv.">Lv. 2</option>
            <option value="3 Lv.">Lv. 3</option>
            <option value="4 Lv.">Lv. 4</option>
          </select>
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-strength-orb-uptime" title="+10% Attack Power, scaled by the Support's Drops of Ether engraving.">Support: Strength Orb Uptime %</label>
          <span class="ap-value-display" data-for="ap-gear-strength-orb-uptime"></span>
          <input type="number" id="ap-gear-strength-orb-uptime" class="ap-gear-strength-orb-uptime ap-gear-input-narrow" min="0" max="100" step="1" value="0">
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-atropine-uptime" title="+30% Attack Power for 10s. Usually 0-15% uptime in latest content.">Atropine Uptime %</label>
          <span class="ap-value-display" data-for="ap-gear-atropine-uptime"></span>
          <input type="number" id="ap-gear-atropine-uptime" class="ap-gear-atropine-uptime ap-gear-input-narrow" min="0" max="100" step="1" value="0">
        </div>
        <div class="ap-calc-field-row">
          <label class="ap-calc-field-label" for="ap-gear-ap-other" title="Anything not covered above - e.g. a temporary in-raid buff. Don't include AP % from Enlightenment nodes.">Other AP % Bonuses</label>
          <input type="number" id="ap-gear-ap-other" class="ap-gear-ap-other ap-gear-input-narrow" min="0" max="50" step="0.01" value="0">
        </div>
      </div>
    </div>
  </div>
</details>

<!-- Bracelet Line Comparison: a different question than the grid above -
     "of the bracelet lines I have data for, which is worth the most DPS"
     rather than "what's my best Ark Passive setup". Values are computed
     against your Best Setup above with your currently-selected bracelet
     lines zeroed out first, so each % is that line's value on its own -
     see the JS comment above computeBraceletComparison() for the full
     methodology and the deliberate simplifications (Damage+CD is the
     sheet's own averaged flat+CDR estimate for its reference build,
     Stagger/Back-Attack DPS-share are fixed assumptions, Front Dmg/
     Non-positional Dmg are left out entirely). Deliberately full-width and
     OUTSIDE .ap-calc-live (which is position: sticky) - a stacked list of
     11 lines in that narrow sticky column was expanding a fixed-height
     column that's supposed to stay glance-able while you scroll the gear
     list; living here as a plain, non-sticky, full-width table gives it
     room to breathe horizontally instead of pushing that column's height
     around. -->
<details class="ap-brace-compare">
  <summary>Bracelet Line Comparison</summary>
  <div class="ap-brace-compare-body">
    <p class="ap-brace-compare-intro">Candidate bracelet lines, valued as if each were the only line on your bracelet, against your Best Setup above.</p>
    <div class="ap-brace-compare-inputs">
      <div class="ap-calc-field-row">
        <label class="ap-calc-field-label" for="ap-brace-demon-dmg">Card Demon Dmg %</label>
        <input type="number" id="ap-brace-demon-dmg" class="ap-brace-demon-dmg" min="0" max="15" step="0.1" value="7">
      </div>
      <div class="ap-calc-field-row">
        <label class="ap-calc-field-label" for="ap-brace-crit-stat-equipped">Current Bracelet's Crit Stat</label>
        <span class="ap-brace-info-icon" title="Subtracted from your total Crit Stat to build the no-bracelet baseline, so this comparison doesn't double-count Crit Stat your current bracelet already grants.">i</span>
        <input type="number" id="ap-brace-crit-stat-equipped" class="ap-brace-crit-stat-equipped" min="60" max="120" step="1" value="82">
      </div>
      <div class="ap-calc-field-row">
        <label class="ap-calc-field-label" for="ap-brace-spec-build">Spec Scaling</label>
        <select id="ap-brace-spec-build" class="ap-brace-spec-build">
          <option value="re-111">RE 111</option>
          <option value="re-313">RE 313</option>
          <option value="re-333" selected>RE 333</option>
          <option value="surge-111">Surge 111</option>
          <option value="surge-222">Surge 222</option>
          <option value="surge-333">Surge 333</option>
        </select>
      </div>
    </div>
    <table class="ap-brace-compare-table">
      <thead>
        <tr>
          <th class="ap-brace-th-label">Line</th>
          <th class="ap-brace-th-low">Low</th>
          <th class="ap-brace-th-mid">Mid</th>
          <th class="ap-brace-th-high">High</th>
        </tr>
      </thead>
      <tbody class="ap-brace-compare-rows"></tbody>
    </table>
    <p class="ap-brace-compare-flip-note">&dagger; Equipping this line's Mid tier may change which split/keystone combo is your actual best - worth a re-check.</p>
    <p class="ap-brace-compare-footer-note">Flat Bonus lines use values from the Gearing section and are hidden until Weapon Power and Main Stat are both filled in.</p>

    <!-- Bracelet vs. Bracelet: compares two WHOLE candidate bracelets (5
         real lines each - the two guaranteed Spec/Crit substats plus 3
         free picks from the same line pool the table above values one at a
         time) against each other and against running no bracelet at all,
         including each bracelet's own best keystone (which can genuinely
         differ between two bracelets - see computeBraceletVsBracelet's own
         comment in the JS). Nested INSIDE Bracelet Line Comparison
         (collapsed by default, at the bottom) rather than its own
         top-level section, since it's really just a "combine several of
         the rows above at once, twice, and compare" extension of the same
         tool, not a separate question - and it's only as accurate as
         Ark Passive setup, Character Data, and this table's own inputs
         above are filled out, which is why it reads as a continuation of
         them rather than something you'd reach for on its own. -->
    <details class="ap-bvb">
      <summary>Bracelet vs. Bracelet</summary>
      <div class="ap-brace-compare-body">
        <p class="ap-brace-compare-intro">Compares two full 5-line bracelets against each other and against running none at all.</p>

        <div class="ap-bvb-cards">
          <div class="ap-bvb-card ap-bvb-card-a">
            <p class="ap-gear-card-title ap-bvb-card-title">Bracelet A</p>
            <div class="ap-calc-field-row">
              <label class="ap-calc-field-label" for="ap-bvb-a-spec">Spec Stat</label>
              <span class="ap-brace-info-icon ap-bvb-spec-note" title="This only reflects Spec's damage share on RE - it doesn't capture CDR or orb gen." hidden>i</span>
              <span class="ap-brace-warn-icon ap-bvb-spec-warn" title="Recommended to keep Specialization at 83 or higher on RE for CDR." hidden>!</span>
              <input type="number" id="ap-bvb-a-spec" class="ap-bvb-a-spec" min="60" max="120" step="1" value="100">
            </div>
            <div class="ap-calc-field-row">
              <label class="ap-calc-field-label" for="ap-bvb-a-crit">Crit Stat</label>
              <input type="number" id="ap-bvb-a-crit" class="ap-bvb-a-crit" min="60" max="120" step="1" value="80">
            </div>
            <div class="ap-bvb-line-row">
              <select id="ap-bvb-a-line1-type" class="ap-bvb-a-line1-type ap-bvb-line-type">
                <option value="none">— Line 3: None —</option>
                <option value="crit_rate_dual" selected>Crit Rate % &amp; Crit Hit Dmg %</option>
                <option value="crit_rate">Crit Rate %</option>
                <option value="crit_dmg_dual">Crit Damage % &amp; Crit Hit Dmg %</option>
                <option value="crit_dmg">Crit Damage %</option>
                <option value="damage_cd">Outgoing Dmg % &amp; Cooldown +2%</option>
                <option value="outgoing_stagger">Outgoing Dmg % &amp; Dmg to Staggered %</option>
                <option value="outgoing">Outgoing Damage %</option>
                <option value="add_a">Additional Damage %</option>
                <option value="add_b">Additional Damage % &amp; vs Demon/Archdemon</option>
                <option value="back_attack">Back Attack Damage %</option>
                <option value="stat_main">STR/DEX/INT</option>
                <option value="wp_flat">Weapon Power</option>
                <option value="wp_onhit">On-Hit Weapon Power (stacking)</option>
                <option value="wp_periodic">Weapon Power + Periodic On-Hit</option>
                <option value="wp_hpgated">Weapon Power + &gt;50% HP On-Hit</option>
              </select>
              <select id="ap-bvb-a-line1-tier" class="ap-bvb-a-line1-tier ap-bvb-line-tier">
                <option value="Low">Low</option>
                <option value="Mid" selected>Mid</option>
                <option value="High">High</option>
              </select>
              <input type="number" id="ap-bvb-a-line1-mainstat" class="ap-bvb-a-line1-mainstat ap-bvb-line-mainstat" min="10000" max="16000" step="100" value="14000" title="Flat STR/DEX/INT granted by this line (10000-16000)." hidden>
            </div>
            <div class="ap-bvb-line-row">
              <select id="ap-bvb-a-line2-type" class="ap-bvb-a-line2-type ap-bvb-line-type">
                <option value="none">— Line 4: None —</option>
                <option value="crit_rate_dual">Crit Rate % &amp; Crit Hit Dmg %</option>
                <option value="crit_rate">Crit Rate %</option>
                <option value="crit_dmg_dual" selected>Crit Damage % &amp; Crit Hit Dmg %</option>
                <option value="crit_dmg">Crit Damage %</option>
                <option value="damage_cd">Outgoing Dmg % &amp; Cooldown +2%</option>
                <option value="outgoing_stagger">Outgoing Dmg % &amp; Dmg to Staggered %</option>
                <option value="outgoing">Outgoing Damage %</option>
                <option value="add_a">Additional Damage %</option>
                <option value="add_b">Additional Damage % &amp; vs Demon/Archdemon</option>
                <option value="back_attack">Back Attack Damage %</option>
                <option value="stat_main">STR/DEX/INT</option>
                <option value="wp_flat">Weapon Power</option>
                <option value="wp_onhit">On-Hit Weapon Power (stacking)</option>
                <option value="wp_periodic">Weapon Power + Periodic On-Hit</option>
                <option value="wp_hpgated">Weapon Power + &gt;50% HP On-Hit</option>
              </select>
              <select id="ap-bvb-a-line2-tier" class="ap-bvb-a-line2-tier ap-bvb-line-tier">
                <option value="Low">Low</option>
                <option value="Mid" selected>Mid</option>
                <option value="High">High</option>
              </select>
              <input type="number" id="ap-bvb-a-line2-mainstat" class="ap-bvb-a-line2-mainstat ap-bvb-line-mainstat" min="10000" max="16000" step="100" value="14000" title="Flat STR/DEX/INT granted by this line (10000-16000)." hidden>
            </div>
            <div class="ap-bvb-line-row">
              <select id="ap-bvb-a-line3-type" class="ap-bvb-a-line3-type ap-bvb-line-type">
                <option value="none">— Line 5: None —</option>
                <option value="crit_rate_dual">Crit Rate % &amp; Crit Hit Dmg %</option>
                <option value="crit_rate">Crit Rate %</option>
                <option value="crit_dmg_dual">Crit Damage % &amp; Crit Hit Dmg %</option>
                <option value="crit_dmg">Crit Damage %</option>
                <option value="damage_cd">Outgoing Dmg % &amp; Cooldown +2%</option>
                <option value="outgoing_stagger">Outgoing Dmg % &amp; Dmg to Staggered %</option>
                <option value="outgoing">Outgoing Damage %</option>
                <option value="add_a" selected>Additional Damage %</option>
                <option value="add_b">Additional Damage % &amp; vs Demon/Archdemon</option>
                <option value="back_attack">Back Attack Damage %</option>
                <option value="stat_main">STR/DEX/INT</option>
                <option value="wp_flat">Weapon Power</option>
                <option value="wp_onhit">On-Hit Weapon Power (stacking)</option>
                <option value="wp_periodic">Weapon Power + Periodic On-Hit</option>
                <option value="wp_hpgated">Weapon Power + &gt;50% HP On-Hit</option>
              </select>
              <select id="ap-bvb-a-line3-tier" class="ap-bvb-a-line3-tier ap-bvb-line-tier">
                <option value="Low">Low</option>
                <option value="Mid" selected>Mid</option>
                <option value="High">High</option>
              </select>
              <input type="number" id="ap-bvb-a-line3-mainstat" class="ap-bvb-a-line3-mainstat ap-bvb-line-mainstat" min="10000" max="16000" step="100" value="14000" title="Flat STR/DEX/INT granted by this line (10000-16000)." hidden>
            </div>
            <div class="ap-bvb-results">
              <div class="ap-stat-card-row"><span class="ap-summary-label">Best Keystone</span><span class="ap-bvb-keystone ap-summary-value">—</span></div>
              <div class="ap-stat-card-row"><span class="ap-summary-label">vs No Bracelet</span><span class="ap-bvb-vs-none ap-summary-value">—</span></div>
              <div class="ap-stat-card-row ap-bvb-breakdown-row"><span class="ap-summary-label">Keystone/Crit Lines</span><span class="ap-bvb-grid ap-summary-value">—</span></div>
              <div class="ap-stat-card-row ap-bvb-breakdown-row"><span class="ap-summary-label">Spec Stat</span><span class="ap-bvb-spec-val ap-summary-value">—</span></div>
              <div class="ap-stat-card-row ap-bvb-breakdown-row"><span class="ap-summary-label">Other Lines</span><span class="ap-bvb-other-wrap"><label class="ap-bvb-inline-check ap-bvb-a-demons-wrap" title="Include the vs Demon/Archdemon portion of the Additional Damage &amp; vs Demon/Archdemon line - unchecked values only its Additional Damage portion." hidden><input type="checkbox" id="ap-bvb-a-demons" class="ap-bvb-a-demons"> vs Demons</label><label class="ap-bvb-inline-check ap-bvb-a-cdest-wrap" title="Estimate the +2% Cooldown line's penalty into its value - unchecked uses its raw stated Outgoing Damage % instead." hidden><input type="checkbox" id="ap-bvb-a-cdest" class="ap-bvb-a-cdest" checked> +CD Estimate</label><span class="ap-bvb-flat ap-summary-value">—</span></span></div>
              <div class="ap-stat-card-row ap-bvb-breakdown-row"><span class="ap-summary-label">WP/AP Lines</span><span class="ap-bvb-wp ap-summary-value">—</span></div>
            </div>
          </div>

          <div class="ap-bvb-card ap-bvb-card-b">
            <p class="ap-gear-card-title ap-bvb-card-title">Bracelet B</p>
            <div class="ap-calc-field-row">
              <label class="ap-calc-field-label" for="ap-bvb-b-spec">Spec Stat</label>
              <span class="ap-brace-info-icon ap-bvb-spec-note" title="This only reflects Spec's damage share on RE - it doesn't capture CDR or orb gen." hidden>i</span>
              <span class="ap-brace-warn-icon ap-bvb-spec-warn" title="Recommended to keep Specialization at 83 or higher on RE for CDR." hidden>!</span>
              <input type="number" id="ap-bvb-b-spec" class="ap-bvb-b-spec" min="60" max="120" step="1" value="80">
            </div>
            <div class="ap-calc-field-row">
              <label class="ap-calc-field-label" for="ap-bvb-b-crit">Crit Stat</label>
              <input type="number" id="ap-bvb-b-crit" class="ap-bvb-b-crit" min="60" max="120" step="1" value="100">
            </div>
            <div class="ap-bvb-line-row">
              <select id="ap-bvb-b-line1-type" class="ap-bvb-b-line1-type ap-bvb-line-type">
                <option value="none">— Line 3: None —</option>
                <option value="crit_rate_dual">Crit Rate % &amp; Crit Hit Dmg %</option>
                <option value="crit_rate" selected>Crit Rate %</option>
                <option value="crit_dmg_dual">Crit Damage % &amp; Crit Hit Dmg %</option>
                <option value="crit_dmg">Crit Damage %</option>
                <option value="damage_cd">Outgoing Dmg % &amp; Cooldown +2%</option>
                <option value="outgoing_stagger">Outgoing Dmg % &amp; Dmg to Staggered %</option>
                <option value="outgoing">Outgoing Damage %</option>
                <option value="add_a">Additional Damage %</option>
                <option value="add_b">Additional Damage % &amp; vs Demon/Archdemon</option>
                <option value="back_attack">Back Attack Damage %</option>
                <option value="stat_main">STR/DEX/INT</option>
                <option value="wp_flat">Weapon Power</option>
                <option value="wp_onhit">On-Hit Weapon Power (stacking)</option>
                <option value="wp_periodic">Weapon Power + Periodic On-Hit</option>
                <option value="wp_hpgated">Weapon Power + &gt;50% HP On-Hit</option>
              </select>
              <select id="ap-bvb-b-line1-tier" class="ap-bvb-b-line1-tier ap-bvb-line-tier">
                <option value="Low">Low</option>
                <option value="Mid" selected>Mid</option>
                <option value="High">High</option>
              </select>
              <input type="number" id="ap-bvb-b-line1-mainstat" class="ap-bvb-b-line1-mainstat ap-bvb-line-mainstat" min="10000" max="16000" step="100" value="14000" title="Flat STR/DEX/INT granted by this line (10000-16000)." hidden>
            </div>
            <div class="ap-bvb-line-row">
              <select id="ap-bvb-b-line2-type" class="ap-bvb-b-line2-type ap-bvb-line-type">
                <option value="none">— Line 4: None —</option>
                <option value="crit_rate_dual">Crit Rate % &amp; Crit Hit Dmg %</option>
                <option value="crit_rate">Crit Rate %</option>
                <option value="crit_dmg_dual">Crit Damage % &amp; Crit Hit Dmg %</option>
                <option value="crit_dmg" selected>Crit Damage %</option>
                <option value="damage_cd">Outgoing Dmg % &amp; Cooldown +2%</option>
                <option value="outgoing_stagger">Outgoing Dmg % &amp; Dmg to Staggered %</option>
                <option value="outgoing">Outgoing Damage %</option>
                <option value="add_a">Additional Damage %</option>
                <option value="add_b">Additional Damage % &amp; vs Demon/Archdemon</option>
                <option value="back_attack">Back Attack Damage %</option>
                <option value="stat_main">STR/DEX/INT</option>
                <option value="wp_flat">Weapon Power</option>
                <option value="wp_onhit">On-Hit Weapon Power (stacking)</option>
                <option value="wp_periodic">Weapon Power + Periodic On-Hit</option>
                <option value="wp_hpgated">Weapon Power + &gt;50% HP On-Hit</option>
              </select>
              <select id="ap-bvb-b-line2-tier" class="ap-bvb-b-line2-tier ap-bvb-line-tier">
                <option value="Low">Low</option>
                <option value="Mid" selected>Mid</option>
                <option value="High">High</option>
              </select>
              <input type="number" id="ap-bvb-b-line2-mainstat" class="ap-bvb-b-line2-mainstat ap-bvb-line-mainstat" min="10000" max="16000" step="100" value="14000" title="Flat STR/DEX/INT granted by this line (10000-16000)." hidden>
            </div>
            <div class="ap-bvb-line-row">
              <select id="ap-bvb-b-line3-type" class="ap-bvb-b-line3-type ap-bvb-line-type">
                <option value="none">— Line 5: None —</option>
                <option value="crit_rate_dual">Crit Rate % &amp; Crit Hit Dmg %</option>
                <option value="crit_rate">Crit Rate %</option>
                <option value="crit_dmg_dual">Crit Damage % &amp; Crit Hit Dmg %</option>
                <option value="crit_dmg">Crit Damage %</option>
                <option value="damage_cd" selected>Outgoing Dmg % &amp; Cooldown +2%</option>
                <option value="outgoing_stagger">Outgoing Dmg % &amp; Dmg to Staggered %</option>
                <option value="outgoing">Outgoing Damage %</option>
                <option value="add_a">Additional Damage %</option>
                <option value="add_b">Additional Damage % &amp; vs Demon/Archdemon</option>
                <option value="back_attack">Back Attack Damage %</option>
                <option value="stat_main">STR/DEX/INT</option>
                <option value="wp_flat">Weapon Power</option>
                <option value="wp_onhit">On-Hit Weapon Power (stacking)</option>
                <option value="wp_periodic">Weapon Power + Periodic On-Hit</option>
                <option value="wp_hpgated">Weapon Power + &gt;50% HP On-Hit</option>
              </select>
              <select id="ap-bvb-b-line3-tier" class="ap-bvb-b-line3-tier ap-bvb-line-tier">
                <option value="Low">Low</option>
                <option value="Mid" selected>Mid</option>
                <option value="High">High</option>
              </select>
              <input type="number" id="ap-bvb-b-line3-mainstat" class="ap-bvb-b-line3-mainstat ap-bvb-line-mainstat" min="10000" max="16000" step="100" value="14000" title="Flat STR/DEX/INT granted by this line (10000-16000)." hidden>
            </div>
            <div class="ap-bvb-results">
              <div class="ap-stat-card-row"><span class="ap-summary-label">Best Keystone</span><span class="ap-bvb-keystone ap-summary-value">—</span></div>
              <div class="ap-stat-card-row"><span class="ap-summary-label">vs No Bracelet</span><span class="ap-bvb-vs-none ap-summary-value">—</span></div>
              <div class="ap-stat-card-row ap-bvb-breakdown-row"><span class="ap-summary-label">Keystone/Crit Lines</span><span class="ap-bvb-grid ap-summary-value">—</span></div>
              <div class="ap-stat-card-row ap-bvb-breakdown-row"><span class="ap-summary-label">Spec Stat</span><span class="ap-bvb-spec-val ap-summary-value">—</span></div>
              <div class="ap-stat-card-row ap-bvb-breakdown-row"><span class="ap-summary-label">Other Lines</span><span class="ap-bvb-other-wrap"><label class="ap-bvb-inline-check ap-bvb-b-demons-wrap" title="Include the vs Demon/Archdemon portion of the Additional Damage &amp; vs Demon/Archdemon line - unchecked values only its Additional Damage portion." hidden><input type="checkbox" id="ap-bvb-b-demons" class="ap-bvb-b-demons"> vs Demons</label><label class="ap-bvb-inline-check ap-bvb-b-cdest-wrap" title="Estimate the +2% Cooldown line's penalty into its value - unchecked uses its raw stated Outgoing Damage % instead." hidden><input type="checkbox" id="ap-bvb-b-cdest" class="ap-bvb-b-cdest" checked> +CD Estimate</label><span class="ap-bvb-flat ap-summary-value">—</span></span></div>
              <div class="ap-stat-card-row ap-bvb-breakdown-row"><span class="ap-summary-label">WP/AP Lines</span><span class="ap-bvb-wp ap-summary-value">—</span></div>
            </div>
          </div>
        </div>

        <div class="ap-bvb-summary">
          <p class="ap-bvb-neither">Running neither: <span class="ap-bvb-no-bracelet-keystone">—</span></p>
          <p class="ap-bvb-diff-wrap"><span class="ap-bvb-diff">—</span></p>
          <p class="ap-brace-compare-flip-note ap-bvb-keystone-note" hidden>Bracelet A and B land on different best keystones - the comparison above already accounts for that, each running its own.</p>
        </div>
        <p class="ap-brace-compare-footer-note">Only as accurate as the Ark Passive, Character Data, and Bracelet Line inputs above are - fill everything in first or else.</p>
      </div>
    </details>
  </div>
</details>

<!-- Accessory Line Comparison: same idea and methodology as Bracelet Line
     Comparison above (see computeAccessoryComparison's own JS comment for
     the full breakdown), split into the 3 accessory slot shapes plus one
     "Any Accessory Slot" group for lines any of the 5 pieces can roll.
     Necklace/Rings value a candidate against your current Necklace/Ring
     selections above (each panel resets only that slot's own tracked
     value first); Earrings and Any Accessory Slot instead read the
     shared Gearing section above, same as Bracelet's own 5 WP/AP rows,
     and are hidden the same way until Weapon Power/Main Stat are filled
     in. Each panel is its own compact table so the four slot shapes stay
     visually distinct instead of one long undifferentiated list. Line
     Comparison values are computed against your actual current gear as
     configured elsewhere on this page - not a "slot reset to nothing"
     baseline (that's a real difference from the Bracelet panel above;
     see computeAccessoryComparison's own comment for why). Necklace/
     Earrings/Rings additionally show the sheet's own 6 combo columns
     (LL/ML/MM/HL/HM/HH) for their pair of lines rolled together; Any
     Accessory Slot doesn't, matching the sheet's own reasoning (a
     universal line can land on any of 5 pieces, so a full combo set
     would be enormous without being any more useful to look at). -->
<details class="ap-acc-compare">
  <summary>Accessory Line Comparison</summary>
  <div class="ap-brace-compare-body">
    <p class="ap-brace-compare-intro">Candidate accessory lines, valued as if each were the only line on that slot, against your Best Setup above. Combination lines show that row's line paired with the panel's other line, both rolled on the same piece(s).</p>

    <div class="ap-acc-panel ap-acc-necklace-panel">
      <p class="ap-acc-panel-title">Necklace</p>
      <div class="ap-acc-table-scroll">
      <table class="ap-brace-compare-table ap-acc-combo-table">
        <thead>
          <tr>
            <th class="ap-brace-th-label">Line</th>
            <th class="ap-brace-th-low">Low</th>
            <th class="ap-brace-th-mid">Mid</th>
            <th class="ap-brace-th-high">High</th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-low">L</span><span class="ap-brace-label-low">L</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-low">M</span><span class="ap-brace-label-low">L</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-low">M</span><span class="ap-brace-label-low">M</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-mid">H</span><span class="ap-brace-label-mid">L</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-mid">H</span><span class="ap-brace-label-mid">M</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-high">H</span><span class="ap-brace-label-high">H</span></th>
          </tr>
        </thead>
        <tbody class="ap-acc-necklace-rows"></tbody>
      </table>
      </div>
    </div>

    <div class="ap-acc-panel ap-acc-earrings-panel">
      <p class="ap-acc-panel-title">Earrings</p>
      <div class="ap-acc-table-scroll">
      <table class="ap-brace-compare-table ap-acc-combo-table">
        <thead>
          <tr>
            <th class="ap-brace-th-label">Line</th>
            <th class="ap-brace-th-low">Low</th>
            <th class="ap-brace-th-mid">Mid</th>
            <th class="ap-brace-th-high">High</th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-low">L</span><span class="ap-brace-label-low">L</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-low">M</span><span class="ap-brace-label-low">L</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-low">M</span><span class="ap-brace-label-low">M</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-mid">H</span><span class="ap-brace-label-mid">L</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-mid">H</span><span class="ap-brace-label-mid">M</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-high">H</span><span class="ap-brace-label-high">H</span></th>
          </tr>
        </thead>
        <tbody class="ap-acc-earrings-rows"></tbody>
      </table>
      </div>
    </div>

    <div class="ap-acc-panel ap-acc-rings-panel">
      <p class="ap-acc-panel-title">Rings</p>
      <div class="ap-acc-table-scroll">
      <table class="ap-brace-compare-table ap-acc-combo-table">
        <thead>
          <tr>
            <th class="ap-brace-th-label">Line</th>
            <th class="ap-brace-th-low">Low</th>
            <th class="ap-brace-th-mid">Mid</th>
            <th class="ap-brace-th-high">High</th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-low">L</span><span class="ap-brace-label-low">L</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-low">M</span><span class="ap-brace-label-low">L</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-low">M</span><span class="ap-brace-label-low">M</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-mid">H</span><span class="ap-brace-label-mid">L</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-mid">H</span><span class="ap-brace-label-mid">M</span></th>
            <th class="ap-acc-th-combo"><span class="ap-brace-label-high">H</span><span class="ap-brace-label-high">H</span></th>
          </tr>
        </thead>
        <tbody class="ap-acc-rings-rows"></tbody>
      </table>
      </div>
    </div>

    <div class="ap-acc-panel ap-acc-universal-panel">
      <p class="ap-acc-panel-title">Flat Bonuses</p>
      <table class="ap-brace-compare-table">
        <thead>
          <tr>
            <th class="ap-brace-th-label">Line</th>
            <th class="ap-brace-th-low">Low</th>
            <th class="ap-brace-th-mid">Mid</th>
            <th class="ap-brace-th-high">High</th>
          </tr>
        </thead>
        <tbody class="ap-acc-universal-rows"></tbody>
      </table>
    </div>

    <p class="ap-brace-compare-footer-note">Earrings and Flat Bonuses use values from the Gearing section and are hidden until Weapon Power and Main Stat are both filled in.</p>
  </div>
</details>

<!-- ArkGrid (Chaos Core) Comparison: same idea and methodology as
     Bracelet Line Comparison above - see computeArkGridComparison's own
     JS comment for the full breakdown. Deliberately needs no inputs of
     its own: Chaos Core: Flashy/Stable/Attack already have "current
     gear" tracking elsewhere on this page (the Flashy Atk/Stable Atk
     fields above, and Chaos Core: Attack in the Gearing section), so
     their candidates are valued against THOSE fields zeroed out first,
     exactly like Bracelet zeroes its own tracked fields; the rest
     (Swift/Crushing/Smoldering/Absorbing/Weapon) have no existing field
     to double-count against, so they're valued as a straight addition
     on top of your current totals instead, same as Bracelet's own 5
     WP/AP rows. Chaos Core: Speed and each type's non-damage half (DR,
     Attack Speed, WP Cooldown, Healing) are excluded entirely - not DPS,
     same precedent as the Bracelet panel's own on-hit Atk/Move Speed
     line.

     One row per Core TYPE (8 rows, not 16) - Relic/Ancient are columns
     within a row via a two-level header (a Points group, then a Relic/
     Ancient sub-header colored the same sky/orange as Low/High
     elsewhere) rather than doubling every row into a separate Relic
     line and Ancient line. 14 Points gets a single merged column
     instead of its own Relic/Ancient pair - that grade split doesn't
     unlock until 17p investment (every lookup table above agrees
     Relic|14P === Ancient|14P), so showing two identical-reading
     columns there was pure duplication; see computeArkGridComparison's
     own points6() comment for the one row (Smoldering's Burn estimate)
     where they aren't quite bit-identical and why a single Relic-grade
     value still stands in for both. Reuses the Accessory panel's own
     .ap-acc-table-scroll/.ap-acc-combo-table pattern for the wider-
     than-narrow-viewport table, same reasoning as that panel's combo
     columns.

     Core/14 Points deliberately do NOT use rowspan="2" (tried first,
     reverted) - a rowspan cell's border-bottom doesn't get a real
     border-collapse partner on its own far edge, so its bottom line had
     to be faked with box-shadow instead of a real border. That shadow
     and its neighbors' real collapsed borders are two different paint
     paths meeting at the same boundary pixel, which rendered as a
     visibly brighter seam right where the 14 Points/17 Points columns
     meet. Real row-2 cells for Core/14 Points (blank filler cells in
     row 1 just to hold that column's width/height) give every header
     cell in this table the same real, collapsed border-bottom - one
     paint path table-wide, so there's nothing left to mismatch. -->
<details class="ap-arkgrid-compare">
  <summary>Chaos Core Comparison</summary>
  <div class="ap-brace-compare-body">
    <p class="ap-brace-compare-intro">Candidate Chaos Cores, valued as if each were the only equipped one, against your Best Setup above.</p>
    <div class="ap-acc-table-scroll">
      <table class="ap-brace-compare-table ap-acc-combo-table ap-arkgrid-table">
        <thead>
          <tr>
            <th class="ap-arkgrid-th-blank" aria-hidden="true"></th>
            <th class="ap-arkgrid-th-blank" aria-hidden="true"></th>
            <th class="ap-arkgrid-th-group" colspan="2">17 Points</th>
            <th class="ap-arkgrid-th-group" colspan="2">20 Points</th>
          </tr>
          <tr>
            <th class="ap-brace-th-label">Core</th>
            <th>14 Points</th>
            <th class="ap-brace-th-low">Relic</th>
            <th class="ap-brace-th-high">Ancient</th>
            <th class="ap-brace-th-low">Relic</th>
            <th class="ap-brace-th-high">Ancient</th>
          </tr>
        </thead>
        <tbody class="ap-arkgrid-compare-rows"></tbody>
      </table>
    </div>
    <p class="ap-brace-compare-footer-note">Attack/Weapon cores use values from the Gearing section and are hidden until Weapon Power and Main Stat are both filled in.</p>
  </div>
</details>

</div> <!-- end ap-calc -->

## CPM Calculator

<p class="page-banner page-banner-warning">Not applicable to NA/EU servers yet</p>

*Compares Trixion damage to raid damage across builds. Watch [this](https://www.youtube.com/watch?v=dlUS8vUaNLA) to learn about Trixion multipliers.*

<div class="cpm-calc">

<div class="cpm-calc-header">

<p class="cpm-calc-hint">Enter your in-game Combat Analyzer's <strong>Back Attack Percentage</strong> below.</p>

<div class="spm-calc">
<div class="spm-calc-inputs">
<span class="spm-calc-info-icon" role="img" title="Time elapsed: &quot;2m 3s&quot;, &quot;123s&quot; (bare number = seconds), or mm:ss / hh:mm:ss. Max 120m 60s.">i</span>
<input type="text" class="spm-calc-time" placeholder="2m 3s" inputmode="text" autocomplete="off" maxlength="10" aria-label="Time elapsed, e.g. 2m 3s or 123 seconds, max 120m 60s">
<span class="spm-calc-x">&times;</span>
<input type="number" class="spm-calc-count" placeholder="31" min="0" max="999" step="1" aria-label="Number of surges, max 999">
</div>
<span class="spm-calc-result"><span class="spm-calc-result-value spm-calc-output-empty">—</span><span class="spm-calc-result-unit">CPM</span></span>
</div>

</div>

<div class="cpm-calc-row" data-build="333-re">
<div class="cpm-calc-row-header">
<span class="cpm-calc-row-title">333 (Ceiling)</span>
<span class="cpm-calc-row-meta">Trixion CPM 15 · Remaining Energy</span>
</div>
<div class="cpm-calc-body">
<div class="cpm-calc-inputs">
<label class="cpm-calc-field">
<span class="cpm-calc-field-label">Raid CPM</span>
<input type="number" class="cpm-calc-raidcpm" step="0.01" min="0" max="20" placeholder="e.g. 9.5">
</label>
<label class="cpm-calc-field">
<span class="cpm-calc-field-label cpm-calc-ba-label">Back Attack %</span>
<span class="cpm-calc-ba-wrap">
<input type="number" class="cpm-calc-ba-input" step="0.01" min="0" max="100" placeholder="e.g. 80">
<span class="cpm-calc-ba-rate"></span>
</span>
</label>
<label class="cpm-calc-field cpm-calc-field-muted">
<span class="cpm-calc-field-label">Base Multiplier</span>
<input type="number" class="cpm-calc-basemult-input" step="0.01" min="0.5" max="2">
</label>
</div>
<div class="cpm-calc-results">
<div class="cpm-calc-output">
<div class="cpm-calc-output-item">
<span class="cpm-calc-output-label">Adjusted Multiplier</span>
<span class="cpm-calc-adj-value">—</span>
</div>
<div class="cpm-calc-output-item">
<span class="cpm-calc-output-label">Final Multiplier</span>
<span class="cpm-calc-result-value">—</span>
</div>
</div>
<div class="stat-bar-track stat-bar-track-teal">
<div class="stat-bar-fill stat-bar-fill-teal cpm-calc-bar-fill" style="width: 0%"></div>
</div>
</div>
</div>
</div>

<div class="cpm-calc-row" data-build="111-surge">
<div class="cpm-calc-row-header">
<span class="cpm-calc-row-title">111 (Classic)</span>
<span class="cpm-calc-row-meta">Trixion CPM 10.952 · Surge</span>
</div>
<div class="cpm-calc-body">
<div class="cpm-calc-inputs">
<label class="cpm-calc-field">
<span class="cpm-calc-field-label">Raid CPM</span>
<input type="number" class="cpm-calc-raidcpm" step="0.01" min="0" max="20" placeholder="e.g. 6.5">
</label>
<label class="cpm-calc-field">
<span class="cpm-calc-field-label cpm-calc-ba-label">Back Attack %</span>
<span class="cpm-calc-ba-wrap">
<input type="number" class="cpm-calc-ba-input" step="0.01" min="0" max="100" placeholder="e.g. 92">
<span class="cpm-calc-ba-rate"></span>
</span>
</label>
<label class="cpm-calc-field cpm-calc-field-muted">
<span class="cpm-calc-field-label">Base Multiplier</span>
<input type="number" class="cpm-calc-basemult-input" step="0.01" min="0.5" max="2">
</label>
</div>
<div class="cpm-calc-results">
<div class="cpm-calc-output">
<div class="cpm-calc-output-item">
<span class="cpm-calc-output-label">Adjusted Multiplier</span>
<span class="cpm-calc-adj-value">—</span>
</div>
<div class="cpm-calc-output-item">
<span class="cpm-calc-output-label">Final Multiplier</span>
<span class="cpm-calc-result-value">—</span>
</div>
</div>
<div class="stat-bar-track stat-bar-track-teal">
<div class="stat-bar-fill stat-bar-fill-teal cpm-calc-bar-fill" style="width: 0%"></div>
</div>
</div>
</div>
</div>

<div class="cpm-calc-row" data-build="222-surge">
<div class="cpm-calc-row-header">
<span class="cpm-calc-row-title">222 (Speedy)</span>
<span class="cpm-calc-row-meta">Trixion CPM 10.084 · Surge</span>
</div>
<div class="cpm-calc-body">
<div class="cpm-calc-inputs">
<label class="cpm-calc-field">
<span class="cpm-calc-field-label">Raid CPM</span>
<input type="number" class="cpm-calc-raidcpm" step="0.01" min="0" max="20" placeholder="e.g. 6">
</label>
<label class="cpm-calc-field">
<span class="cpm-calc-field-label cpm-calc-ba-label">Back Attack %</span>
<span class="cpm-calc-ba-wrap">
<input type="number" class="cpm-calc-ba-input" step="0.01" min="0" max="100" placeholder="e.g. 84">
<span class="cpm-calc-ba-rate"></span>
</span>
</label>
<label class="cpm-calc-field cpm-calc-field-muted">
<span class="cpm-calc-field-label">Base Multiplier</span>
<input type="number" class="cpm-calc-basemult-input" step="0.01" min="0.5" max="2">
</label>
</div>
<div class="cpm-calc-results">
<div class="cpm-calc-output">
<div class="cpm-calc-output-item">
<span class="cpm-calc-output-label">Adjusted Multiplier</span>
<span class="cpm-calc-adj-value">—</span>
</div>
<div class="cpm-calc-output-item">
<span class="cpm-calc-output-label">Final Multiplier</span>
<span class="cpm-calc-result-value">—</span>
</div>
</div>
<div class="stat-bar-track stat-bar-track-teal">
<div class="stat-bar-fill stat-bar-fill-teal cpm-calc-bar-fill" style="width: 0%"></div>
</div>
</div>
</div>
</div>

</div>

## Bid Calculator

*Finds the optimal auction bid amount based on personal intent.*

<div class="bid-calc">

<div class="bid-calc-controls">
<div class="bid-calc-field-row">
<label class="bid-calc-field-label" for="bid-market-price">Market Price</label>
<input type="text" inputmode="numeric" autocomplete="off" id="bid-market-price" class="bid-market-price" placeholder="e.g. 9,000">
</div>
<div class="bid-calc-toggle" role="group" aria-label="Raid size">
<span class="bid-calc-field-label">Raid Size</span>
<label class="bid-calc-radio-label"><input type="radio" name="bid-raid-size" class="bid-raid-size" value="4"> 4</label>
<label class="bid-calc-radio-label"><input type="radio" name="bid-raid-size" class="bid-raid-size" value="8" checked> 8</label>
<label class="bid-calc-radio-label"><input type="radio" name="bid-raid-size" class="bid-raid-size" value="16"> 16</label>
<label class="bid-calc-radio-label"><input type="radio" name="bid-raid-size" class="bid-raid-size" value="custom"> Custom</label>
</div>
<div class="bid-calc-field-row bid-calc-custom-raid-size-row" hidden>
<label class="bid-calc-field-label" for="bid-custom-raid-size">Custom Raid Size</label>
<input type="number" inputmode="numeric" id="bid-custom-raid-size" class="bid-custom-raid-size" min="2" step="1" placeholder="e.g. 6">
</div>
</div>

<div class="bid-calc-intent" role="group" aria-label="Bidding intent">
<span class="bid-calc-field-label">Intent</span>
<label class="bid-calc-radio-label" title="Splits the gold evenly - you and everyone else net the same amount."><input type="radio" name="bid-intent" class="bid-intent" value="equal" checked> Equal Profit</label>
<label class="bid-calc-radio-label" title="Solid profit if you win - and outbidding you costs the rival more."><input type="radio" name="bid-intent" class="bid-intent" value="punish"> Profit &amp; Punish Next Bidder</label>
<label class="bid-calc-radio-label" title="Highest possible profit - if you get outbid, it just falls back to an even split."><input type="radio" name="bid-intent" class="bid-intent" value="max"> Max Profit</label>
</div>

<div class="bid-calc-result">
<span class="bid-calc-result-label">Amount to Bid</span>
<span class="bid-calc-result-value">—</span>
<button type="button" class="bid-calc-copy-btn" aria-label="Copy amount to bid" data-tooltip="Copy amount" disabled>
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
</button>
</div>

<table class="bid-calc-table">
<thead>
<tr>
<th class="bid-calc-th-label"></th>
<th>Bid</th>
<th>Profit</th>
<th>Party Profit</th>
</tr>
</thead>
<tbody>
<tr class="bid-calc-row-you">
<td class="bid-calc-row-label">You</td>
<td class="bid-calc-you-bid">—</td>
<td class="bid-calc-you-profit">—</td>
<td class="bid-calc-you-party">—</td>
</tr>
<tr class="bid-calc-row-next">
<td class="bid-calc-row-label">Next Bidder</td>
<td class="bid-calc-next-bid">—</td>
<td class="bid-calc-next-profit">—</td>
<td class="bid-calc-next-party">—</td>
</tr>
</tbody>
</table>

<p class="bid-calc-footnote">Party Profit is each other member's cut if that row wins. Next Bidder needs a +10% raise to outbid you.</p>

</div>

## Useful Links

| Link | What it's for |
|---|---|
| [Arsonistic's Calculator](https://docs.google.com/spreadsheets/d/1_0J7liyM_yw16pyn6TKlF1YGaIt5n_A9hSoLnT3yTUc/edit?usp=sharing) | *Tune KS/LB, bracelet, answers ALL gearing questions* |
| [KR Calculator (Translated)](https://docs.google.com/spreadsheets/d/1RKpzg6sPNe7fuPDudJHAs0qbFukOwSyhMynDOijfoKY/edit?usp=sharing) | *Simpler, only for Ark Passive settings* |
| [Astrogem Optimizer](https://airplaner.github.io/lostark-arkgrid-gem-locator-v2/) | *Screencapture auto-minmax for Ark Grid* |
| [Lost Ark Bible](https://lostark.bible/) | *Logs and raid statistics* |
| [LOA Logs](https://github.com/snoww/loa-logs) | *DPS meter download* |
| [Lost Ark Nexus](https://lostark-nexus-archive.pages.dev/guides/deathblade/) | *For pre-Ark Grid Standard RE build* |
| [Fatal Wave Dump](https://docs.google.com/document/d/1vs1YC_7adaYwtfN9cHO3x2KuMPq6GcKRlGo5vnsN4Lk/edit) | *For 333 Standard (spincutter) NA build* |
| [Maxroll](https://maxroll.gg/lost-ark) | *Resources for beginners* |
| [Inven RE Guide](https://www.inven.co.kr/board/lostark/5497/140080) | *Korean guide for 333, 111 HH and Void Skip* |
| [Inven 313 Guide](https://www.inven.co.kr/board/lostark/5497/171285) | *Korean guide for 313 RE* |
| [Inven 222 Guide](https://www.inven.co.kr/board/lostark/5497/175796) | *Korean guide for 222 Surge* |