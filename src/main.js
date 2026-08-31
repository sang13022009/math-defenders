import * as Phaser from "phaser";
import "./styles.css";
import { GameScene } from "./game/GameScene.js";
import { ProfileStore } from "./learning/ProfileStore.js";

const bridge = new EventTarget();
window.mathDefendersBridge = bridge;

const profileStore = new ProfileStore();
let activeProfile = null;
let lastAnswerButton = null;
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const onboarding = $("#onboarding");
const questionOverlay = $("#question-overlay");
const reportOverlay = $("#report-overlay");
const nameInput = $("#player-name");
const gradeSelect = $("#player-grade");
const startBtn = $("#start-btn");
const savedProfiles = $("#saved-profiles");
const energyBtn = $("#math-energy-btn");
const skillBtn = $("#hero-skill-btn");
const answerGrid = $("#answer-grid");
const questionText = $("#question-text");
const questionSkill = $("#question-skill");
const questionContext = $("#question-context");
const questionHint = $("#question-hint");
const questionFeedback = $("#question-feedback");
const reportContent = $("#report-content");
const toast = $("#toast");

const contextNames = {
  energy: "🧠 MATH ENERGY",
  heroSkill: "⚡ HERO SKILL",
  towerUpgrade: "⬆ TOWER UPGRADE",
  bossShield: "⚠ BOSS ARMOR BREAK",
};

const skillNames = {
  add_within_20: "CỘNG TRONG 20",
  subtract_within_20: "TRỪ TRONG 20",
  compare_numbers: "SO SÁNH SỐ",
  add_within_100: "CỘNG TRONG 100",
  subtract_within_100: "TRỪ TRONG 100",
  early_multiplication: "NHÂN CƠ BẢN",
  missing_number: "TÌM SỐ",
  multiplication: "BẢNG NHÂN",
  division_exact: "PHÉP CHIA",
  add_within_1000: "CỘNG TRONG 1000",
  missing_factor: "TÌM THỪA SỐ",
  multi_digit_multiplication: "NHÂN NHIỀU CHỮ SỐ",
  fraction_same_denominator: "PHÂN SỐ",
  two_step: "THỨ TỰ PHÉP TÍNH",
};

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#07111f",
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
});

function showOverlay(element) { element.classList.add("visible"); }
function hideOverlay(element) { element.classList.remove("visible"); }

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2100);
}

function startWithProfile(profile) {
  activeProfile = profile;
  hideOverlay(onboarding);
  hideOverlay(reportOverlay);
  energyBtn.disabled = false;
  skillBtn.disabled = false;
  bridge.dispatchEvent(new CustomEvent("md:start", { detail: { profile: activeProfile } }));
}

function renderSavedProfiles() {
  savedProfiles.innerHTML = "";
  const profiles = profileStore.list().slice(0, 6);
  if (!profiles.length) return;
  const title = document.createElement("span");
  title.className = "muted";
  title.textContent = "Chơi tiếp:";
  savedProfiles.append(title);
  profiles.forEach((profile) => {
    const button = document.createElement("button");
    button.className = "profile-chip";
    button.textContent = `${profile.name} · Lớp ${profile.grade} · Lv.${profile.level}`;
    button.addEventListener("click", () => startWithProfile(profileStore.getOrCreate(profile.name, profile.grade)));
    savedProfiles.append(button);
  });
}

startBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    showToast("Nhập tên chiến binh trước nhé.");
    return;
  }
  startWithProfile(profileStore.getOrCreate(name, Number(gradeSelect.value)));
});

nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") startBtn.click();
});

energyBtn.addEventListener("click", () => bridge.dispatchEvent(new Event("md:energy")));
skillBtn.addEventListener("click", () => bridge.dispatchEvent(new Event("md:hero-skill")));

