    // -------------------------------------------------------------
    // 2. Sound Engine (นีออนหึ่งอื้ออึง + เสียงชีววิทยา)
    // -------------------------------------------------------------
    window.initAudioContextSafely = function() {
      try {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioClass) return;
        if (!audioCtx) audioCtx = new AudioClass();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        if (!humGain) {
          // --- 1. Fluorescent Light Hum & High Ballast Buzz ---
          const h1 = audioCtx.createOscillator();
          const h2 = audioCtx.createOscillator();
          const h3 = audioCtx.createOscillator();
          h1.type = 'sawtooth'; h1.frequency.value = 60;
          h2.type = 'sine'; h2.frequency.value = 120;
          h3.type = 'sawtooth'; h3.frequency.value = 180;

          fluorHumFilter = audioCtx.createBiquadFilter();
          fluorHumFilter.type = 'lowpass';
          fluorHumFilter.frequency.value = 240;

          humGain = audioCtx.createGain();
          humGain.gain.value = 0.16; // เสียงนีออนหึ่งอื้ออึงพื้นฐาน

          h1.connect(fluorHumFilter); h2.connect(fluorHumFilter); h3.connect(fluorHumFilter);
          fluorHumFilter.connect(humGain); humGain.connect(audioCtx.destination);
          h1.start(); h2.start(); h3.start();

          // High-frequency fluorescent ballast buzz & gas discharge sizzle (2.8kHz - 3.6kHz)
          try {
            fluorBuzzFilter = audioCtx.createBiquadFilter();
            fluorBuzzFilter.type = 'bandpass';
            fluorBuzzFilter.frequency.value = 3100;
            fluorBuzzFilter.Q.value = 2.2;

            const buzzOsc1 = audioCtx.createOscillator();
            buzzOsc1.type = 'sawtooth';
            buzzOsc1.frequency.value = 120;

            const buzzOsc2 = audioCtx.createOscillator();
            buzzOsc2.type = 'sawtooth';
            buzzOsc2.frequency.value = 3600;

            const noiseLength = audioCtx.sampleRate * 2;
            const noiseBuf = audioCtx.createBuffer(1, noiseLength, audioCtx.sampleRate);
            const nData = noiseBuf.getChannelData(0);
            for (let i = 0; i < noiseLength; i++) {
              nData[i] = (Math.random() * 2 - 1) * 0.25;
            }
            const buzzNoise = audioCtx.createBufferSource();
            buzzNoise.buffer = noiseBuf;
            buzzNoise.loop = true;

            fluorBuzzGain = audioCtx.createGain();
            fluorBuzzGain.gain.value = 0.035;

            buzzOsc1.connect(fluorBuzzFilter);
            buzzOsc2.connect(fluorBuzzFilter);
            buzzNoise.connect(fluorBuzzFilter);
            fluorBuzzFilter.connect(fluorBuzzGain);
            fluorBuzzGain.connect(audioCtx.destination);

            buzzOsc1.start();
            buzzOsc2.start();
            buzzNoise.start();
          } catch (eBuzz) {}

          // --- 2. Distant Office Chatter (Ghostly Vocal Murmurs + Echoing Hallway) ---
          try {
            const speechOsc1 = audioCtx.createOscillator();
            speechOsc1.type = 'sawtooth';
            speechOsc1.frequency.value = 116;

            const speechOsc2 = audioCtx.createOscillator();
            speechOsc2.type = 'triangle';
            speechOsc2.frequency.value = 158;

            const speechOsc3 = audioCtx.createOscillator();
            speechOsc3.type = 'sawtooth';
            speechOsc3.frequency.value = 88;

            const pNoiseLen = audioCtx.sampleRate * 3;
            const pNoiseBuf = audioCtx.createBuffer(1, pNoiseLen, audioCtx.sampleRate);
            const pData = pNoiseBuf.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < pNoiseLen; i++) {
              const white = Math.random() * 2 - 1;
              b0 = 0.99886 * b0 + white * 0.0555179;
              b1 = 0.99332 * b1 + white * 0.0750759;
              b2 = 0.96900 * b2 + white * 0.1538520;
              pData[i] = (b0 + b1 + b2) * 0.12;
            }
            const speechNoise = audioCtx.createBufferSource();
            speechNoise.buffer = pNoiseBuf;
            speechNoise.loop = true;

            officeFormant1 = audioCtx.createBiquadFilter();
            officeFormant1.type = 'bandpass';
            officeFormant1.frequency.value = 480;
            officeFormant1.Q.value = 3.6;

            officeFormant2 = audioCtx.createBiquadFilter();
            officeFormant2.type = 'bandpass';
            officeFormant2.frequency.value = 1320;
            officeFormant2.Q.value = 3.2;

            officeChatterLfo = audioCtx.createOscillator();
            officeChatterLfo.type = 'sine';
            officeChatterLfo.frequency.value = 3.0;

            const lfoAmpGain = audioCtx.createGain();
            lfoAmpGain.gain.value = 0.42;

            const syllableVca = audioCtx.createGain();
            syllableVca.gain.value = 0.5;

            officeChatterLfo.connect(lfoAmpGain);
            lfoAmpGain.connect(syllableVca.gain);

            officeChatterFilter = audioCtx.createBiquadFilter();
            officeChatterFilter.type = 'lowpass';
            officeChatterFilter.frequency.value = 560;

            const corridorDelay = audioCtx.createDelay();
            corridorDelay.delayTime.value = 0.14;
            const delayFeedback = audioCtx.createGain();
            delayFeedback.gain.value = 0.26;
            corridorDelay.connect(delayFeedback);
            delayFeedback.connect(corridorDelay);

            officeChatterGain = audioCtx.createGain();
            officeChatterGain.gain.value = 0.06;

            speechOsc1.connect(officeFormant1);
            speechOsc2.connect(officeFormant1);
            speechOsc3.connect(officeFormant1);
            speechNoise.connect(officeFormant1);

            speechOsc1.connect(officeFormant2);
            speechOsc2.connect(officeFormant2);
            speechOsc3.connect(officeFormant2);
            speechNoise.connect(officeFormant2);

            officeFormant1.connect(syllableVca);
            officeFormant2.connect(syllableVca);

            syllableVca.connect(officeChatterFilter);
            officeChatterFilter.connect(officeChatterGain);

            officeChatterFilter.connect(corridorDelay);
            corridorDelay.connect(officeChatterGain);

            officeChatterGain.connect(audioCtx.destination);

            speechOsc1.start();
            speechOsc2.start();
            speechOsc3.start();
            speechNoise.start();
            officeChatterLfo.start();
          } catch (eChatter) {}

          // 1. Smiler
          monsterOsc1 = audioCtx.createOscillator();
          monsterOsc2 = audioCtx.createOscillator();
          monsterOsc1.type = 'sawtooth'; monsterOsc1.frequency.value = 90;
          monsterOsc2.type = 'sawtooth'; monsterOsc2.frequency.value = 94;
          const mf = audioCtx.createBiquadFilter();
          mf.type = 'bandpass'; mf.frequency.value = 450; mf.Q.value = 3.5;
          monsterSoundGain = audioCtx.createGain();
          monsterSoundGain.gain.value = 0.0001;
          monsterOsc1.connect(mf); monsterOsc2.connect(mf);
          mf.connect(monsterSoundGain); monsterSoundGain.connect(audioCtx.destination);
          monsterOsc1.start(); monsterOsc2.start();

          // 2. The Bacteria (เสียงขูดและเสียงโลหะลาก)
          shadowOsc = audioCtx.createOscillator();
          shadowOsc.type = 'sawtooth'; shadowOsc.frequency.value = 36;
          const sf = audioCtx.createBiquadFilter();
          sf.type = 'lowpass'; sf.frequency.value = 90;
          shadowSoundGain = audioCtx.createGain();
          shadowSoundGain.gain.value = 0.0001;
          shadowOsc.connect(sf); sf.connect(shadowSoundGain);
          shadowSoundGain.connect(audioCtx.destination);
          shadowOsc.start();

          // 3. The Duller (เสียงซอยเท้าคลาน)
          dullerOsc = audioCtx.createOscillator();
          dullerOsc.type = 'triangle'; dullerOsc.frequency.value = 140;
          const df = audioCtx.createBiquadFilter();
          df.type = 'bandpass'; df.frequency.value = 280; df.Q.value = 4.0;
          dullerSoundGain = audioCtx.createGain();
          dullerSoundGain.gain.value = 0.0001;
          dullerOsc.connect(df); df.connect(dullerSoundGain);
          dullerSoundGain.connect(audioCtx.destination);
          dullerOsc.start();

          // 4. The Acid Man (เสียงฟู่กัดกร่อนต่ำๆ ตลอดเวลาที่มันไล่ล่า)
          acidOsc = audioCtx.createOscillator();
          acidOsc.type = 'sawtooth'; acidOsc.frequency.value = 100;
          const af = audioCtx.createBiquadFilter();
          af.type = 'bandpass'; af.frequency.value = 500; af.Q.value = 2.2;
          acidSoundGain = audioCtx.createGain();
          acidSoundGain.gain.value = 0.0001;
          acidOsc.connect(af); af.connect(acidSoundGain);
          acidSoundGain.connect(audioCtx.destination);
          acidOsc.start();

          // 5. The Gapped (เสียงหอนต่ำแหบแบบมิติบิดเบี้ยว สั่นเพี้ยนเสียงคู่ ต่างจากตัวอื่นที่เป็นเสียงชีวภาพ)
          gapOsc = audioCtx.createOscillator();
          gapOsc.type = 'sine'; gapOsc.frequency.value = 58;
          const gapOsc2 = audioCtx.createOscillator();
          gapOsc2.type = 'sine'; gapOsc2.frequency.value = 61;
          const gf = audioCtx.createBiquadFilter();
          gf.type = 'lowpass'; gf.frequency.value = 200;
          gapSoundGain = audioCtx.createGain();
          gapSoundGain.gain.value = 0.0001;
          gapOsc.connect(gf); gapOsc2.connect(gf); gf.connect(gapSoundGain);
          gapSoundGain.connect(audioCtx.destination);
          gapOsc.start(); gapOsc2.start();
        }
      } catch (err) {}
    };

    window.addEventListener('pointerdown', () => {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    });

    function playFootstep() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(75, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.1);
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.11);
      } catch(e) {}
    }

    function playHeartbeat(volume = 0.2) {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(95, now);
        osc1.frequency.exponentialRampToValueAtTime(35, now + 0.09);
        gain1.gain.setValueAtTime(volume, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc1.connect(gain1); gain1.connect(audioCtx.destination);
        osc1.start(now); osc1.stop(now + 0.13);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(80, now + 0.18);
        osc2.frequency.exponentialRampToValueAtTime(30, now + 0.27);
        gain2.gain.setValueAtTime(volume * 0.75, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc2.connect(gain2); gain2.connect(audioCtx.destination);
        osc2.start(now + 0.18); osc2.stop(now + 0.31);
      } catch(e) {}
    }

    function playDrinkSound() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.35);
      } catch(e) {}
    }

    function playSprintSound() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.28);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.32);
      } catch(e) {}
    }

    function playGlitchShiftSound() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.35);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.42);
      } catch(e) {}
    }

    // เสียง "ถุ๊ย" ตอน Acid Man ถ่มกรดออกจากปาก — เสียงเปียกๆ สั้นๆ ความถี่ตก
    function playAcidSpitSound() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.2);
      } catch(e) {}
    }

    // เสียง "ฟู่ซ่า" ตอนก้อนกรดกระทบตัวผู้เล่น — เสียงนอยส์กรองความถี่สูงแทนเสียงกัดกร่อน
    function playAcidSizzleSound() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.4, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const hf = audioCtx.createBiquadFilter();
        hf.type = 'highpass'; hf.frequency.value = 1800;
        const nGain = audioCtx.createGain();
        nGain.gain.setValueAtTime(0.35, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        noise.connect(hf); hf.connect(nGain); nGain.connect(audioCtx.destination);
        noise.start(now);

        const thud = audioCtx.createOscillator();
        const thudGain = audioCtx.createGain();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(90, now);
        thud.frequency.exponentialRampToValueAtTime(35, now + 0.2);
        thudGain.gain.setValueAtTime(0.3, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        thud.connect(thudGain); thudGain.connect(audioCtx.destination);
        thud.start(now); thud.stop(now + 0.26);
      } catch(e) {}
    }

    // เสียงตอน The Gapped คว้าจับได้ — เสียงดูด/ฉีกมิติ ความถี่ตกฮวบพร้อมนอยส์ย้อนกลับ (reverse-ish) แทนเสียงกรีดร้องจั๊มสแกร์แบบตัวอื่น
    function playGapPullSound() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;

        // เสียงดูดความถี่ต่ำไล่ลง เหมือนอากาศถูกดูดหายเข้ารอยแยก
        const suck = audioCtx.createOscillator();
        const suckGain = audioCtx.createGain();
        suck.type = 'sine';
        suck.frequency.setValueAtTime(320, now);
        suck.frequency.exponentialRampToValueAtTime(35, now + 0.85);
        suckGain.gain.setValueAtTime(0.001, now);
        suckGain.gain.linearRampToValueAtTime(0.55, now + 0.15);
        suckGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        suck.connect(suckGain); suckGain.connect(audioCtx.destination);
        suck.start(now); suck.stop(now + 0.92);

        // นอยส์กรองแบบ "ลมย้อนเข้า" ความดังไล่ขึ้นก่อนเงียบวูบ (ตรงข้ามกับเสียงระเบิดทั่วไป)
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.75, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / data.length;
          data[i] = (Math.random() * 2 - 1) * t * 0.6; // ค่อยๆ ดังขึ้นแทนที่จะดังทันทีแล้วซาลง
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const nf = audioCtx.createBiquadFilter();
        nf.type = 'bandpass'; nf.frequency.value = 900; nf.Q.value = 1.4;
        const nGain = audioCtx.createGain();
        nGain.gain.setValueAtTime(0.3, now);
        noise.connect(nf); nf.connect(nGain); nGain.connect(audioCtx.destination);
        noise.start(now);

        // เสียงหอนม่วงบิดเบี้ยวสั้นๆ ปิดท้ายตอนวาปตัวหาย
        const tail = audioCtx.createOscillator();
        const tailGain = audioCtx.createGain();
        tail.type = 'triangle';
        tail.frequency.setValueAtTime(140, now + 0.6);
        tail.frequency.exponentialRampToValueAtTime(900, now + 0.95);
        tailGain.gain.setValueAtTime(0.001, now + 0.6);
        tailGain.gain.linearRampToValueAtTime(0.28, now + 0.75);
        tailGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        tail.connect(tailGain); tailGain.connect(audioCtx.destination);
        tail.start(now + 0.6); tail.stop(now + 1.02);
      } catch(e) {}
    }

    // เสียงจัมป์สแกร์สยองขวัญสุดสะพรึง (Kane Pixels Backrooms Entity Roar + Sub-bass Seismic Slam + Blown VHS Audio Tearing)
    function playViolentJumpscareSound() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;

        // 1. Shockwave Transient Impact (กระแทกหูทันทีแบบเสี้ยววินาที 0ms ไม่หน่วง)
        const snapLen = audioCtx.sampleRate * 0.12;
        const snapBuf = audioCtx.createBuffer(1, snapLen, audioCtx.sampleRate);
        const snapData = snapBuf.getChannelData(0);
        for (let i = 0; i < snapLen; i++) {
          snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.02));
        }
        const snapSrc = audioCtx.createBufferSource();
        snapSrc.buffer = snapBuf;
        const snapFilter = audioCtx.createBiquadFilter();
        snapFilter.type = 'highpass';
        snapFilter.frequency.setValueAtTime(1400, now);
        const snapGain = audioCtx.createGain();
        snapGain.gain.setValueAtTime(0.95, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        snapSrc.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(audioCtx.destination);
        snapSrc.start(now);

        // 2. Sub-bass Seismic Slam (กระแทกอก 180Hz ร่วงดิ่งลงสู่ 25Hz สั่นสะเทือนลำโพง)
        const sub = audioCtx.createOscillator();
        const subG = audioCtx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(180, now);
        sub.frequency.exponentialRampToValueAtTime(26, now + 0.85);
        subG.gain.setValueAtTime(0.95, now);
        subG.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        sub.connect(subG); subG.connect(audioCtx.destination);
        sub.start(now); sub.stop(now + 1.25);

        // 3. Kane Pixels Style Screeching Entity Roar (FM Synthesis เสียงหวีดร้องไซเรนผสมกู่ร้องของสิ่งมีชีวิตสายเคเบิล)
        // Modulator 1 -> Carrier 1
        const mod1 = audioCtx.createOscillator();
        const mod1Gain = audioCtx.createGain();
        mod1.type = 'sine';
        mod1.frequency.setValueAtTime(94, now);
        mod1.frequency.linearRampToValueAtTime(142, now + 0.35);
        mod1Gain.gain.setValueAtTime(1200, now);
        mod1Gain.gain.exponentialRampToValueAtTime(250, now + 0.9);
        mod1.connect(mod1Gain);

        const car1 = audioCtx.createOscillator();
        car1.type = 'sawtooth';
        car1.frequency.setValueAtTime(840, now);
        car1.frequency.exponentialRampToValueAtTime(280, now + 0.95);
        mod1Gain.connect(car1.frequency);

        // Modulator 2 -> Carrier 2 (เสียงหวีดแหลมบาดแก้วหู)
        const mod2 = audioCtx.createOscillator();
        const mod2Gain = audioCtx.createGain();
        mod2.type = 'square';
        mod2.frequency.setValueAtTime(136, now);
        mod2Gain.gain.setValueAtTime(1800, now);
        mod2Gain.gain.exponentialRampToValueAtTime(300, now + 0.7);
        mod2.connect(mod2Gain);

        const car2 = audioCtx.createOscillator();
        car2.type = 'sawtooth';
        car2.frequency.setValueAtTime(1480, now);
        car2.frequency.exponentialRampToValueAtTime(420, now + 0.8);
        mod2Gain.connect(car2.frequency);

        // Sub-growl Voice (เสียงคำรามขู่ลึกในลำคอ)
        const growlOsc = audioCtx.createOscillator();
        growlOsc.type = 'sawtooth';
        growlOsc.frequency.setValueAtTime(115, now);
        growlOsc.frequency.exponentialRampToValueAtTime(48, now + 1.1);

        // WaveShaper Overdrive Distortion (บิดเสียงให้แตกพร่าแบบไมค์กล้อง VHS โดนกระแทกแตก)
        const shaper = audioCtx.createWaveShaper();
        const curve = new Float32Array(512);
        for (let i = 0; i < 512; i++) {
          const x = (i / 511) * 2 - 1;
          curve[i] = Math.tanh(x * 9) * 0.85 + Math.sin(x * Math.PI) * 0.15;
        }
        shaper.curve = curve;
        shaper.oversample = '2x';

        // Stutter Chopper LFO (สั่นกระตุกถี่ 32Hz เหมือนสัญญาณเทปขาด)
        const chopLfo = audioCtx.createOscillator();
        chopLfo.type = 'square';
        chopLfo.frequency.setValueAtTime(32, now);
        chopLfo.frequency.linearRampToValueAtTime(14, now + 0.9);
        const chopDepth = audioCtx.createGain();
        chopDepth.gain.setValueAtTime(0.35, now);
        chopLfo.connect(chopDepth);

        const screamMix = audioCtx.createGain();
        screamMix.gain.setValueAtTime(0.75, now);
        screamMix.gain.exponentialRampToValueAtTime(0.001, now + 1.35);
        chopDepth.connect(screamMix.gain);

        car1.connect(shaper);
        car2.connect(shaper);
        growlOsc.connect(shaper);
        shaper.connect(screamMix);
        screamMix.connect(audioCtx.destination);

        mod1.start(now); mod1.stop(now + 1.4);
        car1.start(now); car1.stop(now + 1.4);
        mod2.start(now); mod2.stop(now + 1.4);
        car2.start(now); car2.stop(now + 1.4);
        growlOsc.start(now); growlOsc.stop(now + 1.4);
        chopLfo.start(now); chopLfo.stop(now + 1.4);

        // 4. Broken Microphone Static Blast (เสียงซ่าคลื่นแทรกระเบิดแตก)
        const noiseLen = audioCtx.sampleRate * 0.9;
        const nBuf = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
        const nData = nBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
          nData[i] = (Math.random() * 2 - 1) * (1 - (i / noiseLen) * 0.7);
        }
        const noiseSrc = audioCtx.createBufferSource();
        noiseSrc.buffer = nBuf;
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2600, now);
        noiseFilter.Q.setValueAtTime(1.8, now);
        const noiseG = audioCtx.createGain();
        noiseG.gain.setValueAtTime(0.7, now);
        noiseG.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseG);
        noiseG.connect(audioCtx.destination);
        noiseSrc.start(now);
      } catch(e) {}
    }

    // เสียงหึ่งความถี่ต่ำแบบ "liminal space" เปิดครั้งเดียวตอนไฟดับครั้งแรก แล้วค่อยๆ ไล่ระดับขึ้นแผ่วๆ
    // ผสมกับเสียงนีออนหึ่งเดิม (humGain) ให้บรรยากาศรู้สึกอึดอัด/ผิดที่ผิดทางกว่าตอนเป็นออฟฟิศปกติ
    function startLiminalHum() {
      try {
        if (liminalHumStarted || !audioCtx) return;
        liminalHumStarted = true;
        liminalHumOsc = audioCtx.createOscillator();
        liminalHumOsc.type = 'sine';
        liminalHumOsc.frequency.value = 48;
        const lf = audioCtx.createBiquadFilter();
        lf.type = 'lowpass'; lf.frequency.value = 120;
        liminalHumGain = audioCtx.createGain();
        liminalHumGain.gain.value = 0.0001;
        liminalHumOsc.connect(lf); lf.connect(liminalHumGain); liminalHumGain.connect(audioCtx.destination);
        liminalHumOsc.start();
        liminalHumGain.gain.linearRampToValueAtTime(0.10, audioCtx.currentTime + 4);
      } catch (e) {}
    }

    // -------------------------------------------------------------
    // Procedural Distant Office SFX (Keyboard Clatter & Phone Ring)
    // -------------------------------------------------------------
    let lastVowelShiftTime = 0;
    let nextTypingClusterTime = performance.now() + 2500;
    let typingClusterRemaining = 0;
    let nextKeystrokeTime = 0;
    let nextPhoneRingTime = performance.now() + 14000;

    function playDistantKeyboardClick(chaseIntensity = 0) {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        const dur = 0.012 + Math.random() * 0.008;
        const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * dur), audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
        }
        const src = audioCtx.createBufferSource();
        src.buffer = buf;

        const kFilter = audioCtx.createBiquadFilter();
        kFilter.type = 'bandpass';
        kFilter.frequency.value = 2400 + Math.random() * 800;
        kFilter.Q.value = 3.0;

        const kGain = audioCtx.createGain();
        const baseVol = 0.035 + chaseIntensity * 0.09;
        kGain.gain.setValueAtTime(baseVol, now);
        kGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        src.connect(kFilter);
        kFilter.connect(kGain);
        kGain.connect(audioCtx.destination);
        src.start(now);
      } catch (e) {}
    }

    function playDistantPhoneRing(chaseIntensity = 0) {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        const now = audioCtx.currentTime;
        const o1 = audioCtx.createOscillator();
        const o2 = audioCtx.createOscillator();
        o1.type = 'sine'; o1.frequency.value = 440;
        o2.type = 'sine'; o2.frequency.value = 480;

        if (chaseIntensity > 0.4) {
          o1.frequency.setValueAtTime(440 + (chaseIntensity * 35), now);
          o2.frequency.setValueAtTime(480 + (chaseIntensity * 40), now);
        }

        const pFilter = audioCtx.createBiquadFilter();
        pFilter.type = 'bandpass';
        pFilter.frequency.value = 1150;
        pFilter.Q.value = 2.8;

        const pGain = audioCtx.createGain();
        const ringVol = 0.03 + chaseIntensity * 0.06;
        pGain.gain.setValueAtTime(0.0001, now);
        pGain.gain.linearRampToValueAtTime(ringVol, now + 0.05);
        pGain.gain.setValueAtTime(ringVol, now + 0.35);
        pGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

        o1.connect(pFilter);
        o2.connect(pFilter);
        pFilter.connect(pGain);
        pGain.connect(audioCtx.destination);

        o1.start(now);
        o2.start(now);
        o1.stop(now + 0.6);
        o2.stop(now + 0.6);
      } catch (e) {}
    }

    function updateOfficeProceduralAudio(dt, chaseIntensity, timeNowMs) {
      // 1. Dynamic Vowel Formant Shifting (eerie phantom speech vowel changes)
      if (officeFormant1 && officeFormant2 && audioCtx && audioCtx.state === 'running') {
        if (timeNowMs > lastVowelShiftTime) {
          const shiftInterval = Math.max(800, 2400 - chaseIntensity * 1600);
          lastVowelShiftTime = timeNowMs + shiftInterval;

          const vowels = [
            { f1: 320, f2: 1700 }, // 'ee'
            { f1: 490, f2: 1350 }, // 'eh'
            { f1: 680, f2: 1100 }, // 'ah'
            { f1: 510, f2: 890 },  // 'oh'
            { f1: 360, f2: 780 }   // 'oo'
          ];
          const v = vowels[Math.floor(Math.random() * vowels.length)];
          const rampSpeed = Math.max(0.15, 0.4 - chaseIntensity * 0.25);
          officeFormant1.frequency.setTargetAtTime(v.f1, audioCtx.currentTime, rampSpeed);
          officeFormant2.frequency.setTargetAtTime(v.f2, audioCtx.currentTime, rampSpeed);
        }
      }

      // 2. Keyboard typing in the distance
      if (timeNowMs > nextTypingClusterTime && typingClusterRemaining <= 0) {
        if (chaseIntensity > 0.4) {
          typingClusterRemaining = 12 + Math.floor(Math.random() * 16);
          nextTypingClusterTime = timeNowMs + 1200 + Math.random() * 2000;
        } else {
          typingClusterRemaining = 3 + Math.floor(Math.random() * 6);
          nextTypingClusterTime = timeNowMs + 4500 + Math.random() * 8000;
        }
        nextKeystrokeTime = timeNowMs;
      }

      if (typingClusterRemaining > 0 && timeNowMs > nextKeystrokeTime) {
        playDistantKeyboardClick(chaseIntensity);
        typingClusterRemaining--;
        const strokeDelay = (chaseIntensity > 0.4)
          ? 55 + Math.random() * 45
          : 110 + Math.random() * 160;
        nextKeystrokeTime = timeNowMs + strokeDelay;
      }

      // 3. Distant Telephone Ringing
      if (timeNowMs > nextPhoneRingTime) {
        playDistantPhoneRing(chaseIntensity);
        setTimeout(() => {
          playDistantPhoneRing(chaseIntensity);
        }, 750);

        const nextInterval = (chaseIntensity > 0.4)
          ? 10000 + Math.random() * 8000
          : 22000 + Math.random() * 25000;
        nextPhoneRingTime = timeNowMs + nextInterval;
      }
    }

    // -------------------------------------------------------------
    // Ambient Chase Intensification Master Controller
    // Called each frame from render loop
    // -------------------------------------------------------------
    window.updateAmbientChaseAudio = function(dt, isChased, closestDist, isBlackout, isMuted) {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const perfNow = performance.now();

      if (isMuted) {
        if (humGain) humGain.gain.setTargetAtTime(0.0001, now, 0.2);
        if (fluorBuzzGain) fluorBuzzGain.gain.setTargetAtTime(0.0001, now, 0.2);
        if (officeChatterGain) officeChatterGain.gain.setTargetAtTime(0.0001, now, 0.2);
        return;
      }

      // Calculate target chase intensity (0.0 = calm ambient, 1.0 = full panic chase)
      let targetIntensity = 0;
      if (isChased) {
        const prox = Math.max(0, 1 - Math.min(closestDist, 24) / 24);
        targetIntensity = Math.min(1.0, 0.45 + prox * 0.55);
      } else if (closestDist < 14) {
        targetIntensity = Math.max(0, 1 - closestDist / 14) * 0.35;
      }

      // Smooth lerp: fast attack when chase starts, gradual decay when safe
      if (targetIntensity > currentChaseIntensity) {
        currentChaseIntensity = Math.min(1.0, currentChaseIntensity + dt * 2.4);
      } else {
        currentChaseIntensity = Math.max(0, currentChaseIntensity - dt * 0.7);
      }

      // 1. Fluorescent Light Hum & Buzz Reaction
      if (isBlackout) {
        if (humGain) humGain.gain.setTargetAtTime(0.015, now, 0.1);
        if (fluorBuzzGain) fluorBuzzGain.gain.setTargetAtTime(0.001, now, 0.1);
        if (fluorHumFilter) fluorHumFilter.frequency.setTargetAtTime(140, now, 0.1);
      } else {
        // Hum volume: 0.16 -> 0.42
        const targetHumVol = 0.16 + currentChaseIntensity * 0.26;
        // Filter opens up to expose harsh saw harmonics: 240Hz -> 880Hz
        const targetHumCutoff = 240 + currentChaseIntensity * 640;
        // High ballast buzz: 0.035 -> 0.18
        const targetBuzzVol = 0.035 + currentChaseIntensity * 0.145;

        if (humGain) humGain.gain.setTargetAtTime(targetHumVol, now, 0.08);
        if (fluorHumFilter) fluorHumFilter.frequency.setTargetAtTime(targetHumCutoff, now, 0.08);

        if (fluorBuzzGain) {
          const jitter = (currentChaseIntensity > 0.35) ? (Math.random() - 0.5) * 0.025 : 0;
          fluorBuzzGain.gain.setTargetAtTime(Math.max(0.001, targetBuzzVol + jitter), now, 0.06);
        }
      }

      // 2. Distant Office Chatter Reaction
      if (officeChatterGain) {
        // Chatter volume: 0.06 (quiet background murmur) -> 0.32 (loud, pressing whispers & murmurs!)
        const targetChatterVol = 0.06 + currentChaseIntensity * 0.26;
        officeChatterGain.gain.setTargetAtTime(targetChatterVol, now, 0.1);
      }

      if (officeChatterFilter) {
        // Filter opens up: 560Hz (muffled down hallway) -> 1750Hz (sharp, right behind walls/ears!)
        const targetChatterCutoff = 560 + currentChaseIntensity * 1190;
        officeChatterFilter.frequency.setTargetAtTime(targetChatterCutoff, now, 0.1);
      }

      if (officeChatterLfo) {
        // Speech rhythm accelerates from ~3.0 syllables/sec to ~8.5 syllables/sec
        const targetSyllableRate = 3.0 + currentChaseIntensity * 5.5;
        officeChatterLfo.frequency.setTargetAtTime(targetSyllableRate, now, 0.15);
      }

      // Procedural events: typing clatter, phone ring, vowel formants
      updateOfficeProceduralAudio(dt, currentChaseIntensity, perfNow);
    };

    // =============================================================
    // ACT 2 AUDIO: TRANSITION, COMBAT, GUNSHOT, ANCHOR & TINNITUS
    // =============================================================

    window.playToneTransitionAudio = function(tone) {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;

      if (tone === 'CALM') {
        // เสียงฝนตกกระทบกระจกรถสายตรวจ และเสียงความถี่ต่ำสงัด
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 2.0);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 2.5);
      } else if (tone === 'VIOLENT') {
        // เสียงวิทยุตำรวจซ่าช็อต และเบสกระแทกหู
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.4);
      } else if (tone === 'DEEP') {
        // เสียงฮึ่มของมิติที่ยุบตัวลึกลงไป
        const sub = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(32, now);
        subGain.gain.setValueAtTime(0.25, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);
        sub.connect(subGain);
        subGain.connect(audioCtx.destination);
        sub.start(now);
        sub.stop(now + 3.0);
      }
    };

    window.playWeaponSwingSound = function(type) {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = (type === 'stapler' || type === 'office_chair') ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    };

    window.playCombatHitSound = function(weaponType, entityType) {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;

      // เสียงกระทบทางชีวภาพ (ทึบ หนักแน่น ไม่ใช่ SFX เกมแอ็กชันอาเขต)
      const hitOsc = audioCtx.createOscillator();
      const hitGain = audioCtx.createGain();
      hitOsc.type = 'triangle';
      hitOsc.frequency.setValueAtTime(95, now);
      hitOsc.frequency.exponentialRampToValueAtTime(30, now + 0.22);

      hitGain.gain.setValueAtTime(0.4, now);
      hitGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      hitOsc.connect(hitGain);
      hitGain.connect(audioCtx.destination);
      hitOsc.start(now);
      hitOsc.stop(now + 0.25);
    };

    window.playWhiffThroughSound = function() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.28);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    };

    window.playGunshotSound = function() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;

      // เสียงปืนพกลั่นสะท้อนก้องทั่วโถงออฟฟิศ
      const gunOsc = audioCtx.createOscillator();
      const gunGain = audioCtx.createGain();
      gunOsc.type = 'sawtooth';
      gunOsc.frequency.setValueAtTime(380, now);
      gunOsc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

      gunGain.gain.setValueAtTime(0.85, now);
      gunGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      gunOsc.connect(gunGain);
      gunGain.connect(audioCtx.destination);
      gunOsc.start(now);
      gunOsc.stop(now + 0.7);
    };

    window.playGunDryClick = function() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    };

    window.playEntityFleeSound = function(type) {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime( type === 'bacteria' ? 70 : 130, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    };

    window.playGlassShatterSound = function() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    };

    window.playWeaponBreakSound = function() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    };

    window.playAnchorSound = function() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      // เสียงกระดิ่ง/เหรียญกระทบเบาๆ และความถี่อบอุ่น
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.8);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    };

    window.playHealSound = function() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(390, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    };

    window.playBottleCrashSound = function() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    };

    window.playTinnitusRinging = function() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4200, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 3.2);
    };

    window.playViolentJumpscareSound = playViolentJumpscareSound;
    window.playDrinkSound = playDrinkSound;
    window.playSprintSound = playSprintSound;
    window.playGlitchShiftSound = playGlitchShiftSound;
    window.playFootstep = playFootstep;
    window.playHeartbeat = playHeartbeat;
    window.playAcidSpitSound = playAcidSpitSound;
    window.playAcidSizzleSound = playAcidSizzleSound;
    window.playGapPullSound = playGapPullSound;

