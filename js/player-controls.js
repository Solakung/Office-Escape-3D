    // -------------------------------------------------------------
    // Camera Flash (กดถ่ายรูป = วาบแสงจ้าสั้นๆ รอบตัว แทนไฟฉายส่องต่อเนื่อง)
    // -------------------------------------------------------------
    function triggerCameraFlash() {
      if (!window.gameEngineStarted || isJumpscareActive || isHiding || !firstBlackoutOccurred) return;
      if (cameraFlashActive) return; // กำลังวาบอยู่ ห้ามซ้อน
      if (cameraCharge < CAMERA_MIN_CHARGE_TO_USE) return; // พลังงานไม่พอ ถ่ายไม่ได้
      cameraCharge = Math.max(0, cameraCharge - CAMERA_CHARGE_COST);
      cameraFlashActive = true;
      if (flashlight) flashlight.intensity = CAMERA_FLASH_INTENSITY;
      if (camFlashOverlayEl) {
        camFlashOverlayEl.style.transition = 'none';
        camFlashOverlayEl.style.opacity = '0.85';
        requestAnimationFrame(() => {
          camFlashOverlayEl.style.transition = 'opacity 0.18s ease-out';
          camFlashOverlayEl.style.opacity = '0';
        });
      }
      setTimeout(() => {
        if (flashlight) flashlight.intensity = 0;
        cameraFlashActive = false;
      }, CAMERA_FLASH_DURATION_MS);
      updateFlashlightIndicator();
      // เสียงชัตเตอร์ + แสงวาบ ดึงความสนใจ The Duller ได้จากระยะไกล
      emitNoise(camera.position.x, camera.position.z, 16);

      // ใน Act 2: การถ่ายรูปด้วยกล้องหน้าเอกสาร/โน้ต จะบันทึกเป็นหลักฐานคดี (Evidence Photos 0/12)
      if (currentAct === 2 && loreNotes && loreNotes.length > 0) {
        for (const note of loreNotes) {
          const dist = Math.hypot(camera.position.x - note.x, camera.position.z - note.z);
          if (dist < 3.4 && !photographedLoreSet.has(note.text)) {
            photographedLoreSet.add(note.text);
            evidencePhotos = Math.min(12, evidencePhotos + 1);
            const notif = document.getElementById('item-notification');
            if (notif) {
              notif.innerHTML = `📷 <b>บันทึกหลักฐานคดี #${evidencePhotos}/12 สำเร็จ!</b><br>${note.text}`;
              notif.style.display = 'block';
              setTimeout(() => { notif.style.display = 'none'; }, 3200);
            }
            if (window.updateAct2HUD) window.updateAct2HUD();
            break;
          }
        }
      }
    }
    if (!window.updateFlashlightIndicator) {
      window.updateFlashlightIndicator = function() {
        const indicator = document.getElementById('flashlight-indicator');
        if (!indicator) return;
        if (!firstBlackoutOccurred) {
          indicator.style.display = 'none'; // ยังไม่มีกล้องให้ใช้ก่อนไฟดับครั้งแรก
          return;
        }
        if (cameraCharge < CAMERA_MIN_CHARGE_TO_USE) {
          indicator.style.color = '#ff8888';
          indicator.innerText = `กล้องกำลังชาร์จ ${Math.floor(cameraCharge)}%`;
          indicator.style.display = 'block';
        } else if (cameraCharge < 60) {
          indicator.style.color = '#ffb84d';
          indicator.innerText = `พลังงานกล้อง ${Math.floor(cameraCharge)}%`;
          indicator.style.display = 'block';
        } else {
          indicator.style.display = 'none';
        }
      };
    }
    var updateFlashlightIndicator = window.updateFlashlightIndicator;

    // -------------------------------------------------------------
    // ดื่มนมอัลมอนด์จากกระเป๋า (เก็บสะสมไว้ก่อน ใช้ตอนต้องการจริงๆ)
    // -------------------------------------------------------------
    function useAlmondBottle() {
      if (!window.gameEngineStarted || isJumpscareActive || isHiding) return;
      if (almondInventory <= 0) return;
      if (playerEnergy >= 100) return; // เต็มอยู่แล้ว ไม่ต้องเปลือง

      almondInventory--;
      playerEnergy = Math.min(100, playerEnergy + ALMOND_RESTORE_AMOUNT);
      playDrinkSound();
      updateEnergyHUD();

      const notif = document.getElementById('item-notification');
      notif.innerText = (hasRevealedSanity ? `+${ALMOND_RESTORE_AMOUNT}% SANITY` : `+${ALMOND_RESTORE_AMOUNT}% ENERGY`) + ` — เหลือ ${almondInventory}/${ALMOND_INVENTORY_MAX} ขวด`;
      notif.style.display = 'block';
      setTimeout(() => { notif.style.display = 'none'; }, 2200);
    }

    function getNearestHidingDist() {
      let best = Infinity;
      for (const h of hidingSpots) {
        const d = Math.hypot(camera.position.x - h.x, camera.position.z - h.z);
        if (d < best) best = d;
      }
      return best;
    }

    function getNearestHidingSpot() {
      let best = null, bestDist = Infinity;
      for (const h of hidingSpots) {
        const d = Math.hypot(camera.position.x - h.x, camera.position.z - h.z);
        if (d < bestDist) { bestDist = d; best = h; }
      }
      return best;
    }

    lockerSlitEl = document.getElementById('locker-slit');

    function toggleHiding() {
      if (!window.gameEngineStarted || isJumpscareActive) return;

      if (isHiding) {
        // ออกจากตู้ — เด้งกลับไปตำแหน่ง/มุมมองเดิมก่อนเข้าไปซ่อน
        isHiding = false;
        camera.position.copy(preHidePosition);
        cameraYaw = preHideYaw;
        cameraPitch = preHidePitch;
        if (lockerSlitEl) lockerSlitEl.style.display = 'none';
        return;
      }

      const spot = getNearestHidingSpot();
      if (!spot || getNearestHidingDist() > HIDE_INTERACT_DIST) return;

      // จำตำแหน่ง/มุมมองก่อนเข้าไปซ่อนไว้ย้อนกลับตอนออก
      preHidePosition.copy(camera.position);
      preHideYaw = cameraYaw;
      preHidePitch = cameraPitch;

      // ขยับกล้องเข้าไป "อยู่ในตู้" จริงๆ แล้วหันหน้าออกไปทางที่เดินเข้ามา (มองผ่านช่องล็อคเกอร์)
      const dx = camera.position.x - spot.x;
      const dz = camera.position.z - spot.z;
      const len = Math.max(0.001, Math.hypot(dx, dz));
      const fx = dx / len, fz = dz / len;
      camera.position.x = spot.x;
      camera.position.z = spot.z;
      camera.position.y = 1.55; // หมอบตัวลงนิดหน่อยเหมือนย่อแอบอยู่ในตู้
      cameraYaw = Math.atan2(-fx, -fz);
      cameraPitch = 0;
      hidingBaseYaw = cameraYaw;

      isHiding = true;
      if (lockerSlitEl) lockerSlitEl.style.display = 'block';
    }

    // จำกัดมุมมองระหว่างซ่อนตัว ให้แอบมองได้แค่แคบๆ ผ่านช่องล็อคเกอร์เหมือนคนหมอบอยู่ในตู้
    function clampHidingLook() {
      if (!isHiding) return;
      let rel = cameraYaw - hidingBaseYaw;
      rel = Math.max(-HIDE_PEEK_YAW_RANGE, Math.min(HIDE_PEEK_YAW_RANGE, rel));
      cameraYaw = hidingBaseYaw + rel;
      cameraPitch = Math.max(-HIDE_PEEK_PITCH_RANGE, Math.min(HIDE_PEEK_PITCH_RANGE, cameraPitch));
    }

    // -------------------------------------------------------------
    // Controls
    // -------------------------------------------------------------
    window.addEventListener('keydown', (e) => { 
      if (window.actTransitionActive || window.farewellSequenceActive) return;
      if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
        // ถ้าย้ายที่ตอนกำลังพันแผล ให้ยกเลิกการทำแผล
        if (isHealing && (e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'KeyA' || e.code === 'KeyD')) {
          isHealing = false;
          const notif = document.getElementById('item-notification');
          if (notif) {
            notif.innerHTML = "<span style='color:#ff8888;'>การปฐมพยาบาลถูกยกเลิกเนื่องจากขยับตัว</span>";
            notif.style.display = 'block';
            setTimeout(() => { notif.style.display = 'none'; }, 2000);
          }
        }
      }
    });
    window.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.code)) keys[e.code] = false; });
    window.addEventListener('keydown', (e) => {
      if (window.actTransitionActive || window.farewellSequenceActive) return;
      if (e.code === 'KeyF') triggerCameraFlash();
      if (e.code === 'KeyE') toggleHiding();
      if (e.code === 'KeyQ') useAlmondBottle();

      // การควบคุมเฉพาะ Act 2 (นักสืบ)
      if (currentAct === 2) {
        if (e.code === 'KeyR') {
          if (window.onAttackInput) window.onAttackInput();
        }
        if (e.code === 'KeyC') {
          if (window.confirmIdentity) window.confirmIdentity();
        }
        if (e.code === 'KeyH') {
          if (window.useFirstAidKit) window.useFirstAidKit();
        }
        if (e.code === 'KeyT') {
          if (window.toggleInvestigativeFlashlight) window.toggleInvestigativeFlashlight();
        }
        if (e.code === 'KeyX') {
          if (window.cycleNextWeapon) window.cycleNextWeapon();
        }
        if (e.code === 'KeyG') {
          if (window.throwAlmondBottle) window.throwAlmondBottle();
        }
      }
    });

    // คลิกซ้ายโจมตี (Act 2)
    document.addEventListener('mousedown', (e) => {
      if (window.actTransitionActive || window.farewellSequenceActive) return;
      if (e.button === 0 && currentAct === 2 && document.pointerLockElement === document.body && window.gameEngineStarted && !isJumpscareActive) {
        if (window.onAttackInput) window.onAttackInput();
      }
    });

    const drinkBtn = document.getElementById('drink-btn');
    if (drinkBtn) {
      drinkBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        useAlmondBottle();
      });
    }

    const hideBtn = document.getElementById('hide-btn');
    hideBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      toggleHiding();
    });

    function triggerSprint() {
      if (!window.gameEngineStarted || isJumpscareActive || isHiding) return;
      const now = performance.now();
      if (isSprintBoost || now < sprintCooldownEndTime) return; // ยังวิ่งอยู่ หรือยังคูลดาวน์ไม่หมด
      if (playerEnergy < SPRINT_MIN_ENERGY) return; // Energy/Sanity ไม่พอ

      isSprintBoost = true;
      sprintBoostEndTime = now + SPRINT_DURATION;
      sprintCooldownEndTime = sprintBoostEndTime + SPRINT_COOLDOWN;
      playerEnergy = Math.max(0, playerEnergy - SPRINT_ENERGY_COST);
      playSprintSound();
      emitNoise(camera.position.x, camera.position.z, 20); // วิ่งเสียงดัง The Duller ได้ยินจากไกล
    }

    const sprintBtn = document.getElementById('sprint-btn');
    sprintBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      triggerSprint();
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') {
        triggerSprint();
      }
    });

    const flashBtn = document.getElementById('flash-btn');
    flashBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      triggerCameraFlash();
    });

    document.body.addEventListener('click', (e) => {
      if (window.gameEngineStarted && !e.target.closest('.dialog-layer') && !isJumpscareActive) {
        try { document.body.requestPointerLock(); } catch(err) {}
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === document.body && window.gameEngineStarted && !isJumpscareActive) {
        const turnMult = (typeof cameraTurnSpeedMult !== 'undefined') ? cameraTurnSpeedMult : 1.0;
        cameraYaw -= e.movementX * 0.0024 * turnMult;
        cameraPitch -= e.movementY * 0.0024 * turnMult;
        cameraPitch = Math.max(-1.3, Math.min(1.3, cameraPitch));
        clampHidingLook();
      }
    });

    const joyBase = document.getElementById('joy-base');
    const joyHandle = document.getElementById('joy-handle');
    let joyTouchId = null;
    let joyCenter = { x: 0, y: 0 };

    joyBase.addEventListener('touchstart', (e) => {
      if (isJumpscareActive) return;
      e.preventDefault();
      const touch = e.changedTouches[0];
      joyTouchId = touch.identifier;
      const rect = joyBase.getBoundingClientRect();
      joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      updateJoy(touch.clientX, touch.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (isJumpscareActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joyTouchId) { e.preventDefault(); updateJoy(touch.clientX, touch.clientY); }
      }
    }, { passive: false });

    const resetJoy = () => {
      joyTouchId = null;
      joyVector.x = 0;
      joyVector.y = 0;
      joyHandle.style.transform = `translate(-50%, -50%)`;
    };
    window.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joyTouchId) resetJoy();
      }
    });
    window.addEventListener('touchcancel', resetJoy);

    function updateJoy(cx, cy) {
      const dx = cx - joyCenter.x;
      const dy = cy - joyCenter.y;
      const dist = Math.hypot(dx, dy);
      const maxR = 46;
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, maxR);
      const hx = Math.cos(angle) * clampedDist;
      const hy = Math.sin(angle) * clampedDist;
      joyHandle.style.transform = `translate(calc(-50% + ${hx}px), calc(-50% + ${hy}px))`;
      joyVector.x = hx / maxR;
      joyVector.y = hy / maxR;
    }

    const touchLook = document.getElementById('touch-look');
    lookTouchId = null;
    lastLookX = 0; lastLookY = 0;
    // เดิมค่า dx/dy จากทัชจะถูกยัดเข้า cameraYaw/Pitch ทันทีในตัว touchmove event เอง
    // ปัญหาคือตอนอีกมือถือจอยสติ๊กพร้อมกัน เบราว์เซอร์มือถือจะยิง touchmove ของนิ้วทั้งสองมาไม่สม่ำเสมอ/เป็นชุดๆ (coalesced)
    // ทำให้กล้องหมุนกระตุกเป็นห้วงๆ แทนที่จะลื่นตามเฟรม — แก้โดยแค่ "สะสม" ค่า dx/dy ไว้ในตัวแปรนี้
    // แล้วไปใช้ทีเดียวในลูปเรนเดอร์ (เฟรมละครั้งเท่านั้น) ให้ camera sync กับจังหวะเฟรมเสมอ ไม่ว่า touch event จะมาถี่/ห่างแค่ไหน
    pendingLookDX = 0; pendingLookDY = 0;

    touchLook.addEventListener('touchstart', (e) => {
      if (isJumpscareActive) return;
      e.preventDefault();
      const touch = e.changedTouches[0];
      lookTouchId = touch.identifier;
      lastLookX = touch.clientX;
      lastLookY = touch.clientY;
    }, { passive: false });

    touchLook.addEventListener('touchmove', (e) => {
      if (isJumpscareActive) return;
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === lookTouchId) {
          pendingLookDX += touch.clientX - lastLookX;
          pendingLookDY += touch.clientY - lastLookY;
          lastLookX = touch.clientX;
          lastLookY = touch.clientY;
        }
      }
    }, { passive: false });

    touchLook.addEventListener('touchend', () => { lookTouchId = null; pendingLookDX = 0; pendingLookDY = 0; });

    function isWall(x, z, r = 0.44) {
      const d = r * 0.707;
      const points = [
        [x, z - r], [x, z + r], [x - r, z], [x + r, z],
        [x - d, z - d], [x + d, z - d], [x - d, z + d], [x + d, z + d]
      ];
      for (let i = 0; i < points.length; i++) {
        const col = Math.floor(points[i][0] / CELL);
        const row = Math.floor(points[i][1] / CELL);
        if (row < 0 || row >= MAP_SIZE || col < 0 || col >= MAP_SIZE) return true;
        if (GRID[row] && GRID[row][col] === 1) return true;
      }
      return false;
    }
    window.isWall = isWall;

    let lastTime = performance.now();

    // นาฬิกา CCTV มุมจอ — เดินตามเวลาจริงไปเรื่อยๆ ตั้งแต่โหลดหน้าเว็บ ไม่ผูกกับสถานะเกม
    // (ของเดิมเป็นข้อความ hardcode 22:48:12 เฉยๆ ไม่มีอะไรอัพเดตเลย)
    (function startCctvClock() {
      const el = document.getElementById('cctv-clock');
      if (!el) return;
      let secs = 22 * 3600 + 48 * 60 + 12; // เริ่มที่ 22:48:12
      setInterval(() => {
        secs = (secs + 1) % 86400;
        const h = String(Math.floor(secs / 3600)).padStart(2, '0');
        const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        el.textContent = `${h}:${m}:${s}`;
      }, 1000);
    })();
    footstepDist = 0;
    // ค่าที่ smooth ไว้ระหว่างเฟรม ทำให้เร่ง/หยุดเดินนุ่มขึ้น แต่ยังคงจังหวะก้าวเดิน (ไม่ล่องลอย)
    smoothMoveFwd = 0;
    smoothMoveSide = 0;
    staticCanvas = document.getElementById('noise-canvas');
    if (staticCanvas) {
      staticCtx = staticCanvas.getContext('2d');
      staticCanvas.width = 160;
      staticCanvas.height = 120;
    }
    dreadVignetteEl = document.getElementById('dread-vignette');
    subliminalFlashEl = document.getElementById('subliminal-flash');
    camFlashOverlayEl = document.getElementById('camera-flash-overlay');
    acidSplashEl = document.getElementById('acid-splash-overlay');
    gapWarpEl = document.getElementById('gap-warp-overlay');
    viewportEl = document.getElementById('viewport');
    hudEl = document.querySelector('.hud');
    chromaEl = document.getElementById('chroma-aberration');
    peripheralGlitchEl = document.getElementById('peripheral-glitch');
    peripheralFigureEl = peripheralGlitchEl ? peripheralGlitchEl.querySelector('.figure') : null;
    nextPeripheralGlitchTime = performance.now() + 13000 + Math.random() * 9000;

    // ปุ่ม Touch สำหรับมือถือใน Act 2
    const attackTouchBtn = document.getElementById('attack-touch-btn');
    if (attackTouchBtn) {
      attackTouchBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (window.onAttackInput) window.onAttackInput();
      });
    }

    const weaponTouchBtn = document.getElementById('weapon-touch-btn');
    if (weaponTouchBtn) {
      weaponTouchBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (window.cycleNextWeapon) window.cycleNextWeapon();
      });
    }

    const anchorTouchBtn = document.getElementById('anchor-touch-btn');
    if (anchorTouchBtn) {
      anchorTouchBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (window.confirmIdentity) window.confirmIdentity();
      });
    }

    const healTouchBtn = document.getElementById('heal-touch-btn');
    if (healTouchBtn) {
      healTouchBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (window.useFirstAidKit) window.useFirstAidKit();
      });
    }


