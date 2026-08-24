/* ============================================================
   Medi Forecaster — Chart engine (Chart.js wrappers)
   ============================================================ */
window.MF = window.MF || {};

MF.charts = (function(){
  var registry = [];
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function destroyAll(){
    registry.forEach(function(c){ try{ c.destroy(); }catch(e){} });
    registry = [];
  }

  function baseOpts(extra){
    var o = {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      animation: reduced ? false : { duration:950, easing:'easeOutQuart' },
      plugins:{
        legend:{ display:false },
        tooltip:{
          backgroundColor:'#12203A', titleColor:'#fff', bodyColor:'#DCE4F2',
          padding:{x:14,y:11}, cornerRadius:10, boxPadding:5, usePointStyle:true,
          titleFont:{ family:'Manrope', weight:'700', size:12.5 },
          bodyFont:{ family:'Inter', size:12.5 }
        }
      },
      scales:{
        x:{
          grid:{ display:false }, border:{ display:false },
          ticks:{ color:'#8593A9', font:{ size:11, weight:'600' }, maxRotation:0, autoSkip:true, maxTicksLimit:10 }
        },
        y:{
          beginAtZero:true, border:{ display:false, dash:[3,5] },
          grid:{ color:'#EDF1F7' },
          ticks:{ color:'#8593A9', font:{ size:11, weight:'600' }, padding:8, maxTicksLimit:6 }
        }
      }
    };
    return deepAssign(o, extra || {});
  }

  function deepAssign(t, s){
    Object.keys(s).forEach(function(k){
      if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])){
        if (!t[k]) t[k] = {};
        deepAssign(t[k], s[k]);
      } else t[k] = s[k];
    });
    return t;
  }

  /* Forecast-zone plugin: shades the future area + "TODAY" divider + FORECAST tag */
  function zonePlugin(){
    return {
      id:'forecastZone',
      afterDatasetsDraw:function(chart, args, opts){
        var split = opts.split; if (split == null) return;
        var ctx = chart.ctx, area = chart.chartArea;
        if (!area) return;
        var x = chart.scales.x.getPixelForValue(split + 0.5);
        x = Math.min(Math.max(x, area.left), area.right);
        /* future tint */
        var grad = ctx.createLinearGradient(x, 0, area.right, 0);
        grad.addColorStop(0, 'rgba(25,179,188,.13)');
        grad.addColorStop(1, 'rgba(34,184,212,.05)');
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, area.top, area.right - x, area.bottom - area.top);
        ctx.clip();
        ctx.fillStyle = grad;
        ctx.fillRect(x, area.top, area.right - x, area.bottom - area.top);
        ctx.restore();
        /* divider */
        ctx.save();
        ctx.setLineDash([5,5]);
        ctx.strokeStyle = 'rgba(27,91,214,.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, area.top); ctx.lineTo(x, area.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        /* TODAY chip */
        ctx.fillStyle = '#1B5BD6';
        roundRect(ctx, x-26, area.top+2, 52, 20, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '700 10px Inter, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('TODAY', x, area.top+12.5);
        ctx.restore();
      }
    };
  }

  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function gradient(ctx, colorTop, colorBottom){
    var g = ctx.createLinearGradient(0,0,0,300);
    g.addColorStop(0, colorTop); g.addColorStop(1, colorBottom);
    return g;
  }

  /*
    lineChart(el, {
      labels:[...], actual:[...], forecast:[...], split:index,
      height class handled by caller; el is canvas
    })
  */
  function lineChart(canvas, cfg){
    if (!window.Chart){ fallbackNote(canvas.parentNode); return null; }
    var ctx = canvas.getContext('2d');
    var actualFill = gradient(ctx,'rgba(27,91,214,.16)','rgba(27,91,214,0)');
    var labels = cfg.labels;
    var split = cfg.split != null ? cfg.split : cfg.splitInt;

    var actual = [], forecast = [];
    for (var i=0;i<labels.length;i++){
      if (i < split){ actual.push(cfg.actual[i]); forecast.push(null); }
      else if (i === split){ actual.push(cfg.actual[split]); forecast.push(cfg.actual[split]); }
      else { actual.push(null); forecast.push(cfg.forecast[i]); }
    }

    var dsActual = {
      label:'Actual Demand', data:actual,
      borderColor:'#1B5BD6', borderWidth:2.6, tension:.38,
      pointRadius:0, pointHoverRadius:5,
      pointBackgroundColor:'#1B5BD6', pointBorderColor:'#fff', pointBorderWidth:2,
      fill:true, backgroundColor:actualFill
    };
    var dsForecast = {
      label:'Forecast Demand', data:forecast,
      borderColor:'#0FA3A3', borderWidth:2.6, tension:.38, borderDash:[6,5],
      pointRadius:function(c){ return c.dataIndex > split ? 2.5 : 0; },
      pointHoverRadius:5,
      pointBackgroundColor:'#0FA3A3', pointBorderColor:'#fff', pointBorderWidth:2,
      fill:false
    };

    var chart = new Chart(ctx, {
      type:'line',
      data:{ labels:labels, datasets:[dsActual, dsForecast] },
      options:baseOpts({
        plugins:{
          forecastZone:{ split:split },
          tooltip:{ callbacks:{
            title:function(items){ return items.length ? items[0].label : ''; },
            label:function(item){
              var v = item.parsed.y; if (v == null) return '';
              return item.dataset.label + ': ' + v.toLocaleString() + ' units';
            }
          }}
        }
      })
    });
    registry.push(chart);
    return chart;
  }

  function barChart(canvas, cfg){
    if (!window.Chart){ fallbackNote(canvas.parentNode); return null; }
    var ctx = canvas.getContext('2d');
    var chart = new Chart(ctx, {
      type:'bar',
      data:{
        labels:cfg.labels,
        datasets:[{
          label:cfg.seriesLabel||'Units',
          data:cfg.values,
          backgroundColor:cfg.colors || 'rgba(27,91,214,.75)',
          hoverBackgroundColor:cfg.hoverColors || '#1B5BD6',
          borderRadius:8, maxBarThickness:cfg.maxBar||34
        }]
      },
      options:baseOpts({
        plugins:{ tooltip:{ callbacks:{ label:function(i){
          return (i.dataset.label)+': '+i.parsed.y.toLocaleString();
        }}}}
      })
    });
    registry.push(chart);
    return chart;
  }

  function fallbackNote(box){
    if (!box) return;
    var d = document.createElement('div');
    d.style.cssText='display:flex;height:100%;align-items:center;justify-content:center;color:#8593A9;font-size:13px;text-align:center;padding:20px';
    d.innerHTML='<div><b>Chart unavailable offline.</b><br>Connect to the internet once to load the chart library.</div>';
    box.appendChild(d);
  }

  /* Tiny inline-SVG sparkline for cards / report previews */
  function sparkline(values, opt){
    opt = opt || {};
    var w = opt.w||120, h = opt.h||36, stroke = opt.color||'#1B5BD6', dashed = opt.dashed;
    var min = Math.min.apply(null,values), max = Math.max.apply(null,values);
    var range = (max-min)||1;
    var pts = values.map(function(v,i){
      var x = (i/(values.length-1))*(w-6)+3;
      var y = h-4-((v-min)/range)*(h-10);
      return [Math.round(x*10)/10, Math.round(y*10)/10];
    });
    var dLine = pts.map(function(p,i){ return (i?'L':'M')+p[0]+' '+p[1]; }).join(' ');
    var dArea = dLine + ' L'+pts[pts.length-1][0]+' '+h+' L'+pts[0][0]+' '+h+' Z';
    var gid = 'sg'+Math.random().toString(36).slice(2,8);
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true">'+
      '<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1">'+
      '<stop offset="0" stop-color="'+stroke+'" stop-opacity=".22"/><stop offset="1" stop-color="'+stroke+'" stop-opacity="0"/></linearGradient></defs>'+
      '<path d="'+dArea+'" fill="url(#'+gid+')"/>'+
      '<path d="'+dLine+'" fill="none" stroke="'+stroke+'" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"'+
      (dashed?' stroke-dasharray="1 6"':'')+'/></svg>';
  }

  return { lineChart:lineChart, barChart:barChart, sparkline:sparkline, destroyAll:destroyAll, zonePlugin:zonePlugin, reduced:reduced };
})();
