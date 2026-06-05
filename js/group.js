var EV_EVENTS_BUDGET = [];
// Swansway Marketing Portal — Group page functions // v8-cache-bust

var _channelChartInst = null;


function renderGroupCalendar() {
  const g = document.getElementById('group-cal-grid');
  g.innerHTML = GROUP_CALENDAR.map(q=>`
    <div>
      <div class="cal-quarter-title">${q.q}</div>
      ${q.events.map(e=>`
        <div class="cal-event" style="background:${e.color}12;border-left-color:${e.color}">
          <div class="cal-event-brand" style="color:${e.color}">${e.brand}</div>
          <div>${e.label}</div>
        </div>
      `).join('')}
    </div>
  `).join('');
}


function renderGroupChannels() {
  const g = document.getElementById('group-channel-list');
  if (!g) return;
  // If no channels yet but brand data exists, aggregate first
  if ((!GROUP_CHANNELS || !GROUP_CHANNELS.length) && Object.keys(BRAND_CHANNELS_DATA).length && !_updatingGroupChannels) {
    updateGroupChannelsFromBrands();
    return; // updateGroupChannelsFromBrands will call renderGroupChannels when done
  }
  console.log('renderGroupChannels: GROUP_CHANNELS=', GROUP_CHANNELS.length, 'BRAND_CHANNELS_DATA brands=', Object.keys(BRAND_CHANNELS_DATA).length);
  // If still no data, show empty state
  if (!GROUP_CHANNELS || !GROUP_CHANNELS.length) {
    // Check if Supabase has loaded yet
    if (!Object.keys(BRAND_CHANNELS_DATA).length) {
      g.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-faint)"><div style="font-size:24px;margin-bottom:8px">⏳</div><div>Loading channel data…</div></div>';
    } else {
      g.innerHTML = '<div style="padding:24px;text-align:center;color:var(--ink-faint);font-size:13px">No channel data yet. Set brand channel mixes in Admin → Brand Channels.</div>';
    }
    var cardsEl = document.getElementById('channel-summary-cards');
    if (cardsEl) cardsEl.innerHTML = '';
    return;
  }
  // Get group total from site budgets
  var groupTotal = Object.values(SITE_BUDGETS).reduce(function(s, d) {
    return s + (d.annual_planned || 0);
  }, 0);
  if (groupTotal === 0) {
    groupTotal = BUDGET_BRANDS.reduce(function(s, b) { return s + (b.annual || 0); }, 0);
  }

  // Update summary cards with top 4 channels
  var cardsEl = document.getElementById('channel-summary-cards');
  if (cardsEl && GROUP_CHANNELS.length >= 4) {
    cardsEl.innerHTML = GROUP_CHANNELS.slice(0,4).map(function(c) {
      var budgetVal = groupTotal > 0
        ? '£' + (groupTotal * c.pct / 100 / 1000).toFixed(0) + 'K'
        : '—';
      // Extract short note (first part before em dash)
      var shortNote = c.note.split('—')[0].trim().split('.')[0].trim();
      if (shortNote.length > 30) shortNote = shortNote.substring(0,30) + '…';
      return '<div class="metric" style="color:' + c.color + '">'
        + '<div class="metric-label">' + c.n + '</div>'
        + '<div class="metric-val">' + c.pct + '%</div>'
        + '<div class="metric-sub">' + budgetVal + ' — ' + shortNote + '</div>'
        + '</div>';
    }).join('');
  }
  // Get group total from site budgets (single source of truth)
  var groupTotal = Object.values(SITE_BUDGETS).reduce(function(s, d) {
    return s + (d.annual_planned || 0);
  }, 0);
  // Fall back to sum of BUDGET_BRANDS if site budgets not loaded yet
  if (groupTotal === 0) {
    groupTotal = BUDGET_BRANDS.reduce(function(s, b) { return s + (b.annual || 0); }, 0);
  }
  // Update subtitle with contributing brands count
  var subEl = document.getElementById('channels-subtitle');
  var brandCount = Object.keys(BRAND_CHANNELS_DATA).length;
  var totalBrands = 12;
  if (subEl) subEl.textContent = brandCount > 0
    ? brandCount + ' of ' + totalBrands + ' brands contributing · add more in Admin → Brand Channels'
    : 'Set brand channel mixes in Admin → Brand Channels';

  g.innerHTML = GROUP_CHANNELS.map(function(c) {
    var gbpK = groupTotal > 0 ? Math.round(groupTotal * c.pct / 100 / 1000) : 0;
    var budgetVal = gbpK > 0 ? '£' + gbpK + 'K' : '—';
    var barWidth = Math.min(Math.round(c.pct), 100);
    var brandTags = '';
    if (c.brands && c.brands.length) {
      brandTags = '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px">'
        + c.brands.map(function(b) {
          return '<span style="font-size:11px;background:' + c.color + '18;border:1px solid ' + c.color + '40;color:var(--ink);padding:2px 10px;border-radius:12px;font-family:var(--font-m)">'
            + (function(n){ var m={'audi':'Audi','vw':'VW','landrover':'Land Rover','cupra':'CUPRA','peugeot':'Peugeot','byd':'BYD','omoda':'OMODA/JAECOO','vwcommercial':'VW Commercial','bmw':'BMW','mini':'MINI','hyundai':'Hyundai','kia':'Kia'}; return m[n.toLowerCase()]||n.charAt(0).toUpperCase()+n.slice(1); })(b.name) + '<span style="color:var(--ink-soft);margin-left:4px">£' + b.gbp.toLocaleString() + '</span></span>';
        }).join('') + '</div>';
    }
    return '<div class="ch-item">'
      + '<div class="ch-row">'
      + '<div style="width:10px;height:10px;border-radius:50%;background:' + c.color + ';flex-shrink:0"></div>'
      + '<div class="ch-name">' + c.n + '</div>'
      + '<div class="ch-pct" style="color:' + c.color + '">' + c.pct + '%</div>'
      + '<div class="ch-budget">' + budgetVal + '</div>'
      + '</div>'
      + '<div style="height:6px;background:var(--surface-2);border-radius:3px;margin-bottom:' + (brandTags || c.note ? '8px' : '0') + '">'
      + '<div style="height:6px;border-radius:3px;background:' + c.color + ';width:' + barWidth + '%;transition:width .6s ease"></div>'
      + '</div>'
      + brandTags
      + (c.note ? '<div style="font-size:11px;color:var(--ink-faint);margin-top:2px">' + c.note + '</div>' : '')
      + '</div>';
  }).join('');
  // Render chart after list — data is now available
  if (typeof renderChannelChart === 'function') setTimeout(renderChannelChart, 50);
}


function renderGroupKPIs() {
  var g = document.getElementById('group-kpi-list');
  if (!g) return;
  console.log('renderGroupKPIs: ' + GROUP_KPIS.length + ' KPIs');

  // ── Summary cards (top 4 KPIs) ──
  var summaryEl = document.getElementById('kpi-summary-cards');
  if (summaryEl && GROUP_KPIS.length) {
    summaryEl.innerHTML = GROUP_KPIS.slice(0,4).map(function(k) {
      var isPlaceholder = !k.t || k.t === '\u2014' || k.t === '0' || k.t === 0 || k.t === '--';
      var pctColor = k.p >= 70 ? '#15803D' : k.p >= 50 ? '#D97706' : '#C8102E';
      var col = isPlaceholder ? '#F59E0B' : pctColor;
      return '<div class="metric" style="color:' + col + '">'
        + '<div class="metric-label">' + (k.cat||'') + '</div>'
        + '<div class="metric-val">' + (k.a||k.t||'--') + '</div>'
        + '<div class="metric-sub">' + (k.l||k.label||'') + '</div>'
        + '</div>';
    }).join('');
  }

  // ── Full KPI list ──
  g.innerHTML = GROUP_KPIS.map(function(k, i) {
    var isPlaceholder = !k.t || k.t === '\u2014' || k.t === '0' || k.t === 0 || k.t === '--';
    var hasActual = k.a && k.a !== '--' && k.a !== '';
    var pctColor = k.p >= 70 ? '#15803D' : k.p >= 50 ? '#D97706' : '#C8102E';
    var borderCol = isPlaceholder ? '#F59E0B' : '#15803D';
    var bgCol = isPlaceholder ? 'rgba(245,158,11,0.03)' : 'rgba(21,128,61,0.03)';

    var whyHow = '';
    if ((k.why && k.why.indexOf('Admin') === -1) || (k.how && k.how.indexOf('Admin') === -1)) {
      whyHow = '<div class="kpi-detail-row">'
        + (k.why && k.why.indexOf('Admin') === -1 ? '<div class="kpi-detail-box"><div class="kpi-detail-lbl">Why it matters</div><div class="kpi-detail-txt">' + k.why + '</div></div>' : '')
        + (k.how && k.how.indexOf('Admin') === -1 ? '<div class="kpi-detail-box"><div class="kpi-detail-lbl">How measured</div><div class="kpi-detail-txt">' + k.how + '</div></div>' : '')
        + '</div>';
    }
    var benchOwner = '';
    if ((k.bench && k.bench.indexOf('Admin') === -1) || (k.o && k.o !== '--')) {
      benchOwner = '<div class="kpi-detail-row">'
        + (k.bench && k.bench.indexOf('Admin') === -1 ? '<div class="kpi-detail-box kpi-detail-box--border"><div class="kpi-detail-lbl">Benchmark</div><div class="kpi-detail-txt">' + k.bench + '</div></div>' : '')
        + (k.o && k.o !== '--' ? '<div class="kpi-detail-box kpi-detail-box--border"><div class="kpi-detail-lbl">Owner</div><div class="kpi-detail-txt" style="font-weight:600;color:var(--ink)">' + k.o + '</div></div>' : '')
        + '</div>';
    }

    return '<div class="kpi-card">'
      + '<div class="kpi-card-main">'
        + '<div class="kpi-card-left">'
          + '<div class="kpi-card-cat" style="color:' + (isPlaceholder?'#F59E0B':pctColor) + '">' + (k.cat||'') + '</div>'
          + '<div class="kpi-card-title">' + (k.l||k.label||'') + '</div>'
          + '<div class="kpi-card-def">' + (k.def||'') + '</div>'
        + '</div>'
        + '<div class="kpi-card-right">'
          + (hasActual ? '<div class="kpi-card-stat"><div class="kpi-card-val" style="color:' + pctColor + '">' + k.a + '</div><div class="kpi-card-stat-lbl">Actual</div></div>' : '')
          + '<div class="kpi-card-stat"><div class="kpi-card-val" style="font-size:' + (hasActual?'16':'24') + 'px;color:' + (hasActual?'var(--ink-soft)':(isPlaceholder?'#F59E0B':'var(--swansway)')) + '">' + (k.t||'--') + '</div>'
          + '<div class="kpi-card-stat-lbl">' + (isPlaceholder ? 'Target <span class="kpi-set-badge">SET IN ADMIN</span>' : 'Target') + '</div></div>'
        + '</div>'
      + '</div>'
      + '<div class="kpi-card-bar"><div style="height:100%;border-radius:3px;background:' + pctColor + ';width:' + Math.min(k.p||0,100) + '%;transition:width .6s ease"></div></div>'
      + whyHow
      + benchOwner
      + '</div>';
  }).join('');

  console.log('renderGroupKPIs: done, ' + GROUP_KPIS.length + ' cards rendered');
}


