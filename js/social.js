// Swansway Marketing Portal — Social Hub JS v1
// Page guard
if (!/social\.html/.test(window.location.pathname) && window.location.pathname !== '/' && window.location.pathname !== '') {
  // Not on social page — skip init
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */

var SL_BASE = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';

var SL_PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',          icon: '👤', color: '#1877F2', limit: 63206 },
  { id: 'instagram', label: 'Instagram',          icon: '📸', color: '#E1306C', limit: 2200  },
  { id: 'linkedin',  label: 'LinkedIn',           icon: '💼', color: '#0A66C2', limit: 3000  },
  { id: 'tiktok',    label: 'TikTok',             icon: '🎵', color: '#010101', limit: 2200  },
  { id: 'gmb',       label: 'Google My Business', icon: '📍', color: '#4285F4', limit: 1500  },
  { id: 'threads',   label: 'Threads',            icon: '🔗', color: '#1C1C1E', limit: 500   },
];

var SL_STATUSES = {
  draft:      { label: 'Draft',      color: '#6B6560', bg: '#F1F0EE' },
  in_review:  { label: 'In Review',  color: '#92400E', bg: '#FEF3C7' },
  approved:   { label: 'Approved',   color: '#065F46', bg: '#D1FAE5' },
  scheduled:  { label: 'Scheduled',  color: '#1E3A8A', bg: '#DBEAFE' },
  published:  { label: 'Published',  color: '#4C1D95', bg: '#EDE9FE' },
  rejected:   { label: 'Rejected',   color: '#991B1B', bg: '#FEE2E2' },
};

var SL_PIPELINE_COLS = ['draft','in_review','approved','scheduled','published'];

/* ══════════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════════ */

var SL_POSTS        = [];   // all loaded posts
var SL_FILTERED     = [];   // after filters applied
var SL_VIEW         = 'calendar';
var SL_CURRENT_MONTH = new Date();
var SL_EDITING_ID   = null; // null = new post
var SL_PANEL_POST   = null; // current post object in panel
var SL_APPROVERS    = {};   // { brandId: [userId, ...] } from admin_config
var SL_COMMENTS     = [];   // comments for current panel post
var SL_ACTIVE_PREVIEW_TAB = null;

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */

function slInit() {
  if (!/social\.html/.test(window.location.pathname)) return;
  // Poll for CB_CURRENT_USER (set by sbHandleSession in shared5.js after auth)
  var attempts = 0;
  var maxAttempts = 60; // 30 seconds
  var authCheck = setInterval(function() {
    attempts++;
    if (typeof CB_CURRENT_USER !== 'undefined' && CB_CURRENT_USER) {
      clearInterval(authCheck);
      slAfterAuth();
    } else if (attempts >= maxAttempts) {
      clearInterval(authCheck);
      // Auth may have failed or user is not signed in
      console.warn('Social Hub: auth timeout — user may not be signed in');
    }
  }, 500);
}

function slAfterAuth() {
  slPopulateFilters();
  slLoadApprovers();
  slLoadPosts();

  // Auto-open from URL param (e.g. social.html?post=UUID)
  var params = new URLSearchParams(window.location.search);
  var openId = params.get('post');
  if (openId) {
    setTimeout(function() { slOpenPost(openId); }, 800);
  }

  // Listen for generate-from-event / generate-from-brief calls
  // (sessionStorage key set by events.js and brief7.js)
  try {
    var genPayload = sessionStorage.getItem('_slGenPayload');
    if (genPayload) {
      sessionStorage.removeItem('_slGenPayload');
      var p = JSON.parse(genPayload);
      setTimeout(function() { slShowGenModal(p); }, 600);
    }
  } catch(e) {}
}

/* ══════════════════════════════════════════════════════════
   DATA LOADING
══════════════════════════════════════════════════════════ */

async function slLoadPosts() {
  var container = document.getElementById('sl-cal-grid') || document.getElementById('sl-grid-board') || document.getElementById('sl-pipeline-board');
  try {
    var r = await fetch(SL_BASE + '/social_posts?select=*&order=scheduled_at.asc.nullslast,created_at.desc', {
      headers: getAuthHeaders()
    });
    if (!r.ok) throw new Error(await r.text());
    SL_POSTS = await r.json();
    slApplyFilters();
    slUpdateStats();
  } catch(e) {
    console.error('slLoadPosts error:', e);
    slShowToast('Failed to load posts: ' + e.message, 'error');
  }
}

async function slLoadApprovers() {
  try {
    var r = await fetch(SL_BASE + '/admin_config?key=eq.social_approvers&select=value', {
      headers: getAuthHeaders()
    });
    if (r.ok) {
      var rows = await r.json();
      if (rows && rows[0]) SL_APPROVERS = rows[0].value || {};
    }
  } catch(e) { /* non-fatal */ }
}

async function slLoadComments(postId) {
  try {
    var r = await fetch(SL_BASE + '/social_comments?post_id=eq.' + postId + '&order=created_at.asc', {
      headers: getAuthHeaders()
    });
    if (r.ok) SL_COMMENTS = await r.json();
    else SL_COMMENTS = [];
  } catch(e) { SL_COMMENTS = []; }
}

/* ══════════════════════════════════════════════════════════
   FILTERS & STATS
══════════════════════════════════════════════════════════ */

function slPopulateFilters() {
  // Brand filter
  var brandSel = document.getElementById('sl-filter-brand');
  if (brandSel && typeof BRANDS !== 'undefined') {
    BRANDS.forEach(function(b) {
      var opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name;
      brandSel.appendChild(opt);
    });
  }
  // Assignee filter
  var assigneeSel = document.getElementById('sl-filter-assignee');
  if (assigneeSel && typeof CB_TEAM !== 'undefined') {
    Object.values(CB_TEAM).forEach(function(m) {
      var opt = document.createElement('option');
      opt.value = m.id || m.user_id;
      opt.textContent = m.name;
      assigneeSel.appendChild(opt);
    });
  }
}

function slApplyFilters() {
  var brand    = (document.getElementById('sl-filter-brand')    || {}).value || '';
  var platform = (document.getElementById('sl-filter-platform') || {}).value || '';
  var status   = (document.getElementById('sl-filter-status')   || {}).value || '';
  var assignee = (document.getElementById('sl-filter-assignee') || {}).value || '';

  SL_FILTERED = SL_POSTS.filter(function(p) {
    if (brand    && p.brand_id !== brand)                    return false;
    if (platform && !(p.platform_ids||[]).includes(platform)) return false;
    if (status   && p.status !== status)                     return false;
    if (assignee && p.assigned_to !== assignee)              return false;
    return true;
  });

  slRenderCurrentView();
  slUpdateStats();
  slUpdateApprovalAlert();
}

