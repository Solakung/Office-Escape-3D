    // -------------------------------------------------------------
    // 4. สร้าง 3D Rig มอนสเตอร์ (Realistic Horror / Silent Hill f Aesthetic)
    // -------------------------------------------------------------

    // Helper: สร้างฟันหรือหนามกระดูก
    function createBoneSpike(length, radius, color) {
      const geo = new THREE.ConeGeometry(radius, length, 5);
      const mat = new THREE.MeshStandardMaterial({
        color: color || 0xd5cca8,
        roughness: 0.65,
        metalness: 0.1
      });
      return new THREE.Mesh(geo, mat);
    }

    // Helper: สร้างเส้นเอ็น/รากประสาท/เส้นเลือดที่ห้อยระโยงระยาง
    function createVisceralTendril(length, radius, color, segments) {
      const g = new THREE.Group();
      const segs = segments || 4;
      const segLen = length / segs;
      const mat = new THREE.MeshStandardMaterial({
        color: color || 0x4a1818,
        roughness: 0.35, // มีความฉ่ำเมือก
        metalness: 0.05
      });
      for (let i = 0; i < segs; i++) {
        const segGeo = new THREE.CylinderGeometry(radius * (1 - i * 0.15), radius * (1 - (i + 1) * 0.15), segLen, 5);
        deformFleshGeo(segGeo, 0.25);
        const segMesh = new THREE.Mesh(segGeo, mat);
        segMesh.position.y = -segLen * (i + 0.5);
        segMesh.rotation.z = (Math.random() - 0.5) * 0.3;
        segMesh.rotation.x = (Math.random() - 0.5) * 0.3;
        g.add(segMesh);
      }
      return g;
    }

    // ผิวสัมผัส The Bacteria (Kane Pixels Lifeform / Entity 3):
    // กลุ่มก้อนสายเคเบิลดำบิดเกลียว คราบน้ำมันดินเหนียวข้น และเหล็กเส้นขึ้นสนิมเขรอะ
    function genBacteriaSkinTex() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');

      // สีฐาน: สายไฟยางสีดำด้านอมเทาเข้ม
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, 512, 512);

      // เส้นสายเคเบิลสีดำและสายไฟฉนวนถักแน่นขนัด
      ctx.strokeStyle = '#18181c';
      ctx.lineWidth = 4.0;
      for (let i = 0; i < 70; i++) {
        let x = Math.random() * 512, y = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
          x += (Math.random() - 0.5) * 45;
          y += (Math.random() - 0.5) * 45;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // สายลวดทองแดงเปลือยและสายสื่อสารเส้นเล็กพันระโยงระยาง
      ctx.strokeStyle = 'rgba(45, 38, 28, 0.6)';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 90; i++) {
        let x = Math.random() * 512, y = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let j = 0; j < 4; j++) {
          x += (Math.random() - 0.5) * 35;
          y += (Math.random() - 0.5) * 35;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // คราบน้ำมันดินดำมะเกลือและสนิมเหล็กเขรอะ
      for (let i = 0; i < 150; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, r = 3 + Math.random() * 16;
        ctx.fillStyle = Math.random() < 0.7 ? 'rgba(5, 5, 5, 0.7)' : 'rgba(38, 26, 14, 0.45)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }

      addCanvasNoise(ctx, 512, 512, 0.25, 0.12, true);

      return new THREE.CanvasTexture(c);
    }

    // ผิวหนัง The Duller: ศพแห้งแตกระแหง สีเทาซีดอมม่วงช้ำ มีรอยแผลเป็นและกระดูกทะลุผิว
    function genDullerSkinTex() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#2d2e2b';
      ctx.fillRect(0, 0, 512, 512);

      // รอยช้ำใต้ผิวหนัง (Livor mortis) สีม่วงอมเลือด
      for (let i = 0; i < 220; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, r = 5 + Math.random() * 25;
        ctx.fillStyle = Math.random() < 0.5 ? 'rgba(55, 35, 48, 0.4)' : 'rgba(18, 20, 18, 0.45)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }

      // ลายหนังแห้งแตกระแหงเหมือนดินแห้งแตกลายงา
      ctx.strokeStyle = 'rgba(12, 10, 10, 0.65)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 110; i++) {
        let x = Math.random() * 512, y = Math.random() * 512;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
          x += (Math.random() - 0.5) * 25;
          y += (Math.random() - 0.5) * 25;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // รอยเย็บแผลศพ (Autopsy stitches)
      ctx.strokeStyle = 'rgba(180, 160, 130, 0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
        const sx = 50 + Math.random() * 412, sy = 50 + Math.random() * 412;
        ctx.beginPath();
        ctx.moveTo(sx - 10, sy - 5); ctx.lineTo(sx + 10, sy + 5);
        ctx.stroke();
      }

      addCanvasNoise(ctx, 512, 512, 0.35, 0.18, true);

      return new THREE.CanvasTexture(c);
    }

    // ทำให้ทรงเรขาคณิตมีมวลเนื้อไม่เรียบ บวมเป่ง ย่น หรือฉีกขาด
    function deformFleshGeo(geo, amp) {
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const noise = Math.sin(v.x * 7.0) * Math.cos(v.y * 5.0) * Math.sin(v.z * 6.0);
        const bump = 1 + noise * amp + (Math.random() - 0.5) * amp * 0.6;
        v.multiplyScalar(bump);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
    }

    // สร้าง The Bacteria (Kane Pixels Lifeform / Entity 3):
    // ร่างสูงโย่งผิดธรรมชาติ (2.8m) ก่อกำเนิดจากสายไฟ สายสื่อสารสีดำขดเกลียว และเหล็กเส้นดัดงอ
    // ไร้ดวงตา ไร้เนื้อหนัง มีเพียงโพรงดำสนิทของปากฉีกกว้างและระยางค์สายเคเบิลสะบัดกระตุก
    function createBacteria3DRig() {
      const rig = new THREE.Group();
      const bacteriaSkinTex = genBacteriaSkinTex();
      const wireMat = new THREE.MeshStandardMaterial({
        map: bacteriaSkinTex,
        color: 0x141416,
        roughness: 0.82,
        metalness: 0.28
      });
      const rebarMat = new THREE.MeshStandardMaterial({
        color: 0x3a3228,
        roughness: 0.9,
        metalness: 0.4
      });

      // ลำตัวและกระดูกสันหลังสายเคเบิลขดหนาทึบ โค้งงอผิดธรรมชาติ
      bacteriaTorso = new THREE.Group();
      const spineGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.6, 9, 8);
      deformFleshGeo(spineGeo, 0.22);
      const spine = new THREE.Mesh(spineGeo, wireMat);
      bacteriaTorso.add(spine);
      spine.position.y = 0.8;
      spine.castShadow = true;

      // มัดสายเคเบิลสีดำบิดเกลียวพันรอบแนวกระดูกสันหลัง (Twisted Cable Bundles)
      for (let c = 0; c < 12; c++) {
        const cableGeo = new THREE.TorusGeometry(0.18 + (c % 3) * 0.04, 0.024, 6, 12, Math.PI * 1.6);
        const cable = new THREE.Mesh(cableGeo, wireMat);
        cable.position.set(0, 0.25 + c * 0.11, 0);
        cable.rotation.x = Math.PI * 0.4 + (c * 0.2);
        cable.rotation.y = c * 0.8;
        cable.rotation.z = (Math.random() - 0.5) * 0.4;
        bacteriaTorso.add(cable);
      }

      // เหล็กเส้นดัดคดงอโผล่ออกมาจากแผ่นหลังและไหล่ (Protruding Bent Industrial Rebar)
      for (let i = 0; i < 7; i++) {
        const side = (i % 2 === 0) ? 1 : -1;
        const rebarH = 0.4 + Math.random() * 0.35;
        const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, rebarH, 5), rebarMat);
        rebar.position.set(side * (0.12 + Math.random() * 0.1), 0.7 + i * 0.14, -0.12 - Math.random() * 0.1);
        rebar.rotation.z = side * (0.6 + Math.random() * 0.4);
        rebar.rotation.x = -0.4 - Math.random() * 0.3;
        bacteriaTorso.add(rebar);
      }

      // หัวสายเคเบิลมัดกลมบิดเบี้ยว ไร้ตา (Faceless Tangled Cable Mass Head)
      const headGeo = new THREE.SphereGeometry(0.26, 12, 12);
      deformFleshGeo(headGeo, 0.26);
      const head = new THREE.Mesh(headGeo, wireMat);
      head.scale.set(0.85, 1.3, 1.0);
      head.position.set(0, 1.62, 0.08);
      head.castShadow = true;
      bacteriaTorso.add(head);

      // โพรงปากดำสนิท ฉีกแหว่งตั้งแต่ใต้คางขึ้นมาถึงกลางใบหน้า (Gaping Abyssal Wire Maw)
      const mouthVoid = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.16, 0.12),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      mouthVoid.position.set(0, 1.5, 0.24);
      mouthVoid.rotation.x = 0.15;
      bacteriaTorso.add(mouthVoid);
      bacteriaJawMesh = mouthVoid;

      // ระยางค์ลวดและสายไฟแหลมคมแทงประสานกันในโพรงปาก
      for (let t = -4; t <= 4; t++) {
        const wireTeeth = new THREE.Mesh(
          new THREE.ConeGeometry(0.016, 0.11, 4),
          rebarMat
        );
        wireTeeth.position.set(t * 0.026, 1.53, 0.27);
        wireTeeth.rotation.x = Math.PI * 0.85;
        bacteriaTorso.add(wireTeeth);
      }

      // เส้นสายไฟหนวดฝอยสะบัดรอบส่วนหัว (Twitching Sensory Wire Tendrils)
      for (let w = 0; w < 6; w++) {
        const tendril = new THREE.Mesh(
          new THREE.CylinderGeometry(0.009, 0.005, 0.35, 4),
          wireMat
        );
        tendril.position.set((Math.random() - 0.5) * 0.28, 1.7 + Math.random() * 0.15, 0.1);
        tendril.rotation.z = (Math.random() - 0.5) * 1.2;
        tendril.rotation.x = (Math.random() - 0.5) * 0.8;
        bacteriaTorso.add(tendril);
      }

      bacteriaFaceAnchor = new THREE.Object3D();
      bacteriaFaceAnchor.position.set(0, 1.55, 0.26);
      bacteriaTorso.add(bacteriaFaceAnchor);

      rig.add(bacteriaTorso);
      bacteriaTorso.position.y = 1.35;

      // แขนสายเคเบิลเรียวยาวผิดมนุษย์ ทิ้งดิ่งลงใกล้พื้นพร้อมกรงเล็บสายไฟแหลมคม
      const armUpperGeo = new THREE.CylinderGeometry(0.045, 0.035, 0.95, 6, 5);
      deformFleshGeo(armUpperGeo, 0.18);
      const armLowerGeo = new THREE.CylinderGeometry(0.035, 0.02, 1.15, 6, 5);
      deformFleshGeo(armLowerGeo, 0.18);

      // แขนซ้าย
      bacteriaLeftArm = new THREE.Group();
      const lUpper = new THREE.Mesh(armUpperGeo, wireMat);
      lUpper.position.y = -0.47;
      bacteriaLeftArm.add(lUpper);

      const lElbow = new THREE.Group();
      lElbow.position.y = -0.95;
      lElbow.rotation.x = 0.25;
      bacteriaLeftArm.add(lElbow);

      const lLower = new THREE.Mesh(armLowerGeo, wireMat);
      lLower.position.y = -0.55;
      lElbow.add(lLower);

      // กรงเล็บสายไฟเหล็กแหลม 4 แฉก
      for (let f = -1.5; f <= 1.5; f += 1.0) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.32, 4), wireMat);
        claw.position.set(f * 0.03, -1.15, 0.02);
        claw.rotation.x = Math.PI * 0.85;
        claw.rotation.z = f * 0.18;
        lElbow.add(claw);
      }

      bacteriaLeftArm.position.set(-0.35, 1.45, 0);
      bacteriaTorso.add(bacteriaLeftArm);

      // แขนขวา
      bacteriaRightArm = new THREE.Group();
      const rUpper = new THREE.Mesh(armUpperGeo.clone(), wireMat);
      rUpper.position.y = -0.47;
      bacteriaRightArm.add(rUpper);

      const rElbow = new THREE.Group();
      rElbow.position.y = -0.95;
      rElbow.rotation.x = 0.25;
      bacteriaRightArm.add(rElbow);

      const rLower = new THREE.Mesh(armLowerGeo.clone(), wireMat);
      rLower.position.y = -0.55;
      rElbow.add(rLower);

      for (let f = -1.5; f <= 1.5; f += 1.0) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.32, 4), wireMat);
        claw.position.set(f * 0.03, -1.15, 0.02);
        claw.rotation.x = Math.PI * 0.85;
        claw.rotation.z = f * 0.18;
        rElbow.add(claw);
      }

      bacteriaRightArm.position.set(0.35, 1.45, 0);
      bacteriaTorso.add(bacteriaRightArm);

      // ขายาวผอมเก้งก้าง (Height ~2.8m)
      const legGeo = new THREE.CylinderGeometry(0.055, 0.032, 1.7, 6, 6);
      deformFleshGeo(legGeo, 0.15);

      bacteriaLeftLeg = new THREE.Group();
      const lLegMesh = new THREE.Mesh(legGeo, wireMat);
      lLegMesh.position.y = -0.85;
      bacteriaLeftLeg.add(lLegMesh);
      bacteriaLeftLeg.position.set(-0.2, 1.45, 0);
      rig.add(bacteriaLeftLeg);

      bacteriaRightLeg = new THREE.Group();
      const rLegMesh = new THREE.Mesh(legGeo.clone(), wireMat);
      rLegMesh.position.y = -0.85;
      bacteriaRightLeg.add(rLegMesh);
      bacteriaRightLeg.position.set(0.2, 1.45, 0);
      rig.add(bacteriaRightLeg);

      // แสงสะท้อนสลัวนีออนเหลืองซีดจากตัว (Flickering Backrooms Fluorescent Ambient Reflection)
      bacteriaLight = new THREE.PointLight(0xd9cc88, 0.65, 8, 2);
      bacteriaLight.position.set(0, 1.7, 0.2);
      rig.add(bacteriaLight);

      return rig;
    }

    // สร้าง The Duller: ซากศพมนุษย์ที่ถูกหักกระดูกกลับด้านคลาน 4 ขาแบบแมงมุม
    // (Arachnid Reverse-Human Crawler) สไตล์ Silent Hill
    function createDuller3DRig() {
      const rig = new THREE.Group();
      const dullerSkinTex = genDullerSkinTex();
      const dullMat = new THREE.MeshStandardMaterial({
        map: dullerSkinTex,
        color: 0x8a8a80,
        roughness: 0.9,
        metalness: 0.05
      });
      const boneMat = new THREE.MeshStandardMaterial({
        color: 0xded5be,
        roughness: 0.6
      });

      // ลำตัวโค้งแอ่นกลับหลังผิดธรรมชาติ
      const torsoGeo = new THREE.CylinderGeometry(0.24, 0.3, 1.45, 8, 7);
      deformFleshGeo(torsoGeo, 0.2);
      dullerTorso = new THREE.Mesh(torsoGeo, dullMat);
      dullerTorso.rotation.x = Math.PI / 2;
      dullerTorso.position.y = 0.58;
      dullerTorso.castShadow = true;
      rig.add(dullerTorso);

      // สันหลังที่กระดูกสันหลังแทงทะลุผิวหนังออกมาเป็นหนามแหลม (Exposed vertebral spurs)
      for (let s = 0; s < 7; s++) {
        const spineSpike = createBoneSpike(0.18 + Math.sin(s * 0.5) * 0.08, 0.028, 0xe2dcbe);
        spineSpike.position.set(0, 0.68 + Math.sin(s * 0.4) * 0.05, -0.55 + s * 0.18);
        spineSpike.rotation.x = -0.3;
        rig.add(spineSpike);
      }

      // ศีรษะก้มต่ำยื่นมาข้างหน้า (The Hound / Entity 9 Quadrupedal Stalker)
      const headGeo = new THREE.SphereGeometry(0.24, 10, 10);
      deformFleshGeo(headGeo, 0.2);
      const head = new THREE.Mesh(headGeo, dullMat);
      head.position.set(0, 0.52, 0.92);
      head.rotation.x = -0.25;
      head.castShadow = true;
      rig.add(head);

      // เส้นผมสีดำเหนียวเปียกชุ่ม ห้อยระโยงระยางคลุมใบหน้า (Long Matted Greasy Black Hair)
      const hairMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
      for (let h = 0; h < 24; h++) {
        const hairStrand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.003, 0.45 + Math.random() * 0.25, 4),
          hairMat
        );
        hairStrand.position.set(
          (Math.random() - 0.5) * 0.28,
          0.58 - Math.random() * 0.15,
          0.98 + Math.random() * 0.12
        );
        hairStrand.rotation.x = 0.2 + (Math.random() - 0.5) * 0.3;
        hairStrand.rotation.z = (Math.random() - 0.5) * 0.4;
        rig.add(hairStrand);
      }

      // ดวงตาสีขาวเรืองแสงเล็กเป็นจุดเข็ม ลอดผ่านม่านผมสีดำ (Pinprick Glowing White Eyes)
      const dullEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), dullEyeMat);
      lEye.position.set(-0.08, 0.54, 1.08);
      rig.add(lEye);
      const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), dullEyeMat);
      rEye.position.set(0.08, 0.54, 1.08);
      rig.add(rEye);

      // ปากอ้าค้างกว้าง ขากรรไกรหลุดห้อย มีฟันเข็มแหลมคม
      const dullMouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      dullerJawMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), dullMouthMat);
      dullerJawMesh.scale.set(1.4, 0.7, 0.6);
      dullerJawMesh.position.set(0, 0.42, 1.05);
      rig.add(dullerJawMesh);

      for (let t = -4; t <= 4; t++) {
        const tooth = createBoneSpike(0.09, 0.015, 0xe2d8be);
        tooth.position.set(t * 0.028, 0.44, 1.12);
        tooth.rotation.x = Math.PI * 0.8;
        rig.add(tooth);
      }

      dullerFaceAnchor = new THREE.Object3D();
      dullerFaceAnchor.position.set(0, 0.52, 1.08);
      rig.add(dullerFaceAnchor);

      // 4 ขาคลานข้อพับแมงมุมหักงอ
      dullerLegs = [];
      const legOffsets = [
        [-0.32, 0.48, 0.5], [0.32, 0.48, 0.5],
        [-0.32, 0.48, -0.5], [0.32, 0.48, -0.5]
      ];

      for (let i = 0; i < 4; i++) {
        const sideSign = legOffsets[i][0] < 0 ? -1 : 1;
        const legGroup = new THREE.Group();

        // ต้นขา
        const thighGeo = new THREE.CylinderGeometry(0.055, 0.038, 0.65, 6, 5);
        deformFleshGeo(thighGeo, 0.18);
        const thighPivot = new THREE.Group();
        thighPivot.rotation.z = sideSign * 0.6;
        const thighMesh = new THREE.Mesh(thighGeo, dullMat);
        thighMesh.position.y = -0.32;
        thighPivot.add(thighMesh);
        legGroup.add(thighPivot);

        // หัวเข่าหักกลับด้าน
        const kneeJoint = new THREE.Group();
        kneeJoint.position.y = -0.65;
        thighPivot.add(kneeJoint);

        const shinPivot = new THREE.Group();
        shinPivot.rotation.z = -sideSign * 1.15;
        kneeJoint.add(shinPivot);

        // หน้าแข้ง
        const shinGeo = new THREE.CylinderGeometry(0.035, 0.015, 0.75, 6, 5);
        deformFleshGeo(shinGeo, 0.22);
        const shinMesh = new THREE.Mesh(shinGeo, dullMat);
        shinMesh.position.y = -0.38;
        shinPivot.add(shinMesh);

        // ปลายขาเป็นเดือยกระดูกแหลมคมขูดพื้น
        const claw = createBoneSpike(0.22, 0.02, 0x222220);
        claw.position.y = -0.78;
        claw.rotation.x = Math.PI;
        shinPivot.add(claw);

        legGroup.position.set(legOffsets[i][0], legOffsets[i][1], legOffsets[i][2]);
        rig.add(legGroup);
        dullerLegs.push(legGroup);
      }

      dullerLight = new THREE.PointLight(0xcac08a, 0.65, 7, 2);
      dullerLight.position.y = 0.65;
      rig.add(dullerLight);

      return rig;
    }

    // ผิวสัมผัสเงาดำ The Smiler (Backrooms Entity 3):
    // มวลความมืดมิดมีชีวิต ควันดำหมุนวนดูดกลืนแสง
    function genSmilerShadowTex() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');

      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, 512, 512);

      // ม่านหมอกเงาดำเข้ม
      for (let i = 0; i < 90; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, r = 20 + Math.random() * 60;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(15, 15, 18, 0.8)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }

      addCanvasNoise(ctx, 512, 512, 0.15, 0.08, true);

      return new THREE.CanvasTexture(c);
    }

    // สร้าง The Smiler (Entity 3):
    // มวลเงาดำสนิทลอยได้ในความมืด จุดเด่นอันเป็นเอกลักษณ์สูงสุดของ Backrooms:
    // "ดวงตาสีขาวเรืองแสง 2 ดวงที่ไร้การกะพริบ และรอยยิ้มฉีกกว้างเรืองแสงขาวสว่างวาบพร้อมฟันเข็มแหลมคมนับร้อยซี่"
    function createSmiler3DRig() {
      const rig = new THREE.Group();
      const shadowTex = genSmilerShadowTex();

      const shadowMat = new THREE.MeshStandardMaterial({
        map: shadowTex,
        color: 0x060608,
        roughness: 0.95,
        metalness: 0.05
      });
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const darkVoidMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

      // กลุ่มหัวและมวลเงามืด
      const headGroup = new THREE.Group();
      const shadowHeadGeo = new THREE.SphereGeometry(0.82, 16, 16);
      deformFleshGeo(shadowHeadGeo, 0.22);
      const shadowHead = new THREE.Mesh(shadowHeadGeo, shadowMat);
      shadowHead.scale.set(1.05, 1.25, 0.95);
      shadowHead.castShadow = true;
      headGroup.add(shadowHead);

      // ระยางค์เงาดำห้อยย้อยลงสู่พื้น (Shadow Tendrils)
      const spineStalk = new THREE.Group();
      for (let v = 0; v < 7; v++) {
        const tendrilGeo = new THREE.CylinderGeometry(0.04 - v * 0.004, 0.01, 0.7 + Math.random() * 0.4, 5);
        deformFleshGeo(tendrilGeo, 0.2);
        const tendril = new THREE.Mesh(tendrilGeo, shadowMat);
        tendril.position.set(
          (Math.random() - 0.5) * 0.5,
          -0.7 - v * 0.22,
          (Math.random() - 0.5) * 0.4
        );
        tendril.rotation.z = (Math.random() - 0.5) * 0.3;
        spineStalk.add(tendril);
      }
      headGroup.add(spineStalk);
      smilerStalkMesh = spineStalk;

      // โพรงหน้ามืดสนิทรอบรอยยิ้มและดวงตา
      const faceRecess = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 12, 12),
        darkVoidMat
      );
      faceRecess.scale.set(1.1, 0.8, 0.5);
      faceRecess.position.set(0, 0.08, 0.62);
      headGroup.add(faceRecess);

      // ดวงตาสีขาวกลมโตเรืองแสงสว่างจ้า 2 ดวง (Glowing Piercing White Eyes)
      const eyeGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const lEye = new THREE.Mesh(eyeGeo, glowMat);
      lEye.position.set(-0.32, 0.32, 0.78);
      headGroup.add(lEye);

      const rEye = new THREE.Mesh(eyeGeo, glowMat);
      rEye.position.set(0.32, 0.32, 0.78);
      headGroup.add(rEye);

      // จุดยึดมุมมองหน้า
      smilerFaceAnchor = new THREE.Object3D();
      smilerFaceAnchor.position.set(0, 0.05, 0.88);
      headGroup.add(smilerFaceAnchor);

      // รอยยิ้มฉีกกว้างโค้งขึ้น (The Iconic Glowing Razor Grin)
      // ฟันเข็มสีขาวเรืองแสงแถวบน เรียงรายโค้งเป็นรูปพระจันทร์เสี้ยว
      const upperTeethGroup = new THREE.Group();
      for (let i = -10; i <= 10; i++) {
        const curveOffset = Math.sin((i / 10) * (Math.PI / 2)) * 0.12;
        const toothLen = 0.16 + (1 - Math.abs(i) / 10) * 0.08 + Math.random() * 0.03;
        const tooth = new THREE.Mesh(
          new THREE.ConeGeometry(0.024, toothLen, 4),
          glowMat
        );
        tooth.position.set(i * 0.058, 0.02 + curveOffset, 0.82 - Math.abs(i) * 0.025);
        tooth.rotation.x = Math.PI * 0.95;
        tooth.rotation.z = -(i / 10) * 0.3;
        upperTeethGroup.add(tooth);
      }
      headGroup.add(upperTeethGroup);

      rig.add(headGroup);

      // ขากรรไกรล่างพร้อมฟันเข็มสีขาวเรืองแสง (Dislocating Lower Grin)
      smilerJawMesh = new THREE.Group();
      for (let i = -10; i <= 10; i++) {
        const curveOffset = Math.sin((i / 10) * (Math.PI / 2)) * 0.12;
        const toothLen = 0.16 + (1 - Math.abs(i) / 10) * 0.08 + Math.random() * 0.03;
        const tooth = new THREE.Mesh(
          new THREE.ConeGeometry(0.024, toothLen, 4),
          glowMat
        );
        tooth.position.set(i * 0.056, -0.06 - curveOffset, 0.82 - Math.abs(i) * 0.025);
        tooth.rotation.x = 0.05;
        tooth.rotation.z = (i / 10) * 0.3;
        smilerJawMesh.add(tooth);
      }

      smilerJawMesh.position.y = -0.12;
      rig.add(smilerJawMesh);

      // แสงเรืองแสงสีขาวเยือกเย็นส่องสว่างจากใบหน้า (Cold Phosphorescent White Smiler Glow)
      smilerLight = new THREE.PointLight(0xffffff, 2.6, 9, 2);
      smilerLight.position.set(0, 0.1, 0.8);
      rig.add(smilerLight);

      rig.position.y = 1.5;
      return rig;
    }

    // ผิวหนัง The Acid Man: ร่างมนุษย์ทำงานที่ถูกกรดเคมีกัดจนสูทหลอมละลายติดเนื้อ
    // ผิวหนังพุพองเป็นหนองสีเขียวและรอยไหม้เกรียมสีดำ
    function genAcidManSkinTex() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');

      // สีฐาน: ผ้าสูทออฟฟิศสีเทาไหม้ผสมเนื้อเปื่อย
      ctx.fillStyle = '#3a4220';
      ctx.fillRect(0, 0, 512, 512);

      // คราบกรดสารเคมีสีเขียวสว่าง
      for (let i = 0; i < 260; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, r = 4 + Math.random() * 20;
        ctx.fillStyle = Math.random() < 0.5 ? 'rgba(140, 185, 30, 0.4)' : 'rgba(25, 35, 10, 0.5)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }

      // แผลพุพองเป็นฟองอากาศกรดเดือด (Boiling Acid Cysts)
      for (let i = 0; i < 110; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, r = 3 + Math.random() * 9;
        const g = ctx.createRadialGradient(x, y, 1, x, y, r);
        g.addColorStop(0, 'rgba(220, 255, 90, 0.85)');
        g.addColorStop(0.6, 'rgba(140, 190, 35, 0.45)');
        g.addColorStop(1, 'rgba(140, 190, 35, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }

      // รอยเนื้อไหม้เกรียมดำสนิท
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, r = 6 + Math.random() * 16;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(8, 7, 4, 0.8)');
        g.addColorStop(1, 'rgba(8, 7, 4, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }

      addCanvasNoise(ctx, 512, 512, 0.3, 0.16, true);

      return new THREE.CanvasTexture(c);
    }

    // สร้าง The Acid Man: พนักงานออฟฟิศที่ละลายกลายเป็นสิ่งมีชีวิตกรดพิษ
    function createAcidMan3DRig() {
      const rig = new THREE.Group();
      const acidSkinTex = genAcidManSkinTex();
      const bodyMat = new THREE.MeshStandardMaterial({
        map: acidSkinTex,
        color: 0x768532,
        roughness: 0.75, // ฉ่ำกรด
        metalness: 0.05
      });
      const darkSuitMat = new THREE.MeshStandardMaterial({
        color: 0x22261e,
        roughness: 0.95
      });

      // ลำตัวค่อมหนา มีเศษปกเสื้อสูทที่ถูกกรดละลายติดกับกระดูก
      acidManTorso = new THREE.Group();
      const torsoGeo = new THREE.CylinderGeometry(0.28, 0.36, 1.15, 8, 7);
      deformFleshGeo(torsoGeo, 0.2);
      const torso = new THREE.Mesh(torsoGeo, bodyMat);
      torso.position.y = 0.58;
      torso.rotation.x = 0.22; // หลังค่อม
      torso.castShadow = true;
      acidManTorso.add(torso);

      // เศษปกเสื้อสูทที่ละลาย
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.06, 6, 8), darkSuitMat);
      collar.position.set(0, 1.05, 0.08);
      collar.rotation.x = Math.PI * 0.45;
      acidManTorso.add(collar);

      // หัวจมคอ ครึ่งหน้าละลายเห็นขากรรไกรกะโหลก
      const headGeo = new THREE.SphereGeometry(0.26, 11, 11);
      deformFleshGeo(headGeo, 0.22);
      const head = new THREE.Mesh(headGeo, bodyMat);
      head.position.set(0, 1.12, 0.16);
      head.rotation.x = 0.25;
      head.castShadow = true;
      acidManTorso.add(head);

      // ตาเรืองแสงเขียวพิษ
      const eyeGeo = new THREE.SphereGeometry(0.065, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x98ff22 });
      const lEye = new THREE.Mesh(eyeGeo, eyeMat);
      lEye.position.set(-0.1, 1.15, 0.35);
      acidManTorso.add(lEye);

      const rEye = new THREE.Mesh(eyeGeo, eyeMat);
      rEye.position.set(0.1, 1.16, 0.36);
      acidManTorso.add(rEye);

      // ปากแหว่งและถัง/ซีสต์กรดที่ขากรรไกร
      const jawMat = new THREE.MeshBasicMaterial({ color: 0x0c1500 });
      acidManJawMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.07), jawMat);
      acidManJawMesh.position.set(0, 1.02, 0.37);
      acidManTorso.add(acidManJawMesh);

      acidManFaceAnchor = new THREE.Object3D();
      acidManFaceAnchor.position.set(0, 1.1, 0.36);
      acidManTorso.add(acidManFaceAnchor);

      rig.add(acidManTorso);
      acidManTorso.position.y = 0.95;

      // แขนซ้าย: เรียวยาวผิดส่วน ปลายนิ้วละลายติดกัน
      const armGeo = new THREE.CylinderGeometry(0.07, 0.05, 0.9, 6, 6);
      deformFleshGeo(armGeo, 0.18);

      acidManLeftArm = new THREE.Group();
      const lArmMesh = new THREE.Mesh(armGeo, bodyMat);
      lArmMesh.position.y = -0.45;
      acidManLeftArm.add(lArmMesh);
      acidManLeftArm.position.set(-0.35, 1.55, 0.05);
      rig.add(acidManLeftArm);

      // แขนขวา: บวมพองยักษ์เป็นถุงซีสต์เก็บกรดพิษ (Engorged Pulsating Acid Cyst Arm)
      acidManRightArm = new THREE.Group();
      const rArmMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.95, 8, 6),
        bodyMat
      );
      rArmMesh.position.y = -0.45;
      acidManRightArm.add(rArmMesh);

      // ก้อนหนองกรดเรืองแสงที่มือขวา
      const acidPouch = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x8ae618, roughness: 0.3, emissive: 0x488008 })
      );
      acidPouch.position.y = -0.92;
      acidManRightArm.add(acidPouch);

      acidManRightArm.position.set(0.38, 1.55, 0.05);
      rig.add(acidManRightArm);

      // ขาสั้นหนา
      const legGeo = new THREE.CylinderGeometry(0.095, 0.075, 0.9, 6, 6);
      deformFleshGeo(legGeo, 0.16);

      acidManLeftLeg = new THREE.Group();
      const lLegMesh = new THREE.Mesh(legGeo, bodyMat);
      lLegMesh.position.y = -0.45;
      acidManLeftLeg.add(lLegMesh);
      acidManLeftLeg.position.set(-0.18, 0.85, 0);
      rig.add(acidManLeftLeg);

      acidManRightLeg = new THREE.Group();
      const rLegMesh = new THREE.Mesh(legGeo.clone(), bodyMat);
      rLegMesh.position.y = -0.45;
      acidManRightLeg.add(rLegMesh);
      acidManRightLeg.position.set(0.18, 0.85, 0);
      rig.add(acidManRightLeg);

      // แสงสีเขียวพิษ
      acidManLight = new THREE.PointLight(0x86e612, 1.25, 8, 2);
      acidManLight.position.set(0, 1.2, 0.3);
      rig.add(acidManLight);

      return rig;
    }

    // ผิวหนัง The Gapped: ร่างความมืดมิดที่มีรอยแยกมิติสีม่วงอัลตราไวโอเลต
    function genGappedSkinTex() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#08060f';
      ctx.fillRect(0, 0, 512, 512);

      // รอยแตกร้าวสายฟ้าสีม่วง-ครามลามทั่วร่าง
      ctx.strokeStyle = 'rgba(160, 95, 255, 0.65)';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 70; i++) {
        let x = Math.random() * 512, y = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let j = 0; j < 6; j++) {
          x += (Math.random() - 0.5) * 30;
          y += (Math.random() - 0.5) * 30;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      addCanvasNoise(ctx, 512, 512, 0.25, 0.15, true);

      return new THREE.CanvasTexture(c);
    }

    // พื้นผิวรอยแยกมิติกลางอก
    function genGapRiftTex() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 256, 256);

      const cx = 128, cy = 128;
      for (let i = 0; i < 35; i++) {
        const rad = 20 + i * 3.5;
        const g = ctx.createRadialGradient(cx, cy, rad - 5, cx, cy, rad + 5);
        g.addColorStop(0, 'rgba(120, 40, 220, 0)');
        g.addColorStop(0.5, 'rgba(180, 100, 255, 0.7)');
        g.addColorStop(1, 'rgba(120, 40, 220, 0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2.2; a += 0.1) {
          const r = rad + Math.sin(a * 4 + i) * 6;
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // แกนกลางดำสนิท
      ctx.fillStyle = '#000000';
      ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();

      return new THREE.CanvasTexture(c);
    }

    // สร้าง The Gapped: ร่างสูงเพรียวมืดสนิท หน้าอกแหวกออกเป็นกลีบดอกไม้สีดำ-ม่วง (Spider Lily Rupture)
    // พร้อมใจกลางมิติที่หมุนวนดูดกลืนแสง
    function createGapped3DRig() {
      const rig = new THREE.Group();
      const gappedSkinTex = genGappedSkinTex();
      const bodyMat = new THREE.MeshStandardMaterial({
        map: gappedSkinTex,
        color: 0x221c32,
        roughness: 0.95,
        metalness: 0.1
      });

      // ลำตัวผอมสูงชะลูด
      gappedTorso = new THREE.Group();
      const torsoGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.45, 8, 7);
      deformFleshGeo(torsoGeo, 0.14);
      const torso = new THREE.Mesh(torsoGeo, bodyMat);
      torso.position.y = 0.72;
      torso.castShadow = true;
      gappedTorso.add(torso);

      // กะโหลกศีรษะเรียวแหลม ไร้หน้า
      const headGeo = new THREE.SphereGeometry(0.2, 10, 10);
      deformFleshGeo(headGeo, 0.12);
      const head = new THREE.Mesh(headGeo, bodyMat);
      head.scale.set(0.8, 1.35, 0.85);
      head.position.set(0, 1.6, 0.05);
      head.castShadow = true;
      gappedTorso.add(head);

      // ตาสีม่วงอ่อนไร้ม่านตา
      const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc89eff });
      const lEye = new THREE.Mesh(eyeGeo, eyeMat);
      lEye.position.set(-0.07, 1.63, 0.22);
      gappedTorso.add(lEye);

      const rEye = new THREE.Mesh(eyeGeo, eyeMat);
      rEye.position.set(0.07, 1.63, 0.22);
      gappedTorso.add(rEye);

      // แผ่นปริภูมิและกระดูกอกที่ฉีกแหว่งออกจากกัน (Shattered Liminal Distortion Shards)
      for (let p = 0; p < 8; p++) {
        const shard = new THREE.Mesh(
          new THREE.ConeGeometry(0.04, 0.38, 3),
          new THREE.MeshStandardMaterial({ color: 0x1f182c, roughness: 0.8, metalness: 0.3 })
        );
        const ang = (p / 8) * Math.PI * 2;
        shard.position.set(Math.cos(ang) * 0.18, 1.05 + Math.sin(ang) * 0.18, 0.22);
        shard.rotation.z = ang - Math.PI / 2;
        shard.rotation.x = -0.45;
        gappedTorso.add(shard);
      }

      // รอยแยกมิติวังวนดำกลางอก
      const riftTex = genGapRiftTex();
      const riftMat = new THREE.MeshBasicMaterial({
        map: riftTex,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
      });
      const riftMesh = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), riftMat);
      riftMesh.position.set(0, 1.05, 0.24);
      gappedTorso.add(riftMesh);

      gappedVoidRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.025, 8, 30),
        new THREE.MeshBasicMaterial({ color: 0x9b54f5, transparent: true, opacity: 0.85 })
      );
      gappedVoidRing.position.set(0, 1.05, 0.24);
      gappedTorso.add(gappedVoidRing);

      gappedFaceAnchor = new THREE.Object3D();
      gappedFaceAnchor.position.set(0, 1.05, 0.24);
      gappedTorso.add(gappedFaceAnchor);

      rig.add(gappedTorso);
      gappedTorso.position.y = 1.0;

      // แขนยาวเก้งก้าง ปลายนิ้วเรียวแหลม
      const armGeo = new THREE.CylinderGeometry(0.04, 0.025, 1.3, 6, 6);
      deformFleshGeo(armGeo, 0.12);

      gappedLeftArm = new THREE.Group();
      const lArmMesh = new THREE.Mesh(armGeo, bodyMat);
      lArmMesh.position.y = -0.65;
      gappedLeftArm.add(lArmMesh);
      gappedLeftArm.position.set(-0.28, 1.7, 0);
      rig.add(gappedLeftArm);

      gappedRightArm = new THREE.Group();
      const rArmMesh = new THREE.Mesh(armGeo.clone(), bodyMat);
      rArmMesh.position.y = -0.65;
      gappedRightArm.add(rArmMesh);
      gappedRightArm.position.set(0.28, 1.7, 0);
      rig.add(gappedRightArm);

      // ขายาวผอม
      const legGeo = new THREE.CylinderGeometry(0.065, 0.04, 1.45, 6, 6);
      deformFleshGeo(legGeo, 0.12);

      gappedLeftLeg = new THREE.Group();
      const lLegMesh = new THREE.Mesh(legGeo, bodyMat);
      lLegMesh.position.y = -0.72;
      gappedLeftLeg.add(lLegMesh);
      gappedLeftLeg.position.set(-0.14, 1.4, 0);
      rig.add(gappedLeftLeg);

      gappedRightLeg = new THREE.Group();
      const rLegMesh = new THREE.Mesh(legGeo.clone(), bodyMat);
      rLegMesh.position.y = -0.72;
      gappedRightLeg.add(rLegMesh);
      gappedRightLeg.position.set(0.14, 1.4, 0);
      rig.add(gappedRightLeg);

      // แสงสีม่วงอัลตราไวโอเลต
      gappedLight = new THREE.PointLight(0xa555ff, 0.85, 8, 2);
      gappedLight.position.set(0, 1.05, 0.35);
      rig.add(gappedLight);

      return rig;
    }



