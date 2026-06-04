// Swansway Marketing Portal — Intel & Review functions

function autopsyNew() {
  var formEl = document.getElementById('autopsy-form');
  if (!formEl) return;
  formEl.style.display = 'block';
  var brandOpts = BUDGET_BRANDS.map(function(b) { return '<option value="' + b.id + '" data-color="' + b.color + '">' + b.name + '</option>'; }).join('');
  var scoreButtons = '';
  for (var n = 1; n <= 10; n++) { scoreButtons += '<button type="button" class="btn btn-sm" id="aut-score-' + n + '" onclick="autopsySetScore(' + n + ')">' + n + '</button> '; }
  formEl.innerHTML = '<div class="card mb2"><div class="card-header" style="border-top:3px solid var(--accent)"><div class="card-title">New Campaign Autopsy</div><button class="btn btn-sm" onclick="document.getElementById(\'autopsy-form\').style.display=\'none\'">Cancel</button></div><div class="card-body"><div class="form-grid-2 mb2"><div class="form-group"><label class="form-label">Campaign name</label><input class="form-input" id="aut-name" placeholder="e.g. Audi March Plate Change 2026"></div><div class="form-group"><label class="form-label">Brand</label><select class="form-select" id="aut-brand">' + brandOpts + '</select></div><div class="form-group"><label class="form-label">Campaign type</label><select class="form-select" id="aut-type"><option>Plate change</option><option>Model launch</option><option>EV education</option><option>Aftersales</option><option>Fleet</option><option>Brand awareness</option><option>Event</option></select></div><div class="form-group"><label class="form-label">Date range</label><input class="form-input" id="aut-dates" placeholder="1 Mar - 31 Mar 2026"></div></div><div class="sh"><div><div class="sh-title" style="font-size:15px">Planned vs Actual</div></div></div><div class="form-grid-4 mb2"><div class="form-group"><label class="form-label">Budget planned</label><input type="number" class="form-input" id="aut-bp"></div><div class="form-group"><label class="form-label">Budget actual</label><input type="number" class="form-input" id="aut-ba"></div><div class="form-group"><label class="form-label">Leads planned</label><input type="number" class="form-input" id="aut-lp"></div><div class="form-group"><label class="form-label">Leads actual</label><input type="number" class="form-input" id="aut-la"></div><div class="form-group"><label class="form-label">CPL planned</label><input type="number" class="form-input" id="aut-cp"></div><div class="form-group"><label class="form-label">CPL actual</label><input type="number" class="form-input" id="aut-ca"></div><div class="form-group"><label class="form-label">Units planned</label><input type="number" class="form-input" id="aut-up"></div><div class="form-group"><label class="form-label">Units actual</label><input type="number" class="form-input" id="aut-ua"></div></div><div class="form-group mb1"><label class="form-label">What worked?</label><textarea class="form-textarea" id="aut-worked" placeholder="What performed well..."></textarea></div><div class="form-group mb1"><label class="form-label">What did not work?</label><textarea class="form-textarea" id="aut-didnt" placeholder="What underperformed..."></textarea></div><div class="form-group mb1"><label class="form-label">Key lesson</label><textarea class="form-textarea" id="aut-lesson" placeholder="What would you do differently..."></textarea></div><div class="form-group mb2"><label class="form-label">Score (1-10)</label><div style="display:flex;gap:6px;margin-top:4px">' + scoreButtons + '</div></div><button class="btn btn-primary" onclick="autopsySave()">Save autopsy</button></div></div>';
  autopsyScore = 0;
  formEl.scrollIntoView({behavior:'smooth'});
}


function autopsySetScore(n) {
  autopsyScore = n;
  for (var i = 1; i <= 10; i++) {
    var btn = document.getElementById('aut-score-' + i);
    if (btn) { btn.style.background = i <= n ? 'var(--swansway)' : ''; btn.style.color = i <= n ? '#fff' : ''; }
  }
}


