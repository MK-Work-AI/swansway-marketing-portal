// Swansway Marketing Portal — Shared JS
// Data constants, auth, nav, toast, briefs panel

var PLAN_YEAR = new Date().getFullYear();


var PLAN_YEAR = new Date().getFullYear();
/* ══════════════════════════════════════
   DATA LAYER
══════════════════════════════════════ */

const BRANDS = [
  {
    id:'audi', name:'Audi', color:'#CC0000', segment:'Premium',
    sites:6, sitenames:'Blackburn · Carlisle · Crewe · Preston · Stafford · Stoke',
    budget:'—', newTarget:'—', evTarget:'45%', q2:'A6 e-tron Avant launch + Summer Drive VIP event',
    progress:78,
    tags:['A6 e-tron launch','VIP events','Fleet B2B','RS halo','Approved Used'],
    pillars:[
      {n:'01',t:'EV Transition Leadership',d:'Drive e-tron adoption across all 6 centres. A6 e-tron Avant/Sportback is the 2026 hero — test drive events Q2, free home charger incentive, BIK savings calculator for fleet buyers. Target Tesla and BMW iX conquest.'},
      {n:'02',t:'VIP & Experiential Events',d:'Audi Summer Drive VIP event in June across all 6 centres. RS Experience Day at Stafford. Pre-plate VIP nights in Feb/Aug. These events are the highest ROI activity — prioritise budget accordingly.'},
      {n:'03',t:'Fleet & Business Sales',d:'Leverage Swansway\'s Fleet Procure Group of the Year status. Crewe as fleet HQ. LinkedIn B2B targeting SMEs within 30 miles of each centre. Q5/A6/e-tron fleet packages with dedicated account manager.'},
      {n:'04',t:'Aftersales & Loyalty CRM',d:'6-stage owner lifecycle CRM. Service plan promotions, MOT reminders, upgrade trigger campaigns. Target lapsed customers 3+ years. Stafford is loyalty gold standard — replicate model across all centres.'},
    ],
    centres:[
      {name:'Blackburn Audi',flag:'',flagship:false,area:'Lancashire — M65 corridor',desc:'Upwardly-mobile Lancashire professionals. Focus on A3/Q3 conquest from mainstream brands. Active Facebook & Instagram. Local business community for fleet.',tags:['t-blue','t-green','t-amber'],tagLabels:['Q3 family','A3 conquest','Local fleet'],channel:'Meta paid + local radio',hero:'Q3 "Lancashire Life" lifestyle'},
      {name:'Carlisle Audi',flag:'',flagship:false,area:'Cumbria — Lake District gateway',desc:'Unique rural premium catchment. Adventure lifestyle angle for Q5/Q7/allroad. Smaller but high average transaction. Tourism crossover opportunity.',tags:['t-green','t-purple','t-teal'],tagLabels:['Q5/Q7 SUV','allroad','Lifestyle'],channel:'Instagram + Cumbria press',hero:'"Built for every road" Lake District'},
      {name:'Crewe Audi',flag:'FLEET HQ',flagship:true,area:'Cheshire — Swansway HQ adjacent',desc:'Flagship site. Strongest fleet capability. Rolls-Royce/Bentley workforce nearby — premium conquest. Crewe Alexandra sponsorship ongoing.',tags:['t-blue','t-red','t-purple'],tagLabels:['Fleet HQ','A6/A8 premium','e-tron launch'],channel:'LinkedIn B2B + events',hero:'A6 e-tron Avant launch event'},
      {name:'Preston Audi',flag:'',flagship:false,area:'Lancashire — M6/M55, Fylde Coast',desc:'Mixed: professionals, young families, UCLan graduates. Good A3/Q3 volume. Finance accessibility messaging. Strong Motability potential.',tags:['t-amber','t-teal','t-green'],tagLabels:['A3 finance','Motability','PCP push'],channel:'PPC + AutoTrader',hero:'"Drive Audi from £299/mo" PCP'},
      {name:'Stafford Audi',flag:'',flagship:false,area:'Staffordshire — M6 J13, Midlands gateway',desc:'Highest loyalty site in the network — multiple repeat family buyers. Focus on retention, upgrade cycles, RS halo events.',tags:['t-red','t-blue','t-purple'],tagLabels:['RS Experience','Loyalty CRM','Service retention'],channel:'CRM + VIP events',hero:'RS Experience Day + loyalty offers'},
      {name:'Stoke Audi',flag:'',flagship:false,area:'Stoke-on-Trent — A50/A500 junction',desc:'Volume site with extended hours (8:30–7pm Mon–Fri). Adjacent to BYD Stoke — cross-brand EV education opportunity. Strong used pipeline.',tags:['t-green','t-blue','t-amber'],tagLabels:['Approved Used','EV crossover','Volume PCP'],channel:'AutoTrader + Meta retargeting',hero:'Approved Used e-tron push'},
    ],
    campaigns:[
      {name:'Plate Change (Mar & Sep)',timing:'Mar & Sep',obj:'Volume new car sales',channels:'Google PPC · Meta · AutoTrader · Radio',offer:'PCP from £299/mo + deposit contribution',kpi:'Leads per centre, conversion rate'},
      {name:'A6 e-tron Avant Launch',timing:'Apr–Jun',obj:'EV conquest & awareness',channels:'YouTube · Meta · LinkedIn · Test drive events',offer:'Free home charger with every order',kpi:'Test drives booked, e-tron % of new sales'},
      {name:'Audi Summer Drive VIP',timing:'June',obj:'Loyalty, aspirational sales',channels:'CRM email · Showroom events · Social',offer:'VIP preview night, R8 drives',kpi:'Event attendees, post-event sales uplift'},
      {name:'Fleet & B2B Push',timing:'May & Oct',obj:'Fleet unit growth, SME',channels:'LinkedIn · Direct mail · Fleet drive days',offer:'Fleet deposit contribution, dedicated mgr',kpi:'Fleet enquiries, fleet units sold'},
      {name:'Approved Used e-tron',timing:'Jul–Sep',obj:'Used EV volume & margin',channels:'AutoTrader · Meta retargeting · Google Shopping',offer:'Audi Approved + 2yr warranty',kpi:'Used e-tron units, margin per unit'},
      {name:'RS Experience Day',timing:'Jun & Oct',obj:'Halo brand, luxury conquest',channels:'CRM · Social · Local press · Invitations',offer:'Track/road experience, RS fleet',kpi:'Attendees, A-grade leads, RS sales'},
      {name:'Service & MOT Retention',timing:'All year',obj:'Aftersales revenue & loyalty',channels:'CRM email · SMS · Audi app push',offer:'Audi Care plan, service discount',kpi:'Service bookings, plan uptake rate'},
      {name:'Year-End Clearance',timing:'Nov–Dec',obj:'Registrations, stock clear',channels:'PPC · Email · Social · AutoTrader',offer:'Year-end finance, 0% options',kpi:'Dec registrations, stock days'},
    ],
    audiences:[
      {t:'Aspirational Professionals (35–54)',d:'Primary volume segment. Company car replacements, PCP upgrades from VW/BMW. Motivated by status, technology and finance accessibility.<br><br><strong>Models:</strong> A4, Q5, A6, Q8<br><strong>Message:</strong> "Progress looks like this"<br><strong>Channels:</strong> LinkedIn, Google PPC, AutoTrader, email<br><strong>Hook:</strong> PCP from £XXX/mo, fleet deposit contribution'},
      {t:'EV-First Early Adopters (28–48)',d:'Growing fastest. Tesla and BMW i-series conquest. Motivated by technology, sustainability and TCO.<br><br><strong>Models:</strong> A6 e-tron, Q8 e-tron, Q4 e-tron<br><strong>Message:</strong> "Charge smarter, drive further"<br><strong>Channels:</strong> Instagram, YouTube pre-roll, Google EV search<br><strong>Hook:</strong> Home charger included, BIK tax savings'},
      {t:'Fleet & Business Users (B2B)',d:'High value, long relationship. SMEs within 30 miles of each centre. Tax efficiency is key.<br><br><strong>Models:</strong> A6 Avant, Q5, e-tron fleet<br><strong>Message:</strong> "Your business, elevated"<br><strong>Channels:</strong> LinkedIn, direct mail, fleet events, Chamber<br><strong>Hook:</strong> Dedicated account manager, 0% fleet finance'},
      {t:'Approved Used Buyers (25–45)',d:'Conquest from AutoTrader supermarkets. Aspirational buyers at accessible price points.<br><br><strong>Models:</strong> Used A3, Q3, e-tron, A4<br><strong>Message:</strong> "The Audi you wanted, at the price you expected"<br><strong>Channels:</strong> AutoTrader, Meta retargeting, Google Shopping<br><strong>Hook:</strong> Audi Approved cert, 2yr warranty, fixed servicing'},
    ],
    channels:[
      {n:'PPC & Display (Google/Bing)',pct:28,budget:'—',note:'Brand, model and conquest terms. AutoTrader co-bid. ZEV-specific search terms.',color:'#CC0000'},
      {n:'Social & Content (Meta/Instagram)',pct:18,budget:'—',note:'Lifestyle video, model launches, RS halo posts. Blackburn & Stoke highest Meta audience.',color:'#E63950'},
      {n:'Manufacturer Co-op (Audi UK)',pct:16,budget:'—',note:'Submit compliant creative to unlock Audi central fund. Plate change and model launches prioritised.',color:'#FF6B6B'},
      {n:'CRM & Email Marketing',pct:13,budget:'—',note:'6-stage owner lifecycle: service renewal, upgrade trigger, conquest reactivation.',color:'#8B0000'},
      {n:'Events & Showroom',pct:12,budget:'—',note:'Summer Drive, RS Experience, Fleet days, VIP nights. ~£15K per major event.',color:'#B22222'},
      {n:'SEO & Local Search',pct:8,budget:'—',note:'Google Business Profile optimisation, 30-min review response SLA, local content.',color:'#DC143C'},
      {n:'OOH & Print',pct:5,budget:'—',note:'Plate-change outdoor, Cumbria press for Carlisle, trade press fleet ads.',color:'#CD5C5C'},
    ],
    kpis:[
      {l:'New car units',t:'—',p:0,o:'HoBs + Sales'},
      {l:'EV/PHEV % of new sales',t:'45% mix',p:38,o:'Sales + Marketing'},
      {l:'Digital leads per month',t:'420 total',p:55,o:'Digital team'},
      {l:'Lead-to-sale conversion',t:'12% avg',p:48,o:'Sales managers'},
      {l:'AutoTrader response time',t:'< 30 min',p:72,o:'All centres'},
      {l:'Service retention rate',t:'70%+',p:60,o:'Aftersales mgrs'},
      {l:'Approved Used units',t:'960 units',p:50,o:'Used car mgrs'},
      {l:'Fleet units sold',t:'240 units',p:45,o:'Fleet team, Crewe'},
      {l:'Customer NPS',t:'75+',p:65,o:'HoBs'},
      {l:'Cost per lead (digital)',t:'< £38',p:68,o:'Digital team'},
    ],
    aiPrompts:[
      {icon:'✍️',cat:'Content',text:'Write a full creative brief for the Swansway Audi Summer Drive VIP event across all 6 centres, June 2026'},
      {icon:'📧',cat:'CRM',text:'Write a 6-email nurture sequence for Swansway Audi targeting Q5 PHEV prospects who took a test drive but didn\'t buy'},
      {icon:'📱',cat:'Social',text:'Write 5 Instagram/Facebook ad scripts for Swansway Audi promoting the A6 e-tron Avant to EV-first buyers in the North West'},
      {icon:'🏢',cat:'Fleet',text:'Design a B2B fleet proposition one-pager for Swansway Audi Crewe targeting SMEs in Cheshire and North Staffordshire'},
      {icon:'📅',cat:'Planning',text:'Build a month-by-month Audi marketing activity plan for Blackburn Audi, focusing on the Lancashire market'},
      {icon:'💰',cat:'Finance',text:'Write PPC ad copy for Swansway Audi promoting A3 Sportback PCP finance from £299/month across the North West'},
      {icon:'🎯',cat:'Strategy',text:'What are the top 5 Audi marketing quick wins Swansway should implement this month to increase digital leads?'},
      {icon:'📊',cat:'Reporting',text:'Build a weekly marketing dashboard template for Swansway Audi heads of business to review each Monday morning'},
    ]
  },

  {
    id:'vw', name:'Volkswagen', color:'#001E50', segment:'Mainstream',
    sites:3, sitenames:'Wrexham · Crewe · Oldham',
    budget:'—', newTarget:'2,400 units', evTarget:'35%', q2:'ID.3 summer finance push + Golf facelift media',
    progress:71,
    tags:['ID. EV range','Family SUVs','Fleet','Golf facelift','Finance PCP'],
    pillars:[
      {n:'01',t:'ID. Electric Range Push',d:'VW\'s EV transition is central to 2026. ID.3, ID.4, ID.5 — education-first campaigns explaining range, charging and total cost of ownership. Conquest from petrol-only buyers. ZEV mandate means manufacturer co-op funding is available.'},
      {n:'02',t:'Family & Lifestyle Positioning',d:'Golf, Tiguan, Touareg and Sharan are the workhorses. Family lifestyle content — school runs, holidays, weekend adventures. Competitive finance deals (PCP/PCH). Target families upgrading from Toyota/Ford.'},
      {n:'03',t:'Fleet & Business',d:'VW is the UK\'s most popular fleet brand. Exploit this with tailored B2B campaigns at each site. Polo for SME fleets, Transporter crossover with VW CV sites. Work with VW Financial Services for fleet PCP.'},
      {n:'04',t:'Approved Used & Stock Turn',d:'High volume used opportunity. Strict daily pricing discipline on AutoTrader. Finance-first messaging on used. Golf and Tiguan are the most searched used cars in the North West — capitalise on organic demand.'},
    ],
    centres:[
      {name:'Chester VW',flag:'',flagship:false,area:'Cheshire West — Chester, North Wales border',desc:'Strong catchment including North Wales overspill. Premium leisure location. Tiguan and Touareg lifestyle angle. EV adoption slower in rural NW — education-led campaigns needed.',tags:['t-blue','t-green'],tagLabels:['Tiguan lifestyle','EV education'],channel:'Facebook + Google PPC',hero:'ID.4 North Wales adventure campaign'},
      {name:'Crewe VW',flag:'',flagship:true,area:'Cheshire — Swansway HQ town',desc:'Co-located near group HQ. Cross-brand fleet opportunity with Audi Crewe. Strong local business community. Golfs and Tiguans are volume drivers.',tags:['t-blue','t-amber'],tagLabels:['Fleet B2B','Golf volume'],channel:'LinkedIn + PPC',hero:'Golf facelift launch event'},
      {name:'Oldham VW',flag:'NEW SITE',flagship:false,area:'Greater Manchester — M60 ring road',desc:'Newly acquired from Inchcape — custom-built state-of-the-art dealership. Large urban catchment. Young buyer opportunity. High footfall location near VW Van Centre Oldham.',tags:['t-purple','t-green','t-blue'],tagLabels:['ID.3 EV','Young buyers','New site launch'],channel:'Meta + TikTok + OOH',hero:'New dealership awareness campaign'},
      {name:'Preston VW',flag:'',flagship:false,area:'Lancashire — M6/M55 junction',desc:'Strong family market. Shared catchment with Preston Audi — cross-brand upsell opportunity. Polo and Golf are volume models. UCLan student finance angle.',tags:['t-amber','t-teal'],tagLabels:['PCP finance','Motability'],channel:'Radio + PPC',hero:'Family summer PCP offer'},
      {name:'Stafford VW',flag:'',flagship:false,area:'Staffordshire — M6 J13, Midlands gateway',desc:'Midlands gateway with strong B2B community. Tiguan and Touareg premium end. Proximity to Stafford Audi enables cross-brand upsell conversations.',tags:['t-blue','t-green'],tagLabels:['Tiguan/Touareg','Fleet'],channel:'Google PPC + email CRM',hero:'Tiguan PHEV Staffordshire push'},
    ],
    campaigns:[
      {name:'Plate Change (Mar & Sep)',timing:'Mar & Sep',obj:'Volume new car sales across all models',channels:'Google PPC · AutoTrader · Radio · Meta',offer:'PCP from £249/mo, 0% deposit options',kpi:'Units sold, leads per site'},
      {name:'ID. Electric Summer',timing:'May–Jul',obj:'EV conquest, ID.3/ID.4/ID.5 education',channels:'YouTube · Meta · Google EV search · Events',offer:'Free home charger + 3yr fixed service plan',kpi:'Test drives, EV units as % of mix'},
      {name:'Golf Facelift Launch',timing:'Mar–May',obj:'Volume sales, conquest from Ford/Toyota',channels:'PPC · Social · AutoTrader · Press',offer:'PCP from £299/mo, part exchange bonus',kpi:'Golf enquiries and sales uplift'},
      {name:'Family Summer Push',timing:'Jun–Aug',obj:'Tiguan/T-Roc family conquest',channels:'Facebook · Instagram · Outdoor · Radio',offer:'7-seat Tiguan Allspace lifestyle campaign',kpi:'SUV sales, family segment leads'},
      {name:'Oldham Grand Opening',timing:'Q1',obj:'Awareness, new site launch',channels:'OOH · Social · Local press · Events',offer:'Launch week test drive incentive',kpi:'Site visits, leads from Oldham catchment'},
    ],
    audiences:[
      {t:'Growing Families (28–45)',d:'Primary VW buyer. Tiguan, T-Roc, Golf Estate. 2–3 kids. Motivated by space, reliability and safety ratings.<br><br><strong>Message:</strong> "Room for everything that matters"<br><strong>Channels:</strong> Facebook, outdoor, radio, AutoTrader<br><strong>Hook:</strong> 7-seater upgrade, family PCP deal'},
      {t:'First-Time New Car Buyers (22–34)',d:'A3/Polo/Golf conquest from used market. Finance accessibility is everything. Motivated by monthly payment, warranty and connectivity.<br><br><strong>Message:</strong> "New car. New deal."<br><strong>Channels:</strong> TikTok, Instagram, Google, PCP calculator<br><strong>Hook:</strong> £0 deposit, PCP from £199/mo'},
      {t:'Fleet & Business (B2B)',d:'SME fleet operators. Golf, Passat, Tiguan for company car drivers. Tax efficiency, reliability and residuals.<br><br><strong>Message:</strong> "Britain\'s most trusted fleet brand"<br><strong>Channels:</strong> LinkedIn, direct mail, Chamber of Commerce<br><strong>Hook:</strong> Fleet management, BIK savings'},
      {t:'EV Converts (30–50)',d:'Ready to go electric but nervous about range. Conquest from petrol loyalists. Motivated by running costs and tech.<br><br><strong>Message:</strong> "Charge at home. Drive everywhere."<br><strong>Channels:</strong> YouTube, Google EV terms, comparison sites<br><strong>Hook:</strong> Home charger, ZEV grant, TCO calculator'},
    ],
    channels:[
      {n:'PPC & Display',pct:30,budget:'—',note:'Golf, Tiguan, ID. terms. AutoTrader premier listing at all 5 sites.',color:'#001E5A'},
      {n:'Social (Meta/TikTok)',pct:20,budget:'—',note:'Family lifestyle content. TikTok for Oldham new site launch targeting under-35s.',color:'#002D8A'},
      {n:'Manufacturer Co-op (VW UK)',pct:15,budget:'—',note:'Strong VW UK co-op funding available for ZEV models and plate-change periods.',color:'#1E3A8A'},
      {n:'CRM & Email',pct:13,budget:'—',note:'Lifecycle nurture, upgrade triggers, service retention. 5-stage sequence.',color:'#3B5998'},
      {n:'Events & Showroom',pct:10,budget:'—',note:'Oldham launch event, Golf facelift evenings, ID. EV experience days.',color:'#4169E1'},
      {n:'SEO & Local',pct:7,budget:'—',note:'Google Business Profile, review management across all 5 sites.',color:'#6495ED'},
      {n:'OOH & Print',pct:5,budget:'—',note:'Plate change outdoor, Oldham launch OOH, local press.',color:'#87CEEB'},
    ],
    kpis:[
      {l:'New car units (all 5 sites)',t:'2,400 units',p:71,o:'Sales + HoBs'},
      {l:'EV/PHEV % of new sales',t:'35% mix',p:35,o:'Sales + Marketing'},
      {l:'Digital leads per month',t:'380 total',p:60,o:'Digital team'},
      {l:'Oldham site leads (new)',t:'80/month',p:30,o:'Oldham HoB'},
      {l:'Service retention',t:'68%+',p:55,o:'Aftersales mgrs'},
      {l:'Approved Used units',t:'—',p:0,o:'Used car mgrs'},
      {l:'Cost per lead',t:'< £26',p:70,o:'Digital team'},
    ],
    aiPrompts:[
      {icon:'✍️',cat:'Content',text:'Write a creative brief for the Swansway VW ID.3 summer campaign targeting EV-curious buyers across Chester, Crewe and Preston'},
      {icon:'📅',cat:'Planning',text:'Build a launch marketing plan for the newly opened Oldham VW dealership — how to build awareness quickly in Greater Manchester'},
      {icon:'📧',cat:'CRM',text:'Write a 5-email upgrade sequence for Swansway VW targeting Golf Mk7 owners whose finance is ending in the next 6 months'},
      {icon:'💰',cat:'Finance',text:'Write Google PPC and landing page copy for Swansway VW promoting family PCP deals on the Tiguan Allspace 7-seater'},
      {icon:'🎯',cat:'Strategy',text:'How should Swansway VW compete with online-only retailers like Cazoo for approved used Golf and Tiguan buyers?'},
    ]
  },

  {
    id:'vwcv', name:'VW Commercial Vehicles', color:'#1B4F72', segment:'Commercial',
    sites:5, sitenames:'Wrexham · Liverpool · Lancashire · Birmingham · Oldham',
    budget:'—', newTarget:'600 units', evTarget:'20%', q2:'Transporter T7 launch + fleet drive days',
    progress:60,
    tags:['Transporter T7','ID. Buzz','Fleet/SME','Trade press','Van Show'],
    pillars:[
      {n:'01',t:'Transporter T7 Launch',d:'The new T7 Transporter is the centrepiece of 2026. Full launch campaign — trade press, LinkedIn, events. Target conversion of existing T6/T6.1 owners. Fleet and crew van variants for different business audiences.'},
      {n:'02',t:'Fleet & SME B2B',d:'VW CV is a B2B-first brand. LinkedIn outreach to fleet managers, tradespeople and small business owners. Chamber of Commerce partnerships near Oldham and Preston. Direct mail to businesses with 5+ vehicles.'},
      {n:'03',t:'ID. Buzz & Electric Vans',d:'ID. Buzz is a cultural moment — leverage the iconic design for awareness campaigns. ID.4 Cargo for last-mile delivery fleets. BIK savings and ULEV incentives are key selling points for business buyers.'},
      {n:'04',t:'Trade Partnerships',d:'Plumber, builder, electrician — target by trade. Partnerships with Travis Perkins, Screwfix and local trade bodies. Rack-and-bin configurations, ply lining, tow bar — aftersales accessories are high margin.'},
    ],
    centres:[
      {name:'VW Van Centre Oldham',flag:'',flagship:false,area:'Greater Manchester — M60, co-located with Oldham VW',desc:'State-of-the-art custom-built van centre. Large urban catchment with significant trade and SME population. Cross-sell to Oldham VW car site.',tags:['t-blue','t-green'],tagLabels:['Trade SME','ID. Buzz'],channel:'LinkedIn + trade press',hero:'Transporter T7 trade launch event'},
      {name:'VW Van Centre Preston',flag:'FLEET HQ',flagship:true,area:'Lancashire — M6/M55, fleet facility nearby',desc:'Established van centre with fleet capability. Lancashire trade market. Proximity to Preston Audi and VW car for cross-brand fleet package.',tags:['t-blue','t-amber'],tagLabels:['Fleet accounts','T7 launch'],channel:'Direct mail + LinkedIn',hero:'Lancashire fleet drive day'},
    ],
    campaigns:[
      {name:'Transporter T7 Launch',timing:'Q1–Q2',obj:'T7 awareness and conquest T6 owners',channels:'Trade press · LinkedIn · Events · Email',offer:'T6 PX bonus + T7 fleet deposit contribution',kpi:'T7 enquiries, T6 conquest units'},
      {name:'Fleet Drive Day',timing:'May & Sep',obj:'SME fleet conversion',channels:'LinkedIn · Direct mail · Events',offer:'Full day van trials, finance on-site',kpi:'Fleet attendees, fleet units within 90 days'},
      {name:'ID. Buzz Lifestyle Push',timing:'Spring–Summer',obj:'Awareness, conquest lifestyle/family',channels:'Instagram · YouTube · Meta · OOH',offer:'Weekend adventure lifestyle creative',kpi:'ID. Buzz enquiries, brand awareness'},
      {name:'Trade Partner Campaign',timing:'All year',obj:'Trade retention and conquest',channels:'Trade press · LinkedIn · Direct mail',offer:'Trade accessories bundle, ply lining promo',kpi:'Trade enquiries, accessories revenue'},
    ],
    audiences:[
      {t:'Tradespeople & Self-Employed',d:'Plumbers, builders, electricians, electricians. Need reliability, payload and low running costs.<br><br><strong>Models:</strong> Transporter, Caddy, Crafter<br><strong>Message:</strong> "Built for the job. Built for business."<br><strong>Channels:</strong> Trade press, Facebook, radio<br><strong>Hook:</strong> Accessories bundle, 5yr warranty'},
      {t:'SME Fleet Managers (5–50 vehicles)',d:'Logistics, service companies, contractors. Need TCO certainty, funding flexibility and account management.<br><br><strong>Models:</strong> T7 fleet, Crafter, ID. Cargo<br><strong>Message:</strong> "Your fleet. Our priority."<br><strong>Channels:</strong> LinkedIn, direct mail, fleet events<br><strong>Hook:</strong> Fleet PCP, dedicated account mgr'},
      {t:'Lifestyle & Family (ID. Buzz)',d:'Premium campervan and family adventure market. Design-conscious, EV-open, Instagrammable.<br><br><strong>Models:</strong> ID. Buzz (5 & 7 seat)<br><strong>Message:</strong> "The adventure starts here"<br><strong>Channels:</strong> Instagram, YouTube, lifestyle press<br><strong>Hook:</strong> Weekend test drive, heritage storytelling'},
      {t:'Last-Mile Delivery Fleets',d:'E-commerce logistics, couriers, local delivery businesses going electric.<br><br><strong>Models:</strong> ID. Buzz Cargo, e-Crafter<br><strong>Message:</strong> "Zero emissions. Zero compromise."<br><strong>Channels:</strong> LinkedIn, direct fleet contact, events<br><strong>Hook:</strong> ULEV grant, charge infrastructure support'},
    ],
    channels:[
      {n:'LinkedIn & B2B Digital',pct:30,budget:'—',note:'Primary B2B channel. Fleet managers, SME owners, trade buyers. Content and paid ads.',color:'#1B4F72'},
      {n:'Trade Press & Direct Mail',pct:22,budget:'—',note:'Commercial Motor, Van Fleet World, Tradepoint. Direct mail to local businesses 5+ vans.',color:'#2E74B5'},
      {n:'Manufacturer Co-op (VW CV UK)',pct:18,budget:'—',note:'Strong T7 launch co-op funding available — submit creative for approval immediately.',color:'#3498DB'},
      {n:'Events & Drive Days',pct:15,budget:'—',note:'Fleet drive days at Preston (May & Sep). Van Show presence. Trade open days.',color:'#5DADE2'},
      {n:'Social (Facebook/Instagram)',pct:10,budget:'—',note:'ID. Buzz lifestyle content, trade-focused Facebook. Oldham launch social.',color:'#85C1E9'},
      {n:'SEO & Google',pct:5,budget:'—',note:'Van search terms — "Transporter for sale Preston", "VW van dealer Manchester".',color:'#AED6F1'},
    ],
    kpis:[
      {l:'New van units (both sites)',t:'600 units',p:60,o:'HoBs + Sales'},
      {l:'Fleet accounts active',t:'40 accounts',p:45,o:'Fleet team'},
      {l:'T7 Transporter units',t:'250 units',p:30,o:'Sales'},
      {l:'ID. Buzz / EV units',t:'80 units (20%)',p:25,o:'Sales + Mktg'},
      {l:'Accessories revenue',t:'—',p:55,o:'Aftersales'},
      {l:'LinkedIn followers growth',t:'+50%',p:40,o:'Group social'},
    ],
    aiPrompts:[
      {icon:'✍️',cat:'Content',text:'Write a LinkedIn B2B campaign for Swansway VW Commercial targeting Lancashire SMEs with 5–20 vans in their fleet for the Transporter T7 launch'},
      {icon:'📅',cat:'Planning',text:'Design a full fleet drive day event plan for VW Van Centre Preston, targeting logistics and trade businesses in Lancashire'},
      {icon:'📧',cat:'CRM',text:'Write a direct mail letter from Swansway VW Commercial to T6 Transporter owners, promoting the T7 upgrade with a part-exchange bonus'},
      {icon:'🎯',cat:'Strategy',text:'How should Swansway position the ID. Buzz against rival MPVs and campervans — what\'s the best creative angle for the North West market?'},
    ]
  },

  {
    id:'seat', name:'SEAT', color:'#E2231A', segment:'Mainstream',
    sites:3, sitenames:'Crewe · Oldham · Bolton Svc',
    budget:'—', newTarget:'1,100 units', evTarget:'25%', q2:'Ibiza summer social push + Leon Cupra-lite crossover',
    progress:58,
    tags:['Ibiza summer','Leon sporty','Young audience','TikTok-first','PCP accessibility'],
    pillars:[
      {n:'01',t:'Youth & Urban First',d:'SEAT\'s primary audience is 22–38. TikTok, Instagram Reels, influencer content. The brand has personality — use it. Ibiza is the hero summer car. Sports-led creative, vibrant colour palette. Fun, relatable, not corporate.'},
      {n:'02',t:'Finance Accessibility',d:'Lower barrier to entry than premium brands. £199/mo PCP messaging. Student finance (SEAT has dedicated student scheme). Graduate first car campaigns. Direct comparison to used car prices to show new car is achievable.'},
      {n:'03',t:'Ibiza & Leon Volume',d:'Ibiza is the summer car — plate change push critical. Leon Cupra-lite positioning (sporty but sensible finance). FR variants drive showroom traffic. Urban lifestyle creative resonates with the Chester and Crewe catchments.'},
      {n:'04',t:'EV Bridge — Mii electric & PHEV',d:'SEAT\'s EV range is limited but growing. Promote PHEV Tarraco and Leon PHEV as the gateway. Position as "start your EV journey here". Dovetail with CUPRA Born at same site where applicable.'},
    ],
    centres:[
      {name:'Chester SEAT',flag:'',flagship:false,area:'Cheshire West — Chester city centre',desc:'Urban city-centre location. Young professional and student catchment. Co-located near Chester VW. Ibiza and Leon are volume drivers. Great for lifestyle content.',tags:['t-red','t-orange'],tagLabels:['Ibiza urban','Young buyers'],channel:'Instagram + TikTok',hero:'Ibiza "Chester Summer" social campaign'},
      {name:'Crewe SEAT',flag:'CUPRA CO-SITE',flagship:true,area:'Cheshire — with CUPRA Crewe on-site',desc:'CUPRA launched within the Crewe SEAT retailer. Cross-brand upsell opportunity — SEAT to CUPRA upgrade path. Local Crewe community strong loyalty base.',tags:['t-red','t-purple'],tagLabels:['CUPRA crossover','Loyalty'],channel:'Social + CRM',hero:'SEAT-to-CUPRA upgrade campaign'},
      {name:'Stafford SEAT',flag:'',flagship:false,area:'Staffordshire — M6 J13',desc:'Midlands gateway. Mixed audience — young commuters and families. Tarraco SUV angle. Proximity to Stafford Audi for aspirational upsell messaging.',tags:['t-red','t-green'],tagLabels:['Tarraco family','PCP deals'],channel:'Google PPC + Facebook',hero:'Tarraco family adventure push'},
    ],
    campaigns:[
      {name:'Ibiza Summer Social',timing:'May–Aug',obj:'Ibiza volume, brand awareness under-35',channels:'TikTok · Instagram · Spotify ads · OOH',offer:'PCP from £199/mo, "summer ready" creative',kpi:'Social reach, Ibiza enquiries, test drives'},
      {name:'Plate Change Push',timing:'Mar & Sep',obj:'Volume across all SEAT models',channels:'Google PPC · Meta · AutoTrader · Radio',offer:'PCP + deposit contribution, 0% options',kpi:'Leads, conversions, plate-change units'},
      {name:'Student Finance Campaign',timing:'Sep–Oct',obj:'First car buyers — graduates',channels:'Instagram · Spotify · University partnerships',offer:'SEAT Student Finance, free MOT first year',kpi:'Student enquiries and conversions'},
      {name:'SEAT to CUPRA Upgrade',timing:'All year (Crewe)',obj:'Upsell loyal SEAT owners to CUPRA',channels:'CRM email · Showroom · Social',offer:'CUPRA Born test drive from SEAT service visit',kpi:'CUPRA enquiries from SEAT database'},
    ],
    audiences:[
      {t:'Young Urbanites (22–34)',d:'First or second car. Motivated by design, personality, connectivity and monthly payment.<br><br><strong>Models:</strong> Ibiza, Leon, Arona<br><strong>Message:</strong> "Move to your own beat"<br><strong>Channels:</strong> TikTok, Instagram, Spotify, YouTube<br><strong>Hook:</strong> £199/mo PCP, personalisation options'},
      {t:'Sporty Drivers (26–42)',d:'Want performance looks without RS prices. Leon FR, Cupra-lite positioning.<br><br><strong>Models:</strong> Leon FR, Ibiza FR, Formentor<br><strong>Message:</strong> "Style that moves"<br><strong>Channels:</strong> Instagram, YouTube, car enthusiast sites<br><strong>Hook:</strong> FR spec for price of standard, finance deal'},
      {t:'Growing Families (30–45)',d:'Tarraco 7-seater, Ateca SUV. Space, safety, value.<br><br><strong>Models:</strong> Tarraco, Ateca, Leon Estate<br><strong>Message:</strong> "More car. More life."<br><strong>Channels:</strong> Facebook, Mumsnet, Google<br><strong>Hook:</strong> 7-seater PCP, school holiday timing'},
      {t:'Students & Graduates',d:'First new car. Finance-first. SEAT has one of the best student schemes in the market.<br><br><strong>Models:</strong> Ibiza, Mii<br><strong>Message:</strong> "Your first. Their best."<br><strong>Channels:</strong> University partnerships, Instagram, Spotify<br><strong>Hook:</strong> SEAT Student Finance, free first service'},
    ],
    channels:[
      {n:'Social (TikTok/Instagram/Meta)',pct:35,budget:'—',note:'SEAT\'s primary channel. TikTok-first for under-30s. Reels and influencer content.',color:'#E2231A'},
      {n:'PPC & Google',pct:25,budget:'—',note:'Model search terms, AutoTrader. Ibiza and Leon brand terms.',color:'#FF4444'},
      {n:'Manufacturer Co-op (SEAT UK)',pct:15,budget:'—',note:'Plate change and model launch co-op. Student scheme funded by SEAT UK.',color:'#FF6B6B'},
      {n:'CRM & Email',pct:12,budget:'—',note:'Owner lifecycle. SEAT-to-CUPRA upgrade sequence for Crewe site.',color:'#CD5C5C'},
      {n:'Events & Showroom',pct:8,budget:'—',note:'Summer Ibiza events, student freshers initiatives.',color:'#FA8072'},
      {n:'OOH & Spotify',pct:5,budget:'—',note:'Plate-change outdoor and Spotify audio ads targeting under-35s.',color:'#FFA07A'},
    ],
    kpis:[
      {l:'New car units (all 3 sites)',t:'1,100 units',p:58,o:'Sales + HoBs'},
      {l:'Ibiza units (summer peak)',t:'350 units Q2/Q3',p:48,o:'Sales'},
      {l:'Under-35 lead share',t:'55% of all leads',p:50,o:'Digital team'},
      {l:'TikTok follower growth',t:'+5,000',p:35,o:'Group social'},
      {l:'Student finance conversions',t:'60 units',p:30,o:'Sales + Finance'},
      {l:'SEAT-to-CUPRA upgrades',t:'40 units (Crewe)',p:25,o:'Crewe HoB'},
    ],
    aiPrompts:[
      {icon:'📱',cat:'Social',text:'Write 5 TikTok video concepts for Swansway SEAT promoting the Ibiza to under-30s in Chester and Crewe — fun, relatable, not corporate'},
      {icon:'📧',cat:'CRM',text:'Write a SEAT-to-CUPRA upgrade email sequence for Swansway Crewe SEAT owners who bought 2–3 years ago'},
      {icon:'🎓',cat:'Campaign',text:'Design a student finance campaign for Swansway SEAT targeting UCLan and Keele University freshers for September 2026'},
      {icon:'🎯',cat:'Strategy',text:'How should Swansway SEAT position the Ibiza against the Vauxhall Corsa and Ford Fiesta in the North West market?'},
    ]
  },

  {
    id:'cupra', name:'CUPRA', color:'#C8920A', segment:'Performance EV',
    sites:3, sitenames:'Crewe · Oldham · Bolton Svc',
    budget:'—', newTarget:'400 units', evTarget:'60%', q2:'Born EV summer campaign + padel tennis series Crewe',
    progress:69,
    tags:['Born EV','Padel tennis','Formentor','Influencer','Urban performance'],
    pillars:[
      {n:'01',t:'Born EV Leadership',d:'CUPRA Born is the hero model — the brand\'s EV statement car. Education campaigns on real-world range, charging speed and driving experience. Conquest from BMW 1 Series, Mini Electric and VW ID.3 buyers. Born test drive events are essential.'},
      {n:'02',t:'Padel Tennis & Lifestyle Sponsorship',d:'CUPRA Crewe\'s padel tennis partnership is a genuine differentiator. Extend this — corporate padel events, social media content, CUPRA branded courts. The padel audience (30–50, affluent, active) is CUPRA\'s exact buyer.'},
      {n:'03',t:'Influencer & Content-Led',d:'CUPRA is the most influencer-friendly brand in the portfolio. Partner with local lifestyle, fitness and car content creators. Instagram Reels and YouTube shorts. Performance reviews, city driving content, weekend escape stories.'},
      {n:'04',t:'Formentor & Ateca Performance',d:'For buyers not yet ready to go electric. Formentor is the design hero — sporty SUV with attitude. Content-led sales approach. VZ performance versions drive showroom traffic and create halo effect for the whole range.'},
    ],
    centres:[
      {name:'CUPRA Crewe',flag:'FLAGSHIP',flagship:true,area:'Cheshire — within Crewe SEAT retailer',desc:'CUPRA launched within the Crewe SEAT retailer — cross-brand upsell from SEAT is a key strategy. Padel tennis partnership is a local differentiator. Urban Crewe professional audience.',tags:['t-amber','t-purple','t-green'],tagLabels:['Padel tennis','Born EV','SEAT upgrade'],channel:'Instagram + LinkedIn + Events',hero:'CUPRA Born summer campaign + padel series'},
      {name:'CUPRA Stockport',flag:'EXPANDING',flagship:false,area:'Greater Manchester — Wellington Road South',desc:'New or expanding site in Stockport — co-located with Honda and OMODA/JAECOO. Strong Greater Manchester urban catchment. High EV adoption rates in South Manchester.',tags:['t-amber','t-blue'],tagLabels:['Greater Manchester','Urban EV'],channel:'Instagram + Meta paid',hero:'CUPRA Stockport launch awareness'},
    ],
    campaigns:[
      {name:'Born EV Summer Campaign',timing:'May–Aug',obj:'Born conquest, test drives, EV switching',channels:'Instagram · YouTube · Google EV · Events',offer:'Born test drive experience + ZEV grant info',kpi:'Born test drives, EV units % of mix'},
      {name:'Padel Tennis Series',timing:'Apr–Sep',obj:'Brand awareness, lifestyle positioning',channels:'Social · Events · Local press · LinkedIn',offer:'CUPRA branded padel events, test drive tie-in',kpi:'Event attendance, post-event enquiries'},
      {name:'Formentor VZ Halo',timing:'Q2 & Q4',obj:'Performance halo, showroom traffic',channels:'Instagram · YouTube · Enthusiast sites',offer:'VZ performance test drive days',kpi:'Formentor enquiries, showroom visits'},
      {name:'CUPRA Urban Nights',timing:'Monthly (Oct–Mar)',obj:'Community, test drives, evening showroom',channels:'Instagram · Email · Invitation',offer:'Exclusive evening event, VZ test drives',kpi:'Event leads, conversion within 30 days'},
    ],
    audiences:[
      {t:'Urban Performance Enthusiasts (28–44)',d:'Want sporty car with modern design. SEAT upgrade or BMW/Mini conquest. Tech-savvy, Instagram-active.<br><br><strong>Models:</strong> Formentor, Born, Leon CUPRA<br><strong>Message:</strong> "Dare to be different"<br><strong>Channels:</strong> Instagram, YouTube, influencers<br><strong>Hook:</strong> Test drive experience, VZ performance'},
      {t:'EV Early Adopters (25–45)',d:'Ready to go electric, want something cooler than a Tesla Model 3. Brand with attitude.<br><br><strong>Models:</strong> Born (EV), Formentor PHEV<br><strong>Message:</strong> "Electric, with attitude"<br><strong>Channels:</strong> Instagram, Google EV, ZapMap, EV forums<br><strong>Hook:</strong> Born range, V2L, charging speed'},
      {t:'Lifestyle & Sport (Padel audience, 30–50)',d:'Affluent, active, image-conscious. The padel tennis player is the CUPRA buyer.<br><br><strong>Models:</strong> Formentor, Born<br><strong>Message:</strong> "Performance in everything you do"<br><strong>Channels:</strong> Padel venues, Instagram, LinkedIn<br><strong>Hook:</strong> Padel series sponsorship, lifestyle events'},
      {t:'SEAT Owners Ready to Upgrade',d:'Loyal SEAT buyers ready for something more premium. CUPRA as the natural next step.<br><br><strong>Models:</strong> Born, Formentor (from Leon/Ibiza)<br><strong>Message:</strong> "You\'ve outgrown ordinary"<br><strong>Channels:</strong> CRM email (SEAT database), showroom<br><strong>Hook:</strong> SEAT PX bonus, CUPRA test drive from service'},
    ],
    channels:[
      {n:'Social (Instagram/TikTok)',pct:38,budget:'—',note:'CUPRA is social-first. Reels, influencer partnerships, padel content. Highest Instagram engagement of all brands.',color:'#C8920A'},
      {n:'Events & Lifestyle',pct:22,budget:'—',note:'Padel series, Born test drives, CUPRA Urban Nights, Formentor experience days.',color:'#D4A017'},
      {n:'PPC & Google',pct:18,budget:'—',note:'Born EV search terms, Formentor vs competitors, conquest from BMW/Mini.',color:'#E0B030'},
      {n:'Influencer Partnerships',pct:12,budget:'—',note:'3–5 regional lifestyle/car influencers. Instagram Reels and YouTube shorts.',color:'#EBC84A'},
      {n:'CRM (SEAT cross-sell)',pct:7,budget:'—',note:'SEAT owner upgrade emails. Co-ordinated with Crewe SEAT site.',color:'#F5D96D'},
      {n:'OOH & Print',pct:3,budget:'—',note:'Tactical plate-change outdoor near Crewe and Stockport.',color:'#FAE68A'},
    ],
    kpis:[
      {l:'New car units (both sites)',t:'400 units',p:69,o:'HoBs + Sales'},
      {l:'Born EV as % of sales',t:'60% of mix',p:55,o:'Sales + Marketing'},
      {l:'Padel event leads',t:'200/year',p:60,o:'Marketing'},
      {l:'Instagram follower growth',t:'+8,000',p:50,o:'Group social'},
      {l:'SEAT-to-CUPRA upgrades',t:'60 units',p:35,o:'Crewe HoB'},
      {l:'Influencer reach/month',t:'500K impressions',p:45,o:'Group social'},
    ],
    aiPrompts:[
      {icon:'📅',cat:'Planning',text:'Design a full CUPRA padel tennis sponsorship activation plan for Swansway Crewe — events, social content, lead capture, test drives'},
      {icon:'📱',cat:'Social',text:'Write 6 Instagram Reel concepts for CUPRA Crewe promoting the Born EV to urban professionals in Cheshire and Greater Manchester'},
      {icon:'🤝',cat:'Partnerships',text:'Who should Swansway CUPRA partner with as influencers in the North West — what type of creators and what would the brief look like?'},
      {icon:'🎯',cat:'Strategy',text:'How should CUPRA be positioned differently from SEAT in Swansway\'s marketing — what\'s the key brand distinction to communicate?'},
    ]
  },

  {
    id:'landrover', name:'Land Rover', color:'#1D4E1D', segment:'Premium Luxury',
    sites:1, sitenames:'Stafford',
    budget:'—', newTarget:'500 units', evTarget:'40%', q2:'Defender adventure camp + Range Rover lifestyle push',
    progress:65,
    tags:['Defender','Range Rover','Adventure lifestyle','Off-road events','Motability'],
    pillars:[
      {n:'01',t:'Defender Adventure Positioning',d:'Defender is the halo model — adventure lifestyle creative. Off-road experience days, Lake District and Snowdonia campaigns. Target conquest from BMW X5 and Mercedes GLE. Defender 90 is the emotional buy; Defender 110 is the rational upgrade.'},
      {n:'02',t:'Range Rover Ultra-Premium',d:'Range Rover Sport and Velar for the premium lifestyle segment. Business professionals, affluent families. Event-led approach — invitation-only evenings, track access, exclusive preview nights. Average transaction value over £70K.'},
      {n:'03',t:'Electrification Push',d:'Range Rover PHEV and Defender PHEV are now mainstream. Target eco-conscious premium buyers and fleet. BIK savings calculators. Conquest from Volvo XC90 PHEV and BMW X5 45e. ULEV for fleet buyers.'},
      {n:'04',t:'Motability & Approved Used',d:'Land Rover has 8 Motability-eligible models. Chester and Crewe are Motability-approved. Target disability benefit recipients and social workers. Approved Used Defender and Discovery are high-demand — daily pricing discipline on AutoTrader.'},
    ],
    centres:[
      {name:'Chester Land Rover',flag:'',flagship:false,area:'Cheshire West — Chester, NW gateway',desc:'Premium Chester catchment. North Wales affluent area. Discovery and Defender for country lifestyle audience. Chester races and lifestyle event tie-ins.',tags:['t-green','t-amber'],tagLabels:['Defender country','Discovery family'],channel:'Instagram + local lifestyle press',hero:'"Cheshire Life" Discovery/Defender push'},
      {name:'Crewe Land Rover',flag:'FLEET HQ',flagship:true,area:'Cheshire — co-located with group HQ',desc:'Fleet and corporate focus. Proximity to Rolls-Royce/Bentley workforce. Range Rover Sport for executive buyers. Fleet leasing for professional firms.',tags:['t-green','t-blue'],tagLabels:['RR Sport exec','Fleet leasing'],channel:'LinkedIn + CRM events',hero:'Range Rover Sport executive Q2 event'},
    ],
    campaigns:[
      {name:'Defender Adventure Camp',timing:'Jun–Aug',obj:'Defender experience, off-road events',channels:'Instagram · YouTube · Lifestyle press · Events',offer:'Off-road experience day, Snowdonia/Peak District',kpi:'Event attendees, Defender units post-event'},
      {name:'Range Rover Exec Evening',timing:'Mar, Jun, Sep',obj:'RR Sport/Velar conquest premium buyers',channels:'CRM invite · LinkedIn · Local press',offer:'Private evening, champagne, order incentive',kpi:'Attendees, RR Sport orders within 90 days'},
      {name:'PHEV Business Push',timing:'Q2 & Q3',obj:'Fleet and eco-premium buyers',channels:'LinkedIn · Fleet press · Direct mail',offer:'BIK savings calc, ULEV fleet deals',kpi:'PHEV fleet units, BIK savings leads'},
      {name:'Plate Change',timing:'Mar & Sep',obj:'Volume new car sales',channels:'PPC · AutoTrader · Meta · Radio',offer:'PCP from £599/mo, approved used push',kpi:'Units sold, leads per site'},
    ],
    audiences:[
      {t:'Affluent Lifestyle Buyers (40–60)',d:'Country and semi-rural. Defender 110 or Discovery 5 as primary family car. Motivated by image, capability and brand heritage.<br><br><strong>Message:</strong> "Above and beyond"<br><strong>Channels:</strong> Instagram, lifestyle press, events<br><strong>Hook:</strong> Adventure experience, heritage storytelling'},
      {t:'Executive & Business (38–58)',d:'Range Rover Sport or Velar. Company car or personal use. Motivated by status, technology and comfort.<br><br><strong>Message:</strong> "Command every road"<br><strong>Channels:</strong> LinkedIn, CRM, private events<br><strong>Hook:</strong> BIK savings, fleet deposit contribution'},
      {t:'EV Premium Converts (35–55)',d:'Luxury buyers going electric. Conquest from Tesla Model X, Volvo XC90, BMW iX.<br><br><strong>Message:</strong> "Premium. Electric. British."<br><strong>Channels:</strong> Google EV, LinkedIn, events<br><strong>Hook:</strong> PHEV trial, ULEV grant, home charger'},
      {t:'Motability Customers',d:'Eligible benefit recipients. Land Rover has 8 Motability models — significant untapped volume.<br><br><strong>Models:</strong> Discovery Sport, Defender 90<br><strong>Message:</strong> "The adventure everyone deserves"<br><strong>Channels:</strong> Motability.co.uk, OT networks, DWP comms<br><strong>Hook:</strong> Nil advance payment models, direct referral'},
    ],
    channels:[
      {n:'Events & Experiential',pct:28,budget:'—',note:'Land Rover\'s best channel. Defender camps, RR exec evenings, off-road experience days.',color:'#1D4E1D'},
      {n:'PPC & Google',pct:22,budget:'—',note:'Range Rover Sport, Defender and Discovery search terms. High CPC but high value.',color:'#2D6A2D'},
      {n:'Social (Instagram/LinkedIn)',pct:18,budget:'—',note:'Aspirational lifestyle Instagram. LinkedIn for fleet and executive buyers.',color:'#3D8B3D'},
      {n:'Manufacturer Co-op (JLR)',pct:15,budget:'—',note:'JLR co-op available for PHEV models and Defender campaign. Submit compliant creative.',color:'#4CAF50'},
      {n:'CRM & Private Invite',pct:12,budget:'—',note:'Highly personalised. Private event invitations, bespoke order follow-up.',color:'#66BB6A'},
      {n:'OOH & Lifestyle Press',pct:5,budget:'—',note:'Cheshire Life, Chester Chronicle, Cumbria press. Plate-change tactical outdoor.',color:'#81C784'},
    ],
    kpis:[
      {l:'New car units (both sites)',t:'500 units',p:65,o:'HoBs + Sales'},
      {l:'Defender units',t:'200 units',p:60,o:'Sales'},
      {l:'PHEV/EV % of new sales',t:'40% mix',p:38,o:'Sales + Mktg'},
      {l:'Motability units',t:'60 units',p:45,o:'Motability team'},
      {l:'Event-to-order conversion',t:'18% avg',p:55,o:'Marketing'},
      {l:'Average transaction value',t:'£65K+',p:70,o:'Sales'},
    ],
    aiPrompts:[
      {icon:'🏔️',cat:'Event',text:'Plan a Defender Adventure Camp for summer 2026 — location (Snowdonia or Peak District?), format, content, lead capture and follow-up'},
      {icon:'✍️',cat:'Content',text:'Write Instagram Reel concepts for Chester Land Rover targeting affluent Cheshire families with the Discovery 5 and Defender 110'},
      {icon:'🏢',cat:'Fleet',text:'Write a LinkedIn B2B campaign for Crewe Land Rover targeting executives at Rolls-Royce, Bentley and Cheshire professional firms'},
      {icon:'🎯',cat:'Strategy',text:'How should Swansway Land Rover position the Range Rover PHEV against the Tesla Model X and BMW iX for eco-premium buyers?'},
    ]
  },

  {
    id:'jaguar', name:'Jaguar', color:'#1B2631', segment:'Premium Luxury',
    sites:1, sitenames:'Crewe',
    budget:'—', newTarget:'180 units', evTarget:'50%', q2:'Brand relaunch support + EV positioning',
    progress:52,
    tags:['Brand relaunch','EV repositioning','Luxury conquest','Fleet','Approved Used'],
    pillars:[
      {n:'01',t:'Brand Relaunch Support',d:'Jaguar\'s controversial 2024 brand relaunch continues into 2026. Swansway\'s role is to support the national messaging locally — translate the ultra-luxury EV repositioning to real buyers in Crewe and Cheshire. Educate customers on the new Jaguar.'},
      {n:'02',t:'EV & Ultra-Premium Positioning',d:'Jaguar is going all-electric. The new Type 00 concept previews an ultra-premium direction. Position Jaguar as Britain\'s answer to Bentayga and Rolls-Royce — but accessible. Target high net worth individuals in the Cheshire catchment.'},
      {n:'03',t:'Fleet Retention',d:'Jaguar has strong corporate heritage. XE and XF still serve the traditional fleet market. Retain existing fleet accounts through dedicated account management. Transition fleet customers to EV models as they arrive.'},
      {n:'04',t:'Approved Used Stabilisation',d:'While new model range transitions, Approved Used Jaguar is the volume opportunity. XE, XF and F-Pace used at competitive prices. Daily AutoTrader pricing, finance-first messaging, conquest from used BMW 3 Series buyers.'},
    ],
    centres:[
      {name:'Crewe Jaguar',flag:'SINGLE SITE',flagship:true,area:'Cheshire — Swansway HQ town, opened 2017',desc:'Sole Jaguar site in the Swansway network. Opened 2017. Luxury Cheshire catchment — Rolls-Royce/Bentley workforce, professional services. New Jaguar positioning creates both challenge and opportunity.',tags:['t-navy','t-purple','t-green'],tagLabels:['Brand relaunch','EV luxury','Approved Used'],channel:'LinkedIn + Private events + CRM',hero:'New Jaguar EV preview evening 2026'},
    ],
    campaigns:[
      {name:'New Jaguar Brand Launch',timing:'All year',obj:'Awareness, new brand positioning',channels:'LinkedIn · Local press · Private events · Digital',offer:'Exclusive preview events, test drive priority list',kpi:'Brand awareness survey, preview list sign-ups'},
      {name:'Approved Used Push',timing:'All year',obj:'Volume and margin via used cars',channels:'AutoTrader · Google · Meta · CRM',offer:'Approved Used XE/XF/F-Pace from £X',kpi:'Used units sold, margin per unit'},
      {name:'Fleet Retention Campaign',timing:'Q1 & Q3',obj:'Keep existing fleet accounts',channels:'Direct contact · LinkedIn · Events',offer:'Fleet priority order access, dedicated mgr',kpi:'Fleet accounts retained, new fleet enquiries'},
      {name:'Ultra-Premium Conquest',timing:'Q2 & Q4',obj:'HNW conquest from Mercedes/BMW/Bentley',channels:'Private events · LinkedIn · Lifestyle press',offer:'VIP preview, bespoke order experience',kpi:'HNW enquiries, orders, avg transaction'},
    ],
    audiences:[
      {t:'High Net Worth Professionals (45–65)',d:'Cheshire\'s professional services and business owners. Motivated by exclusivity, Britishness and the brand transformation story.<br><br><strong>Message:</strong> "The new Jaguar. For those who lead."<br><strong>Channels:</strong> Private events, LinkedIn, lifestyle press<br><strong>Hook:</strong> First to order, VIP preview access'},
      {t:'Existing Jaguar Fleet Customers',d:'Companies with XE/XF on contract. Need retention before they defect to BMW/Mercedes. Transition to EV with new models.<br><br><strong>Message:</strong> "The Jaguar your company deserves."<br><strong>Channels:</strong> Direct account management, events<br><strong>Hook:</strong> Priority fleet order, transition support'},
      {t:'Approved Used Aspirational Buyers',d:'Want the Jaguar badge at used prices. XE and F-Pace used market is strong.<br><br><strong>Message:</strong> "Approved Jaguar. Unapologetic value."<br><strong>Channels:</strong> AutoTrader, Google, Meta<br><strong>Hook:</strong> Approved Used + finance from £X/mo'},
      {t:'Conquest from German Premium (40–60)',d:'BMW 5 Series, Mercedes E-Class, Audi A6 buyers open to something different.<br><br><strong>Message:</strong> "Why settle for expected?"<br><strong>Channels:</strong> Google conquest terms, LinkedIn, direct mail<br><strong>Hook:</strong> Brand story, test drive comparison'},
    ],
    channels:[
      {n:'Private Events & CRM',pct:30,budget:'—',note:'Jaguar buyers respond to exclusivity. Invitation-only evenings are the highest ROI channel.',color:'#1B2631'},
      {n:'LinkedIn & Digital B2B',pct:25,budget:'—',note:'Fleet and professional conquest. Brand relaunch story — educational content.',color:'#2C3E50'},
      {n:'PPC & AutoTrader',pct:22,budget:'—',note:'Approved Used search terms. XE, XF, F-Pace model and conquest terms.',color:'#3D5166'},
      {n:'Manufacturer Co-op (JLR)',pct:13,budget:'—',note:'JLR co-op for brand relaunch support. Compliant Jaguar brand assets — use them.',color:'#4E647A'},
      {n:'Lifestyle Press & OOH',pct:10,budget:'—',note:'Cheshire Life, Tatler regional. Tactical outdoor near Crewe for awareness.',color:'#5F778D'},
    ],
    kpis:[
      {l:'New car units',t:'180 units',p:52,o:'HoB + Sales'},
      {l:'EV/new model waitlist',t:'50 registrations',p:30,o:'Sales'},
      {l:'Approved Used units',t:'120 units',p:58,o:'Used car mgr'},
      {l:'Fleet accounts retained',t:'15 accounts',p:60,o:'Fleet mgr'},
      {l:'Brand awareness (local NPS)',t:'Improve to 65',p:45,o:'Marketing'},
      {l:'Average transaction value',t:'£55K+',p:55,o:'Sales'},
    ],
    aiPrompts:[
      {icon:'✍️',cat:'Content',text:'Write a Crewe Jaguar brand relaunch email campaign explaining the new Jaguar direction to existing Jaguar customers — reassuring but exciting'},
      {icon:'🎪',cat:'Event',text:'Plan a VIP Jaguar preview evening at Crewe Jaguar for Q2 2026 — targeting HNW Cheshire professionals, format, guest list approach and creative'},
      {icon:'🎯',cat:'Strategy',text:'How should Swansway Jaguar Crewe communicate the brand repositioning to local customers who are confused or put off by the national campaign?'},
      {icon:'📊',cat:'Reporting',text:'What metrics should Swansway track to understand if the Jaguar brand relaunch is working at a local dealership level?'},
    ]
  },

  {
    id:'honda', name:'Honda', color:'#CC0000', segment:'Mainstream Hybrid',
    sites:2, sitenames:'Stockport · Bolton',
    budget:'—', newTarget:'1,400 units', evTarget:'55%', q2:'e:HEV hybrid summer campaign + HR-V push',
    progress:55,
    tags:['e:HEV hybrid','HR-V','CR-V','Motability','Reliability'],
    pillars:[
      {n:'01',t:'e:HEV Hybrid Leadership',d:'Honda\'s e:HEV technology is a genuine differentiator — no plug required, self-charging. Target hybrid-curious buyers switching from Toyota Yaris hybrid. Educational content on how e:HEV works. "Hybrid made simple" messaging for less tech-savvy buyers.'},
      {n:'02',t:'Reliability & Loyalty',d:'Honda\'s loyalty rate is exceptional. Target existing owners for upgrade — CRM is gold. Service plan promotions, Honda Plus extended warranty. Reward loyalty with priority access to new models. Stafford and Blackburn have strong loyal customer bases.'},
      {n:'03',t:'Motability Excellence',d:'Honda has strong Motability offering. CR-V and HR-V are popular Motability models. Train all sales staff on Motability process. Partner with OT networks, disability charities and community groups near each site.'},
      {n:'04',t:'CR-V & HR-V SUV Focus',d:'SUV demand continues. CR-V is Honda\'s volume hero — space, hybrid efficiency, family practicality. HR-V for younger buyers. Conquest from Nissan Qashqai, Kia Sportage. Competitive PCP deals and AutoTrader prominence.'},
    ],
    centres:[
      {name:'Blackburn Honda',flag:'',flagship:false,area:'Lancashire — M65 corridor',desc:'Lancashire families and commuters. Co-located near Blackburn Audi — cross-brand volume opportunity. CR-V and HR-V are strong in this market. Strong Motability potential.',tags:['t-red','t-teal'],tagLabels:['CR-V hybrid','Motability'],channel:'Facebook + Google PPC',hero:'CR-V family hybrid summer push'},
      {name:'Bolton Honda',flag:'',flagship:false,area:'Greater Manchester — M61 corridor',desc:'Large Greater Manchester catchment. Urban and suburban mix. HR-V for younger buyers, CR-V for families. Hybrid education campaign needed in this market.',tags:['t-red','t-blue'],tagLabels:['HR-V urban','e:HEV education'],channel:'Facebook + Instagram',hero:'Honda e:HEV "never plug in" campaign'},
      {name:'Stockport Honda',flag:'CUPRA CO-SITE',flagship:true,area:'Greater Manchester — Wellington Road South',desc:'Co-located with OMODA/JAECOO showroom. South Manchester affluent catchment. Cross-brand opportunity with OMODA for EV-curious buyers. Strong Honda loyalty in Stockport area.',tags:['t-red','t-green'],tagLabels:['Loyalty','Cross-brand EV'],channel:'Google PPC + CRM',hero:'Honda loyalty upgrade + hybrid focus'},
      {name:'Stafford Honda',flag:'',flagship:false,area:'Staffordshire — M6 J13',desc:'Midlands gateway. Proximity to Stafford Audi and SEAT — part of the Stafford cluster. Strong repeat buyer base. CR-V and Jazz for family and older buyer demographics.',tags:['t-red','t-amber'],tagLabels:['Jazz/CR-V','Older buyers'],channel:'Facebook + CRM email',hero:'Jazz "effortless driving" campaign'},
    ],
    campaigns:[
      {name:'e:HEV "Never Plug In" Summer',timing:'May–Aug',obj:'Hybrid conquest, Toyota switchers',channels:'TV/Radio · Meta · Google · YouTube',offer:'e:HEV test drive challenge vs Toyota',kpi:'e:HEV test drives, Toyota conquest units'},
      {name:'Plate Change',timing:'Mar & Sep',obj:'Volume new car sales',channels:'PPC · AutoTrader · Radio · Meta',offer:'PCP from £279/mo, 5yr warranty included',kpi:'Units sold, leads per site'},
      {name:'Motability Summer Drive',timing:'Jun–Sep',obj:'Motability volume, awareness',channels:'Motability.co.uk · Facebook · OT networks',offer:'CR-V and HR-V nil advance payment options',kpi:'Motability enquiries and units'},
      {name:'CR-V Family SUV Push',timing:'All year',obj:'Volume CR-V sales vs Qashqai/Sportage',channels:'Facebook · Google · AutoTrader · Lifestyle',offer:'CR-V vs Qashqai comparison content + deal',kpi:'CR-V enquiries and conquest units'},
    ],
    audiences:[
      {t:'Hybrid-Curious Families (30–50)',d:'Want better fuel economy without the plug-in anxiety. Toyota hybrid switchers welcome.<br><br><strong>Models:</strong> CR-V e:HEV, HR-V, Jazz<br><strong>Message:</strong> "Hybrid. No plug required."<br><strong>Channels:</strong> Facebook, Google, radio<br><strong>Hook:</strong> Free fuel comparison, test drive'},
      {t:'Loyal Honda Owners (40–65)',d:'Multi-repeat buyers. Trust the brand above all else. Want the upgrade, just need the nudge.<br><br><strong>Message:</strong> "Even better than the one you love."<br><strong>Channels:</strong> CRM email, SMS, service visit<br><strong>Hook:</strong> Loyalty PX bonus, priority access'},
      {t:'Motability Customers',d:'All four Honda sites are Motability approved. CR-V and HR-V are eligible models.<br><br><strong>Message:</strong> "Freedom. Reliable. Honda."<br><strong>Channels:</strong> Motability platform, OT networks, Facebook<br><strong>Hook:</strong> Nil advance payment, 5yr warranty'},
      {t:'SUV Upgraders (28–45)',d:'Moving up from Fiesta/Corsa to first SUV. Nissan Qashqai and Kia Sportage conquest opportunity.<br><br><strong>Message:</strong> "Space to live. Efficiency to love."<br><strong>Channels:</strong> Facebook, AutoTrader, comparison sites<br><strong>Hook:</strong> CR-V PCP deal, test drive vs Qashqai'},
    ],
    channels:[
      {n:'Google PPC & AutoTrader',pct:28,budget:'—',note:'Honda model terms. CR-V and HR-V vs Qashqai/Sportage conquest.',color:'#CC0000'},
      {n:'Facebook & Meta',pct:25,budget:'—',note:'Family and hybrid audience. CR-V lifestyle content. Motability Facebook campaigns.',color:'#E63950'},
      {n:'Manufacturer Co-op (Honda UK)',pct:18,budget:'—',note:'Honda UK co-op for e:HEV push. Submit compliant creative templates.',color:'#FF6B6B'},
      {n:'CRM & Email (loyalty)',pct:15,budget:'—',note:'Owner lifecycle — Honda loyalty is the strongest in the portfolio. Nurture and upgrade.',color:'#B22222'},
      {n:'Events & Showroom',pct:9,budget:'—',note:'e:HEV education days, test drive events, Motability roadshows.',color:'#DC143C'},
      {n:'OOH & Local Press',pct:5,budget:'—',note:'Plate-change outdoor near each site, local newspaper Motability feature ads.',color:'#CD5C5C'},
    ],
    kpis:[
      {l:'New car units (all 4 sites)',t:'1,400 units',p:55,o:'HoBs + Sales'},
      {l:'e:HEV/hybrid % of sales',t:'55% mix',p:48,o:'Sales'},
      {l:'Motability units',t:'140 units',p:50,o:'Motability team'},
      {l:'CRM open rate',t:'32% avg',p:60,o:'CRM team'},
      {l:'Loyalty repeat buyer rate',t:'45%',p:62,o:'HoBs'},
      {l:'CR-V units',t:'500 units',p:50,o:'Sales'},
      {l:'Cost per lead',t:'< £28',p:58,o:'Digital team'},
    ],
    aiPrompts:[
      {icon:'✍️',cat:'Content',text:'Write a Honda e:HEV "never plug in" educational content series for Swansway — 4 posts, social and email versions, targeting Toyota hybrid owners'},
      {icon:'📧',cat:'CRM',text:'Write a Honda loyalty upgrade email sequence for Swansway — targeting owners 3 years into their previous Honda finance who are approaching end of contract'},
      {icon:'🏥',cat:'Motability',text:'Design a Motability campaign plan for Swansway Honda across all 4 sites — how to reach eligible customers through the right channels'},
      {icon:'🎯',cat:'Strategy',text:'How should Swansway Honda compete with the Toyota Yaris and RAV4 hybrid in the North West market? What are the key differentiators?'},
    ]
  },

  {
    id:'peugeot', name:'Peugeot', color:'#1B3A6B', segment:'Mainstream EV',
    sites:2, sitenames:'Chester · Crewe',
    budget:'—', newTarget:'—', evTarget:'40%', q2:'E-308 summer lease push + 3008 PHEV launch',
    progress:62,
    tags:['E-208 EV','E-308','3008 PHEV','French design','Lease deals'],
    pillars:[
      {n:'01',t:'EV Leadership at Mainstream Price',d:'E-208 and E-308 are Peugeot\'s EV heroes — real-world range, accessible pricing. "Electric doesn\'t have to be expensive" messaging. Target first-time EV buyers switching from petrol superminis. ZEV grant eligibility messaging.'},
      {n:'02',t:'Design & Style Positioning',d:'Peugeot\'s i-Cockpit interior design is genuinely distinctive. Use it. "French design, every day" — emotional appeal to style-conscious buyers who find VW too conservative. Instagram-friendly car interiors.'},
      {n:'03',t:'PCH Lease for Private & Business',d:'Peugeot\'s PCH (Personal Contract Hire) is a key selling point. "All-inclusive from £XXX/month" messaging. Target renters rather than buyers. Business contract hire for SME fleets. The 208 and 308 are highly leaseable.'},
      {n:'04',t:'3008 & 5008 SUV Volume',d:'New 3008 and 5008 are stunning SUVs — PHEV and EV variants. Family SUV conquest from VW Tiguan and Nissan Qashqai. The design story is a genuine differentiator. Lifestyle photography of the Chester and Cheshire environment.'},
    ],
    centres:[
      {name:'Chester Peugeot',flag:'',flagship:false,area:'Cheshire West — Chester city, NW gateway',desc:'Design-conscious Chester audience. North Wales overspill. E-208 for city commuters, 3008 for families. The French design story resonates in Chester\'s affluent market.',tags:['t-blue','t-green'],tagLabels:['E-208 urban','3008 lifestyle'],channel:'Instagram + Google PPC',hero:'E-208 Chester city campaign'},
      {name:'Crewe Peugeot',flag:'',flagship:false,area:'Cheshire — Swansway HQ town',desc:'Volume Peugeot site. Cross-brand opportunity with Crewe VW and SEAT. 208 and 308 are volume drivers. Fleet contract hire opportunity with local businesses.',tags:['t-blue','t-amber'],tagLabels:['208/308 volume','Fleet lease'],channel:'PPC + Facebook',hero:'3008 PHEV launch event Crewe'},
      {name:'Stockport Peugeot',flag:'',flagship:false,area:'Greater Manchester — South Manchester',desc:'Strong South Manchester EV market. Affluent Stockport and Didsbury catchment. E-308 and E-3008 are well-suited to the progressive South Manchester buyer.',tags:['t-blue','t-purple'],tagLabels:['E-3008 EV','Progressive buyers'],channel:'Instagram + Meta',hero:'E-3008 South Manchester launch push'},
    ],
    campaigns:[
      {name:'E-208 "Every Day Electric"',timing:'All year',obj:'EV volume, conquest first-time EV buyers',channels:'Google · Meta · YouTube · OOH',offer:'E-208 PCH from £299/mo all-inclusive',kpi:'E-208 enquiries, EV test drives'},
      {name:'3008 PHEV Launch',timing:'Q2',obj:'3008 conquest, SUV segment',channels:'Instagram · YouTube · Events · AutoTrader',offer:'3008 PHEV weekend test drive',kpi:'3008 enquiries, PHEV conquest units'},
      {name:'E-308 Summer Lease',timing:'Apr–Jun',obj:'PCH/leasing volume in Q2',channels:'Google · Lease comparison sites · Social',offer:'E-308 PCH from £XXX all-inclusive',kpi:'PCH enquiries and contracts signed'},
      {name:'Plate Change',timing:'Mar & Sep',obj:'Volume across all Peugeot models',channels:'PPC · AutoTrader · Radio · Meta',offer:'PCP from £229/mo, 0% APR options',kpi:'Units sold, leads per site'},
    ],
    audiences:[
      {t:'Style-Conscious EV Buyers (28–45)',d:'Want to go electric and want to look good doing it. Design matters.<br><br><strong>Models:</strong> E-208, E-308, E-3008<br><strong>Message:</strong> "Beautiful. Electric. Affordable."<br><strong>Channels:</strong> Instagram, Google, EV comparison sites<br><strong>Hook:</strong> PCH from £XXX/mo, ZEV grant'},
      {t:'PCH & Leasing Preference Buyers',d:'Don\'t want to own — want a low monthly payment and flexibility. Business and private.<br><br><strong>Message:</strong> "All the car. None of the ownership."<br><strong>Channels:</strong> Lease comparison sites, Google, direct<br><strong>Hook:</strong> All-inclusive monthly, no deposit'},
      {t:'Family SUV Buyers (30–48)',d:'3008 and 5008 conquest from Tiguan and Qashqai. Space, practicality and the French design edge.<br><br><strong>Message:</strong> "The SUV that makes you look twice."<br><strong>Channels:</strong> Facebook, AutoTrader, lifestyle press<br><strong>Hook:</strong> 3008 PHEV 50-mile electric range'},
      {t:'First-Time New Car Buyers',d:'208 as entry point. Conquest from used car market. Finance accessibility messaging.<br><br><strong>Models:</strong> 208, 2008<br><strong>Message:</strong> "Your first new car. Make it count."<br><strong>Channels:</strong> TikTok, Instagram, Google PPC<br><strong>Hook:</strong> 208 PCP from £XXX/mo'},
    ],
    channels:[
      {n:'Google PPC & AutoTrader',pct:27,budget:'—',note:'E-208, 3008, 208 model terms. Lease comparison site presence.',color:'#1B3A6B'},
      {n:'Social (Meta/Instagram)',pct:22,budget:'—',note:'Design-led Instagram content. 3008 lifestyle photography. E-208 urban EV.',color:'#2C4F8A'},
      {n:'Manufacturer Co-op (Stellantis/Peugeot UK)',pct:18,budget:'—',note:'Stellantis pushes EV hard — co-op available for E-208/E-308. Submit compliant creative.',color:'#3D64A9'},
      {n:'Lease Comparison Sites',pct:15,budget:'—',note:'LeasingOptions, CarWow, AutoTrader leasing. E-308 PCH must feature prominently.',color:'#4E79C8'},
      {n:'CRM & Email',pct:10,budget:'—',note:'Upgrade triggers for 208/308 owners. PCH renewal campaigns.',color:'#5F8ED7'},
      {n:'Events & OOH',pct:8,budget:'—',note:'3008 PHEV launch events, plate-change outdoor.',color:'#7AA3E6'},
    ],
    kpis:[
      {l:'New car units',t:'—',p:0,o:'HoBs + Sales'},
      {l:'EV/PHEV % of new sales',t:'40% mix',p:40,o:'Sales + Mktg'},
      {l:'PCH/lease as % of sales',t:'35%',p:50,o:'Sales + Finance'},
      {l:'E-208 units',t:'350 units',p:55,o:'Sales'},
      {l:'3008 units (new model)',t:'250 units',p:38,o:'Sales'},
      {l:'Cost per lead',t:'< £24',p:65,o:'Digital team'},
    ],
    aiPrompts:[
      {icon:'✍️',cat:'Content',text:'Write Instagram content for Swansway Peugeot promoting the E-208 to style-conscious urban buyers in Chester and Stockport — French design angle'},
      {icon:'💰',cat:'Finance',text:'Write a PCH landing page for Swansway Peugeot promoting the E-308 on personal contract hire — all-inclusive pricing, no deposit messaging'},
      {icon:'🎯',cat:'Strategy',text:'How should Swansway Peugeot compete with the Vauxhall Astra Electric and VW ID.3 for EV buyers in the North West?'},
      {icon:'📅',cat:'Planning',text:'Build a launch campaign plan for the new Peugeot 3008 PHEV across all 3 Swansway Peugeot sites'},
    ]
  },

  {
    id:'byd', name:'BYD', color:'#0066CC', segment:'EV-Led',
    sites:3, sitenames:'Crewe · Chester · Stoke',
    budget:'—', newTarget:'500 units', evTarget:'100%', q2:'BYD Seal awareness push + EV education campaign',
    progress:45,
    tags:['Seal EV','Atto 3','EV education','World #1 EV','Conquest Tesla'],
    pillars:[
      {n:'01',t:'EV Education First',d:'BYD is still relatively unknown in the UK. Education must come before conversion. "World\'s #1 EV maker" is a powerful but underused claim. Explain the technology (Blade Battery), the range and the value vs Tesla and BMW i-series.'},
      {n:'02',t:'Brand Awareness Build',d:'BYD needs brand awareness investment before volume expectations can be met. Outdoor, local press, social — the Swansway network makes BYD credible. "Trust us — we chose BYD" brand endorsement from the Swansway family.'},
      {n:'03',t:'Test Drive Conversion',d:'The BYD product genuinely surprises buyers who test drive it. The barrier is getting them in the car. Test drive events, home demo programme, co-locate with known brands (Stoke next to VW). Every lead that test drives converts at 3x the rate.'},
      {n:'04',t:'Value vs Tesla Positioning',d:'Atto 3 and Seal at £35K–£45K vs Tesla Model Y at £45K+. The value argument is strong. Comparison content — spec sheet, real-world range, feature for feature. Target Tesla waitlist buyers and used Tesla owners frustrated with service.'},
    ],
    centres:[
      {name:'BYD Cheshire (Site 1)',flag:'',flagship:false,area:'Cheshire — North West',desc:'First Swansway BYD site. Establishing the brand in Cheshire. Test drive programme is key. Cross-brand awareness from nearby Swansway franchises.',tags:['t-blue','t-green'],tagLabels:['EV education','Brand launch'],channel:'Google EV + Facebook',hero:'BYD "See for yourself" test drive event'},
      {name:'BYD Cheshire (Site 2)',flag:'',flagship:false,area:'Cheshire — expanded coverage',desc:'Second Cheshire site showing confidence in BYD. Greater geographic coverage. Atto 3 and Seal volume opportunity. Adjacent to established Swansway brands.',tags:['t-blue','t-teal'],tagLabels:['Volume EV','Seal focus'],channel:'Meta + AutoTrader EV',hero:'BYD Seal summer launch campaign'},
      {name:'BYD Stoke',flag:'LATEST SITE',flagship:true,area:'Stoke-on-Trent — N. Staffordshire',desc:'Third BYD site — Stoke expansion shows real commitment. Staffordshire EV market is growing. Near Stoke Audi and VW — cross-brand traffic opportunity. Large catchment.',tags:['t-blue','t-purple'],tagLabels:['New site','Midlands EV'],channel:'OOH + Facebook + Google',hero:'BYD Stoke launch awareness campaign'},
    ],
    campaigns:[
      {name:'BYD "See For Yourself" Test Drive',timing:'All year',obj:'Test drives — primary conversion mechanism',channels:'Google · Facebook · Events · OOH',offer:'Free home test drive + BIK savings info',kpi:'Test drives completed, post-drive conversion'},
      {name:'Seal Summer Awareness',timing:'May–Aug',obj:'Seal brand and product awareness',channels:'YouTube · Instagram · OOH · Press',offer:'Seal vs Model 3 comparison content',kpi:'Seal brand search uplift, enquiries'},
      {name:'BYD Stoke Launch',timing:'Q1/Q2',obj:'New site awareness — Staffordshire',channels:'Local press · OOH · Facebook · Events',offer:'Launch week incentive, priority test drive',kpi:'Site visits, Stoke catchment leads'},
      {name:'Tesla Conquest Campaign',timing:'Q2–Q3',obj:'Tesla Model 3/Y owners and waitlist',channels:'Google conquest · Reddit · EV forums',offer:'Seal vs Model 3 feature comparison',kpi:'Tesla conquest enquiries and conversions'},
    ],
    audiences:[
      {t:'EV-Ready Tech Buyers (28–45)',d:'Ready to buy EV, researching alternatives to Tesla. Open-minded about Chinese brands if the spec and value stack up.<br><br><strong>Models:</strong> Seal, Atto 3, Tang<br><strong>Message:</strong> "The world\'s #1 EV maker. Now here."<br><strong>Channels:</strong> Google EV, YouTube, EV forums<br><strong>Hook:</strong> Seal vs Model 3 comparison'},
      {t:'Tesla Waitlist & Frustrated Tesla Owners',d:'Long Tesla delivery waits or service frustration. Seal is a direct Model 3 competitor at better value.<br><br><strong>Message:</strong> "Better spec. Better price. Ready now."<br><strong>Channels:</strong> Reddit r/teslamotors, EV forums, Google conquest<br><strong>Hook:</strong> Side-by-side spec sheet, test drive today'},
      {t:'Green Credential Buyers (30–55)',d:'Sustainability-motivated. Want zero emissions but also want value.<br><br><strong>Models:</strong> Atto 3, Seal<br><strong>Message:</strong> "Electric. Ethical. Affordable."<br><strong>Channels:</strong> Google, lifestyle press, LinkedIn<br><strong>Hook:</strong> Carbon footprint data, green finance'},
      {t:'Fleet EV Converts (B2B)',d:'Companies committing to EV fleet. BYD offers competitive fleet pricing vs Tesla and Volkswagen ID.<br><br><strong>Message:</strong> "Fleet EV. Without the premium price tag."<br><strong>Channels:</strong> LinkedIn, fleet events, direct contact<br><strong>Hook:</strong> BIK savings, fleet PCP, account mgr'},
    ],
    channels:[
      {n:'Google PPC (EV terms)',pct:30,budget:'—',note:'EV search terms, BYD model terms, Tesla conquest terms. High intent traffic.',color:'#0066CC'},
      {n:'Social (Facebook/Instagram)',pct:25,budget:'—',note:'EV education content. Seal reveal video. Atto 3 family content. BYD brand story.',color:'#0080FF'},
      {n:'Events & Test Drive Programme',pct:20,budget:'—',note:'Test drive events are the #1 conversion tool for BYD. Home test drive programme.',color:'#3399FF'},
      {n:'OOH & Local Awareness',pct:15,budget:'—',note:'Build brand visibility near each site. Stoke launch OOH. "BYD is here" awareness.',color:'#66B2FF'},
      {n:'YouTube & Video',pct:7,budget:'—',note:'Seal vs Model 3. Blade Battery explanation. Real owner stories.',color:'#99CCFF'},
      {n:'EV Forums & PR',pct:3,budget:'—',note:'Speakev.com, Reddit, Electrifying.com. Genuine review coverage.',color:'#CCE5FF'},
    ],
    kpis:[
      {l:'New EV units (all 3 sites)',t:'500 units',p:45,o:'HoBs + Sales'},
      {l:'Test drives per month',t:'90 total',p:38,o:'Sales mgrs'},
      {l:'Tesla conquest units',t:'80 units',p:25,o:'Sales'},
      {l:'BYD Stoke leads (new site)',t:'50/month',p:20,o:'Stoke HoB'},
      {l:'Brand awareness (local survey)',t:'50% recognition',p:30,o:'Marketing'},
      {l:'Test drive to sale conversion',t:'25%',p:42,o:'Sales mgrs'},
    ],
    aiPrompts:[
      {icon:'📱',cat:'Social',text:'Write 4 Facebook and Instagram posts for Swansway BYD that educate North West buyers about the BYD Seal vs Tesla Model 3 — honest, informative, not corporate'},
      {icon:'🚗',cat:'Events',text:'Design a BYD test drive event programme for all 3 Swansway BYD sites — including a home test drive service to reduce the barrier for interested buyers'},
      {icon:'🎯',cat:'Strategy',text:'How should Swansway BYD handle customer concerns about buying a Chinese car brand — what are the best responses to the top 5 objections?'},
      {icon:'📅',cat:'Planning',text:'Write a launch marketing plan for BYD Stoke — how to build awareness from scratch in the Staffordshire market in the first 90 days'},
    ]
  },

  {
    id:'omoda', name:'OMODA / JAECOO', color:'#6B21A8', segment:'EV-Led New Brand',
    sites:1, sitenames:'Stockport',
    budget:'—', newTarget:'250 units', evTarget:'55%', q2:'OMODA 7 launch + Jaecoo 5 EV push + grand opening follow-up',
    progress:30,
    tags:['OMODA 7','Jaecoo 5 EV','Brand launch','Grand opening','South Manchester'],
    pillars:[
      {n:'01',t:'Brand Awareness from Scratch',d:'OMODA and JAECOO are brand new to many UK buyers. Awareness is the first job. "You haven\'t heard of us yet — but you will" positioning. Swansway endorsement is critical credibility — "chosen by the team who brought you Audi and Land Rover."'},
      {n:'02',t:'OMODA 7 Launch Campaign',d:'The OMODA 7 joined the lineup from January 2026 (£29,915). This is the sweet-spot model — mid-size SUV, competitive price, strong spec. Full launch campaign: media, social, test drive events. Car of the Year buzz from Jaecoo brand.'},
      {n:'03',t:'Jaecoo Brand of the Year Leverage',d:'Jaecoo was named Brand of the Year in the Carwow Car of the Year Awards 2026. This is a massive third-party endorsement. Use it everywhere — social, paid ads, in-showroom, PR. Third-party credibility is essential for a new brand.'},
      {n:'04',t:'Test Drive Volume',d:'Like BYD — the product sells itself once driven. The barrier is awareness and trust. Get people in the car. Home test drive programme, weekend event days. Partner with OMODA UK\'s growing dealer network momentum.'},
    ],
    centres:[
      {name:'OMODA JAECOO Stockport',flag:'LAUNCH SITE — DEC 2025',flagship:true,area:'Greater Manchester — Wellington Road South, with Honda Stockport',desc:'Opened December 2025. Dual-brand showroom alongside Honda Stockport. South Manchester affluent catchment with high EV adoption. New roles created across sales, aftersales and parts. Strong early momentum with Omoda 5, E5 and Jaecoo models.',tags:['t-purple','t-teal','t-green'],tagLabels:['Grand opening','OMODA 7','Jaecoo EV'],channel:'Social launch + OOH + Google',hero:'Grand opening + OMODA 7 launch campaign'},
    ],
    campaigns:[
      {name:'Grand Opening Follow-Through',timing:'Q1–Q2',obj:'Convert opening awareness to leads',channels:'Social · Google · Local press · OOH',offer:'Post-opening test drive incentive, prize draw',kpi:'Site visits, test drives, lead quality'},
      {name:'OMODA 7 UK Launch',timing:'Jan–Mar',obj:'OMODA 7 awareness and orders',channels:'YouTube · Instagram · AutoTrader · Events',offer:'OMODA 7 from £29,915, PCP from £XXX/mo',kpi:'OMODA 7 orders and enquiries'},
      {name:'Jaecoo "Brand of the Year" Push',timing:'All year',obj:'Leverage award for credibility',channels:'All channels — embed in all creative',offer:'"Award-winning from day one" messaging',kpi:'Jaecoo brand awareness uplift, test drives'},
      {name:'EV Range Education (E5, Jaecoo EV)',timing:'Q2–Q3',obj:'EV model awareness and test drives',channels:'Google EV · Instagram · Events',offer:'E5 and Jaecoo EV weekend test drive events',kpi:'EV test drives, EV units as % of sales'},
    ],
    audiences:[
      {t:'Value SUV Buyers (28–45)',d:'Want a well-specced mid-size SUV at a competitive price. Fed up with paying premium for brand names.<br><br><strong>Models:</strong> OMODA 5, OMODA 7, Jaecoo 7<br><strong>Message:</strong> "The SUV you didn\'t see coming."<br><strong>Channels:</strong> Google, AutoTrader, Facebook<br><strong>Hook:</strong> OMODA 7 from £29,915, full spec sheet'},
      {t:'EV-Curious Switchers (25–42)',d:'Want to go electric but find Tesla/VW prices too high. OMODA E5 and Jaecoo EV offer value EV entry.<br><br><strong>Message:</strong> "Electric. Smart. Affordable."<br><strong>Channels:</strong> Google EV, Instagram, EV forums<br><strong>Hook:</strong> E5 real-world range, price vs VW ID.3'},
      {t:'South Manchester Progressives',d:'Early adopters of new brands. Stockport and Didsbury area — high EV adoption, design-conscious, open to Chinese brands with good reviews.<br><br><strong>Message:</strong> "The car the critics are talking about."<br><strong>Channels:</strong> Instagram, local lifestyle, events<br><strong>Hook:</strong> Jaecoo Brand of the Year award'},
      {t:'Conquest from Korean & Japanese (30–50)',d:'Kia, Hyundai, Nissan SUV buyers. The spec and price comparison is compelling.<br><br><strong>Message:</strong> "More car. Less money. Proven."<br><strong>Channels:</strong> Comparison sites, AutoTrader, Google<br><strong>Hook:</strong> Side-by-side spec vs Sportage/Tucson'},
    ],
    channels:[
      {n:'Social (Instagram/Facebook/TikTok)',pct:32,budget:'—',note:'New brand needs social energy. Launch content, car reveals, test drive invitations.',color:'#6B21A8'},
      {n:'Google PPC & AutoTrader',pct:25,budget:'—',note:'OMODA/JAECOO search terms. SUV value terms. AutoTrader new listing prominence.',color:'#7C3AED'},
      {n:'OOH & Local Press',pct:18,budget:'—',note:'Stockport OOH — build brand visibility near the showroom. Stockport Express, Manchester Evening News.',color:'#8B5CF6'},
      {n:'Events & Test Drive Programme',pct:15,budget:'—',note:'Monthly test drive days. Home test drive service. OMODA 7 launch event.',color:'#A78BFA'},
      {n:'Manufacturer Support (OMODA/Jaecoo UK)',pct:7,budget:'—',note:'Leverage OMODA/JAECOO UK\'s growing momentum and launch co-op funding.',color:'#C4B5FD'},
      {n:'PR & Reviews',pct:3,budget:'—',note:'Invite local motoring journalists. Leverage Jaecoo Brand of the Year for press coverage.',color:'#DDD6FE'},
    ],
    kpis:[
      {l:'New units (Stockport site)',t:'250 units year 1',p:30,o:'HoB + Sales'},
      {l:'OMODA 7 orders',t:'80 units',p:25,o:'Sales'},
      {l:'Jaecoo 5 EV enquiries',t:'60 leads/month',p:20,o:'Sales'},
      {l:'Test drives per month',t:'50',p:25,o:'Sales mgr'},
      {l:'Social followers (combined)',t:'2,000+',p:30,o:'Group social'},
      {l:'Brand awareness (Stockport survey)',t:'40% recognition by Jun',p:20,o:'Marketing'},
    ],
    aiPrompts:[
      {icon:'📣',cat:'Launch',text:'Write a 90-day launch marketing plan for OMODA JAECOO Stockport following the December 2025 opening — how to build awareness quickly in South Manchester'},
      {icon:'🏆',cat:'Content',text:'Write social media and ad content for Swansway leveraging Jaecoo\'s Brand of the Year 2026 award from Carwow — across Instagram, Facebook and Google'},
      {icon:'📱',cat:'Social',text:'Write Instagram Reel ideas for OMODA JAECOO Stockport that address the "but it\'s a Chinese brand" concern head-on in a confident, positive way'},
      {icon:'🎯',cat:'Strategy',text:'How should Swansway position OMODA and JAECOO alongside Honda at the Stockport site — shared marketing or kept separate?'},
    ]
  },

  {
    id:'motormatch', name:'Motor Match', color:'#374151', segment:'Used Car',
    sites:5, sitenames:'Crewe · Stockport · Bolton · Chester · Stoke',
    budget:'—', newTarget:'4,000 used units', evTarget:'15%', q2:'Top Value Dealer maintenance + summer stock push',
    progress:68,
    tags:['Top Value Dealer','AutoTrader','CarGurus','Used EV push','All brands'],
    pillars:[
      {n:'01',t:'AutoTrader Top Value Dealer Status',d:'Motor Match Crewe, Chester, Stockport and Stoke won Top Value Dealer from CarGurus. Maintain this status — it drives organic traffic. Daily pricing discipline is non-negotiable. Every car must be competitively priced within 24 hours of arriving on site.'},
      {n:'02',t:'Used EV Supermarket',d:'Motor Match should become the go-to used EV destination in the North West. Approved used e-trons, ID.3/ID.4, E-208 and BYD used stock. Dedicated used EV section of the Motor Match website and AutoTrader profile.'},
      {n:'03',t:'Finance-First Messaging',d:'Used car finance is the highest margin element. "Any car, from £199/mo" — finance is the primary call to action, not price. Pre-qualified finance with soft search. Part exchange guaranteed valuation tool online.'},
      {n:'04',t:'Digital-First Merchandising',d:'Video walk-arounds of every car. 360-degree photography. All listings on AutoTrader and CarGurus with full pricing history. Response time under 30 minutes. Autotrader Highly Rated status — protect it aggressively.'},
    ],
    centres:[
      {name:'Motor Match Chester',flag:'TOP VALUE',flagship:false,area:'Cheshire West — large used car supermarket',desc:'CarGurus Top Value Dealer winner. Largest Chester used car destination. Multi-brand approved used stock. Strong family car and SUV selection.',tags:['t-slate','t-green'],tagLabels:['Top Value','Family SUVs'],channel:'AutoTrader + CarGurus + Meta',hero:'Chester summer used car push'},
      {name:'Motor Match Crewe',flag:'TOP VALUE',flagship:true,area:'Cheshire — adjacent to group HQ',desc:'Flagship Motor Match. Adjacent to group HQ — best resource and management access. AutoTrader Highly Rated. Used EV stock increasing.',tags:['t-slate','t-blue'],tagLabels:['Used EV','Highly Rated'],channel:'AutoTrader + Google PPC',hero:'Used EV supermarket push'},
      {name:'Motor Match Stockport',flag:'TOP VALUE',flagship:false,area:'Greater Manchester — South Manchester',desc:'CarGurus Top Value Dealer. South Manchester catchment — affluent, digital-savvy buyers. Used premium stock opportunity: Audi, Land Rover, VW.',tags:['t-slate','t-purple'],tagLabels:['Premium used','South Manchester'],channel:'AutoTrader + Meta retargeting',hero:'Premium approved used push'},
      {name:'Motor Match Stoke',flag:'TOP VALUE',flagship:false,area:'Stoke-on-Trent — N. Staffordshire',desc:'CarGurus Top Value Dealer. North Staffordshire used car market. Volume opportunity for mainstream used — VW, Ford, Vauxhall trade-ins from Swansway network.',tags:['t-slate','t-amber'],tagLabels:['Volume used','Trade-in network'],channel:'Facebook + AutoTrader',hero:'Volume used car finance push'},
      {name:'Motor Match Fenton',flag:'NEW SITE',flagship:false,area:'Fenton, Stoke-on-Trent',desc:'Newest Motor Match location — 2024/2025 opening. Building brand awareness in Fenton. Opportunity to target south Stoke catchment.',tags:['t-slate','t-green'],tagLabels:['New site','Local awareness'],channel:'Facebook + OOH local',hero:'Fenton Motor Match awareness build'},
    ],
    campaigns:[
      {name:'Top Value Dealer Promotion',timing:'All year',obj:'Maintain CarGurus status, drive traffic',channels:'AutoTrader · CarGurus · Google · Social',offer:'"Award-winning value" brand messaging',kpi:'CarGurus score, AutoTrader ranking'},
      {name:'Used EV Supermarket',timing:'Q2–Q3',obj:'Used EV volume and awareness',channels:'Google EV used · AutoTrader EV · Social',offer:'Used e-tron from £XXX, used ID.3 from £XXX',kpi:'Used EV units sold, EV lead share'},
      {name:'Summer Stock Push',timing:'Jun–Aug',obj:'Stock velocity in slower summer period',channels:'Meta retargeting · PPC · AutoTrader',offer:'Finance from £199/mo, 0% deposit',kpi:'Units sold, stock turn days'},
      {name:'Part Exchange Campaign',timing:'All year',obj:'Source quality used stock via PX',channels:'Social · Google · Email CRM',offer:'Guaranteed valuation in 60 seconds online',kpi:'PX valuations completed, PX units taken'},
    ],
    audiences:[
      {t:'Value-Conscious Used Car Buyers (24–45)',d:'Researching online, price-comparing across AutoTrader and CarGurus. Motivated by value, condition and convenience.<br><br><strong>Message:</strong> "Top value. No compromise."<br><strong>Channels:</strong> AutoTrader, CarGurus, Google<br><strong>Hook:</strong> Top Value Dealer badge, daily pricing'},
      {t:'Finance-First Buyers',d:'Monthly payment is everything. Don\'t ask the price — ask what the monthly payment is.<br><br><strong>Message:</strong> "Any car. From £199/mo."<br><strong>Channels:</strong> Facebook, Google, AutoTrader<br><strong>Hook:</strong> Soft search pre-qualification, PCP from £XXX'},
      {t:'Used EV Early Adopters',d:'Want to try an EV without new car price. Used e-tron or ID.3 is the sweet spot.<br><br><strong>Message:</strong> "Go electric. Used car price."<br><strong>Channels:</strong> Google EV used, EV forums, AutoTrader EV filter<br><strong>Hook:</strong> Used e-tron from £XX,XXX + warranty'},
      {t:'Part Exchange Motivated',d:'Want to know their car\'s value before committing. Online valuations are the hook.<br><br><strong>Message:</strong> "What\'s your car worth? Find out in 60 seconds."<br><strong>Channels:</strong> Facebook, Google, website pop-up<br><strong>Hook:</strong> Instant online valuation tool'},
    ],
    channels:[
      {n:'AutoTrader (premier listings)',pct:32,budget:'—',note:'AutoTrader is the primary used car channel. Premier listings at all 5 sites. Response time SLA 30 min.',color:'#374151'},
      {n:'CarGurus & Comparison Sites',pct:20,budget:'—',note:'Top Value Dealer status on CarGurus — protect and promote. Cazana, Motors.co.uk.',color:'#4B5563'},
      {n:'Facebook & Meta Retargeting',pct:18,budget:'—',note:'Retarget AutoTrader/website visitors with specific car listings. Finance-first ads.',color:'#6B7280'},
      {n:'Google PPC',pct:15,budget:'—',note:'Used car model terms — "used Audi A3 Chester", "used VW Tiguan Stoke". High intent.',color:'#9CA3AF'},
      {n:'CRM & Email',pct:10,budget:'—',note:'Finance renewal targets, PX reminder campaigns, new stock alerts.',color:'#D1D5DB'},
      {n:'OOH & Local',pct:5,budget:'—',note:'Fenton new site awareness. Local press classified ads.',color:'#E5E7EB'},
    ],
    kpis:[
      {l:'Used car units (all 5 sites)',t:'4,000 units',p:68,o:'Site managers'},
      {l:'CarGurus Top Value Dealer status',t:'All 4 eligible sites',p:80,o:'Pricing team'},
      {l:'AutoTrader Highly Rated',t:'Maintain across all sites',p:75,o:'Response teams'},
      {l:'Stock turn (days on site)',t:'< 45 days avg',p:62,o:'Used car mgrs'},
      {l:'Used EV units',t:'200 units',p:35,o:'Used car mgrs'},
      {l:'Part exchange volume',t:'2,000 PX taken in',p:60,o:'Sales mgrs'},
      {l:'Finance penetration',t:'75% of used sales',p:70,o:'Finance mgrs'},
      {l:'Online response time',t:'< 30 min avg',p:65,o:'All site teams'},
    ],
    aiPrompts:[
      {icon:'📊',cat:'Strategy',text:'How should Motor Match Swansway build a dedicated used EV section on AutoTrader and their website to capture the growing used EV buyer market in the North West?'},
      {icon:'📧',cat:'CRM',text:'Write a part exchange email campaign for Motor Match Swansway targeting owners of 3–5 year old Audi, VW and Honda cars in the network'},
      {icon:'📱',cat:'Social',text:'Write 5 Facebook ad concepts for Motor Match Crewe targeting finance-first used car buyers — "any car from £199/mo" messaging'},
      {icon:'🎯',cat:'Strategy',text:'What should Motor Match do to maintain CarGurus Top Value Dealer status across all sites — what are the key pricing and operational disciplines?'},
    ]
  },
];

