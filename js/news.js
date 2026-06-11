/* ─── news.js v2 — Swansway Marketing Portal ─── */
/* Google News RSS (XML) — no API key, no proxy   */
/* Browser parses XML natively via DOMParser       */

var NW_FEEDS = [
  {
    url:   'https://news.google.com/rss/search?q=UK+automotive+car+dealer+motor&hl=en-GB&gl=GB&ceid=GB:en',
    label: 'UK Auto',
    tag:   'uk-auto'
  },
  {
    url:   'https://news.google.com/rss/search?q=electric+car+EV+UK+charging&hl=en-GB&gl=GB&ceid=GB:en',
    label: 'EV',
    tag:   'ev'
  },
  {
    url:   'https://news.google.com/rss/search?q=car+dealer+motor+trade+UK+dealership&hl=en-GB&gl=GB&ceid=GB:en',
    label: 'Trade',
    tag:   'trade'
  },
  {
    url:   'https://news.google.com/rss/search?q=car+manufacturer+automotive+industry+UK&hl=en-GB&gl=GB&ceid=GB:en',
    label: 'Industry',
    tag:   'industry'
  }
];

var NW_ALL      = [];   // merged, deduped, sorted articles
var NW_FILTER   = 'all';
var NW_PAGE     = 0;
var NW_PER      = 20;
var NW_LOADED_AT = null;

/* ── Guard: only run on news page ── */
function nwOnPage() {
  var _p = window.location.pathname;
  return _p.endsWith('news.html') || _p.endsWith('/news');
}

/* ── Entry point ── */
function nwInit() {
  if (!nwOnPage()) return;
  nwLoadAll();
}

/* ── Fetch all feeds in parallel ── */
function nwLoadAll() {
  var grid   = document.getElementById('nw-grid');
  var status = document.getElementById('nw-status');
  if (status) { status.textContent = 'Loading news…'; status.style.display = 'block'; }
  if (grid)   { grid.innerHTML = nwSkeletons(6); }

  var promises = NW_FEEDS.map(function(feed) {
    return fetch(feed.url)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function(xml) {
        return nwParseXML(xml, feed.label, feed.tag);
      })
      .catch(function() { return []; });
  });

  Promise.allSettled(promises).then(function(results) {
    var seen = {};
    NW_ALL = [];

    results.forEach(function(r) {
      if (r.status !== 'fulfilled') return;
      r.value.forEach(function(item) {
        // Dedupe by link
        if (!seen[item.link]) {
          seen[item.link] = true;
          NW_ALL.push(item);
        }
      });
    });

    // Sort newest first
    NW_ALL.sort(function(a, b) { return b.ts - a.ts; });

    NW_LOADED_AT = new Date();
    NW_PAGE = 0;

    if (status) status.style.display = 'none';
    nwUpdateLastUpdated();
    nwRender();
  });
}

/* ── Parse RSS XML into article array ── */
function nwParseXML(xmlStr, feedLabel, feedTag) {
  var articles = [];
  try {
    var parser = new DOMParser();
    var doc    = parser.parseFromString(xmlStr, 'text/xml');
    var items  = doc.querySelectorAll('item');

    items.forEach(function(item) {
      var title   = nwText(item, 'title');
      var link    = nwText(item, 'link') || nwGuid(item);
      var pubDate = nwText(item, 'pubDate');
      var desc    = nwText(item, 'description');
      var source  = nwText(item, 'source') || feedLabel;

      // Google News wraps the real link — extract it
      // link element in Google News RSS is the article URL directly
      var ts = pubDate ? new Date(pubDate).getTime() : 0;

      if (!title || !link) return;

      articles.push({
        title:       nwStripHtml(title),
        link:        link,
        pubDate:     pubDate,
        description: nwStripHtml(desc || '').substring(0, 160),
        source:      source,
        tag:         feedTag,
        ts:          ts
      });
    });
  } catch(e) {
    // parse failure — return empty
  }
  return articles;
}

/* ── XML helpers ── */
function nwText(el, tag) {
  var found = el.querySelector(tag);
  return found ? (found.textContent || '').trim() : '';
}
function nwGuid(el) {
  var found = el.querySelector('guid');
  return found ? (found.textContent || '').trim() : '';
}

/* ── Render articles ── */
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

  slice.forEach(function(article) {
    grid.insertAdjacentHTML('beforeend', nwBuildCard(article));
  });

  if (more) more.style.display = ((page0 + NW_PER) < filtered.length) ? 'block' : 'none';
}

/* ── Build a single card ── */
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
function nwLoadMore() {
  NW_PAGE++;
  nwRender();
}

/* ── Refresh ── */
function nwRefresh() {
  NW_ALL = [];
  NW_PAGE = 0;
  nwLoadAll();
}

/* ── Last updated timestamp ── */
function nwUpdateLastUpdated() {
  var el = document.getElementById('nw-last-updated');
  if (!el || !NW_LOADED_AT) return;
  el.textContent = 'Updated ' + nwTimeAgo(NW_LOADED_AT.getTime());
}

/* ── Skeleton loaders ── */
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

/* ── Strip HTML ── */
function nwStripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/* ── Escape for HTML ── */
function nwEsc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Relative time ── */
function nwTimeAgo(ts) {
  if (!ts) return '';
  var diff  = Date.now() - ts;
  if (diff < 0)    return 'just now';
  var mins  = Math.floor(diff / 60000);
  var hours = Math.floor(diff / 3600000);
  var days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'just now';
  if (mins < 60)  return mins + 'm ago';
  if (hours < 24) return hours + 'h ago';
  if (days === 1) return 'Yesterday';
  if (days < 7)   return days + 'd ago';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/* ── Tag colour mapping ── */
function nwTagColor(tag) {
  var map = {
    'uk-auto':  { bg: '#EFF6FF', fg: '#1E3A8A' },
    'ev':       { bg: '#F0FDF4', fg: '#14532D' },
    'trade':    { bg: '#FFF7ED', fg: '#7C2D12' },
    'industry': { bg: '#F5F3FF', fg: '#4C1D95' }
  };
  return map[tag] || { bg: '#F4F2EF', fg: '#3D3D3D' };
}
