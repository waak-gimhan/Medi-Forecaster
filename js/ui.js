/* ============================================================
   Medi Forecaster — UI kit: toasts, modals, menus, counters…
   ============================================================ */
window.MF = window.MF || {};

MF.ui = (function(){
  var D = MF.data;

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function fmt(n){ return Number(n||0).toLocaleString('en-US'); }

  /* ---------------- Toast ---------------- */
  var TOAST_ICONS = { success:'check', error:'alertC', info:'info', warn:'alertT' };
  function toast(msg, type, opts){
    opts = opts || {};
    type = type || 'info';
    var root = document.getElementById('toastRoot');
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML =
      '<span class="toast-ico">' + (MF.ICONS[TOAST_ICONS[type]]||'') + '</span>' +
      '<div class="toast-body"><b>' + esc(opts.title || defaultTitle(type)) + '</b>' +
      (msg ? '<span>' + esc(msg) + '</span>' : '') + '</div>' +
      '<button class="toast-x" aria-label="Dismiss">' + MF.ICONS.x + '</button>';
    root.appendChild(t);
    var kill = function(){ if (!t.parentNode) return; t.classList.add('out'); setTimeout(function(){ t.remove(); }, 320); };
    t.querySelector('.toast-x').addEventListener('click', kill);
    setTimeout(kill, opts.duration || 4400);
  }
  function defaultTitle(t){
    return {success:'Done', error:'Something went wrong', info:'Heads up', warn:'Attention'}[t] || '';
  }

  /* ---------------- Modal ---------------- */
  function modal(opts){
    var root = document.getElementById('modalRoot');
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    var m = document.createElement('div');
    m.className = 'modal';
    m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true');
    m.innerHTML =
      '<div class="modal-head">' +
        '<div style="flex:1"><h2 class="modal-title">' + (opts.title||'') + '</h2>' +
        (opts.sub ? '<p class="modal-sub">' + opts.sub + '</p>' : '') + '</div>' +
        (opts.closable === false ? '' : '<button class="icon-btn m-close" aria-label="Close">' + MF.ICONS.x + '</button>') +
      '</div>' +
      '<div class="modal-body">' + (opts.body||'') + '</div>' +
      (opts.foot ? '<div class="modal-foot">' + opts.foot + '</div>' : '');
    root.appendChild(backdrop); root.appendChild(m);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      backdrop.classList.add('open'); m.classList.add('open');
    });});
    function close(){
      backdrop.classList.remove('open'); m.classList.remove('open');
      setTimeout(function(){ backdrop.remove(); m.remove(); }, 300);
      document.removeEventListener('keydown', onKey);
      if (opts.onClose) opts.onClose();
    }
    function onKey(e){ if (e.key === 'Escape') close(); }
    if (opts.closable !== false){
      m.querySelector('.m-close').addEventListener('click', close);
      backdrop.addEventListener('click', close);
      document.addEventListener('keydown', onKey);
    }
    return { el:m, backdrop:backdrop, close:close };
  }

  /* ---------------- Dropdown menu ---------------- */
  function attachMenu(anchorBtn, menuEl){
    anchorBtn.addEventListener('click', function(e){
      e.stopPropagation();
      closeAllMenus(menuEl);
      menuEl.classList.toggle('open');
    });
    document.addEventListener('click', function(e){
      if (!menuEl.contains(e.target) && e.target !== anchorBtn && !anchorBtn.contains(e.target)){
        menuEl.classList.remove('open');
      }
    });
  }
  function closeAllMenus(except){
    document.querySelectorAll('.menu.open').forEach(function(m){ if (m !== except) m.classList.remove('open'); });
  }

  /* ---------------- Animated counter ---------------- */
  function countUp(el, target, opts){
    opts = opts || {};
    if (!el) return;
    if (MF.charts.reduced || D.state.prefs.reduceMotion){ el.textContent = fmt(target); return; }
    var dur = opts.duration || 1100;
    var start = null, from = opts.from || 0;
    function frame(ts){
      if (!start) start = ts;
      var p = Math.min(1,(ts-start)/dur);
      var eased = 1 - Math.pow(1-p, 3);
      var val = Math.round(from + (target-from)*eased);
      el.textContent = fmt(val);
      if (p < 1) requestAnimationFrame(frame);
    }
    el.textContent = '0';
    requestAnimationFrame(frame);
  }

  /* ---------------- Skeletons ---------------- */
  function skeletonKpis(n){
    n = n||4;
    var s = '<div class="skel-kpis">';
    for (var i=0;i<n;i++) s += '<div class="skel skel-card"></div>';
    return s + '</div><div class="skel skel-chart"></div>';
  }
  function skeletonChart(){ return '<div class="skel skel-chart"></div>'; }
  function skeletonTable(rows){
    rows = rows||8;
    var s = '<div class="card table-card"><div style="padding:20px">';
    for (var i=0;i<rows;i++){
      s += '<div class="skel-line" style="width:'+(96 - i*7)+'%;margin:16px auto 16px 0"></div>';
    }
    return s + '</div></div>';
  }

  /* ---------------- Small builders ---------------- */
  function badge(text, tone, dot){
    return '<span class="badge ' + tone + '">' + (dot!==false?'<span class="bdot"></span>':'') + esc(text) + '</span>';
  }
  function statusBadge(st){ return badge(st.label, st.tone); }
  function priorityBadge(p){
    if (p.key==='urgent') return '<span class="badge solid-red"><span class="bdot" style="background:#fff"></span>Urgent</span>';
    if (p.key==='recommended') return '<span class="badge solid-amber"><span class="bdot" style="background:#fff"></span>Recommended</span>';
    return badge('Sufficient','green');
  }
  var THUMB_TONES = {
    Analgesic:['#EBF2FD','#1B5BD6'], Antibiotic:['#E9F8F7','#0C8B8B'], Antihistamine:['#FCF1DE','#C77414'],
    Antacid:['#F3EEFB','#6D4FC2'], Antidiabetic:['#EAF6EF','#188A4E'], Cardiovascular:['#FBEAE8','#D33A2F'],
    Respiratory:['#E8F4FD','#1273B8'], Supplement:['#FFF4E3','#C77414'], Rehydration:['#E6F7FB','#0E93AC']
  };
  function medThumb(m, sizeOnly){
    var tones = THUMB_TONES[m.category] || ['#EDF1F7','#4E5D76'];
    var glyph = m.form === 'Inhaler' ? '💨' : m.form === 'Capsule' ? '💊' : '🟡';
    if (m.form === 'Tablet') glyph = '⚪';
    if (m.form === 'Powder') glyph = '🥤';
    if (m.form === 'Softgel') glyph = '🟠';
    return '<span class="med-thumb" style="background:'+tones[0]+';color:'+tones[1]+'" aria-hidden="true">'+glyph+'</span>';
  }
  function trendChip(pct, invert){
    if (pct == null) return '';
    var up = pct >= 0;
    var good = invert ? !up : up;
    var cls = pct === 0 ? 'flat' : (good ? 'down' : 'up'); // demand-up = amber pressure
    var ico = up ? MF.ICONS.trendUp : MF.ICONS.trendDown;
    return '<span class="kpi-trend ' + cls + '">' + ico + Math.abs(pct) + '% vs last week</span>';
  }

  /* CSV download helper */
  function downloadCSV(filename, rows){
    var csv = rows.map(function(r){
      return r.map(function(c){
        c = String(c==null?'':c);
        return /[",\n]/.test(c) ? '"' + c.replace(/"/g,'""') + '"' : c;
      }).join(',');
    }).join('\r\n');
    var blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  function debounce(fn, ms){
    var t; return function(){ var a=arguments, self=this;
      clearTimeout(t); t = setTimeout(function(){ fn.apply(self,a); }, ms||200); };
  }

  function photoImg(src, alt, captionTitle, captionSub){
    return '<div class="photo-panel">' +
      '<div class="photo-fallback" aria-hidden="true"></div>' +
      '<img src="' + src + '" alt="' + esc(alt) + '" loading="lazy" ' +
        'onerror="this.style.display=\'none\'" />' +
      '<div class="pp-shade"></div>' +
      (captionTitle ? '<div class="pp-caption"><b>'+esc(captionTitle)+'</b>'+(captionSub?'<span>'+esc(captionSub)+'</span>':'')+'</div>' : '') +
    '</div>';
  }

  return {
    esc:esc, fmt:fmt, toast:toast, modal:modal,
    attachMenu:attachMenu, closeAllMenus:closeAllMenus,
    countUp:countUp, skeletonKpis:skeletonKpis, skeletonChart:skeletonChart, skeletonTable:skeletonTable,
    badge:badge, statusBadge:statusBadge, priorityBadge:priorityBadge,
    medThumb:medThumb, trendChip:trendChip, downloadCSV:downloadCSV,
    debounce:debounce, photoImg:photoImg
  };
})();