function autopsySave() {
  var brand = BUDGET_BRANDS.find(function(b) { return b.id === g('aut-brand'); }) || BUDGET_BRANDS[0];
  var autopsy = {
    id: Date.now(), name: g('aut-name') || 'Unnamed', brand: brand.name, brandId: brand.id, brandColor: brand.color,
    type: g('aut-type'), dates: g('aut-dates'),
    budget: {planned: parseInt(g('aut-bp'))||0, actual: parseInt(g('aut-ba'))||0},
    leads:  {planned: parseInt(g('aut-lp'))||0, actual: parseInt(g('aut-la'))||0},
    cpl:    {planned: parseInt(g('aut-cp'))||0, actual: parseInt(g('aut-ca'))||0},
    units:  {planned: parseInt(g('aut-up'))||0, actual: parseInt(g('aut-ua'))||0},
    worked: g('aut-worked'), didnt: g('aut-didnt'), lesson: g('aut-lesson'),
    score: autopsyScore, created: new Date().toISOString()
  };
  AUTOPSY_LIST.unshift(autopsy);
  if (SB && SB_USER) { SB.from('autopsies').insert({user_id:SB_USER.id,brand_id:brand.id,brand_name:brand.name,data:autopsy}).then(function(){}); }
  document.getElementById('autopsy-form').style.display = 'none';
  autopsyScore = 0;
  renderAutopsyList();
}


function autopsyMetric(label, plan, actual, lowerBetter) {
  var diff = actual - plan;
  var good = lowerBetter ? diff <= 0 : diff >= 0;
  var cls = actual === 0 ? '' : (good ? 'on' : (Math.abs(diff/plan) > 0.2 ? 'over' : 'under'));
  var arrow = actual === 0 ? '' : (diff > 0 ? ' &#8593;' : ' &#8595;');
  return '<div class="autopsy-metric"><div class="autopsy-metric-label">' + label + '</div><div class="autopsy-metric-row"><div class="autopsy-planned">&pound;' + plan.toLocaleString() + '</div><div class="autopsy-actual ' + cls + '">' + (actual > 0 ? '&pound;' + actual.toLocaleString() + arrow : '&mdash;') + '</div></div></div>';
}


function autopsyDelete(id) {
  if (!confirm('Delete this autopsy?')) return;
  AUTOPSY_LIST = AUTOPSY_LIST.filter(function(a) { return a.id !== id; });
  if (SB && SB_USER) { SB.from('autopsies').delete().eq('id', id).then(function(){}); }
  renderAutopsyList();
}


function autopsyLoadSaved() { renderAutopsyList(); }


