    function applyViewportSize() {
      if (!camera || !renderer) return;
      const { w, h } = getViewportSize();
      // กันกรณีเบราเซอร์ยิง event ตอน layout ยังไม่นิ่ง แล้วได้ค่า 0 หรือเล็กผิดปกติมา
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    window.addEventListener('resize', applyViewportSize);
    window.addEventListener('orientationchange', () => {
      // แถบ address bar / navigation bar บางรุ่นใช้เวลาสักครู่กว่าจะยุบ/ขยายเสร็จหลังหมุนจอ
      applyViewportSize();
      setTimeout(applyViewportSize, 250);
      setTimeout(applyViewportSize, 600);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', applyViewportSize);
    }
    // เช็คซ้ำอีกครั้งหลังโหลดหน้าเสร็จจริง เผื่อค่าตอน setupWorld() ยังไม่ใช่ขนาดจอสุดท้าย
    window.addEventListener('load', () => setTimeout(applyViewportSize, 300));

    function startInitLoop() {
      if (typeof THREE !== 'undefined') {
        setupWorld();
      } else {
        setTimeout(startInitLoop, 100);
      }
    }
    startInitLoop();
