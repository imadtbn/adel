// ============================================
// عادل - Game Data & Configuration
// data/gameData.js
// ============================================

const GAME_CONFIG = {
  version: '1.0.0',
  defaultPlayerName: 'عادل',
  defaultClothColor: '#2196F3',
  maxLevel: 7,

  // Stats limits
  stats: {
    growth:  { min: 0, max: 100, label: 'النمو',    icon: '🌱' },
    power:   { min: 0, max: 100, label: 'القوة',    icon: '💪' },
    energy:  { min: 0, max: 100, label: 'الطاقة',   icon: '⚡' },
    skill:   { min: 0, max: 100, label: 'المهارة',  icon: '⭐' },
    speed:   { min: 0, max: 100, label: 'السرعة',   icon: '🏃' },
    stars:   { min: 0, max: 999, label: 'النجوم',   icon: '⭐' },
    trophies:{ min: 0, max: 99,  label: 'الجوائز',  icon: '🏆' },
  }
};

// ── Level Definitions ──
const LEVELS_DATA = [
  {
    id: 1,
    name: 'البستان السعيد',
    emoji: '🍎',
    description: 'اجمع الثمار وتجنب العقبات!',
    bgColor: ['#87CEEB', '#A5D6A7', '#4CAF50'],
    groundColor: '#4CAF50',
    groundDark: '#388E3C',
    collectibles: [
      { emoji: '🍎', name: 'تفاحة',   points: 10, energy: 5, growth: 2 },
      { emoji: '🍊', name: 'برتقالة', points: 15, energy: 8, growth: 3 },
      { emoji: '🍇', name: 'عنب',     points: 20, energy: 10, growth: 4 },
      { emoji: '🌴', name: 'تمر',     points: 25, energy: 12, growth: 5 },
    ],
    obstacles: ['🪨', '🌵', '🕳️'],
    target: 10, // items to collect
    statBonus: { growth: 5, energy: 10 },
  },
  {
    id: 2,
    name: 'التمارين الرياضية',
    emoji: '🏃',
    description: 'اجرِ واقفز وطوّر قوتك!',
    bgColor: ['#FFF9C4', '#FFEE58', '#FDD835'],
    groundColor: '#8BC34A',
    groundDark: '#558B2F',
    collectibles: [
      { emoji: '💪', name: 'قوة',    points: 10, power: 8, speed: 3 },
      { emoji: '⚡', name: 'طاقة',   points: 15, energy: 10, speed: 5 },
      { emoji: '🏅', name: 'ميدالية', points: 30, power: 15, skill: 5 },
    ],
    obstacles: ['🪨', '🌵', '🏗️'],
    target: 8,
    statBonus: { power: 10, speed: 8 },
  },
  {
    id: 3,
    name: 'السباحة',
    emoji: '🏊',
    description: 'اسبح واجمع العناصر تحت الماء!',
    bgColor: ['#B3E5FC', '#29B6F6', '#0288D1'],
    groundColor: '#0288D1',
    groundDark: '#01579B',
    isWater: true,
    collectibles: [
      { emoji: '💎', name: 'جوهرة',   points: 20, skill: 8, energy: 5 },
      { emoji: '🐚', name: 'صدفة',    points: 10, growth: 3, energy: 3 },
      { emoji: '🌊', name: 'موجة',    points: 15, speed: 8, energy: 6 },
    ],
    obstacles: ['🪸', '🌊', '⚡'],
    target: 8,
    statBonus: { energy: 10, speed: 10 },
  },
  {
    id: 4,
    name: 'الصيد',
    emoji: '🎣',
    description: 'تعلّم الصيد وتعرّف على الأسماك!',
    bgColor: ['#E3F2FD', '#90CAF9', '#42A5F5'],
    groundColor: '#1565C0',
    groundDark: '#0D47A1',
    isWater: true,
    collectibles: [
      { emoji: '🐟', name: 'سمكة صغيرة', points: 10, skill: 5, energy: 3 },
      { emoji: '🐠', name: 'سمكة ملونة',  points: 20, skill: 8, growth: 4 },
      { emoji: '🐡', name: 'سمكة كروية',  points: 30, skill: 12, power: 5 },
      { emoji: '🦈', name: 'تجنّب القرش', points: 0,  energy: -15, isObstacle: true },
    ],
    target: 6,
    statBonus: { skill: 10, growth: 5 },
  },
  {
    id: 5,
    name: 'الفروسية',
    emoji: '🏇',
    description: 'اركب الحصان وتجوّل في الطبيعة!',
    bgColor: ['#FFF8E1', '#FFE082', '#FFD54F'],
    groundColor: '#795548',
    groundDark: '#4E342E',
    hasMount: true,
    collectibles: [
      { emoji: '🌟', name: 'نجمة',   points: 15, skill: 8, speed: 5 },
      { emoji: '🏆', name: 'كأس',    points: 40, skill: 15, power: 10 },
      { emoji: '🌸', name: 'زهرة',   points: 10, growth: 5, energy: 3 },
    ],
    obstacles: ['🪵', '🌳', '🪨'],
    target: 8,
    statBonus: { speed: 15, skill: 8 },
  },
  {
    id: 6,
    name: 'الرماية',
    emoji: '🏹',
    description: 'أصِب الهدف وطوّر دقتك!',
    bgColor: ['#F3E5F5', '#CE93D8', '#AB47BC'],
    groundColor: '#6A1B9A',
    groundDark: '#4A148C',
    isArchery: true,
    targets: [
      { emoji: '🎯', points: 20, skill: 10 },
      { emoji: '⭐', points: 10, skill: 5 },
      { emoji: '🌟', points: 30, skill: 15 },
    ],
    target: 10,
    statBonus: { skill: 15, power: 8 },
  },
  {
    id: 7,
    name: 'المبارزة',
    emoji: '⚔️',
    description: 'تعلّم المهارة الرياضية واكسب النقاط!',
    bgColor: ['#E0F2F1', '#80CBC4', '#26A69A'],
    groundColor: '#004D40',
    groundDark: '#00251A',
    isFencing: true,
    enemies: [
      { emoji: '🐸', name: 'ضفدع مرح',  health: 3, points: 15, skill: 5 },
      { emoji: '🐰', name: 'أرنب لطيف', health: 5, points: 25, skill: 8 },
      { emoji: '🦊', name: 'ثعلب ذكي',  health: 8, points: 40, skill: 12 },
    ],
    target: 5,
    statBonus: { skill: 15, power: 12 },
  },
];