async function competitorScan() {
  var statusEl  = document.getElementById('competitor-scan-status');
  var resultsEl = document.getElementById('competitor-results');
  var btn       = document.getElementById('competitor-scan-btn');
  var msgEl     = document.getElementById('comp-scan-msg');
  var subEl     = document.getElementById('comp-scan-sub');

  statusEl.style.display = 'block';
  resultsEl.innerHTML = '';
  btn.disabled = true;

  var steps = [
    ['Analysing Arnold Clark...', 'competitor intelligence'],
    ['Analysing Lookers & Evans Halshaw...', 'competitor intelligence'],
    ['Reviewing AutoTrader landscape...', 'market positioning'],
    ['Synthesising opportunities...', 'AI analysis'],
  ];
  var si = 0;
  var st = setInterval(function() {
    if (si < steps.length) { msgEl.textContent = steps[si][0]; subEl.textContent = steps[si][1]; si++; }
  }, 4000);

  try {
    var proxyUrl = 'https://swansway-marketing-hub.vercel.app/api/claude';

    // Build rich prompt with live Swansway context from hub data
    var groupBudget = Object.values(SITE_BUDGETS).reduce(function(s,d){ return s+(d.annual_planned||0); },0);
    var groupActual = Object.values(SITE_BUDGETS).reduce(function(s,d){
      for(var i=0;i<12;i++) s+=(d['m'+i+'_actual']||0); return s; },0);
    var brandSummary = BRANDS.map(function(b){
      var sites = HUB_SITES.filter(function(s){ return s.brand_id===b.id; });
      var planned = sites.reduce(function(s,site){ var d=SITE_BUDGETS[site.site_id]||{}; return s+(d.annual_planned||0); },0);
      return b.name+' ('+sites.length+' sites, £'+Math.round(planned/1000)+'K planned)';
    }).join(', ');
    var channelSummary = GROUP_CHANNELS.map(function(c){
      return c.n+' '+c.pct+'%';
    }).join(' | ');
    var kpiSummary = GROUP_KPIS.slice(0,4).map(function(k){
      return k.l+': '+(k.t||'TBC');
    }).join('; ');

    var prompt = [
      'You are a senior UK automotive retail marketing strategist providing a confidential competitive intelligence briefing for Swansway Motor Group.',
      '',
      '== SWANSWAY CONTEXT (use this to make recommendations specific and actionable) ==',
      '',
      'ABOUT SWANSWAY:',
      '- Independent family-owned dealer group, founded in Crewe, operating since 1999',
      '- 11 franchised brands across 35 sites in North West England, West Midlands and North Wales',
      '- Premium-to-volume mix: Audi, VW, SEAT, CUPRA, Land Rover, Jaguar, Honda, Peugeot, BYD, OMODA/JAECOO',
      '- Also operates Motor Match used car supermarkets at 5 sites',
      '- HQ: Crewe. Key clusters: Manchester corridor (Stockport, Oldham, Bolton), North Wales (Wrexham, Chester), Staffordshire (Stafford, Stoke)',
      '- Won Fleet Procure Dealer Group of the Year — strong B2B fleet position',
      '- Strong EV/PHEV portfolio: BYD, CUPRA, VW ID range, Peugeot E-308/E-3008, Jaguar all-electric pivot',
      '',
      'BRAND BREAKDOWN: ' + brandSummary,
      '',
      'ANNUAL MARKETING BUDGET: £' + groupBudget.toLocaleString() + ' planned | £' + groupActual.toLocaleString() + ' spent YTD',
      '',
      'CHANNEL MIX: ' + channelSummary,
      '',
      'KEY ' + PLAN_YEAR + ' TARGETS: ' + kpiSummary,
      '',
      'CURRENT STRATEGIC PRIORITIES:',
      '- Grow EV/PHEV to 35%+ of new sales mix (ZEV mandate compliance)',
      '- Scale digital leads from ~1,320/month to 2,400/month',
      '- Improve AutoTrader lead response speed — industry best practice is under 30 minutes',
      '- Grow fleet accounts from ~95 to 200+ active B2B accounts',
      '- Improve service retention to 68%+ group average',
      '- Scale Motor Match used car to 1,200+ units/year',
      '- Maximise manufacturer co-op fund utilisation (est. £380-420K available)',
      '',
      'KNOWN WEAKNESSES TO ADDRESS:',
      '- Digital lead response time lagging industry best practice',
      '- New brands (BYD, OMODA/JAECOO) need awareness building from zero',
      '- Geographic spread creates inconsistent brand experience across 35 sites',
      '- Social media following ~48K combined — below competitor scale',
      '- Some markets (Wrexham/Wales) have lower brand awareness vs Manchester corridor',
      '',
      '== COMPETITIVE INTELLIGENCE BRIEF ==',
      '',
      'Analyse these four major UK dealer group competitors: Arnold Clark, Lookers, Evans Halshaw, Marshall Motors.',
      '',
      'For each competitor, assess:',
      '1. Their current primary marketing push and Q2 2026 campaign focus',
      '2. Specific offers or promotions they are leading with (finance deals, PCP rates, part-ex offers)',
      '3. Which models they are featuring most heavily in advertising',
      '4. Which channels they invest most in (TV, digital, social, AutoTrader, outdoor)',
      '5. Their AutoTrader strategy — stock levels, review scores, response times, sponsored listings',
      '6. Their tone and positioning (premium, value, family, tech-forward etc)',
      '7. The SPECIFIC threat they pose to Swansway in overlapping geographies (North West, Midlands, North Wales)',
      '8. One high-impact action Swansway should take THIS MONTH in direct response',
      '',
      'Also provide:',
      '- 3 dominant market themes shaping UK automotive retail marketing in Q2 2026',
      '- Regional intelligence specific to North West England, West Midlands and North Wales car market',
      '- Assessment of the AutoTrader competitive landscape and where Swansway can gain an edge',
      '- The single biggest opportunity Swansway is currently not exploiting',
      '- 3 concrete recommended actions ranked by impact: one this week, one this month, one this quarter',
      '',
      'Be specific, commercial and direct. Reference real competitor campaigns, actual price points, named models and genuine market dynamics where you know them. This is for internal strategic use by Swansway\'s marketing director.',
      '',
      'Return ONLY valid JSON, no markdown, no explanation:',
      '{"scan_date":"May 2026","competitors":[{"name":"Arnold Clark","current_push":"string","headline_offers":["string"],"featured_models":["string"],"channels_active":["string"],"autotrader_presence":"string","tone":"string","swansway_threat":"string","insight":"string"}],"market_themes":["string"],"regional_intel":"string","autotrader_landscape":"string","swansway_opportunity":"string","recommended_actions":["this week: string","this month: string","this quarter: string"]}',
    ].join('\n');

    var resp = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    var rawText = await resp.text();
    if (!rawText) throw new Error('Empty response');
    var data = JSON.parse(rawText);
    if (data.error) {
      var errMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      throw new Error(errMsg);
    }

    var raw = '';
    if (data.content && Array.isArray(data.content)) {
      data.content.forEach(function(block) { if (block.type === 'text') raw += block.text; });
    }
    if (!raw) throw new Error('No text in response');

    var match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    var scan = JSON.parse(match[0]);
    scan._timestamp = new Date().toISOString();
    scan._live = false; // Knowledge-based, not live search

    COMP_SCANS.unshift(scan);
    if (COMP_SCANS.length > 10) COMP_SCANS = COMP_SCANS.slice(0, 10);
    if (SB && SB_USER) {
      SB.from('competitor_scans').insert({ user_id: SB_USER.id, data: scan }).then(function(){});
    }

    renderCompetitorResults(scan);
    updateCompetitorMetrics();

  } catch(e) {
    resultsEl.innerHTML = '<div style="color:var(--accent);padding:16px;font-size:13px"><strong>Scan error:</strong> ' + e.message + '</div>';
  }

  clearInterval(st);
  statusEl.style.display = 'none';
  btn.disabled = false;
}


