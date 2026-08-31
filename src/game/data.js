export const TOWERS = {
  flame: {
    id: "flame", name: "Flame Tower", icon: "🔥", cost: 45, damage: 18, range: 150, fireRate: 850,
    projectile: 0xff8a4c, body: 0xc94b29,
  },
  volt: {
    id: "volt", name: "Volt Tower", icon: "⚡", cost: 60, damage: 25, range: 170, fireRate: 1150,
    projectile: 0x7de7ff, body: 0x315bd8,
  },
  frost: {
    id: "frost", name: "Frost Tower", icon: "❄", cost: 50, damage: 12, range: 145, fireRate: 950,
    projectile: 0xbceeff, body: 0x3187a8, slow: 0.72,
  },
};

export const ENEMIES = {
  scout: { name: "Scout Bot", hp: 70, speed: 64, damage: 8, radius: 14, color: 0xe85167, reward: 7 },
  runner: { name: "Runner", hp: 52, speed: 92, damage: 7, radius: 12, color: 0xffbf5c, reward: 8 },
  brute: { name: "Brute", hp: 150, speed: 43, damage: 14, radius: 18, color: 0xb778ff, reward: 12 },
  shield: { name: "Shield Drone", hp: 115, speed: 52, damage: 11, radius: 16, color: 0x56d6ba, reward: 11 },
  boss: { name: "OMEGA DRILLER", hp: 900, speed: 31, damage: 38, radius: 34, color: 0xff4f83, reward: 100 },
};

export const WAVES = [
  ["scout", "scout", "runner", "scout", "runner"],
  ["scout", "runner", "runner", "brute", "scout", "shield"],
  ["runner", "brute", "shield", "runner", "brute", "shield", "scout"],
  ["boss"],
];

export const ROGUELITE_UPGRADES = [
  { id: "rapid-fire", title: "Rapid Fire", description: "Tất cả tower bắn nhanh hơn 12%.", stat: "fireRate", multiplier: 0.88 },
  { id: "overcharge", title: "Overcharge", description: "Tất cả tower +18% sát thương.", stat: "damage", multiplier: 1.18 },
  { id: "long-lens", title: "Long Lens", description: "Tất cả tower +12% tầm bắn.", stat: "range", multiplier: 1.12 },
  { id: "energy-bank", title: "Energy Bank", description: "+35 Math Energy ngay lập tức.", stat: "energy", flat: 35 },
];