function renderGroupBudgetChart() {
  const ctx = document.getElementById('groupBudgetChart');
  if(!ctx||!window.Chart) return;
  // Destroy existing chart instance to prevent "canvas already in use" error
  const existing = Chart.getChart(ctx);
  if(existing) existing.destroy();
  const data = [
    {label:'Audi',value:19,color:'#CC0000'},
    {label:'VW',value:14,color:'#001E5A'},
    {label:'Land Rover',value:12,color:'#1D4E1D'},
    {label:'SEAT/CUPRA',value:10,color:'#E2231A'},
    {label:'Honda',value:9,color:'#B22222'},
    {label:'Peugeot',value:9,color:'#1B3A6B'},
    {label:'VW Commercial',value:8,color:'#1B4F72'},
    {label:'Jaguar',value:7,color:'#2C3E50'},
    {label:'BYD',value:6,color:'#0066CC'},
    {label:'OMODA/JAECOO',value:4,color:'#6B21A8'},
    {label:'Motor Match',value:2,color:'#374151'},
  ];
  new Chart(ctx,{type:'doughnut',data:{labels:data.map(d=>d.label),datasets:[{data:data.map(d=>d.value),backgroundColor:data.map(d=>d.color),borderWidth:2,borderColor:'#F4F2EF'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}});
  document.getElementById('groupBudgetLegend').innerHTML=data.map(d=>`<div class="chart-legend-item"><div class="chart-legend-dot" style="background:${d.color}"></div>${d.label} ${d.value}%</div>`).join('');
}


function renderChannelChart() {
  var canvas = document.getElementById('channelChart');
  if (!canvas || !window.Chart) return;
  if (!GROUP_CHANNELS || !GROUP_CHANNELS.length) return;
  // Destroy existing instance to prevent Chart.js duplicate canvas error
  if (_channelChartInst) { try { _channelChartInst.destroy(); } catch(e){} _channelChartInst = null; }
  _channelChartInst = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: GROUP_CHANNELS.map(function(ch){ return ch.n; }),
      datasets: [{
        data: GROUP_CHANNELS.map(function(ch){ return ch.pct; }),
        backgroundColor: GROUP_CHANNELS.map(function(ch){ return ch.color; }),
        borderWidth: 3,
        borderColor: '#F4F2EF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx){ return ' ' + ctx.label + ': ' + ctx.parsed + '%'; } } }
      }
    }
  });
  var legendEl = document.getElementById('channelLegend');
  if (legendEl) {
    legendEl.innerHTML = GROUP_CHANNELS.map(function(ch){
      return '<div class="chart-legend-item">'        + '<div class="chart-legend-dot" style="background:' + ch.color + '"></div>'        + '<span style="font-family:var(--font-b);font-size:12px;color:var(--ink)">' + ch.n + '</span>'        + '<span style="font-family:var(--font-m);font-size:12px;color:var(--ink-soft);margin-left:6px">' + ch.pct + '%</span>'        + '</div>';
    }).join('');
  }
}


async function calLoadFromSupabase() {
  try {
    var BRAND_COLOR_MAP = {
      'Audi':'#BB0A21','Volkswagen':'#001E50','VW Commercial':'#1B4F72',
      'SEAT':'#E2231A','CUPRA':'#C8920A','Land Rover':'#1D4E1D',
      'Jaguar':'#1B2631','Honda':'#CC0000','Peugeot':'#1B3A6B',
      'BYD':'#0066CC','OMODA/JAECOO':'#6B21A8','Motor Match':'#374151'
    };
    var BRAND_ID_MAP = {
      'audi':'Audi','vw':'Volkswagen','vwcv':'VW Commercial',
      'seat':'SEAT','cupra':'CUPRA','landrover':'Land Rover',
      'jaguar':'Jaguar','honda':'Honda','peugeot':'Peugeot',
      'byd':'BYD','omoda':'OMODA/JAECOO','motormatch':'Motor Match'
    };
    var resp = await fetch(SUPABASE_URL + '/rest/v1/campaigns?select=*&order=start_date.asc', {
      headers: getAuthHeaders({'Content-Type':'application/json'})
    });
    if (!resp.ok) { console.warn('calLoadFromSupabase: fetch failed', resp.status); return; }
    var rows = await resp.json();
    BUILT_IN_CAMPAIGNS = rows.map(function(r) {
      var brandName = BRAND_ID_MAP[r.brand_id] || r.brand_id || 'All brands';
      var color = BRAND_COLOR_MAP[brandName] || '#374151';
      // Parse date as local to avoid UTC-offset shifting month (e.g. 2026-04-01 UTC = March in BST)
      var startMonth = r.start_date ? (parseInt(r.start_date.split('-')[1], 10) - 1) : 0;
      var endMonth   = r.end_date   ? (parseInt(r.end_date.split('-')[1],   10) - 1) : startMonth;
      return {
        id: r.id, brand: brandName, name: r.title || 'Untitled',
        start: startMonth, end: endMonth, color: color,
        status: r.status || 'planned',
        budget: r.planned_budget,
        type: r.campaign_type,
        objective: r.planned_objective,
        brief_id: r.brief_id || null,
        start_date: r.start_date || null,
        end_date: r.end_date || null,
        scope: r.scope || 'brand',
        site_id: r.site_id || null,
        brand_id: r.brand_id || null,
        channels: r.confirmed_channels || []
      };
    });
    console.log('calLoadFromSupabase: loaded ' + BUILT_IN_CAMPAIGNS.length + ' campaigns');
  } catch(e) { console.warn('calLoadFromSupabase error:', e); }
}


async function calInit() {
  var m = new Date().getMonth();
  CAL_CURRENT_QUARTER = m < 3 ? 0 : m < 6 ? 1 : m < 9 ? 2 : 3;
  await calLoadFromSupabase();
  renderCrossCalendar();
}


function calSetQuarter(q) { CAL_CURRENT_QUARTER = q; renderCrossCalendar(); }


function calPrevQuarter() { CAL_CURRENT_QUARTER = (CAL_CURRENT_QUARTER + 3) % 4; renderCrossCalendar(); }


function calNextQuarter() { CAL_CURRENT_QUARTER = (CAL_CURRENT_QUARTER + 1) % 4; renderCrossCalendar(); }