async function generateQuiz() {
  var brand = document.getElementById('quiz-brand').value;
  var topic = document.getElementById('quiz-topic').value;
  var diff  = document.getElementById('quiz-difficulty').value;
  var container = document.getElementById('training-quiz-container');
  container.style.display = 'block';
  container.innerHTML = '<div style="text-align:center;padding:2rem"><div class="qplan-spinner"></div><div style="font-size:14px;font-weight:600;margin-top:12px">Generating quiz...</div></div>';
  container.scrollIntoView({behavior:'smooth'});
  var brandData = typeof BB_BRANDS !== 'undefined' ? BB_BRANDS.find(function(b){ return b.id === brand; }) : null;
  var ctx = brandData ? ('Brand: ' + brandData.name + '. Tone: ' + (brandData.tone||[]).join(', ') + '. Models: ' + (brandData.models||[]).join(', ') + '.') : 'All Swansway brands.';
  var topicMap = {tone:'tone of voice and brand personality',audience:'target audiences',models:'model range',channels:'marketing channels and PESO model',strategy:'2026 marketing strategy',competitor:'competitive landscape',mixed:'all topics'};
  try {
    var resp = await fetch('https://swansway-marketing-hub.vercel.app/api/claude', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:3000,messages:[{role:'user',content:'Generate a 10-question multiple choice quiz for Swansway Motor Group marketing team. Context: ' + ctx + ' Topic: ' + (topicMap[topic]||topic) + '. Difficulty: ' + diff + '. Return JSON only: {"title":"...","questions":[{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]}'}]})
    });
    var data = await resp.json();
    var raw = data.content && data.content[0] ? data.content[0].text : '';
    var match = raw.match(/\{[\s\S]*\}/);
    var quiz = JSON.parse(match ? match[0] : raw);
    QUIZ_STATE = {questions:quiz.questions, current:0, answers:[], score:0, title:quiz.title||'Quiz'};
    renderQuizQuestion();
  } catch(e) { container.innerHTML = '<div style="color:var(--accent);padding:16px">Error: ' + e.message + '</div>'; }
}


