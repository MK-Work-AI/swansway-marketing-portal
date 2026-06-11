/* ─── news.js v7 — Swansway Marketing Portal ─── */
/* Routes RSS fetches through Vercel proxy         */
/* (direct fetch blocked by CORS on both rss2json  */
/*  and Google News)                               */

var NW_PROXY = 'https://swansway-rss-proxy.mkworkgmail.workers.dev/?url=';

var NW_FEEDS = [
  {
    url:   'https://www.autocar.co.uk/rss',
    label: 'Autocar',
    tag:   'uk-auto'
  },
  {
    url:   'https://www.autoexpress.co.uk/feed/all',
    label: 'Auto Express',
    tag:   'uk-auto'
  },
  {
    url:   'https://cardealermagazine.co.uk/feed',
    label: 'Car Dealer',
    tag:   'trade'
  },
  {
    url:   'https://www.carmagazine.co.uk/feed',
    label: 'Car Magazine',
    tag:   'uk-auto'
  },
  {
    url:   'https://www.whatcar.com/news/feed/',
    label: 'What Car',
    tag:   'uk-auto'
  }
];

var NW_ALL      = [];
var NW_FILTER   = 'all';
var NW_PAGE     = 0;
var NW_PER      = 20;
var NW_LOADED_AT = null;

/* ── Guard ── */
function nwOnPage() {
  var _p = window.location.pathname;
  return _p.endsWith('news.html') || _p.endsWith('/news');
}

/* ── Entry point ── */
function nwInit() {
  if (!nwOnPage()) return;
  nwLoadAll();
}

/* ── Fetch all feeds via proxy ── */
function nwLoadAll() {
  var grid   = document.getElementById('nw-grid');
  var status = document.getElementById('nw-status');
  if (status) { status.textContent = 'Loading news…'; status.style.display = 'block'; }
  if (grid)   { grid.innerHTML = nwSkeletons(6); }

  var promises = NW_FEEDS.map(function(feed) {
    var proxyUrl = NW_PROXY + encodeURIComponent(feed.url);
    return fetch(proxyUrl)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(data) {
        if (data.status !== 'ok') return [];
        return (data.items || []).map(function(item) {
          return {
            title:       item.title || '',
            link:        item.link  || '',
            pubDate:     item.pubDate || '',
            description: item.description || '',
            source:      item.source || feed.label,
            tag:         feed.tag,
            ts:          item.pubDate ? new Date(item.pubDate).getTime() : 0
          };
        });
      })
      .catch(function(e) { console.warn("NW feed failed:", feed.label, e.message); return []; });
  });

  Promise.allSettled(promises).then(function(results) {
    var seen = {};
    NW_ALL = [];
    results.forEach(function(r) {
      if (r.status !== 'fulfilled') return;
      r.value.forEach(function(item) {
        if (item.link && !seen[item.link]) {
          seen[item.link] = true;
          NW_ALL.push(item);
        }
      });
    });

    NW_ALL.sort(function(a, b) { return b.ts - a.ts; });
    console.log("NW: total articles loaded:", NW_ALL.length);
    NW_LOADED_AT = new Date();
    NW_PAGE = 0;

    if (status) status.style.display = 'none';
    nwUpdateLastUpdated();
    nwRender();
  });
}

/* ── Render ── */
function nwRender() {
  var grid = document.getElementById('nw-grid');
  var more = document.getElementById('nw-load-more');
  if (!grid) return;

  var filtered = NW_FILTER === 'all'
    ? NW_ALL
    : NW_ALL.filter(function(a) { return a.tag === NW_FILTER; });

  var page0 = NW_PAGE * NW_PER;
  var slice = filtered.slice(page0, page0 + NW_PER);

  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--ink-soft);font-size:14px">No articles found.</div>';
    if (more) more.style.display = 'none';
    return;
  }

  if (NW_PAGE === 0) grid.innerHTML = '';
  slice.forEach(function(a) { grid.insertAdjacentHTML('beforeend', nwBuildCard(a)); });

  if (more) more.style.display = ((page0 + NW_PER) < filtered.length) ? 'block' : 'none';
}

/* ── Card ── */
function nwBuildCard(a) {
  var age      = nwTimeAgo(a.ts);
  var tagColor = nwTagColor(a.tag);
  var excerpt  = a.description
    ? a.description.substring(0, 130) + (a.description.length > 130 ? '…' : '')
    : '';

  return '<a href="' + nwEsc(a.link) + '" target="_blank" rel="noopener noreferrer" class="nw-card">'
    + '<div class="nw-card-body">'
    + '<div class="nw-card-meta">'
    + '<span class="nw-source-badge" style="background:' + tagColor.bg + ';color:' + tagColor.fg + '">'
    + nwEsc(a.source) + '</span>'
    + '<span class="nw-age">' + age + '</span>'
    + '</div>'
    + '<div class="nw-card-title">' + nwEsc(a.title) + '</div>'
    + (excerpt ? '<div class="nw-card-excerpt">' + nwEsc(excerpt) + '</div>' : '')
    + '</div>'
    + '</a>';
}

/* ── Filter ── */
function nwSetFilter(tag, el) {
  NW_FILTER = tag;
  NW_PAGE   = 0;
  document.querySelectorAll('.nw-filter-tab').forEach(function(t) { t.classList.remove('active'); });
  if (el) el.classList.add('active');
  nwRender();
}

/* ── Load more ── */
function nwLoadMore() { NW_PAGE++; nwRender(); }

/* ── Refresh ── */
function nwRefresh() { NW_ALL = []; NW_PAGE = 0; nwLoadAll(); }

/* ── Last updated ── */
function nwUpdateLastUpdated() {
  var el = document.getElementById('nw-last-updated');
  if (el && NW_LOADED_AT) el.textContent = 'Updated ' + nwTimeAgo(NW_LOADED_AT.getTime());
}

/* ── Skeletons ── */
function nwSkeletons(n) {
  var html = '';
  for (var i = 0; i < n; i++) {
    html += '<div class="nw-skeleton">'
      + '<div class="nw-skel-line" style="width:35%;margin-bottom:8px"></div>'
      + '<div class="nw-skel-line" style="width:95%;margin-bottom:5px"></div>'
      + '<div class="nw-skel-line" style="width:80%"></div>'
      + '</div>';
  }
  return html;
}

/* ── Utilities ── */
function nwEsc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function nwTimeAgo(ts) {
  if (!ts) return '';
  var diff  = Date.now() - ts;
  if (diff < 0)   return 'just now';
  var mins  = Math.floor(diff / 60000);
  var hours = Math.floor(diff / 3600000);
  var days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'just now';
  if (mins < 60)  return mins + 'm ago';
  if (hours < 24) return hours + 'h ago';
  if (days === 1) return 'Yesterday';
  if (days < 7)   return days + 'd ago';
  return new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}

function nwTagColor(tag) {
  var map = {
    'uk-auto':  { bg:'#EFF6FF', fg:'#1E3A8A' },
    'ev':       { bg:'#F0FDF4', fg:'#14532D' },
    'trade':    { bg:'#FFF7ED', fg:'#7C2D12' },
    'industry': { bg:'#F5F3FF', fg:'#4C1D95' }
  };
  return map[tag] || { bg:'#F4F2EF', fg:'#3D3D3D' };
}
