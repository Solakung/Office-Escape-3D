// =============================================================
// OFFICE ESCAPE 3D: ภาค 2 — PLAYER COMBAT & WEAPON STATE MACHINE
// "สู้ได้ แต่ไม่มีวันชนะ" (Silent Hill f – inspired)
// =============================================================

(function() {
  const WEAPON_CONFIG = {
    unarmed: {
      type: 'unarmed',
      name: 'มือเปล่า',
      windupMs: 250,
      recoveryHitMs: 500,
      recoveryMissMs: 700,
      range: 1.3,
      noiseRadius: 3,
      breakChance: 0
    },
    lan_cable: {
      type: 'lan_cable',
      name: 'สายแลนพันแส้',
      windupMs: 300,
      recoveryHitMs: 600,
      recoveryMissMs: 850,
      range: 2.0,
      noiseRadius: 5,
      breakChance: 0.05
    },
    fluorescent_tube: {
      type: 'fluorescent_tube',
      name: 'หลอดฟลูออเรสเซนต์',
      windupMs: 280,
      recoveryHitMs: 550,
      recoveryMissMs: 800,
      range: 1.6,
      noiseRadius: 4,
      breakChance: 1.0 // แตกทันทีที่ฟาดโดน พร้อมวาบแสงจ้าสตัน Smiler ได้
    },
    office_chair: {
      type: 'office_chair',
      name: 'เก้าอี้มีล้อ',
      windupMs: 400,
      recoveryHitMs: 700,
      recoveryMissMs: 950,
      range: 1.8,
      noiseRadius: 8,
      breakChance: 0.15
    },
    stapler: {
      type: 'stapler',
      name: 'เครื่องเย็บกระดาษอุตสาหกรรม',
      windupMs: 600,
      recoveryHitMs: 900,
      recoveryMissMs: 1300,
      range: 1.7,
      noiseRadius: 6,
      breakChance: 0.08
    },
    fire_extinguisher: {
      type: 'fire_extinguisher',
      name: 'ถังดับเพลิง',
      windupMs: 350,
      recoveryHitMs: 650,
      recoveryMissMs: 900,
      range: 3.0,
      noiseRadius: 3,
      breakChance: 0,
      pressure: 100 // -20% ต่อการพ่น
    },
    revolver: {
      type: 'revolver',
      name: 'ปืนพก (6 นัด)',
      windupMs: 150,
      recoveryHitMs: 400,
      recoveryMissMs: 400,
      range: 22.0,
      noiseRadius: 42, // เสียงกึกก้องเรียกมอนสเตอร์ทุกตัวในแมพ
      breakChance: 0
    }
  };

  window.WEAPON_CONFIG = WEAPON_CONFIG;
  const EXTINGUISHER_PRESSURE_COST = 20; // ตรงกับคอมเมนต์ใน WEAPON_CONFIG.fire_extinguisher (-20% ต่อการพ่น = พ่นได้ 5 ครั้ง)

  const ENTITY_CONFIG = {
    smiler: {
      baseSpeed: 1.2,
      chaseSpeed: 4.15,
      canBeHitWhen: (e) => (smilerStunUntil > performance.now()), // ตีได้เฉพาะตอนถูกแสงสตัน
      maxWoundStage: 2,
      staggerChanceOverride: 0.5,
      weaknessTag: 'LIGHT_FLASH',
      onHitBlocked: 'WHIFF_THROUGH',
      deep: { stunWindowMs: 700 }
    },
    bacteria: {
      baseSpeed: 1.0,
      chaseSpeed: 3.4,
      canBeHitWhen: () => true,
      maxWoundStage: 3,
      staggerChanceOverride: 0.4,
      deep: { reachBonus: 0.6 }
    },
    duller: {
      baseSpeed: 1.4,
      chaseSpeed: 5.4,
      canBeHitWhen: () => (dullerLungeUntil <= performance.now()),
      maxWoundStage: 2,
      staggerChanceOverride: 0.3,
      onAttackAttempt: 'EMIT_NOISE',
      weaknessTag: 'FLANK_ATTACK',
      deep: { hearingRadiusBonus: 10 }
    },
    acidMan: {
      baseSpeed: 1.1,
      chaseSpeed: 3.0,
      canBeHitWhen: () => true,
      maxWoundStage: 3,
      staggerChanceOverride: 0.4,
      weaknessTag: 'FIRE_EXTINGUISHER_NEUTRALIZE',
      deep: { acidPoolOnMiss: true, acidPoolDurationMs: 15000 }
    },
    gapped: {
      canBeHitWhen: () => false, // ห้ามเป็นเป้าหมายของระบบต่อสู้ปกติ
      isBossKeyEntity: true,
      deep: { seamOpenWindowMs: 1800 }
    }
  };

  window.ENTITY_CONFIG = ENTITY_CONFIG;

  // แก้บั๊ก 3 (2.7): กลไก "จัดการรอยแยกของ The Gapped ถูกจังหวะ" ที่ GDD ต้องการ ยังไม่เคยถูก implement เลย
  // ผู้เล่นต้องกดโจมตี (KeyR / คลิกซ้าย) ระหว่างถูกลาก (gappedGrabActive) ให้ตรงช่วงจังหวะที่กำหนด
  // ถ้าถูกจังหวะ -> gappedSeamHeldOpen = true ค้างไว้ชั่วคราว ให้พอมีเวลาวิ่งไปถึงประตู EXIT เพื่อฉากจบจริง
  const GAPPED_SEAM_WINDOW_START_MS = 250;
  const GAPPED_SEAM_WINDOW_END_MS = 650;
  const GAPPED_SEAM_OPEN_MS_NORMAL = 45000;   // มีเวลาเดินไปถึง EXIT พอสมควรตอนสภาพยังไม่ลึกมาก
  const GAPPED_SEAM_OPEN_MS_DEEP = 1800;      // Deep State (2.3): ความเป็นจริงเริ่มยุบตัว รอยแยกจะปิดเร็วกว่าเดิมมาก ยากขึ้นตามสเปก

  // นับได้แค่ "ครั้งเดียวต่อการถูกลาก 1 ครั้ง" — ถ้าปล่อยให้กดซ้ำได้ ผู้เล่นแค่กดรัวก็ต้องมีสักครั้งที่ตกในช่วงจังหวะเสมอ
  // กลไก "ถูกจังหวะ" จึงไม่มีความหมาย (และกดครั้งที่พลาดก่อนถึงช่วงจังหวะก็จะไปทับข้อความสำเร็จด้วย)
  let lastSeamAttemptGrabStart = -1;
  let lastSeamCueGrabStart = -1;
  let seamWindowCueShown = false;

  // เรียกทุกเฟรมระหว่างถูก The Gapped ลาก (องก์ 2) จาก render-loop.js — บอกผู้เล่นว่ามีกลไกนี้อยู่ และให้สัญญาณตอนถึงช่วงจังหวะ
  // (เดิมไม่มีอะไรบอกผู้เล่นเลย ฉากจบจริงจึงยังแทบเป็นไปไม่ได้ในทางปฏิบัติ เพราะไม่มีใครรู้ว่าต้องกดอะไรตอนโดนลาก)
  window.updateGappedSeamCue = function(elapsedMs) {
    if (currentAct !== 2) return;
    if (lastSeamCueGrabStart !== gappedGrabStartTime) {
      lastSeamCueGrabStart = gappedGrabStartTime;
      seamWindowCueShown = false;
      showItemNotification(`<span style="color:#78f0d8;">🌀 รอยแยกกำลังดูดคุณเข้าไป!</span><br>กดโจมตี (R / คลิก / ปุ่มโจมตี) <b>ตอนจอวาบสีฟ้า</b> เพื่อรั้งรอยแยกไว้`);
    }
    if (!seamWindowCueShown && elapsedMs >= GAPPED_SEAM_WINDOW_START_MS) {
      seamWindowCueShown = true;
      const flash = document.getElementById('camera-flash-overlay');
      if (flash) {
        flash.style.background = '#78f0d8';
        flash.style.opacity = '0.5';
        setTimeout(() => {
          flash.style.opacity = '0';
          flash.style.background = '#ffffff';
        }, GAPPED_SEAM_WINDOW_END_MS - GAPPED_SEAM_WINDOW_START_MS);
      }
    }
  };

  function handleGappedSeamAttempt() {
    if (lastSeamAttemptGrabStart === gappedGrabStartTime) return;
    lastSeamAttemptGrabStart = gappedGrabStartTime;

    const elapsed = performance.now() - gappedGrabStartTime;
    if (elapsed >= GAPPED_SEAM_WINDOW_START_MS && elapsed <= GAPPED_SEAM_WINDOW_END_MS) {
      const gappedCfg = window.getEffectiveEntityConfig ? window.getEffectiveEntityConfig('gapped') : null;
      const openMs = (deepStateActive && gappedCfg && gappedCfg.seamOpenWindowMs) ? gappedCfg.seamOpenWindowMs : GAPPED_SEAM_OPEN_MS_NORMAL;
      gappedSeamHeldOpen = true;
      gappedSeamOpenUntil = performance.now() + openMs;
      if (window.playAnchorSound) window.playAnchorSound();
      showItemNotification(`<span style="color:#78f0d8;">🌀 คุณดึงรั้งรอยแยกไว้ได้ถูกจังหวะ! รีบไปที่ EXIT ก่อนมันจะปิดอีกครั้ง</span>`);
    } else {
      showItemNotification(`<span style="color:#d95b5b;">พลาดจังหวะ! รอยแยกลากคุณไปแล้ว...</span>`);
    }
  }
  window.handleGappedSeamAttempt = handleGappedSeamAttempt;

  window.getEffectiveEntityConfig = function(type) {
    const base = ENTITY_CONFIG[type];
    if (!base) return null;
    if (!deepStateActive || !base.deep) return base;
    return { ...base, ...base.deep };
  };

  // เริ่มต้นอาวุธของนักสืบ
  window.initializeDetectiveWeapons = function() {
    weaponsInventory = [
      { ...WEAPON_CONFIG.revolver },
      { ...WEAPON_CONFIG.unarmed }
    ];
    currentWeapon = weaponsInventory[0];
  };

  // ตรวจจับ Entity ที่ใกล้ที่สุดในระยะโจมตีและมุมเล็ง (Cone / Hitbox)
  function findNearestEntityInHitbox(maxRange) {
    if (!camera) return null;
    const camPos = camera.position;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    const entities = [
      { type: 'smiler', rig: smilerRig },
      { type: 'bacteria', rig: bacteriaRig },
      { type: 'duller', rig: dullerRig },
      { type: 'acidMan', rig: acidManRig },
      { type: 'gapped', rig: gappedRig }
    ];

    let bestEntity = null;
    let bestDist = maxRange;

    for (const ent of entities) {
      if (!ent.rig || !ent.rig.visible) continue;
      // ข้ามตัวที่กำลังวิ่งหนี (FLEEING)
      if (entityFleeState[ent.type]) continue;

      const toEnt = new THREE.Vector3().subVectors(ent.rig.position, camPos);
      const dist = toEnt.length();
      if (dist > maxRange) continue;

      toEnt.normalize();
      const dot = camDir.dot(toEnt);
      // มุมมองกว้าง ~60 องศา (dot > 0.5)
      if (dot > 0.45 && dist < bestDist) {
        bestDist = dist;
        bestEntity = { ...ent, dist, toEnt, dot };
      }
    }

    return bestEntity;
  }

  // เข้าสู่ Recovery state
  function enterRecovery(ms) {
    combatState = 'RECOVERY';
    combatStateUntil = performance.now() + ms;
    playerMoveSpeedMult = 0.5;
    cameraTurnSpeedMult = 0.6;
  }

  // จัดการการพังของอาวุธ (ระเบิด/แตก) — ปืนพกและถังดับเพลิงไม่ผ่านจุดนี้แล้ว
  // เพราะกระสุน/แรงดันถูกหักไปแล้วตอน "ยิง/พ่น" จริงใน resolveAttack() (แก้บั๊ก 5)
  function maybeBreakWeapon(weapon) {
    if (!weapon || weapon.type === 'unarmed' || weapon.type === 'revolver' || weapon.type === 'fire_extinguisher') return;

    if (Math.random() < (weapon.breakChance || 0)) {
      if (weapon.type === 'fluorescent_tube') {
        // หลอดไฟแตก: วาบแสงจ้า สตัน Smiler ทันที
        if (window.playGlassShatterSound) window.playGlassShatterSound();
        // Deep State (2.3): ยิ่งลึกยิ่งยาก — หน้าต่างเวลาสตันของ Smiler สั้นลงเหลือแค่ stunWindowMs
        const smilerCfg = window.getEffectiveEntityConfig ? window.getEffectiveEntityConfig('smiler') : null;
        const stunMs = (deepStateActive && smilerCfg && smilerCfg.stunWindowMs) ? smilerCfg.stunWindowMs : 3500;
        smilerStunUntil = performance.now() + stunMs;
        showItemNotification("หลอดไฟแตกกระจาย! แสงวาบสะกดเงาสำเร็จ");
        const flashOverlay = document.getElementById('camera-flash-overlay');
        if (flashOverlay) {
          flashOverlay.style.opacity = '1';
          setTimeout(() => { flashOverlay.style.opacity = '0'; }, 300);
        }
      } else {
        if (window.playWeaponBreakSound) window.playWeaponBreakSound();
        showItemNotification(`${weapon.name} พังเสียหาย!`);
      }
      removeWeaponFromInventory(weapon);
    }
  }

  function removeWeaponFromInventory(weapon) {
    weaponsInventory = weaponsInventory.filter(w => w !== weapon);
    if (weaponsInventory.length === 0) {
      weaponsInventory.push({ ...WEAPON_CONFIG.unarmed });
    }
    currentWeapon = weaponsInventory[0];
    if (window.updateAct2HUD) window.updateAct2HUD();
  }

  function showItemNotification(msg) {
    const notif = document.getElementById('item-notification');
    if (notif) {
      notif.innerHTML = msg;
      notif.style.display = 'block';
      setTimeout(() => { notif.style.display = 'none'; }, 2400);
    }
  }

  // เมื่อผู้เล่นฟาด/ยิงโดน Entity
  function applyHitToEntity(target, weapon, cfg) {
    const type = target.type;
    entityWoundStages[type] = (entityWoundStages[type] || 0) + 1;

    // เล่นเสียงโจมตีโดน
    if (window.playCombatHitSound) {
      window.playCombatHitSound(weapon.type, type);
    }

    // แฟลชสั่นสะเทือนกล้อง
    cameraPitch += (Math.random() - 0.5) * 0.05;

    // ถ้าโดนปืนพก หรือ บาดเจ็บสะสมถึงขีดสุด -> บังคับให้ Entity วิ่งหนีและไปเกิดใหม่
    const isLethalShot = (weapon.type === 'revolver');
    if (isLethalShot || entityWoundStages[type] >= cfg.maxWoundStage) {
      triggerFleeSequence(target);
      return;
    }

    // ตรวจสอบโอกาส Stagger (ชะงัก) vs Enrage (คลั่งเร็วกว่าเดิม)
    let staggerChance = cfg.staggerChanceOverride || 0.4;
    
    // โจมตี Duller จากด้านหลัง
    if (type === 'duller' && cfg.weaknessTag === 'FLANK_ATTACK') {
      const dullerDir = new THREE.Vector3(0, 0, 1).applyEuler(dullerRig.rotation);
      if (target.toEnt.dot(dullerDir) > 0.2) {
        staggerChance = 0.75; // ตีจากด้านหลังสะดุ้งชะงักสูงมาก
      }
    }

    if (Math.random() < staggerChance) {
      entityStaggerUntil[type] = performance.now() + 800 + Math.random() * 500;
    } else {
      // 25% คลั่ง เร็วขึ้นชั่วคราว
      if (Math.random() < 0.25) {
        entityEnrageUntil[type] = performance.now() + 5000 + Math.random() * 3000;
        showItemNotification(`⚠️ สัตว์ประหลาดตกใจคลั่ง! มันวิ่งเร็วขึ้น`);
      }
    }
  }

  // บังคับให้ Entity หนีไปพักฟื้นและเกิดใหม่ 40-60 วินาที
  function triggerFleeSequence(target) {
    const type = target.type;
    entityFleeState[type] = true;
    entityWoundStages[type] = 0; // รีเซ็ตบาดแผล
    entityRespawnTime[type] = performance.now() + 40000 + Math.random() * 20000;

    if (window.playEntityFleeSound) {
      window.playEntityFleeSound(type);
    }

    showItemNotification(`<span style="color:#a8e063;">ศัตรูบาดเจ็บหนักและหนีเข้าเงามืดชั่วคราว!</span>`);

    // ผลักให้วิ่งหนีห่างออกจากผู้เล่น
    if (target.rig) {
      const fleeDir = new THREE.Vector3().subVectors(target.rig.position, camera.position).normalize();
      target.rig.position.addScaledVector(fleeDir, 8.0);
    }
  }

  // คำนวณผลการโจมตีเมื่อหมดช่วง Windup
  function resolveAttack() {
    if (!currentWeapon) currentWeapon = WEAPON_CONFIG.unarmed;
    // จับอ้างอิงไว้ก่อนเริ่ม: ถ้ากระสุน/สารหมดพอดีนัดนี้ removeWeaponFromInventory() จะสลับ currentWeapon
    // (global) ไปเป็นอาวุธอื่นทันที แต่การคำนวณที่เหลือของการโจมตีนัดนี้ต้องยังอ้างอิงอาวุธเดิมที่ใช้ยิงอยู่
    const weapon = currentWeapon;

    // ถ้าเป็นปืนพก ตรวจสอบกระสุน
    if (weapon.type === 'revolver') {
      if (revolverAmmo <= 0) {
        if (window.playGunDryClick) window.playGunDryClick();
        showItemNotification("กระสุนหมด!");
        enterRecovery(weapon.recoveryMissMs);
        return;
      }

      // แก้บั๊ก 5: หักกระสุนตอน "ยิง" จริงทันที ไม่ใช่รอจนยืนยันว่าตีโดนเป้าหมายก่อน
      // (ของเดิมหักกระสุนใน maybeBreakWeapon ซึ่งเรียกเฉพาะตอนตีโดน — ทำให้ยิงพลาด/ไม่มีเป้าในระยะได้ฟรีไม่จำกัดครั้ง
      //  ทั้งที่ยังได้เสียงดังก้องเรียกมอนสเตอร์ทั้งแมพตามปกติ ขัดกับดีไซน์ "ปืน 6 นัด กระสุนหาเพิ่มไม่ได้")
      revolverAmmo = Math.max(0, revolverAmmo - 1);
      if (revolverAmmo <= 0) {
        showItemNotification("ปืนพก: กระสุนหมด! ไม่มีกระสุนสำรอง");
        removeWeaponFromInventory(weapon);
      }
      if (window.updateAct2HUD) window.updateAct2HUD();

      if (window.playGunshotSound) window.playGunshotSound();
      emitNoise(camera.position.x, camera.position.z, weapon.noiseRadius);
      // แสงแฟลชปากกระบอกปืน
      const flash = document.getElementById('camera-flash-overlay');
      if (flash) {
        flash.style.opacity = '0.9';
        setTimeout(() => { flash.style.opacity = '0'; }, 100);
      }
    } else {
      if (window.playWeaponSwingSound) {
        window.playWeaponSwingSound(weapon.type);
      }
      emitNoise(camera.position.x, camera.position.z, weapon.noiseRadius);

      // แก้บั๊ก 5: ถังดับเพลิงเสียสารตอน "พ่น" จริง ไม่ใช่ตอน "ตีโดน" เท่านั้น
      // กันพ่นเปล่าไม่จำกัดครั้งตอนไม่มีเป้าหมายในระยะ/มุมโจมตี
      if (weapon.type === 'fire_extinguisher') {
        weapon.pressure = Math.max(0, (weapon.pressure || 100) - EXTINGUISHER_PRESSURE_COST);
        if (weapon.pressure <= 0) {
          showItemNotification("ถังดับเพลิง: สารเคมีหมดเกลี้ยง!");
          removeWeaponFromInventory(weapon);
        }
        if (window.updateAct2HUD) window.updateAct2HUD();
      }
    }

    const target = findNearestEntityInHitbox(weapon.range);

    if (!target) {
      // ตีวืด / ยิงพลาด
      enterRecovery(weapon.recoveryMissMs);
      return;
    }

    const cfg = window.getEffectiveEntityConfig(target.type);
    if (!cfg || !cfg.canBeHitWhen(target)) {
      // ตีไม่เข้า / ทะลุเงา (เช่น Smiler ไม่ได้สตัน)
      if (window.playWhiffThroughSound) window.playWhiffThroughSound();
      showItemNotification("<span style='color:#d95b5b;'>ฟาดทะลุกลุ่มเงา! ต้องใช้แสงสะกดมันก่อน</span>");
      enterRecovery(weapon.recoveryMissMs);
      return;
    }

    applyHitToEntity(target, weapon, cfg);
    maybeBreakWeapon(weapon);
    enterRecovery(weapon.recoveryHitMs);
  }

  // Input รับคำสั่งโจมตี
  window.onAttackInput = function() {
    if (currentAct !== 2 || !window.gameEngineStarted || isHiding) return;

    // แก้บั๊ก 3: ระหว่างโดน The Gapped ลาก ปุ่มโจมตีใช้ "จัดการรอยแยกให้ถูกจังหวะ" แทนการโจมตีปกติ
    if (typeof gappedGrabActive !== 'undefined' && gappedGrabActive) {
      handleGappedSeamAttempt();
      return;
    }

    if (isJumpscareActive) return;
    if (combatState !== 'IDLE') return;

    const now = performance.now();
    if (now - lastAttackInputTime < ATTACK_INPUT_COOLDOWN) return;
    lastAttackInputTime = now;

    if (!currentWeapon) currentWeapon = WEAPON_CONFIG.unarmed;

    combatState = 'WINDUP';
    combatStateUntil = now + (currentWeapon.windupMs || 250);

    // ลดความเร็วการเคลื่อนที่และการหันกล้องระหว่างง้างอาวุธ
    playerMoveSpeedMult = 0.4;
    cameraTurnSpeedMult = 0.5;

    // สั่นกล้องเบาๆ เพื่อสื่อถึงน้ำหนักการง้าง
    cameraPitch += 0.02;
  };

  // อัปเดต Combat State ทุกเฟรมใน render loop
  window.updateCombatState = function(dt, now) {
    if (currentAct !== 2) return;

    if (combatState === 'WINDUP' && now >= combatStateUntil) {
      resolveAttack();
    } else if (combatState === 'RECOVERY' && now >= combatStateUntil) {
      combatState = 'IDLE';
      playerMoveSpeedMult = 1.0;
      cameraTurnSpeedMult = 1.0;
    }
  };

  // เปลี่ยนอาวุธที่ถือ
  window.cycleNextWeapon = function() {
    if (currentAct !== 2 || weaponsInventory.length <= 1) return;
    const currIdx = weaponsInventory.indexOf(currentWeapon);
    const nextIdx = (currIdx + 1) % weaponsInventory.length;
    currentWeapon = weaponsInventory[nextIdx];
    showItemNotification(`สลับอาวุธ: <b>${currentWeapon.name}</b>`);
    if (window.updateAct2HUD) window.updateAct2HUD();
  };

  // ยืนยันตัวตน (สมอยึดโยงโลกจริง - กุญแจรถ / ตราตำรวจ)
  window.confirmIdentity = function() {
    if (currentAct !== 2 || !window.gameEngineStarted || isJumpscareActive || isHiding) return;
    const now = performance.now();
    if (now - lastAnchorUseTime < ANCHOR_COOLDOWN_MS) {
      const waitSec = Math.ceil((ANCHOR_COOLDOWN_MS - (now - lastAnchorUseTime)) / 1000);
      showItemNotification(`สมอยึดโยง: รออีก ${waitSec} วินาที`);
      return;
    }

    lastAnchorUseTime = now;
    playerSanity = Math.min(100, playerSanity + 28);
    if (window.playAnchorSound) window.playAnchorSound();

    showItemNotification(`🔑 <b>"ฉันคือ... เจ้าหน้าที่สืบสวน... ฉันต้องกลับไป"</b><br><span style="color:#78f0d8;">+28% SANITY ฟื้นฟูสติ</span>`);
    if (window.updateAct2HUD) window.updateAct2HUD();
  };

  // ใช้ชุดปฐมพยาบาล (ต้องยืนนิ่ง 4 วินาที)
  window.useFirstAidKit = function() {
    if (currentAct !== 2 || !window.gameEngineStarted || isJumpscareActive || isHiding) return;
    if (firstAidKits <= 0) {
      showItemNotification("ไม่มีชุดปฐมพยาบาลเหลืออยู่!");
      return;
    }
    if (playerHP >= 100) {
      showItemNotification("พลังชีวิตเต็มอยู่แล้ว!");
      return;
    }
    if (isHealing) return;

    isHealing = true;
    healStartTime = performance.now();
    showItemNotification("กำลังพันแผล... <b>ห้ามขยับตัว 4 วินาที</b>");

    setTimeout(() => {
      if (!isHealing) return;
      isHealing = false;
      firstAidKits--;
      playerHP = Math.min(100, playerHP + 50);
      if (window.playHealSound) window.playHealSound();
      showItemNotification("<span style='color:#80ff80;'>+50 HP ปฐมพยาบาลสำเร็จ!</span>");
      if (window.updateAct2HUD) window.updateAct2HUD();
    }, HEAL_CHANNEL_MS);
  };

  // ขว้างขวดนมอัลมอนด์สร้างเสียงล่อ Duller
  window.throwAlmondBottle = function() {
    if (currentAct !== 2 || almondInventory <= 0) {
      showItemNotification("ไม่มีขวดนมอัลมอนด์สำหรับขว้างล่อเสียง!");
      return;
    }

    almondInventory--;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const landingPos = camera.position.clone().addScaledVector(camDir, 14.0);

    // ส่งสัญญาณเสียงดังระยะ 24 เมตร ณ จุดตก
    emitNoise(landingPos.x, landingPos.z, 24);
    if (window.playBottleCrashSound) window.playBottleCrashSound();

    showItemNotification("ขว้างขวดนมล่อเสียงสำเร็จ! The Duller จะพุ่งไปทางนั้น");
    if (window.updateAct2HUD) window.updateAct2HUD();
  };

  // เปิด/ปิดไฟฉายสืบสวน (Act 2)
  window.toggleInvestigativeFlashlight = function() {
    if (currentAct !== 2 || !flashlight) return;
    investigativeFlashlightOn = !investigativeFlashlightOn;
    flashlight.intensity = investigativeFlashlightOn ? 1.6 : 0;
    showItemNotification(investigativeFlashlightOn ? "ไฟฉายสืบสวน: เปิด" : "ไฟฉายสืบสวน: ปิด");
  };

  // เก็บอาวุธที่ตกตามพื้นในระยะประชิด
  window.checkAct2WeaponPickups = function() {
    if (currentAct !== 2 || !camera || !weaponPickupMeshes) return;
    const camPos = camera.position;

    for (let i = weaponPickupMeshes.length - 1; i >= 0; i--) {
      const p = weaponPickupMeshes[i];
      const dist = Math.hypot(camPos.x - p.x, camPos.z - p.z);
      if (dist < 1.6) {
        // เก็บไอเทม
        if (p.type === 'first_aid') {
          if (firstAidKits < 3) {
            firstAidKits++;
            showItemNotification(`+1 ชุดปฐมพยาบาล (มี ${firstAidKits}/3)`);
            removePickup(i);
          }
        } else if (WEAPON_CONFIG[p.type]) {
          const newWep = { ...WEAPON_CONFIG[p.type] };
          weaponsInventory.push(newWep);
          currentWeapon = newWep;
          showItemNotification(`ได้รับอาวุธ: <b>${newWep.name}</b>`);
          removePickup(i);
          if (window.updateAct2HUD) window.updateAct2HUD();
        }
      }
    }

    function removePickup(idx) {
      const item = weaponPickupMeshes[idx];
      if (item.mesh && item.mesh.parent) item.mesh.parent.remove(item.mesh);
      weaponPickupMeshes.splice(idx, 1);
    }
  };

})();
