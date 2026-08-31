const STORAGE_KEY = "math-defenders.family-profiles.v0.1";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function saveAll(profiles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function profileId(name, grade) {
  return `${name.trim().toLowerCase().replace(/\s+/g, "-")}-g${grade}`;
}

export class ProfileStore {
  list() {
    return Object.values(loadAll()).sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
  }

  getOrCreate(name, grade) {
    const safeName = name.trim().slice(0, 18) || "Chiến binh";
    const safeGrade = clamp(Number(grade) || 2, 1, 4);
    const id = profileId(safeName, safeGrade);
    const profiles = loadAll();
    const existing = profiles[id];
    if (existing) {
      existing.lastPlayedAt = Date.now();
      profiles[id] = existing;
      saveAll(profiles);
      return structuredClone(existing);
    }

    const created = {
      id,
      name: safeName,
      grade: safeGrade,
      xp: 0,
      level: 1,
      victories: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      skills: {},
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
    };
    profiles[id] = created;
    saveAll(profiles);
    return structuredClone(created);
  }

  recordAttempt(profile, question, correct, usedHint = false) {
    const profiles = loadAll();
    const current = profiles[profile.id] || profile;
    const skill = current.skills[question.skill] || {
      attempts: 0,
      correct: 0,
      independentCorrect: 0,
      mastery: 0,
      lastSeenAt: 0,
    };

    skill.attempts += 1;
    if (correct) skill.correct += 1;
    if (correct && !usedHint) skill.independentCorrect += 1;

    // Prototype mastery: conservative weighted estimate, capped until enough evidence exists.
    const accuracy = skill.correct / skill.attempts;
    const independence = skill.independentCorrect / skill.attempts;
    const evidenceCap = Math.min(1, skill.attempts / 6);
    skill.mastery = Math.round(clamp((accuracy * 0.65 + independence * 0.35) * evidenceCap * 100, 0, 100));
    skill.lastSeenAt = Date.now();

    current.skills[question.skill] = skill;
    current.totalAttempts += 1;
    if (correct) current.totalCorrect += 1;
    current.xp += correct ? (usedHint ? 6 : 10) : 2;
    current.level = 1 + Math.floor(current.xp / 120);
    current.lastPlayedAt = Date.now();

    profiles[current.id] = current;
    saveAll(profiles);
    Object.assign(profile, structuredClone(current));
    return skill;
  }

  recordVictory(profile) {
    const profiles = loadAll();
    const current = profiles[profile.id] || profile;
    current.victories += 1;
    current.xp += 35;
    current.level = 1 + Math.floor(current.xp / 120);
    current.lastPlayedAt = Date.now();
    profiles[current.id] = current;
    saveAll(profiles);
    Object.assign(profile, structuredClone(current));
  }

  weakestSkill(profile) {
    const entries = Object.entries(profile.skills || {});
    if (!entries.length) return null;
    entries.sort((a, b) => {
      const aScore = a[1].attempts >= 2 ? a[1].mastery : 101;
      const bScore = b[1].attempts >= 2 ? b[1].mastery : 101;
      return aScore - bScore;
    });
    return entries[0][1].attempts >= 2 ? entries[0][0] : null;
  }
}
