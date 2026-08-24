/* ============================================================
   Medi Forecaster — Mock data & forecasting engine (frontend)
   The ML model itself is invisible; this module simulates its
   outputs deterministically so the UI behaves like a real app.
   ============================================================ */
window.MF = window.MF || {};

MF.data = (function(){

  /* Deterministic PRNG so charts look identical every load */
  function mulberry32(seed){
    return function(){
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var TODAY = new Date(); TODAY.setHours(0,0,0,0);

  function addDays(date, n){
    var d = new Date(date); d.setDate(d.getDate() + n); return d;
  }
  function fmtDate(d){
    return d.toLocaleDateString('en-US',{month:'short', day:'numeric'});
  }
  function fmtDateFull(d){
    return d.toLocaleDateString('en-US',{weekday:'short', month:'short', day:'numeric', year:'numeric'});
  }
  function isoDate(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  /* ---------------- Medicines ---------------- */
  var MEDS = [
    { id:'paracetamol-500', name:'Paracetamol', strength:'500 mg', form:'Tablet', category:'Analgesic',
      stock:420, safety:100, avgDaily:85, p7:600, p14:1180, p30:2500, trend:+12,
      supplier:'MedLife Supplies', pack:'Box of 10×10 tablets', shelf:'A2-14' },
    { id:'amoxicillin-500', name:'Amoxicillin', strength:'500 mg', form:'Capsule', category:'Antibiotic',
      stock:180, safety:60, avgDaily:42, p7:300, p14:590, p30:1240, trend:+8,
      supplier:'HealthBridge Pharma', pack:'Box of 100 capsules', shelf:'B1-03' },
    { id:'ibuprofen-400', name:'Ibuprofen', strength:'400 mg', form:'Tablet', category:'Analgesic',
      stock:940, safety:150, avgDaily:72, p7:520, p14:1010, p30:2140, trend:+3,
      supplier:'MedLife Supplies', pack:'Box of 10×10 tablets', shelf:'A3-08' },
    { id:'cetirizine-10', name:'Cetirizine', strength:'10 mg', form:'Tablet', category:'Antihistamine',
      stock:200, safety:50, avgDaily:38, p7:270, p14:520, p30:1080, trend:+15,
      supplier:'NovaCare Labs', pack:'Box of 10×10 tablets', shelf:'C2-11' },
    { id:'omeprazole-20', name:'Omeprazole', strength:'20 mg', form:'Capsule', category:'Antacid',
      stock:1250, safety:120, avgDaily:26, p7:190, p14:380, p30:780, trend:-4,
      supplier:'HealthBridge Pharma', pack:'Box of 14 capsules ×5', shelf:'B2-06' },
    { id:'metformin-850', name:'Metformin', strength:'850 mg', form:'Tablet', category:'Antidiabetic',
      stock:130, safety:80, avgDaily:55, p7:390, p14:760, p30:1600, trend:+6,
      supplier:'CardioPlus Pharma', pack:'Blister strip of 15', shelf:'D1-02' },
    { id:'amlodipine-5', name:'Amlodipine', strength:'5 mg', form:'Tablet', category:'Cardiovascular',
      stock:720, safety:90, avgDaily:44, p7:310, p14:610, p30:1290, trend:+1,
      supplier:'CardioPlus Pharma', pack:'Blister strip of 10', shelf:'D2-09' },
    { id:'azithromycin-250', name:'Azithromycin', strength:'250 mg', form:'Tablet', category:'Antibiotic',
      stock:210, safety:60, avgDaily:36, p7:255, p14:500, p30:1040, trend:+22,
      supplier:'NovaCare Labs', pack:'Blister strip of 6', shelf:'B1-07' },
    { id:'losartan-50', name:'Losartan', strength:'50 mg', form:'Tablet', category:'Cardiovascular',
      stock:860, safety:80, avgDaily:30, p7:210, p14:420, p30:880, trend:-2,
      supplier:'CardioPlus Pharma', pack:'Blister strip of 10', shelf:'D3-04' },
    { id:'salbutamol-inh', name:'Salbutamol Inhaler', strength:'100 mcg', form:'Inhaler', category:'Respiratory',
      stock:96, safety:25, avgDaily:14, p7:98, p14:196, p30:430, trend:+9,
      supplier:'RespoCare Medical', pack:'Metered inhaler, 200 doses', shelf:'E1-01' },
    { id:'vitamin-d3-60k', name:'Vitamin D3', strength:'60,000 IU', form:'Softgel', category:'Supplement',
      stock:640, safety:40, avgDaily:12, p7:86, p14:170, p30:360, trend:-6,
      supplier:'VitaWell Nutrition', pack:'Bottle of 8 softgels', shelf:'F1-05' },
    { id:'ors-sachet', name:'ORS Electrolyte', strength:'Sachet', form:'Powder', category:'Rehydration',
      stock:540, safety:60, avgDaily:48, p7:340, p14:670, p30:1400, trend:+5,
      supplier:'MedLife Supplies', pack:'Box of 20 sachets', shelf:'A1-02' }
  ];

  function medById(id){
    for (var i=0;i<MEDS.length;i++) if (MEDS[i].id === id) return MEDS[i];
    return null;
  }

  /* ---------------- Status classification ---------------- */
  function statusOf(m){
    var cover = m.stock / m.avgDaily;
    if (m.p7 >= m.stock || cover <= 4.5) return { key:'critical', label:'Critical', tone:'red' };
    if (cover <= 10)                     return { key:'low',      label:'Low Stock', tone:'amber' };
    if (m.stock >= m.avgDaily * 45)      return { key:'overstock',label:'Overstock', tone:'blue' };
    return { key:'healthy', label:'Healthy', tone:'green' };
  }
  function daysOfCover(m){ return Math.max(0, Math.round((m.stock / m.avgDaily) * 10) / 10); }

  /* ---------------- Historical daily demand (last N days, deterministic) ---------------- */
  function historyFor(medId, days){
    var m = medById(medId), rnd = mulberry32(hash(medId)), out = [];
    for (var i = days - 1; i >= 0; i--){
      var d = addDays(TODAY, -i);
      var dow = d.getDay();
      var weekly = (dow === 0 || dow === 6) ? 0.78 : 1.04;         // weekend dip
      var wave = 1 + Math.sin((days - i) / 9) * 0.12;               // slow cycle
      var noise = 0.86 + rnd() * 0.28;
      var v = Math.round(m.avgDaily * weekly * wave * noise);
      out.push({ date:d, label:fmtDate(d), value:Math.max(4, v) });
    }
    return out;
  }
  function hash(s){
    var h = 2166136261;
    for (var i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* ---------------- Forecast (simulated AI output) ---------------- */
  function forecastFor(medId, horizonDays){
    var m = medById(medId);
    var hist = historyFor(medId, 21);
    var base = horizonDays === 7 ? m.p7 : horizonDays === 14 ? m.p14 : m.p30;
    var perDay = base / horizonDays;
    var rnd = mulberry32(hash(medId + ':' + horizonDays));
    var days = [], remaining = m.stock, cum = 0;
    for (var i = 1; i <= horizonDays; i++){
      var d = addDays(TODAY, i);
      var dow = d.getDay();
      var seasonal = (dow === 0 || dow === 6) ? 0.82 : 1.05;
      var drift = 1 + (m.trend / 100) * (i / horizonDays) * 0.6;
      var jitter = 0.92 + rnd() * 0.16;
      var expected = Math.max(3, Math.round(perDay * seasonal * drift * jitter));
      cum += expected;
      remaining = m.stock - cum;
      var st;
      if (remaining <= 0)      st = { key:'critical', label:'Runs out', tone:'red' };
      else if (remaining < m.safety * 0.6) st = { key:'critical', label:'Critical', tone:'red' };
      else if (remaining < m.safety) st = { key:'low', label:'Low', tone:'amber' };
      else st = { key:'healthy', label:'Sufficient', tone:'green' };
      days.push({
        date:d, label:fmtDate(d), full:fmtDateFull(d),
        expected:expected,
        cumulative:cum,
        available:Math.max(0, remaining),
        status:st
      });
    }
    var peak = days.reduce(function(a,b){ return b.expected > a.expected ? b : a; }, days[0]);
    return {
      medicine:m, horizon:horizonDays, days:days,
      totalExpected:days.reduce(function(s,d){ return s + d.expected; }, 0),
      avgDaily:Math.round(days.reduce(function(s,d){ return s + d.expected; },0) / horizonDays),
      peak:{ value:peak.expected, dateLabel:peak.full },
      history:hist,
      runOutDay:(function(){
        for (var j=0;j<days.length;j++) if (days[j].available <= 0 || days[j].available < m.safety*0.25) return days[j];
        return null;
      })()
    };
  }

  /* ---------------- Purchase planning rows ---------------- */
  function purchaseRows(horizonDays){
    var key = 'p' + horizonDays;
    return MEDS.map(function(m){
      var demand = m[key];
      var shortfall = Math.max(0, demand + m.safety - m.stock);
      var recommended = Math.ceil(shortfall / 10) * 10;
      var cover = m.stock / m.avgDaily;
      var priority;
      if (shortfall > 0 && cover <= 6) priority = { key:'urgent', label:'Urgent', tone:'red' };
      else if (recommended > 0) priority = { key:'recommended', label:'Recommended', tone:'amber' };
      else priority = { key:'sufficient', label:'Sufficient', tone:'green' };
      return {
        med:m, currentStock:m.stock, projectedDemand:demand, safety:m.safety,
        shortfall:shortfall, recommended:recommended, priority:priority, coverDays:daysOfCover(m)
      };
    });
  }

  function planningSummary(horizonDays){
    var rows = purchaseRows(horizonDays);
    var need = rows.filter(function(r){ return r.recommended > 0; });
    return {
      medicinesNeedingPurchase:need.length,
      urgentCount:need.filter(function(r){ return r.priority.key === 'urgent'; }).length,
      totalProjectedDemand:rows.reduce(function(s,r){ return s + r.projectedDemand; },0),
      totalPurchaseQty:need.reduce(function(s,r){ return s + r.recommended; },0)
    };
  }

  function attentionList(limit){
    return MEDS.map(function(m){
      var s = statusOf(m);
      var runout = null;
      if (s.key === 'critical'){
        runout = Math.max(1, Math.floor(m.stock / m.avgDaily));
        return { med:m, status:s, headline:'Stock may run out in ' + runout + ' day' + (runout>1?'s':''), days:runout };
      }
      if (s.key === 'low'){
        runout = Math.max(1, Math.floor(m.stock / m.avgDaily));
        return { med:m, status:s, headline:'Low stock — around ' + runout + ' days of cover left', days:runout };
      }
      return { med:m, status:s, headline: s.key==='overstock' ? 'Stock level is higher than typical usage' : 'Healthy stock with stable demand', days:99 };
    })
    .filter(function(x){ return x.status.key !== 'healthy' && x.status.key !== 'overstock'; })
    .sort(function(a,b){ return a.days - b.days; })
    .slice(0, limit || 5);
  }

  function kpis(){
    var sumP7 = MEDS.reduce(function(s,m){ return s + m.p7; },0);
    var plan = planningSummary(state.planHorizon);
    var criticals = MEDS.filter(function(m){ return statusOf(m).key === 'critical'; }).length;
    return {
      next7Demand:sumP7,
      purchaseRequired:plan.medicinesNeedingPurchase,
      criticalStock:criticals,
      coverageDays:state.planHorizon
    };
  }

  /* ---------------- Sales ---------------- */
  var SALES = [
    { id:'s1', date:addDays(TODAY,-1), medId:'paracetamol-500', qty:230, method:'Manual', status:'Synced', note:'' },
    { id:'s2', date:addDays(TODAY,-1), medId:'amoxicillin-500', qty:120, method:'API Sync', status:'Synced', note:'POS batch #2291' },
    { id:'s3', date:addDays(TODAY,-2), medId:'ors-sachet', qty:310, method:'Manual', status:'Synced', note:'' },
    { id:'s4', date:addDays(TODAY,-2), medId:'metformin-850', qty:95, method:'API Sync', status:'Pending', note:'Awaiting confirmation' },
    { id:'s5', date:addDays(TODAY,-3), medId:'cetirizine-10', qty:180, method:'API Sync', status:'Synced', note:'' },
    { id:'s6', date:addDays(TODAY,-3), medId:'ibuprofen-400', qty:260, method:'Manual', status:'Synced', note:'' },
    { id:'s7', date:addDays(TODAY,-4), medId:'amlodipine-5', qty:140, method:'API Sync', status:'Synced', note:'' }
  ];

  /* ---------------- Notifications ---------------- */
  var NOTIFS = [
    { id:'n1', type:'crit', icon:'alertT', title:'Paracetamol stock is below projected 7-day requirement.',
      sub:'Current stock covers about 5 of the next 7 days. Review the purchase recommendation.', time:'12 min ago', target:'#/medicine/paracetamol-500', unread:true },
    { id:'n2', type:'ai', icon:'spark', title:'New forecast generated.',
      sub:'Demand forecast updated for all 12 medicines across your inventory.', time:'1 h ago', target:'#/forecast', unread:true },
    { id:'n3', type:'info', icon:'cart', title:'Purchase recommendation updated.',
      sub:'8 medicines now require purchasing for the 14-day planning window.', time:'2 h ago', target:'#/planning', unread:true },
    { id:'n4', type:'ok', icon:'check', title:'Actual sales for Aug 23 recorded.',
      sub:'230 units of Paracetamol were added to your demand history.', time:'Yesterday', target:'#/sales', unread:false },
    { id:'n5', type:'warn', icon:'alertT', title:'Metformin reached a critical stock level.',
      sub:'Only 130 units remain — less than 3 days of average usage.', time:'Yesterday', target:'#/medicine/metformin-850', unread:false },
    { id:'n6', type:'info', icon:'report', title:'Monthly report ready to review.',
      sub:'The Demand Forecast Report for July was generated successfully.', time:'2 days ago', target:'#/reports/demand', unread:false }
  ];

  /* ---------------- Reports ---------------- */
  var REPORTS = [
    { id:'demand', icon:'spark', tone:'blue', title:'Demand Forecast Report',
      desc:'Expected medicine demand for the coming weeks, including peak days and totals per medicine.',
      last:'Today, 09:41', period:'Last 30 days · All medicines' },
    { id:'purchase', icon:'cart', tone:'teal', title:'Purchase Planning Report',
      desc:'Recommended purchase quantities with shortfalls, safety stock and priorities by medicine.',
      last:'Yesterday, 18:02', period:'Next 14 days · Purchase list' },
    { id:'risk', icon:'shield', tone:'red', title:'Stock Risk Report',
      desc:'Medicines at risk of running out, ranked by days of cover, projected demand and impact.',
      last:'Aug 22, 08:15', period:'Risk overview · 12 medicines' },
    { id:'saleshistory', icon:'receipt', tone:'green', title:'Sales History Report',
      desc:'Completed actual sales over time, comparing recorded sales against forecast expectations.',
      last:'Aug 20, 16:44', period:'Last 90 days · Manual + API' }
  ];
  function reportById(id){
    for (var i=0;i<REPORTS.length;i++) if (REPORTS[i].id === id) return REPORTS[i];
    return null;
  }

  /* ---------------- App state (persisted lightly) ---------------- */
  var state = {
    userName:'Amelia Carter',
    userRole:'Pharmacy Manager',
    planHorizon:14,
    addedToPlan:[],            // med ids added from Medicine Details
    connection:'off',          // off | connecting | on
    prefs:{
      emailAlerts:true, pushAlerts:true, criticalOnly:false, weeklyDigest:true,
      defaultHorizon:14, safetyBuffer:100, autoSync:true,
      reduceMotion:false, compactTables:false
    }
  };
  try{
    var saved = localStorage.getItem('mf_state_v1');
    if (saved){
      saved = JSON.parse(saved);
      Object.keys(saved).forEach(function(k){
        if (k === 'prefs') Object.assign(state.prefs, saved.prefs||{});
        else state[k] = saved[k];
      });
    }
  }catch(e){}
  function persist(){
    try{ localStorage.setItem('mf_state_v1', JSON.stringify({
      userName:state.userName, userRole:state.userRole, planHorizon:state.planHorizon,
      addedToPlan:state.addedToPlan.slice(0,40), connection:state.connection, prefs:state.prefs
    })); }catch(e){}
  }

  /* Public API */
  return {
    TODAY:TODAY, addDays:addDays, fmtDate:fmtDate, fmtDateFull:fmtDateFull, isoDate:isoDate,
    meds:MEDS, medById:medById,
    statusOf:statusOf, daysOfCover:daysOfCover,
    historyFor:historyFor, forecastFor:forecastFor,
    purchaseRows:purchaseRows, planningSummary:planningSummary,
    attentionList:attentionList, kpis:kpis,
    sales:SALES, notifs:NOTIFS, reports:REPORTS, reportById:reportById,
    state:state, persist:persist
  };
})();
