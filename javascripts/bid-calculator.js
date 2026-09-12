// FORK GUIDE: INFRA - generic site plumbing, no class-specific content.
// Keep as-is.
//
// Raid auction bid calculator.
//
// Credit: the fee-on-bid model and the generalized Profit & Punish solver
// below were worked out by cross-checking Lost Ark's own patch notes
// against Lost Ark Stuff's Bid Calculator (https://lostarkstuff.vercel.app/bid-calculator),
// whose own bundled source ships unminified. Our markup, styling, and
// integration into this site are independent - only the underlying
// formulas are shared.
//
// How a Lost Ark loot auction actually pays out (this is the whole model,
// there's no hidden mechanic beyond it):
//   - The winner keeps the item and pays their bid in gold.
//   - That gold is NOT returned to the winner - the loot-auction system
//     takes its own cut (MARKET_FEE_PCT below) off the FULL bid before
//     splitting what's left evenly across every OTHER party member. This
//     is the fee's "full-bid application" - an earlier version of this
//     file (and, it turns out, of the game itself) only taxed the item's
//     eventual resale, not the bid on its way to teammates. That's no
//     longer how it works:
//       each other member's profit = (bid * (1 - fee)) / (raidSize - 1)
//   - Separately, if the winner resells the item on the Auction House,
//     that sale eats the same cut (Lost Ark uses one AH fee rate for
//     both mechanics, confirmed against a reference calculator's own
//     bundled source - see below):
//       winner's profit = (marketPrice * (1 - fee)) - bid
//   - Outbidding raises the current bid by a fixed 10% (RAISE_FACTOR
//     below), not a flat gold amount.
//
// Fee is no longer user-adjustable - it's fixed at MARKET_FEE_PCT. The
// 0-20% field this file used to expose has been removed: matching a
// reference calculator's own rebuild, which dropped the same field.
//
// The three Intents pick a bid off that same model:
//   - Equal Profit: the bid where the winner's profit and each other
//     member's cut come out identical. Solve netValue - B = B*FEE/(n-1)
//     for B (netValue = marketPrice * FEE):
//       B = marketPrice * FEE / (1 + FEE/(n-1))
//     EQUAL_RATIO(n) below is that multiplier.
//   - Max Profit: the bid where, IF someone outbids you at the standard
//     10% raise, their resulting bid lands exactly on the Equal Profit
//     bid above - i.e. being outbid on Max Profit just turns the auction
//     into the Equal Profit scenario for whoever wins instead of you.
//       B = equalBid / RAISE_FACTOR
//     An earlier version of this file rounded Max Profit UP to the
//     nearest 10 gold, matching a reference calculator's old behavior.
//     That reference has since dropped the nearest-10 rounding - Max
//     Profit is now rounded to the nearest gold like everything else, so
//     this file follows suit.
//   - Profit & Punish Next Bidder: the LOWEST bid where a rational rival
//     outbidding you at the mandatory +10% raise ends up with a profit
//     at least PUNISH_MARGIN (15%) below what they'd have gotten as your
//     party-share cut instead - or at least 1 gold worse off, whichever
//     is bigger - so outbidding you is a losing move for them.
//     An earlier version of this file hardcoded this as a magic ratio of
//     market price per raid size (0.695 for 4-player, 0.78 for 8-player),
//     lifted from a reference calculator that only supported those fixed
//     sizes. That reference has since been rebuilt to solve this properly
//     for ANY raid size >= 2 (confirmed against its own updated,
//     still-unminified source) - punishBid() below ports that same
//     solve: start from an algebraic estimate, then walk to the exact
//     integer gold value that satisfies the margin condition (rounding
//     on both the bid and the rival's raised bid means the estimate can
//     land a gold or two off in either direction, so there's no clean
//     closed form).
(function () {
  var MARKET_FEE_PCT = 5; // fixed AH / loot-auction cut - no longer user-adjustable
  var FEE = 1 - MARKET_FEE_PCT / 100;
  var RAISE_FACTOR = 1.1; // minimum outbid = current bid x 1.10
  var PUNISH_MARGIN = 0.15; // Profit & Punish's target: rival nets >=15% less than your party share

  var MARKET_PRICE_MIN = 0;
  var MARKET_PRICE_MAX = 1000000000000; // matches the reference calculator's raised cap
  var RAID_SIZE_MIN = 2;

  // Avoids the -0 that Math.round can hand back for tiny negative inputs
  // (e.g. a rival profit that nets out to exactly zero through floating
  // point). "-0" .toLocaleString()s to "0" anyway, but keeping raw
  // numbers clean avoids surprises anywhere they get compared directly.
  function round(n) {
    var r = Math.round(n);
    return Object.is(r, -0) ? 0 : r;
  }

  function fmt(n) {
    return round(n).toLocaleString("en-US");
  }

  // ----- Market price input: comma-grouped as you type -----
  // The field is type="text" (not type="number") specifically so it CAN
  // hold commas - a real number input rejects the "," keystroke outright.
  // parseNumber() is the one place that turns whatever's in the box back
  // into a float; every other function should go through it rather than
  // parseFloat()-ing the raw value directly (that would stop at the first
  // comma and silently truncate, e.g. "974,612" -> 974).
  function parseNumber(str) {
    return parseFloat(String(str).replace(/,/g, ""));
  }

  // Re-grouping the digits on every keystroke moves the caret unless we
  // put it back ourselves - this counts how many digits preceded the
  // caret before formatting, then walks the reformatted string back out
  // to the same digit count, so typing in the middle of "974,612" doesn't
  // bounce the caret to the end.
  function formatPriceInput(input) {
    var caret = input.selectionStart;
    var digitsBeforeCaret = input.value.slice(0, caret).replace(/[^\d]/g, "").length;
    var digitsOnly = input.value.replace(/[^\d]/g, "");
    var formatted = digitsOnly === "" ? "" : Number(digitsOnly).toLocaleString("en-US");

    input.value = formatted;

    var pos = 0;
    var seen = 0;
    while (pos < formatted.length && seen < digitsBeforeCaret) {
      if (/\d/.test(formatted[pos])) seen++;
      pos++;
    }
    input.setSelectionRange(pos, pos);
  }

  function nextBidFor(bid) {
    return round(bid * RAISE_FACTOR);
  }

  // Each OTHER party member's cut if `bid` wins - the fee applies to the
  // full bid now, not just to the item's eventual resale (see header).
  function partyShareFor(bid, raidSize) {
    return round((bid * FEE) / (raidSize - 1));
  }

  // Equal Profit's price->bid ratio for a given raid size (see header
  // comment for the algebra it's solved from).
  function equalRatio(raidSize) {
    return FEE / (1 + FEE / (raidSize - 1));
  }

  // Profit & Punish: lowest bid satisfying the margin condition. See
  // header comment for why this walks to an exact value instead of using
  // a closed form.
  function punishBid(marketPrice, raidSize) {
    if (marketPrice <= 0) return 0;

    var netValue = marketPrice * FEE;
    var perMemberFactor = FEE / (raidSize - 1);
    var estimate = netValue / (RAISE_FACTOR + perMemberFactor * (1 - PUNISH_MARGIN));
    var bid = round(estimate);

    function satisfies(b) {
      var yourPartyShare = partyShareFor(b, raidSize);
      var rivalProfit = round(netValue - nextBidFor(b));
      return yourPartyShare - rivalProfit >= Math.max(1, yourPartyShare * PUNISH_MARGIN);
    }

    while (bid > 0 && satisfies(bid - 1)) bid--;
    while (!satisfies(bid)) bid++;
    return bid;
  }

  function computeBid(marketPrice, raidSize, intent) {
    if (intent === "max") {
      return round((marketPrice * equalRatio(raidSize)) / RAISE_FACTOR);
    }
    if (intent === "punish") {
      return punishBid(marketPrice, raidSize);
    }
    return round(marketPrice * equalRatio(raidSize));
  }

  // ----- Raid size: presets + Custom -----
  // Returns null (rather than throwing or silently clamping) when the
  // Custom field is selected but doesn't hold a usable number yet -
  // update() treats that the same as an invalid price: blank out the
  // results instead of computing off garbage.
  function readRaidSize(root) {
    var checked = root.querySelector('input[name="bid-raid-size"]:checked');
    if (!checked) return 8;
    if (checked.value !== "custom") return parseInt(checked.value, 10);

    var customInput = root.querySelector(".bid-custom-raid-size");
    var n = customInput ? parseInt(customInput.value, 10) : NaN;
    return isFinite(n) && n >= RAID_SIZE_MIN ? n : null;
  }

  function updateCustomRaidSizeVisibility(root) {
    var checked = root.querySelector('input[name="bid-raid-size"]:checked');
    var row = root.querySelector(".bid-calc-custom-raid-size-row");
    if (row) row.hidden = !checked || checked.value !== "custom";
  }

  function update(root) {
    var priceInput = root.querySelector(".bid-market-price");
    var intentInput = root.querySelector('input[name="bid-intent"]:checked');
    var customRaidInput = root.querySelector(".bid-custom-raid-size");

    var resultValue = root.querySelector(".bid-calc-result-value");
    var copyBtn = root.querySelector(".bid-calc-copy-btn");

    var youBid = root.querySelector(".bid-calc-you-bid");
    var youProfit = root.querySelector(".bid-calc-you-profit");
    var youParty = root.querySelector(".bid-calc-you-party");
    var nextBid = root.querySelector(".bid-calc-next-bid");
    var nextProfit = root.querySelector(".bid-calc-next-profit");
    var nextParty = root.querySelector(".bid-calc-next-party");

    var price = parseNumber(priceInput.value);
    var raidSize = readRaidSize(root);
    var intent = intentInput ? intentInput.value : "equal";

    var priceValid = isFinite(price) && price > MARKET_PRICE_MIN && price <= MARKET_PRICE_MAX;
    // priceInput lost its native min/max (type="number" only) when it
    // became type="text" for comma support, so :out-of-range no longer
    // fires on its own - this class is the JS equivalent, driven off the
    // same priceValid check.
    priceInput.classList.toggle("bid-calc-input-invalid", priceInput.value !== "" && !priceValid);

    var raidSizeValid = raidSize !== null;
    if (customRaidInput) {
      customRaidInput.classList.toggle("bid-calc-input-invalid", customRaidInput.value !== "" && !raidSizeValid);
    }

    var table = root.querySelector(".bid-calc-table");
    var valid = priceValid && raidSizeValid;

    if (!valid) {
      resultValue.textContent = "—";
      resultValue.classList.add("bid-calc-result-empty");
      table.classList.add("bid-calc-table-empty");
      [youBid, youProfit, youParty, nextBid, nextProfit, nextParty].forEach(function (el) {
        el.textContent = "—";
      });
      delete resultValue.dataset.rawBid;
      if (copyBtn) copyBtn.disabled = true;
      return;
    }

    resultValue.classList.remove("bid-calc-result-empty");
    table.classList.remove("bid-calc-table-empty");

    var netValue = price * FEE;
    var bid = computeBid(price, raidSize, intent);
    var yourProfitVal = netValue - bid;
    var partyShareVal = partyShareFor(bid, raidSize);

    resultValue.textContent = fmt(bid) + "g";
    resultValue.dataset.rawBid = String(round(bid));
    if (copyBtn) copyBtn.disabled = false;

    youBid.textContent = fmt(bid) + "g";
    youProfit.textContent = fmt(yourProfitVal) + "g";
    youParty.textContent = fmt(partyShareVal) + "g";

    var rivalBid = nextBidFor(bid);
    var rivalProfitVal = netValue - rivalBid;
    var rivalPartyShareVal = partyShareFor(rivalBid, raidSize);

    nextBid.textContent = fmt(rivalBid) + "g";
    nextProfit.textContent = fmt(rivalProfitVal) + "g";
    nextParty.textContent = fmt(rivalPartyShareVal) + "g";

    // Flags whether outbidding you actually pays off for a rational rival,
    // so the CSS can give the Next Bidder row a quiet "not worth it" vs
    // "you'd likely get outbid here" treatment instead of leaving both
    // Intents looking identical.
    var worthOutbidding = rivalProfitVal > partyShareVal;
    root.querySelector(".bid-calc-row-next").classList.toggle("bid-calc-row-next-risk", worthOutbidding);
  }

  // No localStorage persistence here, unlike some of this site's other
  // calculators - a market price and raid size are per-auction, not a
  // standing preference, so a value left over from yesterday's raid isn't
  // useful to restore, it's just stale data to clear out before the next
  // one. Starts empty every load.

  // ----- Copy button (same pattern as build-compare.js's share button) -----
  function initCopyButton(root) {
    var copyBtn = root.querySelector(".bid-calc-copy-btn");
    var resultValue = root.querySelector(".bid-calc-result-value");
    if (!copyBtn || !resultValue) return;

    var COPY_ICON = copyBtn.innerHTML;
    var CHECK_ICON =
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    var resetTimer = null;

    function reset() {
      copyBtn.innerHTML = COPY_ICON;
      copyBtn.classList.remove("bid-calc-copy-btn-copied");
      copyBtn.setAttribute("data-tooltip", "Copy amount");
    }

    copyBtn.addEventListener("click", function () {
      var raw = resultValue.dataset.rawBid;
      if (!raw) return;
      window.SiteUtils.copyToClipboard(raw)
        .then(function () {
          clearTimeout(resetTimer);
          copyBtn.innerHTML = CHECK_ICON;
          copyBtn.classList.add("bid-calc-copy-btn-copied");
          copyBtn.setAttribute("data-tooltip", "Copied!");
          resetTimer = setTimeout(reset, 1500);
        })
        .catch(function () {
          clearTimeout(resetTimer);
          copyBtn.setAttribute("data-tooltip", "Couldn't copy");
          resetTimer = setTimeout(reset, 2000);
        });
    });
  }

  // formatted: pass true for the comma-grouped price field so the clamped
  // result gets re-grouped too, instead of landing back in the box as a
  // plain digit string.
  function clampOnBlur(input, min, max, root, formatted) {
    window.SiteUtils.clampOnBlur(input, min, max, function () { update(root); }, {
      parse: formatted ? parseNumber : parseFloat,
      format: formatted ? function (n) { return n.toLocaleString("en-US"); } : function (n) { return n; },
    });
  }

  function initRoot(root) {
    // Unlike the JSON-data-driven widgets registerRenderer was originally
    // written for, this attaches listeners directly onto the calculator's
    // own static markup instead of rebuilding it from scratch each call -
    // so, unlike those widgets, calling this twice on the same root would
    // double-attach every listener below rather than harmlessly re-doing
    // idempotent work. This guard is what makes it safe to hand to
    // registerRenderer, whose three triggers can otherwise all fire for
    // the same root on a single hard load.
    if (root.dataset.bidCalcInit) return;
    root.dataset.bidCalcInit = "1";

    initCopyButton(root);

    var priceInput = root.querySelector(".bid-market-price");
    var customRaidInput = root.querySelector(".bid-custom-raid-size");

    root.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("input", function () {
        if (input === priceInput) formatPriceInput(input);
        if (input.name === "bid-raid-size") updateCustomRaidSizeVisibility(root);
        update(root);
      });
    });

    updateCustomRaidSizeVisibility(root);
    clampOnBlur(priceInput, MARKET_PRICE_MIN, MARKET_PRICE_MAX, root, true);
    if (customRaidInput) {
      // No upper bound - any raid size 2 or more is a valid, if unusual,
      // input (Lost Ark's own raids top out well below anything a person
      // would plausibly type here, so there's nothing meaningful to cap).
      clampOnBlur(customRaidInput, RAID_SIZE_MIN, Infinity, root, false);
    }

    update(root);
  }

  // Was a hand-rolled document$-only subscription (see site-utils.js's
  // registerRenderer doc comment for why that's not safe to assume covers
  // every case on its own) - the dataset guard above is what makes
  // initRoot() safe to hand to it directly.
  window.SiteUtils.registerRenderer(".bid-calc", initRoot);
})();