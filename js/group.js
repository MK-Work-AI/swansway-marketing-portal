// v100
if (typeof swSocialFromBrief === 'undefined') {
  window.swSocialFromBrief = function(briefId, briefData) {
    var brandId = briefData.brand_id || (briefData.brand && briefData.brand.id) || null;
    var payload = { source:'brief', brief_id:briefId, title:briefData.title||briefData.name||'Campaign',
      brand_id:brandId, site_ids:briefData.site_ids||[], start_date:briefData.start_date||null,
      end_date:briefData.end_date||null, budget:briefData.budget||null, job_ref:briefData.job_ref||null };
    try { sessionStorage.setItem('_slGenPayload', JSON.stringify(payload)); } catch(e) {}
    if (/social\.html/.test(window.location.pathname)) {
      if (typeof slShowGenModal === 'function') slShowGenModal(payload);
    } else { window.location = 'social.html'; }
  };
}
if (typeof swSocialFromEvent === 'undefined') {
  window.swSocialFromEvent = function(eventIds, eventData) {
    var payload = { source:'event', event_ids:Array.isArray(eventIds)?eventIds:[eventIds],
      title:eventData.title||'Event', brand_id:eventData.brand_id||null,
      site_ids:eventData.site_ids||[], start_date:eventData.start_date||null,
      end_date:eventData.end_date||null, budget:eventData.planned_budget||eventData.budget||null,
      location:eventData.location||null, job_ref:eventData.job_ref||null };
    try { sessionStorage.setItem('_slGenPayload', JSON.stringify(payload)); } catch(e) {}
    if (/social\.html/.test(window.location.pathname)) {
      if (typeof slShowGenModal === 'function') slShowGenModal(payload);
    } else { window.location = 'social.html'; }
  };
}

var EV_EVENTS_BUDGET = [];
var BRIEF_COMMITMENTS = {};
var SOCIAL_BUDGETS = {}; // { site_id: { month: totalBudget } } — from social_posts.budget_allocated

async function loadBriefCommitmentsForTracker() {
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  try {
    var resp = await fetch(base + '/brief_budget_commitments?year=eq.' + PLAN_YEAR + '&select=brief_id,site_id,month_index,amount', {
      headers: getAuthHeaders()
    });
    if (!resp.ok) { console.warn('loadBriefCommitmentsForTracker:', resp.status); return; }
    var rows = await resp.json();
    // Use window. consistently so both declaration and access reference the same object
    window.BRIEF_COMMITMENTS = {};
    window.BRIEF_SITE_AMOUNTS = {};
    BRIEF_COMMITMENTS = window.BRIEF_COMMITMENTS; // keep local ref in sync
    if (Array.isArray(rows)) {
      rows.forEach(function(r) {
        if (!window.BRIEF_COMMITMENTS[r.site_id]) window.BRIEF_COMMITMENTS[r.site_id] = {};
        window.BRIEF_COMMITMENTS[r.site_id][r.month_index] = (window.BRIEF_COMMITMENTS[r.site_id][r.month_index] || 0) + (r.amount || 0);
        if (r.brief_id) {
          if (!window.BRIEF_SITE_AMOUNTS[r.brief_id]) window.BRIEF_SITE_AMOUNTS[r.brief_id] = {};
          window.BRIEF_SITE_AMOUNTS[r.brief_id][r.site_id] = (window.BRIEF_SITE_AMOUNTS[r.brief_id][r.site_id] || 0) + (r.amount || 0);
        }
      });
    }
    console.log('Commitments loaded:', Object.keys(window.BRIEF_COMMITMENTS).length, 'sites,', rows.length, 'rows');
  } catch(e) { console.warn('loadBriefCommitmentsForTracker:', e); }
}

// Channel-level commitment data: BRIEF_COMMITMENTS_BY_CHANNEL[site_id][channel][month] = £
window.BRIEF_COMMITMENTS_BY_CHANNEL = {};

async function loadChannelCommitments() {
  try {
    // Fetch all briefs with channel_split, budget, site info, dates
    var year = parseInt(PLAN_YEAR) || new Date().getFullYear();
    var resp = await fetch(
      SUPABASE_URL + '/rest/v1/briefs?select=id,budget,channel_split,site_id,scope,brand_id,start_date,end_date,status,allocation&status=neq.archived&limit=1000',
      { headers: getAuthHeaders() }
    );
    if (!resp.ok) return;
    var briefs = await resp.json() || [];

    window.BRIEF_COMMITMENTS_BY_CHANNEL = {};

    briefs.forEach(function(brief) {
      if (!brief.channel_split || !brief.budget) return;
      var split = typeof brief.channel_split === 'string'
        ? JSON.parse(brief.channel_split) : brief.channel_split;
      if (!split || !Object.keys(split).length) return;

      // Determine which months this brief covers
      var startMonth = 0, endMonth = 11;
      if (brief.start_date) {
        var sd = new Date(brief.start_date + 'T00:00:00');
        if (sd.getFullYear() === year) startMonth = sd.getMonth();
        else if (sd.getFullYear() > year) return; // future year
      }
      if (brief.end_date) {
        var ed = new Date(brief.end_date + 'T00:00:00');
        if (ed.getFullYear() === year) endMonth = ed.getMonth();
        else if (ed.getFullYear() < year) return; // past year
      }
      var numMonths = endMonth - startMonth + 1;
      if (numMonths < 1) numMonths = 1;

      // Determine which sites this brief covers
      var siteIds = [];
      try {
        // site_id may be a JSON array string or single value
        if (brief.site_id) {
          var parsed = null;
          try { parsed = JSON.parse(brief.site_id); } catch(e) {}
          if (Array.isArray(parsed)) siteIds = parsed;
          else siteIds = [brief.site_id];
        }
      } catch(e) { if (brief.site_id) siteIds = [brief.site_id]; }

      if (!siteIds.length && brief.brand_id && typeof HUB_SITES !== 'undefined') {
        siteIds = HUB_SITES.filter(function(s){ return s.brand_id === brief.brand_id; })
          .map(function(s){ return s.site_id; });
      }
      if (!siteIds.length) return;

      // Map BB_PESO channel IDs to BC_DEFAULT_CHANNELS names
      var CHANNEL_ID_MAP = {
        'google':'Paid Search (Google/Bing)', 'autotrader':'AutoTrader',
        'meta':'Paid Social (Meta/TikTok/LinkedIn)', 'youtube':'Display, Video & Programmatic',
        'tiktok':'Display, Video & Programmatic', 'linkedin':'Display, Video & Programmatic',
        'crm':'Email Marketing', 'organic':'Social Organic',
        'influencer':'Social Organic', 'ugc':'Social Organic',
        'community':'Social Organic', 'events':'Events & Showroom',
        'pr':'Other / Local', 'reviews':'Other / Local',
        'motpress':'Other / Local', 'awards':'Other / Local',
        'seo':'SEO & Content', 'content':'SEO & Content'
      };
      // Distribute channel split across sites and months
      Object.keys(split).forEach(function(channelRaw) {
        var channel = CHANNEL_ID_MAP[channelRaw] || channelRaw;
        var channelTotal = parseFloat(split[channelRaw]) || 0;
        if (!channelTotal) return;
        var perSite = channelTotal / siteIds.length;
        var perMonth = perSite / numMonths;

        siteIds.forEach(function(sid) {
          if (!window.BRIEF_COMMITMENTS_BY_CHANNEL[sid])
            window.BRIEF_COMMITMENTS_BY_CHANNEL[sid] = {};
          if (!window.BRIEF_COMMITMENTS_BY_CHANNEL[sid][channel])
            window.BRIEF_COMMITMENTS_BY_CHANNEL[sid][channel] = {};
          for (var m = startMonth; m <= endMonth; m++) {
            window.BRIEF_COMMITMENTS_BY_CHANNEL[sid][channel][m] =
              (window.BRIEF_COMMITMENTS_BY_CHANNEL[sid][channel][m] || 0) + perMonth;
          }
        });
      });
    });

    console.log('Channel commitments loaded:', Object.keys(window.BRIEF_COMMITMENTS_BY_CHANNEL).length, 'sites');
  } catch(e) { console.warn('loadChannelCommitments:', e); }
}



// Parse site_id field from a campaign — may be a JSON array or single string
function btParseCampSiteIds(c) {
  if (!c.site_id) return [];
  try {
    var p = JSON.parse(c.site_id);
    if (Array.isArray(p)) return p;
  } catch(e) {}
  return [c.site_id];
}

// Check if campaign applies to a given site
function btCampMatchesSite(c, siteId, brandId) {
  if (c.scope === 'sites' || c.scope === 'site') {
    var sids = btParseCampSiteIds(c);
    return sids.indexOf(siteId) !== -1;
  }
  // brand scope — applies to all sites of that brand
  return c.brand_id === brandId;
}

// Get display-ready site names from a campaign's site_id field
function btCampSiteNames(c) {
  var sids = btParseCampSiteIds(c);
  if (!sids.length) return 'Brand-wide';
  return sids.map(function(sid) {
    var s = (typeof HUB_SITES !== 'undefined') ? HUB_SITES.find(function(x){ return x.site_id === sid; }) : null;
    return s ? s.site_name : sid;
  }).join(', ');
}
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
  var _p = window.location.pathname;
  if (!_p.endsWith('index.html')  && !_p.endsWith('/') &&
      !_p.endsWith('brief.html')  && !_p.endsWith('/brief') &&
      !_p.endsWith('calendar.html') && !_p.endsWith('/calendar') &&
      !_p.endsWith('budget.html') && !_p.endsWith('/budget')) return;
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
    var resp = await fetch(SUPABASE_URL + '/rest/v1/briefs?select=id,title,brand_id,campaign_type,objective,budget,start_date,end_date,status,scope,site_id,confirmed_channels,allocation,job_ref&order=start_date.asc', {
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
        budget: r.budget || null,
        type: r.campaign_type,
        objective: r.objective || null,
        brief_id: r.id || null,
        start_date: r.start_date || null,
        end_date: r.end_date || null,
        scope: r.scope || 'brand',
        site_id: r.site_id || null,
        brand_id: r.brand_id || null,
        channels: r.confirmed_channels || [],
        job_ref: r.job_ref || null
      };
    });
    console.log('calLoadFromSupabase: loaded ' + BUILT_IN_CAMPAIGNS.length + ' campaigns');
  } catch(e) { console.warn('calLoadFromSupabase error:', e); }
}


