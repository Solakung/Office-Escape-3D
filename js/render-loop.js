    if (!window.formatSurvivalTime) {
      window.formatSurvivalTime = function(ms) {
        const totalSec = Math.max(0, Math.floor(ms / 1000));
        const mm = Math.floor(totalSec / 60);
        const ss = totalSec % 60;
        return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
      };
    }

    // -------------------------------------------------------------
    // Peripheral Vision Glitch: ร่างเงาวาบสั้นๆ ที่ขอบจอ ไม่ใช่ entity จริง
    // สุ่มเวลา/ตำแหน่ง/ฝั่งทุกครั้ง เพื่อให้ผู้เล่นไม่แน่ใจว่าเห็นจริงหรือหลอนไปเอง
    // -------------------------------------------------------------
    function triggerPeripheralGlitch() {
      if (!peripheralFigureEl) {
        if (!peripheralGlitchEl) peripheralGlitchEl = document.getElementById('peripheral-glitch');
        if (peripheralGlitchEl) peripheralFigureEl = peripheralGlitchEl.querySelector('.figure');
      }
      if (!peripheralFigureEl) return;
      const fromLeft = Math.random() < 0.5;
      const edgeOffset = -14 - Math.random() * 22; // px ให้โผล่มาแค่บางส่วนตรงขอบจอ
      const topPct = 6 + Math.random() * 48; // ค้างอยู่ครึ่งบนของจอ แถวสายตา
      peripheralFigureEl.style.left = fromLeft ? (edgeOffset + 'px') : '';
      peripheralFigureEl.style.right = fromLeft ? '' : (edgeOffset + 'px');
      peripheralFigureEl.style.top = topPct + '%';
      peripheralFigureEl.style.transform = fromLeft ? 'scaleX(1)' : 'scaleX(-1)';
      peripheralFigureEl.style.transition = 'none';
      peripheralFigureEl.style.opacity = (0.55 + Math.random() * 0.3).toFixed(2);
      const holdTime = 70 + Math.random() * 110; // วาบไวมาก กันคนจ้องทัน
      setTimeout(() => {
        if (!peripheralFigureEl) return;
        peripheralFigureEl.style.transition = 'opacity 0.12s ease';
        peripheralFigureEl.style.opacity = 0;
      }, holdTime);
    }

    function renderNoise() {
      if (!staticCtx) {
        if (!staticCanvas) staticCanvas = document.getElementById('noise-canvas');
        if (staticCanvas) {
          staticCtx = staticCanvas.getContext('2d');
          staticCanvas.width = 160;
          staticCanvas.height = 120;
        }
      }
      if (!staticCtx) return;
      const imgData = staticCtx.createImageData(160, 120);
      const buf = new Uint32Array(imgData.data.buffer);
      for (let i = 0; i < buf.length; i++) buf[i] = Math.random() > 0.5 ? 0xffffffff : 0xff111111;
      staticCtx.putImageData(imgData, 0, 0);
    }

    // จุดลาดตระเวนแบบ "วนเข้าหาผู้เล่น" แทนการสุ่มเซลล์ทั้งแมพ 70x70
    // แมพกว้าง ~250 เมตร ถ้าสุ่มจุดหมายทั้งแมพ ทิศที่ entity เดินจะสุ่มล้วนๆ
    // แทบไม่มีโอกาสเข้ามาในระยะตรวจจับ (12-22 เมตร) เลย — entity จึงเดินวนอยู่อีกฟากตึกตลอดเกม
    // ส่วนใหญ่จึงเล็งจุดใกล้ผู้เล่น เหลือส่วนน้อยไว้เดินเตร็ดเตร่จริงๆ กันไม่ให้เดาทางได้ว่ามันพุ่งเข้าหาเสมอ
    function pickStalkWaypoint() {
      if (Math.random() < 0.75) {
        return getRandomFloorCellNear(camera.position.x, camera.position.z, 2, 14) || getRandomFloorCell();
      }
      return getRandomFloorCell();
    }

    // -------------------------------------------------------------
    // Act 2: ระบบตรวจจับและรับดาเมจจากมอนสเตอร์
    // -------------------------------------------------------------
    function applyMonsterAttackToPlayer(monsterType, hpDmg, sanityDmg) {
      if (currentAct !== 2 || isJumpscareActive) return;
      const now = performance.now();
      if (now < window.lastPlayerHurtTime + 1100) return;
      window.lastPlayerHurtTime = now;

      playerHP = Math.max(0, playerHP - hpDmg);
      playerSanity = Math.max(0, playerSanity - sanityDmg);
      hitTinnitusUntil = now + 3500;
      screenBlurUntil = now + 2500;

      if (window.playTinnitusRinging) window.playTinnitusRinging();
      if (window.playCombatHitSound) window.playCombatHitSound('fist', monsterType);

      const damageFlash = document.getElementById('camera-flash-overlay');
      if (damageFlash) {
        damageFlash.style.background = '#880000';
        damageFlash.style.opacity = '0.65';
        setTimeout(() => {
          if (damageFlash) {
            damageFlash.style.opacity = '0';
            damageFlash.style.background = '#ffffff';
          }
        }, 220);
      }

      cameraPitch += (Math.random() - 0.5) * 0.14;
      cameraYaw += (Math.random() - 0.5) * 0.14;

      const entRig = (monsterType === 'smiler' ? smilerRig : monsterType === 'bacteria' ? bacteriaRig : monsterType === 'duller' ? dullerRig : acidManRig);
      if (entRig) {
        const pushDir = new THREE.Vector3().subVectors(entRig.position, camera.position).normalize();
        entRig.position.addScaledVector(pushDir, 2.2);
      }

      const notif = document.getElementById('item-notification');
      if (notif) {
        notif.innerHTML = `<span style="color:#ff5555;"><b>ถูกจู่โจม! -${hpDmg} HP (-${sanityDmg}% สติ)</b></span>`;
        notif.style.display = 'block';
        setTimeout(() => { if (notif) notif.style.display = 'none'; }, 2200);
      }

      if (window.updateAct2HUD) window.updateAct2HUD();

      if (playerHP <= 0) {
        isJumpscareActive = true;
        jumpscareTargetRig = entRig;
        jumpscareStartTime = now;
        if (window.playViolentJumpscareSound) window.playViolentJumpscareSound();
      }
    }
    window.applyMonsterAttackToPlayer = applyMonsterAttackToPlayer;

    window.updateAct2HUD = function() {
      if (currentAct !== 2) return;
      const hpFill = document.getElementById('hp-bar-fill');
      const hpText = document.getElementById('hp-text');
      if (hpFill) {
        hpFill.style.width = `${Math.max(0, Math.min(100, playerHP))}%`;
        hpFill.style.background = playerHP < 35 ? '#ff2222' : '#d94444';
      }
      if (hpText) hpText.textContent = `${Math.floor(playerHP)}`;

      const sanFill = document.getElementById('sanity-bar-fill');
      const sanText = document.getElementById('sanity-text');
      if (sanFill) sanFill.style.width = `${Math.max(0, Math.min(100, playerSanity))}%`;
      if (sanText) sanText.textContent = `${Math.floor(playerSanity)}%`;

      const wName = document.getElementById('weapon-name');
      if (wName) {
        if (currentWeapon && currentWeapon.type === 'revolver') {
          wName.textContent = `ปืนพก (${revolverAmmo}/6)`;
        } else if (currentWeapon) {
          wName.textContent = currentWeapon.name;
        } else {
          wName.textContent = 'มือเปล่า';
        }
      }

      const anch = document.getElementById('anchor-status');
      if (anch) {
        const now = performance.now();
        if (now - lastAnchorUseTime < ANCHOR_COOLDOWN_MS) {
          const rem = Math.ceil((ANCHOR_COOLDOWN_MS - (now - lastAnchorUseTime)) / 1000);
          anch.innerHTML = `สมอยึดโยง: <span style="color:#ffaa66;">คูลดาวน์ (${rem}s)</span>`;
        } else {
          anch.innerHTML = `สมอยึดโยง: <b style="color:#7cf0bd;">พร้อมใช้ [C]</b>`;
        }
      }

      const faCount = document.getElementById('firstaid-count');
      if (faCount) faCount.textContent = `${firstAidKits}`;

      const objText = document.getElementById('objective-text');
      if (objText) {
        objText.innerHTML = `หลักฐานคดี: <b>${evidencePhotos}/12 ชิ้น</b> (กด F ถ่ายรูป)`;
      }
    };

    // -------------------------------------------------------------
    // Main Loop
    // -------------------------------------------------------------
    function renderLoop() {
      requestAnimationFrame(renderLoop);
      if (!renderer || !scene || !camera) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      updateLightCulling(now); // ลดจำนวนไฟที่ active พร้อมกัน กันเครื่องมือถือกระตุก

      // ใช้ dx/dy ที่สะสมไว้จากทัชมุมกล้อง "เฟรมละครั้งเดียว" ให้ตรงจังหวะกับ render loop เป๊ะๆ
      // กันอาการกระตุกตอนอีกมือถือจอยสติ๊กพร้อมกัน (touch event ของสองนิ้วมาไม่สม่ำเสมอ)
      if (pendingLookDX !== 0 || pendingLookDY !== 0) {
        cameraYaw -= pendingLookDX * 0.005;
        cameraPitch -= pendingLookDY * 0.005;
        cameraPitch = Math.max(-1.3, Math.min(1.3, cameraPitch));
        clampHidingLook();
        pendingLookDX = 0;
        pendingLookDY = 0;
      }

      if (window.gameEngineStarted) {

        // =========================================================
        // JUMPSCARE: ล็อกสบตาระยะ 1.35 เมตร (เห็นหน้าชัด ไม่จมทะลุจอ)
        // =========================================================
        // =========================================================
        // GAP GRAB: The Gapped ลากผู้เล่นผ่านรอยแยกไปโผล่จุดอื่นในแมพ
        // ไม่ใช่จั๊มสแกร์ ไม่จบเกม — ผู้เล่นแค่เสียสติ/พลังงานก้อนหนึ่งแล้วถูกวาปไปที่อื่นแบบมึนงง
        // =========================================================
        if (gappedGrabActive && gappedRig) {
          const gElapsed = now - gappedGrabStartTime;

          const voidWorldPos = new THREE.Vector3();
          if (gappedFaceAnchor) gappedFaceAnchor.getWorldPosition(voidWorldPos);
          else voidWorldPos.set(gappedRig.position.x, gappedRig.position.y + 1.0, gappedRig.position.z);
          camera.lookAt(voidWorldPos.x, voidWorldPos.y, voidWorldPos.z);

          // ดึงตัวมันเข้าประชิดกล้อง เหมือนกำลังลากผู้เล่นเข้าไปในรอยแยกที่อก
          const toCam = new THREE.Vector3().subVectors(camera.position, gappedRig.position);
          toCam.y = 0;
          const pullDist = 0.85;
          if (toCam.length() > pullDist) {
            gappedRig.position.addScaledVector(toCam.normalize(), 8.0 * dt);
          }

          if (gappedLeftArm && gappedRightArm) {
            gappedLeftArm.rotation.x = -1.35 + Math.sin(now * 0.025) * 0.15;
            gappedRightArm.rotation.x = -1.35 + Math.sin(now * 0.025 + 1) * 0.15;
          }
          const gProgress = Math.min(1, gElapsed / GAPPED_GRAB_DURATION);
          if (gappedVoidRing) {
            gappedVoidRing.rotation.z += dt * (5 + gProgress * 10);
            gappedVoidRing.scale.setScalar(1 + gProgress * 1.6);
          }

          camera.position.x += (Math.random() - 0.5) * 0.06 * gProgress;
          camera.position.y += (Math.random() - 0.5) * 0.06 * gProgress;
          camera.rotation.z = (Math.random() - 0.5) * 0.07 * gProgress;

          if (gapWarpEl) gapWarpEl.style.opacity = (0.15 + gProgress * 0.8).toFixed(2);
          staticCanvas.style.opacity = Math.min(0.85, 0.1 + gProgress * 0.6);
          renderNoise();

          if (gElapsed > GAPPED_GRAB_DURATION) {
            gappedGrabActive = false;

            // สุ่มจุดโผล่ใหม่ให้ผู้เล่น พยายามหาจุดที่ห่างจากตำแหน่งเดิมพอสมควรกันวาปไปโผล่ที่เดิม/ติดกำแพง
            let dest = null;
            for (let attempt = 0; attempt < 12; attempt++) {
              const cand = getRandomFloorCell();
              if (cand.distanceTo(camera.position) > GAPPED_TELEPORT_MIN_DIST) { dest = cand; break; }
            }
            if (!dest) dest = getRandomFloorCell();
            camera.position.x = dest.x;
            camera.position.z = dest.z;
            camera.position.y = 1.5;
            cameraYaw = Math.random() * Math.PI * 2; // หันหน้าสุ่ม เพิ่มความมึนงงหลังโดนลาก
            cameraPitch = 0;

            // ตัวมันเองก็วาปหายไปที่อื่นพร้อมกัน ไม่ยืนจ่อซ้ำทันที แล้วกลับไปลาดตระเวนตามปกติ
            const awaySpot = getRandomFloorCellNear(camera.position.x, camera.position.z, 20, 34) || getRandomFloorCell();
            gappedRig.position.x = awaySpot.x;
            gappedRig.position.z = awaySpot.z;
            gappedState = 'PATROL';
            gappedWaypoint = null;
            gappedSearchUntil = 0;
            gappedGrabCooldownUntil = now + GAPPED_GRAB_COOLDOWN;

            if (currentAct === 1) {
              playerEnergy = Math.max(0, playerEnergy - GAPPED_SANITY_DRAIN);
              updateEnergyHUD();
            } else {
              playerSanity = Math.max(0, playerSanity - 22);
              playerHP = Math.max(0, playerHP - 15);
              if (window.updateAct2HUD) window.updateAct2HUD();
            }

            if (gapWarpEl) gapWarpEl.style.opacity = 0;
            staticCanvas.style.opacity = 0;

            const notif = document.getElementById('item-notification');
            notif.innerText = 'มันลากคุณผ่านรอยแยก... คุณโผล่มาอีกจุดหนึ่งแล้ว';
            notif.style.display = 'block';
            setTimeout(() => { notif.style.display = 'none'; }, 2600);
          }

          renderer.render(scene, camera);
          return;
        }

        if (isJumpscareActive && jumpscareTargetRig) {
          // เล็งกล้องไปที่ "จุดยึดหน้าจริง" ของ entity ตัวนั้นๆ (แต่ละตัวหัวอยู่คนละความสูงกันมาก
          // ใช้ offset คงที่ตัวเดียวแบบเดิมเลยกลายเป็นเห็นหัวหรือคางแทนหน้า)
          let faceAnchor = smilerFaceAnchor;
          if (jumpscareTargetRig === bacteriaRig) faceAnchor = bacteriaFaceAnchor;
          else if (jumpscareTargetRig === dullerRig) faceAnchor = dullerFaceAnchor;
          else if (jumpscareTargetRig === acidManRig) faceAnchor = acidManFaceAnchor;

          const faceWorldPos = new THREE.Vector3();
          if (faceAnchor) {
            faceAnchor.getWorldPosition(faceWorldPos);
          } else {
            faceWorldPos.set(jumpscareTargetRig.position.x, jumpscareTargetRig.position.y + 1.2, jumpscareTargetRig.position.z);
          }
          camera.lookAt(faceWorldPos.x, faceWorldPos.y, faceWorldPos.z);
          
          // รักษาระยะห่าง 0.42 เมตร — พุ่งกระชากเข้าประชิดหน้าเลนส์กล้องจนเต็มจอ
          const targetDist = 0.42;
          const toCam = new THREE.Vector3().subVectors(camera.position, jumpscareTargetRig.position);
          toCam.y = 0;
          if (toCam.length() > targetDist) {
            jumpscareTargetRig.position.addScaledVector(toCam.normalize(), 18.0 * dt);
          }

          // อนิเมชันกระตุกและอ้าปากขย้ำสุดสยอง
          if (jumpscareTargetRig === smilerRig && smilerJawMesh) {
            // ปากเรืองแสงขาวฉีกอ้ากว้างลงมาสุดขีด ฟันเข็มขยับขบฟันถี่
            smilerJawMesh.position.y = -0.25 - Math.abs(Math.sin(now * 0.045)) * 0.55;
            smilerRig.rotation.z = (Math.random() - 0.5) * 0.35;
            smilerRig.position.y = camera.position.y - 0.08 + (Math.random() - 0.5) * 0.15;
          } else if (jumpscareTargetRig === bacteriaRig) {
            // ระยางค์สายเคเบิลสะบัดฟาดกระตุกแบบ Stop-motion analog horror
            bacteriaLeftArm.rotation.x = -1.5 + (Math.random() - 0.5) * 0.8;
            bacteriaRightArm.rotation.x = -1.5 + (Math.random() - 0.5) * 0.8;
            bacteriaTorso.rotation.z = (Math.random() - 0.5) * 0.35;
            if (bacteriaJawMesh) {
              bacteriaJawMesh.scale.y = 1.5 + Math.abs(Math.sin(now * 0.04)) * 7.5;
              bacteriaJawMesh.scale.x = 1.2 + (Math.random() - 0.5) * 0.4;
            }
          } else if (jumpscareTargetRig === dullerRig) {
            dullerRig.rotation.z = (Math.random() - 0.5) * 0.4;
            dullerRig.rotation.x = (Math.random() - 0.5) * 0.25;
            if (dullerJawMesh) dullerJawMesh.scale.y = 0.8 + Math.abs(Math.sin(now * 0.05)) * 2.2;
            for (let li = 0; li < dullerLegs.length; li++) {
              dullerLegs[li].rotation.x = (Math.random() - 0.5) * 0.9;
            }
          } else if (jumpscareTargetRig === acidManRig) {
            acidManLeftArm.rotation.x = -1.2 + (Math.random() - 0.5) * 0.6;
            acidManRightArm.rotation.x = -1.2 + (Math.random() - 0.5) * 0.6;
            acidManTorso.rotation.z = (Math.random() - 0.5) * 0.28;
            if (acidManJawMesh) acidManJawMesh.scale.y = 1.2 + Math.abs(Math.sin(now * 0.04)) * 6;
          }

          // กล้องสั่นสะเทือนรุนแรงและบิดเบี้ยว FOV Pulse (Violent Camera Shock)
          camera.position.x += (Math.random() - 0.5) * 0.28;
          camera.position.y += (Math.random() - 0.5) * 0.28;
          camera.rotation.z = (Math.random() - 0.5) * 0.22;
          camera.fov = 68 + (Math.random() - 0.5) * 12;
          camera.updateProjectionMatrix();

          // เอฟเฟกต์แฟลชกล้องวงจรปิด/กล้องแฮนดีแคมแบบ Kane Pixels (สลับขาวจ้า นีออนกระพริบ และมืดมิด)
          const strobe = document.getElementById('jumpscare-strobe');
          const jsElapsed = now - jumpscareStartTime;

          // เสียงคลื่นไฟฟ้าสถิตความถี่สูงสั่นกระตุกพร้อมกับโอเวอร์เลย์ #jumpscare-strobe ทันที
          if (!window.jumpscareStrobeAudioTriggered) {
            window.jumpscareStrobeAudioTriggered = true;
            if (window.playJumpscareStrobeStaticSound) {
              window.playJumpscareStrobeStaticSound();
            }
          }

          if (jsElapsed < 120) {
            // เสี้ยววินาทีแรก: แฟลชขาวโพลนตาบอดทันที
            strobe.style.background = '#ffffff';
            strobe.style.opacity = '1';
            strobe.style.display = 'block';
          } else {
            // จังหวะกระตุกเหมือนสัญญาณภาพวิดีโอถูกรบกวนแตกกระจัดกระจาย
            const flick = Math.random();
            if (flick < 0.3) {
              strobe.style.background = '#ffffff';
              strobe.style.opacity = '0.9';
            } else if (flick < 0.55) {
              strobe.style.background = '#fff4a0'; // แสงนีออนนีออนช็อตวาบ
              strobe.style.opacity = '0.75';
            } else if (flick < 0.8) {
              strobe.style.background = '#000000'; // ดับมืดสนิท
              strobe.style.opacity = '1';
            } else {
              strobe.style.background = '#1a0000';
              strobe.style.opacity = '0.85';
            }
            strobe.style.display = 'block';
          }

          staticCanvas.style.opacity = Math.min(0.98, 0.25 + (jsElapsed / 1500) * 0.7);
          renderNoise();

          if (jsElapsed > 1600) {
            isJumpscareActive = false;
            strobe.style.display = 'none';
            window.jumpscareStrobeAudioTriggered = false;
            if (window.stopJumpscareStrobeStaticSound) {
              window.stopJumpscareStrobeStaticSound();
            }
            camera.fov = 70;
            camera.updateProjectionMatrix();

            if (currentAct === 1) {
              if (window.onAct1Caught) window.onAct1Caught();
              renderer.render(scene, camera);
              return;
            } else {
              window.gameEngineStarted = false;
              if (document.exitPointerLock) document.exitPointerLock();
              document.getElementById('over-title').innerText = "SIGNAL LOST // DETECTIVE DOWN";
              document.getElementById('over-desc').innerHTML = "คุณถูกทำร้ายจนหมดสติในความมืดมิด...<br><b>การสืบสวนคดี #94-B สิ้นสุดลง</b>";
              document.getElementById('survival-time-over').innerText = `เวลาที่รอดมาได้: ${window.formatSurvivalTime(now - window.gameStartTime)}`;
              document.getElementById('over-menu').style.display = 'flex';
            }
          }

          renderer.render(scene, camera);
          return;
        }

        // หากกำลังสลับองก์ 1 -> 2 ให้หยุดประมวลผลการเดินชั่วคราว
        if (window.actTransitionActive) {
          renderer.render(scene, camera);
          return;
        }

        // การเดินของผู้เล่น (ล็อกการเดินไว้ทั้งหมดระหว่างซ่อนตัว)
        let moveFwd = 0, moveSide = 0;
        if (!isHiding) {
          if (keys.KeyW) moveFwd += 1;
          if (keys.KeyS) moveFwd -= 1;
          if (keys.KeyA) moveSide -= 1;
          if (keys.KeyD) moveSide += 1;

          moveFwd -= joyVector.y;
          moveSide += joyVector.x;
        }

        // เร่ง/หน่วงความเร็วแบบนุ่มนวลเข้าหาค่าที่ผู้เล่นกำลังกด (frame-rate independent)
        // แทนที่จะสแนปความเร็วเต็ม/ศูนย์ทันที ยังคงจังหวะก้าวเดิน/head bob ไว้เหมือนเดิม
        if (isHiding) {
          smoothMoveFwd = 0;
          smoothMoveSide = 0;
        } else {
          const smoothT = 1 - Math.exp(-MOVE_ACCEL_RATE * dt);
          smoothMoveFwd += (moveFwd - smoothMoveFwd) * smoothT;
          smoothMoveSide += (moveSide - smoothMoveSide) * smoothT;
          if (Math.abs(smoothMoveFwd) < 0.001) smoothMoveFwd = 0;
          if (Math.abs(smoothMoveSide) < 0.001) smoothMoveSide = 0;
        }

        const moveLen = Math.hypot(smoothMoveFwd, smoothMoveSide);

        if (isSprintBoost && now > sprintBoostEndTime) {
          isSprintBoost = false; // หมดช่วงวิ่งพุ่ง กลับความเร็วปกติ
        }
        const combatSpeedMult = (typeof playerMoveSpeedMult !== 'undefined') ? playerMoveSpeedMult : 1.0;
        const playerSpeed = (isSprintBoost ? 4.0 * SPRINT_SPEED_MULT : 4.0) * (now < acidBurnUntil ? ACID_BURN_SPEED_MULT : 1) * combatSpeedMult;

        // อัพเดตสถานะการต่อสู้ (Combat State Machine)
        if (window.updateCombatState) window.updateCombatState(dt, now);
        if (window.checkAct2WeaponPickups) window.checkAct2WeaponPickups();

        // เอฟเฟกต์มึนงง/ตาพร่าหลังโดนโจมตี
        if (now < screenBlurUntil && viewportEl) {
          viewportEl.style.filter = 'blur(2.5px) contrast(1.25) brightness(0.9)';
        }

        // อัพเดตปุ่ม Sprint บนจอ (เทาลงระหว่างคูลดาวน์)
        if (now < sprintCooldownEndTime) {
          sprintBtn.classList.add('cooldown');
        } else {
          sprintBtn.classList.remove('cooldown');
        }

        if (moveLen > 0.05) {
          const normFwd = smoothMoveFwd / Math.max(1, moveLen);
          const normSide = smoothMoveSide / Math.max(1, moveLen);

          const cosY = Math.cos(cameraYaw);
          const sinY = Math.sin(cameraYaw);
          const vx = (-sinY * normFwd + cosY * normSide) * playerSpeed * dt;
          const vz = (-cosY * normFwd - sinY * normSide) * playerSpeed * dt;

          if (!isWall(camera.position.x + vx, camera.position.z)) camera.position.x += vx;
          if (!isWall(camera.position.x, camera.position.z + vz)) camera.position.z += vz;

          footstepDist += Math.hypot(vx, vz);
          if (footstepDist > 1.8) {
            footstepDist = 0;
            playFootstep();
          }

          headBobTimer += dt * 9.5;
        }

        // อัพเดต UI ของจุดซ่อนตัว (prompt + ปุ่มมือถือ)
        const hidePromptEl = document.getElementById('hide-prompt');
        const nearestHideDist = getNearestHidingDist();
        if (isHiding) {
          hidePromptEl.style.display = 'block';
          hidePromptEl.innerText = '[ กำลังซ่อนตัว — กด E เพื่อออกมา ]';
          hideBtn.classList.add('active');
          hideBtn.classList.remove('disabled');
        } else if (nearestHideDist <= HIDE_INTERACT_DIST) {
          hidePromptEl.style.display = 'block';
          hidePromptEl.innerText = '[ กด E เพื่อซ่อนตัว ]';
          hideBtn.classList.remove('active', 'disabled');
        } else {
          hidePromptEl.style.display = 'none';
          hideBtn.classList.remove('active');
          hideBtn.classList.add('disabled');
        }

        // พลังงานกล้อง: ค่อยๆ ฟื้นเองตลอดเวลา ไม่ต้องปิดรอเหมือนแบตไฟฉายเดิม (เพราะตอนนี้เป็นการยิงแฟลชสั้นๆ ไม่ใช่เปิดค้าง)
        cameraCharge = Math.min(100, cameraCharge + CAMERA_CHARGE_REGEN_PER_SEC * dt);
        updateFlashlightIndicator();

        // ระบบลดค่า Energy / Sanity
        let drainRate = 0.45 * dt;
        if (isBlackout) drainRate = 1.5 * dt;
        if (now < acidBurnUntil) drainRate += ACID_BURN_DRAIN_PER_SEC * dt; // แผลกรดยังกัดกร่อนต่อเนื่อง
        playerEnergy = Math.max(0, playerEnergy - drainRate);
        updateEnergyHUD();

        let fovWarp = 0;
        if (playerEnergy < 50) {
          fovWarp = Math.sin(now * 0.003) * ((50 - playerEnergy) * 0.09);
          camera.fov = baseFov + fovWarp;
          camera.updateProjectionMatrix();
        }

        // ภาพบิดเบี้ยวตามระดับ SANITY ที่เหลือ — เริ่มไต่ระดับตั้งแต่สติต่ำกว่า ~55%
        // สีเพี้ยน คอนทราสต์จัดขึ้น ภาพเบลอเล็กน้อยตอนต่ำมาก + เส้นสีแดง/ฟ้าแยกออกจากกัน (chromatic aberration)
        if (hasRevealedSanity) {
          const corruption = Math.max(0, Math.min(1, (55 - playerEnergy) / 55));
          if (corruption > 0.01 && viewportEl) {
            const wobble = Math.sin(now * 0.0021);
            const sat = 1 + corruption * 1.5 + wobble * corruption * 0.3;
            const hue = wobble * 20 * corruption;
            const contrast = 1 + corruption * 0.32;
            const blurPx = corruption > 0.75 ? (corruption - 0.75) * 2.2 : 0;
            viewportEl.style.filter = `saturate(${sat.toFixed(2)}) hue-rotate(${hue.toFixed(1)}deg) contrast(${contrast.toFixed(2)})` +
              (blurPx > 0 ? ` blur(${blurPx.toFixed(2)}px)` : '');
          } else if (viewportEl && viewportEl.style.filter) {
            viewportEl.style.filter = '';
          }

          if (chromaEl) {
            if (corruption > 0.12) {
              const shiftPx = 1.5 + corruption * 6 + Math.sin(now * 0.05) * corruption * 2;
              chromaEl.style.setProperty('--chroma-shift', shiftPx.toFixed(2) + 'px');
              chromaEl.style.opacity = Math.min(0.5, corruption * 0.55).toFixed(2);
            } else if (chromaEl.style.opacity !== '0') {
              chromaEl.style.opacity = 0;
            }
          }

          // HUD สั่น/กระตุกเบาๆ เป็นครั้งคราวตอนสติต่ำมาก เหมือนสัญญาณกล้องเริ่มเพี้ยน
          if (hudEl && corruption > 0.55 && Math.random() < 0.05) {
            hudEl.style.transform = `translate(${((Math.random() - 0.5) * 4).toFixed(1)}px, ${((Math.random() - 0.5) * 3).toFixed(1)}px)`;
            setTimeout(() => { if (hudEl) hudEl.style.transform = ''; }, 60 + Math.random() * 70);
          }
        }

        if (playerEnergy <= 0) {
          if (currentAct === 1) {
            // ในองก์ 1 สติหมด = สลับเข้าสู่องก์ 2 ทันที
            if (window.onAct1Caught) window.onAct1Caught();
            renderer.render(scene, camera);
            return;
          } else {
            window.gameEngineStarted = false;
            document.getElementById('over-title').innerText = "INSANITY OVERTAKEN";
            document.getElementById('over-desc').innerHTML = "สติของคุณแตกสลายโดยสมบูรณ์...<br><b>คุณกลายสภาพเป็นส่วนหนึ่งของ The Backrooms</b>";
            document.getElementById('survival-time-over').innerText = `เวลาที่รอดมาได้: ${window.formatSurvivalTime(now - window.gameStartTime)}`;
            document.getElementById('over-menu').style.display = 'flex';
            return;
          }
        }

        // ในองก์ 2: สติ (Sanity) ค่อยๆ ลดลงตามเวลา และอัพเดต Deep State
        if (currentAct === 2) {
          playerSanity = Math.max(0, playerSanity - 0.08 * dt);
          if (playerSanity <= 0 && !window.actTransitionActive) {
            if (window.triggerEndingSequence) {
              window.triggerEndingSequence('ENDING_BECOME_ENTITY');
              return;
            }
          }
          if (window.updateDeepStateCheck) {
            window.updateDeepStateCheck(now - act2StartTime, playerSanity);
          }
          if (window.updateAct2HUD) {
            window.updateAct2HUD();
          }
        }

        // เก็บขวดนมอัลมอนด์ -> ใส่กระเป๋าไว้ก่อน (ไม่ดื่มทันที) เก็บได้สูงสุด ALMOND_INVENTORY_MAX ขวด ไว้ใช้ทีหลังตอนจำเป็นจริงๆ
        for (let i = 0; i < almondBottles.length; i++) {
          const b = almondBottles[i];
          if (b.active) {
            const distB = Math.hypot(camera.position.x - b.x, camera.position.z - b.z);
            if (distB < 1.4) {
              if (almondInventory >= ALMOND_INVENTORY_MAX) continue; // กระเป๋าเต็ม เก็บเพิ่มไม่ได้ ขวดยังอยู่ตรงนั้น กลับมาเก็บทีหลังได้
              b.active = false;
              scene.remove(b.mesh);
              almondInventory++;
              playDrinkSound();
              updateBottleHUD();

              const notif = document.getElementById('item-notification');
              notif.innerText = `เก็บนมอัลมอนด์ (${almondInventory}/${ALMOND_INVENTORY_MAX}) — กด Q เพื่อดื่ม`;
              notif.style.display = 'block';
              setTimeout(() => { notif.style.display = 'none'; }, 2200);
            }
          }
        }

        // เก็บโน้ต/เอกสารเล่าเรื่อง
        for (let i = 0; i < loreNotes.length; i++) {
          const n = loreNotes[i];
          if (n.active) {
            const distN = Math.hypot(camera.position.x - n.x, camera.position.z - n.z);
            if (distN < 1.4) {
              n.active = false;
              scene.remove(n.mesh);
              collectedLoreSet.add(n.text);
              playDrinkSound();
              showNoteOverlay(n.text);
            }
          }
        }

        // เก็บบัตรผ่าน (Keycard)
        for (let i = 0; i < keycards.length; i++) {
          const k = keycards[i];
          if (k.active) {
            const distK = Math.hypot(camera.position.x - k.x, camera.position.z - k.z);
            if (distK < 1.4) {
              k.active = false;
              scene.remove(k.mesh);
              keycardsCollected++;
              updateObjectiveHUD();
              playGlitchShiftSound();

              const notif = document.getElementById('item-notification');
              notif.innerText = `บัตรผ่าน ${keycardsCollected}/${KEYCARDS_REQUIRED}`;
              notif.style.display = 'block';
              setTimeout(() => { notif.style.display = 'none'; }, 2200);
            }
          }
        }

        // Head Bobbing & Breathing
        let bobY = 0, bobZ = 0;
        if (moveLen > 0.05) {
          bobY = Math.sin(headBobTimer) * 0.055;
          bobZ = Math.cos(headBobTimer * 0.5) * 0.012;
        } else {
          bobY = Math.sin(now * 0.002) * 0.012;
        }

        camera.position.y = 1.5 + bobY;
        camera.rotation.order = 'YXZ';
        camera.rotation.y = cameraYaw;
        camera.rotation.x = cameraPitch;
        camera.rotation.z = bobZ;

        // สั่นกล้องสั้นๆ ตอนโดนกรดสาดใส่ (ไม่กระทบตำแหน่งจริง แค่เอียงจอชั่วครู่)
        if (now < acidShakeUntil) {
          camera.rotation.z += (Math.random() - 0.5) * 0.05;
          camera.rotation.x += (Math.random() - 0.5) * 0.02;
        }

        // ระบบไฟดับ & จู๊คเปลี่ยนคำเป็น SANITY
        if (!isBlackout && now > nextBlackoutTime) {
          isBlackout = true;
          blackoutEndTime = now + 2000;
          ambientLight.intensity = 0.11; // เดิม 0.04 มืดสนิทจนงงเกินไป ปรับให้พอเห็นเงาลางๆ ระหว่างไฟดับ
          if (humGain && audioCtx) humGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
          for (let i = 0; i < ceilingLights.length; i++) ceilingLights[i].intensity = 0;
          // มุมมองบิดเบี้ยวเล็กน้อยตอนไฟดับ ให้รู้สึกพื้นที่ผิดปกติ ไม่ใช่แค่มืดเฉยๆ
          camera.fov = 86;
          camera.updateProjectionMatrix();

          if (!hasRevealedSanity) {
            hasRevealedSanity = true;
            playGlitchShiftSound();
            const label = document.getElementById('meter-label');
            label.innerText = 'SANITY:';
            label.style.color = '#ff4d4d';
            document.getElementById('hud-subtitle').innerText = 'LEVEL 0: THE LOBBY // YOU NEVER LEFT';
          }
        } else if (isBlackout) {
          if (now > blackoutEndTime) {
            isBlackout = false;
            nextBlackoutTime = now + 28000 + Math.random() * 20000;
            ambientLight.intensity = 0.5; // เดิม 0.82 สว่างเกินไปสำหรับบรรยากาศ backrooms ทั่วไป ลดลงให้มืดขึ้น พึ่งแสงแฟลชกล้องมากขึ้น
            if (humGain && audioCtx) humGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
            for (let i = 0; i < ceilingLights.length; i++) ceilingLights[i].intensity = 0.6; // เดิม 0.85
            camera.fov = 82;
            camera.updateProjectionMatrix();

            if (!firstBlackoutOccurred) {
              firstBlackoutOccurred = true; // ไฟกลับมาติดครั้งแรก — entity เริ่มปรากฏและทำงานตามปกติ
              nextAmbientEventTime = now + 8000 + Math.random() * 6000;

              // เปลี่ยนผนัง/พื้น/เพดานจากลายออฟฟิศปกติเป็นลาย Backrooms + โทนไฟอุ่นวาบๆ
              if (wallMat && backroomsWallTex) {
                wallMat.map = backroomsWallTex;
                if (backroomsWallBump) {
                  wallMat.bumpMap = backroomsWallBump;
                  wallMat.bumpScale = 0.06;
                }
                wallMat.needsUpdate = true;
              }
              if (floorMat && backroomsFloorTex) {
                floorMat.map = backroomsFloorTex;
                if (backroomsFloorBump) {
                  floorMat.bumpMap = backroomsFloorBump;
                  floorMat.bumpScale = 0.045;
                }
                floorMat.needsUpdate = true;
              }
              if (ceilingMat && backroomsCeilingTex) {
                ceilingMat.map = backroomsCeilingTex;
                if (backroomsCeilingBump) {
                  ceilingMat.bumpMap = backroomsCeilingBump;
                  ceilingMat.bumpScale = 0.05;
                }
                ceilingMat.needsUpdate = true;
              }
              ambientLight.color.setHex(BACKROOMS_AMBIENT_COLOR);
              // หมอกเปลี่ยนจากเทาสว่างจางๆ เป็นเหลืองอมน้ำตาลหนาขึ้นทันทีที่โลกเริ่มผิดปกติ
              if (scene.fog) scene.fog.color.setHex(BACKROOMS_FOG_COLOR);
              renderer.setClearColor(BACKROOMS_FOG_COLOR);
              startLiminalHum();
              corruptOfficeFurniture();

              // ปุ่ม FLASHLIGHT / SPRINT / HIDE บนมือถือ เพิ่งโผล่ตอนนี้ที่เริ่มมีอะไรผิดปกติจริงๆ
              if (isTouchDevice) {
                document.getElementById('flash-btn').style.display = 'flex';
                document.getElementById('sprint-btn').style.display = 'flex';
                document.getElementById('hide-btn').style.display = 'flex';
                document.getElementById('drink-btn').style.display = 'flex';
              }
              // ไฟดับครั้งแรก = มืดจริง ผู้เล่นเริ่มใช้กล้อง (กด F / ปุ่มถ่ายรูป) เพื่อยิงแฟลชช่วยดูทางได้ตั้งแต่ตอนนี้
              updateFlashlightIndicator();

              // ตั้งคิวเวลา "โกง" วาปเข้าใกล้ผู้เล่นใหม่ทั้งหมด ณ จุดที่ entity เริ่มทำงานจริง
              // (ถ้าไม่ตั้งใหม่ตรงนี้ ตัวจับเวลาเดิมที่นับมาตั้งแต่ต้นเกมจะหมดอายุพร้อมกันหมด
              // ทำให้ทั้ง 3 ตัววาปมาใกล้ผู้เล่นพร้อมกันทันทีที่ไฟกลับมาติด) — ให้เรียงคิวมาทีละตัวแทน
              smilerNextCheatTime = now + 22000 + Math.random() * 8000;
              // เดิมเว้นคิวตัวละ 16-24 วิ สะสมกันจนตัวที่ 5 (The Gapped) เพิ่งเริ่มวาปเข้าหาผู้เล่นตอนนาทีที่ ~1.5-2.2
              // ซึ่งผู้เล่นส่วนใหญ่ตายหรือจบเกมไปก่อน ทำให้ Duller / Acid Man / Gapped แทบไม่เคยโผล่เลย
              // ลดเหลือตัวละ 9-15 วิ — ยังทยอยมาทีละตัวเหมือนเดิม แต่ครบ 5 ตัวภายใน ~1 นาทีแรกหลังไฟติด
              bacteriaNextCheatTime = smilerNextCheatTime + 9000 + Math.random() * 6000;
              dullerNextCheatTime = bacteriaNextCheatTime + 9000 + Math.random() * 6000;
              acidManNextCheatTime = dullerNextCheatTime + 9000 + Math.random() * 6000;
              gappedNextCheatTime = acidManNextCheatTime + 9000 + Math.random() * 6000;
            }
          }
        }

        // เหตุการณ์หลอนแบบ ambient (ไฟกระพริบ/เสียงไกลๆ) ไม่ผูกกับระยะห่างจาก entity — เริ่มหลังไฟกลับมาติดครั้งแรกเท่านั้น
        if (firstBlackoutOccurred && now > nextAmbientEventTime) {
          triggerAmbientDreadEvent();
          nextAmbientEventTime = now + 11000 + Math.random() * 10000;
        }

        // หมอก "หายใจ" เบาๆ ตลอดเวลาหลังเข้าโหมด backrooms — ความหนาแน่นสั่นขึ้นลงช้าๆ ผสมคลื่นสองความถี่
        // ให้รู้สึกว่าทางเดินยืด/หดแบบไม่รู้ตัว ไม่ใช่หมอกนิ่งๆ ธรรมดา
        if (scene && scene.fog && firstBlackoutOccurred) {
          const breathe = Math.sin(now * 0.00035) * 0.006 + Math.sin(now * 0.0011) * 0.003;
          scene.fog.density = baseFogDensity + breathe + (isBlackout ? 0.014 : 0);
        }

        // ไฟเพดานกระพริบแผ่วๆ แบบอิสระต่อดวง (ไม่รอคิวเดียวกันทั้งแมพ) — ห้องหนึ่งกระพริบ อีกห้องอาจนิ่งสนิท
        // ยิ่ง SANITY เหลือน้อย ยิ่งกระพริบถี่ขึ้น มืดสนิทได้บ่อยขึ้น ให้รู้สึกว่าตึกเริ่ม "เสีย" ไปพร้อมกับสติ
        // throttle ทุก ~180ms + ข้ามไฟที่ถูก cull แล้ว (มองไม่เห็นอยู่แล้ว) กันวนเช็คทั้งแมพทุกเฟรมจนเฟรมกระตุก/เสียงสะดุด
        if (firstBlackoutOccurred && !isBlackout && ceilingLights.length > 0 && now - lastFlickerScheduleTime > 180) {
          lastFlickerScheduleTime = now;
          const sanityFactor = hasRevealedSanity ? Math.max(0, Math.min(1, (100 - playerEnergy) / 100)) : 0;
          for (let li = 0; li < ceilingLights.length; li++) {
            const l = ceilingLights[li];
            if (!l.visible) continue;
            if (l.baseIntensity === undefined) l.baseIntensity = l.intensity;
            if (l.nextFlickerTime === undefined) l.nextFlickerTime = now + 2000 + Math.random() * 9000;
            if (!l.isFlickering && now > l.nextFlickerTime) {
              l.isFlickering = true;
              const orig = l.baseIntensity;
              const dipFloor = Math.max(0, 0.2 - sanityFactor * 0.2); // สติต่ำมาก = มีโอกาสดับสนิทกว่าเดิม
              l.intensity = orig * (dipFloor + Math.random() * 0.25);
              const dipTime = 70 + Math.random() * (120 - sanityFactor * 40);
              setTimeout(() => { if (l) { l.intensity = orig; l.isFlickering = false; } }, dipTime);
              const intervalMin = 2500 - sanityFactor * 1700;
              const intervalRange = 5500 - sanityFactor * 3500;
              l.nextFlickerTime = now + intervalMin + Math.random() * intervalRange;
            }
          }
        }

        // Peripheral Vision Glitch: ร่างเงาวาบที่ขอบจอ ไม่ผูกกับตำแหน่ง entity จริง — ถี่ขึ้นเมื่อ SANITY ต่ำ
        if (firstBlackoutOccurred && !isHiding && !isJumpscareActive && now > nextPeripheralGlitchTime) {
          triggerPeripheralGlitch();
          const freqFactor = hasRevealedSanity ? Math.max(0, Math.min(1, (100 - playerEnergy) / 100)) : 0;
          const intervalMin = 13000 - freqFactor * 8500;
          const intervalRange = 9000 - freqFactor * 5000;
          nextPeripheralGlitchTime = now + intervalMin + Math.random() * intervalRange;
        }

        // ก่อนไฟดับครั้งแรก entity ยังไม่ปรากฏตัวและไม่ขยับเลย
        if (!firstBlackoutOccurred) {
          if (smilerRig) smilerRig.visible = false;
          if (bacteriaRig) bacteriaRig.visible = false;
          if (dullerRig) dullerRig.visible = false;
          if (acidManRig) acidManRig.visible = false;
          if (gappedRig) gappedRig.visible = false;
          staticCanvas.style.opacity = 0;
          dreadVignetteEl.style.opacity = 0;
          if (window.updateAmbientChaseAudio) {
            window.updateAmbientChaseAudio(dt, false, 999, isBlackout, false);
          }
        } else {
        if (smilerRig) smilerRig.visible = true;
        if (bacteriaRig) bacteriaRig.visible = true;
        if (dullerRig) dullerRig.visible = true;
        if (acidManRig) acidManRig.visible = true;
        if (gappedRig) gappedRig.visible = true;

        // ไม่มีไฟฉายส่องต่อเนื่องแล้ว ปกติผู้เล่นมืดสนิทเท่า baseline / ตอนกล้องวาบแฟลช ระยะที่มันสังเกตเห็นผู้เล่นพุ่งสูงขึ้นชั่วครู่
        // ประกาศไว้ตรงนี้ (ระดับบนสุดของบล็อก entity) เพราะ AI ทั้ง 5 ตัวใช้ค่าเดียวกัน
        // เดิมประกาศไว้ข้างใน else-block ของ Smiler ทำให้ Bacteria/Acid Man/Gapped มองไม่เห็นตัวแปรนี้ → ReferenceError ทุกเฟรมหลังไฟดับครั้งแรก
        const detectMult = cameraFlashActive ? 1.3 : 0.62;

        // =========================================================
        // AI 1: The Smiler (ลอยเคว้งส่าย + อ้าขากรรไกร 3D)
        // =========================================================
        const distSmiler = smilerRig.position.distanceTo(camera.position);

        if (smilerState === 'STUNNED' && now < smilerStunUntil) {
          // โดนแฟลชจ่อหน้าไปแล้ว - นิ่งงงไร้พิษภัยอยู่ชั่วคราว ทำร้ายผู้เล่นไม่ได้ระหว่างนี้
          if (monsterSoundGain && audioCtx && audioCtx.state === 'running') {
            monsterSoundGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
          }
        } else {
        if (smilerState === 'STUNNED') smilerState = 'PATROL'; // หมดเวลาสตันแล้ว ประเมินสถานะใหม่ด้านล่าง

        if (!isHiding && distSmiler < 20 * detectMult) {
          smilerState = 'CHASE';

          // จำจุดที่เห็นผู้เล่นล่าสุดไว้ เผื่อคลาดกัน (เช่นผู้เล่นซ่อนตัว) จะได้ไปวนหาก่อนเลิกล่า
          smilerLastKnownPos.copy(camera.position);
          smilerSearchUntil = now + SEARCH_LINGER_MS;

          if (monsterSoundGain && audioCtx && audioCtx.state === 'running') {
            const mVol = (1 - distSmiler / 20) * 0.28;
            monsterSoundGain.gain.setValueAtTime(mVol, audioCtx.currentTime);
            monsterOsc1.frequency.setValueAtTime(80 + (20 - distSmiler) * 8, audioCtx.currentTime);
          }

          const dir = new THREE.Vector3().subVectors(camera.position, smilerRig.position).normalize();

          // Smiler ล่าด้วยสายตา: ถ้าผู้เล่นถ่ายรูปวาบแฟลชจ่อหน้ามันตรงๆ ในระยะใกล้ มันจะสตันนิ่งไปพักหนึ่งแทนที่จะพุ่งเข้าหา
          const fx = -Math.sin(cameraYaw), fz = -Math.cos(cameraYaw);
          const litDot = fx * -dir.x + fz * -dir.z; // มุมระหว่างทิศที่มองกับทิศไปหา Smiler
          const isBlindedByLight = cameraFlashActive && distSmiler < SMILER_LIGHT_REPEL_DIST && litDot > SMILER_LIGHT_REPEL_DOT;

          if (isBlindedByLight) {
            smilerState = 'STUNNED';
            smilerStunUntil = now + SMILER_STUN_MIN_MS + Math.random() * (SMILER_STUN_MAX_MS - SMILER_STUN_MIN_MS);
            // สะดุ้งถอยเล็กน้อยครั้งเดียวตอนโดนแฟลช ให้รู้สึกว่ามีปฏิกิริยา ก่อนจะนิ่งสตันไป
            smilerRig.position.x -= dir.x * SMILER_RECOIL_SPEED * 0.25;
            smilerRig.position.z -= dir.z * SMILER_RECOIL_SPEED * 0.25;
            smilerRig.lookAt(camera.position.x, smilerRig.position.y, camera.position.z);
          } else {
            playerEnergy = Math.max(0, playerEnergy - 1.2 * dt);
            smilerSpeed = (distSmiler < 9.0) ? 4.15 : (isBlackout ? 3.2 : 2.3);
            smilerRig.position.x += dir.x * smilerSpeed * dt;
            smilerRig.position.z += dir.z * smilerSpeed * dt;
            smilerRig.lookAt(camera.position.x, smilerRig.position.y, camera.position.z);

            if (distSmiler < 1.45) {
              if (currentAct === 1) {
                isJumpscareActive = true;
                jumpscareTargetRig = smilerRig;
                jumpscareStartTime = now;
                playViolentJumpscareSound();
                if (document.exitPointerLock) document.exitPointerLock();
              } else {
                applyMonsterAttackToPlayer('smiler', 34, 18);
              }
            }
          }
        } else {
          smilerState = 'PATROL';
          if (monsterSoundGain && audioCtx && audioCtx.state === 'running') {
            monsterSoundGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
          }

          if (now < smilerSearchUntil) {
            // เพิ่งคลาดกับผู้เล่น — เดินวนดูจุดที่เห็นล่าสุดก่อนสักพัก แทนที่จะเปลี่ยนทิศหนีไปเลยทันที
            smilerSpeed = SEARCH_SPEED;
            if (!smilerWaypoint || smilerRig.position.distanceTo(smilerWaypoint) < 2.0) {
              smilerWaypoint = getRandomFloorCellNear(smilerLastKnownPos.x, smilerLastKnownPos.z, 0, 5) || smilerLastKnownPos.clone();
            }
          } else {
            smilerSpeed = 1.3;

            // แอบโกง: ถึงเวลาแล้ววาปมาป้วนเปี้ยนใกล้ๆผู้เล่นบ้าง (ไม่โกงตอนผู้เล่นซ่อนตัวอยู่)
            if (!isHiding && now > smilerNextCheatTime) {
              const cheatSpot = getRandomFloorCellNear(camera.position.x, camera.position.z, CHEAT_MIN_DIST, CHEAT_MAX_DIST);
              if (cheatSpot) {
                smilerRig.position.x = cheatSpot.x;
                smilerRig.position.z = cheatSpot.z;
                // วาปมาแล้วต้องเดินเข้าหาผู้เล่น ไม่ใช่สุ่มจุดใหม่ทั้งแมพแล้วเดินหนีออกไป
                smilerWaypoint = getRandomFloorCellNear(camera.position.x, camera.position.z, 0, 8) || getRandomFloorCell();
              }
              smilerNextCheatTime = now + CHEAT_MIN_INTERVAL + Math.random() * (CHEAT_MAX_INTERVAL - CHEAT_MIN_INTERVAL);
            }

            // ลาดตระเวนสุ่มห้อง
            if (!smilerWaypoint || smilerRig.position.distanceTo(smilerWaypoint) < 2.0) {
              smilerWaypoint = pickStalkWaypoint();
            }
          }

          const pDir = new THREE.Vector3().subVectors(smilerWaypoint, smilerRig.position).normalize();
          smilerRig.position.x += pDir.x * smilerSpeed * dt;
          smilerRig.position.z += pDir.z * smilerSpeed * dt;
          smilerRig.lookAt(smilerWaypoint.x, smilerRig.position.y, smilerWaypoint.z);
        }
        } // จบ else ของเช็คสตัน (โดนแฟลชจ่อหน้า)

        // อนิเมชันอ้าขากรรไกรและลอยเคว้ง
        if (smilerJawMesh) {
          // ปากขยับกระตุกๆ แบบไม่สม่ำเสมอ (ผสมคลื่นสองความถี่ต่างกัน) แทนอ้าหุบสม่ำเสมอน่าเบื่อ
          smilerJawMesh.position.y = -0.16 - Math.abs(Math.sin(now * 0.006) * 0.6 + Math.sin(now * 0.021) * 0.4) * 0.22;
        }
        smilerRig.position.y = 1.4 + Math.sin(now * 0.005) * 0.15;
        // เนื้อเยื่อที่ห้อยลงมาแกว่งช้าๆ ไม่สม่ำเสมอ ให้ดูเหมือนหนังหย่อนแขวนอยู่กับอะไรบางอย่าง ไม่ใช่แท่งแข็งติดหัว
        if (smilerStalkMesh) {
          smilerStalkMesh.rotation.x = Math.sin(now * 0.0009) * 0.12;
          smilerStalkMesh.rotation.z = Math.sin(now * 0.0013 + 1.7) * 0.1;
        }

        // "หยุดนิ่งแล้วสะบัดหน้าจ้อง" — ระหว่างลาดตระเวน มันจะหยุดหันมองตรงมาที่ผู้เล่นเป็นเสี้ยววินาทีแบบไร้สาเหตุ
        // ก่อนหันกลับไปเดินต่อเหมือนไม่มีอะไรเกิดขึ้น (ไม่กระทบระยะ/ตำแหน่งจริง แค่หลอนสายตา)
        if (smilerState === 'PATROL' && !isJumpscareActive) {
          if (now > smilerNextTwitchTime) {
            smilerTwitchUntil = now + 260 + Math.random() * 220;
            smilerNextTwitchTime = now + 5000 + Math.random() * 9000;
            // แวบไฟจ้าขึ้นเสี้ยววินาทีพร้อมจังหวะที่มันหันมาจ้อง — ให้ความรู้สึกสะดุ้งพร้อมภาพ ไม่ใช่แค่หันหน้ามาเฉยๆ
            if (smilerLight) {
              smilerLight.intensity = 2.0;
              setTimeout(() => { if (smilerLight) smilerLight.intensity = 0.55; }, 90);
            }
          }
          if (now < smilerTwitchUntil) {
            smilerRig.lookAt(camera.position.x, smilerRig.position.y, camera.position.z);
          }
        }

        // =========================================================
        // AI 2: The Bacteria (3D Rig ก้าวขาเดินจริง + โยกตัว)
        // =========================================================
        const distBacteria = bacteriaRig.position.distanceTo(camera.position);

        if (!isHiding && distBacteria < 27 * detectMult) {
          bacteriaState = 'CHASE';
          playerEnergy = Math.max(0, playerEnergy - 1.0 * dt);
          bacteriaSpeed = (distBacteria < 11) ? 3.85 : (isBlackout ? 3.0 : 2.4);

          bacteriaLastKnownPos.copy(camera.position);
          bacteriaSearchUntil = now + SEARCH_LINGER_MS;

          if (shadowSoundGain && audioCtx && audioCtx.state === 'running') {
            const sVol = (1 - distBacteria / 22) * 0.35;
            shadowSoundGain.gain.setValueAtTime(sVol, audioCtx.currentTime);
            shadowOsc.frequency.setValueAtTime(36 + (22 - distBacteria) * 3.5, audioCtx.currentTime);
          }

          const sDir = new THREE.Vector3().subVectors(camera.position, bacteriaRig.position).normalize();
          bacteriaRig.position.x += sDir.x * bacteriaSpeed * dt;
          bacteriaRig.position.z += sDir.z * bacteriaSpeed * dt;
          bacteriaRig.lookAt(camera.position.x, bacteriaRig.position.y, camera.position.z);

          if (distBacteria < 1.45) {
            if (currentAct === 1) {
              isJumpscareActive = true;
              jumpscareTargetRig = bacteriaRig;
              jumpscareStartTime = now;
              playViolentJumpscareSound();
              if (document.exitPointerLock) document.exitPointerLock();
            } else {
              applyMonsterAttackToPlayer('bacteria', 30, 16);
            }
          }
        } else {
          bacteriaState = 'PATROL';
          if (shadowSoundGain && audioCtx && audioCtx.state === 'running') {
            shadowSoundGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
          }

          if (now < bacteriaSearchUntil) {
            bacteriaSpeed = SEARCH_SPEED;
            if (!bacteriaWaypoint || bacteriaRig.position.distanceTo(bacteriaWaypoint) < 2.0) {
              bacteriaWaypoint = getRandomFloorCellNear(bacteriaLastKnownPos.x, bacteriaLastKnownPos.z, 0, 5) || bacteriaLastKnownPos.clone();
            }
          } else {
            bacteriaSpeed = 1.2;

            // แอบโกง: ถึงเวลาแล้ววาปมาป้วนเปี้ยนใกล้ๆผู้เล่นบ้าง (ไม่โกงตอนผู้เล่นซ่อนตัวอยู่)
            if (!isHiding && now > bacteriaNextCheatTime) {
              const cheatSpot = getRandomFloorCellNear(camera.position.x, camera.position.z, CHEAT_MIN_DIST, CHEAT_MAX_DIST);
              if (cheatSpot) {
                bacteriaRig.position.x = cheatSpot.x;
                bacteriaRig.position.z = cheatSpot.z;
                // วาปมาแล้วต้องเดินเข้าหาผู้เล่น ไม่ใช่สุ่มจุดใหม่ทั้งแมพแล้วเดินหนีออกไป
                bacteriaWaypoint = getRandomFloorCellNear(camera.position.x, camera.position.z, 0, 8) || getRandomFloorCell();
              }
              bacteriaNextCheatTime = now + CHEAT_MIN_INTERVAL + Math.random() * (CHEAT_MAX_INTERVAL - CHEAT_MIN_INTERVAL);
            }

            if (!bacteriaWaypoint || bacteriaRig.position.distanceTo(bacteriaWaypoint) < 2.0) {
              bacteriaWaypoint = pickStalkWaypoint();
            }
          }
          const bDir = new THREE.Vector3().subVectors(bacteriaWaypoint, bacteriaRig.position).normalize();
          bacteriaRig.position.x += bDir.x * bacteriaSpeed * dt;
          bacteriaRig.position.z += bDir.z * bacteriaSpeed * dt;
          bacteriaRig.lookAt(bacteriaWaypoint.x, bacteriaRig.position.y, bacteriaWaypoint.z);
        }

        // อนิเมชันการก้าวเดิน 3D ของ The Bacteria
        bacteriaWalkCycle += dt * (bacteriaSpeed * 3.8);
        bacteriaLeftLeg.rotation.x = Math.sin(bacteriaWalkCycle) * 0.65;
        bacteriaRightLeg.rotation.x = -Math.sin(bacteriaWalkCycle) * 0.65;
        bacteriaLeftArm.rotation.x = -Math.sin(bacteriaWalkCycle) * 0.55;
        bacteriaRightArm.rotation.x = Math.sin(bacteriaWalkCycle) * 0.55;
        bacteriaTorso.rotation.z = Math.sin(bacteriaWalkCycle) * 0.1;
        bacteriaRig.position.y = Math.abs(Math.sin(bacteriaWalkCycle * 2)) * 0.08;

        // อาการกระตุกทั้งตัวแบบสัตว์ป่วย — หยุดเดินนิ่งเสี้ยววินาทีแล้วสะบัดคอ/แขนกระตุกแรงๆ ก่อนเดินต่อเหมือนไม่มีอะไรเกิดขึ้น
        if (bacteriaState === 'PATROL' && !isJumpscareActive) {
          if (now > bacteriaNextTwitchTime) {
            bacteriaTwitchUntil = now + 180 + Math.random() * 200;
            bacteriaNextTwitchTime = now + 6000 + Math.random() * 8000;
            // ไฟแดงเรืองแรงขึ้นชั่วครู่ตอนสะบัดตัว ให้ดูเหมือนมันกำลังเจ็บปวด/ผิดปกติมากกว่าแค่ขยับแขน
            if (bacteriaLight) {
              bacteriaLight.intensity = 2.6;
              setTimeout(() => { if (bacteriaLight) bacteriaLight.intensity = 1.4; }, 100);
            }
          }
          if (now < bacteriaTwitchUntil) {
            const jerk = Math.sin(now * 0.09) * 0.5;
            bacteriaTorso.rotation.z = jerk;
            bacteriaTorso.rotation.x = jerk * 0.4;
            bacteriaLeftArm.rotation.x = jerk * 2.2;
            bacteriaRightArm.rotation.x = -jerk * 2.2;
          }
        }

        // =========================================================
        // AI 3: The Duller (3D Rig คลาน 4 ขาตามพื้นพรม)
        // =========================================================
        const distDuller = dullerRig.position.distanceTo(camera.position);

        // The Duller ตาบอด ไม่สนไฟฉายเปิด/ปิดเลย (ระยะตรวจจับคงที่) แต่หูไวมาก
        // เสียงสปรินท์/ชัตเตอร์กล้องจะดึงมันมาจากระยะไกลกว่าระยะมองเห็นปกติ:
        //  - ได้ยินตอนอยู่ไกล  -> วิ่งไล่ตามตัวผู้เล่นสดๆ (state 'CHASE', ปรับทิศทุกเฟรมตามที่ผู้เล่นขยับ)
        //  - ได้ยินตอนอยู่ใกล้ -> พุ่งใส่ "ตำแหน่งที่เกิดเสียง" แบบเจาะจง (state 'LUNGE', ล็อกจุดหมายไว้ ไม่ตามตัวผู้เล่นระหว่างพุ่ง)
        const dullerNoiseFresh = !!recentNoise && (now - recentNoise.time < 700);
        const distDullerToNoise = dullerNoiseFresh
          ? Math.hypot(dullerRig.position.x - recentNoise.x, dullerRig.position.z - recentNoise.z)
          : Infinity;
        const dullerNoiseHeard = dullerNoiseFresh && distDullerToNoise < recentNoise.radius;
        const dullerNoiseCloseEnoughToLunge = dullerNoiseHeard && distDullerToNoise < DULLER_LUNGE_TRIGGER_DIST;

        if (isHiding && dullerState === 'LUNGE') {
          // ผู้เล่นซ่อนตัวไปแล้วระหว่างที่มันกำลังพุ่ง -> เลิกพุ่ง ไปค้นหาแถวจุดเสียงแทน
          dullerState = 'PATROL';
          dullerLastKnownPos.copy(dullerLungeTarget);
          dullerSearchUntil = now + SEARCH_LINGER_MS;
        }

        if (dullerState !== 'LUNGE' && !isHiding && dullerNoiseCloseEnoughToLunge) {
          // เริ่มพุ่งใส่ตำแหน่งเสียงทันที (ล็อกจุดหมายไว้ ณ ตอนนี้ ไม่ใช่ไล่ตามตัวสดๆ อีกต่อไป)
          dullerState = 'LUNGE';
          dullerLungeTarget.set(recentNoise.x, dullerRig.position.y, recentNoise.z);
          dullerLungeUntil = now + DULLER_LUNGE_MAX_MS;
        }

        if (dullerState === 'LUNGE') {
          playerEnergy = Math.max(0, playerEnergy - 0.9 * dt);
          dullerSpeed = DULLER_LUNGE_SPEED;

          if (dullerSoundGain && audioCtx && audioCtx.state === 'running') {
            const dVol = Math.max(0, 1 - distDuller / 18) * 0.25;
            dullerSoundGain.gain.setValueAtTime(dVol, audioCtx.currentTime);
            dullerOsc.frequency.setValueAtTime(130 + Math.max(0, 18 - distDuller) * 8, audioCtx.currentTime);
          }

          const distToLungeTarget = dullerRig.position.distanceTo(dullerLungeTarget);
          if (distToLungeTarget < DULLER_LUNGE_ARRIVE_DIST || now > dullerLungeUntil) {
            // พุ่งถึงจุดหมาย (หรือหมดเวลา) แล้วไม่เจอผู้เล่นตรงนั้นพอดี -> เข้าโหมดค้นหาแถวนั้นต่อ
            dullerState = 'PATROL';
            dullerLastKnownPos.copy(dullerLungeTarget);
            dullerSearchUntil = now + SEARCH_LINGER_MS;
          } else {
            const dDir = new THREE.Vector3().subVectors(dullerLungeTarget, dullerRig.position).normalize();
            dullerRig.position.x += dDir.x * dullerSpeed * dt;
            dullerRig.position.z += dDir.z * dullerSpeed * dt;
            dullerRig.lookAt(dullerLungeTarget.x, dullerRig.position.y, dullerLungeTarget.z);
          }

          if (distDuller < 1.45) {
            if (currentAct === 1) {
              isJumpscareActive = true;
              jumpscareTargetRig = dullerRig;
              jumpscareStartTime = now;
              playViolentJumpscareSound();
              if (document.exitPointerLock) document.exitPointerLock();
            } else {
              applyMonsterAttackToPlayer('duller', 28, 14);
            }
          }
        } else if (!isHiding && (distDuller < DULLER_BASE_DETECT_RANGE || dullerNoiseHeard)) {
          dullerState = 'CHASE';
          playerEnergy = Math.max(0, playerEnergy - 0.9 * dt);
          dullerSpeed = (distDuller < 10.0) ? 4.2 : 2.5;

          dullerLastKnownPos.copy(camera.position);
          dullerSearchUntil = now + SEARCH_LINGER_MS;

          if (dullerSoundGain && audioCtx && audioCtx.state === 'running') {
            const dVol = Math.max(0, 1 - distDuller / 18) * 0.25;
            dullerSoundGain.gain.setValueAtTime(dVol, audioCtx.currentTime);
            dullerOsc.frequency.setValueAtTime(130 + Math.max(0, 18 - distDuller) * 8, audioCtx.currentTime);
          }

          const dDir = new THREE.Vector3().subVectors(camera.position, dullerRig.position).normalize();
          dullerRig.position.x += dDir.x * dullerSpeed * dt;
          dullerRig.position.z += dDir.z * dullerSpeed * dt;
          dullerRig.lookAt(camera.position.x, dullerRig.position.y, camera.position.z);

          if (distDuller < 1.45) {
            if (currentAct === 1) {
              isJumpscareActive = true;
              jumpscareTargetRig = dullerRig;
              jumpscareStartTime = now;
              playViolentJumpscareSound();
              if (document.exitPointerLock) document.exitPointerLock();
            } else {
              applyMonsterAttackToPlayer('duller', 28, 14);
            }
          }
        } else {
          dullerState = 'PATROL';
          if (dullerSoundGain && audioCtx && audioCtx.state === 'running') {
            dullerSoundGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
          }

          if (now < dullerSearchUntil) {
            dullerSpeed = SEARCH_SPEED;
            if (!dullerWaypoint || dullerRig.position.distanceTo(dullerWaypoint) < 2.0) {
              dullerWaypoint = getRandomFloorCellNear(dullerLastKnownPos.x, dullerLastKnownPos.z, 0, 5) || dullerLastKnownPos.clone();
            }
          } else {
            dullerSpeed = 1.3;

            // แอบโกง: ถึงเวลาแล้ววาปมาป้วนเปี้ยนใกล้ๆผู้เล่นบ้าง (ไม่โกงตอนผู้เล่นซ่อนตัวอยู่)
            if (!isHiding && now > dullerNextCheatTime) {
              const cheatSpot = getRandomFloorCellNear(camera.position.x, camera.position.z, CHEAT_MIN_DIST, CHEAT_MAX_DIST);
              if (cheatSpot) {
                dullerRig.position.x = cheatSpot.x;
                dullerRig.position.z = cheatSpot.z;
                // วาปมาแล้วต้องเดินเข้าหาผู้เล่น ไม่ใช่สุ่มจุดใหม่ทั้งแมพแล้วเดินหนีออกไป
                dullerWaypoint = getRandomFloorCellNear(camera.position.x, camera.position.z, 0, 8) || getRandomFloorCell();
              }
              dullerNextCheatTime = now + CHEAT_MIN_INTERVAL + Math.random() * (CHEAT_MAX_INTERVAL - CHEAT_MIN_INTERVAL);
            }

            if (!dullerWaypoint || dullerRig.position.distanceTo(dullerWaypoint) < 2.0) {
              dullerWaypoint = pickStalkWaypoint();
            }
          }
          const dDir = new THREE.Vector3().subVectors(dullerWaypoint, dullerRig.position).normalize();
          dullerRig.position.x += dDir.x * dullerSpeed * dt;
          dullerRig.position.z += dDir.z * dullerSpeed * dt;
          dullerRig.lookAt(dullerWaypoint.x, dullerRig.position.y, dullerWaypoint.z);
        }

        // อนิเมชันคลานสี่ขา 3D ของ The Duller
        dullerCrawlCycle += dt * (dullerSpeed * 8.0);
        if (dullerLegs.length === 4) {
          dullerLegs[0].rotation.x = Math.sin(dullerCrawlCycle) * 0.7;
          dullerLegs[3].rotation.x = Math.sin(dullerCrawlCycle) * 0.7;
          dullerLegs[1].rotation.x = -Math.sin(dullerCrawlCycle) * 0.7;
          dullerLegs[2].rotation.x = -Math.sin(dullerCrawlCycle) * 0.7;
        }

        // อาการสะดุ้งกระตุกแบบไร้สาเหตุ ตัวมันจะหยุดคลานฉับพลันแล้วสั่นทั้งตัวเร็วๆ ก่อนคลานต่อ (ยิ่งน่ากลัวเพราะมันตาบอด ไม่รู้ว่ามันสะดุ้งเพราะอะไร)
        if (dullerState === 'PATROL' && !isJumpscareActive) {
          if (now > dullerNextTwitchTime) {
            dullerTwitchUntil = now + 150 + Math.random() * 180;
            dullerNextTwitchTime = now + 7000 + Math.random() * 9000;
            if (dullerLight) {
              dullerLight.intensity = 2.0;
              setTimeout(() => { if (dullerLight) dullerLight.intensity = 1.0; }, 80);
            }
          }
          if (now < dullerTwitchUntil) {
            dullerRig.rotation.z = (Math.random() - 0.5) * 0.35;
            dullerRig.rotation.x = (Math.random() - 0.5) * 0.2;
            if (dullerJawMesh) dullerJawMesh.scale.y = 0.6 + Math.random() * 1.2;
          }
        }

        // =========================================================
        // AI 4: The Acid Man (เดินสองขาตามล่าตรงๆ + ถ่มกรดใส่จากระยะไกล)
        // =========================================================
        const distAcidMan = acidManRig.position.distanceTo(camera.position);

        if (!isHiding && distAcidMan < ACIDMAN_BASE_DETECT_RANGE * detectMult) {
          acidManState = 'CHASE';
          playerEnergy = Math.max(0, playerEnergy - 0.9 * dt);
          acidManSpeed = (distAcidMan < 9.0) ? 3.3 : (isBlackout ? 2.5 : 2.0);

          acidManLastKnownPos.copy(camera.position);
          acidManSearchUntil = now + SEARCH_LINGER_MS;

          if (acidSoundGain && audioCtx && audioCtx.state === 'running') {
            const aVol = Math.max(0, 1 - distAcidMan / 20) * 0.28;
            acidSoundGain.gain.setValueAtTime(aVol, audioCtx.currentTime);
            acidOsc.frequency.setValueAtTime(100 + Math.max(0, 20 - distAcidMan) * 6, audioCtx.currentTime);
          }

          const aDir = new THREE.Vector3().subVectors(camera.position, acidManRig.position).normalize();

          // ยิ่งเข้าใกล้ในระยะถ่มกรดได้ ยิ่งเดินเข้าหาช้าลง (ยืนกึ่งกลางถ่มกรดใส่แทนที่จะพุ่งเข้าประชิดทันที)
          const inThrowRange = distAcidMan >= ACID_THROW_MIN_RANGE && distAcidMan <= ACID_THROW_MAX_RANGE;
          if (!inThrowRange || distAcidMan > ACID_THROW_MAX_RANGE * 0.7) {
            acidManRig.position.x += aDir.x * acidManSpeed * dt;
            acidManRig.position.z += aDir.z * acidManSpeed * dt;
          }
          acidManRig.lookAt(camera.position.x, acidManRig.position.y, camera.position.z);

          // ถ่มกรดใส่ผู้เล่นเมื่ออยู่ในระยะ มีเส้นทางพอมองเห็น และคูลดาวน์หมดแล้ว
          if (inThrowRange && now > acidThrowCooldownUntil) {
            acidThrowCooldownUntil = now + ACID_THROW_COOLDOWN_MIN + Math.random() * (ACID_THROW_COOLDOWN_MAX - ACID_THROW_COOLDOWN_MIN);

            const spitOrigin = new THREE.Vector3();
            if (acidManFaceAnchor) acidManFaceAnchor.getWorldPosition(spitOrigin);
            else spitOrigin.set(acidManRig.position.x, acidManRig.position.y + 1.1, acidManRig.position.z);

            const globGeo = new THREE.SphereGeometry(0.11, 8, 8);
            const globMat = new THREE.MeshStandardMaterial({ color: 0x9bff33, emissive: 0x4d8a10, emissiveIntensity: 1.4, roughness: 0.4 });
            const glob = new THREE.Mesh(globGeo, globMat);
            glob.position.copy(spitOrigin);
            scene.add(glob);

            acidProjectiles.push({
              mesh: glob,
              target: camera.position.clone(),
              life: 0
            });

            if (playAcidSpitSound) playAcidSpitSound();
          }

          if (distAcidMan < 1.45) {
            if (currentAct === 1) {
              isJumpscareActive = true;
              jumpscareTargetRig = acidManRig;
              jumpscareStartTime = now;
              playViolentJumpscareSound();
              if (document.exitPointerLock) document.exitPointerLock();
            } else {
              applyMonsterAttackToPlayer('acidMan', 28, 14);
            }
          }
        } else {
          acidManState = 'PATROL';
          if (acidSoundGain && audioCtx && audioCtx.state === 'running') {
            acidSoundGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
          }

          if (now < acidManSearchUntil) {
            acidManSpeed = SEARCH_SPEED;
            if (!acidManWaypoint || acidManRig.position.distanceTo(acidManWaypoint) < 2.0) {
              acidManWaypoint = getRandomFloorCellNear(acidManLastKnownPos.x, acidManLastKnownPos.z, 0, 5) || acidManLastKnownPos.clone();
            }
          } else {
            acidManSpeed = 1.1;

            if (!isHiding && now > acidManNextCheatTime) {
              const cheatSpot = getRandomFloorCellNear(camera.position.x, camera.position.z, CHEAT_MIN_DIST, CHEAT_MAX_DIST);
              if (cheatSpot) {
                acidManRig.position.x = cheatSpot.x;
                acidManRig.position.z = cheatSpot.z;
                // วาปมาแล้วต้องเดินเข้าหาผู้เล่น ไม่ใช่สุ่มจุดใหม่ทั้งแมพแล้วเดินหนีออกไป
                acidManWaypoint = getRandomFloorCellNear(camera.position.x, camera.position.z, 0, 8) || getRandomFloorCell();
              }
              acidManNextCheatTime = now + CHEAT_MIN_INTERVAL + Math.random() * (CHEAT_MAX_INTERVAL - CHEAT_MIN_INTERVAL);
            }

            if (!acidManWaypoint || acidManRig.position.distanceTo(acidManWaypoint) < 2.0) {
              acidManWaypoint = pickStalkWaypoint();
            }
          }
          const amDir = new THREE.Vector3().subVectors(acidManWaypoint, acidManRig.position).normalize();
          acidManRig.position.x += amDir.x * acidManSpeed * dt;
          acidManRig.position.z += amDir.z * acidManSpeed * dt;
          acidManRig.lookAt(acidManWaypoint.x, acidManRig.position.y, acidManWaypoint.z);
        }

        // อนิเมชันเดิน 3D ของ Acid Man (หลังค่อม แขนขาแกว่งหนักๆ ช้ากว่า Bacteria)
        acidManWalkCycle += dt * (acidManSpeed * 3.4);
        acidManLeftLeg.rotation.x = Math.sin(acidManWalkCycle) * 0.5;
        acidManRightLeg.rotation.x = -Math.sin(acidManWalkCycle) * 0.5;
        acidManLeftArm.rotation.x = -Math.sin(acidManWalkCycle) * 0.4;
        acidManRightArm.rotation.x = Math.sin(acidManWalkCycle) * 0.4;
        acidManTorso.rotation.z = Math.sin(acidManWalkCycle) * 0.08;
        acidManRig.position.y = Math.abs(Math.sin(acidManWalkCycle * 2)) * 0.06;

        // อาการสะดุ้งกระตุกยามลาดตระเวน เหมือน entity อื่นๆ
        if (acidManState === 'PATROL' && !isJumpscareActive) {
          if (now > acidManNextTwitchTime) {
            acidManTwitchUntil = now + 180 + Math.random() * 200;
            acidManNextTwitchTime = now + 6500 + Math.random() * 8500;
            if (acidManLight) {
              acidManLight.intensity = 2.4;
              setTimeout(() => { if (acidManLight) acidManLight.intensity = 1.1; }, 90);
            }
          }
          if (now < acidManTwitchUntil) {
            const jerk = (Math.random() - 0.5) * 0.4;
            acidManTorso.rotation.z = jerk;
            acidManTorso.rotation.x = 0.18 + jerk * 0.3;
            acidManLeftArm.rotation.x = jerk * 1.8;
            acidManRightArm.rotation.x = -jerk * 1.8;
          }
        }

        // =========================================================
        // AI 5: The Gapped (ผอมสูง อกแหวกเป็นรอยแยกมิติ — จับแล้วไม่ฆ่า แต่ลากไปโผล่ที่อื่นในแมพ)
        // =========================================================
        const distGapped = gappedRig.position.distanceTo(camera.position);

        if (!isHiding && !gappedGrabActive && distGapped < GAPPED_BASE_DETECT_RANGE * detectMult) {
          gappedState = 'CHASE';
          playerEnergy = Math.max(0, playerEnergy - 0.8 * dt);
          gappedSpeed = (distGapped < 9.0) ? 3.6 : (isBlackout ? 2.7 : 2.1);

          gappedLastKnownPos.copy(camera.position);
          gappedSearchUntil = now + SEARCH_LINGER_MS;

          if (gapSoundGain && audioCtx && audioCtx.state === 'running') {
            const gVol = Math.max(0, 1 - distGapped / 20) * 0.22;
            gapSoundGain.gain.setValueAtTime(gVol, audioCtx.currentTime);
          }

          const gDir = new THREE.Vector3().subVectors(camera.position, gappedRig.position).normalize();
          gappedRig.position.x += gDir.x * gappedSpeed * dt;
          gappedRig.position.z += gDir.z * gappedSpeed * dt;
          gappedRig.lookAt(camera.position.x, gappedRig.position.y, camera.position.z);

          if (distGapped < GAPPED_GRAB_RANGE && now > gappedGrabCooldownUntil) {
            gappedGrabActive = true;
            gappedGrabStartTime = now;
            playGapPullSound();
          }
        } else {
          gappedState = 'PATROL';
          if (gapSoundGain && audioCtx && audioCtx.state === 'running') {
            gapSoundGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
          }

          if (now < gappedSearchUntil) {
            gappedSpeed = SEARCH_SPEED;
            if (!gappedWaypoint || gappedRig.position.distanceTo(gappedWaypoint) < 2.0) {
              gappedWaypoint = getRandomFloorCellNear(gappedLastKnownPos.x, gappedLastKnownPos.z, 0, 5) || gappedLastKnownPos.clone();
            }
          } else {
            gappedSpeed = 1.15;

            // แอบโกง: ถึงเวลาแล้ววาปมาป้วนเปี้ยนใกล้ๆผู้เล่นบ้าง (ไม่โกงตอนผู้เล่นซ่อนตัว/กำลังถูกลากอยู่)
            if (!isHiding && !gappedGrabActive && now > gappedNextCheatTime) {
              const cheatSpot = getRandomFloorCellNear(camera.position.x, camera.position.z, CHEAT_MIN_DIST, CHEAT_MAX_DIST);
              if (cheatSpot) {
                gappedRig.position.x = cheatSpot.x;
                gappedRig.position.z = cheatSpot.z;
                // วาปมาแล้วต้องเดินเข้าหาผู้เล่น ไม่ใช่สุ่มจุดใหม่ทั้งแมพแล้วเดินหนีออกไป
                gappedWaypoint = getRandomFloorCellNear(camera.position.x, camera.position.z, 0, 8) || getRandomFloorCell();
              }
              gappedNextCheatTime = now + CHEAT_MIN_INTERVAL + Math.random() * (CHEAT_MAX_INTERVAL - CHEAT_MIN_INTERVAL);
            }

            if (!gappedWaypoint || gappedRig.position.distanceTo(gappedWaypoint) < 2.0) {
              gappedWaypoint = pickStalkWaypoint();
            }
          }
          const gpDir = new THREE.Vector3().subVectors(gappedWaypoint, gappedRig.position).normalize();
          gappedRig.position.x += gpDir.x * gappedSpeed * dt;
          gappedRig.position.z += gpDir.z * gappedSpeed * dt;
          gappedRig.lookAt(gappedWaypoint.x, gappedRig.position.y, gappedWaypoint.z);
        }

        // อนิเมชันเดิน 3D ของ The Gapped (ก้าวเรียบนิ่งเงียบผิดปกติ ไม่มีจังหวะสะบัดแขนแรงแบบตัวอื่น)
        gappedWalkCycle += dt * (gappedSpeed * 3.0);
        gappedLeftLeg.rotation.x = Math.sin(gappedWalkCycle) * 0.4;
        gappedRightLeg.rotation.x = -Math.sin(gappedWalkCycle) * 0.4;
        if (!gappedGrabActive) {
          gappedLeftArm.rotation.x = -Math.sin(gappedWalkCycle) * 0.25;
          gappedRightArm.rotation.x = Math.sin(gappedWalkCycle) * 0.25;
        }
        gappedTorso.rotation.z = Math.sin(gappedWalkCycle) * 0.05;
        // วงแหวนรอยแยกที่อกหมุนช้าๆ ตลอดเวลา แม้ตอนลาดตระเวนเฉยๆ
        if (gappedVoidRing && !gappedGrabActive) {
          gappedVoidRing.rotation.z += dt * 1.4;
          gappedVoidRing.scale.setScalar(1);
        }

        // อาการหยุดนิ่งจ้องมองแบบไม่กระพริบตา ก่อนเดินต่อเหมือนไม่มีอะไรเกิดขึ้น
        if (gappedState === 'PATROL' && !isJumpscareActive && !gappedGrabActive) {
          if (now > gappedNextTwitchTime) {
            gappedTwitchUntil = now + 300 + Math.random() * 260;
            gappedNextTwitchTime = now + 7500 + Math.random() * 9500;
            if (gappedLight) {
              gappedLight.intensity = 1.6;
              setTimeout(() => { if (gappedLight) gappedLight.intensity = 0.7; }, 120);
            }
          }
          if (now < gappedTwitchUntil) {
            gappedRig.lookAt(camera.position.x, gappedRig.position.y, camera.position.z);
          }
        }

        // อัพเดตก้อนกรดที่กำลังบินอยู่ทั้งหมด — พุ่งตรงไปยังตำแหน่งที่ผู้เล่นยืนอยู่ตอนถูกถ่มออกมา
        // (ไม่ homing ตามผู้เล่นแบบเรียลไทม์ ให้พอมีจังหวะหลบได้ถ้าขยับตัวทัน)
        for (let pi = acidProjectiles.length - 1; pi >= 0; pi--) {
          const proj = acidProjectiles[pi];
          proj.life += dt;
          const toTarget = new THREE.Vector3().subVectors(proj.target, proj.mesh.position);
          const distToTarget = toTarget.length();

          if (distToTarget < 0.6 || proj.life > 2.5) {
            // ถึงเป้าหมาย (หรือหมดเวลา) — เช็คว่าผู้เล่นยังอยู่ใกล้จุดตกพอจะโดนสาดหรือไม่
            const hitDist = proj.mesh.position.distanceTo(camera.position);
            if (hitDist < 2.2 && !isHiding && !isJumpscareActive) {
              playerEnergy = Math.max(0, playerEnergy - ACID_SPLASH_DAMAGE);
              updateEnergyHUD();
              acidShakeUntil = now + 380;
              acidBurnUntil = now + ACID_BURN_DURATION;
              if (acidSplashEl) {
                acidSplashEl.style.transition = 'none';
                acidSplashEl.style.opacity = '0.85';
                setTimeout(() => {
                  if (acidSplashEl) {
                    acidSplashEl.style.transition = 'opacity 0.5s ease';
                    acidSplashEl.style.opacity = '0';
                  }
                }, 30);
              }
              if (playAcidSizzleSound) playAcidSizzleSound();
            }
            scene.remove(proj.mesh);
            acidProjectiles.splice(pi, 1);
          } else {
            const step = Math.min(1, (ACID_PROJECTILE_SPEED * dt) / distToTarget);
            proj.mesh.position.addScaledVector(toTarget, step);
            proj.mesh.position.y += Math.sin(proj.life * 14) * 0.006; // สั่นเล็กน้อยระหว่างบิน
            proj.mesh.rotation.x += dt * 10;
            proj.mesh.rotation.y += dt * 7;
          }
        }

        // เสียงหัวใจเต้น (คงระยะเดิมไว้ให้ยังรู้สึกได้ว่ามีอะไรเข้าใกล้)
        const closestDist = Math.min(distSmiler, distBacteria, distDuller, distAcidMan, distGapped);

        // "ตู้เอกสารไม่ได้ปลอดภัย 100% เสมอไป" — ถ้ามีบางอย่างเดินมาจ่อใกล้ตู้ตอนกำลังซ่อนอยู่
        // ช่องมองจะสั่น+มีเสียงเตือนก่อน ให้พอมีจังหวะตัดสินใจว่าจะซ่อนต่อหรือรีบวิ่งหนี
        // ก่อนที่มันจะมีโอกาสเล็กๆ "เช็คเจอ" จริงๆ ทำให้กลไกที่เคยไว้ใจได้ไม่น่าเชื่อถือ 100% อีกต่อไป
        if (isHiding && closestDist < LOCKER_CLOSE_CALL_DIST && now > lockerCloseCallCooldownUntil && !isJumpscareActive && !gappedGrabActive) {
          lockerCloseCallCooldownUntil = now + 7000 + Math.random() * 4000;
          const closeRig = (closestDist === distSmiler) ? smilerRig : (closestDist === distBacteria) ? bacteriaRig : (closestDist === distDuller) ? dullerRig : (closestDist === distAcidMan) ? acidManRig : gappedRig;

          if (lockerSlitEl) {
            lockerSlitEl.classList.add('locker-shake');
            setTimeout(() => { if (lockerSlitEl) lockerSlitEl.classList.remove('locker-shake'); }, 900);
          }
          playHeartbeat(0.5);
          playDistantGrowl();

          // The Gapped ไม่จั๊มสแกร์เหมือนตัวอื่น — ถ้าเป็นตัวนี้ที่จ่ออยู่ ให้เช็คด้วยคูลดาวน์ของมันเองแทน
          const isGappedClosest = (closeRig === gappedRig);
          const catchChanceOk = Math.random() < LOCKER_CLOSE_CALL_CATCH_CHANCE;
          const gappedCanGrab = !isGappedClosest || now > gappedGrabCooldownUntil;

          if (catchChanceOk && gappedCanGrab) {
            setTimeout(() => {
              if (!window.gameEngineStarted || !isHiding) return; // ออกจากตู้ทันเวลา รอดไป
              isHiding = false;
              if (lockerSlitEl) lockerSlitEl.style.display = 'none';
              if (isGappedClosest) {
                gappedRig.position.set(camera.position.x, gappedRig.position.y, camera.position.z + 0.5);
                gappedGrabActive = true;
                gappedGrabStartTime = performance.now();
                playGapPullSound();
              } else {
                isJumpscareActive = true;
                jumpscareTargetRig = closeRig;
                jumpscareStartTime = performance.now();
                playViolentJumpscareSound();
                if (document.exitPointerLock) document.exitPointerLock();
              }
            }, 900 + Math.random() * 500);
          }
        }

        if (closestDist < 18) {
          const heartRateInterval = Math.max(360, closestDist * 60);
          if (now > nextHeartbeatTime) {
            const hbVolume = Math.min(0.45, (1 - closestDist / 18) * 0.55);
            playHeartbeat(hbVolume);
            nextHeartbeatTime = now + heartRateInterval;
          }
        }

        // จอซ่า: ให้ขึ้นเฉพาะตอนใกล้จริงๆๆ (ไม่งั้นบังทางตอนพยายามหนี) — ลดเพดานความจัดลงอีก กันบังจอตอนประชิดตัว
        if (closestDist < 7) {
          const glitchStrength = Math.pow(1 - closestDist / 7, 2.2);
          staticCanvas.style.opacity = Math.min(0.14, glitchStrength * 0.14);
          renderNoise();
        } else {
          staticCanvas.style.opacity = 0;
        }

        // จอเหลืองป่วยๆ ของ backrooms: มีระดับพื้นฐานเบาๆ ตลอดเวลาหลังไฟดับครั้งแรก แล้วไล่เข้มขึ้นเรื่อยๆ
        // ตามระยะห่างจาก entity ที่ใกล้ที่สุด — ให้รู้สึกบีบเข้ามาก่อนจะโดนไล่จริงๆ ไม่ใช่โผล่ปุ๊บจัดปั๊บ
        // (ลดเพดานลงจากเดิม กันรวมกับเอฟเฟกต์อื่นแล้วบังจอจนมองไม่เห็นตอน entity ประชิดตัว)
        {
          const proximityDread = closestDist < 16 ? Math.pow(1 - Math.min(closestDist, 16) / 16, 1.4) * 0.38 : 0;
          dreadVignetteEl.style.opacity = Math.min(0.48, 0.1 + proximityDread + (isBlackout ? 0.1 : 0));
        }

        // Ambient sound intensification (fluorescent light buzz + distant office chatter)
        const isChased = (smilerState === 'CHASE' || bacteriaState === 'CHASE' || dullerState === 'CHASE' || acidManState === 'CHASE' || gappedState === 'CHASE');
        if (window.updateAmbientChaseAudio) {
          window.updateAmbientChaseAudio(dt, isChased, closestDist, isBlackout, isJumpscareActive);
        }
        } // จบเงื่อนไข firstBlackoutOccurred: ปิดการทำงานของ entity ทั้งหมดก่อนไฟดับครั้งแรก

        // ทางออกฉุกเฉิน (ต้องเก็บบัตรผ่านให้ครบก่อน)
        if (camera.position.distanceTo(exitPos) < 2.0) {
          if (keycardsCollected >= KEYCARDS_REQUIRED) {
            if (currentAct === 1) {
              if (window.onAct1ReachExit) window.onAct1ReachExit();
            } else {
              const ending = window.evaluateEnding({
                atExitDoor: true,
                gappedSeamHeldOpen: false,
                sanity: playerSanity,
                evidencePhotos: evidencePhotos,
                keycardsCollected: keycardsCollected
              });
              if (ending && window.triggerEndingSequence) {
                window.triggerEndingSequence(ending);
              }
            }
          } else if (now > lastExitLockedNoticeTime + 2500) {
            lastExitLockedNoticeTime = now;
            const notif = document.getElementById('item-notification');
            notif.innerText = `ประตูล็อกอยู่ — ต้องมีบัตรผ่านครบ ${KEYCARDS_REQUIRED} ใบ (มี ${keycardsCollected})`;
            notif.style.display = 'block';
            setTimeout(() => { notif.style.display = 'none'; }, 2400);
            playGlitchShiftSound();
          }
        }
      } else {
        if (window.updateAmbientChaseAudio) {
          window.updateAmbientChaseAudio(dt, false, 999, true, true);
        }
        if (document.getElementById('over-menu').style.display === 'flex') {
          renderNoise();
        }

        // Office Late-Night Menu Camera Pan & Ambient View:
        // ค่อยๆ แพนกล้องช้าๆ ส่องโต๊ะทำงานและบรรยากาศออฟฟิศยามค่ำคืน
        const startMenuEl = document.getElementById('start-menu');
        if (startMenuEl && startMenuEl.style.display !== 'none') {
          const menuTime = now * 0.00035;
          const spawnDeskX = 9.0;
          const spawnDeskZ = 9.0;
          camera.position.x = spawnDeskX + Math.sin(menuTime) * 1.7;
          camera.position.z = spawnDeskZ + Math.cos(menuTime) * 1.7;
          camera.position.y = 1.55 + Math.sin(menuTime * 1.2) * 0.03;
          camera.lookAt(spawnDeskX, 0.95, spawnDeskZ);

          // แสงไฟออฟฟิศสว่างสบายตา ไม่กระพริบชวนหลอน
          if (ceilingLights && ceilingLights.length > 0) {
            ceilingLights[0].intensity = 0.85;
          }
        }
      }

      renderer.render(scene, camera);
    }

