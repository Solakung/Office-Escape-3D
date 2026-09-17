    // ขยายแมปเป็น 70x70 บล็อก (~250 เมตร กว้างกว่า 63,000 ตร.ม.)
    const MAP_SIZE = 70;
    const CELL = 3.6;
    const HEIGHT = 3.0;

    let GRID = [];
    let audioCtx = null, humGain = null;
    let fluorHumFilter = null, fluorBuzzGain = null, fluorBuzzFilter = null;
    let officeChatterGain = null, officeChatterFilter = null, officeChatterLfo = null;
    let currentChaseIntensity = 0;
    let liminalHumOsc = null, liminalHumGain = null, liminalHumStarted = false;
    let monsterSoundGain = null, monsterOsc1 = null, monsterOsc2 = null;
    let shadowSoundGain = null, shadowOsc = null;
    let dullerSoundGain = null, dullerOsc = null;
    let acidSoundGain = null, acidOsc = null;
    let gapSoundGain = null, gapOsc = null;

    let camera, scene, renderer, flashlight, ambientLight;
    let wallInstancedMesh = null;
    let ceilingLights = [], lampMeshes = [], stairMeshes = [];
    let lastLightCullTime = 0;
    let lastFlickerScheduleTime = 0;

    // เพดานไฟมีเป็นร้อยดวงทั่วแมพ 70x70 ถ้าปล่อยให้ทุกดวง "active" พร้อมกัน
    // shader ของวัตถุที่ใช้แสง (พื้น/ผนัง/เพดาน MeshLambertMaterial) ต้องวนคำนวณแสงทุกดวงต่อพิกเซล
    // ทำให้เครื่องมือถือกระตุกหนักมาก ฟังก์ชันนี้จะปิด (visible=false) เฉพาะดวงที่อยู่ไกลผู้เล่นเกินระยะที่มองเห็นแสงจริงๆ
    // เหลือไว้ให้ทำงานจริงเฉพาะดวงที่อยู่ใกล้ๆ กล้อง (แสงไกลๆ มืดจนมองไม่ออกอยู่แล้วเพราะมี fog หนาด้วย)
    const LIGHT_CULL_RADIUS = 26;
    function updateLightCulling(now) {
      if (now - lastLightCullTime < 300) return; // throttle ทุก 300ms พอ ไม่ต้องเช็คทุกเฟรม
      lastLightCullTime = now;
      if (!camera) return;
      const cx = camera.position.x, cz = camera.position.z;
      for (let i = 0; i < ceilingLights.length; i++) {
        const l = ceilingLights[i];
        const dx = l.position.x - cx, dz = l.position.z - cz;
        l.visible = (dx * dx + dz * dz) < (LIGHT_CULL_RADIUS * LIGHT_CULL_RADIUS);
      }
    }

    // =============================================================
    // 3D Procedural Animated Entity Rigs (โครงสร้างขยับได้จริง)
    // =============================================================
    
    // Entity 1: The Smiler (หัวลอย + ขากรรไกรอ้าหุบ 3D)
    let smilerRig, smilerJawMesh, smilerEyesMesh, smilerLight, smilerFaceAnchor, smilerStalkMesh;
    let smilerSpawn = new THREE.Vector3(90, 1.4, 90);
    let smilerSpeed = 1.2;
    let smilerState = 'PATROL'; // PATROL, ALERT, CHASE
    let smilerWaypoint = null, smilerWaitTimer = 0;
    let smilerEnraged = false, smilerTimer = 0, smilerCooldown = 0;
    let smilerNextTwitchTime = performance.now() + 4000 + Math.random() * 6000, smilerTwitchUntil = 0;

    // Entity 2: The Bacteria (หุ่นกิ่งไม้ 3D ขยับแขนขาเดินจริง)
    let bacteriaRig, bacteriaLeftLeg, bacteriaRightLeg, bacteriaLeftArm, bacteriaRightArm, bacteriaTorso, bacteriaLight, bacteriaJawMesh, bacteriaFaceAnchor;
    let bacteriaSpawn = new THREE.Vector3(160, 0, 60);
    let bacteriaSpeed = 1.0;
    let bacteriaState = 'PATROL';
    let bacteriaWaypoint = null, bacteriaWaitTimer = 0;
    let bacteriaWalkCycle = 0;
    let bacteriaEnraged = false, bacteriaTimer = 0, bacteriaCooldown = 0;
    let bacteriaNextTwitchTime = performance.now() + 6000 + Math.random() * 7000, bacteriaTwitchUntil = 0;

    // Entity 3: The Duller (สัตว์ประหลาดสี่ขา คลานติดพื้นจริง)
    let dullerRig, dullerLegs = [], dullerTorso, dullerLight, dullerJawMesh, dullerFaceAnchor;
    let dullerSpawn = new THREE.Vector3(55, 0, 180);
    let dullerSpeed = 1.4;
    let dullerState = 'PATROL';
    let dullerWaypoint = null, dullerWaitTimer = 0;
    let dullerCrawlCycle = 0;
    let dullerNextTwitchTime = performance.now() + 5000 + Math.random() * 6000, dullerTwitchUntil = 0;

    // Entity 4: The Acid Man (มนุษย์เดิน 2 ขา ตามล่าตรงๆ + ถ่มกรดใส่จากระยะไกล)
    let acidManRig, acidManLeftLeg, acidManRightLeg, acidManLeftArm, acidManRightArm, acidManTorso, acidManLight, acidManJawMesh, acidManFaceAnchor;
    let acidManSpawn = new THREE.Vector3(120, 0, 130);
    let acidManSpeed = 1.1;
    let acidManState = 'PATROL';
    let acidManWaypoint = null, acidManWaitTimer = 0;
    let acidManWalkCycle = 0;
    let acidManEnraged = false, acidManTimer = 0, acidManCooldown = 0;
    let acidManNextTwitchTime = performance.now() + 5500 + Math.random() * 7000, acidManTwitchUntil = 0;

    // Entity 5: The Gapped (มนุษยนอยด์ผอมสูง อกแหวกเป็นรอยแยกมิติ ไม่ทำร้ายตรงๆ แต่ลากผู้เล่นผ่านรอยแยกไปโผล่ที่อื่นในแมพ)
    let gappedRig, gappedLeftLeg, gappedRightLeg, gappedLeftArm, gappedRightArm, gappedTorso, gappedLight, gappedFaceAnchor, gappedVoidRing;
    let gappedSpawn = new THREE.Vector3(200, 0, 40);
    let gappedSpeed = 1.15;
    let gappedState = 'PATROL';
    let gappedWaypoint = null, gappedWaitTimer = 0;
    let gappedWalkCycle = 0;
    let gappedNextTwitchTime = performance.now() + 7000 + Math.random() * 8000, gappedTwitchUntil = 0;

    // "ลากผ่านรอยแยก" แทนจั๊มสแกร์ — ผู้เล่นไม่ตาย แค่ถูกดึงวาปไปโผล่จุดอื่นในแมพแบบมึนงง
    let gappedGrabActive = false;
    let gappedGrabStartTime = 0;
    let gappedGrabCooldownUntil = 0;
    const GAPPED_GRAB_DURATION = 900;      // ms ที่ภาพบิดเบี้ยว/ดูดกล้องก่อนสลับตำแหน่ง
    const GAPPED_GRAB_RANGE = 1.7;         // แขนมันยาวเก้งก้างกว่าตัวอื่นเล็กน้อย จับได้จากระยะที่ไกลกว่านิดหน่อย
    const GAPPED_GRAB_COOLDOWN = 26000;    // ms ก่อนมันจะลากผู้เล่นซ้ำได้อีกครั้ง
    const GAPPED_SANITY_DRAIN = 14;        // เสีย SANITY/ENERGY ก้อนหนึ่งตอนโดนลากผ่านรอยแยก (ไม่ใช่ความเสียหายรุนแรงแบบโดนจับตาย)
    const GAPPED_TELEPORT_MIN_DIST = 12;   // จุดที่โผล่มาใหม่ต้องห่างจากจุดเดิมอย่างน้อยเท่านี้ กันวาปไปโผล่ที่เดิม/ติดกำแพง

    // ก้อนกรดที่ Acid Man ถ่มใส่ผู้เล่นเมื่ออยู่ในระยะโจมตี (ไม่ต้องเดินมาถึงตัวก็โดนได้)
    const ACID_THROW_MIN_RANGE = 4.0;
    const ACID_THROW_MAX_RANGE = 16.0;
    const ACID_PROJECTILE_SPEED = 11.0;
    const ACID_SPLASH_DAMAGE = 11;
    const ACID_THROW_COOLDOWN_MIN = 2600;
    const ACID_THROW_COOLDOWN_MAX = 4200;
    let acidThrowCooldownUntil = 0;
    let acidProjectiles = []; // { mesh, target: Vector3, life }
    let acidShakeUntil = 0;

    // ผลกรดกัดผิวหลังโดนสาด: เดินช้าลง + SANITY ไหลออกไวขึ้นไปอีกพักหนึ่ง (นอกเหนือจากความเสียหายทันทีตอนโดน)
    const ACID_BURN_DURATION = 6000;      // ms ที่แผลไหม้ยังกัดกร่อนต่อเนื่อง
    const ACID_BURN_SPEED_MULT = 0.55;    // เดินได้แค่ ~55% ของความเร็วปกติระหว่างนี้
    const ACID_BURN_DRAIN_PER_SEC = 2.4;  // SANITY ไหลเพิ่มขึ้นต่อวินาทีระหว่างแผลไหม้ยังกัดกร่อนอยู่
    let acidBurnUntil = 0;

    // กระป๋อง Almond Milk ทั่วแมป
    let almondBottles = [];
    // นมอัลมอนด์ตอนนี้เก็บเข้ากระเป๋าไว้ก่อน ไม่ดื่มทันทีที่เดินผ่าน — กด Q/ปุ่ม DRINK เพื่อใช้ตอนที่ต้องการจริงๆ
    let almondInventory = 0;
    const ALMOND_INVENTORY_MAX = 5;
    const ALMOND_RESTORE_AMOUNT = 45;

    // Energy / Sanity Juke
    let playerEnergy = 100;
    let baseFov = 82; // เดิม 72 — มุมมองแคบไป ขยายให้เห็นรอบตัวมากขึ้น ลดโอกาสโดนจู่โจมแบบมองไม่ทัน
    let hasRevealedSanity = false;

    // =============================================================
    // ACT SYSTEM & DETECTIVE (ภาค 2: 2 องก์ต่อเนื่อง)
    // =============================================================
    let currentAct = 1; // 1 = พนักงานออฟฟิศ (ของเดิม), 2 = นักสืบ (ของใหม่)
    let actTransitionActive = false;
    let deepStateActive = false;
    let act2StartTime = 0;
    const DEEP_STATE_TIME_MS = 480000; // ~8 นาทีหลังเข้าองก์ 2
    const DEEP_STATE_SANITY_THRESHOLD = 50; // Sanity ต่ำกว่านี้ เข้า Deep State ก่อนกำหนด
    let DETECTIVE_ENTRY_POINT = new THREE.Vector3(5, 1.5, 5);

    // Act 2 Player Stats (HP, Sanity/การถูกลืม, สมอยึดโยง, หลักฐาน)
    let playerHP = 100;
    let playerSanity = 100;
    let anchorHeld = true; // กุญแจรถ/ตราตำรวจ ยึดโยงโลกจริง
    let lastAnchorUseTime = 0;
    const ANCHOR_COOLDOWN_MS = 22000;
    let evidencePhotos = 0; // 0/12 ถ่ายรูปโน้ตคดี
    let photographedLoreSet = new Set();
    let firstAidKits = 1; // ชุดปฐมพยาบาล (ฟื้น HP 50 โดยต้องยืนนิ่ง 4 วิ)
    let isHealing = false;
    let healStartTime = 0;
    const HEAL_CHANNEL_MS = 4000;
    let investigativeFlashlightOn = false;
    let flashlightBattery = 100;
    let revolverAmmo = 6; // ปืนพก 6 นัด ล้มมอนสเตอร์ได้ 1 นัด แต่เสียงดังมาก
    let gappedSeamHeldOpen = false; // รอยแยกมิติที่ถูกทำให้ค้างเปิดสำหรับฉากจบจริง
    let gappedSeamOpenUntil = 0;
    let hitTinnitusUntil = 0; // หูอื้อค้างเมื่อโดนทำร้าย
    let screenBlurUntil = 0;   // จอเบลอค้างเมื่อโดนทำร้าย

    // Act 2 Player Combat State Machine
    let combatState = 'IDLE'; // IDLE, WINDUP, RECOVERY
    let combatStateUntil = 0;
    let currentWeapon = null;
    let weaponsInventory = [];
    const ATTACK_INPUT_COOLDOWN = 400;
    let lastAttackInputTime = 0;
    let playerMoveSpeedMult = 1.0;
    let cameraTurnSpeedMult = 1.0;

    // Act 2 Entity Wounding, Flee & Respawn
    let entityWoundStages = { smiler: 0, bacteria: 0, duller: 0, acidMan: 0 };
    let entityFleeState = { smiler: false, bacteria: false, duller: false, acidMan: false };
    let entityRespawnTime = { smiler: 0, bacteria: 0, duller: 0, acidMan: 0 };
    let entityStaggerUntil = { smiler: 0, bacteria: 0, duller: 0, acidMan: 0 };
    let entityEnrageUntil = { smiler: 0, bacteria: 0, duller: 0, acidMan: 0 };

    // Deep State Acid Pools & Pickup Meshes
    let activeAcidPools = []; // { mesh, x, z, expiresAt }
    let weaponPickupMeshes = []; // { mesh, type, x, z }
    let carriedEvidence = new Set();

    // Jumpscare
    let jumpscareTargetRig = null;
    let isJumpscareActive = false;
    let jumpscareStartTime = 0;
    var jumpscareStrobeAudioTriggered = false;
    window.jumpscareStrobeAudioTriggered = false;

    let playerSpawn = new THREE.Vector3(5, 1.5, 5);
    let exitPos = new THREE.Vector3(0, 0, 0);

    // ระบบ Sprint แบบวิ่งพุ่งช่วงสั้นๆ ไว้หนี (ใช้ Energy/Sanity เป็นต้นทุน + มีคูลดาวน์)
    let isSprintBoost = false;
    let sprintBoostEndTime = 0;
    let sprintCooldownEndTime = 0;
    const SPRINT_DURATION = 2800;      // ms ที่วิ่งเร็วขึ้น (เดิม 2200 — ยืดให้พอมีเวลาสร้างระยะห่างจริงๆ)
    const SPRINT_COOLDOWN = 5000;      // ms ก่อนใช้ได้อีกครั้ง (เดิม 7000 — ลดลงให้กดหนีได้ถี่ขึ้น)
    const SPRINT_SPEED_MULT = 1.85;
    const SPRINT_ENERGY_COST = 8;      // หักตอนกดใช้ครั้งเดียว
    const SPRINT_MIN_ENERGY = 6;       // ต่ำกว่านี้ห้ามกดวิ่ง (กันตายฟรี)

    const keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };
    const joyVector = { x: 0, y: 0 };
    let cameraPitch = 0, cameraYaw = 0;
    let headBobTimer = 0;

    let nextHeartbeatTime = 0;

    let isBlackout = false;
    let nextBlackoutTime = performance.now() + 25000;
    let blackoutEndTime = 0;
    // ก่อนไฟดับครั้งแรก entity ทั้ง 3 ตัวยังไม่ปรากฏตัวหรือขยับเลย — เริ่มทำงานหลังไฟกลับมาติดครั้งแรก
    let firstBlackoutOccurred = false;

    // "โกง" ให้ entity วาปมาป้วนเปี้ยนใกล้ผู้เล่นเป็นระยะ ระหว่างที่มันแค่ PATROL อยู่ไกลๆ
    // (สุ่มเวลาถัดไปของแต่ละตัวไม่พร้อมกัน กันไม่ให้โผล่มาพร้อมกันทั้ง 3 ตัว)
    let smilerNextCheatTime = performance.now() + 14000 + Math.random() * 8000;
    let bacteriaNextCheatTime = performance.now() + 20000 + Math.random() * 8000;
    let dullerNextCheatTime = performance.now() + 26000 + Math.random() * 8000;
    let acidManNextCheatTime = performance.now() + 32000 + Math.random() * 8000;
    let gappedNextCheatTime = performance.now() + 38000 + Math.random() * 8000;
    const CHEAT_MIN_INTERVAL = 22000;
    const CHEAT_MAX_INTERVAL = 38000;
    const CHEAT_MIN_DIST = 24;   // เดิม 17 — ขยับให้ไกลขึ้นอีก ผู้เล่นมีเวลาตั้งตัว/ตอบสนองทันมากขึ้น
    const CHEAT_MAX_DIST = 36;   // เดิม 27

    let wallMat, floorMat, ceilingMat, boxGeo;
    let officeWallTex, officeWallBump, backroomsWallTex, backroomsWallBump;
    let officeFloorTex, officeFloorBump, backroomsFloorTex, backroomsFloorBump, officeCeilingTex, officeCeilingBump, backroomsCeilingTex, backroomsCeilingBump;
    let airborneParticles = null, airborneParticleGeo = null;
    let isTouchDevice = false;
    const OFFICE_AMBIENT_COLOR = 0xf3f0e6;
    const BACKROOMS_AMBIENT_COLOR = 0x6e6335; // แสงสลัวเหลืองมัสตาร์ดสไตล์ Backrooms Level 0 หลอนอึดอัด
    // สีหมอก/พื้นหลังฉาก: โทนเทาสว่างแบบแสงฟลูออเรสเซนต์ตอนยังเป็นออฟฟิศปกติ
    // เปลี่ยนเป็นหมอกเหลืองซีดมลพิษแบบ Liminal Monoyellow เมื่อเข้าสู่ Backrooms
    const OFFICE_FOG_COLOR = 0xb9b6ab;
    const BACKROOMS_FOG_COLOR = 0x635828; // หมอกเหลืองสลัว Liminal Space ปลายทางเดินเลือนหายในความเวิ้งว้าง
    const OFFICE_FOG_DENSITY = 0.010;
    let baseFogDensity = 0.019;

    // -------------------------------------------------------------
    // Lore Notes (เอกสารเก็บได้ เล่าเรื่องราวของออฟฟิศ)
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // Keycards (เป้าหมายย่อย: ต้องเก็บให้ครบก่อนถึงจะออกทาง EXIT ได้)
    // -------------------------------------------------------------
    let keycards = [];
    let keycardsCollected = 0;
    const KEYCARDS_REQUIRED = 3;
    let lastExitLockedNoticeTime = 0;

    let loreNotes = [];
    // สะสมข้อความโน้ตที่เคยเก็บได้ ไม่รีเซ็ตตอนเริ่มเกมใหม่ในเซสชันเดียวกัน
    // เพื่อให้หน้าสรุปโน้ตในเมนูหลักแสดงความคืบหน้าสะสมทั้งหมด
    let collectedLoreSet = new Set();
    window.collectedLoreSet = collectedLoreSet;
    const LORE_TEXTS = [
      "บันทึก 1/12 — ทุกคนกลับบ้านหมดแล้วตั้งแต่สามทุ่ม... แต่ทำไมลิฟต์ยังขึ้นๆลงๆ เองอยู่เลย",
      "บันทึก 2/12 — ป้ายประกาศ: 'พนักงานที่ทำงานล่วงเวลาเกิน 22:00 น. กรุณาอย่าเดินออกนอกเส้นทางที่กำหนด'",
      "บันทึก 3/12 — ฉันได้ยินเสียงเคาะประตูห้องประชุมมาสามคืนติดแล้ว แต่ไม่มีใครอยู่ในนั้นเลย",
      "บันทึก 4/12 — อีเมลพิมพ์ออกมา: 'ห้ามเข้าชั้น 4 ฝั่งตะวันออกหลัง 20:00 น. โดยเด็ดขาด'",
      "บันทึก 5/12 — มีอะไรบางอย่างยืนนิ่งอยู่ปลายทางเดินตอนไฟกระพริบ พอไฟติดอีกทีมันหายไปแล้ว",
      "บันทึก 6/12 — กระดาษโน้ตกาว: ถ่ายรูปเปิดแฟลชได้เรื่อยๆ แต่ถ้าเห็นอะไรยืนนิ่งอยู่ปลายทางเดิน อย่าถ่ายมันซ้ำ",
      "บันทึก 7/12 — รายงานซ่อมบำรุง: ระบบไฟดับเป็นช่วงๆ ทีมช่างแจ้งว่า 'หาสาเหตุไม่เจอ สายไฟไม่ได้ขาด'",
      "บันทึก 8/12 — หน้าไดอารี่ขาดๆ: มันยิ้มให้ฉัน... สิ่งที่ยืนอยู่ปลายทางเดินนั่นแหละ ฉันไม่แน่ใจว่ามันมีปากจริงๆ หรือฉันคิดไปเอง",
      "บันทึก 9/12 — ข้อความบนกระดานไวท์บอร์ด: TURN BACK. THIS IS NOT THE LOBBY ANYMORE.",
      "บันทึก 10/12 — ใบลาออกที่ไม่ได้ส่ง: ฉันจะไม่ทำงานล่วงเวลาที่นี่อีกแล้ว ถ้าฉันออกไปได้นะ",
      "บันทึก 11/12 — โน้ตในลิ้นชัก: นับก้าวเดินของตัวเองไว้เสมอ ถ้าตัวเลขไม่ตรงกับที่จำได้ แปลว่าห้องเปลี่ยนไปแล้ว",
      "บันทึก 12/12 — หน้ากระดาษไหม้เกรียม: ...มันไม่ใช่สำนักงาน... มันไม่เคยเป็นสำนักงาน..."
    ];
    window.LORE_TEXTS_REF = LORE_TEXTS;

    // -------------------------------------------------------------
    // Ambient Dread Events (เหตุการณ์หลอนที่ไม่ทำร้ายผู้เล่นโดยตรง)
    // -------------------------------------------------------------
    let nextAmbientEventTime = performance.now() + 9000 + Math.random() * 6000;

    // -------------------------------------------------------------
    // Camera Flash (เปลี่ยนจากไฟฉายส่องต่อเนื่อง เป็นกล้องถ่ายรูปที่ยิงแสงแฟลชวาบสั้นๆ ตามสั่ง)
    // -------------------------------------------------------------
    let cameraFlashActive = false; // true แค่ช่วงสั้นๆ ตอนแฟลชวาบ ใช้เช็ค detection/ทำให้ Smiler สะดุ้งถอย
    let cameraCharge = 100;        // พลังงานกล้อง ถ่ายแต่ละครั้งใช้ไปก้อนหนึ่ง ค่อยๆ ฟื้นเองเมื่อเวลาผ่านไป
    const CAMERA_FLASH_DURATION_MS = 220;  // ความยาวแฟลชแต่ละครั้ง สั้นแบบแฟลชกล้องจริง ไม่ใช่ไฟส่องค้าง
    const CAMERA_FLASH_INTENSITY = 3.4;    // วาบสว่างจ้ากว่าไฟฉายเดิมมาก แต่อยู่แค่แป๊บเดียว
    const CAMERA_CHARGE_COST = 24;         // ต่อการถ่าย 1 ครั้ง (~4 ครั้งจากเต็ม)
    const CAMERA_CHARGE_REGEN_PER_SEC = 3.2; // ฟื้นเองเรื่อยๆ ไม่ต้องปิดรอเหมือนแบตไฟฉายเดิม
    const CAMERA_MIN_CHARGE_TO_USE = 24;   // ต้องมีพลังงานอย่างน้อยเท่านี้ถึงจะกดถ่ายได้

    // เสียงที่ผู้เล่นสร้างขึ้น (สปรินท์ / ชัตเตอร์กล้อง) — The Duller ไม่สนแสง แต่ไวต่อเสียงมาก
    let recentNoise = null; // { x, z, radius, time }
    function emitNoise(x, z, radius) {
      recentNoise = { x, z, radius, time: performance.now() };
    }

    // -------------------------------------------------------------
    // Safe-zone / จุดซ่อนตัว (ตู้เอกสาร) — กด/แตะเพื่อหลบ ลดโอกาสถูกสังเกตเห็นเกือบเป็นศูนย์
    // -------------------------------------------------------------
    let hidingSpots = [];
    let officeFurniture = [];   // ของตกแต่งออฟฟิศปกติ (โต๊ะ/เก้าอี้/ตู้เอกสาร/ต้นไม้) — ยืนยันว่านี่คือออฟฟิศ ก่อนไฟดับครั้งแรก
    let anomalyMeshes = [];     // สำเนา/ของผิดปกติที่โผล่มาเสริมตอนไฟดับครั้งแรก ต้องเคลียร์ทิ้งตอนรีสตาร์ท
    let isHiding = false;
    const HIDE_INTERACT_DIST = 1.8;
    const HIDING_SPOTS_COUNT = 9;
    // ตำแหน่ง/มุมกล้องก่อนเข้าไปซ่อน (ไว้ย้อนกลับตอนออกจากตู้)
    const preHidePosition = new THREE.Vector3();
    let preHideYaw = 0, preHidePitch = 0;
    let hidingBaseYaw = 0; // มุมหันออกจากตู้ตอนแอบอยู่ ใช้จำกัดมุมมองผ่านช่องล็อคเกอร์
    const HIDE_PEEK_YAW_RANGE = 0.4;   // แอบมองได้แค่แคบๆ ผ่านช่องล็อคเกอร์
    const HIDE_PEEK_PITCH_RANGE = 0.22;

    // "ตู้เอกสารไม่ได้ปลอดภัยแน่นอน 100% เสมอไป" — ถ้ามีอะไรเดินมาจ่อใกล้ตู้ตอนกำลังซ่อน
    // จะมีจังหวะเตือน (สั่น+เสียง) ให้พอมีเวลาตัดสินใจ ก่อนที่มันจะมีโอกาสเล็กๆ "เช็คเจอ" จริงๆ
    const LOCKER_CLOSE_CALL_DIST = 3.2;
    const LOCKER_CLOSE_CALL_CATCH_CHANCE = 0.14;
    let lockerCloseCallCooldownUntil = 0;

    // "หาไปพักหนึ่งก่อนเลิกล่า" — พอคลาดกับผู้เล่น (เช่นผู้เล่นเพิ่งซ่อนตัว) มอนจะไม่หันหนีทันที
    // แต่จะเดินไปวนดูจุดที่เห็นครั้งสุดท้ายก่อนสักพัก แล้วค่อยเลิกล่ากลับไปลาดตระเวนปกติ
    const SEARCH_LINGER_MS = 4000;
    const SEARCH_SPEED = 1.8;

    // Smiler ล่าด้วยสายตา: ไฟฉายจ่อหน้าตรงๆ ระยะใกล้ทำให้มันสะดุ้งถอยชั่วคราว
    const SMILER_LIGHT_REPEL_DIST = 9.0;
    const SMILER_LIGHT_REPEL_DOT = 0.55; // ~56 องศาครึ่งมุม ใกล้เคียงลำแสงไฟฉาย
    const SMILER_RECOIL_SPEED = 3.0;
    const SMILER_STUN_MIN_MS = 2000;     // โดนแฟลชจ่อหน้า -> สตันนิ่ง ไร้พิษภัยชั่วคราว 2-3 วิ
    const SMILER_STUN_MAX_MS = 3000;
    let smilerStunUntil = 0;

    // Duller ตาบอด ไม่สนไฟฉาย ระยะตรวจจับพื้นฐานคงที่เสมอ (ต่างกับ Smiler/Bacteria ที่ยิ่งเปิดไฟยิ่งเห็นไกลขึ้น)
    const DULLER_BASE_DETECT_RANGE = 23;
    // ได้ยินเสียง (วิ่ง/ถ่ายรูป) ตอนอยู่ไกล -> วิ่งไล่ตามตัวผู้เล่นสดๆ (ปรับทิศตามที่ผู้เล่นขยับ)
    // ได้ยินเสียงตอนอยู่ใกล้กว่านี้ -> เปลี่ยนเป็น "พุ่งใส่ตำแหน่งที่เกิดเสียง" แบบเจาะจง ไม่ตามตัวผู้เล่นระหว่างพุ่ง
    const DULLER_LUNGE_TRIGGER_DIST = 10.0;
    const DULLER_LUNGE_SPEED = 5.4;      // เร็วกว่าไล่ล่าปกติ เพราะเป็นการพุ่งใส่จุดเดียวแบบทุ่มสุดตัว
    const DULLER_LUNGE_MAX_MS = 2600;    // กันพุ่งค้าง ถ้าไปไม่ถึงจุดเสียงพอดี (เช่นโดนของกีดขวาง)
    const DULLER_LUNGE_ARRIVE_DIST = 1.3;
    let dullerLungeTarget = new THREE.Vector3();
    let dullerLungeUntil = 0;
    let smilerLastKnownPos = new THREE.Vector3();
    let smilerSearchUntil = 0;
    let bacteriaLastKnownPos = new THREE.Vector3();
    let bacteriaSearchUntil = 0;
    let dullerLastKnownPos = new THREE.Vector3();
    let dullerSearchUntil = 0;
    let acidManLastKnownPos = new THREE.Vector3();
    let acidManSearchUntil = 0;

    // Acid Man มองเห็นได้เหมือน Smiler/Bacteria (ยิ่งเปิดแฟลชยิ่งเห็นไกลขึ้น)
    const ACIDMAN_BASE_DETECT_RANGE = 24;

    // The Gapped มองเห็นได้เหมือน Smiler/Bacteria/Acid Man (ยิ่งเปิดแฟลชยิ่งเห็นไกลขึ้น)
    const GAPPED_BASE_DETECT_RANGE = 22;
    let gappedLastKnownPos = new THREE.Vector3();
    let gappedSearchUntil = 0;

    // ตัวแปรส่วนกลางสำหรับ Player Controls และ Render Loop
    const MOVE_ACCEL_RATE = 14;
    var smoothMoveFwd = 0, smoothMoveSide = 0;
    var pendingLookDX = 0, pendingLookDY = 0;
    var lookTouchId = null;
    var lastLookX = 0, lastLookY = 0;
    var footstepDist = 0;
    var nextPeripheralGlitchTime = 0;
    var dreadVignetteEl = null, subliminalFlashEl = null, camFlashOverlayEl = null;
    var acidSplashEl = null, gapWarpEl = null, viewportEl = null, hudEl = null;
    var chromaEl = null, peripheralGlitchEl = null, peripheralFigureEl = null, lockerSlitEl = null;
    var staticCanvas = null, staticCtx = null;

