/* ==========================================================
   LANDING.JS — ON3FTB / ON3KRB Landing Morse Intro
   - Bouwt morse karakterblokken
   - Speelt morse (audio + LED)
   - Speed slider (WPM presets)
   - Status updates
   - Autoplay met fallback "klik om te starten"
   ========================================================== */

(() => {
  'use strict';

  /* -------------------------
     CONFIG
  ------------------------- */
  // Callsign / tekst die je wil zenden
  const CALL = 'ON3FTB';

  // Morse mapping
  const MORSE = {
    A: '.-',    B: '-...',  C: '-.-.',  D: '-..',   E: '.',
    F: '..-.',  G: '--.',   H: '....',  I: '..',    J: '.---',
    K: '-.-',   L: '.-..',  M: '--',    N: '-.',    O: '---',
    P: '.--.',  Q: '--.-',  R: '.-.',   S: '...',   T: '-',
    U: '..-',   V: '...-',  W: '.--',   X: '-..-',  Y: '-.--',
    Z: '--..',
    '0': '-----','1': '.----','2': '..---','3': '...--','4': '....-',
    '5': '.....','6': '-....','7': '--...','8': '---..','9': '----.'
  };

  // WPM presets: slider 1..5
  const WPM_PRESETS = [8, 12, 17, 22, 28];

  /* -------------------------
     DOM HELPERS
  ------------------------- */
  const $ = (sel) => document.querySelector(sel);

  const els = {
    chars: $('#morseChars'),
    led: $('#led'),
    status: $('#status'),
    playBtn: $('#playBtn'),
    stopBtn: $('#stopBtn'),
    speed: $('#speed')
  };

  // Als landing HTML er niet is, niets doen (veilig op andere pagina's)
  if (!els.chars || !els.led || !els.status || !els.playBtn || !els.stopBtn || !els.speed) {
    return;
  }

  /* -------------------------
     BUILD MORSE BLOCKS
  ------------------------- */
  function buildMorseBlocks() {
    els.chars.innerHTML = '';

    CALL.split('').forEach((c, i) => {
      const d = document.createElement('div');
      d.className = 'mc';
      d.id = `mc${i}`;

      const up = c.toUpperCase();
      const code = MORSE[up] || '';

      d.innerHTML = `
        <span class="ltr">${up}</span>
        <span class="dts">${code}</span>
      `;
      els.chars.appendChild(d);
    });
  }

  buildMorseBlocks();

  /* -------------------------
     AUDIO + TIMING
  ------------------------- */
  let audioCtx = null;
  let playing = false;
  let stopFlag = false;

  // slider value 1..5 → WPM presets
  function wpm() {
    const idx = Math.max(1, Math.min(5, +els.speed.value)) - 1;
    return WPM_PRESETS[idx];
  }

  // dot duration in ms: standaard formule
  function dotMs() {
    return 1200 / wpm();
  }

  function setActiveChar(i) {
    document.querySelectorAll('.mc').forEach(e => e.classList.remove('active'));
    if (i >= 0) {
      const el = $(`#mc${i}`);
      if (el) el.classList.add('active');
    }
  }

  function setLed(on) {
    els.led.className = on ? 'led on' : 'led';
  }

  function setStatus(text) {
    els.status.textContent = text || '';
  }

  // requestAnimationFrame-based sleep (zacht/consistent + stop responsive)
  function sleep(ms) {
    return new Promise((resolve) => {
      const start = performance.now();
      const tick = (t) => {
        if (stopFlag) return resolve();
        if (t - start >= ms) return resolve();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function ensureAudioContext() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
  }

  // Beep met ramp (geen klikgeluid)
  function beep(durationMs) {
    return new Promise((resolve) => {
      ensureAudioContext();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 700;

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const t0 = audioCtx.currentTime;
      const dur = durationMs / 1000;

      // Gain envelope
      gain.gain.setValueAtTime(0.0, t0);
      gain.gain.linearRampToValueAtTime(0.45, t0 + 0.006);
      gain.gain.setValueAtTime(0.45, t0 + Math.max(0, dur - 0.006));
      gain.gain.linearRampToValueAtTime(0.0, t0 + dur);

      osc.start(t0);
      osc.stop(t0 + dur);

      // resolve na duration
      setTimeout(resolve, durationMs);
    });
  }

  /* -------------------------
     PLAY / STOP
  ------------------------- */
  async function playMorse() {
    if (playing) return;

    playing = true;
    stopFlag = false;

    els.playBtn.disabled = true;
    els.stopBtn.disabled = false;

    const dot = dotMs();
    const dash = dot * 3;
    const intraSymbolGap = dot;     // tussen . en - binnen letter
    const interCharGap = dot * 3;   // tussen letters

    const chars = CALL.toUpperCase().split('');

    for (let ci = 0; ci < chars.length; ci++) {
      if (stopFlag) break;

      const ch = chars[ci];
      const code = MORSE[ch] || '';

      setActiveChar(ci);
      setStatus(`Sending: ${ch}  ${code}`);

      const symbols = code.split('');

      for (let si = 0; si < symbols.length; si++) {
        if (stopFlag) break;

        setLed(true);
        await beep(symbols[si] === '.' ? dot : dash);
        setLed(false);

        if (si < symbols.length - 1) {
          await sleep(intraSymbolGap);
        }
      }

      if (ci < chars.length - 1) {
        await sleep(interCharGap);
      }
    }

    // clean up UI state
    setActiveChar(-1);
    setLed(false);

    if (!stopFlag) {
      setStatus(`✓ ${CALL.toUpperCase()} — 73!`);
    } else {
      setStatus('');
    }

    els.playBtn.disabled = false;
    els.stopBtn.disabled = true;

    playing = false;
  }

  function stopMorse() {
    stopFlag = true;
    setLed(false);
    setStatus('');

    els.playBtn.disabled = false;
    els.stopBtn.disabled = true;

    playing = false;
  }

  /* -------------------------
     EVENTS
  ------------------------- */
  els.playBtn.addEventListener('click', () => {
    playMorse().catch(() => {
      // als audioctx geblokkeerd is, vraagt browser user gesture
      setStatus('▶ Klik om morse te starten');
    });
  });

  els.stopBtn.addEventListener('click', stopMorse);

  // Als speed wijzigt tijdens playback: volgende timing gebruikt nieuwe dot
  // (geen hard restart, gewoon live)
  els.speed.addEventListener('input', () => {
    if (!playing) {
      setStatus('');
    }
  });

  /* -------------------------
     AUTOPLAY (met fallback)
  ------------------------- */
  window.addEventListener('load', () => {
    // kleine delay voor sfeer
    setTimeout(() => {
      playMorse().catch(() => {
        // browsers blokkeren autoplay audio → fallback op click
        const onClick = () => {
          playMorse();
          document.removeEventListener('click', onClick);
        };
        document.addEventListener('click', onClick);
        setStatus('▶ Klik om morse te starten');
      });
    }, 1400);
  });

})();