// ── Achievements ──
const ACHIEVEMENTS_DATA = [
  { id: 'first_fruit',   icon: '🍎', name: 'أول ثمرة',    desc: 'اجمع أول ثمرة', condition: (s) => s.totalCollected >= 1 },
  { id: 'fruit_master',  icon: '🌟', name: 'محب الفاكهة', desc: 'اجمع 50 ثمرة',  condition: (s) => s.totalCollected >= 50 },
  { id: 'fast_runner',   icon: '🏃', name: 'العدّاء السريع', desc: 'أتمم مستوى الرياضة', condition: (s) => s.completedLevels.includes(2) },
  { id: 'swimmer',       icon: '🏊', name: 'السبّاح الماهر', desc: 'أتمم مستوى السباحة', condition: (s) => s.completedLevels.includes(3) },
  { id: 'fisher',        icon: '🎣', name: 'الصيّاد الصغير', desc: 'اصطد 10 أسماك', condition: (s) => s.totalFish >= 10 },
  { id: 'horseman',      icon: '🏇', name: 'الفارس الشجاع', desc: 'أتمم مستوى الفروسية', condition: (s) => s.completedLevels.includes(5) },
  { id: 'archer',        icon: '🏹', name: 'الرامي الدقيق', desc: 'أتمم مستوى الرماية', condition: (s) => s.completedLevels.includes(6) },
  { id: 'warrior',       icon: '⚔️', name: 'المحارب البطل', desc: 'أتمم جميع المستويات', condition: (s) => s.completedLevels.length >= 7 },
  { id: 'star_collector',icon: '⭐', name: 'جامع النجوم',  desc: 'اجمع 100 نجمة',  condition: (s) => s.stars >= 100 },
  { id: 'growth',        icon: '🌱', name: 'النمو الكبير', desc: 'ارفع النمو إلى 50', condition: (s) => s.growth >= 50 },
];

// ── Cloth Colors ──
const CLOTH_COLORS = [
  '#2196F3', '#F44336', '#4CAF50', '#FF9800',
  '#9C27B0', '#00BCD4', '#FF5722', '#607D8B',
  '#E91E63', '#FFEB3B', '#795548', '#000000',
];
