// Raid auction bid calculator.
//
// How a Lost Ark loot auction actually pays out (this is the whole model,
// there's no hidden mechanic beyond it): the winner keeps the item and
// pays their bid in gold; that gold is NOT returned to the winner, it's
// split evenly across every OTHER party member. So:
//   winner's profit      = netSellValue - bid
//   each other member's profit = bid / (raidSize - 1)
// netSellValue is the market price after the Auction House's cut (5% by
// default - see MARKET_FEE_DEFAULT below).
//
// Outbidding raises the current bid by a fixed 10% (RAISE_FACTOR below),
// not a flat gold amount - confirmed against reference screenshots (every
// "Next Bidder" bid was exactly currentBid x 1.10, across all three
// Intents).
//
// The three Intents pick a bid off that same model:
//   - Equal Profit: the bid where the winner's profit and each other
//     member's cut come out identical. Solve netValue - B = B/(n-1) for B:
//       B = netValue * (n-1) / n
//   - Max Profit: the bid where, IF someone outbids you at the standard
//     10% raise, their resulting bid lands exactly on the Equal Profit
//     bid above - i.e. being outbid on Max Profit just turns the auction
//     into the Equal Profit scenario for whoever wins instead of you.
//       B = equalBid / RAISE_FACTOR
//     Reference data shows this specific bid gets rounded UP to the
//     nearest 10 gold (75,568.18 -> 75,570) - Equal Profit and the Next
//     Bidder figures elsewhere just round to the nearest gold, so this
//     nearest-10 rounding looks specific to Max Profit's own bid.
//   - Profit & Punish Next Bidder: sits between Max Profit and Equal
//     Profit - enough profit to be worthwhile, while (per the game's own
//     tooltip) making it a losing move for a rival to outbid you instead
//     of letting you win.
//     Confirmed against a reference calculator's own bundled JS (shipped
//     unminified, variable-name-mangled but otherwise readable): this bid
//     is NOT derived from any formula - it's a hardcoded constant times
//     market price:
//       raid 4: bid = round(price * 0.695)
//       raid 8: bid = round(price * 0.78)
//     Checked whether 0.695/0.78 reduce to any clean function of Equal
//     Profit's and Max Profit's own ratios (midpoint, consistent
//     interpolation fraction, anything) - they don't (0.73 of the way
//     from Max to Equal for raid 4, 0.32 of the way for raid 8, no
//     relation between those two numbers). Read: someone picked these by
//     feel, not by formula, so there's nothing to solve here - just
//     match the numbers. See PUNISH_RATIOS below for how that's adapted
//     for our fee-configurable version (the reference has no fee field -
//     0.95 is baked directly into every one of its constants).
//
// Max Profit vs. that reference calculator - SOLVED, not just closely
// matched. Its own source (same bundle referenced above) shows Equal
// Profit and Max Profit are computed exactly the way this file computes
// them - netValue*(n-1)/n, and that divided by 1.1 - just pre-computed
// into a hardcoded constant and rounded to 4 decimal places before
// shipping, instead of computed live:
//   equal, raid 4: exact 0.7125          -> hardcoded 0.7125 (no loss)
//   equal, raid 8: exact 0.83125         -> hardcoded 0.83125 (no loss)
//   max,   raid 4: exact 0.64772727...   -> hardcoded 0.6477
//   max,   raid 8: exact 0.75568181...   -> hardcoded 0.7557
// That 4-decimal truncation on the Max Profit constant is the entire
// source of the ~0.002-0.02% gap chased earlier in this file's history -
// not an iterative solver, not a different formula, just a rounded
// magic number. Their bid = round(rawMarketPrice * thatConstant); this
// file's netValue/(equalBid)/RAISE_FACTOR algebra reproduces the exact
// (untruncated) value, which is strictly more precise, so it's kept
// as-is rather than switched to their rounded constant.
(function () {
  var MARKET_FEE_DEFAULT = 5; // percent, standard AH cut
  var MARKET_PRICE_MIN = 0;
  var MARKET_PRICE_MAX = 10000000;
  var MARKET_FEE_MIN = 0;
  var MARKET_FEE_MAX = 20;
  var RAISE_FACTOR = 1.1; // minimum outbid = current bid x 1.10

  // The reference's exact hardcoded constants (0.695, 0.78) are ratios of
  // raw market price, baked against its fixed 5% fee. Dividing out that
  // 0.95 gives the ratio of netValue instead, so this scales correctly
  // when someone changes Market Fee % away from the default - at the
  // default 5% fee this reproduces the reference number exactly; at any
  // other fee it's our own extrapolation, since the reference has no fee
  // field to check against.
  var PUNISH_RATIOS = {
    4: 0.695 / 0.95,
    8: 0.78 / 0.95,
  };

  function fmt(n) {
    return Math.round(n).toLocaleString("en-US");
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

  function computeBid(netValue, raidSize, intent) {
    var equalBid = (netValue * (raidSize - 1)) / raidSize;
    if (intent === "max") {
      var maxBidRaw = equalBid / RAISE_FACTOR;
      return Math.ceil(maxBidRaw / 10) * 10;
    }
    if (intent === "punish") {
      var punishRatio = PUNISH_RATIOS[raidSize];
      // Defensive fallback for any raid size without a confirmed ratio -
      // should only run if PUNISH_RATIOS falls out of sync with the
      // raid-size options actually offered in the UI.
      if (punishRatio === undefined) return Math.round(equalBid);
      return Math.round(netValue * punishRatio);
    }
    return Math.round(equalBid);
  }

  function update(root) {
    var priceInput = root.querySelector(".bid-market-price");
    var feeInput = root.querySelector(".bid-market-fee");
    var raidSizeInput = root.querySelector('input[name="bid-raid-size"]:checked');
    var intentInput = root.querySelector('input[name="bid-intent"]:checked');

    var resultValue = root.querySelector(".bid-calc-result-value");
    var copyBtn = root.querySelector(".bid-calc-copy-btn");

    var youBid = root.querySelector(".bid-calc-you-bid");
    var youProfit = root.querySelector(".bid-calc-you-profit");
    var youParty = root.querySelector(".bid-calc-you-party");
    var nextBid = root.querySelector(".bid-calc-next-bid");
    var nextProfit = root.querySelector(".bid-calc-next-profit");
    var nextParty = root.querySelector(".bid-calc-next-party");

    var price = parseNumber(priceInput.value);
    var feeRaw = parseFloat(feeInput.value);
    var fee = isFinite(feeRaw) && feeRaw >= MARKET_FEE_MIN && feeRaw <= MARKET_FEE_MAX ? feeRaw : MARKET_FEE_DEFAULT;
    var raidSize = raidSizeInput ? parseInt(raidSizeInput.value, 10) : 8;
    var intent = intentInput ? intentInput.value : "equal";

    var priceValid = isFinite(price) && price > MARKET_PRICE_MIN && price <= MARKET_PRICE_MAX;
    // priceInput lost its native min/max (type="number" only) when it
    // became type="text" for comma support, so :out-of-range no longer
    // fires on its own - this class is the JS equivalent, driven off the
    // same priceValid check.
    priceInput.classList.toggle("bid-calc-input-invalid", priceInput.value !== "" && !priceValid);

    var table = root.querySelector(".bid-calc-table");

    if (!priceValid) {
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

    var netValue = price * (1 - fee / 100);
    var bid = computeBid(netValue, raidSize, intent);
    var yourProfitVal = netValue - bid;
    var partyShareVal = bid / (raidSize - 1);

    resultValue.textContent = fmt(bid) + "g";
    resultValue.dataset.rawBid = String(Math.round(bid));
    if (copyBtn) copyBtn.disabled = false;

    youBid.textContent = fmt(bid) + "g";
    youProfit.textContent = fmt(yourProfitVal) + "g";
    youParty.textContent = fmt(partyShareVal) + "g";

    var rivalBid = Math.round(bid * RAISE_FACTOR);
    var rivalProfitVal = netValue - rivalBid;
    var rivalPartyShareVal = rivalBid / (raidSize - 1);

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
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var temp = document.createElement("textarea");
    temp.value = text;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      /* nothing more we can do - the button's own catch handles feedback */
    }
    document.body.removeChild(temp);
    return Promise.resolve();
  }

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
      copyToClipboard(raw)
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
    if (!input) return;
    input.addEventListener("blur", function () {
      var raw = formatted ? parseNumber(input.value) : parseFloat(input.value);
      if (!isFinite(raw)) return;
      var clamped = Math.min(max, Math.max(min, raw));
      if (clamped !== raw) {
        input.value = formatted ? clamped.toLocaleString("en-US") : clamped;
        update(root);
      }
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

    root.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("input", function () {
        if (input === priceInput) formatPriceInput(input);
        update(root);
      });
    });

    clampOnBlur(priceInput, MARKET_PRICE_MIN, MARKET_PRICE_MAX, root, true);
    clampOnBlur(root.querySelector(".bid-market-fee"), MARKET_FEE_MIN, MARKET_FEE_MAX, root);

    update(root);
  }

  // Was a hand-rolled document$-only subscription (see site-utils.js's
  // registerRenderer doc comment for why that's not safe to assume covers
  // every case on its own) - the dataset guard above is what makes
  // initRoot() safe to hand to it directly.
  window.SiteUtils.registerRenderer(".bid-calc", initRoot);
})();