function renderQuizQuestion() {
  var container = document.getElementById('training-quiz-container');
  var q = QUIZ_STATE.questions[QUIZ_STATE.current];
  if (!q) { renderQuizResults(); return; }
  var opts = q.options.map(function(opt, i) {
    return '<button class="quiz-option" id="qopt-' + i + '" onclick="quizAnswer(' + i + ')">' + String.fromCharCode(65+i) + '. ' + opt + '</button>';
  }).join('');
  var pct = (QUIZ_STATE.current / QUIZ_STATE.questions.length * 100);
  container.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:1rem"><div style="font-family:var(--font-m);font-size:10px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.1em">Question ' + (QUIZ_STATE.current+1) + ' of ' + QUIZ_STATE.questions.length + '</div><div style="font-size:13px;font-weight:600;color:var(--swansway)">Score: ' + QUIZ_STATE.score + '/' + QUIZ_STATE.current + '</div></div><div style="height:4px;background:var(--border);border-radius:2px;margin-bottom:1.5rem"><div style="height:4px;border-radius:2px;background:var(--swansway);width:' + pct + '%;transition:width .4s"></div></div><div class="quiz-question"><div class="quiz-q-num">Question ' + (QUIZ_STATE.current+1) + '</div><div class="quiz-q-text">' + q.question + '</div><div class="quiz-options">' + opts + '</div><div class="quiz-explanation" id="quiz-exp">' + q.explanation + '</div></div><button class="btn btn-primary" id="quiz-next" onclick="quizNext()" style="display:none;margin-top:1rem">Next &rarr;</button>';
}


function quizAnswer(idx) {
  var q = QUIZ_STATE.questions[QUIZ_STATE.current];
  QUIZ_STATE.answers.push(idx);
  if (idx === q.correct) QUIZ_STATE.score++;
  document.querySelectorAll('.quiz-option').forEach(function(btn, i) {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('correct');
    else if (i === idx) btn.classList.add('wrong');
  });
  var exp = document.getElementById('quiz-exp');
  if (exp) exp.classList.add('show');
  var nxt = document.getElementById('quiz-next');
  if (nxt) nxt.style.display = 'inline-flex';
}


function quizNext() { QUIZ_STATE.current++; renderQuizQuestion(); }


function renderQuizResults() {
  var container = document.getElementById('training-quiz-container');
  var pct = Math.round(QUIZ_STATE.score / QUIZ_STATE.questions.length * 100);
  var grade = pct >= 90 ? 'Excellent' : pct >= 70 ? 'Good' : pct >= 50 ? 'Needs work' : 'Requires training';
  var gColor = pct >= 90 ? '#059669' : pct >= 70 ? '#D97706' : '#DC2626';
  container.innerHTML = '<div class="quiz-score-card"><div style="font-family:var(--font-m);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:8px">' + QUIZ_STATE.title + '</div><div class="quiz-score-num">' + QUIZ_STATE.score + '/' + QUIZ_STATE.questions.length + '</div><div class="quiz-score-label">' + pct + '% &mdash; <span style="color:' + gColor + ';font-weight:700">' + grade + '</span></div><div class="quiz-score-bar-wrap"><div class="quiz-score-bar" style="width:' + pct + '%"></div></div><div style="display:flex;gap:10px;justify-content:center;margin-top:1rem"><button class="btn" onclick="generateQuiz()" style="background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.3)">Try another</button><button class="btn" onclick="document.getElementById(\'training-quiz-container\').style.display=\'none\'" style="background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.3)">Back</button></div></div>';
}


function renderAssetChecklist() { return ''; }


async function loadAutopsies() {
  if (!SB_USER) return;
  try {
    var resp = await fetch(SUPABASE_URL + '/rest/v1/autopsies?select=data&order=created_at.desc', {
      headers: getAuthHeaders({'Content-Type': 'application/json'})
    });
    if (!resp.ok) return;
    var rows = await resp.json();
    if (rows && rows.length) {
      AUTOPSY_LIST = rows.map(function(row) { return row.data; });
      renderAutopsyList();
    }
  } catch(e) { console.warn('loadAutopsies error:', e); }
}


