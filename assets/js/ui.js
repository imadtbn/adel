// ============================================
// عادل - UI Controller
// assets/js/ui.js
// ============================================

const UI = (() => {
  let screens = {};
  let currentScreen = null;
  let avatarImg = null;  // cached HTMLImageElement

  // ─────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────
  function init() {
    // Gather screens
    document.querySelectorAll('.screen').forEach(s => {
      screens[s.id] = s;
    });

    // Load state
    GameState.load();
    
    // Build UI
    buildClothColors();
    buildAchievements();
    buildSettings();

    // Events
    GameEvents.on('level_complete', onLevelComplete);
    GameEvents.on('game_over', onGameOver);
    GameEvents.on('achievement_unlocked', EffectsSystem.showAchievementToast);

    // Init audio
    AudioSystem.init();

    // Show splash
    showScreen('screen-splash');
    animateSplash();

    // Create animated clouds in bg
    createBgClouds();
  }

  // ─────────────────────────────────────────
  // SCREEN MANAGEMENT
  // ─────────────────────────────────────────
  function showScreen(id) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    const target = screens[id] || document.getElementById(id);
    if (target) {
      target.classList.add('active');
      currentScreen = id;
    }

    // Stop game if leaving game screen
    if (id !== 'screen-game') {
      GameEngine.stop();
    }
    if (id === 'screen-map') {
      refreshMapScreen();
    }
    if (id === 'screen-achievements') {
      refreshAchievements();
    }
  }

  // ─────────────────────────────────────────
  // SPLASH
  // ─────────────────────────────────────────
  function animateSplash() {
    const state = GameState.get();
    // Update splash avatar
    const img = document.getElementById('splash-avatar');
    if (img && state.avatarData) {
      img.src = state.avatarData;
    }
    // Update player name in splash
    const nameEl = document.getElementById('splash-name');
    if (nameEl) nameEl.textContent = `مرحباً ${state.playerName}!`;
  }

  // ─────────────────────────────────────────
  // CHARACTER SETUP
  // ─────────────────────────────────────────
  function showCharacterSetup() {
    const state = GameState.get();
    
    const nameInput = document.getElementById('char-name');
    if (nameInput) nameInput.value = state.playerName;

    const avatar = document.getElementById('char-avatar');
    if (avatar && state.avatarData) avatar.src = state.avatarData;

    // Highlight active cloth color
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.color === state.clothColor);
    });

    showScreen('screen-character');
  }

  function saveCharacter() {
    const name = document.getElementById('char-name')?.value.trim() || 'عادل';
    GameState.set({
      playerName: name || 'عادل',
      firstPlay: false,
    });
    AudioSystem.playClick();
    animateSplash();
    showScreen('screen-map');
    AudioSystem.startBGM();
  }

  function selectClothColor(color) {
    GameState.set('clothColor', color);
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.color === color);
    });
    AudioSystem.playClick();
  }

  function triggerAvatarUpload() {
    document.getElementById('avatar-file-input')?.click();
  }

  function handleAvatarUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      GameState.set('avatarData', data);
      const els = ['splash-avatar', 'char-avatar', 'map-avatar'];
      els.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.src = data;
      });
      AudioSystem.playCollect();
      EffectsSystem.spawnParticle(window.innerWidth/2, window.innerHeight/2, '📸', 8);
    };
    reader.readAsDataURL(file);
  }

  // ─────────────────────────────────────────
  // MAP SCREEN
  // ─────────────────────────────────────────
  function refreshMapScreen() {
    const state = GameState.get();

    // Avatar
    const avatar = document.getElementById('map-avatar');
    if (avatar && state.avatarData) avatar.src = state.avatarData;

    // Name
    const nameEl = document.getElementById('map-player-name');
    if (nameEl) nameEl.textContent = state.playerName;

    // Stats
    const statEls = {
      'stat-growth':  state.growth,
      'stat-power':   state.power,
      'stat-energy':  state.energy,
      'stat-skill':   state.skill,
      'stat-speed':   state.speed,
      'stat-stars':   state.stars,
    };
    Object.entries(statEls).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = Math.round(val);
    });

    // Level cards
    renderLevelCards(state);
  }

  function renderLevelCards(state) {
    const grid = document.getElementById('levels-grid');
    if (!grid) return;
    grid.innerHTML = '';

    LEVELS_DATA.forEach(level => {
      const unlocked = GameState.isLevelUnlocked(level.id);
      const stars = state.levelStars[level.id] || 0;
      const completed = state.completedLevels.includes(level.id);

      const card = document.createElement('div');
      card.className = `level-card ${!unlocked ? 'locked' : ''}`;
      card.innerHTML = `
        ${!unlocked ? '<span class="lock-icon">🔒</span>' : ''}
        <span class="level-emoji">${level.emoji}</span>
        <div class="level-name">${level.name}</div>
        <div class="level-stars">${renderStars(stars)}</div>
      `;

      if (unlocked) {
        card.addEventListener('click', () => {
          AudioSystem.playClick();
          startGameLevel(level.id);
        });
      }

      grid.appendChild(card);
    });
  }

  function renderStars(count) {
    return Array.from({length: 3}, (_, i) => i < count ? '⭐' : '☆').join('');
  }

  // ─────────────────────────────────────────
  // GAME LEVEL
  // ─────────────────────────────────────────
  function startGameLevel(levelId) {
    const level = LEVELS_DATA.find(l => l.id === levelId);
    if (!level) return;

    showScreen('screen-game');

    // Show level intro
    showLevelIntro(level, () => {
      const canvas = document.getElementById('game-canvas');
      GameEngine.init(canvas);
      GameEngine.startLevel(levelId);
      AudioSystem.startBGM();
    });
  }

  function showLevelIntro(level, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'level-intro';
    overlay.innerHTML = `
      <div class="level-intro-box">
        <span class="level-intro-emoji">${level.emoji}</span>
        <div class="level-intro-title">${level.name}</div>
        <div class="level-intro-subtitle">${level.description}</div>
      </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
      callback();
    }, 2800);
  }

  // ─────────────────────────────────────────
  // LEVEL EVENTS
  // ─────────────────────────────────────────
  function onLevelComplete(data) {
    const modal = document.getElementById('modal-level-complete');
    const starsEl = document.getElementById('modal-stars');
    const scoreEl = document.getElementById('modal-score');
    const levelNameEl = document.getElementById('modal-level-name');

    const level = LEVELS_DATA.find(l => l.id === data.levelId);
    if (levelNameEl) levelNameEl.textContent = level?.name || 'المستوى';
    if (starsEl) starsEl.textContent = renderStars(data.stars);
    if (scoreEl) scoreEl.textContent = data.score;

    openModal('modal-level-complete');
    EffectsSystem.spawnParticle(window.innerWidth/2, window.innerHeight/2, '🌟', 12);
    EffectsSystem.spawnParticle(window.innerWidth/2, window.innerHeight/2, '⭐', 10);
  }

  function onGameOver(data) {
    const scoreEl = document.getElementById('modal-gameover-score');
    if (scoreEl) scoreEl.textContent = data.score;
    openModal('modal-gameover');
  }

  function retryLevel() {
    closeModal('modal-level-complete');
    closeModal('modal-gameover');
    const levelId = GameState.get('currentLevel');
    setTimeout(() => startGameLevel(levelId), 300);
  }

  function nextLevel() {
    closeModal('modal-level-complete');
    const state = GameState.get();
    const nextId = Math.min(state.currentLevel, GAME_CONFIG.maxLevel);
    setTimeout(() => startGameLevel(nextId), 300);
  }

  // ─────────────────────────────────────────
  // ACHIEVEMENTS
  // ─────────────────────────────────────────
  function buildAchievements() {
    refreshAchievements();
  }

  function refreshAchievements() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    const state = GameState.get();

    grid.innerHTML = '';
    ACHIEVEMENTS_DATA.forEach(ach => {
      const unlocked = state.unlockedAchievements.includes(ach.id);
      const div = document.createElement('div');
      div.className = `achievement-item ${unlocked ? 'unlocked' : 'achievement-locked'}`;
      div.innerHTML = `
        <span class="achievement-icon">${ach.icon}</span>
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-desc">${unlocked ? ach.desc : '???'}</div>
      `;
      grid.appendChild(div);
    });
  }

  // ─────────────────────────────────────────
  // SETTINGS
  // ─────────────────────────────────────────
  function buildSettings() {
    const state = GameState.get();
    const soundToggle = document.getElementById('toggle-sound');
    const musicToggle = document.getElementById('toggle-music');

    if (soundToggle) {
      soundToggle.checked = state.soundEnabled;
      soundToggle.addEventListener('change', () => {
        GameState.set('soundEnabled', soundToggle.checked);
        AudioSystem.setSoundEnabled(soundToggle.checked);
      });
    }
    if (musicToggle) {
      musicToggle.checked = state.musicEnabled;
      musicToggle.addEventListener('change', () => {
        GameState.set('musicEnabled', musicToggle.checked);
        AudioSystem.setMusicEnabled(musicToggle.checked);
      });
    }
  }

  // ─────────────────────────────────────────
  // CLOTH COLORS
  // ─────────────────────────────────────────
  function buildClothColors() {
    const container = document.getElementById('cloth-colors');
    if (!container) return;
    container.innerHTML = '';
    CLOTH_COLORS.forEach(color => {
      const sw = document.createElement('div');
      sw.className = 'color-swatch';
      sw.dataset.color = color;
      sw.style.background = color;
      sw.style.border = `3px solid ${color === '#000000' ? '#999' : 'transparent'}`;
      sw.addEventListener('click', () => selectClothColor(color));
      container.appendChild(sw);
    });
    // Highlight current
    const current = GameState.get('clothColor');
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.color === current);
    });
  }

  // ─────────────────────────────────────────
  // MODALS
  // ─────────────────────────────────────────
  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  }

  function closeModal(id) {
    const el = id ? document.getElementById(id) : null;
    if (el) {
      el.classList.remove('active');
    } else {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  }

  // ─────────────────────────────────────────
  // BACKGROUND CLOUDS
  // ─────────────────────────────────────────
  function createBgClouds() {
    const container = document.getElementById('bg-clouds');
    if (!container) return;
    for (let i = 0; i < 4; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'cloud';
      const w = 120 + Math.random() * 120;
      const h = 40 + Math.random() * 30;
      cloud.style.cssText = `
        width:${w}px; height:${h}px;
        top:${5 + Math.random() * 30}%;
        animation-duration:${20 + Math.random() * 30}s;
        animation-delay:-${Math.random() * 30}s;
      `;
      container.appendChild(cloud);
    }
    // Sun
    const sun = document.createElement('div');
    sun.className = 'sun';
    container.appendChild(sun);
  }

  // ─────────────────────────────────────────
  // D-PAD CONTROLS
  // ─────────────────────────────────────────
  function bindDpadButtons() {
    const btns = {
      'dpad-up':    'jump',
      'dpad-left':  'left',
      'dpad-right': 'right',
      'dpad-down':  'down',
    };
    Object.entries(btns).forEach(([id, dir]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const press = () => {
        AudioSystem.playClick();
        GameEngine.dpadPress(dir);
      };
      const release = () => GameEngine.dpadRelease(dir);
      btn.addEventListener('touchstart', press, { passive: true });
      btn.addEventListener('touchend', release, { passive: true });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
    });

    // Action buttons
    document.getElementById('btn-action-a')?.addEventListener('click', () => {
      GameEngine.playerAction();
    });
    document.getElementById('btn-action-b')?.addEventListener('click', () => {
      GameEngine.playerJump();
    });
  }

  // ─────────────────────────────────────────
  // RESET GAME
  // ─────────────────────────────────────────
  function confirmReset() {
    if (confirm('هل أنت متأكد؟ سيتم حذف جميع بياناتك!')) {
      GameState.reset();
      showScreen('screen-splash');
      AudioSystem.playClick();
    }
  }

  // Expose
  return {
    init, showScreen,
    showCharacterSetup, saveCharacter, triggerAvatarUpload, handleAvatarUpload,
    selectClothColor,
    refreshMapScreen,
    startGameLevel,
    retryLevel, nextLevel,
    openModal, closeModal,
    bindDpadButtons,
    confirmReset,
  };
})();
