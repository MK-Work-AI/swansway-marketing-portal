// v100 — inline swSocialFrom* fallbacks
if (typeof swSocialFromBrief === 'undefined') {
  window.swSocialFromBrief = function(briefId, briefData) {
    var brandId = briefData.brand_id || (briefData.brand && briefData.brand.id) || null;
    var payload = { source:'brief', brief_id:briefId, title:briefData.title||'Campaign',
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

// Swansway Marketing Portal — Brief Builder JS

// Snapshot of original bb-left sidebar HTML — restored on bbNewBrief
var BB_LEFT_ORIGINAL_HTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div class="bb-panel-eyebrow" style="margin-bottom:0">Live campaign</div><button onclick="bbNewBrief()" style="font-family:var(--font-b);font-size:10px;font-weight:700;padding:3px 9px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:rgba(255,255,255,0.8);cursor:pointer">+ New</button></div>
    <div class="bb-panel-brand" id="bbp-brand">SELECT BRAND</div>
    <div class="bb-brief-row"><div class="bb-brief-label">Dates</div><div id="bbp-dates" class="bb-brief-empty">—</div></div>
    <div class="bb-brief-row"><div class="bb-brief-label">Site</div><div id="bbp-site" class="bb-brief-empty">All sites</div></div>
    <div class="bb-brief-row"><div class="bb-brief-label">Campaign type</div><div id="bbp-type" class="bb-brief-empty">—</div></div>
    <div class="bb-brief-row"><div class="bb-brief-label">Budget</div><div id="bbp-budget" class="bb-brief-empty">—</div></div>
    <div class="bb-brief-row"><div class="bb-brief-label">Duration</div><div id="bbp-duration" class="bb-brief-empty">—</div></div>
    <div class="bb-brief-row"><div class="bb-brief-label">Audiences</div><div id="bbp-audiences" class="bb-brief-empty">—</div></div>
    <div class="bb-brief-row"><div class="bb-brief-label">Objective</div><div id="bbp-objective" class="bb-brief-empty">—</div></div>
    <div class="bb-brief-row"><div class="bb-brief-label">Proposition</div><div id="bbp-prop" class="bb-brief-empty">Not written yet</div></div>
    <div class="bb-brief-row"><div class="bb-brief-label">Primary channel</div><div id="bbp-channel" class="bb-brief-empty">—</div></div>
    <div class="bb-completeness">
      <div class="bb-comp-score" id="bb-comp-score">0%</div>
      <div class="bb-comp-label"><span>Campaign completeness</span><span id="bb-comp-label">Incomplete</span></div>
      <div class="bb-comp-track"><div class="bb-comp-fill" id="bb-comp-fill" style="width:0%"></div></div>
      <div class="bb-health" id="bb-health"></div>
    </div>

  <!-- RIGHT: Step content -->`;



function bbInit() {
  bbRenderBrands();
  bbRenderCtypes();
  bbRenderObjectives();
  bbRenderDurations();
  bbRenderPresets();
  bbOnBudget(5000);
}


function bbGoStep(n) {
  if(n > BB.step && !bbCanGoTo(n)) return;
  if (n === 3) {
    setTimeout(bbRenderBudgetIntel, 100);
    setTimeout(bbShowSplitStep, 150);
    // Restore date inputs every time step 3 is shown
    var _sd = document.getElementById('bb-start-date');
    var _ed = document.getElementById('bb-end-date');
    if (_sd && BB.start_date) _sd.value = BB.start_date;
    if (_ed && BB.end_date)   _ed.value = BB.end_date;
  }
  if (n === 5) {
    setTimeout(bbRenderStep5Context, 100);
    setTimeout(bbRenderChannelSplit, 150);  // Channel split moved to step 5
    var _notesEl = document.getElementById('bb-notes');
    if (_notesEl && BB.notes) _notesEl.value = BB.notes;
  }
  // Always clear any campaign-mode display overrides
  if (window._bbCampModeActive) {
    window._bbCampModeActive = false;
    var _canvas = document.getElementById('bb-campaign-canvas');
    if (_canvas) _canvas.style.display = 'none';
    var _left = document.getElementById('bb-left');
    if (_left && typeof BB_LEFT_ORIGINAL_HTML !== 'undefined') _left.innerHTML = BB_LEFT_ORIGINAL_HTML;
  }
  // Always clear inline display:none on steps (set by campaign mode or any other path)
  document.querySelectorAll('.bb-step').forEach(function(s){ s.classList.remove('bb-active'); s.style.display = ''; });
  var _bbRight = document.getElementById('bb-right');
  if (_bbRight) _bbRight.style.display = '';
  var _ind = document.getElementById('bb-step-indicator');
  var _prog = document.getElementById('bb-progress-track');
  if (_ind) _ind.style.display = '';
  if (_prog) _prog.style.display = '';
  var _campCanvas = document.getElementById('bb-campaign-canvas');
  if (_campCanvas) _campCanvas.style.display = 'none';
  var _campSec = document.getElementById('bb-campaign-section');
  if (_campSec && n !== 6) { _campSec.style.display = 'none'; }
  const target = document.getElementById('bb-step-'+n);
  if(target) { target.classList.add('bb-active'); target.style.display = ''; }
  BB.step = n;
  bbUpdateStepIndicator(n);
  const pf = document.getElementById('bb-progress-fill');
  if(pf) pf.style.width = ((n-1)/5*100)+'%';
  if(n===2){ var _b2=document.getElementById('bb-btn-2-next'); if(_b2) _b2.disabled=!(BB.ctype&&BB.objective); }
  if(n===3){ var _b3=document.getElementById('bb-btn-3-next'); if(_b3) _b3.disabled=!BB.duration; }
  if(n===4){ bbRenderAudiences(); }
  if(n===5){ bbRenderPESO(); bbRenderToneChips(); bbRenderKPITargets(); }
  if(n===6) bbGenerateBrief();
  // Re-apply selection highlights whenever a step is shown
  if(n<=3) bbRestoreSelections();
  const right = document.getElementById('bb-right');
  if(right) right.scrollTop = 0;
}

function bbRestoreSelections() {
  // Brand pills
  document.querySelectorAll('.bb-brand-pill').forEach(function(el) {
    el.classList.toggle('bb-selected', !!(BB.brand && el.dataset.brand === BB.brand.id));
  });
  // Campaign type cards — match by onclick attribute containing the ctype id
  document.querySelectorAll('.bb-ctype-card').forEach(function(el, i) {
    el.classList.toggle('bb-selected', !!(BB.ctype && BB_CTYPES[i] && BB_CTYPES[i].id === BB.ctype.id));
  });
  // Objective rows
  document.querySelectorAll('.bb-obj-row').forEach(function(el, i) {
    el.classList.toggle('bb-selected', !!(BB.objective && BB_OBJECTIVES[i] && BB_OBJECTIVES[i].id === BB.objective.id));
  });
  // Duration cards
  document.querySelectorAll('.bb-dur-card').forEach(function(el, i) {
    el.classList.toggle('bb-selected', !!(BB.duration && BB_DURATIONS[i] && BB_DURATIONS[i].weeks === BB.duration.weeks));
  });
  // Scope buttons
  var scopeBrand = document.getElementById('scope-brand');
  var scopeSite  = document.getElementById('scope-site');
  if (scopeBrand) scopeBrand.classList.toggle('bb-selected', BB.scope !== 'sites');
  if (scopeSite)  scopeSite.classList.toggle('bb-selected',  BB.scope === 'sites');
}


function bbCanGoTo(n) {
  // If brief is already saved/loaded, allow free navigation through all steps
  if (window._lastSavedBriefId) return true;
  if(n===2) return !!BB.brand;
  if(n===3) return !!(BB.brand && BB.ctype && BB.objective);
  if(n===4) return !!(BB.duration);
  if(n===5) return BB.audiences.length > 0;
  if(n===6) return BB.audiences.length > 0;
  return true;
}


function bbUpdateStepIndicator(active) {
  for(let i=1;i<=6;i++){
    const el = document.getElementById(`bb-si-${i}`);
    if(!el) continue;
    el.className='bb-step-item'+(i===active?' active':i<active?' done':'');
  }
}


function bbRenderBrands() {
  const el = document.getElementById('bb-brand-grid');
  if(!el) return;
  el.innerHTML = BB_BRANDS.map(b=>`
    <div class="bb-brand-pill" data-brand="${b.id}" style="--pill-color:${b.color}" onclick="bbSelectBrand('${b.id}')">
      <div class="bb-pill-check">✓</div>
      <div class="bb-pill-name" style="color:${b.color}">${b.name}</div>
      <div class="bb-pill-seg">${b.segment}</div>
      <div class="bb-pill-sites">${b.sites} site${b.sites>1?'s':''} · ${b.locations.slice(0,2).join(', ')}${b.locations.length>2?'…':''}</div>
    </div>
  `).join('');
}


function bbSelectBrand(id) {
  BB.brand = BB_BRANDS.find(b=>b.id===id);
  BB.audiences = []; BB.channels = [];
  BB.site_ids = []; BB.site_id = ''; BB.site_splits = {}; // reset sites when brand changes
  document.querySelectorAll('.bb-brand-pill').forEach(p=>p.classList.remove('bb-selected'));
  // Use data-brand attribute instead of event.currentTarget (safer)
  var pill = document.querySelector('.bb-brand-pill[data-brand="'+id+'"]');
  if (pill) pill.classList.add('bb-selected');
  document.getElementById('bb-btn-1-next').disabled = false;
  // Show scope + dates sections
  var _scope = document.getElementById('bb-scope-section');
  var _dates = document.getElementById('bb-dates-section');
  if (_scope) _scope.style.display = 'block';
  if (_dates) _dates.style.display = 'block';
  // If Specific sites picker is open, refresh it for the new brand
  var _picker = document.getElementById('bb-site-picker');
  if (_picker && _picker.style.display !== 'none') bbRenderSiteGrid();
  // Pre-populate channels from brand_channels table
  var brandChs = BRAND_CHANNELS_DATA[id] || [];
  if (brandChs.length) {
    BB.channels = brandChs.map(function(c){ return c.channel; });
  }
  // Pre-populate co-op from brand_kpis
  var bkpi = BRAND_KPIS_DATA[id];
  if (bkpi && bkpi.coop_available > 0) {
    BB.coop_available = bkpi.coop_available;
  }
  bbUpdateBrief();
  bbUpdateScienceBox();
  bbSetScope('brand', document.getElementById('scope-brand'));
  var _sc = document.getElementById('bb-scope-section');
  var _dt = document.getElementById('bb-dates-section');
  if (_sc) _sc.style.display = 'block';
  if (_dt) _dt.style.display = 'block';
  bbLoadHeadroom();
  bbRenderBrandContext();
}


function bbSetScope(scope, el) {
  // scope: 'brand' = all sites, 'sites' = custom multi-select subset
  BB.scope = scope;
  document.querySelectorAll('.bb-scope-btn').forEach(function(b){b.classList.remove('bb-selected');});
  if(el) el.classList.add('bb-selected');
  var sitePicker = document.getElementById('bb-site-picker');
  if (scope === 'sites') {
    if (sitePicker) { sitePicker.style.display = 'block'; bbRenderSiteGrid(); }
  } else {
    if (sitePicker) sitePicker.style.display = 'none';
    BB.site_id = ''; BB.site_ids = []; BB.site_splits = {};
    bbHideSplitStep();
  }
  bbUpdateBrief();
  bbLoadHeadroom();
}


function bbRenderSiteGrid() {
  var el = document.getElementById('bb-site-grid');
  if (!el) return;
  var brandId = BB.brand && BB.brand.id;
  if (!brandId) {
    el.innerHTML = '<div style="font-size:12px;color:var(--ink-soft);padding:8px">Select a brand first</div>';
    return;
  }
  var sites = (typeof HUB_SITES !== 'undefined' && Array.isArray(HUB_SITES))
    ? HUB_SITES.filter(function(s){ return s.brand_id === brandId; })
    : [];
  if (!sites.length) {
    if (typeof HUB_SITES === 'undefined' || !HUB_SITES.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--ink-soft);padding:8px">Loading…</div>';
      setTimeout(bbRenderSiteGrid, 600); return;
    }
    el.innerHTML = '<div style="font-size:12px;color:var(--ink-soft);padding:8px">No sites for ' + (BB.brand ? BB.brand.name : 'this brand') + '</div>';
    return;
  }
  var brandColor = (typeof BRAND_COLORS !== 'undefined' && brandId) ? (BRAND_COLORS[brandId] || '#1A2E4A') : '#1A2E4A';
  // Build entirely as HTML to avoid stale DOM / duplicate hint issues
  var html = '';
  sites.forEach(function(s) {
    var isSel = (BB.site_ids || []).indexOf(s.site_id) !== -1;
    html += '<div class="bb-site-tile' + (isSel ? ' bb-selected' : '') + '" data-sid="' + s.site_id + '" '
      + 'style="' + (isSel ? 'border-color:' + brandColor + ';background:' + brandColor + '12' : '') + '">'
      + '<div style="display:flex;justify-content:space-between;align-items:center">'
      + '<div style="font-weight:600">' + s.site_name + '</div>'
      + '<div class="bb-site-check" style="' + (isSel ? '' : 'display:none') + ';color:' + brandColor + ';font-weight:700;font-size:14px">✓</div>'
      + '</div>'
      + '</div>';
  });
  el.innerHTML = html;
  // Bind clicks after render
  el.querySelectorAll('.bb-site-tile').forEach(function(tile) {
    tile.addEventListener('click', function() {
      var sid = this.getAttribute('data-sid');
      var bc  = (typeof BRAND_COLORS !== 'undefined') ? (BRAND_COLORS[BB.brand.id] || '#1A2E4A') : '#1A2E4A';
      if (!BB.site_ids) BB.site_ids = [];
      var idx = BB.site_ids.indexOf(sid);
      if (idx === -1) {
        BB.site_ids.push(sid);
        this.classList.add('bb-selected');
        this.style.borderColor = bc;
        this.style.background  = bc + '12';
        this.querySelector('.bb-site-check').style.display = '';
      } else {
        BB.site_ids.splice(idx, 1);
        this.classList.remove('bb-selected');
        this.style.borderColor = '';
        this.style.background  = '';
        this.querySelector('.bb-site-check').style.display = 'none';
      }
      BB.site_id = BB.site_ids[0] || '';
      // Remove split only for deselected site; preserve others
      if (idx !== -1) delete BB.site_splits[sid];
      bbUpdateSiteCount();
      bbUpdateBrief();
      bbLoadHeadroom();
      bbShowSplitStep();
    });
  });
  // Update count display after render
  bbUpdateSiteCount();
}


function bbUpdateSiteCount() {
  var el = document.getElementById('bb-site-count');
  if (!el) return;
  var n = (BB.site_ids || []).length;
  if (n === 0) {
    el.textContent = 'Select the sites this campaign will run at';
    el.style.color = 'var(--ink-faint)';
  } else {
    el.textContent = n + ' site' + (n > 1 ? 's' : '') + ' selected';
    el.style.color = 'var(--ink)';
  }
}

function bbHideSplitStep() {
  var el = document.getElementById('bb-split-step');
  if (el) el.style.display = 'none';
}

function bbParseSiteIds(brief) {
  // site_id field may be: null, a single ID string, or a JSON array string
  if (!brief || !brief.site_id) return [];
  try {
    var parsed = JSON.parse(brief.site_id);
    if (Array.isArray(parsed)) return parsed;
  } catch(e) {}
  return [brief.site_id];
}

function bbSiteNames(siteIds) {
  if (!siteIds || !siteIds.length) return null;
  if (typeof HUB_SITES === 'undefined') return siteIds.join(', ');
  return siteIds.map(function(sid) {
    var s = HUB_SITES.find(function(s){ return s.site_id === sid; });
    return s ? s.site_name : sid;
  }).join(', ');
}

function bbShowSplitStep() {
  // Only show if multiple sites selected
  if (!BB.site_ids || BB.site_ids.length < 2) { bbHideSplitStep(); return; }
  var el = document.getElementById('bb-split-step');
  if (!el) return;
  el.style.display = 'block';
  // If panel already rendered (has rows), just refresh totals — don't wipe user edits
  var existingRows = document.getElementById('bb-split-rows');
  if (existingRows && existingRows.children.length === BB.site_ids.length) {
    bbSplitRefreshTotal();
    bbSplitRefreshDescription();
  } else {
    bbRenderSplitStep();
  }
}

function bbRenderSplitStep() {
  var el = document.getElementById('bb-split-body');
  if (!el || !BB.brand) return;
  var total = BB.budget || 0;
  var n = BB.site_ids.length;
  // Always reset splits to equal on full re-render (sites changed)
  var equal = Math.round(total / n);
  BB.site_ids.forEach(function(sid, i) {
    BB.site_splits[sid] = (i === n - 1) ? (total - equal * (n - 1)) : equal;
  });
  var html = '<div id="bb-split-desc" style="font-size:12px;font-family:var(--font-b);color:var(--ink-soft);margin-bottom:14px">'
    + 'Total campaign budget: <strong>\xA3' + total.toLocaleString() + '</strong>. Set how much each site gets.</div>';
  html += '<div id="bb-split-rows">';
  BB.site_ids.forEach(function(sid) {
    var site = (typeof HUB_SITES !== 'undefined') ? HUB_SITES.find(function(s){ return s.site_id === sid; }) : null;
    var name = site ? site.site_name : sid;
    var val = BB.site_splits[sid] || 0;
    html += '<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">'
      + '<div style="flex:1;font-family:var(--font-b);font-size:13px;font-weight:600">' + name + '</div>'
      + '<div style="display:flex;align-items:center;gap:4px">'
      + '<span style="font-family:var(--font-m);font-size:13px;color:var(--ink-soft)">\xA3</span>'
      + '<input type="number" min="0" step="100" value="' + val + '" data-sid="' + sid + '" '
      + 'style="width:100px;padding:6px 8px;border:1.5px solid var(--border);border-radius:5px;font-family:var(--font-m);font-size:13px;text-align:right" '
      + 'oninput="bbSplitInput(this)">'
      + '</div></div>';
  });
  html += '</div>';
  var sum = BB.site_ids.reduce(function(s, sid){ return s + (BB.site_splits[sid] || 0); }, 0);
  var diff = total - sum;
  var totalColor = Math.abs(diff) < 1 ? '#059669' : '#DC2626';
  html += '<div id="bb-split-total" style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:2px solid var(--border)">'
    + '<div style="font-family:var(--font-m);font-size:10px;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-soft)">Total allocated</div>'
    + '<div style="font-family:var(--font-m);font-size:14px;font-weight:700;color:' + totalColor + '">\xA3' + sum.toLocaleString()
    + (Math.abs(diff) > 0 ? ' <span style="font-size:11px;font-weight:400">(' + (diff > 0 ? '\xA3' + diff.toLocaleString() + ' unallocated' : '\xA3' + Math.abs(diff).toLocaleString() + ' over') + ')</span>' : ' \u2713')
    + '</div></div>';
  html += '<div style="margin-top:10px"><button class="bb-btn-secondary" onclick="bbSplitEqual()">Split equally</button></div>';
  el.innerHTML = html;
}

function bbSplitRefreshDescription() {
  // Update the budget total text without re-rendering the whole panel
  var desc = document.getElementById('bb-split-desc');
  if (desc) desc.innerHTML = 'Total campaign budget: <strong>\xA3' + (BB.budget || 0).toLocaleString() + '</strong>. Set how much each site gets.';
}

function bbSplitRefreshTotal() {
  // Recalculate total from current input values and update display
  var total = BB.budget || 0;
  var sum = 0;
  document.querySelectorAll('#bb-split-rows input[data-sid]').forEach(function(inp) {
    var v = parseInt(inp.value) || 0;
    BB.site_splits[inp.getAttribute('data-sid')] = v;
    sum += v;
  });
  var diff = total - sum;
  var totalColor = Math.abs(diff) < 1 ? '#059669' : '#DC2626';
  var el = document.getElementById('bb-split-total');
  if (el) el.innerHTML = '<div style="font-family:var(--font-m);font-size:10px;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-soft)">Total allocated</div>'
    + '<div style="font-family:var(--font-m);font-size:14px;font-weight:700;color:' + totalColor + '">\xA3' + sum.toLocaleString()
    + (Math.abs(diff) > 0 ? ' <span style="font-size:11px;font-weight:400">(' + (diff > 0 ? '\xA3' + diff.toLocaleString() + ' unallocated' : '\xA3' + Math.abs(diff).toLocaleString() + ' over') + ')</span>' : ' \u2713')
    + '</div>';
}

function bbSplitInput(input) {
  var sid = input.getAttribute('data-sid');
  BB.site_splits[sid] = parseInt(input.value) || 0;
  bbSplitRefreshTotal();
}

function bbSplitEqual() {
  BB.site_splits = {};
  // Full re-render with equal split from current budget
  bbRenderSplitStep();
}


function bbUpdateDateCard(startDate, endDate) {
  // Update date card display only — does NOT overwrite BB.start_date/BB.end_date
  if (!startDate || !endDate) return;
  var days  = Math.max(1, Math.round((new Date(endDate + 'T00:00:00') - new Date(startDate + 'T00:00:00')) / 86400000) + 1);
  var weeks = Math.round(days / 7);
  var partialDays = days % 7;
  BB.duration_weeks = weeks;
  BB.campaign_days  = days;
  BB.duration       = {weeks: weeks, label: weeks === 1 ? '1 week' : weeks + ' weeks'};
  var bigWeeks = document.getElementById('bb-dur-weeks-big');
  var bigLabel = document.getElementById('bb-dur-label-big');
  var bigDays  = document.getElementById('bb-dur-days-big');
  var btn3     = document.getElementById('bb-btn-3-next');
  if (bigWeeks) bigWeeks.textContent = weeks;
  if (bigLabel) bigLabel.textContent = weeks === 1 ? 'week' : 'weeks';
  if (bigDays)  bigDays.textContent  = days + ' days total' + (partialDays ? ' (' + weeks + ' weeks + ' + partialDays + ' days)' : '');
  if (btn3)     btn3.disabled = false;
  bbOnBudget(BB.budget);
  bbUpdateBrief();
  bbLoadHeadroom();
}

function bbOnDateChange() {
  var sd = document.getElementById('bb-start-date');
  var ed = document.getElementById('bb-end-date');
  BB.start_date = sd ? sd.value : '';
  BB.end_date   = ed ? ed.value : '';

  if (BB.start_date && BB.end_date) {
    var days = Math.max(1, Math.round((new Date(BB.end_date + 'T00:00:00') - new Date(BB.start_date + 'T00:00:00')) / 86400000) + 1);
    var weeks = Math.round(days / 7);
    var partialDays = days % 7;
    BB.duration_weeks = weeks;
    BB.campaign_days = days;
    BB.duration = {weeks: weeks, label: weeks === 1 ? '1 week' : weeks + ' weeks'};
    // Update big duration display
    var bigWeeks = document.getElementById('bb-dur-weeks-big');
    var bigLabel = document.getElementById('bb-dur-label-big');
    var bigDays  = document.getElementById('bb-dur-days-big');
    if (bigWeeks) bigWeeks.textContent = weeks;
    if (bigLabel) bigLabel.textContent = weeks === 1 ? 'week' : 'weeks';
    if (bigDays)  bigDays.textContent  = days + ' days total' + (partialDays ? ' (' + weeks + ' weeks + ' + partialDays + ' days)' : '');
    var btn3 = document.getElementById('bb-btn-3-next');
    if (btn3) btn3.disabled = false;
  } else {
    BB.campaign_days = 0;
    var bigWeeks = document.getElementById('bb-dur-weeks-big');
    var bigLabel = document.getElementById('bb-dur-label-big');
    var bigDays  = document.getElementById('bb-dur-days-big');
    if (bigWeeks) bigWeeks.textContent = '—';
    if (bigLabel) bigLabel.textContent = 'Set dates below';
    if (bigDays)  bigDays.textContent  = '';
  }
  bbOnBudget(BB.budget);
  bbUpdateBrief();
  bbLoadHeadroom();
}


function bbGetCampaignMonths(startDate, endDate) {
  if (!startDate || !endDate) return [];
  var months = [];
  var cur = new Date(startDate + 'T00:00:00');
  var end = new Date(endDate + 'T00:00:00');
  var seen = {};
  while (cur <= end) {
    var mi = cur.getMonth();
    if (!seen[mi]) { seen[mi] = true; months.push({ index: mi }); }
    cur.setDate(cur.getDate() + 1);
  }
  return months;
}


async function bbLoadHeadroom() {
  var barEl = document.getElementById('bb-headroom-bar');
  if (!barEl) return;
  var brandId = BB.brand ? BB.brand.id : null;
  if (!BB.start_date || !BB.end_date || !brandId) { barEl.style.display = 'none'; return; }
  var months = bbGetCampaignMonths(BB.start_date, BB.end_date);
  if (!months.length) { barEl.style.display = 'none'; return; }
  var sites = (BB.scope === 'sites' && BB.site_ids && BB.site_ids.length)
    ? BB.site_ids
    : HUB_SITES.filter(function(s){ return s.brand_id === brandId; }).map(function(s){ return s.site_id; });
  var siteId = BB.scope === 'sites' ? (BB.site_ids[0] || null) : null;
  if (!sites.length) { barEl.style.display = 'none'; return; }
  var totalPlanned = 0;
  sites.forEach(function(sid) {
    var d = SITE_BUDGETS[sid] || {};
    months.forEach(function(m) { totalPlanned += (d['m' + m.index + '_planned'] || 0); });
  });
  var committed = 0;
  try {
    var anon = SUPABASE_ANON_KEY;
    var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
    var rows = await fetch(base + '/brief_budget_commitments?year=eq.' + PLAN_YEAR + '&site_id=in.(' + sites.join(',') + ')&select=brief_id,site_id,month_index,amount', {
      headers: getAuthHeaders()
    }).then(function(r){ return r.json(); });
    if (Array.isArray(rows)) {
      var mSet = new Set(months.map(function(m){ return m.index; }));
      rows.forEach(function(r) {
        if (mSet.has(r.month_index) && r.brief_id !== window._lastSavedBriefId) committed += (r.amount || 0);
      });
    }
  } catch(e) {}
  var available = totalPlanned - committed;
  var pct = totalPlanned > 0 ? Math.round(committed / totalPlanned * 100) : 0;
  var scopeLabel = (BB.scope === 'sites' && BB.site_ids && BB.site_ids.length)
    ? (BB.site_ids.length === 1
        ? ((HUB_SITES.find(function(s){ return s.site_id === BB.site_ids[0]; }) || {}).site_name || BB.site_ids[0])
        : BB.site_ids.length + ' sites')
    : (BB.brand.name + ' (all sites)');
  barEl.style.display = 'block';
  var avColour = available >= BB.budget ? '#059669' : '#DC2626';
  var barColour = pct > 80 ? '#DC2626' : pct > 50 ? '#D97706' : '#059669';
  barEl.innerHTML = '<div style="background:var(--white);border:1.5px solid var(--border);border-radius:8px;padding:12px 16px">'
    + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">'
    + '<div style="font-size:11px;font-family:var(--font-m);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft)">Budget headroom \u00b7 ' + scopeLabel + '</div>'
    + '<div style="font-size:13px;font-weight:700;color:' + avColour + '">\u00a3' + available.toLocaleString() + ' available</div>'
    + '</div>'
    + '<div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">'
    + '<div style="height:6px;border-radius:3px;background:' + barColour + ';width:' + Math.min(100,pct) + '%"></div>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;margin-top:4px;font-size:10px;color:var(--ink-faint)">'
    + '<span>\u00a3' + committed.toLocaleString() + ' already committed</span>'
    + '<span>\u00a3' + totalPlanned.toLocaleString() + ' planned</span>'
    + '</div></div>';
}


function bbRenderCtypes() {
  const el = document.getElementById('bb-ctype-grid');
  if(!el) return;
  el.innerHTML = BB_CTYPES.map(c=>`
    <div class="bb-ctype-card" onclick="bbSelectCtype('${c.id}')">
      <div class="bb-ctype-icon">${c.icon}</div>
      <div class="bb-ctype-name">${c.name}</div>
      <div class="bb-ctype-desc">${c.desc}</div>
    </div>
  `).join('');
}


function bbSelectCtype(id) {
  BB.ctype = BB_CTYPES.find(c=>c.id===id);
  document.querySelectorAll('.bb-ctype-card').forEach(c=>c.classList.remove('bb-selected'));
  event.currentTarget.classList.add('bb-selected');
  bbCheckStep2();
  bbUpdateBrief();
}


function bbRenderObjectives() {
  const el = document.getElementById('bb-obj-grid');
  if(!el) return;
  el.innerHTML = BB_OBJECTIVES.map(o=>`
    <div class="bb-obj-row" onclick="bbSelectObj('${o.id}')">
      <div class="bb-obj-num">${o.num}</div>
      <div><div class="bb-obj-text">${o.text}</div><div class="bb-obj-kpi">${o.kpi}</div></div>
      <div class="bb-obj-funnel">${o.funnel}</div>
    </div>
  `).join('');
}


function bbSelectObj(id) {
  BB.objective = BB_OBJECTIVES.find(o=>o.id===id);
  document.querySelectorAll('.bb-obj-row').forEach(r=>r.classList.remove('bb-selected'));
  event.currentTarget.classList.add('bb-selected');
  bbCheckStep2();
  bbUpdateBrief();
}


function bbCheckStep2() {
  const btn = document.getElementById('bb-btn-2-next');
  if(btn) btn.disabled = !(BB.ctype && BB.objective);
}


function bbOnBudget(v) {
  BB.budget = parseInt(v);
  const el = document.getElementById('bb-budget-display');
  const sub = document.getElementById('bb-budget-sub');
  const slider = document.getElementById('bb-slider');
  if(el) el.textContent = '£'+BB.budget.toLocaleString();
  if(slider) slider.value = BB.budget;
  // Subline
  // Use actual campaign days if set, otherwise fall back to duration weeks
  var totalDays = BB.campaign_days || (BB.duration ? BB.duration.weeks * 7 : 28);
  var totalWeeks = Math.max(1, Math.round(totalDays / 7));
  const weekly = Math.round(BB.budget / totalWeeks);
  const daily = Math.round(BB.budget / totalDays);
  let warn = '';
  if(BB.ctype?.id==='plate' && BB.budget<5000) warn = ' ⚠ Plate change needs £5K+ to cut through';
  else if(BB.ctype?.id==='brand' && BB.budget<3000) warn = ' ⚠ Brand campaigns need £3K+/month minimum';
  else if(BB.ctype?.id==='ev' && BB.budget<2000) warn = ' ⚠ EV education needs reach — consider £2K+';
  else warn = ' ✓ Good for this campaign type';
  if(sub) sub.textContent = `£${weekly.toLocaleString()}/week · £${daily.toLocaleString()}/day${warn}`;
  document.querySelectorAll('.bb-preset').forEach(p=>p.classList.toggle('bb-active',parseInt(p.dataset.v)===BB.budget));
  bbUpdateScienceBox();
  bbUpdateMaturity();
  bbRenderChannelSplit();
  bbUpdateBrief();
  const btn3 = document.getElementById('bb-btn-3-next');
  if(btn3 && BB.duration) btn3.disabled = false;
  bbRenderBudgetIntel();
}


function bbUpdateScienceBox() {
  const el = document.getElementById('bb-science-text');
  if(!el) return;
  const estReach = Math.round(BB.budget * 18);
  el.innerHTML = `To grow, brands must reach <strong>light category buyers</strong> — not just loyalists. Your <strong>£${BB.budget.toLocaleString()}</strong> budget delivers an estimated reach of <strong>${estReach.toLocaleString()} consumers/month</strong> in your catchment. Ehrenberg-Bass recommends reaching <strong>5–8× target sales volume</strong> in monthly impressions to build genuine mental availability.`;
}


function bbRenderDurations() {
  // Duration cards replaced by live date-driven display
}


function bbSelectDur(weeks, label) {
  BB.duration = {weeks, label};
  document.querySelectorAll('.bb-dur-card').forEach(d=>d.classList.remove('bb-selected'));
  event.currentTarget.classList.add('bb-selected');
  // Auto-calculate end date from start date + duration
  var sdEl = document.getElementById('bb-start-date');
  var edEl = document.getElementById('bb-end-date');
  var autoLabel = document.getElementById('bb-end-date-auto');
  if (sdEl && sdEl.value && edEl) {
    var start = new Date(sdEl.value + 'T00:00:00');
    var end = new Date(start);
    end.setDate(end.getDate() + (weeks * 7) - 1);
    edEl.value = end.toISOString().split('T')[0];
    BB.start_date = sdEl.value;
    BB.end_date = edEl.value;
    var durEl = document.getElementById('bb-date-duration');
    if (durEl) durEl.textContent = weeks + ' weeks · ' + (weeks * 7) + ' days';
    if (autoLabel) autoLabel.style.display = '';
  } else if (autoLabel) {
    autoLabel.style.display = '';
  }
  const btn = document.getElementById('bb-btn-3-next');
  if(btn && (BB.start_date || true)) btn.disabled = false;
  bbOnBudget(BB.budget);
  bbUpdateBrief();
}


function bbRenderPresets() {
  const el = document.getElementById('bb-presets');
  if(!el) return;
  el.innerHTML = BB_PRESETS.map(v=>`<button class="bb-preset" data-v="${v}" onclick="bbSetBudget(${v})">£${v>=1000?(v/1000)+'K':v}</button>`).join('');
}


function bbSetBudget(v) { BB.budget=v; document.getElementById('bb-slider').value=v; bbOnBudget(v); }


function bbGetAllocation() {
  const ct = BB.ctype?.id || 'launch';
  return {
    plate:    [{n:'Google Search PPC',p:30,c:'#FF6B35'},{n:'Meta Ads',p:25,c:'#A855F7'},{n:'AutoTrader',p:20,c:'#4ECDC4'},{n:'CRM & Email',p:10,c:'#22C55E'},{n:'Organic Social',p:8,c:'#FFC800'},{n:'SEO & Local',p:7,c:'#60A5FA'}],
    launch:   [{n:'YouTube Pre-Roll',p:22,c:'#FF0000'},{n:'Meta / Instagram',p:22,c:'#A855F7'},{n:'Google Search PPC',p:20,c:'#FF6B35'},{n:'AutoTrader',p:15,c:'#4ECDC4'},{n:'PR & Media',p:8,c:'#FFC800'},{n:'CRM Email',p:8,c:'#22C55E'},{n:'Content',p:5,c:'#60A5FA'}],
    ev:       [{n:'Google EV Search',p:28,c:'#FF6B35'},{n:'YouTube Education',p:20,c:'#FF0000'},{n:'Meta (EV audience)',p:18,c:'#A855F7'},{n:'Content & Blog',p:12,c:'#22C55E'},{n:'CRM (EV prospects)',p:10,c:'#4ECDC4'},{n:'Influencer/PR',p:8,c:'#FFC800'},{n:'AutoTrader EV',p:4,c:'#60A5FA'}],
    aftersales:[{n:'CRM & Email',p:40,c:'#22C55E'},{n:'SMS / Push',p:20,c:'#4ECDC4'},{n:'Google Search',p:20,c:'#FF6B35'},{n:'Meta Retargeting',p:12,c:'#A855F7'},{n:'Organic Social',p:8,c:'#FFC800'}],
    fleet:    [{n:'LinkedIn B2B',p:35,c:'#0077B5'},{n:'Google B2B Search',p:20,c:'#FF6B35'},{n:'Direct Mail',p:18,c:'#4ECDC4'},{n:'Events / Drive Days',p:15,c:'#22C55E'},{n:'Trade Press',p:7,c:'#FFC800'},{n:'CRM',p:5,c:'#A855F7'}],
    used:     [{n:'AutoTrader Premier',p:35,c:'#4ECDC4'},{n:'Google Shopping',p:22,c:'#FF6B35'},{n:'Meta Retargeting',p:18,c:'#A855F7'},{n:'CarGurus',p:12,c:'#22C55E'},{n:'CRM Email',p:8,c:'#FFC800'},{n:'Organic Social',p:5,c:'#60A5FA'}],
    brand:    [{n:'YouTube Brand Video',p:30,c:'#FF0000'},{n:'Meta Awareness',p:25,c:'#A855F7'},{n:'Google Display',p:15,c:'#FF6B35'},{n:'Content & SEO',p:12,c:'#22C55E'},{n:'PR & Media',p:10,c:'#FFC800'},{n:'Influencer',p:8,c:'#4ECDC4'}],
    event:    [{n:'CRM Email Invite',p:30,c:'#22C55E'},{n:'Meta Events',p:25,c:'#A855F7'},{n:'Google Local',p:15,c:'#FF6B35'},{n:'Organic Social',p:15,c:'#4ECDC4'},{n:'OOH / Local Press',p:10,c:'#FFC800'},{n:'SMS',p:5,c:'#60A5FA'}],
  }[ct] || [{n:'Google PPC',p:40,c:'#FF6B35'},{n:'Meta Ads',p:30,c:'#A855F7'},{n:'CRM',p:20,c:'#22C55E'},{n:'SEO',p:10,c:'#4ECDC4'}];
}



/* ══════════════════════════════════════════════════════════
   CHANNEL BUDGET SPLIT
══════════════════════════════════════════════════════════ */

function bbRenderChannelSplit() {
  var section = document.getElementById('bb-channel-split-section');
  var list    = document.getElementById('bb-channel-split-list');
  if (!section || !list) return;

  // Use selected channels, or all PESO channels as default if none selected yet
  var channelIds = BB.channels || [];
  if (!channelIds.length && typeof BB_PESO !== 'undefined') {
    Object.values(BB_PESO).forEach(function(quad) {
      (quad.channels||[]).forEach(function(ch) { if (!channelIds.includes(ch.id)) channelIds.push(ch.id); });
    });
  }
  if (!channelIds.length || !BB.budget) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  // Build id→{name,color} lookup from BB_PESO
  var pesoMap = {};
  var pesoColors = { P:'#FF6B35', E:'#4ECDC4', S:'#A855F7', O:'#22C55E' };
  if (typeof BB_PESO !== 'undefined') {
    Object.keys(BB_PESO).forEach(function(key) {
      var quad = BB_PESO[key];
      (quad.channels || []).forEach(function(ch) {
        pesoMap[ch.id] = { name: ch.name, color: pesoColors[key] || '#6B7280' };
      });
    });
  }

  // Sync BB.channel_split — remove deselected, add new
  if (!BB.channel_split || typeof BB.channel_split !== 'object') BB.channel_split = {};
  Object.keys(BB.channel_split).forEach(function(id) {
    if (!channelIds.includes(id)) delete BB.channel_split[id];
  });
  channelIds.forEach(function(id) {
    if (BB.channel_split[id] === undefined) BB.channel_split[id] = 0;
  });

  list.innerHTML = channelIds.map(function(id) {
    var val  = BB.channel_split[id] || 0;
    var pct  = BB.budget > 0 ? Math.round(val / BB.budget * 100) : 0;
    var info = pesoMap[id] || { name: id, color: '#6B7280' };
    return '<div class="bb-ch-split-row">'
      + '<div class="bb-ch-split-dot" style="background:' + info.color + '"></div>'
      + '<div class="bb-ch-split-name">' + info.name + '</div>'
      + '<input class="bb-ch-split-input" type="number" min="0" value="' + val
      + '" data-channel="' + id + '" onchange="bbOnChannelSplit(this.dataset.channel,this.value)" oninput="bbOnChannelSplit(this.dataset.channel,this.value)">'
      + '<div class="bb-ch-split-pct">' + pct + '%</div>'
      + '<div style="height:4px;background:var(--surface);border-radius:2px;overflow:hidden">'
      +   '<div style="width:' + Math.min(pct,100) + '%;height:100%;background:' + info.color + ';border-radius:2px;transition:width 0.3s"></div>'
      + '</div>'
      + '</div>';
  }).join('');

  bbUpdateSplitTotal();
}

function bbOnChannelSplit(channel, value) {
  BB.channel_split[channel] = parseFloat(value) || 0;
  bbUpdateSplitTotal();
  bbUpdateBrief();
}

function bbUpdateSplitTotal() {
  var channels = BB.channels || [];
  var total = channels.reduce(function(s,ch){ return s + (BB.channel_split[ch]||0); }, 0);
  var totalEl  = document.getElementById('bb-split-total');
  var statusEl = document.getElementById('bb-split-status');
  if (totalEl)  totalEl.textContent = '£' + total.toLocaleString();
  if (statusEl) {
    var diff = BB.budget - total;
    if (Math.abs(diff) < 1) {
      statusEl.textContent = '✓ Fully allocated';
      statusEl.style.color = '#059669';
    } else if (diff > 0) {
      statusEl.textContent = '£' + diff.toLocaleString() + ' unallocated';
      statusEl.style.color = '#D97706';
    } else {
      statusEl.textContent = '£' + Math.abs(diff).toLocaleString() + ' over budget';
      statusEl.style.color = '#DC2626';
    }
  }
}

function bbAutoSplitChannels() {
  var channels = BB.channels || [];
  if (!channels.length || !BB.budget) return;
  var perChannel = Math.round(BB.budget / channels.length);
  var remainder  = BB.budget - (perChannel * (channels.length - 1));
  channels.forEach(function(ch, i) {
    BB.channel_split[ch] = (i === channels.length - 1) ? remainder : perChannel;
  });
  bbRenderChannelSplit();
  bbUpdateBrief();
}

function bbRenderAllocation() {
  const el = document.getElementById('bb-alloc-list');
  if(!el) return;
  const alloc = bbGetAllocation();
  el.innerHTML = alloc.map(a=>`
    <div class="bb-alloc-row">
      <div class="bb-alloc-name">${a.n}</div>
      <div class="bb-alloc-track"><div class="bb-alloc-fill" style="width:${a.p}%;background:${a.c}"></div></div>
      <div class="bb-alloc-pct">${a.p}%</div>
      <div class="bb-alloc-amt">£${Math.round(BB.budget*a.p/100).toLocaleString()}</div>
    </div>
  `).join('');
}


function bbGetAudiences() {
  const ct = BB.ctype?.id;
  if(ct==='fleet') return BB_AUDIENCES.fleet;
  if(ct==='ev') return BB_AUDIENCES.ev;
  return BB_AUDIENCES.default;
}


function bbRenderAudiences() {
  const el = document.getElementById('bb-aud-grid');
  if(!el) return;
  const auds = bbGetAudiences();
  el.innerHTML = auds.map(a=>`
    <div class="bb-aud-card ${BB.audiences.includes(a.id)?'bb-selected':''}" onclick="bbToggleAud('${a.id}')">
      <div class="bb-aud-icon">${a.icon}</div>
      <div>
        <div class="bb-aud-name">${a.name}</div>
        <div class="bb-aud-desc">${a.desc}</div>
        <div class="bb-aud-tags">${a.tags.map(t=>`<span class="bb-aud-tag">${t}</span>`).join('')}</div>
        <div style="margin-top:8px;font-size:11px;color:var(--ink-soft)">
          Est. CPL: <strong style="color:var(--ink)">£${Math.round((BB.brand?.cpl?.meta||45)*a.cpl_mult)}</strong> (Meta) ·
          <strong style="color:var(--ink)">£${Math.round((BB.brand?.cpl?.google||35)*a.cpl_mult)}</strong> (Search)
        </div>
      </div>
      <div class="bb-aud-meta">
        <div class="bb-aud-size">${a.size}</div>
        <div class="bb-aud-check">✓</div>
      </div>
    </div>
  `).join('');
  // Enable/disable next button based on current selection
  var _btn4 = document.getElementById('bb-btn-4-next');
  if (_btn4) _btn4.disabled = BB.audiences.length === 0;
}


function bbToggleAud(id) {
  const idx = BB.audiences.indexOf(id);
  if(idx>-1) BB.audiences.splice(idx,1);
  else { if(BB.audiences.length>=3) BB.audiences.shift(); BB.audiences.push(id); }
  bbRenderAudiences();
  const btn = document.getElementById('bb-btn-4-next');
  if(btn) btn.disabled = BB.audiences.length===0;
  bbUpdateBrief();
}


function bbUpdateMaturity() {
  const b = BB.budget;
  const level = b<2000?1:b<5000?2:b<15000?3:b<40000?4:5;
  const labels = ['Tactical Paid','Paid + Owned','Integrated PESO','PESO Leadership','PESO Mature System'];
  const texts = [
    'Level 1 — <strong>Tactical Paid only:</strong> Budget supports one or two paid channels. Focus on Google Search + AutoTrader for bottom-funnel intent. Build owned assets in parallel.',
    'Level 2 — <strong>Paid + Owned:</strong> Add Meta retargeting and email CRM. Two-channel attribution starts working. Foundational content helps SEO compound over time.',
    'Level 3 — <strong>Integrated PESO:</strong> Full activation possible. Paid drives reach, owned converts, shared builds community. This is where most Swansway campaigns should operate.',
    'Level 4 — <strong>PESO Leadership:</strong> Budget allows top-funnel investment. YouTube for brand, PR for credibility, influencer for community. Arnold Clark and Lookers operate here.',
    'Level 5 — <strong>PESO Mature System:</strong> Full integrated system — paid amplifies earned, owned compounds, shared becomes its own media channel. Manufacturer-scale thinking.',
  ];
  const pips = document.getElementById('bb-maturity-pips');
  const txt  = document.getElementById('bb-maturity-text');
  const lbl  = document.getElementById('bb-maturity-level-label');
  if(pips) pips.innerHTML = Array.from({length:5},(_,i)=>`<div class="bb-maturity-pip ${i<level?'bb-active':''}"></div>`).join('');
  if(txt)  txt.innerHTML  = texts[level-1];
  if(lbl)  lbl.textContent = `Level ${level} — ${labels[level-1]}`;
}


function bbRenderPESO() {
  const el = document.getElementById('bb-peso-grid');
  if(!el) return;
  const ct  = BB.ctype?.id || 'launch';
  const bid = BB.brand?.id || '';
  // Capture any previously saved channels before resetting (used to restore when editing)
  var _savedChannels = BB.channels ? BB.channels.slice() : [];
  BB.channels = [];

  el.innerHTML = Object.entries(BB_PESO).map(([key,quad])=>`
    <div class="bb-peso-q bb-peso-${key}">
      <div class="bb-peso-letter">${key}</div>
      <div class="bb-peso-title">${quad.label}</div>
      <div class="bb-peso-subtitle">${quad.sub}</div>
      <div>${quad.channels.map(ch=>{
        let pct = ch.base||0;
        if(ct==='ev'&&ch.ev)pct+=ch.ev;
        if(ct==='fleet'&&ch.fleet)pct+=ch.fleet;
        if(ct==='brand'&&ch.brand)pct+=ch.brand;
        if(ct==='launch'&&ch.launch)pct+=ch.launch;
        if(ct==='event'&&ch.event)pct+=ch.event;
        if(ct==='aftersales'&&ch.aftersales)pct+=ch.aftersales;
        if(bid==='cupra'&&ch.cupra)pct+=ch.cupra;
        if(bid==='seat'&&ch.seat)pct+=ch.seat;
        pct=Math.max(0,pct);
        const active = pct>0;
        if(active && !BB.channels.includes(ch.id)) BB.channels.push(ch.id);
        return `<div class="bb-ch-row ${active?'bb-ch-active':''}" onclick="bbToggleCh('${ch.id}',this)">
          <div class="bb-ch-name">${ch.name}</div>
          <div class="bb-ch-pct">${pct>0?pct+'%':'—'}</div>
        </div>${active?`<div class="bb-ch-bar"><div class="bb-ch-bar-fill" style="width:${Math.min(pct*3,100)}%"></div></div>`:''}`;
      }).join('')}</div>
    </div>
  `).join('');
  // If editing an existing brief with saved channels, restore them
  // by reconciling science-based selection with saved user selection
  if (_savedChannels.length) {
    BB.channels = _savedChannels;
    bbRenderChannelSplit();
    // Update visual state: active = in saved channels, inactive = not in saved channels
    el.querySelectorAll('.bb-ch-row').forEach(function(row) {
      // Extract channel id from onclick: bbToggleCh('id', this)
      var match = row.getAttribute('onclick') && row.getAttribute('onclick').match(/bbToggleCh\('([^']+)'/);
      if (match) {
        var chId = match[1];
        row.classList.toggle('bb-ch-active', _savedChannels.indexOf(chId) !== -1);
      }
    });
    // Also hide/show the bar fill rows
    el.querySelectorAll('.bb-ch-bar').forEach(function(bar) {
      var row = bar.previousElementSibling;
      if (row) bar.style.display = row.classList.contains('bb-ch-active') ? '' : 'none';
    });
  }
  bbUpdateBrief();
  var _b5=document.getElementById('bb-btn-5-next'); if(_b5) _b5.disabled=BB.channels.length===0;
}


function bbToggleCh(id, row) {
  const idx = BB.channels.indexOf(id);
  if(idx>-1) BB.channels.splice(idx,1); else BB.channels.push(id);
  row.classList.toggle('bb-ch-active');
  bbRenderChannelSplit();
  bbUpdateBrief();
}


function bbRenderToneChips() {
  const el = document.getElementById('bb-tone-chips');
  if(!el||!BB.brand) return;
  el.innerHTML = BB.brand.tone.map((t,i)=>`
    <div class="bb-tone-chip ${i<3?'bb-active':''}" onclick="this.classList.toggle('bb-active')">${t}</div>
  `).join('');
}


function bbRenderKPITargets() {
  const el = document.getElementById('bb-kpi-targets');
  if(!el||!BB.objective) return;
  const kpiMap = {
    units:    [{l:'Units target',v:`${Math.round(BB.budget/800)} units`},{l:'Enquiries target',v:`${Math.round(BB.budget/120)}/mo`},{l:'Est. conv. rate',v:`${BB.brand?.id==='landrover'?'18':'10–12'}%`}],
    leads:    [{l:'Lead target',v:`${Math.round(BB.budget/(BB.brand?.cpl?.meta||45))}/mo`},{l:'Target CPL',v:`£${BB.brand?.cpl?.meta||45}`},{l:'SQL rate',v:'25–35%'}],
    testdrive:[{l:'Test drives',v:`${Math.round(BB.budget/180)}`},{l:'Show rate',v:'65–75%'},{l:'Post-TD conversion',v:'22–30%'}],
    awareness:[{l:'Target reach',v:`${(BB.budget*18).toLocaleString()}`},{l:'Frequency',v:'4–7×'},{l:'Share of search uplift',v:'+15%'}],
    retention:[{l:'CRM open rate',v:'28–35%'},{l:'Service bookings',v:`+${Math.round(BB.budget/50)}/mo`},{l:'Loyalty rate target',v:'45%+'}],
    conquest: [{l:'Conquest leads',v:`${Math.round(BB.budget/200)}/mo`},{l:'Est. CPconquest',v:`£${Math.round((BB.brand?.cpl?.meta||45)*1.4)}`},{l:'PX models in',v:`${Math.round(BB.budget/1200)}`}],
    event:    [{l:'RSVPs target',v:`${Math.round(BB.budget/40)}`},{l:'Show rate',v:'55–70%'},{l:'Post-event orders',v:`${Math.round(BB.budget/600)}`}],
  };
  const kpis = kpiMap[BB.objective?.id] || kpiMap.leads;
  el.innerHTML = kpis.map(k=>`
    <div class="bb-kpi-item"><div class="bb-kpi-item-label">${k.l}</div><div class="bb-kpi-item-val">${k.v}</div></div>
  `).join('');
}


function bbUpdateBrief() {
  const setVal = (id,html,isEmpty) => {
    const el=document.getElementById(id);
    if(el) el.innerHTML = isEmpty?`<div class="bb-brief-empty">${html}</div>`:`<div class="bb-brief-val">${html}</div>`;
  };
  const pan = document.getElementById('bbp-brand');
  if(pan && BB.brand) { pan.textContent=BB.brand.name.toUpperCase(); pan.style.color='#fff'; }
  else if(pan) { pan.textContent='SELECT BRAND'; pan.style.color='rgba(255,255,255,0.2)'; }
  // Dates
  if (BB.start_date && BB.end_date) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var sd = new Date(BB.start_date + 'T00:00:00'), ed = new Date(BB.end_date + 'T00:00:00');
    var dStr = sd.getDate() + ' ' + months[sd.getMonth()] + ' – ' + ed.getDate() + ' ' + months[ed.getMonth()] + ' ' + ed.getFullYear();
    setVal('bbp-dates', dStr, false);
  } else {
    setVal('bbp-dates', '—', true);
  }
  // Site
  if (BB.scope === 'sites' && BB.site_ids && BB.site_ids.length) {
    setVal('bbp-site', bbSiteNames(BB.site_ids) || (BB.site_ids.length + ' sites'), false);
  } else {
    setVal('bbp-site', BB.brand ? BB.brand.name + ' (all sites)' : 'All sites', !BB.brand);
  }
  setVal('bbp-type', BB.ctype?BB.ctype.name:'—', !BB.ctype);
  setVal('bbp-budget', BB.budget?`£${BB.budget.toLocaleString()}${BB.duration?' over '+BB.duration.weeks+' weeks':''}`:' —', !BB.budget);
  setVal('bbp-duration', BB.duration?`${BB.duration.weeks} weeks (${BB.duration.label})`:'—', !BB.duration);
  setVal('bbp-objective', BB.objective?BB.objective.text:'—', !BB.objective);
  const smp = document.getElementById('bb-smp')?.value || '';
  setVal('bbp-prop', smp?smp.substring(0,70)+(smp.length>70?'…':''):'Not written yet', !smp);

  // Audiences
  const allAuds = [...BB_AUDIENCES.default,...BB_AUDIENCES.ev,...BB_AUDIENCES.fleet];
  const selAuds = BB.audiences.map(id=>allAuds.find(a=>a.id===id)).filter(Boolean);
  setVal('bbp-audiences', selAuds.length?selAuds.map(a=>a.name).join(' · '):'—', !selAuds.length);

  // Primary channel
  if(BB.channels.length) {
    const allChs = Object.values(BB_PESO).flatMap(q=>q.channels);
    const ch = allChs.find(c=>c.id===BB.channels[0]);
    setVal('bbp-channel', `${ch?.name||BB.channels[0]}${BB.channels.length>1?' +'+( BB.channels.length-1)+' more':''}`, false);
  } else { setVal('bbp-channel','—',true); }

  bbUpdateCompleteness();
}


function bbUpdateCompleteness() {
  const smp = document.getElementById('bb-smp')?.value||'';
  const fields = [BB.brand, BB.ctype, BB.objective, BB.budget>0, BB.duration, BB.audiences.length>0, smp.length>10, BB.channels.length>0];
  const done = fields.filter(Boolean).length;
  const pct  = Math.round(done/fields.length*100);
  const scoreEl = document.getElementById('bb-comp-score');
  const fillEl  = document.getElementById('bb-comp-fill');
  const lblEl   = document.getElementById('bb-comp-label');
  if(scoreEl) scoreEl.textContent = pct+'%';
  if(fillEl)  fillEl.style.width  = pct+'%';
  if(lblEl)   lblEl.textContent   = pct===100?'Complete ✓':pct>70?'Almost there':pct>40?'Taking shape':'Incomplete';

  const checks = [];
  if(!BB.brand) checks.push({i:'○',t:'Select a brand to unlock brand-specific CPL data'});
  if(BB.audiences.length===1) checks.push({i:'💡',t:'Add a 2nd audience — 95% of buyers aren\'t in-market now (Byron Sharp)'});
  if(BB.budget<2000&&BB.ctype?.id==='plate') checks.push({i:'⚠',t:'Plate change budget below recommended minimum (£5K)'});
  if(!smp) checks.push({i:'○',t:'Write your proposition — the most important creative decision'});
  if(pct===100) checks.push({i:'✓',t:'Campaign complete. Click "Generate full summary" to finish.'});
  const hEl = document.getElementById('bb-health');
  if(hEl) hEl.innerHTML = checks.map(c=>`<div class="bb-health-item"><div style="flex-shrink:0">${c.i}</div><div>${c.t}</div></div>`).join('');
}


function bbGenerateBrief() {
  // Show save bar if logged in
  const saveBar = document.getElementById('bb-save-bar');
  const feedback = document.getElementById('bb-save-feedback');
  if(saveBar) {
    saveBar.style.display = 'block';
    const saveBtn = document.getElementById('bb-save-btn');
    if(saveBtn) {
      saveBtn.disabled = false; saveBtn.style.background = '';
      if (!SB_USER) {
        saveBtn.textContent = 'Sign in to save';
      } else if (window._lastSavedBriefId) {
        saveBtn.textContent = 'Update campaign';
        const _ti = document.getElementById('bb-brief-title');
        if (_ti && window._lastSavedBriefTitle) _ti.value = window._lastSavedBriefTitle;
      } else {
        saveBtn.textContent = 'Save campaign';
      }
    }
  }
  if(feedback) { feedback.style.display='none'; feedback.textContent=''; }
  // Auto-fill title
  const titleInput = document.getElementById('bb-brief-title');
  if(titleInput && !titleInput.value && BB.brand && BB.ctype) {
    const d = new Date(); const mo = d.toLocaleString('en-GB',{month:'long'}); const yr = d.getFullYear();
    titleInput.value = BB.brand.name+' — '+BB.ctype.name+' '+mo+' '+yr;
  }
  const alloc = bbGetAllocation();
  const allAuds = [...BB_AUDIENCES.default,...BB_AUDIENCES.ev,...BB_AUDIENCES.fleet];
  const selAuds = BB.audiences.map(id=>allAuds.find(a=>a.id===id)).filter(Boolean);
  const kpiMap = {
    units:`${Math.round(BB.budget/800)} units`,leads:`${Math.round(BB.budget/(BB.brand?.cpl?.meta||45))}/month`,
    testdrive:`${Math.round(BB.budget/180)} test drives`,awareness:`${(BB.budget*18).toLocaleString()} reach`,
    retention:`+${Math.round(BB.budget/50)} bookings`,conquest:`${Math.round(BB.budget/200)} conquest leads`,
    event:`${Math.round(BB.budget/40)} RSVPs`,
  };
  const week = BB.duration?.weeks||4;
  const now = new Date(); const end = new Date(now); end.setDate(now.getDate()+week*7+7);
  const fmt = d=>d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  const prop = document.getElementById('bb-smp')?.value||'Not yet defined — complete Step 5';
  const mandatories = document.getElementById('bb-mandatories')?.value||'None listed';

  var _heroColor = (BB.brand && BB.brand.color) ? BB.brand.color : 'var(--swansway)';
  document.getElementById('bb-output').style.setProperty('--hero-color', _heroColor);
  document.getElementById('bb-output').innerHTML = `
    <div class="bb-out-hero">
      <div class="bb-out-hero-top">
        <div class="bb-out-hero-brand" style="background:${BB.brand?.color||'var(--swansway)'};">${BB.brand?.name?.toUpperCase()||'BRAND'}</div>
        <div class="bb-out-hero-type">${BB.ctype?.name||'Campaign'} &middot; ${BB.brand?.segment||''}</div>
        <div class="bb-out-hero-title">${document.getElementById('bb-brief-title')?.value||BB.brand?.name||'Campaign'}</div>
      </div>
      <div class="bb-out-meta">
        <div class="bb-out-meta-item"><div class="bb-out-meta-label">Budget</div><div class="bb-out-meta-val">&pound;${BB.budget.toLocaleString()}</div></div>
        <div class="bb-out-meta-item"><div class="bb-out-meta-label">Duration</div><div class="bb-out-meta-val">${week} weeks</div></div>
        <div class="bb-out-meta-item"><div class="bb-out-meta-label">Dates</div><div class="bb-out-meta-val" style="font-size:13px;font-weight:500">${BB.start_date ? (()=>{ const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const sd=new Date(BB.start_date+'T00:00:00'),ed=new Date((BB.end_date||BB.start_date)+'T00:00:00'); return sd.getDate()+' '+months[sd.getMonth()]+' &ndash; '+ed.getDate()+' '+months[ed.getMonth()]+' '+ed.getFullYear(); })() : fmt(now)+' &ndash; '+fmt(end)}</div></div>
        <div class="bb-out-meta-item"><div class="bb-out-meta-label">Sites</div><div class="bb-out-meta-val" style="font-size:13px;font-weight:500">${BB.scope==='sites'&&BB.site_ids&&BB.site_ids.length ? (BB.site_ids.length===1 ? (HUB_SITES.find(s=>s.site_id===BB.site_ids[0])?.site_name||BB.site_ids[0]) : BB.site_ids.map(sid=>(HUB_SITES.find(s=>s.site_id===sid)?.site_name||sid)).join(', ')) : (BB.brand?.locations?.join(', ')||'All sites')}</div></div>
        ${BB.job_ref ? '<div class="bb-out-meta-item"><div class="bb-out-meta-label">Ref</div><div class="bb-out-meta-val" style="font-size:12px;font-family:var(--font-m)">'+(window._lastJobRef||BB.job_ref)+'</div></div>' : ''}
      </div>
    </div>
    <div class="bb-out-body">

      <div class="bb-out-section">
        <div class="bb-out-section-title">Campaign objective</div>
        <div class="bb-out-grid">
          <div class="bb-out-field"><div class="bb-out-field-label">Primary objective</div><div class="bb-out-field-val">${BB.objective?.text||'Not defined'}</div></div>
          <div class="bb-out-field"><div class="bb-out-field-label">Success measure</div><div class="bb-out-field-val">${BB.objective?.kpi||'Not defined'}</div></div>
          <div class="bb-out-field"><div class="bb-out-field-label">Funnel stage</div><div class="bb-out-field-val">${BB.objective?.funnel||'&mdash;'}</div></div>
          <div class="bb-out-field"><div class="bb-out-field-label">Primary KPI target</div><div class="bb-out-field-val" style="font-family:var(--font-d);font-size:22px;font-weight:800;color:var(--accent)">${kpiMap[BB.objective?.id]||'TBC'}</div></div>
        </div>
      </div>

      <div class="bb-out-section">
        <div class="bb-out-section-title">Single-minded proposition</div>
        <div style="padding:20px;background:var(--surface);border-radius:4px;border-left:4px solid ${BB.brand?.color||'#ccc'}">
          <div style="font-size:18px;font-style:italic;font-weight:300;line-height:1.55;color:var(--ink)">&ldquo;${prop}&rdquo;</div>
        </div>
        <div style="margin-top:8px;padding:12px 14px;background:var(--surface);border-radius:3px">
          <div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">Tone of voice</div>
          <div style="font-size:13px;color:var(--ink);font-weight:500">${BB.brand?.tone?.join(' &middot; ')||'TBC'}</div>
        </div>
      </div>

      <div class="bb-out-section">
        <div class="bb-out-section-title">Audience architecture</div>
        <div class="bb-out-grid">
          ${selAuds.map(a=>`
            <div class="bb-out-field">
              <div class="bb-out-field-label">${a.icon} ${a.name}</div>
              <div class="bb-out-field-val">${a.desc}</div>
              <div style="margin-top:8px;font-size:11px;color:var(--ink-soft)">
                Est. CPL: <strong>&pound;${Math.round((BB.brand?.cpl?.meta||45)*a.cpl_mult)}</strong> Meta &middot;
                <strong>&pound;${Math.round((BB.brand?.cpl?.google||35)*a.cpl_mult)}</strong> Search
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="bb-out-section">
        <div class="bb-out-section-title">Channel budget split</div>
        ${(function(){
          var split = BB.channel_split || {};
          var channels = BB.channels || [];
          var pesoMap = {};
          var pesoColors = { P:'#FF6B35', E:'#4ECDC4', S:'#A855F7', O:'#22C55E' };
          if (typeof BB_PESO !== 'undefined') {
            Object.keys(BB_PESO).forEach(function(key) {
              (BB_PESO[key].channels||[]).forEach(function(ch) {
                pesoMap[ch.id] = { name: ch.name, color: pesoColors[key]||'#6B7280' };
              });
            });
          }
          if (!channels.length) return '<div class="bb-out-field" style="color:var(--ink-faint);font-size:12px">No channels selected yet. Complete step 5.</div>';
          var rows = '<div style="display:flex;flex-direction:column;gap:6px">';
          channels.forEach(function(id) {
            var val = split[id] || 0;
            var pct = BB.budget > 0 ? Math.round(val / BB.budget * 100) : 0;
            var info = pesoMap[id] || { name: id, color: '#6B7280' };
            rows += '<div style="display:grid;grid-template-columns:1fr 140px 44px 80px;gap:12px;align-items:center;padding:10px 14px;background:var(--surface);border-radius:4px">'
              + '<div style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:8px">'
              +   '<span style="width:8px;height:8px;border-radius:50%;background:'+info.color+';flex-shrink:0;display:inline-block"></span>'
              +   info.name
              + '</div>'
              + '<div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">'
              +   '<div style="height:100%;border-radius:2px;background:'+info.color+';width:'+Math.min(pct,100)+'%"></div>'
              + '</div>'
              + '<div style="font-family:var(--font-m);font-size:11px;color:var(--ink-soft);text-align:right">'+pct+'%</div>'
              + '<div style="font-family:var(--font-m);font-size:13px;font-weight:700;color:var(--ink);text-align:right">&pound;'+val.toLocaleString()+'</div>'
              + '</div>';
          });
          rows += '</div>';
          var total = channels.reduce(function(s,id){ return s+(split[id]||0); }, 0);
          var diff = BB.budget - total;
          if (Math.abs(diff) >= 1) {
            rows += '<div style="margin-top:8px;padding:8px 12px;background:'+(diff>0?'#FFF8E1':'#FEE2E2')+';border-radius:4px;font-size:12px;font-family:var(--font-m);font-weight:600;color:'+(diff>0?'#92400E':'#991B1B')+'">'
              + (diff>0 ? '&pound;'+diff.toLocaleString()+' still unallocated' : '&pound;'+Math.abs(diff).toLocaleString()+' over budget — please adjust')
              + '</div>';
          } else {
            rows += '<div style="margin-top:8px;padding:8px 12px;background:#ECFDF5;border-radius:4px;font-size:12px;font-family:var(--font-m);font-weight:600;color:#065F46">&pound;'+BB.budget.toLocaleString()+' fully allocated &#10003;</div>';
          }
          return rows;
        })()}
      </div>

      <div class="bb-out-section">
        <div class="bb-out-section-title">PESO channel architecture</div>
        <div class="bb-out-peso">
          ${Object.entries(BB_PESO).map(([key,quad])=>{
            const active = quad.channels.filter(c=>BB.channels.includes(c.id));
            return '<div class="bb-out-peso-q '+key+'">'
              + '<div class="bb-out-peso-letter" style="color:'+quad.color+'">'+key+'</div>'
              + '<div class="bb-out-peso-name">'+quad.label+'</div>'
              + '<div class="bb-out-peso-items">'+(active.length ? active.map(c=>'<div class="bb-out-peso-item">'+c.name+'</div>').join('') : '<div style="font-size:11px;color:var(--ink-faint);font-style:italic">None activated</div>')+'</div>'
              + '</div>';
          }).join('')}
        </div>
      </div>

      <div class="bb-out-section">
        <div class="bb-out-section-title">KPI targets</div>
        <div class="bb-out-kpis">
          <div class="bb-out-kpi"><div class="bb-out-kpi-label">Primary target</div><div class="bb-out-kpi-val">${kpiMap[BB.objective?.id]||'TBC'}</div></div>
          <div class="bb-out-kpi"><div class="bb-out-kpi-label">Target CPL (Meta)</div><div class="bb-out-kpi-val">&pound;${BB.brand?.cpl?.meta||'—'}</div></div>
          <div class="bb-out-kpi"><div class="bb-out-kpi-label">Target CPL (Search)</div><div class="bb-out-kpi-val">&pound;${BB.brand?.cpl?.google||'—'}</div></div>
          <div class="bb-out-kpi"><div class="bb-out-kpi-label">Budget per week</div><div class="bb-out-kpi-val">&pound;${Math.round(BB.budget/Math.max(week,1)).toLocaleString()}</div></div>
          <div class="bb-out-kpi"><div class="bb-out-kpi-label">Audience tiers</div><div class="bb-out-kpi-val">${selAuds.length}</div></div>
          <div class="bb-out-kpi"><div class="bb-out-kpi-label">Channels active</div><div class="bb-out-kpi-val">${BB.channels.length}</div></div>
        </div>
      </div>

      <div class="bb-out-section">
        <div class="bb-out-section-title">Campaign timeline</div>
        <div class="bb-out-tl">
          <div class="bb-out-tl-label">Wk 1&ndash;2</div><div class="bb-out-tl-pills"><span class="bb-out-tl-pill">Campaign sign-off</span><span class="bb-out-tl-pill">Creative production</span><span class="bb-out-tl-pill">Audience build</span><span class="bb-out-tl-pill">Platform setup</span></div>
          <div class="bb-out-tl-label">Wk ${Math.ceil(week*0.3)+1}&ndash;${Math.ceil(week*0.6)}</div><div class="bb-out-tl-pills"><span class="bb-out-tl-pill">Campaign live</span><span class="bb-out-tl-pill">A/B testing active</span><span class="bb-out-tl-pill">Daily optimisation</span></div>
          <div class="bb-out-tl-label">Wk ${Math.ceil(week*0.6)+1}&ndash;${week-1}</div><div class="bb-out-tl-pills"><span class="bb-out-tl-pill">Budget reallocation</span><span class="bb-out-tl-pill">Creative refresh</span><span class="bb-out-tl-pill">CRM follow-up waves</span></div>
          <div class="bb-out-tl-label">Wk ${week}</div><div class="bb-out-tl-pills"><span class="bb-out-tl-pill">Campaign close</span><span class="bb-out-tl-pill">Results autopsy</span><span class="bb-out-tl-pill">Recommendations</span></div>
        </div>
      </div>

      <div class="bb-out-section">
        <div class="bb-out-section-title">Mandatories &amp; restrictions</div>
        <div style="padding:14px;background:var(--surface);border-radius:4px;font-size:13px;line-height:1.7;color:var(--ink)">${mandatories}</div>
      </div>

      <div style="margin-top:2rem;padding:14px 20px;background:var(--ink);color:rgba(255,255,255,0.35);border-radius:4px;font-family:var(--font-m);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;text-align:center">
        Swansway Motor Group &middot; Campaign Brief &middot; ${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}${window._lastJobRef ? ' &middot; '+window._lastJobRef : ''}
      </div>

    </div>
  `;
}



// loadBriefCommitmentsForTracker is defined in group.js


function bbShowPostSave(briefId, status, jobRef) {
  var fb = document.getElementById('bb-save-feedback');
  if (!fb) return;

  var me = CB_TEAM[CB_CURRENT_USER] || {};
  var firstName = me.name ? me.name.split(' ')[0] : 'there';
  var canLaunch = CB_CURRENT_USER && CB_PERMS[CB_CURRENT_USER] && (CB_PERMS[CB_CURRENT_USER].can_approve_all || CB_PERMS[CB_CURRENT_USER].can_approve_digital);

  // Lock the title input and update save button
  var titleInput = document.getElementById('bb-brief-title');
  var saveBtn = document.getElementById('bb-save-btn');
  if (titleInput) titleInput.disabled = true;
  if (saveBtn) { saveBtn.textContent = '\u2713 Saved'; saveBtn.disabled = true; }

  fb.style.display = 'block';
  fb.style.color = '';

  if (status === 'draft') {
    fb.style.display = 'block';
    var _perms = CB_PERMS[CB_CURRENT_USER] || {};
    var _canLaunchNow = _perms.can_approve_all || _perms.can_approve_digital;
    var _refHtml = (jobRef || window._lastJobRef) ? '<div style="display:inline-block;margin-bottom:10px;padding:4px 12px;background:#F1F5F9;border:1.5px solid #CBD5E1;border-radius:4px;font-family:var(--font-m);font-size:12px;color:#475569;letter-spacing:0.05em">Job ref: <strong style="color:var(--ink);font-size:13px">' + (jobRef || window._lastJobRef) + '</strong></div>' : '';
    if (_canLaunchNow) {
      var _socialBtn = '';
      fb.innerHTML = '<div class="bb-s6-confirm">'
        + '<div class="bb-s6-tick">✓</div>'
        + _refHtml
        + '<div class="bb-s6-msg"><strong>Saved, ' + firstName + '.</strong> Ready to go live.</div>'
        + '<button class="bb-s6-launch" onclick="bbSubmitAndLaunch()">LAUNCH CAMPAIGN</button>'
        + _socialBtn
        + '</div>';
    } else {
      var _socialBtn2 = '';
      fb.innerHTML = '<div class="bb-s6-confirm">'
        + '<div class="bb-s6-tick">✓</div>'
        + _refHtml
        + '<div class="bb-s6-msg"><strong>Saved, ' + firstName + '.</strong> When ready, submit for approval.</div>'
        + '<button class="bb-s6-submit-btn" onclick="bbSubmitBrief()">Submit for approval →</button>'
        + _socialBtn2
        + '</div>';
    }
  } else {

    // submitted/approved/campaigned — bbRenderCampaignSection handles the UI, hide feedback

    fb.style.display = 'none';

  }

}


async function bbSubmitAndLaunch() {
  if (!window._lastSavedBriefId) { showToast('Save the campaign first', 'error'); return; }
  var btn = document.querySelector('.bb-s6-launch');
  if (btn) { btn.textContent = 'Launching...'; btn.disabled = true; }
  try {
    var r = await fetch('https://humitzrleflxnlnodpde.supabase.co/rest/v1/briefs?id=eq.' + window._lastSavedBriefId, {
      method: 'PATCH',
      headers: getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
      body: JSON.stringify({status:'submitted', submitted_by: CB_CURRENT_USER||'', updated_at: new Date().toISOString()})
    });
    if (!r.ok) throw new Error(await r.text());
    await bbApproveBriefAndLaunch(window._lastSavedBriefId);
  } catch(e) {
    showToast('Launch failed: ' + e.message, 'error');
    if (btn) { btn.textContent = 'LAUNCH CAMPAIGN'; btn.disabled = false; }
  }
}


async function bbSubmitBrief() {
  if (!window._lastSavedBriefId) return;
  var anon = SUPABASE_ANON_KEY;
  try {
    var r = await fetch('https://humitzrleflxnlnodpde.supabase.co/rest/v1/briefs?id=eq.' + window._lastSavedBriefId, {
      method: 'PATCH',
      headers: getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
      body: JSON.stringify({status:'submitted', submitted_by: CB_CURRENT_USER||'', updated_at: new Date().toISOString()})
    });
    if (!r.ok) throw new Error(await r.text());
    loadBriefs();
    // Immediately show the submitted card — no refresh needed
    var _submitBrief = {id: window._lastSavedBriefId, title: window._lastSavedBriefTitle, status: 'submitted'};
    var _campSec = document.getElementById('bb-campaign-section');
    if (_campSec) _campSec.style.display = 'block';
    await bbRenderCampaignSection(_submitBrief);
    showToast('Campaign submitted ✓ The team has been notified.', 'success');
    // Refresh My Tasks badge
    setTimeout(mtLoad, 500);
  } catch(e) { alert('Error: ' + e.message); }
}


async function bbApproveBriefAndLaunch(briefId) {
  var _briefId = briefId || window._lastSavedBriefId;
  if (!_briefId) { showToast('Brief ID missing \u2014 try reloading', 'error'); return; }
  if (!CB_CURRENT_USER) { showToast('Pick your name first', 'error'); return; }
  var perms = CB_PERMS[CB_CURRENT_USER] || {};
  if (!perms.can_approve_all && !perms.can_approve_digital) { showToast('You do not have permission to launch campaigns', 'error'); return; }
  window._lastSavedBriefId = _briefId;
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  try {
    var r = await fetch(base+'/briefs?id=eq.'+_briefId, {
      method:'PATCH',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=representation'}),
      body:JSON.stringify({status:'approved',approved_by:CB_CURRENT_USER,approved_at:new Date().toISOString(),updated_at:new Date().toISOString()})
    });
    if (!r.ok) {
      var errText = await r.text();
      throw new Error('PATCH failed (' + r.status + '): ' + errText);
    }
    var briefs = await r.json();
    console.log('Approval PATCH response:', r.status, JSON.stringify(briefs));
    if (!briefs || (Array.isArray(briefs) && briefs.length === 0)) {
      // PATCH succeeded but returned empty — RLS may be blocking return=representation
      // Construct the brief manually and proceed
      briefs = [{id: _briefId, title: window._lastSavedBriefTitle, status: 'approved'}];
    }
    var brief = Array.isArray(briefs) ? briefs[0] : briefs;
    if (!brief || !brief.id) throw new Error('No brief data returned from approval PATCH');
    showToast('Campaign approved ✓ Launching…', 'success');
    // Immediately launch — no re-render showing a second button
    var btn = document.querySelector('.bb-s6-launch');
    await bbLaunchCampaignFromBrief(brief.id, brief.title || window._lastSavedBriefTitle, btn);
  } catch(e) {
    console.error('bbApproveBriefAndLaunch error:', e);
    alert('Approval error: ' + e.message);
  }
}


async function bbLaunchCampaignFromBrief(briefId, briefTitle, btnEl) {
  var btn = btnEl || (typeof event !== 'undefined' && event.currentTarget) || document.querySelector('.bb-s6-launch');
  btn.textContent = 'Creating campaign...';
  btn.disabled = true;
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  try {
    var brief = null;
    try {
      var br = await fetch(base+'/briefs?id=eq.'+briefId+'&select=*',{headers:getAuthHeaders()}).then(function(r){return r.json();});
      brief = Array.isArray(br) ? br[0] : br;
    } catch(e){}

    var cr = await fetch(base+'/campaigns',{
      method:'POST',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=representation'}),
      body:JSON.stringify([{
        title:briefTitle,
        brief_id:briefId,
        scope:(brief&&brief.scope)||'brand',
        brand_id:(brief&&brief.brand_id)||null,
        site_id:(brief&&brief.site_id)||null,
        status:'active',
        current_stage:1,
        start_date:(brief&&brief.start_date)||null,
        end_date:(brief&&brief.end_date)||null,
        planned_budget:(brief&&brief.budget)||null,
        campaign_type:(brief&&brief.campaign_type)||null,
        planned_objective:(brief&&brief.objective)||null,
        confirmed_channels:(brief&&(brief.confirmed_channels||brief.channels))||[],
        created_by:CB_CURRENT_USER||'system'
      }])
    });
    if (!cr.ok) throw new Error(await cr.text());
    var camp = (await cr.json())[0];

    var tmpl = await fetch(base+'/campaign_task_templates?select=*&order=stage,task_order',{headers:getAuthHeaders()}).then(function(r){return r.json();});
    if (Array.isArray(tmpl) && tmpl.length) {
      var cmap={'Paid Search (Google/Bing)':'paid_search','Display, Video & Programmatic':'display','Email Marketing':'email','Social Organic':'social_organic','Paid Social (Meta/TikTok/LinkedIn)':'social_paid','Events & Showroom':'events','OOH & Print':'ooh_print','Manufacturer Co-op':'manufacturer_coop'};
      var chs=((brief&&(brief.confirmed_channels||brief.channels))||[]).map(function(c){return cmap[c]||c.toLowerCase().replace(/[^a-z]/g,'_');});
      var rows=tmpl.filter(function(t){return !t.channel||!chs.length||chs.includes(t.channel);}).map(function(t){
        var notes='';
        if(t.stage===1&&t.task_order===3)notes='Budget: \u00a3'+((brief&&brief.budget)||0).toLocaleString();
        if(t.stage===1&&t.task_order===2)notes=((brief&&brief.start_date)?'Start: '+brief.start_date:'')+((brief&&brief.end_date)?' | End: '+brief.end_date:'');
        return{campaign_id:camp.id,stage:t.stage,task_order:t.task_order,task_name:t.task_name,department:t.department,assigned_to:t.default_assignee,approver_scope:t.approver_scope,is_blocker:t.is_blocker,channel:t.channel,completed:false,approved:false,rejected:false,notes:notes};
      });
      await fetch(base+'/campaign_tasks',{method:'POST',headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify(rows)});
    }

    // Mark brief as campaigned
    await fetch(base+'/briefs?id=eq.'+briefId,{method:'PATCH',headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({status:'campaigned',updated_at:new Date().toISOString()})});

    // Update CB arrays
    if (typeof CB_CAMPAIGNS !== 'undefined') CB_CAMPAIGNS.unshift(camp);
    if (typeof CB_ALL_BRIEFS !== 'undefined') CB_ALL_BRIEFS = CB_ALL_BRIEFS.map(function(b){return b.id===briefId?Object.assign({},b,{status:'campaigned'}):b;});

    // Enter campaign mode
    var _sc2 = document.getElementById('bb-save-bar');
    if (_sc2) _sc2.style.display = 'none';
    var launchedBrief = {id:briefId,title:briefTitle,status:'campaigned',brand_id:BB.brand?BB.brand.id:null,budget:BB.budget,start_date:BB.start_date,end_date:BB.end_date,site_id:BB.site_id,scope:BB.scope,campaign_type:BB.ctype?BB.ctype.name:null};
    await bbEnterCampaignMode(launchedBrief);
    setTimeout(mtLoad, 500);
    loadBriefs();

  } catch(e) {
    showToast('Launch failed: ' + e.message, 'error');
    console.error('bbLaunchCampaignFromBrief:', e);
    if (btn) { btn.textContent = btn.dataset.origText || 'LAUNCH CAMPAIGN'; btn.disabled = false; }
  }
}


async function bbViewCampaign(campaignId) {
  var anon = SUPABASE_ANON_KEY, base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var rows = await fetch(base+'/campaigns?id=eq.'+campaignId+'&select=*',{headers:getAuthHeaders()}).then(function(r){return r.json();});
  var camp = Array.isArray(rows) && rows[0];
  if (camp && camp.brief_id) { await bbLoadBrief(camp.brief_id); } else { showToast('Could not find brief for this campaign','error'); }
}


async function bbRenderCampaignSection(briefData) {
  var el = document.getElementById('bb-campaign-section');
  if (!el) return;
  if (!briefData || !briefData.id) { el.style.display='none'; return; }
  // Ensure _lastSavedBriefId is set so approve/launch buttons work
  if (briefData.id) { window._lastSavedBriefId = briefData.id; window._lastSavedBriefTitle = briefData.title || ''; }
  await swEnsureUser();
  var brief = briefData;
  var perms = CB_PERMS[CB_CURRENT_USER] || {};
  var canLaunch = perms.can_approve_all || perms.can_approve_digital;
  var me = CB_TEAM[CB_CURRENT_USER] || {};
  var firstName = me.name ? me.name.split(' ')[0] : '';
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var hdrs = getAuthHeaders();
  var camps = await fetch(base+'/campaigns?brief_id=eq.'+brief.id+'&select=id,title,status,current_stage',{headers:hdrs}).then(function(r){return r.json();});
  var existingCamp = Array.isArray(camps) && camps.length ? camps[0] : null;
  el.style.display = 'block';
  if (existingCamp || brief.status === 'campaigned') {
    var camp = existingCamp || {};
    var stageNames = ['Pre-Production','Production','Pre-Live Approval','Go Live','In-Flight','Close & Review'];
    el.style.display = 'none';
    await bbEnterCampaignMode(brief);
    return;
  }
  if (brief.status === 'draft') { el.style.display = 'none'; return; }
  // Single source of truth: hide save card and feedback for all non-draft states
  var saveCard = document.getElementById('bb-save-bar');
  var saveFb   = document.getElementById('bb-save-feedback');
  if (brief.status !== 'draft') {
    if (saveCard) saveCard.style.display = 'none';
    if (saveFb)   { saveFb.style.display = 'none'; saveFb.innerHTML = ''; }
  }

  if (brief.status === 'submitted') {
    if (canLaunch) {
      el.innerHTML = '<div class="bb-s6-card">'
        + '<div class="bb-s6-card-pill" style="background:var(--accent)">Ready to launch</div>'
        + '<div class="bb-s6-card-title">' + (firstName ? firstName + ', this campaign is waiting for you.' : 'Ready to launch.') + '</div>'
        + '<div class="bb-s6-card-sub">Approve it and the team will get their tasks automatically.</div>'
        + '<button class="bb-s6-launch" onclick="bbApproveBriefAndLaunch()">APPROVE & LAUNCH</button>'
        + '<div class="bb-s6-launch-hint">Approves, creates all 58 tasks and assigns them to the team</div>'
        + '</div>';
    } else {
      el.innerHTML = '<div class="bb-s6-card" style="border-color:#FCD34D;background:#FFFBEB;display:flex;gap:14px">'
        + '<div style="width:34px;height:34px;background:#FEF3C7;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">&#9203;</div>'
        + '<div><div class="bb-s6-card-title" style="font-size:16px;margin-bottom:4px">Campaign submitted' + (firstName ? ', '+firstName : '') + '!</div>'
        + '<div class="bb-s6-card-sub" style="margin-bottom:0">Anna, Marcus or Beth will review it. You\'ll get your tasks as soon as it goes live.</div></div>'
        + '</div>';
    }
    return;
  }
  if (brief.status === 'approved') {
    var safeTitle = brief.title ? brief.title.replace(/'/g,'').replace(/"/g,'') : '';
    el.innerHTML = '<div class="bb-s6-card">'
      + '<div class="bb-s6-card-pill" style="background:#059669">Campaign approved</div>'
      + '<div class="bb-s6-card-title">' + (firstName ? 'Go for it, '+firstName+'.' : 'Ready to launch.') + '</div>'
      + '<div class="bb-s6-card-sub">Approved and ready. Create the campaign and assign all tasks to the team.</div>'
      + '<button class="bb-s6-launch" onclick="bbLaunchCampaignFromBrief(\'' + brief.id + '\',\'' + safeTitle + '\', this)">LAUNCH CAMPAIGN</button>'
      + '<div class="bb-s6-launch-hint">Creates all 58 tasks and assigns them to the team</div>'
      + '</div>';
  }
}


function bbShowStageDetail(stageNum, allTasks, currentStage, container, camp, canApprove) {
  container.innerHTML = '';
  var stageTasks = allTasks.filter(function(t){ return t.stage === stageNum; });
  var _myMember = CB_TEAM[CB_CURRENT_USER] || {};
  var _isLeadership = !!_myMember.is_leadership;
  var myTasks    = stageTasks.filter(function(t){ return t.assigned_to === CB_CURRENT_USER || (_isLeadership && t.assigned_to === 'leadership'); });
  var otherTasks = stageTasks.filter(function(t){ return t.assigned_to !== CB_CURRENT_USER && !(_isLeadership && t.assigned_to === 'leadership'); });
  var SN = ['Pre-Production','Production','Pre-Live Approval','Go Live','In-Flight','Close & Review'];
  var SI = ['📋','⚙️','✅','🚀','📊','🏁'];
  var isActive = stageNum === currentStage;
  var isPast   = stageNum < currentStage;
  var me = CB_TEAM[CB_CURRENT_USER] || {};
  var myFirst = me.name ? me.name.split(' ')[0] : 'You';

  // ── Stage divider (Slack-style) ──
  var divider = document.createElement('div');
  divider.className = 'sw-stage-divider';
  var stageColor = isPast ? '#059669' : isActive ? 'var(--swansway)' : 'var(--surface-2)';
  var stageTC    = (isPast || isActive) ? '#fff' : 'var(--ink-faint)';
  var doneCount  = stageTasks.filter(function(t){return t.completed;}).length;
  divider.innerHTML =
    '<div class="sw-stage-divider-icon" style="background:' + stageColor + ';color:' + stageTC + '">' + (isPast ? '✓' : SI[stageNum-1]) + '</div>' +
    '<div class="sw-stage-divider-name">Stage ' + stageNum + ' — ' + SN[stageNum-1] + '</div>' +
    '<div class="sw-stage-divider-line"></div>' +
    '<span class="sw-pill" style="background:' + (isPast?'#D1FAE5':isActive?'rgba(200,16,46,0.1)':'var(--surface)') + ';color:' + (isPast?'#059669':isActive?'var(--accent)':'var(--ink-faint)') + '">' +
      (isPast ? '✓ Complete' : isActive ? 'Active' : 'Upcoming') +
    '</span>' +
    '<span class="sw-pill sw-pill-muted">' + doneCount + '/' + stageTasks.length + ' done</span>';
  container.appendChild(divider);

  // ── My tasks spotlight ──
  if (myTasks.length > 0 && isActive) {
    var spotlight = document.createElement('div');
    spotlight.className = 'sw-spotlight';
    var initials = me.name ? me.name.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase() : '?';
    var pendingCount = myTasks.filter(function(t){return !t.completed;}).length;
    var doneCount2   = myTasks.filter(function(t){return t.completed;}).length;
    spotlight.innerHTML =
      '<div class="sw-spotlight-header">' +
        '<div class="sw-avatar sw-avatar-lg">' + initials + '</div>' +
        '<div><div class="sw-spotlight-title">Your tasks this stage, ' + myFirst + '</div>' +
          '<div class="sw-spotlight-sub">' + pendingCount + ' to do · ' + doneCount2 + ' done</div>' +
        '</div>' +
      '</div>' +
      '<div class="sw-spotlight-tasks">' +
        myTasks.map(function(t){
          return '<div class="sw-spotlight-task' + (t.completed?' sw-spotlight-task-done':'') + '">' +
            '<span class="sw-spotlight-tick">' + (t.completed?'✓':'○') + '</span>' +
            '<span>' + t.task_name + (t.is_blocker?' <span class="sw-blocker-tag">BLOCKER</span>':'') + '</span>' +
          '</div>';
        }).join('') +
      '</div>';
    container.appendChild(spotlight);
  } else if (myTasks.length === 0 && isActive) {
    var allDone = document.createElement('div');
    allDone.className = 'sw-notice sw-notice-green';
    allDone.innerHTML = '<span style="font-size:20px">📋</span><div><strong>' + myFirst + ', you&#39;re all done this stage.</strong> The team is on it.</div>';
    container.appendChild(allDone);
  }

  // ── My tasks rows (actionable) ──
  if (myTasks.length > 0 && isActive) {
    myTasks.forEach(function(task) {
      var done = task.completed;
      var approved = task.approved;
      var taskStatus = (approved || done) ? 'approved' : 'todo';
      var statusIcon = (approved || done) ? '✓' : '○';
      var statusColor = taskStatus === 'approved' ? '#059669' : 'var(--ink-faint)';

      var row = document.createElement('div');
      row.className = 'sw-task-row sw-task-' + taskStatus;

      var initials2 = me.name ? me.name.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase() : '?';
      row.innerHTML =
        '<div class="sw-task-status-icon" style="color:' + statusColor + '">' + statusIcon + '</div>' +
        '<div class="sw-avatar sw-avatar-sm">' + initials2 + '</div>' +
        '<div class="sw-task-body">' +
          '<div class="sw-task-name-row">' +
            '<span class="sw-task-name' + (task.is_blocker?' sw-task-blocker':'') + '">' + task.task_name + '</span>' +
            (task.is_blocker ? '<span class="sw-blocker-tag">BLOCKER</span>' : '') +
          '</div>' +
          (task.notes ? '<div class="sw-task-note">📋 ' + task.notes + '</div>' : '') +
        '</div>' +
        '<div class="sw-task-actions">' +
          (!done ? '<button class="sw-btn-complete" data-tid="' + task.id + '" data-cid="' + camp.id + '" onclick="bbMarkTaskDone(this.dataset.tid,this.dataset.cid)">✓ Done</button>' : '') +
          '<button class="sw-btn-note" data-tid="' + task.id + '" data-tn="' + task.task_name.replace(/"/g,'') + '" onclick="bbOpenNotesPanel(this.dataset.tid,this.dataset.tn)"> Note</button>' +
          (approved ? '<span class="sw-pill" style="background:#D1FAE5;color:#059669">✓ Approved</span>' : '') +
          (done && !approved ? '<span class="sw-pill" style="background:#FEF3C7;color:#92400E">⏳ Pending</span>' : '') +
        '</div>';
      container.appendChild(row);
    });
  }

  // ── Rest of team ──
  if (otherTasks.length > 0) {
    var teamDiv = document.createElement('div');
    teamDiv.className = 'sw-stage-divider';
    teamDiv.style.marginTop = '20px';
    teamDiv.innerHTML =
      '<div class="sw-label" style="color:var(--ink-faint)">The rest of the team</div>' +
      '<div class="sw-stage-divider-line"></div>';
    container.appendChild(teamDiv);

    // Group by assignee
    var byAssignee = {};
    otherTasks.forEach(function(t) {
      var key = t.assigned_to || 'unassigned';
      if (!byAssignee[key]) byAssignee[key] = [];
      byAssignee[key].push(t);
    });

    Object.keys(byAssignee).forEach(function(assigneeId) {
      var member = CB_TEAM[assigneeId] || {name: assigneeId || 'Unassigned'};
      var memberTasks = byAssignee[assigneeId];
      var memberDone  = memberTasks.filter(function(t){return t.completed;}).length;
      var initials3   = member.name ? member.name.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase() : '?';

      // Member header
      var memberHdr = document.createElement('div');
      memberHdr.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 0 6px';
      memberHdr.innerHTML =
        '<div class="sw-avatar sw-avatar-sm" style="background:' + (member.color||'var(--swansway)') + '">' + initials3 + '</div>' +
        '<span style="font-family:var(--font-b);font-size:13px;font-weight:700;color:var(--ink)">' + member.name + '</span>' +
        '<span style="font-size:11px;color:var(--ink-faint)">' + memberDone + '/' + memberTasks.length + ' done</span>';
      container.appendChild(memberHdr);

      memberTasks.forEach(function(task) {
        var done2 = task.completed;
        var row2 = document.createElement('div');
        row2.className = 'sw-task-row sw-task-' + (done2?'approved':'todo');
        row2.innerHTML =
          '<div class="sw-task-status-icon" style="color:' + (done2?'#059669':'var(--ink-faint)') + '">' + (done2?'✓':'○') + '</div>' +
          '<div class="sw-avatar sw-avatar-sm" style="background:' + (member.color||'var(--swansway)') + '">' + initials3 + '</div>' +
          '<div class="sw-task-body">' +
            '<div class="sw-task-name-row">' +
              '<span class="sw-task-name">' + task.task_name + '</span>' +
              (task.is_blocker ? '<span class="sw-blocker-tag">BLOCKER</span>' : '') +
            '</div>' +
          '</div>';
        container.appendChild(row2);
      });
    });
  }

  if (!stageTasks.length) {
    var empty = document.createElement('div');
    empty.className = 'sw-empty-tasks';
    empty.textContent = 'No tasks for this stage.';
    container.appendChild(empty);
  }
}


async function bbMarkTaskDone(taskId, campId) {
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  try {
    var r = await fetch(base+'/campaign_tasks?id=eq.'+taskId, {
      method:'PATCH',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
      body:JSON.stringify({completed:true,approved:true,completed_at:new Date().toISOString(),completed_by:CB_CURRENT_USER,approved_by:CB_CURRENT_USER})
    });
    if (!r.ok) throw new Error(await r.text());
    // Re-render by reloading the brief
    if (typeof mtLoad === 'function') mtLoad();
    // Reload the full campaign view to show updated task state
    var _briefId = window._lastSavedBriefId || (BB && BB.id);
    if (_briefId && typeof bbLoadBrief === 'function') {
      setTimeout(function() { bbLoadBrief(_briefId); }, 300);
    }
  } catch(e) { alert('Error: '+e.message); }
}


async function bbAdvanceStage(campId, currentStage, section, camp, briefId) {
  if (!confirm('Advance to Stage ' + (currentStage+1) + '? Make sure all blocker tasks are done first.')) return;
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  try {
    var r = await fetch(base+'/campaigns?id=eq.'+campId, {
      method:'PATCH',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=representation'}),
      body:JSON.stringify({current_stage:currentStage+1,updated_at:new Date().toISOString()})
    });
    if (!r.ok) throw new Error(await r.text());
    var updated = await r.json();
    var newCamp = Array.isArray(updated) ? updated[0] : updated;
    // Re-render stages
    var tasks = await fetch(base+'/campaign_tasks?campaign_id=eq.'+campId+'&order=stage,task_order',{headers:getAuthHeaders()}).then(function(r){return r.json();});
    if (typeof mtLoad === 'function') mtLoad();
    bbRenderStages(section, newCamp, briefId);
  } catch(e) { alert('Error advancing stage: '+e.message); }
}


function bbOpenNotesPanel(taskId, taskName) {
  // Phase 5 - notes slide-out
  var panel = document.getElementById('bb-notes-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'bb-notes-panel';
    panel.style.cssText = 'position:fixed;top:0;right:-420px;width:400px;height:100vh;background:var(--white);box-shadow:-4px 0 24px rgba(0,0,0,0.12);z-index:600;transition:right .3s ease;display:flex;flex-direction:column';
    panel.innerHTML = '<div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">'
      + '<div id="bb-notes-title" style="font-family:var(--font-d);font-size:16px;font-weight:700;color:var(--ink)"></div>'
      + '<button onclick="bbCloseNotesPanel()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink-soft)">\u00d7</button>'
      + '</div>'
      + '<div id="bb-notes-thread" style="flex:1;overflow-y:auto;padding:16px 24px"></div>'
      + '<div style="padding:16px 24px;border-top:1px solid var(--border)">'
      + '<textarea id="bb-notes-input" placeholder="Add a note..." style="width:100%;border:1px solid var(--border);border-radius:6px;padding:10px;font-size:13px;font-family:var(--font-m);resize:none;height:72px;box-sizing:border-box"></textarea>'
      + '<button onclick="bbSubmitNote()" style="width:100%;margin-top:8px;background:var(--ink);color:#fff;border:none;padding:10px;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer">Send note</button>'
      + '</div>';
    document.body.appendChild(panel);
    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'bb-notes-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:599;display:none';
    overlay.onclick = bbCloseNotesPanel;
    document.body.appendChild(overlay);
  }
  panel.dataset.taskId = taskId;
  document.getElementById('bb-notes-title').textContent = taskName;
  document.getElementById('bb-notes-thread').innerHTML = '<div style="color:var(--ink-soft);font-size:13px;text-align:center;padding:20px">Loading notes...</div>';
  document.getElementById('bb-notes-overlay').style.display = 'block';
  setTimeout(function(){ panel.style.right = '0'; }, 10);
  bbLoadNotes(taskId);
}


function bbCloseNotesPanel() {
  var p = document.getElementById('bb-notes-panel');
  var o = document.getElementById('bb-notes-overlay');
  if (p) p.style.right = '-420px';
  if (o) o.style.display = 'none';
}


async function bbOpenBriefPanel(briefId) {
  // Create panel if it doesn't exist
  var panel = document.getElementById('bb-brief-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'bb-brief-panel';
    panel.style.cssText = 'position:fixed;top:0;right:-540px;width:520px;height:100vh;background:var(--white);box-shadow:-4px 0 32px rgba(0,0,0,0.15);z-index:600;transition:right .3s ease;display:flex;flex-direction:column;overflow:hidden';
    document.body.appendChild(panel);
    // Shared overlay
    var overlay = document.getElementById('bb-notes-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'bb-notes-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:599;display:none';
      document.body.appendChild(overlay);
    }
    overlay.onclick = function() { bbCloseBriefPanel(); bbCloseNotesPanel(); };
  }

  panel.innerHTML = '<div style="padding:0;flex:1;overflow-y:auto"></div>';
  document.getElementById('bb-notes-overlay').style.display = 'block';
  setTimeout(function(){ panel.style.right = '0'; }, 10);

  // Load brief from DB
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var brief = await fetch(base+'/briefs?id=eq.'+briefId+'&select=*',{
    headers:getAuthHeaders()
  }).then(function(r){return r.json();}).then(function(d){return d[0];});

  if (!brief) { panel.innerHTML = '<div style="padding:24px">Campaign not found</div>'; return; }

  var bColor = brief.brand_color || '#C8102E';
  var approver = brief.approved_by ? (CB_TEAM[brief.approved_by] ? CB_TEAM[brief.approved_by].name : brief.approved_by) : '';
  var approvedDate = brief.approved_at ? new Date(brief.approved_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '';
  var audiences = Array.isArray(brief.audiences) ? brief.audiences.map(function(a){return typeof a==='object'?a.name:a;}).join(', ') : '';
  var channels = Array.isArray(brief.channels) ? brief.channels.length + ' channels selected' : '';
  var allocation = Array.isArray(brief.allocation) ? brief.allocation : [];

  panel.innerHTML =
    // Hero header with brand colour
    '<div style="background:' + bColor + ';padding:24px 24px 20px;position:relative">'
    + '<button onclick="bbCloseBriefPanel()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.2);border:none;border-radius:50%;width:28px;height:28px;font-size:16px;cursor:pointer;color:#fff;line-height:1">×</button>'
    + '<div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:rgba(255,255,255,0.7);text-transform:uppercase;margin-bottom:6px">Campaign</div>'
    + '<div style="font-family:var(--font-d);font-size:22px;font-weight:700;color:#fff;line-height:1.2;margin-bottom:8px">' + brief.title + '</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<span style="background:rgba(255,255,255,0.2);color:#fff;padding:3px 10px;border-radius:10px;font-size:12px">' + (brief.brand_name||'') + '</span>'
    + '<span style="background:rgba(255,255,255,0.2);color:#fff;padding:3px 10px;border-radius:10px;font-size:12px">' + (brief.campaign_type||'') + '</span>'
    + '<span style="background:rgba(255,255,255,0.2);color:#fff;padding:3px 10px;border-radius:10px;font-size:12px">' + (brief.status.charAt(0).toUpperCase()+brief.status.slice(1)) + '</span>'
    + (brief.job_ref ? '<span style="background:rgba(0,0,0,0.25);color:#fff;padding:3px 10px;border-radius:10px;font-size:11px;font-family:var(--font-m);letter-spacing:0.06em">' + brief.job_ref + '</span>' : '')
    + '</div>'
    + '</div>'

    // Key stats row
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid var(--border)">'
    + bbBriefStat('Budget', '£' + (brief.budget||0).toLocaleString())
    + bbBriefStat('Duration', brief.duration_label || (brief.duration_weeks + ' weeks'))
    + bbBriefStat('Scope', (brief.scope||'').charAt(0).toUpperCase()+(brief.scope||'').slice(1))
    + '</div>'

    // Sections
    + '<div style="padding:20px 24px;overflow-y:auto;flex:1">'

    // Objective
    + (brief.objective ? bbBriefSection('Campaign Objective', brief.objective
      + (brief.objective_kpi ? '<div style="margin-top:8px;font-size:12px;color:var(--ink-soft)">KPI: ' + brief.objective_kpi + '</div>' : '')
      + (brief.kpi_primary_value ? '<div style="margin-top:4px;font-size:12px;color:var(--ink-soft)">Target: ' + brief.kpi_primary_value + '</div>' : '')
    ) : '')

    // Audiences
    + (audiences ? bbBriefSection('Target Audiences', audiences) : '')

    // Locations
    + (Array.isArray(brief.locations) && brief.locations.length ? bbBriefSection('Locations', brief.locations.join(', ')) : '')

    // Budget allocation
    + (allocation.length ? bbBriefSection('Budget Allocation',
      allocation.map(function(a) {
        return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
          + '<div style="width:28px;height:28px;border-radius:4px;background:'+a.c+';flex-shrink:0"></div>'
          + '<div style="flex:1;font-size:13px">' + a.n + '</div>'
          + '<div style="font-size:13px;font-weight:700;color:var(--ink)">' + a.p + '%</div>'
          + '<div style="width:80px;height:6px;border-radius:3px;background:var(--surface);overflow:hidden">'
          + '<div style="width:'+a.p+'%;height:100%;background:'+a.c+';border-radius:3px"></div></div>'
          + '</div>';
      }).join('')
    ) : '')

    // KPIs
    + (brief.kpi_cpl_search || brief.kpi_cpl_meta ? bbBriefSection('CPL Benchmarks',
      (brief.kpi_cpl_search ? '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="color:var(--ink-soft)">Search CPL</span><strong>£'+brief.kpi_cpl_search+'</strong></div>' : '')
      + (brief.kpi_cpl_meta ? '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:var(--ink-soft)">Meta CPL</span><strong>£'+brief.kpi_cpl_meta+'</strong></div>' : '')
    ) : '')

    // Approval
    + (approver ? bbBriefSection('Approval', '✓ Approved by ' + approver + (approvedDate ? ' on ' + approvedDate : '')) : '')

    + '</div>';
}


function bbBriefStat(label, value) {
  return '<div style="padding:14px 20px;text-align:center;border-right:1px solid var(--border)">'
    + '<div style="font-size:11px;font-weight:700;letter-spacing:0.06em;color:var(--ink-faint);text-transform:uppercase;margin-bottom:3px">' + label + '</div>'
    + '<div style="font-size:18px;font-weight:700;color:var(--ink)">' + value + '</div>'
    + '</div>';
}


function bbBriefSection(title, body) {
  return '<div style="margin-bottom:20px">'
    + '<div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:8px">' + title + '</div>'
    + '<div style="font-size:14px;color:var(--ink);line-height:1.5">' + body + '</div>'
    + '</div>';
}


function bbCloseBriefPanel() {
  var p = document.getElementById('bb-brief-panel');
  var o = document.getElementById('bb-notes-overlay');
  if (p) p.style.right = '-540px';
  if (o) o.style.display = 'none';
}


async function bbLoadNotes(taskId) {
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  try {
    var notes = await fetch(base+'/campaign_task_notes?task_id=eq.'+taskId+'&order=created_at',{
      headers:getAuthHeaders()
    }).then(function(r){return r.json();});
    var thread = document.getElementById('bb-notes-thread');
    if (!thread) return;
    if (!Array.isArray(notes) || !notes.length) {
      thread.innerHTML = '<div style="color:var(--ink-faint);font-size:13px;text-align:center;padding:32px 16px">\uD83D\uDCAC No notes yet \u2014 be the first!</div>';
      return;
    }
    thread.innerHTML = notes.map(function(n) {
      var member = CB_TEAM[n.created_by] || {name:n.created_by};
      var firstName = member.name ? member.name.split(' ')[0] : n.created_by;
      var date = new Date(n.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
      var isMe = n.created_by === CB_CURRENT_USER;
      return '<div style="margin-bottom:14px;' + (isMe ? 'text-align:right' : '') + '">'
        + '<div style="font-size:11px;color:var(--ink-faint);margin-bottom:3px">' + firstName + ' \u00b7 ' + date + '</div>'
        + '<div style="display:inline-block;max-width:85%;padding:10px 14px;border-radius:' + (isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px') + ';background:' + (isMe ? 'var(--swansway)' : 'var(--surface)') + ';color:' + (isMe ? '#fff' : 'var(--ink)') + ';font-size:13px;text-align:left">'
        + n.note_text + '</div></div>';
    }).join('');
    thread.scrollTop = thread.scrollHeight;
  } catch(e) {
    var thread = document.getElementById('bb-notes-thread');
    if (thread) thread.innerHTML = '<div style="color:var(--ink-faint);font-size:13px;text-align:center;padding:32px 16px">Notes will appear here once the table is set up.</div>';
  }
}


async function bbSubmitNote() {
  var panel = document.getElementById('bb-notes-panel');
  var input = document.getElementById('bb-notes-input');
  if (!panel || !input || !input.value.trim()) return;
  var taskId = panel.dataset.taskId;
  var noteText = input.value.trim();
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  try {
    await fetch(base+'/campaign_task_notes', {
      method:'POST',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
      body:JSON.stringify({task_id:taskId,note_text:noteText,created_by:CB_CURRENT_USER,created_at:new Date().toISOString()})
    });
    input.value = '';
    bbLoadNotes(taskId);
  } catch(e) { alert('Error saving note: '+e.message); }
}


async function bbSaveBrief() {
  if(!SB_USER) {
    openAuth();
    // After sign-in, auth state change will update SB_USER - user clicks save again
    return;
  }
  if(!SB) {
    alert('Database not connected. Check your Supabase configuration in the deployment guide.');
    return;
  }
  const title = (document.getElementById('bb-brief-title')?.value || '').trim();
  if(!title) { alert('Please give this campaign a title first.'); return; }

  const btn      = document.getElementById('bb-save-btn');
  const feedback = document.getElementById('bb-save-feedback');
  btn.disabled = true; btn.textContent = 'Saving…';

  const allAuds = [...BB_AUDIENCES.default,...BB_AUDIENCES.ev,...BB_AUDIENCES.fleet];
  const selAuds = BB.audiences.map(id=>allAuds.find(a=>a.id===id)).filter(Boolean);

  const kpiMap = {
    units:    BB.budget/800+'units',
    leads:    Math.round(BB.budget/(BB.brand?.cpl?.meta||45))+'/month',
    testdrive:Math.round(BB.budget/180)+' test drives',
    awareness:(BB.budget*18).toLocaleString()+' reach',
    retention:'+'+Math.round(BB.budget/50)+' bookings',
    conquest: Math.round(BB.budget/200)+' conquest leads',
    event:    Math.round(BB.budget/40)+' RSVPs',
  };

  const record = {
    user_id:           SB_USER.id,
    title,
    status:            'draft',
    brand_id:          BB.brand?.id || '',
    brand_name:        BB.brand?.name || '',
    brand_color:       BB.brand?.color || '',
    campaign_type_id:  BB.ctype?.id || '',
    campaign_type:     BB.ctype?.name || '',
    objective_id:      BB.objective?.id || '',
    objective:         BB.objective?.text || '',
    objective_kpi:     BB.objective?.kpi || '',
    objective_funnel:  BB.objective?.funnel || '',
    budget:            BB.budget,
    duration_weeks:    BB.duration?.weeks || null,
    duration_label:    BB.duration?.label || '',
    audience_ids:      BB.audiences,
    audiences:         selAuds,
    channel_ids:       BB.channels,
    channels:          BB.channels,
    channel_split:     BB.channel_split || {},
    allocation:        bbGetAllocation(),
    proposition:       (document.getElementById('bb-smp')?.value || BB.proposition || ''),
    mandatories:       (document.getElementById('bb-mandatories')?.value || BB.mandatories || ''),
    kpi_primary_label: BB.objective?.text || '',
    kpi_primary_value: kpiMap[BB.objective?.id] || '',
    kpi_cpl_meta:      BB.brand?.cpl?.meta || null,
    kpi_cpl_search:    BB.brand?.cpl?.google || null,
    locations:         BB.brand?.locations || [],
    notes:             BB.notes || '',
    start_date:        BB.start_date || null,
    end_date:          BB.end_date || null,
    site_id:           (BB.scope === 'sites' && BB.site_ids && BB.site_ids.length > 1)
                         ? JSON.stringify(BB.site_ids)
                         : (BB.site_id || null),
    scope:             BB.scope || 'brand',
  };

  // Use direct fetch to avoid Supabase JS client schema cache issues
  var _bbBase = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var _bbHdrs = getAuthHeaders({'Content-Type':'application/json','Prefer':'return=representation'});
  let data, error;
  try {
    var _bbResp;
    if (window._lastSavedBriefId) {
      record.updated_at = new Date().toISOString();
      delete record.status;
      _bbResp = await fetch(_bbBase + '/briefs?id=eq.' + window._lastSavedBriefId, {
        method: 'PATCH',
        headers: _bbHdrs,
        body: JSON.stringify(record)
      });
    } else {
      // Generate job ref for new briefs only
      record.job_ref = await swGenerateJobRef(CB_CURRENT_USER);
      window._lastJobRef = record.job_ref;
      _bbResp = await fetch(_bbBase + '/briefs', {
        method: 'POST',
        headers: _bbHdrs,
        body: JSON.stringify([record])
      });
    }
    if (!_bbResp.ok) {
      var _bbErr = await _bbResp.text();
      error = { message: _bbErr };
      data = null;
    } else {
      var _bbRows = await _bbResp.json();
      data = Array.isArray(_bbRows) ? _bbRows[0] : _bbRows;
      error = null;
    }
  } catch(_bbEx) {
    error = { message: _bbEx.message };
    data = null;
  }
  btn.disabled = false; btn.textContent = window._lastSavedBriefId ? 'Update campaign' : 'Save campaign';

  if(error) {
    feedback.style.display='block';
    feedback.style.color='var(--accent)';
    feedback.textContent = '✗ Error saving: '+error.message;
  } else {
    feedback.style.display = 'none';
    window._lastSavedBriefId = data ? data.id : null;
    window._lastSavedBriefTitle = title;
    // Link brief back to calendar campaign if opened from one
    if (BB && BB._calCampaignId && window._lastSavedBriefId) {
      fetch('https://humitzrleflxnlnodpde.supabase.co/rest/v1/campaigns?id=eq.'+BB._calCampaignId, {
        method:'PATCH',
        headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
        body:JSON.stringify({brief_id: window._lastSavedBriefId})
      }).catch(function(e){ console.warn('linkBriefToCalCampaign:', e); });
    }
    if (data && data.id) bbSetUrlBrief(data.id);
    loadBriefs();
    if (data && data.id && BB.start_date && BB.end_date && BB.budget > 0) { bbSaveBudgetCommitments(data.id, title); }
    if (data && data.id && BB._calCampaignId) {
      var _a3 = SUPABASE_ANON_KEY, _b3 = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
      fetch(_b3+'/campaigns?id=eq.'+BB._calCampaignId, {method:'PATCH', headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}), body:JSON.stringify({status:'briefed',brief_id:data.id})}).catch(function(){});
    }
    // Always load fresh team/perms/campaign state then render
    var _anon2 = SUPABASE_ANON_KEY, _base2 = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1', _h2 = getAuthHeaders();
    var _briefId2 = data ? data.id : null;
    Promise.all([
      fetch(_base2+'/campaign_team?select=*&active=eq.true',{headers:_h2}).then(function(r){return r.json();}),
      fetch(_base2+'/campaign_permissions?select=*',{headers:_h2}).then(function(r){return r.json();}),
      _briefId2 ? fetch(_base2+'/campaigns?brief_id=eq.'+_briefId2+'&select=*',{headers:_h2}).then(function(r){return r.json();}) : Promise.resolve([]),
    ]).then(function(results) {
      (Array.isArray(results[0])?results[0]:[]).forEach(function(m){CB_TEAM[m.id]=m;});
      (Array.isArray(results[1])?results[1]:[]).forEach(function(p){CB_PERMS[p.team_member_id]=p;});
      CB_CAMPAIGNS = CB_CAMPAIGNS || [];
      (Array.isArray(results[2])?results[2]:[]).forEach(function(c){
        if (!CB_CAMPAIGNS.find(function(x){return x.id===c.id;})) CB_CAMPAIGNS.push(c);
      });
      // Auto-detect user from email
      if (!CB_CURRENT_USER && window.SB_USER && SB_USER.email) {
        var _match2 = Object.values(CB_TEAM).find(function(m){return m.email&&m.email.toLowerCase()===SB_USER.email.toLowerCase();});
        if (_match2) CB_CURRENT_USER = _match2.id;
      }
      // Show feedback based on brief status
      var _savedStatus = data ? data.status : 'draft';
      if (_savedStatus === 'campaigned') {
        showToast('Campaign updated ✓ Refreshing…', 'success');
        setTimeout(function() { bbEnterCampaignMode(data); }, 800);
      } else {
        // Re-render campaign section with fresh status (resets any stuck button states)
        var _updatedBrief = data || {id: window._lastSavedBriefId, title: window._lastSavedBriefTitle, status: _savedStatus};
        if (_savedStatus === 'approved' || _savedStatus === 'submitted') {
          var _campSec = document.getElementById('bb-campaign-section');
          if (_campSec) _campSec.style.display = 'block';
          bbRenderCampaignSection(_updatedBrief);
        } else {
          bbShowPostSave(data ? data.id : null, _savedStatus, data ? data.job_ref : window._lastJobRef);
        }
        showToast('Campaign updated ✓', 'success');
      }
    });
  }
}


async function bbSaveBudgetCommitments(briefId, briefTitle) {
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var hdrs = getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'});
  try {
    await fetch(base + '/brief_budget_commitments?brief_id=eq.' + briefId, { method:'DELETE', headers:hdrs });
    var months = bbGetCampaignMonths(BB.start_date, BB.end_date);
    if (!months.length || !BB.brand) return;
    var sites = (BB.scope === 'sites' && BB.site_ids && BB.site_ids.length)
      ? BB.site_ids
      : HUB_SITES.filter(function(s){ return s.brand_id === BB.brand.id; }).map(function(s){ return s.site_id; });
    if (!sites.length) return;
    var rows = [];
    sites.forEach(function(sid) {
      // Use per-site split if available, otherwise divide equally
      var siteBudget = (BB.site_splits && BB.site_splits[sid] != null)
        ? BB.site_splits[sid]
        : Math.round(BB.budget / sites.length);
      var perMonth = Math.round(siteBudget / months.length);
      months.forEach(function(m) {
        rows.push({ brief_id:briefId, site_id:sid, brand_id:BB.brand.id, month_index:m.index, year:PLAN_YEAR, amount:perMonth, brief_title:briefTitle });
      });
    });
    await fetch(base + '/brief_budget_commitments', { method:'POST', headers:hdrs, body:JSON.stringify(rows) });
    console.log('Commitments saved: £' + BB.budget.toLocaleString() + ' across ' + rows.length + ' rows');
    bbLoadHeadroom();
    await loadBriefCommitmentsForTracker();
    if (typeof renderBudgetTracker === 'function') renderBudgetTracker();
  } catch(e) { console.warn('bbSaveBudgetCommitments:', e); }
}


async function bbRenderBrandContext() {
  var el = document.getElementById('bb-brand-context');
  if (!el || !BB.brand) { if(el) el.style.display='none'; return; }
  el.style.display = 'block';
  var b = BB.brand;

  // ── Budget health ──
  var totalPlanned = 0, totalCommitted = 0;
  if (typeof HUB_SITES !== 'undefined') {
    HUB_SITES.filter(function(s){ return s.brand_id === b.id; }).forEach(function(site) {
      var d = SITE_BUDGETS[site.site_id] || {};
      for (var i = 0; i < 12; i++) totalPlanned += d['m'+i+'_planned'] || 0;
      var cm = BRIEF_COMMITMENTS[site.site_id] || {};
      Object.values(cm).forEach(function(v){ totalCommitted += v; });
    });
  }
  var headroom = totalPlanned - totalCommitted;
  var pct = totalPlanned > 0 ? Math.round(totalCommitted / totalPlanned * 100) : 0;
  var budgetColour = pct > 80 ? '#DC2626' : pct > 50 ? '#D97706' : '#059669';
  var budgetEmoji  = pct > 80 ? '🔴' : pct > 50 ? '🟡' : '🟢';
  var budgetMsg;
  if (totalPlanned === 0) {
    budgetMsg = "No budget plan set up yet for " + b.name + ". Head to <strong>Budget</strong> to get that sorted — you'll thank yourself later.";
  } else if (pct > 80) {
    budgetMsg = "<strong>Tight one.</strong> " + b.name + " has used " + pct + "% of its annual plan. <strong>£" + headroom.toLocaleString() + "</strong> left in the pot. Go lean, or have a word with Marcus first.";
  } else {
    budgetMsg = "<strong>£" + headroom.toLocaleString() + "</strong> headroom remaining across " + b.name + " sites. " + (pct < 30 ? "Plenty to work with. Don't get too comfortable. 😉" : "Getting there. Make it count.");
  }

  // ── Active campaigns ──
  var activeCamps = (CB_CAMPAIGNS || []).filter(function(camp) {
    return camp.brand_id === b.id && camp.status === 'active';
  });
  var conflictHtml = '';
  if (activeCamps.length > 0) {
    conflictHtml = '<div class="bb-context-card" style="border-color:#FCD34D">'
      + '<div class="bb-context-header"><span class="bb-context-emoji">⚠️</span><span class="bb-context-title">Active right now</span></div>'
      + '<div class="bb-context-body"><div class="bb-context-sub">'
      + activeCamps.map(function(camp){
          return '<strong>' + camp.title + '</strong> is live (Stage ' + (camp.current_stage||1) + ' of 6). Check your dates don\'t clash — the team\'s already busy.';
        }).join('<br>')
      + '</div></div></div>';
  }

  // ── Brand KPI pulse ──
  var kpi = BRAND_KPIS_DATA[b.id] || {};
  var kpiHtml = '';
  if (kpi.ev_target || kpi.lead_target || kpi.coop_available) {
    var kpiLines = [];
    if (kpi.ev_target) kpiLines.push('EV% target: <strong>' + kpi.ev_target + '%</strong>');
    if (kpi.lead_target) kpiLines.push('Lead target: <strong>' + kpi.lead_target.toLocaleString() + '/month</strong>');
    if (kpi.coop_available) kpiLines.push('Co-op available: <strong>£' + Number(kpi.coop_available).toLocaleString() + '</strong> — ask Marcus');
    kpiHtml = '<div class="bb-context-card">'
      + '<div class="bb-context-header"><span class="bb-context-emoji">📊</span><span class="bb-context-title">Brand targets this quarter</span></div>'
      + '<div class="bb-context-body"><div class="bb-context-sub">' + kpiLines.join(' · ') + '</div></div>'
      + '</div>';
  }

  // ── CPL benchmarks ──
  var cplHtml = '<div class="bb-context-card">'
    + '<div class="bb-context-header"><span class="bb-context-emoji">🎯</span><span class="bb-context-title">' + b.name + ' CPL benchmarks</span></div>'
    + '<div class="bb-context-body">'
    + '<div class="bb-intel-grid">'
    + '<div class="bb-intel-stat"><div class="bb-intel-stat-val">£' + b.cpl.google + '</div><div class="bb-intel-stat-label">Google Search</div></div>'
    + '<div class="bb-intel-stat"><div class="bb-intel-stat-val">£' + b.cpl.meta + '</div><div class="bb-intel-stat-label">Meta Social</div></div>'
    + (b.cpl.autotrader ? '<div class="bb-intel-stat"><div class="bb-intel-stat-val">£' + b.cpl.autotrader + '</div><div class="bb-intel-stat-label">AutoTrader</div></div>' : '')
    + '</div>'
    + '<div class="bb-context-sub" style="margin-top:8px">Based on Swansway group benchmarks. Your actual CPL will vary by campaign type, season and how much your proposition actually makes people want the car. 🤷</div>'
    + '</div></div>';

  // ── Tone & models ──
  var toneHtml = '<div class="bb-context-card">'
    + '<div class="bb-context-header"><span class="bb-context-emoji">🎨</span><span class="bb-context-title">Brand voice &amp; key models</span></div>'
    + '<div class="bb-context-body">'
    + '<div class="bb-context-sub" style="margin-bottom:8px"><em>"' + b.tagline + '"</em> — ' + b.tone.slice(0,3).join(', ') + '. Keep it consistent.</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:5px">'
    + b.models.map(function(m){ return '<span style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:3px 8px;font-size:11px;font-weight:500">' + m + '</span>'; }).join('')
    + '</div>'
    + '</div></div>';

  // ── No autopsy nudge ──
  var autopsyHtml = '<div class="bb-context-card" style="border-style:dashed">'
    + '<div class="bb-context-header"><span class="bb-context-emoji">🔬</span><span class="bb-context-title">Post-campaign data</span></div>'
    + '<div class="bb-context-body"><div class="bb-context-sub">No campaign autopsies for ' + b.name + ' yet. Run a campaign, wrap it up, then <a onclick="switchView(\'autopsy\', document.querySelector(\'[data-view=autopsy]\'))">add a post-mortem</a>. Future you will be grateful.</div></div>'
    + '</div>';

  // ── Budget bar ──
  var budgetCardHtml = '<div class="bb-context-card" style="border-color:' + budgetColour + '20">'
    + '<div class="bb-context-header"><span class="bb-context-emoji">' + budgetEmoji + '</span><span class="bb-context-title">Annual budget health — ' + b.name + '</span></div>'
    + '<div class="bb-context-body">'
    + '<div class="bb-context-sub">' + budgetMsg + '</div>'
    + (totalPlanned > 0 ? '<div class="bb-context-bar-track"><div class="bb-context-bar-fill" style="width:' + Math.min(100,pct) + '%;background:' + budgetColour + '"></div></div><div class="bb-context-bar-labels"><span>£' + totalCommitted.toLocaleString() + ' committed</span><span>£' + totalPlanned.toLocaleString() + ' planned</span></div>' : '')
    + '</div></div>';

  el.innerHTML = budgetCardHtml + conflictHtml + kpiHtml + cplHtml + toneHtml + autopsyHtml;
}


function bbRenderBudgetIntel() {
  var el = document.getElementById('bb-budget-intel');
  if (!el || !BB.brand) { if(el) el.style.display='none'; return; }
  el.style.display = 'block';
  var b = BB.brand;
  var budget = BB.budget || 5000;
  var weeks  = BB.duration ? BB.duration.weeks : 4;
  var cpl    = b.cpl.google || 48;
  var estLeads = Math.round(budget / cpl);
  var weekly  = Math.round(budget / weeks);
  var coop    = BB.coop_available || 0;
  var totalBudget = budget + coop;

  var leadsTake;
  if (estLeads > 200) leadsTake = "That's a lot of leads. Make sure the team can handle the calls. ☎️";
  else if (estLeads > 80) leadsTake = "Solid volume. Enough to keep the phones warm without burning anyone out.";
  else if (estLeads > 30) leadsTake = "Decent for a focused campaign. Quality over quantity — make each one count.";
  else leadsTake = "Tight budget, tight funnel. CPL discipline is everything here.";

  var coopLine = coop > 0
    ? '<div class="bb-context-sub" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">💰 <strong>Co-op available:</strong> £' + coop.toLocaleString() + ' manufacturer contribution brings total to <strong>£' + totalBudget.toLocaleString() + '</strong>. Don\'t leave it on the table.</div>'
    : '';

  el.innerHTML = '<div class="bb-context-card">'
    + '<div class="bb-context-header"><span class="bb-context-emoji">🧠</span><span class="bb-context-title">What does £' + budget.toLocaleString() + ' actually buy you?</span></div>'
    + '<div class="bb-context-body">'
    + '<div class="bb-intel-grid">'
    + '<div class="bb-intel-stat"><div class="bb-intel-stat-val">~' + estLeads + '</div><div class="bb-intel-stat-label">Est. leads (Google CPL £' + cpl + ')</div></div>'
    + '<div class="bb-intel-stat"><div class="bb-intel-stat-val">£' + weekly.toLocaleString() + '</div><div class="bb-intel-stat-label">Per week over ' + weeks + ' weeks</div></div>'
    + '</div>'
    + '<div class="bb-context-sub" style="margin-top:10px">' + leadsTake + '</div>'
    + coopLine
    + '</div></div>';
}


function bbRenderStep2Context() {
  var el = document.getElementById('bb-step2-context');
  if (!el || !BB.brand || !BB.ctype) { if(el) el.style.display='none'; return; }
  el.style.display = 'block';
  var ctype = BB.ctype;
  var brand = BB.brand;

  var typeInsights = {
    'plate':     { emoji:'🔑', headline:'Plate changes — the bread and butter.', copy:'March and September are your golden windows. Competition is fierce, budgets spike, and CPL climbs by ~30%. Start creative early and lock your proposition down before it gets chaotic.' },
    'awareness': { emoji:'📣', headline:'Awareness — playing the long game.', copy:'No one sees the ROI for 6 months and everyone panics. Stay calm. Ehrenberg-Bass says this is exactly when you\'re building the brand that wins future plate changes. Trust the model.' },
    'ev':        { emoji:'⚡', headline:'EV campaigns — the future is now awkward.', copy:'Range anxiety is real. Price anchoring is real. But conquest from ICE owners is the biggest opportunity in automotive right now. Lead with total cost of ownership and make it human.' },
    'finance':   { emoji:'💳', headline:'Finance offers — the numbers have to sing.', copy:'Your APR has to be competitive or the creative doesn\'t matter. Get Beth to sign off on the offer first, build creative second. Finance campaigns live or die in the first line of copy.' },
    'conquest':  { emoji:'🏆', headline:'Conquest — going after their customers.', copy:'You need a compelling switch reason beyond "we\'re great too". PX value, service superiority, or a killer finance offer. Meta custom audiences of competitor owners are your best weapon here.' },
  };

  var key = ctype.id || '';
  var insight = typeInsights[key] || {
    emoji: '🎯',
    headline: ctype.name + ' — let\'s make it count.',
    copy: 'No historical data for this campaign type yet. Run it, wrap it up well, and add a post-mortem so future campaigns start smarter.'
  };

  el.innerHTML = '<div class="bb-context-card">' +
    '<div class="bb-context-header">' +
      '<span class="bb-context-emoji">' + insight.emoji + '</span>' +
      '<span class="bb-context-title">What works for ' + ctype.name + '</span>' +
    '</div>' +
    '<div class="bb-context-body">' +
      '<div class="bb-context-headline">' + insight.headline + '</div>' +
      '<div class="bb-context-sub">' + insight.copy + '</div>' +
    '</div>' +
    '</div>';
}


function bbRenderStep4Context() {
  var el = document.getElementById('bb-step4-context');
  if (!el) return;
  el.style.display = 'block';
  if (!BB.brand || !BB.audiences || !BB.audiences.length) {
    el.innerHTML = '';
    return;
  }

  var audienceInsights = {
    'intender':   { warn:null, tip:'High intent = high CPL. These people are close to buying — don\'t waste them on brand awareness. Make every touchpoint a conversion opportunity.' },
    'conquest':   { warn:'⚠️ Competitor conquest CPL is ~40% higher than your baseline.', tip:'Worth it if your switch reason is strong. Weak proposition here = expensive clicks and no cars.' },
    'existing':   { warn:null, tip:'Your most efficient audience. They already trust you. Loyalty and service upsell campaigns convert at 2–3× the rate of cold audiences.' },
    'ev-curious': { warn:'⚠️ EV-curious audiences are in research mode — long journey, low urgency.', tip:'Lead gen > direct conversion here. Get them on a test drive and let the car do the rest.' },
    'lapsed':     { warn:null, tip:'They left for a reason. Find out why before you retarget. A discount-first approach rarely fixes a trust problem.' },
  };

  var html = '';
  BB.audiences.forEach(function(aud) {
    var insight = audienceInsights[aud.id] || { warn: null, tip: 'No specific benchmarks for this audience yet — watch your CPL carefully in the first week.' };
    html += '<div class="bb-context-card">' +
      '<div class="bb-context-header">' +
        '<span class="bb-context-emoji">' + aud.icon + '</span>' +
        '<span class="bb-context-title">' + aud.name + '</span>' +
        '<span class="sw-pill sw-pill-muted" style="margin-left:auto">' + aud.size + '</span>' +
      '</div>' +
      '<div class="bb-context-body">' +
        (insight.warn ? '<div class="bb-context-sub" style="color:#D97706;font-weight:600;margin-bottom:6px">' + insight.warn + '</div>' : '') +
        '<div class="bb-context-sub">' + insight.tip + '</div>' +
        '<div class="bb-intel-grid">' +
          '<div class="bb-intel-stat"><div class="bb-intel-stat-val">×' + (aud.cpl_mult||1).toFixed(1) + '</div><div class="bb-intel-stat-label">CPL multiplier</div></div>' +
          '<div class="bb-intel-stat"><div class="bb-intel-stat-val">' + aud.size + '</div><div class="bb-intel-stat-label">Market share</div></div>' +
        '</div>' +
      '</div>' +
      '</div>';
  });

  el.innerHTML = html;
}


function bbRenderStep5Context() {
  var el = document.getElementById('bb-step5-context');
  if (!el || !BB.brand) { if(el) el.style.display='none'; return; }
  el.style.display = 'block';

  var brand = BB.brand;
  var siteId = BB.site_id;
  var atRank = null;
  if (siteId && typeof SITE_KPIS !== 'undefined' && SITE_KPIS[siteId]) {
    atRank = SITE_KPIS[siteId].autotrader_rank || null;
  }

  var channels = BB.channels || [];
  var channelCount = channels.length;
  var hasPaid = channels.some(function(ch){ return ch.category === 'P'; });
  var hasSocial = channels.some(function(ch){ return ch.category === 'S'; });

  var tips = [];
  if (channelCount === 0) tips.push({ emoji:'💡', text:'No channels selected yet. Pick your PESO mix above and the brief will calculate your indicative spend split automatically.' });
  if (channelCount > 6)  tips.push({ emoji:'⚠️', text:'You\'ve selected ' + channelCount + ' channels. Spreading budget across more than 5–6 channels at this budget level means nothing gets enough fuel to work. Be brutal.' });
  if (hasPaid && !hasSocial) tips.push({ emoji:'📱', text:'No social in the mix. Even a small Meta retargeting budget improves Google conversion rates by warming audiences first. Consider adding it.' });
  if (atRank) tips.push({ emoji:'🚗', text: (siteId || brand.name) + ' AutoTrader rank: <strong>#' + atRank + '</strong>. ' + (atRank <= 10 ? 'Strong position — your PPC budget is working. Keep digital channels prioritised.' : 'Room to climb. More budget into AutoTrader Promoted Listings could move this significantly.') });
  if (!atRank && siteId) tips.push({ emoji:'🚗', text:'No AutoTrader rank data for this site yet. Add it in the KPI tracker so future briefs can factor it in.' });

  if (!tips.length) tips.push({ emoji:'✅', text:'Good channel mix. ' + channelCount + ' channels across the PESO model. Make sure your proposition works hard across all of them — one message, many placements.' });

  el.innerHTML = '<div class="bb-context-card">' +
    '<div class="bb-context-header"><span class="bb-context-emoji">📡</span><span class="bb-context-title">Channel intelligence</span></div>' +
    '<div class="bb-context-body">' +
      tips.map(function(t){ return '<div class="bb-context-sub" style="display:flex;gap:8px;margin-bottom:8px"><span>' + t.emoji + '</span><span>' + t.text + '</span></div>'; }).join('') +
    '</div>' +
    '</div>';
}


async function bbEnterCampaignMode(brief) {
  // Load team/perms first
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var hdrs = getAuthHeaders();

  if (!Object.keys(CB_TEAM).length) {
    var t = await fetch(base+'/campaign_team?select=*&active=eq.true',{headers:hdrs}).then(function(r){return r.json();});
    var p = await fetch(base+'/campaign_permissions?select=*',{headers:hdrs}).then(function(r){return r.json();});
    (Array.isArray(t)?t:[]).forEach(function(m){CB_TEAM[m.id]=m;});
    (Array.isArray(p)?p:[]).forEach(function(x){CB_PERMS[x.team_member_id]=x;});
  }
  await swEnsureUser();

  // Load campaign linked to this brief
  var camps = await fetch(base+'/campaigns?brief_id=eq.'+brief.id+'&select=*',{headers:hdrs}).then(function(r){return r.json();});
  var camp = Array.isArray(camps) && camps.length ? camps[0] : null;
  if (!camp) { console.warn('bbEnterCampaignMode: no campaign found for brief', brief.id); return; }

  // Load tasks
  var tasks = await fetch(base+'/campaign_tasks?campaign_id=eq.'+camp.id+'&order=stage,task_order',{headers:hdrs}).then(function(r){return r.json();});
  if (!Array.isArray(tasks)) tasks = [];

  // Store for later
  window._bbCampModeActive = true;
  window._bbCampModeCamp = camp;
  window._bbCampModeTasks = tasks;
  window._bbCampModeBrief = brief;

  // ── Transform LEFT sidebar ──
  var left = document.getElementById('bb-left');
  if (left) {
    left.dataset.origContent = left.innerHTML;
    bbRenderCampaignSidebar(left, brief, camp, tasks);
  }

  // ── Hide step wizard, show campaign canvas ──
  var indicator = document.getElementById('bb-step-indicator');
  var progress  = document.getElementById('bb-progress-track');
  if (indicator) indicator.style.display = 'none';
  if (progress)  progress.style.display  = 'none';
  document.querySelectorAll('.bb-step').forEach(function(s){ s.style.display = 'none'; });
  var _sb2 = document.getElementById('bb-save-bar');
  if (_sb2) _sb2.style.display = 'none';
  var _op2 = document.getElementById('bb-output');
  if (_op2) _op2.innerHTML = '';

  var right = document.getElementById('bb-right');
  if (right) {
    var canvas = document.getElementById('bb-campaign-canvas');
    if (!canvas) {
      canvas = document.createElement('div');
      canvas.id = 'bb-campaign-canvas';
      right.appendChild(canvas);
    }
    canvas.style.display = 'block';
    bbRenderCampaignCanvas(canvas, brief, camp, tasks);
  }
}


function bbRenderCampaignSidebar(el, brief, camp, tasks) {
  var brand = BB_BRANDS.find(function(b){return b.id===brief.brand_id;}) || {};
  var brandColor = brand.color || 'var(--swansway)';
  var currentStage = camp.current_stage || 1;
  var SN = ['Pre-Production','Production','Pre-Live Approval','Go Live','In-Flight','Close & Review'];
  var SI = ['\uD83D\uDCCB','\u2699\uFE0F','\u2705','\uD83D\uDE80','\uD83D\uDCCA','\uD83C\uDFC1'];

  // Progress
  var total = tasks.length;
  var approved = tasks.filter(function(t){return t.approved;}).length;
  var pct = total > 0 ? Math.round(approved/total*100) : 0;
  var myTasks = tasks.filter(function(t){return t.assigned_to === CB_CURRENT_USER && !t.approved;});

  // Budget / dates
  var budget = brief.budget ? '\u00a3' + Number(brief.budget).toLocaleString() : '\u2014';
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var dateStr = '\u2014';
  if (brief.start_date && brief.end_date) {
    var sd = new Date(brief.start_date+'T00:00:00'), ed = new Date(brief.end_date+'T00:00:00');
    dateStr = sd.getDate()+' '+months[sd.getMonth()]+' \u2013 '+ed.getDate()+' '+months[ed.getMonth()]+' '+ed.getFullYear();
  }

  // Stage pips
  var pips = SN.map(function(sn,i){
    var s = i+1;
    var done = s < currentStage, active = s === currentStage;
    var bg = done?'#059669':active?'var(--accent)':'rgba(255,255,255,0.1)';
    var tc = (done||active)?'#fff':'rgba(255,255,255,0.3)';
    return '<div style="flex:1;height:4px;border-radius:2px;background:'+bg+';title=\''+sn+'\'"></div>';
  }).join('');

  // Team avatars with task counts
  var byMember = {};
  tasks.forEach(function(t){
    if (!t.assigned_to) return;
    if (!byMember[t.assigned_to]) byMember[t.assigned_to] = {total:0,done:0};
    byMember[t.assigned_to].total++;
    if (t.approved) byMember[t.assigned_to].done++;
  });
  var teamHtml = Object.keys(byMember).slice(0,8).map(function(mid){
    var m = CB_TEAM[mid] || {name:mid};
    var initials = m.name.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase();
    var color = m.color || 'var(--swansway)';
    var stats = byMember[mid];
    return '<div title="'+m.name+' \u2014 '+stats.done+'/'+stats.total+' done" style="display:flex;flex-direction:column;align-items:center;gap:3px">'
      + '<div style="width:32px;height:32px;border-radius:50%;background:'+color+';display:flex;align-items:center;justify-content:center;font-family:var(--font-m);font-size:11px;font-weight:700;color:#fff;border:2px solid rgba(255,255,255,0.15)">'+initials+'</div>'
      + '<div style="font-size:8px;font-family:var(--font-m);color:rgba(255,255,255,0.4)">'+stats.done+'/'+stats.total+'</div>'
    + '</div>';
  }).join('');

  // Blocker status
  var blockers = tasks.filter(function(t){return t.stage===currentStage&&t.is_blocker;});
  var blockersApproved = blockers.filter(function(t){return t.approved;}).length;
  var blockerHtml = blockers.length
    ? '<div style="margin-top:10px;padding:8px 10px;background:rgba(255,255,255,0.06);border-radius:6px;font-size:11px;color:rgba(255,255,255,0.6)">'
      + '<span style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.35)">Stage blockers</span><br>'
      + '<span style="font-size:14px;font-weight:700;color:'+(blockersApproved===blockers.length?'#34D399':'#FCD34D')+'">'
      + blockersApproved+'/'+blockers.length+'</span> approved'
    + '</div>'
    : '';

  el.innerHTML =
    '<div style="height:4px;background:'+brandColor+';margin:-1.5rem -1.5rem 1.25rem;border-radius:0"></div>'
    + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:4px">Live campaign</div>'
    + (brief.job_ref ? '<div style="font-size:10px;font-family:var(--font-m);color:rgba(255,255,255,0.65);letter-spacing:0.08em;margin-bottom:4px">' + brief.job_ref + '</div>' : '')
    + '<div style="font-family:var(--font-d);font-size:18px;font-weight:700;color:#fff;line-height:1.2;margin-bottom:1rem;letter-spacing:-0.01em">'+(brief.title||brand.name||'Campaign')+'</div>'

    // Stage progress bar
    + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:6px">Stage '+currentStage+' of 6 \u2014 '+SN[currentStage-1]+'</div>'
    + '<div style="display:flex;gap:2px;margin-bottom:16px">'+pips+'</div>'

    // Overall progress
    + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:5px">Overall progress</div>'
    + '<div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin-bottom:4px"><div style="height:4px;background:'+brandColor+';width:'+pct+'%;border-radius:2px;transition:width .4s"></div></div>'
    + '<div style="font-family:var(--font-m);font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:1rem">'+approved+' of '+total+' tasks approved ('+pct+'%)</div>'

    // My tasks
    + (myTasks.length ? '<div style="padding:8px 10px;background:rgba(200,16,46,0.15);border:1px solid rgba(200,16,46,0.3);border-radius:6px;margin-bottom:1rem;font-size:12px;color:#fff">'
      + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Your tasks</div>'
      + '<div style="font-weight:700">'+myTasks.length+' task'+(myTasks.length>1?'s':'')+' waiting for you</div>'
      + '</div>' : '')

    // Brief details
    + '<div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:1rem;display:flex;flex-direction:column;gap:10px">'
      + bbCampSidebarRow('Brand', brand.name||'\u2014')
      + bbCampSidebarRow('Campaign type', (brief.campaign_type)||'\u2014')
      + bbCampSidebarRow('Budget', budget)
      + bbCampSidebarRow('Dates', dateStr)
      + bbCampSidebarRow('Site', (function() {
          if (brief.scope === 'sites' || brief.scope === 'site') {
            var sids = bbParseSiteIds(brief);
            if (sids.length) return bbSiteNames(sids);
          }
          return brand.name ? brand.name + ' (all sites)' : '\u2014';
        })())
    + '</div>'

    // Blocker status
    + blockerHtml

    // Team avatars
    + (teamHtml ? '<div style="margin-top:1rem;border-top:1px solid rgba(255,255,255,0.07);padding-top:1rem">'
      + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:10px">Team</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'+teamHtml+'</div>'
      + '</div>' : '')

    // Exit button
    + '<div style="margin-top:auto;padding-top:1.25rem">'
      + '<button onclick="bbExitCampaignMode()" style="width:100%;padding:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:rgba(255,255,255,0.7);font-family:var(--font-b);font-size:12px;font-weight:600;cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'rgba(255,255,255,0.14)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.08)\'">\u2190 Edit brief</button>'
    + '</div>';
}


function bbCampSidebarRow(label, val) {
  return '<div>'
    + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:2px">'+label+'</div>'
    + '<div style="font-size:13px;color:#fff;font-weight:500">'+val+'</div>'
  + '</div>';
}


function bbRenderCampaignCanvas(canvas, brief, camp, tasks) {
  var canApprove = !!(CB_PERMS[CB_CURRENT_USER] && (CB_PERMS[CB_CURRENT_USER].can_approve_all || CB_PERMS[CB_CURRENT_USER].can_approve_digital));
  var canAdvance = !!(CB_PERMS[CB_CURRENT_USER] && CB_PERMS[CB_CURRENT_USER].can_advance_stage);
  var currentStage = camp.current_stage || 1;
  var brand = BB_BRANDS.find(function(b){return b.id===brief.brand_id;}) || {};
  var brandColor = brand.color || 'var(--swansway)';
  var total = tasks.length;
  var approved = tasks.filter(function(t){return t.approved;}).length;
  var pct = total > 0 ? Math.round(approved/total*100) : 0;

  canvas.innerHTML = '';

  // ── Campaign header strip ──
  var header = document.createElement('div');
  header.style.cssText = 'background:var(--white);border:1.5px solid var(--border);border-radius:8px;margin-bottom:20px;overflow:hidden';
  header.innerHTML =
    '<div style="border-left:5px solid '+brandColor+';padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px">'
      + '<div>'
        + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:4px">Live campaign \u2014 Stage '+currentStage+' of 6</div>'
        + '<div style="font-family:var(--font-d);font-size:20px;font-weight:700;color:var(--ink);letter-spacing:-0.01em">'+(brief.title||'Campaign')+'</div>'
      + '</div>'
      + '<div style="display:flex;gap:8px;align-items:center;flex-shrink:0">'
        + (canAdvance && currentStage < 6
          ? '<button class="btn btn-primary" data-cid="'+camp.id+'" data-stage="'+currentStage+'" onclick="bbCampAdvance(this.dataset.cid,parseInt(this.dataset.stage))">Advance to Stage '+(currentStage+1)+' \u2192</button>'
          : '')
        + '<button class="btn" onclick="bbExitCampaignMode()">\u2190 Edit brief</button>'
      + '</div>'
    + '</div>'
    + '<div style="padding:0 20px 12px">'
      + '<div style="height:4px;background:var(--surface-2);border-radius:2px;overflow:hidden;margin-bottom:5px"><div style="height:4px;background:'+brandColor+';width:'+pct+'%;border-radius:2px;transition:width .5s"></div></div>'
      + '<div style="display:flex;justify-content:space-between;font-family:var(--font-m);font-size:10px;color:var(--ink-faint)">'
        + '<span>'+approved+' of '+total+' tasks approved</span><span>'+pct+'% complete</span>'
      + '</div>'
    + '</div>';
  canvas.appendChild(header);

  // ── All 6 stages — Slack scroll ──
  for (var s = 1; s <= 6; s++) {
    var stageContainer = document.createElement('div');
    stageContainer.id = 'bb-camp-stage-'+camp.id+'-'+s;
    stageContainer.style.cssText = s > currentStage ? 'opacity:0.4;pointer-events:none;margin-bottom:4px' : 'margin-bottom:4px';
    canvas.appendChild(stageContainer);
    bbShowStageDetail(s, tasks, currentStage, stageContainer, camp, canApprove);
  }
}


async function bbCampAdvance(campId, currentStage) {
  // optimistic — no confirm
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var newStage = currentStage + 1;
  try {
    var r = await fetch(base+'/campaigns?id=eq.'+campId, {
      method:'PATCH',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=representation'}),
      body:JSON.stringify({current_stage:newStage,updated_at:new Date().toISOString()})
    });
    if (!r.ok) throw new Error(await r.text());
    var updated = await r.json();
    window._bbCampModeCamp = Array.isArray(updated) ? updated[0] : updated;
    // Reload campaign mode with updated camp
    var brief = window._bbCampModeBrief;
    if (brief) await bbEnterCampaignMode(brief);
  } catch(e) { alert('Error: '+e.message); }
}


function bbExitCampaignMode() {
  window._bbCampModeActive = false;

  // Show step indicator + progress
  var indicator = document.getElementById('bb-step-indicator');
  var progress  = document.getElementById('bb-progress-track');
  if (indicator) indicator.style.display = '';
  if (progress)  progress.style.display  = '';

  // Hide campaign canvas
  var canvas = document.getElementById('bb-campaign-canvas');
  if (canvas) canvas.style.display = 'none';

  // Restore sidebar to original brief panel HTML
  var left = document.getElementById('bb-left');
  if (left && typeof BB_LEFT_ORIGINAL_HTML !== 'undefined') {
    left.innerHTML = BB_LEFT_ORIGINAL_HTML;
  } else if (left) {
    delete left.dataset.origContent;
  }

  // Go to step 1 — must reset inline display:none set by bbEnterCampaignMode
  document.querySelectorAll('.bb-step').forEach(function(s){
    s.classList.remove('bb-active');
    s.style.display = ''; // clear inline style so CSS class can control visibility
  });
  BB.step = 1;
  bbGoStep(1);

  // Re-apply brand selection visually — AFTER bbGoStep re-renders the grid
  setTimeout(function() {
    if (BB.brand) {
      // Mark correct pill — bbGoStep(1) calls bbRenderBrands() which wipes classes
      document.querySelectorAll('.bb-brand-pill').forEach(function(p) {
        p.classList.toggle('bb-selected', p.dataset.brand === BB.brand.id);
      });
      // Re-render sidebar and context
      bbUpdateBrief();
      bbRenderBrandContext();
      // Show scope + dates sections
      var scopeSec = document.getElementById('bb-scope-section');
      var datesSec = document.getElementById('bb-dates-section');
      if (scopeSec) scopeSec.style.display = 'block';
      if (datesSec) datesSec.style.display = 'block';
      // Restore site picker if site scope
      if (BB.scope === 'site' || BB.scope === 'sites') {
        if (BB.scope === 'site') BB.scope = 'sites'; // migrate old value
        var scopeSiteBtn = document.getElementById('scope-site');
        var scopeBrandBtn = document.getElementById('scope-brand');
        if (scopeSiteBtn) scopeSiteBtn.classList.add('bb-selected');
        if (scopeBrandBtn) scopeBrandBtn.classList.remove('bb-selected');
        var picker = document.getElementById('bb-site-picker');
        if (picker) { picker.style.display = 'block'; setTimeout(bbRenderSiteGrid, 100); }
      }
      // Enable next button
      var btn1 = document.getElementById('bb-btn-1-next');
      if (btn1) btn1.disabled = false;
      // Re-render site grid if scope is sites — DOM was restored from cache so grid is empty
      if (BB.scope === 'sites' && BB.site_ids && BB.site_ids.length) {
        var _picker = document.getElementById('bb-site-picker');
        if (_picker) {
          _picker.style.display = 'block';
          bbUpdateSiteCount();
          setTimeout(bbRenderSiteGrid, 50);
        }
      }
    }
  }, 200);
}


function bbNewBrief() {
  if (window._bbBriefLoading) { return; }
  if (window._bbSuppressNewBrief) { window._bbSuppressNewBrief = false; return; }
  // Restore sidebar to original brief panel HTML (campaign mode overwrites it)
  var _left = document.getElementById('bb-left');
  if (_left && typeof BB_LEFT_ORIGINAL_HTML !== 'undefined') {
    _left.innerHTML = BB_LEFT_ORIGINAL_HTML;
  }
  if (window._bbCampModeActive) bbExitCampaignMode();
  BB.brand = null; BB.ctype = null; BB.budget = 5000; BB.duration = null;
  BB.audiences = []; BB.channels = []; BB.channel_split = {}; BB.objective = null;
  BB.proposition = ''; BB.start_date = ''; BB.end_date = '';
  BB.site_id = ''; BB.site_ids = []; BB.site_splits = {}; BB.scope = 'brand'; BB.step = 1;
  BB._calCampaignId = null;
  window._lastSavedBriefId = null;
  window._lastSavedBriefTitle = null;
  history.replaceState(null, '', window.location.pathname + '?view=brief');
  var titleEl = document.getElementById('bb-brief-title');
  if (titleEl) titleEl.value = '';
  var feedback = document.getElementById('bb-save-feedback');
  if (feedback) { feedback.style.display = 'none'; feedback.innerHTML = ''; }
  var saveBtn = document.getElementById('bb-save-btn');
  if (saveBtn) { saveBtn.textContent = 'Save campaign'; saveBtn.disabled = false; saveBtn.style.background = ''; }
  var saveBar = document.getElementById('bb-save-bar');
  if (saveBar) saveBar.style.display = 'none';
  ['bb-brand-context','bb-step2-context','bb-budget-intel','bb-step4-context','bb-step5-context'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) { el.innerHTML = ''; el.style.display = 'none'; }
  });
  var canvas = document.getElementById('bb-campaign-canvas');
  if (canvas) canvas.style.display = 'none';
  var campSec = document.getElementById('bb-campaign-section');
  if (campSec) { campSec.style.display = 'none'; campSec.innerHTML = ''; }
  var output = document.getElementById('bb-output');
  if (output) output.innerHTML = '';
  // Reset all step display:none set by campaign mode
  document.querySelectorAll('.bb-step').forEach(function(s){ s.style.display = ''; s.classList.remove('bb-active'); });
  // Show step indicator and progress
  var ind = document.getElementById('bb-step-indicator');
  var prog = document.getElementById('bb-progress-track');
  if (ind) ind.style.display = '';
  if (prog) prog.style.display = '';
  // Check for deep-link restore (set by bbCheckUrlOnLoad on page load)
  if (window._deepLinkBriefId) {
    var _id = window._deepLinkBriefId;
    window._deepLinkBriefId = null;
    bbInit();
    BB.step = 6;
    setTimeout(function() { bbLoadBrief(_id); }, 200);
    return; // skip new blank brief
  }
  // Reset DOM inputs that bbInit doesn't clear
  var _sd = document.getElementById('bb-start-date');
  var _ed = document.getElementById('bb-end-date');
  if (_sd) _sd.value = '';
  if (_ed) _ed.value = '';
  // Reset scope to brand-wide
  document.querySelectorAll('.bb-scope-btn').forEach(function(b){ b.classList.remove('bb-selected'); });
  var scopeBrand = document.getElementById('scope-brand');
  if (scopeBrand) scopeBrand.classList.add('bb-selected');
  var scopeSec = document.getElementById('bb-scope-section');
  if (scopeSec) scopeSec.style.display = 'none';
  var datesSec = document.getElementById('bb-dates-section');
  if (datesSec) datesSec.style.display = 'none';
  // Reset site selector
  var siteSel = document.getElementById('bb-site-select');
  if (siteSel) siteSel.value = '';
  // Reset left sidebar
  var sideTitle = document.getElementById('bb-side-brand');
  if (sideTitle) sideTitle.textContent = '';
  var sideDates = document.getElementById('bb-side-dates');
  if (sideDates) sideDates.textContent = '';
  bbInit();
  BB.step = 6; // allow all steps
  bbGoStep(1);
  bbUpdateBrief();
  closeBriefsPanel();
  showToast('New campaign started 🚀', 'success');
}


function bbSetUrlBrief(briefId) {
  if (!briefId) return;
  history.replaceState({briefId: briefId}, '', window.location.pathname + '?view=brief#brief=' + briefId);
}


function bbCheckUrlOnLoad() {
  // Disabled — brief loading now handled entirely by sbHandleSession + hash
}


// ─────────────────────────────────────────────
// bbInitFromBrief(brief)
// Single source of truth for restoring all BB state and DOM from a saved brief.
// Called by bbLoadBrief (initial load) and bbExitCampaignMode (← Edit brief).
// ─────────────────────────────────────────────
function bbInitFromBrief(brief) {
  // ── Step A: Rebuild DOM grids (bbInit wipes BB.budget via bbOnBudget(5000)) ──
  bbInit();

  // ── Step B: Set ALL BB state from brief after bbInit ──
  BB.brand       = BB_BRANDS.find(function(b){ return b.id === brief.brand_id; }) || null;
  BB.ctype       = BB_CTYPES.find(function(c){ return c.id === brief.campaign_type_id; }) || null;
  BB.objective   = BB_OBJECTIVES.find(function(o){ return o.id === brief.objective_id; }) || null;
  BB.budget      = brief.budget || 5000;
  BB.duration    = brief.duration_weeks ? {weeks: brief.duration_weeks, label: brief.duration_label || ''} : null;
  BB.audiences   = brief.audience_ids || [];
  BB.channels    = brief.channel_ids  || [];
  BB.channel_split = brief.channel_split || {};
  BB.proposition = brief.proposition  || '';
  BB.mandatories = brief.mandatories  || '';
  BB.notes       = brief.notes        || '';
  BB.scope       = (brief.scope === 'site' ? 'sites' : brief.scope) || 'brand';
  BB.site_ids    = bbParseSiteIds(brief);
  BB.site_id     = BB.site_ids[0] || '';
  BB.site_splits = {};
  BB.start_date  = brief.start_date || '';
  BB.end_date    = brief.end_date   || '';

  // ── Step C: Restore DOM — text inputs ──
  var titleEl = document.getElementById('bb-brief-title');
  var smpEl   = document.getElementById('bb-smp');
  var mandEl  = document.getElementById('bb-mandatories');
  var notesEl = document.getElementById('bb-notes');
  var sdInp   = document.getElementById('bb-start-date');
  var edInp   = document.getElementById('bb-end-date');
  if (titleEl) titleEl.value = brief.title        || '';
  if (smpEl)   smpEl.value   = BB.proposition;
  if (mandEl)  mandEl.value  = BB.mandatories;
  if (notesEl) notesEl.value = BB.notes;
  if (sdInp)   sdInp.value   = BB.start_date;
  if (edInp)   edInp.value   = BB.end_date;

  // ── Step D: Restore budget slider ──
  bbOnBudget(BB.budget);

  // ── Step E: Restore visual selections (brand, ctype, obj, dur, scope) ──
  bbRestoreSelections();

  // ── Step F: Show scope section + scope picker ──
  var spSec = document.getElementById('bb-scope-section');
  var dpSec = document.getElementById('bb-dates-section');
  if (spSec) spSec.style.display = 'block';
  if (dpSec) dpSec.style.display = 'block';

  if (BB.scope === 'sites') {
    var pickr = document.getElementById('bb-site-picker');
    if (pickr) pickr.style.display = 'block';
    // Site grid needs a tick to let DOM settle after bbInit
    setTimeout(function() { bbRenderSiteGrid(); bbUpdateSiteCount(); }, 50);
  }

  // ── Step G: Update date card without re-reading from DOM ──
  // BB.start_date and BB.end_date are already correct from brief — don't overwrite via DOM read
  if (BB.start_date && BB.end_date) bbUpdateDateCard(BB.start_date, BB.end_date);
  bbUpdateBrief();
  setTimeout(bbRenderBrandContext, 100);

  // ── Step H: Enable next buttons based on restored state ──
  var btn1 = document.getElementById('bb-btn-1-next');
  var btn2 = document.getElementById('bb-btn-2-next');
  var btn3 = document.getElementById('bb-btn-3-next');
  var btn4 = document.getElementById('bb-btn-4-next');
  if (btn1) btn1.disabled = !BB.brand;
  if (btn2) btn2.disabled = !(BB.ctype && BB.objective);
  if (btn3) btn3.disabled = !BB.duration;
  if (btn4) btn4.disabled = BB.audiences.length === 0;
}

async function bbLoadBrief(id) {
  // Sanitise ID — strip any non UUID characters (letters, numbers, hyphens only)
  if (id) id = id.replace(/[^a-f0-9\-]/gi, '');
  if (!id) return;
  window._bbSuppressNewBrief = true;
  window._bbBriefLoading = true;

  // Fetch brief (from cache or Supabase)
  let brief = SB_BRIEFS_CACHE.find(function(b){ return b.id === id; });
  if (!brief) {
    try {
      var resp = await fetch(SUPABASE_URL + '/rest/v1/briefs?id=eq.' + id + '&select=*&limit=1', {
        headers: getAuthHeaders({'Content-Type':'application/json'})
      });
      if (resp.ok) {
        var rows = await resp.json();
        if (rows && rows.length) { brief = rows[0]; SB_BRIEFS_CACHE.unshift(brief); }
      }
    } catch(e) { console.warn('bbLoadBrief fetch:', e); }
    if (!brief) { console.warn('bbLoadBrief: not found', id); return; }
  }

  // Switch to brief view without triggering bbNewBrief reset
  window._bbLoadingBrief = true;
  closeBriefsPanel();
  switchView('brief', document.querySelector('[data-view=brief]'));
  window._bbLoadingBrief = false;

  // Store session refs
  window._lastSavedBriefId    = brief.id;
  window._lastSavedBriefTitle = brief.title;
  BB.step = 6;

  // ── Restore all BB state + DOM from brief ──
  bbInitFromBrief(brief);
  bbSetUrlBrief(brief.id);

  // ── Route by status ──
  if (brief.status === 'campaigned') {
    // Hide step UI, go straight to campaign task view
    var s6  = document.getElementById('bb-step-6');
    var sbc = document.getElementById('bb-save-bar');
    var opc = document.getElementById('bb-output');
    if (s6)  s6.style.display  = 'none';
    if (sbc) sbc.style.display = 'none';
    if (opc) opc.innerHTML     = '';
    bbEnterCampaignMode(brief);
    return;
  }

  if (brief.status === 'submitted' || brief.status === 'approved') {
    // Show step 6 status view — no save bar
    setTimeout(async function() {
      document.querySelectorAll('.bb-step').forEach(function(s){ s.classList.remove('bb-active'); });
      var s6 = document.getElementById('bb-step-6');
      if (s6) { s6.classList.add('bb-active'); s6.style.display = ''; }
      var saveBar = document.getElementById('bb-save-bar');
      if (saveBar) saveBar.style.display = 'none';
      window.scrollTo(0, 0);
      if (typeof bbRenderCampaignSection === 'function') await bbRenderCampaignSection(brief);
    }, 200);
    return;
  }

  // Draft — show step 6 with save bar + action button
  var _briefRef = brief; // capture for closure
  setTimeout(function() {
    bbGoStep(6);
    var saveBtn = document.getElementById('bb-save-btn');
    var saveBar = document.getElementById('bb-save-bar');
    var titleEl = document.getElementById('bb-brief-title');
    if (titleEl) titleEl.value = _briefRef.title || '';
    if (saveBtn) { saveBtn.textContent = '\u2713 Saved'; saveBtn.disabled = true; saveBtn.style.background = '#059669'; }
    if (saveBar) saveBar.style.display = 'block';
  }, 150);
  // Re-show launch/submit button after bbGenerateBrief clears feedback div
  // Use 1000ms to ensure CB_TEAM + CB_PERMS are loaded
  setTimeout(function() {
    var fb = document.getElementById('bb-save-feedback');
    if (!fb) return;
    // Resolve current user if not already set
    var _uid = CB_CURRENT_USER;
    if (!_uid && window.SB_USER && SB_USER.email && typeof CB_TEAM !== 'undefined') {
      var _m = Object.values(CB_TEAM).find(function(m){ return m.email && m.email.toLowerCase() === SB_USER.email.toLowerCase(); });
      if (_m) _uid = _m.id;
    }
    var _perms = (typeof CB_PERMS !== 'undefined' && _uid) ? (CB_PERMS[_uid] || {}) : {};
    var _canLaunch = !!(typeof window.is_admin !== 'undefined' && window.is_admin) || _perms.can_approve_all || _perms.can_approve_digital;
    var _firstName = (SB_USER && SB_USER.user_metadata && SB_USER.user_metadata.full_name)
      ? SB_USER.user_metadata.full_name.split(' ')[0] : 'there';
    fb.style.display = 'block';
    if (_canLaunch) {
      fb.innerHTML = '<div class="bb-s6-confirm">'
        + '<div class="bb-s6-tick">\u2713</div>'
        + '<div class="bb-s6-msg"><strong>Brief saved, ' + _firstName + '.</strong> Ready to go live.</div>'
        + '<button class="bb-s6-launch" onclick="bbSubmitAndLaunch()">LAUNCH CAMPAIGN</button>'
        + '</div>';
    } else {
      fb.innerHTML = '<div class="bb-s6-confirm">'
        + '<div class="bb-s6-tick">\u2713</div>'
        + '<div class="bb-s6-msg"><strong>Brief saved, ' + _firstName + '.</strong> When ready, submit for approval.</div>'
        + '<button class="bb-s6-submit-btn" onclick="bbSubmitBrief()">Submit for approval \u2192</button>'
        + '</div>';
    }
  }, 1000);
}


function bbExitCampaignMode() {
  window._bbCampModeActive = false;

  // Show step indicator + progress
  var indicator = document.getElementById('bb-step-indicator');
  var progress  = document.getElementById('bb-progress-track');
  if (indicator) indicator.style.display = '';
  if (progress)  progress.style.display  = '';

  // Hide campaign canvas
  var canvas = document.getElementById('bb-campaign-canvas');
  if (canvas) canvas.style.display = 'none';

  // Restore sidebar
  var left = document.getElementById('bb-left');
  if (left && typeof BB_LEFT_ORIGINAL_HTML !== 'undefined') {
    left.innerHTML = BB_LEFT_ORIGINAL_HTML;
  }

  // Clear step active states
  document.querySelectorAll('.bb-step').forEach(function(s){
    s.classList.remove('bb-active');
    s.style.display = '';
  });

  // Get brief from cache — BB state already has site_ids etc from bbLoadBrief
  var brief = window._lastSavedBriefId
    ? SB_BRIEFS_CACHE.find(function(b){ return b.id === window._lastSavedBriefId; })
    : null;

  if (brief) {
    // Re-run full restore so all steps are correct on edit
    bbInitFromBrief(brief);
  }

  // Go to step 1
  bbGoStep(1);
}

function bbNewBrief() {
  if (window._bbBriefLoading) { return; }
  if (window._bbSuppressNewBrief) { window._bbSuppressNewBrief = false; return; }
  // Restore sidebar to original brief panel HTML (campaign mode overwrites it)
  var _left = document.getElementById('bb-left');
  if (_left && typeof BB_LEFT_ORIGINAL_HTML !== 'undefined') {
    _left.innerHTML = BB_LEFT_ORIGINAL_HTML;
  }
  if (window._bbCampModeActive) bbExitCampaignMode();
  BB.brand = null; BB.ctype = null; BB.budget = 5000; BB.duration = null;
  BB.audiences = []; BB.channels = []; BB.channel_split = {}; BB.objective = null;
  BB.proposition = ''; BB.start_date = ''; BB.end_date = '';
  BB.site_id = ''; BB.site_ids = []; BB.site_splits = {}; BB.scope = 'brand'; BB.step = 1;
  BB._calCampaignId = null;
  window._lastSavedBriefId = null;
  window._lastSavedBriefTitle = null;
  history.replaceState(null, '', window.location.pathname + '?view=brief');
  var titleEl = document.getElementById('bb-brief-title');
  if (titleEl) titleEl.value = '';
  var feedback = document.getElementById('bb-save-feedback');
  if (feedback) { feedback.style.display = 'none'; feedback.innerHTML = ''; }
  var saveBtn = document.getElementById('bb-save-btn');
  if (saveBtn) { saveBtn.textContent = 'Save campaign'; saveBtn.disabled = false; saveBtn.style.background = ''; }
  var saveBar = document.getElementById('bb-save-bar');
  if (saveBar) saveBar.style.display = 'none';
  ['bb-brand-context','bb-step2-context','bb-budget-intel','bb-step4-context','bb-step5-context'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) { el.innerHTML = ''; el.style.display = 'none'; }
  });
  var canvas = document.getElementById('bb-campaign-canvas');
  if (canvas) canvas.style.display = 'none';
  var campSec = document.getElementById('bb-campaign-section');
  if (campSec) { campSec.style.display = 'none'; campSec.innerHTML = ''; }
  var output = document.getElementById('bb-output');
  if (output) output.innerHTML = '';
  // Reset all step display:none set by campaign mode
  document.querySelectorAll('.bb-step').forEach(function(s){ s.style.display = ''; s.classList.remove('bb-active'); });
  // Show step indicator and progress
  var ind = document.getElementById('bb-step-indicator');
  var prog = document.getElementById('bb-progress-track');
  if (ind) ind.style.display = '';
  if (prog) prog.style.display = '';
  // Check for deep-link restore (set by bbCheckUrlOnLoad on page load)
  if (window._deepLinkBriefId) {
    var _id = window._deepLinkBriefId;
    window._deepLinkBriefId = null;
    bbInit();
    BB.step = 6;
    setTimeout(function() { bbLoadBrief(_id); }, 200);
    return; // skip new blank brief
  }
  // Reset DOM inputs that bbInit doesn't clear
  var _sd = document.getElementById('bb-start-date');
  var _ed = document.getElementById('bb-end-date');
  if (_sd) _sd.value = '';
  if (_ed) _ed.value = '';
  // Reset scope to brand-wide
  document.querySelectorAll('.bb-scope-btn').forEach(function(b){ b.classList.remove('bb-selected'); });
  var scopeBrand = document.getElementById('scope-brand');
  if (scopeBrand) scopeBrand.classList.add('bb-selected');
  var scopeSec = document.getElementById('bb-scope-section');
  if (scopeSec) scopeSec.style.display = 'none';
  var datesSec = document.getElementById('bb-dates-section');
  if (datesSec) datesSec.style.display = 'none';
  // Reset site selector
  var siteSel = document.getElementById('bb-site-select');
  if (siteSel) siteSel.value = '';
  // Reset left sidebar
  var sideTitle = document.getElementById('bb-side-brand');
  if (sideTitle) sideTitle.textContent = '';
  var sideDates = document.getElementById('bb-side-dates');
  if (sideDates) sideDates.textContent = '';
  bbInit();
  BB.step = 6; // allow all steps
  bbGoStep(1);
  bbUpdateBrief();
  closeBriefsPanel();
  showToast('New campaign started 🚀', 'success');
}


function bbSetUrlBrief(briefId) {
  if (!briefId) return;
  history.replaceState({briefId: briefId}, '', window.location.pathname + '?view=brief#brief=' + briefId);
}


function bbCheckUrlOnLoad() {
  var params = new URLSearchParams(window.location.search);
  var view   = params.get('view');
  var briefId = params.get('brief');
  if (view === 'brief') {
    if (briefId) window._deepLinkBriefId = briefId; // signal to bbNewBrief
    setTimeout(function() {
      switchView('brief', document.querySelector('[data-view="brief"]'));
      // switchView calls bbNewBrief which checks _deepLinkBriefId
    }, 900);
  }
}


async function bbLoadBrief(id) {
  window._bbSuppressNewBrief = true;
  window._bbBriefLoading = true;
  let brief = SB_BRIEFS_CACHE.find(b=>b.id===id);
  if (!brief) {
    try {
      var resp = await fetch(SUPABASE_URL + '/rest/v1/briefs?id=eq.' + id + '&select=*&limit=1', {
        headers: getAuthHeaders({'Content-Type':'application/json'})
      });
      if (resp.ok) {
        var rows = await resp.json();
        if (rows && rows.length) { brief = rows[0]; SB_BRIEFS_CACHE.unshift(brief); }
      }
    } catch(e) { console.warn('bbLoadBrief fetch:', e); }
    if (!brief) { console.warn('bbLoadBrief: not found', id); return; }
  }

  // Switch view without triggering bbNewBrief reset
  window._bbLoadingBrief = true;
  closeBriefsPanel();
  switchView('brief', document.querySelector('[data-view=brief]'));
  window._bbLoadingBrief = false;

  // ── Set ALL BB state from brief synchronously ──
  BB.brand       = BB_BRANDS.find(function(b){ return b.id === brief.brand_id; }) || null;
  BB.ctype       = BB_CTYPES.find(function(c){ return c.id === brief.campaign_type_id; }) || null;
  BB.objective   = BB_OBJECTIVES.find(function(o){ return o.id === brief.objective_id; }) || null;
  // Rebuild step DOM first — bbInit() calls bbOnBudget(5000) which resets BB.budget
  bbInit();
  // Now set ALL BB state from brief (after bbInit so nothing gets overwritten)
  BB.budget      = brief.budget || 5000;
  BB.duration    = brief.duration_weeks ? {weeks:brief.duration_weeks, label:brief.duration_label||''} : null;
  BB.audiences   = brief.audience_ids || [];
  BB.channels    = brief.channel_ids || [];
  BB.proposition = brief.proposition || '';
  BB.mandatories = brief.mandatories || '';
  BB.notes       = brief.notes       || '';
  BB.scope       = (brief.scope === 'site' ? 'sites' : brief.scope) || 'brand';
  BB.site_ids    = bbParseSiteIds(brief);
  BB.site_id     = BB.site_ids[0] || '';
  BB.site_splits = {};
  BB.start_date  = brief.start_date || '';
  BB.end_date    = brief.end_date   || '';
  BB.step = 6;
  window._lastSavedBriefId    = brief.id;
  window._lastSavedBriefTitle = brief.title;

  // Campaigned briefs → go straight to campaign task view
  if (brief.status === 'campaigned') {
    bbSetUrlBrief(brief.id);
    ['bb-step-6','bb-save-bar'].forEach(function(id2){
      var el = document.getElementById(id2); if(el) el.style.display = 'none';
    });
    var _opc = document.getElementById('bb-output');
    if (_opc) _opc.innerHTML = '';
    bbEnterCampaignMode(brief);
    return;
  }

  // ── DOM restore (needs small delay for bbInit DOM to settle) ──
  setTimeout(function() {
    // Text fields
    var smpEl   = document.getElementById('bb-smp');
    var mandEl  = document.getElementById('bb-mandatories');
    var titleEl = document.getElementById('bb-brief-title');
    var sdInp   = document.getElementById('bb-start-date');
    var edInp   = document.getElementById('bb-end-date');
    if (smpEl)   smpEl.value   = BB.proposition || '';
    if (mandEl)  mandEl.value  = BB.mandatories || '';
    if (titleEl) titleEl.value = brief.title || '';
    var notesEl = document.getElementById('bb-notes');
    if (notesEl) notesEl.value = BB.notes || '';
    if (sdInp)   sdInp.value   = BB.start_date;
    if (edInp)   edInp.value   = BB.end_date;

    // Show scope + dates sections
    var spSec = document.getElementById('bb-scope-section');
    var dpSec = document.getElementById('bb-dates-section');
    if (spSec) spSec.style.display = 'block';
    if (dpSec) dpSec.style.display = 'block';

    // Scope picker
    if (BB.scope === 'sites') {
      var ssSiteBtn  = document.getElementById('scope-site');
      var sbBrandBtn = document.getElementById('scope-brand');
      if (ssSiteBtn)  ssSiteBtn.classList.add('bb-selected');
      if (sbBrandBtn) sbBrandBtn.classList.remove('bb-selected');
      var pickr = document.getElementById('bb-site-picker');
      if (pickr) pickr.style.display = 'block';
      setTimeout(function() { bbRenderSiteGrid(); bbUpdateSiteCount(); }, 50);
    }

    // Budget + context
    bbOnBudget(BB.budget);

    // Show brief output at step 6
    bbGoStep(6);

    // Update sidebar + budget context
    bbUpdateBrief();
    setTimeout(bbRenderBrandContext, 100);

    // Lock save button for saved brief
    setTimeout(function() {
      var saveBtn = document.getElementById('bb-save-btn');
      var saveBar = document.getElementById('bb-save-bar');
      if (titleEl) titleEl.value = brief.title || '';
      if (saveBtn) { saveBtn.textContent = '\u2713 Saved'; saveBtn.disabled = true; saveBtn.style.background = '#059669'; }
      if (saveBar) saveBar.style.display = 'block';
    }, 150);
  }, 100);

  // After loading brief — route by status (campaigned handled above with early return)
  if (brief.status === 'submitted' || brief.status === 'approved') {
    // Submitted/approved: go to Step 6 and show status card
    setTimeout(async function() {
      document.querySelectorAll('.bb-step').forEach(function(p){p.classList.remove('bb-active');});
      var s6 = document.getElementById('bb-step-6');
      if (s6) { s6.classList.add('bb-active'); s6.style.display = ''; }
      var saveBar = document.getElementById('bb-save-bar');
      if (saveBar) saveBar.style.display = 'none';
      window._lastSavedBriefId = brief.id;
      window._lastSavedBriefTitle = brief.title;
      window.scrollTo(0, 0);
      if (typeof bbRenderCampaignSection === 'function') await bbRenderCampaignSection(brief);
    }, 200);
  }
}


async function bbSetStatus(id, status) {
  if(!SB) return;
  await SB.from('briefs').update({ status }).eq('id', id);
  loadBriefs();
}


async function bbArchiveBrief(id) {
  if(!confirm('Archive this campaign? You can still view it later.')) return;
  await bbSetStatus(id, 'archived');
}


async function bbDeleteBrief(id) {
  if(!confirm('Permanently delete this campaign? This cannot be undone.')) return;
  if(!SB) return;
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var hdrs = getAuthHeaders({'Content-Type':'application/json'});
  try {
    // Single delete — cascade removes campaigns + campaign_tasks automatically
    await fetch(base+'/briefs?id=eq.'+id, {method:'DELETE', headers:hdrs});
    // Update local caches
    if (Array.isArray(window.BUILT_IN_CAMPAIGNS)) {
      window.BUILT_IN_CAMPAIGNS = window.BUILT_IN_CAMPAIGNS.filter(function(x){ return x.brief_id !== id; });
    }
    if (window._lastSavedBriefId === id) bbNewBrief();
    loadBriefs();
    if (typeof calLoadFromSupabase === 'function') await calLoadFromSupabase();
    if (typeof renderCrossCalendar === 'function') renderCrossCalendar();
    showToast('Campaign deleted', 'success');
  } catch(e) {
    showToast('Delete error: ' + e.message, 'error');
  }
}

// ── Brief page init ──
document.addEventListener('DOMContentLoaded', function() {
  var briefView = document.getElementById('view-brief');
  if (briefView) briefView.classList.add('active');

  // Read brief ID from hash immediately — before any other code runs
  var _initBriefId = window._BRIEF_ID_FROM_URL;
  if (!_initBriefId) {
    var _h = window.location.hash.slice(1);
    _initBriefId = new URLSearchParams(_h).get('brief');
    if (_initBriefId) _initBriefId = _initBriefId.replace(/[^a-f0-9-]/gi, '');
    if (_initBriefId) window._BRIEF_ID_FROM_URL = _initBriefId;
  }

  if (_initBriefId) {
    // Brief ID found — suppress blank brief, wait for sbHandleSession to load it
    window._bbBriefLoading = true;
    window._bbSuppressNewBrief = true;
  } else {
    // No brief ID — start blank brief after short delay
    setTimeout(function() {
      if (window._bbBriefLoading) return;
      if (window._bbSuppressNewBrief) { window._bbSuppressNewBrief = false; return; }
      if (window._bbLoadingBriefFromPanel) { window._bbLoadingBriefFromPanel = false; return; }
      if (typeof BB !== 'undefined' && BB.brand) return;
      if (typeof bbNewBrief === 'function') bbNewBrief();
    }, 800);
  }
});
