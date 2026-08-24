/* ============================================================
   View — Purchase Planning
   ============================================================ */
window.MF = window.MF || {};
MF.views = MF.views || {};

MF.views.planning = {
  title:'Purchase Planning',
  crumb:[['Home','#/dashboard'],['Purchase Planning',null]],
  ui:{ horizon:null, query:'', filter:'all', sortKey:'priority', sortDir:'asc' },

  skeleton:function(){
    return '<div class="page"><div class="skel-line w40" style="height:26px;width:300px"></div><div class="skel-line w60"></div>' +
      '<div class="skel-kpis" style="margin-top:22px"><div class="skel skel-card"></div><div class="skel skel-card"></div><div class="skel skel-card"></div><div class="skel skel-card"></div></div>' +
      MF.ui.skeletonTable(7) + '</div>';
  },

  render:function(root){
    var D = MF.data, U = MF.ui;
    var self = this;
    var ui = self.ui;
    if (!ui.horizon) ui.horizon = D.state.planHorizon;

    root.innerHTML =
    '<div class="page">' +
      '<div class="page-head">' +
        '<div>' +
          '<h2 class="page-title">Purchase Planning</h2>' +
          '<p class="page-sub">Turn demand forecasts into practical purchasing decisions — what to buy, how much, and how urgent it is.</p>' +
        '</div>' +
        '<div class="btn-row no-print">' +
          '<div class="menu-anchor">' +
            '<button class="btn ghost" id="exportBtn">' + MF.ICONS.download + 'Export' + MF.ICONS.chevD.replace('<svg','<svg style="width:14px;height:14px;margin-left:2px"') + '</button>' +
            '<div class="menu" id="exportMenu" role="menu">' +
              '<button class="menu-item" data-x="csv">' + MF.ICONS.fileDown + 'Export Purchase Plan (CSV)</button>' +
              '<button class="menu-item" data-x="print">' + MF.ICONS.printer + 'Print</button>' +
              '<button class="menu-item" data-x="report">' + MF.ICONS.report + 'Download Report Summary</button>' +
            '</div>' +
          '</div>' +
          '<a class="btn soft" href="#/reports/purchase">' + MF.ICONS.external + 'Full Report</a>' +
        '</div>' +
      '</div>' +

      /* period */
      '<div class="row no-print" style="margin-bottom:20px">' +
        '<span class="label" style="font-size:13px;color:#4E5D76;font-weight:700">Planning period</span>' +
        '<div class="seg" id="plSeg">' +
          [7,14,30].map(function(h){
            return '<button type="button" class="seg-item' + (ui.horizon===h?' active':'') + '" data-h="' + h + '">' + h + ' Days</button>';
          }).join('') +
        '</div>' +
        '<span class="spacer"></span>' +
        '<span class="small muted">Updated ' + D.fmtDate(D.TODAY) + ' · AI forecast v2.4</span>' +
      '</div>' +

      '<div id="plBody"></div>' +
    '</div>';

    var body = root.querySelector('#plBody');

    /* export menu */
    U.attachMenu(root.querySelector('#exportBtn'), root.querySelector('#exportMenu'));
    root.querySelector('#exportMenu').addEventListener('click', function(e){
      var b = e.target.closest('.menu-item'); if (!b) return;
      e.stopPropagation();
      root.querySelector('#exportMenu').classList.remove('open');
      doExport(b.getAttribute('data-x'));
    });

    root.querySelector('#plSeg').addEventListener('click', function(e){
      var b = e.target.closest('.seg-item'); if (!b) return;
      root.querySelectorAll('#plSeg .seg-item').forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      ui.horizon = Number(b.getAttribute('data-h'));
      D.state.planHorizon = ui.horizon; D.persist();
      draw();
      U.toast('Plan recalculated for the next ' + ui.horizon + ' days.', 'info', { title:'Period updated', duration:2400 });
    });

    function doExport(kind){
      var rows = currentRows();
      if (kind === 'csv'){
        var data = [['Medicine','Category','Current Stock','Projected Demand ('+ui.horizon+'d)','Safety Stock','Expected Shortfall','Recommended Purchase','Priority']];
        rows.forEach(function(r){
          data.push([r.med.name+' '+r.med.strength, r.med.category, r.currentStock, r.projectedDemand, r.safety, r.shortfall, r.recommended, r.priority.label]);
        });
        U.downloadCSV('medi-forecaster-purchase-plan-'+ui.horizon+'d.csv', data);
        U.toast(rows.length + ' medicines exported as CSV.', 'success', { title:'Export complete' });
      } else if (kind === 'print'){
        U.toast('Opening print preview…', 'info', { title:'Print', duration:2000 });
        setTimeout(function(){ window.print(); }, 350);
      } else {
        var s = D.planningSummary(ui.horizon);
        var rep = [
          ['Medi Forecaster — Purchase Planning Summary'],
          ['Generated', new Date().toLocaleString()],
          ['Planning horizon', 'Next ' + ui.horizon + ' days'],
          [],
          ['Medicines requiring purchase', s.medicinesNeedingPurchase],
          ['Total projected demand (units)', s.totalProjectedDemand],
          ['Estimated purchase quantity (units)', s.totalPurchaseQty],
          ['Urgent purchases', s.urgentCount],
          [],
          ['Medicine','Shortfall','Recommended Purchase','Priority']
        ];
        rows.filter(function(r){return r.recommended>0;}).forEach(function(r){
          rep.push([r.med.name+' '+r.med.strength, r.shortfall, r.recommended, r.priority.label]);
        });
        U.downloadCSV('medi-forecaster-purchase-summary.csv', rep);
        U.toast('Report summary downloaded.', 'success', { title:'Download ready' });
      }
    }

    function currentRows(){
      var rows = D.purchaseRows(ui.horizon);
      if (ui.query){
        var q = ui.query.toLowerCase();
        rows = rows.filter(function(r){
          return (r.med.name + ' ' + r.med.strength + ' ' + r.med.category).toLowerCase().indexOf(q) !== -1;
        });
      }
      if (ui.filter !== 'all') rows = rows.filter(function(r){ return r.priority.key === ui.filter; });
      var dir = ui.sortDir === 'asc' ? 1 : -1;
      var key = ui.sortKey;
      var order = { urgent:0, recommended:1, sufficient:2 };
      rows.sort(function(a,b){
        var va, vb;
        if (key === 'medicine'){ va = a.med.name; vb = b.med.name; }
        else if (key === 'priority'){ va = order[a.priority.key]; vb = order[b.priority.key]; }
        else { va = a[key]; vb = b[key]; }
        if (va < vb) return -1*dir;
        if (va > vb) return 1*dir;
        return 0;
      });
      return rows;
    }

    function draw(){
      var all = D.purchaseRows(ui.horizon);
      var s = D.planningSummary(ui.horizon);
      var rows = currentRows();
      var ex = D.medById('paracetamol-500');   // worked example for the formula
      var exDemand = ex['p'+ui.horizon];
      var exRec = Math.max(0, Math.ceil((exDemand + ex.safety - ex.stock)/10)*10);
      var added = D.state.addedToPlan;

      body.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:22px">' +

        /* summary tiles + box visual */
        '<div style="display:grid;grid-template-columns:minmax(0,2.6fr) minmax(0,1fr);gap:22px" id="sumGrid">' +
          '<div class="stat-strip stagger" style="grid-template-columns:1fr 1fr;">' +
            sumTile('blue','pill','Medicines Requiring Purchase', s.medicinesNeedingPurchase, 'out of ' + all.length + ' tracked', '#EBF2FD','#1B5BD6') +
            sumTile('navy','layers','Total Projected Demand', U.fmt(s.totalProjectedDemand), 'units over ' + ui.horizon + ' days', '#EDF1F7','#12203A') +
            sumTile('teal','box','Estimated Purchase Quantity', U.fmt(s.totalPurchaseQty), 'units recommended now', '#E9F8F7','#0C8B8B') +
            sumTile('red','alertT','Urgent Purchases', s.urgentCount, 'order within 48 hours', '#FBEAE8','#D33A2F') +
          '</div>' +
          '<aside class="card hoverable" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:18px">' +
            '<div style="width:130px">' + MF.artBox() + '</div>' +
            '<b style="font-size:13.5px;color:#12203A;margin-top:2px">Ready for procurement</b>' +
            '<span class="small muted" style="margin-top:3px;line-height:1.5">Recommendations combine forecast demand, live stock and safety buffers.</span>' +
          '</aside>' +
        '</div>' +

        /* formula explanation */
        '<section class="card">' +
          '<div class="card-head"><div><h3 class="card-title">How your purchase requirement is calculated</h3>' +
          '<p class="card-sub">A simple, transparent rule applied to every medicine.</p></div>' +
          '<span class="badge teal">Worked example · ' + U.esc(ex.name) + '</span></div>' +
          '<div class="formula">' +
            fchip(U.fmt(ex.stock),'Current Stock','') +
            op('+') +
            fchip(U.fmt(exDemand),'Expected Demand ('+ui.horizon+'d)','') +
            op('+') +
            fchip(U.fmt(ex.safety),'Safety Stock','') +
            op('=') +
            fchip(U.fmt(exRec),'Recommended Purchase','total') +
          '</div>' +
          '<p class="small muted" style="margin-top:12px">If current stock already covers expected demand plus safety stock, no purchase is recommended.</p>' +
        '</section>' +

        /* table */
        '<section class="card table-card">' +
          '<div class="table-toolbar">' +
            '<div class="input-wrap" style="width:min(280px,100%)">' +
              '<span class="lead">' + MF.ICONS.search + '</span>' +
              '<input class="input" id="plSearch" placeholder="Search medicines…" value="' + U.esc(ui.query) + '" style="height:40px"/>' +
            '</div>' +
            '<div class="pills" id="plPills" role="tablist">' +
              pillBtn('all','All', all.length) +
              pillBtn('urgent','Urgent', countBy(all,'urgent')) +
              pillBtn('recommended','Recommended', countBy(all,'recommended')) +
              pillBtn('sufficient','Sufficient', countBy(all,'sufficient')) +
            '</div>' +
          '</div>' +
          (rows.length ?
          '<div class="table-scroll">' +
            '<table class="table" id="plTable">' +
              '<thead><tr>' +
                th('medicine','Medicine') + th('currentStock','Current Stock') + th('projectedDemand','Projected Demand') +
                th('safety','Safety Stock') + th('shortfall','Expected Shortfall') + th('recommended','Recommended Purchase') +
                th('priority','Priority') + '<th>Action</th>' +
              '</tr></thead>' +
              '<tbody>' +
                rows.map(function(r,i){
                  var isNew = added.indexOf(r.med.id) !== -1 && r.recommended > 0;
                  return '<tr class="clickable" data-id="' + r.med.id + '" title="Open medicine details">' +
                    '<td><div class="cell-main">' + U.medThumb(r.med) + '<div><div style="display:flex;align-items:center;gap:8px">' + U.esc(r.med.name + ' ' + r.med.strength) +
                      (isNew ? '<span class="badge blue" style="font-size:10px;padding:2px 8px">In plan</span>' : '') + '</div>' +
                      '<div class="cell-sub">' + U.esc(r.med.category) + ' · ' + r.coverDays + ' days cover</div></div></div></td>' +
                    '<td class="num-cell" data-th="Current Stock">' + U.fmt(r.currentStock) + '</td>' +
                    '<td class="num-cell" data-th="Projected Demand">' + U.fmt(r.projectedDemand) + '</td>' +
                    '<td class="num-cell" data-th="Safety Stock">' + U.fmt(r.safety) + '</td>' +
                    '<td class="num-cell ' + (r.shortfall>0?'neg':'pos') + '" data-th="Expected Shortfall">' + (r.shortfall>0 ? '+'+U.fmt(r.shortfall) : '—') + '</td>' +
                    '<td class="num-cell" data-th="Recommended Purchase" style="color:#12203A;font-weight:750">' + (r.recommended>0 ? U.fmt(r.recommended)+' units' : 'No purchase needed') + '</td>' +
                    '<td data-th="Priority">' + U.priorityBadge(r.priority) + '</td>' +
                    '<td><a class="btn ghost sm" href="#/medicine/' + r.med.id + '">View</a></td>' +
                  '</tr>';
                }).join('') +
              '</tbody>' +
            '</table>' +
          '</div>' +
          '<div class="table-foot"><span class="small muted">' + rows.length + ' of ' + all.length + ' medicines shown</span>' +
            '<span class="small muted">Priorities refresh automatically after each forecast</span></div>'
          :
          '<div style="padding:12px"><div class="empty" style="border:0;background:transparent">' +
            '<div class="empty-art">' + MF.artEmptyBox() + '</div>' +
            '<div class="empty-title">No purchase recommendations</div>' +
            '<p class="empty-sub">Current stock is sufficient for the selected planning period. Try another period or clear filters.</p>' +
            '<button class="btn ghost sm" id="plClear">Clear filters</button>' +
          '</div></div>') +
        '</section>' +
      '</div>';

      /* responsive summary grid */
      if (window.matchMedia('(max-width:1100px)').matches){
        var sg = body.querySelector('#sumGrid'); if (sg) sg.style.gridTemplateColumns = '1fr';
      }

      function fchip(v,l,totalCls){
        return '<div class="f-chip ' + (totalCls||'') + '"><div class="fv">' + v + '</div><div class="fl">' + l + '</div></div>';
      }
      function op(o){ return '<div class="f-op">' + o + '</div>'; }
      function pillBtn(key,label,cnt){
        return '<button class="pill' + (ui.filter===key?' active':'') + '" data-f="' + key + '">' +
          '<span class="pdot ' + (key==='urgent'?'red':key==='recommended'?'amber':key==='sufficient'?'green':'gray') + '"></span>' +
          label + ' <span class="cnt">' + cnt + '</span></button>';
      }
      function countBy(rows,key){ return rows.filter(function(r){ return r.priority.key===key; }).length; }
      function th(key,label){
        var active = ui.sortKey===key;
        var cls = 'sortable' + (active ? ' ' + ui.sortDir : '');
        return '<th class="' + cls + '" data-sk="' + key + '">' + label +
          '<span class="sort-ico">' + MF.ICONS.sortAsc + '</span></th>';
      }

      bind();
    }

    function bind(){
      var search = document.getElementById('plSearch');
      if (search){
        search.addEventListener('input', U.debounce(function(){
          ui.query = search.value.trim();
          draw();
          var s2 = document.getElementById('plSearch');
          if (s2){ s2.focus(); s2.setSelectionRange(s2.value.length, s2.value.length); }
        }, 260));
      }
      var pills = document.getElementById('plPills');
      if (pills) pills.addEventListener('click', function(e){
        var p = e.target.closest('.pill'); if (!p) return;
        ui.filter = p.getAttribute('data-f');
        draw();
      });
      document.querySelectorAll('#plTable th.sortable').forEach(function(thEl){
        thEl.addEventListener('click', function(){
          var key = thEl.getAttribute('data-sk');
          if (ui.sortKey === key) ui.sortDir = ui.sortDir === 'asc' ? 'desc':'asc';
          else { ui.sortKey = key; ui.sortDir = 'asc'; }
          draw();
        });
      });
      var clear = document.getElementById('plClear');
      if (clear) clear.addEventListener('click', function(){ ui.query=''; ui.filter='all'; draw(); });
      document.querySelectorAll('#plTable tr.clickable').forEach(function(tr){
        tr.addEventListener('click', function(e){
          if (e.target.closest('a')) return;
          location.hash = '#/medicine/' + tr.getAttribute('data-id');
        });
      });
    }

    draw();
  }
};
