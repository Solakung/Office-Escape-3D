    function updateEnergyHUD() {
      const fill = document.getElementById('energy-bar-fill');
      const text = document.getElementById('energy-text');
      if (fill && text) {
        fill.style.width = Math.max(0, playerEnergy) + '%';
        text.innerText = Math.round(playerEnergy) + '%';

        if (playerEnergy > 50) {
          fill.style.backgroundColor = '#7ca856';
        } else if (playerEnergy > 25) {
          fill.style.backgroundColor = '#d4af37';
        } else {
          fill.style.backgroundColor = '#cc3333';
        }
      }
      updateBottleHUD();
    }

    function updateBottleHUD() {
      const countEl = document.getElementById('bottle-count');
      const btn = document.getElementById('drink-btn');
      if (countEl) countEl.innerText = `${almondInventory}/${ALMOND_INVENTORY_MAX}`;
      if (btn) {
        if (almondInventory <= 0 || playerEnergy >= 100) btn.classList.add('disabled');
        else btn.classList.remove('disabled');
      }
    }

    // -------------------------------------------------------------
    // Note Overlay (แสดงข้อความโน้ตที่เก็บได้ ค้างจอนานกว่า item-notification ปกติ)
    // -------------------------------------------------------------
    function updateObjectiveHUD() {
      const el = document.getElementById('objective-text');
      if (el) el.innerText = `บัตรผ่าน: ${keycardsCollected}/${KEYCARDS_REQUIRED}`;
    }
    let noteOverlayTimer = null;
    function showNoteOverlay(text) {
      const el = document.getElementById('note-overlay');
      if (!el) return;
      el.querySelector('.note-body').innerText = text;
      el.querySelector('.note-count').innerText = `เอกสารที่พบ: ${collectedLoreSet.size}/${LORE_TEXTS.length}`;
      el.style.display = 'flex';
      if (noteOverlayTimer) clearTimeout(noteOverlayTimer);
      noteOverlayTimer = setTimeout(() => { el.style.display = 'none'; }, 5200);
    }

    // -------------------------------------------------------------
    // Ambient Dread Events (เสียง/ไฟกระพริบไกลๆ ไม่ทำร้ายผู้เล่น แค่สร้างความระแวง)
    // -------------------------------------------------------------
    function playDistantKnock() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.22;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(60, t);
          gain.gain.setValueAtTime(0.05, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
          osc.connect(gain); gain.connect(audioCtx.destination);
          osc.start(t); osc.stop(t + 0.1);
        }
      } catch(e) {}
    }

    function playDistantWhisper() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.6, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.06;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const f = audioCtx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.2;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.25, now + 0.15);
        g.gain.linearRampToValueAtTime(0.001, now + 0.55);
        noise.connect(f); f.connect(g); g.connect(audioCtx.destination);
        noise.start(now); noise.stop(now + 0.6);
      } catch(e) {}
    }

    function triggerAmbientDreadEvent() {
      // สุ่มเลือกไฟเพดานดวงหนึ่งให้กระพริบ (ถ้ามี) โดยไม่สนใจว่าใกล้ผู้เล่นหรือไม่
      // เพื่อให้ผู้เล่นได้ยิน/เห็นความผิดปกติแว่วมาจากที่ไกลๆ
      if (ceilingLights.length > 0 && !isBlackout) {
        const light = ceilingLights[Math.floor(Math.random() * ceilingLights.length)];
        const originalIntensity = light.intensity;
        let flickers = 0;
        const totalFlickers = 5 + Math.floor(Math.random() * 4); // จำนวนกระพริบสุ่มไม่เท่ากันทุกครั้ง
        const flickerStep = () => {
          light.intensity = (flickers % 2 === 0) ? 0 : originalIntensity;
          flickers++;
          if (flickers < totalFlickers) setTimeout(flickerStep, 60 + Math.random() * 130); // จังหวะกระพริบไม่สม่ำเสมอ
          else light.intensity = originalIntensity;
        };
        flickerStep();
      }
      const roll = Math.random();
      if (roll < 0.4) playDistantKnock();
      else if (roll < 0.75) playDistantWhisper();
      else playDistantGrowl();

      // บางครั้ง (ไม่ทุกครั้ง กันเบื่อ) แถมจอวาบมืดแวบเดียวแบบไม่มีสาเหตุ — เหมือนกระพริบตาแล้วเห็นอะไรแวบนึง
      if (Math.random() < 0.35 && subliminalFlashEl) {
        subliminalFlashEl.style.transition = 'none';
        subliminalFlashEl.style.opacity = '0.9';
        setTimeout(() => {
          subliminalFlashEl.style.transition = 'opacity 0.5s ease';
          subliminalFlashEl.style.opacity = '0';
        }, 55 + Math.random() * 40);
      }
    }

    function playDistantGrowl() {
      // เสียงคำรามทุ้มต่ำแว่วมาไกลๆ ไม่รู้ทิศทาง — สร้างความระแวงว่ามีบางอย่างอยู่ใกล้กว่าที่คิด
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(45, now);
        osc.frequency.linearRampToValueAtTime(32, now + 1.4);
        const f = audioCtx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 180;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.3);
        gain.gain.linearRampToValueAtTime(0.001, now + 1.5);
        osc.connect(f); f.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 1.55);
      } catch(e) {}
    }

