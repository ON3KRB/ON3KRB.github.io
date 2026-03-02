/* ============================================================
   ON3KRB — QSL Card Generator v2  |  contact.js
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('qslCanvas');
  const ctx    = canvas.getContext('2d');

  /* Standard QSL: 148×105 mm → rendered at 2× = 1480×1050 px */
  const W = 1480;
  const H = 1050;
  canvas.width  = W;
  canvas.height = H;

  /* ── Palette ── */
  const C = {
    bg:      '#03060e',
    green:   '#00ff88',
    cyan:    '#00d4ff',
    amber:   '#f0a500',
    white:   '#e2eaf5',
    grey:    '#7a8faa',
    dark:    '#3a4f66',
  };

  /* ── Helpers ── */
  const TAU = Math.PI * 2;
  function glow(col, blur)  { ctx.shadowColor = col; ctx.shadowBlur = blur; }
  function noGlow()         { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; }
  function rgba(hex, a) {
    const r = parseInt(hex.slice(1,3),16),
          g = parseInt(hex.slice(3,5),16),
          b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ════════════════════════════════════════════════════════
     MAIN DRAW
  ════════════════════════════════════════════════════════ */
  function drawCard(data) {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawGrid();
    drawTopBars();
    drawIonosphereScene();
    drawLeftPanel();
    drawDivider();
    drawQSOPanel(data);
    drawStamp(W - 155, H - 165, 128);
    drawBottomMorse();
    drawBorderFrame();
  }

  /* ── Background ── */
  function drawBackground() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    const g1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 700);
    g1.addColorStop(0, 'rgba(0,255,136,0.07)');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W, H * 0.3, 0, W, H * 0.3, 560);
    g2.addColorStop(0, 'rgba(0,180,255,0.06)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
  }

  /* ── Grid ── */
  function drawGrid() {
    ctx.strokeStyle = 'rgba(0,255,136,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  }

  /* ── Top colour bar ── */
  function drawTopBars() {
    const tg = ctx.createLinearGradient(0,0,W,0);
    tg.addColorStop(0,    C.green);
    tg.addColorStop(0.45, C.cyan);
    tg.addColorStop(0.85, C.amber);
    tg.addColorStop(1,    C.green);
    ctx.fillStyle = tg;
    ctx.fillRect(0, 0, W, 6);
  }

  /* ── Ionospheric propagation graphic (right side, y 10–490) ── */
  function drawIonosphereScene() {
    const rx = 575, ry = 12, rw = W - rx - 14, rh = 478;
    ctx.save();
    ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();

    const cx = rx + rw / 2;
    const earthR  = 800;
    const groundY = ry + rh + 160;  /* earth centre far below clip */

    /* Earth */
    drawEarth(cx, groundY, earthR, ry, rh);

    /* Ionosphere layers */
    const layers = [
      { name:'D',  r: earthR + 150, a: 0.06, col:'cyan'  },
      { name:'E',  r: earthR + 280, a: 0.09, col:'cyan'  },
      { name:'F1', r: earthR + 430, a: 0.07, col:'green' },
      { name:'F2', r: earthR + 580, a: 0.15, col:'green' },
    ];
    layers.forEach(l => drawLayer(cx, groundY, l));

    /* Signal path TX → F2 → RX */
    const txX = rx + 110;
    const rxX = W - 90;
    function surfaceY(x) {
      const dx = x - cx;
      return groundY - Math.sqrt(Math.max(0, earthR * earthR - dx * dx));
    }
    const txY = surfaceY(txX) - 18;
    const rxY = surfaceY(rxX) - 18;
    const bx  = cx;
    const by  = groundY - (earthR + 580);   /* top of F2 */

    drawSignalPath(txX, txY, bx, by, rxX, rxY);
    drawAntennaIcon(txX, txY, 58, C.green);
    drawAntennaIcon(rxX, rxY, 42, C.cyan);

    /* Layer labels */
    ctx.font = '500 18px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    layers.forEach(l => {
      const ly = groundY - l.r - 5;
      if (ly > ry + 8 && ly < ry + rh - 8) {
        ctx.fillStyle = l.col === 'green' ? rgba(C.green, 0.35) : rgba(C.cyan, 0.35);
        ctx.fillText(l.name + ' LAYER', cx + earthR * 0.52, ly);
      }
    });

    /* Title */
    ctx.font = '700 20px "Orbitron", monospace';
    ctx.fillStyle = rgba(C.cyan, 0.20);
    ctx.textAlign = 'center';
    ctx.fillText('IONOSPHERIC PROPAGATION', cx, ry + 26);

    /* HF Skip label */
    ctx.font = '500 20px "Share Tech Mono", monospace';
    ctx.fillStyle = rgba(C.amber, 0.60);
    ctx.textAlign = 'center';
    ctx.fillText('HF SKIP', bx, by - 20);
    glow(C.amber, 14);
    ctx.beginPath(); ctx.arc(bx, by, 7, 0, TAU);
    ctx.fillStyle = C.amber; ctx.fill();
    noGlow();

    ctx.restore();
  }

  function drawEarth(cx, cy, r, clipTop, clipH) {
    /* Ocean tint */
    const eg = ctx.createRadialGradient(cx, cy, r * 0.86, cx, cy, r);
    eg.addColorStop(0, 'rgba(0,30,60,0.0)');
    eg.addColorStop(1, 'rgba(0,80,140,0.22)');
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = eg; ctx.fill();
    /* Surface ring */
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
    ctx.strokeStyle = rgba(C.cyan, 0.20); ctx.lineWidth = 2; ctx.stroke();
    /* Continent dots */
    const dots = [
      -220,-180,-140,-100,-60,-20,20,60,100,140,180,200,
      -50,-90,30,80,-160
    ];
    ctx.fillStyle = rgba(C.green, 0.18);
    dots.forEach(dx => {
      const sy = cy - Math.sqrt(Math.max(0, r*r - dx*dx)) - 12;
      if (sy > clipTop + 10) {
        ctx.beginPath(); ctx.arc(cx + dx, sy, 4, 0, TAU); ctx.fill();
      }
    });
  }

  function drawLayer(cx, cy, layer) {
    ctx.beginPath();
    ctx.arc(cx, cy, layer.r, 0, TAU);
    ctx.strokeStyle = layer.col === 'green'
      ? rgba(C.green, layer.a)
      : rgba(C.cyan,  layer.a);
    ctx.lineWidth = layer.name === 'F2' ? 2.5 : 1.5;
    ctx.setLineDash(layer.name === 'F2' ? [] : [12, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSignalPath(x1, y1, bx, by, x2, y2) {
    function arc(ax, ay, cpx, cpy, ex, ey) {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      ctx.strokeStyle = rgba(C.amber, 0.65);
      ctx.lineWidth = 2.5;
      ctx.setLineDash([14, 7]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    glow(C.amber, 12);
    arc(x1, y1, bx - (bx - x1) * 0.05, (by + y1) / 2 - 30, bx, by);
    arc(bx, by, bx + (x2 - bx) * 0.5,  (by + y2) / 2 + 30, x2, y2);
    noGlow();
  }

  function drawAntennaIcon(x, y, h, col) {
    ctx.save();
    ctx.strokeStyle = typeof col === 'string' && col.startsWith('#') ? rgba(col, 0.70) : col;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 16, y + h); ctx.lineTo(x + 16, y + h); ctx.stroke();
    [[0.15, 36],[0.4, 28],[0.65, 20],[0.85, 14]].forEach(([p, hw]) => {
      const ey = y + h * p;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x - hw, ey); ctx.lineTo(x + hw, ey); ctx.stroke();
    });
    glow(col, 10);
    ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU);
    ctx.fillStyle = col; ctx.fill();
    noGlow();
    ctx.restore();
  }

  /* ── Left panel: identity ── */
  function drawLeftPanel() {
    const x = 52;

    /* "QSL CARD" amber pill */
    ctx.save();
    ctx.font = '700 24px "Orbitron", monospace';
    const pw = ctx.measureText('QSL CARD').width + 36;
    ctx.beginPath();
    roundRect(x, 20, pw, 42, 8);
    ctx.fillStyle = rgba(C.amber, 0.10); ctx.fill();
    ctx.strokeStyle = rgba(C.amber, 0.35); ctx.lineWidth = 1.2; ctx.stroke();
    glow(C.amber, 8);
    ctx.fillStyle = C.amber;
    ctx.textAlign = 'left';
    ctx.fillText('QSL CARD', x + 18, 49);
    noGlow();
    ctx.restore();

    /* ON3KRB callsign */
    ctx.font = '900 148px "Orbitron", monospace';
    ctx.textAlign = 'left';
    glow(C.green, 50);
    ctx.fillStyle = C.green;
    ctx.fillText('ON3KRB', x, 222);
    noGlow();

    /* Line under callsign */
    const lg = ctx.createLinearGradient(x, 0, x + 520, 0);
    lg.addColorStop(0, C.green); lg.addColorStop(0.7, rgba(C.cyan, 0.4)); lg.addColorStop(1, 'transparent');
    ctx.fillStyle = lg;
    ctx.fillRect(x, 234, 520, 2);

    /* Name & QTH */
    ctx.font = '300 34px "DM Sans", sans-serif';
    ctx.fillStyle = C.grey;
    ctx.textAlign = 'left';
    ctx.fillText('Kristof  ·  Hoboken, Antwerpen  ·  Belgium', x, 280);

    /* Grid locator only */
    ctx.font = '600 30px "Share Tech Mono", monospace';
    glow(C.cyan, 8);
    ctx.fillStyle = C.cyan;
    ctx.fillText('JO21GF', x, 324);
    noGlow();

    /* Belgian flag */
    const bx = x, by = 348, bh = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';     ctx.fillRect(bx,      by, 24, bh);
    ctx.fillStyle = 'rgba(255,215,0,0.80)'; ctx.fillRect(bx + 24, by, 24, bh);
    ctx.fillStyle = 'rgba(200,0,0,0.80)';   ctx.fillRect(bx + 48, by, 24, bh);
    ctx.font = '500 18px "Share Tech Mono", monospace';
    ctx.fillStyle = rgba(C.white, 0.45);
    ctx.textAlign = 'left';
    ctx.fillText('ON  BELGIUM  DXCC', bx + 80, by + 9);

    /* Small antenna + waves decorative */
    drawAntennaIcon(x + 22, 392, 84, rgba(C.green, 0.30));
    ctx.save();
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(x + 22, 392, i * 32, -Math.PI * 0.55, Math.PI * 0.55);
      ctx.strokeStyle = `rgba(0,255,136,${0.12 - i * 0.018})`;
      ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.restore();
  }

  /* ── Divider ── */
  function drawDivider() {
    const y = 498;
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0,    C.green);
    g.addColorStop(0.35, C.cyan);
    g.addColorStop(0.75, rgba(C.amber, 0.5));
    g.addColorStop(1,   'transparent');
    ctx.strokeStyle = g; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();

    [0, W * 0.33, W * 0.66].forEach(dx => {
      ctx.save();
      ctx.translate(dx, y); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = rgba(C.green, 0.5);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    });
  }

  /* ── QSO Data Panel (bottom zone y 504–1042) ── */
  function drawQSOPanel(data) {
    const zoneY = 504;

    /* Subtle tint */
    ctx.fillStyle = 'rgba(0,255,136,0.016)';
    ctx.fillRect(0, zoneY, W, H - zoneY - 8);

    /* Sub-label */
    ctx.font = '500 22px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(C.dark, 0.9);
    ctx.fillText('▸ CONFIRMING QSO WITH', 52, zoneY + 42);

    /* Columns */
    const cols = [
      { key:'call', label:'CALLSIGN',  x:  52, w: 310 },
      { key:'date', label:'DATE',      x: 380, w: 230 },
      { key:'utc',  label:'UTC',       x: 630, w: 160 },
      { key:'band', label:'BAND',      x: 810, w: 165 },
      { key:'mode', label:'MODE',      x: 995, w: 165 },
      { key:'rst',  label:"RST RX'D",  x:1178, w: 200 },
    ];

    const headerY = zoneY + 74;
    const valueY  = zoneY + 138;

    /* Header row */
    ctx.font = '500 20px "Share Tech Mono", monospace';
    ctx.fillStyle = C.dark;
    cols.forEach(c => { ctx.textAlign = 'left'; ctx.fillText(c.label, c.x, headerY); });

    /* Header underline */
    ctx.strokeStyle = rgba(C.dark, 0.4); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(52, headerY + 8); ctx.lineTo(W - 52, headerY + 8); ctx.stroke();

    /* Values */
    const vals = {
      call: (data.call  || 'YOUR CALL').toUpperCase(),
      date: formatDate(data.date),
      utc:  data.utc    || '--:--',
      band: data.band   || '20M',
      mode: (data.mode  || 'SSB').toUpperCase(),
      rst:  data.rst    || '599',
    };
    const colors = { call:C.green, date:C.white, utc:C.white, band:C.cyan, mode:C.amber, rst:C.white };
    const fonts  = {
      call:'800 68px "Orbitron", monospace',
      date:'500 52px "Share Tech Mono", monospace',
      utc: '500 52px "Share Tech Mono", monospace',
      band:'700 60px "Orbitron", monospace',
      mode:'700 60px "Orbitron", monospace',
      rst: '500 56px "Share Tech Mono", monospace',
    };

    cols.forEach(c => {
      ctx.fillStyle = colors[c.key];
      ctx.textAlign = 'left';
      if (c.key === 'call') glow(C.green, 20);
      else if (c.key === 'band') glow(C.cyan, 12);
      else if (c.key === 'mode') glow(C.amber, 10);
      fitText(vals[c.key], c.x, valueY, c.w, fonts[c.key]);
      noGlow();
    });

    /* Operator name */
    if (data.opName) {
      ctx.font = '300 30px "DM Sans", sans-serif';
      ctx.fillStyle = rgba(C.grey, 0.8);
      ctx.textAlign = 'left';
      ctx.fillText('OP: ' + data.opName.toUpperCase(), 52, valueY + 88);
    }

    /* 73 signature */
    ctx.font = '600 28px "Share Tech Mono", monospace';
    glow(C.green, 8);
    ctx.fillStyle = rgba(C.green, 0.55);
    ctx.textAlign = 'left';
    ctx.fillText('73 DE ON3KRB', 52, H - 36);
    noGlow();
  }

  /* ── Circular stamp ── */
  function drawStamp(cx, cy, r) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = rgba(C.green, 0.04); ctx.fill();

    [r, r - 16, r - 28].forEach((radius, i) => {
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, TAU);
      ctx.strokeStyle = rgba(C.green, 0.18 - i * 0.04);
      ctx.lineWidth = i === 0 ? 2 : 1; ctx.stroke();
    });

    /* Arc text */
    const arcText = 'ON3KRB · HOBOKEN · BELGIUM ·';
    ctx.font = '700 17px "Orbitron", monospace';
    ctx.fillStyle = rgba(C.green, 0.50);
    const arcR = r - 9;
    arcText.split('').forEach((ch, i) => {
      const angle = (i / arcText.length) * TAU - Math.PI / 2;
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(angle);
      ctx.translate(0, -arcR); ctx.rotate(Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });

    /* Centre locator */
    ctx.font = '600 20px "Share Tech Mono", monospace';
    ctx.fillStyle = rgba(C.cyan, 0.50);
    ctx.textAlign = 'center';
    ctx.fillText('JO21GF', cx, cy + 7);

    glow(C.green, 14);
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU);
    ctx.fillStyle = rgba(C.green, 0.5); ctx.fill();
    noGlow();
    ctx.restore();
  }

  /* ── Morse decoration ── */
  function drawBottomMorse() {
    ctx.font = '300 18px "Share Tech Mono", monospace';
    ctx.fillStyle = rgba(C.green, 0.10);
    ctx.textAlign = 'center';
    ctx.fillText('--. ...   -.. .   --- -. ...   -.- .-. -...', W / 2, H - 14);
  }

  /* ── Border frame ── */
  function drawBorderFrame() {
    const g = ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0, C.green); g.addColorStop(0.5, C.cyan); g.addColorStop(1, C.amber);
    ctx.fillStyle = g;
    ctx.fillRect(0, H - 6, W, 6);

    const sg = ctx.createLinearGradient(0, 0, 0, H);
    sg.addColorStop(0, C.green); sg.addColorStop(0.5, rgba(C.cyan, 0.4)); sg.addColorStop(1, C.amber);
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, 5, H);
    ctx.fillRect(W - 5, 0, 5, H);

    [[5,6],[W-5,6],[5,H-6],[W-5,H-6]].forEach(([x,y]) => {
      glow(C.green, 10);
      ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU);
      ctx.fillStyle = C.green; ctx.fill();
      noGlow();
    });
  }

  /* ════════════════════════════════════════════════════════
     UTILITIES
  ════════════════════════════════════════════════════════ */
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  function fitText(text, x, y, maxW, font) {
    ctx.font = font;
    let size = parseInt(font);
    while (ctx.measureText(text).width > maxW && size > 20) {
      size -= 4;
      ctx.font = font.replace(/\d+px/, size + 'px');
    }
    ctx.fillText(text, x, y);
  }

  function formatDate(d) {
    if (!d) return new Date().toISOString().slice(0,10).split('-').reverse().join('-');
    const [y, m, dd] = d.split('-');
    return `${dd}-${m}-${y}`;
  }

  /* ════════════════════════════════════════════════════════
     FORM I/O
  ════════════════════════════════════════════════════════ */
  function getFormData() {
    return {
      call:   document.getElementById('inp-call').value.trim(),
      opName: document.getElementById('inp-name').value.trim(),
      date:   document.getElementById('inp-date').value,
      utc:    document.getElementById('inp-utc').value,
      band:   document.getElementById('inp-band').value,
      mode:   document.getElementById('inp-mode').value,
      rst:    document.getElementById('inp-rst').value.trim() || '599',
    };
  }

  /* Set today's date as default */
  const dateInput = document.getElementById('inp-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0,10);
  }

  /* Initial render */
  drawCard({ call:'YOURCALL', opName:'', date: new Date().toISOString().slice(0,10), utc:'14:32', band:'20M', mode:'SSB', rst:'599' });

  /* Live update */
  document.querySelectorAll('.qsl-form-panel input, .qsl-form-panel select')
    .forEach(el => el.addEventListener('input', () => drawCard(getFormData())));

  /* Download */
  document.getElementById('btnDownload').addEventListener('click', () => {
    const d = getFormData();
    const fn = `QSL_ON3KRB_${(d.call||'QSO').toUpperCase()}_${(d.date||'').replace(/-/g,'')}.png`;
    const a = document.createElement('a');
    a.download = fn; a.href = canvas.toDataURL('image/png'); a.click();
    const t = document.getElementById('dlToast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
  });

  /* Reset */
  document.getElementById('btnReset').addEventListener('click', () => {
    document.querySelectorAll('.qsl-form-panel input, .qsl-form-panel select').forEach(el => {
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else if (el.type === 'date') el.value = new Date().toISOString().slice(0,10);
      else el.value = '';
    });
    drawCard(getFormData());
  });

})();
