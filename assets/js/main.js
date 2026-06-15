// ============================================
// عادل - Main Entry Point
// assets/js/main.js
// ============================================

// ── Global helpers (called from HTML onclick) ──

function handleSplashStart() {
  AudioSystem.resume();
  AudioSystem.playClick();
  const state = GameState.get();
  if (state.firstPlay) {
    UI.showCharacterSetup();
  } else {
    UI.showScreen('screen-map');
    AudioSystem.startBGM();
  }
}

function backFromGame() {
  AudioSystem.playClick();
  GameEngine.stop();
  AudioSystem.stopBGM();
  UI.showScreen('screen-map');
}

function goToMap() {
  UI.closeModal();
  GameEngine.stop();
  AudioSystem.stopBGM();
  setTimeout(() => UI.showScreen('screen-map'), 200);
}

// ── App Bootstrap ──
document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI (loads state, builds components)
  UI.init();

  // Bind D-pad buttons after DOM is ready
  UI.bindDpadButtons();

  // First interaction unlocks audio context
  document.addEventListener('click', () => AudioSystem.resume(), { once: true });
  document.addEventListener('touchstart', () => AudioSystem.resume(), { once: true });

  // Prevent default scroll/zoom behaviors
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // Listen for back button (mobile)
  window.addEventListener('popstate', () => {
    const activeScreen = document.querySelector('.screen.active')?.id;
    if (activeScreen === 'screen-game') backFromGame();
    else if (activeScreen !== 'screen-map' && activeScreen !== 'screen-splash') {
      UI.showScreen('screen-map');
    }
  });

  console.log('🌟 عادل - لعبة المغامرات التعليمية جاهزة!');
  console.log('Version: 1.0.0 | Ready for GitHub Pages');
});

// ── Service Worker (optional PWA support) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Uncomment to enable PWA:
    // navigator.serviceWorker.register('/sw.js');
  });
}
