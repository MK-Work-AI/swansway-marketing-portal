// v105
// Swansway Marketing Portal — Brand page functions


function renderBrand(b) {
  const container = document.getElementById(b.id+'-content');
  if(!container) return;
  if(container.dataset.rendered) {
    // Already rendered — just re-run the content functions to refresh data
    setTimeout(function() {
      if (typeof renderBrandSites === 'function')     renderBrandSites(b.id);
      if (typeof renderBrandCentres === 'function')   renderBrandCentres(b.id);
      if (typeof renderBrandCampaigns === 'function') renderBrandCampaigns(b.id);
      if (typeof renderBrandEvents === 'function')    renderBrandEvents(b.id);
      if (typeof renderBrandKPIs === 'function')      renderBrandKPIs(b.id);
    }, 50);
    return;
  }
  container.dataset.rendered = '1';

  container.innerHTML = `
    <div class="page-strip">
      <div>
        <div class="page-title" style="color:${b.color}">${b.name}</div>
        <div class="page-subtitle">${b.sites} site${b.sites>1?'s':''} · ${b.sitenames}</div>
      </div>
      <div class="action-row">
        <button class="btn" onclick="switchView('group',document.querySelector('[data-view=group]'))">← Group overview</button>

      </div>
    </div>

    <div class="brand-hero" style="--brand-col:${b.color};border-left-color:${b.color}">

      <div class="brand-hero-eyebrow">${b.segment} · ${PLAN_YEAR} Retail Marketing Plan</div>
      <div class="brand-hero-name" style="color:${b.color}">${b.name}</div>
      <div class="brand-hero-sites">${b.sitenames}</div>
      <div class="brand-hero-tags">
        <span class="brand-hero-tag">Budget: ${b.budget}</span>
        <span class="brand-hero-tag">New car target: ${b.newTarget}</span>
        <span class="brand-hero-tag">EV/hybrid target: ${b.evTarget}</span>

        ${b.q2 ? '<span class="brand-hero-tag brand-hero-tag--accent">Q2: ' + b.q2 + '</span>' : ''}
      </div>
    </div>
    <div class="inner-tabs" id="itabs-${b.id}">
      <button class="inner-tab active" onclick="switchInner('${b.id}','strategy',this)">Strategy</button>
        <button class="inner-tab" onclick="switchInner('${b.id}','sites',this)">Site Budget Breakdown</button>
      <button class="inner-tab" onclick="switchInner('${b.id}','centres',this)">Dealership/s (${b.sites})</button>
      <button class="inner-tab" onclick="switchInner('${b.id}','campaigns',this)">Campaigns</button>
      <button class="inner-tab" onclick="switchInner('${b.id}','events',this)">Events</button>
      <button class="inner-tab" onclick="switchInner('${b.id}','audiences',this)">Audiences</button>
      <button class="inner-tab" onclick="switchInner('${b.id}','budget',this)">Channel Mix</button>
      <button class="inner-tab" onclick="switchInner('${b.id}','kpis',this)">KPI Framework by Site</button>
      <button class="inner-tab" id="qplan-tab-${b.id}" onclick="switchInner('${b.id}','qplan',this)" style="border-color:var(--accent);color:var(--accent)">Quarterly Brand Plan</button>
    </div>

    <div class="inner-section active" id="${b.id}-strategy">
      <div class="sh"><div><div class="sh-title">Strategic Pillars</div><div class="sh-sub">Core priorities that drive every campaign and channel decision</div></div></div>
      <div class="pillars" style="--brand-color:${b.color}">
        ${(b.pillars||[]).map(p=>`<div class="pillar"><div class="pillar-num">PILLAR ${p.n}</div><div class="pillar-title">${p.t}</div><div class="pillar-desc">${p.d}</div></div>`).join('')}
      </div>
      <div class="sh"><div><div class="sh-title">Key Tags & Focus Areas</div></div></div>
      <div style="margin-bottom:1.5rem">${(b.tags||[]).map((t,i)=>`<span class="tag ${['t-red','t-blue','t-green','t-amber','t-purple','t-teal','t-pink'][i%7]}">${t}</span>`).join('')}</div>
    </div>

    <div class="inner-section" id="${b.id}-centres">
      <div class="sh"><div><div class="sh-title">Dealerships</div><div class="sh-sub">All sites for this brand</div></div></div>
      <div id="${b.id}-centres-list">
        <div style="padding:20px;color:var(--ink-faint);font-size:13px">Loading dealerships...</div>
      </div>
    </div>

    <div class="inner-section" id="${b.id}-campaigns">
      <div class="sh"><div><div class="sh-title">Priority Campaigns <span class="year-ref"></span></div><div class="sh-sub">From admin calendar and Brief Builder</div></div><div class="action-row"><button class="btn btn-sm btn-accent" onclick="window.location='brief.html'">+ New campaign</button></div></div>
      <div id="${b.id}-campaigns-list"><div style="padding:20px;text-align:center;color:var(--ink-faint);font-size:13px">Loading campaigns...</div></div>
    </div>

    <div class="inner-section" id="${b.id}-events">
      <div class="sh"><div><div class="sh-title">Events &amp; Placements</div><div class="sh-sub">All booked events for ${b.name} sites in ${PLAN_YEAR}</div></div></div>
      <div id="${b.id}-events-list"><div style="padding:20px;text-align:center;color:var(--ink-faint);font-size:13px">Loading events...</div></div>
    </div>

    <div class="inner-section" id="${b.id}-audiences">
      <div class="sh"><div><div class="sh-title">Target Audiences & Messaging</div><div class="sh-sub">Segments with tailored message, channel and creative angle</div></div></div>
      <div class="audience-grid" style="--brand-color:${b.color}">
        ${(b.audiences||[]).map(a=>`<div class="audience-card"><div class="audience-title">${a.t}</div><div class="audience-desc">${a.d}</div></div>`).join('')}
      </div>
    </div>

    <div class="inner-section" id="${b.id}-budget">
      <div class="sh"><div><div class="sh-title">Channel Mix & Budget</div><div class="sh-sub">Recommended annual allocation — ${b.budget} total</div></div></div>
      <div class="channel-list">
        ${(b.channels||[]).map(c=>`
          <div class="channel-item">
            <div class="channel-name">${c.n}</div>
            <div class="channel-bar-wrap"><div class="channel-bar" style="width:${c.pct*3.2}%;background:${c.color}"></div></div>
            <div class="channel-pct">${c.pct}%</div>
            <div class="channel-budget">${c.budget}</div>
          </div>
          <div class="channel-note">${c.note}</div>
        `).join('')}
      </div>
    </div>

    <div class="inner-section" id="${b.id}-sites">
      <div class="sh"><div><div class="sh-title">Site Budget Breakdown</div><div class="sh-sub">Planned vs actual spend per dealership</div></div></div>
      <div id="${b.id}-sites-list"><div style="padding:20px;text-align:center;color:var(--ink-faint);font-size:13px">Sign in to view site budgets</div></div>
    </div>

    <div class="inner-section" id="${b.id}-kpis">
      <div id="${b.id}-brand-kpis"></div>
    </div>

    <div class="inner-section" id="${b.id}-qplan">
      <div id="qplan-inner-${b.id}">
        <!-- Populated by qplanRenderForBrand() -->
        <div class="qplan-empty">
          <div class="qplan-empty-icon">📄</div>
          <div class="qplan-empty-title">No quarterly plan uploaded yet</div>
          <div class="qplan-empty-sub">Upload your ${b.name} manufacturer Q-plan document to extract campaign requirements, deadlines, creative specs and co-op funding.</div>
          <div style="margin-top:1.25rem">
            <button class="btn btn-primary" onclick="qplanTriggerUpload('${b.id}','${b.name}','${b.color}')">↑ Upload Q-plan document</button>
          </div>
        </div>
      </div>
    </div>
  `;
  // After HTML is set, render all tab content so it's ready when tabs are clicked
  setTimeout(function() {
    if (typeof renderBrandSites === 'function')       renderBrandSites(b.id);
    if (typeof renderBrandCentres === 'function')     renderBrandCentres(b.id);
    if (typeof renderBrandCampaigns === 'function')   renderBrandCampaigns(b.id);
    if (typeof renderBrandKPIs === 'function')         renderBrandKPIs(b.id);
    // renderBrandChannelMix called on tab click or data load
  }, 150);
}


function renderGroupBrandCards() {
  const g = document.getElementById('group-brand-grid');
  if (!g) return;
  g.innerHTML = BRANDS.map(b=>`
    <div class="brand-card" style="--brand-color:${b.color}" onclick="window.location='brand.html?brand=${b.id}'">
      <div class="brand-card-name">${b.name}</div>
      <div class="brand-card-seg">${b.segment}</div>
      <div class="brand-card-sites">${b.sites} site${b.sites>1?'s':''} · Budget ${b.budget}</div>
      <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${b.progress}%"></div></div>
      <div class="brand-card-q2">${b.q2}</div>
      <div class="brand-nav-to">Open full plan →</div>
    </div>
  `).join('');
}