function slUpdateStats() {
  var counts = { draft:0, in_review:0, approved:0, scheduled:0, published:0 };
  SL_POSTS.forEach(function(p) { if (counts[p.status] !== undefined) counts[p.status]++; });
  ['draft','review','approved','scheduled','published'].forEach(function(k) {
    var el = document.getElementById('sl-stat-' + k);
    if (el) el.textContent = counts[k === 'review' ? 'in_review' : k] || 0;
  });
}

function slUpdateApprovalAlert() {
  var alert = document.getElementById('sl-approval-alert');
  var countEl = document.getElementById('sl-approval-count');
  if (!alert || !countEl) return;
  var pending = slGetApprovalQueue();
  if (pending.length) {
    countEl.textContent = pending.length;
    alert.style.display = 'block';
  } else {
    alert.style.display = 'none';
  }
}

function slGetApprovalQueue() {
  // Posts in_review that the current user can approve
  return SL_POSTS.filter(function(p) {
    if (p.status !== 'in_review') return false;
    return slCanApprove(p);
  });
}

function slCanApprove(post) {
  if (!CB_CURRENT_USER) return false;
  var perms = CB_PERMS[CB_CURRENT_USER] || {};
  if (perms.can_approve_all) return true;
  // Check brand-specific approvers from admin_config
  var brandApprovers = (SL_APPROVERS[post.brand_id] || SL_APPROVERS['default'] || []);
  if (brandApprovers.includes(CB_CURRENT_USER)) return true;
  return false;
}

function slFilterToReview() {
  var statusSel = document.getElementById('sl-filter-status');
  if (statusSel) statusSel.value = 'in_review';
  slApplyFilters();
  slSetView('pipeline');
}

/* ══════════════════════════════════════════════════════════
   VIEW SWITCHING
══════════════════════════════════════════════════════════ */

function slSetView(view) {
  SL_VIEW = view;
  ['calendar','pipeline','grid'].forEach(function(v) {
    var btn = document.getElementById('sl-view-' + v);
    var el  = document.getElementById('sl-' + v + '-view');
    if (btn) btn.classList.toggle('active', v === view);
    if (el)  el.style.display = (v === view) ? '' : 'none';
  });
  slRenderCurrentView();
}

function slRenderCurrentView() {
  if (SL_VIEW === 'calendar') slRenderCalendar();
  else if (SL_VIEW === 'pipeline') slRenderPipeline();
  else if (SL_VIEW === 'grid') slRenderGrid();
}

/* ══════════════════════════════════════════════════════════
   CALENDAR VIEW
══════════════════════════════════════════════════════════ */

function slPrevMonth() { SL_CURRENT_MONTH.setMonth(SL_CURRENT_MONTH.getMonth() - 1); slRenderCalendar(); }
function slNextMonth() { SL_CURRENT_MONTH.setMonth(SL_CURRENT_MONTH.getMonth() + 1); slRenderCalendar(); }

function slRenderCalendar() {
  var headingEl = document.getElementById('sl-month-heading');
  var grid = document.getElementById('sl-cal-grid');
  if (!grid) return;

  var year  = SL_CURRENT_MONTH.getFullYear();
  var month = SL_CURRENT_MONTH.getMonth();
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  if (headingEl) headingEl.textContent = months[month] + ' ' + year;

  var html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    .map(function(d){ return '<div class="sl-cal-dow">' + d + '</div>'; }).join('');

  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var daysInPrev  = new Date(year, month, 0).getDate();
  var today = new Date();

  // Build a map: dateString → posts
  var postsByDate = {};
  SL_FILTERED.forEach(function(p) {
    if (!p.scheduled_at) return;
    var d = p.scheduled_at.substring(0,10);
    if (!postsByDate[d]) postsByDate[d] = [];
    postsByDate[d].push(p);
  });

  var cells = [];
  // Prev month padding
  for (var i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, thisMonth: false, dateStr: null });
  }
  // This month
  for (var d = 1; d <= daysInMonth; d++) {
    var mm = String(month + 1).padStart(2,'0');
    var dd = String(d).padStart(2,'0');
    cells.push({ day: d, thisMonth: true, dateStr: year + '-' + mm + '-' + dd });
  }
  // Next month padding
  var remaining = 42 - cells.length;
  for (var n = 1; n <= remaining; n++) {
    cells.push({ day: n, thisMonth: false, dateStr: null });
  }

  cells.forEach(function(cell) {
    var isToday = cell.thisMonth && cell.dateStr &&
      cell.dateStr === today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');

    var cls = 'sl-cal-cell';
    if (!cell.thisMonth) cls += ' sl-cal-cell--other';
    if (isToday) cls += ' sl-cal-cell--today';

    var dayNum = isToday
      ? '<div class="sl-cal-day-num"><span class="sl-cal-today-badge">' + cell.day + '</span></div>'
      : '<div class="sl-cal-day-num">' + cell.day + '</div>';

    var postsHtml = '';
    if (cell.dateStr && postsByDate[cell.dateStr]) {
      var dayPosts = postsByDate[cell.dateStr];
      var show = dayPosts.slice(0, 3);
      show.forEach(function(p) {
        var plat = SL_PLATFORMS.find(function(pl){ return (p.platform_ids||[]).includes(pl.id); });
        var color = plat ? plat.color : '#6B6560';
        var st = SL_STATUSES[p.status] || SL_STATUSES.draft;
        postsHtml += '<button class="sl-cal-pill" style="background:' + st.bg + ';color:' + st.color + '" onclick="event.stopPropagation();slOpenPost(\'' + p.id + '\')">'
          + '<span class="sl-cal-pill-dot" style="background:' + color + '"></span>'
          + '<span class="sl-cal-pill-text">' + slEscape(p.title) + '</span>'
          + '</button>';
      });
      if (dayPosts.length > 3) {
        postsHtml += '<div class="sl-cal-more" onclick="event.stopPropagation()">+' + (dayPosts.length - 3) + ' more</div>';
      }
    }

    var addBtn = cell.thisMonth
      ? '<button class="sl-cal-add" title="Add post on this date" onclick="event.stopPropagation();slOpenPost(null,\'' + (cell.dateStr||'') + '\')">+</button>'
      : '';

    html += '<div class="' + cls + '" onclick="' + (cell.thisMonth ? 'slOpenPost(null,\'' + (cell.dateStr||'') + '\')' : '') + '">'
      + dayNum + postsHtml + addBtn + '</div>';
  });

  grid.innerHTML = html;
}

/* ══════════════════════════════════════════════════════════
   PIPELINE VIEW
══════════════════════════════════════════════════════════ */