/* ══════════════════════════════════════
   GROUP CALENDAR DATA
══════════════════════════════════════ */
const GROUP_CALENDAR = [
  { q:'Q1 — Jan to Mar', events:[
    {brand:'All brands',label:'New Year finance reset — PCP/PCH lead generation across all brands',color:'#374151'},
    {brand:'VW / OMODA',label:'Oldham VW + OMODA Stockport: new site awareness campaigns',color:'#001E5A'},
    {brand:'Audi',label:'Q4 e-tron & Q5 PHEV winter finance push',color:'#CC0000'},
    {brand:'VW Commercial',label:'Transporter T7 trade launch — LinkedIn + trade press',color:'#1B4F72'},
    {brand:'🔴 ALL BRANDS',label:'MARCH PLATE CHANGE — Maximum investment, all channels on',color:'#DC2626'},
  ]},
  { q:'Q2 — Apr to Jun', events:[
    {brand:'Audi',label:'A6 e-tron Avant launch — test drive events all 6 centres',color:'#CC0000'},
    {brand:'Peugeot',label:'E-308 summer lease push — PCH from £XXX all-inclusive',color:'#1B3A6B'},
    {brand:'BYD',label:'Seal awareness campaign — vs Tesla comparison content',color:'#0066CC'},
    {brand:'CUPRA',label:'Born EV summer + padel tennis series Crewe (Apr–Sep)',color:'#C8920A'},
    {brand:'All brands',label:'May fleet month — LinkedIn B2B outreach, fleet drive days',color:'#374151'},
    {brand:'Audi',label:'JUNE: Audi Summer Drive VIP event — all 6 Audi centres',color:'#CC0000'},
    {brand:'Land Rover',label:'Range Rover executive evening — Crewe (Mar, Jun, Sep)',color:'#1D4E1D'},
    {brand:'Honda',label:'e:HEV "Never Plug In" summer campaign launch',color:'#CC0000'},
  ]},
  { q:'Q3 — Jul to Sep', events:[
    {brand:'Land Rover',label:'Defender Adventure Camp — Snowdonia/Peak District',color:'#1D4E1D'},
    {brand:'SEAT',label:'Ibiza summer social blitz — TikTok + Instagram',color:'#E2231A'},
    {brand:'Audi',label:'Carlisle: Lake District SUV lifestyle campaign',color:'#CC0000'},
    {brand:'Motor Match',label:'Summer stock push — finance from £199/mo all sites',color:'#374151'},
    {brand:'OMODA',label:'OMODA 9 preview event — Stockport',color:'#6B21A8'},
    {brand:'All brands',label:'Pre-plate conquest: 3+ year owner upgrade CRM blitz',color:'#374151'},
    {brand:'🔴 ALL BRANDS',label:'SEPTEMBER PLATE CHANGE — Maximum investment, all channels',color:'#DC2626'},
  ]},
  { q:'Q4 — Oct to Dec', events:[
    {brand:'Jaguar',label:'Brand relaunch support — new model preview list, VIP evenings',color:'#1B2631'},
    {brand:'VW Commercial',label:'Fleet year-end tax push — accountant DM, LinkedIn',color:'#1B4F72'},
    {brand:'Audi',label:'RS Experience Day — Stafford flagship (Jun & Oct)',color:'#CC0000'},
    {brand:'All brands',label:'November: Black Friday finance deposit deals across all brands',color:'#374151'},
    {brand:'All brands',label:'December: Year-end clearance + "Start 2027" preview campaigns',color:'#374151'},
    {brand:'CUPRA',label:'CUPRA Urban Nights — monthly Oct–Mar',color:'#C8920A'},
    {brand:'All brands',label:'Service & MOT January reminder CRM across all brands',color:'#374151'},
  ]},
];