function renderCrossCalendar() {
  window._calCamps = []; // Reset camp lookup array
  var el = document.getElementById('crosscal-grid');
  var legendEl = document.getElementById('crosscal-legend');
  if (!el) return;
  // Sync quarter tab active state
  for (var qi = 0; qi < 4; qi++) {
    var tab = document.getElementById('cal-tab-' + qi);
    if (tab) tab.className = 'cal-q-tab' + (qi === CAL_CURRENT_QUARTER ? ' active' : '');
  }


  var q = CAL_CURRENT_QUARTER;
  var QM = [[0,1,2],[3,4,5],[6,7,8],[9,10,11]];
  var QL = ['Q1 — Jan · Feb · Mar','Q2 — Apr · May · Jun','Q3 — Jul · Aug · Sep','Q4 — Oct · Nov · Dec'];
  var MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var months = QM[q];

  var labelEl = document.getElementById('cal-quarter-label');
  if (labelEl) labelEl.textContent = QL[q];
  for (var i = 0; i < 4; i++) {
    var tab = document.getElementById('cal-tab-' + i);
    if (tab) tab.className = 'cal-q-tab' + (i === q ? ' active' : '');
  }

  var BORDER = [
    {id:'All brands',color:'#374151'},{id:'Audi',color:'#BB0A21'},
    {id:'Volkswagen',color:'#001E50'},{id:'VW Commercial',color:'#1B4F72'},
    {id:'SEAT',color:'#E2231A'},{id:'CUPRA',color:'#C8920A'},
    {id:'Land Rover',color:'#1D4E1D'},{id:'Jaguar',color:'#1B2631'},
    {id:'Honda',color:'#CC0000'},{id:'Peugeot',color:'#1B3A6B'},
    {id:'BYD',color:'#0066CC'},{id:'OMODA/JAECOO',color:'#6B21A8'},
    {id:'Motor Match',color:'#374151'},
  ];

  var active = BORDER.filter(function(b) {
    return BUILT_IN_CAMPAIGNS.some(function(c) {
      return c.brand === b.id && months.some(function(m) { return m >= c.start && m <= c.end; });
    });
  });

  if (!active.length) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-faint);font-size:13px">No campaigns this quarter. Click <strong>+ Add campaign</strong> to get started.</div>';
    if (legendEl) legendEl.innerHTML = '';
    return;
  }

  // Build table using a real HTML table for reliable column alignment
  var COL_W = ['140px','1fr','1fr','1fr'];
  var GRID  = 'display:grid;grid-template-columns:140px 1fr 1fr 1fr;gap:1px;background:var(--border);margin-bottom:1px';
  var HCELL = 'background:var(--swansway);color:#fff;padding:9px 12px;font-family:var(--font-m);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;font-weight:500;display:flex;align-items:center;justify-content:center';
  var BCELL = 'background:var(--white);padding:8px 10px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;min-height:48px';
  var MCELL = 'background:var(--white);padding:5px;min-height:48px;display:flex;flex-direction:column;gap:3px';

  var html = '<div style="border-radius:4px;overflow:hidden;border:1px solid var(--border)">';

  // Header row
  html += '<div style="' + GRID + '">';
  html += '<div style="' + HCELL + ';background:#0D1B2A;justify-content:flex-start">Brand</div>';
  months.forEach(function(m) { html += '<div style="' + HCELL + '">' + MN[m] + '</div>'; });
  html += '</div>';

  active.forEach(function(brand) {
    html += '<div style="' + GRID + '">';
    html += '<div style="' + BCELL + '"><span style="width:9px;height:9px;border-radius:50%;background:' + brand.color + ';flex-shrink:0;display:inline-block"></span>' + brand.id + '</div>';
    months.forEach(function(m) {
      var camps = BUILT_IN_CAMPAIGNS.filter(function(c) {
        return c.brand === brand.id && m >= c.start && m <= c.end;
      });
      html += '<div style="' + MCELL + '">';
      camps.forEach(function(camp) {
        var idx = window._calCamps.length;
        window._calCamps.push(camp);
        var sColor = camp.status==='active' ? '#059669' : camp.status==='briefed' ? '#D97706' : camp.status==='completed' ? '#6B7280' : camp.color;
        var sDot   = camp.status==='active' ? '● ' : camp.status==='briefed' ? '◐ ' : '○ ';
        var safeName = camp.name.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        html += '<div data-cal-idx="' + idx + '" style="border-radius:3px;padding:5px 8px;font-size:11px;color:#fff;font-weight:500;line-height:1.3;cursor:pointer;background:' + sColor + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;user-select:none" title="' + safeName + ' (' + (camp.status||'planned') + ')">' + sDot + safeName + '</div>';
      });
      if (!camps.length) html += '<span style="color:var(--ink-faint);font-size:11px;padding:4px 0">—</span>';
      html += '</div>';
    });
    html += '</div>';
  });

  html += '</div>';
  el.innerHTML = html;

  // Attach click handler directly to el (freshly set each render)
  el.onclick = null;
  el.onclick = function(e) {
    var pill = e.target;
    while (pill && pill !== el) {
      if (pill.hasAttribute && pill.hasAttribute('data-cal-idx')) break;
      pill = pill.parentNode;
    }
    if (!pill || pill === el) return;
    var idx = parseInt(pill.getAttribute('data-cal-idx'), 10);
    var camp = window._calCamps && window._calCamps[idx];
    if (camp) { calShowCampaign(camp); }
  };

  if (legendEl) {
    var seen = {};
    legendEl.innerHTML = BUILT_IN_CAMPAIGNS
      .filter(function(c) { return months.some(function(m) { return m >= c.start && m <= c.end; }); })
      .filter(function(c) { if (seen[c.brand]) return false; seen[c.brand] = true; return true; })
      .map(function(c) {
        return '<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--ink-soft);background:var(--surface);padding:4px 10px;border-radius:12px"><span style="width:8px;height:8px;border-radius:50%;background:' + c.color + ';display:inline-block"></span>' + c.brand + '</div>';
      }).join('');
  }
}