function renderAutopsyList() {
  var el = document.getElementById('autopsy-list');
  if (!el) return;
  if (!AUTOPSY_LIST.length) {
    el.innerHTML = '<div class="qplan-empty"><div class="qplan-empty-icon">&#128302;</div><div class="qplan-empty-title">No autopsies yet</div><div class="qplan-empty-sub">Click "New autopsy" after any campaign closes.</div></div>';
    return;
  }
  el.innerHTML = AUTOPSY_LIST.map(function(a) {
    var sc = a.score || 0;
    var scColor = sc >= 7 ? '#059669' : sc >= 5 ? '#D97706' : '#DC2626';
    var metrics = autopsyMetric('Budget',a.budget.planned,a.budget.actual,false) + autopsyMetric('Leads',a.leads.planned,a.leads.actual,false) + autopsyMetric('CPL',a.cpl.planned,a.cpl.actual,true) + autopsyMetric('Units',a.units.planned,a.units.actual,false);
    var worked = a.worked ? '<div class="autopsy-section-title">What worked</div><div class="autopsy-text">' + a.worked + '</div>' : '';
    var didnt = a.didnt ? '<div class="autopsy-section-title">What did not work</div><div class="autopsy-text">' + a.didnt + '</div>' : '';
    var lesson = a.lesson ? '<div class="autopsy-section-title">Key lesson</div><div class="autopsy-text" style="font-weight:500;color:var(--swansway)">' + a.lesson + '</div>' : '';
    return '<div class="autopsy-card"><div class="autopsy-card-header"><div><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span class="autopsy-brand-dot" style="background:' + a.brandColor + '"></span><span style="font-family:var(--font-m);font-size:10px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em">' + a.brand + ' &middot; ' + a.type + '</span></div><div style="font-family:var(--font-d);font-size:16px;font-weight:700">' + a.name + '</div><div style="font-size:11px;color:var(--ink-soft)">' + a.dates + '</div></div><div style="text-align:center"><div style="font-family:var(--font-d);font-size:32px;font-weight:700;color:' + scColor + '">' + (sc || '&mdash;') + '</div><div style="font-size:10px;color:var(--ink-soft)">/10</div></div></div><div class="autopsy-metric-grid">' + metrics + '</div>' + worked + didnt + lesson + '<div style="margin-top:10px;display:flex;justify-content:flex-end"><button class="btn btn-sm" style="color:var(--accent)" onclick="autopsyDelete(' + a.id + ')">Delete</button></div></div>';
  }).join('');
}