function slRenderPipeline() {
  var board = document.getElementById('sl-pipeline-board');
  if (!board) return;

  var byStatus = {};
  SL_PIPELINE_COLS.forEach(function(s){ byStatus[s] = []; });
  SL_FILTERED.forEach(function(p) {
    if (byStatus[p.status]) byStatus[p.status].push(p);
    else if (p.status === 'rejected') {
      // Show rejected in draft column with badge
      byStatus['draft'].push(p);
    }
  });

  var colEmojis = { draft:'✏️', in_review:'👁', approved:'✅', scheduled:'📅', published:'🟣' };
  var colColors = { draft:'#6B6560', in_review:'#92400E', approved:'#065F46', scheduled:'#1E3A8A', published:'#4C1D95' };
  var colBgs    = { draft:'#F1F0EE', in_review:'#FEF3C7', approved:'#D1FAE5', scheduled:'#DBEAFE', published:'#EDE9FE' };

  board.innerHTML = SL_PIPELINE_COLS.map(function(status) {
    var posts = byStatus[status] || [];
    var st = SL_STATUSES[status] || SL_STATUSES.draft;
    var cards = posts.map(function(p) { return slKanbanCard(p); }).join('');
    return '<div class="sl-pipeline-col">'
      + '<div class="sl-pipeline-header" style="background:' + st.bg + ';color:' + st.color + '">'
      + colEmojis[status] + ' ' + st.label
      + '<span class="sl-pipeline-count">' + posts.length + '</span>'
      + '</div>'
      + '<div class="sl-pipeline-body">' + (cards || '<div style="padding:20px 8px;text-align:center;font-size:12px;color:var(--ink-faint);font-family:var(--font-b)">No posts</div>') + '</div>'
      + '</div>';
  }).join('');
}

function slKanbanCard(p) {
  var brand = (typeof BRANDS !== 'undefined' ? BRANDS.find(function(b){ return b.id === p.brand_id; }) : null) || {};
  var platformIcons = (p.platform_ids||[]).map(function(pid) {
    var pl = SL_PLATFORMS.find(function(pl){ return pl.id === pid; });
    return pl ? '<span class="sl-platform-icon" title="' + pl.label + '" style="background:' + pl.color + '22">' + pl.icon + '</span>' : '';
  }).join('');
  var assignee = (typeof CB_TEAM !== 'undefined' && p.assigned_to) ? (CB_TEAM[p.assigned_to] || {}) : {};
  var initials = assignee.name ? assignee.name.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase() : '?';
  var dateStr = p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : 'No date';
  var approvalBadge = (p.status === 'in_review' && slCanApprove(p))
    ? '<span style="background:#FEF3C7;color:#92400E;font-family:var(--font-m);font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px">NEEDS APPROVAL</span>'
    : '';

  return '<div class="sl-kanban-card" onclick="slOpenPost(\'' + p.id + '\')">'
    + (brand.color ? '<div style="height:3px;background:' + brand.color + ';margin:-12px -12px 10px;border-radius:6px 6px 0 0"></div>' : '')
    + '<div class="sl-kanban-title">' + slEscape(p.title) + '</div>'
    + '<div class="sl-kanban-meta">'
    + (brand.name ? '<span style="font-family:var(--font-m);font-size:10px;font-weight:700;color:' + (brand.color||'#666') + '">' + brand.name + '</span> · ' : '')
    + dateStr
    + '</div>'
    + '<div class="sl-kanban-platforms">' + platformIcons + '</div>'
    + '<div class="sl-kanban-footer">'
    + (assignee.name
        ? '<div class="sl-assignee-chip"><div class="sl-avatar-xs" style="background:' + (assignee.color||'var(--swansway)') + '">' + initials + '</div>' + assignee.name.split(' ')[0] + '</div>'
        : '<div class="sl-assignee-chip" style="color:var(--ink-faint)">Unassigned</div>')
    + approvalBadge
    + '</div>'
    + '</div>';
}

/* ══════════════════════════════════════════════════════════
   GRID VIEW
══════════════════════════════════════════════════════════ */