var MC_SOCIAL_POSTS = []; // All social posts for the year — keyed lookup by brief_id

async function mcLoadSocialPosts() {
  try {
    var year = parseInt(PLAN_YEAR) || new Date().getFullYear();
    var r = await fetch(SUPABASE_URL + '/rest/v1/social_posts?select=id,title,brand_id,brief_id,event_id,status,scheduled_at,platform_ids,job_ref&order=scheduled_at.asc', {
      headers: getAuthHeaders({'Content-Type':'application/json'})
    });
    if (r.ok) MC_SOCIAL_POSTS = await r.json() || [];
  } catch(e) { console.warn('mcLoadSocialPosts:', e); }
}

async function calInit() {
  var m = new Date().getMonth();
  CAL_CURRENT_QUARTER = m < 3 ? 0 : m < 6 ? 1 : m < 9 ? 2 : 3;
  await Promise.all([calLoadFromSupabase(), mcLoadSocialPosts()]);
  renderCrossCalendar();
}


function calSetQuarter(q) { CAL_CURRENT_QUARTER = q; renderCrossCalendar(); }


function calPrevQuarter() { CAL_CURRENT_QUARTER = (CAL_CURRENT_QUARTER + 3) % 4; renderCrossCalendar(); }


function calNextQuarter() { CAL_CURRENT_QUARTER = (CAL_CURRENT_QUARTER + 1) % 4; renderCrossCalendar(); }