function renderCompetitorResults(scan) {
  var el = document.getElementById('competitor-results');
  if (!el) return;

  var liveTag = scan._live
    ? '<span style="background:#059669;color:#fff;font-size:9px;font-family:var(--font-m);padding:2px 7px;border-radius:10px;letter-spacing:0.06em;margin-left:8px">LIVE</span>'
    : '<span style="background:#6B7280;color:#fff;font-size:9px;font-family:var(--font-m);padding:2px 7px;border-radius:10px;letter-spacing:0.06em;margin-left:8px">CACHED</span>';

  var html = '';

  // Market themes bar
  if (scan.market_themes && scan.market_themes.length) {
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:14px 18px;margin-bottom:1rem">';
    html += '<div style="font-family:var(--font-m);font-size:10px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Market themes ' + liveTag + '</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    scan.market_themes.forEach(function(t) {
      html += '<span style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:3px 10px;font-size:12px">' + t + '</span>';
    });
    html += '</div></div>';
  }

  // Regional intel
  if (scan.regional_intel) {
    html += '<div style="background:rgba(200,16,46,0.04);border:1px solid rgba(200,16,46,0.15);border-radius:4px;padding:14px 18px;margin-bottom:1rem">';
    html += '<div style="font-family:var(--font-m);font-size:10px;color:var(--swansway);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">Regional intelligence</div>';
    html += '<div style="font-size:13px;color:var(--ink)">' + scan.regional_intel + '</div>';
    html += '</div>';
  }

  // Competitor cards
  (scan.competitors || []).forEach(function(c) {
    html += '<div class="competitor-card">';
    html += '<div class="competitor-header" style="display:flex;justify-content:space-between;align-items:center">';
    html += '<div style="font-weight:700;font-size:14px">' + c.name + '</div>';
    html += '<div style="font-size:11px;color:var(--ink-soft)">' + (c.tone || '') + '</div>';
    html += '</div>';
    html += '<div style="padding:14px 18px">';

    // Current push
    if (c.current_push) {
      html += '<div style="font-size:13px;font-weight:600;margin-bottom:10px;color:var(--ink)">' + c.current_push + '</div>';
    }

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">';

    // Offers
    if (c.headline_offers && c.headline_offers.length) {
      html += '<div><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Current offers</div>';
      c.headline_offers.forEach(function(o) {
        html += '<div style="font-size:12px;padding:2px 0;border-bottom:1px solid var(--border)">' + o + '</div>';
      });
      html += '</div>';
    }

    // Models
    if (c.featured_models && c.featured_models.length) {
      html += '<div><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Featured models</div>';
      c.featured_models.forEach(function(m) {
        html += '<div style="font-size:12px;padding:2px 0;border-bottom:1px solid var(--border)">' + m + '</div>';
      });
      html += '</div>';
    }
    html += '</div>';

    // Channels
    if (c.channels_active && c.channels_active.length) {
      html += '<div style="margin-bottom:10px"><div style="font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Active channels</div>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
      c.channels_active.forEach(function(ch) {
        html += '<span style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:2px 8px;font-size:11px">' + ch + '</span>';
      });
      html += '</div></div>';
    }

    // AutoTrader presence
    if (c.autotrader_presence) {
      html += '<div style="background:rgba(0,102,204,0.05);border-radius:3px;padding:8px 10px;font-size:12px;margin-bottom:10px">';
      html += '<strong style="color:#0066CC">AutoTrader:</strong> ' + c.autotrader_presence;
      html += '</div>';
    }

    // Threat + insight
    if (c.swansway_threat) {
      html += '<div style="background:rgba(220,38,38,0.05);border-radius:3px;padding:8px 10px;font-size:12px;margin-bottom:6px">';
      html += '<strong style="color:#DC2626">\u26a0 Threat:</strong> ' + c.swansway_threat;
      html += '</div>';
    }
    if (c.insight) {
      html += '<div style="background:rgba(5,150,105,0.05);border-radius:3px;padding:8px 10px;font-size:12px">';
      html += '<strong style="color:#059669">\u2192 Action:</strong> ' + c.insight;
      html += '</div>';
    }

    html += '</div></div>';
  });

  // Recommended actions
  if (scan.recommended_actions && scan.recommended_actions.length) {
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:14px 18px;margin-top:1rem">';
    html += '<div style="font-family:var(--font-m);font-size:10px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px">Recommended actions</div>';
    scan.recommended_actions.forEach(function(a, i) {
      html += '<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">';
      html += '<span style="font-family:var(--font-m);font-size:10px;font-weight:700;color:var(--swansway);padding-top:2px;min-width:16px">' + (i+1) + '</span>';
      html += a + '</div>';
    });
    html += '</div>';
  }

  // Opportunity
  if (scan.swansway_opportunity) {
    html += '<div style="background:rgba(200,16,46,0.04);border:1.5px solid var(--swansway);border-radius:4px;padding:14px 18px;margin-top:1rem">';
    html += '<div style="font-family:var(--font-m);font-size:10px;color:var(--swansway);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">Biggest opportunity</div>';
    html += '<div style="font-size:13px;font-weight:600">' + scan.swansway_opportunity + '</div>';
    html += '</div>';
  }

  el.innerHTML = html;
}


async function loadCompetitorScans() {
  if (!SB || !SB_USER) return;
  try {
    var r = await SB.from('competitor_scans').select('data').eq('user_id', SB_USER.id).order('created_at', {ascending: false}).limit(10);
    if (r.data && r.data.length) {
      COMP_SCANS = r.data.map(function(row) { return row.data; });
      updateCompetitorMetrics();
    }
  } catch(e) {}
}


function updateCompetitorMetrics() {
  if (!COMP_SCANS.length) return;
  var latest = COMP_SCANS[0];
  document.getElementById('comp-last-scan').textContent = new Date(latest._timestamp).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  var offers = (latest.competitors||[]).reduce(function(s,c){ return s + (c.headline_offers ? c.headline_offers.length : 0); }, 0);
  var models = (latest.competitors||[]).reduce(function(s,c){ return s + (c.featured_models ? c.featured_models.length : 0); }, 0);
  document.getElementById('comp-offer-count').textContent = offers || '&mdash;';
  document.getElementById('comp-model-count').textContent = models || '&mdash;';
  document.getElementById('comp-scan-count').textContent = COMP_SCANS.length;
  renderCompetitorResults(latest);
}