/* ══════════════════════════════════════
   GROUP CHANNELS DATA
══════════════════════════════════════ */
var GROUP_CHANNELS = []; // populated from Supabase brand_channels

/* ══════════════════════════════════════
   GROUP KPIs
══════════════════════════════════════ */
const GROUP_KPIS = [
  {l:'Total new car/van units',       t:'--', p:0, o:'--', icon:'', cat:'Volume', unit:'',
   def:'Total new retail and fleet registrations across all brands and sites in 2026.',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
  {l:'EV/PHEV % of new sales',        t:'--', p:0, o:'--', icon:'', cat:'EV Transition', unit:'%',
   def:'Percentage of new car registrations that are pure electric (BEV) or plug-in hybrid (PHEV).',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
  {l:'Digital leads per month',        t:'--', p:0, o:'--', icon:'', cat:'Lead Generation', unit:'',
   def:'Total qualified digital enquiries per month across all brands.',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
  {l:'Lead-to-sale conversion',        t:'--', p:0, o:'--', icon:'', cat:'Sales Effectiveness', unit:'%',
   def:'Percentage of qualified digital leads resulting in a new car sale.',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
  {l:'AutoTrader response time',       t:'--', p:0, o:'--', icon:'', cat:'Digital Performance', unit:'mins',
   def:'Time from AutoTrader lead received to first meaningful response during business hours.',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
  {l:'Service retention rate',         t:'--', p:0, o:'--', icon:'', cat:'Aftersales', unit:'%',
   def:'Percentage of customers returning to a Swansway site for their first and second manufacturer service.',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
  {l:'Approved Used + Motor Match',    t:'--', p:0, o:'--', icon:'', cat:'Used Car', unit:'',
   def:'Total approved used car sales across all franchised sites plus all Motor Match sites.',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
  {l:'Group NPS',                      t:'--', p:0, o:'--', icon:'', cat:'Customer Experience', unit:'',
   def:'Net Promoter Score — % rating 9-10 minus % rating 0-6. Measured post-purchase and post-service.',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
  {l:'Fleet accounts active',          t:'--', p:0, o:'--', icon:'', cat:'Fleet & B2B', unit:'',
   def:'Active business fleet accounts with vehicles on order or delivered in 2026.',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
  {l:'Social media follower growth',   t:'--', p:0, o:'--', icon:'', cat:'Brand & Awareness', unit:'%',
   def:'Combined follower growth across Facebook, Instagram, TikTok and LinkedIn for all Swansway brand accounts.',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
  {l:'Manufacturer co-op utilisation', t:'--', p:0, o:'--', icon:'', cat:'Financial', unit:'%',
   def:'Percentage of available manufacturer co-operative marketing funding claimed and utilised.',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
  {l:'Group blended CPL',              t:'--', p:0, o:'--', icon:'', cat:'Financial Efficiency', unit:'GBP',
   def:'Average cost per qualified digital lead across all brands and paid channels.',
   why:'Set your target in Admin > KPIs.', how:'Set how this is measured in Admin > KPIs.',
   bench:'Set your benchmark in Admin > KPIs.', split:''},
];



/* ══════════════════════════════════════
   RENDERING ENGINE
══════════════════════════════════════ */


// ── SHARED FUNCTIONS ──

function switchView(id, el) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(b=>b.classList.remove('active'));
  // Persist view to URL hash so refresh restores position
  try { history.replaceState(null, '', '#' + id); } catch(e) {}
  const target = document.getElementById('view-'+id);
  if(target) target.classList.add('active');
  if(el) el.classList.add('active');

  const nonBrandViews = ['group','calendar','channels','kpis','brief','campaigns'];
  if(!nonBrandViews.includes(id)) {
    const brand = BRANDS.find(b=>b.id===id);
    if(brand) renderBrand(brand);
  }
  if(id === 'brief') {
    // Only reset to new brief if not loading a specific brief (bbLoadBrief sets _bbLoadingBrief flag)
    if (!window._bbLoadingBrief) bbNewBrief();
  }
  // Auto-load Q-plan, campaigns and KPIs when a brand page opens
  const brandForQplan = BRANDS.find(b=>b.id===id);
  if(brandForQplan) {
    setTimeout(()=>qplanAutoLoad(id, brandForQplan.color), 400);
    setTimeout(function(){ if(typeof renderBrandCampaigns==='function') renderBrandCampaigns(id); }, 100);
    setTimeout(function(){ if(typeof renderBrandKPIs==='function') renderBrandKPIs(id);  }, 150);
    setTimeout(function(){ if(typeof renderBrandSites==='function') renderBrandSites(id); }, 200);
  }
  window.scrollTo({top:0,behavior:'smooth'});
  // View-specific load hooks
  if (id === 'campaigns') { if(typeof cbLoad==='function') cbLoad(); }
  if (id === 'channels')  { 
    if (!Object.keys(BRAND_CHANNELS_DATA).length) {
      // Show loading, then render when data arrives
      var _chEl = document.getElementById('group-channel-list');
      if (_chEl) _chEl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-faint)"><div style="font-size:24px;margin-bottom:8px">⏳</div><div>Loading channel data…</div></div>';
      // Data will arrive via loadBrandChannels callback
    } else {
      updateGroupChannelsFromBrands();
      setTimeout(renderGroupChannels, 100);
    }
  }
  if (id === 'priorities') { spLoad(); }
  navUpdateActive(id);
}


function switchInner(brandId, secId, el) {
  document.querySelectorAll(`#itabs-${brandId} .inner-tab`).forEach(t=>t.classList.remove('active'));
  document.querySelectorAll(`#${brandId}-content .inner-section`).forEach(s=>s.classList.remove('active'));
  el.classList.add('active');
  if(secId === 'campaigns') {
    setTimeout(async function(){
      // Ensure CB_CAMPAIGNS is loaded
      if (!CB_CAMPAIGNS || !CB_CAMPAIGNS.length) {
        var anon = SUPABASE_ANON_KEY, base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
        var rows = await fetch(base+'/campaigns?select=*&order=created_at.desc',{headers:getAuthHeaders()}).then(function(r){return r.json();});
        if (Array.isArray(rows)) CB_CAMPAIGNS = rows;
      }
      // Ensure SB_BRIEFS_CACHE is loaded
      if (!SB_BRIEFS_CACHE || !SB_BRIEFS_CACHE.length) {
        if (typeof loadBriefs === 'function') loadBriefs();
      }
      if(typeof renderBrandCampaigns==='function') renderBrandCampaigns(brandId);
    }, 50);
  }
  if(secId === 'centres')   { setTimeout(function(){ if(typeof renderBrandCentres==='function') renderBrandCentres(brandId); }, 50); }
  if(secId === 'budget') {
    // Clear immediately — prevents flash of stale content
    var _budgetEl = document.getElementById(brandId + '-budget');
    if (_budgetEl) {
      // Keep the static header, clear the dynamic part
      var _existingBar = _budgetEl.querySelector('.sh');
      _budgetEl.innerHTML = '';
      if (_existingBar) _budgetEl.appendChild(_existingBar);
    }
    // Render immediately if data available, else loadBrandChannels will trigger it
    if (BRAND_CHANNELS_DATA && BRAND_CHANNELS_DATA[brandId] && BRAND_CHANNELS_DATA[brandId].length) {
      if (typeof renderBrandChannelMix === 'function') renderBrandChannelMix(brandId);
    }
    // If data not loaded yet, loadBrandChannels callback handles the render
  }
  if(secId === 'sites') { setTimeout(function(){ if(typeof renderBrandSites==='function') renderBrandSites(brandId); }, 50); }
  if(secId === 'kpis') { setTimeout(function(){ if(typeof renderBrandKPIs==='function') renderBrandKPIs(brandId);  }, 50); }
  var sec = document.getElementById(brandId+'-'+secId);
  sec.classList.add('active');
}


function loadAdminConfig() {
  if (!SB) return;
  if (window._adminConfigLoaded) return; // only load once
  window._adminConfigLoaded = true;
  // Admin config is shared — load the most recently saved version
  SB.from('admin_config')
    .select('config')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
    .then(function(r) {
      if (r.error) { console.warn('Admin config load error:', r.error); return; }
      if (r.data && r.data.config) {
        applyAdminConfig(r.data.config);
        console.log('Admin config loaded from Supabase');
      } else {
        console.log('No admin config in Supabase yet — using defaults');
      }
    }).catch(function(e) { console.warn('Admin config exception:', e); });
}


function getAuthHeaders(extra) {
  var token = window.SB_ACCESS_TOKEN || SUPABASE_ANON_KEY;
  var h = {'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token};
  if (extra) Object.assign(h, extra);
  return h;
}


function applyAdminConfig(cfg) {
  if (!cfg) return;
  window._lastAdminCfg = cfg;  // Cache for re-application
  console.log('Applying admin config to hub...');

  // ── 1. UPDATE BRANDS ARRAY (used everywhere in hub) ──────────
  if (cfg.brands && cfg.brands.length) {
    cfg.brands.forEach(function(ab) {
      // Update BRANDS array (hub display)
      var brand = BRANDS.find(function(b) { return b.id === ab.id; });
      if (brand) {
        // Budget comes from site sums if available, otherwise admin config
        if (Object.keys(SITE_BUDGETS).length === 0 && ab.budget) {
          brand.budget = '£' + Math.round(ab.budget / 1000) + 'K';
        }
        if (ab.newUnits)  brand.newTarget = ab.newUnits.toLocaleString() + ' units';
        if (ab.evPct)     brand.evTarget  = ab.evPct + '%';
        if (ab.leads)     brand.leads     = ab.leads;
        if (ab.cpl)       brand.cpl       = ab.cpl;
        if (ab.convRate)  brand.convRate  = ab.convRate;
        if (ab.retention) brand.retention = ab.retention;
        if (ab.usedUnits) brand.usedUnits = ab.usedUnits;
        if (ab.fleetUnits) brand.fleetUnits = ab.fleetUnits;
        if (ab.nps)       brand.nps       = ab.nps;
        if (ab.q2Focus)   brand.q2        = ab.q2Focus;
        if (ab.sitenames) brand.sitenames = ab.sitenames;
      }
      // Update BUDGET_BRANDS array (budget tracker)
      var bb = BUDGET_BRANDS.find(function(b) { return b.id === ab.id; });
      if (bb && ab.budget) bb.annual = ab.budget;
    });

    // Re-render group brand cards with updated data
    if (typeof renderGroupBrandCards === 'function') renderGroupBrandCards();

    // Re-render budget tracker with updated planned figures
    if (typeof renderBudgetTracker === 'function') renderBudgetTracker();
    // Update BRANDS array budget strings from site sums
    updateBrandBudgetsFromSites();

    // Group budget only from site budgets — never from admin config (avoids flash)
    // updateBrandBudgetsFromSites() handles this after loadSiteBudgets()
  }

  // ── 2. UPDATE GROUP METRICS ───────────────────────────────────
  if (cfg.group) {
    var g = cfg.group;
    var evEl = document.getElementById('group-ev-pct');
    if (evEl && g.evPct) evEl.textContent = g.evPct + '%';

    // Update group overview KPI section if it exists
    function setEl(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
    if (g.leads)     setEl('group-leads-target', g.leads.toLocaleString());
    if (g.units)     setEl('group-units-target', g.units.toLocaleString());
    if (g.evSales)   setEl('group-ev-target',    g.evSales + '%');
    if (g.cpl)       setEl('group-cpl-target',   '£' + g.cpl);
    if (g.conv)      setEl('group-conv-target',  g.conv + '%');
    if (g.retention) setEl('group-retention-target', g.retention + '%');
    if (g.nps)       setEl('group-nps-target',   g.nps);
  }

  // ── 3. UPDATE KPIs — admin config KPIs retired; all now from site_kpis + brand_kpis ──
  var ADMIN_ONLY_KPI_LABELS = []; // All KPIs now from site_kpis and brand_kpis
  if (cfg.kpis && cfg.kpis.length) {
    cfg.kpis.forEach(function(ak) {
      if (!ak.label) return;
      if (ADMIN_ONLY_KPI_LABELS.indexOf(ak.label) === -1) return; // ignore everything else
      var gk = GROUP_KPIS.find(function(k) { return k.l === ak.label; });
      if (!gk) return;
      var u = ak.unit || gk.unit || '';
      if (ak.owner && ak.owner !== '--') gk.o = ak.owner;
      var tVal = parseFloat(ak.target);
      var aVal = parseFloat(ak.actual);
      if (!isNaN(tVal) && tVal > 0) {
        if (u === '%')         gk.t = tVal + '%';
        else if (u === 'mins') gk.t = '< ' + tVal + ' min';
        else if (tVal >= 1000) gk.t = tVal.toLocaleString();
        else                   gk.t = String(tVal);
      }
      if (!isNaN(aVal) && aVal > 0) {
        if (u === '%')         gk.a = aVal + '%';
        else if (u === 'mins') gk.a = aVal + ' min';
        else if (aVal >= 1000) gk.a = aVal.toLocaleString();
        else                   gk.a = String(aVal);
        gk.p = (!isNaN(tVal) && tVal > 0) ? (ak.lowerBetter
          ? Math.max(0, Math.round((2 - aVal/tVal)*100))
          : Math.min(100, Math.round(aVal/tVal*100))) : 0;
        gk.lowerBetter = ak.lowerBetter || false;
      }
    });
    if (typeof renderGroupKPIs === 'function') renderGroupKPIs();
  }

// ── 4. UPDATE CHANNELS — disabled, now driven by brand_channels table ──
  // GROUP_CHANNELS is now built by updateGroupChannelsFromBrands() from brand_channels Supabase data

  // ── 5. CAMPAIGN CALENDAR — now fed from Supabase, not admin config ──
  // calLoadFromSupabase() handles this when calendar view opens.

  console.log('Admin config fully applied to hub');
}


function navToggle(id, e) {
  if (e) e.stopPropagation();
  var wrap = document.getElementById(id);
  if (!wrap) return;
  var wasOpen = wrap.classList.contains('open');
  // Close all
  document.querySelectorAll('.nav-dd-wrap.open').forEach(function(w){ w.classList.remove('open'); });
  if (!wasOpen) {
    wrap.classList.add('open');
    setTimeout(function(){
      document.addEventListener('click', navCloseAll, {once:true});
    }, 10);
  }
}


function navCloseAll() {
  document.querySelectorAll('.nav-dd-wrap.open').forEach(function(w){ w.classList.remove('open'); });
}


function navGo(id, el) {
  navCloseAll();
  switchView(id, el);
}


function navBrand(id) {
  navCloseAll();
  switchBrandView(id);
}


function navUpdateActive(viewId) {
  // Remove active from all nav items
  document.querySelectorAll('.nav-dd-item').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.nav-dd-btn').forEach(function(b){ b.classList.remove('has-active'); });
  // Find matching item
  var item = document.querySelector('.nav-dd-item[data-view="' + viewId + '"]');
  if (item) {
    item.classList.add('active');
    // Mark parent dropdown button as has-active
    var wrap = item.closest('.nav-dd-wrap');
    if (wrap) wrap.querySelector('.nav-dd-btn').classList.add('has-active');
  } else {
    // Brand view — mark Intel as has-active
    var intelWrap = document.getElementById('nav-intel');
    if (intelWrap) intelWrap.querySelector('.nav-dd-btn').classList.add('has-active');
  }
}


function closeBrandDropdown(e) {
  const wrap = document.getElementById('brand-dropdown-wrap');
  if(wrap && !wrap.contains(e.target)) {
    const dd = document.getElementById('brand-dropdown');
    if(dd) dd.style.display = 'none';
  }
}


function switchBrandView(id) {
  // Close dropdown
  navCloseAll();
  // Update dropdown button label
  const brand = BRANDS.find(b => b.id === id);
  // brand-dd-active removed with old nav
  // Update nav active state
  navUpdateActive(id);
  // Switch view
  switchView(id, null);
}


function showToast(msg, type) {
  const existing = document.getElementById('sb-toast');
  if(existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'sb-toast';
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999;padding:12px 20px;border-radius:4px;font-size:13px;font-weight:600;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:opacity .3s;background:'+(type==='success'?'#15803D':'#C8102E');
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, 3500);
}


function sbInit() {
  try {
    if(typeof supabase === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      showSignInButton();
      return;
    }
  SB = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      redirectTo: 'https://mk-work-ai.github.io/swansway-marketing-hub/',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
  // onAuthStateChange handles ALL auth events including initial load,
  // Google OAuth redirect, sign out — single source of truth
  SB.auth.onAuthStateChange((_event, session) => {
    console.log('Auth event:', _event, session ? session.user.email : 'no session');
    if(session) {
      sbHandleSession(session);
      if(_event === 'SIGNED_IN') {
        closeAuth();
        history.replaceState(null, '', window.location.pathname);
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'You';
        showToast('✓ Signed in as ' + name, 'success');
      }
    } else if(_event === 'SIGNED_OUT') {
      sbHandleSignOut();
    } else if(_event === 'INITIAL_SESSION') {
      if(!session) showSignInButton();
    }
  });
  } catch(e) { showSignInButton(); }
}


function sbHandleSession(session) {
  SB_USER = session.user;
  window.SB_ACCESS_TOKEN = session.access_token;
  showUserState(SB_USER);
  if(typeof loadBriefs === 'function')         loadBriefs();
  if(typeof loadBudgetActuals === 'function')  loadBudgetActuals();
  if(typeof loadSiteBudgets === 'function')   loadSiteBudgets();
  if(typeof loadSiteKPIs === 'function')      loadSiteKPIs();
  if(typeof loadAutopsies === 'function')      loadAutopsies();
  if(typeof loadCompetitorScans === 'function') loadCompetitorScans();
  if(typeof loadQplanActions === 'function')   loadQplanActions();
  if(typeof loadAdminConfig === 'function')    loadAdminConfig();
  // Refresh save bar if brief is open
  const saveBar = document.getElementById('bb-save-bar');
  const saveBtn = document.getElementById('bb-save-btn');
  if(saveBar && saveBar.style.display !== 'none') {
    if(saveBtn) { saveBtn.textContent = 'Save brief'; saveBtn.style.opacity = '1'; }
  }
  // If save bar is hidden (user signed in after generating brief), show it
  const step6 = document.getElementById('bb-step-6');
  if(step6 && step6.classList.contains('bb-active') && saveBar) {
    if(typeof cbAddBriefButton === 'function') cbAddBriefButton();
    saveBar.style.display = 'block';
    if(saveBtn) saveBtn.textContent = 'Save brief';
  }
}


function sbHandleSignOut() {
  SB_USER = null;
  window.SB_ACCESS_TOKEN = null;
  showSignInButton();
  SB_BRIEFS_CACHE = [];
}


function showSignInButton() {
  const signinBtn = document.getElementById('signin-btn');
  const userPill  = document.getElementById('user-pill');
  const briefsBtn = document.getElementById('briefs-btn');
  if(signinBtn) signinBtn.style.display = 'flex';
  if(userPill)  userPill.style.display  = 'none';
  if(briefsBtn) briefsBtn.style.display = 'none';
}


function showUserState(user) {
  const signinBtn = document.getElementById('signin-btn');
  const userPill  = document.getElementById('user-pill');
  const briefsBtn = document.getElementById('briefs-btn');
  const userName  = document.getElementById('user-name');
  const userAv    = document.getElementById('user-avatar');
  if(signinBtn) signinBtn.style.display = 'none';
  if(userPill)  userPill.style.display  = 'flex';
  if(briefsBtn) briefsBtn.style.display = 'flex';
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  if(userName) userName.textContent = name;
  if(userAv)   userAv.textContent   = name.charAt(0).toUpperCase();
  // Show save bar if on step 6
  const saveBar = document.getElementById('bb-save-bar');
  if(saveBar && document.getElementById('bb-step-6')?.classList.contains('bb-active')) {
    saveBar.style.display = 'block';
  }
}


function handleUserPillClick() {
  if(SB_USER) {
    if(confirm('Sign out of Swansway Marketing Hub?')) {
      SB.auth.signOut();
    }
  } else {
    openAuth();
  }
}


function openAuth() {
  document.getElementById('auth-overlay').classList.add('open');
  document.getElementById('auth-email').focus();
}


function closeAuth() {
  document.getElementById('auth-overlay').classList.remove('open');
}


function switchAuthTab(tab) {
  document.getElementById('auth-tab-in').classList.toggle('active', tab==='in');
  document.getElementById('auth-tab-up').classList.toggle('active', tab==='up');
  document.getElementById('auth-form-in').style.display = tab==='in' ? 'block' : 'none';
  document.getElementById('auth-form-up').style.display = tab==='up' ? 'block' : 'none';
}


function authGoogle() {
  if (!SB) { alert('Supabase not configured'); return; }
  SB.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://mk-work-ai.github.io/swansway-marketing-hub/' } });
}


function showAuthErr(el, msg) {
  el.textContent = msg; el.style.display='block';
}


function getAvatarColor(memberId) {
  if (!memberId) return AVATAR_PALETTE[0];
  // Check if member has an explicit color set
  var member = CB_TEAM[memberId];
  if (member && member.color) return member.color;
  // Deterministic from member ID string
  var hash = 0;
  for (var i = 0; i < memberId.length; i++) {
    hash = ((hash << 5) - hash) + memberId.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}


function makeAvatar(memberId, size) {
  var member = CB_TEAM[memberId] || {name: memberId || '?'};
  var initials = member.name.split(' ').map(function(n){return n[0]||'';}).join('').substring(0,2).toUpperCase();
  var color = getAvatarColor(memberId);
  var sz = size === 'lg' ? 36 : size === 'xl' ? 48 : 26;
  var fs = size === 'lg' ? 13 : size === 'xl' ? 16 : 10;
  return '<div class="sw-avatar" style="width:'+sz+'px;height:'+sz+'px;font-size:'+fs+'px;background:'+color+';border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-family:var(--font-m);font-weight:700;color:#fff;flex-shrink:0" title="'+member.name+'">'+initials+'</div>';
}


function closeBriefsPanel() {
  document.getElementById('briefs-panel').classList.remove('open');
  document.getElementById('panel-overlay').classList.remove('open');
}


function openBriefsPanel() {
  document.getElementById('briefs-panel').classList.add('open');
  document.getElementById('panel-overlay').classList.add('open');
  loadBriefs();
}


async function loadBriefs() {
  if(!SB||!SB_USER) return;
  const listEl = document.getElementById('briefs-list');
  if(!listEl) return;

  const { data, error } = await SB
    .from('briefs')
    .select('*')
    .order('updated_at', { ascending:false });

  if(error) {
    listEl.innerHTML = '<div style="color:var(--accent);font-size:12px;padding:20px">Error loading briefs: '+error.message+'</div>';
    return;
  }

  SB_BRIEFS_CACHE = data || [];
  renderBriefsList();
  renderBriefFilters();
}


function renderBriefFilters() {
  const el = document.getElementById('brief-filters');
  if(!el) return;
  const brands = [...new Set(SB_BRIEFS_CACHE.map(b=>b.brand_id))];
  const brandNames = brands.map(id => {
    const b = SB_BRIEFS_CACHE.find(x=>x.brand_id===id);
    return {id, name:b?.brand_name||id};
  });
  const allActive = SB_ACTIVE_FILTER === 'all' ? 'active' : '';
  let html = `<div class="brief-filter ${allActive}" data-brand="all" onclick="filterBriefs('all',this)">All (${SB_BRIEFS_CACHE.length})</div>`;
  html += brandNames.map(b => {
    const active = SB_ACTIVE_FILTER === b.id ? 'active' : '';
    return `<div class="brief-filter ${active}" data-brand="${b.id}" onclick="filterBriefs('${b.id}',this)">${b.name}</div>`;
  }).join('');
  el.innerHTML = html;
}


function filterBriefs(brandId, el) {
  SB_ACTIVE_FILTER = brandId;
  document.querySelectorAll('.brief-filter').forEach(f=>f.classList.remove('active'));
  if(el) el.classList.add('active');
  renderBriefsList();
}


function renderBriefsList() {
  const listEl = document.getElementById('briefs-list');
  if(!listEl) return;
  const filtered = SB_ACTIVE_FILTER==='all' ? SB_BRIEFS_CACHE
    : SB_BRIEFS_CACHE.filter(b=>b.brand_id===SB_ACTIVE_FILTER);

  if(!filtered.length) {
    listEl.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--ink-soft);font-size:13px">'+
      (SB_BRIEFS_CACHE.length ? 'No briefs for this brand yet.' : 'No saved briefs yet.<br><br>Build a campaign brief and save it to see it here.')+
      '</div>';
    return;
  }

  listEl.innerHTML = filtered.map(brief => {
    const color = brief.brand_color || '#1A2E4A';
    const status = brief.status || 'draft';
    const sStyles = {draft:'background:#FEF3C7;color:#92400E',submitted:'background:#DBEAFE;color:#1E40AF',approved:'background:#D1FAE5;color:#065F46',campaigned:'background:#EDE9FE;color:#5B21B6',final:'background:#F0FDF4;color:#15803D',archived:'background:#F1F5F9;color:#475569'};
    const ss = sStyles[status] || 'background:#F1F5F9;color:#475569';
    const updated = new Date(brief.updated_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let dateStr = '';
    if (brief.start_date && brief.end_date) {
      const sd = new Date(brief.start_date+'T00:00:00'), ed = new Date(brief.end_date+'T00:00:00');
      dateStr = sd.getDate()+' '+MN[sd.getMonth()]+' – '+ed.getDate()+' '+MN[ed.getMonth()];
    }
    const site = brief.site_id ? brief.site_id.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase()) : '';
    const chips = [brief.campaign_type, brief.budget ? '£'+Number(brief.budget).toLocaleString() : '', brief.duration_label||(brief.duration_weeks?brief.duration_weeks+' wks':''), dateStr, site].filter(Boolean).map(t=>`<span style="background:var(--surface);padding:2px 7px;border-radius:4px;font-size:10px;white-space:nowrap">${t}</span>`).join('');
    return `<div class="brief-card" style="--card-color:${color}" onclick="bbLoadBrief('${brief.id}');closeBriefsPanel()">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <div class="brief-card-brand" style="color:${color};margin-bottom:0">${brief.brand_name}</div>
        <span style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.06em;padding:2px 8px;border-radius:10px;flex-shrink:0;${ss}">${status}</span>
      </div>
      <div class="brief-card-title">${brief.title}</div>
      ${chips?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${chips}</div>`:''}
      ${brief.objective?`<div class="brief-card-meta" style="margin-top:5px">${brief.objective}</div>`:''}
      ${brief.proposition?`<div class="brief-card-meta" style="margin-top:4px;font-style:italic">“${brief.proposition.substring(0,70)}${brief.proposition.length>70?'…':''}”</div>`:''}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
        <span style="font-size:10px;color:var(--ink-faint)">Updated ${updated}</span>
        <div class="brief-card-actions" onclick="event.stopPropagation()" style="margin-top:0;padding-top:0;border-top:none">
          <button class="brief-card-btn" onclick="bbLoadBrief('${brief.id}');closeBriefsPanel()">&#8617; Open</button>
          <button class="brief-card-btn" onclick="bbArchiveBrief('${brief.id}')">Archive</button>
          <button class="brief-card-btn danger" onclick="bbDeleteBrief('${brief.id}')">Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}


function loadActiveCampaignsBanner(campaigns, myTasks) {
  var banner = document.getElementById('active-campaigns-banner');
  if (!banner) return;
  if (!campaigns || !campaigns.length) { banner.style.display = 'none'; return; }
  banner.style.display = 'block';
  var me = CB_TEAM[CB_CURRENT_USER] || {};
  var first = me.name ? me.name.split(' ')[0] : '';
  var SN = ['Pre-Production','Production','Pre-Live Approval','Go Live','In-Flight','Close & Review'];
  var html = '<div style="margin-bottom:10px;display:flex;align-items:center;gap:12px">'
    + '<div style="font-family:var(--font-d);font-size:17px;font-weight:700;color:var(--ink)">\uD83D\uDE80 Active Campaigns</div>'
    + (first ? '<div style="font-size:13px;color:var(--ink-soft)">Hi ' + first + '! Here is where things are at</div>' : '')
    + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px" id="sw-camp-grid"></div>';
  banner.innerHTML = html;
  var grid = document.getElementById('sw-camp-grid');
  campaigns.forEach(function(camp) {
    var stage = camp.current_stage || 1;
    var stageName = SN[stage-1] || 'Stage '+stage;
    var campTasks = (myTasks||[]).filter(function(t){return t.campaign_id===camp.id;});
    var card = document.createElement('div');
    card.style.cssText = 'background:var(--white);border:1px solid var(--border);border-radius:8px;padding:16px 18px;cursor:pointer;border-left:4px solid var(--swansway);transition:box-shadow .15s';
    card.innerHTML = '<div style="font-family:var(--font-d);font-size:15px;font-weight:700;color:var(--ink);margin-bottom:6px">'+camp.title+'</div>'
      + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
      + '<span style="font-size:12px;background:#DBEAFE;color:#2563EB;padding:3px 9px;border-radius:8px;font-weight:600">Stage '+stage+': '+stageName+'</span>'
      + (campTasks.length > 0
        ? '<span style="font-size:12px;background:#FEF3C7;color:#92400E;padding:3px 9px;border-radius:8px;font-weight:600">'+campTasks.length+' task'+(campTasks.length!==1?'s':'')+' waiting for you</span>'
        : '<span style="font-size:11px;color:#059669;font-weight:600">\u2713 Your tasks done</span>')
      + '<span style="font-size:11px;color:var(--ink-faint);margin-left:auto">Open \u2192</span>'
      + '</div>';
    card.onmouseenter = function(){this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';};
    card.onmouseleave = function(){this.style.boxShadow='';};
    (function(cid,bid){
      card.onclick = function(){ openCampaignFromBanner(cid, bid); };
    })(camp.id, camp.brief_id||'');
    grid.appendChild(card);
  });
}


async function openCampaignFromBanner(campId, briefId) {
  if (!briefId) return;
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var brief = await fetch(base+'/briefs?id=eq.'+briefId+'&select=*',{
    headers:getAuthHeaders()
  }).then(function(r){return r.json();}).then(function(d){return d[0];});
  if (!brief) return;
  if (!window.SB_BRIEFS_CACHE) window.SB_BRIEFS_CACHE = [];
  if (!SB_BRIEFS_CACHE.find(function(b){return b.id===brief.id;})) SB_BRIEFS_CACHE.push(brief);
  bbLoadBrief(brief.id);
}


async function swEnsureUser() {
  if (CB_CURRENT_USER) return CB_CURRENT_USER;
  if (SW_INIT_PROMISE) return SW_INIT_PROMISE;
  SW_INIT_PROMISE = (async function() {
    var anon = SUPABASE_ANON_KEY;
    var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
    var hdrs = getAuthHeaders();
    try {
      // Load team + perms if needed
      if (!Object.keys(CB_TEAM).length) {
        var results = await Promise.all([
          fetch(base+'/campaign_team?select=*&active=eq.true',{headers:hdrs}).then(function(r){return r.json();}),
          fetch(base+'/campaign_permissions?select=*',{headers:hdrs}).then(function(r){return r.json();})
        ]);
        (Array.isArray(results[0])?results[0]:[]).forEach(function(m){CB_TEAM[m.id]=m;});
        (Array.isArray(results[1])?results[1]:[]).forEach(function(p){CB_PERMS[p.team_member_id]=p;});
      }
      // Get auth email from Supabase session
      var sess = await SB.auth.getSession();
      var email = sess && sess.data && sess.data.session ? sess.data.session.user.email : null;
      if (email) {
        var match = Object.values(CB_TEAM).find(function(m){return m.email&&m.email.toLowerCase()===email.toLowerCase();});
        if (match) {
          CB_CURRENT_USER = match.id;
          // Update user dropdown
          var sel = document.getElementById('cb-user-sel');
          if (sel) sel.value = match.id;
          console.log('swEnsureUser: ' + match.name);
        }
      }
    } catch(e) { console.warn('swEnsureUser error:', e); }
    SW_INIT_PROMISE = null;
    return CB_CURRENT_USER;
  })();
  return SW_INIT_PROMISE;
}


async function loadSiteContacts() {
  try {
    var resp = await fetch(SUPABASE_URL + '/rest/v1/site_contacts?select=*', {
      headers: {
        ...getAuthHeaders({'Content-Type': 'application/json'})
      }
    });
    if (!resp.ok) {
      var err = await resp.text();
      console.warn('loadSiteContacts error:', resp.status, err);
      return;
    }
    var rows = await resp.json();
    rows.forEach(function(row) { SITE_CONTACTS[row.site_id] = row; });
    console.log('Site contacts loaded: ' + rows.length);
    // Re-render dealerships if a brand page is open
    var activeBrand = document.querySelector('.bnav-btn.active');
    if (activeBrand) {
      var bid = activeBrand.dataset.view;
      if (bid && typeof renderBrandCentres === 'function') renderBrandCentres(bid);
    }
  } catch(e) { console.warn('loadSiteContacts error:', e); }
}

// ── DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', function() {
  // Year references
  document.querySelectorAll('.year-ref').forEach(function(el){ el.textContent = PLAN_YEAR; });
  var tyEl = document.getElementById('topbar-year');
  if (tyEl) tyEl.textContent = PLAN_YEAR;

  // Core init
  sbInit();
  loadAdminConfig();

  // After auth resolves, trigger page-specific renders
  setTimeout(function() {
    loadActiveCampaignsBanner();
    if (typeof mtLoad === 'function') mtLoad();

    // Group page renders
    if (document.getElementById('group-brand-grid')) {
      if (typeof renderGroupBrandCards === 'function') renderGroupBrandCards();
      if (typeof renderGroupBudgetChart === 'function') renderGroupBudgetChart();
      if (typeof loadSiteBudgets === 'function') loadSiteBudgets();
      if (typeof loadSiteKPIs === 'function') loadSiteKPIs();
      if (typeof loadBrandChannels === 'function') loadBrandChannels();
      if (typeof spLoad === 'function') spLoad();
      if (typeof calInit === 'function') calInit();
    }
  }, 1500);
});
