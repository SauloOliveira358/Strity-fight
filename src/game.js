// Streaty Fight 2: Turbo Brasil - Upgraded Dual-Special, Prop & Confirmation Engine
(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const GROUND_Y = 548;

  // Preload full-body fighter sprites & real prop images
  const spriteImages = {};
  window.FIGHTERS.forEach(f => {
    const img = new Image();
    img.src = f.sprite;
    spriteImages[f.id] = img;
  });

  const propImages = {};
  ['cachaca51', 'escavadeira', 'chicote', 'passatempo', 'gpu', 'claudinho', 'moto_xre'].forEach(name => {
    const img = new Image();
    img.src = `assets/props/${name}.png`;
    propImages[name] = img;
  });

  // --- Screen & Selection State ---
  let gameMode = 'arcade';
  let p1Index = 0;
  let p2Index = 4;
  let p1Confirmed = false;
  let p2Confirmed = false;
  let selectTurn = 1;
  let arcadeQueue = [];
  let arcadeStageIdx = 0;

  const screens = {
    title: document.getElementById('screen-title'),
    select: document.getElementById('screen-select'),
    vs: document.getElementById('screen-vs'),
    fight: document.getElementById('screen-fight')
  };

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // Title Parade
  const titleParade = document.getElementById('title-parade');
  window.FIGHTERS.forEach(f => {
    const img = document.createElement('img');
    img.src = f.sprite;
    img.alt = f.name;
    img.title = `${f.name} — ${f.specialName}`;
    img.addEventListener('click', () => {
      SFX.init();
      SFX.playVoice(f.voices.select);
    });
    titleParade.appendChild(img);
  });

  // Top Bar Controls
  const btnMusic = document.getElementById('btn-music');
  const btnMute = document.getElementById('btn-mute');
  document.getElementById('btn-home').addEventListener('click', () => {
    stopFightLoop();
    SFX.stopMusic();
    showScreen('title');
  });

  btnMusic.addEventListener('click', () => {
    SFX.init();
    const on = SFX.toggleMusic();
    btnMusic.textContent = on ? '🎵 MÚSICA: ON' : '🎵 MÚSICA: OFF';
    btnMusic.classList.toggle('active', on);
  });

  btnMute.addEventListener('click', () => {
    SFX.init();
    const muted = SFX.toggleMute();
    btnMute.textContent = muted ? '🔇 SOM: OFF' : '🔊 SOM: ON';
    btnMute.classList.toggle('active', !muted);
  });

  // Mode Selection
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      SFX.init();
      SFX.playSelectConfirm();
      gameMode = card.dataset.mode;
      p1Confirmed = false;
      p2Confirmed = false;
      selectTurn = 1;
      if (gameMode === 'arcade') {
        p2Index = (p1Index + 1) % window.FIGHTERS.length;
      }
      openCharacterSelect();
    });
  });

  // --- Character Select with Confirmation Flow ---
  const rosterGrid = document.getElementById('roster-grid');
  const selectHint = document.getElementById('select-hint');
  const p2Tag = document.getElementById('p2-tag');
  const btnConfirmP1 = document.getElementById('btn-confirm-p1');
  const btnConfirmP2 = document.getElementById('btn-confirm-p2');
  const btnStartFight = document.getElementById('btn-start-fight');
  const p1Podium = document.getElementById('p1-podium');
  const p2Podium = document.getElementById('p2-podium');

  function openCharacterSelect() {
    showScreen('select');
    SFX.startMusic('select');
    SFX.playVoice('announcer_select');
    p1Confirmed = false;
    p2Confirmed = gameMode === 'arcade';
    selectTurn = 1;
    p2Tag.textContent = gameMode === 'arcade' ? 'PRÓXIMO RIVAL' : (gameMode === 'versus' ? 'PLAYER 2' : 'CPU RIVAL');
    btnConfirmP2.style.display = gameMode === 'arcade' ? 'none' : 'block';
    updateSelectUI();
  }

  function updateSelectUI() {
    p1Podium.classList.toggle('confirmed', p1Confirmed);
    p2Podium.classList.toggle('confirmed', p2Confirmed && gameMode !== 'arcade');

    btnConfirmP1.textContent = p1Confirmed ? '↩️ TROCAR P1' : '✅ CONFIRMAR P1';
    btnConfirmP1.classList.toggle('locked', p1Confirmed);

    const p2Label = gameMode === 'versus' ? 'P2' : 'RIVAL';
    btnConfirmP2.textContent = p2Confirmed ? `↩️ TROCAR ${p2Label}` : `✅ CONFIRMAR ${p2Label}`;
    btnConfirmP2.classList.toggle('locked', p2Confirmed);

    const ready = p1Confirmed && (gameMode === 'arcade' || p2Confirmed);
    btnStartFight.disabled = !ready;
    btnStartFight.textContent = ready ? '⚡ PARTIU LUTA! ⚡' : '⚡ CONFIRME OS LUTADORES! ⚡';

    if (gameMode === 'arcade') {
      selectHint.textContent = p1Confirmed
        ? 'LUTADOR CONFIRMADO! CLIQUE EM PARTIU LUTA!'
        : 'ESCOLHA NA FOTO E CLIQUE "✅ CONFIRMAR P1" (OU DUPLO-CLIQUE)!';
    } else if (!p1Confirmed) {
      selectHint.textContent = 'PASSO 1: ESCOLHA O PLAYER 1 E CLIQUE "✅ CONFIRMAR P1"!';
    } else if (!p2Confirmed) {
      selectHint.textContent = `PASSO 2: ESCOLHA O ${p2Label} E CLIQUE "✅ CONFIRMAR ${p2Label}"!`;
    } else {
      selectHint.textContent = 'TUDO CONFIRMADO! CLIQUE "⚡ PARTIU LUTA! ⚡"!';
    }

    renderRoster();
    renderPodiums();
  }

  btnConfirmP1.addEventListener('click', () => {
    SFX.init();
    p1Confirmed = !p1Confirmed;
    if (p1Confirmed) {
      SFX.playSelectConfirm();
      SFX.playVoice('announcer_confirm');
      if (gameMode !== 'arcade' && !p2Confirmed) selectTurn = 2;
    } else {
      SFX.playSelectMove();
      selectTurn = 1;
    }
    updateSelectUI();
  });

  btnConfirmP2.addEventListener('click', () => {
    if (gameMode === 'arcade') return;
    SFX.init();
    p2Confirmed = !p2Confirmed;
    if (p2Confirmed) {
      SFX.playSelectConfirm();
      SFX.playVoice('announcer_confirm');
      selectTurn = 1;
    } else {
      SFX.playSelectMove();
      selectTurn = 2;
    }
    updateSelectUI();
  });

  function renderRoster() {
    rosterGrid.innerHTML = '';
    window.FIGHTERS.forEach((f, idx) => {
      const slot = document.createElement('div');
      slot.className = 'roster-slot';
      if (idx === p1Index) slot.classList.add('sel-p1');
      if (idx === p2Index) slot.classList.add('sel-p2');

      const img = document.createElement('img');
      img.src = f.photo;
      img.alt = f.name;
      slot.appendChild(img);

      const label = document.createElement('div');
      label.className = 'slot-name';
      label.textContent = f.shortName;
      slot.appendChild(label);

      if (idx === p1Index) {
        const b1 = document.createElement('span');
        b1.className = 'slot-badge badge-p1';
        b1.textContent = p1Confirmed ? 'P1 ✔' : 'P1';
        slot.appendChild(b1);
      }
      if (idx === p2Index) {
        const b2 = document.createElement('span');
        b2.className = 'slot-badge badge-p2';
        const base = gameMode === 'versus' ? 'P2' : 'CPU';
        b2.textContent = (p2Confirmed && gameMode !== 'arcade') ? `${base} ✔` : base;
        slot.appendChild(b2);
      }

      slot.addEventListener('mouseenter', () => {
        SFX.playSelectMove();
        if (!p1Confirmed && selectTurn === 1) {
          renderSinglePodium('p1', f);
        } else if (gameMode !== 'arcade' && !p2Confirmed && selectTurn === 2) {
          renderSinglePodium('p2', f);
        }
      });

      slot.addEventListener('click', () => {
        SFX.init();
        SFX.playSelectMove();
        SFX.playVoice(f.voices.select);
        if (gameMode === 'arcade') {
          p1Index = idx;
          p2Index = (idx + 1) % window.FIGHTERS.length;
        } else if (selectTurn === 1 && !p1Confirmed) {
          p1Index = idx;
        } else if (selectTurn === 2 && !p2Confirmed) {
          p2Index = idx;
        } else if (!p1Confirmed) {
          p1Index = idx;
        } else if (!p2Confirmed) {
          p2Index = idx;
        }
        updateSelectUI();
      });

      slot.addEventListener('dblclick', () => {
        SFX.init();
        if (gameMode === 'arcade') {
          p1Index = idx;
          p2Index = (idx + 1) % window.FIGHTERS.length;
          p1Confirmed = true;
          SFX.playSelectConfirm();
          SFX.playVoice('announcer_confirm');
        } else if (!p1Confirmed) {
          p1Index = idx;
          p1Confirmed = true;
          selectTurn = 2;
          SFX.playSelectConfirm();
          SFX.playVoice('announcer_confirm');
        } else if (!p2Confirmed) {
          p2Index = idx;
          p2Confirmed = true;
          SFX.playSelectConfirm();
          SFX.playVoice('announcer_confirm');
        }
        updateSelectUI();
      });

      rosterGrid.appendChild(slot);
    });
  }

  function renderSinglePodium(side, f) {
    const prev = document.getElementById(`${side}-preview`);
    const meta = document.getElementById(`${side}-meta`);
    prev.innerHTML = `<img src="${f.sprite}" alt="${f.name}" />`;
    meta.innerHTML = `
      <h3>${f.name}</h3>
      <div class="sub">${f.subtitle}</div>
      <div class="stat-row"><span>FORÇA</span><div class="stat-bar"><i style="width:${f.stats.forca}%"></i></div></div>
      <div class="stat-row"><span>VELOCIDADE</span><div class="stat-bar"><i style="width:${f.stats.velocidade}%"></i></div></div>
      <div class="stat-row"><span>ESPECIAL</span><div class="stat-bar"><i style="width:${f.stats.especial}%"></i></div></div>
      <div class="special-box">
        <strong>⚡ 1: ${f.specialName}</strong>${f.specialDesc}
        <strong style="margin-top:4px; color:#38bdf8;">🔥 2: ${f.special2Name}</strong>${f.special2Desc}
      </div>
    `;
  }

  function renderPodiums() {
    renderSinglePodium('p1', window.FIGHTERS[p1Index]);
    renderSinglePodium('p2', window.FIGHTERS[p2Index]);
  }

  btnStartFight.addEventListener('click', () => {
    if (btnStartFight.disabled) return;
    SFX.init();
    SFX.playSelectConfirm();
    if (gameMode === 'arcade') {
      arcadeQueue = window.FIGHTERS.map((_, i) => i).filter(i => i !== p1Index);
      arcadeStageIdx = 0;
      p2Index = arcadeQueue[0];
    }
    startVsAndMatch();
  });

  // --- VS Splash ---
  function startVsAndMatch() {
    const f1 = window.FIGHTERS[p1Index];
    const f2 = window.FIGHTERS[p2Index];
    document.getElementById('vs-p1').innerHTML = `<img src="${f1.sprite}" /><h2>${f1.name}</h2><p style="color:#38bdf8">${f1.subtitle}</p>`;
    document.getElementById('vs-p2').innerHTML = `<img src="${f2.sprite}" /><h2>${f2.name}</h2><p style="color:#ef4444">${f2.subtitle}</p>`;
    showScreen('vs');
    SFX.stopMusic();
    SFX.tone(220, 440, 0.35, 'sawtooth', 0.2);

    setTimeout(() => {
      beginMatch();
    }, 1800);
  }

  // --- Combat State & Double-Tap Dash Detection ---
  let animId = null;
  let matchState = null;
  const keys = {};
  const lastKeyTime = {};

  window.addEventListener('keydown', e => {
    const code = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code) && screens.fight.classList.contains('active')) {
      e.preventDefault();
    }
    if (!e.repeat) {
      const now = performance.now();
      const prev = lastKeyTime[code] || 0;
      if (matchState && matchState.phase === 'fight' && now - prev < 240) {
        if (code === 'KeyA') triggerDash(matchState.p1, -1);
        if (code === 'KeyD') triggerDash(matchState.p1, 1);
        if (gameMode === 'versus' && code === 'ArrowLeft') triggerDash(matchState.p2, -1);
        if (gameMode === 'versus' && code === 'ArrowRight') triggerDash(matchState.p2, 1);
      }
      lastKeyTime[code] = now;
    }

    if (code === 'Enter' && screens.select.classList.contains('active')) {
      if (!p1Confirmed) btnConfirmP1.click();
      else if (gameMode !== 'arcade' && !p2Confirmed) btnConfirmP2.click();
      else if (!btnStartFight.disabled) btnStartFight.click();
    }

    keys[code] = true;
    if (matchState && matchState.phase === 'fight' && !e.repeat) {
      handlePressInput(code);
    }
  });

  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  function stopFightLoop() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function createFighterInstance(def, side) {
    return {
      def,
      side,
      x: side === 'p1' ? 270 : W - 270,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      facing: side === 'p1' ? 1 : -1,
      hp: 100,
      maxHp: 100,
      superMeter: 100,
      wins: 0,
      state: 'idle', // 'idle' | 'walk' | 'dash' | 'crouch' | 'jump' | 'basic1' | 'basic2' | 'special' | 'special2' | 'hurt' | 'fallen' | 'ko' | 'win'
      stateTimer: 0,
      attackHitDone: false,
      stunTimer: 0,
      hitFlash: 0,
      comboCount: 0,
      comboResetTimer: 0,
      bsodTimer: 0,
      aiCooldown: 20,
      bobPhase: side === 'p1' ? 0 : Math.PI,
      ghosts: []
    };
  }

  function beginMatch() {
    const f1Def = window.FIGHTERS[p1Index];
    const f2Def = window.FIGHTERS[p2Index];
    document.getElementById('victory-modal').classList.remove('active');
    document.getElementById('p2-controls-hint').style.opacity = gameMode === 'versus' ? '1' : '0.45';

    document.getElementById('hud-p1-img').src = f1Def.photo;
    document.getElementById('hud-p1-name').textContent = f1Def.shortName;
    document.getElementById('hud-p2-img').src = f2Def.photo;
    document.getElementById('hud-p2-name').textContent = f2Def.shortName;

    matchState = {
      round: 1,
      stageId: (p1Index + p2Index) % 3,
      p1: createFighterInstance(f1Def, 'p1'),
      p2: createFighterInstance(f2Def, 'p2'),
      timer: 99,
      timerTicks: 0,
      phase: 'intro',
      phaseTimer: 100,
      bannerText: 'ROUND 1',
      subBannerText: 'QUEBRA O PAU!',
      hitStop: 0,
      shake: 0,
      projectiles: [],
      summons: [],
      particles: [],
      popups: []
    };

    showScreen('fight');
    SFX.startMusic('battle');
    SFX.playVoice('announcer_r1');
    updateHud();

    stopFightLoop();
    let lastTime = performance.now();
    const step = (now) => {
      const dt = Math.min(2, (now - lastTime) / 16.6667);
      lastTime = now;
      updateMatch(dt);
      renderMatch();
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
  }

  function startNextRound() {
    matchState.round++;
    const p1Wins = matchState.p1.wins;
    const p2Wins = matchState.p2.wins;
    matchState.p1 = createFighterInstance(matchState.p1.def, 'p1');
    matchState.p2 = createFighterInstance(matchState.p2.def, 'p2');
    matchState.p1.wins = p1Wins;
    matchState.p2.wins = p2Wins;
    matchState.timer = 99;
    matchState.timerTicks = 0;
    matchState.projectiles = [];
    matchState.summons = [];
    matchState.particles = [];
    matchState.popups = [];
    matchState.phase = 'intro';
    matchState.phaseTimer = 100;

    if (matchState.round === 2) {
      matchState.bannerText = 'ROUND 2';
      SFX.playVoice('announcer_r2');
    } else {
      matchState.bannerText = 'ROUND FINAL';
      SFX.playVoice('announcer_rf');
    }
    matchState.subBannerText = 'LUTA!!';
    updateHud();
  }

  function handlePressInput(code) {
    const { p1, p2 } = matchState;
    if (code === 'KeyF') triggerBasic(p1, p2, 1);
    if (code === 'KeyG') triggerBasic(p1, p2, 2);
    if (code === 'KeyH') triggerSpecial(p1, p2, 1);
    if (code === 'KeyJ') triggerSpecial(p1, p2, 2);
    if (code === 'KeyW') triggerJump(p1);

    if (gameMode === 'versus') {
      if (code === 'KeyK') triggerBasic(p2, p1, 1);
      if (code === 'KeyL') triggerBasic(p2, p1, 2);
      if (code === 'KeyP') triggerSpecial(p2, p1, 1);
      if (code === 'KeyO') triggerSpecial(p2, p1, 2);
      if (code === 'ArrowUp') triggerJump(p2);
    }
  }

  function triggerDash(f, dir) {
    if (['hurt', 'fallen', 'ko', 'special', 'special2', 'win'].includes(f.state) || f.stunTimer > 0) return;
    f.state = 'dash';
    f.stateTimer = 12;
    f.vx = dir * 13.5;
    SFX.playDash();
    for (let i = 0; i < 6; i++) {
      spawnParticle(f.x - dir * 20, GROUND_Y - 10, -dir * (2 + Math.random() * 3), -Math.random() * 2, '#cbd5e1', 6);
    }
  }

  function triggerJump(f) {
    if (f.y >= GROUND_Y - 1 && ['idle', 'walk', 'crouch', 'dash'].includes(f.state) && f.stunTimer <= 0) {
      f.vy = f.def.jumpVel;
      f.state = 'jump';
      SFX.playJump();
    }
  }

  function triggerBasic(f, opp, slot) {
    if (['hurt', 'fallen', 'ko', 'special', 'special2', 'win'].includes(f.state) || f.stunTimer > 0) return;
    if (f.state === 'basic1' || f.state === 'basic2') return;

    const id = f.def.id;
    f.state = slot === 1 ? 'basic1' : 'basic2';
    f.stateTimer = slot === 1 ? 16 : 23;
    f.attackHitDone = false;

    // Signature basic moves!
    if (id === 'larissa') {
      // Larissa dá chicotadas nos ataques básicos!
      f.stateTimer = slot === 1 ? 20 : 25;
      SFX.playWhipCrack();
      f.vx = f.facing * 3.0;
    } else if (id === 'kamile' && slot === 2) {
      // Kamile pega e faz ataque de cabelo espichando!
      f.stateTimer = 26;
      SFX.playHairStretch();
      f.vx = f.facing * 2.5;
      spawnPopup(f.x, f.y - 235, 'CHICOTE DE CABELO!', '#f472b6', 15);
    } else if (id === 'saulo' && slot === 2) {
      // Saulo joga a bolacha Passatempo!
      f.attackHitDone = true;
      SFX.playBiscuitWhoosh();
      spawnPopup(f.x, f.y - 235, 'PASSATEMPO!', '#fde047', 15);
      matchState.projectiles.push({
        kind: 'passatempo',
        owner: f.side,
        x: f.x + f.facing * 52,
        y: f.y - 145,
        vx: f.facing * 11.5,
        vy: -1.5,
        gravity: 0.1,
        w: 54,
        h: 54,
        dmg: 10,
        life: 85,
        rot: 0,
        spin: f.facing * 0.36
      });
    } else if (id === 'alexandre' && slot === 2) {
      // Alexandre arremessa uma 51 no golpe 2!
      f.attackHitDone = true;
      SFX.playSwearBeep();
      spawnPopup(f.x, f.y - 235, 'TOMA 51 *BEEP*!', '#fde047', 15);
      matchState.projectiles.push({
        kind: 'cachaca51',
        owner: f.side,
        x: f.x + f.facing * 52,
        y: f.y - 145,
        vx: f.facing * 10.8,
        vy: -2.2,
        gravity: 0.16,
        w: 44,
        h: 64,
        dmg: 10,
        life: 85,
        rot: 0,
        spin: f.facing * 0.34,
        shatter: true
      });
    } else {
      SFX.playSwing();
      f.vx = f.facing * (slot === 1 ? 4.2 : 5.4);
    }

    if (f.def.swearsOnHit && slot === 1 && Math.random() < 0.7) {
      const swear = f.def.barks[Math.floor(Math.random() * f.def.barks.length)];
      spawnPopup(f.x, f.y - 235, swear, '#fde047', 16);
      SFX.playSwearBeep();
      if (Math.random() < 0.5) SFX.playVoice('alexandre_swear', 0.9);
    }
  }

  function triggerSpecial(f, opp, slot = 1) {
    if (['hurt', 'fallen', 'ko', 'special', 'special2', 'win'].includes(f.state) || f.stunTimer > 0) return;
    if (f.superMeter < 40) {
      spawnPopup(f.x, f.y - 210, 'CARREGANDO ESPECIAL!', '#94a3b8', 13);
      return;
    }

    f.superMeter = Math.max(0, f.superMeter - 50);
    f.state = slot === 1 ? 'special' : 'special2';
    f.stateTimer = 34;
    f.attackHitDone = false;
    matchState.hitStop = 6;
    matchState.shake = 8;

    SFX.playSpecialSfx(f.def.id, slot);
    const voiceKey = slot === 1 ? f.def.voices.special : f.def.voices.special2;
    if (voiceKey) SFX.playVoice(voiceKey, 1.0);
    spawnPopup(f.x, f.y - 248, slot === 1 ? f.def.specialBark : f.def.special2Bark, f.def.accent, 20);

    const dir = f.facing;
    const type = slot === 1 ? f.def.specialType : f.def.special2Type;

    switch (type) {
      case 'summon_larissa':
        matchState.summons.push({
          kind: 'larissa_assist',
          owner: f.side,
          x: f.x - dir * 180,
          y: GROUND_Y,
          vx: dir * 13.8,
          dir,
          life: 62,
          hit: false
        });
        break;

      case 'passatempo_barrage':
        [-1, 0, 1].forEach((off, i) => {
          matchState.projectiles.push({
            kind: 'passatempo',
            owner: f.side,
            x: f.x + dir * 55,
            y: f.y - 140 + off * 26,
            vx: dir * (11.5 + i * 1.4),
            vy: off * 1.4,
            gravity: 0.08,
            w: 62,
            h: 62,
            dmg: 10,
            life: 95,
            rot: 0,
            spin: dir * 0.42
          });
        });
        break;

      case 'excavator':
        matchState.projectiles.push({
          kind: 'excavator',
          owner: f.side,
          x: f.x + dir * 72,
          y: GROUND_Y - 70,
          vx: dir * 10.2,
          vy: 0,
          w: 145,
          h: 120,
          dmg: 22,
          life: 110,
          rot: 0,
          spin: 0
        });
        break;

      case 'excavator_bounce':
        matchState.projectiles.push({
          kind: 'excavator',
          owner: f.side,
          x: f.x + dir * 70,
          y: GROUND_Y - 120,
          vx: dir * 11.8,
          vy: -4.5,
          gravity: 0.35,
          bounce: true,
          w: 150,
          h: 125,
          dmg: 24,
          life: 120,
          rot: 0,
          spin: dir * 0.04
        });
        break;

      case 'wheelie_dash':
        f.vx = dir * 16.5;
        f.stateTimer = 34;
        for (let i = 0; i < 14; i++) {
          spawnParticle(f.x - dir * 55, GROUND_Y - 20, -dir * (3 + Math.random() * 5), -Math.random() * 3, '#fb923c', 8);
        }
        break;

      case 'throw_moto':
        // Stênio arremessa a moto longa distância, cai no chão e toma dano próprio!
        f.state = 'fallen';
        f.stateTimer = 42;
        f.vx = -dir * 4.5;
        f.vy = -6.5;
        f.hp = Math.max(1, f.hp - 8);
        f.hitFlash = 8;
        spawnPopup(f.x, f.y - 160, '-8 HP (CAIU!)', '#ef4444', 16);
        updateHud();
        matchState.projectiles.push({
          kind: 'moto_xre',
          owner: f.side,
          x: f.x + dir * 60,
          y: GROUND_Y - 82,
          vx: dir * 14.2,
          vy: -3.2,
          gravity: 0.14,
          bounce: true,
          w: 150,
          h: 115,
          dmg: 26,
          life: 110,
          rot: 0,
          spin: dir * 0.14
        });
        break;

      case 'gym_weights':
        [0, 1].forEach(i => {
          matchState.projectiles.push({
            kind: i === 0 ? 'plate' : 'dumbbell',
            owner: f.side,
            x: f.x + dir * 55,
            y: f.y - 145 - i * 35,
            vx: dir * (11 + i * 1.8),
            vy: -2.2 + i * 1.2,
            gravity: 0.16,
            w: 58,
            h: 58,
            dmg: 14,
            life: 95,
            rot: 0,
            spin: dir * 0.28
          });
        });
        break;

      case 'hair_whip_super':
        // Kamile espicha super cabelo cacheado de longo alcance!
        f.state = 'special2';
        f.stateTimer = 32;
        break;

      case 'chained_minions':
        matchState.summons.push({
          kind: 'chained_pair',
          owner: f.side,
          x: f.x + dir * 40,
          y: GROUND_Y,
          vx: dir * 11.5,
          dir,
          life: 78,
          hit: false
        });
        break;

      case 'whip_flurry':
        f.state = 'special2';
        f.stateTimer = 36;
        f.vx = dir * 5.0;
        break;

      case 'litrinho':
        // Alexandre joga 3 garrafas reais de Pirassununga 51!
        [-1, 0, 1].forEach((offset, idx) => {
          matchState.projectiles.push({
            kind: 'cachaca51',
            owner: f.side,
            x: f.x + dir * 50,
            y: f.y - 150,
            vx: dir * (10.5 + idx * 1.4),
            vy: -3.4 + offset * 1.9,
            gravity: 0.21,
            w: 44,
            h: 66,
            dmg: 10,
            life: 95,
            rot: 0,
            spin: dir * 0.36,
            shatter: true
          });
        });
        break;

      case 'gpu_smash':
        // Alexandre vem correndo com uma Placa de Vídeo RTX que quebra na cabeça do rival!
        f.state = 'special2';
        f.stateTimer = 36;
        f.vx = dir * 15.2;
        break;

      case 'hacker_bsod':
        matchState.projectiles.push({
          kind: 'matrix_bolt',
          owner: f.side,
          x: f.x + dir * 65,
          y: f.y - 140,
          vx: dir * 12.8,
          vy: 0,
          w: 82,
          h: 66,
          dmg: 20,
          life: 90,
          rot: 0,
          spin: 0,
          bsod: true
        });
        break;

      case 'claudinho_ai':
        // Diogo joga 3 Claudinhos a IA perseguindo/atacando o rival!
        [0, 1, 2].forEach(i => {
          matchState.projectiles.push({
            kind: 'claudinho',
            owner: f.side,
            x: f.x + dir * (45 + i * 18),
            y: f.y - 155 - i * 28,
            vx: dir * (9.5 + i * 1.2),
            vy: -1.5 + i * 1.1,
            homing: true,
            w: 62,
            h: 62,
            dmg: 9,
            life: 115,
            rot: 0,
            spin: dir * 0.16
          });
        });
        break;
    }
  }

  function isBlocking(defender) {
    if (defender.stunTimer > 0) return false;
    if (['hurt', 'fallen', 'ko', 'basic1', 'basic2', 'special', 'special2'].includes(defender.state)) return false;
    if (defender.side === 'p1') {
      const holdBack = (defender.facing === 1 && keys['KeyA']) || (defender.facing === -1 && keys['KeyD']);
      return keys['KeyS'] || holdBack;
    } else if (gameMode === 'versus') {
      const holdBack = (defender.facing === 1 && keys['ArrowLeft']) || (defender.facing === -1 && keys['ArrowRight']);
      return keys['ArrowDown'] || holdBack;
    }
    return defender.state === 'crouch';
  }

  function applyHit(attacker, defender, dmg, knockback, isHeavy, customPopup) {
    const blocked = isBlocking(defender);
    if (blocked) {
      dmg = Math.max(2, Math.floor(dmg * 0.22));
      defender.vx = (attacker.x < defender.x ? 1 : -1) * (knockback * 0.5);
      defender.superMeter = Math.min(100, defender.superMeter + 10);
      SFX.playBlock();
      spawnPopup(defender.x, defender.y - 180, 'DEFESA!', '#38bdf8', 15);
      for (let i = 0; i < 8; i++) {
        spawnParticle(defender.x, defender.y - 140, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, '#38bdf8', 5);
      }
    } else {
      defender.hp = Math.max(0, defender.hp - dmg);
      defender.state = 'hurt';
      defender.stateTimer = isHeavy ? 24 : 15;
      defender.hitFlash = 10;
      defender.vx = (attacker.x < defender.x ? 1 : -1) * knockback;
      if (isHeavy) defender.vy = -5.5;

      attacker.comboCount++;
      attacker.comboResetTimer = 75;
      attacker.superMeter = Math.min(100, attacker.superMeter + 16);
      defender.superMeter = Math.min(100, defender.superMeter + 14);

      matchState.hitStop = isHeavy ? 6 : 3;
      matchState.shake = isHeavy ? 12 : 5;
      SFX.playHit(isHeavy);

      if (defender.def.voices.hurt && Math.random() < 0.45 && defender.hp > 0) {
        SFX.playVoice(defender.def.voices.hurt, 0.9);
      }

      const words = customPopup ? [customPopup] : ['POW!', 'PAF!', 'BONK!', 'LAPADA!', 'EITA!'];
      const txt = words[Math.floor(Math.random() * words.length)];
      spawnPopup(defender.x, defender.y - 190, txt, isHeavy ? '#f97316' : '#facc15', isHeavy ? 22 : 17);

      if (attacker.comboCount >= 2) {
        spawnPopup(attacker.x, attacker.y - 260, `${attacker.comboCount}x COMBO!`, '#22d3ee', 16);
      }

      for (let i = 0; i < (isHeavy ? 18 : 10); i++) {
        spawnParticle(
          defender.x,
          defender.y - 135,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 10 - 2,
          isHeavy ? '#facc15' : '#ef4444',
          isHeavy ? 7 : 5
        );
      }
    }

    if (defender.hp <= 0 && matchState.phase === 'fight') {
      triggerKO(attacker, defender);
    }
    updateHud();
  }

  function triggerKO(winner, loser) {
    matchState.phase = 'ko';
    matchState.phaseTimer = 135;
    loser.state = 'ko';
    loser.vy = -8;
    loser.vx = (winner.x < loser.x ? 1 : -1) * 9;
    winner.wins++;
    winner.state = 'win';
    matchState.bannerText = 'K.O.!!';
    matchState.subBannerText = `${winner.def.shortName} VENCEU O ROUND!`;
    matchState.shake = 18;
    SFX.playKO();
    SFX.playVoice('announcer_ko');
    updateHud();
  }

  function updateFighterControls(f, opp, dt) {
    if (['hurt', 'fallen', 'ko', 'win'].includes(f.state) || f.stunTimer > 0) {
      if (f.stunTimer > 0) f.stunTimer -= dt;
      if (f.bsodTimer > 0) f.bsodTimer -= dt;
      return;
    }

    if (f.state === 'dash') {
      f.ghosts.push({ x: f.x, y: f.y, facing: f.facing, life: 10 });
      return;
    }

    if (f.state === 'special' || f.state === 'special2') {
      // Melee/Dash specials hit detection
      if (f.def.id === 'stenio' && f.state === 'special' && !f.attackHitDone) {
        if (Math.abs(f.x - opp.x) < 125 && Math.abs(f.y - opp.y) < 120) {
          f.attackHitDone = true;
          applyHit(f, opp, Math.round(21 * f.def.power), 12, true, 'GRAU MONSTRO!');
        }
      } else if (f.def.id === 'alexandre' && f.state === 'special2' && !f.attackHitDone) {
        if (Math.abs(f.x - opp.x) < 120 && Math.abs(f.y - opp.y) < 120) {
          f.attackHitDone = true;
          SFX.playGlassSmash();
          for (let i = 0; i < 16; i++) {
            spawnParticle(opp.x, opp.y - 140, (Math.random() - 0.5) * 14, -Math.random() * 10, i % 2 ? '#22d3ee' : '#334155', 6);
          }
          applyHit(f, opp, 24, 12, true, 'RTX QUEBRADA! -R$4.000!');
        }
      } else if (f.def.id === 'kamile' && f.state === 'special2' && !f.attackHitDone && f.stateTimer <= 20) {
        if (Math.abs(f.x - opp.x) < 310 && Math.abs(f.y - opp.y) < 130 && (opp.x - f.x) * f.facing >= -20) {
          f.attackHitDone = true;
          applyHit(f, opp, 23, 13, true, 'CHICOTADA DE CABELO!');
        }
      } else if (f.def.id === 'larissa' && f.state === 'special2') {
        if (!f.attackHitDone && (Math.floor(f.stateTimer) === 24 || Math.floor(f.stateTimer) === 12)) {
          if (Math.abs(f.x - opp.x) < 235 && Math.abs(f.y - opp.y) < 130 && (opp.x - f.x) * f.facing >= -20) {
            f.attackHitDone = true;
            applyHit(f, opp, 22, 11, true, 'CHICOTADA SUPREMA!');
          }
        }
      }
      return;
    }

    if (f.state === 'basic1' || f.state === 'basic2') {
      const hitFrame = f.state === 'basic1' ? 9 : 13;
      if (!f.attackHitDone && f.stateTimer <= hitFrame) {
        let reach = f.state === 'basic1' ? 120 : 145;
        let customMsg = null;
        if (f.def.id === 'larissa') {
          reach = 195;
          customMsg = 'CHICOTADA!';
        } else if (f.def.id === 'kamile' && f.state === 'basic2') {
          reach = 205;
          customMsg = 'CABELADA!';
        }
        if (Math.abs(f.x - opp.x) < reach && Math.abs(f.y - opp.y) < 120 && (opp.x - f.x) * f.facing >= -25) {
          f.attackHitDone = true;
          const base = f.state === 'basic1' ? 9 : 13;
          applyHit(f, opp, Math.round(base * f.def.power), f.state === 'basic2' ? 9 : 5, f.state === 'basic2', customMsg);
        }
      }
      return;
    }

    // Movement Input
    let move = 0;
    let crouch = false;
    if (f.side === 'p1') {
      if (keys['KeyA']) move -= 1;
      if (keys['KeyD']) move += 1;
      if (keys['KeyS']) crouch = true;
    } else if (gameMode === 'versus') {
      if (keys['ArrowLeft']) move -= 1;
      if (keys['ArrowRight']) move += 1;
      if (keys['ArrowDown']) crouch = true;
    } else {
      const ai = runCpuAI(f, opp, dt);
      move = ai.move;
      crouch = ai.crouch;
    }

    if (f.y >= GROUND_Y - 1) {
      if (crouch) {
        f.state = 'crouch';
        f.vx *= 0.6;
      } else if (move !== 0) {
        f.state = 'walk';
        f.vx = move * f.def.speed;
      } else {
        f.state = 'idle';
        f.vx *= 0.72;
      }
    } else {
      f.vx = move * f.def.speed * 0.94;
    }
  }

  function runCpuAI(cpu, player, dt) {
    const diff = document.getElementById('cpu-diff').value;
    const aggro = diff === 'hard' ? 1.55 : diff === 'easy' ? 0.62 : 1.0;
    const dist = player.x - cpu.x;
    const absDist = Math.abs(dist);
    const dirToPlayer = dist >= 0 ? 1 : -1;

    cpu.aiCooldown -= dt * aggro;
    let move = 0;
    let crouch = false;

    if (absDist > 145) move = dirToPlayer;
    else if (absDist < 72) move = -dirToPlayer * 0.6;

    if ((player.state === 'basic1' || player.state === 'basic2') && absDist < 165) {
      if (Math.random() < (diff === 'hard' ? 0.42 : 0.16)) crouch = true;
    }

    if (cpu.aiCooldown <= 0) {
      cpu.aiCooldown = (diff === 'hard' ? 16 : diff === 'easy' ? 42 : 25) + Math.random() * 20;
      if (cpu.superMeter >= 45 && absDist > 110 && Math.random() < 0.38 * aggro) {
        triggerSpecial(cpu, player, Math.random() < 0.5 ? 1 : 2);
      } else if (absDist < 170) {
        triggerBasic(cpu, player, Math.random() < 0.5 ? 1 : 2);
      } else if (Math.random() < 0.15) {
        triggerDash(cpu, dirToPlayer);
      } else if (Math.random() < 0.18) {
        triggerJump(cpu);
      }
    }
    return { move, crouch };
  }

  function updatePhysics(f, opp, dt) {
    f.bobPhase += 0.12 * dt;
    if (f.hitFlash > 0) f.hitFlash -= dt;
    if (f.comboResetTimer > 0) {
      f.comboResetTimer -= dt;
      if (f.comboResetTimer <= 0) f.comboCount = 0;
    }

    for (let i = f.ghosts.length - 1; i >= 0; i--) {
      f.ghosts[i].life -= dt;
      if (f.ghosts[i].life <= 0) f.ghosts.splice(i, 1);
    }

    if (f.stateTimer > 0) {
      f.stateTimer -= dt;
      if (f.stateTimer <= 0 && !['ko', 'win'].includes(f.state)) {
        f.state = f.y < GROUND_Y - 1 ? 'jump' : 'idle';
      }
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;

    if (f.y < GROUND_Y) f.vy += 0.78 * dt;
    else {
      f.y = GROUND_Y;
      f.vy = 0;
      if (f.state === 'jump') f.state = 'idle';
    }

    if (!['walk', 'dash', 'special', 'special2'].includes(f.state)) {
      f.vx *= Math.pow(0.84, dt);
    }

    f.x = Math.max(70, Math.min(W - 70, f.x));

    const minGap = 68;
    const dx = f.x - opp.x;
    if (Math.abs(dx) < minGap && Math.abs(f.y - opp.y) < 140 && f.state !== 'ko' && opp.state !== 'ko') {
      const push = (minGap - Math.abs(dx)) * 0.5 * (dx >= 0 ? 1 : -1);
      f.x = Math.max(70, Math.min(W - 70, f.x + push));
    }

    if (['idle', 'walk', 'crouch', 'jump'].includes(f.state)) {
      f.facing = opp.x >= f.x ? 1 : -1;
    }

    if (matchState.phase === 'fight') {
      f.superMeter = Math.min(100, f.superMeter + 0.08 * dt);
    }
  }

  function updateProjectilesAndSummons(dt) {
    const { p1, p2 } = matchState;
    for (let i = matchState.projectiles.length - 1; i >= 0; i--) {
      const p = matchState.projectiles[i];
      const target = p.owner === 'p1' ? p2 : p1;
      const attacker = p.owner === 'p1' ? p1 : p2;

      if (p.homing) {
        const ty = target.y - 130;
        p.vy += Math.sign(ty - p.y) * 0.25 * dt;
        p.vy = Math.max(-5, Math.min(5, p.vy));
      }

      p.x += p.vx * dt;
      p.y += (p.vy || 0) * dt;
      if (p.gravity) p.vy += p.gravity * dt;

      if (p.bounce && p.y > GROUND_Y - p.h * 0.45) {
        p.y = GROUND_Y - p.h * 0.45;
        p.vy = -Math.abs(p.vy) * 0.72 - 3;
      }

      p.rot += (p.spin || 0) * dt;
      p.life -= dt;

      if (Math.abs(p.x - target.x) < p.w * 0.5 + 34 && Math.abs(p.y - (target.y - 125)) < p.h * 0.5 + 95) {
        if (p.shatter) {
          SFX.playGlassSmash();
          for (let k = 0; k < 12; k++) {
            spawnParticle(p.x, p.y, (Math.random() - 0.5) * 11, -Math.random() * 8, '#fde047', 5);
          }
        }
        if (p.bsod) {
          target.stunTimer = 55;
          target.bsodTimer = 75;
          applyHit(attacker, target, p.dmg, 7, true, 'TELA AZUL!!');
        } else {
          const msgMap = {
            excavator: 'ESCAVADA!!',
            cachaca51: 'CACHAÇA 51!!',
            passatempo: 'PASSATEMPO!',
            moto_xre: 'MOTO NA CARA!!',
            claudinho: 'CLAUDINHO IA!'
          };
          applyHit(attacker, target, p.dmg, 9, true, msgMap[p.kind] || 'BIIIRL!!');
        }
        matchState.projectiles.splice(i, 1);
        continue;
      }

      if (p.life <= 0 || p.x < -190 || p.x > W + 190 || (!p.bounce && p.y > GROUND_Y + 55)) {
        matchState.projectiles.splice(i, 1);
      }
    }

    for (let i = matchState.summons.length - 1; i >= 0; i--) {
      const s = matchState.summons[i];
      s.x += s.vx * dt;
      s.life -= dt;
      const target = s.owner === 'p1' ? p2 : p1;
      const attacker = s.owner === 'p1' ? p1 : p2;

      if (!s.hit && Math.abs(s.x - target.x) < 115) {
        s.hit = true;
        const msg = s.kind === 'larissa_assist' ? 'LARISSA SMASH!!' : 'ACORRENTADOS!!';
        applyHit(attacker, target, 24, 13, true, msg);
      }
      if (s.life <= 0 || s.x < -240 || s.x > W + 240) {
        matchState.summons.splice(i, 1);
      }
    }
  }

  function spawnParticle(x, y, vx, vy, color, size) {
    matchState.particles.push({ x, y, vx, vy, color, size, life: 24 + Math.random() * 14 });
  }

  function spawnPopup(x, y, text, color, size = 16) {
    matchState.popups.push({ x, y, text, color, size, vy: -1.4, life: 48 });
  }

  function updateMatch(dt) {
    if (!matchState) return;
    if (matchState.shake > 0) matchState.shake *= Math.pow(0.82, dt);

    if (matchState.hitStop > 0) {
      matchState.hitStop -= dt;
      return;
    }

    for (let i = matchState.particles.length - 1; i >= 0; i--) {
      const pt = matchState.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 0.28 * dt;
      pt.life -= dt;
      if (pt.life <= 0) matchState.particles.splice(i, 1);
    }
    for (let i = matchState.popups.length - 1; i >= 0; i--) {
      const pp = matchState.popups[i];
      pp.y += pp.vy * dt;
      pp.life -= dt;
      if (pp.life <= 0) matchState.popups.splice(i, 1);
    }

    if (matchState.phase === 'intro') {
      matchState.phaseTimer -= dt;
      if (matchState.phaseTimer < 40) {
        matchState.bannerText = 'LUTA!!';
        matchState.subBannerText = '';
      }
      if (matchState.phaseTimer <= 0) {
        matchState.phase = 'fight';
        matchState.bannerText = '';
      }
      return;
    }

    if (matchState.phase === 'fight') {
      matchState.timerTicks += dt;
      if (matchState.timerTicks >= 60) {
        matchState.timerTicks -= 60;
        matchState.timer = Math.max(0, matchState.timer - 1);
        document.getElementById('hud-time').textContent = String(matchState.timer).padStart(2, '0');
        if (matchState.timer === 0) {
          const winner = matchState.p1.hp >= matchState.p2.hp ? matchState.p1 : matchState.p2;
          const loser = winner === matchState.p1 ? matchState.p2 : matchState.p1;
          triggerKO(winner, loser);
        }
      }

      updateFighterControls(matchState.p1, matchState.p2, dt);
      updateFighterControls(matchState.p2, matchState.p1, dt);
      updatePhysics(matchState.p1, matchState.p2, dt);
      updatePhysics(matchState.p2, matchState.p1, dt);
      updateProjectilesAndSummons(dt);
    } else if (matchState.phase === 'ko') {
      updatePhysics(matchState.p1, matchState.p2, dt);
      updatePhysics(matchState.p2, matchState.p1, dt);
      matchState.phaseTimer -= dt;
      if (matchState.phaseTimer <= 0) {
        if (matchState.p1.wins >= 2 || matchState.p2.wins >= 2) finishMatch();
        else startNextRound();
      }
    }
  }

  function finishMatch() {
    matchState.phase = 'match_over';
    const winner = matchState.p1.wins >= 2 ? matchState.p1 : matchState.p2;
    SFX.startMusic('win');
    SFX.playVoice('announcer_win');
    if (winner.def.voices.win) setTimeout(() => SFX.playVoice(winner.def.voices.win), 650);

    const modal = document.getElementById('victory-modal');
    document.getElementById('victory-img').src = winner.def.sprite;
    document.getElementById('victory-title').textContent = `${winner.def.name} VENCEU!`;
    document.getElementById('victory-quote').textContent = `"${winner.def.winQuote}"`;

    const btnNext = document.getElementById('btn-next-match');
    if (gameMode === 'arcade' && winner.side === 'p1' && arcadeStageIdx + 1 < arcadeQueue.length) {
      btnNext.style.display = 'inline-block';
      btnNext.textContent = `🔥 PRÓXIMO RIVAL (${arcadeStageIdx + 2}/${arcadeQueue.length + 1})`;
    } else if (gameMode === 'arcade' && winner.side === 'p1') {
      btnNext.style.display = 'none';
      document.getElementById('victory-title').textContent = `🏆 ${winner.def.name} É CAMPEÃO DA GALERA!!`;
    } else {
      btnNext.style.display = 'none';
    }
    modal.classList.add('active');
  }

  document.getElementById('btn-next-match').addEventListener('click', () => {
    arcadeStageIdx++;
    p2Index = arcadeQueue[arcadeStageIdx];
    startVsAndMatch();
  });

  document.getElementById('btn-rematch').addEventListener('click', () => {
    SFX.init();
    beginMatch();
  });

  document.getElementById('btn-back-select').addEventListener('click', () => {
    stopFightLoop();
    openCharacterSelect();
  });

  function updateHud() {
    if (!matchState) return;
    const { p1, p2 } = matchState;
    document.getElementById('hud-p1-hp').style.width = `${p1.hp}%`;
    document.getElementById('hud-p1-trail').style.width = `${p1.hp}%`;
    document.getElementById('hud-p2-hp').style.width = `${p2.hp}%`;
    document.getElementById('hud-p2-trail').style.width = `${p2.hp}%`;

    const s1 = document.getElementById('hud-p1-super');
    s1.style.width = `${p1.superMeter}%`;
    s1.classList.toggle('ready', p1.superMeter >= 40);

    const s2 = document.getElementById('hud-p2-super');
    s2.style.width = `${p2.superMeter}%`;
    s2.classList.toggle('ready', p2.superMeter >= 40);

    document.getElementById('hud-p1-stars').textContent = '★'.repeat(p1.wins);
    document.getElementById('hud-p2-stars').textContent = '★'.repeat(p2.wins);
    document.getElementById('hud-time').textContent = String(matchState.timer).padStart(2, '0');
  }

  // --- Rendering ---
  function drawStage(stageId, time) {
    const skyColors = [
      ['#1e1b4b', '#6d28d9', '#f97316'],
      ['#0f172a', '#1e3a8a', '#0ea5e9'],
      ['#27110b', '#7c2d12', '#d97706']
    ][stageId];

    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, skyColors[0]);
    grad.addColorStop(0.6, skyColors[1]);
    grad.addColorStop(1, skyColors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, GROUND_Y);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.fillRect(W / 2 - 260, 128, 520, 46);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(W / 2 - 260, 128, 520, 46);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 22px "Russo One", sans-serif';
    ctx.textAlign = 'center';
    const stageTitles = ['VILA DAS ARTES • PRAÇA DA LUTA', 'AVENIDA DO GRAU • OFICINA XRE', 'BOTECO DO ALEXANDRE • CACHAÇA 51'];
    ctx.fillText(stageTitles[stageId], W / 2, 159);
    ctx.restore();

    for (let i = 0; i < 14; i++) {
      const bx = i * 90 - 20;
      const bh = 120 + ((i * 57) % 130);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(15,23,42,0.72)' : 'rgba(30,41,59,0.72)';
      ctx.fillRect(bx, GROUND_Y - bh, 82, bh);
      ctx.fillStyle = 'rgba(250,204,21,0.5)';
      for (let wy = GROUND_Y - bh + 18; wy < GROUND_Y - 30; wy += 24) {
        for (let wx = bx + 12; wx < bx + 68; wx += 22) {
          if ((wx + wy + i) % 3 !== 0) ctx.fillRect(wx, wy, 10, 12);
        }
      }
    }

    for (let i = 0; i < 16; i++) {
      const cx = 45 + i * 70;
      const jump = Math.abs(Math.sin(time * 0.006 + i * 1.3)) * 14;
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(cx, GROUND_Y - 48 - jump, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 14, GROUND_Y - 36 - jump, 28, 38 + jump);
    }

    const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    floorGrad.addColorStop(0, '#334155');
    floorGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    ctx.strokeStyle = 'rgba(250,204,21,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    for (let i = -8; i <= 8; i++) {
      ctx.moveTo(W / 2 + i * 70, GROUND_Y);
      ctx.lineTo(W / 2 + i * 165, H);
    }
    ctx.stroke();
  }

  function drawFighter(f) {
    const img = spriteImages[f.def.id];
    const targetH = 265 * f.def.scale;
    const aspect = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0.45;
    const drawW = targetH * aspect;
    const drawH = targetH;

    // Dash Ghost Afterimages
    f.ghosts.forEach(g => {
      if (!img.complete) return;
      ctx.save();
      ctx.globalAlpha = (g.life / 10) * 0.35;
      ctx.translate(g.x, g.y);
      ctx.scale(g.facing, 1);
      ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
      ctx.restore();
    });

    const shadowScale = Math.max(0.35, 1 - (GROUND_Y - f.y) / 260);
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.beginPath();
    ctx.ellipse(f.x, GROUND_Y + 6, 56 * shadowScale, 14 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(f.x, f.y);

    let bobY = Math.sin(f.bobPhase) * 4;
    let tilt = 0;
    let scaleY = 1;
    let shiftX = 0;

    if (f.def.id === 'alexandre' && f.state === 'idle') tilt = Math.sin(f.bobPhase * 0.7) * 0.06;
    if (f.def.isMoto) bobY = Math.sin(f.bobPhase * 1.8) * 3;
    if (f.state === 'walk') {
      tilt = f.facing * 0.08;
      bobY = Math.abs(Math.sin(f.bobPhase * 2.2)) * -7;
    } else if (f.state === 'dash') {
      tilt = f.facing * 0.24;
      bobY = -6;
    } else if (f.state === 'crouch') {
      scaleY = 0.76;
    } else if (f.state === 'basic1') {
      tilt = f.facing * 0.20;
      shiftX = f.facing * 26;
    } else if (f.state === 'basic2') {
      tilt = f.facing * -0.16;
      shiftX = f.facing * 24;
      bobY = -12;
    } else if (f.state === 'special' || f.state === 'special2') {
      tilt = f.def.isMoto ? f.facing * -0.25 : f.facing * 0.16;
      bobY = -10;
    } else if (f.state === 'hurt') {
      tilt = -f.facing * 0.24;
    } else if (f.state === 'fallen') {
      tilt = -f.facing * 1.25;
      bobY = -14;
    } else if (f.state === 'ko') {
      tilt = -f.facing * 1.48;
      bobY = -20;
    } else if (f.state === 'win') {
      bobY = -Math.abs(Math.sin(f.bobPhase * 1.5)) * 18;
    }

    ctx.translate(shiftX, bobY);
    ctx.rotate(tilt);
    ctx.scale(f.facing, scaleY);

    if (f.def.id === 'larissa' || f.state === 'special' || f.state === 'special2') {
      ctx.shadowColor = f.def.color;
      ctx.shadowBlur = (f.state === 'special' || f.state === 'special2') ? 26 : 12;
    }

    if (f.hitFlash > 0 && Math.floor(f.hitFlash) % 2 === 0) {
      ctx.filter = 'brightness(2.2) saturate(0.2)';
    }

    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
    }

    ctx.shadowBlur = 0;
    ctx.filter = 'none';

    // Signature Visual Effects for Attacks!
    // 1. Larissa Whip Attacks (basic1, basic2, special2)
    if (f.def.id === 'larissa' && ['basic1', 'basic2', 'special2'].includes(f.state)) {
      const reach = f.state === 'special2' ? 235 : 185;
      const wave = Math.sin(f.stateTimer * 0.65) * 28;
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(22, -drawH * 0.56);
      ctx.bezierCurveTo(reach * 0.4, -drawH * 0.72 + wave, reach * 0.75, -drawH * 0.42 - wave, reach, -drawH * 0.54 + wave * 0.5);
      ctx.stroke();

      // Purple/Red snap spark at whip tip
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2;
      ctx.stroke();
      const whipImg = propImages.chicote;
      if (whipImg && whipImg.complete) {
        ctx.drawImage(whipImg, reach - 28, -drawH * 0.54 + wave * 0.5 - 24, 52, 48);
      }
    }

    // 2. Kamile Stretching Curly Hair Attack! (basic2 & special2)
    if (f.def.id === 'kamile' && (f.state === 'basic2' || f.state === 'special2')) {
      const hairLen = f.state === 'special2' ? 305 : 195;
      for (let s = -2; s <= 2; s++) {
        ctx.strokeStyle = s % 2 === 0 ? '#3b2314' : '#5c3822';
        ctx.lineWidth = f.state === 'special2' ? 11 : 8;
        ctx.beginPath();
        ctx.moveTo(10, -drawH * 0.80 + s * 6);
        for (let step = 1; step <= 6; step++) {
          const px = 10 + (hairLen * step) / 6;
          const py = -drawH * 0.76 + s * 10 + Math.sin(step * 1.9 + f.stateTimer * 0.4) * 14;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }

    // 3. Alexandre GPU Smash Rush! (special2)
    if (f.def.id === 'alexandre' && f.state === 'special2') {
      const gpuImg = propImages.gpu;
      if (gpuImg && gpuImg.complete) {
        ctx.drawImage(gpuImg, 20, -drawH * 0.68, 120, 60);
      }
    }

    // 4. General crisp comic slash/impact arc for melee basics
    if ((f.state === 'basic1' || f.state === 'basic2') && f.def.id !== 'larissa' && !(f.def.id === 'kamile' && f.state === 'basic2')) {
      ctx.strokeStyle = f.def.accent;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(drawW * 0.35 + 14, f.state === 'basic1' ? -drawH * 0.62 : -drawH * 0.36, 36, -0.9, 0.9);
      ctx.stroke();
    }

    if (f.state === 'crouch') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(28, -drawH * 0.5, 48, -1.1, 1.1);
      ctx.stroke();
    }

    ctx.restore();

    // BSOD overlay
    if (f.bsodTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#0022aa';
      ctx.fillRect(f.x - 75, f.y - 230, 150, 105);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(f.x - 75, f.y - 230, 150, 105);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(':( TELA AZUL', f.x, f.y - 196);
      ctx.font = '10px monospace';
      ctx.fillText('SYSTEM HACKED', f.x, f.y - 175);
      ctx.fillText('BY DIOGO.EXE', f.x, f.y - 158);
      ctx.restore();
    }

    if (f.state === 'ko' || f.state === 'fallen') {
      for (let i = 0; i < 3; i++) {
        const ang = Date.now() * 0.008 + i * 2.1;
        ctx.fillStyle = '#facc15';
        ctx.font = '20px sans-serif';
        ctx.fillText('★', f.x + Math.cos(ang) * 32, f.y - 68 + Math.sin(ang) * 10);
      }
    }
  }

  function drawProjectile(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    const img = propImages[p.kind];
    if (img && img.complete && img.naturalWidth > 0) {
      if (p.vx < 0 && ['excavator', 'moto_xre'].includes(p.kind)) ctx.scale(-1, 1);
      ctx.drawImage(img, -p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      return;
    }

    if (p.kind === 'plate') {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('50KG', 0, 4);
    } else if (p.kind === 'dumbbell') {
      ctx.fillStyle = '#334155';
      ctx.fillRect(-26, -5, 52, 10);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-30, -18, 14, 36);
      ctx.fillRect(16, -18, 14, 36);
    } else if (p.kind === 'matrix_bolt') {
      ctx.fillStyle = 'rgba(0, 20, 0, 0.85)';
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.fillRect(-38, -26, 76, 52);
      ctx.strokeRect(-38, -26, 76, 52);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('010101', 0, -4);
      ctx.fillText('HACK!', 0, 14);
    }
    ctx.restore();
  }

  function drawHeavyChain(x1, y1, x2, y2, sag = 16) {
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * sag;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(i % 2 === 0 ? 0.3 : -0.3);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSummon(s) {
    ctx.save();
    if (s.kind === 'larissa_assist') {
      const img = spriteImages['larissa'];
      if (img.complete) {
        ctx.translate(s.x, s.y - 28);
        ctx.scale(s.dir, 1);
        ctx.rotate(0.24);
        ctx.shadowColor = '#c026d3';
        ctx.shadowBlur = 22;
        const h = 240;
        const w = h * (img.naturalWidth / img.naturalHeight);
        ctx.drawImage(img, -w / 2, -h, w, h);
      }
    } else if (s.kind === 'chained_pair') {
      // Thiago & Saulo ACORRENTADOS com correntes metálicas realistas!
      const tImg = spriteImages['thiago'];
      const sImg = spriteImages['saulo'];
      const bounce = Math.abs(Math.sin(s.life * 0.35)) * 16;
      const tx = s.x - s.dir * 52;
      const sx = s.x + s.dir * 52;

      if (tImg.complete) {
        const h = 232;
        const w = h * (tImg.naturalWidth / tImg.naturalHeight);
        ctx.save();
        ctx.translate(tx, s.y - bounce);
        ctx.scale(s.dir, 1);
        ctx.drawImage(tImg, -w / 2, -h, w, h);
        ctx.restore();
      }
      if (sImg.complete) {
        const h = 242;
        const w = h * (sImg.naturalWidth / sImg.naturalHeight);
        ctx.save();
        ctx.translate(sx, s.y - bounce * 0.7);
        ctx.scale(s.dir, 1);
        ctx.drawImage(sImg, -w / 2, -h, w, h);
        ctx.restore();
      }

      // Heavy iron chains wrapping around BOTH Thiago & Saulo's waists/torsos + hanging bridge chain!
      drawHeavyChain(tx - 24, s.y - 125 - bounce, tx + 24, s.y - 125 - bounce, 6);
      drawHeavyChain(sx - 26, s.y - 128 - bounce * 0.7, sx + 26, s.y - 128 - bounce * 0.7, 6);
      drawHeavyChain(tx, s.y - 125 - bounce, sx, s.y - 128 - bounce * 0.7, 22);
      drawHeavyChain(tx, s.y - 165 - bounce, sx, s.y - 168 - bounce * 0.7, 14);

      // Gold heavy padlock in center
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.fillRect(s.x - 13, s.y - 115 - bounce, 26, 22);
      ctx.strokeRect(s.x - 13, s.y - 115 - bounce, 26, 22);
      ctx.beginPath();
      ctx.arc(s.x, s.y - 116 - bounce, 9, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderMatch() {
    if (!matchState) return;
    ctx.save();
    if (matchState.shake > 0.5) {
      ctx.translate((Math.random() - 0.5) * matchState.shake, (Math.random() - 0.5) * matchState.shake);
    }

    drawStage(matchState.stageId, performance.now());
    matchState.summons.forEach(drawSummon);
    drawFighter(matchState.p1);
    drawFighter(matchState.p2);
    matchState.projectiles.forEach(drawProjectile);

    matchState.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life / 30);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    matchState.popups.forEach(pp => {
      ctx.save();
      ctx.globalAlpha = Math.min(1, pp.life / 14);
      ctx.font = `900 ${pp.size}px "Russo One", sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.strokeText(pp.text, pp.x, pp.y);
      ctx.fillStyle = pp.color;
      ctx.fillText(pp.text, pp.x, pp.y);
      ctx.restore();
    });

    if (matchState.bannerText) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic 900 74px "Russo One", sans-serif';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 10;
      ctx.strokeText(matchState.bannerText, W / 2, H / 2 - 20);
      const bGrad = ctx.createLinearGradient(0, H / 2 - 80, 0, H / 2);
      bGrad.addColorStop(0, '#fff');
      bGrad.addColorStop(0.5, '#facc15');
      bGrad.addColorStop(1, '#ef4444');
      ctx.fillStyle = bGrad;
      ctx.fillText(matchState.bannerText, W / 2, H / 2 - 20);

      if (matchState.subBannerText) {
        ctx.font = 'bold 26px "Russo One", sans-serif';
        ctx.lineWidth = 6;
        ctx.strokeText(matchState.subBannerText, W / 2, H / 2 + 28);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(matchState.subBannerText, W / 2, H / 2 + 28);
      }
      ctx.restore();
    }

    ctx.restore();
  }
})();
