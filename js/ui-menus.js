    window.gameEngineStarted = false;
    window.gameStartTime = 0;
    window.formatSurvivalTime = function(ms) {
      const totalSec = Math.max(0, Math.floor(ms / 1000));
      const mm = Math.floor(totalSec / 60);
      const ss = totalSec % 60;
      return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    };

    let lastMenuActionTime = 0;
    function canTriggerMenuAction() {
      const now = performance.now();
      if (now - lastMenuActionTime < 220) return false;
      lastMenuActionTime = now;
      return true;
    }

    window.doStartGame = function(e) {
      if (e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
      }
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      const menu = document.getElementById('start-menu');
      if (menu) menu.style.display = 'none';

      if (window.initAudioContextSafely) {
        window.initAudioContextSafely();
      }
      window.gameStartTime = performance.now();
      window.gameEngineStarted = true;
    };

    window.doRestartGame = function(e) {
      if (e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
      }
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      const overMenu = document.getElementById('over-menu');
      if (overMenu) overMenu.style.display = 'none';
      const winMenu = document.getElementById('win-menu');
      if (winMenu) winMenu.style.display = 'none';
      const act2End = document.getElementById('act2-ending-screen');
      if (act2End) act2End.style.display = 'none';
      const actTrans = document.getElementById('act-transition-overlay');
      if (actTrans) actTrans.style.display = 'none';
      if (window.swapHudForAct) window.swapHudForAct(1);
      if (window.regenerateLevelAndRestart) {
        window.regenerateLevelAndRestart();
      }
      window.gameStartTime = performance.now();
      window.gameEngineStarted = true;
    };

    // กลับไปหน้าเมนูหลักจากหน้าแพ้/ชนะ แทนที่จะเริ่มเกมใหม่ทันที
    window.doBackToHome = function(e) {
      if (e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
      }
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      const overMenu = document.getElementById('over-menu');
      if (overMenu) overMenu.style.display = 'none';
      const winMenu = document.getElementById('win-menu');
      if (winMenu) winMenu.style.display = 'none';
      const act2End = document.getElementById('act2-ending-screen');
      if (act2End) act2End.style.display = 'none';
      const actTrans = document.getElementById('act-transition-overlay');
      if (actTrans) actTrans.style.display = 'none';
      if (window.swapHudForAct) window.swapHudForAct(1);
      if (window.regenerateLevelAndRestart) {
        window.regenerateLevelAndRestart();
      }
      window.gameEngineStarted = false;
      const menu = document.getElementById('start-menu');
      if (menu) menu.style.display = 'flex';
    };

    // เปิด/ปิดหน้าจอสรุปโน้ตที่เก็บได้ (สะสมข้ามรอบเล่นในเซสชันนี้)
    window.openNotesGallery = function(e) {
      if (e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
      }
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      const gallery = document.getElementById('notes-gallery-menu');
      const list = document.getElementById('notes-gallery-list');
      if (list && window.LORE_TEXTS_REF) {
        const collected = window.collectedLoreSet || new Set();
        list.innerHTML = window.LORE_TEXTS_REF.map((txt, i) => {
          const found = collected.has(txt);
          return `<div class="note-gallery-entry ${found ? 'found' : 'locked'}">` +
            (found ? txt : `บันทึก ${i + 1}/${window.LORE_TEXTS_REF.length} — ??? (ยังไม่พบเอกสารนี้)`) +
            `</div>`;
        }).join('');
        const countEl = document.getElementById('notes-gallery-count');
        if (countEl) countEl.innerText = `พบแล้ว ${collected.size}/${window.LORE_TEXTS_REF.length}`;
      }
      if (gallery) gallery.style.display = 'flex';
    };
    window.closeNotesGallery = function(e) {
      if (e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
      }
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      const gallery = document.getElementById('notes-gallery-menu');
      if (gallery) gallery.style.display = 'none';
    };

    // เปิด/ปิดหน้าจอ "วิธีเล่น"
    window.openHowTo = function(e) {
      if (e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
      }
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      const howto = document.getElementById('howto-menu');
      if (howto) howto.style.display = 'flex';
    };
    window.closeHowTo = function(e) {
      if (e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
      }
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      const howto = document.getElementById('howto-menu');
      if (howto) howto.style.display = 'none';
    };

    // -------------------------------------------------------------
    // Graphics Settings Manager
    // -------------------------------------------------------------
    window.graphicsConfig = {
      preset: 'ultra', // 'low', 'medium', 'ultra'
      filmGrain: true,
      fogGlow: true,
      dynamicFov: true
    };

    window.openSettings = function(e) {
      if (e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
      }
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      const settings = document.getElementById('settings-menu');
      if (settings) settings.style.display = 'flex';
    };

    window.closeSettings = function(e) {
      if (e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
      }
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      const settings = document.getElementById('settings-menu');
      if (settings) settings.style.display = 'none';
    };

    window.setGraphicsPreset = function(preset) {
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      window.graphicsConfig.preset = preset;
      ['low', 'med', 'ultra'].forEach(p => {
        const btn = document.getElementById('preset-' + p);
        if (btn) btn.classList.remove('active');
      });
      const activeBtn = document.getElementById('preset-' + (preset === 'medium' ? 'med' : preset));
      if (activeBtn) activeBtn.classList.add('active');

      const statusEl = document.getElementById('menu-quality-status');
      if (statusEl) {
        if (preset === 'low') statusEl.innerText = 'กราฟิก: ประหยัดทรัพยากร (เร็ว)';
        else if (preset === 'medium') statusEl.innerText = 'กราฟิก: มาตรฐาน (สมดุล)';
        else statusEl.innerText = 'กราฟิก: ความละเอียดสูง (คมชัด)';
      }

      // Apply to renderer
      if (typeof renderer !== 'undefined' && renderer) {
        const dpr = window.devicePixelRatio || 1;
        if (preset === 'low') {
          renderer.setPixelRatio(Math.min(1.0, dpr));
          if (typeof wallMat !== 'undefined' && wallMat) wallMat.bumpScale = 0.02;
          if (typeof floorMat !== 'undefined' && floorMat) floorMat.bumpScale = 0.02;
        } else if (preset === 'medium') {
          renderer.setPixelRatio(Math.min(1.25, dpr));
          if (typeof wallMat !== 'undefined' && wallMat) wallMat.bumpScale = 0.05;
          if (typeof floorMat !== 'undefined' && floorMat) floorMat.bumpScale = 0.04;
        } else {
          renderer.setPixelRatio(Math.min(2.0, dpr));
          if (typeof wallMat !== 'undefined' && wallMat) wallMat.bumpScale = 0.085;
          if (typeof floorMat !== 'undefined' && floorMat) floorMat.bumpScale = 0.07;
        }
      }
    };

    window.toggleFilmGrainSetting = function() {
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      window.graphicsConfig.filmGrain = !window.graphicsConfig.filmGrain;
      const el = document.getElementById('toggle-film-grain');
      if (el) el.classList.toggle('active', window.graphicsConfig.filmGrain);
      const noiseCanvas = document.getElementById('noise-canvas');
      if (noiseCanvas && !window.graphicsConfig.filmGrain) {
        noiseCanvas.style.display = 'none';
      } else if (noiseCanvas) {
        noiseCanvas.style.display = 'block';
      }
    };

    window.toggleFogGlowSetting = function() {
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      window.graphicsConfig.fogGlow = !window.graphicsConfig.fogGlow;
      const el = document.getElementById('toggle-fog-glow');
      if (el) el.classList.toggle('active', window.graphicsConfig.fogGlow);
      if (typeof scene !== 'undefined' && scene && scene.fog) {
        if (!window.graphicsConfig.fogGlow) {
          scene.fog.density = 0.005;
        } else {
          scene.fog.density = 0.028;
        }
      }
    };

    window.toggleDynamicFovSetting = function() {
      if (!canTriggerMenuAction()) return;
      if (window.playMenuSelectSound) window.playMenuSelectSound();
      window.graphicsConfig.dynamicFov = !window.graphicsConfig.dynamicFov;
      const el = document.getElementById('toggle-dynamic-fov');
      if (el) el.classList.toggle('active', window.graphicsConfig.dynamicFov);
    };