function saveBudgetActuals() {
  if (!SB || !SB_USER) return;
  SB.from('budget_actuals')
    .upsert({ user_id: SB_USER.id, data: BUDGET_ACTUALS, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' })
    .then(function(r) {
      if (r.error) console.error('Budget save error:', r.error);
    })
    .catch(function(e) { console.error('Budget save exception:', e); });
}


async function loadBudgetActuals() {
  if (!SB_USER) return;
  try {
    var resp = await fetch(SUPABASE_URL + '/rest/v1/budget_actuals?select=data&limit=1', {
      headers: getAuthHeaders({'Content-Type': 'application/json', 'Accept': 'application/json'})
    });
    if (!resp.ok) return;
    var rows = await resp.json();
    if (rows && rows.length && rows[0].data) {
      BUDGET_ACTUALS = rows[0].data;
      if (typeof renderBudgetTracker === 'function') renderBudgetTracker();
    }
  } catch(e) { console.error('Budget load exception:', e); }
}


function renderBudgetTracker() {
  // Planned and actual come directly from site monthly figures — no double-counting

  var thead    = document.getElementById('budget-thead');
  var tbody    = document.getElementById('budget-tbody');
  var metricsEl = document.getElementById('budget-metrics');
  if (!thead) return;

  // Header
  var thStyle = 'background:var(--swansway);color:#fff;font-family:var(--font-m);font-size:9px;letter-spacing:0.08em;text-transform:uppercase;padding:9px 10px;text-align:right;white-space:nowrap';
  var th1Style = thStyle.replace('text-align:right','text-align:left');
  var hdr = '<tr><th style="'+th1Style+'">Brand / Site</th>';
  CAL_MONTHS.forEach(function(m) { hdr += '<th style="'+thStyle+'">' + m + '</th>'; });
  hdr += '<th style="'+thStyle+'">Planned</th><th style="'+thStyle+'">Actual</th><th style="'+thStyle+'">Variance</th></tr>';
  thead.innerHTML = hdr;

  var totalPlanned = 0, totalActual = 0;
  var mPlanned = new Array(12).fill(0);
  var mActual  = new Array(12).fill(0);
  var rows = '';

  BUDGET_BRANDS.forEach(function(b) {
    // Get sites for this brand
    var sites = (typeof HUB_SITES !== 'undefined')
      ? HUB_SITES.filter(function(s) { return s.brand_id === b.id; })
      : [];
    var hasSiteData = sites.length > 0 && Object.keys(SITE_BUDGETS).length > 0;

    // Calculate brand monthly totals from site budgets
    var brandMonthlyPlan   = new Array(12).fill(0);
    var brandMonthlyActual = new Array(12).fill(0);
    if (hasSiteData) {
      sites.forEach(function(site) {
        var d = SITE_BUDGETS[site.site_id] || {};
        for (var i = 0; i < 12; i++) {
          brandMonthlyPlan[i]   += d['m' + i + '_planned'] || 0;
          brandMonthlyActual[i] += d['m' + i + '_actual']  || 0;
        }
      });
    } else {
      var monthly = Math.round(b.annual / 12);
      for (var i = 0; i < 12; i++) brandMonthlyPlan[i] = monthly;
    }

    var brandPlan   = brandMonthlyPlan.reduce(function(s, v) { return s + v; }, 0);
    var brandActual = brandMonthlyActual.reduce(function(s, v) { return s + v; }, 0);
    totalPlanned += brandPlan;
    totalActual  += brandActual;
    for (var i = 0; i < 12; i++) {
      mPlanned[i] += brandMonthlyPlan[i];
      mActual[i]  += brandMonthlyActual[i];
    }

    var brandMonthlyCommitted = new Array(12).fill(0);
    sites.forEach(function(site) {
      for (var mi2 = 0; mi2 < 12; mi2++) { brandMonthlyCommitted[mi2] += (BRIEF_COMMITMENTS[site.site_id] || {})[mi2] || 0; }
    });
    var brandCommitted = brandMonthlyCommitted.reduce(function(s, v) { return s + v; }, 0);

    var variance = brandActual - brandPlan;
    var varStyle, varStr;
    if (brandActual > 0) { varStyle = variance > 0 ? 'color:#DC2626' : 'color:#059669'; varStr = (variance >= 0 ? '+' : '') + '&pound;' + Math.abs(variance).toLocaleString(); }
    else if (brandCommitted > 0) { varStyle = 'color:#D97706'; varStr = '&pound;' + (brandPlan - brandCommitted).toLocaleString() + ' left'; }
    else { varStyle = ''; varStr = '&mdash;'; }

    // Brand row (accordion header)
    var brandRowId = 'bt-sites-' + b.id;
    var brandCells = '';
    for (var mi = 0; mi < 12; mi++) {
      var plan = brandMonthlyPlan[mi];
      var act  = brandMonthlyActual[mi];
      var cmt  = brandMonthlyCommitted[mi];
      var diff = act - plan;
      var cls  = act === 0 ? '' : (diff > plan * 0.1 ? ' budget-over' : diff < -plan * 0.1 ? ' budget-under' : ' budget-on');
      var inner = act > 0 ? '&pound;' + act.toLocaleString()
        : cmt > 0 ? '<span style="color:#D97706;font-weight:600">&pound;' + cmt.toLocaleString() + '</span>'
        : plan > 0 ? '<em style="color:var(--ink-faint)">&pound;' + plan.toLocaleString() + '</em>'
        : '<em style="color:var(--ink-faint)">&mdash;</em>';
      brandCells += '<td class="budget-cell' + cls + '">' + inner + '</td>';
    }

    rows += '<tr style="background:var(--white);border-top:3px solid var(--border)">'
      + '<td style="padding:12px 10px 10px;border-left:4px solid '+b.color+'"><div style="display:flex;align-items:center;gap:6px;font-family:var(--font-d);font-weight:800;font-size:14px">'
      + '<span style="width:10px;height:10px;border-radius:50%;background:' + b.color + ';display:inline-block;flex-shrink:0"></span>'
      + b.name + '</div>'
      + (sites.length > 0 ? '<div style="font-size:10px;color:var(--ink-soft);margin-left:16px;padding-bottom:4px">' + sites.length + (sites.length === 1 ? ' site' : ' sites') + '</div>' : '')
      + '</td>'
      + brandCells
      + '<td style="text-align:right;font-size:11px;color:var(--ink-soft);font-weight:700">' + (brandPlan > 0 ? '&pound;' + brandPlan.toLocaleString() : '&mdash;') + '</td>'
      + '<td style="text-align:right;font-size:12px;font-weight:700">' + (brandActual > 0 ? '&pound;' + brandActual.toLocaleString() : brandCommitted > 0 ? '<span style="color:#D97706">&pound;' + brandCommitted.toLocaleString() + '</span>' : '&mdash;') + '</td>'
      + '<td style="text-align:right;font-size:11px;' + varStyle + '">' + varStr + '</td>'
      + '</tr>';

    // Site rows — always visible, flat hierarchy
    if (hasSiteData) {
      sites.forEach(function(site) {
        var d = SITE_BUDGETS[site.site_id] || {};
        var sitePlan = 0, siteActual = 0, siteCommitted = 0;
        var siteCells = '';
        for (var mi = 0; mi < 12; mi++) {
          var sp = d['m' + mi + '_planned'] || 0;
          var sa = d['m' + mi + '_actual']  || 0;
          var sc = (BRIEF_COMMITMENTS[site.site_id] || {})[mi] || 0;
          sitePlan += sp; siteActual += sa; siteCommitted += sc;
          var scls = sa === 0 ? '' : ((sa-sp) > sp*0.1 ? ' budget-over' : (sa-sp) < -sp*0.1 ? ' budget-under' : ' budget-on');
          var sinner;
          if (sa > 0) { sinner = '&pound;' + sa.toLocaleString(); }
          else if (sc > 0) { sinner = '<span style="color:#D97706;font-weight:600">&pound;' + sc.toLocaleString() + '</span>'; }
          else { sinner = sp > 0 ? '<em style="color:var(--ink-faint)">&pound;' + sp.toLocaleString() + '</em>' : '<em style="color:var(--ink-faint)">&mdash;</em>'; }
          siteCells += '<td class="budget-cell' + scls + '" style="font-size:11px;padding:4px 8px">' + sinner + '</td>';
        }
        var sVarStr, sVarStyle;
        if (siteActual > 0) {
          var sVn = siteActual - sitePlan;
          sVarStyle = sVn > 0 ? 'color:#DC2626' : 'color:#059669';
          sVarStr = '&pound;' + Math.abs(sVn).toLocaleString() + (sVn > 0 ? ' over' : ' under');
        } else if (siteCommitted > 0) {
          sVarStyle = 'color:#D97706';
          sVarStr = '&pound;' + (sitePlan - siteCommitted).toLocaleString() + ' left';
        } else { sVarStyle = ''; sVarStr = '&mdash;'; }
        var actOrCmt = siteActual > 0 ? '&pound;' + siteActual.toLocaleString()
          : siteCommitted > 0 ? '<span style="color:#D97706">&pound;' + siteCommitted.toLocaleString() + '</span>' : '&mdash;';
        rows += '<tr style="background:var(--white);border-bottom:1px solid var(--border)">'
          + '<td style="padding:7px 10px 7px 28px;font-size:12px;color:var(--ink);border-left:4px solid '+b.color+'">' + site.site_name + '</td>'
          + siteCells
          + '<td style="text-align:right;font-size:11px;color:var(--ink-faint);padding:4px 8px">' + (sitePlan > 0 ? '&pound;' + sitePlan.toLocaleString() : '&mdash;') + '</td>'
          + '<td style="text-align:right;font-size:11px;padding:4px 8px">' + actOrCmt + '</td>'
          + '<td style="text-align:right;font-size:11px;' + sVarStyle + ';padding:4px 8px">' + sVarStr + '</td>'
          + '</tr>';

      });

    }
  });
  tbody.innerHTML = rows;

  // Metrics
  var totalCommitted = 0;
  Object.values(BRIEF_COMMITMENTS).forEach(function(sm) { Object.values(sm).forEach(function(v){ totalCommitted += v; }); });
  // Add events planned to committed total for remaining calculation
  var totalEventsPlanned = 0;
  if (typeof EV_EVENTS_BUDGET !== 'undefined') {
    var planYear = parseInt(PLAN_YEAR) || new Date().getFullYear();
    EV_EVENTS_BUDGET.forEach(function(ev) {
      if (!ev.start_date) return;
      if (new Date(ev.start_date + 'T00:00:00').getFullYear() !== planYear) return;
      totalEventsPlanned += ev.planned_budget || 0;
    });
  }
  var trueRemaining = totalPlanned - totalCommitted - totalActual - totalEventsPlanned;
  var pct = totalActual > 0 ? Math.round(totalActual/totalPlanned*100) : totalCommitted > 0 ? Math.round(totalCommitted/totalPlanned*100) : 0;
  metricsEl.innerHTML = [
    {label:'Total planned ' + PLAN_YEAR,  val:'&pound;' + (totalPlanned/1000000).toFixed(2) + 'M',                                        sub:'Across all brands',             color:'var(--swansway)'},
    {label:'Committed (briefs)',   val:totalCommitted > 0 ? '&pound;' + (totalCommitted/1000000).toFixed(2) + 'M' : '&pound;0',  sub:'From saved briefs',             color:'#D97706'},
    {label:'Actual spent',         val:totalActual > 0 ? '&pound;' + (totalActual/1000000).toFixed(2) + 'M' : '&pound;0',        sub:'Entered in site budgets',       color:'#059669'},
    {label:'Remaining headroom',   val:'&pound;' + (Math.max(0,trueRemaining)/1000000).toFixed(2) + 'M',                          sub:'Planned − committed − actual − events', color:'#6B7280'},
  ].map(function(m) {
    return '<div class="metric" style="border-top-color:' + m.color + '"><div class="metric-label">' + m.label + '</div><div class="metric-val" style="color:' + m.color + '">' + m.val + '</div><div class="metric-sub">' + m.sub + '</div></div>';
  }).join('');

  renderBudgetChart(mPlanned, mActual);
  renderBudgetSummary();
  btInjectStyles();
}


function renderBudgetSummary() {
  var el = document.getElementById('budget-summary');
  if (!el) return;
  // Build per-brand summary bars
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">';
  BUDGET_BRANDS.forEach(function(b) {
    var sites = (typeof HUB_SITES !== 'undefined') ? HUB_SITES.filter(function(s){ return s.brand_id === b.id; }) : [];
    var planned = 0, actual = 0, committed = 0;
    sites.forEach(function(site) {
      var d = SITE_BUDGETS[site.site_id] || {};
      for (var i = 0; i < 12; i++) {
        planned   += d['m' + i + '_planned'] || 0;
        actual    += d['m' + i + '_actual']  || 0;
        committed += (BRIEF_COMMITMENTS[site.site_id] || {})[i] || 0;
      }
    });
    if (planned === 0 && actual === 0 && committed === 0) {
      // No data yet — show placeholder
      html += '<div style="background:var(--white);border:1px solid var(--border);border-left:4px solid ' + b.color + ';border-radius:4px;padding:10px 14px">'
        + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">'
        + '<div style="font-size:12px;font-weight:700;color:var(--ink)">' + b.name + '</div>'
        + '<div style="font-size:10px;color:var(--ink-faint)">No budget set</div>'
        + '</div>'
        + '<div style="height:5px;background:var(--border);border-radius:3px"></div>'
        + '</div>';
      return;
    }
    var pctActual    = planned > 0 ? Math.min(100, Math.round(actual    / planned * 100)) : 0;
    var pctCommitted = planned > 0 ? Math.min(100 - pctActual, Math.round(committed / planned * 100)) : 0;
    var pctRemaining = Math.max(0, 100 - pctActual - pctCommitted);
    var statusColor  = pctActual > 90 ? '#DC2626' : pctActual > 50 ? '#059669' : '#6B7280';
    var actualStr    = actual    > 0 ? '&pound;' + (actual/1000).toFixed(0)    + 'K spent'    : '';
    var committedStr = committed > 0 ? '&pound;' + (committed/1000).toFixed(0) + 'K committed' : '';
    var subStr       = actualStr + (actualStr && committedStr ? ' &middot; ' : '') + committedStr
                       || ('&pound;' + (planned/1000).toFixed(0) + 'K planned');
    html += '<div style="background:var(--white);border:1px solid var(--border);border-left:4px solid ' + b.color + ';border-radius:4px;padding:10px 14px">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">'
      + '<div style="font-size:12px;font-weight:700;color:var(--ink)">' + b.name + '</div>'
      + '<div style="font-size:12px;font-weight:700;color:' + statusColor + '">' + pctActual + '%</div>'
      + '</div>'
      + '<div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;display:flex">'
      + (pctActual    > 0 ? '<div style="width:' + pctActual    + '%;background:#059669;height:6px"></div>' : '')
      + (pctCommitted > 0 ? '<div style="width:' + pctCommitted + '%;background:#D97706;height:6px"></div>' : '')
      + '</div>'
      + '<div style="font-size:10px;color:var(--ink-faint);margin-top:4px">' + subStr + '</div>'
      + '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}


function renderBudgetChart(planned, actual) {
  var ctx = document.getElementById('budgetChart');
  if (!ctx || !window.Chart) return;
  if (budgetChartInst) budgetChartInst.destroy();
  budgetChartInst = new Chart(ctx, {
    type: 'bar',
    data: { labels: CAL_MONTHS, datasets: [
      {label:'Planned',data:planned,backgroundColor:'rgba(26,46,74,0.15)',borderColor:'rgba(26,46,74,0.4)',borderWidth:1},
      {label:'Actual',data:actual,backgroundColor:'rgba(200,16,46,0.7)',borderColor:'rgba(200,16,46,1)',borderWidth:1}
    ]},
    options: {responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},scales:{y:{ticks:{callback:function(v){return '£'+(v/1000).toFixed(0)+'K';}}}}}
  });
}


function calAddEvent() {
  var existing = document.getElementById('cal-add-modal');
  if (existing) existing.remove();
  var BRAND_OPTS = [['audi','Audi'],['vw','Volkswagen'],['vwcv','VW Commercial'],['seat','SEAT'],['cupra','CUPRA'],['landrover','Land Rover'],['jaguar','Jaguar'],['honda','Honda'],['peugeot','Peugeot'],['byd','BYD'],['omoda','OMODA/JAECOO'],['motormatch','Motor Match']];
  var overlay = document.createElement('div');
  overlay.id = 'cal-add-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:8px;width:100%;max-width:520px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.2)';
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:var(--swansway);padding:18px 22px;display:flex;justify-content:space-between;align-items:center';
  hdr.innerHTML = '<div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:#fff">Add campaign to calendar</div>';
  var closeX = document.createElement('button');
  closeX.style.cssText = 'background:rgba(255,255,255,0.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:18px';
  closeX.innerHTML = '&times;'; closeX.onclick = function(){ overlay.remove(); };
  hdr.appendChild(closeX);
  var body = document.createElement('div');
  body.style.cssText = 'padding:22px;display:flex;flex-direction:column;gap:14px';
  function mkField(label, el) {
    var w = document.createElement('div');
    var l = document.createElement('div');
    l.style.cssText = 'font-size:10px;font-family:var(--font-m);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-soft);margin-bottom:5px';
    l.textContent = label; w.appendChild(l); w.appendChild(el); return w;
  }
  var inputStyle = 'width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid var(--border);border-radius:6px;font-family:var(--font-b);font-size:13px;color:var(--ink);outline:none;background:var(--white)';
  function mkSel(id, opts) {
    var s = document.createElement('select'); s.id = id; s.style.cssText = inputStyle;
    opts.forEach(function(o){ var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; s.appendChild(op); }); return s;
  }
  function mkInp(id, ph, type) {
    var i = document.createElement('input'); i.id = id; i.type = type||'text'; i.placeholder = ph||''; i.style.cssText = inputStyle; return i;
  }
  var brandSel = mkSel('cal-new-brand', BRAND_OPTS);
  var typeSel  = mkSel('cal-new-type',  [['Plate Change','Plate Change'],['Product Launch','Product Launch'],['Brand Awareness','Brand Awareness'],['Seasonal Offer','Seasonal Offer'],['Event','Event'],['Conquest','Conquest'],['Retention','Retention'],['Finance Push','Finance Push'],['EV Push','EV Push']]);
  var objSel   = mkSel('cal-new-obj',   [['Drive leads','Drive leads'],['Increase test drives','Increase test drives'],['Grow brand awareness','Grow brand awareness'],['Promote finance offer','Promote finance offer'],['Drive footfall','Drive footfall'],['Conquest from competitors','Conquest from competitors'],['EV transition','EV transition']]);
  var nameInp  = mkInp('cal-new-name',  'e.g. May Plate Change');
  var startInp = mkInp('cal-new-start', '', 'date');
  var endInp   = mkInp('cal-new-end',   '', 'date');
  var budgetInp= mkInp('cal-new-budget','e.g. 5000', 'number');
  var dateRow  = document.createElement('div');
  dateRow.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px';
  dateRow.appendChild(mkField('Start date', startInp));
  dateRow.appendChild(mkField('End date', endInp));
  body.appendChild(mkField('Brand', brandSel));
  body.appendChild(mkField('Campaign name', nameInp));
  body.appendChild(mkField('Campaign type', typeSel));
  body.appendChild(dateRow);
  body.appendChild(mkField('Budget (£)', budgetInp));
  body.appendChild(mkField('Primary objective', objSel));
  var actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:8px;padding:0 22px 22px';
  var saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-accent'; saveBtn.style.flex = '1';
  saveBtn.textContent = 'Add to calendar';
  saveBtn.onclick = async function() {
    var brand  = document.getElementById('cal-new-brand').value;
    var name   = document.getElementById('cal-new-name').value.trim();
    var ctype  = document.getElementById('cal-new-type').value;
    var start  = document.getElementById('cal-new-start').value;
    var end    = document.getElementById('cal-new-end').value || document.getElementById('cal-new-start').value;
    var budget = parseFloat(document.getElementById('cal-new-budget').value) || null;
    var obj    = document.getElementById('cal-new-obj').value;
    if (!name)  { alert('Please enter a campaign name.'); return; }
    if (!start) { alert('Please select a start date.'); return; }
    saveBtn.textContent = 'Saving…'; saveBtn.disabled = true;
    try {
      var anon = SUPABASE_ANON_KEY, base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
      await fetch(base + '/campaigns', {
        method:'POST',
        headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
        body: JSON.stringify([{brand_id:brand, title:name, status:'planned', start_date:start, end_date:end, campaign_type:ctype, planned_budget:budget, planned_objective:obj, scope:'brand', created_by:CB_CURRENT_USER||'marcus'}])
      });
      overlay.remove();
      await calLoadFromSupabase();
      renderCrossCalendar();
    } catch(e) { saveBtn.textContent = 'Add to calendar'; saveBtn.disabled = false; alert('Error: ' + e.message); }
  };
  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn'; cancelBtn.style.flex = '1';
  cancelBtn.textContent = 'Cancel'; cancelBtn.onclick = function(){ overlay.remove(); };
  actions.appendChild(saveBtn); actions.appendChild(cancelBtn);
  box.appendChild(hdr); box.appendChild(body); box.appendChild(actions);
  overlay.appendChild(box); document.body.appendChild(overlay);
}


function calShowCampaign(cJson) {
  var c;
  try { c = typeof cJson === 'string' ? JSON.parse(cJson) : cJson; } catch(e) { return; }
  if (!c) return;
  var existing = document.getElementById('cal-modal');
  if (existing) existing.remove();

  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var dates;
  if (c.start_date) {
    var sd = new Date(c.start_date + 'T00:00:00');
    var ed = c.end_date ? new Date(c.end_date + 'T00:00:00') : sd;
    var fmt = function(d){ return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear(); };
    var days = Math.round((ed - sd) / 86400000) + 1;
    var weeks = Math.round(days / 7);
    dates = fmt(sd) + (c.end_date && c.end_date !== c.start_date ? ' – ' + fmt(ed) : '') + ' · ' + weeks + 'wk';
  } else {
    dates = months[c.start] + (c.end !== c.start ? ' – ' + months[c.end] : '') + ' ' + PLAN_YEAR;
  }

  var statusColors = {planned:'#6B7280', briefed:'#D97706', active:'#059669', completed:'#374151', approved:'#2563EB'};
  var statusColor = statusColors[c.status||'planned'] || '#6B7280';

  var overlay = document.createElement('div');
  overlay.id = 'cal-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:8px;width:100%;max-width:560px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.22)';

  // Header
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:' + c.color + ';padding:22px 24px 18px;position:relative';

  var brandLbl = document.createElement('div');
  brandLbl.style.cssText = 'font-family:var(--font-m);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px';
  brandLbl.textContent = c.brand;

  var nameLbl = document.createElement('div');
  nameLbl.style.cssText = 'font-family:var(--font-d);font-size:22px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:6px';
  nameLbl.textContent = c.name;

  var datesLbl = document.createElement('div');
  datesLbl.style.cssText = 'font-size:12px;color:rgba(255,255,255,0.8)';
  datesLbl.textContent = dates;

  var xBtn = document.createElement('button');
  xBtn.style.cssText = 'position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.2);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1';
  xBtn.innerHTML = '&times;';
  xBtn.onclick = function() { overlay.remove(); };

  hdr.appendChild(brandLbl); hdr.appendChild(nameLbl); hdr.appendChild(datesLbl); hdr.appendChild(xBtn);

  // Body
  var body = document.createElement('div');
  body.style.cssText = 'padding:20px 24px 24px';

  // Status + type badges
  var topRow = document.createElement('div');
  topRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap';

  var statusBadge = document.createElement('span');
  statusBadge.style.cssText = 'display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;font-family:var(--font-m);text-transform:uppercase;letter-spacing:0.06em;color:#fff;background:' + statusColor;
  statusBadge.textContent = c.status || 'planned';
  topRow.appendChild(statusBadge);

  if (c.type) {
    var typeBadge = document.createElement('span');
    typeBadge.style.cssText = 'display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;font-family:var(--font-m);background:var(--surface);color:var(--ink)';
    typeBadge.textContent = c.type;
    topRow.appendChild(typeBadge);
  }

  // Info grid
  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px';

  function makeCell(label, value, full) {
    if (!value) return null;
    var d = document.createElement('div');
    d.style.cssText = 'padding:10px 14px;background:var(--surface);border-radius:4px' + (full ? ';grid-column:1/-1' : '');
    var lbl = document.createElement('div');
    lbl.style.cssText = 'font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px';
    lbl.textContent = label;
    var val = document.createElement('div');
    val.style.cssText = 'font-size:13px;font-weight:600;color:var(--ink)';
    val.textContent = value;
    d.appendChild(lbl); d.appendChild(val);
    return d;
  }

  var cellDefs = [
    makeCell('Budget', c.budget ? '£' + Number(c.budget).toLocaleString() : null),
    makeCell('Dates', dates),
    makeCell('Objective', c.objective),
    makeCell('Scope', c.scope === 'site' ? 'Site-level' : 'Brand-wide'),
  ];
  if (c.channels && c.channels.length) {
    cellDefs.push(makeCell('Channels', c.channels.slice(0,6).join(', ') + (c.channels.length > 6 ? ' +' + (c.channels.length-6) + ' more' : ''), true));
  }
  if (c.allocation && c.allocation.length) {
    cellDefs.push(makeCell('Top channel', c.allocation[0].n + ' · ' + c.allocation[0].p + '%'));
  }
  if (c.locations && c.locations.length) {
    cellDefs.push(makeCell('Sites', c.locations.slice(0,5).join(', ') + (c.locations.length > 5 ? ' +' + (c.locations.length-5) : ''), true));
  }
  cellDefs.forEach(function(cl) { if (cl) grid.appendChild(cl); });

  // Actions
  var actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:8px;margin-top:4px';

  var editBtn = document.createElement('button');
  editBtn.className = 'btn btn-accent';
  editBtn.style.cssText = 'flex:2;font-size:13px';
  if (c.brief_id) {
    editBtn.textContent = '✏ Edit campaign';
    editBtn.onclick = function() { overlay.remove(); window.location = 'brief.html?brief=' + c.brief_id; };
  } else {
    editBtn.textContent = '✏ Build campaign';
    editBtn.onclick = function() { overlay.remove(); calBuildBrief(c.brand, c.name, c); };
  }

  var delBtn = document.createElement('button');
  delBtn.className = 'btn';
  delBtn.style.cssText = 'flex:1;font-size:13px;color:#C8102E;border-color:#C8102E';
  delBtn.textContent = 'Delete';
  delBtn.onclick = async function() {
    if (!confirm('Delete this campaign and its tasks?')) return;
    try {
      // Delete brief — cascade removes campaign + tasks automatically
      if (c.brief_id) {
        await fetch(SUPABASE_URL + '/rest/v1/briefs?id=eq.' + c.brief_id, { method:'DELETE', headers:getAuthHeaders() });
      } else {
        // No brief — delete campaign directly (cascade removes tasks)
        await fetch(SUPABASE_URL + '/rest/v1/campaigns?id=eq.' + c.id, { method:'DELETE', headers:getAuthHeaders() });
      }
      BUILT_IN_CAMPAIGNS = BUILT_IN_CAMPAIGNS.filter(function(x){ return x.id !== c.id; });
      overlay.remove();
      await calLoadFromSupabase();
      renderCrossCalendar();
      showToast('Campaign deleted', 'success');
    } catch(e) { console.warn('delete campaign:', e); }
  };

  var closeBtn = document.createElement('button');
  closeBtn.className = 'btn';
  closeBtn.style.cssText = 'flex:1;font-size:13px';
  closeBtn.textContent = 'Close';
  closeBtn.onclick = function() { overlay.remove(); };

  actions.appendChild(editBtn); actions.appendChild(delBtn); actions.appendChild(closeBtn);
  body.appendChild(topRow); body.appendChild(grid); body.appendChild(actions);
  box.appendChild(hdr); box.appendChild(body);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}


function calBuildBrief(brandName, campaignName, campObj) {
  var brandMap = {'Audi':'audi','BYD':'byd','CUPRA':'cupra','Volkswagen':'vw','Land Rover':'landrover','Honda':'honda','SEAT':'seat','Peugeot':'peugeot','VW Commercial':'vwcv','OMODA/JAECOO':'omoda','Motor Match':'motormatch','Jaguar':'jaguar','All brands':'audi'};
  var brandId = brandMap[brandName] || 'audi';
  switchView('brief', document.querySelector('[data-view=brief]'));
  setTimeout(function() {
    bbSelectBrand(brandId);
    setTimeout(function() {
      if (campObj && campObj.start_date) {
        var sd = document.getElementById('bb-start-date');
        var ed = document.getElementById('bb-end-date');
        if (sd) sd.value = campObj.start_date;
        if (ed) ed.value = campObj.end_date || campObj.start_date;
        bbOnDateChange();
      }
      if (campObj && campObj.budget > 0) {
        BB.budget = campObj.budget;
        bbOnBudget(campObj.budget);
        var slider = document.getElementById('bb-budget-slider');
        if (slider) slider.value = campObj.budget;
      }
      if (campObj && campObj.scope === 'site' && campObj.sites && campObj.sites.length) {
        BB.scope = 'site'; BB.site_id = campObj.sites[0];
        var siteBtn = document.getElementById('scope-site');
        if (siteBtn) bbSetScope('site', siteBtn);
      }
      if (campObj && campObj.ctype) {
        document.querySelectorAll('.bb-ctype-card').forEach(function(card) {
          if (card.textContent.toLowerCase().indexOf(campObj.ctype.toLowerCase()) > -1) card.click();
        });
      }
      if (campObj && campObj.id) BB._calCampaignId = campObj.id;
      var titleInput = document.getElementById('bb-brief-title');
      if (titleInput && !titleInput.value) titleInput.value = campaignName + ' — ' + brandName;
      var saveBar = document.getElementById('bb-save-bar');
      if (saveBar && !document.getElementById('bb-cal-banner')) {
        var banner = document.createElement('div');
        banner.id = 'bb-cal-banner';
        banner.style.cssText = 'background:#EFF6FF;border:1px solid #BFDBFE;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#1D4ED8;display:flex;align-items:center;gap:8px';
        banner.innerHTML = '<span style="font-size:15px">📋</span><span>Pre-filled from: <strong>' + campaignName + '</strong>. Check each step then save.</span>';
        saveBar.parentNode.insertBefore(banner, saveBar);
      }
    }, 400);
  }, 300);
}


async function loadSiteBudgets() {
  try {
    var resp = await fetch(SUPABASE_URL + '/rest/v1/site_budgets?select=*', {
      headers: {
        ...getAuthHeaders({'Content-Type': 'application/json'})
      }
    });
    if (!resp.ok) {
      var err = await resp.text();
      console.warn('loadSiteBudgets error:', resp.status, err);
      return;
    }
    var rows = await resp.json();
    if (!rows || !rows.length) { console.log('loadSiteBudgets: no data'); return; }
    rows.forEach(function(row) { SITE_BUDGETS[row.site_id] = row; });
    var groupTotal = rows.reduce(function(s, r) { return s + (r.annual_planned || 0); }, 0);
    if (groupTotal > 0) {
      var el = document.getElementById('group-budget-val');
      if (el) el.textContent = '£' + (groupTotal / 1000000).toFixed(2) + 'M';
    }
    if(typeof updateBrandBudgetsFromSites==='function') updateBrandBudgetsFromSites();
    if(typeof syncBrandSitesFromHubSites==='function') syncBrandSitesFromHubSites();
    if (typeof loadBriefCommitmentsForTracker === 'function') await loadBriefCommitmentsForTracker();
    // Now site budgets are loaded — trigger channel aggregation if brand data ready
    if (Object.keys(BRAND_CHANNELS_DATA).length) updateGroupChannelsFromBrands();
    await loadEventsForBudget();
    if (typeof renderBudgetTracker === 'function') renderBudgetTracker();
    var _cvEl = document.getElementById('view-channels');
    if (_cvEl && _cvEl.classList.contains('active') && typeof renderGroupChannels === 'function') renderGroupChannels();
    if (typeof renderBudgetTracker === 'function') renderBudgetTracker();
    // Re-render brand site budget tab if on brand.html
    var urlParams = new URLSearchParams(window.location.search);
    var activeBrandId = urlParams.get('brand');
    if (activeBrandId && typeof renderBrandSites === 'function') renderBrandSites(activeBrandId);
    console.log('Site budgets loaded: ' + rows.length + ' sites, £' + groupTotal.toLocaleString());
  } catch(e) { console.warn('loadSiteBudgets exception:', e); }
}



async function loadEventsForBudget() {
  try {
    var r = await fetch(SUPABASE_URL + '/rest/v1/events?select=id,title,site_id,brand_id,start_date,end_date,planned_budget,actual_spend,status&status=neq.cancelled&order=start_date', {
      headers: getAuthHeaders({'Content-Type':'application/json'})
    });
    if (!r.ok) return;
    EV_EVENTS_BUDGET = await r.json();
  } catch(e) { console.warn('loadEventsForBudget:', e); }
}

function getEventBudgetBySite(siteId) {
  // Returns array of 12 months: {planned, actual} — only for PLAN_YEAR
  var planYear = parseInt(PLAN_YEAR) || new Date().getFullYear();
  var monthly = [];
  for (var i = 0; i < 12; i++) monthly.push({ planned: 0, actual: 0 });
  EV_EVENTS_BUDGET.forEach(function(ev) {
    if (ev.site_id !== siteId) return;
    if (!ev.start_date) return;
    var d = new Date(ev.start_date + 'T00:00:00');
    if (d.getFullYear() !== planYear) return;
    var m = d.getMonth();
    monthly[m].planned += ev.planned_budget || 0;
    monthly[m].actual  += ev.actual_spend   || 0;
  });
  return monthly;
}
async function loadSiteKPIs() {
  try {
    var resp = await fetch(SUPABASE_URL + '/rest/v1/site_kpis?select=*', {
      headers: {
        ...getAuthHeaders({'Content-Type': 'application/json'})
      }
    });
    if (!resp.ok) { console.warn('loadSiteKPIs error:', resp.status); return; }
    var rows = await resp.json();
    if (!rows || !rows.length) { console.log('loadSiteKPIs: no data'); return; }
    rows.forEach(function(row) { SITE_KPIS[row.site_id] = row; });
    updateGroupKPIsFromSites();
    // Re-render KPIs if that view is currently active
    var kpiView = document.getElementById('view-kpis');
    if (kpiView && kpiView.classList.contains('active')) {
      if (typeof applyAdminKPITargets === 'function') applyAdminKPITargets();
      if (typeof renderGroupKPIs === 'function') renderGroupKPIs();
    }
    console.log('Site KPIs loaded: ' + rows.length + ' sites');
  } catch(e) { console.warn('loadSiteKPIs exception:', e); }
}


function updateGroupKPIsFromSites() {
  if (window._updatingKPIs) return; window._updatingKPIs = true; setTimeout(function(){ window._updatingKPIs = false; }, 500);
  console.log('updateGroupKPIsFromSites: SITE_KPIS has', Object.keys(SITE_KPIS).length, 'sites');
  if (!Object.keys(SITE_KPIS).length) { console.log('SITE_KPIS empty — skipping'); return; }
  var sites = HUB_SITES;
  // Aggregate across all sites
  var totalUnits = 0, totalUsed = 0, totalLeads = 0;
  var totalUnitsTarget = 0, totalUsedTarget = 0, totalLeadsTarget = 0;
  var evSum = 0, evCount = 0;
  var convSum = 0, retSum = 0, npsSum = 0, cplSum = 0, ytdCount = 0;

  sites.forEach(function(site) {
    var d = SITE_KPIS[site.site_id] || {};
    totalUnitsTarget += d.units_target || 0;
    totalUsedTarget  += d.used_target  || 0;
    totalLeadsTarget += (d.leads_target || 0) * 12;
    for (var i = 0; i < 12; i++) {
      totalUnits += d['m' + i + '_units'] || 0;
      totalUsed  += d['m' + i + '_used']  || 0;
      totalLeads += d['m' + i + '_leads'] || 0;
      if (d['m' + i + '_ev'] > 0) { evSum += d['m' + i + '_ev']; evCount++; }
    }
    if (d.conversion_actual > 0 || d.retention_actual > 0 || d.nps_actual > 0 || d.cpl_actual > 0) {
      convSum += d.conversion_actual || 0;
      retSum  += d.retention_actual  || 0;
      npsSum  += d.nps_actual        || 0;
      cplSum  += d.cpl_actual        || 0;
      ytdCount++;
    }
  });

  var evAvg   = evCount   > 0 ? Math.round(evSum   / evCount * 10) / 10 : 0;
  var convAvg = ytdCount  > 0 ? Math.round(convSum  / ytdCount * 10) / 10 : 0;
  var retAvg  = ytdCount  > 0 ? Math.round(retSum   / ytdCount * 10) / 10 : 0;
  var npsAvg  = ytdCount  > 0 ? Math.round(npsSum   / ytdCount)           : 0;
  var cplAvg  = ytdCount  > 0 ? Math.round(cplSum   / ytdCount)           : 0;

  // Apply to GROUP_KPIS by index (robust — no label matching)
  // Index: 0=units, 1=ev%, 2=leads, 3=conversion, 4=autotrader(skip),
  //        5=retention, 6=used, 7=nps, 8=fleet(skip), 9=social(skip),
  //        10=coop(skip), 11=cpl
  // Helper to calc progress %
  function calcP(actual, target, lowerBetter) {
    if (!actual || !target || target === 0) return 0;
    return lowerBetter
      ? Math.max(0, Math.round((2 - actual/target)*100))
      : Math.min(100, Math.round(actual/target*100));
  }
  var idxData = [
    // [target_str, actual_str, progress]
    [totalUnitsTarget > 0 ? totalUnitsTarget.toLocaleString() : null,
     totalUnits > 0 ? totalUnits.toLocaleString() : null,
     calcP(totalUnits, totalUnitsTarget, false)],
    [null, evAvg > 0 ? evAvg + '%' : null, 0],
    [totalLeadsTarget > 0 ? Math.round(totalLeadsTarget/12).toLocaleString() + '/mo' : null,
     totalLeads > 0 ? Math.round(totalLeads/5).toLocaleString() + '/mo avg' : null,
     calcP(Math.round(totalLeads/5), Math.round(totalLeadsTarget/12), false)],
    [null, convAvg > 0 ? convAvg + '%' : null, 0],
    [null, null, 0], // AutoTrader — from admin
    [null, retAvg > 0 ? retAvg + '%' : null, 0],
    [totalUsedTarget > 0 ? totalUsedTarget.toLocaleString() : null,
     totalUsed > 0 ? totalUsed.toLocaleString() : null,
     calcP(totalUsed, totalUsedTarget, false)],
    [null, npsAvg > 0 ? String(npsAvg) : null, 0],
    [null, null, 0], // Fleet — from admin
    [null, null, 0], // Social — from admin
    [null, null, 0], // Co-op — from admin
    [null, cplAvg > 0 ? '£' + cplAvg : null, 0],
  ];

  GROUP_KPIS.forEach(function(kpi, i) {
    if (i >= idxData.length) return;
    var d = idxData[i];
    if (!d[0] && !d[1]) return; // no data for this KPI
    // Only set target from sites if not already set from admin config
    if (d[0] && (!kpi.t || kpi.t === '--')) kpi.t = d[0];
    // Always update actual from site data
    if (d[1]) { kpi.a = d[1]; kpi.p = d[2] || kpi.p; }
  });
  console.log('updateGroupKPIsFromSites done. GROUP_KPIS[0].t:', GROUP_KPIS[0].t, 'GROUP_KPIS[0].a:', GROUP_KPIS[0].a);
}


async function spLoad() {
  var el = document.getElementById('sp-list');
  if (!el) return;
  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-faint);font-size:13px">Loading priorities…</div>';
  try {
    var rows = await fetch(SP_BASE + '/strategic_priorities?select=*&order=sort_order', {
      headers: getAuthHeaders()
    }).then(function(r){ return r.json(); });
    if (!Array.isArray(rows)) throw new Error('Bad response');
    SP_DATA = rows.filter(function(r){ return r.active !== false; });
    spRender();
  } catch(e) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-faint)">Could not load priorities. Check your connection.</div>';
    console.warn('spLoad:', e);
  }
}


function spRender() {
  var el = document.getElementById('sp-list');
  if (!el) return;
  if (!SP_DATA.length) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-faint);font-size:13px">No priorities yet. Hit <strong>+ Add priority</strong> to get started.</div>';
    return;
  }
  var colors = ['#C8102E','#1A2E4A','#059669','#D97706','#7C3AED','#0891B2'];
  var lightColors = ['#FEF2F2','#EFF4FA','#ECFDF5','#FFFBEB','#F5F3FF','#EFF9FB'];
  el.innerHTML = SP_DATA.map(function(p, i) {
    var col = colors[i % colors.length];
    var lightCol = lightColors[i % lightColors.length];
    var sentences = spEsc(p.description).split(/\. |; /).filter(function(s){ return s.trim().length > 0; });
    var bullets = sentences.map(function(s){
      return '<li style="margin-bottom:5px">' + s.replace(/\.?$/, '') + '</li>';
    }).join('');
    return '<div class="sp-card" style="--sp-col:' + col + ';--sp-light:' + lightCol + '">'
      + '<div class="sp-card-top">'
        + '<div class="sp-card-num-wrap">'
          + '<span class="sp-card-badge">' + String(p.number).padStart(2,'0') + '</span>'
          + '<span class="sp-card-label">Strategic Priority</span>'
        + '</div>'
        + '<div class="sp-card-actions">'
          + '<button class="sp-card-edit" onclick="spOpenEdit(' + p.id + ')">Edit</button>'
          + '<button class="sp-card-del" onclick="spDelete(' + p.id + ')">Delete</button>'
        + '</div>'
      + '</div>'
      + '<div class="sp-card-body">'
        + '<div class="sp-card-title">' + spEsc(p.title) + '</div>'
        + '<ul class="sp-card-bullets">' + bullets + '</ul>'
      + '</div>'
    + '</div>';
  }).join('');
}


