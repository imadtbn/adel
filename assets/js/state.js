// ============================================
// عادل - Game State & Save System
// assets/js/state.js
// ============================================

const GameState = (() => {
  const SAVE_KEY = 'adel_game_v1';

  // Default player state
  const defaultState = () => ({
    playerName: 'عادل',
    clothColor: '#2196F3',
    avatarData: null,      // base64 image data
    currentLevel: 1,
    completedLevels: [],
    
    // Core stats
    growth: 10,
    power: 10,
    energy: 50,
    skill: 10,
    speed: 10,
    stars: 0,
    trophies: 0,
    
    // Achievement tracking
    totalCollected: 0,
    totalFish: 0,
    
    // Level stars (0-3 per level)
    levelStars: {},
    
    // Settings
    soundEnabled: true,
    musicEnabled: true,
    
    // Meta
    firstPlay: true,
    totalPlayTime: 0,
    lastPlayed: null,
    unlockedAchievements: [],
  });

  let state = defaultState();

  // ── Load from localStorage ──
  function load() {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = { ...defaultState(), ...parsed };
        console.log('✅ Game loaded:', state.playerName);
      }
    } catch (e) {
      console.warn('Failed to load save:', e);
      state = defaultState();
    }
    return state;
  }

  // ── Save to localStorage ──
  function save() {
    try {
      state.lastPlayed = new Date().toISOString();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save:', e);
    }
  }

  // ── Reset ──
  function reset() {
    state = defaultState();
    save();
    return state;
  }

  // ── Get ──
  function get(key) {
    return key ? state[key] : { ...state };
  }

  // ── Set ──
  function set(key, value) {
    if (typeof key === 'object') {
      Object.assign(state, key);
    } else {
      state[key] = value;
    }
    save();
  }

  // ── Add to stat (with clamping) ──
  function addStat(stat, amount) {
    const config = GAME_CONFIG.stats[stat];
    if (!config) return;
    const current = state[stat] || 0;
    const newVal = Math.max(config.min, Math.min(config.max, current + amount));
    state[stat] = newVal;
    save();
    return newVal;
  }

  // ── Complete a level ──
  function completeLevel(levelId, stars = 1) {
    if (!state.completedLevels.includes(levelId)) {
      state.completedLevels.push(levelId);
    }
    // Update stars
    const current = state.levelStars[levelId] || 0;
    state.levelStars[levelId] = Math.max(current, stars);

    // Unlock next level
    if (levelId < GAME_CONFIG.maxLevel) {
      state.currentLevel = Math.max(state.currentLevel, levelId + 1);
    }

    // Apply level stat bonus
    const levelData = LEVELS_DATA.find(l => l.id === levelId);
    if (levelData?.statBonus) {
      Object.entries(levelData.statBonus).forEach(([stat, val]) => {
        addStat(stat, val);
      });
    }

    state.trophies += 1;
    save();
    checkAchievements();
  }

  // ── Check achievements ──
  function checkAchievements() {
    const newlyUnlocked = [];
    ACHIEVEMENTS_DATA.forEach(ach => {
      if (!state.unlockedAchievements.includes(ach.id)) {
        try {
          if (ach.condition(state)) {
            state.unlockedAchievements.push(ach.id);
            newlyUnlocked.push(ach);
          }
        } catch(e) {}
      }
    });
    if (newlyUnlocked.length > 0) {
      save();
      newlyUnlocked.forEach(ach => {
        GameEvents.emit('achievement_unlocked', ach);
      });
    }
    return newlyUnlocked;
  }

  // ── Is level unlocked? ──
  function isLevelUnlocked(levelId) {
    if (levelId === 1) return true;
    return state.completedLevels.includes(levelId - 1) || state.currentLevel >= levelId;
  }

  return { load, save, reset, get, set, addStat, completeLevel, checkAchievements, isLevelUnlocked };
})();

// ── Simple Event System ──
const GameEvents = (() => {
  const listeners = {};

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  }

  function off(event, fn) {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(f => f !== fn);
    }
  }

  function emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
  }

  return { on, off, emit };
})();
