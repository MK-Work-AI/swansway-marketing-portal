/* ─── news.js — Swansway Marketing Portal ─── */
/* Automotive news feed via rss2json.com       */
/* Step 1: news.html + news.js only — no       */
/* changes to any existing file in this step   */

var NW_FEEDS = [
  { url: 'https://www.autocar.co.uk/rss',               label: 'Autocar',       tag: 'uk-press' },
  { url: 'https://www.autoexpress.co.uk/feed/all',       label: 'Auto Express',  tag: 'uk-press' },
  { url: 'https://cardealermagazine.co.uk/feed',         label: 'Car Dealer',    tag: 'trade'    },
  { url: 'https://www.fleetnews.co.uk/rss',              label: 'Fleet News',    tag: 'trade'    },
  { url: 'https://www.electrifying.com/feed',            label: 'Electrifying',  tag: 'ev'       }
];

var NW_API   = 'https://api.rss2json.com/v1/api.json';
var NW_ALL   = [];      // merged, sorted articles
var NW_FILTER = 'all';  // current active filter
var NW_PAGE   = 0;      // pagination offset
var NW_PER    = 20;     // articles per page
var NW_LOADED_AT = null; // timestamp of last successful load

/* ── Guard: only run on news page ── */
function nwOnPage() {
  var _p = window.location.pathname;
  return _p.endsWith('news.html') || _p.endsWith('/news');
}

/* ── Entry point called from sbHandleSession ── */
function nwInit() {
  if (!nwOnPage()) return;
  nwLoadAll();
}

/* ── Fetch all feeds in parallel ── */
function nwLoadAll() {
  var grid = document.getElementById('nw-grid');
  var status = document.getElementById('nw-status');
  if (status) {
    status.textContent = 'Loading news…';
    status.style.display = 'block';
  }
  if (grid) grid.innerHTML = nwSkeletons(6);

  var promises = NW_FEEDS.map(function(feed) {
    var apiUrl = NW_API + '?rss_url=' + encodeURIComponent(feed.url) + '&count=20';
    return fetch(apiUrl)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.status !== 'ok') return [];
        return (data.items || []).map(function(item) {
          return {
            title:       item.title || '',
            link:        item.link  || '',
            pubDate:     item.pubDate || '',
            description: nwStripHtml(item.description || ''),
            thumbnail:   item.thumbnail || '',
            source:      feed.label,
            tag:         feed.tag,
            ts:          new Date(item.pubDate).getTime() || 0
          };
        });
      })
      .catch(function() { return []; }); // silent fail per feed
  });

  Promise.allSettled(promises).then(function(results) {
    NW_ALL = [];
    results.forEach(function(r) {
      if (r.status === 'fulfilled') {
        NW_ALL = NW_ALL.concat(r.value);
      }
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

/* ── Render articles for current filter + page ── */
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
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--ink-soft);font-size:14px">No articles found for this filter.</div>';
    if (more) more.style.display = 'none';
    return;
  }

  // First page: replace. Subsequent: append.
  if (NW_PAGE === 0) {
    grid.innerHTML = '';
  }

  slice.forEach(function(article) {
    var card = nwBuildCard(article);
    grid.insertAdjacentHTML('beforeend', card);
  });

  // Show/hide Load More
  var hasMore = (page0 + NW_PER) < filtered.length;
  if (more) more.style.display = hasMore ? 'block' : 'none';
}

/* ── Build a single news card ── */
function nwBuildCard(a) {
  var age = nwTimeAgo(a.ts);
  var tagColor = nwTagColor(a.tag);
  var excerpt = a.description ? a.description.substring(0, 120) + (a.description.length > 120 ? '…' : '') : '';

  var imgHtml = '';
  if (a.thumbnail && a.thumbnail.startsWith('http')) {
    imgHtml = '<div style="height:140px;overflow:hidden;border-radius:4px 4px 0 0;flex-shrink:0">'
      + '<img src="' + nwEsc(a.thumbnail) + '" alt="" loading="lazy" '
      + 'style="width:100%;height:100%;object-fit:cover" '
      + 'onerror="this.parentElement.style.display=\'none\'">'
      + '</div>';
  }

  return '<a href="' + nwEsc(a.link) + '" target="_blank" rel="noopener noreferrer" class="nw-card">'
    + imgHtml
    + '<div class="nw-card-body">'
    + '<div class="nw-card-meta">'
    + '<span class="nw-source-badge" style="background:' + tagColor.bg + ';color:' + tagColor.fg + '">' + nwEsc(a.source) + '</span>'
    + '<span class="nw-age">' + age + '</span>'
    + '</div>'
    + '<div class="nw-card-title">' + nwEsc(a.title) + '</div>'
    + (excerpt ? '<div class="nw-card-excerpt">' + nwEsc(excerpt) + '</div>' : '')
    + '</div>'
    + '</a>';
}

/* ── Filter change ── */
function nwSetFilter(tag, el) {
  NW_FILTER = tag;
  NW_PAGE = 0;

  // Update active tab styling
  document.querySelectorAll('.nw-filter-tab').forEach(function(t) {
    t.classList.remove('active');
  });
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

/* ── Update "last updated" timestamp ── */
function nwUpdateLastUpdated() {
  var el = document.getElementById('nw-last-updated');
  if (!el || !NW_LOADED_AT) return;
  el.textContent = 'Updated ' + nwTimeAgo(NW_LOADED_AT.getTime());
}

/* ── Skeleton loading cards ── */
function nwSkeletons(n) {
  var html = '';
  for (var i = 0; i < n; i++) {
    html += '<div class="nw-skeleton">'
      + '<div class="nw-skel-img"></div>'
      + '<div class="nw-skel-line" style="width:40%;margin-bottom:6px"></div>'
      + '<div class="nw-skel-line" style="width:90%;margin-bottom:4px"></div>'
      + '<div class="nw-skel-line" style="width:75%"></div>'
      + '</div>';
  }
  return html;
}

/* ── Utility: strip HTML tags from description ── */
function nwStripHtml(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

/* ── Utility: escape for HTML attributes / text nodes ── */
function nwEsc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Utility: relative time ── */
function nwTimeAgo(ts) {
  if (!ts) return '';
  var diff = Date.now() - ts;
  if (diff < 0) return 'just now';
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

/* ── Utility: tag colour mapping ── */
function nwTagColor(tag) {
  var map = {
    'uk-press': { bg:'#EFF6FF', fg:'#1E3A8A' },
    'trade':    { bg:'#FFF7ED', fg:'#7C2D12' },
    'ev':       { bg:'#F0FDF4', fg:'#14532D' }
  };
  return map[tag] || { bg:'#F4F2EF', fg:'#3D3D3D' };
}