function renderCrossCalendar() {
  window._calCamps = []; window._calEvs = []; // Reset lookup arrays
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
        var campSocialCount = MC_SOCIAL_POSTS.filter(function(sp){ return sp.brief_id === camp.brief_id; }).length;
        var socialBadge = campSocialCount ? ' <span style="background:rgba(255,255,255,0.3);border-radius:8px;padding:0 5px;font-size:9px">📱' + campSocialCount + '</span>' : '';
        var campEventCount = window._calEvs ? window._calEvs.filter(function(ev){ return ev.brand_id && camp.brand_id && ev.brand_id === camp.brand_id && ev.start_date >= (camp.start_date||'') && ev.start_date <= (camp.end_date||'9999'); }).length : 0;
        var eventBadge = campEventCount ? ' <span style="background:rgba(255,255,255,0.3);border-radius:8px;padding:0 5px;font-size:9px">◆' + campEventCount + '</span>' : '';
        html += '<div data-cal-idx="' + idx + '" style="border-radius:3px;padding:5px 8px;font-size:11px;color:#fff;font-weight:500;line-height:1.3;cursor:pointer;background:' + sColor + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;user-select:none" title="' + safeName + ' (' + (camp.status||'planned') + ')">' + sDot + safeName + socialBadge + eventBadge + '</div>';
      });
      // Add event pills for this brand/month
      var brandSlug = BUDGET_BRANDS ? (BUDGET_BRANDS.find(function(b){ return b.name === brand.id; }) || {}).id : null;
      var evs = brandSlug && EV_EVENTS_BUDGET ? EV_EVENTS_BUDGET.filter(function(ev) {
        if (ev.brand_id !== brandSlug) return false;
        var sm = ev.start_date ? new Date(ev.start_date).getMonth() : -1;
        var em = ev.end_date ? new Date(ev.end_date).getMonth() : sm;
        return sm <= m && m <= em;
      }) : [];
      evs.forEach(function(ev) {
        var safeTitle = (ev.title || 'Event').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        var evIdx = window._calEvs.length;
        window._calEvs.push(ev);
        var evDateStr = '';
        if (ev.start_date) {
          var _sd = new Date(ev.start_date + 'T00:00:00');
          var _ed = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : _sd;
          var _mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          evDateStr = ' · ' + _sd.getDate() + ' ' + _mo[_sd.getMonth()];
          if (ev.end_date && ev.end_date !== ev.start_date) evDateStr += '–' + _ed.getDate() + ' ' + _mo[_ed.getMonth()];
        }
        html += '<div data-cal-ev-idx="' + evIdx + '" style="border-radius:3px;padding:4px 8px;font-size:11px;font-weight:500;line-height:1.3;background:#fff;border:1.5px solid ' + brand.color + ';color:' + brand.color + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer" title="' + safeTitle + ' (event)">◆ ' + safeTitle + evDateStr + '</div>';
      });
      if (!camps.length && !evs.length) html += '<span style="color:var(--ink-faint);font-size:11px;padding:4px 0">—</span>';
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
      if (pill.hasAttribute && (pill.hasAttribute('data-cal-idx') || pill.hasAttribute('data-cal-ev-idx'))) break;
      pill = pill.parentNode;
    }
    if (!pill || pill === el) return;
    if (pill.hasAttribute('data-cal-ev-idx')) {
      var evIdx = parseInt(pill.getAttribute('data-cal-ev-idx'), 10);
      var ev = window._calEvs && window._calEvs[evIdx];
      if (ev) calShowEvent(ev);
    } else {
      var idx = parseInt(pill.getAttribute('data-cal-idx'), 10);
      var camp = window._calCamps && window._calCamps[idx];
      if (camp) calShowCampaign(camp);
    }
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
  var thStyle = 'background:var(--swansway);color:#fff;font-family:var(--font-m);font-size:9px;letter-spacing:0.08em;text-transform:uppercase;padding:9px 8px;text-align:right;white-space:nowrap;width:68px';
  var th1Style = 'background:var(--swansway);color:#fff;font-family:var(--font-m);font-size:9px;letter-spacing:0.08em;text-transform:uppercase;padding:9px 10px;text-align:left;white-space:nowrap;min-width:160px';
  var thSumStyle = 'background:var(--swansway);color:#fff;font-family:var(--font-m);font-size:9px;letter-spacing:0.08em;text-transform:uppercase;padding:9px 10px;text-align:right;white-space:nowrap;width:90px';
  var hdr = '<tr><th style="'+th1Style+'">Brand / Site</th>';
  CAL_MONTHS.forEach(function(m) { hdr += '<th style="'+thStyle+'">' + m + '</th>'; });
  hdr += '<th style="'+thSumStyle+'">Planned</th><th style="'+thSumStyle+';color:#2563EB">Allocated</th><th style="'+thSumStyle+';color:#BB0A21">Events</th><th style="'+thSumStyle+'">Actual</th><th style="'+thSumStyle+'">Variance</th></tr>';
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
      // No site budget data entered yet — show zeros
      for (var i = 0; i < 12; i++) brandMonthlyPlan[i] = 0;
    }

    var brandPlan   = brandMonthlyPlan.reduce(function(s, v) { return s + v; }, 0);
    var brandActual = brandMonthlyActual.reduce(function(s, v) { return s + v; }, 0);
    totalPlanned += brandPlan;
    totalActual  += brandActual;
    for (var i = 0; i < 12; i++) {
      mPlanned[i] += brandMonthlyPlan[i];
      mActual[i]  += brandMonthlyActual[i];
    }

    // Brand monthly allocations + events
    var brandMonthlyAlloc = new Array(12).fill(0);
    var brandMonthlyEvents = new Array(12).fill(0);
    sites.forEach(function(site) {
      for (var mi2 = 0; mi2 < 12; mi2++) {
        brandMonthlyAlloc[mi2]  += ((window.ACTIVITY_ALLOCATIONS || {})[site.site_id] || {})[mi2] || 0;
      }
    });
    var planYear2 = parseInt(PLAN_YEAR) || new Date().getFullYear();
    (EV_EVENTS_BUDGET || []).forEach(function(ev) {
      if (!ev.start_date || !ev.site_id) return;
      var evDate = new Date(ev.start_date + 'T00:00:00');
      if (evDate.getFullYear() !== planYear2) return;
      var evSite = (typeof HUB_SITES !== 'undefined') ? HUB_SITES.find(function(s){ return s.site_id === ev.site_id; }) : null;
      if (evSite && evSite.brand_id === b.id) {
        brandMonthlyEvents[evDate.getMonth()] += ev.planned_budget || 0;
      }
    });
    var brandAlloc  = brandMonthlyAlloc.reduce(function(s,v){ return s+v; }, 0);
    var brandEvents = brandMonthlyEvents.reduce(function(s,v){ return s+v; }, 0);

    var variance = brandActual > 0 ? brandActual - brandPlan : 0;
    var varStyle, varStr;
    if (brandActual > 0) {
      varStyle = variance > 0 ? 'color:#DC2626' : 'color:#059669';
      varStr = (variance >= 0 ? '+' : '') + '&pound;' + Math.abs(variance).toLocaleString();
    } else if (brandAlloc > 0 || brandEvents > 0) {
      var remaining = brandPlan - brandAlloc - brandEvents;
      varStyle = remaining < 0 ? 'color:#DC2626' : 'color:#059669';
      varStr = '&pound;' + Math.abs(remaining).toLocaleString() + (remaining < 0 ? ' over' : ' left');
    } else { varStyle = ''; varStr = '&mdash;'; }

    var brandRowId = 'bt-sites-' + b.id;
    var brandCells = '';
    for (var mi = 0; mi < 12; mi++) {
      var plan = brandMonthlyPlan[mi];
      var act  = brandMonthlyActual[mi];
      var alloc = brandMonthlyAlloc[mi];
      var evs  = brandMonthlyEvents[mi];
      var diff = act - plan;
      var cls  = act === 0 ? '' : (diff > plan * 0.1 ? ' budget-over' : diff < -plan * 0.1 ? ' budget-under' : ' budget-on');
      var inner;
      if (act > 0) {
        inner = '&pound;' + act.toLocaleString();
      } else if (plan > 0) {
        inner = '<em style="color:var(--ink-faint)">&pound;' + plan.toLocaleString() + '</em>';
      } else {
        inner = '<em style="color:var(--ink-faint)">&mdash;</em>';
      }
      if (alloc > 0) inner += '<div style="font-size:9px;color:#2563EB;font-weight:600;line-height:1.2">&pound;' + alloc.toLocaleString() + ' alloc</div>';
      if (evs > 0)   inner += '<div style="font-size:9px;color:#BB0A21;font-weight:600;line-height:1.2">&pound;' + evs.toLocaleString() + ' events</div>';
      brandCells += '<td class="budget-cell' + cls + '" style="line-height:1.4">' + inner + '</td>';
    }

    var accordId = 'bt-sites-' + b.id;
    var trClick = sites.length > 0 ? ' style="background:var(--white);border-top:3px solid var(--border);cursor:pointer" onclick="btToggle(\'' + accordId + '\')"' : ' style="background:var(--white);border-top:3px solid var(--border)"';
    var chvHtml = sites.length > 0 ? '<span id="chv-' + accordId + '" style="font-size:10px;color:var(--ink-soft);width:14px;flex-shrink:0">&#9654;</span>' : '';
    var sitesLabel = sites.length > 0 ? '<div style="font-size:10px;color:var(--ink-soft);margin-left:16px;padding-bottom:4px">' + sites.length + (sites.length === 1 ? ' site' : ' sites') + '</div>' : '';
    rows += '<tr' + trClick + '>'
      + '<td style="padding:12px 10px 10px;border-left:4px solid ' + b.color + '"><div style="display:flex;align-items:center;gap:6px;font-family:var(--font-d);font-weight:800;font-size:14px">'
      + chvHtml
      + '<span style="width:10px;height:10px;border-radius:50%;background:' + b.color + ';display:inline-block;flex-shrink:0"></span>'
      + b.name + '</div>'
      + sitesLabel
      + '</td>'
      + brandCells
      + '<td style="text-align:right;font-size:11px;color:var(--ink-soft);font-weight:700">' + (brandPlan > 0 ? '&pound;' + brandPlan.toLocaleString() : '&mdash;') + '</td>'
      + '<td style="text-align:right;font-size:12px;font-weight:700;color:#2563EB">' + (brandAlloc > 0 ? '&pound;' + brandAlloc.toLocaleString() : '&mdash;') + '</td>'
      + '<td style="text-align:right;font-size:12px;font-weight:700;color:#BB0A21">' + (brandEvents > 0 ? '&pound;' + brandEvents.toLocaleString() : '&mdash;') + '</td>'
      + '<td style="text-align:right;font-size:12px;font-weight:700">' + (brandActual > 0 ? '&pound;' + brandActual.toLocaleString() : '&mdash;') + '</td>'
      + '<td style="text-align:right;font-size:11px;' + varStyle + '">' + varStr + '</td>'
      + '</tr>';

    // Site rows with accordion
    if (hasSiteData) {
      sites.forEach(function(site) {
        var d = SITE_BUDGETS[site.site_id] || {};
        var sitePlan = 0, siteActual = 0;
        var siteCells = '';
        // Declare siteSocialData here so it's available inside the month loop below
        var siteSocialData = typeof getSocialBudgetBySite === 'function' ? getSocialBudgetBySite(site.site_id, site.brand_id) : { months: {}, posts: [] };
        for (var mi = 0; mi < 12; mi++) {
          var sp     = d['m' + mi + '_planned'] || 0;
          var sa     = d['m' + mi + '_actual']  || 0;
          var salloc = ((window.ACTIVITY_ALLOCATIONS || {})[site.site_id] || {})[mi] || 0;
          var sevs   = 0;
          // Event costs for this site this month
          var planYear3 = parseInt(PLAN_YEAR) || new Date().getFullYear();
          (EV_EVENTS_BUDGET || []).forEach(function(ev) {
            if (ev.site_id !== site.site_id || !ev.start_date) return;
            var evD = new Date(ev.start_date + 'T00:00:00');
            if (evD.getFullYear() === planYear3 && evD.getMonth() === mi) sevs += ev.planned_budget || 0;
          });
          sitePlan += sp; siteActual += sa;
          var scls = sa === 0 ? '' : ((sa-sp) > sp*0.1 ? ' budget-over' : (sa-sp) < -sp*0.1 ? ' budget-under' : ' budget-on');
          var sinner;
          if (sa > 0) {
            sinner = '&pound;' + sa.toLocaleString();
          } else if (sp > 0) {
            sinner = '<em style="color:var(--ink-faint)">&pound;' + sp.toLocaleString() + '</em>';
          } else {
            sinner = '<em style="color:var(--ink-faint)">&mdash;</em>';
          }
          if (salloc > 0) sinner += '<div style="font-size:9px;color:#2563EB;font-weight:600;line-height:1.2">&pound;' + salloc.toLocaleString() + ' alloc</div>';
          if (sevs > 0)   sinner += '<div style="font-size:9px;color:#BB0A21;font-weight:600;line-height:1.2">&pound;' + sevs.toLocaleString() + ' events</div>';
          siteCells += '<td class="budget-cell' + scls + '" style="font-size:11px;padding:4px 8px;line-height:1.4">' + sinner + '</td>';
        }
        // Calculate site totals for allocated and events
        var siteTotalAlloc = 0, siteTotalEvents = 0;
        for (var ai3=0;ai3<12;ai3++) { siteTotalAlloc += ((window.ACTIVITY_ALLOCATIONS || {})[site.site_id] || {})[ai3] || 0; }
        var planYear4 = parseInt(PLAN_YEAR) || new Date().getFullYear();
        (EV_EVENTS_BUDGET || []).forEach(function(ev) {
          if (ev.site_id !== site.site_id || !ev.start_date) return;
          if (new Date(ev.start_date + 'T00:00:00').getFullYear() === planYear4) siteTotalEvents += ev.planned_budget || 0;
        });
        var sVarStr, sVarStyle;
        if (siteActual > 0) {
          var sVn = siteActual - sitePlan;
          sVarStyle = sVn > 0 ? 'color:#DC2626' : 'color:#059669';
          sVarStr = '&pound;' + Math.abs(sVn).toLocaleString() + (sVn > 0 ? ' over' : ' under');
        } else if (siteTotalAlloc > 0 || siteTotalEvents > 0) {
          var sRemaining = sitePlan - siteTotalAlloc - siteTotalEvents;
          sVarStyle = sRemaining < 0 ? 'color:#DC2626' : 'color:#059669';
          sVarStr = '&pound;' + Math.abs(sRemaining).toLocaleString() + (sRemaining < 0 ? ' over' : ' left');
        } else { sVarStyle = ''; sVarStr = '&mdash;'; }
        var actOrCmt = siteActual > 0 ? '&pound;' + siteActual.toLocaleString() : '&mdash;';

        // Identify campaigns + events for this site
        var planYear = parseInt(PLAN_YEAR) || new Date().getFullYear();
        var siteCamps = BUILT_IN_CAMPAIGNS.filter(function(c) {
          if (!c.start_date) return false;
          if (new Date(c.start_date + 'T00:00:00').getFullYear() !== planYear) return false;
          return btCampMatchesSite(c, site.site_id, site.brand_id);
        });
        var siteEvs = EV_EVENTS_BUDGET.filter(function(ev) {
          if (ev.site_id !== site.site_id || !ev.start_date) return false;
          return new Date(ev.start_date + 'T00:00:00').getFullYear() === planYear;
        });
        var identifiedCamp = siteCamps.reduce(function(sum, c) {
          // Try exact per-site amount from brief_budget_commitments
          var bsa = (window.BRIEF_SITE_AMOUNTS && c.brief_id && window.BRIEF_SITE_AMOUNTS[c.brief_id])
            ? (window.BRIEF_SITE_AMOUNTS[c.brief_id][site.site_id] || null) : null;
          if (bsa === null && c.budget) {
            var cids = btParseCampSiteIds(c);
            if (cids.length > 1) {
              // Multi-site: divide equally across selected sites
              bsa = Math.round(c.budget / cids.length);
            } else if (cids.length === 0) {
              // Brand-wide: divide equally across all brand sites
              var brandSiteCount = HUB_SITES.filter(function(s){ return s.brand_id === site.brand_id; }).length || 1;
              bsa = Math.round(c.budget / brandSiteCount);
            } else {
              bsa = c.budget;
            }
          }
          return sum + (bsa || 0);
        }, 0);
        var identifiedEvPl  = siteEvs.reduce(function(s,e){ return s + (e.planned_budget || 0); }, 0);
        var identifiedEvAc  = siteEvs.reduce(function(s,e){ return s + (e.actual_spend   || 0); }, 0);
        // siteSocialData already declared before the month loop above
        var siteSocialTotal = Object.values(siteSocialData.months).reduce(function(s,v){ return s+v; }, 0);
        var siteSocialPosts = siteSocialData.posts || [];
        var identifiedTotal = identifiedCamp + identifiedEvPl + siteSocialTotal;
        var siteHasChannelData = Object.keys((window.BRIEF_COMMITMENTS_BY_CHANNEL || {})[site.site_id] || {}).length > 0
          || Object.keys((SITE_BUDGETS[site.site_id] || {}).channels || {}).length > 0;
        var hasItems = siteCamps.length > 0 || siteEvs.length > 0 || siteSocialPosts.length > 0 || siteHasChannelData;
        var accordId = 'bta-' + site.site_id.replace(/[^a-z0-9]/gi, '_');

        var siteLabel = hasItems
          ? '<span style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="btToggle(\'' + accordId + '\')">'
            + '<span class="bt-chevron" id="chv-' + accordId + '">&#9654;</span>' + btEsc(site.site_name) + '</span>'
            + (sitePlan > 0 ? '<div style="font-size:10px;font-family:var(--font-m);color:var(--ink-faint);margin-top:2px;margin-left:16px">&pound;'
              + (siteTotalAlloc + siteTotalEvents).toLocaleString() + ' allocated of &pound;' + sitePlan.toLocaleString() + ' annual allocation</div>' : '')
          : btEsc(site.site_name);

        rows += '<tr id="row-' + accordId + '" data-brand-rows="bt-sites-' + b.id + '" style="background:var(--white);border-bottom:' + (hasItems ? 'none' : '1px solid var(--border)') + ';display:none">'
          + '<td style="padding:7px 10px 7px 28px;font-size:12px;color:var(--ink);border-left:4px solid ' + b.color + '">' + siteLabel + '</td>'
          + siteCells
          + '<td style="text-align:right;font-size:11px;color:var(--ink-faint);padding:4px 8px">' + (sitePlan > 0 ? '&pound;' + sitePlan.toLocaleString() : '&mdash;') + '</td>'
          + '<td style="text-align:right;font-size:11px;padding:4px 8px;color:#2563EB;font-weight:700">' + (siteTotalAlloc > 0 ? '&pound;' + siteTotalAlloc.toLocaleString() : '&mdash;') + '</td>'
          + '<td style="text-align:right;font-size:11px;padding:4px 8px;color:#BB0A21;font-weight:700">' + (siteTotalEvents > 0 ? '&pound;' + siteTotalEvents.toLocaleString() : '&mdash;') + '</td>'
          + '<td style="text-align:right;font-size:11px;padding:4px 8px">' + actOrCmt + '</td>'
          + '<td style="text-align:right;font-size:11px;' + sVarStyle + ';padding:4px 8px">' + sVarStr + '</td>'
          + '</tr>';

        // Accordion detail row
        if (hasItems) {
          var STATUS_C = { planned:'#6B7280', briefed:'#D97706', active:'#059669', completed:'#374151', approved:'#2563EB', cancelled:'#DC2626' };
          var STATUS_E = { draft:'#6B7280', confirmed:'#2563EB', completed:'#059669', cancelled:'#DC2626' };
          var colCount = 18;
          var acHtml = '<td colspan="' + colCount + '" style="padding:0;border-left:4px solid ' + b.color + ';background:var(--surface);border-bottom:1px solid var(--border)">';
          acHtml += '<div class="bt-accord" id="' + accordId + '" style="display:none"><div style="padding:14px 20px 18px">';

          if (siteCamps.length > 0) {
            acHtml += '<div class="bt-accord-section-label">Campaigns</div>';
            acHtml += '<table class="bt-accord-table"><thead><tr>'
              + '<th>Campaign</th><th>Type</th><th>Dates</th><th>Coverage</th><th style="text-align:right">This site</th><th>Status</th>'
              + '</tr></thead><tbody>';
            siteCamps.forEach(function(c) {
              var sc = STATUS_C[c.status] || '#6B7280';
              var dateStr = c.start_date ? btFmtDate(c.start_date) : '&mdash;';
              if (c.end_date && c.end_date !== c.start_date) dateStr += ' &ndash; ' + btFmtDate(c.end_date);
              // Per-site amount from BRIEF_SITE_AMOUNTS, fallback to equal split of total
              var bsa = (window.BRIEF_SITE_AMOUNTS && c.brief_id && window.BRIEF_SITE_AMOUNTS[c.brief_id])
                ? (window.BRIEF_SITE_AMOUNTS[c.brief_id][site.site_id] || null)
                : null;
              // If no per-site data, estimate: total / number of sites in campaign
              if (bsa === null && c.budget) {
                var campSiteIds = btParseCampSiteIds(c);
                if (campSiteIds.length > 1) {
                  bsa = Math.round(c.budget / campSiteIds.length);
                } else if (campSiteIds.length === 0) {
                  var bSiteCount = HUB_SITES.filter(function(s){ return s.brand_id === (c.brand_id || site.brand_id); }).length || 1;
                  bsa = Math.round(c.budget / bSiteCount);
                } else {
                  bsa = c.budget;
                }
              }
              // Scope label — how many sites share this campaign
              var campSiteCount = btParseCampSiteIds(c).length;
              var scopeLabel = campSiteCount > 1
                ? campSiteCount + '-site campaign'
                : (c.scope === 'sites' || c.scope === 'site' ? 'This site only' : 'Brand-wide');
              acHtml += '<tr>'
                + '<td style="font-weight:600">' + btEsc(c.name) + '</td>'
                + '<td><span style="font-size:10px;padding:2px 7px;border-radius:3px;background:#F3F4F6;font-family:var(--font-m)">' + btEsc(c.type || '&mdash;') + '</span></td>'
                + '<td style="color:var(--ink-soft);white-space:nowrap">' + dateStr + '</td>'
                + '<td style="color:var(--ink-faint);font-size:11px">' + scopeLabel + '</td>'
                + '<td style="text-align:right;font-family:var(--font-m)">' + (bsa !== null ? '&pound;' + Number(bsa).toLocaleString() : '&mdash;') + '</td>'
                + '<td><span style="font-size:10px;padding:2px 7px;border-radius:3px;color:#fff;background:' + sc + ';font-family:var(--font-m)">' + btEsc(c.status || 'planned') + '</span></td>'
                + '</tr>';
            });
            acHtml += '<tr class="bt-accord-total"><td colspan="4">This site\'s campaign spend</td>'
              + '<td style="text-align:right;font-family:var(--font-m)">' + (identifiedCamp > 0 ? '&pound;' + identifiedCamp.toLocaleString() : '&mdash;') + '</td><td></td></tr>';
            acHtml += '</tbody></table>';
          }

          if (siteEvs.length > 0) {
            acHtml += '<div class="bt-accord-section-label" style="margin-top:14px">Events &amp; Placements</div>';
            acHtml += '<table class="bt-accord-table"><thead><tr>'
              + '<th>Event</th><th>Type</th><th>Dates</th><th>Coverage</th><th style="text-align:right">Budget</th><th>Status</th>'
              + '</tr></thead><tbody>';
            siteEvs.forEach(function(ev) {
              var se = STATUS_E[ev.status] || '#6B7280';
              var dateStr = ev.start_date ? btFmtDate(ev.start_date) : '&mdash;';
              if (ev.end_date && ev.end_date !== ev.start_date) dateStr += ' &ndash; ' + btFmtDate(ev.end_date);
              var budgetCell = ev.planned_budget ? '&pound;' + Number(ev.planned_budget).toLocaleString() : '&mdash;';
              if (ev.actual_spend) budgetCell += '<div style="font-size:9px;color:#059669;font-weight:600;line-height:1.2">&pound;' + Number(ev.actual_spend).toLocaleString() + ' actual</div>';
              acHtml += '<tr>'
                + '<td style="font-weight:600">' + btEsc(ev.title || 'Untitled') + '</td>'
                + '<td><span style="font-size:10px;padding:2px 7px;border-radius:3px;background:#F3F4F6;font-family:var(--font-m)">' + btEsc(ev.event_type || 'Event') + '</span></td>'
                + '<td style="color:var(--ink-soft);white-space:nowrap">' + dateStr + '</td>'
                + '<td style="color:var(--ink-faint);font-size:11px">This site</td>'
                + '<td style="text-align:right;font-family:var(--font-m);line-height:1.4">' + budgetCell + '</td>'
                + '<td><span style="font-size:10px;padding:2px 7px;border-radius:3px;color:#fff;background:' + se + ';font-family:var(--font-m)">' + btEsc(ev.status || 'draft') + '</span></td>'
                + '</tr>';
            });
            acHtml += '<tr class="bt-accord-total"><td colspan="4">Events total</td>'
              + '<td style="text-align:right;font-family:var(--font-m)">' + (identifiedEvPl > 0 ? '&pound;' + identifiedEvPl.toLocaleString() : '&mdash;') + '</td>'
              + '<td></td></tr>';
            acHtml += '</tbody></table>';
          }

          // Social posts section
          if (siteSocialPosts.length > 0) {
            acHtml += '<div class="bt-accord-section-label" style="margin-top:14px">📲 Social Posts</div>';
            acHtml += '<table class="bt-accord-table"><thead><tr>'
              + '<th>Post</th><th>Type</th><th>Platforms</th><th>Scheduled</th><th style="text-align:right">Budget</th><th>Status</th>'
              + '</tr></thead><tbody>';
            var SL_STATUS_LABELS = { draft:'Draft', in_review:'In Review', approved:'Approved', scheduled:'Scheduled', published:'Published', rejected:'Rejected' };
            var SL_STATUS_COLORS = { draft:'#6B6560', in_review:'#92400E', approved:'#065F46', scheduled:'#1E3A8A', published:'#4C1D95', rejected:'#991B1B' };
            siteSocialPosts.forEach(function(p) {
              var sc2 = SL_STATUS_COLORS[p.status] || '#6B7280';
              var scheduledStr = p.scheduled_at
                ? new Date(p.scheduled_at).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})
                : '<em style="color:var(--ink-faint)">TBC</em>';
              var platIds = [];
              try { platIds = Array.isArray(p.platform_ids) ? p.platform_ids : JSON.parse(p.platform_ids || '[]'); } catch(e) {}
              var platIcons = { facebook:'👤', instagram:'📸', linkedin:'💼', tiktok:'🎵', gmb:'📍', threads:'🔗' };
              var platStr = platIds.map(function(pid){ return platIcons[pid] || pid; }).join(' ') || '&mdash;';
              var typeLabel = (p.post_type||'').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}) || '&mdash;';
              acHtml += '<tr>'
                + '<td style="font-weight:600">' + btEsc(p.title || 'Untitled') + '</td>'
                + '<td><span style="font-size:10px;padding:2px 7px;border-radius:3px;background:#F3F4F6;font-family:var(--font-m)">' + btEsc(typeLabel) + '</span></td>'
                + '<td style="font-size:12px">' + platStr + '</td>'
                + '<td style="color:var(--ink-soft);white-space:nowrap">' + scheduledStr + '</td>'
                + '<td style="text-align:right;font-family:var(--font-m);color:#1877F2;font-weight:600">' + (p.budget_allocated ? '&pound;' + Number(p.budget_allocated).toLocaleString() : '&mdash;') + '</td>'
                + '<td><span style="font-size:10px;padding:2px 7px;border-radius:3px;color:#fff;background:' + sc2 + ';font-family:var(--font-m)">' + btEsc(SL_STATUS_LABELS[p.status] || p.status || 'draft') + '</span></td>'
                + '</tr>';
            });
            acHtml += '<tr class="bt-accord-total"><td colspan="4">Social posts total</td>'
              + '<td style="text-align:right;font-family:var(--font-m);color:#1877F2">' + (siteSocialTotal > 0 ? '&pound;' + siteSocialTotal.toLocaleString() : '&mdash;') + '</td>'
              + '<td></td></tr>';
            acHtml += '</tbody></table>';
          }

          // Summary bar
          if (sitePlan > 0) {
            var pct = Math.min(100, Math.round(identifiedTotal / sitePlan * 100));
            var barColor = pct > 90 ? '#DC2626' : pct > 70 ? '#D97706' : '#2563EB';
            acHtml += '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:16px">';
            acHtml += '<div style="flex:1">';
            acHtml += '<div style="display:flex;justify-content:space-between;margin-bottom:5px;font-family:var(--font-m);font-size:10px;color:var(--ink-soft)">'
              + '<span>Committed vs annual allocation</span><span style="font-weight:700;color:' + barColor + '">' + pct + '% committed</span></div>';
            acHtml += '<div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">'
              + '<div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:3px"></div></div>';
            acHtml += '</div>';
            acHtml += '<div style="font-family:var(--font-m);font-size:11px;color:var(--ink-faint);text-align:right;flex-shrink:0">'
              + (sitePlan - identifiedTotal > 0 ? '&pound;' + (sitePlan - identifiedTotal).toLocaleString() + ' uncommitted' : 'Fully allocated')
              + '</div></div>';
          }

          // ── Channel breakdown: planned vs committed vs allocated per channel ──
          var siteChannelData = window.BRIEF_COMMITMENTS_BY_CHANNEL ? (window.BRIEF_COMMITMENTS_BY_CHANNEL[site.site_id] || {}) : {};
          var siteChannelPlanned = (typeof SITE_BUDGETS !== 'undefined' && SITE_BUDGETS[site.site_id])
            ? (SITE_BUDGETS[site.site_id].channels || {}) : {};

          // Build activity allocations by channel for this site
          // activity_budget_lines has channel_id — we need to map to channel name via sbl_channel_name
          // Use ACTIVITY_ALLOCATIONS_BY_CHANNEL[site_id][channel_name] = total
          var siteActAlloc = (window.ACTIVITY_ALLOCATIONS_BY_CHANNEL || {})[site.site_id] || {};

          // Add event costs to Events & Showroom channel
          var siteEventTotal = siteEvs.reduce(function(s, ev) { return s + (ev.planned_budget || 0); }, 0);
          if (siteEventTotal > 0) {
            if (!siteActAlloc['Events & Showroom']) siteActAlloc['Events & Showroom'] = 0;
            siteActAlloc = Object.assign({}, siteActAlloc);
            siteActAlloc['Events & Showroom'] = (siteActAlloc['Events & Showroom'] || 0) + siteEventTotal;
          }

          var channelKeys = Object.keys(siteChannelPlanned).length
            ? Object.keys(siteChannelPlanned)
            : Object.keys(siteChannelData);

          // Ensure channels with allocations are shown even if not in planned
          Object.keys(siteActAlloc).forEach(function(ch) {
            if (channelKeys.indexOf(ch) === -1) channelKeys.push(ch);
          });

          if (channelKeys.length > 0) {
            acHtml += '<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">';
            acHtml += '<div class="bt-accord-section-label" style="margin-bottom:8px">Channel budget breakdown</div>';
            acHtml += '<table class="bt-accord-table"><thead><tr>'
              + '<th style="text-align:left">Channel</th>'
              + '<th style="text-align:right">Annual planned</th>'
              + '<th style="text-align:right">Committed</th>'
              + '<th style="text-align:right;color:#2563EB">Allocated</th>'
              + '<th style="text-align:right">Remaining</th>'
              + '<th style="min-width:80px">Used</th>'
              + '</tr></thead><tbody>';

            channelKeys.forEach(function(ch) {
              var chPlanData = siteChannelPlanned[ch] || {};
              var chPlanTotal = Object.values(chPlanData).reduce(function(s, v) {
                return s + ((typeof v === 'object' ? (v.planned || 0) : v) || 0);
              }, 0);
              var chCommitData = siteChannelData[ch] || {};
              var chCommitTotal = Math.round(Object.values(chCommitData).reduce(function(s, v){ return s + v; }, 0));
              var chAllocTotal = Math.round(siteActAlloc[ch] || 0);
              var chUsed = Math.max(chCommitTotal, chAllocTotal);
              var chRemaining = chPlanTotal - chUsed;
              var chPct = chPlanTotal > 0 ? Math.min(100, Math.round(chUsed / chPlanTotal * 100)) : 0;
              var chColor = chPct > 100 ? '#DC2626' : chPct > 85 ? '#D97706' : '#2563EB';
              var remainStyle = chRemaining < 0 ? 'color:#DC2626;font-weight:700' : chRemaining < chPlanTotal * 0.1 ? 'color:#D97706;font-weight:700' : 'color:#059669';
              acHtml += '<tr>'
                + '<td style="font-size:12px;font-weight:600">' + btEsc(ch) + '</td>'
                + '<td style="text-align:right;font-family:var(--font-m);font-size:11px">' + (chPlanTotal > 0 ? '&pound;' + chPlanTotal.toLocaleString() : '&mdash;') + '</td>'
                + '<td style="text-align:right;font-family:var(--font-m);font-size:11px;color:#D97706;font-weight:' + (chCommitTotal > 0 ? '700' : '400') + '">' + (chCommitTotal > 0 ? '&pound;' + chCommitTotal.toLocaleString() : '&mdash;') + '</td>'
                + '<td style="text-align:right;font-family:var(--font-m);font-size:11px;color:#2563EB;font-weight:' + (chAllocTotal > 0 ? '700' : '400') + '">' + (chAllocTotal > 0 ? '&pound;' + chAllocTotal.toLocaleString() : '&mdash;') + '</td>'
                + '<td style="text-align:right;font-family:var(--font-m);font-size:11px;' + remainStyle + '">' + (chPlanTotal > 0 ? (chRemaining < 0 ? '-' : '') + '&pound;' + Math.abs(chRemaining).toLocaleString() : '&mdash;') + '</td>'
                + '<td><div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-top:2px">'
                +   '<div style="height:100%;width:' + chPct + '%;background:' + chColor + ';border-radius:2px"></div>'
                + '</div><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);margin-top:2px">' + chPct + '%</div></td>'
                + '</tr>';
            });
            acHtml += '</tbody></table></div>';
          }

          acHtml += '</div></div></td>';
          rows += '<tr class="bt-accord-row" id="acrow-' + accordId + '" data-brand-rows="bt-sites-' + b.id + '" style="display:none">' + acHtml + '</tr>';
        }

      });

    }
  });

  tbody.innerHTML = rows;

  // Metrics
  // Calculate totals for metrics
  var totalAllocated = 0;
  var totalEventsPlanned = 0;
  var planYearM = parseInt(PLAN_YEAR) || new Date().getFullYear();
  Object.values(window.ACTIVITY_ALLOCATIONS || {}).forEach(function(months) {
    Object.values(months).forEach(function(v){ totalAllocated += v; });
  });
  (EV_EVENTS_BUDGET || []).forEach(function(ev) {
    if (!ev.start_date) return;
    if (new Date(ev.start_date + 'T00:00:00').getFullYear() !== planYearM) return;
    totalEventsPlanned += ev.planned_budget || 0;
  });
  var trueRemaining = totalPlanned - totalAllocated - totalEventsPlanned - totalActual;
  var pct = totalActual > 0 ? Math.round(totalActual/totalPlanned*100) : totalAllocated > 0 ? Math.round(totalAllocated/totalPlanned*100) : 0;
  function fmtBudget(v) {
    if (v >= 100000) return '&pound;' + (v/1000000).toFixed(2) + 'M';
    if (v >= 1000)   return '&pound;' + (v/1000).toFixed(1) + 'K';
    return '&pound;' + v.toLocaleString();
  }
  metricsEl.innerHTML = [
    {label:'Total planned ' + PLAN_YEAR,  val: fmtBudget(totalPlanned),                         sub:'Across all brands',                      color:'var(--swansway)'},
    {label:'Activities allocated',         val: totalAllocated > 0 ? fmtBudget(totalAllocated) : '&pound;0', sub:'From quarterly activity planning', color:'#2563EB'},
    {label:'Events committed',             val: totalEventsPlanned > 0 ? fmtBudget(totalEventsPlanned) : '&pound;0', sub:'From events & placements',  color:'#BB0A21'},
    {label:'Actual spent',                 val: totalActual > 0 ? fmtBudget(totalActual) : '&pound;0', sub:'Entered in site budgets',             color:'#059669'},
    {label:'Remaining headroom',           val: fmtBudget(Math.max(0, trueRemaining)),            sub:'Planned &minus; allocated &minus; events &minus; actual', color:'#6B7280'},
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
    var planned = 0, actual = 0, allocated = 0;
    sites.forEach(function(site) {
      var d = SITE_BUDGETS[site.site_id] || {};
      for (var i = 0; i < 12; i++) {
        planned   += d['m' + i + '_planned'] || 0;
        actual    += d['m' + i + '_actual']  || 0;
        allocated += ((window.ACTIVITY_ALLOCATIONS || {})[site.site_id] || {})[i] || 0;
      }
    });
    if (planned === 0 && actual === 0 && allocated === 0) {
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
    var pctAllocated = planned > 0 ? Math.min(100 - pctActual, Math.round(allocated / planned * 100)) : 0;
    var statusColor  = pctActual > 90 ? '#DC2626' : pctActual > 50 ? '#059669' : '#6B7280';
    var actualStr    = actual    > 0 ? '&pound;' + (actual/1000).toFixed(0) + 'K spent' : '';
    var allocStr     = allocated > 0 ? '&pound;' + (allocated/1000).toFixed(0) + 'K allocated' : '';
    var subStr       = actualStr + (actualStr && allocStr ? ' &middot; ' : '') + allocStr
                       || ('&pound;' + (planned/1000).toFixed(0) + 'K planned');
    html += '<div style="background:var(--white);border:1px solid var(--border);border-left:4px solid ' + b.color + ';border-radius:4px;padding:10px 14px">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">'
      + '<div style="font-size:12px;font-weight:700;color:var(--ink)">' + b.name + '</div>'
      + '<div style="font-size:12px;font-weight:700;color:' + statusColor + '">' + pctActual + '%</div>'
      + '</div>'
      + '<div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;display:flex">'
      + (pctActual    > 0 ? '<div style="width:' + pctActual    + '%;background:#059669;height:6px"></div>' : '')
      + (pctAllocated > 0 ? '<div style="width:' + pctAllocated + '%;background:#2563EB;height:6px"></div>' : '')
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


async function calShowCampaign(cJson) {
  var c;
  try { c = typeof cJson === 'string' ? JSON.parse(cJson) : cJson; } catch(e) { return; }
  if (!c) return;
  var existing = document.getElementById('cal-modal');
  if (existing) existing.remove();

  var MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var dates = '';
  if (c.start_date) {
    var sd = new Date(c.start_date + 'T00:00:00');
    var ed = c.end_date ? new Date(c.end_date + 'T00:00:00') : sd;
    var fmt = function(d){ return d.getDate() + ' ' + MN[d.getMonth()] + ' ' + d.getFullYear(); };
    dates = fmt(sd) + (c.end_date && c.end_date !== c.start_date ? ' – ' + fmt(ed) : '');
  } else {
    dates = MN[c.start] + (c.end !== c.start ? ' – ' + MN[c.end] : '') + ' ' + PLAN_YEAR;
  }

  var statusColors = {planned:'#6B7280',briefed:'#D97706',active:'#059669',completed:'#374151',approved:'#2563EB'};
  var statusColor = statusColors[c.status||'planned'] || '#6B7280';

  var overlay = document.createElement('div');
  overlay.id = 'cal-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:600;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:8px;width:100%;max-width:640px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.25)';

  // Header
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:' + c.color + ';padding:22px 24px 18px;position:relative';
  hdr.innerHTML =
    '<div style="font-family:var(--font-m);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:4px">' + (c.brand||'') + '</div>' +
    '<div style="font-family:var(--font-d);font-size:21px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:4px">' + (c.name||'Untitled') + '</div>' +
    '<div style="font-size:12px;color:rgba(255,255,255,0.8);margin-bottom:6px">' + dates + '</div>' +
    (c.job_ref ? '<div style="display:inline-block;padding:2px 10px;background:rgba(0,0,0,0.25);border-radius:4px;font-family:var(--font-m);font-size:10px;color:rgba(255,255,255,0.9);letter-spacing:0.06em">' + c.job_ref + '</div>' : '') +
    '<button onclick="var _m=document.getElementById(\'cal-modal\');if(_m)_m.remove();" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.2);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1">&times;</button>';

  // Body
  var body = document.createElement('div');
  body.style.cssText = 'padding:20px 24px 8px';
  body.innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap">' +
    '<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;font-family:var(--font-m);text-transform:uppercase;letter-spacing:0.06em;color:#fff;background:' + statusColor + '">' + (c.status||'planned') + '</span>' +
    (c.type ? '<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;font-family:var(--font-m);background:var(--surface);color:var(--ink)">' + c.type + '</span>' : '') +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">' +
    (c.budget ? '<div style="padding:10px 14px;background:var(--surface);border-radius:4px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px">Budget</div><div style="font-size:14px;font-weight:700;color:var(--ink)">&#163;' + Number(c.budget).toLocaleString() + '</div></div>' : '') +
    '<div style="padding:10px 14px;background:var(--surface);border-radius:4px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px">Dates</div><div style="font-size:12px;font-weight:600;color:var(--ink)">' + dates + '</div></div>' +
    (c.objective ? '<div style="padding:10px 14px;background:var(--surface);border-radius:4px;grid-column:1/-1"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px">Objective</div><div style="font-size:13px;color:var(--ink)">' + c.objective + '</div></div>' : '') +
    (c.channels && c.channels.length ? '<div style="padding:10px 14px;background:var(--surface);border-radius:4px;grid-column:1/-1"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px">Channels</div><div style="font-size:12px;color:var(--ink)">' + c.channels.slice(0,8).join(' &middot; ') + '</div></div>' : '') +
    '</div>' +
    '<div id="mc-social-section" style="margin-bottom:16px"><div style="font-family:var(--font-m);font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-soft);margin-bottom:8px">&#128241; Social posts</div><div style="padding:10px;background:var(--surface);border-radius:4px;font-size:12px;color:var(--ink-faint)">Loading...</div></div>' +
    '<div id="mc-events-section" style="margin-bottom:20px"><div style="font-family:var(--font-m);font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-soft);margin-bottom:8px">&#9670; Events</div><div style="padding:10px;background:var(--surface);border-radius:4px;font-size:12px;color:var(--ink-faint)">Loading...</div></div>';

  // Footer
  var footer = document.createElement('div');
  footer.style.cssText = 'padding:16px 24px;border-top:1px solid var(--border);display:flex;gap:8px';

  var socialBtn = document.createElement('button');
  socialBtn.className = 'btn';
  socialBtn.style.cssText = 'background:#1E3A8A;color:#fff;border-color:#1E3A8A;font-size:13px';
  socialBtn.textContent = 'Social post';
  socialBtn.onclick = function() {
    overlay.remove();
    swSocialFromBrief(c.brief_id || c.id, { brand_id: c.brand_id, title: c.name, start_date: c.start_date, end_date: c.end_date, budget: c.budget, job_ref: c.job_ref });
  };

  var editBtn = document.createElement('button');
  editBtn.className = 'btn btn-accent';
  editBtn.style.cssText = 'flex:1;font-size:13px';
  if (c.brief_id) {
    editBtn.textContent = 'Edit campaign';
    editBtn.onclick = function() { overlay.remove(); try { sessionStorage.setItem('_pendingBriefId', c.brief_id); } catch(e) {} window.location = 'brief.html'; };
  } else {
    editBtn.textContent = 'Build campaign';
    editBtn.onclick = function() { overlay.remove(); calBuildBrief(c.brand, c.name, c); };
  }

  var delBtn = document.createElement('button');
  delBtn.className = 'btn';
  delBtn.style.cssText = 'font-size:13px;color:#C8102E;border-color:#C8102E';
  delBtn.textContent = 'Delete';
  delBtn.onclick = async function() {
    if (!confirm('Delete this campaign and its tasks?')) return;
    try {
      if (c.brief_id) {
        await fetch(SUPABASE_URL + '/rest/v1/briefs?id=eq.' + c.brief_id, { method:'DELETE', headers:getAuthHeaders() });
      } else {
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
  closeBtn.style.cssText = 'font-size:13px';
  closeBtn.textContent = 'Close';
  closeBtn.onclick = function() { overlay.remove(); };

  footer.appendChild(socialBtn);
  footer.appendChild(editBtn);
  footer.appendChild(delBtn);
  footer.appendChild(closeBtn);

  box.appendChild(hdr);
  box.appendChild(body);
  box.appendChild(footer);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Async load linked data
  mcLoadCampaignDetail(c);
}

async function mcLoadCampaignDetail(c) {
  var SL_STATUS_LABELS = { draft:'Draft', in_review:'In Review', approved:'Approved', scheduled:'Scheduled', published:'Published', rejected:'Rejected' };
  var SL_STATUS_COLORS = { draft:'#6B7280', in_review:'#92400E', approved:'#065F46', scheduled:'#1E3A8A', published:'#4C1D95', rejected:'#991B1B' };
  var PLAT_ICONS = { facebook:'FB', instagram:'IG', linkedin:'LI', tiktok:'TT', gmb:'GMB', threads:'TH' };
  var MN2 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  var socialEl = document.getElementById('mc-social-section');
  var eventsEl = document.getElementById('mc-events-section');

  var base = SUPABASE_URL + '/rest/v1';
  var hdrs = getAuthHeaders();

  // Social posts
  try {
    var socialPosts = [];
    if (c.brief_id) {
      var sr = await fetch(base + '/social_posts?brief_id=eq.' + c.brief_id + '&order=scheduled_at.asc', { headers: hdrs });
      if (sr.ok) socialPosts = await sr.json() || [];
    }
    // Also brand + date window posts not linked by brief_id
    if (c.brand_id && c.start_date) {
      var q2 = base + '/social_posts?brand_id=eq.' + c.brand_id + '&scheduled_at=gte.' + c.start_date + (c.end_date ? '&scheduled_at=lte.' + c.end_date : '') + '&brief_id=is.null&order=scheduled_at.asc';
      var sr2 = await fetch(q2, { headers: hdrs });
      if (sr2.ok) {
        var extra = await sr2.json() || [];
        extra.forEach(function(p) {
          if (!socialPosts.find(function(x){ return x.id === p.id; })) socialPosts.push(p);
        });
      }
    }

    if (socialEl) {
      var spLabel = '<div style="font-family:var(--font-m);font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-soft);margin-bottom:8px">&#128241; Social posts' + (socialPosts.length ? ' (' + socialPosts.length + ')' : '') + '</div>';
      if (!socialPosts.length) {
        socialEl.innerHTML = spLabel + '<div style="padding:10px 12px;background:var(--surface);border-radius:4px;font-size:12px;color:var(--ink-faint)">No social posts yet.</div>';
      } else {
        var spHtml = spLabel;
        socialPosts.forEach(function(p) {
          var sc = SL_STATUS_COLORS[p.status] || '#6B7280';
          var sl = SL_STATUS_LABELS[p.status] || p.status;
          var platIds = [];
          try { platIds = Array.isArray(p.platform_ids) ? p.platform_ids : JSON.parse(p.platform_ids || '[]'); } catch(e) {}
          var platStr = platIds.map(function(pid){ return PLAT_ICONS[pid]||pid; }).join(' ');
          var schedStr = p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : 'TBC';
          spHtml += '<div data-post-id="' + p.id + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface);border-radius:4px;margin-bottom:6px;cursor:pointer;pointer-events:auto">' +
            '<span style="font-size:11px;color:var(--ink-soft);font-family:var(--font-m);flex-shrink:0;min-width:52px;pointer-events:none">' + schedStr + '</span>' +
            '<span style="flex:1;font-size:12px;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none">' + (p.title||'Untitled') + '</span>' +
            (platStr ? '<span style="font-size:11px;color:var(--ink-soft);font-family:var(--font-m);pointer-events:none">' + platStr + '</span>' : '') +
            '<span style="font-size:10px;padding:2px 8px;border-radius:10px;color:#fff;background:' + sc + ';font-family:var(--font-m);font-weight:600;flex-shrink:0;pointer-events:none">' + sl + '</span>' +
            '<span style="font-size:13px;color:var(--ink-soft);pointer-events:none">&#8594;</span>' +
            '</div>';
        });
        socialEl.innerHTML = spHtml;
        // Delegated click — catches clicks on child elements too
        socialEl.addEventListener('click', function(e) {
          var row = e.target.closest('[data-post-id]');
          if (row) mcOpenSocialPost(row.getAttribute('data-post-id'));
        });
      }
    }
  } catch(e) {
    if (socialEl) socialEl.innerHTML = '<div style="font-size:12px;color:var(--ink-faint)">Could not load social posts.</div>';
  }

  // Events
  try {
    var events = [];
    if (c.brand_id && c.start_date) {
      var er = await fetch(base + '/events?brand_id=eq.' + c.brand_id + '&start_date=gte.' + c.start_date + (c.end_date ? '&start_date=lte.' + c.end_date : '') + '&select=id,title,start_date,end_date,status,planned_budget,location,job_ref&order=start_date.asc', { headers: hdrs });
      if (er.ok) events = await er.json() || [];
    }
    if (eventsEl) {
      var evLabel = '<div style="font-family:var(--font-m);font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-soft);margin-bottom:8px">&#9670; Events' + (events.length ? ' (' + events.length + ')' : '') + '</div>';
      if (!events.length) {
        eventsEl.innerHTML = evLabel + '<div style="padding:10px 12px;background:var(--surface);border-radius:4px;font-size:12px;color:var(--ink-faint)">No events during this campaign window.</div>';
      } else {
        var evHtml = evLabel;
        events.forEach(function(ev) {
          var evSd = ev.start_date ? new Date(ev.start_date + 'T00:00:00') : null;
          var evDateStr = evSd ? evSd.getDate() + ' ' + MN2[evSd.getMonth()] : 'TBC';
          var statusCls = ev.status === 'confirmed' ? '#059669' : ev.status === 'completed' ? '#374151' : '#D97706';
          evHtml += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface);border-radius:4px;margin-bottom:6px">' +
            '<span style="font-size:11px;color:var(--ink-soft);font-family:var(--font-m);flex-shrink:0;min-width:52px">' + evDateStr + '</span>' +
            '<span style="flex:1;font-size:12px;font-weight:600;color:var(--ink)">' + (ev.title||'Event') + '</span>' +
            (ev.location ? '<span style="font-size:11px;color:var(--ink-soft)">&#128205; ' + ev.location + '</span>' : '') +
            (ev.planned_budget ? '<span style="font-size:11px;color:var(--ink-soft);font-family:var(--font-m)">&#163;' + Number(ev.planned_budget).toLocaleString() + '</span>' : '') +
            '<span style="font-size:10px;padding:2px 8px;border-radius:10px;color:#fff;background:' + statusCls + ';font-family:var(--font-m);font-weight:600;flex-shrink:0">' + (ev.status||'draft') + '</span>' +
            '</div>';
        });
        eventsEl.innerHTML = evHtml;
      }
    }
  } catch(e) {
    if (eventsEl) eventsEl.innerHTML = '<div style="font-size:12px;color:var(--ink-faint)">Could not load events.</div>';
  }
}

function mcOpenSocialPost(postId) {
  window.location = 'social.html?post=' + postId;
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
  var _p = window.location.pathname;
  if (!_p.endsWith('index.html') && !_p.endsWith('/') &&
      !_p.endsWith('brand.html')   && !_p.endsWith('/brand') &&
      !_p.endsWith('budget.html')  && !_p.endsWith('/budget') &&
      !_p.endsWith('brief.html')   && !_p.endsWith('/brief') &&
      !_p.endsWith('events.html')  && !_p.endsWith('/events') &&
      !_p.endsWith('social.html')  && !_p.endsWith('/social') &&
      !_p.endsWith('calendar.html')&& !_p.endsWith('/calendar') &&
      !_p.endsWith('admin.html')   && !_p.endsWith('/admin') &&
      !_p.endsWith('channels.html')&& !_p.endsWith('/channels')) return;
  try {
    var year = parseInt(PLAN_YEAR) || new Date().getFullYear();
    var resp = await fetch(SUPABASE_URL + '/rest/v1/site_budget_lines?year=eq.' + year + '&select=*&limit=10000', {
      headers: getAuthHeaders({'Content-Type': 'application/json'})
    });
    if (!resp.ok) {
      console.warn('loadSiteBudgets error:', resp.status, await resp.text());
      return;
    }
    var lines = await resp.json() || [];

    // Build SITE_BUDGETS with compatibility adapter:
    // SITE_BUDGETS[site_id] = {
    //   m0_planned, m1_planned... (sum across all channels for that month)
    //   m0_actual,  m1_actual...
    //   annual_planned (sum of all months planned)
    //   channels: { channelName: { 0: {planned,actual}, 1:... } }  ← new granular data
    // }
    SITE_BUDGETS = {};
    // Zero out brand annual budgets — will be rebuilt from site sums below
    BUDGET_BRANDS.forEach(function(b) { b.annual = 0; });
    lines.forEach(function(line) {
      var sid = line.site_id;
      if (!SITE_BUDGETS[sid]) {
        SITE_BUDGETS[sid] = { site_id: sid, annual_planned: 0, channels: {} };
        for (var m = 0; m < 12; m++) {
          SITE_BUDGETS[sid]['m' + m + '_planned'] = 0;
          SITE_BUDGETS[sid]['m' + m + '_actual']  = 0;
        }
      }
      // Granular channel data
      if (!SITE_BUDGETS[sid].channels[line.channel]) {
        SITE_BUDGETS[sid].channels[line.channel] = {};
      }
      SITE_BUDGETS[sid].channels[line.channel][line.month] = {
        planned: line.planned || 0,
        actual:  line.actual  || 0
      };
      // Roll up to compatibility flat fields
      SITE_BUDGETS[sid]['m' + line.month + '_planned'] += (line.planned || 0);
      SITE_BUDGETS[sid]['m' + line.month + '_actual']  += (line.actual  || 0);
      SITE_BUDGETS[sid].annual_planned                 += (line.planned || 0);
    });

    var groupTotal = Object.values(SITE_BUDGETS).reduce(function(s, d) { return s + (d.annual_planned || 0); }, 0);
    if (groupTotal > 0) {
      var el = document.getElementById('group-budget-val');
      if (el) {
        if (groupTotal >= 1000000) el.textContent = '£' + (groupTotal/1000000).toFixed(2) + 'M';
        else if (groupTotal >= 1000) el.textContent = '£' + (groupTotal/1000).toFixed(1) + 'K';
        else el.textContent = '£' + groupTotal.toLocaleString();
      }
    }
    // Roll up site planned totals into BUDGET_BRANDS.annual
    if (typeof HUB_SITES !== 'undefined') {
      BUDGET_BRANDS.forEach(function(b) {
        var brandSites = HUB_SITES.filter(function(s) { return s.brand_id === b.id; });
        b.annual = brandSites.reduce(function(sum, site) {
          return sum + (SITE_BUDGETS[site.site_id] ? SITE_BUDGETS[site.site_id].annual_planned : 0);
        }, 0);
      });
    }
    if (typeof updateBrandBudgetsFromSites === 'function') updateBrandBudgetsFromSites();
    if (typeof syncBrandSitesFromHubSites  === 'function') syncBrandSitesFromHubSites();
    // Load campaigns for budget tracker accordion (needed on brand.html where calLoadFromSupabase doesn't run)
    if (!BUILT_IN_CAMPAIGNS.length && typeof calLoadFromSupabase === 'function') {
      await calLoadFromSupabase();
    }
    await Promise.all([
      loadEventsForBudget(),
      loadActivityAllocations()
    ]);
    if (Object.keys(BRAND_CHANNELS_DATA).length) {
      updateGroupChannelsFromBrands();
      if (typeof renderGroupChannels === 'function') renderGroupChannels();
    }
    if (typeof renderBudgetTracker === 'function') renderBudgetTracker();
    var urlParams = new URLSearchParams(window.location.search);
    var activeBrandId = urlParams.get('brand');
    if (activeBrandId && typeof renderBrandSites === 'function') renderBrandSites(activeBrandId);
    console.log('Site budgets loaded:', lines.length, 'lines, £' + groupTotal.toLocaleString() + ' planned');
  } catch(e) { console.warn('loadSiteBudgets exception:', e); }
}



function calShowEvent(ev) {
  var existing = document.getElementById('cal-modal');
  if (existing) existing.remove();

  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var fmt = function(d){ return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear(); };
  var dates = '—';
  if (ev.start_date) {
    var sd = new Date(ev.start_date + 'T00:00:00');
    var ed = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : sd;
    dates = fmt(sd) + (ev.end_date && ev.end_date !== ev.start_date ? ' – ' + fmt(ed) : '');
  }

  var brandData = BUDGET_BRANDS ? (BUDGET_BRANDS.find(function(b){ return b.id === ev.brand_id; }) || {}) : {};
  var brandColor = brandData.color || '#374151';
  var brandName = brandData.name || ev.brand_id || '';

  var statusColors = {draft:'#6B7280', confirmed:'#2563EB', active:'#059669', completed:'#374151', cancelled:'#C8102E'};
  var statusColor = statusColors[ev.status || 'draft'] || '#6B7280';

  var overlay = document.createElement('div');
  overlay.id = 'cal-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:8px;width:100%;max-width:520px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.22)';

  // Header
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:' + brandColor + ';padding:22px 24px 18px;position:relative';

  var brandLbl = document.createElement('div');
  brandLbl.style.cssText = 'font-family:var(--font-m);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px';
  brandLbl.textContent = brandName + ' · Event';

  var nameLbl = document.createElement('div');
  nameLbl.style.cssText = 'font-family:var(--font-d);font-size:20px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:6px';
  nameLbl.textContent = ev.title || 'Untitled Event';

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

  // Status badge
  var topRow = document.createElement('div');
  topRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap';
  var statusBadge = document.createElement('span');
  statusBadge.style.cssText = 'display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;font-family:var(--font-m);text-transform:uppercase;letter-spacing:0.06em;color:#fff;background:' + statusColor;
  statusBadge.textContent = ev.status || 'draft';
  topRow.appendChild(statusBadge);
  if (ev.event_type) {
    var typeBadge = document.createElement('span');
    typeBadge.style.cssText = 'display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;font-family:var(--font-m);background:var(--surface);color:var(--ink)';
    typeBadge.textContent = ev.event_type;
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

  // Site name lookup
  var siteName = '';
  if (ev.site_id && typeof HUB_SITES !== 'undefined') {
    var site = HUB_SITES.find(function(s){ return s.site_id === ev.site_id; });
    if (site) siteName = site.site_name;
  }

  [
    makeCell('Dates', dates),
    makeCell('Site', siteName || null),
    makeCell('Planned budget', ev.planned_budget ? '£' + Number(ev.planned_budget).toLocaleString() : null),
    makeCell('Actual spend', ev.actual_spend ? '£' + Number(ev.actual_spend).toLocaleString() : null),
  ].forEach(function(cl) { if (cl) grid.appendChild(cl); });

  // Close button
  var actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:8px;margin-top:4px';
  var closeBtn = document.createElement('button');
  closeBtn.className = 'btn';
  closeBtn.style.cssText = 'flex:1;font-size:13px';
  closeBtn.textContent = 'Close';
  closeBtn.onclick = function() { overlay.remove(); };
  actions.appendChild(closeBtn);

  body.appendChild(topRow); body.appendChild(grid); body.appendChild(actions);
  box.appendChild(hdr); box.appendChild(body);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}


async function loadEventsForBudget() {
  try {
    var r = await fetch(SUPABASE_URL + '/rest/v1/events?select=id,title,site_id,brand_id,start_date,end_date,planned_budget,actual_spend,status&status=neq.cancelled&order=start_date', {
      headers: getAuthHeaders({'Content-Type':'application/json'})
    });
    if (!r.ok) return;
    EV_EVENTS_BUDGET = await r.json();
    // Re-render calendar now events are loaded
    if (typeof renderCrossCalendar === 'function') renderCrossCalendar();
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

async function loadSocialBudgets() {
  // Fetch social posts that have budget_allocated set, for PLAN_YEAR
  // Groups by site_id (from site_ids array) and month of scheduled_at
  try {
    var planYear = parseInt(PLAN_YEAR) || new Date().getFullYear();
    var r = await fetch(SUPABASE_URL + '/rest/v1/social_posts?select=id,title,brand_id,site_ids,scheduled_at,budget_allocated,status,post_type&budget_allocated=gt.0&status=neq.cancelled', {
      headers: getAuthHeaders({'Content-Type': 'application/json'})
    });
    if (!r.ok) return;
    var posts = await r.json();
    SOCIAL_BUDGETS = {};
    // Also build brand-level social budget map for brand page
    window.SOCIAL_BUDGETS_BRAND = {};
    posts.forEach(function(p) {
      if (!p.scheduled_at || !p.budget_allocated) return;
      var d = new Date(p.scheduled_at);
      if (d.getFullYear() !== planYear) return;
      var month = d.getMonth();
      var budget = parseFloat(p.budget_allocated) || 0;
      // Brand-level rollup
      var bid = p.brand_id || 'unknown';
      if (!window.SOCIAL_BUDGETS_BRAND[bid]) window.SOCIAL_BUDGETS_BRAND[bid] = { total: 0, posts: [] };
      window.SOCIAL_BUDGETS_BRAND[bid].total += budget;
      window.SOCIAL_BUDGETS_BRAND[bid].posts.push(p);
      // Site-level: site_ids is a JSON array of site_id strings
      var siteIds = [];
      try { siteIds = Array.isArray(p.site_ids) ? p.site_ids : (p.site_ids ? JSON.parse(p.site_ids) : []); } catch(e) {}
      if (!siteIds.length) {
        // No site specified — attribute to brand as a whole, split equally across brand sites later
        // Store under a brand-keyed pseudo-site so we can resolve at render time
        var bKey = '__brand__' + bid;
        if (!SOCIAL_BUDGETS[bKey]) SOCIAL_BUDGETS[bKey] = { months: {}, posts: [] };
        SOCIAL_BUDGETS[bKey].months[month] = (SOCIAL_BUDGETS[bKey].months[month] || 0) + budget;
        SOCIAL_BUDGETS[bKey].posts.push(p);
      } else {
        var perSite = Math.round(budget / siteIds.length);
        siteIds.forEach(function(sid) {
          if (!SOCIAL_BUDGETS[sid]) SOCIAL_BUDGETS[sid] = { months: {}, posts: [] };
          SOCIAL_BUDGETS[sid].months[month] = (SOCIAL_BUDGETS[sid].months[month] || 0) + perSite;
          SOCIAL_BUDGETS[sid].posts.push(p);
        });
      }
    });
    console.log('Social budgets loaded:', Object.keys(SOCIAL_BUDGETS).length, 'sites,', posts.length, 'posts');
  } catch(e) { console.warn('loadSocialBudgets:', e); }
}

function getSocialBudgetBySite(siteId, brandId) {
  // Returns object: { months: {0:v,...}, posts: [] }
  // Merges direct site allocation + brand-wide allocation split across brand sites
  var direct = SOCIAL_BUDGETS[siteId] || { months: {}, posts: [] };
  var bKey = '__brand__' + brandId;
  var brandWide = SOCIAL_BUDGETS[bKey];
  if (!brandWide) return direct;
  // Split brand-wide budget equally across all sites for this brand
  var brandSiteCount = HUB_SITES ? HUB_SITES.filter(function(s){ return s.brand_id === brandId; }).length : 1;
  if (!brandSiteCount) brandSiteCount = 1;
  var merged = { months: Object.assign({}, direct.months), posts: direct.posts.slice() };
  Object.keys(brandWide.months).forEach(function(m) {
    merged.months[m] = (merged.months[m] || 0) + Math.round(brandWide.months[m] / brandSiteCount);
  });
  brandWide.posts.forEach(function(p) {
    if (!merged.posts.find(function(x){ return x.id === p.id; })) merged.posts.push(p);
  });
  return merged;
}
/* ══ Activity budget allocations for budget tracker ══ */
window.ACTIVITY_ALLOCATIONS = {}; // [site_id][month] = total planned

async function loadActivityAllocations() {
  try {
    var year = parseInt(PLAN_YEAR) || new Date().getFullYear();
    // Fetch with channel_id so we can build channel breakdown
    var r = await fetch(SUPABASE_URL + '/rest/v1/activity_budget_lines?year=eq.' + year + '&select=site_id,channel_id,month,planned&limit=10000', {
      headers: getAuthHeaders({'Content-Type':'application/json'})
    });
    if (!r.ok) return;
    var rows = await r.json() || [];

    // Also fetch channel mapping: channel_id -> sbl_channel_name
    var chanR = await fetch(SUPABASE_URL + '/rest/v1/activity_channels?select=id,sbl_channel_name&active=eq.true', {
      headers: getAuthHeaders({'Content-Type':'application/json'})
    });
    var chanRows = chanR.ok ? await chanR.json() : [];
    var chanMap = {}; // channel_id -> sbl_channel_name
    chanRows.forEach(function(c) { if (c.sbl_channel_name) chanMap[c.id] = c.sbl_channel_name; });

    window.ACTIVITY_ALLOCATIONS = {};
    window.ACTIVITY_ALLOCATIONS_BY_CHANNEL = {};

    rows.forEach(function(row) {
      if (!row.site_id || !row.planned) return;
      var m = parseInt(row.month) - 1; // convert 1-12 to 0-11

      // Monthly total by site
      if (!window.ACTIVITY_ALLOCATIONS[row.site_id]) window.ACTIVITY_ALLOCATIONS[row.site_id] = {};
      window.ACTIVITY_ALLOCATIONS[row.site_id][m] = (window.ACTIVITY_ALLOCATIONS[row.site_id][m] || 0) + (row.planned || 0);

      // By channel for channel breakdown
      var chanName = chanMap[row.channel_id];
      if (chanName) {
        if (!window.ACTIVITY_ALLOCATIONS_BY_CHANNEL[row.site_id]) window.ACTIVITY_ALLOCATIONS_BY_CHANNEL[row.site_id] = {};
        window.ACTIVITY_ALLOCATIONS_BY_CHANNEL[row.site_id][chanName] =
          (window.ACTIVITY_ALLOCATIONS_BY_CHANNEL[row.site_id][chanName] || 0) + (row.planned || 0);
      }
    });
    console.log('Activity allocations loaded:', rows.length, 'rows,', Object.keys(window.ACTIVITY_ALLOCATIONS).length, 'sites');
  } catch(e) { console.warn('loadActivityAllocations:', e); }
}


async function loadSiteKPIs() {
  var _p = window.location.pathname;
  if (!_p.endsWith('index.html') && !_p.endsWith('/') &&
      !_p.endsWith('brand.html') && !_p.endsWith('/brand') &&
      !_p.endsWith('kpis.html')  && !_p.endsWith('/kpis') &&
      !_p.endsWith('budget.html')&& !_p.endsWith('/budget')) return;
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
    // Re-render KPIs after data loads — always, not just when view is active
    if (typeof applyAdminKPITargets === 'function') applyAdminKPITargets();
    if (typeof renderGroupKPIs === 'function') renderGroupKPIs();
    if (typeof updateBrandKPIsFromSites === 'function') updateBrandKPIsFromSites();
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
  var chv  = document.getElementById('chv-' + id);
  var open = BT_OPEN[id];

  // Brand-level toggle — show/hide all site rows for this brand
  var brandRows = document.querySelectorAll('[data-brand-rows="' + id + '"]');
  if (brandRows.length > 0) {
    brandRows.forEach(function(r) { r.style.display = open ? 'none' : ''; });
    if (chv) chv.innerHTML = open ? '&#9654;' : '&#9660;';
    BT_OPEN[id] = !open;
    return;
  }

  // Site-level toggle — show/hide campaign detail panel for this site
  var panel = document.getElementById(id);
  var row   = document.getElementById('acrow-' + id);
  if (!panel || !row) return;
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

// ── Fallback: if auth already fired before group.js loaded, run now ──
window.addEventListener('load', function() {
  if (typeof SB_USER !== 'undefined' && SB_USER) {
    if (typeof loadSiteBudgets === 'function')   loadSiteBudgets();
    if (typeof loadSiteKPIs === 'function')      loadSiteKPIs();
    if (typeof calLoadFromSupabase === 'function') calLoadFromSupabase();
    if (typeof loadBriefCommitmentsForTracker === 'function') loadBriefCommitmentsForTracker();
    if (typeof loadEventsForBudget === 'function') loadEventsForBudget();
  }
});