function spEsc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


function spOpenAdd() {
  SP_EDITING_ID = null;
  spShowModal('Add priority', '', '', SP_DATA.length + 1, 'spSave()');
}


function spOpenEdit(id) {
  var p = SP_DATA.find(function(x){ return x.id === id; });
  if (!p) return;
  SP_EDITING_ID = id;
  spShowModal('Edit priority', p.title, p.description, p.number, 'spSave()');
}


function spShowModal(heading, title, desc, num, saveFn) {
  var existing = document.getElementById('sp-modal');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.className = 'sp-modal-overlay';
  overlay.id = 'sp-modal';
  overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
  // Parse existing description into bullets
  var existingBullets = desc ? desc.split(/\. |; /).filter(function(s){ return s.trim().length > 0; }) : [''];
  var bulletsHtml = existingBullets.map(function(b, i) {
    return '<div class="sp-bullet-row" id="sp-br-' + i + '">'
      + '<input class="sp-field-input" style="flex:1;margin-bottom:0" placeholder="Bullet point..." value="' + spEsc(b.replace(/\.?$/, '').trim()) + '">'
      + '<button onclick="spRemoveBullet(this)" style="background:none;border:none;color:var(--ink-faint);font-size:18px;cursor:pointer;padding:0 6px;flex-shrink:0" title="Remove">&times;</button>'
    + '</div>';
  }).join('');

  overlay.innerHTML = '<div class="sp-modal">'
    + '<div class="sp-modal-header">'
      + '<div class="sp-modal-title">' + heading + '</div>'
      + '<button class="sp-modal-close" onclick="document.getElementById(\'sp-modal\').remove()">&times;</button>'
    + '</div>'
    + '<div class="sp-modal-body">'
      + '<div style="display:flex;gap:12px">'
        + '<div style="flex:0 0 80px"><div class="sp-field-label">Number</div><input class="sp-field-input" id="sp-f-num" type="number" min="1" max="20" value="' + num + '"></div>'
        + '<div style="flex:1"><div class="sp-field-label">Title</div><input class="sp-field-input" id="sp-f-title" placeholder="e.g. EV Transition Leadership" value="' + spEsc(title) + '"></div>'
      + '</div>'
      + '<div><div class="sp-field-label" style="margin-top:14px">Bullet points <span style="font-weight:400;color:var(--ink-faint)">(one per line)</span></div>'
        + '<div id="sp-bullets">' + bulletsHtml + '</div>'
        + '<button onclick="spAddBullet()" style="margin-top:8px;background:none;border:1.5px dashed var(--border);border-radius:6px;width:100%;padding:8px;color:var(--ink-soft);font-family:var(--font-b);font-size:12px;cursor:pointer">+ Add bullet</button>'
      + '</div>'
    + '</div>'
    + '<div class="sp-modal-footer">'
      + '<button class="btn btn-primary" style="flex:1" onclick="' + saveFn + '">Save priority</button>'
      + '<button class="btn" style="flex:1" onclick="document.getElementById(\'sp-modal\').remove()">Cancel</button>'
    + '</div>'
  + '</div>';
  document.body.appendChild(overlay);
}


