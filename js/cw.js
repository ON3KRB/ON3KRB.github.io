// ── CW PAGE — Morse engine, QSO table & Q-code table ──

const MORSE = {
  A:'.-',  B:'-...',C:'-.-.',D:'-..',E:'.',  F:'..-.',G:'--.',H:'....',I:'..',J:'.---',
  K:'-.-', L:'.-..',M:'--',  N:'-.',O:'---', P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',
  U:'..-', V:'...-',W:'.--', X:'-..-',Y:'-.--',Z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....',
  '6':'-....','7':'--...','8':'---..','9':'----.','/':'-..-.'
};

const QCODES = [
  { code:'QRZ', nl:'Who is calling me? / Who is calling…?' },
  { code:'QSL', nl:'I confirm receipt. / Can you confirm?' },
  { code:'QTH', nl:'My location is… / What is your location?' },
  { code:'QSO', nl:'I am in contact with… / Can you communicate with…?' },
  { code:'QRM', nl:'I have interference (from other stations).' },
  { code:'QRN', nl:'I am troubled by atmospheric noise.' },
  { code:'QSB', nl:'Your signal is fading.' },
  { code:'QRP', nl:'Reduce your transmit power.' },
  { code:'QRO', nl:'Increase your transmit power.' },
  { code:'QRT', nl:'Stop transmitting / I am stopping transmission.' },
  { code:'QRX', nl:'Stand by / I will call you back at … hours.' },
  { code:'QSY', nl:'Change to another frequency.' },
  { code:'QRQ', nl:'Send faster.' },
  { code:'QRS', nl:'Send more slowly.' },
  { code:'QTR', nl:'What is the correct time? / The time is…' },
  { code:'QRB', nl:'Distance between our stations.' },
  { code:'QNI', nl:'May I join the net?' },
  { code:'QRU', nl:'I have nothing for you. / Do you have anything for me?' },
  { code:'QRV', nl:'I am ready. / Are you ready?' },
  { code:'QSK', nl:'Break-in operation — I can hear you while transmitting.' },
];

const QSO = [
  { who:'ON3KRB', side:'caller',  phrase:'CQ CQ CQ DE ON3KRB ON3KRB K',                           meaning:'Calling CQ — inviting any station to reply' },
  { who:'PA3XYZ', side:'station', phrase:'ON3KRB DE PA3XYZ PA3XYZ K',                              meaning:'Answering the CQ call' },
  { who:'ON3KRB', side:'caller',  phrase:'PA3XYZ DE ON3KRB UR 579 579 NAME KRISTOF QTH BELGIUM BK',meaning:'Signal report, name and location' },
  { who:'PA3XYZ', side:'station', phrase:'R TNX UR 579 579 NAME JAN QTH NETHERLANDS BK',           meaning:'Acknowledge, give own report and details' },
  { who:'ON3KRB', side:'caller',  phrase:'R R TNX FER QSO 73 SK',                                  meaning:'Thanks, 73 best wishes — end of contact' },
];

const QSO_PFX = 'q';

let audioCtx     = null;
let currentPlaying = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function dot() { return 1200 / 15; } // 15 WPM

function sleepMs(ms, flagObj) {
  return new Promise(r => {
    const s = Date.now();
    const t = () => { if (flagObj.stop || Date.now() - s >= ms) r(); else requestAnimationFrame(t); };
    t();
  });
}

function beepMs(dur) {
  return new Promise(r => {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 700; o.type = 'sine';
    const t = ctx.currentTime, d = dur / 1000;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.42, t + 0.006);
    g.gain.setValueAtTime(0.42, t + d - 0.006);
    g.gain.linearRampToValueAtTime(0, t + d);
    o.start(t); o.stop(t + d);
    setTimeout(r, dur);
  });
}

// ── Speel een volledige frase af (met woordspaties) ──
async function playPhrase(phrase, prefix, flagObj) {
  const d = dot(), dash = d * 3, symGap = d, charGap = d * 3, wordGap = d * 7;
  const tokens  = phrase.toUpperCase().split('');
  const charEls = document.querySelectorAll(`[id^="${prefix}c-"]`);
  let charIdx = 0;

  for (let ti = 0; ti < tokens.length; ti++) {
    if (flagObj.stop) break;
    const tok = tokens[ti];
    if (tok === ' ') { await sleepMs(wordGap, flagObj); continue; }

    charEls.forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`${prefix}c-${charIdx}`);
    if (el) el.classList.add('active');

    const syms = (MORSE[tok] || '').split('');
    for (let si = 0; si < syms.length; si++) {
      if (flagObj.stop) break;
      const led = document.getElementById(prefix + 'led');
      if (led) led.className = 'led-mini on';
      await beepMs(syms[si] === '.' ? d : dash);
      if (led) led.className = 'led-mini';
      if (si < syms.length - 1) await sleepMs(symGap, flagObj);
    }
    charIdx++;
    if (ti < tokens.length - 1 && tokens[ti + 1] !== ' ') await sleepMs(charGap, flagObj);
  }
  charEls.forEach(el => el.classList.remove('active'));
  const led = document.getElementById(prefix + 'led');
  if (led) led.className = 'led-mini';
}

