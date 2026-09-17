// =============================================================
// OFFICE ESCAPE 3D: ภาค 2 — ACT STATE & TRANSITION SYSTEM
// =============================================================

(function() {
  // ฟังก์ชันช่วยเปลี่ยนเพลง/เสียงบรรยากาศตาม Tone (CALM, VIOLENT, DEEP)
  function swapAmbientAudio(tone) {
    if (window.playToneTransitionAudio) {
      window.playToneTransitionAudio(tone);
    }
  }

  // แสดงข้อความสลับองก์บนจอดำ
  function showTransitionText(line) {
    let overlay = document.getElementById('act-transition-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'act-transition-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '9999';
      overlay.style.background = '#000000';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.color = '#e0ded4';
      overlay.style.fontFamily = 'monospace';
      overlay.style.textAlign = 'center';
      overlay.style.padding = '30px';
      overlay.style.pointerEvents = 'none';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.8s ease';
      
      const p = document.createElement('div');
      p.id = 'act-transition-text';
      p.style.fontSize = '17px';
      p.style.lineHeight = '1.8';
      p.style.letterSpacing = '2px';
      p.style.maxWidth = '580px';
      overlay.appendChild(p);

      const sub = document.createElement('div');
      sub.id = 'act-transition-sub';
      sub.style.fontSize = '12px';
      sub.style.marginTop = '24px';
      sub.style.color = '#8a887b';
      sub.style.letterSpacing = '3px';
      overlay.appendChild(sub);

      document.body.appendChild(overlay);
    }

    const txt = document.getElementById('act-transition-text');
    const sub = document.getElementById('act-transition-sub');
    if (txt) txt.innerText = line;
    if (sub) sub.innerText = "— ภาค 2: การสืบสวน —";

    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });
  }

  function hideTransitionText(durationMs) {
    const overlay = document.getElementById('act-transition-overlay');
    if (!overlay) return;
    overlay.style.transition = `opacity ${durationMs / 1000}s ease`;
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, durationMs);
  }

  // เปลี่ยน HUD ระหว่าง Act 1 (พนักงานออฟฟิศ) และ Act 2 (นักสืบ)
  window.swapHudForAct = function(act) {
    const hudAct1 = document.getElementById('act1-hud-group');
    const hudAct2 = document.getElementById('act2-hud-group');
    const subTitle = document.getElementById('hud-subtitle');
    const objText = document.getElementById('objective-text');
    const meterLabel = document.getElementById('meter-label');
    const bottleContainer = document.getElementById('bottle-container');

    if (act === 2) {
      if (subTitle) subTitle.innerHTML = `<span style="color:#d95b5b;">● DETECTIVE CASE</span> // FILE #94-B`;
      if (objText) {
        objText.style.color = '#e3cc62';
        objText.innerText = `หลักฐานคดี: ${evidencePhotos}/12 ชิ้น`;
      }
      if (meterLabel) meterLabel.innerText = "HP:";
      if (bottleContainer) bottleContainer.style.display = 'none'; // นมถูกแทนที่ด้วยอาวุธและชุดปฐมพยาบาลใน Act 2
      
      let act2Container = document.getElementById('act2-hud-elements');
      if (act2Container) act2Container.style.display = 'block';

      // แสดงปุ่ม Touch เฉพาะ Act 2 (โจมตี / ยืนยันตัวตน / ทำแผล)
      const act2Touch = document.getElementById('act2-touch-controls');
      if (act2Touch) act2Touch.style.display = 'flex';
    } else {
      if (subTitle) subTitle.innerText = "BLDG-A: 4F // OFFICE FLOOR";
      if (objText) {
        objText.style.color = '#8fc4ff';
        objText.innerText = `บัตรผ่าน: ${keycardsCollected}/${KEYCARDS_REQUIRED}`;
      }
      if (meterLabel) meterLabel.innerText = "ENERGY:";
      if (bottleContainer) bottleContainer.style.display = 'block';

      let act2Container = document.getElementById('act2-hud-elements');
      if (act2Container) act2Container.style.display = 'none';

      const act2Touch = document.getElementById('act2-touch-controls');
      if (act2Touch) act2Touch.style.display = 'none';
    }
  };

  // รีเซ็ตสถานะตัวละครสำหรับนักสืบ (Act 2)
  window.resetPlayerStateForAct2 = function(carriedEvidence) {
    currentAct = 2;
    act2StartTime = performance.now();
    deepStateActive = false;
    playerHP = 100;
    playerSanity = 100;
    anchorHeld = true;
    lastAnchorUseTime = 0;
    revolverAmmo = 6;
    firstAidKits = 1;
    isHealing = false;
    investigativeFlashlightOn = false;
    flashlightBattery = 100;
    gappedSeamHeldOpen = false;
    gappedSeamOpenUntil = 0;
    hitTinnitusUntil = 0;
    screenBlurUntil = 0;
    
    // สำนวนคดีเริ่มต้นจากบันทึกที่พนักงานเคยเก็บได้ใน Act 1
    evidencePhotos = Math.min(12, (carriedEvidence ? carriedEvidence.size : 0));
    
    // อาวุธเริ่มต้นของนักสืบ: ปืนพก 6 นัด (ปืนฉุกเฉิน)
    if (window.initializeDetectiveWeapons) {
      window.initializeDetectiveWeapons();
    }

    if (window.updateAct2HUD) {
      window.updateAct2HUD();
    }
  };

  // วางอาวุธที่เก็บได้ใน Backrooms (Act 2) ทั่วแผนที่
  window.spawnAct2WeaponsInWorld = function() {
    // ลบอันเก่าถ้ามี
    if (weaponPickupMeshes && weaponPickupMeshes.length > 0) {
      for (const p of weaponPickupMeshes) {
        if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh);
      }
      weaponPickupMeshes = [];
    }

    if (!scene || !GRID || GRID.length === 0) return;

    const pickupTypes = [
      { type: 'fluorescent_tube', name: 'หลอดฟลูออเรสเซนต์', count: 6, color: 0xeaffd0 },
      { type: 'fire_extinguisher', name: 'ถังดับเพลิง', count: 4, color: 0xcc2222 },
      { type: 'lan_cable', name: 'สายแลนพันแส้', count: 5, color: 0x334466 },
      { type: 'stapler', name: 'เครื่องเย็บกระดาษอุตสาหกรรม', count: 4, color: 0x555555 },
      { type: 'first_aid', name: 'ชุดปฐมพยาบาล', count: 4, color: 0xffffff }
    ];

    for (const pt of pickupTypes) {
      for (let i = 0; i < pt.count; i++) {
        const spot = window.getRandomFloorCellNear ? window.getRandomFloorCellNear(camera.position.x, camera.position.z, 8, 48) : null;
        if (!spot) continue;

        let mesh;
        if (pt.type === 'fluorescent_tube') {
          mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8),
            new THREE.MeshStandardMaterial({ color: pt.color, emissive: 0x223311, roughness: 0.2 })
          );
          mesh.rotation.z = Math.PI / 2;
          mesh.position.set(spot.x, 0.2, spot.z);
        } else if (pt.type === 'fire_extinguisher') {
          mesh = new THREE.Group();
          const tank = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 0.55, 10),
            new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.3, metalness: 0.6 })
          );
          tank.position.y = 0.28;
          mesh.add(tank);
          mesh.position.set(spot.x, 0, spot.z);
        } else if (pt.type === 'first_aid') {
          mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.22, 0.28),
            new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 })
          );
          mesh.position.set(spot.x, 0.15, spot.z);
        } else {
          mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.15, 0.25),
            new THREE.MeshStandardMaterial({ color: pt.color, roughness: 0.5, metalness: 0.4 })
          );
          mesh.position.set(spot.x, 0.15, spot.z);
        }

        scene.add(mesh);
        weaponPickupMeshes.push({ mesh, type: pt.type, name: pt.name, x: spot.x, z: spot.z });
      }
    }
  };

  // ทำให้แผนที่เสื่อมโทรมลงใน Act 2 (Decay, Flickering, Liminal Corruption)
  window.degradeMapForAct2 = function(grid, options = {}) {
    const isDeep = options.intensity === 'DEEP';
    
    // เปลี่ยนหมอกให้หนาทึบและเหลืองขุ่นขึ้น
    if (scene && scene.fog) {
      scene.fog.color.setHex(isDeep ? 0x3d3514 : 0x544920);
      scene.fog.density = isDeep ? 0.028 : 0.022;
    }

    // หรี่ไฟนีออน และสุ่มให้ไฟกะพริบถี่ขึ้น
    if (ceilingLights && ceilingLights.length > 0) {
      for (let i = 0; i < ceilingLights.length; i++) {
        const l = ceilingLights[i];
        if (Math.random() < (isDeep ? 0.6 : 0.35)) {
          l.intensity = Math.random() * 0.4; // ไฟแทบดับ
        }
      }
    }

    if (ambientLight) {
      ambientLight.color.setHex(isDeep ? 0x3b3318 : 0x584e27);
    }

    // วางไอเทมอาวุธในฉากถ้าเพิ่งเข้า Act 2 ครั้งแรก
    if (!isDeep) {
      window.spawnAct2WeaponsInWorld();
    }
  };

  // ฟังก์ชันหลัก: Transition องก์ 1 -> องก์ 2
  window.transitionToAct2 = function({ tone, line }) {
    if (actTransitionActive) return;
    actTransitionActive = true;
    window.actTransitionActive = true;

    const fadeMs = (tone === 'VIOLENT') ? 1200 : 2200;

    showTransitionText(line);
    swapAmbientAudio(tone);

    // เก็บเอกสารที่พนักงานเคยเก็บได้ทั้งหมดเป็นสำนวนคดีเริ่มต้น
    carriedEvidence = new Set(window.collectedLoreSet || []);

    setTimeout(() => {
      // สลับเป็น Act 2
      currentAct = 2;
      window.currentAct = 2;

      window.resetPlayerStateForAct2(carriedEvidence);
      window.swapHudForAct(2);

      // ย้ายนักสืบมาที่จุดเริ่มต้นหน้าตึกเดิม
      camera.position.set(DETECTIVE_ENTRY_POINT.x, DETECTIVE_ENTRY_POINT.y, DETECTIVE_ENTRY_POINT.z);
      cameraYaw = 0;
      cameraPitch = 0;

      // ปรับปรุงสภาพตึกให้เสื่อมโทรมลง
      window.degradeMapForAct2(GRID);

      // ค่อยๆ สว่างขึ้นจากจอดำ
      hideTransitionText(1500);

      setTimeout(() => {
        actTransitionActive = false;
        window.actTransitionActive = false;
        
        // แจ้งเตือนเริ่มต้นสำหรับนักสืบ
        const notif = document.getElementById('item-notification');
        if (notif) {
          notif.innerHTML = `<b>แฟ้มคดี #94-B</b><br>คุณเข้ามาสืบหาพนักงานที่หายตัวไปในตึกนี้...`;
          notif.style.display = 'block';
          setTimeout(() => { notif.style.display = 'none'; }, 4000);
        }
      }, 1500);

    }, fadeMs);
  };

  // ฟังก์ชันสลับเหตุการณ์ปลาย Act 1
  window.onAct1ReachExit = function() {
    window.transitionToAct2({
      tone: 'CALM',
      line: 'ไม่มีใครได้ยินข่าวจากเขาอีกเลยหลังคืนนั้น...\nประตู EXIT ไม่ได้พาเขากลับสู่โลกภายนอก'
    });
  };

  window.onAct1Caught = function() {
    window.transitionToAct2({
      tone: 'VIOLENT',
      line: 'สามสัปดาห์ต่อมา... มีรายงานคนหายเพิ่มอีกหนึ่งคน\nตึกแห่งนี้ถูกตำรวจปิดล้อมเป็นเขตพื้นที่สอบสวน'
    });
  };

  // ตรวจสอบสถานะ Deep State ใน Act 2
  window.updateDeepStateCheck = function(act2ElapsedMs, sanity) {
    if (currentAct !== 2 || deepStateActive) return;
    if (act2ElapsedMs >= DEEP_STATE_TIME_MS || sanity <= DEEP_STATE_SANITY_THRESHOLD) {
      window.enterDeepState();
    }
  };

  window.enterDeepState = function() {
    deepStateActive = true;
    window.deepStateActive = true;
    swapAmbientAudio('DEEP');
    window.degradeMapForAct2(GRID, { intensity: 'DEEP' });

    const notif = document.getElementById('item-notification');
    if (notif) {
      notif.innerHTML = `<span style="color:#ff6666;">⚠️ REALITY COLLAPSING // DEEP STATE</span><br>มิติแห่งนี้เริ่มกลืนกินการมีอยู่ของคุณ...`;
      notif.style.display = 'block';
      setTimeout(() => { notif.style.display = 'none'; }, 4500);
    }
  };

  // ประเมินฉากจบทั้ง 4 แบบ (เฉพาะปลายองก์ 2)
  window.evaluateEnding = function(context) {
    if (currentAct !== 2) return null;
    const { atExitDoor, gappedSeamHeldOpen, sanity, evidencePhotos, keycardsCollected } = context;

    if (gappedSeamHeldOpen && sanity > 0) {
      return (evidencePhotos >= 12) ? 'ENDING_TRUE_COMPLETE' : 'ENDING_TRUE_ESCAPE';
    }

    if (atExitDoor && keycardsCollected >= KEYCARDS_REQUIRED) {
      return 'ENDING_FALSE_LOOP';
    }

    if (sanity <= 0) {
      return 'ENDING_BECOME_ENTITY';
    }

    return null;
  };

  // แสดงฉากจบ
  window.triggerEndingSequence = function(endingType) {
    window.gameEngineStarted = false;
    if (document.exitPointerLock) document.exitPointerLock();

    let endScreen = document.getElementById('act2-ending-screen');
    if (!endScreen) {
      endScreen = document.createElement('div');
      endScreen.id = 'act2-ending-screen';
      endScreen.className = 'dialog-layer';
      endScreen.style.display = 'flex';
      endScreen.style.zIndex = '10000';
      endScreen.innerHTML = `
        <h1 id="act2-end-title" style="font-size: 26px; letter-spacing: 3px; margin-bottom: 14px;"></h1>
        <div id="act2-end-badge" style="font-size: 13px; color: #d4bc62; letter-spacing: 2px; margin-bottom: 16px;"></div>
        <p id="act2-end-desc" style="max-width: 520px; line-height: 1.8; font-size: 13px; margin-bottom: 24px; color: #ccc6a0;"></p>
        <div class="menu-btn-row">
          <button id="act2-restart-btn" class="action-btn" onclick="doRestartGame(event)">เล่นใหม่อีกครั้ง (เริ่มที่องก์ 1)</button>
          <button id="act2-home-btn" class="action-btn secondary-btn" onclick="doBackToHome(event)">กลับหน้าหลัก</button>
        </div>
      `;
      document.body.appendChild(endScreen);
    }

    const titleEl = document.getElementById('act2-end-title');
    const badgeEl = document.getElementById('act2-end-badge');
    const descEl = document.getElementById('act2-end-desc');

    if (endingType === 'ENDING_TRUE_COMPLETE') {
      titleEl.style.color = '#78e888';
      titleEl.style.textShadow = '0 0 16px #4ce860';
      titleEl.innerText = "TRUE COMPLETE ENDING // ความจริงถูกเปิดเผย";
      badgeEl.innerText = "★ รอดชีวิตกลับโลกจริง + รวบรวมหลักฐานครบ 12 ชิ้น";
      descEl.innerHTML = `คุณพุ่งผ่านรอยแยกมิติของ The Gapped ออกมาได้สำเร็จก่อนที่ความทรงจำจะเลือนหาย<br><br>
        คุณตื่นขึ้นมาในรถสายตรวจหน้าอาคารพร้อมภาพถ่ายหลักฐานครบทั้ง 12 ใบ... 
        ชื่อของพนักงานทุกคนที่เคยหายสาบสูญไปถูกกู้คืนกลับสู่โลกจริง สำนวนคดีถูกคลี่คลาย และไม่มีใครถูกลืมอีกต่อไป`;
    } else if (endingType === 'ENDING_TRUE_ESCAPE') {
      titleEl.style.color = '#6ed6b8';
      titleEl.style.textShadow = '0 0 14px #2aa884';
      titleEl.innerText = "TRUE ESCAPE // หลุดพ้นจากวงกต";
      badgeEl.innerText = "หนีกลับโลกจริงสำเร็จ ผ่านรอยแยกมิติ";
      descEl.innerHTML = `คุณใช้สมอยึดโยงตัวตนและกระโดดข้ามรอยแยกมิติกลับออกมาได้ทันเวลา!<br><br>
        คุณรอดชีวิตกลับสู่โลกจริง แต่เอกสารหลักฐานของพนักงานคนก่อนๆ ยังไม่ครบถ้วน... 
        ชะตากรรมของพวกเขายังคงเป็นปริศนาที่จมดิ่งอยู่ในความมืดมิด`;
    } else if (endingType === 'ENDING_FALSE_LOOP') {
      titleEl.style.color = '#e5a55b';
      titleEl.style.textShadow = '0 0 15px #e5852b';
      titleEl.innerText = "FALSE LOOP // CASE UNSOLVED";
      badgeEl.innerText = "จบลวง: ประตู EXIT พาไปสู่ชั้นที่ลึกกว่าเดิม";
      descEl.innerHTML = `คุณใช้คีย์การ์ดปลดล็อกประตู EXIT และวิ่งออกไปอย่างมีความหวัง...<br><br>
        แต่เบื้องหลังประตูกลับเป็นโถงทางเดินสีเหลืองเดิมซ้ำอีกชั้นหนึ่ง โลกภายนอกไม่มีทางออกที่แท้จริงผ่านประตูธรรมดา 
        เหมือนกับที่พนักงานในองก์ 1 เคยเผชิญ`;
    } else if (endingType === 'ENDING_BECOME_ENTITY') {
      titleEl.style.color = '#bb66dd';
      titleEl.style.textShadow = '0 0 18px #9922cc';
      titleEl.innerText = "LOST IDENTITY // กลายเป็นหนึ่งในนั้น";
      badgeEl.innerText = "Sanity หมดลง: โลกจริงลืมคุณไปอย่างสมบูรณ์";
      descEl.innerHTML = `สติของคุณลดลงจนแตะศูนย์... คุณจำไม่ได้แล้วว่าตัวเองคือใคร มาที่นี่ทำไม หรือแม้แต่ชื่อของตัวเอง<br><br>
        ร่างกายของคุณค่อยๆ บิดเบี้ยว กลืนหายไปกับผนังสีเหลืองและสายเคเบิล 
        คุณกลายเป็น Entity ตัวใหม่ที่คอยเดินวนเวียนในเงามืดของ Level 0 ตลอดกาล`;
    }

    endScreen.style.display = 'flex';
  };
})();