function spAddBullet() {
  var container = document.getElementById('sp-bullets');
  if (!container) return;
  var row = document.createElement('div');
  row.className = 'sp-bullet-row';
  row.innerHTML = '<input class="sp-field-input" style="flex:1;margin-bottom:0" placeholder="Bullet point..." value="">'
    + '<button onclick="spRemoveBullet(this)" style="background:none;border:none;color:var(--ink-faint);font-size:18px;cursor:pointer;padding:0 6px;flex-shrink:0" title="Remove">&times;</button>';
  container.appendChild(row);
  row.querySelector('input').focus();
}


function spRemoveBullet(btn) {
  var row = btn.closest('.sp-bullet-row');
  var container = document.getElementById('sp-bullets');
  if (container && container.querySelectorAll('.sp-bullet-row').length > 1) {
    row.remove();
  } else {
    // Keep at least one row, just clear it
    row.querySelector('input').value = '';
  }
}


async function spSave() {
  var num   = parseInt(document.getElementById('sp-f-num').value) || 1;
  var title = document.getElementById('sp-f-title').value.trim();
  // Collect bullets and join into description string
  var bullets = Array.from(document.querySelectorAll('#sp-bullets .sp-bullet-row input'))
    .map(function(inp){ return inp.value.trim(); })
    .filter(function(v){ return v.length > 0; });
  var desc = bullets.join('. ');
  if (!title) { showToast('Please enter a title', 'error'); return; }
  if (!desc)  { showToast('Please add at least one bullet point', 'error'); return; }
  var payload = { number: num, title: title, description: desc, year: PLAN_YEAR, sort_order: num, active: true, updated_at: new Date().toISOString() };
  try {
    if (SP_EDITING_ID) {
      await fetch(SP_BASE + '/strategic_priorities?id=eq.' + SP_EDITING_ID, {
        method: 'PATCH',
        headers: getAuthHeaders({'Content-Type': 'application/json', 'Prefer': 'return=minimal'}),
        body: JSON.stringify(payload)
      });
    } else {
      await fetch(SP_BASE + '/strategic_priorities', {
        method: 'POST',
        headers: getAuthHeaders({'Content-Type': 'application/json', 'Prefer': 'return=minimal'}),
        body: JSON.stringify(payload)
      });
    }
    document.getElementById('sp-modal').remove();
    spLoad();
  } catch(e) { showToast('Error saving: ' + e.message, 'error'); }
}


