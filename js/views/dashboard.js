/* ============================================================
   View — Dashboard
   ============================================================ */
window.MF = window.MF || {};
MF.views = MF.views || {};

MF.views.dashboard = {
  title:'Dashboard',
  crumb:[['Home','#/dashboard'],['Dashboard',null]],
  skeleton:function(){
    return '<div class="page">' +
      '<div class="page-head"><div><div class="skel-line w40" style="height:24px;width:300px"></div><div class="skel-line w60"></div></div></div>' +
      MF.ui.skeletonKpis() +
      '<div style="display:grid;grid-template-columns:1fr 360px;gap:22px"><div class="skel skel-chart"></div><div class="skel skel-chart" style="height:auto"></div></div>' +
    '</div>';
  },

  render:function(root){
    var D = MF.data, U = MF.ui;
    var st = D.state;

    /* ---------- derived numbers ---------- */
    var k = D.kpis();
    var hour = new Date().getHours();
    var greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    var today = D.fmtDateFull(D.TODAY);
    var firstName = st.userName.split(' ')[0];

    var histSum7 = D.meds.reduce(function(s,m){ return s + m.avgDaily*7*0.965; },0);
    var demandTrend = Math.round(((k.next7Demand - histSum7)/histSum7)*1000)/10;
    var att = D.attentionList(5);
    var topAtt = att[0];
    var insightName = topAtt ? topAtt.med.name : 'Paracetamol';

    /* status distribution */
    var dist = { healthy:0, low:0, critical:0, overstock:0 };
    D.meds.forEach(function(m){ dist[D.statusOf(m).key]++; });

    /* ---------- markup ---------- */
    root.innerHTML =
    '<div class="page">' +

      '<div class="page-head">' +
        '<div>' +
          '<h2 class="page-title">' + greet + ', ' + U.esc(firstName) + '</h2>' +
          '<p class="page-sub">Here is your medicine demand and purchase planning overview for <b>' + esc(today.split(',')[0]) + '</b>. ' +
          D.meds.length + ' medicines are being tracked across your inventory.</p>' +
        '</div>' +
        '<div class="btn-row">' +
          '<a class="btn ghost" href="#/sales">' + MF.ICONS.receipt + 'Record Sales</a>' +
          '<a class="btn primary" href="#/forecast">' + MF.ICONS.spark + 'New Forecast</a>' +
        '</div>' +
      '</div>' +

      /* ---- KPIs ---- */
      '<div class="kpi-grid stagger" style="margin-bottom:24px">' +
        kpi('blue','layers','Next 7 Days Demand', k.next7Demand,' units','Projected medicine requirement', demandTrend, true) +
        kpi('amber','cart','Purchase Required', k.purchaseRequired,' medicines','Need replenishment within ' + k.coverageDays + ' days', null) +
        kpi('red','alertT','Critical Stock', k.criticalStock,' medicines','Immediate attention required', null) +
        '<div class="card hoverable kpi"><span class="kpi-icon teal">' + MF.ICONS.target + '</span>' +
          '<div><div class="kpi-label">Forecast Coverage</div><div class="kpi-val"><span id="kpiCoverage">' + k.coverageDays + '</span><small> days</small></div>' +
          '<div class="kpi-desc">Current planning horizon</div></div></div>' +
      '</div>' +

      /* ---- Hero forecast ---- */
      '<div class="hero">' +
        '<section class="hero-main" aria-label="Demand forecast">' +
          '<div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px">' +
            '<div>' +
              '<h3 style="font-size:20px;font-weight:800">Demand Forecast</h3>' +
              '<p class="muted" style="font-size:13px;margin-top:3px">Projected medicine demand based on historical usage.</p>' +
            '</div>' +
            '<div class="hero-controls">' +
              '<select id="dashMedSel" class="select" style="height:40px;width:210px;font-size:13px" aria-label="Choose medicines">' +
                '<option value="all">All Medicines</option>' +
                D.meds.map(function(m){ return '<option value="' + m.id + '">' + U.esc(m.name + ' ' + m.strength) + '</option>'; }).join('') +
              '</select>' +
              '<div class="seg" id="dashSeg" role="tablist" aria-label="Forecast period">' +
                [7,14,30].map(function(h){ return '<button class="seg-item' + (h===st.planHorizon?' active':'') + '" data-h="' + h + '" role="tab">' + h + ' Days</button>'; }).join('') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="row" style="margin-top:14px;gap:18px;flex-wrap:wrap">' +
            '<div class="chart-legend">' +
              '<span class="legend-key"><i class="lk-line" style="background:#1B5BD6"></i>Actual Demand</span>' +
              '<span class="legend-key"><i class="lk-line lk-dash"></i>Forecast Demand</span>' +
            '</div>' +
            '<span class="zone-tag">' + MF.ICONS.zap.replace('width','w').replace('<svg','<svg style="width:12px;height:12px"') + 'AI Forecast Zone</span>' +
          '</div>' +
          '<div class="chart-box"><canvas id="dashChart" role="img" aria-label="Line chart comparing actual demand history with AI forecast"></canvas></div>' +
        '</section>' +

        '<div class="hero-side">' +
          /* AI insight */
          '<aside class="insight-card">' +
            '<span class="insight-kicker">' + MF.ICONS.spark + 'AI Planning Insight</span>' +
            '<h3 class="insight-title">' + U.esc(insightName) + ' needs attention</h3>' +
            '<p class="insight-body">' +
              (topAtt
                ? '<b>' + U.esc(topAtt.med.name) + '</b> demand is expected to stay high over the next ' + k.coverageDays + ' days. Current stock may not cover projected demand plus safety stock.'
                : 'All medicines look healthy for the selected planning window.') +
            '</p>' +
            '<div class="insight-foot">' +
              '<a class="btn btn-white sm" href="#/planning">View Purchase Plan ' + MF.ICONS.arrowR + '</a>' +
              '<span class="spark-pulse" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
            '</div>' +
          '</aside>' +
          '<div>' + U.photoImg(
            'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=900&auto=format&fit=crop',
            'Pharmacist organizing medicine shelves in a modern pharmacy',
            'Your pharmacy, in sync',
            'Live inventory · ' + D.meds.length + ' medicines · updated moments ago'
          ) + '</div>' +
        '</div>' +
      '</div>' +

      /* ---- Needs attention + stock health ---- */
      '<div style="display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:22px" class="attn-grid">' +
        '<section class="card hoverable">' +
          '<div class="card-head">' +
            '<div><h3 class="card-title">Needs Attention</h3><p class="card-sub">The most important medicines to review today.</p></div>' +
            '<a class="link-btn" href="#/medicines">All medicines ' + MF.ICONS.arrowR + '</a>' +
          '</div>' +
          '<div class="attn-list">' +
            att.map(function(a,i){
              var tone = a.status.key==='critical' ? 'red':'amber';
              return '<div class="attn-item">' +
                '<span class="attn-rank ' + tone + '">' + (i+1) + '</span>' +
                '<div class="attn-main"><b>' + U.esc(a.med.name + ' ' + a.med.strength) + '</b><span>' + U.esc(a.headline) + '</span></div>' +
                U.statusBadge(a.status) +
                '<a class="btn ghost sm" href="#/medicine/' + a.med.id + '">View</a>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</section>' +

        '<section class="card hoverable">' +
          '<div class="card-head">' +
            '<div><h3 class="card-title">Stock Health</h3><p class="card-sub">Current status across your inventory.</p></div>' +
          '</div>' +
          '<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">' +
            '<div style="position:relative;width:172px;height:172px;flex:none">' +
              '<canvas id="healthDonut" role="img" aria-label="Donut chart of stock health distribution"></canvas>' +
              '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none">' +
                '<span style="font-family:Manrope;font-size:28px;font-weight:800;color:#12203A">' + D.meds.length + '</span>' +
                '<span class="muted small">medicines</span>' +
              '</div>' +
            '</div>' +
            '<div class="stack gap8" style="flex:1;min-width:150px">' +
              legendRow('#188A4E','Healthy',dist.healthy) +
              legendRow('#C77414','Low Stock',dist.low) +
              legendRow('#D33A2F','Critical',dist.critical) +
              legendRow('#1B5BD6','Overstock',dist.overstock) +
            '</div>' +
          '</div>' +
          '<hr class="divider"/>' +
          '<a class="btn soft btn-block" href="#/planning">' + MF.ICONS.cart + 'Open Purchase Planning</a>' +
        '</section>' +
      '</div>' +

    '</div>';

    /* mobile grid fix */
    if (window.matchMedia('(max-width:1100px)').matches){
      root.querySelector('.attn-grid').style.gridTemplateColumns = '1fr';
    }

    function kpi(tone, icon, label, val, unit, desc, trend, invert){
      return '<div class="card hoverable kpi">' +
        '<span class="kpi-icon ' + tone + '">' + MF.ICONS[icon] + '</span>' +
        '<div><div class="kpi-label">' + label + '</div>' +
        '<div class="kpi-val"><span data-count="' + val + '">0</span><small>' + unit + '</small></div>' +
        '<div class="kpi-desc">' + desc + '</div>' +
        (trend != null ? '<span class="kpi-trend ' + (trend>0?'up':'down') + '">' + (trend>0?MF.ICONS.trendUp:MF.ICONS.trendDown) + Math.abs(trend) + '% vs last week</span>' : '') +
        '</div></div>';
    }
    function legendRow(color,label,n){
      return '<div class="row" style="gap:9px"><span style="width:10px;height:10px;border-radius:4px;background:'+color+';flex:none"></span>' +
        '<span class="small" style="font-weight:650;color:#4E5D76">'+label+'</span><span class="spacer"></span>' +
        '<span class="num-cell" style="font-weight:750">'+n+'</span></div>';
    }

    /* ---------- mount behaviours ---------- */
    root.querySelectorAll('[data-count]').forEach(function(el){
      MF.ui.countUp(el, Number(el.getAttribute('data-count')));
    });

    buildChart();
    buildDonut();

    function seriesFor(medId, horizon){
      if (medId === 'all'){
        var past = [], pastLabels = [];
        for (var i = 20; i >= 0; i--){ past.push(0); }
        D.meds[0] && D.historyFor('paracetamol-500', 21).forEach(function(p,i){ pastLabels.push(p.label); });
        D.meds.forEach(function(m){
          var h = D.historyFor(m.id, 21);
          h.forEach(function(p,i){ past[i] += p.value; });
        });
        var futVals = new Array(horizon);
        for (var j=0;j<horizon;j++) futVals[j] = 0;
        D.meds.forEach(function(m){
          var f = D.forecastFor(m.id, horizon);
          f.days.forEach(function(d,idx){ futVals[idx] += d.expected; });
        });
        return {
          labels: pastLabels.concat(f.days.map(function(d){ return d.label; })),
          actual: past,
          forecast: futVals,
          splitInt: 20
        };
      }
      var one = D.forecastFor(medId, horizon);
      var hist = D.historyFor(medId, 21);
      return {
        labels: hist.map(function(h){ return h.label; }).concat(one.days.map(function(d){ return d.label; })),
        actual: hist.map(function(h){ return h.value; }),
        forecast: one.days.map(function(d){ return d.expected; }),
        splitInt: 20
      };
    }

    var dashChart = null;
    function buildChart(){
      var selVal = root.querySelector('#dashMedSel').value;
      var horizon = Number((root.querySelector('#dashSeg .active')||{getAttribute:function(){return String(st.planHorizon);}}).getAttribute('data-h'));
      var s = seriesFor(selVal, horizon);
      if (dashChart){ try{ dashChart.destroy(); }catch(e){} }
      dashChart = MF.charts.lineChart(root.querySelector('#dashChart'), s);
    }

    function buildDonut(){
      if (!window.Chart) return;
      var cv = root.querySelector('#healthDonut');
      var chart = new Chart(cv.getContext('2d'), {
        type:'doughnut',
        data:{ labels:['Healthy','Low','Critical','Overstock'],
          datasets:[{ data:[dist.healthy,dist.low,dist.critical,dist.overstock],
            backgroundColor:['#188A4E','#C77414','#D33A2F','#1B5BD6'],
            borderWidth:3, borderColor:'#fff', hoverOffset:6 }] },
        options:{
          responsive:true, maintainAspectRatio:false, cutout:'72%',
          animation: MF.charts.reduced ? false : { animateRotate:true, duration:1000 },
          plugins:{ legend:{ display:false },
            tooltip:{ backgroundColor:'#12203A', padding:11, cornerRadius:9,
              callbacks:{ label:function(c){ return ' ' + c.label + ': ' + c.parsed + ' medicines'; } } } }
        }
      });
      MF.charts.destroyAll && registryPush(chart);
    }

    /* controls */
    root.querySelector('#dashMedSel').addEventListener('change', buildChart);
    root.querySelector('#dashSeg').addEventListener('click', function(e){
      var b = e.target.closest('.seg-item'); if (!b) return;
      root.querySelectorAll('#dashSeg .seg-item').forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      var h = Number(b.getAttribute('data-h'));
      st.planHorizon = h; D.persist();
      root.querySelector('#kpiCoverage').textContent = h;
      buildChart();
      MF.ui.toast('Planning horizon set to ' + h + ' days.', 'info', { title:'Forecast updated', duration:2600 });
    });

    function registryPush(c){ MF._extraCharts = MF._extraCharts || []; MF._extraCharts.push(c); }
  }
};