bridge.addEventListener("md:question", (event) => {
  const { question, context } = event.detail;
  questionContext.textContent = contextNames[context] || "MATH CHALLENGE";
  questionSkill.textContent = skillNames[question.skill] || question.skill;
  questionText.textContent = question.text;
  questionHint.textContent = "";
  questionFeedback.textContent = "";
  questionFeedback.className = "feedback";
  answerGrid.innerHTML = "";
  lastAnswerButton = null;

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "answer-btn";
    button.textContent = option;
    button.addEventListener("click", () => {
      if (button.disabled) return;
      lastAnswerButton = button;
      bridge.dispatchEvent(new CustomEvent("md:answer", { detail: { value: option } }));
    });
    answerGrid.append(button);
  });
  showOverlay(questionOverlay);
});

bridge.addEventListener("md:feedback", (event) => {
  const { correct, hint, message } = event.detail;
  questionFeedback.textContent = message;
  questionFeedback.className = `feedback ${correct ? "good" : "bad"}`;

  if (!correct) {
    questionHint.textContent = `💡 ${hint}`;
    if (lastAnswerButton) {
      lastAnswerButton.classList.add("wrong");
      lastAnswerButton.disabled = true;
    }
    return;
  }

  if (lastAnswerButton) lastAnswerButton.classList.add("correct");
  [...answerGrid.children].forEach((button) => { button.disabled = true; });
  setTimeout(() => hideOverlay(questionOverlay), 680);
});

bridge.addEventListener("md:status", (event) => {
  const status = event.detail;
  $("#player-label").textContent = status.player === "—" ? "Chưa chọn người chơi" : `${status.player} · Lớp ${status.grade}`;
  $("#wave-label").textContent = `WAVE ${status.wave}/${status.totalWaves}`;
  $("#energy-label").textContent = `ENERGY ${status.energy}`;
  $("#core-label").textContent = `CORE ${status.coreHp}%`;
  energyBtn.disabled = !status.running;
  skillBtn.disabled = !status.running;
});

bridge.addEventListener("md:toast", (event) => showToast(event.detail.message));

bridge.addEventListener("md:report", (event) => {
  const { victory, profile, session } = event.detail;
  energyBtn.disabled = true;
  skillBtn.disabled = true;
  hideOverlay(questionOverlay);

  const minutes = Math.floor(session.durationMs / 60000);
  const seconds = Math.floor((session.durationMs % 60000) / 1000);
  const skillRows = Object.entries(session.skills)
    .sort((a, b) => b[1].attempts - a[1].attempts)
    .map(([skill, stats]) => {
      const accuracy = Math.round((stats.correct / stats.attempts) * 100);
      return `<div class="skill-row"><span>${skillNames[skill] || skill}</span><strong>${accuracy}% · ${stats.attempts} lượt</strong></div>`;
    }).join("");

  reportOverlay.querySelector("h2").textContent = victory ? "Mecha City đã được bảo vệ!" : "Family Core đã thất thủ — thử chiến thuật mới!";
  reportContent.innerHTML = `
    <div class="report-grid">
      <div class="metric"><strong>${session.correct}/${session.attempts}</strong><span>Câu đúng</span></div>
      <div class="metric"><strong>${session.accuracy}%</strong><span>Độ chính xác</span></div>
      <div class="metric"><strong>${session.independent}%</strong><span>Tự làm đúng</span></div>
      <div class="metric"><strong>${minutes}:${String(seconds).padStart(2, "0")}</strong><span>Thời gian</span></div>
      <div class="metric"><strong>${session.enemiesDefeated}</strong><span>Quái hạ</span></div>
      <div class="metric"><strong>Lv.${profile.level}</strong><span>Hero level</span></div>
    </div>
    <div class="skill-summary">
      <p class="eyebrow">HỌC GÌ TRONG TRẬN NÀY?</p>
      ${skillRows || '<p class="muted">Chưa có đủ dữ liệu câu hỏi trong trận.</p>'}
    </div>
  `;
  showOverlay(reportOverlay);
  renderSavedProfiles();
});

$("#play-again-btn").addEventListener("click", () => {
  if (!activeProfile) return;
  startWithProfile(profileStore.getOrCreate(activeProfile.name, activeProfile.grade));
});

$("#switch-profile-btn").addEventListener("click", () => {
  hideOverlay(reportOverlay);
  showOverlay(onboarding);
  renderSavedProfiles();
});

renderSavedProfiles();
