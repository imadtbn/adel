// ============================================
// عادل - Game Engine (Canvas-based)
// assets/js/game.js
// ============================================

const GameEngine = (() => {
  // Canvas & context
  let canvas, ctx;
  let W, H;
  let animId = null;
  let currentLevel = null;
  let gameRunning = false;
  let gamePaused = false;

  // ── Game Objects ──
  let player = {};
  let collectibles = [];
  let obstacles = [];
  let enemies = [];
  let projectiles = [];
  let particles = null;
  let weather = null;
  let camera = { x: 0, y: 0 };

  // ── Input ──
  const keys = {};
  const touch = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };

  // ── Game State ──
  let score = 0;
  let collected = 0;
  let targetCount = 0;
  let levelTimer = 0;
  let levelComplete = false;
  let hudProgress = 0;

  // ── World ──
  let worldWidth = 2000;

  // ─────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────
  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    particles = new EffectsSystem.CanvasParticles();
    weather = new EffectsSystem.WeatherSystem();

    setupInputs();
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // ─────────────────────────────────────────
  // INPUT
  // ─────────────────────────────────────────
  function setupInputs() {
    window.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (['ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });

    canvas.addEventListener('touchstart', e => {
      const t = e.touches[0];
      touch.startX = t.clientX;
      touch.startY = t.clientY;
      touch.dx = 0; touch.dy = 0;
      touch.active = true;
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
      if (!touch.active) return;
      const t = e.touches[0];
      touch.dx = t.clientX - touch.startX;
      touch.dy = t.clientY - touch.startY;
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      if (Math.abs(touch.dx) < 10 && Math.abs(touch.dy) < 10) {
        // tap — action
        playerAction();
      }
      touch.active = false;
      touch.dx = 0; touch.dy = 0;
    });
  }

  // D-pad buttons (bound externally)
  function dpadPress(dir) {
    if (dir === 'up' || dir === 'jump') playerJump();
    else if (dir === 'left')  player.dir = -1, player.moving = true;
    else if (dir === 'right') player.dir = 1,  player.moving = true;
    else if (dir === 'down')  player.crouching = true;
  }

  function dpadRelease(dir) {
    if (dir === 'left' || dir === 'right') player.moving = false;
    if (dir === 'down') player.crouching = false;
  }

  // ─────────────────────────────────────────
  // PLAYER
  // ─────────────────────────────────────────
  function createPlayer() {
    const state = GameState.get();
    return {
      x: 120,
      y: H - 180,
      w: 52,
      h: 72,
      vx: 0,
      vy: 0,
      grounded: false,
      dir: 1,
      moving: false,
      crouching: false,
      jumping: false,
      animFrame: 0,
      animTimer: 0,
      speed: 3 + state.speed * 0.02,
      jumpPower: 12,
      name: state.playerName,
      clothColor: state.clothColor,
      avatarData: state.avatarData,
      health: 3,
      maxHealth: 3,
      invincible: 0,
    };
  }

  function playerJump() {
    if (player.grounded) {
      player.vy = -player.jumpPower;
      player.grounded = false;
      player.jumping = true;
      AudioSystem.playJump();
      particles.spawn(player.x + player.w/2, player.y + player.h, { emoji: '💨', count: 3, speed: 2, life: 20 });
    }
  }

  function playerAction() {
    if (currentLevel?.isArchery) {
      shootArrow();
    } else if (currentLevel?.isFencing) {
      swingSword();
    } else {
      playerJump();
    }
  }

  // ─────────────────────────────────────────
  // DRAW PLAYER (Cartoon SVG-style on Canvas)
  // ─────────────────────────────────────────
  function drawPlayer(x, y, dir, clothColor, avatarImg, frameAnim, crouching) {
    ctx.save();
    ctx.translate(x + 26, y + (crouching ? 20 : 0));
    if (dir < 0) ctx.scale(-1, 1);

    const h = crouching ? 0.7 : 1;
    ctx.scale(1, h);

    // Body shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.ellipse(0, 36, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs (animated walk)
    const legAngle = Math.sin(frameAnim * 0.3) * 15;
    drawLeg(ctx, -8, 30, legAngle, clothColor);
    drawLeg(ctx, 8, 30, -legAngle, clothColor);

    // Body / shirt
    ctx.fillStyle = clothColor;
    roundRect(ctx, -16, 0, 32, 30, 10);
    ctx.fill();

    // Collar / neck
    ctx.fillStyle = '#FDBCB4';
    roundRect(ctx, -8, -4, 16, 12, 6);
    ctx.fill();

    // Arms (animated)
    const armAngle = Math.sin(frameAnim * 0.3) * 20;
    drawArm(ctx, -16, 4, -armAngle, clothColor);
    drawArm(ctx, 16, 4, armAngle, clothColor);

    // Head
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.ellipse(0, -22, 18, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw face / avatar
    if (avatarImg) {
      try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, -22, 17, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, -17, -39, 34, 34);
        ctx.restore();
      } catch(e) { drawFace(ctx); }
    } else {
      drawFace(ctx);
    }

    // Hair
    ctx.fillStyle = '#4A3728';
    ctx.beginPath();
    ctx.ellipse(0, -38, 17, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawFace(ctx) {
    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-6, -24, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -24, 3, 0, Math.PI * 2); ctx.fill();
    // Eye shine
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(-5, -25, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -25, 1, 0, Math.PI * 2); ctx.fill();
    // Smile
    ctx.strokeStyle = '#B03060';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -18, 6, 0.1, Math.PI - 0.1);
    ctx.stroke();
    // Cheeks
    ctx.fillStyle = 'rgba(255,150,150,0.4)';
    ctx.beginPath(); ctx.ellipse(-10, -20, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, -20, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawLeg(ctx, x, y, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI / 180);
    // Pants
    ctx.fillStyle = darken(color, 30);
    roundRect(ctx, -6, 0, 12, 20, 4);
    ctx.fill();
    // Shoe
    ctx.fillStyle = '#4A3728';
    roundRect(ctx, -7, 18, 14, 8, 4);
    ctx.fill();
    ctx.restore();
  }

  function drawArm(ctx, x, y, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI / 180);
    ctx.fillStyle = color;
    roundRect(ctx, x > 0 ? 0 : -10, 0, 10, 22, 5);
    ctx.fill();
    // Hand
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(x > 0 ? 5 : -5, 22, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function darken(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b = Math.max(0, (num & 0xFF) - amount);
    return `rgb(${r},${g},${b})`;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  // ─────────────────────────────────────────
  // ENVIRONMENT DRAWING
  // ─────────────────────────────────────────
  function drawBackground(level) {
    const [c1, c2, c3] = level.bgColor || ['#87CEEB', '#A5D6A7', '#4CAF50'];
    
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c1);
    grad.addColorStop(0.6, c2);
    grad.addColorStop(1, c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (!level.isWater && !level.isFencing && !level.isArchery) {
      drawSun();
      drawClouds();
      drawMountains(c2);
    } else if (level.isWater) {
      drawWaterBackground();
    } else if (level.isArchery) {
      drawArcheryBackground();
    } else if (level.isFencing) {
      drawArenaBackground();
    }
  }

  function drawSun() {
    const sunX = W - 100, sunY = 80;
    // Rays
    ctx.save();
    ctx.strokeStyle = 'rgba(255,220,50,0.4)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + (levelTimer * 0.005);
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * 45, sunY + Math.sin(angle) * 45);
      ctx.lineTo(sunX + Math.cos(angle) * 70, sunY + Math.sin(angle) * 70);
      ctx.stroke();
    }
    // Sun body
    const grad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 40);
    grad.addColorStop(0, '#FFEE44');
    grad.addColorStop(1, '#FF9800');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  let cloudOffsets = [0, 0.3, 0.7];
  function drawClouds() {
    cloudOffsets.forEach((offset, i) => {
      const x = ((levelTimer * 0.2 + offset * W) % (W + 200)) - 100;
      const y = 60 + i * 50;
      drawCloud(x, y, 0.8 + i * 0.2);
    });
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    [[-20, 0, 30], [10, -15, 35], [40, 0, 25], [70, -5, 30]].forEach(([cx, cy, r]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawMountains(color) {
    ctx.fillStyle = 'rgba(100,160,100,0.4)';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.55);
    for (let i = 0; i <= 6; i++) {
      ctx.lineTo((W / 5) * i, H * 0.3 + Math.sin(i * 1.2) * H * 0.1);
    }
    ctx.lineTo(W, H * 0.55);
    ctx.closePath();
    ctx.fill();
  }

  function drawGround(level) {
    const gY = H - 100;
    // Main ground
    ctx.fillStyle = level.groundColor || '#4CAF50';
    ctx.fillRect(0, gY, W, H - gY);
    // Ground detail strip
    ctx.fillStyle = level.groundDark || '#388E3C';
    ctx.fillRect(0, gY, W, 12);
    // Grass tufts
    if (!level.isWater) {
      for (let x = 0; x < W; x += 40) {
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.moveTo(x, gY);
        ctx.lineTo(x + 6, gY - 12);
        ctx.lineTo(x + 12, gY);
        ctx.fill();
      }
    }
  }

  function drawWaterBackground() {
    // Deep water
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0288D1');
    grad.addColorStop(1, '#01579B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Water shimmer
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const y = (i / 8) * H + Math.sin(levelTimer * 0.03 + i) * 10;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < W; x += 20) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + levelTimer * 0.05) * 5);
      }
      ctx.stroke();
    }
    // Bubbles
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 20; i++) {
      const bx = (Math.sin(i * 37 + levelTimer * 0.01) * 0.5 + 0.5) * W;
      const by = ((i * 50 + levelTimer * 0.5) % H);
      ctx.beginPath();
      ctx.arc(bx, by, 3 + Math.sin(i * 7) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawArcheryBackground() {
    // Draw archery field
    ctx.fillStyle = '#6A1B9A';
    ctx.fillRect(0, 0, W, H);
    // Stars in bg
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137 + 50) % W;
      const sy = (i * 97 + 30) % (H * 0.6);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ground
    ctx.fillStyle = '#4A148C';
    ctx.fillRect(0, H - 100, W, 100);
    // Lane markers
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.setLineDash([20, 20]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 100);
    ctx.lineTo(W, H - 100);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawArenaBackground() {
    // Arena for fencing
    ctx.fillStyle = '#004D40';
    ctx.fillRect(0, 0, W, H);
    // Grid floor
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, H - 100); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, H - 100); ctx.lineTo(W, H - 100); ctx.stroke();
    // Center line
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(W / 2, H - 100);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);
    // Torches on wall
    for (let i = 0; i < 4; i++) {
      const tx = W * 0.15 + i * (W * 0.25);
      drawTorch(tx, H - 200);
    }
  }

  function drawTorch(x, y) {
    ctx.fillStyle = '#795548';
    ctx.fillRect(x - 4, y, 8, 30);
    // Flame
    const flicker = Math.sin(levelTimer * 0.2) * 5;
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.ellipse(x, y - 5 + flicker * 0.3, 8, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.ellipse(x, y - 3 + flicker * 0.2, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Glow
    const grd = ctx.createRadialGradient(x, y, 0, x, y, 40);
    grd.addColorStop(0, 'rgba(255,152,0,0.3)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─────────────────────────────────────────
  // COLLECTIBLES
  // ─────────────────────────────────────────
  function spawnCollectibles(level) {
    collectibles = [];
    const items = level.collectibles?.filter(c => !c.isObstacle) || [];
    const count = 15;
    for (let i = 0; i < count; i++) {
      const item = items[i % items.length];
      collectibles.push({
        id: i,
        x: 200 + Math.random() * (worldWidth - 300),
        y: H - 140 - Math.random() * 150,
        w: 40, h: 40,
        item,
        bobOffset: Math.random() * Math.PI * 2,
        collected: false,
        scale: 1,
      });
    }
  }

  function spawnObstacles(level) {
    obstacles = [];
    const obs = level.obstacles || [];
    for (let i = 0; i < 8; i++) {
      obstacles.push({
        x: 300 + i * 200 + Math.random() * 100,
        y: H - 140,
        w: 40, h: 40,
        emoji: obs[i % obs.length] || '🪨',
        harmful: true,
      });
    }
  }

  function spawnEnemies(level) {
    enemies = [];
    if (!level.enemies) return;
    level.enemies.forEach((e, i) => {
      enemies.push({
        x: 300 + i * 300,
        y: H - 160,
        w: 56, h: 56,
        enemy: e,
        health: e.health,
        vx: (Math.random() > 0.5 ? 1 : -1) * 1.5,
        dir: 1,
        defeated: false,
        animFrame: 0,
      });
    });
  }

  // ─────────────────────────────────────────
  // LEVEL SETUP
  // ─────────────────────────────────────────
  function startLevel(levelId) {
    const levelData = LEVELS_DATA.find(l => l.id === levelId);
    if (!levelData) return;

    currentLevel = levelData;
    score = 0;
    collected = 0;
    targetCount = levelData.target || 10;
    levelTimer = 0;
    levelComplete = false;
    hudProgress = 0;
    camera.x = 0;
    worldWidth = levelData.isArchery || levelData.isFencing ? W : 2400;

    player = createPlayer();
    particles.clear();
    spawnCollectibles(levelData);
    spawnObstacles(levelData);
    spawnEnemies(levelData);
    projectiles = [];

    // Set weather
    const weathers = ['sunny', 'cloudy', 'sunny', 'sunny'];
    weather.setType(weathers[Math.floor(Math.random() * weathers.length)]);

    if (levelData.isArchery) setupArchery(levelData);
    if (levelData.isFencing) setupFencing(levelData);

    gameRunning = true;
    gamePaused = false;

    updateHUD();
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  // ── Archery special setup ──
  let archeryTargets = [];
  function setupArchery(level) {
    archeryTargets = [];
    for (let i = 0; i < 6; i++) {
      archeryTargets.push({
        x: 150 + i * 130,
        y: H - 200 - Math.random() * 150,
        w: 60, h: 60,
        hit: false,
        bobOffset: Math.random() * Math.PI * 2,
        moving: Math.random() > 0.5,
        moveDir: 1,
        target: level.targets?.[i % level.targets.length] || { emoji: '🎯', points: 20 },
      });
    }
  }

  function shootArrow() {
    projectiles.push({
      x: player.x + player.w / 2,
      y: player.y + player.h / 2,
      vx: player.dir * 12,
      vy: -3,
      type: 'arrow',
      emoji: '➡️',
      active: true,
    });
    AudioSystem.playTone && AudioSystem.playTone(600, 0.1);
  }

  // ── Fencing ──
  let swordSwing = 0;
  function setupFencing(level) {
    spawnEnemies(level);
  }

  function swingSword() {
    swordSwing = 20;
    AudioSystem.playTone && AudioSystem.playTone(350, 0.1, 'sawtooth');
    // Check hits on enemies
    enemies.forEach(e => {
      if (!e.defeated && Math.abs(e.x - player.x) < 120 && Math.abs(e.y - player.y) < 80) {
        e.health--;
        particles.spawn(e.x + 28, e.y, { emoji: '✨', count: 5, speed: 3, life: 30 });
        if (e.health <= 0) {
          e.defeated = true;
          score += e.enemy.points || 15;
          collected++;
          GameState.addStat('skill', e.enemy.skill || 5);
          AudioSystem.playCollect();
          particles.spawn(e.x + 28, e.y, { emoji: '⭐', count: 8, speed: 4, life: 40 });
        }
      }
    });
  }

  // ─────────────────────────────────────────
  // GAME LOOP
  // ─────────────────────────────────────────
  function loop() {
    if (!gameRunning) return;
    animId = requestAnimationFrame(loop);
    update();
    render();
  }

  function update() {
    if (gamePaused || levelComplete) return;
    levelTimer++;

    updatePlayer();
    updateCollectibles();
    updateObstacles();
    updateEnemies();
    updateProjectiles();
    updateCamera();

    particles.update();
    weather.update(W, H);

    if (swordSwing > 0) swordSwing--;

    // Check win
    if (collected >= targetCount && !levelComplete) {
      onLevelComplete();
    }

    updateHUD();
  }

  function updatePlayer() {
    // Input
    const goLeft  = keys['ArrowLeft']  || keys['KeyA'] || (touch.active && touch.dx < -20);
    const goRight = keys['ArrowRight'] || keys['KeyD'] || (touch.active && touch.dx > 20);
    const jump    = keys['ArrowUp'] || keys['KeyW'] || keys['Space'];

    if (goLeft)  { player.vx = -player.speed; player.dir = -1; player.moving = true; }
    else if (goRight) { player.vx = player.speed; player.dir = 1; player.moving = true; }
    else { player.vx *= 0.8; player.moving = false; }

    if (jump && player.grounded) playerJump();

    // Gravity
    player.vy += 0.6;
    player.x += player.vx;
    player.y += player.vy;

    // Ground
    const groundY = currentLevel?.isWater ? H * 0.9 : H - 130;
    if (player.y + player.h >= groundY) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.grounded = true;
      player.jumping = false;
    } else {
      player.grounded = false;
    }

    // World bounds
    player.x = Math.max(0, Math.min(worldWidth - player.w, player.x));

    // Animate
    if (player.moving) player.animTimer++;
    else player.animTimer = 0;
    player.animFrame = Math.floor(player.animTimer / 8);

    // Invincibility frames
    if (player.invincible > 0) player.invincible--;
  }

  function updateCamera() {
    const targetX = player.x - W * 0.35;
    camera.x += (targetX - camera.x) * 0.1;
    camera.x = Math.max(0, Math.min(worldWidth - W, camera.x));
  }

  function updateCollectibles() {
    collectibles.forEach(c => {
      if (c.collected) return;
      // Bob animation
      c.y += Math.sin(levelTimer * 0.05 + c.bobOffset) * 0.3;

      // Collision with player
      if (rectsOverlap(player, c, -10)) {
        c.collected = true;
        score += c.item.points || 10;
        collected++;

        // Apply stat bonuses
        const item = c.item;
        ['energy','growth','power','skill','speed'].forEach(stat => {
          if (item[stat]) GameState.addStat(stat, item[stat]);
        });
        GameState.addStat('stars', 1);

        const sx = (c.x - camera.x);
        const sy = c.y;
        particles.spawn(sx, sy, { emoji: c.item.emoji, count: 6, speed: 3, life: 40 });
        AudioSystem.playCollect();
        EffectsSystem.spawnCollectEffect(sx, sy, `+${c.item.points}`);
      }
    });
  }

  function updateObstacles() {
    if (player.invincible > 0) return;
    obstacles.forEach(o => {
      if (rectsOverlap(player, o, -8)) {
        player.health--;
        player.invincible = 90;
        GameState.addStat('energy', -5);
        AudioSystem.playError();
        EffectsSystem.flashScreen('red', 300);
        if (player.health <= 0) onGameOver();
      }
    });
  }

  function updateEnemies() {
    enemies.forEach(e => {
      if (e.defeated) return;
      e.animFrame++;
      // Patrol
      e.x += e.vx;
      if (e.x < 100 || e.x > worldWidth - 100) e.vx *= -1;
      e.dir = e.vx > 0 ? 1 : -1;

      // Bounce on ground
      e.y = H - 160;

      // Player collision (non-fencing)
      if (!currentLevel?.isFencing && player.invincible === 0 && rectsOverlap(player, e, -12)) {
        player.health--;
        player.invincible = 90;
        AudioSystem.playError();
        EffectsSystem.flashScreen('red', 300);
      }
    });

    // Archery target movement
    archeryTargets.forEach(t => {
      if (t.hit || !t.moving) return;
      t.x += t.moveDir * 1.5;
      if (t.x < 80 || t.x > W - 80) t.moveDir *= -1;
    });
  }

  function updateProjectiles() {
    projectiles = projectiles.filter(p => p.active);
    projectiles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;

      if (p.x < 0 || p.x > W || p.y > H) { p.active = false; return; }

      // Hit archery targets
      archeryTargets.forEach(t => {
        if (!t.hit && Math.abs(p.x - t.x - 30) < 40 && Math.abs(p.y - t.y - 30) < 40) {
          t.hit = true;
          p.active = false;
          score += t.target.points || 20;
          collected++;
          AudioSystem.playCollect();
          particles.spawn(t.x + 30, t.y + 30, { emoji: '🎯', count: 8, speed: 4, life: 40 });
          GameState.addStat('skill', 5);
          GameState.addStat('stars', 2);
        }
      });
    });
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, W, H);

    // Background (no camera)
    drawBackground(currentLevel);
    weather.draw(ctx, W, H);

    // Camera transform
    ctx.save();
    ctx.translate(-camera.x, 0);

    drawGround(currentLevel);
    drawScenery();
    drawCollectibles();
    drawObstacles();
    drawEnemies();
    drawProjectiles();

    // Draw player (invincible flicker)
    if (player.invincible === 0 || Math.floor(player.invincible / 6) % 2 === 0) {
      const playerImg = getAvatarImage();
      drawPlayer(
        player.x, player.y,
        player.dir, player.clothColor,
        playerImg,
        player.animFrame,
        player.crouching
      );
    }

    // Sword swing effect
    if (swordSwing > 0) {
      drawSwordEffect();
    }

    particles.draw(ctx);
    ctx.restore();

    // HUD elements (no camera)
    drawHealthBar();
    drawMiniProgress();
  }

  function drawCollectibles() {
    collectibles.forEach(c => {
      if (c.collected) return;
      // Glow
      ctx.save();
      const grd = ctx.createRadialGradient(c.x + 20, c.y + 20, 0, c.x + 20, c.y + 20, 30);
      grd.addColorStop(0, 'rgba(255,215,0,0.3)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(c.x + 20, c.y + 20, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.item.emoji, c.x + 20, c.y + 28);
    });

    // Archery targets
    archeryTargets.forEach(t => {
      if (t.hit) return;
      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.target.emoji, t.x + 20, t.y + 36);
    });
  }

  function drawObstacles() {
    obstacles.forEach(o => {
      ctx.font = '36px serif';
      ctx.textAlign = 'center';
      ctx.fillText(o.emoji, o.x + 20, o.y + 32);
    });
  }

  function drawEnemies() {
    enemies.forEach(e => {
      if (e.defeated) return;
      ctx.save();
      ctx.translate(e.x + 28, e.y + 28);
      if (e.dir < 0) ctx.scale(-1, 1);

      // Bob
      const bob = Math.sin(e.animFrame * 0.1) * 3;
      ctx.translate(0, bob);

      ctx.font = '44px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.enemy.emoji, 0, 0);

      // Health bar
      if (e.health < e.enemy.health) {
        ctx.fillStyle = '#F44336';
        ctx.fillRect(-25, -38, 50, 6);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(-25, -38, 50 * (e.health / e.enemy.health), 6);
      }
      ctx.restore();
    });
  }

  function drawProjectiles() {
    projectiles.forEach(p => {
      if (!p.active) return;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      // Arrow shaft
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-15, -2, 30, 4);
      // Arrowhead
      ctx.fillStyle = '#9E9E9E';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(8, -6);
      ctx.lineTo(8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  function drawSwordEffect() {
    ctx.save();
    ctx.translate(player.x + (player.dir > 0 ? player.w + 20 : -40), player.y + 20);
    ctx.rotate((player.dir > 0 ? 1 : -1) * (1 - swordSwing / 20) * Math.PI * 0.5);
    
    ctx.strokeStyle = `rgba(200,230,255,${swordSwing / 20})`;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    // Blade
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(60, -20);
    ctx.stroke();
    // Shine
    ctx.strokeStyle = `rgba(255,255,255,${swordSwing / 20 * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, -3);
    ctx.lineTo(55, -18);
    ctx.stroke();
    ctx.restore();
  }

  function drawScenery() {
    if (currentLevel?.isWater || currentLevel?.isArchery || currentLevel?.isFencing) return;
    // Trees
    for (let i = 0; i < Math.ceil(worldWidth / 200); i++) {
      const x = 100 + i * 200 + Math.sin(i * 3) * 50;
      drawTree(x, H - 200, 0.7 + Math.sin(i) * 0.3);
    }
  }

  function drawTree(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    // Trunk
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(-8, 30, 16, 50);
    // Foliage layers
    [[0, 30, 35], [0, 10, 28], [0, -5, 20]].forEach(([tx, ty, r]) => {
      ctx.fillStyle = `hsl(${120 + tx},50%,${35 + ty * 0.5}%)`;
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawHealthBar() {
    // Hearts
    for (let i = 0; i < player.maxHealth; i++) {
      ctx.font = '24px serif';
      ctx.fillText(i < player.health ? '❤️' : '🖤', 16 + i * 30, H - 20);
    }
  }

  function drawMiniProgress() {
    // mini floating score
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, W/2 - 60, H - 50, 120, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Tajawal, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${collected} / ${targetCount} ✅`, W/2, H - 27);
  }

  // ─────────────────────────────────────────
  // EVENTS
  // ─────────────────────────────────────────
  function onLevelComplete() {
    levelComplete = true;
    gameRunning = false;

    // Calculate stars
    const timeBonus = levelTimer < 1800 ? 3 : levelTimer < 3600 ? 2 : 1;
    const stars = Math.min(3, timeBonus);

    GameState.completeLevel(currentLevel.id, stars);
    GameState.addStat('stars', stars * 10);
    GameState.set('totalCollected', (GameState.get('totalCollected') || 0) + collected);

    AudioSystem.playLevelComplete();
    EffectsSystem.flashScreen('#FFD700', 500);

    setTimeout(() => {
      GameEvents.emit('level_complete', {
        levelId: currentLevel.id,
        score,
        stars,
        collected,
      });
    }, 800);
  }

  function onGameOver() {
    gameRunning = false;
    AudioSystem.playError();
    GameEvents.emit('game_over', { levelId: currentLevel?.id, score });
  }

  function stop() {
    gameRunning = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    particles.clear();
  }

  function pause()  { gamePaused = true; }
  function resume() { gamePaused = false; }

  // ─────────────────────────────────────────
  // UTILS
  // ─────────────────────────────────────────
  function rectsOverlap(a, b, margin = 0) {
    return (
      a.x + margin < b.x + b.w &&
      a.x + a.w - margin > b.x &&
      a.y + margin < b.y + b.h &&
      a.y + a.h - margin > b.y
    );
  }

  let cachedAvatar = null;
  let cachedAvatarSrc = null;

  function getAvatarImage() {
    const src = GameState.get('avatarData');
    if (!src) return null;
    if (cachedAvatarSrc !== src) {
      cachedAvatar = new Image();
      cachedAvatar.src = src;
      cachedAvatarSrc = src;
    }
    return cachedAvatar?.complete ? cachedAvatar : null;
  }

  function updateHUD() {
    const pct = Math.round((collected / targetCount) * 100);
    const fill = document.getElementById('hud-progress-fill');
    const scorEl = document.getElementById('hud-score');
    const nameEl = document.getElementById('hud-name');
    if (fill) fill.style.width = pct + '%';
    if (scorEl) scorEl.textContent = score;
    if (nameEl) nameEl.textContent = GameState.get('playerName');
    hudProgress = pct;
  }

  return {
    init, startLevel, stop, pause, resume,
    dpadPress, dpadRelease, playerJump, playerAction,
  };
})();
