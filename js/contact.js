/* ============================================================
   ON3KRB — QSL Card Generator v3  |  contact.js
   ============================================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('qslCanvas');
  const ctx    = canvas.getContext('2d');
  const W = 1480, H = 1050;
  canvas.width = W; canvas.height = H;

  const C = {
    bg:     '#03060e',
    green:  '#00ff88',
    cyan:   '#00d4ff',
    amber:  '#f0a500',
    red:    '#ff4466',
    white:  '#e2eaf5',
    grey:   '#7a8faa',
    dark:   '#3a4f66',
    darker: '#1a2535',
  };
  const TAU = Math.PI * 2;

  function glow(c, b)  { ctx.shadowColor = c; ctx.shadowBlur = b; }
  function noGlow()    { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; }
  function hex2rgba(h, a) {
    const r=parseInt(h.slice(1,3),16), g=parseInt(h.slice(3,5),16), b=parseInt(h.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ════════ MAIN ════════ */
  function drawCard(data) {
    ctx.clearRect(0, 0, W, H);
    bg();
    grid();
    topBar();
    /* ── TOP ZONE (rows 0–480): two columns ── */
    leftIdent();               /* x 0–620 */
    rightGraphic();            /* x 640–W */
    divider(490);
    /* ── BOTTOM ZONE (490–1050): QSO data ── */
    qsoZone(data);
    frame();
  }

  /* ── Background ── */
  function bg() {
    ctx.fillStyle = C.bg; ctx.fillRect(0,0,W,H);
    grad2(0,0,650,  'rgba(0,255,136,0.07)', 'transparent');
    grad2(W,H*0.3,520,'rgba(0,180,255,0.055)','transparent');
  }
  function grad2(cx,cy,r,c0,c1) {
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    g.addColorStop(0,c0); g.addColorStop(1,c1);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }

  /* ── Grid ── */
  function grid() {
    ctx.strokeStyle='rgba(0,255,136,0.022)'; ctx.lineWidth=1;
    for(let x=0;x<W;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  }

  /* ── Top colour bar ── */
  function topBar() {
    const g=ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0,C.green); g.addColorStop(0.45,C.cyan);
    g.addColorStop(0.85,C.amber); g.addColorStop(1,C.green);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,5);
  }

  /* ── LEFT: Identity (x 0–620) ── */
  function leftIdent() {
    const x = 52;

    /* "QSL CARD" amber pill */
    ctx.save();
    ctx.font = '700 22px "Orbitron", monospace';
    const pw = ctx.measureText('QSL CARD').width + 32;
    ctx.beginPath(); rrect(x, 18, pw, 38, 7);
    ctx.fillStyle = hex2rgba(C.amber, 0.10); ctx.fill();
    ctx.strokeStyle = hex2rgba(C.amber, 0.38); ctx.lineWidth=1.2; ctx.stroke();
    glow(C.amber, 7);
    ctx.fillStyle = C.amber; ctx.textAlign='left';
    ctx.fillText('QSL CARD', x+16, 44);
    noGlow(); ctx.restore();

    /* ON3KRB — main callsign */
    ctx.font = '900 136px "Orbitron", monospace';
    ctx.textAlign = 'left';
    glow(C.green, 48);
    ctx.fillStyle = C.green;
    ctx.fillText('ON3KRB', x, 210);
    noGlow();

    /* Underline */
    const ug=ctx.createLinearGradient(x,0,x+500,0);
    ug.addColorStop(0,C.green); ug.addColorStop(0.6,hex2rgba(C.cyan,0.4)); ug.addColorStop(1,'transparent');
    ctx.fillStyle=ug; ctx.fillRect(x,220,500,2);

    /* Name + QTH */
    ctx.font='300 30px "DM Sans", sans-serif';
    ctx.fillStyle=C.grey; ctx.textAlign='left';
    ctx.fillText('Kristof  ·  Hoboken, Antwerpen  ·  Belgium', x, 264);

    /* Grid locator only */
    ctx.font='600 26px "Share Tech Mono", monospace';
    glow(C.cyan, 8); ctx.fillStyle=C.cyan;
    ctx.fillText('JO21GF', x, 302);
    noGlow();

    /* Belgian flag stripe */
    ctx.fillStyle='rgba(0,0,0,0.78)';    ctx.fillRect(x,    320, 22, 9);
    ctx.fillStyle='rgba(255,215,0,0.82)'; ctx.fillRect(x+22, 320, 22, 9);
    ctx.fillStyle='rgba(200,0,0,0.82)';   ctx.fillRect(x+44, 320, 22, 9);
    ctx.font='400 16px "Share Tech Mono", monospace';
    ctx.fillStyle=hex2rgba(C.white,0.38); ctx.textAlign='left';
    ctx.fillText('ON  ·  BELGIUM  ·  DXCC', x+76, 329);

    /* Decorative antenna icon (left) */
    antennaIcon(x+24, 366, 78, hex2rgba(C.green, 0.30));
    ctx.save();
    for(let i=1;i<=4;i++){
      ctx.beginPath(); ctx.arc(x+24,366,i*28,-Math.PI*0.55,Math.PI*0.55);
      ctx.strokeStyle=`rgba(0,255,136,${0.13-i*0.025})`; ctx.lineWidth=1.2; ctx.stroke();
    }
    ctx.restore();
  }

  /* ── RIGHT: Ionosphere propagation graphic (x 660–W, y 10–480) ── */
  function rightGraphic() {
    const rx=660, ry=10, rw=W-rx-14, rh=470;
    ctx.save();
    ctx.beginPath(); ctx.rect(rx,ry,rw,rh); ctx.clip();

    const cx = rx+rw/2;
    const earthR = 780;
    const gndY   = ry+rh+145;  /* earth centre */

    /* Earth */
    drawEarth(cx, gndY, earthR, ry, rh);

    /* Layers */
    [
      {name:'D',  r:earthR+140, a:0.06, col:'cyan'},
      {name:'E',  r:earthR+265, a:0.09, col:'cyan'},
      {name:'F1', r:earthR+410, a:0.07, col:'green'},
      {name:'F2', r:earthR+560, a:0.15, col:'green'},
    ].forEach(l=>drawLayer(cx,gndY,l));

    /* Signal path */
    const txX=rx+100, rxX=W-90;
    const sfY=x=>{const dx=x-cx;return gndY-Math.sqrt(Math.max(0,earthR*earthR-dx*dx));};
    const txY=sfY(txX)-18, rxY=sfY(rxX)-18;
    const bx=cx, by=gndY-(earthR+560);
    signalPath(txX,txY,bx,by,rxX,rxY);
    antennaIcon(txX,txY,54,C.green);
    antennaIcon(rxX,rxY,40,C.cyan);

    /* Layer labels */
    ctx.font='400 17px "Share Tech Mono", monospace';
    ctx.textAlign='left';
    [{name:'E',r:earthR+265,col:'cyan'},{name:'F2',r:earthR+560,col:'green'}].forEach(l=>{
      const ly=gndY-l.r-4;
      if(ly>ry+8&&ly<ry+rh-10){
        ctx.fillStyle=l.col==='green'?hex2rgba(C.green,0.35):hex2rgba(C.cyan,0.35);
        ctx.fillText(l.name+' LAYER', cx+earthR*0.52, ly);
      }
    });

    /* Title */
    ctx.font='700 18px "Orbitron", monospace';
    ctx.fillStyle=hex2rgba(C.cyan,0.18);
    ctx.textAlign='center';
    ctx.fillText('IONOSPHERIC PROPAGATION', cx, ry+24);

    /* HF Skip dot */
    ctx.font='500 18px "Share Tech Mono", monospace';
    ctx.fillStyle=hex2rgba(C.amber,0.60); ctx.textAlign='center';
    ctx.fillText('HF SKIP', bx, by-18);
    glow(C.amber,14);
    ctx.beginPath(); ctx.arc(bx,by,6,0,TAU); ctx.fillStyle=C.amber; ctx.fill();
    noGlow();

    ctx.restore();
  }

  function drawEarth(cx,cy,r,clipTop) {
    const eg=ctx.createRadialGradient(cx,cy,r*0.85,cx,cy,r);
    eg.addColorStop(0,'rgba(0,30,60,0)'); eg.addColorStop(1,'rgba(0,80,140,0.22)');
    ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.fillStyle=eg; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU);
    ctx.strokeStyle=hex2rgba(C.cyan,0.20); ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=hex2rgba(C.green,0.18);
    [-220,-180,-140,-100,-60,-20,20,60,100,140,180,200,-50,-90,30,80,-160].forEach(dx=>{
      const sy=cy-Math.sqrt(Math.max(0,r*r-dx*dx))-10;
      if(sy>clipTop+10){ctx.beginPath();ctx.arc(cx+dx,sy,4,0,TAU);ctx.fill();}
    });
  }
  function drawLayer(cx,cy,l) {
    ctx.beginPath(); ctx.arc(cx,cy,l.r,0,TAU);
    ctx.strokeStyle=l.col==='green'?hex2rgba(C.green,l.a):hex2rgba(C.cyan,l.a);
    ctx.lineWidth=l.name==='F2'?2.5:1.5;
    ctx.setLineDash(l.name==='F2'?[]:[12,8]); ctx.stroke(); ctx.setLineDash([]);
  }
  function signalPath(x1,y1,bx,by,x2,y2) {
    function arc(ax,ay,cpx,cpy,ex,ey){
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.quadraticCurveTo(cpx,cpy,ex,ey);
      ctx.strokeStyle=hex2rgba(C.amber,0.65); ctx.lineWidth=2.5;
      ctx.setLineDash([14,7]); ctx.stroke(); ctx.setLineDash([]);
    }
    glow(C.amber,10);
    arc(x1,y1, bx-(bx-x1)*0.06,(by+y1)/2-30, bx,by);
    arc(bx,by, bx+(x2-bx)*0.5,(by+y2)/2+30,  x2,y2);
    noGlow();
  }
  function antennaIcon(x,y,h,col) {
    ctx.save();
    const cs=col.startsWith('#')?hex2rgba(col,0.72):col;
    ctx.strokeStyle=cs; ctx.lineWidth=2.2;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-14,y+h); ctx.lineTo(x+14,y+h); ctx.stroke();
    [[0.15,32],[0.4,25],[0.65,18],[0.85,12]].forEach(([p,hw])=>{
      const ey=y+h*p; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(x-hw,ey); ctx.lineTo(x+hw,ey); ctx.stroke();
    });
    const gc=col.startsWith('#')?col:C.green;
    glow(gc,10); ctx.beginPath(); ctx.arc(x,y,4,0,TAU);
    ctx.fillStyle=col.startsWith('#')?col:C.green; ctx.fill(); noGlow();
    ctx.restore();
  }

  /* ── Divider ── */
  function divider(y) {
    const g=ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0,C.green); g.addColorStop(0.35,C.cyan);
    g.addColorStop(0.75,hex2rgba(C.amber,0.5)); g.addColorStop(1,'transparent');
    ctx.strokeStyle=g; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    [0,W*0.33,W*0.66].forEach(dx=>{
      ctx.save(); ctx.translate(dx,y); ctx.rotate(Math.PI/4);
      ctx.fillStyle=hex2rgba(C.green,0.5); ctx.fillRect(-4,-4,8,8);
      ctx.restore();
    });
  }

  /* ════════ QSO ZONE (y 500–1050) ════════
     Layout:
       y500-555  : sub-label + callsign label
       y555-650  : CALLSIGN (big, left) | S-METER (right half)
       y650-720  : divider + DATE / UTC / BAND / MODE row
       y720-810  : values for those 4 fields
       y810-860  : operator name (if provided)
       y860-1010 : decorative elements
       y1010-    : morse + 73
  ════════ */
  function qsoZone(data) {
    const zy = 502;
    /* Background tint */
    ctx.fillStyle='rgba(0,255,136,0.014)'; ctx.fillRect(0,zy,W,H-zy-8);

    /* Sub-label */
    ctx.font='500 20px "Share Tech Mono", monospace';
    ctx.textAlign='left'; ctx.fillStyle=hex2rgba(C.dark,0.9);
    ctx.fillText('▸ CONFIRMING QSO WITH', 52, zy+38);

    /* ── CALLSIGN — own row, generous space ── */
    const callLabel = (data.call||'YOURCALL').toUpperCase();
    ctx.textAlign='left';
    ctx.font='500 20px "Share Tech Mono", monospace';
    ctx.fillStyle=C.dark;
    ctx.fillText('CALLSIGN', 52, zy+64);

    /* Callsign value — large, fits in 580px */
    glow(C.green, 22);
    ctx.fillStyle = C.green;
    fitText(callLabel, 52, zy+148, 580, '800 88px "Orbitron", monospace');
    noGlow();

    /* Operator name — spaced below callsign */
    if (data.opName) {
      ctx.font='300 28px "DM Sans", sans-serif';
      ctx.fillStyle=hex2rgba(C.grey,0.75);
      ctx.textAlign='left';
      ctx.fillText('OP: '+data.opName.toUpperCase(), 52, zy+196);
    }

    /* ── S-METER for Signal Strength (right half) ── */
    const sVal = Math.min(9, Math.max(1, data.sVal||9));
    const rVal = Math.min(5, Math.max(1, data.rVal||5));
    drawSMeter(1085, zy + 155, 340, sVal);

    /* RS label + values above meter */
    ctx.font='500 20px "Share Tech Mono", monospace';
    ctx.fillStyle=C.dark; ctx.textAlign='center';
    ctx.fillText('REPORT (RS)', 1085, zy+64);

    /* R value pill — green+bigger when good (4-5), amber when poor (1-3) */
    const rColor = rVal >= 4 ? C.green : C.amber;
    const rSize  = rVal >= 4 ? 38 : 30;
    ctx.font=`700 ${rSize}px "Share Tech Mono", monospace`;
    if(rVal>=4) glow(C.green, 8);
    ctx.fillStyle=hex2rgba(rColor, 0.9); ctx.textAlign='right';
    ctx.fillText('R'+rVal, 1040, zy+104);
    noGlow();
    ctx.font='600 30px "Share Tech Mono", monospace';
    ctx.fillStyle=hex2rgba(C.dark,0.5); ctx.textAlign='center';
    ctx.fillText('·', 1052, zy+102);
    /* S value */
    ctx.font='600 30px "Share Tech Mono", monospace';
    ctx.fillStyle=hex2rgba(C.green,0.9); ctx.textAlign='left';
    ctx.fillText('S'+sVal, 1065, zy+102);

    /* ── Thin sub-divider ── */
    const dv2y = zy+200;
    ctx.strokeStyle=hex2rgba(C.dark,0.35); ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(52,dv2y); ctx.lineTo(W-52,dv2y); ctx.stroke();

    /* ── DATE / UTC / BAND / MODE — 4 columns in bottom strip ── */
    const cols2 = [
      {label:'DATE', val:formatDate(data.date), x:52,   w:280, col:C.white,  font:'500 48px "Share Tech Mono", monospace'},
      {label:'UTC',  val:data.utc||'--:--',     x:370,  w:200, col:C.white,  font:'500 48px "Share Tech Mono", monospace'},
      {label:'BAND', val:data.band||'20M',       x:610,  w:200, col:C.cyan,   font:'700 56px "Orbitron", monospace'},
      {label:'MODE', val:(data.mode||'SSB').toUpperCase(), x:860, w:200, col:C.amber, font:'700 56px "Orbitron", monospace'},
    ];

    const hdrY2 = dv2y+30, valY2 = dv2y+96;

    /* Header labels */
    ctx.font='500 20px "Share Tech Mono", monospace'; ctx.fillStyle=C.dark;
    cols2.forEach(c=>{ ctx.textAlign='left'; ctx.fillText(c.label,c.x,hdrY2); });

    /* Separator line */
    ctx.strokeStyle=hex2rgba(C.dark,0.28); ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(52,hdrY2+8); ctx.lineTo(W-52,hdrY2+8); ctx.stroke();

    /* Values */
    cols2.forEach(c=>{
      ctx.fillStyle=c.col; ctx.textAlign='left';
      if(c.col===C.cyan) glow(C.cyan,10);
      if(c.col===C.amber) glow(C.amber,10);
      fitText(c.val, c.x, valY2, c.w, c.font);
      noGlow();
    });

    /* ── 73 signature ── */
    ctx.font='600 26px "Share Tech Mono", monospace';
    glow(C.green,8); ctx.fillStyle=hex2rgba(C.green,0.50);
    ctx.textAlign='left'; ctx.fillText('73 DE ON3KRB', 52, H-32);
    noGlow();

    /* ── Stamp ── */
    drawStamp(W-158, H-168, 125);
  }

  /* ── S-Meter ── */
  function drawSMeter(cx, cy, size, sVal) {
    const r      = size * 0.46;
    const startA = Math.PI * 0.75;    /* bottom-left */
    const endA   = Math.PI * 0.25;    /* bottom-right */
    const sweepA = (TAU - (endA - startA + Math.PI*0.5));  /* sweep ~270° */
    /* Actually simpler: start=150°, end=390° → 240° sweep */
    const sa = (150 * Math.PI) / 180;
    const ea = (390 * Math.PI) / 180;
    const span = ea - sa;

    /* Outer bezel */
    ctx.save();
    ctx.beginPath(); ctx.arc(cx,cy,r+12,0,TAU);
    ctx.fillStyle='rgba(10,16,32,0.85)'; ctx.fill();
    ctx.strokeStyle=hex2rgba(C.dark,0.5); ctx.lineWidth=2; ctx.stroke();

    /* Background arc track */
    ctx.beginPath(); ctx.arc(cx,cy,r,sa,ea);
    ctx.strokeStyle=hex2rgba(C.darker,0.9); ctx.lineWidth=18; ctx.stroke();

    /* Colour zones: S1-S3 red, S4-S6 amber, S7-S9 green */
    const zones = [
      {from:0,   to:2/8, col:C.red},
      {from:2/8, to:5/8, col:C.amber},
      {from:5/8, to:1,   col:C.green},
    ];
    zones.forEach(z=>{
      ctx.beginPath();
      ctx.arc(cx,cy,r, sa+span*z.from, sa+span*z.to);
      ctx.strokeStyle=z.col; ctx.lineWidth=8; ctx.globalAlpha=0.25; ctx.stroke();
      ctx.globalAlpha=1;
    });

    /* Active arc colour: red when low, amber mid, green when strong */
    const activeFrac = (sVal-1)/8;
    const col1 = sVal<=3 ? C.red : (sVal<=6 ? C.amber : C.green);
    ctx.beginPath(); ctx.arc(cx,cy,r,sa,sa+span*Math.min(activeFrac,1));
    glow(col1,12); ctx.strokeStyle=col1; ctx.lineWidth=10; ctx.stroke(); noGlow();

    /* Tick marks + S-labels */
    for(let s=1;s<=9;s++){
      const frac=(s-1)/8;
      const angle=sa+span*frac;
      const isMajor=(s%2===1);
      const tickLen=isMajor?18:11;
      const tx1=cx+Math.cos(angle)*(r-tickLen/2);
      const ty1=cy+Math.sin(angle)*(r-tickLen/2);
      const tx2=cx+Math.cos(angle)*(r+tickLen/2);
      const ty2=cy+Math.sin(angle)*(r+tickLen/2);
      ctx.beginPath(); ctx.moveTo(tx1,ty1); ctx.lineTo(tx2,ty2);
      ctx.strokeStyle=s<=sVal?col1:hex2rgba(C.dark,0.7);
      ctx.lineWidth=isMajor?2.5:1.5; ctx.stroke();

      if(isMajor){
        const lx=cx+Math.cos(angle)*(r-32);
        const ly=cy+Math.sin(angle)*(r-32);
        ctx.font=`600 ${size*0.085}px "Share Tech Mono", monospace`;
        ctx.fillStyle=s<=sVal?col1:hex2rgba(C.dark,0.6);
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('S'+s, lx, ly);
      }
    }
    ctx.textBaseline='alphabetic';

    /* Needle */
    const needleAngle = sa + span*((sVal-1)/8);
    const nx = cx+Math.cos(needleAngle)*(r-14);
    const ny = cy+Math.sin(needleAngle)*(r-14);
    glow(col1,14);
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(nx,ny);
    ctx.strokeStyle=col1; ctx.lineWidth=3; ctx.stroke();
    noGlow();

    /* Centre pivot */
    ctx.beginPath(); ctx.arc(cx,cy,8,0,TAU);
    ctx.fillStyle=C.darker; ctx.fill();
    ctx.strokeStyle=col1; ctx.lineWidth=1.5; ctx.stroke();

    /* "S-METER" label */
    ctx.font=`700 ${size*0.09}px "Orbitron", monospace`;
    ctx.fillStyle=hex2rgba(C.dark,0.7); ctx.textAlign='center';
    ctx.fillText('S-METER', cx, cy+r*0.45);

    ctx.restore();
  }

  /* ── Circular stamp ── */
  function drawStamp(cx,cy,r) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU);
    ctx.fillStyle=hex2rgba(C.green,0.04); ctx.fill();
    [r,r-14,r-25].forEach((rad,i)=>{
      ctx.beginPath(); ctx.arc(cx,cy,rad,0,TAU);
      ctx.strokeStyle=hex2rgba(C.green,0.16-i*0.04); ctx.lineWidth=i?1:2; ctx.stroke();
    });
    const arcText='ON3KRB · HOBOKEN · BELGIUM ·';
    ctx.font='700 16px "Orbitron", monospace';
    ctx.fillStyle=hex2rgba(C.green,0.48);
    const ar=r-8;
    arcText.split('').forEach((ch,i)=>{
      const ang=(i/arcText.length)*TAU-Math.PI/2;
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(ang);
      ctx.translate(0,-ar); ctx.rotate(Math.PI/2);
      ctx.textAlign='center'; ctx.fillText(ch,0,0); ctx.restore();
    });
    ctx.font='600 18px "Share Tech Mono", monospace';
    ctx.fillStyle=hex2rgba(C.cyan,0.50); ctx.textAlign='center';
    ctx.fillText('JO21GF',cx,cy+6);
    glow(C.green,12);
    ctx.beginPath(); ctx.arc(cx,cy,4,0,TAU);
    ctx.fillStyle=hex2rgba(C.green,0.5); ctx.fill(); noGlow();
    ctx.restore();
  }

  /* ── Bottom morse + frame ── */
  function frame() {
    /* Morse bottom */
    ctx.font='300 16px "Share Tech Mono", monospace';
    ctx.fillStyle=hex2rgba(C.green,0.09); ctx.textAlign='center';
    ctx.fillText('--. ...   -.. .   --- -. ...   -.- .-. -...', W/2, H-14);

    /* Bottom bar */
    const g=ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0,C.green); g.addColorStop(0.5,C.cyan); g.addColorStop(1,C.amber);
    ctx.fillStyle=g; ctx.fillRect(0,H-5,W,5);

    /* Side bars */
    const sg=ctx.createLinearGradient(0,0,0,H);
    sg.addColorStop(0,C.green); sg.addColorStop(0.5,hex2rgba(C.cyan,0.4)); sg.addColorStop(1,C.amber);
    ctx.fillStyle=sg;
    ctx.fillRect(0,0,4,H); ctx.fillRect(W-4,0,4,H);

    /* Corner dots */
    [[4,5],[W-4,5],[4,H-5],[W-4,H-5]].forEach(([x,y])=>{
      glow(C.green,10); ctx.beginPath(); ctx.arc(x,y,5,0,TAU);
      ctx.fillStyle=C.green; ctx.fill(); noGlow();
    });
  }

  /* ════ UTILS ════ */
  function rrect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }
  function fitText(txt,x,y,maxW,font){
    ctx.font=font;
    let sz=parseInt(font);
    while(ctx.measureText(txt).width>maxW&&sz>18){sz-=4;ctx.font=font.replace(/\d+px/,sz+'px');}
    ctx.fillText(txt,x,y);
  }
  function formatDate(d){
    if(!d)return new Date().toISOString().slice(0,10).split('-').reverse().join('-');
    const[y,m,dd]=d.split('-'); return `${dd}-${m}-${y}`;
  }

  /* ════ FORM I/O ════ */
  function getFormData(){
    return {
      call:   document.getElementById('inp-call').value.trim(),
      opName: document.getElementById('inp-name').value.trim(),
      date:   document.getElementById('inp-date').value,
      utc:    document.getElementById('inp-utc').value,
      band:   document.getElementById('inp-band').value,
      mode:   document.getElementById('inp-mode').value,
      rVal:   parseInt(document.getElementById('inp-r').value)||5,
      sVal:   parseInt(document.getElementById('inp-s').value)||9,
    };
  }

  const di=document.getElementById('inp-date');
  if(di&&!di.value) di.value=new Date().toISOString().slice(0,10);

  /* Initial render */
  drawCard({call:"YOURCALL",opName:"",date:new Date().toISOString().slice(0,10),utc:"14:32",band:"20M",mode:"SSB",rVal:5,sVal:9});

  document.querySelectorAll('.qsl-form-panel input,.qsl-form-panel select')
    .forEach(el=>{
      el.addEventListener('input',  ()=>drawCard(getFormData()));
      el.addEventListener('change', ()=>drawCard(getFormData()));
    });

  document.getElementById('btnDownload').addEventListener('click',()=>{
    const d=getFormData();
    const fn=`QSL_ON3KRB_${(d.call||'QSO').toUpperCase()}_${(d.date||'').replace(/-/g,'')}.png`;
    const a=document.createElement('a'); a.download=fn; a.href=canvas.toDataURL('image/png'); a.click();
    const t=document.getElementById('dlToast'); t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),2800);
  });

  document.getElementById('btnReset').addEventListener('click',()=>{
    document.querySelectorAll('.qsl-form-panel input,.qsl-form-panel select').forEach(el=>{
      if(el.tagName==='SELECT') {
        if(el.id==='inp-r') el.value='5';
        else if(el.id==='inp-s') el.value='9';
        else el.selectedIndex=0;
      }
      else if(el.type==='date') el.value=new Date().toISOString().slice(0,10);
      else el.value='';
    });
    drawCard(getFormData());
  });

})();
