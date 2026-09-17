    // -------------------------------------------------------------
    // 5. World Setup
    // -------------------------------------------------------------
    // บางเบราเซอร์มือถือ (โดยเฉพาะที่มีแถบ address bar ที่ยังยุบตัวไม่เสร็จตอนสคริปต์รัน)
    // window.innerWidth/innerHeight ตอน setupWorld() เริ่มทำงานอาจยังไม่ใช่ขนาดจอจริง
    // ทำให้ canvas ถูกล็อกขนาดเล็กไปตลอดเกม (เพราะ renderer.setSize ใส่ inline style เป็น px ตายตัว)
    // ใช้ visualViewport เมื่อมี เพราะรายงานขนาดจอที่ "มองเห็นจริง" แม่นกว่า innerWidth/innerHeight เสมอ
    function getViewportSize() {
      if (window.visualViewport) {
        return {
          w: Math.round(window.visualViewport.width) || window.innerWidth || 360,
          h: Math.round(window.visualViewport.height) || window.innerHeight || 640
        };
      }
      return { w: window.innerWidth || 360, h: window.innerHeight || 640 };
    }

    function setupWorld() {
      const container = document.getElementById('viewport');
      const { w, h } = getViewportSize();

      scene = new THREE.Scene();
      // เริ่มเกมด้วยหมอกโทนเทาสว่างแบบแสงฟลูออเรสเซนต์ในออฟฟิศ บางมาก (แทบมองไม่เห็น)
      // ค่อยเปลี่ยนเป็นสีเหลือง backrooms หนาขึ้นตอนไฟดับครั้งแรก ไม่ใช่ตั้งแต่ต้นเกม
      scene.fog = new THREE.FogExp2(OFFICE_FOG_COLOR, OFFICE_FOG_DENSITY);

      camera = new THREE.PerspectiveCamera(82, w / h, 0.1, 85);
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'default' });
      renderer.setSize(w, h);
      renderer.setClearColor(OFFICE_FOG_COLOR);
      if (THREE.ACESFilmicToneMapping) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.94;
      }
      container.appendChild(renderer.domElement);

      ambientLight = new THREE.AmbientLight(OFFICE_AMBIENT_COLOR, 0.9);
      scene.add(ambientLight);

      // ตัวไฟนี้เดิมคือไฟฉาย ตอนนี้ใช้เป็นแฟลชกล้อง: ปกติปิดสนิท (intensity 0) วาบสว่างเฉพาะตอนกดถ่ายรูป
      flashlight = new THREE.SpotLight(0xfff8e7, 0, 26, Math.PI * 0.35, 0.45, 1.0);
      camera.add(flashlight);
      flashlight.position.set(0, 0, 0.1);
      flashlight.target = camera;
      scene.add(camera);

      officeWallTex = genOfficeWallTex();
      officeWallBump = genOfficeWallBump();
      backroomsWallTex = genAuthenticWallTex();
      backroomsWallBump = genAuthenticWallBump();
      officeFloorTex = genOfficeCarpetTex();
      officeFloorBump = genOfficeCarpetBump();
      backroomsFloorTex = genAuthenticCarpetTex();
      backroomsFloorBump = genAuthenticCarpetBump();
      officeCeilingTex = genAuthenticCeilingTex();
      officeCeilingBump = genAuthenticCeilingBump();
      backroomsCeilingTex = genSickCeilingTex();
      backroomsCeilingBump = genSickCeilingBump();
      wallMat = new THREE.MeshLambertMaterial({ map: officeWallTex, bumpMap: officeWallBump, bumpScale: 0.045 });
      floorMat = new THREE.MeshLambertMaterial({ map: officeFloorTex, bumpMap: officeFloorBump, bumpScale: 0.035 });
      ceilingMat = new THREE.MeshLambertMaterial({ map: officeCeilingTex, bumpMap: officeCeilingBump, bumpScale: 0.035 });
      boxGeo = new THREE.BoxGeometry(CELL, HEIGHT, CELL);

      // Apply initial high-definition pixel ratio for crisp rendering
      const initialDpr = window.devicePixelRatio || 1;
      renderer.setPixelRatio(Math.min(2.0, initialDpr));

      // วอร์มอัพเทกซ์เจอร์ผนัง/พื้น/เพดานฝั่ง Backrooms ขึ้น GPU ล่วงหน้าตั้งแต่ตอนโหลดเกม
      // กันไม่ให้กระตุกตอนสลับผนังตอนไฟดับครั้งแรก (การอัปโหลดเทกซ์เจอร์ใหม่ครั้งแรกกินเฟรมพอสมควร)
      [officeWallTex, officeWallBump, backroomsWallTex, backroomsWallBump, officeFloorTex, officeFloorBump, backroomsFloorTex, backroomsFloorBump, officeCeilingTex, officeCeilingBump, backroomsCeilingTex, backroomsCeilingBump].forEach(tex => {
        if (!tex) return;
        const warmup = new THREE.Mesh(
          new THREE.PlaneGeometry(0.01, 0.01),
          new THREE.MeshBasicMaterial({ map: tex })
        );
        warmup.frustumCulled = false;
        warmup.position.set(0, -500, 0);
        scene.add(warmup);
      });

      const mapW = MAP_SIZE * CELL;
      const mapH = MAP_SIZE * CELL;

      const planeGeo = new THREE.PlaneGeometry(mapW, mapH);
      const floor = new THREE.Mesh(planeGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(mapW / 2, 0, mapH / 2);
      scene.add(floor);

      const ceiling = new THREE.Mesh(planeGeo, ceilingMat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(mapW / 2, HEIGHT, mapH / 2);
      scene.add(ceiling);

      // สร้าง 3D Animated Rigs
      smilerRig = createSmiler3DRig();
      scene.add(smilerRig);

      bacteriaRig = createBacteria3DRig();
      scene.add(bacteriaRig);

      dullerRig = createDuller3DRig();
      scene.add(dullerRig);

      acidManRig = createAcidMan3DRig();
      scene.add(acidManRig);

      gappedRig = createGapped3DRig();
      scene.add(gappedRig);

      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        isTouchDevice = true;
        document.getElementById('joy-base').style.display = 'block';
        document.getElementById('touch-look').style.display = 'block';
        // ปุ่ม FLASHLIGHT / SPRINT / HIDE ทั้งหมดยังไม่โผล่ก่อนไฟดับครั้งแรก กันหลุด hint ว่ามีอะไรผิดปกติ
        // (จะโผล่พร้อมกันตอนไฟดับครั้งแรกเกิดขึ้นจริง)
      }

      buildProceduralLevel();
      requestAnimationFrame(renderLoop);
    }

    // -------------------------------------------------------------
    // 4.5 Office Furniture — สิ่งที่บ่งบอกว่านี่คือออฟฟิศจริงๆ ก่อนไฟดับครั้งแรก
    // เก็บ basePos/baseRot ของแต่ละชิ้นไว้ เพื่อให้ "บิดเบี้ยว" ตอนไฟดับครั้งแรก แล้วรีเซ็ตกลับได้ตอนเริ่มใหม่
    // -------------------------------------------------------------
    let deskTopMat, cabinetSideMat, whiteboardMat;

    function makeDesk() {
      const g = new THREE.Group();
      if (!deskTopMat) deskTopMat = new THREE.MeshLambertMaterial({ map: genDeskTopTex() });
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.65), deskTopMat);
      top.position.y = 0.74;
      g.add(top);
      const legMat = new THREE.MeshLambertMaterial({ color: 0x2e2e2e });
      const legGeo = new THREE.BoxGeometry(0.05, 0.74, 0.05);
      [[-0.58, -0.27], [0.58, -0.27], [-0.58, 0.27], [0.58, 0.27]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(x, 0.37, z);
        g.add(leg);
      });
      const monMat = new THREE.MeshLambertMaterial({ color: 0x151515 });
      const mon = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.03), monMat);
      mon.position.set(0, 0.74 + 0.16, -0.18);
      g.add(mon);
      const standMon = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.05), monMat);
      standMon.position.set(0, 0.74 + 0.03, -0.18);
      g.add(standMon);
      g.userData.type = 'desk';
      return g;
    }

    function makeChair() {
      const g = new THREE.Group();
      const chairMat = new THREE.MeshLambertMaterial({ color: 0x33363c });
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 10), chairMat);
      seat.position.y = 0.46;
      g.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.06), chairMat);
      back.position.set(0, 0.72, -0.2);
      g.add(back);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 6), new THREE.MeshLambertMaterial({ color: 0x1c1c1c }));
      pole.position.y = 0.22;
      g.add(pole);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 10), new THREE.MeshLambertMaterial({ color: 0x1c1c1c }));
      base.position.y = 0.02;
      g.add(base);
      g.userData.type = 'chair';
      return g;
    }

    function makeFilingCabinet() {
      if (!cabinetSideMat) cabinetSideMat = new THREE.MeshLambertMaterial({ map: genCabinetTex() });
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.3, 0.55), cabinetSideMat);
      body.position.y = 0.65;
      g.add(body);
      g.userData.type = 'cabinet';
      g.userData.bodyMesh = body;
      return g;
    }

    function makePlant() {
      const g = new THREE.Group();
      const potMat = new THREE.MeshLambertMaterial({ color: 0x6b4a35 });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.3, 8), potMat);
      pot.position.y = 0.15;
      g.add(pot);
      const leafMat = new THREE.MeshLambertMaterial({ color: 0x4c7a3e });
      const leaves = [];
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 5), leafMat);
        const ang = (i / 5) * Math.PI * 2;
        leaf.position.set(Math.cos(ang) * 0.08, 0.55, Math.sin(ang) * 0.08);
        leaf.rotation.z = Math.cos(ang) * 0.25;
        leaf.rotation.x = Math.sin(ang) * 0.25;
        g.add(leaf);
        leaves.push(leaf);
      }
      g.userData.type = 'plant';
      g.userData.leafMat = leafMat;
      return g;
    }

    // ชั้นหนังสือ/แฟ้มเอกสาร ตั้งเรียงเป็นแถวสีสุ่มไม่เท่ากัน ให้ดูเป็นออฟฟิศจริงที่มีคนใช้งาน
    function makeBookshelf() {
      const g = new THREE.Group();
      const shelfMat = new THREE.MeshLambertMaterial({ color: 0x5b4632 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.4), shelfMat);
      body.position.y = 0.95;
      g.add(body);
      const bookColors = [0x8a2e2e, 0x2e4a8a, 0x2e8a4d, 0x8a7a2e, 0x5a2e8a, 0x8a5a2e];
      const bookGroup = new THREE.Group();
      for (let shelf = 0; shelf < 3; shelf++) {
        let x = -0.42;
        const y = 0.5 + shelf * 0.6;
        while (x < 0.4) {
          const w = 0.05 + Math.random() * 0.05;
          const h = 0.28 + Math.random() * 0.12;
          const book = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, 0.3),
            new THREE.MeshLambertMaterial({ color: bookColors[Math.floor(Math.random() * bookColors.length)] })
          );
          book.position.set(x + w / 2, y + h / 2 - 0.15, 0.02);
          book.userData.basePos = book.position.clone();
          bookGroup.add(book);
          x += w + 0.01;
        }
      }
      g.add(bookGroup);
      g.userData.type = 'bookshelf';
      g.userData.bookGroup = bookGroup;
      return g;
    }

    // เครื่องปริ้นเตอร์สำนักงาน มีไฟแสดงสถานะเล็กๆ
    function makePrinter() {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshLambertMaterial({ color: 0xd8d8d0 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.45), bodyMat);
      body.position.y = 0.4;
      g.add(body);
      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.35), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
      tray.position.set(0, 0.58, 0.02);
      g.add(tray);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x22ff44 });
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), ledMat);
      led.position.set(0.2, 0.58, 0.24);
      g.add(led);
      g.userData.type = 'printer';
      g.userData.ledMat = ledMat;
      return g;
    }

    // ตู้กดน้ำดื่มมุมออฟฟิศ
    function makeWaterCooler() {
      const g = new THREE.Group();
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.9, 8), new THREE.MeshLambertMaterial({ color: 0xe8e8e8 }));
      stand.position.y = 0.45;
      g.add(stand);
      const bottleMat = new THREE.MeshLambertMaterial({ color: 0x8fc7e8, transparent: true, opacity: 0.75 });
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.55, 10), bottleMat);
      bottle.position.y = 1.15;
      g.add(bottle);
      g.userData.type = 'watercooler';
      g.userData.bottleMat = bottleMat;
      return g;
    }

    // ไวท์บอร์ดตั้งพื้น มีกราฟ/ตารางประชุมเลือนๆ อยู่ในตัว
    function makeWhiteboard() {
      const g = new THREE.Group();
      const legMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      [-0.55, 0.55].forEach((x) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 6), legMat);
        leg.position.set(x, 0.65, 0);
        g.add(leg);
      });
      if (!whiteboardMat) whiteboardMat = new THREE.MeshLambertMaterial({ map: genWhiteboardTex() });
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.04), whiteboardMat);
      board.position.set(0, 1.25, 0);
      g.add(board);
      g.userData.type = 'whiteboard';
      g.userData.boardMesh = board;
      return g;
    }

    // ตู้เซิร์ฟเวอร์/แร็คไฟฟ้าเล็กๆ มุมออฟฟิศ มีแผงไฟกะพริบ
    function makeServerRack() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.8, 0.6), new THREE.MeshLambertMaterial({ color: 0x1c1e22 }));
      body.position.y = 0.9;
      g.add(body);
      const panelMat = new THREE.MeshLambertMaterial({ map: genServerLightsTex() });
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 0.02), panelMat);
      panel.position.set(0, 0.9, 0.31);
      g.add(panel);
      g.userData.type = 'server';
      g.userData.panelMat = panelMat;
      return g;
    }

    // ถังขยะสำนักงานเล็กๆ ให้มุมห้องดูมีรายละเอียดขึ้น
    function makeTrashBin() {
      const g = new THREE.Group();
      const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.42, 10), new THREE.MeshLambertMaterial({ color: 0x2f3438 }));
      bin.position.y = 0.21;
      g.add(bin);
      g.userData.type = 'trashbin';
      return g;
    }

    // วางเฟอร์นิเจอร์สำนักงานกระจายทั่วแมป ต่อจากตำแหน่งจุดซ่อนตัว (ใช้ floor cell list เดียวกัน กันซ้อนกับของอื่น)
    function placeOfficeFurniture(floorCells, startIdx) {
      officeFurniture = [];
      // เพิ่มความหนาแน่นของเฟอร์นิเจอร์ขึ้นมาก (เดิม 46) + เพิ่มชนิดของให้หลากหลายขึ้น
      // ให้ทุกห้องดูเหมือนออฟฟิศที่มีคนใช้งานจริง ไม่ใช่มีแค่โต๊ะ/เก้าอี้ไม่กี่ตัวลอยอยู่ในที่ว่างเปล่า
      const count = Math.min(120, Math.max(0, floorCells.length - startIdx));
      const types = [
        'desk_chair', 'desk_chair', 'cabinet', 'plant', 'desk_chair', 'bookshelf',
        'desk_chair', 'trashbin', 'printer', 'desk_chair', 'cabinet', 'watercooler',
        'desk_chair', 'plant', 'whiteboard', 'desk_chair', 'bookshelf', 'server',
        'desk_chair', 'trashbin', 'cabinet', 'desk_chair', 'plant', 'printer'
      ];
      for (let i = 0; i < count; i++) {
        const { wx, wz } = floorCells[startIdx + i];
        const kind = types[i % types.length];
        const rot = Math.floor(Math.random() * 4) * (Math.PI / 2); // หันตามแนวแกน ดูเป็นระเบียบแบบออฟฟิศ

        const addItem = (mesh, offX, offZ) => {
          mesh.position.set(wx + offX, 0, wz + offZ);
          mesh.rotation.y = rot;
          scene.add(mesh);
          officeFurniture.push({
            mesh,
            type: mesh.userData.type,
            basePos: mesh.position.clone(),
            baseRot: rot
          });
        };

        if (kind === 'desk_chair') {
          addItem(makeDesk(), 0, 0);
          const chairOff = new THREE.Vector3(0, 0, 0.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
          addItem(makeChair(), chairOff.x, chairOff.z);
        } else if (kind === 'cabinet') {
          addItem(makeFilingCabinet(), 0, 0);
        } else if (kind === 'plant') {
          addItem(makePlant(), 0, 0);
        } else if (kind === 'bookshelf') {
          addItem(makeBookshelf(), 0, 0);
        } else if (kind === 'printer') {
          addItem(makePrinter(), 0, 0);
        } else if (kind === 'watercooler') {
          addItem(makeWaterCooler(), 0, 0);
        } else if (kind === 'whiteboard') {
          addItem(makeWhiteboard(), 0, 0);
        } else if (kind === 'server') {
          addItem(makeServerRack(), 0, 0);
        } else if (kind === 'trashbin') {
          addItem(makeTrashBin(), 0, 0);
        }
      }
    }

    // ไฟดับครั้งแรกจบลง = ของในออฟฟิศเริ่ม "ผิดที่ผิดทาง" — เก้าอี้ล้ม โต๊ะเอียงไม่ตรงแนว
    // ต้นไม้ตาย ตู้เอกสารสนิมเขรอะ และมีสำเนาของบางชิ้นโผล่ซ้อนแบบไม่ควรมีอยู่จริง (backrooms อยากซ้ำของเดิมไปเรื่อยๆ)
    function corruptOfficeFurniture() {
      for (const item of officeFurniture) {
        if (item.type === 'chair' && Math.random() < 0.4) {
          item.mesh.rotation.x = Math.PI * 0.42;
          item.mesh.position.y -= 0.35;
        } else if (item.type === 'desk' && Math.random() < 0.3) {
          item.mesh.rotation.y += (Math.random() - 0.5) * 0.7;
          item.mesh.position.x += (Math.random() - 0.5) * 0.4;
          item.mesh.position.z += (Math.random() - 0.5) * 0.4;
        } else if (item.type === 'cabinet') {
          item.mesh.userData.bodyMesh.material = item.mesh.userData.bodyMesh.material.clone();
          item.mesh.userData.bodyMesh.material.color.setHex(0x5c5548);
        } else if (item.type === 'plant') {
          item.mesh.userData.leafMat.color.setHex(0x5a4a2e);
        } else if (item.type === 'bookshelf' && Math.random() < 0.45) {
          // ชั้นหนังสือล้มเอียง หนังสือร่วงกระจายเกลื่อนพื้น
          item.mesh.rotation.z = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.5);
          item.mesh.position.y -= 0.3;
          for (const book of item.mesh.userData.bookGroup.children) {
            book.position.x += (Math.random() - 0.5) * 0.6;
            book.position.z += (Math.random() - 0.5) * 0.6;
            book.position.y -= 0.3 + Math.random() * 0.2;
            book.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
          }
        } else if (item.type === 'printer') {
          // ไฟสถานะเปลี่ยนเป็นสีแดงกะพริบ เหมือนเครื่องพังหรือถูกปล่อยทิ้งไว้กลางงานพิมพ์
          item.mesh.userData.ledMat.color.setHex(0xff2200);
        } else if (item.type === 'watercooler') {
          // น้ำในตู้กดกลายเป็นสีขุ่นคล้ำ ไม่น่าดื่ม
          item.mesh.userData.bottleMat.color.setHex(0x4a4030);
          item.mesh.userData.bottleMat.opacity = 0.9;
        } else if (item.type === 'server' && Math.random() < 0.6) {
          // แผงไฟเซิร์ฟเวอร์เปลี่ยนเป็นสีแดงเถื่อนทั้งแผง เหมือนระบบเตือนภัยค้าง
          // (วัสดุนี้สร้างแยกต่อเซิร์ฟเวอร์แต่ละตัวอยู่แล้ว ไม่ใช่วัสดุร่วม จึงแก้สีตรงๆ ได้เลยไม่ต้อง clone)
          item.mesh.userData.panelMat.color.setHex(0xff3322);
        } else if (item.type === 'whiteboard' && Math.random() < 0.5) {
          // ข้อความบนกระดานเปลี่ยนเป็นข้อความหลอนแทนกราฟประชุมปกติ
          const c = document.createElement('canvas');
          c.width = 256; c.height = 160;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#c8c8be'; ctx.fillRect(0, 0, 256, 160);
          ctx.fillStyle = 'rgba(120,10,10,0.85)';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText('GET OUT', 55, 60);
          ctx.font = '13px sans-serif';
          ctx.fillText('THIS IS NOT THE OFFICE', 30, 105);
          item.mesh.userData.boardMesh.material = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) });
        }
      }

      // สุ่มโคลนโต๊ะ 5-7 ตัวไปวางซ้อนใกล้ๆ ของเดิม เอียงมุมแปลกๆ — ให้รู้สึกว่าของบางอย่าง "ซ้ำ" เกินจริง
      const desks = officeFurniture.filter(f => f.type === 'desk');
      const dupeCount = Math.min(desks.length, 5 + Math.floor(Math.random() * 3));
      for (let i = 0; i < dupeCount; i++) {
        const src = desks[Math.floor(Math.random() * desks.length)];
        const clone = makeDesk();
        clone.position.copy(src.basePos);
        clone.position.x += (Math.random() - 0.5) * 1.2;
        clone.position.z += (Math.random() - 0.5) * 1.2;
        clone.position.y += 0.02 + Math.random() * 0.5;
        clone.rotation.y = Math.random() * Math.PI * 2;
        clone.rotation.z = (Math.random() - 0.5) * 0.6;
        scene.add(clone);
        anomalyMeshes.push(clone);
      }
    }

    // รีเซ็ตเฟอร์นิเจอร์กลับตำแหน่ง/สภาพปกติ + ลบของผิดปกติที่โผล่มาตอนไฟดับ (ใช้ตอนเริ่มเกมใหม่)
    function resetOfficeFurniture() {
      for (const item of officeFurniture) {
        item.mesh.position.copy(item.basePos);
        item.mesh.rotation.set(0, item.baseRot, 0);
        if (item.type === 'cabinet') {
          item.mesh.userData.bodyMesh.material = cabinetSideMat;
        } else if (item.type === 'plant') {
          item.mesh.userData.leafMat.color.setHex(0x4c7a3e);
        } else if (item.type === 'bookshelf') {
          // หนังสือกลับสภาพและตำแหน่งเดิมเป๊ะ (เก็บตำแหน่งตั้งต้นไว้ตอนสร้างในตอน makeBookshelf)
          for (const book of item.mesh.userData.bookGroup.children) {
            book.position.copy(book.userData.basePos);
            book.rotation.set(0, 0, 0);
          }
        } else if (item.type === 'printer') {
          item.mesh.userData.ledMat.color.setHex(0x22ff44);
        } else if (item.type === 'watercooler') {
          item.mesh.userData.bottleMat.color.setHex(0x8fc7e8);
          item.mesh.userData.bottleMat.opacity = 0.75;
        } else if (item.type === 'server') {
          item.mesh.userData.panelMat.color.setHex(0xffffff);
        } else if (item.type === 'whiteboard') {
          item.mesh.userData.boardMesh.material = whiteboardMat;
        }
      }
      for (const m of anomalyMeshes) scene.remove(m);
      anomalyMeshes = [];
    }

    // โต๊ะทำงานของผู้เล่นเองในห้องเริ่มต้น จัดตายตัว (ไม่สุ่มเหมือนโต๊ะอื่นในแมพ)
    // ให้ฟีลว่า "พึ่งลุกจากโต๊ะไปเมื่อกี้" — เก้าอี้ถูกดันออกเอียงๆ ไม่เก็บเข้าที่ ไม่ใช่วางเป๊ะแบบโต๊ะทั่วไป
    function placeSpawnDesk() {
      const deskPos = new THREE.Vector3(9.0, 0, 9.0); // ศูนย์กลางห้องเริ่มต้น (แถว/คอลัมน์ 2)
      const deskRot = Math.PI / 4; // เอียง 45 องศา หันหน้าเข้าหาจุดเกิดของผู้เล่น ไม่ใช่ขนานกำแพง

      const desk = makeDesk();
      desk.position.copy(deskPos);
      desk.rotation.y = deskRot;
      scene.add(desk);
      officeFurniture.push({ mesh: desk, type: 'desk', basePos: desk.position.clone(), baseRot: deskRot });

      // เก้าอี้ถูกดันออกจากโต๊ะและเอียง ไม่ได้เก็บตรงเป๊ะ เหมือนพึ่งลุกขึ้นอย่างรีบร้อน
      const chair = makeChair();
      const chairOffset = new THREE.Vector3(0, 0, 0.85).applyAxisAngle(new THREE.Vector3(0, 1, 0), deskRot);
      chair.position.set(deskPos.x + chairOffset.x, 0, deskPos.z + chairOffset.z);
      chair.rotation.y = deskRot + 0.5;
      scene.add(chair);
      officeFurniture.push({ mesh: chair, type: 'chair', basePos: chair.position.clone(), baseRot: deskRot + 0.5 });

      // แก้วกาแฟค้างอยู่บนโต๊ะ + กระดาษกองเล็กๆ ที่ทำค้างไว้
      const mugMat = new THREE.MeshLambertMaterial({ color: 0xdedede });
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 8), mugMat);
      const mugLocalOff = new THREE.Vector3(0.35, 0.79, 0.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), deskRot);
      mug.position.set(deskPos.x + mugLocalOff.x, mugLocalOff.y, deskPos.z + mugLocalOff.z);
      scene.add(mug);

      const paperMat = new THREE.MeshLambertMaterial({ color: 0xf2f0e8 });
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.3), paperMat);
      const paperLocalOff = new THREE.Vector3(-0.25, 0.775, 0.12).applyAxisAngle(new THREE.Vector3(0, 1, 0), deskRot);
      paper.position.set(deskPos.x + paperLocalOff.x, paperLocalOff.y, deskPos.z + paperLocalOff.z);
      paper.rotation.y = deskRot + 0.3;
      scene.add(paper);

      // ตู้เอกสารเล็กๆ ริมมุมห้อง ให้ห้องดูสมบูรณ์แบบพื้นที่ทำงานจริง ไม่ใช่มีแค่โต๊ะตัวเดียวลอยๆ
      const cabinet = makeFilingCabinet();
      cabinet.position.set(4.5, 0, 12.6);
      cabinet.rotation.y = Math.PI / 2;
      scene.add(cabinet);
      officeFurniture.push({ mesh: cabinet, type: 'cabinet', basePos: cabinet.position.clone(), baseRot: Math.PI / 2 });
    }