function slRenderGrid() {
  var board = document.getElementById('sl-grid-board');
  if (!board) return;
  if (!SL_FILTERED.length) {
    board.innerHTML = '<div class="sl-empty"><div class="sl-empty-icon">📭</div><div class="sl-empty-title">No posts yet</div><div class="sl-empty-desc">Create your first post or adjust your filters</div></div>';
    return;
  }
  board.innerHTML = SL_FILTERED.map(function(p) {
    var brand = (typeof BRANDS !== 'undefined' ? BRANDS.find(function(b){ return b.id === p.brand_id; }) : null) || {};
    var st = SL_STATUSES[p.status] || SL_STATUSES.draft;
    var platformBadges = (p.platform_ids||[]).map(function(pid) {
      var pl = SL_PLATFORMS.find(function(pl){ return pl.id === pid; });
      return pl ? '<span class="sl-plat sl-plat--' + pid + '">' + pl.icon + ' ' + pl.label + '</span>' : '';
    }).join('');
    var dateStr = p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';
    var assignee = (typeof CB_TEAM !== 'undefined' && p.assigned_to) ? (CB_TEAM[p.assigned_to] || {}) : {};
    var initials = assignee.name ? assignee.name.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase() : '?';

    return '<div class="sl-grid-card" onclick="slOpenPost(\'' + p.id + '\')">'
      + '<div class="sl-grid-card-top" style="background:' + (brand.color||'var(--swansway)') + '"></div>'
      + '<div class="sl-grid-card-body">'
      + '<div class="sl-grid-card-badges">'
      + '<span class="sl-badge sl-badge--' + p.status + '" style="background:' + st.bg + ';color:' + st.color + '">' + st.label + '</span>'
      + (brand.name ? '<span class="sl-badge" style="background:' + (brand.color||'#666') + '22;color:' + (brand.color||'#666') + '">' + brand.name + '</span>' : '')
      + '</div>'
      + '<div class="sl-grid-card-title">' + slEscape(p.title) + '</div>'
      + (p.caption ? '<div class="sl-grid-card-caption">' + slEscape(p.caption) + '</div>' : '')
      + '<div class="sl-grid-card-meta">'
      + '<span class="sl-grid-card-meta-item">📅 ' + dateStr + '</span>'
      + (p.vehicle_model ? '<span class="sl-grid-card-meta-item">🚗 ' + slEscape(p.vehicle_model) + '</span>' : '')
      + (p.budget_allocated ? '<span class="sl-grid-card-meta-item">💰 £' + Number(p.budget_allocated).toLocaleString() + '</span>' : '')
      + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">' + platformBadges + '</div>'
      + '<div class="sl-grid-card-footer">'
      + (assignee.name
          ? '<div class="sl-assignee-chip"><div class="sl-avatar-xs" style="background:' + (assignee.color||'var(--swansway)') + ';flex-shrink:0">' + initials + '</div>' + assignee.name + '</div>'
          : '<span style="font-size:12px;color:var(--ink-faint);font-family:var(--font-b)">Unassigned</span>')
      + (p.source_label ? '<span class="sl-source-tag">' + p.source_label + '</span>' : '')
      + '</div>'
      + '</div>'
      + '</div>';
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   POST BUILDER PANEL
══════════════════════════════════════════════════════════ */

async function slOpenPost(postId, prefillDate) {
  SL_EDITING_ID = postId || null;
  var panel = document.getElementById('sl-builder-panel');
  var overlay = document.getElementById('sl-builder-overlay');
  var titleEl = document.getElementById('sl-panel-title');

  if (postId) {
    // Load existing
    SL_PANEL_POST = SL_POSTS.find(function(p){ return p.id === postId; }) || null;
    if (!SL_PANEL_POST) {
      // Fetch from DB
      try {
        var r = await fetch(SL_BASE + '/social_posts?id=eq.' + postId + '&select=*', { headers: getAuthHeaders() });
        var rows = await r.json();
        SL_PANEL_POST = rows[0] || null;
      } catch(e) { slShowToast('Error loading post', 'error'); return; }
    }
    await slLoadComments(postId);
    if (titleEl) titleEl.textContent = 'Edit Post';
  } else {
    SL_PANEL_POST = {
      status: 'draft',
      platform_ids: [],
      site_ids: [],
      brand_id: '',
      scheduled_at: prefillDate ? prefillDate + 'T09:00' : '',
    };
    SL_COMMENTS = [];
    if (titleEl) titleEl.textContent = 'New Post';
  }

  slRenderPanel();

  if (panel)  { panel.classList.add('open'); }
  if (overlay){ overlay.classList.add('open'); }
}

function slClosePanel() {
  var panel   = document.getElementById('sl-builder-panel');
  var overlay = document.getElementById('sl-builder-overlay');
  if (panel)   panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  SL_EDITING_ID = null;
  SL_PANEL_POST = null;
}

function slRenderPanel() {
  var body   = document.getElementById('sl-panel-body');
  var footer = document.getElementById('sl-panel-footer');
  if (!body || !footer || !SL_PANEL_POST) return;

  var p = SL_PANEL_POST;
  var isNew  = !SL_EDITING_ID;
  var st     = SL_STATUSES[p.status] || SL_STATUSES.draft;
  var canEdit = isNew || p.status === 'draft' || p.status === 'rejected';
  var canApprove = !isNew && p.status === 'in_review' && slCanApprove(p);
  var perms  = CB_PERMS[CB_CURRENT_USER] || {};

  // Approval banner
  var approvalBanner = '';
  if (canApprove) {
    approvalBanner = '<div class="sl-approval-banner">'
      + '<div class="sl-approval-banner-text">⚠ This post is awaiting your approval</div>'
      + '<div class="sl-approval-actions">'
      + '<button class="sl-btn sl-btn--approve sl-btn--sm" onclick="slApprovePost()">✓ Approve</button>'
      + '<button class="sl-btn sl-btn--reject sl-btn--sm" onclick="slShowRejectModal()">✕ Reject</button>'
      + '</div></div>';
  }

  // Status badge
  var statusBadge = '<span class="sl-badge sl-badge--' + p.status + '" style="background:' + st.bg + ';color:' + st.color + '">' + st.label + '</span>';

  // Source tag
  var sourceHtml = '';
  if (p.event_id)    sourceHtml = '<span class="sl-source-tag" title="From event">📅 From Event</span>';
  else if (p.brief_id) sourceHtml = '<span class="sl-source-tag" title="From campaign brief">📋 From Campaign</span>';

  // Platform chips
  var platChips = SL_PLATFORMS.map(function(pl) {
    var active = (p.platform_ids||[]).includes(pl.id);
    return '<button class="sl-plat-chip' + (active?' active':'') + '" data-plat="' + pl.id + '" onclick="slTogglePlatform(\'' + pl.id + '\',this)" ' + (!canEdit?'disabled':'') + '>'
      + '<span class="sl-plat-icon">' + pl.icon + '</span>' + pl.label + '</button>';
  }).join('');

  // Team member options
  var teamOptions = '<option value="">Unassigned</option>';
  if (typeof CB_TEAM !== 'undefined') {
    Object.values(CB_TEAM).forEach(function(m) {
      var uid = m.id || m.user_id;
      teamOptions += '<option value="' + uid + '"' + (p.assigned_to === uid ? ' selected' : '') + '>' + m.name + '</option>';
    });
  }

  // Brand options
  var brandOptions = '<option value="">Select brand</option>';
  if (typeof BRANDS !== 'undefined') {
    BRANDS.forEach(function(b) {
      brandOptions += '<option value="' + b.id + '"' + (p.brand_id === b.id ? ' selected' : '') + '>' + b.name + '</option>';
    });
  }

  // Caption char counter
  var captionLen = (p.caption || '').length;
  var charClass = captionLen > 2000 ? 'over' : captionLen > 1500 ? 'warn' : '';
  var scheduledVal = p.scheduled_at ? p.scheduled_at.replace('Z','').substring(0,16) : '';

  // Platform previews
  var activePlats = (p.platform_ids||[]);
  var previewHtml = '';
  if (activePlats.length) {
    SL_ACTIVE_PREVIEW_TAB = SL_ACTIVE_PREVIEW_TAB || activePlats[0];
    if (!activePlats.includes(SL_ACTIVE_PREVIEW_TAB)) SL_ACTIVE_PREVIEW_TAB = activePlats[0];
    var tabs = activePlats.map(function(pid) {
      var pl = SL_PLATFORMS.find(function(x){ return x.id === pid; });
      return pl ? '<button class="sl-preview-tab' + (pid === SL_ACTIVE_PREVIEW_TAB ? ' active' : '') + '" onclick="slSwitchPreviewTab(\'' + pid + '\')">' + pl.icon + ' ' + pl.label + '</button>' : '';
    }).join('');
    var activepl = SL_PLATFORMS.find(function(x){ return x.id === SL_ACTIVE_PREVIEW_TAB; });
    var previewText = p.caption || '';
    var limitNote = activepl ? '<span>Limit: ' + activepl.limit.toLocaleString() + ' chars</span> · <span>' + previewText.length + ' used</span>' : '';
    previewHtml = '<hr class="sl-divider">'
      + '<div class="sl-section-label">Platform preview</div>'
      + '<div class="sl-preview-tabs">' + tabs + '</div>'
      + '<div class="sl-preview-frame" id="sl-preview-text">' + slEscape(previewText) + '</div>'
      + '<div class="sl-preview-meta">' + limitNote + '</div>';
  }

  // Comments
  var commentsHtml = '';
  if (!isNew && SL_COMMENTS.length) {
    commentsHtml = '<hr class="sl-divider"><div class="sl-section-label">Review thread</div><div class="sl-comment-thread">'
      + SL_COMMENTS.map(function(c) {
          var t = SL_STATUSES[c.comment_type] ? '' : c.comment_type;
          var ts = new Date(c.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
          var name = c.user_name || 'Team';
          var initials = name.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase();
          return '<div class="sl-comment sl-comment-type--' + (c.comment_type||'note') + '">'
            + '<div class="sl-avatar-xs" style="background:var(--swansway);margin-top:2px">' + initials + '</div>'
            + '<div class="sl-comment-body"><div><span class="sl-comment-name">' + slEscape(name) + '</span><span class="sl-comment-time">' + ts + '</span></div>'
            + '<div class="sl-comment-text">' + slEscape(c.comment) + '</div></div>'
            + '</div>';
        }).join('')
      + '</div>';
  }
  // Comment input (for review/approved posts)
  var commentInput = '';
  if (!isNew) {
    commentInput = '<hr class="sl-divider">'
      + '<div class="sl-field-group">'
      + '<div class="sl-field-label">Add a note</div>'
      + '<textarea class="sl-textarea" id="sl-new-comment" placeholder="Leave a note, feedback or update…" style="min-height:60px"></textarea>'
      + '<button class="sl-btn sl-btn--outline sl-btn--sm" style="margin-top:6px" onclick="slSubmitComment()">Send note</button>'
      + '</div>';
  }

  var disabled = canEdit ? '' : ' disabled';

  body.innerHTML = approvalBanner
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">'
    + statusBadge + sourceHtml
    + '</div>'

    // Title
    + '<div class="sl-field-group">'
    + '<div class="sl-field-label">Post title <span class="req">*</span></div>'
    + '<input class="sl-input" id="sl-f-title" value="' + slEscape(p.title||'') + '" placeholder="e.g. VW Summer Finance — Plate Change Push"' + disabled + '>'
    + '</div>'

    // Brand + Post type row
    + '<div class="sl-input-row">'
    + '<div class="sl-field-group"><div class="sl-field-label">Brand</div>'
    + '<select class="sl-select" id="sl-f-brand"' + disabled + '>' + brandOptions + '</select></div>'
    + '<div class="sl-field-group"><div class="sl-field-label">Post type</div>'
    + '<select class="sl-select" id="sl-f-type"' + disabled + '>'
    + '<option value="new_model"'        + (p.post_type==='new_model'       ?' selected':'') + '>New Model</option>'
    + '<option value="offer"'            + (p.post_type==='offer'           ?' selected':'') + '>Offer / Deal</option>'
    + '<option value="event"'            + (p.post_type==='event'           ?' selected':'') + '>Event</option>'
    + '<option value="brand_story"'      + (p.post_type==='brand_story'     ?' selected':'') + '>Brand Story</option>'
    + '<option value="csr"'              + (p.post_type==='csr'             ?' selected':'') + '>CSR</option>'
    + '<option value="competition"'      + (p.post_type==='competition'     ?' selected':'') + '>Competition</option>'
    + '<option value="behind_scenes"'    + (p.post_type==='behind_scenes'   ?' selected':'') + '>Behind the Scenes</option>'
    + '<option value="product_walkround"'+ (p.post_type==='product_walkround'?' selected':'') + '>Product Walkaround</option>'
    + '</select></div>'
    + '</div>'

    // Platforms
    + '<div class="sl-field-group">'
    + '<div class="sl-field-label">Platforms <span class="req">*</span></div>'
    + '<div class="sl-plat-chips" id="sl-plat-chips">' + platChips + '</div>'
    + '</div>'

    // Scheduled date
    + '<div class="sl-input-row">'
    + '<div class="sl-field-group"><div class="sl-field-label">Scheduled date &amp; time</div>'
    + '<input type="datetime-local" class="sl-input" id="sl-f-scheduled" value="' + scheduledVal + '"' + disabled + '></div>'
    + '<div class="sl-field-group"><div class="sl-field-label">Budget allocated (£)</div>'
    + '<input type="number" class="sl-input" id="sl-f-budget" value="' + (p.budget_allocated||'') + '" placeholder="0"' + disabled + '></div>'
    + '</div>'

    // Vehicle model + target audience
    + '<div class="sl-input-row">'
    + '<div class="sl-field-group"><div class="sl-field-label">Vehicle / model</div>'
    + '<input class="sl-input" id="sl-f-vehicle" value="' + slEscape(p.vehicle_model||'') + '" placeholder="e.g. VW ID.3, Audi A6 e-tron"' + disabled + '></div>'
    + '<div class="sl-field-group"><div class="sl-field-label">Target audience</div>'
    + '<input class="sl-input" id="sl-f-audience" value="' + slEscape(p.target_audience||'') + '" placeholder="e.g. In-market EV buyers"' + disabled + '></div>'
    + '</div>'

    // Location / site
    + '<div class="sl-field-group">'
    + '<div class="sl-field-label">Location / site</div>'
    + '<input class="sl-input" id="sl-f-location" value="' + slEscape(p.location||'') + '" placeholder="e.g. Audi Stafford, all sites"' + disabled + '>'
    + '</div>'

    // Caption
    + '<div class="sl-field-group">'
    + '<div class="sl-field-label">Caption / copy <span class="req">*</span></div>'
    + '<textarea class="sl-textarea" id="sl-f-caption" style="min-height:120px"' + disabled + ' oninput="slOnCaptionInput(this)">' + slEscape(p.caption||'') + '</textarea>'
    + '<div class="sl-char-counter ' + charClass + '" id="sl-char-counter">' + captionLen + ' characters</div>'
    + '</div>'

    // Hashtags
    + '<div class="sl-field-group">'
    + '<div class="sl-field-label">Hashtags</div>'
    + '<input class="sl-input" id="sl-f-hashtags" value="' + slEscape(p.hashtags||'') + '" placeholder="#automotive #swansway #audi"' + disabled + '>'
    + ((p.platform_ids||[]).includes('instagram') ? '<label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px;color:var(--ink-soft);cursor:pointer"><input type="checkbox" id="sl-f-hashtag-first-comment" ' + (p.hashtag_first_comment?'checked':'') + (disabled?' disabled':'') + '><span>Post hashtags as first comment (Instagram best practice)</span></label>' : '')
    + '</div>'

    // Link / CTA
    + '<div class="sl-field-group">'
    + '<div class="sl-field-label">Link / CTA URL</div>'
    + '<input class="sl-input" id="sl-f-cta-url" type="url" value="' + slEscape(p.cta_url||'') + '" placeholder="https://swansway.com/offers/audi-q5" ' + disabled + '>'
    + '</div>'

    // Assigned to
    + '<div class="sl-field-group">'
    + '<div class="sl-field-label">Assigned to</div>'
    + '<select class="sl-select" id="sl-f-assignee">'
    + teamOptions
    + '</select>'
    + '</div>'

    // Notes
    + '<div class="sl-field-group">'
    + '<div class="sl-field-label">Internal notes</div>'
    + '<textarea class="sl-textarea" id="sl-f-notes" style="min-height:60px"' + disabled + '>' + slEscape(p.notes||'') + '</textarea>'
    + '</div>'

    + previewHtml
    + commentsHtml
    + commentInput;

  // Footer buttons
  footer.innerHTML = '';
  if (canEdit || isNew) {
    var saveBtn = document.createElement('button');
    saveBtn.className = 'sl-btn sl-btn--primary';
    saveBtn.textContent = isNew ? 'Save draft' : 'Save changes';
    saveBtn.onclick = function() { slSavePost(); };
    footer.appendChild(saveBtn);
  }
  if (!isNew && (p.status === 'draft' || p.status === 'rejected') && CB_CURRENT_USER) {
    var submitBtn = document.createElement('button');
    submitBtn.className = 'sl-btn sl-btn--outline';
    submitBtn.textContent = 'Submit for approval →';
    submitBtn.onclick = function() { slSubmitPost(); };
    footer.appendChild(submitBtn);
  }
  if (!isNew && p.status === 'approved' && CB_CURRENT_USER) {
    var schedBtn = document.createElement('button');
    schedBtn.className = 'sl-btn sl-btn--outline';
    schedBtn.innerHTML = '📅 Mark as Scheduled';
    schedBtn.onclick = function() { slSetStatus('scheduled'); };
    footer.appendChild(schedBtn);
  }
  if (!isNew && p.status === 'scheduled' && CB_CURRENT_USER) {
    var pubBtn = document.createElement('button');
    pubBtn.className = 'sl-btn sl-btn--approve';
    pubBtn.innerHTML = '🟣 Mark as Published';
    pubBtn.onclick = function() { slSetStatus('published'); };
    footer.appendChild(pubBtn);
  }
  if (!isNew) {
    var closeBtn = document.createElement('button');
    closeBtn.className = 'sl-btn sl-btn--ghost';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = slClosePanel;
    footer.appendChild(closeBtn);
  }
}

function slTogglePlatform(platId, btn) {
  if (!SL_PANEL_POST) return;
  // Sync live form fields back into SL_PANEL_POST before any re-render,
  // so typed values (title, brand, etc.) are not lost.
  if (document.getElementById('sl-f-title')) {
    var live = slCollectFormData();
    Object.assign(SL_PANEL_POST, live);
  }
  var ids = SL_PANEL_POST.platform_ids || [];
  var idx = ids.indexOf(platId);
  if (idx > -1) ids.splice(idx, 1);
  else ids.push(platId);
  SL_PANEL_POST.platform_ids = ids;
  btn.classList.toggle('active', ids.includes(platId));
  // Update preview tabs
  var previewArea = document.getElementById('sl-preview-text');
  if (!previewArea && ids.length) {
    // Re-render to show preview section
    slRenderPanel();
  } else if (previewArea) {
    SL_ACTIVE_PREVIEW_TAB = ids.includes(SL_ACTIVE_PREVIEW_TAB) ? SL_ACTIVE_PREVIEW_TAB : ids[0];
    slRenderPanel();
  }
}

function slSwitchPreviewTab(platId) {
  SL_ACTIVE_PREVIEW_TAB = platId;
  document.querySelectorAll('.sl-preview-tab').forEach(function(t) {
    t.classList.toggle('active', t.textContent.trim().toLowerCase().includes(platId));
  });
  var cap = document.getElementById('sl-f-caption');
  var prev = document.getElementById('sl-preview-text');
  if (cap && prev) prev.textContent = cap.value;
}

function slOnCaptionInput(ta) {
  var len = ta.value.length;
  var cc = document.getElementById('sl-char-counter');
  if (cc) {
    cc.textContent = len + ' characters';
    cc.className = 'sl-char-counter' + (len > 2000 ? ' over' : len > 1500 ? ' warn' : '');
  }
  var prev = document.getElementById('sl-preview-text');
  if (prev) prev.textContent = ta.value;
}

/* ══════════════════════════════════════════════════════════
   SAVE / STATUS CHANGES
══════════════════════════════════════════════════════════ */

function slCollectFormData() {
  var p = SL_PANEL_POST || {};
  return {
    title:            (document.getElementById('sl-f-title')    ||{}).value || '',
    brand_id:         (document.getElementById('sl-f-brand')    ||{}).value || null,
    post_type:        (document.getElementById('sl-f-type')     ||{}).value || 'organic',
    caption:          (document.getElementById('sl-f-caption')  ||{}).value || '',
    platform_ids:     p.platform_ids || [],
    scheduled_at:     (document.getElementById('sl-f-scheduled')||{}).value || null,
    budget_allocated: parseFloat((document.getElementById('sl-f-budget') ||{}).value) || null,
    vehicle_model:    (document.getElementById('sl-f-vehicle')  ||{}).value || null,
    target_audience:  (document.getElementById('sl-f-audience') ||{}).value || null,
    location:         (document.getElementById('sl-f-location') ||{}).value || null,
    assigned_to:      slAsUUID((document.getElementById('sl-f-assignee') ||{}).value) || null,
    notes:            (document.getElementById('sl-f-notes')    ||{}).value || null,
    hashtags:         (document.getElementById('sl-f-hashtags') ||{}).value || null,
    hashtag_first_comment: !!(document.getElementById('sl-f-hashtag-first-comment') && document.getElementById('sl-f-hashtag-first-comment').checked),
    cta_url:          (document.getElementById('sl-f-cta-url')  ||{}).value || null,
  };
}

async function slSavePost() {
  var data = slCollectFormData();
  if (!data.title.trim()) { slShowToast('Post title is required', 'error'); return; }
  if (!data.platform_ids.length) { slShowToast('Select at least one platform', 'error'); return; }

  var btn = document.querySelector('#sl-panel-footer .sl-btn--primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    var payload = Object.assign({}, SL_PANEL_POST, data, {
      updated_at: new Date().toISOString(),
    });
    // Clean fields that shouldn't be in upsert
    delete payload.id;

    var isNew = !SL_EDITING_ID;
    if (isNew) {
      payload.status = 'draft';
      payload.created_by = slAsUUID(CB_CURRENT_USER);
      payload.created_at = new Date().toISOString();
    }

    var r;
    if (isNew) {
      r = await fetch(SL_BASE + '/social_posts', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
        body: JSON.stringify([payload])
      });
    } else {
      r = await fetch(SL_BASE + '/social_posts?id=eq.' + SL_EDITING_ID, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
        body: JSON.stringify(payload)
      });
    }

    if (!r.ok) throw new Error(await r.text());
    var saved = await r.json();
    var savedPost = Array.isArray(saved) ? saved[0] : saved;

    slShowToast('Post saved ✓', 'success');
    SL_EDITING_ID = savedPost.id;
    SL_PANEL_POST = savedPost;

    await slLoadPosts();
    slRenderPanel();

    if (btn) { btn.disabled = false; btn.textContent = 'Save changes'; }
  } catch(e) {
    slShowToast('Save failed: ' + e.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = isNew ? 'Save draft' : 'Save changes'; }
  }
}

