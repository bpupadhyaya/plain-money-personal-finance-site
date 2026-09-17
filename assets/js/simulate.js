/* PlainMoney — "The Journey of a Dollar" simulation.
   A Sankey flow diagram of one paycheck, plus a simple forward-projection panel.
   All computed client-side from slider inputs — nothing saved, nothing sent anywhere.
   Requires d3.v7 + d3-sankey (assets/js/vendor/), loaded before this file. */

(function () {
  'use strict';
  if (typeof d3 === 'undefined' || !d3.sankey) return;

  var els = {
    gross: document.getElementById('in-gross'),
    tax: document.getElementById('in-tax'),
    needs: document.getElementById('in-needs'),
    wants: document.getElementById('in-wants'),
    ef: document.getElementById('in-ef'),
    ret: document.getElementById('in-ret'),
    years: document.getElementById('in-years'),
    growth: document.getElementById('in-growth')
  };
  var readouts = {
    tax: document.getElementById('out-tax'),
    needs: document.getElementById('out-needs'),
    wants: document.getElementById('out-wants'),
    savedebt: document.getElementById('out-savedebt'),
    ef: document.getElementById('out-ef'),
    ret: document.getElementById('out-ret'),
    extradebt: document.getElementById('out-extradebt'),
    years: document.getElementById('out-years'),
    growth: document.getElementById('out-growth')
  };
  var svg = document.getElementById('sankey-svg');
  var cardsEl = document.getElementById('flow-cards');
  var forwardEl = document.getElementById('forward-out');

  function fmt(n) {
    return Math.round(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }
  function clampPct(n) { return Math.max(0, Math.min(100, n)); }

  var COLORS = {
    'Gross pay': '#1c1b18',
    'Taxes & FICA': '#837e70',
    'Take-home pay': '#134a34',
    'Needs': '#1e6a4b',
    'Wants': '#a8690e',
    'Savings & debt payoff': '#278860',
    'Emergency fund': '#1e6a4b',
    'Retirement & investing': '#123328',
    'Extra debt payoff': '#8a5a0c'
  };

  function compute() {
    var gross = Math.max(0, +els.gross.value);
    var taxPct = clampPct(+els.tax.value);
    var needsPct = clampPct(+els.needs.value);
    var wantsPct = clampPct(+els.wants.value);
    if (needsPct + wantsPct > 100) { wantsPct = 100 - needsPct; els.wants.value = wantsPct; }
    var saveDebtPct = 100 - needsPct - wantsPct;

    var efPct = clampPct(+els.ef.value);
    var retPct = clampPct(+els.ret.value);
    if (efPct + retPct > 100) { retPct = 100 - efPct; els.ret.value = retPct; }
    var extraDebtPct = 100 - efPct - retPct;

    var taxAmt = gross * taxPct / 100;
    var netPay = gross - taxAmt;
    var needsAmt = netPay * needsPct / 100;
    var wantsAmt = netPay * wantsPct / 100;
    var saveDebtAmt = netPay * saveDebtPct / 100;
    var efAmt = saveDebtAmt * efPct / 100;
    var retAmt = saveDebtAmt * retPct / 100;
    var extraDebtAmt = saveDebtAmt * extraDebtPct / 100;

    readouts.tax.textContent = taxPct.toFixed(0) + '%';
    readouts.needs.textContent = needsPct.toFixed(0) + '%';
    readouts.wants.textContent = wantsPct.toFixed(0) + '%';
    readouts.savedebt.textContent = saveDebtPct.toFixed(0) + '%';
    readouts.ef.textContent = efPct.toFixed(0) + '%';
    readouts.ret.textContent = retPct.toFixed(0) + '%';
    readouts.extradebt.textContent = extraDebtPct.toFixed(0) + '%';

    return {
      gross: gross, taxAmt: taxAmt, netPay: netPay,
      needsAmt: needsAmt, wantsAmt: wantsAmt, saveDebtAmt: saveDebtAmt,
      efAmt: efAmt, retAmt: retAmt, extraDebtAmt: extraDebtAmt
    };
  }

  function buildGraph(f) {
    var nodeNames = ['Gross pay', 'Taxes & FICA', 'Take-home pay', 'Needs', 'Wants',
      'Savings & debt payoff', 'Emergency fund', 'Retirement & investing', 'Extra debt payoff'];
    var idx = {};
    nodeNames.forEach(function (n, i) { idx[n] = i; });
    var nodes = nodeNames.map(function (n) { return { name: n }; });
    var links = [
      { source: idx['Gross pay'], target: idx['Taxes & FICA'], value: Math.max(0.01, f.taxAmt) },
      { source: idx['Gross pay'], target: idx['Take-home pay'], value: Math.max(0.01, f.netPay) },
      { source: idx['Take-home pay'], target: idx['Needs'], value: Math.max(0.01, f.needsAmt) },
      { source: idx['Take-home pay'], target: idx['Wants'], value: Math.max(0.01, f.wantsAmt) },
      { source: idx['Take-home pay'], target: idx['Savings & debt payoff'], value: Math.max(0.01, f.saveDebtAmt) },
      { source: idx['Savings & debt payoff'], target: idx['Emergency fund'], value: Math.max(0.01, f.efAmt) },
      { source: idx['Savings & debt payoff'], target: idx['Retirement & investing'], value: Math.max(0.01, f.retAmt) },
      { source: idx['Savings & debt payoff'], target: idx['Extra debt payoff'], value: Math.max(0.01, f.extraDebtAmt) }
    ];
    return { nodes: nodes, links: links };
  }

  function render() {
    var f = compute();
    var graph = buildGraph(f);

    var width = svg.parentElement.clientWidth;
    var height = window.innerWidth < 640 ? 620 : 460;
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.innerHTML = '';

    var sankeyGen = d3.sankey()
      .nodeId(function (d) { return d.index; })
      .nodeWidth(16)
      .nodePadding(width < 640 ? 30 : 22)
      .extent([[1, 10], [width - 1, height - 10]]);

    var g = sankeyGen({
      nodes: graph.nodes.map(function (d) { return Object.assign({}, d); }),
      links: graph.links.map(function (d) { return Object.assign({}, d); })
    });

    var svgns = 'http://www.w3.org/2000/svg';
    var linkPath = d3.sankeyLinkHorizontal();

    var linkGroup = document.createElementNS(svgns, 'g');
    g.links.forEach(function (l) {
      var path = document.createElementNS(svgns, 'path');
      path.setAttribute('d', linkPath(l));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', COLORS[l.source.name] || '#1e6a4b');
      path.setAttribute('stroke-opacity', '0.32');
      path.setAttribute('stroke-width', Math.max(1, l.width));
      path.setAttribute('class', 'flow-link');
      var title = document.createElementNS(svgns, 'title');
      title.textContent = l.source.name + ' → ' + l.target.name + ': ' + fmt(l.value);
      path.appendChild(title);
      linkGroup.appendChild(path);
    });
    svg.appendChild(linkGroup);

    var nodeGroup = document.createElementNS(svgns, 'g');
    g.nodes.forEach(function (n) {
      var rect = document.createElementNS(svgns, 'rect');
      rect.setAttribute('x', n.x0);
      rect.setAttribute('y', n.y0);
      rect.setAttribute('width', n.x1 - n.x0);
      rect.setAttribute('height', Math.max(1, n.y1 - n.y0));
      rect.setAttribute('fill', COLORS[n.name] || '#1e6a4b');
      rect.setAttribute('rx', 3);
      nodeGroup.appendChild(rect);

      var label = document.createElementNS(svgns, 'text');
      var isLeft = n.x0 < width / 2;
      label.setAttribute('x', isLeft ? n.x1 + 8 : n.x0 - 8);
      label.setAttribute('y', (n.y0 + n.y1) / 2 - 6);
      label.setAttribute('text-anchor', isLeft ? 'start' : 'end');
      label.setAttribute('class', 'sankey-label');
      label.textContent = n.name;
      nodeGroup.appendChild(label);

      var amt = document.createElementNS(svgns, 'text');
      amt.setAttribute('x', isLeft ? n.x1 + 8 : n.x0 - 8);
      amt.setAttribute('y', (n.y0 + n.y1) / 2 + 12);
      amt.setAttribute('text-anchor', isLeft ? 'start' : 'end');
      amt.setAttribute('class', 'sankey-amt');
      var amount = n.value != null ? n.value : 0;
      amt.textContent = fmt(amount) + '/mo';
      nodeGroup.appendChild(amt);
    });
    svg.appendChild(nodeGroup);

    cardsEl.innerHTML = [
      ['Taxes & FICA (leaves)', f.taxAmt, '#837e70'],
      ['Needs', f.needsAmt, '#1e6a4b'],
      ['Wants', f.wantsAmt, '#a8690e'],
      ['Emergency fund', f.efAmt, '#1e6a4b'],
      ['Retirement & investing', f.retAmt, '#123328'],
      ['Extra debt payoff', f.extraDebtAmt, '#8a5a0c']
    ].map(function (row) {
      return '<div class="flow-card"><span class="dot" style="background:' + row[2] + '"></span>' +
        '<div><div class="fc-label">' + row[0] + '</div><div class="fc-amt">' + fmt(row[1]) + '/mo</div></div></div>';
    }).join('');

    renderForward(f);
  }

  function renderForward(f) {
    var years = Math.max(1, Math.min(40, +els.years.value));
    var growthPct = Math.max(0, +els.growth.value) / 100;
    readouts.years.textContent = years;
    readouts.growth.textContent = (growthPct * 100).toFixed(1) + '%';

    var monthly = f.efAmt + f.retAmt;
    var monthlyRate = growthPct / 12;
    var bal = 0;
    for (var m = 0; m < years * 12; m++) bal = bal * (1 + monthlyRate) + monthly;
    var contributed = monthly * 12 * years;
    var grown = Math.max(0, bal - contributed);

    var debtTotal = f.extraDebtAmt * 12 * years;

    forwardEl.innerHTML =
      '<div class="tool-result"><div class="r-num">' + fmt(bal) + '</div>' +
      '<div class="r-label">Emergency fund + retirement, after ' + years + ' years — ' + fmt(contributed) + ' contributed, ' + fmt(grown) + ' from growth</div></div>' +
      '<div class="tool-result" style="margin-top:10px"><div class="r-num">' + fmt(debtTotal) + '</div>' +
      '<div class="r-label">Total sent to extra debt payoff over the same ' + years + ' years, at this rate</div></div>';
  }

  [els.gross, els.tax, els.needs, els.wants, els.ef, els.ret, els.years, els.growth].forEach(function (el) {
    if (el) el.addEventListener('input', render);
  });
  window.addEventListener('resize', render);
  render();
})();