function renderBrandKpiChart() {
  const ctx = document.getElementById('brandKpiChart');
  if(!ctx||!window.Chart) return;
  new Chart(ctx,{type:'bar',data:{labels:BRANDS.map(b=>b.name),datasets:[{label:'Q1 performance index',data:BRANDS.map(b=>b.progress),backgroundColor:BRANDS.map(b=>b.color+'CC'),borderColor:BRANDS.map(b=>b.color),borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'}}}}});
}


function updateBrandBudgetsFromSites() {
  BRANDS.forEach(function(brand) {
    var sites = HUB_SITES.filter(function(s) { return s.brand_id === brand.id; });
    if (!sites.length) return;
    var total = sites.reduce(function(sum, site) {
      var d = SITE_BUDGETS[site.site_id] || {};
      return sum + (d.annual_planned || 0);
    }, 0);
    if (total > 0) {
      brand.budget = total >= 1000000
        ? '£' + (total / 1000000).toFixed(2) + 'M'
        : '£' + Math.round(total / 1000) + 'K';
    }
  });
  // Update group budget metric
  var groupTotal = Object.values(SITE_BUDGETS).reduce(function(s, d) { return s + (d.annual_planned || 0); }, 0);
  if (groupTotal > 0) {
    var el = document.getElementById('group-budget-val');
    if (el) el.textContent = '£' + (groupTotal / 1000000).toFixed(2) + 'M';
  }
  // Re-render brand cards with updated budgets
  if (typeof renderGroupBrandCards === 'function') renderGroupBrandCards();
}


function renderBrandCentres(brandId) {
  var el = document.getElementById(brandId + '-centres-list');
  if (!el) return;
  var sites = HUB_SITES.filter(function(s) { return s.brand_id === brandId; });
  if (!sites.length) { el.innerHTML = '<div style="padding:20px;color:var(--ink-faint)">No sites found.</div>'; return; }

  var html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
  html += '<thead><tr style="background:var(--swansway);color:#fff">';
  html += '<th style="padding:10px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500;min-width:160px">Dealership</th>';
  html += '<th style="padding:10px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500">Address</th>';
  html += '<th style="padding:10px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500">Phone</th>';
  html += '<th style="padding:10px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500">General Manager</th>';
  html += '<th style="padding:10px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500">Head of Business</th>';
  html += '<th style="padding:10px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500">Sales Manager</th>';
  html += '<th style="padding:10px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500">Service Manager</th>';
  html += '<th style="padding:10px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500">Parts Manager</th>';
  html += '<th style="padding:10px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500">Links</th>';
  html += '</tr></thead><tbody>';

  sites.forEach(function(site, idx) {
    var c = SITE_CONTACTS[site.site_id] || {};
    var bg = idx % 2 === 0 ? 'var(--white)' : 'var(--surface)';
    var addr = [c.address, c.town, c.postcode].filter(Boolean).join(', ');
    var mgr = function(val) { return val ? val : '<span style="color:var(--ink-faint)">\u2014</span>'; };

    html += '<tr style="background:' + bg + ';border-bottom:1px solid var(--border)">';
    html += '<td style="padding:10px 12px;font-weight:700;font-size:13px">' + site.site_name + '</td>';
    html += '<td style="padding:10px 12px;color:var(--ink-soft)">' + (addr || '\u2014') + '</td>';
    html += '<td style="padding:10px 12px;white-space:nowrap">' + (c.phone ? '<a href="tel:' + c.phone + '" style="color:var(--swansway)">' + c.phone + '</a>' : '\u2014') + '</td>';
    html += '<td style="padding:10px 12px">' + mgr(c.general_manager) + '</td>';
    html += '<td style="padding:10px 12px">' + mgr(c.head_of_business) + '</td>';
    html += '<td style="padding:10px 12px">' + mgr(c.sales_manager) + '</td>';
    html += '<td style="padding:10px 12px">' + mgr(c.service_manager) + '</td>';
    html += '<td style="padding:10px 12px">' + mgr(c.parts_manager) + '</td>';
    html += '<td style="padding:10px 12px;white-space:nowrap">';
    if (c.website_url) html += '<a href="' + c.website_url + '" target="_blank" style="color:var(--swansway);font-size:11px;margin-right:8px">Website</a>';
    if (c.google_maps_url) html += '<a href="' + c.google_maps_url + '" target="_blank" style="color:var(--swansway);font-size:11px">Map</a>';
    html += '</td></tr>';
  });

  html += '</tbody></table></div>';

  // Note if managers not yet entered
  var hasManagers = sites.some(function(s) {
    var c = SITE_CONTACTS[s.site_id] || {};
    return c.general_manager || c.head_of_business || c.sales_manager;
  });
  if (!hasManagers) {
    html += '<div style="padding:12px 16px;font-size:12px;color:var(--ink-faint);border-top:1px solid var(--border)">Management team not yet entered. Add in Admin \u2192 Site Directory.</div>';
  }

  el.innerHTML = html;
}


function renderBrandEvents(brandId) {
  var el = document.getElementById(brandId + '-events-list');
  if (!el) return;
  var MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var planYear = parseInt(PLAN_YEAR) || new Date().getFullYear();
  // Get all sites for this brand
  var brandSiteIds = (typeof HUB_SITES !== 'undefined')
    ? HUB_SITES.filter(function(s){ return s.brand_id === brandId; }).map(function(s){ return s.site_id; })
    : [];
  // Filter EV_EVENTS_BUDGET for this brand's sites in plan year
  var events = (EV_EVENTS_BUDGET || []).filter(function(ev) {
    if (!ev.start_date) return false;
    if (new Date(ev.start_date + 'T00:00:00').getFullYear() !== planYear) return false;
    return brandSiteIds.indexOf(ev.site_id) !== -1;
  });
  if (!events.length) {
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--ink-faint);font-size:13px">No events booked for ' + planYear + '. Add events via Planning → Events &amp; Placements.</div>';
    return;
  }
  // Sort by start date
  events.sort(function(a,b){ return a.start_date < b.start_date ? -1 : 1; });
  var totalPlanned = events.reduce(function(s,ev){ return s + (ev.planned_budget||0); }, 0);
  var totalActual  = events.reduce(function(s,ev){ return s + (ev.actual_spend||0);   }, 0);
  var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:1.5rem">';
  html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:12px 14px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Events booked</div><div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:var(--swansway)">' + events.length + '</div></div>';
  html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:12px 14px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Total planned budget</div><div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:#7C3AED">' + (totalPlanned > 0 ? '£' + totalPlanned.toLocaleString() : '—') + '</div></div>';
  html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:12px 14px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Actual spend</div><div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:#059669">' + (totalActual > 0 ? '£' + totalActual.toLocaleString() : '—') + '</div></div>';
  html += '</div>';
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">';
  html += '<thead><tr style="background:var(--swansway);color:#fff">';
  ['Event','Site','Dates','Planned budget','Actual spend','Status'].forEach(function(h) {
    html += '<th style="padding:8px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500;letter-spacing:0.06em">' + h + '</th>';
  });
  html += '</tr></thead><tbody>';
  var statusColors = {active:'#059669',planned:'#6B7280',approved:'#2563EB',cancelled:'#DC2626',completed:'#374151'};
  events.forEach(function(ev, idx) {
    var site = (typeof HUB_SITES !== 'undefined') ? HUB_SITES.find(function(s){ return s.site_id === ev.site_id; }) : null;
    var siteName = site ? site.site_name : (ev.site_id || '—');
    var sd = ev.start_date ? new Date(ev.start_date + 'T00:00:00') : null;
    var ed = ev.end_date   ? new Date(ev.end_date   + 'T00:00:00') : null;
    var dates = sd ? (sd.getDate() + ' ' + MN[sd.getMonth()] + (ed && ed.getMonth() !== sd.getMonth() ? ' – ' + ed.getDate() + ' ' + MN[ed.getMonth()] : '')) : '—';
    var sc = statusColors[ev.status] || '#6B7280';
    var bg = idx % 2 === 0 ? 'var(--white)' : 'var(--surface)';
    html += '<tr style="background:' + bg + '">';
    html += '<td style="padding:8px 12px;font-size:13px;font-weight:600">' + (ev.title || 'Untitled') + '</td>';
    html += '<td style="padding:8px 12px;font-size:12px;color:var(--ink-soft)">' + siteName + '</td>';
    html += '<td style="padding:8px 12px;font-size:12px;color:var(--ink-soft)">' + dates + '</td>';
    html += '<td style="padding:8px 12px;font-size:12px;font-family:var(--font-m);color:#7C3AED;font-weight:600">' + (ev.planned_budget > 0 ? '£' + ev.planned_budget.toLocaleString() : '—') + '</td>';
    html += '<td style="padding:8px 12px;font-size:12px;font-family:var(--font-m);color:#059669">' + (ev.actual_spend > 0 ? '£' + ev.actual_spend.toLocaleString() : '—') + '</td>';
    html += '<td style="padding:8px 12px"><span style="font-size:10px;font-family:var(--font-m);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:3px 8px;border-radius:10px;background:' + sc + '20;color:' + sc + '">' + (ev.status || 'planned') + '</span></td>';
    html += '</tr>';
    // Channel breakdown accordion row
    if (siteHasChannels) {
      var colCount = 5 + 12;
      var channels = SITE_BUDGETS[site.site_id].channels || {};
      var chCommits = (window.BRIEF_COMMITMENTS_BY_CHANNEL || {})[site.site_id] || {};
      var chHtml = '';
      Object.keys(channels).forEach(function(ch) {
        var chData = channels[ch];
        var chPlan = Object.values(chData).reduce(function(s,v){ return s + (typeof v === 'object' ? (v.planned||0) : v); }, 0);
        var chCmt = Object.values(chCommits[ch] || {}).reduce(function(s,v){ return s+v; }, 0);
        var chRem = chPlan - Math.round(chCmt);
        var chPct = chPlan > 0 ? Math.min(100, Math.round(chCmt/chPlan*100)) : 0;
        var remColor = chRem < 0 ? '#DC2626' : chRem < chPlan*0.1 ? '#D97706' : '#059669';
        chHtml += '<tr style="background:#F8FAFF">';
        chHtml += '<td style="padding:5px 12px 5px 28px;font-size:11px;color:var(--ink-soft)">' + ch + '</td>';
        chHtml += '<td style="padding:5px 12px;text-align:right;font-family:var(--font-m);font-size:11px;color:var(--swansway)">' + (chPlan > 0 ? '£'+chPlan.toLocaleString() : '—') + '</td>';
        chHtml += '<td style="padding:5px 12px;text-align:right;font-family:var(--font-m);font-size:11px;color:#D97706;font-weight:' + (chCmt>0?'700':'400') + '">' + (chCmt > 0 ? '£'+Math.round(chCmt).toLocaleString() : '—') + '</td>';
        chHtml += '<td style="padding:5px 12px;text-align:right;font-family:var(--font-m);font-size:11px;color:'+remColor+'">' + (chPlan > 0 ? (chRem<0?'-':'')+'£'+Math.abs(chRem).toLocaleString() : '—') + '</td>';
        chHtml += '<td style="padding:5px 12px"><div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:3px;background:var(--border);border-radius:2px;overflow:hidden"><div style="height:100%;width:'+chPct+'%;background:'+(chPct>90?'#DC2626':chPct>70?'#D97706':'#2563EB')+';border-radius:2px"></div></div><span style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft)">'+chPct+'%</span></div></td>';
        for (var mi = 0; mi < 12; mi++) {
          var mPlan = typeof chData[mi] === 'object' ? (chData[mi].planned||0) : (chData[mi]||0);
          chHtml += '<td style="padding:5px 6px;text-align:right;font-family:var(--font-m);font-size:9px;color:var(--ink-faint)">' + (mPlan > 0 ? '£'+mPlan.toLocaleString() : '') + '</td>';
        }
        chHtml += '</tr>';
      });
      html += '<tr id="' + siteAccordId + '" class="brs-detail-row"><td colspan="' + colCount + '" style="padding:0;background:#F0F4FF;border-left:3px solid #2563EB">';
      html += '<table style="width:100%;border-collapse:collapse">';
      html += '<thead><tr style="background:#E8EFFF"><th style="padding:5px 12px 5px 28px;text-align:left;font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.06em">Channel</th>';
      html += '<th style="padding:5px 12px;text-align:right;font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase">Planned</th>';
      html += '<th style="padding:5px 12px;text-align:right;font-family:var(--font-m);font-size:9px;color:#D97706;text-transform:uppercase">Committed</th>';
      html += '<th style="padding:5px 12px;text-align:right;font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase">Remaining</th>';
      html += '<th style="padding:5px 12px;font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase">Used</th>';
      for (var mhi = 0; mhi < 12; mhi++) { html += '<th style="padding:5px 6px;text-align:right;font-family:var(--font-m);font-size:9px;color:var(--ink-soft)">' + ['J','F','M','A','M','J','J','A','S','O','N','D'][mhi] + '</th>'; }
      html += '</tr></thead><tbody>' + chHtml + '</tbody></table>';
      html += '</td></tr>';
    }
  });
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

function renderBrandCampaigns(brandId) {
  var listEl = document.getElementById(brandId + '-campaigns-list');
  if (!listEl) return;
  var brand = BRANDS.find(function(b){ return b.id === brandId; });
  var brandName = brand ? brand.name : brandId;

  // Pull from Supabase campaigns (CB_CAMPAIGNS) — correct source
  var liveCamps = (CB_CAMPAIGNS || []).filter(function(camp) {
    return camp.brand_id === brandId;
  });

  // Pull from briefs cache — using correct top-level brand_id field
  var briefs = (SB_BRIEFS_CACHE || []).filter(function(b) {
    return b.brand_id === brandId;
  });

  listEl.innerHTML = '';

  if (!liveCamps.length && !briefs.length) {
    listEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--ink-faint);font-size:13px">No campaigns yet. Start one from Planning → Brief Builder.</div>';
    return;
  }

  var MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var statusColors = {active:'#059669',planned:'#6B7280',briefed:'#D97706',completed:'#2563EB',cancelled:'#DC2626'};

  if (liveCamps.length) {
    var hdr = document.createElement('div');
    hdr.style.cssText = 'font-family:var(--font-m);font-size:10px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px';
    hdr.textContent = 'Campaigns';
    listEl.appendChild(hdr);

    liveCamps.forEach(function(camp) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:11px 14px;background:var(--white);border:1.5px solid var(--border);border-left:3px solid ' + (brand ? brand.color : 'var(--swansway)') + ';border-radius:5px;margin-bottom:6px;cursor:pointer;transition:box-shadow .15s';
      row.onmouseenter = function(){ this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)'; };
      row.onmouseleave = function(){ this.style.boxShadow = ''; };

      var dates = '';
      if (camp.start_date) {
        var sd = new Date(camp.start_date+'T00:00:00'), ed = camp.end_date ? new Date(camp.end_date+'T00:00:00') : sd;
        dates = sd.getDate()+' '+MN[sd.getMonth()]+' – '+ed.getDate()+' '+MN[ed.getMonth()]+' '+ed.getFullYear();
      }

      var statusCol = statusColors[camp.status] || '#6B7280';
      row.innerHTML =
        '<div style="flex:1;min-width:0">'
          + '<div style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:3px">' + (camp.title || 'Campaign') + '</div>'
          + (dates ? '<div style="font-size:11px;color:var(--ink-soft)">' + dates + '</div>' : '')
        + '</div>'
        + '<span style="font-size:10px;font-family:var(--font-m);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:3px 9px;border-radius:10px;background:' + statusCol + '20;color:' + statusCol + '">' + camp.status + '</span>'
        + '<span style="font-size:11px;color:var(--ink-faint);font-family:var(--font-m)">Stage ' + (camp.current_stage||1) + '/6</span>';

      if (camp.brief_id) {
        row.onclick = function() {
          try { sessionStorage.setItem('_pendingBriefId', camp.brief_id); } catch(e) {}
          window.location = 'brief.html';
        };
      }
      listEl.appendChild(row);
    });
  }

  // Show briefs not yet turned into campaigns
  var unbriefedBriefs = briefs.filter(function(b) {
    return !liveCamps.find(function(c){ return c.brief_id === b.id; });
  });

  if (unbriefedBriefs.length) {
    var hdr2 = document.createElement('div');
    hdr2.style.cssText = 'font-family:var(--font-m);font-size:10px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;margin-top:' + (liveCamps.length ? '16px' : '0');
    hdr2.textContent = 'Briefs in progress';
    listEl.appendChild(hdr2);

    unbriefedBriefs.forEach(function(brief) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:11px 14px;background:var(--white);border:1.5px solid var(--border);border-radius:5px;cursor:pointer;margin-bottom:6px;transition:box-shadow .15s';
      row.onmouseenter = function(){ this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)'; };
      row.onmouseleave = function(){ this.style.boxShadow = ''; };
      var statusCol2 = statusColors[brief.status] || '#6B7280';
      row.innerHTML =
        '<div style="flex:1;min-width:0">'
          + '<div style="font-size:13px;font-weight:600;color:var(--ink)">' + (brief.title || 'Brief') + '</div>'
          + (brief.campaign_type ? '<div style="font-size:11px;color:var(--ink-soft)">' + brief.campaign_type + '</div>' : '')
        + '</div>'
        + '<span style="font-size:10px;font-family:var(--font-m);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:3px 9px;border-radius:10px;background:' + statusCol2 + '20;color:' + statusCol2 + '">' + (brief.status||'draft') + '</span>';
      row.onclick = function() {
        try { sessionStorage.setItem('_pendingBriefId', brief.id); } catch(e) {}
        window.location = 'brief.html';
      };
      listEl.appendChild(row);
    });
  }
}


function renderBrandKPIs(brandId) {
  var el = document.getElementById(brandId + '-brand-kpis');
  if (!el) return;
  var brand = BRANDS.find(function(b) { return b.id === brandId; });
  if (!brand) return;
  var sites = HUB_SITES.filter(function(s) { return s.brand_id === brandId; });
  var hasSiteData = sites.length > 0 && Object.keys(SITE_KPIS).length > 0;

  el.innerHTML = '';

  // ── Header ──
  var hdr = document.createElement('div');
  hdr.style.cssText = 'margin-bottom:1.5rem';
  var htitle = document.createElement('div');
  htitle.style.cssText = 'font-family:var(--font-d);font-size:16px;font-weight:700;color:var(--ink);margin-bottom:4px';
  htitle.textContent = brand.name + ' KPI Framework ' + PLAN_YEAR + ';'
  var hsub = document.createElement('div');
  hsub.style.cssText = 'font-size:12px;color:var(--ink-soft)';
  hsub.textContent = 'Targets from Admin \u2192 KPIs \u00b7 Actuals from Site KPIs \u00b7 Jan\u2013' + PLAN_YEAR + ';';
  hdr.appendChild(htitle); hdr.appendChild(hsub);
  el.appendChild(hdr);

  if (!hasSiteData) {
    var empty = document.createElement('div');
    empty.style.cssText = 'padding:24px;text-align:center;color:var(--ink-faint);font-size:13px;background:var(--white);border:1px solid var(--border);border-radius:4px';
    empty.textContent = 'No site KPI data yet. Enter in Admin \u2192 Site KPIs.';
    el.appendChild(empty);
    return;
  }

  // ── KPI columns ──
  var COLS = [
    {key:'units', label:'New Units', target:'units_target', monthly:true, prefix:'units', ytd:false},
    {key:'used',  label:'Used Units', target:'used_target', monthly:true, prefix:'used',  ytd:false},
    {key:'ev',    label:'EV%', target:'ev_pct_target', monthly:true, prefix:'ev', ytd:false, pct:true},
    {key:'leads', label:'Leads', target:'leads_target', monthly:true, prefix:'leads', ytd:false},
    {key:'conv',  label:'Conv%', target:'conversion_target', monthly:false, field:'conversion_actual', ytd:true, pct:true},
    {key:'ret',   label:'Retention%', target:'retention_target', monthly:false, field:'retention_actual', ytd:true, pct:true},
    {key:'nps',   label:'NPS', target:'nps_target', monthly:false, field:'nps_actual', ytd:true},
    {key:'cpl',   label:'CPL £', target:'cpl_target', monthly:false, field:'cpl_actual', ytd:true, gbp:true},
  ];

  // ── Table ──
  var wrap = document.createElement('div');
  wrap.style.cssText = 'overflow-x:auto;margin-bottom:1.5rem';
  var table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px';

  // Header row
  var thead = document.createElement('thead');
  var hrow = document.createElement('tr');
  hrow.style.cssText = 'background:var(--swansway);color:#fff';
  var th0 = document.createElement('th');
  th0.style.cssText = 'padding:8px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500;min-width:140px';
  th0.textContent = 'Site';
  hrow.appendChild(th0);
  COLS.forEach(function(col) {
    var th = document.createElement('th');
    th.style.cssText = 'padding:8px 10px;text-align:right;font-family:var(--font-m);font-size:10px;font-weight:500;min-width:70px';
    th.innerHTML = col.label + '<br><span style="font-weight:400;opacity:.7">' + (col.ytd ? 'YTD' : 'YTD sum') + '</span>';
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  // Site rows
  var tbody = document.createElement('tbody');
  var brandTotals = {};
  COLS.forEach(function(col) { brandTotals[col.key] = {val:0, tgt:0, count:0}; });

  sites.forEach(function(site, idx) {
    var d = SITE_KPIS[site.site_id] || {};
    var row = document.createElement('tr');
    row.style.cssText = 'background:' + (idx % 2 === 0 ? 'var(--white)' : 'var(--surface)') + ';border-bottom:1px solid var(--border)';

    var td0 = document.createElement('td');
    td0.style.cssText = 'padding:8px 12px;font-weight:600';
    td0.textContent = site.site_name;
    row.appendChild(td0);

    COLS.forEach(function(col) {
      var val = 0, tgt = parseFloat(d[col.target]) || 0;
      if (col.monthly) {
        for (var i = 0; i < 12; i++) val += parseFloat(d['m' + i + '_' + col.prefix]) || 0;
        if (col.pct) {
          // Average not sum for percentages
          var moCount = 0;
          val = 0;
          for (var i = 0; i < 12; i++) { var mv = parseFloat(d['m' + i + '_' + col.prefix]); if (mv > 0) { val += mv; moCount++; } }
          val = moCount > 0 ? Math.round(val / moCount * 10) / 10 : 0;
        }
      } else {
        val = parseFloat(d[col.field]) || 0;
      }

      brandTotals[col.key].val += val;
      brandTotals[col.key].tgt += tgt;
      brandTotals[col.key].count++;

      var pct = tgt > 0 ? Math.min(200, Math.round(val / tgt * 100)) : 0;
      var col_color = val === 0 ? 'var(--ink-faint)' : pct >= 75 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626';
      var display = val === 0 ? '\u2014' : (col.gbp ? '\u00a3' + Math.round(val) : (col.pct ? val + '%' : val.toLocaleString()));

      var td = document.createElement('td');
      td.style.cssText = 'padding:7px 10px;text-align:right';
      var vDiv = document.createElement('div');
      vDiv.style.cssText = 'font-weight:600;color:' + col_color;
      vDiv.textContent = display;
      td.appendChild(vDiv);
      if (tgt > 0 && val > 0) {
        var tDiv = document.createElement('div');
        tDiv.style.cssText = 'font-size:10px;color:var(--ink-faint)';
        tDiv.textContent = 'tgt: ' + (col.gbp ? '\u00a3' + tgt : col.pct ? tgt + '%' : tgt.toLocaleString());
        td.appendChild(tDiv);
      }
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  el.appendChild(wrap);

  // ── Brand summary row ──
  var sumHdr = document.createElement('div');
  sumHdr.style.cssText = 'font-family:var(--font-m);font-size:10px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px';
  sumHdr.textContent = brand.name + ' brand total / average';
  el.appendChild(sumHdr);

  var sumGrid = document.createElement('div');
  sumGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px';

  COLS.forEach(function(col) {
    var t = brandTotals[col.key];
    var val = col.pct ? Math.round(t.val / Math.max(1, t.count) * 10) / 10 : t.val;
    var tgt = col.pct ? Math.round(t.tgt / Math.max(1, t.count) * 10) / 10 : t.tgt;
    var pct = tgt > 0 ? Math.min(200, Math.round(val / tgt * 100)) : 0;
    var col_color = val === 0 ? 'var(--ink-faint)' : pct >= 75 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626';
    var display = val === 0 ? '\u2014' : (col.gbp ? '\u00a3' + Math.round(val) : col.pct ? val + '%' : val.toLocaleString());

    var card = document.createElement('div');
    card.style.cssText = 'background:var(--white);border:1px solid var(--border);border-radius:4px;padding:12px 14px';
    var lbl = document.createElement('div');
    lbl.style.cssText = 'font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px';
    lbl.textContent = col.label;
    var valEl = document.createElement('div');
    valEl.style.cssText = 'font-family:var(--font-d);font-size:18px;font-weight:700;color:' + col_color;
    valEl.textContent = display;
    var tgtEl = document.createElement('div');
    tgtEl.style.cssText = 'font-size:10px;color:var(--ink-faint);margin-top:2px';
    tgtEl.textContent = tgt > 0 ? 'Target: ' + (col.gbp ? '\u00a3' + tgt : col.pct ? tgt + '%' : tgt.toLocaleString()) : 'No target set';
    card.appendChild(lbl); card.appendChild(valEl); card.appendChild(tgtEl);
    sumGrid.appendChild(card);
  });
  el.appendChild(sumGrid);
}



function brsToggle(id) {
  var row = document.getElementById(id);
  var chv = document.getElementById('brs-chv-' + id);
  if (!row) return;
  var open = row.classList.contains('brs-open');
  if (open) {
    row.classList.remove('brs-open');
    row.style.display = 'none';
    if (chv) chv.innerHTML = '&#9654;';
  } else {
    row.classList.add('brs-open');
    row.style.display = 'table-row';
    if (chv) chv.innerHTML = '&#9660;';
  }
}

function brsInjectStyles() {
  if (document.getElementById('brs-styles')) return;
  var s = document.createElement('style');
  s.id = 'brs-styles';
  s.textContent = '.brs-detail-row { display: none; } .brs-detail-row.brs-open { display: table-row; }';
  document.head.appendChild(s);
}

function brsAttachListeners(container) {
  if (!container) return;
  container.querySelectorAll('tr[data-accord]').forEach(function(tr) {
    tr.addEventListener('click', function() {
      brsToggle(tr.getAttribute('data-accord'));
    });
  });
}

function renderBrandSites(brandId) {
  var el = document.getElementById(brandId + '-sites-list');
  if (!el) return;
  var sites = HUB_SITES.filter(function(s) { return s.brand_id === brandId; });
  console.log('renderBrandSites:', brandId, sites.length, 'sites, SITE_BUDGETS keys:', Object.keys(SITE_BUDGETS).length);
  if (!sites.length) {
    el.innerHTML = '<div style="padding:20px;color:var(--ink-faint);font-size:13px">No sites configured for this brand.</div>';
    return;
  }
  var totalPlan = 0, totalActual = 0;
  sites.forEach(function(s) {
    var d = SITE_BUDGETS[s.site_id] || {};
    totalPlan   += d.annual_planned || 0;
    for (var i = 0; i < 12; i++) totalActual += (d['m' + i + '_actual'] || 0);
  });

  // Summary row
  var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:1.5rem">';
  html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:12px 14px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Brand planned total</div><div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:var(--swansway)">£' + totalPlan.toLocaleString() + '</div></div>';
  html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:12px 14px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">YTD actual</div><div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:#059669">' + (totalActual > 0 ? '£' + totalActual.toLocaleString() : '—') + '</div></div>';
  var variance = totalActual - totalPlan;
  html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:12px 14px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Variance</div><div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:' + (variance > 0 ? '#DC2626' : '#059669') + '">' + (totalActual > 0 ? (variance >= 0 ? '+' : '') + '£' + Math.abs(variance).toLocaleString() : '—') + '</div></div>';
  html += '</div>';

  // Sites table
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">';
  html += '<thead><tr style="background:var(--swansway);color:#fff">';
  html += '<th style="padding:8px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500;letter-spacing:0.08em">Site</th>';
  html += '<th style="padding:8px 12px;text-align:right;font-family:var(--font-m);font-size:10px;font-weight:500">Annual planned</th>';
  html += '<th style="padding:8px 12px;text-align:right;font-family:var(--font-m);font-size:10px;font-weight:500">YTD actual</th>';
  html += '<th style="padding:8px 12px;text-align:right;font-family:var(--font-m);font-size:10px;font-weight:500">Variance</th>';
  HUB_MONTHS.forEach(function(m) { html += '<th style="padding:8px 6px;text-align:right;font-family:var(--font-m);font-size:9px;font-weight:500;min-width:52px">' + m + '</th>'; });
  html += '</tr></thead><tbody>';

  // Smart format for cell values
  function fmtCell(v) {
    if (!v || v === 0) return '—';
    if (v >= 10000) return '£' + (v/1000).toFixed(0) + 'K';
    if (v >= 1000)  return '£' + (v/1000).toFixed(1) + 'K';
    return '£' + v.toLocaleString();
  }

  var totalCommitted = 0;
  sites.forEach(function(site) {
    var sc = window.BRIEF_COMMITMENTS && window.BRIEF_COMMITMENTS[site.site_id]
      ? Object.values(window.BRIEF_COMMITMENTS[site.site_id]).reduce(function(s,v){ return s+v; }, 0) : 0;
    totalCommitted += sc;
  });

  // Update summary row to include committed
  html = '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:1.5rem">';
  // Social budgets for this brand
  var brandSocialData = window.SOCIAL_BUDGETS_BRAND && window.SOCIAL_BUDGETS_BRAND[brandId];
  var totalSocial = brandSocialData ? brandSocialData.total : 0;
  html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:12px 14px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Brand planned total</div><div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:var(--swansway)">£' + totalPlan.toLocaleString() + '</div></div>';
  html += '<div style="background:var(--white);border:1px solid var(--border);border-top:3px solid #D97706;border-radius:4px;padding:12px 14px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Committed (briefs)</div><div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:#D97706">' + (totalCommitted > 0 ? '£' + totalCommitted.toLocaleString() : '—') + '</div></div>';
  html += '<div style="background:var(--white);border:1px solid var(--border);border-top:3px solid #1877F2;border-radius:4px;padding:12px 14px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Social budgeted</div><div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:#1877F2">' + (totalSocial > 0 ? '£' + totalSocial.toLocaleString() : '—') + '</div></div>';
  html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:12px 14px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">YTD actual</div><div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:#059669">' + (totalActual > 0 ? '£' + totalActual.toLocaleString() : '—') + '</div></div>';
  var variance = totalActual - totalPlan;
  html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:12px 14px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Variance</div><div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:' + (variance > 0 ? '#DC2626' : '#059669') + '">' + (totalActual > 0 ? (variance >= 0 ? '+' : '') + '£' + Math.abs(variance).toLocaleString() : '—') + '</div></div>';
  html += '</div>';

  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">';
  html += '<thead><tr style="background:var(--swansway);color:#fff">';
  html += '<th style="padding:8px 12px;text-align:left;font-family:var(--font-m);font-size:10px;font-weight:500;letter-spacing:0.08em">Site</th>';
  html += '<th style="padding:8px 12px;text-align:right;font-family:var(--font-m);font-size:10px;font-weight:500">Annual planned</th>';
  html += '<th style="padding:8px 12px;text-align:right;font-family:var(--font-m);font-size:10px;font-weight:500;color:#FCD34D">Committed</th>';
  html += '<th style="padding:8px 12px;text-align:right;font-family:var(--font-m);font-size:10px;font-weight:500">YTD actual</th>';
  html += '<th style="padding:8px 12px;text-align:right;font-family:var(--font-m);font-size:10px;font-weight:500">Variance</th>';
  HUB_MONTHS.forEach(function(m) { html += '<th style="padding:8px 6px;text-align:right;font-family:var(--font-m);font-size:9px;font-weight:500;min-width:52px">' + m + '</th>'; });
  html += '</tr></thead><tbody>';

  sites.forEach(function(site, idx) {
    var d = SITE_BUDGETS[site.site_id] || {};
    var plan = d.annual_planned || 0;
    var committed = window.BRIEF_COMMITMENTS && window.BRIEF_COMMITMENTS[site.site_id]
      ? Object.values(window.BRIEF_COMMITMENTS[site.site_id]).reduce(function(s,v){ return s+v; }, 0) : 0;
    var actual = 0;
    for (var i = 0; i < 12; i++) actual += (d['m' + i + '_actual'] || 0);
    var v = actual - plan;
    var evData = typeof getEventBudgetBySite === 'function' ? getEventBudgetBySite(site.site_id) : null;
    var bg = idx % 2 === 0 ? 'var(--white)' : 'var(--surface)';
    var siteAccordId = 'brs-' + site.site_id.replace(/[^a-z0-9]/gi,'_');
    var siteHasChannels = Object.keys((SITE_BUDGETS[site.site_id] || {}).channels || {}).length > 0;
    console.log('site', site.site_id, 'hasChannels:', siteHasChannels, 'channels:', Object.keys((SITE_BUDGETS[site.site_id]||{}).channels||{}));
    html += '<tr style="background:' + bg + ';cursor:' + (siteHasChannels?'pointer':'default') + '"' + (siteHasChannels ? ' data-accord="' + siteAccordId + '"' : '') + '>';
    html += '<td style="padding:8px 12px;font-size:13px;font-weight:600">' + (siteHasChannels ? '<span style="font-size:10px;color:var(--ink-soft);margin-right:4px" id="brs-chv-'+siteAccordId+'">&#9654;</span>' : '') + site.site_name + '</td>';
    html += '<td style="padding:8px 12px;text-align:right;font-family:var(--font-m);font-size:12px;color:var(--swansway);font-weight:700">' + (plan > 0 ? '£' + plan.toLocaleString() : '—') + '</td>';
    html += '<td style="padding:8px 12px;text-align:right;font-family:var(--font-m);font-size:12px;color:#D97706;font-weight:600">' + (committed > 0 ? '£' + committed.toLocaleString() : '—') + '</td>';
    html += '<td style="padding:8px 12px;text-align:right;font-family:var(--font-m);font-size:12px;color:#059669">' + (actual > 0 ? '£' + actual.toLocaleString() : '—') + '</td>';
    html += '<td style="padding:8px 12px;text-align:right;font-family:var(--font-m);font-size:12px;color:' + (v > 0 ? '#DC2626' : '#059669') + '">' + (actual > 0 ? (v >= 0 ? '+' : '') + '£' + Math.abs(v).toLocaleString() : '—') + '</td>';
    for (var i = 0; i < 12; i++) {
      var mPlan = d['m' + i + '_planned'] || 0;
      var mAct  = d['m' + i + '_actual']  || 0;
      var mCmt  = (window.BRIEF_COMMITMENTS && window.BRIEF_COMMITMENTS[site.site_id]) ? (window.BRIEF_COMMITMENTS[site.site_id][i] || 0) : 0;
      var mEvPl = evData ? (evData[i].planned || 0) : 0;
      var mPct  = mPlan > 0 ? Math.min(100, Math.round(mAct / mPlan * 100)) : 0;
      html += '<td style="padding:4px 6px;text-align:right;vertical-align:top;line-height:1.3">';
      html += '<div style="font-family:var(--font-m);font-size:10px;color:var(--ink-faint)">' + fmtCell(mPlan) + '</div>';
      if (mCmt > 0) html += '<div style="font-size:9px;color:#D97706;font-weight:600">' + fmtCell(mCmt) + ' cmt</div>';
      if (mEvPl > 0) html += '<div style="font-size:9px;color:#7C3AED">' + fmtCell(mEvPl) + ' ev</div>';
      if (mAct > 0) {
        html += '<div style="font-size:9px;color:#059669">' + fmtCell(mAct) + ' act</div>';
        html += '<div style="height:3px;background:var(--border);border-radius:2px;margin-top:2px"><div style="height:3px;background:' + (mPct > 100 ? '#DC2626' : '#059669') + ';width:' + Math.min(100,mPct) + '%;border-radius:2px"></div></div>';
      }
      html += '</td>';
    }
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  el.innerHTML = html;
  brsInjectStyles();
  brsAttachListeners(el);
  var accRows = el.querySelectorAll('tr[data-accord]'); console.log('brsAttach: found', accRows.length, 'accordion rows');
}


function syncBrandSitesFromHubSites() {
  if (!HUB_SITES || !HUB_SITES.length) return;
  BRANDS.forEach(function(brand) {
    var brandSites = HUB_SITES.filter(function(s) { return s.brand_id === brand.id; });
    if (brandSites.length > 0) {
      brand.sites = brandSites.length;
      brand.sitenames = brandSites.map(function(s) {
        return s.site_name.replace(brand.name + ' ', '').replace('VWC ', '').replace('VW ', '').replace('Motor Match ', '');
      }).join(' · ');
      // If this brand page is already rendered, patch the DOM live
      var container = document.getElementById(brand.id + '-content');
      if (container && container.dataset.rendered) {
        var subtitle = container.querySelector('.page-subtitle');
        if (subtitle) subtitle.textContent = brand.sites + ' site' + (brand.sites > 1 ? 's' : '') + ' · ' + brand.sitenames;
        var heroSites = container.querySelector('.brand-hero-sites');
        if (heroSites) heroSites.textContent = brand.sitenames;
        var tabBtn = container.querySelector('[onclick*="centres"]');
        if (tabBtn) tabBtn.textContent = 'Dealership/s (' + brand.sites + ')';
      }
    }
  });
}


async function loadBrandKPIs() {
  try {
    var resp = await fetch(SUPABASE_URL + '/rest/v1/brand_kpis?select=*', {
      headers: getAuthHeaders()
    });
    if (!resp.ok) {
      var errText = await resp.text();
      console.warn('loadBrandChannels HTTP error:', resp.status, errText.substring(0,100));
      return;
    }
    var rows = await resp.json();
    rows.forEach(function(row) { BRAND_KPIS_DATA[row.brand_id] = row; });
    updateGroupKPIsFromBrands();
    if (typeof renderGroupKPIs === 'function') renderGroupKPIs();
    console.log('Brand KPIs loaded: ' + rows.length + ' brands');
  } catch(e) { console.warn('loadBrandKPIs error:', e); }
}


function updateGroupKPIsFromBrands() {
  if (!Object.keys(BRAND_KPIS_DATA).length) return;
  var brands = Object.values(BRAND_KPIS_DATA);

  // Co-op utilisation — total claimed / total available across all brands
  var coopAvail = 0, coopClaimed = 0;
  var fleetTotal = 0, fleetTarget = 0;
  var socialTotal = 0, socialTarget = 0;
  var atResponses = [], atTargets = [];

  brands.forEach(function(b) {
    coopAvail   += b.coop_available || 0;
    coopClaimed += b.coop_claimed   || 0;
    fleetTotal  += b.fleet_actual   || 0;
    fleetTarget += b.fleet_target   || 0;
    socialTotal += b.social_followers || 0;
    socialTarget += b.social_target  || 0;
    if (b.autotrader_response_actual > 0) atResponses.push(b.autotrader_response_actual);
    if (b.autotrader_response_target > 0) atTargets.push(b.autotrader_response_target);
  });

  var coopPct = coopAvail > 0 ? Math.round(coopClaimed / coopAvail * 100) : 0;
  var coopTgt = coopAvail > 0 ? 90 : 0; // default 90% utilisation target
  var atActual = atResponses.length ? Math.round(atResponses.reduce(function(a,b){return a+b;},0) / atResponses.length * 10) / 10 : 0;
  var atTarget = atTargets.length ? Math.round(atTargets.reduce(function(a,b){return a+b;},0) / atTargets.length * 10) / 10 : 0;
  var socialGrowthPct = socialTarget > 0 && socialTotal > 0 ? Math.round((socialTarget - socialTotal) / socialTotal * 100) : 0;

  var LABEL_MAP = {
    'AutoTrader response time':       {t: atTarget > 0 ? '< ' + atTarget + ' min' : null, a: atActual > 0 ? atActual + ' min' : null, p: atTarget > 0 && atActual > 0 ? Math.max(0, Math.round((2 - atActual/atTarget)*100)) : 0},
    'Fleet accounts active':          {t: fleetTarget > 0 ? fleetTarget.toLocaleString() : null, a: fleetTotal > 0 ? fleetTotal.toLocaleString() : null, p: fleetTarget > 0 ? Math.min(100, Math.round(fleetTotal/fleetTarget*100)) : 0},
    'Social media follower growth':   {t: socialGrowthPct > 0 ? '+' + socialGrowthPct + '%' : null, a: socialTotal > 0 ? socialTotal.toLocaleString() + ' followers' : null, p: 0},
    'Manufacturer co-op utilisation': {t: coopTgt > 0 ? coopTgt + '%' : null, a: coopPct > 0 ? coopPct + '%' : null, p: Math.min(100, coopPct)},
  };

  GROUP_KPIS.forEach(function(kpi) {
    var m = LABEL_MAP[kpi.l];
    if (!m) return;
    if (m.t) kpi.t = m.t;
    if (m.a) { kpi.a = m.a; kpi.p = m.p; }
  });
}


async function loadBrandChannels() {
  if (window._brandChannelsLoaded) { updateGroupChannelsFromBrands(); return; }
  if (window._brandChannelsLoading) return; // prevent concurrent double-load
  window._brandChannelsLoading = true;
  try {
    var resp = await fetch(SUPABASE_URL + '/rest/v1/brand_channels?select=*&order=brand_id,sort_order', {
      headers: getAuthHeaders()
    });
    if (!resp.ok) { window._brandChannelsLoading = false; return; }
    var rows = await resp.json();
    BRAND_CHANNELS_DATA = {}; // clear before populating to avoid duplicates
    rows.forEach(function(row) {
      if (!BRAND_CHANNELS_DATA[row.brand_id]) BRAND_CHANNELS_DATA[row.brand_id] = [];
      BRAND_CHANNELS_DATA[row.brand_id].push(row);
    });
    // Re-render brand channel mix divs
    Object.keys(BRAND_CHANNELS_DATA).forEach(function(bid) {
      var el = document.getElementById(bid + '-budget');
      if (el && typeof renderBrandChannelMix === 'function') renderBrandChannelMix(bid);
    });
    updateGroupChannelsFromBrands();
    // Re-render channel mix after data loads — always, not just when view is active
    if (typeof renderGroupChannels === 'function') renderGroupChannels();
    window._brandChannelsLoaded = true;
    window._brandChannelsLoading = false;
    console.log('Brand channels loaded: ' + rows.length + ' rows');
  } catch(e) { window._brandChannelsLoading = false; console.warn('loadBrandChannels error:', e); }
}


function updateGroupChannelsFromBrands() {
  if (_updatingGroupChannels) return;
  _updatingGroupChannels = true;
  // Aggregate all brand channel spend into group channel totals
  console.log('updateGroupChannelsFromBrands: brands=', Object.keys(BRAND_CHANNELS_DATA).length, 'sites=', Object.keys(SITE_BUDGETS).length);
  if (!Object.keys(BRAND_CHANNELS_DATA).length) { console.log('No brand channel data yet'); _updatingGroupChannels = false; return; }
  var channelTotals = {};  // channel name -> {total_gbp, color, brands:[{name, gbp, pct}]}

  HUB_SITES && HUB_SITES.forEach ? null : null; // ensure HUB_SITES exists

  // For each brand, calculate £ spend per channel
  Object.keys(BRAND_CHANNELS_DATA).forEach(function(brandId) {
    var brandSites = HUB_SITES ? HUB_SITES.filter(function(s) { return s.brand_id === brandId; }) : [];
    var brandBudget = brandSites.reduce(function(sum, site) {
      var d = SITE_BUDGETS[site.site_id] || {};
      return sum + (d.annual_planned || 0);
    }, 0);

    var channels = BRAND_CHANNELS_DATA[brandId] || [];
    channels.forEach(function(ch) {
      var gbp = brandBudget * (parseFloat(ch.pct) || 0) / 100;
      if (!channelTotals[ch.channel]) {
        channelTotals[ch.channel] = {total: 0, color: ch.color || '#333'};
      }
      channelTotals[ch.channel].total += gbp;
        if (!channelTotals[ch.channel].brands) channelTotals[ch.channel].brands = [];
        if (gbp > 0) {
          var bName = (window.BRAND_NAMES && window.BRAND_NAMES[brandId]) || brandId;
          channelTotals[ch.channel].brands.push({name: bName, gbp: Math.round(gbp), pct: parseFloat(ch.pct)||0});
        }
    });
  });

  // Update GROUP_CHANNELS with aggregated data
  var totalGbp = Object.values(channelTotals).reduce(function(s, c) { return s + c.total; }, 0);
  GROUP_CHANNELS = Object.keys(channelTotals).map(function(name) {
    var c = channelTotals[name];
    return {
      n: name,
      pct: totalGbp > 0 ? Math.round(c.total / totalGbp * 100) : 0,
      gbp: Math.round(c.total),
      color: c.color,
      note: '',
      brands: c.brands || []
    };
  }).sort(function(a, b) { return b.gbp - a.gbp; });
  
  // Also store which brands have contributed
  GROUP_CHANNELS._contributing_brands = Object.keys(BRAND_CHANNELS_DATA).length;
  _updatingGroupChannels = false;
  // Render group channels — on standalone channels.html OR if view is active on index
  var chanView = document.getElementById('view-channels');
  var onChannelsPage = !document.getElementById('view-group'); // standalone page has no view-group
  if (onChannelsPage || (chanView && chanView.classList.contains('active'))) {
    if (typeof renderGroupChannels === 'function') renderGroupChannels();
  }

}


function renderBrandChannelMix(brandId) {
  var el = document.getElementById(brandId + '-budget');
  if (!el) return;
  var channels = BRAND_CHANNELS_DATA[brandId] || [];

  // Calculate brand budget
  var brandSites = HUB_SITES ? HUB_SITES.filter(function(s) { return s.brand_id === brandId; }) : [];
  var brandBudget = brandSites.reduce(function(sum, site) {
    var d = SITE_BUDGETS[site.site_id] || {};
    return sum + (d.annual_planned || 0);
  }, 0);

  if (!channels.length) {
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--ink-faint);font-size:13px">No channel mix set. Configure in Admin → Brand Channels.</div>';
    return;
  }

  var html = '<div class="sh"><div><div class="sh-title">Channel Mix</div><div class="sh-sub">Based on £' + brandBudget.toLocaleString() + ' annual budget</div></div></div>';

  // Bar chart
  html += '<div style="padding:0 20px 20px">';
  channels.forEach(function(ch) {
    var gbp = Math.round(brandBudget * (parseFloat(ch.pct) || 0) / 100);
    var pct = parseFloat(ch.pct) || 0;
    html += '<div style="margin-bottom:12px">';
    html += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">';
    html += '<span style="font-weight:600">' + ch.channel + '</span>';
    html += '<span style="color:var(--ink-soft)">' + pct + '% &nbsp; <strong>£' + gbp.toLocaleString() + '</strong></span>';
    html += '</div>';
    html += '<div style="height:8px;background:var(--surface-2);border-radius:4px">';
    html += '<div style="height:8px;border-radius:4px;background:' + (ch.color||'#333') + ';width:' + Math.min(pct,100) + '%"></div>';
    html += '</div>';
    if (ch.note) html += '<div style="font-size:10px;color:var(--ink-faint);margin-top:2px">' + ch.note + '</div>';
    html += '</div>';
  });

  // Total check
  var totalPct = channels.reduce(function(s,c){return s+(parseFloat(c.pct)||0);},0);
  html += '<div style="padding-top:10px;border-top:1px solid var(--border);font-size:12px;color:var(--ink-soft)">Total: <strong>' + totalPct.toFixed(1) + '%</strong> of £' + brandBudget.toLocaleString() + ' = £' + Math.round(brandBudget*totalPct/100).toLocaleString() + ' allocated</div>';
  html += '</div>';

  el.innerHTML = html;
}


function qplanTriggerUpload(brandId, brandName, brandColor) {
  // Build or reuse the upload modal
  let modal = document.getElementById('qplan-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'qplan-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:6px;width:100%;max-width:560px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.2)">
        <div id="qplan-modal-header" style="background:var(--swansway);color:#fff;padding:16px 20px;border-bottom:2px solid var(--accent);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-family:var(--font-m);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:3px">Upload quarterly plan</div>
            <div style="font-family:var(--font-d);font-size:16px;font-weight:700" id="qplan-modal-brand-name">Brand</div>
          </div>
          <button onclick="document.getElementById('qplan-modal').remove()" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:22px;cursor:pointer;line-height:1;padding:0">×</button>
        </div>
        <div style="padding:24px" id="qplan-modal-body">
          <div class="qplan-upload-zone" id="qplan-drop-zone">
            <input type="file" id="qplan-file-input" accept=".pdf,.docx,.doc,.txt,.pptx" onchange="qplanHandleFile(event)">
            <div class="qplan-upload-icon">📄</div>
            <div class="qplan-upload-title">Drop your Q-plan document here</div>
            <div class="qplan-upload-sub">Or click to browse</div>
            <div class="qplan-upload-formats">PDF · DOCX · PPTX · TXT</div>
          </div>
          <div class="qplan-processing" id="qplan-processing-box">
            <div class="qplan-spinner"></div>
            <div class="qplan-processing-text" id="qplan-processing-text">Reading document…</div>
            <div class="qplan-processing-step" id="qplan-processing-step">Extracting text</div>
          </div>
          <div class="qplan-error" id="qplan-upload-error"></div>
          <div style="margin-top:14px;font-size:12px;color:var(--ink-soft);line-height:1.6">
            Claude will extract: campaigns, dates, models, creative requirements, media specs, co-op funding, mandatories and action items — and present them structured in the brand Q-Plan tab.
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
  }
  document.getElementById('qplan-modal-brand-name').textContent = brandName + ' Quarterly Plan';
  modal.dataset.brandId = brandId;
  modal.dataset.brandName = brandName;
  modal.dataset.brandColor = brandColor;
  // Reset state
  document.getElementById('qplan-processing-box').classList.remove('active');
  document.getElementById('qplan-upload-error').classList.remove('active');
  const dz = document.getElementById('qplan-drop-zone');
  dz.style.display = 'block';
  // Drag-drop
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag-over'); const f = e.dataTransfer.files[0]; if(f) qplanProcessFile(f, brandId, brandName, brandColor); });
}


function qplanHandleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const modal = document.getElementById('qplan-modal');
  qplanProcessFile(file, modal.dataset.brandId, modal.dataset.brandName, modal.dataset.brandColor);
}


async function qplanProcessFile(file, brandId, brandName, brandColor) {
  const processingBox = document.getElementById('qplan-processing-box');
  const processingText = document.getElementById('qplan-processing-text');
  const processingStep = document.getElementById('qplan-processing-step');
  const errBox = document.getElementById('qplan-upload-error');
  const dropZone = document.getElementById('qplan-drop-zone');

  dropZone.style.display = 'none';
  processingBox.classList.add('active');
  errBox.classList.remove('active');

  const steps = [
    ['Reading document…', 'Decoding file contents'],
    ['Sending to Claude…', 'Analysing campaign structure'],
    ['Extracting requirements…', 'Identifying campaigns, dates, budgets'],
    ['Building action list…', 'Prioritising team tasks'],
    ['Saving to database…', 'Storing for your team'],
  ];
  let stepIdx = 0;
  const stepInterval = setInterval(() => {
    if (stepIdx < steps.length) {
      processingText.textContent = steps[stepIdx][0];
      processingStep.textContent = steps[stepIdx][1];
      stepIdx++;
    }
  }, 2200);

  try {
    // ── Read file as base64 ──
    const fileData = await qplanReadFileAsBase64(file);
    const mimeType = qplanGetMimeType(file.name);

    // ── Build Anthropic API message ──
    const systemPrompt = `You are an expert automotive retail marketing analyst. You are reading a manufacturer quarterly campaign plan document for ${brandName} dealerships. Extract ALL campaign information and return it as structured JSON only — no preamble, no markdown, no explanation.

Return this exact JSON structure:
{
  "quarter": "Q2 2026",
  "year": "2026",
  "brand": "${brandName}",
  "document_title": "...",
  "summary": "One paragraph summary of the quarter's focus",
  "campaigns": [
    {
      "name": "Campaign name",
      "type": "plate_change|launch|ev|aftersales|brand|event|fleet|used",
      "start_date": "1 Apr 2026",
      "end_date": "30 Jun 2026",
      "models": ["Model 1", "Model 2"],
      "objective": "What the campaign aims to achieve",
      "key_message": "The central message",
      "offer": "The specific offer or hook",
      "media": ["Digital PPC", "Social", "AutoTrader"],
      "budget_available": "£X or Co-op available",
      "mandatories": ["T&Cs required", "APR representative example"],
      "priority": "high|medium|low"
    }
  ],
  "creative_requirements": [
    {
      "format": "Digital banner",
      "spec": "1200×628px",
      "campaign": "Campaign name",
      "deadline": "15 Mar 2026",
      "notes": "Any specific requirements"
    }
  ],
  "coop_funding": [
    {
      "label": "Digital co-op",
      "amount": "£5,000",
      "conditions": "Must use approved creative",
      "deadline": "Submit by 28 Feb"
    }
  ],
  "key_dates": [
    { "date": "1 Mar 2026", "event": "Plate change go-live", "campaign": "March plate" }
  ],
  "action_items": [
    {
      "task": "Brief creative agency on plate change assets",
      "priority": "high",
      "deadline": "15 Feb 2026",
      "category": "creative|media|compliance|budget|planning",
      "campaign": "Campaign name"
    }
  ],
  "mandatories_global": ["Group-wide mandatory 1", "Group-wide mandatory 2"],
  "compliance_notes": "Any compliance or legal notes"
}

Extract as much detail as possible. If a field is not mentioned in the document, use null. Be precise with dates, budgets, and specifications.`;

    const userContent = mimeType === 'text/plain'
      ? [{ type: 'text', text: 'Here is the quarterly plan document:\n\n' + atob(fileData) }]
      : [
          { type: 'document', source: { type: 'base64', media_type: mimeType, data: fileData } },
          { type: 'text', text: 'Extract all campaign information from this quarterly plan document and return structured JSON.' }
        ];


    const response = await fetch('https://swansway-marketing-hub.vercel.app/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API error: ' + response.status);
    }

    const apiResult = await response.json();
    const rawText = apiResult.content?.[0]?.text || '';

    // ── Parse JSON from response ──
    let planData;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      planData = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch(e) {
      throw new Error('Could not parse Claude\'s response as JSON. The document may be too complex or unreadable.');
    }

    planData._filename = file.name;
    planData._uploaded = new Date().toISOString();
    planData._brandId = brandId;
    planData._brandColor = brandColor;

    // ── Save to Supabase if connected ──
    if (SB && SB_USER) {
      processingText.textContent = 'Saving to database…';
      processingStep.textContent = 'Storing for your team';
      await SB.from('brand_plans').insert({
        user_id: SB_USER.id,
        brand_id: brandId,
        brand_name: brandName,
        quarter: planData.quarter || 'Unknown',
        year: planData.year || new Date().getFullYear().toString(),
        filename: file.name,
        extracted: planData,
        status: 'active'
      });
    }

    clearInterval(stepInterval);
    QPLAN_CACHE[brandId] = planData;

    // Close modal and render
    document.getElementById('qplan-modal').remove();
    qplanRenderForBrand(brandId, planData);

    // Switch to q-plan tab
    const tab = document.getElementById('qplan-tab-' + brandId);
    if (tab) {
      switchInner(brandId, 'qplan', tab);
    }

  } catch(err) {
    clearInterval(stepInterval);
    processingBox.classList.remove('active');
    dropZone.style.display = 'block';
    errBox.classList.add('active');
    errBox.textContent = '✗ ' + err.message;
  }
}


function qplanReadFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}


function qplanGetMimeType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  const types = { pdf:'application/pdf', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', doc:'application/msword', pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation', txt:'text/plain' };
  return types[ext] || 'application/pdf';
}


function qplanRenderForBrand(brandId, plan) {
  const container = document.getElementById('qplan-inner-' + brandId);
  if (!container) return;

  const color = plan._brandColor || '#1A2E4A';
  const camps = plan.campaigns || [];
  const creatives = plan.creative_requirements || [];
  const coop = plan.coop_funding || [];
  const actions = plan.action_items || [];
  const dates = plan.key_dates || [];
  const mandatories = plan.mandatories_global || [];

  // Action completion state (localStorage per brand/quarter)
  const storeKey = 'qplan_actions_' + brandId + '_' + (plan.quarter || 'q');
  var done = QPLAN_ACTION_STATE[storeKey] || {};

  container.innerHTML = `
    <div class="qplan-header">
      <div class="qplan-header-left">
        <div class="qplan-header-brand">${plan.brand || brandId} · ${plan.quarter || ''}</div>
        <div class="qplan-header-title">${plan.document_title || plan.quarter + ' Campaign Plan'}</div>
        <div class="qplan-header-meta">${plan._filename || ''} · Uploaded ${plan._uploaded ? new Date(plan._uploaded).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'today'}</div>
      </div>
      <div class="qplan-header-actions">
        <button class="qplan-hbtn" onclick="qplanTriggerUpload('${brandId}','${plan.brand || brandId}','${color}')">↑ Upload new plan</button>
        <button class="qplan-hbtn qplan-hbtn-accent" onclick="qplanLoadFromDb('${brandId}')">📂 Previous plans</button>
      </div>
    </div>

    ${plan.summary ? `<div style="padding:14px 16px;background:var(--white);border:1px solid var(--border);border-left:4px solid ${color};border-radius:4px;font-size:13px;color:var(--ink-soft);line-height:1.7;margin-bottom:1.5rem">${plan.summary}</div>` : ''}

    <div class="qplan-sections">

      <!-- ACTION ITEMS -->
      <div class="qplan-section">
        <div class="qplan-section-header open" onclick="qplanToggleSection(this)">
          <div class="qplan-section-header-left">
            <div class="qplan-section-icon">✅</div>
            <div class="qplan-section-title">Action Items</div>
            <div class="qplan-section-count">${actions.length} tasks</div>
          </div>
          <div class="qplan-section-chevron">▼</div>
        </div>
        <div class="qplan-section-body open">
          ${actions.length ? `
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
            <span style="font-family:var(--font-m);font-size:10px;color:var(--ink-soft)">
              ${Object.values(done).filter(Boolean).length} of ${actions.length} complete
            </span>
            <button style="font-size:11px;padding:2px 10px;border:1px solid var(--border);border-radius:2px;background:var(--white);cursor:pointer;color:var(--ink-soft);font-family:var(--font-b)" onclick="qplanClearActions('${brandId}','${plan.quarter||'q'}')">Reset all</button>
          </div>
          <div class="qplan-action-list">
            ${actions.map((a, i) => {
              const isDone = done[i] || false;
              const priClass = a.priority === 'high' ? 'qplan-action-priority-high' : a.priority === 'medium' ? 'qplan-action-priority-med' : 'qplan-action-priority-low';
              return `<div class="qplan-action-item ${isDone?'done':''}" id="qaction-${brandId}-${i}" onclick="qplanToggleAction('${brandId}','${plan.quarter||'q'}',${i})">
                <div class="qplan-action-check">✓</div>
                <div class="qplan-action-body">
                  <div class="qplan-action-text">${a.task}</div>
                  <div class="qplan-action-meta">
                    <span class="qplan-action-tag ${priClass}">${a.priority || 'medium'}</span>
                    ${a.category ? `<span class="qplan-action-tag" style="background:var(--surface-2);color:var(--ink-soft)">${a.category}</span>` : ''}
                    ${a.campaign ? `<span class="qplan-action-tag" style="background:var(--surface-2);color:var(--ink-soft)">${a.campaign}</span>` : ''}
                    ${a.deadline ? `<span class="qplan-action-deadline">📅 ${a.deadline}</span>` : ''}
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>` : '<div style="color:var(--ink-soft);font-size:13px">No action items extracted from this document.</div>'}
        </div>
      </div>

      <!-- CAMPAIGNS -->
      <div class="qplan-section">
        <div class="qplan-section-header" onclick="qplanToggleSection(this)">
          <div class="qplan-section-header-left">
            <div class="qplan-section-icon">📣</div>
            <div class="qplan-section-title">Campaigns</div>
            <div class="qplan-section-count">${camps.length} campaigns</div>
          </div>
          <div class="qplan-section-chevron">▼</div>
        </div>
        <div class="qplan-section-body">
          <div class="qplan-campaign-grid">
            ${camps.map(c => `
              <div class="qplan-campaign-card" style="--card-accent:${color}">
                <div class="qplan-campaign-name">${c.name}</div>
                <div class="qplan-campaign-dates">${[c.start_date,c.end_date].filter(Boolean).join(' → ')}</div>
                ${c.models?.length ? `<div class="qplan-campaign-models">${c.models.map(m=>`<span class="tag t-blue">${m}</span>`).join('')}</div>` : ''}
                ${c.objective ? `<div class="qplan-campaign-detail"><strong>Objective:</strong> ${c.objective}</div>` : ''}
                ${c.key_message ? `<div class="qplan-campaign-detail"><strong>Message:</strong> ${c.key_message}</div>` : ''}
                ${c.offer ? `<div class="qplan-campaign-detail"><strong>Offer:</strong> ${c.offer}</div>` : ''}
                ${c.media?.length ? `<div class="qplan-campaign-detail" style="margin-top:6px">${c.media.map(m=>`<span class="tag t-slate">${m}</span>`).join(' ')}</div>` : ''}
                ${c.budget_available ? `<div class="qplan-campaign-budget">💰 ${c.budget_available}</div>` : ''}
                ${c.mandatories?.length ? `<div class="qplan-campaign-detail" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px"><strong>Mandatories:</strong> ${c.mandatories.join(' · ')}</div>` : ''}
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- KEY DATES -->
      ${dates.length ? `
      <div class="qplan-section">
        <div class="qplan-section-header" onclick="qplanToggleSection(this)">
          <div class="qplan-section-header-left">
            <div class="qplan-section-icon">📅</div>
            <div class="qplan-section-title">Key Dates</div>
            <div class="qplan-section-count">${dates.length} dates</div>
          </div>
          <div class="qplan-section-chevron">▼</div>
        </div>
        <div class="qplan-section-body">
          <div style="display:flex;flex-direction:column;gap:6px">
            ${dates.map(d=>`
              <div style="display:grid;grid-template-columns:140px 1fr;gap:12px;padding:8px 12px;border:1px solid var(--border);border-radius:3px;background:var(--white);align-items:center">
                <div style="font-family:var(--font-m);font-size:11px;color:${color};font-weight:600">${d.date}</div>
                <div>
                  <div style="font-size:12px;font-weight:600;color:var(--ink)">${d.event}</div>
                  ${d.campaign?`<div style="font-size:11px;color:var(--ink-soft)">${d.campaign}</div>`:''}
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- CREATIVE REQUIREMENTS -->
      ${creatives.length ? `
      <div class="qplan-section">
        <div class="qplan-section-header" onclick="qplanToggleSection(this)">
          <div class="qplan-section-header-left">
            <div class="qplan-section-icon">🎨</div>
            <div class="qplan-section-title">Creative Requirements</div>
            <div class="qplan-section-count">${creatives.length} formats</div>
          </div>
          <div class="qplan-section-chevron">▼</div>
        </div>
        <div class="qplan-section-body">
          <div class="qplan-creative-grid">
            ${creatives.map(c=>`
              <div class="qplan-creative-card">
                <div class="qplan-creative-type">${c.format}</div>
                <div class="qplan-creative-spec">${c.spec || ''}</div>
                ${c.campaign?`<div class="qplan-creative-detail">${c.campaign}</div>`:''}
                ${c.notes?`<div class="qplan-creative-detail">${c.notes}</div>`:''}
                ${c.deadline?`<div class="qplan-creative-deadline">📅 Deadline: ${c.deadline}</div>`:''}
              </div>`).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- CO-OP FUNDING -->
      ${coop.length ? `
      <div class="qplan-section">
        <div class="qplan-section-header" onclick="qplanToggleSection(this)">
          <div class="qplan-section-header-left">
            <div class="qplan-section-icon">💰</div>
            <div class="qplan-section-title">Co-op Funding Available</div>
            <div class="qplan-section-count">${coop.length} funds</div>
          </div>
          <div class="qplan-section-chevron">▼</div>
        </div>
        <div class="qplan-section-body">
          <div class="qplan-coop-grid">
            ${coop.map(c=>`
              <div class="qplan-coop-card">
                <div class="qplan-coop-label">${c.label}</div>
                <div class="qplan-coop-val">${c.amount || 'Available'}</div>
                ${c.conditions?`<div class="qplan-coop-note">${c.conditions}</div>`:''}
                ${c.deadline?`<div class="qplan-coop-note" style="color:var(--accent);margin-top:4px">📅 ${c.deadline}</div>`:''}
              </div>`).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- MANDATORIES -->
      ${mandatories.length ? `
      <div class="qplan-section">
        <div class="qplan-section-header" onclick="qplanToggleSection(this)">
          <div class="qplan-section-header-left">
            <div class="qplan-section-icon">⚠️</div>
            <div class="qplan-section-title">Mandatories & Compliance</div>
            <div class="qplan-section-count">${mandatories.length} items</div>
          </div>
          <div class="qplan-section-chevron">▼</div>
        </div>
        <div class="qplan-section-body">
          <div style="display:flex;flex-direction:column;gap:6px">
            ${mandatories.map(m=>`
              <div style="display:flex;gap:10px;padding:8px 12px;border:1px solid #FECACA;border-radius:3px;background:#FFF5F5;font-size:12px;color:var(--ink);align-items:flex-start">
                <span style="color:var(--accent);flex-shrink:0">!</span><span>${m}</span>
              </div>`).join('')}
          </div>
          ${plan.compliance_notes ? `<div style="margin-top:12px;padding:12px;background:var(--surface);border-radius:3px;font-size:12px;color:var(--ink-soft);line-height:1.6">${plan.compliance_notes}</div>` : ''}
        </div>
      </div>` : ''}

    </div>
  `;
}


function qplanToggleSection(header) {
  header.classList.toggle('open');
  const body = header.nextElementSibling;
  if (body) body.classList.toggle('open');
}


function qplanToggleAction(brandId, quarter, idx) {
  const storeKey = 'qplan_actions_' + brandId + '_' + quarter;
  var done = QPLAN_ACTION_STATE[storeKey] || {};
  done[idx] = !done[idx];
  localStorage.setItem(storeKey, JSON.stringify(done));
  const item = document.getElementById('qaction-' + brandId + '-' + idx);
  if (item) item.classList.toggle('done', done[idx]);
}


function qplanClearActions(brandId, quarter) {
  localStorage.removeItem('qplan_actions_' + brandId + '_' + quarter);
  // Re-render by reloading from cache
  if (QPLAN_CACHE[brandId]) qplanRenderForBrand(brandId, QPLAN_CACHE[brandId]);
}


async function qplanLoadFromDb(brandId) {
  if (!SB || !SB_USER) {
    alert('Sign in to access previous plans stored in the database.');
    return;
  }
  const { data, error } = await SB.from('brand_plans').select('*').eq('brand_id', brandId).order('created_at', { ascending: false });
  if (error || !data?.length) {
    alert('No previous plans found for this brand.');
    return;
  }
  // Show picker
  const picker = document.createElement('div');
  picker.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px';
  picker.innerHTML = `
    <div style="background:#fff;border-radius:6px;width:100%;max-width:500px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.2)">
      <div style="background:var(--swansway);color:#fff;padding:14px 18px;border-bottom:2px solid var(--accent);display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:var(--font-d);font-size:15px;font-weight:700">Previous Q-Plans — ${brandId.toUpperCase()}</div>
        <button onclick="this.closest('div[style]').remove()" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer">×</button>
      </div>
      <div style="padding:16px;max-height:400px;overflow-y:auto">
        <div class="qplan-history-list">
          ${data.map(row => `
            <div class="qplan-history-item" onclick="qplanLoadRow('${brandId}',${JSON.stringify(row.extracted).replace(/'/g,'\x27')})">
              <div class="qplan-history-quarter">${row.quarter}</div>
              <div>
                <div class="qplan-history-name">${row.extracted?.document_title || row.filename}</div>
                <div class="qplan-history-meta">${row.filename} · ${new Date(row.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
              </div>
              <div class="qplan-history-load">Load →</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  picker.addEventListener('click', e => { if(e.target===picker) picker.remove(); });
  document.body.appendChild(picker);
}


function qplanLoadRow(brandId, extracted) {
  document.querySelectorAll('[style*="inset:0"][style*="z-index:600"]').forEach(el => el.remove());
  QPLAN_CACHE[brandId] = extracted;
  qplanRenderForBrand(brandId, extracted);
  const tab = document.getElementById('qplan-tab-' + brandId);
  if (tab) switchInner(brandId, 'qplan', tab);
}


async function qplanAutoLoad(brandId, brandColor) {
  if (!SB || !SB_USER) return;
  if (QPLAN_CACHE[brandId]) { qplanRenderForBrand(brandId, QPLAN_CACHE[brandId]); return; }
  const { data } = await SB.from('brand_plans').select('*').eq('brand_id', brandId).eq('status','active').order('created_at',{ ascending:false }).limit(1);
  if (data?.[0]?.extracted) {
    QPLAN_CACHE[brandId] = data[0].extracted;
    QPLAN_CACHE[brandId]._brandColor = brandColor;
    qplanRenderForBrand(brandId, QPLAN_CACHE[brandId]);
  }
}


function budgetExportCSV() {
  var rows = ['Brand,' + CAL_MONTHS.join(',') + ',Annual Planned,Total Actual'];
  BUDGET_BRANDS.forEach(function(b) {
    var cells = [];
    var brandActual = 0;
    for (var mi = 0; mi < 12; mi++) {
      var v = Math.round(b.annual / 12); // From site budgets via BUDGET_BRANDS.annual
      brandActual += v;
      cells.push(v);
    }
    rows.push(b.name + ',' + cells.join(',') + ',' + b.annual + ',' + brandActual);
  });
  var blob = new Blob([rows.join('\n')], {type:'text/csv'});
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'swansway-budget-' + PLAN_YEAR + '.csv'; a.click();
}


function budgetImportCSV() {
  var input = document.createElement('input'); input.type = 'file'; input.accept = '.csv';
  input.onchange = function(e) {
    var reader = new FileReader();
    reader.onload = function(ev) {
      var lines = ev.target.result.split('\n').slice(1);
      lines.forEach(function(line) {
        var parts = line.split(',');
        if (parts.length < 14) return;
        var brand = BUDGET_BRANDS.find(function(b) { return b.name === parts[0]; });
        if (!brand) return;
        for (var mi = 0; mi < 12; mi++) {
          var val = parseInt(parts[mi+1]);
          // Actuals now from site_budgets table
        }
      });
      saveBudgetActuals(); renderBudgetTracker();
    };
    reader.readAsText(e.target.files[0]);
  };
  input.click();
}
