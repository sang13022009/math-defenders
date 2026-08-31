import * as Phaser from "phaser";
import { TOWERS, ENEMIES, WAVES, ROGUELITE_UPGRADES } from "./data.js";
import { QuestionEngine } from "../learning/QuestionEngine.js";
import { ProfileStore } from "../learning/ProfileStore.js";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.questionEngine = new QuestionEngine();
    this.profileStore = new ProfileStore();
  }

  create() {
    this.bridge = window.mathDefendersBridge;
    this.pathPoints = [
      { x: -35, y: 170 }, { x: 210, y: 170 }, { x: 210, y: 360 },
      { x: 480, y: 360 }, { x: 480, y: 205 }, { x: 760, y: 205 },
      { x: 760, y: 470 }, { x: 1050, y: 470 }, { x: 1050, y: 330 },
      { x: 1245, y: 330 },
    ];

    this.buildWorld();
    this.resetState();
    this.bindBridge();
    this.showIdleMessage();
  }

  bindBridge() {
    this.onStart = (event) => this.startRun(event.detail.profile);
    this.onAnswer = (event) => this.resolveAnswer(event.detail.value);
    this.onEnergy = () => this.requestQuestion("energy");
    this.onHeroSkill = () => this.requestHeroSkill();

    this.bridge.addEventListener("md:start", this.onStart);
    this.bridge.addEventListener("md:answer", this.onAnswer);
    this.bridge.addEventListener("md:energy", this.onEnergy);
    this.bridge.addEventListener("md:hero-skill", this.onHeroSkill);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.bridge.removeEventListener("md:start", this.onStart);
      this.bridge.removeEventListener("md:answer", this.onAnswer);
      this.bridge.removeEventListener("md:energy", this.onEnergy);
      this.bridge.removeEventListener("md:hero-skill", this.onHeroSkill);
    });
  }

  buildWorld() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x071525, 0x071525, 0x040912, 0x040912, 1);
    bg.fillRect(0, 0, 1280, 720);

    const skyline = this.add.graphics();
    for (let i = 0; i < 18; i += 1) {
      const width = 48 + (i % 4) * 16;
      const height = 55 + ((i * 37) % 120);
      const x = i * 78 - 20;
      skyline.fillStyle(i % 2 ? 0x0b2137 : 0x0d2941, 0.8);
      skyline.fillRect(x, 125 - height, width, height);
      skyline.fillStyle(0x57d9ff, 0.25);
      for (let y = 125 - height + 14; y < 110; y += 20) {
        skyline.fillRect(x + 10, y, 5, 5);
        skyline.fillRect(x + 27, y, 5, 5);
      }
    }

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2b7092, 0.12);
    for (let x = 0; x <= 1280; x += 64) grid.lineBetween(x, 0, x, 720);
    for (let y = 0; y <= 720; y += 64) grid.lineBetween(0, y, 1280, y);

    const road = this.add.graphics();
    road.lineStyle(62, 0x142235, 1);
    road.beginPath();
    road.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
    this.pathPoints.slice(1).forEach((p) => road.lineTo(p.x, p.y));
    road.strokePath();
    road.lineStyle(3, 0x3f7597, 0.46);
    road.beginPath();
    road.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
    this.pathPoints.slice(1).forEach((p) => road.lineTo(p.x, p.y));
    road.strokePath();

    this.portal = this.add.circle(18, 170, 34, 0x9a42ff, 0.35).setStrokeStyle(4, 0xcf8cff, 0.8);
    this.add.text(28, 119, "ENEMY PORTAL", { fontFamily: "system-ui", fontSize: "13px", color: "#d8b6ff", fontStyle: "bold" });

    this.core = this.add.container(1190, 330);
    const coreGlow = this.add.circle(0, 0, 52, 0x4ae7ff, 0.12);
    const coreBody = this.add.rectangle(0, 0, 68, 88, 0x1a7198, 1).setStrokeStyle(3, 0x86ecff, 0.9);
    const coreGem = this.add.diamond(0, -8, 34, 46, 0x7ff7ff, 0.95);
    const coreText = this.add.text(0, 58, "FAMILY CORE", { fontFamily: "system-ui", fontSize: "12px", color: "#a9edff", fontStyle: "bold" }).setOrigin(0.5);
    this.core.add([coreGlow, coreBody, coreGem, coreText]);
    this.tweens.add({ targets: coreGlow, scale: 1.16, alpha: 0.26, duration: 900, yoyo: true, repeat: -1 });

    this.hero = this.add.container(1115, 575);
    const heroGlow = this.add.circle(0, 0, 35, 0x54cfff, 0.12);
    const heroBody = this.add.rectangle(0, 0, 38, 50, 0x2258a8).setStrokeStyle(2, 0x7fe4ff);
    const heroHead = this.add.circle(0, -33, 17, 0x7aa9ff).setStrokeStyle(2, 0xb8f4ff);
    const heroEye = this.add.rectangle(0, -34, 18, 5, 0x9effff);
    const heroLabel = this.add.text(0, 47, "BOLT", { fontFamily: "system-ui", fontSize: "12px", color: "#8defff", fontStyle: "bold" }).setOrigin(0.5);
    this.hero.add([heroGlow, heroBody, heroHead, heroEye, heroLabel]);
    this.tweens.add({ targets: hero, y: 570, duration: 1150, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.createTowerSpots();
    this.createTowerPalette();
  }

  createTowerSpots() {
    const coords = [
      [125, 270], [318, 282], [390, 465], [600, 300], [650, 525], [860, 350], [915, 565], [1010, 220],
    ];
    this.towerSpots = coords.map(([x, y], index) => {
      const ring = this.add.circle(x, y, 27, 0x0c1c2b, 0.92).setStrokeStyle(2, 0x4ba3c7, 0.5);
      const plus = this.add.text(x, y - 1, "+", { fontFamily: "system-ui", fontSize: "27px", color: "#6aa7bf" }).setOrigin(0.5);
      ring.setInteractive({ useHandCursor: true });
      ring.on("pointerdown", () => this.placeTowerAt(index));
      return { x, y, ring, plus, tower: null };
    });
  }

  createTowerPalette() {
    this.selectedTowerType = "flame";
    this.paletteButtons = [];
    ["flame", "volt", "frost"].forEach((type, index) => {
      const def = TOWERS[type];
      const x = 170 + index * 150;
      const y = 655;
      const box = this.add.rectangle(x, y, 132, 54, 0x0a1727, 0.96)
        .setStrokeStyle(2, type === this.selectedTowerType ? 0x65e8ff : 0x2f5870, 0.9)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y, `${def.icon} ${def.name.replace(" Tower", "")}\n${def.cost} ENERGY`, {
        align: "center", fontFamily: "system-ui", fontSize: "12px", color: "#d7f4ff", fontStyle: "bold",
      }).setOrigin(0.5);
      box.on("pointerdown", () => this.selectTower(type));
      label.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.selectTower(type));
      this.paletteButtons.push({ type, box });
    });

    this.add.text(24, 635, "BUILD", { fontFamily: "system-ui", fontSize: "12px", color: "#6397b0", fontStyle: "bold" });
    this.selectedTowerText = this.add.text(560, 648, "Chọn vị trí trống để xây tower", {
      fontFamily: "system-ui", fontSize: "14px", color: "#85b9ce",
    });
  }

  selectTower(type) {
    if (!this.running) return;
    this.selectedTowerType = type;
    this.paletteButtons.forEach(({ type: itemType, box }) => {
      box.setStrokeStyle(2, itemType === type ? 0x65e8ff : 0x2f5870, 0.9);
    });
    this.toast(`Đã chọn ${TOWERS[type].icon} ${TOWERS[type].name}`);
  }

  resetState() {
    this.running = false;
    this.profile = null;
    this.energy = 0;
    this.coreHp = 100;
    this.waveIndex = -1;
    this.activeEnemies = [];
    this.pendingSpawnCount = 0;
    this.towers = [];
    this.pendingQuestion = null;
    this.bossShieldQueued = false;
    this.bossShieldQuestionShown = false;
    this.modifiers = { damage: 1, range: 1, fireRate: 1 };
    this.session = { attempts: 0, correct: 0, independentCorrect: 0, skills: {}, startedAt: 0, enemiesDefeated: 0 };
  }

  clearDynamicObjects() {
    this.activeEnemies.forEach((enemy) => enemy.container?.destroy());
    this.activeEnemies = [];
    this.towers.forEach((tower) => tower.container?.destroy());
    this.towers = [];
    this.towerSpots.forEach((spot) => {
      spot.tower = null;
      spot.ring.setVisible(true);
      spot.plus.setVisible(true);
    });
    if (this.centerMessage) this.centerMessage.destroy();
    if (this.upgradePanel) this.upgradePanel.destroy();
  }

  showIdleMessage() {
    this.centerMessage = this.add.text(640, 355, "CHỌN HỒ SƠ ĐỂ BẮT ĐẦU", {
      fontFamily: "system-ui", fontSize: "30px", color: "#8eddf6", fontStyle: "bold",
      stroke: "#05111c", strokeThickness: 7,
    }).setOrigin(0.5);
  }

  startRun(profile) {
    this.clearDynamicObjects();
    this.resetState();
    this.profile = profile;
    this.running = true;
    this.energy = 100;
    this.coreHp = 100;
    this.session.startedAt = Date.now();
    this.selectedTowerType = "flame";
    this.selectTower("flame");
    this.emitStatus();

    this.centerMessage = this.add.text(640, 350, `⚠ MECHA CITY\n${profile.name.toUpperCase()} — READY`, {
      align: "center", fontFamily: "system-ui", fontSize: "31px", color: "#e7fbff", fontStyle: "bold",
      stroke: "#05111c", strokeThickness: 8,
    }).setOrigin(0.5).setScale(0.8).setAlpha(0);
    this.tweens.add({
      targets: this.centerMessage, alpha: 1, scale: 1, duration: 380, yoyo: true, hold: 900,
      onComplete: () => { this.centerMessage?.destroy(); this.centerMessage = null; this.beginNextWave(); },
    });
  }

  beginNextWave() {
    if (!this.running) return;
    this.waveIndex += 1;
    const wave = WAVES[this.waveIndex];
    if (!wave) return this.endRun(true);
    this.pendingSpawnCount = wave.length;
    this.emitStatus();
    this.waveBanner(this.waveIndex === WAVES.length - 1 ? "⚠ FINAL BOSS" : `WAVE ${this.waveIndex + 1}`);

    wave.forEach((enemyType, index) => {
      this.time.delayedCall(650 + index * 900, () => {
        if (!this.running) return;
        this.spawnEnemy(enemyType);
        this.pendingSpawnCount -= 1;
        this.checkWaveComplete();
      });
    });
  }

  waveBanner(text) {
    const banner = this.add.text(640, 92, text, {
      fontFamily: "system-ui", fontSize: "28px", color: "#e9fbff", fontStyle: "bold",
      stroke: "#06111d", strokeThickness: 7,
    }).setOrigin(0.5).setAlpha(0).setScale(0.7);
    this.tweens.add({ targets: banner, alpha: 1, scale: 1, duration: 250, yoyo: true, hold: 750, onComplete: () => banner.destroy() });
  }

  spawnEnemy(type) {
    const base = ENEMIES[type];
    const scaleFactor = 1 + this.waveIndex * 0.11;
    const enemy = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      isBoss: type === "boss",
      hp: Math.round(base.hp * scaleFactor),
      maxHp: Math.round(base.hp * scaleFactor),
      speed: base.speed,
      baseSpeed: base.speed,
      damage: base.damage,
      reward: base.reward,
      pathIndex: 1,
      slowUntil: 0,
      shielded: false,
      phase2Triggered: false,
      dead: false,
    };

    const body = this.add.circle(0, 0, base.radius, base.color, 1).setStrokeStyle(enemy.isBoss ? 5 : 2, 0xffffff, enemy.isBoss ? 0.8 : 0.32);
    const eye = this.add.rectangle(0, -2, Math.max(9, base.radius * 0.9), 4, enemy.isBoss ? 0xffffb0 : 0xe9fbff, 0.95);
    const hpBg = this.add.rectangle(0, -base.radius - 12, enemy.isBoss ? 78 : 36, 5, 0x140a13, 0.9);
    const hpBar = this.add.rectangle(-(enemy.isBoss ? 78 : 36) / 2, -base.radius - 12, enemy.isBoss ? 78 : 36, 5, 0x68f2aa, 1).setOrigin(0, 0.5);
    const label = enemy.isBoss
      ? this.add.text(0, -58, "OMEGA DRILLER", { fontFamily: "system-ui", fontSize: "12px", color: "#ff9cb2", fontStyle: "bold" }).setOrigin(0.5)
      : null;
    const items = [body, eye, hpBg, hpBar];
    if (label) items.push(label);
    enemy.container = this.add.container(this.pathPoints[0].x, this.pathPoints[0].y, items);
    enemy.hpBar = hpBar;
    enemy.hpBarWidth = enemy.isBoss ? 78 : 36;
    enemy.body = body;
    this.activeEnemies.push(enemy);

    if (enemy.isBoss) {
      this.cameras.main.shake(420, 0.007);
      this.toast("⚠ OMEGA DRILLER đã xuất hiện!");
    }
  }

  placeTowerAt(index) {
    if (!this.running || this.pendingQuestion) return;
    const spot = this.towerSpots[index];
    if (spot.tower) return;
    const def = TOWERS[this.selectedTowerType];
    if (this.energy < def.cost) {
      this.toast(`Cần ${def.cost} Math Energy. Hãy giải Toán để nạp!`);
      return;
    }

    this.energy -= def.cost;
    const tower = this.createTower(this.selectedTowerType, spot.x, spot.y);
    spot.tower = tower;
    tower.spotIndex = index;
    this.towers.push(tower);
    spot.ring.setVisible(false);
    spot.plus.setVisible(false);
    this.emitStatus();
    this.cameras.main.flash(90, 40, 160, 220, false);
  }

  createTower(type, x, y) {
    const def = TOWERS[type];
    const glow = this.add.circle(0, 0, 29, def.projectile, 0.1);
    const base = this.add.circle(0, 0, 22, 0x0c1722, 1).setStrokeStyle(2, def.projectile, 0.65);
    const body = this.add.rectangle(0, -4, 25, 30, def.body).setStrokeStyle(2, 0xffffff, 0.26);
    const gun = this.add.rectangle(0, -22, 8, 25, def.projectile, 0.95);
    const levelLabel = this.add.text(0, 24, "LV.1", { fontFamily: "system-ui", fontSize: "10px", color: "#d9f8ff", fontStyle: "bold" }).setOrigin(0.5);
    const container = this.add.container(x, y, [glow, base, body, gun, levelLabel]).setSize(54, 54).setInteractive({ useHandCursor: true });
    const tower = { type, container, gun, glow, levelLabel, level: 1, lastShotAt: 0 };
    container.on("pointerdown", () => this.requestTowerUpgrade(tower));
    this.tweens.add({ targets: glow, alpha: 0.24, scale: 1.15, duration: 900, yoyo: true, repeat: -1 });
    return tower;
  }

  requestTowerUpgrade(tower) {
    if (!this.running || this.pendingQuestion) return;
    const cost = 30 + (tower.level - 1) * 15;
    if (this.energy < cost) {
      this.toast(`Nâng cấp LV.${tower.level + 1} cần ${cost} Energy.`);
      return;
    }
    this.requestQuestion("towerUpgrade", { tower, cost });
  }

  requestHeroSkill() {
    if (!this.running || this.pendingQuestion) return;
    if (this.energy < 35) {
      this.toast("Hero Skill cần 35 Math Energy.");
      return;
    }
    this.requestQuestion("heroSkill", { cost: 35 });
  }

  requestQuestion(context, payload = {}) {
    if (!this.running || this.pendingQuestion) return;
    const preferredSkill = context === "energy" ? this.profileStore.weakestSkill(this.profile) : null;
    const question = this.questionEngine.generate(this.profile.grade, preferredSkill);
    this.pendingQuestion = { question, context, payload, usedHint: false };
    this.bridge.dispatchEvent(new CustomEvent("md:question", { detail: { question, context } }));
  }

  resolveAnswer(value) {
    if (!this.running || !this.pendingQuestion) return;
    const pending = this.pendingQuestion;
    const correct = String(value) === String(pending.question.answer);
    this.session.attempts += 1;
    if (correct) {
      this.session.correct += 1;
      if (!pending.usedHint) this.session.independentCorrect += 1;
    }
    const sessionSkill = this.session.skills[pending.question.skill] || { attempts: 0, correct: 0 };
    sessionSkill.attempts += 1;
    if (correct) sessionSkill.correct += 1;
    this.session.skills[pending.question.skill] = sessionSkill;
    this.profileStore.recordAttempt(this.profile, pending.question, correct, pending.usedHint);

    if (!correct) {
      pending.usedHint = true;
      this.bridge.dispatchEvent(new CustomEvent("md:feedback", {
        detail: { correct: false, hint: pending.question.hint, message: "Chưa đủ năng lượng — dùng gợi ý rồi thử lại!" },
      }));
      return;
    }

    this.applyCorrectAnswerReward(pending);
    this.pendingQuestion = null;
    this.bridge.dispatchEvent(new CustomEvent("md:feedback", {
      detail: { correct: true, message: pending.usedHint ? "Đúng rồi! Hệ thống đã ổn định." : "PERFECT! Math Power đã kích hoạt." },
    }));
    this.emitStatus();

    if (this.bossShieldQueued && !this.bossShieldQuestionShown) {
      this.time.delayedCall(850, () => this.triggerBossShieldQuestion());
    }
  }

  applyCorrectAnswerReward(pending) {
    if (pending.context === "energy") {
      const gain = pending.usedHint ? 16 : 28;
      this.energy = clamp(this.energy + gain, 0, 220);
      this.energyBurst(gain);
      return;
    }

    if (pending.context === "heroSkill") {
      this.energy -= pending.payload.cost;
      this.heroUltimate();
      return;
    }

    if (pending.context === "towerUpgrade") {
      const { tower, cost } = pending.payload;
      if (!tower?.container?.active) return;
      this.energy -= cost;
      tower.level += 1;
      tower.levelLabel.setText(`LV.${tower.level}`);
      tower.container.setScale(1 + Math.min(0.22, (tower.level - 1) * 0.06));
      this.tweens.add({ targets: tower.container, angle: 360, duration: 430, ease: "Back.easeOut" });
      this.cameras.main.flash(120, 60, 190, 255, false);
      return;
    }

    if (pending.context === "bossShield") {
      const boss = this.activeEnemies.find((e) => e.isBoss && !e.dead);
      if (boss) {
        boss.shielded = false;
        boss.speed = boss.baseSpeed * 1.24;
        boss.body.setStrokeStyle(5, 0xffffff, 0.85);
        this.bossShieldQueued = false;
        this.cameras.main.shake(300, 0.009);
        this.damageEnemy(boss, 170, null, true);
        this.toast("💥 ARMOR BREAK — Boss nhận sát thương lớn!");
      }
    }
  }

  energyBurst(gain) {
    const text = this.add.text(this.hero.x, this.hero.y - 75, `+${gain} ENERGY`, {
      fontFamily: "system-ui", fontSize: "18px", color: "#70f6c0", fontStyle: "bold",
      stroke: "#07121d", strokeThickness: 5,
    }).setOrigin(0.5);
    this.tweens.add({ targets: text, y: text.y - 45, alpha: 0, duration: 850, onComplete: () => text.destroy() });
    this.tweens.add({ targets: this.hero, scale: 1.16, duration: 130, yoyo: true });
  }

  heroUltimate() {
    this.cameras.main.shake(320, 0.012);
    const beam = this.add.rectangle(640, 355, 1280, 10, 0x73efff, 0.88).setScale(0, 1);
    this.tweens.add({
      targets: beam, scaleX: 1, duration: 170, yoyo: true, hold: 110,
      onComplete: () => beam.destroy(),
    });
    this.activeEnemies.filter((e) => !e.dead).forEach((enemy) => this.damageEnemy(enemy, enemy.isBoss ? 110 : 90, null, true));
    this.toast("⚡ BOLT: THUNDER GRID!");
  }

  damageEnemy(enemy, amount, tower = null, ignoreShield = false) {
    if (!enemy || enemy.dead || !enemy.container?.active) return;
    if (enemy.shielded && !ignoreShield) {
      this.tweens.add({ targets: enemy.container, scale: 1.08, duration: 80, yoyo: true });
      return;
    }

    enemy.hp -= amount;
    const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
    enemy.hpBar.width = enemy.hpBarWidth * ratio;
    this.tweens.add({ targets: enemy.container, alpha: 0.55, duration: 60, yoyo: true });

    if (tower?.type === "frost") enemy.slowUntil = this.time.now + 1500;

    if (enemy.isBoss && !enemy.phase2Triggered && enemy.hp <= enemy.maxHp * 0.5) {
      enemy.phase2Triggered = true;
      enemy.shielded = true;
      enemy.speed = 0;
      enemy.body.setStrokeStyle(8, 0xffc75c, 0.95);
      this.bossShieldQueued = true;
      this.bossShieldQuestionShown = false;
      this.waveBanner("⚠ DIVISION ARMOR");
      this.triggerBossShieldQuestion();
    }

    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  triggerBossShieldQuestion() {
    if (!this.bossShieldQueued || this.bossShieldQuestionShown || this.pendingQuestion) return;
    this.bossShieldQuestionShown = true;
    this.requestQuestion("bossShield");
  }

  killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    this.energy = clamp(this.energy + enemy.reward, 0, 220);
    this.session.enemiesDefeated += 1;
    const burst = this.add.circle(enemy.container.x, enemy.container.y, enemy.isBoss ? 45 : 22, enemy.isBoss ? 0xffd36a : 0x74e8ff, 0.7);
    this.tweens.add({ targets: burst, scale: 2.4, alpha: 0, duration: 360, onComplete: () => burst.destroy() });
    enemy.container.destroy();
    this.activeEnemies = this.activeEnemies.filter((item) => item !== enemy);
    this.emitStatus();
    this.checkWaveComplete();
  }

  enemyReachedCore(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    this.coreHp = clamp(this.coreHp - enemy.damage, 0, 100);
    enemy.container.destroy();
    this.activeEnemies = this.activeEnemies.filter((item) => item !== enemy);
    this.cameras.main.shake(220, enemy.isBoss ? 0.018 : 0.008);
    this.tweens.add({ targets: this.core, scale: 1.12, duration: 90, yoyo: true });
    this.emitStatus();
    if (this.coreHp <= 0) this.endRun(false);
    else this.checkWaveComplete();
  }

  checkWaveComplete() {
    if (!this.running || this.pendingSpawnCount > 0 || this.activeEnemies.some((e) => !e.dead)) return;
    if (this.waveIndex >= WAVES.length - 1) {
      this.endRun(true);
      return;
    }
    this.time.delayedCall(650, () => this.showUpgradeChoice());
  }

  showUpgradeChoice() {
    if (!this.running || this.upgradePanel) return;
    const choices = [...ROGUELITE_UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
    this.upgradePanel = this.add.container(640, 355);
    const dim = this.add.rectangle(0, 0, 860, 380, 0x04101d, 0.97).setStrokeStyle(2, 0x58dbff, 0.45);
    const title = this.add.text(0, -145, "WAVE CLEARED — CHỌN NÂNG CẤP", {
      fontFamily: "system-ui", fontSize: "24px", color: "#a5f2ff", fontStyle: "bold",
    }).setOrigin(0.5);
    this.upgradePanel.add([dim, title]);

    choices.forEach((upgrade, index) => {
      const x = -260 + index * 260;
      const card = this.add.rectangle(x, 15, 220, 190, 0x0d2137, 1).setStrokeStyle(2, 0x386f91, 0.9).setInteractive({ useHandCursor: true });
      const cardTitle = this.add.text(x, -36, upgrade.title, { fontFamily: "system-ui", fontSize: "20px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
      const desc = this.add.text(x, 20, upgrade.description, { fontFamily: "system-ui", fontSize: "14px", color: "#a9bfd1", align: "center", wordWrap: { width: 180 } }).setOrigin(0.5);
      const choose = this.add.text(x, 82, "CHỌN", { fontFamily: "system-ui", fontSize: "13px", color: "#67eaff", fontStyle: "bold" }).setOrigin(0.5);
      const select = () => this.applyUpgrade(upgrade);
      card.on("pointerdown", select);
      cardTitle.setInteractive({ useHandCursor: true }).on("pointerdown", select);
      desc.setInteractive({ useHandCursor: true }).on("pointerdown", select);
      choose.setInteractive({ useHandCursor: true }).on("pointerdown", select);
      this.upgradePanel.add([card, cardTitle, desc, choose]);
    });
  }

  applyUpgrade(upgrade) {
    if (!this.upgradePanel) return;
    if (upgrade.stat === "energy") this.energy = clamp(this.energy + upgrade.flat, 0, 220);
    else this.modifiers[upgrade.stat] *= upgrade.multiplier;
    this.upgradePanel.destroy();
    this.upgradePanel = null;
    this.emitStatus();
    this.toast(`${upgrade.title} đã kích hoạt!`);
    this.time.delayedCall(900, () => this.beginNextWave());
  }

  update(time, delta) {
    if (!this.running) return;
    this.updateEnemies(time, delta);
    this.updateTowers(time);
    if (this.bossShieldQueued && !this.bossShieldQuestionShown && !this.pendingQuestion) this.triggerBossShieldQuestion();
  }

  updateEnemies(time, delta) {
    const dt = delta / 1000;
    this.activeEnemies.forEach((enemy) => {
      if (enemy.dead || enemy.shielded) return;
      const target = this.pathPoints[enemy.pathIndex];
      if (!target) {
        this.enemyReachedCore(enemy);
        return;
      }
      const dx = target.x - enemy.container.x;
      const dy = target.y - enemy.container.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 5) {
        enemy.pathIndex += 1;
        if (enemy.pathIndex >= this.pathPoints.length) this.enemyReachedCore(enemy);
        return;
      }
      const slowed = time < enemy.slowUntil;
      const speed = slowed ? enemy.baseSpeed * (TOWERS.frost.slow || 0.72) : enemy.speed || enemy.baseSpeed;
      const step = Math.min(distance, speed * dt);
      enemy.container.x += (dx / distance) * step;
      enemy.container.y += (dy / distance) * step;
      if (enemy.isBoss) enemy.container.rotation += dt * 0.25;
    });
  }

  updateTowers(time) {
    this.towers.forEach((tower) => {
      if (!tower.container?.active) return;
      const def = TOWERS[tower.type];
      const fireRate = def.fireRate * this.modifiers.fireRate * Math.pow(0.92, tower.level - 1);
      if (time - tower.lastShotAt < fireRate) return;
      const range = def.range * this.modifiers.range * (1 + (tower.level - 1) * 0.05);
      const candidates = this.activeEnemies
        .filter((enemy) => !enemy.dead && enemy.container?.active)
        .map((enemy) => ({ enemy, distance: Phaser.Math.Distance.Between(tower.container.x, tower.container.y, enemy.container.x, enemy.container.y) }))
        .filter((entry) => entry.distance <= range)
        .sort((a, b) => a.enemy.pathIndex - b.enemy.pathIndex || a.distance - b.distance);
      const target = candidates.at(-1)?.enemy;
      if (!target) return;
      tower.lastShotAt = time;
      this.fireProjectile(tower, target);
    });
  }

  fireProjectile(tower, enemy) {
    const def = TOWERS[tower.type];
    const angle = Phaser.Math.Angle.Between(tower.container.x, tower.container.y, enemy.container.x, enemy.container.y);
    tower.gun.rotation = angle + Math.PI / 2;
    const projectile = this.add.circle(tower.container.x, tower.container.y - 8, tower.type === "volt" ? 6 : 5, def.projectile, 1);
    this.tweens.add({
      targets: projectile,
      x: enemy.container.x,
      y: enemy.container.y,
      duration: tower.type === "volt" ? 120 : 190,
      ease: "Quad.easeIn",
      onComplete: () => {
        projectile.destroy();
        if (!enemy.dead) {
          const damage = def.damage * this.modifiers.damage * (1 + (tower.level - 1) * 0.24);
          this.damageEnemy(enemy, damage, tower);
        }
      },
    });
  }

  endRun(victory) {
    if (!this.running) return;
    this.running = false;
    this.pendingQuestion = null;
    if (victory) this.profileStore.recordVictory(this.profile);
    this.activeEnemies.forEach((enemy) => enemy.container?.destroy());
    this.activeEnemies = [];
    const accuracy = this.session.attempts ? Math.round((this.session.correct / this.session.attempts) * 100) : 0;
    const independent = this.session.attempts ? Math.round((this.session.independentCorrect / this.session.attempts) * 100) : 0;
    this.bridge.dispatchEvent(new CustomEvent("md:report", {
      detail: {
        victory,
        profile: this.profile,
        session: { ...this.session, accuracy, independent, durationMs: Date.now() - this.session.startedAt },
      },
    }));
    this.emitStatus();
  }

  emitStatus() {
    this.bridge?.dispatchEvent(new CustomEvent("md:status", {
      detail: {
        running: this.running,
        player: this.profile?.name || "—",
        grade: this.profile?.grade || "—",
        wave: this.waveIndex >= 0 ? Math.min(this.waveIndex + 1, WAVES.length) : 0,
        totalWaves: WAVES.length,
        energy: Math.round(this.energy),
        coreHp: Math.round(this.coreHp),
      },
    }));
  }

  toast(message) {
    this.bridge?.dispatchEvent(new CustomEvent("md:toast", { detail: { message } }));
  }
}
