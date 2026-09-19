(function () {
  var MARKET_FEE_PCT = 5;
  var FEE = 1 - MARKET_FEE_PCT / 100;
  var RAISE_FACTOR = 1.1;
  var PUNISH_MARGIN = 0.15;
  var MARKET_PRICE_MIN = 0;
  var MARKET_PRICE_MAX = 1000000000000;
  var RAID_SIZE_MIN = 2;
  function round(n) {
    var r = Math.round(n);
    return Object.is(r, -0) ? 0 : r;
  }
  function fmt(n) {
    return round(n).toLocaleString("en-US");
  }
  function parseNumber(str) {
    return parseFloat(String(str).replace(/,/g, ""));
  }
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
  function partyShareFor(bid, raidSize) {
    return round((bid * FEE) / (raidSize - 1));
  }
  function equalRatio(raidSize) {
    return FEE / (1 + FEE / (raidSize - 1));
  }
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
  function readRaidSize(root) {
    var active = root.querySelector(".bid-calc-toggle .ap-build-chip.ap-build-chip-active");
    if (!active) return 8;
    if (active.dataset.value !== "custom") return parseInt(active.dataset.value, 10);
    var customInput = root.querySelector(".bid-custom-raid-size");
    var n = customInput ? parseInt(customInput.value, 10) : NaN;
    return isFinite(n) && n >= RAID_SIZE_MIN ? n : null;
  }
  function updateCustomRaidSizeVisibility(root) {
    var active = root.querySelector(".bid-calc-toggle .ap-build-chip.ap-build-chip-active");
    var row = root.querySelector(".bid-calc-custom-raid-size-row");
    if (row) row.hidden = !active || active.dataset.value !== "custom";
  }
  function initToggleGroup(root, groupSelector, onChange) {
    var buttons = root.querySelectorAll(groupSelector + " .ap-build-chip");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("ap-build-chip-active")) return;
        buttons.forEach(function (b) {
          b.classList.remove("ap-build-chip-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("ap-build-chip-active");
        btn.setAttribute("aria-pressed", "true");
        onChange(btn);
      });
    });
  }
  function update(root) {
    var priceInput = root.querySelector(".bid-market-price");
    var intentInput = root.querySelector(".bid-calc-intent .ap-build-chip.ap-build-chip-active");
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
    var intent = intentInput ? intentInput.dataset.value : "equal";
    var priceValid = isFinite(price) && price > MARKET_PRICE_MIN && price <= MARKET_PRICE_MAX;
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
    var worthOutbidding = rivalProfitVal > partyShareVal;
    root.querySelector(".bid-calc-row-next").classList.toggle("bid-calc-row-next-risk", worthOutbidding);
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
  function clampOnBlur(input, min, max, root, formatted) {
    window.SiteUtils.clampOnBlur(input, min, max, function () { update(root); }, {
      parse: formatted ? parseNumber : parseFloat,
      format: formatted ? function (n) { return n.toLocaleString("en-US"); } : function (n) { return n; },
    });
  }
  function initRoot(root) {
    if (root.dataset.bidCalcInit) return;
    root.dataset.bidCalcInit = "1";
    initCopyButton(root);
    var priceInput = root.querySelector(".bid-market-price");
    var customRaidInput = root.querySelector(".bid-custom-raid-size");
    root.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("input", function () {
        if (input === priceInput) formatPriceInput(input);
        update(root);
      });
    });
    initToggleGroup(root, ".bid-calc-toggle", function () {
      updateCustomRaidSizeVisibility(root);
      update(root);
    });
    initToggleGroup(root, ".bid-calc-intent", function () {
      update(root);
    });
    updateCustomRaidSizeVisibility(root);
    clampOnBlur(priceInput, MARKET_PRICE_MIN, MARKET_PRICE_MAX, root, true);
    if (customRaidInput) {
      clampOnBlur(customRaidInput, RAID_SIZE_MIN, Infinity, root, false);
    }
    update(root);
  }
  window.SiteUtils.registerRenderer(".bid-calc", initRoot);
})();