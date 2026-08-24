/* ============================================================
   View — Demand Forecast
   ============================================================ */
window.MF = window.MF || {};
MF.views = MF.views || {};

MF.views.forecast = {
  title:'Demand Forecast',
  crumb:[['Home','#/dashboard'],['Demand Forecast',null]],
  last:null,   // cached result {medId, horizon}

  skeleton:function(){
    return '<div class="page"><div class="skel-line w40" style="height:26px;width:280px"></div><div class="skel-line w60"></div>' +
      '<div style="margin-top:22px" class="card"><div class="skel-line w40"></div><div class="skel-line w80"></div></div>' +
      '<div style="margin-top:22px">' + MF.ui.skeletonChart() + '</div></div>';
  },

  render:function(root){
    var D = MF.data, U = MF.ui;
    var self = this;

    root.innerHTML =
    '<div class="page">' +
      '<div class="page-head">' +
        '<div>' +
          '<span class="kicker"><span class="dot"></span>AI Engine</span>' +
          '<h2 class="page-title">Demand Forecast</h2>' +
          '<p class="page-sub">Understand expected medicine requirements before they happen. The AI engine analyzes historical usage and returns what you will likely need.</p>' +
        '</div>' +
        '<a class="btn ghost" href="#/planning">' + MF.ICONS.cart + 'Purchase Planning</a>' +
      '</div>' +

      /* Controls */
      '<section class="card" style="margin-bottom:24px">' +
        '<div style="display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap">' +
          '<div class="field" style="flex:1;min-width:220px">' +
            '<label class="label" for="fcMed">Medicine</label>' +
            '<select id="fcMed" class="select">' +
              '<option value="">Choose a medicine…</option>' +
              D.meds.map(function(m){
                var sel = self.last && self.last.medId === m.id ? ' selected' : '';
                return '<option value="' + m.id + '"' + sel + '>' + U.esc(m.name + ' ' + m.strength) + ' — ' + U.esc(m.form) + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
          '<div class="field">' +
            '<label class="label" id="fcHorizonLabel">Forecast horizon</label>' +
            '<div class="seg" id="fcSeg" role="group" aria-labelledby="fcHorizonLabel">' +
              [7,14,30].map(function(h){
                var act = (self.last ? self.last.horizon : D.state.prefs.defaultHorizon) === h;
                return '<button type="button" class="seg-item' + (act?' active':'') + '" data-h="' + h + '">' + h + ' Days</button>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<button class="btn primary lg" id="genBtn" style="min-width:210px">' + MF.ICONS.spark + 'Generate Forecast</button>' +
        '</div>' +
        '<p class="error-text" id="fcErr" style="margin-top:12px">' + MF.ICONS.alertC + 'Please choose a medicine before generating a forecast.</p>' +
      '</section>' +

      '<div id="fcResult"></div>' +
    '</div>';

    var sel = root.querySelector('#fcMed');
    var errEl = root.querySelector('#fcErr');
    var resultEl = root.querySelector('#fcResult');

    root.querySelector('#fcSeg').addEventListener('click', function(e){
      var b = e.target.closest('.seg-item'); if (!b) return;
      root.querySelectorAll('#fcSeg .seg-item').forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
    });

    function currentHorizon(){
      var b = root.querySelector('#fcSeg .active');
      return Number(b ? b.getAttribute('data-h') : 14);
    }

    /* Restore previous session result instantly (no modal) */
    if (self.last) drawResult(D.forecastFor(self.last.medId, self.last.horizon), true);

    root.querySelector('#genBtn').addEventListener('click', function(){
      U.closeAllMenus();
      if (!sel.value){
        errEl.classList.add('show');
        sel.classList.add('invalid');
        setTimeout(function(){ errEl.classList.remove('show'); }, 3200);
        return;
      }
      sel.classList.remove('invalid');
      runGeneration(sel.value, currentHorizon());
    });

    function runGeneration(medId, horizon){
      var med = D.medById(medId);
      var m = U.modal({
        closable:false,
        title:'', body:
        '<div class="gen-hero" style="margin:-20px -24px 0;border-radius:20px 20px 0 0">' +
          '<div class="gen-orb">' + MF.ICONS.spark + '</div>' +
          '<h3 class="gen-title">Generating Forecast</h3>' +
          '<p class="gen-sub">' + U.esc(med.name + ' ' + med.strength) + ' · next ' + horizon + ' days</p>' +
        '</div>' +
        '<div class="gen-steps">' +
          genStep(1,'Analyzing historical demand…') +
          genStep(2,'Learning demand patterns…') +
          genStep(3,'Generating future demand…') +
          genStep(4,'Forecast ready') +
          '<div class="gen-bar"><i id="genBarFill"></i></div>' +
        '</div>'
      });
      var steps = m.el.querySelectorAll('.gen-step');
      var bar = m.el.querySelector('#genBarFill');

      /* If reduced motion is on, skip theatrics */
      if (MF.charts.reduced || D.state.prefs.reduceMotion){ finish(); return; }

      var plan = [
        { t:100,   idx:0, bar:8 },
        { t:950,   idx:-1, doneIdx:0, bar:30 },
        { t:1050,  idx:1,  bar:48 },
        { t:1950,  doneIdx:1, bar:66 },
        { t:2050,  idx:2,  bar:82 },
        { t:2950,  doneIdx:2, bar:94 },
        { t:3150,  doneIdx:3, bar:100 },
        { t:3650,  finish:true }
      ];
      var timers = [];
      plan.forEach(function(p){
        timers.push(setTimeout(function(){
          if (p.idx != null && p.idx >= 0) setStep(p.idx,'active');
          if (p.doneIdx != null) setStep(p.doneIdx,'done');
          if (bar) bar.style.width = p.bar + '%';
          if (p.finish) finish();
        }, p.t));
      });
      function setStep(i, cls){
        steps[i].classList.remove('pending','active','done');
        steps[i].classList.add(cls);
        if (cls==='done'){
          steps[i].querySelector('.gs-dot').innerHTML = MF.ICONS.check;
          steps[i].querySelector('.gs-state').textContent = 'Done';
        }
      }
      function finish(){
        timers.forEach(clearTimeout);
        self.last = { medId:medId, horizon:horizon };
        m.close();
        drawResult(D.forecastFor(medId, horizon), false);
        U.toast('Forecast for ' + med.name + ' is ready.', 'success', { title:'Forecast ready' });
      }
      setStep(0,'active'); if (bar) bar.style.width = '6%';
    }

    function genStep(n, txt){
      return '<div class="gen-step pending">' +
        '<span class="gs-dot">' + n + '</span>' +
        '<span class="gs-txt">' + txt + '</span>' +
        '<span class="gs-state"></span>' +
      '</div>';
    }

    function drawResult(fc, instant){
      var med = fc.medicine;
      var runout = fc.runOutDay;

      resultEl.innerHTML =
      '<div class="stack gap20" style="animation:pageIn .5s var(--ease) both">' +

        (runout ?
          '<div class="card" style="border-color:var(--amber-line);background:linear-gradient(135deg,#FCF7EC,#FFF);display:flex;gap:14px;align-items:center;padding:16px 20px">' +
            '<span style="width:42px;height:42px;border-radius:12px;background:var(--amber-bg);color:var(--amber);display:flex;align-items:center;justify-content:center;flex:none">' + MF.ICONS.alertT.replace('<svg','<svg style="width:21px;height:21px"') + '</span>' +
            '<div style="flex:1;min-width:0"><b style="font-size:14px;color:#12203A;display:block">' + U.esc(med.name) + ' is projected to reach critical level by ' + escDay(runout.full) + '.</b>' +
            '<span class="small muted">Plan a purchase early enough to arrive before this date.</span></div>' +
            '<a class="btn danger sm no-print" href="#/planning">View Purchase Plan</a>' +
          '</div>' : '') +

        /* summary tiles */
        '<div class="stat-strip stagger">' +
          tile('blue','target','Expected Demand', fc.totalExpected + ' units', 'Total over next ' + fc.horizon + ' days') +
          tile('teal','clock','Average Daily Demand', fc.avgDaily + ' units/day', 'Smoothed across the period') +
          tile('red','trendUp','Peak Expected Demand', fc.peak.value + ' units', 'On ' + escShort(fc.peak.dateLabel)) +
          tile('gray','box','Stock Today', med.stock + ' units', 'Safety stock: ' + med.safety + ' units') +
        '</div>' +

        /* chart card */
        '<section class="card">' +
          '<div class="card-head">' +
            '<div><h3 class="card-title">' + U.esc(med.name + ' ' + med.strength) + ' — Next ' + fc.horizon + ' Days</h3>' +
            '<p class="card-sub">Historical actuals joined to the AI forecast for the coming days.</p></div>' +
            '<div class="chart-legend">' +
              '<span class="legend-key"><i class="lk-line" style="background:#1B5BD6"></i>Historical Demand</span>' +
              '<span class="legend-key"><i class="lk-line lk-dash"></i>AI Forecast</span>' +
            '</div>' +
          '</div>' +
          '<div class="chart-box tall"><canvas id="fcChart" role="img" aria-label="Forecast chart for ' + U.esc(med.name) + '"></canvas></div>' +
        '</section>' +

        /* table */
        '<section class="card table-card">' +
          '<div class="table-toolbar">' +
            '<div><h3 class="card-title" style="font-size:15px">Daily Breakdown</h3>' +
            '<p class="card-sub">Expected demand vs available stock for each forecast day.</p></div>' +
            '<span class="spacer"></span>' +
            '<a class="btn soft sm no-print" href="#/medicine/' + med.id + '">' + MF.ICONS.pill + 'Medicine Details</a>' +
            '<a class="btn primary sm no-print" href="#/planning">' + MF.ICONS.arrowR + 'View Purchase Recommendation</a>' +
          '</div>' +
          '<div class="table-scroll" style="max-height:420px">' +
            '<table class="table">' +
              '<thead><tr><th>Date</th><th>Expected Demand</th><th>Available Stock After Demand</th><th>Stock Status</th></tr></thead>' +
              '<tbody>' +
                fc.days.map(function(d){
                  var hot = d.available <= 0 || d.status.key === 'critical';
                  return '<tr' + (hot ? ' style="background:#FEF6F5"' : '') + '>' +
                    '<td class="cell-main" style="font-weight:600"><span>' + d.label + '</span><span class="cell-sub" style="margin:0 0 0 6px">' + weekday(d.full) + '</span></td>' +
                    '<td class="num-cell">' + U.fmt(d.expected) + ' units</td>' +
                    '<td class="num-cell' + (d.available<=0?' neg':'') + '">' + U.fmt(d.available) + ' units</td>' +
                    '<td>' + U.statusBadge(d.status) + '</td>' +
                  '</tr>';
                }).join('') +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</section>' +
      '</div>';

      /* chart data */
      var hist = fc.history.slice(-21);
      MF.charts.lineChart(root.querySelector('#fcChart'), {
        labels: hist.map(function(h){ return h.label; }).concat(fc.days.map(function(d){ return d.label; })),
        actual: hist.map(function(h){ return h.value; }),
        forecast: fc.days.map(function(d){ return d.expected; }),
        splitInt: hist.length - 1
      });

      function tile(tone,icon,label,val,sub){
        return '<div class="card hoverable stat-tile">' +
          '<div class="st-top"><span class="st-ico kpi-icon ' + tone + '" style="width:38px;height:38px;border-radius:11px">' + MF.ICONS[icon] + '</span></div>' +
          '<span class="st-val" data-cv="' + val + '">' + val + '</span>' +
          '<span class="st-lbl">' + label + '</span>' +
          '<span class="st-sub">' + sub + '</span>' +
        '</div>';
      }
      function escDay(s){ return U.esc(s); }
      function escShort(full){ // "Sat, Aug 29, 2026" -> "Aug 29"
        var p = full.split(', ');
        return U.esc(p[1] || full);
      }
      function weekday(full){ return U.esc(full.split(',')[0]); }

      /* animate numbers in tiles */
      resultEl.querySelectorAll('.st-val[data-cv]').forEach(function(el){
        var raw = el.getAttribute('data-cv');
        var num = parseInt(raw.replace(/[^0-9]/g,''),10);
        var suffix = raw.replace(/[0-9,]/g,'');
        if (isNaN(num)) return;
        if (instant || MF.charts.reduced){ el.textContent = U.fmt(num)+suffix; return; }
        var dur = 900, t0 = null;
        function fr(ts){ if(!t0)t0=ts; var p=Math.min(1,(ts-t0)/dur);
          el.textContent = U.fmt(Math.round(num*(1-Math.pow(1-p,3))))+suffix;
          if(p<1) requestAnimationFrame(fr); }
        requestAnimationFrame(fr);
      });
      resultEl.scrollIntoView({ behavior: MF.charts.reduced ? 'auto':'smooth', block:'start' });
    }
  }
};