async function slSubmitPost() {
  if (!SL_EDITING_ID) { slShowToast('Save first', 'error'); return; }
  // Auto-save any unsaved changes first
  var data = slCollectFormData();
  try {
    await fetch(SL_BASE + '/social_posts?id=eq.' + SL_EDITING_ID, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
      body: JSON.stringify(Object.assign({}, data, {
        status: 'in_review',
        submitted_by: slAsUUID(CB_CURRENT_USER),
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    });
    SL_PANEL_POST.status = 'in_review';
    // Add system comment
    await slAddComment('Submitted for approval', 'note');
    slShowToast('Submitted for approval ✓', 'success');
    await slLoadPosts();
    slRenderPanel();
  } catch(e) {
    slShowToast('Submit failed: ' + e.message, 'error');
  }
}

async function slApprovePost() {
  if (!SL_EDITING_ID) return;
  var me = (typeof CB_TEAM !== 'undefined' ? CB_TEAM[CB_CURRENT_USER] : null) || {};
  try {
    await fetch(SL_BASE + '/social_posts?id=eq.' + SL_EDITING_ID, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
      body: JSON.stringify({
        status: 'approved',
        approved_by: slAsUUID(CB_CURRENT_USER),
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    });
    SL_PANEL_POST.status = 'approved';
    await slAddComment('Post approved ✓', 'approval');
    slShowToast('Post approved ✓', 'success');
    await slLoadPosts();
    slRenderPanel();
  } catch(e) {
    slShowToast('Approval failed: ' + e.message, 'error');
  }
}

function slShowRejectModal() {
  var root = document.getElementById('sl-reject-modal-root');
  if (!root) return;
  root.innerHTML = '<div class="sl-reject-modal" id="sl-reject-modal">'
    + '<div class="sl-reject-box">'
    + '<div class="sl-reject-header">Reject post</div>'
    + '<div class="sl-reject-body">'
    + '<div class="sl-field-label" style="margin-bottom:6px">Reason for rejection <span style="color:var(--swansway)">*</span></div>'
    + '<textarea class="sl-textarea" id="sl-reject-reason" placeholder="Tell the team what needs to change…" style="min-height:80px"></textarea>'
    + '</div>'
    + '<div class="sl-reject-footer">'
    + '<button class="sl-btn sl-btn--outline" onclick="document.getElementById(\'sl-reject-modal\').remove()">Cancel</button>'
    + '<button class="sl-btn sl-btn--reject" onclick="slConfirmReject()">Reject post</button>'
    + '</div>'
    + '</div>'
    + '</div>';
}

async function slConfirmReject() {
  var reason = (document.getElementById('sl-reject-reason')||{}).value || '';
  if (!reason.trim()) { slShowToast('Please add a rejection reason', 'error'); return; }
  try {
    await fetch(SL_BASE + '/social_posts?id=eq.' + SL_EDITING_ID, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
      body: JSON.stringify({
        status: 'rejected',
        rejected_by: slAsUUID(CB_CURRENT_USER),
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
    });
    SL_PANEL_POST.status = 'rejected';
    await slAddComment(reason, 'rejection');
    var modal = document.getElementById('sl-reject-modal');
    if (modal) modal.remove();
    slShowToast('Post rejected — team has been notified', 'error');
    await slLoadPosts();
    slRenderPanel();
  } catch(e) {
    slShowToast('Reject failed: ' + e.message, 'error');
  }
}

async function slSetStatus(newStatus) {
  if (!SL_EDITING_ID) return;
  try {
    var patch = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'published') patch.published_at = new Date().toISOString();
    if (newStatus === 'scheduled') patch.scheduled_at = patch.scheduled_at || SL_PANEL_POST.scheduled_at;
    await fetch(SL_BASE + '/social_posts?id=eq.' + SL_EDITING_ID, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
      body: JSON.stringify(patch)
    });
    SL_PANEL_POST.status = newStatus;
    slShowToast('Status updated to ' + SL_STATUSES[newStatus].label + ' ✓', 'success');
    await slLoadPosts();
    slRenderPanel();
  } catch(e) {
    slShowToast('Update failed: ' + e.message, 'error');
  }
}

async function slAddComment(text, type) {
  if (!SL_EDITING_ID) return;
  var me = (typeof CB_TEAM !== 'undefined' ? CB_TEAM[CB_CURRENT_USER] : null) || {};
  await fetch(SL_BASE + '/social_comments', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify([{
      post_id: SL_EDITING_ID,
      user_id: slAsUUID(CB_CURRENT_USER),
      user_name: me.name || 'Team',
      comment: text,
      comment_type: type || 'note',
      created_at: new Date().toISOString(),
    }])
  });
}

async function slSubmitComment() {
  var el = document.getElementById('sl-new-comment');
  var text = el ? el.value.trim() : '';
  if (!text) return;
  await slAddComment(text, 'note');
  if (el) el.value = '';
  await slLoadComments(SL_EDITING_ID);
  slShowToast('Note added ✓', 'success');
  slRenderPanel();
}

/* ══════════════════════════════════════════════════════════
   AUTO-GENERATE FROM EVENTS / BRIEFS
   Called from events.js and brief7.js after save
══════════════════════════════════════════════════════════ */

// Called directly (on same page) or via sessionStorage redirect
function slPromptFromEvent(eventIds, eventData) {
  // eventData: { title, brand_id, site_ids, start_date, end_date, planned_budget, location, event_type_id }
  var payload = {
    source: 'event',
    event_ids: eventIds,
    title: eventData.title,
    brand_id: eventData.brand_id,
    site_ids: eventData.site_ids || [],
    start_date: eventData.start_date,
    end_date: eventData.end_date,
    budget: eventData.planned_budget,
    location: eventData.location,
  };
  if (/social\.html/.test(window.location.pathname)) {
    slShowGenModal(payload);
  } else {
    // Store for when social.html loads
    try { sessionStorage.setItem('_slGenPayload', JSON.stringify(payload)); } catch(e) {}
    window.location = 'social.html';
  }
}

function slPromptFromBrief(briefId, briefData) {
  // briefData: BB object — brand, start_date, end_date, budget, channels, site_ids
  var payload = {
    source: 'brief',
    brief_id: briefId,
    title: briefData.title || window._lastSavedBriefTitle || 'Campaign',
    brand_id: briefData.brand ? briefData.brand.id : null,
    site_ids: briefData.site_ids || [],
    start_date: briefData.start_date,
    end_date: briefData.end_date,
    budget: briefData.budget,
  };
  if (/social\.html/.test(window.location.pathname)) {
    slShowGenModal(payload);
  } else {
    try { sessionStorage.setItem('_slGenPayload', JSON.stringify(payload)); } catch(e) {}
    window.location = 'social.html';
  }
}

function slShowGenModal(payload) {
  var root = document.getElementById('sl-gen-modal-root');
  if (!root) return;

  var sourceLabel = payload.source === 'event' ? 'event' : 'campaign brief';
  var brand = (typeof BRANDS !== 'undefined' ? BRANDS.find(function(b){ return b.id === payload.brand_id; }) : null) || {};
  var dateRange = '';
  if (payload.start_date && payload.end_date) {
    var sd = new Date(payload.start_date + 'T00:00:00');
    var ed = new Date(payload.end_date + 'T00:00:00');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    dateRange = sd.getDate() + ' ' + months[sd.getMonth()] + ' – ' + ed.getDate() + ' ' + months[ed.getMonth()];
  }

  // Platform chips (pre-select social platforms by default)
  var defaultPlatforms = ['facebook','instagram'];
  var platChips = SL_PLATFORMS.map(function(pl) {
    var active = defaultPlatforms.includes(pl.id);
    return '<button class="sl-plat-chip' + (active?' active':'') + '" data-plat="' + pl.id + '" onclick="this.classList.toggle(\'active\')" style="font-size:12px">'
      + pl.icon + ' ' + pl.label + '</button>';
  }).join('');

  root.innerHTML = '<div class="sl-gen-modal" id="sl-gen-modal">'
    + '<div class="sl-gen-box">'
    + '<div class="sl-gen-header">'
    + '<div class="sl-gen-title">Generate social posts?</div>'
    + '<div class="sl-gen-sub">' + slEscape(payload.title||'') + (brand.name ? ' · ' + brand.name : '') + (dateRange ? ' · ' + dateRange : '') + '</div>'
    + '</div>'
    + '<div class="sl-gen-body">'
    + '<p style="font-family:var(--font-b);font-size:13px;color:var(--ink-soft);margin-bottom:16px">Select which platforms to create draft posts for. Posts will be pre-filled with the ' + sourceLabel + ' details and added to your Social Hub as drafts.</p>'
    + '<div class="sl-field-label" style="margin-bottom:8px">Create posts for:</div>'
    + '<div class="sl-gen-platform-row">' + platChips + '</div>'
    + '</div>'
    + '<div class="sl-gen-footer">'
    + '<button class="sl-btn sl-btn--outline" onclick="document.getElementById(\'sl-gen-modal\').remove()">Skip for now</button>'
    + '<button class="sl-btn sl-btn--primary" onclick="slConfirmGenerate(' + JSON.stringify(payload).replace(/"/g,'&quot;') + ')">Create draft posts →</button>'
    + '</div>'
    + '</div>'
    + '</div>';
}

async function slConfirmGenerate(payload) {
  var modal = document.getElementById('sl-gen-modal');
  var selectedPlatforms = [];
  if (modal) {
    modal.querySelectorAll('.sl-plat-chip.active').forEach(function(chip) {
      selectedPlatforms.push(chip.dataset.plat);
    });
  }
  if (!selectedPlatforms.length) {
    slShowToast('Pick at least one platform', 'error');
    return;
  }
  if (modal) modal.remove();

  // Create one post per platform (or one post covering all selected)
  // We create a single post covering all selected platforms
  var schedDate = payload.start_date ? payload.start_date + 'T09:00:00' : null;
  var postData = {
    title:           payload.title || 'New post',
    brand_id:        payload.brand_id || null,
    site_ids:        payload.site_ids || [],
    platform_ids:    selectedPlatforms,
    status:          'draft',
    event_id:        payload.event_ids ? payload.event_ids[0] : null,
    brief_id:        payload.brief_id || null,
    scheduled_at:    schedDate,
    budget_allocated: payload.budget ? Math.round(payload.budget * 0.05) : null,  // 5% of event budget as default
    location:        payload.location || null,
    created_by:      slAsUUID(CB_CURRENT_USER),
    created_at:      new Date().toISOString(),
    updated_at:      new Date().toISOString(),
  };

  try {
    var r = await fetch(SL_BASE + '/social_posts', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
      body: JSON.stringify([postData])
    });
    if (!r.ok) throw new Error(await r.text());
    var saved = await r.json();
    var savedPost = Array.isArray(saved) ? saved[0] : saved;
    slShowToast('Draft post created ✓', 'success');
    await slLoadPosts();
    // Open the new post in the panel
    setTimeout(function() { slOpenPost(savedPost.id); }, 300);
  } catch(e) {
    slShowToast('Error creating post: ' + e.message, 'error');
  }
}

/* ══════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════ */

function slEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// Returns val only if it's a valid UUID, otherwise null.
// The portal uses name-based IDs (e.g. "marcus") for CB_CURRENT_USER
// in some environments, which Supabase rejects in UUID columns.
function slAsUUID(val) {
  if (!val) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val)) ? val : null;
}

function slShowToast(msg, type) {
  var toast = document.getElementById('sl-toast');
  if (!toast) {
    // Fall back to shared showToast if available
    if (typeof showToast === 'function') { showToast(msg, type); return; }
    return;
  }
  toast.textContent = msg;
  toast.style.background = (type === 'error') ? '#DC2626' : (type === 'success') ? '#059669' : '#374151';
  toast.style.display = 'block';
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function(){ toast.style.display = 'none'; }, 400);
  }, 3500);
}

// End of social.js
