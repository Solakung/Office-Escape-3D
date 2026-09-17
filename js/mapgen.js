    // -------------------------------------------------------------
    // 1. Procedural 70x70 Map Generator
    // -------------------------------------------------------------
    function generateSolvableOfficeMap() {
      const map = [];
      for (let r = 0; r < MAP_SIZE; r++) {
        map[r] = new Array(MAP_SIZE).fill(0);
        for (let c = 0; c < MAP_SIZE; c++) {
          if (r === 0 || r === MAP_SIZE - 1 || c === 0 || c === MAP_SIZE - 1) {
            map[r][c] = 1;
          }
        }
      }

      const sectorSize = 7;
      // เดิมใช้ Math.floor ทำให้ตัดเศษ sector สุดท้ายทิ้งไปเลย — แถบขอบแมพลึกๆ (แถว/คอลัมน์ท้ายๆ)
      // เลยไม่มี sector คลุมถึง กลายเป็นพื้นที่โล่งไม่มีผนัง/เสา/คลัตเตอร์ใดๆ ทั้งที่ควรมีห้องเหมือนที่อื่น
      const sectorsCount = Math.ceil((MAP_SIZE - 2) / sectorSize);

      for (let sr = 0; sr < sectorsCount; sr++) {
        for (let sc = 0; sc < sectorsCount; sc++) {
          const startR = 1 + sr * sectorSize;
          const startC = 1 + sc * sectorSize;

          if (sr > 0) {
            const doorC1 = startC + 1 + Math.floor(Math.random() * 2);
            const doorC2 = startC + 4 + Math.floor(Math.random() * 2);
            for (let c = startC; c < startC + sectorSize && c < MAP_SIZE - 1; c++) {
              if (c !== doorC1 && c !== doorC2 && Math.random() < 0.74) {
                map[startR][c] = 1;
              }
            }
          }

          if (sc > 0) {
            const doorR1 = startR + 1 + Math.floor(Math.random() * 2);
            const doorR2 = startR + 4 + Math.floor(Math.random() * 2);
            for (let r = startR; r < startR + sectorSize && r < MAP_SIZE - 1; r++) {
              if (r !== doorR1 && r !== doorR2 && Math.random() < 0.74) {
                map[r][startC] = 1;
              }
            }
          }

          const midR = startR + 2 + Math.floor(Math.random() * 3);
          const midC = startC + 2 + Math.floor(Math.random() * 3);
          if (midR < MAP_SIZE - 2 && midC < MAP_SIZE - 2) {
            if (Math.random() < 0.65) map[midR][midC] = 1;
            if (Math.random() < 0.35 && midR + 1 < MAP_SIZE - 1) map[midR + 1][midC] = 1;
          }

          // พาร์ทิชั่นคอกออฟฟิศสั้นๆ กระจายในห้อง เพิ่มความรกซับซ้อนแบบ Backrooms
          // (ไม่กระทบทางเดินหลัก เพราะยังมี isPathReachable + carveGuaranteedCorridor เช็คซ้ำท้ายฟังก์ชัน)
          const clutterCount = 2 + Math.floor(Math.random() * 3); // 2-4 ชิ้นต่อห้อง
          for (let k = 0; k < clutterCount; k++) {
            const baseC = startC + 1 + Math.floor(Math.random() * (sectorSize - 2));
            const baseR = startR + 1 + Math.floor(Math.random() * (sectorSize - 2));
            const horizontal = Math.random() < 0.5;
            const segLen = 2 + Math.floor(Math.random() * 2); // ยาว 2-3 ช่อง
            for (let s = 0; s < segLen; s++) {
              const wr = horizontal ? baseR : baseR + s;
              const wc = horizontal ? baseC + s : baseC;
              if (wr > 0 && wr < MAP_SIZE - 1 && wc > 0 && wc < MAP_SIZE - 1 && Math.random() < 0.8) {
                map[wr][wc] = 1;
              }
            }
          }
        }
      }

      for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 3; c++) map[r][c] = 0;
      }
      map[1][1] = 2; // Player Start

      // สุ่มตำแหน่งทางออกฉุกเฉิน
      let exitR = 25 + Math.floor(Math.random() * (MAP_SIZE - 30));
      let exitC = 25 + Math.floor(Math.random() * (MAP_SIZE - 30));
      for (let r = exitR - 1; r <= exitR + 1; r++) {
        for (let c = exitC - 1; c <= exitC + 1; c++) map[r][c] = 0;
      }
      map[exitR][exitC] = 3;

      map[25][35] = 4; // Smiler
      map[50][20] = 5; // Bacteria
      map[18][55] = 6; // Duller
      map[45][45] = 7; // Acid Man
      map[60][15] = 8; // The Gapped

      if (!isPathReachable(map, 1, 1, exitR, exitC)) {
        carveGuaranteedCorridor(map, 1, 1, exitR, exitC);
      }
      return map;
    }

    function isPathReachable(map, startR, startC, endR, endC) {
      const q = [[startR, startC]];
      const visited = Array.from({ length: MAP_SIZE }, () => new Array(MAP_SIZE).fill(false));
      visited[startR][startC] = true;
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      while (q.length > 0) {
        const [cr, cc] = q.shift();
        if (cr === endR && cc === endC) return true;
        for (const [dr, dc] of dirs) {
          const nr = cr + dr, nc = cc + dc;
          if (nr >= 1 && nr < MAP_SIZE - 1 && nc >= 1 && nc < MAP_SIZE - 1) {
            if (!visited[nr][nc] && map[nr][nc] !== 1) {
              visited[nr][nc] = true;
              q.push([nr, nc]);
            }
          }
        }
      }
      return false;
    }

    function carveGuaranteedCorridor(map, startR, startC, endR, endC) {
      let cr = startR, cc = startC;
      while (cr !== endR) { map[cr][cc] = 0; cr += (cr < endR) ? 1 : -1; }
      while (cc !== endC) { map[cr][cc] = 0; cc += (cc < endC) ? 1 : -1; }
      map[endR][endC] = 3;
    }

    function getRandomFloorCell() {
      for (let i = 0; i < 40; i++) {
        const r = 2 + Math.floor(Math.random() * (MAP_SIZE - 4));
        const c = 2 + Math.floor(Math.random() * (MAP_SIZE - 4));
        if (GRID && GRID[r] && GRID[r][c] === 0) {
          return new THREE.Vector3(c * CELL + CELL / 2, 0, r * CELL + CELL / 2);
        }
      }
      return new THREE.Vector3(MAP_SIZE * CELL / 2, 0, MAP_SIZE * CELL / 2);
    }

    function getRandomFloorCellNear(px, pz, minDist, maxDist) {
      for (let i = 0; i < 30; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = minDist + Math.random() * (maxDist - minDist);
        const wx = px + Math.cos(ang) * dist;
        const wz = pz + Math.sin(ang) * dist;
        const c = Math.floor(wx / CELL);
        const r = Math.floor(wz / CELL);
        if (r > 1 && r < MAP_SIZE - 2 && c > 1 && c < MAP_SIZE - 2 && GRID && GRID[r] && GRID[r][c] === 0) {
          return new THREE.Vector3(c * CELL + CELL / 2, 0, r * CELL + CELL / 2);
        }
      }
      return null;
    }

    window.getRandomFloorCell = getRandomFloorCell;
    window.getRandomFloorCellNear = getRandomFloorCellNear;

