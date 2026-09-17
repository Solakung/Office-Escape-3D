    function buildProceduralLevel() {
      if (wallInstancedMesh) scene.remove(wallInstancedMesh);
      for (const l of ceilingLights) scene.remove(l);
      ceilingLights = [];
      for (const m of lampMeshes) scene.remove(m);
      lampMeshes = [];
      for (const s of stairMeshes) scene.remove(s);
      stairMeshes = [];

      for (const b of almondBottles) scene.remove(b.mesh);
      almondBottles = [];
      almondInventory = 0;
      updateBottleHUD();

      for (const n of loreNotes) scene.remove(n.mesh);
      loreNotes = [];
      // หมายเหตุ: ไม่รีเซ็ต collectedLoreSet ตรงนี้ ให้สะสมข้ามรอบเล่นในเซสชันเดียวกัน

      for (const k of keycards) scene.remove(k.mesh);
      keycards = [];
      keycardsCollected = 0;
      updateObjectiveHUD();

      for (const h of hidingSpots) scene.remove(h.mesh);
      hidingSpots = [];
      isHiding = false;
      document.getElementById('hide-prompt').style.display = 'none';
      document.getElementById('hide-btn').classList.remove('active');

      for (const f of officeFurniture) scene.remove(f.mesh);
      officeFurniture = [];
      for (const m of anomalyMeshes) scene.remove(m);
      anomalyMeshes = [];

      GRID = generateSolvableOfficeMap();

      let wallCount = 0;
      for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
          if (GRID[r][c] === 1) wallCount++;
        }
      }

      wallInstancedMesh = new THREE.InstancedMesh(boxGeo, wallMat, wallCount);
      const dummy = new THREE.Object3D();
      let instIndex = 0;

      const almondMat = new THREE.SpriteMaterial({
        map: genAlmondMilkTex(),
        transparent: true
      });

      // เก็บพื้นทุกช่องไว้ก่อน แล้วค่อยสุ่มวางนมทีหลัง (กันไม่ให้กระจุกอยู่แค่ต้นแมพ)
      const floorCellsForBottles = [];

      for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
          const val = GRID[r][c];
          const wx = c * CELL + CELL / 2;
          const wz = r * CELL + CELL / 2;

          if (val === 1) {
            dummy.position.set(wx, HEIGHT / 2, wz);
            dummy.updateMatrix();
            wallInstancedMesh.setMatrixAt(instIndex++, dummy.matrix);
          } else {
            if ((r % 5 === 1) && (c % 5 === 1)) {
              const light = new THREE.PointLight(0xfff4c2, 0.85, 15, 1.7);
              light.position.set(wx, HEIGHT - 0.2, wz);
              scene.add(light);
              ceilingLights.push(light);

              const lamp = new THREE.Mesh(
                new THREE.BoxGeometry(1.6, 0.05, 0.6),
                new THREE.MeshBasicMaterial({ color: 0xfffae8 })
              );
              lamp.position.set(wx, HEIGHT - 0.03, wz);
              scene.add(lamp);
              lampMeshes.push(lamp);
            }

            // ยกเว้นห้องเริ่มต้น (แถว/คอลัมน์ 1-3) ไม่เอาไปสุ่มวางขวดนม/โน้ต/บัตรผ่าน/เฟอร์นิเจอร์ทั่วไป
            // เพราะห้องนี้จะจัดโต๊ะทำงานแบบตายตัวไว้ให้ดูเหมือนพึ่งลุกจากโต๊ะไป ไม่อยากให้ของสุ่มไปแทรกจนรก
            if (val === 0 && !(r <= 3 && c <= 3)) floorCellsForBottles.push({ wx, wz });

            if (val === 2) playerSpawn.set(wx, 1.5, wz);
            if (val === 3) {
              exitPos.set(wx, 0.5, wz);
              const exitLight = new THREE.PointLight(0xff2222, 1.8, 12);
              exitLight.position.set(wx, 1.8, wz);
              scene.add(exitLight);
              stairMeshes.push(exitLight);

              const stairMat = new THREE.MeshLambertMaterial({ color: 0x3d1111 });
              for (let s = 0; s < 4; s++) {
                const step = new THREE.Mesh(new THREE.BoxGeometry(2, 0.25, 0.5), stairMat);
                step.position.set(wx, 0.125 + s * 0.25, wz - 1 + s * 0.5);
                scene.add(step);
                stairMeshes.push(step);
              }
              const sign = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.4, 0.1),
                new THREE.MeshBasicMaterial({ color: 0xff3333 })
              );
              sign.position.set(wx, 2.3, wz);
              scene.add(sign);
              stairMeshes.push(sign);
            }
            if (val === 4) smilerSpawn.set(wx, 1.4, wz);
            if (val === 5) bacteriaSpawn.set(wx, 0, wz);
            if (val === 6) dullerSpawn.set(wx, 0, wz);
            if (val === 7) acidManSpawn.set(wx, 0, wz);
            if (val === 8) gappedSpawn.set(wx, 0, wz);
          }
        }
      }

      wallInstancedMesh.instanceMatrix.needsUpdate = true;
      scene.add(wallInstancedMesh);

      // กระจายนมอัลมอนด์ 35-45 ขวด แบบสุ่มทั่วทั้งแมป (สับลำดับก่อนเลือก กันไม่ให้ไปกระจุกอยู่แค่ต้นแมพ)
      for (let i = floorCellsForBottles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [floorCellsForBottles[i], floorCellsForBottles[j]] = [floorCellsForBottles[j], floorCellsForBottles[i]];
      }
      const bottleTarget = Math.min(floorCellsForBottles.length, 35 + Math.floor(Math.random() * 11));
      for (let i = 0; i < bottleTarget; i++) {
        const { wx, wz } = floorCellsForBottles[i];
        const bottle = new THREE.Sprite(almondMat);
        bottle.scale.set(0.65, 1.3, 1);
        bottle.position.set(wx, 0.65, wz);
        scene.add(bottle);
        // หมายเหตุ: ตั้งใจไม่ใส่ PointLight แยกต่อขวดแล้ว เพราะการ add/remove
        // dynamic light จำนวนมากบ่อยๆ (ตอนเก็บของ) ทำให้ WebGL ต้อง recompile
        // shader ของวัสดุที่รับแสงใหม่ทุกครั้ง เป็นสาเหตุของอาการเกมกระตุก/ค้างตอนเก็บของ
        almondBottles.push({ mesh: bottle, active: true, x: wx, z: wz });
      }

      // กระจายโน้ต/เอกสารเล่าเรื่อง ทั่วแมป (ต่อจากตำแหน่งขวดนม กันไม่ให้ซ้อนกัน)
      const noteMat = new THREE.SpriteMaterial({ map: genNoteTex(), transparent: true });
      const shuffledLore = LORE_TEXTS.slice();
      for (let i = shuffledLore.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledLore[i], shuffledLore[j]] = [shuffledLore[j], shuffledLore[i]];
      }
      const noteCount = Math.min(shuffledLore.length, floorCellsForBottles.length - bottleTarget);
      for (let i = 0; i < noteCount; i++) {
        const { wx, wz } = floorCellsForBottles[bottleTarget + i];
        const note = new THREE.Sprite(noteMat);
        note.scale.set(0.5, 0.62, 1);
        note.position.set(wx, 0.9, wz);
        scene.add(note);
        loreNotes.push({ mesh: note, active: true, x: wx, z: wz, text: shuffledLore[i] });
      }

      // วางบัตรผ่าน (Keycard) ต่อจากตำแหน่งโน้ต — ต้องเก็บให้ครบก่อนถึงจะออกทาง EXIT ได้
      const keycardMat = new THREE.SpriteMaterial({ map: genKeycardTex(), transparent: true });
      const keycardStart = bottleTarget + noteCount;
      for (let i = 0; i < KEYCARDS_REQUIRED && keycardStart + i < floorCellsForBottles.length; i++) {
        const { wx, wz } = floorCellsForBottles[keycardStart + i];
        const card = new THREE.Sprite(keycardMat);
        card.scale.set(0.55, 0.35, 1);
        card.position.set(wx, 0.85, wz);
        scene.add(card);
        keycards.push({ mesh: card, active: true, x: wx, z: wz });
      }
      updateObjectiveHUD();

      // กระจายจุดซ่อนตัว (ตู้เอกสาร) ต่อจากตำแหน่งบัตรผ่าน
      const hideCabinetMat = new THREE.MeshLambertMaterial({ color: 0x3a352c });
      const hideCabinetGeo = new THREE.BoxGeometry(1.1, 1.9, 0.6);
      const hideStart = keycardStart + KEYCARDS_REQUIRED;
      const hideTarget = Math.min(HIDING_SPOTS_COUNT, Math.max(0, floorCellsForBottles.length - hideStart));
      for (let i = 0; i < hideTarget; i++) {
        const { wx, wz } = floorCellsForBottles[hideStart + i];
        const cabinet = new THREE.Mesh(hideCabinetGeo, hideCabinetMat);
        cabinet.position.set(wx, 0.95, wz);
        scene.add(cabinet);
        hidingSpots.push({ mesh: cabinet, x: wx, z: wz });
      }

      // วางเฟอร์นิเจอร์ออฟฟิศ (โต๊ะ/เก้าอี้/ตู้เอกสาร/ต้นไม้) ต่อจากตำแหน่งจุดซ่อนตัว — สิ่งที่บ่งบอกว่าที่นี่คือออฟฟิศ
      placeOfficeFurniture(floorCellsForBottles, hideStart + hideTarget);
      // โต๊ะทำงานของผู้เล่นเองในห้องเริ่มต้น จัดตายตัวแยกจากของสุ่มด้านบน
      placeSpawnDesk();

      window.resetBackroomsPlayer();
    }

    window.regenerateLevelAndRestart = function() {
      buildProceduralLevel();
    };

    window.resetBackroomsPlayer = function() {
      if (!camera) return;
      camera.position.copy(playerSpawn);
      // หันหน้าเข้าไปในห้อง (มุมทแยงเข้าหาโต๊ะทำงาน) แทนที่จะเป็น yaw=0 ซึ่งหันตรงเข้ากำแพงด้านหลังจุดเกิดพอดี
      cameraYaw = -3 * Math.PI / 4;
      cameraPitch = 0;

      playerEnergy = 100;
      hasRevealedSanity = false;

      document.getElementById('meter-label').innerText = 'ENERGY:';
      document.getElementById('meter-label').style.color = '#9cb873';
      document.getElementById('hud-subtitle').innerText = 'BLDG-A: 4F // OFFICE FLOOR';
      updateEnergyHUD();

      if (smilerRig) { smilerRig.position.copy(smilerSpawn); smilerRig.rotation.z = 0; }
      if (bacteriaRig) { bacteriaRig.position.copy(bacteriaSpawn); bacteriaTorso.rotation.z = 0; }
      if (dullerRig) { dullerRig.position.copy(dullerSpawn); dullerRig.rotation.z = 0; dullerRig.rotation.x = 0; }
      if (acidManRig) { acidManRig.position.copy(acidManSpawn); acidManRig.rotation.set(0, 0, 0); }
      if (gappedRig) { gappedRig.position.copy(gappedSpawn); gappedRig.rotation.set(0, 0, 0); }
      if (bacteriaJawMesh) bacteriaJawMesh.scale.y = 1;
      if (dullerJawMesh) dullerJawMesh.scale.y = 0.6;

      // เก็บกวาดก้อนกรดที่ยังลอยค้างอยู่กลางอากาศตอนกดเริ่มใหม่
      for (let i = 0; i < acidProjectiles.length; i++) {
        if (acidProjectiles[i].mesh && scene) scene.remove(acidProjectiles[i].mesh);
      }
      acidProjectiles = [];
      acidThrowCooldownUntil = 0;
      acidShakeUntil = 0;
      acidBurnUntil = 0;

      // เคลียร์สถานะ "ลากผ่านรอยแยก" ของ The Gapped ตอนกดเริ่มใหม่
      gappedGrabActive = false;
      gappedGrabStartTime = 0;
      gappedGrabCooldownUntil = 0;
      if (gapWarpEl) gapWarpEl.style.opacity = 0;
      
      for (let k in keys) keys[k] = false;
      joyVector.x = 0;
      joyVector.y = 0;
      smoothMoveFwd = 0;
      smoothMoveSide = 0;
      pendingLookDX = 0;
      pendingLookDY = 0;
      lookTouchId = null;

      isHiding = false;
      document.getElementById('hide-prompt').style.display = 'none';
      document.getElementById('hide-btn').classList.remove('active');
      if (lockerSlitEl) lockerSlitEl.style.display = 'none';

      smilerSpeed = 1.4; smilerState = 'PATROL'; smilerWaypoint = null; smilerSearchUntil = 0;
      bacteriaSpeed = 1.2; bacteriaState = 'PATROL'; bacteriaWaypoint = null; bacteriaSearchUntil = 0;
      dullerSpeed = 1.3; dullerState = 'PATROL'; dullerWaypoint = null; dullerSearchUntil = 0;
      acidManSpeed = 1.1; acidManState = 'PATROL'; acidManWaypoint = null; acidManSearchUntil = 0;
      gappedSpeed = 1.15; gappedState = 'PATROL'; gappedWaypoint = null; gappedSearchUntil = 0;

      const restartNow = performance.now();
      smilerNextCheatTime = restartNow + 14000 + Math.random() * 8000;
      bacteriaNextCheatTime = restartNow + 20000 + Math.random() * 8000;
      dullerNextCheatTime = restartNow + 26000 + Math.random() * 8000;
      acidManNextCheatTime = restartNow + 32000 + Math.random() * 8000;
      gappedNextCheatTime = restartNow + 38000 + Math.random() * 8000;
      nextPeripheralGlitchTime = restartNow + 13000 + Math.random() * 9000;
      lockerCloseCallCooldownUntil = 0;
      lastFlickerScheduleTime = 0;
      if (dreadVignetteEl) dreadVignetteEl.style.opacity = 0;
      if (subliminalFlashEl) subliminalFlashEl.style.opacity = 0;
      if (acidSplashEl) acidSplashEl.style.opacity = 0;
      if (viewportEl) viewportEl.style.filter = '';
      if (chromaEl) chromaEl.style.opacity = 0;
      if (hudEl) hudEl.style.transform = '';
      if (peripheralFigureEl) peripheralFigureEl.style.opacity = 0;
      for (let i = 0; i < ceilingLights.length; i++) {
        ceilingLights[i].nextFlickerTime = undefined;
        ceilingLights[i].isFlickering = false;
      }

      isSprintBoost = false;
      sprintBoostEndTime = 0;
      sprintCooldownEndTime = 0;

      isJumpscareActive = false;
      jumpscareTargetRig = null;

      document.getElementById('noise-canvas').style.opacity = 0;
      document.getElementById('jumpscare-strobe').style.display = 'none';
      if (monsterSoundGain && audioCtx) monsterSoundGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      if (shadowSoundGain && audioCtx) shadowSoundGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      if (dullerSoundGain && audioCtx) dullerSoundGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      if (gapSoundGain && audioCtx) gapSoundGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);

      isBlackout = false;
      nextBlackoutTime = performance.now() + 25000;
      firstBlackoutOccurred = false;

      if (wallMat && officeWallTex) {
        wallMat.map = officeWallTex;
        wallMat.bumpMap = null;
        wallMat.needsUpdate = true;
      }
      if (floorMat && officeFloorTex) {
        floorMat.map = officeFloorTex;
        floorMat.bumpMap = null;
        floorMat.needsUpdate = true;
      }
      if (ceilingMat && officeCeilingTex) {
        ceilingMat.map = officeCeilingTex;
        ceilingMat.bumpMap = null;
        ceilingMat.needsUpdate = true;
      }
      if (ambientLight) {
        ambientLight.color.setHex(OFFICE_AMBIENT_COLOR);
        ambientLight.intensity = 0.9;
      }
      if (scene && scene.fog) {
        scene.fog.color.setHex(OFFICE_FOG_COLOR);
        scene.fog.density = OFFICE_FOG_DENSITY;
      }
      if (renderer) renderer.setClearColor(OFFICE_FOG_COLOR);
      if (camera) { camera.fov = 82; camera.updateProjectionMatrix(); }
      if (liminalHumGain && audioCtx) {
        liminalHumGain.gain.cancelScheduledValues(audioCtx.currentTime);
        liminalHumGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      }
      liminalHumStarted = false;
      resetOfficeFurniture();
      if (isTouchDevice) {
        document.getElementById('sprint-btn').style.display = 'none';
        document.getElementById('flash-btn').style.display = 'none';
        document.getElementById('hide-btn').style.display = 'none';
        document.getElementById('drink-btn').style.display = 'none';
      }

      nextAmbientEventTime = performance.now() + 9000 + Math.random() * 6000;
      cameraCharge = 100;
      cameraFlashActive = false;
      if (flashlight) flashlight.intensity = 0;
      recentNoise = null;
      updateFlashlightIndicator(); // กล้องจะใช้ได้ก็ต่อเมื่อไฟดับครั้งแรกเกิดขึ้น
      const noteOverlay = document.getElementById('note-overlay');
      if (noteOverlay) noteOverlay.style.display = 'none';
      lastExitLockedNoticeTime = 0;
    };