async function spDelete(id) {
  var p = SP_DATA.find(function(x){ return x.id === id; });
  if (!p) return;
  if (!confirm('Delete "' + p.title + '"? This cannot be undone.')) return;
  try {
    await fetch(SP_BASE + '/strategic_priorities?id=eq.' + id, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    spLoad();
  } catch(e) { alert('Error deleting: ' + e.message); }
}


function applyAdminKPITargets() {
  if (!window._lastAdminCfg || !window._lastAdminCfg.kpis) return;
  var ADMIN_ONLY = ['AutoTrader response time','Fleet accounts active','Social media follower growth','Manufacturer co-op utilisation'];
  window._lastAdminCfg.kpis.forEach(function(ak) {
    if (!ak.label || ADMIN_ONLY.indexOf(ak.label) === -1) return;
    var gk = GROUP_KPIS.find(function(k) { return k.l === ak.label; });
    if (!gk) return;
    var tVal = parseFloat(ak.target);
    if (!isNaN(tVal) && tVal > 0) {
      var u = ak.unit || gk.unit || '';
      if (u === '%')         gk.t = tVal + '%';
      else if (u === 'GBP')  gk.t = '£' + tVal.toLocaleString();
      else if (u === 'mins') gk.t = '< ' + tVal + ' min';
      else if (tVal >= 1000) gk.t = tVal.toLocaleString();
      else                   gk.t = String(tVal);
    }
    if (ak.owner && ak.owner !== '--') gk.o = ak.owner;
  });
}


/* ══ BUDGET ACCORDION HELPERS ══ */
var BT_OPEN = {};

function btToggle(id) {
  var panel = document.getElementById(id);
  var row   = document.getElementById('row-' + id);
  var chv   = document.getElementById('chv-' + id);
  if (!panel || !row) return;
  var open = BT_OPEN[id];
  if (open) {
    panel.style.display = 'none';
    row.style.display = 'none';
    if (chv) chv.innerHTML = '&#9654;';
    BT_OPEN[id] = false;
  } else {
    panel.style.display = '';
    row.style.display = '';
    if (chv) chv.innerHTML = '&#9660;';
    BT_OPEN[id] = true;
  }
}

function btFmtDate(d) {
  if (!d) return '';
  var dt = new Date(d + 'T00:00:00');
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return dt.getDate() + ' ' + months[dt.getMonth()];
}

function btEsc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function btInjectStyles() {
  if (document.getElementById('bt-accord-styles')) return;
  var s = document.createElement('style');
  s.id = 'bt-accord-styles';
  s.textContent = [
    '.bt-accord{animation:btFadeIn .18s ease}',
    '@keyframes btFadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}',
    '.bt-chevron{display:inline-block;font-size:9px;color:var(--ink-faint);transition:transform .2s;line-height:1;flex-shrink:0}',
    '.bt-accord-section-label{font-family:var(--font-m);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--ink-faint);margin-bottom:8px}',
    '.bt-accord-table{width:100%;border-collapse:collapse;font-family:var(--font-b);font-size:12px}',
    '.bt-accord-table th{font-family:var(--font-m);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-faint);padding:4px 10px 6px;text-align:left;border-bottom:1px solid var(--border)}',
    '.bt-accord-table td{padding:7px 10px;color:var(--ink);border-bottom:1px solid var(--border)}',
    '.bt-accord-table tr:last-child td{border-bottom:none}',
    '.bt-accord-table tr:hover td{background:rgba(0,0,0,0.02)}',
    '.bt-accord-total td{font-weight:700;font-size:11px;color:var(--ink-soft);border-top:1px solid var(--border);border-bottom:none;padding:6px 10px;background:var(--surface)}',
  ].join('');
  document.head.appendChild(s);
}
