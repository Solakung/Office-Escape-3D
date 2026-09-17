    // -------------------------------------------------------------
    // 3. Textures (Realistic Horror & Silent Hill f / Backrooms Aesthetic)
    // -------------------------------------------------------------

    // Helper: สร้าง noise procedural บน canvas context
    function addCanvasNoise(ctx, width, height, density, alpha, isDark) {
      const idata = ctx.getImageData(0, 0, width, height);
      const data = idata.data;
      const count = Math.floor(width * height * density);
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * (width * height)) * 4;
        const v = isDark ? Math.floor(Math.random() * 50) : (200 + Math.floor(Math.random() * 55));
        data[idx] = (data[idx] * (1 - alpha) + v * alpha) | 0;
        data[idx + 1] = (data[idx + 1] * (1 - alpha) + v * alpha) | 0;
        data[idx + 2] = (data[idx + 2] * (1 - alpha) + v * alpha) | 0;
      }
      ctx.putImageData(idata, 0, 0);
    }

    // วอลเปเปอร์ Backrooms แท้ (Iconic Monoyellow Wallpaper of Level 0)
    // สีเหลืองมัสตาร์ดหม่น ลวดลายตารางเรขาคณิตวินเทจ รอยความชื้นซึม และกระดาษลอกร่อน
    function genAuthenticWallTex() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');

      // สีฐาน: วอลเปเปอร์เหลืองซีดมัสตาร์ดยุค 80s อันเป็นเอกลักษณ์ของ Backrooms
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#c7b56a');
      grad.addColorStop(0.3, '#beac5e');
      grad.addColorStop(0.7, '#b29f52');
      grad.addColorStop(1, '#9e8d44');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // ลวดลายเรขาคณิตวอลเปเปอร์โบราณแบบ Backrooms Level 0
      ctx.strokeStyle = 'rgba(130, 110, 40, 0.42)';
      ctx.lineWidth = 2.2;
      for (let y = 0; y < 512; y += 32) {
        for (let x = 0; x < 512; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x + 16, y);
          ctx.lineTo(x + 32, y + 16);
          ctx.lineTo(x + 16, y + 32);
          ctx.lineTo(x, y + 16);
          ctx.closePath();
          ctx.stroke();

          ctx.fillStyle = 'rgba(105, 90, 32, 0.28)';
          ctx.fillRect(x + 14, y + 14, 5, 5);
        }
      }

      // คราบน้ำและความชื้นเน่าเสียไหลย้อยจากเพดาน (Water damage seepage)
      for (let i = 0; i < 16; i++) {
        const sx = Math.random() * 512;
        const len = 90 + Math.random() * 320;
        const w = 14 + Math.random() * 26;
        const dripGrad = ctx.createLinearGradient(sx, 0, sx, len);
        dripGrad.addColorStop(0, 'rgba(55, 45, 18, 0.55)');
        dripGrad.addColorStop(0.4, 'rgba(75, 58, 22, 0.35)');
        dripGrad.addColorStop(0.9, 'rgba(95, 75, 28, 0.18)');
        dripGrad.addColorStop(1, 'rgba(95, 75, 28, 0)');
        ctx.fillStyle = dripGrad;
        ctx.beginPath();
        ctx.moveTo(sx - w / 2, 0);
        ctx.bezierCurveTo(sx - w / 3, len * 0.4, sx + w / 3, len * 0.7, sx, len);
        ctx.bezierCurveTo(sx - w / 4, len * 0.7, sx + w / 2, len * 0.4, sx + w / 2, 0);
        ctx.fill();
      }

      // รอยฉีกขาดของวอลเปเปอร์ เผยให้เห็นแผ่นยิปซัมซีดและคราบกาวเหลืองแห้งกรัง (Peeling Wallpaper)
      for (let i = 0; i < 6; i++) {
        const px = 40 + Math.random() * 430;
        const py = 60 + Math.random() * 380;
        const rad = 22 + Math.random() * 40;

        // เนื้อผนังยิปซัมสีเบจอมเทาข้างใน
        ctx.fillStyle = '#8a826d';
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();

        // คราบกาวและขอบกระดาษลอก
        ctx.strokeStyle = '#4e4325';
        ctx.lineWidth = 3;
        ctx.stroke();

        // คราบความชื้นรอบรอยลอก
        for (let s = 0; s < 12; s++) {
          const spx = px + (Math.random() - 0.5) * rad * 1.4;
          const spy = py + (Math.random() - 0.5) * rad * 1.4;
          ctx.fillStyle = 'rgba(60, 50, 20, 0.4)';
          ctx.beginPath();
          ctx.arc(spx, spy, 2 + Math.random() * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ไม้บัวล่างผนังสีน้ำตาลเข้มยุค 80s
      const baseH = 48;
      ctx.fillStyle = '#322212';
      ctx.fillRect(0, 512 - baseH, 512, baseH);
      ctx.fillStyle = '#1e140a';
      ctx.fillRect(0, 512 - baseH, 512, 5);
      ctx.fillRect(0, 512 - 6, 512, 6);

      // คราบความชื้นสะสมที่โคนบัวล่าง
      ctx.fillStyle = 'rgba(40, 32, 12, 0.45)';
      ctx.fillRect(0, 512 - baseH - 14, 512, 16);

      addCanvasNoise(ctx, 512, 512, 0.22, 0.12, true);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }

    // Bump Map ผนัง Backrooms: เพิ่มมิติรอยต่อ รอยฉีกขาด และความขรุขระของปูน
    function genAuthenticWallBump() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 512, 512);

      // ตะเข็บรอยต่อวอลเปเปอร์
      ctx.strokeStyle = '#404040';
      ctx.lineWidth = 3;
      for (let y = 0; y < 512; y += 32) {
        for (let x = 0; x < 512; x += 32) {
          ctx.strokeRect(x, y, 32, 32);
        }
      }

      // รอยบุ๋มลึกของแผ่นที่ฉีกขาด
      for (let i = 0; i < 6; i++) {
        const px = 60 + (i * 80) % 400;
        const py = 100 + (i * 65) % 360;
        ctx.fillStyle = '#202020';
        ctx.beginPath();
        ctx.arc(px, py, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // บัวล่างนูนเด่น
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(0, 512 - 50, 512, 8);
      ctx.fillStyle = '#303030';
      ctx.fillRect(0, 512 - 42, 512, 42);

      addCanvasNoise(ctx, 512, 512, 0.4, 0.25, false);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }

    // Roughness Map ผนัง: บริเวณที่มีคราบน้ำจะสะท้อนแสงเงาวาว (Roughness ต่ำ) ขณะที่กระดาษแห้งจะด้าน
    function genAuthenticWallRoughness() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#e0e0e0'; // ส่วนใหญ่ด้าน
      ctx.fillRect(0, 0, 256, 256);

      // คราบน้ำฉ่ำเงา (สีดำ = roughness 0 = มันวาวมาก)
      for (let i = 0; i < 10; i++) {
        const sx = Math.random() * 256;
        ctx.fillStyle = 'rgba(25, 25, 25, 0.7)';
        ctx.fillRect(sx, 0, 10 + Math.random() * 15, 120 + Math.random() * 100);
      }

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }

    // ผนังออฟฟิศปกติก่อนไฟดับครั้งแรก (Clean corporate office wall)
    function genOfficeWallTex() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#dcd7ca';
      ctx.fillRect(0, 0, 512, 512);

      // รอยต่อแผ่นยิปซัมแนวตั้ง
      ctx.strokeStyle = 'rgba(160, 152, 135, 0.4)';
      ctx.lineWidth = 2;
      for (let x = 0; x < 512; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, 512);
        ctx.stroke();
      }

      // บัวกลางผนัง (chair rail) และบัวล่างไม้ลามิเนต
      ctx.fillStyle = '#b8b09e';
      ctx.fillRect(0, 230, 512, 10);
      const baseH = 44;
      ctx.fillStyle = '#7a7260';
      ctx.fillRect(0, 512 - baseH, 512, baseH);
      ctx.fillStyle = '#5c5444';
      ctx.fillRect(0, 512 - baseH, 512, 5);

      addCanvasNoise(ctx, 512, 512, 0.15, 0.06, true);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }

    function genOfficeWallBump() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = '#606060';
      ctx.lineWidth = 2;
      for (let x = 0; x < 256; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
      }
      ctx.fillStyle = '#a0a0a0'; ctx.fillRect(0, 115, 256, 6);
      ctx.fillStyle = '#c0c0c0'; ctx.fillRect(0, 256 - 22, 256, 4);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }

    // พรม Backrooms ชุ่มน้ำเน่า (Moist, Odorous Damp Carpet of the Backrooms Level 0)
    // พรมสีเหลืองหม่นอมน้ำตาลชื้นแฉะ เส้นใยพรมสกปรก และคราบน้ำซึม
    function genAuthenticCarpetTex() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');

      // สีฐาน: พรมขนสัตว์สังเคราะห์สีเหลืองหม่นอมน้ำตาลเปียกชื้น
      ctx.fillStyle = '#7a6b3e';
      ctx.fillRect(0, 0, 512, 512);

      // เส้นใยพรมถักทอแบบ Loop pile ทึบ
      ctx.fillStyle = 'rgba(50, 42, 18, 0.35)';
      for (let x = 0; x < 512; x += 4) {
        for (let y = 0; y < 512; y += 4) {
          if ((x + y) % 8 === 0) ctx.fillRect(x, y, 2.5, 2.5);
        }
      }

      // แอ่งน้ำชื้นแฉะสีคล้ำและคราบตะกอน (Damp stains & foul puddles)
      for (let i = 0; i < 18; i++) {
        const cx = Math.random() * 512, cy = Math.random() * 512;
        const rad = 25 + Math.random() * 70;
        const puddleGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, rad);
        puddleGrad.addColorStop(0, 'rgba(40, 32, 14, 0.7)');
        puddleGrad.addColorStop(0.6, 'rgba(65, 54, 25, 0.4)');
        puddleGrad.addColorStop(1, 'rgba(65, 54, 25, 0)');
        ctx.fillStyle = puddleGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // รอยย่ำเดินซ้ำๆ และคราบความชื้นสะสม
      for (let i = 0; i < 12; i++) {
        const lx = Math.random() * 512, ly = Math.random() * 512;
        ctx.strokeStyle = 'rgba(48, 38, 16, 0.5)';
        ctx.lineWidth = 4 + Math.random() * 8;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + (Math.random() - 0.5) * 80, ly + (Math.random() - 0.5) * 80);
        ctx.stroke();
      }

      addCanvasNoise(ctx, 512, 512, 0.30, 0.16, true);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(70, 70);
      return t;
    }

    // Bump Map สำหรับพรม: ให้ความรู้สึกใยพรมขรุขระหนานุ่มแต่ชุ่มน้ำ
    function genAuthenticCarpetBump() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 256, 256);

      addCanvasNoise(ctx, 256, 256, 0.6, 0.35, false);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(70, 70);
      return t;
    }

    // พรมออฟฟิศปกติก่อนไฟดับ
    function genOfficeCarpetTex() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#656b73';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < 256; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
      }
      for (let y = 0; y < 256; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
      }

      addCanvasNoise(ctx, 256, 256, 0.25, 0.08, true);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(70, 70);
      return t;
    }

    // Bump Map พรมออฟฟิศปกติก่อนไฟดับ
    function genOfficeCarpetBump() {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 128, 128);

      ctx.strokeStyle = '#505050';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < 128; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 128); ctx.stroke();
      }
      for (let y = 0; y < 128; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y); ctx.stroke();
      }

      addCanvasNoise(ctx, 128, 128, 0.45, 0.2, false);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(70, 70);
      return t;
    }

    // เพดานออฟฟิศปกติก่อนไฟดับ (Acoustic ceiling tiles)
    function genAuthenticCeilingTex() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ddd7c4';
      ctx.fillRect(0, 0, 256, 256);

      // โครงอะลูมิเนียมแขวนฝ้า
      ctx.strokeStyle = '#857e6c';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(0, 0, 256, 256);
      ctx.beginPath();
      ctx.moveTo(128, 0); ctx.lineTo(128, 256);
      ctx.moveTo(0, 128); ctx.lineTo(256, 128);
      ctx.stroke();

      addCanvasNoise(ctx, 256, 256, 0.18, 0.08, true);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(70, 70);
      return t;
    }

    function genAuthenticCeilingBump() {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 128, 128);

      ctx.strokeStyle = '#404040';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(0, 0, 128, 128);
      ctx.beginPath();
      ctx.moveTo(64, 0); ctx.lineTo(64, 128);
      ctx.moveTo(0, 64); ctx.lineTo(128, 64);
      ctx.stroke();

      addCanvasNoise(ctx, 128, 128, 0.35, 0.15, false);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(70, 70);
      return t;
    }

    // เพดานเวอร์ชันเน่าเปื่อยทรุดโทรม (Decaying Sick Ceiling) สไตล์ Backrooms & Silent Hill
    // คราบน้ำทะลัก ราสนิมโครงเหล็ก รอยแตกร้าวเป็นช่องมืด
    function genSickCeilingTex() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');

      // สีเหลืองหม่นเน่า
      ctx.fillStyle = '#b5a570';
      ctx.fillRect(0, 0, 512, 512);

      // โครงเหล็กขึ้นสนิมเขรอะ
      ctx.strokeStyle = '#4e3a1f';
      ctx.lineWidth = 5;
      ctx.strokeRect(0, 0, 512, 512);
      ctx.beginPath();
      ctx.moveTo(256, 0); ctx.lineTo(256, 512);
      ctx.moveTo(0, 256); ctx.lineTo(512, 256);
      ctx.stroke();

      // คราบน้ำขังสะสมบนฝ้าจนกระดาษเปื่อยหย่อน (Water blisters)
      for (let i = 0; i < 9; i++) {
        const sx = 60 + Math.random() * 392, sy = 60 + Math.random() * 392;
        const rad = 35 + Math.random() * 55;
        const g = ctx.createRadialGradient(sx, sy, 5, sx, sy, rad);
        g.addColorStop(0, 'rgba(45, 30, 8, 0.7)');
        g.addColorStop(0.5, 'rgba(75, 55, 15, 0.45)');
        g.addColorStop(1, 'rgba(75, 55, 15, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // แผ่นฝ้าแตกหลุดร่วง เผยช่องว่างมืดสนิทเหนือเพดาน (The dark void above)
      ctx.fillStyle = '#100e08';
      ctx.beginPath();
      ctx.moveTo(160, 180);
      ctx.lineTo(240, 150);
      ctx.lineTo(220, 230);
      ctx.lineTo(140, 220);
      ctx.closePath();
      ctx.fill();

      addCanvasNoise(ctx, 512, 512, 0.35, 0.16, true);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(70, 70);
      return t;
    }

    function genSickCeilingBump() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = '#404040';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 256, 256);
      ctx.beginPath();
      ctx.moveTo(128, 0); ctx.lineTo(128, 256);
      ctx.moveTo(0, 128); ctx.lineTo(256, 128);
      ctx.stroke();

      addCanvasNoise(ctx, 256, 256, 0.5, 0.25, false);

      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(70, 70);
      return t;
    }

    // ผิวหน้าโต๊ะทำงานไม้ลามิเนต มีรอยขูดขีดและคราบของเหลว
    function genDeskTopTex() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#8b6944';
      ctx.fillRect(0, 0, 256, 256);

      // ลายเสี้ยนไม้
      ctx.strokeStyle = 'rgba(60, 40, 20, 0.4)';
      ctx.lineWidth = 1.2;
      for (let y = 6; y < 256; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y + Math.sin(y * 0.1) * 3);
        ctx.lineTo(256, y + Math.cos(y * 0.1) * 3);
        ctx.stroke();
      }

      // คราบก้นแก้วกาแฟและรอยกรีดคัตเตอร์
      ctx.strokeStyle = 'rgba(40, 25, 10, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(80, 110, 28, 0, Math.PI * 2);
      ctx.stroke();

      addCanvasNoise(ctx, 256, 256, 0.2, 0.1, true);

      return new THREE.CanvasTexture(c);
    }

    // หน้าตู้เอกสารเหล็ก มีสนิมกัดกร่อน คราบเขม่า และรอยขีดข่วน
    function genCabinetTex() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#6e737a';
      ctx.fillRect(0, 0, 256, 512);

      // รอยต่อลิ้นชักเหล็ก
      ctx.strokeStyle = '#22252a';
      ctx.lineWidth = 4;
      for (let y = 0; y < 512; y += 128) {
        ctx.strokeRect(8, y + 8, 240, 112);

        // ด้ามจับลิ้นชักโครเมียมเก่า
        ctx.fillStyle = '#3a3e45';
        ctx.fillRect(100, y + 52, 56, 14);
        ctx.fillStyle = '#888e99';
        ctx.fillRect(102, y + 54, 52, 4);

        // สนิมขึ้นรอบขอบลิ้นชัก
        ctx.fillStyle = 'rgba(110, 50, 20, 0.45)';
        ctx.fillRect(8, y + 8, 240, 8);
      }

      // รอยข่วนรอยถลอกสีขาว-สนิม
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 256, y = Math.random() * 512;
        ctx.strokeStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.4)' : 'rgba(90,40,15,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 35, y + (Math.random() - 0.5) * 35);
        ctx.stroke();
      }

      addCanvasNoise(ctx, 256, 512, 0.25, 0.12, true);

      return new THREE.CanvasTexture(c);
    }

    // กระดานไวท์บอร์ดห้องประชุม: กราฟที่ถูกขีดฆ่าด้วยเลือดและตัวอักษรวิปลาส
    function genWhiteboardTex() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 320;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#e5e7e0';
      ctx.fillRect(0, 0, 512, 320);

      // กราฟประชุมเดิมที่ซีดจาง
      ctx.strokeStyle = 'rgba(40, 70, 160, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(30, 240); ctx.lineTo(120, 180); ctx.lineTo(200, 200); ctx.lineTo(300, 120); ctx.lineTo(400, 140); ctx.lineTo(480, 80);
      ctx.stroke();

      // รอยลบสกปรก คราบหมึกติดแน่น
      ctx.fillStyle = 'rgba(60, 60, 60, 0.15)';
      ctx.fillRect(60, 60, 200, 120);

      ctx.fillStyle = 'rgba(40, 40, 40, 0.7)';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('FLOOR 4 OCCUPANCY: 0', 32, 40);

      // รอยเลือดป้ายทับสไตล์ Silent Hill
      ctx.strokeStyle = 'rgba(140, 15, 15, 0.75)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(40, 100); ctx.lineTo(470, 260);
      ctx.moveTo(40, 260); ctx.lineTo(470, 100);
      ctx.stroke();

      ctx.fillStyle = 'rgba(120, 10, 10, 0.85)';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('DO NOT LOOK BEHIND YOU', 60, 180);

      addCanvasNoise(ctx, 512, 320, 0.2, 0.08, true);

      return new THREE.CanvasTexture(c);
    }

    // แผงไฟตู้เซิร์ฟเวอร์
    function genServerLightsTex() {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0f1216';
      ctx.fillRect(0, 0, 64, 128);
      for (let y = 6; y < 128; y += 10) {
        ctx.fillStyle = Math.random() < 0.6 ? '#1fae4a' : (Math.random() < 0.5 ? '#e03020' : '#2255aa');
        ctx.fillRect(6, y, 7, 4);
        ctx.fillStyle = '#262b32';
        ctx.fillRect(17, y, 40, 4);
      }
      return new THREE.CanvasTexture(c);
    }

    // กระป๋องนมอัลมอนด์ Almond Milk: ดูเป็นภาชนะฉุกเฉินในโลกสยองขวัญจริง มีคราบน้ำตาล/สนิม
    function genAlmondMilkTex() {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 128, 256);

      // ตัวขวดแก้ว/พลาสติกสีงาช้าง
      const bGrad = ctx.createLinearGradient(32, 0, 96, 0);
      bGrad.addColorStop(0, '#d9cbab');
      bGrad.addColorStop(0.3, '#fff4db');
      bGrad.addColorStop(0.7, '#ebd8b7');
      bGrad.addColorStop(1, '#b8a584');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.roundRect(32, 55, 64, 185, 12);
      ctx.fill();

      // ฝาขวดเกลียวโลหะ
      ctx.fillStyle = '#7a7062';
      ctx.fillRect(44, 30, 40, 25);
      ctx.fillStyle = '#4a4235';
      ctx.fillRect(44, 38, 40, 3);
      ctx.fillRect(44, 46, 40, 3);

      // ฉลากเปื่อยยุ่ยสีชา
      ctx.fillStyle = '#2d1f11';
      ctx.fillRect(34, 110, 60, 65);
      ctx.strokeStyle = '#c49a55';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(36, 112, 56, 61);

      ctx.fillStyle = '#ffd580';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ALMOND', 64, 134);
      ctx.fillText('WATER', 64, 150);
      ctx.font = '8px monospace';
      ctx.fillStyle = '#a6824a';
      ctx.fillText('LEVEL 0', 64, 164);

      // คราบเลือด/ของเหลวที่มือจับขวด
      ctx.fillStyle = 'rgba(90, 15, 15, 0.55)';
      ctx.beginPath();
      ctx.arc(75, 185, 12, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(c);
    }

    // โน้ต/เอกสารเรื่องเล่า: กระดาษยับยู่ยี่ ขอบไหม้ คราบเลือดและรอยหยดน้ำตา
    function genNoteTex() {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 160;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 128, 160);

      ctx.save();
      ctx.translate(64, 80);
      ctx.rotate(-0.04);

      // แผ่นกระดาษยับสีซีดอมเหลือง
      ctx.fillStyle = '#e8dfbe';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillRect(-48, -65, 96, 130);

      // รอยไหม้เกรียมที่มุมกระดาษ
      ctx.fillStyle = 'rgba(40, 20, 10, 0.7)';
      ctx.beginPath();
      ctx.moveTo(30, -65); ctx.lineTo(48, -65); ctx.lineTo(48, -45);
      ctx.closePath(); ctx.fill();

      ctx.restore();

      // บรรทัดข้อความขยุกขยิกเหมือนเขียนด้วยความหวาดกลัว
      ctx.strokeStyle = 'rgba(50, 40, 25, 0.75)';
      ctx.lineWidth = 1.8;
      for (let y = 35; y <= 135; y += 12) {
        ctx.beginPath();
        ctx.moveTo(26, y + (Math.random() - 0.5) * 2);
        ctx.lineTo(102, y + (Math.random() - 0.5) * 2);
        ctx.stroke();
      }

      // รอยหยดเลือดแห้งสีน้ำตาลแดง
      ctx.fillStyle = 'rgba(100, 15, 15, 0.65)';
      ctx.beginPath();
      ctx.arc(88, 115, 7, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(c);
    }

    // บัตรคีย์การ์ดพนักงาน: บัตรแม่เหล็กที่มีรูปถ่ายใบหน้าถูกขูดทำลาย รอยเปื้อนคราบกรด
    function genKeycardTex() {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 80;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 128, 80);

      // ตัวบัตรพลาสติกสีน้ำเงินเข้มขุ่น
      ctx.fillStyle = '#224870';
      ctx.beginPath();
      ctx.roundRect(8, 8, 112, 64, 8);
      ctx.fill();

      // แถบสีขาวด้านบน
      ctx.fillStyle = '#d4e2f0';
      ctx.fillRect(14, 16, 100, 10);

      // แถบชิปทองคำ
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(16, 36, 30, 24);

      // แถบรหัสแม่เหล็ก
      ctx.fillStyle = '#111111';
      ctx.fillRect(52, 40, 60, 6);

      // รอยเลือดและคราบสกปรก
      ctx.fillStyle = 'rgba(120, 10, 10, 0.6)';
      ctx.beginPath();
      ctx.arc(90, 52, 14, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(c);
    }




