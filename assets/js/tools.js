/* PlainMoney site — client-side calculators.
   Pure math over numbers you type in this page. Nothing here is sent anywhere or
   saved anywhere (no localStorage, no network) — refresh the page and it's gone.
   That's deliberate: it's the honest contrast with the app, which keeps your real
   numbers on your device, across sessions, private. See each tool's .tool-not-saved line. */

(function () {
  'use strict';

  function fmtUSD(n) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }
  function fmtUSD2(n) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  }
  function num(el) {
    var v = parseFloat(el.value);
    return isFinite(v) ? v : 0;
  }

  /* ---- 50/30/20 budget split ---- */
  function mount503020(root) {
    var income = root.querySelector('[data-in="income"]');
    var out = root.querySelector('[data-out]');
    function run() {
      var take = Math.max(0, num(income));
      var needs = take * 0.5, wants = take * 0.3, save = take * 0.2;
      out.innerHTML =
        '<div class="tool-result"><div class="r-num">' + fmtUSD(needs) + '</div><div class="r-label">Needs (50%) — rent, utilities, groceries, minimum debt payments</div></div>' +
        '<div class="tool-result" style="margin-top:10px"><div class="r-num">' + fmtUSD(wants) + '</div><div class="r-label">Wants (30%) — everything not essential</div></div>' +
        '<div class="tool-result" style="margin-top:10px"><div class="r-num">' + fmtUSD(save) + '</div><div class="r-label">Savings & extra debt payoff (20%)</div></div>';
    }
    income.addEventListener('input', run);
    run();
  }

  /* ---- Emergency fund target ---- */
  function mountEmergencyFund(root) {
    var essentials = root.querySelector('[data-in="essentials"]');
    var months = root.querySelector('[data-in="months"]');
    var out = root.querySelector('[data-out]');
    function run() {
      var e = Math.max(0, num(essentials));
      var m = Math.max(1, num(months) || 3);
      var target = e * m;
      out.innerHTML = '<div class="tool-result"><div class="r-num">' + fmtUSD(target) +
        '</div><div class="r-label">Target cushion — ' + m + ' months of essential spending</div></div>';
    }
    essentials.addEventListener('input', run);
    months.addEventListener('input', run);
    run();
  }

  /* ---- Compound growth projector ---- */
  function mountCompound(root) {
    var start = root.querySelector('[data-in="start"]');
    var monthly = root.querySelector('[data-in="monthly"]');
    var rate = root.querySelector('[data-in="rate"]');
    var years = root.querySelector('[data-in="years"]');
    var out = root.querySelector('[data-out]');
    var chart = root.querySelector('[data-chart]');

    function run() {
      var p = Math.max(0, num(start));
      var c = Math.max(0, num(monthly));
      var r = Math.max(0, num(rate)) / 100;
      var y = Math.max(1, Math.min(50, num(years) || 10));
      var monthlyRate = r / 12;
      var balances = [p];
      var bal = p;
      for (var yr = 1; yr <= y; yr++) {
        for (var mo = 0; mo < 12; mo++) {
          bal = bal * (1 + monthlyRate) + c;
        }
        balances.push(bal);
      }
      var contributed = p + c * 12 * y;
      var growth = bal - contributed;
      out.innerHTML =
        '<div class="tool-result"><div class="r-num">' + fmtUSD(bal) + '</div><div class="r-label">Projected balance after ' + y + ' years</div></div>' +
        '<div class="tool-row" style="grid-template-columns:1fr 1fr;margin-top:10px">' +
        '<div class="tool-result"><div class="r-num" style="font-size:18px">' + fmtUSD(contributed) + '</div><div class="r-label">You put in</div></div>' +
        '<div class="tool-result"><div class="r-num" style="font-size:18px">' + fmtUSD(Math.max(0, growth)) + '</div><div class="r-label">Growth from compounding</div></div>' +
        '</div>';
      if (chart) {
        var max = Math.max.apply(null, balances) || 1;
        var w = 100 / balances.length;
        var bars = balances.map(function (b, i) {
          var h = Math.max(2, (b / max) * 100);
          return '<span style="height:' + h.toFixed(1) + '%;flex:1"></span>';
        }).join('');
        chart.innerHTML = bars;
      }
    }
    [start, monthly, rate, years].forEach(function (el) { el.addEventListener('input', run); });
    run();
  }

  /* ---- Real cost / inflation ---- */
  function mountRealCost(root) {
    var amount = root.querySelector('[data-in="amount"]');
    var years = root.querySelector('[data-in="years"]');
    var inflation = root.querySelector('[data-in="inflation"]');
    var out = root.querySelector('[data-out]');
    function run() {
      var a = Math.max(0, num(amount));
      var y = Math.max(0, num(years));
      var infl = Math.max(0, num(inflation)) / 100;
      var future = a * Math.pow(1 + infl, y);
      var lost = future - a;
      out.innerHTML =
        '<div class="tool-result"><div class="r-num">' + fmtUSD(future) + '</div><div class="r-label">What ' + fmtUSD(a) + ' today will need to become in ' + y + ' years, to buy the same amount</div></div>' +
        '<div class="tool-note">At ' + (infl * 100).toFixed(1) + '%/yr average inflation, prices roughly ' + (future / a).toFixed(2) + '&times; over that span.</div>';
    }
    [amount, years, inflation].forEach(function (el) { el.addEventListener('input', run); });
    run();
  }

  /* ---- Debt payoff order (snowball vs avalanche) ---- */
  function mountDebtOrder(root) {
    var rows = Array.prototype.slice.call(root.querySelectorAll('[data-debt-row]'));
    var out = root.querySelector('[data-out]');
    function run() {
      var debts = rows.map(function (row, i) {
        var name = row.querySelector('[data-debt="name"]').value.trim() || ('Debt ' + (i + 1));
        var balance = num(row.querySelector('[data-debt="balance"]'));
        var apr = num(row.querySelector('[data-debt="apr"]'));
        return { name: name, balance: balance, apr: apr };
      }).filter(function (d) { return d.balance > 0; });

      if (!debts.length) { out.innerHTML = '<p class="tool-note">Enter at least one balance to see an order.</p>'; return; }

      var snowball = debts.slice().sort(function (a, b) { return a.balance - b.balance; });
      var avalanche = debts.slice().sort(function (a, b) { return b.apr - a.apr; });

      function list(arr) {
        return '<ol style="padding-left:20px;display:grid;gap:4px">' + arr.map(function (d) {
          return '<li>' + d.name + ' — ' + fmtUSD(d.balance) + ' at ' + d.apr.toFixed(1) + '%</li>';
        }).join('') + '</ol>';
      }

      out.innerHTML =
        '<div class="tool-row" style="grid-template-columns:1fr 1fr">' +
        '<div class="tool-result"><div class="r-label" style="font-weight:700;color:var(--green-900);margin-bottom:6px">Snowball — smallest balance first</div>' + list(snowball) + '</div>' +
        '<div class="tool-result"><div class="r-label" style="font-weight:700;color:var(--green-900);margin-bottom:6px">Avalanche — highest rate first</div>' + list(avalanche) + '</div>' +
        '</div>';
    }
    rows.forEach(function (row) {
      row.querySelectorAll('input').forEach(function (el) { el.addEventListener('input', run); });
    });
    run();
  }

  var MOUNTERS = {
    '503020': mount503020,
    'emergency-fund': mountEmergencyFund,
    'compound': mountCompound,
    'real-cost': mountRealCost,
    'debt-order': mountDebtOrder
  };

  document.querySelectorAll('[data-tool]').forEach(function (root) {
    var kind = root.getAttribute('data-tool');
    if (MOUNTERS[kind]) MOUNTERS[kind](root);
  });
})();
