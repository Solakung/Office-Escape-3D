    window.gameEngineStarted = false;
    window.gameStartTime = 0;
    window.formatSurvivalTime = function(ms) {
      const totalSec = Math.max(0, Math.floor(ms / 1000));
      const mm = Math.floor(totalSec / 60);
      const ss = totalSec % 60;
      return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    };

    window.doStartGame = function(e) {
      if (e) e.stopPropagation();
      const menu = document.getElementById('start-menu');
      if (menu) menu.style.display = 'none';

      if (window.initAudioContextSafely) {
        window.initAudioContextSafely();
      }
      window.gameStartTime = performance.now();
      window.gameEngineStarted = true;
    };

    window.doRestartGame = function(e) {
      if (e) e.stopPropagation();
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
      if (e) { e.preventDefault(); e.stopPropagation(); }
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
      if (e) { e.preventDefault(); e.stopPropagation(); }
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
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const gallery = document.getElementById('notes-gallery-menu');
      if (gallery) gallery.style.display = 'none';
    };

    // เปิด/ปิดหน้าจอ "วิธีเล่น"
    // ปุ่มเปิดผูกทั้ง pointerdown/click/touchend + stopPropagation ทุกตัว เพราะ #start-menu
    // ข้างนอกดักฟัง 3 event นี้อยู่ (แตะตรงไหนก็เริ่มเกม) — ถ้าไม่ stopPropagation ให้ครบทุก
    // event type จะมี event ที่หลุดรอดไปโดน onclick/ontouchend ของ #start-menu แล้วเริ่มเกมทันที
    // preventDefault() บน pointerdown ช่วยกัน click "ผี" ที่เบราว์เซอร์ยิงตามหลัง touchend
    // (ซึ่งจะ hit-test ใหม่ ณ ตอนนั้นแล้วอาจไปโดนโอเวอร์เลย์ที่เพิ่งโผล่แทน)
    window.openHowTo = function(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const howto = document.getElementById('howto-menu');
      if (howto) howto.style.display = 'flex';
    };
    window.closeHowTo = function(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const howto = document.getElementById('howto-menu');
      if (howto) howto.style.display = 'none';
    };
