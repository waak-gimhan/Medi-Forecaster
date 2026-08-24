/* ============================================================
   Medi Forecaster — Icon set & brand / illustration assets
   ============================================================ */
window.MF = window.MF || {};

MF.ICONS = (function(){
  var S = function(p, extra){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra||'') + '>' + p + '</svg>';
  };
  return {
    grid:      S('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="4.5" rx="2"/><rect x="13.5" y="12" width="7" height="8.5" rx="2"/><rect x="3.5" y="14.5" width="7" height="6" rx="2"/>'),
    spark:     S('<path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>'),
    cart:      S('<path d="M4 5h2l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.2L21 8H7"/><circle cx="10.5" cy="20.4" r="1.4"/><circle cx="17.5" cy="20.4" r="1.4"/><path d="M13 3v4M11 5h4"/>'),
    pill:      S('<rect x="3.2" y="8.6" width="17.6" height="6.8" rx="3.4" transform="rotate(-38 12 12)"/><path d="M9.1 9.2l5.8 5.6"/>'),
    receipt:   S('<path d="M6 3h12v18l-2.4-1.6L13.2 21l-2.4-1.6L8.4 21 6 19.4z"/><path d="M9.4 8h5.2M9.4 11.5h5.2M9.4 15h3.2"/>'),
    report:    S('<path d="M7 3h7l4.5 4.5V21H7z"/><path d="M14 3v5h4.5"/><path d="M10 16.5v-3M13 16.5v-5.5M16 16.5v-2"/>'),
    gear:      S('<circle cx="12" cy="12" r="3.2"/><path d="M19 12c0-.5.4-1 .9-1.2l1.2-.4-.9-2.6-1.3.3c-.6.1-1.2-.1-1.6-.6s-.5-1.1-.3-1.7l.5-1.2-2.4-1.4-.8 1c-.4.5-1 .7-1.6.7s-1.2-.2-1.6-.7l-.8-1L7.9 4.6l.5 1.2c.2.6.1 1.2-.3 1.7-.4.5-1 .7-1.6.6l-1.3-.3-.9 2.6 1.2.4c.5.2.9.7.9 1.2s-.4 1-.9 1.2l-1.2.4.9 2.6 1.3-.3c.6-.1 1.2.1 1.6.6.4.5.5 1.1.3 1.7l-.5 1.2 2.4 1.4.8-1c.4-.5 1-.7 1.6-.7s1.2.2 1.6.7l.8 1 2.4-1.4-.5-1.2c-.2-.6-.1-1.2.3-1.7.4-.5 1-.7 1.6-.6l1.3.3.9-2.6-1.2-.4c-.5-.2-.9-.7-.9-1.2z"/>'),
    bell:      S('<path d="M18 9.5a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15.5 18 9.5"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/>'),
    search:    S('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
    calendar:  S('<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10.5h16"/>'),
    chevD:     S('<path d="M6 9l6 6 6-6"/>'),
    chevR:     S('<path d="M9 6l6 6-6 6"/>'),
    arrowR:    S('<path d="M4 12h16M13 5l7 7-7 7"/>'),
    arrowUR:   S('<path d="M6 18L18 6M9 6h9v9"/>'),
    arrowDR:   S('<path d="M6 6l12 12M18 9v9H9"/>'),
    plus:      S('<path d="M12 5v14M5 12h14"/>'),
    check:     S('<path d="M4.5 12.5l5 5 10-11"/>'),
    x:         S('<path d="M6 6l12 12M18 6L6 18"/>'),
    alertT:    S('<path d="M12 3.5 22 20H2z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".4" fill="currentColor"/>'),
    alertC:    S('<circle cx="12" cy="12" r="8.6"/><path d="M12 8v4.6"/><circle cx="12" cy="15.8" r=".4" fill="currentColor"/>'),
    info:      S('<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".4" fill="currentColor"/>'),
    clock:     S('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.2 2"/>'),
    filter:    S('<path d="M4 6h16M7.5 12h9M10.5 18h3"/>'),
    download:  S('<path d="M12 4v11M7.5 11l4.5 4.5L16.5 11"/><path d="M5 19.5h14"/>'),
    printer:   S('<path d="M7 8V4h10v4"/><rect x="4" y="8" width="16" height="8.5" rx="2"/><path d="M7 14h10v6H7z"/>'),
    external:  S('<path d="M14 5h5v5"/><path d="M19 5l-8 8"/><path d="M19 14v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18V7a1.5 1.5 0 0 1 1.5-1.5H10"/>'),
    menu:      S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    user:      S('<circle cx="12" cy="8.2" r="3.6"/><path d="M5 20c.8-3.4 3.6-5.2 7-5.2s6.2 1.8 7 5.2"/>'),
    logout:    S('<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 8l-4 4 4 4M6 12h10"/>'),
    sync:      S('<path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3"/><path d="M4 4v4h4M20 20v-4h-4"/>'),
    zap:       S('<path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5z"/>'),
    shield:    S('<path d="M12 3l7.5 3v5.5c0 4.6-3 8-7.5 9.5-4.5-1.5-7.5-4.9-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>'),
    box:       S('<path d="M3.8 7.8 12 3.5l8.2 4.3v8.4L12 20.5l-8.2-4.3z"/><path d="M3.8 7.8 12 12l8.2-4.2M12 12v8.5"/>'),
    eye:       S('<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'),
    edit:      S('<path d="M4 20h4.2L19.4 8.8a2.1 2.1 0 0 0 0-3L18.2 4.6a2.1 2.1 0 0 0-3 0L4 15.8z"/><path d="M14.5 6.3l3.2 3.2"/>'),
    trash:     S('<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/><path d="M10.5 11v5M13.5 11v5"/>'),
    sortAsc:   S('<path d="M12 6v12M7 11l5-5 5 5"/>'),
    trendUp:   S('<path d="M4 17l5.2-5.2 3.4 3.4L20 8"/><path d="M14.5 8H20v5.5"/>'),
    trendDown: S('<path d="M4 7l5.2 5.2 3.4-3.4L20 16"/><path d="M14.5 16H20v-5.5"/>'),
    dash:      S('<path d="M4 12h16"/>'),
    wifiOff:   S('<path d="M3 3l18 18"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 3-2M16 11a10 10 0 0 1 3 2"/><path d="M2 9.5A14.5 14.5 0 0 1 7 6.3M22 9.5a14.6 14.6 0 0 0-9-3.4c-.7 0-1.4 0-2 .2"/><circle cx="12" cy="19.5" r=".5" fill="currentColor"/>'),
    plug:      S('<path d="M9 3v5M15 3v5"/><path d="M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0z"/><path d="M12 17v4"/>'),
    fileDown:  S('<path d="M7 3h7l4.5 4.5V21H7z"/><path d="M14 3v5h4.5"/><path d="M12 10.5V17M9.5 14.5 12 17l2.5-2.5"/>'),
    history:   S('<path d="M4 5.5v4h4"/><path d="M4.6 9.5A8.5 8.5 0 1 1 3.5 13"/><path d="M12 8v4.5l3 1.8"/>'),
    target:    S('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
    layers:    S('<path d="M12 3.5 3.5 8 12 12.5 20.5 8z"/><path d="M3.5 12.5 12 17l8.5-4.5M3.5 17 12 21.5l8.5-4.5"/>'),
    sun:       S('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/>')
  };
})();

/* Inject sidebar/topbar static icons */
MF.hydrateIcons = function(rootEl){
  (rootEl || document).querySelectorAll('[data-ico]').forEach(function(el){
    var name = el.getAttribute('data-ico');
    if (MF.ICONS[name]) el.innerHTML = MF.ICONS[name];
  });
};

/* ---------- Brand / decorative SVG artwork ---------- */

/* Floating pseudo-3D medicine bottle + capsule composition (dashboard hero, med details) */
MF.artBottle = function(opts){
  opts = opts || {};
  return '' +
  '<svg viewBox="0 0 220 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs>' +
      '<linearGradient id="btBody" x1="60" y1="70" x2="170" y2="190" gradientUnits="userSpaceOnUse">' +
        '<stop stop-color="#EAF2FE"/><stop offset=".55" stop-color="#CFE0FA"/><stop offset="1" stop-color="#AECBF3"/>' +
      '</linearGradient>' +
      '<linearGradient id="btCap" x1="78" y1="34" x2="150" y2="66" gradientUnits="userSpaceOnUse">' +
        '<stop stop-color="#1B5BD6"/><stop offset="1" stop-color="#123E96"/>' +
      '</linearGradient>' +
      '<linearGradient id="btGlass" x1="90" y1="80" x2="120" y2="180" gradientUnits="userSpaceOnUse">' +
        '<stop stop-color="#ffffff" stop-opacity=".85"/><stop offset="1" stop-color="#ffffff" stop-opacity=".25"/>' +
      '</linearGradient>' +
      '<linearGradient id="cpHalf" x1="150" y1="120" x2="205" y2="165" gradientUnits="userSpaceOnUse">' +
        '<stop stop-color="#19B3BC"/><stop offset="1" stop-color="#0C8B8B"/>' +
      '</linearGradient>' +
      '<linearGradient id="cpHalf2" x1="150" y1="120" x2="205" y2="165" gradientUnits="userSpaceOnUse">' +
        '<stop stop-color="#FDFDFE"/><stop offset="1" stop-color="#DCE7F6"/>' +
      '</linearGradient>' +
    '</defs>' +
    /* shadow */
    '<ellipse cx="108" cy="192" rx="72" ry="11" fill="#12203A" opacity=".08"/>' +
    /* bottle body */
    '<g class="floaty">' +
      '<rect x="62" y="62" width="92" height="126" rx="20" fill="url(#btBody)" stroke="#9DBBE8" stroke-width="1.5"/>' +
      '<rect x="84" y="40" width="48" height="30" rx="9" fill="url(#btCap)"/>' +
      '<rect x="84" y="52" width="48" height="4" fill="#0D2F73" opacity=".35"/>' +
      '<rect x="76" y="96" width="64" height="58" rx="9" fill="#fff"/>' +
      '<rect x="76" y="96" width="64" height="58" rx="9" stroke="#D8E4F6"/>' +
      /* label pulse line */
      '<polyline points="84,138 94,138 99,124 105,146 111,130 116,136 132,136" stroke="#1B5BD6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<rect x="86" y="106" width="26" height="5" rx="2.5" fill="#C9D8EF"/>' +
      '<rect x="86" y="115" width="36" height="4" rx="2" fill="#E2EAF6"/>' +
      /* glass shine */
      '<rect x="70" y="74" width="10" height="102" rx="5" fill="url(#btGlass)" opacity=".8"/>' +
    '</g>' +
    /* capsule */
    '<g transform="rotate(-32 172 142)">' +
      '<g class="floaty-slow">' +
        '<path d="M148 129 a19 19 0 0 1 38 0 v26 a19 19 0 0 1 -38 0 z" fill="url(#cpHalf2)" stroke="#C4D4EA"/>' +
        '<path d="M186 129 v26 a19 19 0 0 1 -38 0" fill="url(#cpHalf)" opacity=".95"/>' +
        '<line x1="167" y1="112" x2="167" y2="174" stroke="#0C8B8B" stroke-width="1.4" opacity=".55"/>' +
        '<ellipse cx="158" cy="126" rx="4" ry="9" fill="#fff" opacity=".5" transform="rotate(8 158 126)"/>' +
      '</g>' +
    '</g>' +
    /* cross bubble */
    '<g class="floaty-slow" style="animation-delay:.8s">' +
      '<circle cx="46" cy="88" r="15" fill="#fff" stroke="#D8E4F6"/>' +
      '<path d="M46 81v14M39 88h14" stroke="#19B3BC" stroke-width="3.4" stroke-linecap="round"/>' +
    '</g>' +
    /* mini forecast spark */
    '<g class="floaty-slow" style="animation-delay:.4s">' +
      '<circle cx="196" cy="70" r="5.5" fill="#38E1D6"/>' +
      '<polyline points="160,84 176,74 188,79 200,64" stroke="#1B5BD6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".65"/>' +
    '</g>' +
  '</svg>';
};

/* Isometric pharmacy purchase box */
MF.artBox = function(){
  return '' +
  '<svg viewBox="0 0 200 170" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs>' +
      '<linearGradient id="bxTop" x1="40" y1="30" x2="160" y2="80" gradientUnits="userSpaceOnUse"><stop stop-color="#FFE1B0"/><stop offset="1" stop-color="#F6C87E"/></linearGradient>' +
      '<linearGradient id="bxL" x1="40" y1="70" x2="100" y2="160" gradientUnits="userSpaceOnUse"><stop stop-color="#EDAA56"/><stop offset="1" stop-color="#D98F3B"/></linearGradient>' +
      '<linearGradient id="bxR" x1="110" y1="70" x2="170" y2="160" gradientUnits="userSpaceOnUse"><stop stop-color="#FBCE8C"/><stop offset="1" stop-color="#E8AC5C"/></linearGradient>' +
    '</defs>' +
    '<ellipse cx="100" cy="152" rx="70" ry="10" fill="#12203A" opacity=".07"/>' +
    '<g class="floaty-slow">' +
      '<path d="M40 62 L100 34 L160 62 L100 90 Z" fill="url(#bxTop)"/>' +
      '<path d="M40 62 L100 90 V148 L40 120 Z" fill="url(#bxL)"/>' +
      '<path d="M160 62 L100 90 V148 L160 120 Z" fill="url(#bxR)"/>' +
      '<path d="M70 76 L100 62 L130 76" stroke="#B97B2E" stroke-width="2" opacity=".5" fill="none"/>' +
      '<g transform="translate(84 96)">' +
        '<rect width="32" height="32" rx="8" fill="#fff" opacity=".92"/>' +
        '<path d="M16 8v16M8 16h16" stroke="#D33A2F" stroke-width="4" stroke-linecap="round"/>' +
      '</g>' +
    '</g>' +
    '<g class="floaty"><circle cx="168" cy="42" r="6" fill="#19B3BC" opacity=".8"/></g>' +
    '<g class="floaty-slow"><circle cx="30" cy="44" r="4.5" fill="#1B5BD6" opacity=".55"/></g>' +
  '</svg>';
};

/* Empty-state artwork: dashed future chart */
MF.artEmptyChart = function(){
  return '' +
  '<svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="18" y="14" width="164" height="104" rx="14" fill="#fff" stroke="#D9E2EE" stroke-width="2"/>' +
    '<line x1="118" y1="14" x2="118" y2="118" stroke="#CBD8EA" stroke-width="1.6" stroke-dasharray="4 5"/>' +
    '<rect x="119" y="15" width="62" height="102" rx="12" fill="#E9F8F7" opacity=".7"/>' +
    '<polyline points="30,96 50,84 66,92 84,68 102,74 117,58" stroke="#1B5BD6" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
    '<polyline points="117,58 134,66 150,52 170,58" stroke="#0FA3A3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 8" fill="none"/>' +
    '<circle cx="117" cy="58" r="5" fill="#fff" stroke="#1B5BD6" stroke-width="3"/>' +
    '<text x="128" y="30" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="#0C8B8B" letter-spacing="1">FORECAST?</text>' +
    '<circle cx="152" cy="112" r="13" fill="#EFF4FB" stroke="#D9E2EE" stroke-width="2"/>' +
    '<path d="M147 112l3.4 3.4 6.4-7" stroke="#8593A9" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
  '</svg>';
};

/* Empty-state artwork: open box */
MF.artEmptyBox = function(){
  return '' +
  '<svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M52 62 L100 40 L148 62 L100 84 Z" fill="#F6C87E"/>' +
    '<path d="M52 62 L100 84 V122 L52 100 Z" fill="#EDAA56"/>' +
    '<path d="M148 62 L100 84 V122 L148 100 Z" fill="#FBCE8C"/>' +
    '<path d="M52 62 L28 50 L76 28 L100 40 Z" fill="#FFE1B0"/>' +
    '<path d="M148 62 L172 50 L124 28 L100 40 Z" fill="#FFDDA6"/>' +
    '<circle cx="100" cy="63" r="4" fill="#B97B2E" opacity=".6"/>' +
    '<g class="floaty"><circle cx="163" cy="30" r="5" fill="#19B3BC" opacity=".75"/></g>' +
    '<g class="floaty-slow"><circle cx="38" cy="26" r="4" fill="#1B5BD6" opacity=".5"/></g>' +
  '</svg>';
};

/* Empty-state artwork: receipt */
MF.artEmptyReceipt = function(){
  return '' +
  '<svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M66 18h68v104l-9-6-8 6-8-6-9 6-8-6-9 6-8-6-9 6z" fill="#fff" stroke="#D9E2EE" stroke-width="2"/>' +
    '<rect x="78" y="34" width="44" height="7" rx="3.5" fill="#E4EBF5"/>' +
    '<rect x="78" y="49" width="30" height="6" rx="3" fill="#EDF2F9"/>' +
    '<rect x="78" y="61" width="38" height="6" rx="3" fill="#EDF2F9"/>' +
    '<rect x="78" y="73" width="26" height="6" rx="3" fill="#EDF2F9"/>' +
    '<g class="floaty"><circle cx="140" cy="98" r="15" fill="#E9F8F7" stroke="#9ADCD9" stroke-width="2"/>' +
    '<path d="M133 98l4.6 4.6 9-10" stroke="#0FA3A3" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></g>' +
  '</svg>';
};