// ── Bouw QSO-rij ──
function buildQsoRow(item, rowIdx) {
  const pfx = QSO_PFX + rowIdx;
  const tr = document.createElement('tr');

  const tdWho = document.createElement('td');
  tdWho.className = 'td-who ' + item.side;
  tdWho.textContent = item.who;
  tr.appendChild(tdWho);

  const tdPhrase = document.createElement('td');
  tdPhrase.className = 'td-phrase';
  tdPhrase.textContent = item.phrase;
  tr.appendChild(tdPhrase);

  const tdMeaning = document.createElement('td');
  tdMeaning.className = 'td-meaning';
  tdMeaning.textContent = item.meaning;
  tr.appendChild(tdMeaning);

  const tdMorse = document.createElement('td');
  tdMorse.className = 'td-morse';
  const wrap = document.createElement('div');
  wrap.className = 'mc-mini-wrap wrap-ok';

  const led = document.createElement('span');
  led.className = 'led-mini';
  led.id = pfx + 'led';
  wrap.appendChild(led);

  let ci = 0;
  item.phrase.toUpperCase().split('').forEach(ch => {
    if (ch === ' ') return;
    const div = document.createElement('div');
    div.className = 'mc-mini';
    div.id = `${pfx}c-${ci}`;
    div.innerHTML = `<span class="ltr">${ch}</span><span class="dts">${MORSE[ch] || ''}</span>`;
    wrap.appendChild(div);
    ci++;
  });
  tdMorse.appendChild(wrap);
  tr.appendChild(tdMorse);

  const tdPlay = document.createElement('td');
  tdPlay.className = 'td-play';
  const btn = document.createElement('button');
  btn.className = 'btn-play-mini';
  btn.id = pfx + 'btn';
  btn.innerHTML = '▶ PLAY';

  const startPlay = async () => {
    if (currentPlaying) { currentPlaying.stop = true; await sleepMs(100, { stop: false }); }
    const flagObj = { stop: false };
    currentPlaying = flagObj;
    btn.textContent = '■ STOP';
    btn.onclick = () => { flagObj.stop = true; };
    await playPhrase(item.phrase, pfx, flagObj);
    btn.innerHTML = '▶ PLAY';
    btn.onclick = startPlay;
    currentPlaying = null;
  };
  btn.onclick = startPlay;
  tdPlay.appendChild(btn);
  tr.appendChild(tdPlay);

  return tr;
}

// ── Bouw Q-code rij ──
function buildQcodeRow(item, rowIdx) {
  const tr = document.createElement('tr');

  const tdCode = document.createElement('td');
  tdCode.className = 'td-code';
  tdCode.textContent = item.code;
  tr.appendChild(tdCode);

  const tdUitleg = document.createElement('td');
  tdUitleg.className = 'td-uitleg';
  tdUitleg.textContent = item.nl;
  tr.appendChild(tdUitleg);

  const tdMorse = document.createElement('td');
  tdMorse.className = 'td-morse';
  const wrap = document.createElement('div');
  wrap.className = 'mc-mini-wrap';
  wrap.id = 'mcwrap-' + rowIdx;

  const led = document.createElement('span');
  led.className = 'led-mini';
  led.id = 'led-' + rowIdx;
  wrap.appendChild(led);

  item.code.split('').forEach((ch, ci) => {
    const div = document.createElement('div');
    div.className = 'mc-mini';
    div.id = `mc-${rowIdx}-${ci}`;
    div.innerHTML = `<span class="ltr">${ch}</span><span class="dts">${MORSE[ch] || ''}</span>`;
    wrap.appendChild(div);
  });
  tdMorse.appendChild(wrap);
  tr.appendChild(tdMorse);

  const tdPlay = document.createElement('td');
  tdPlay.className = 'td-play';
  const btn = document.createElement('button');
  btn.className = 'btn-play-mini';
  btn.id = 'btn-' + rowIdx;
  btn.innerHTML = '▶ PLAY';
  btn.addEventListener('click', () => playQcode(item.code, rowIdx));
  tdPlay.appendChild(btn);
  tr.appendChild(tdPlay);

  return tr;
}

async function playQcode(code, rowIdx) {
  if (currentPlaying) { currentPlaying.stop = true; await sleepMs(120, { stop: false }); }
  const flagObj = { stop: false };
  currentPlaying = flagObj;

  const btn  = document.getElementById('btn-' + rowIdx);
  const led  = document.getElementById('led-' + rowIdx);
  const chars = code.split('');
  const d = dot(), dash = d * 3, sym = d, chr = d * 3;

  btn.disabled = true;
  btn.textContent = '■ STOP';
  btn.onclick = () => { flagObj.stop = true; };

  const setActive = ci => {
    chars.forEach((_, i) => {
      const el = document.getElementById(`mc-${rowIdx}-${i}`);
      if (el) el.classList.toggle('active', i === ci);
    });
  };

  for (let ci = 0; ci < chars.length; ci++) {
    if (flagObj.stop) break;
    setActive(ci);
    const syms = (MORSE[chars[ci]] || '').split('');
    for (let si = 0; si < syms.length; si++) {
      if (flagObj.stop) break;
      led.className = 'led-mini on';
      await beepMs(syms[si] === '.' ? d : dash);
      led.className = 'led-mini';
      if (si < syms.length - 1) await sleepMs(sym, flagObj);
    }
    if (ci < chars.length - 1) await sleepMs(chr, flagObj);
  }

  setActive(-1);
  led.className = 'led-mini';
  btn.disabled = false;
  btn.innerHTML = '▶ PLAY';
  btn.onclick = () => playQcode(code, rowIdx);
  currentPlaying = null;
}

// ── Initialisatie: vul tabellen ──
document.addEventListener('DOMContentLoaded', () => {
  const qsoTbody   = document.getElementById('qsoBody');
  const qcodeTbody = document.getElementById('qcodeBody');
  if (qsoTbody)   QSO.forEach((item, i)    => qsoTbody.appendChild(buildQsoRow(item, i)));
  if (qcodeTbody) QCODES.forEach((item, i) => qcodeTbody.appendChild(buildQcodeRow(item, i)));
});
