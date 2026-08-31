const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (items) => items[randInt(0, items.length - 1)];
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

function uniqueOptions(answer, spread = 10) {
  const values = new Set([answer]);
  let guard = 0;
  while (values.size < 4 && guard < 80) {
    guard += 1;
    const delta = randInt(1, spread) * (Math.random() > 0.5 ? 1 : -1);
    const candidate = Math.max(0, answer + delta);
    values.add(candidate);
  }
  return shuffle([...values]).map(String);
}

function compareOptions() {
  return shuffle([">", "<", "="]);
}

export class QuestionEngine {
  generate(grade = 2, preferredSkill = null) {
    const generators = this.generatorsForGrade(Number(grade));
    const chosen = preferredSkill && generators[preferredSkill]
      ? preferredSkill
      : pick(Object.keys(generators));
    const question = generators[chosen]();
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      grade: Number(grade),
      difficulty: question.difficulty ?? 1,
      skill: chosen,
      ...question,
    };
  }

  generatorsForGrade(grade) {
    if (grade <= 1) return this.grade1();
    if (grade === 2) return this.grade2();
    if (grade === 3) return this.grade3();
    return this.grade4();
  }

  grade1() {
    return {
      add_within_20: () => {
        const a = randInt(1, 12);
        const b = randInt(1, 20 - a);
        const answer = a + b;
        return {
          text: `${a} + ${b} = ?`, answer: String(answer), options: uniqueOptions(answer, 5),
          hint: `Tách ${b} thành phần giúp ${a} lên 10 trước, rồi cộng tiếp.`, difficulty: 1,
        };
      },
      subtract_within_20: () => {
        const a = randInt(8, 20);
        const b = randInt(1, a);
        const answer = a - b;
        return {
          text: `${a} − ${b} = ?`, answer: String(answer), options: uniqueOptions(answer, 5),
          hint: `Đếm lùi ${b} bước từ ${a}.`, difficulty: 1,
        };
      },
      compare_numbers: () => {
        const a = randInt(1, 30);
        const b = Math.random() < 0.2 ? a : randInt(1, 30);
        const answer = a === b ? "=" : a > b ? ">" : "<";
        return {
          text: `${a}  __  ${b}`, answer, options: compareOptions(),
          hint: "Số nằm xa hơn về bên phải trên tia số sẽ lớn hơn.", difficulty: 1,
        };
      },
    };
  }

  grade2() {
    return {
      add_within_100: () => {
        const a = randInt(12, 79);
        const b = randInt(8, 99 - a);
        const answer = a + b;
        return {
          text: `${a} + ${b} = ?`, answer: String(answer), options: uniqueOptions(answer, 12),
          hint: `Tách ${b} thành chục và đơn vị rồi cộng từng phần.`, difficulty: 2,
        };
      },
      subtract_within_100: () => {
        const a = randInt(30, 99);
        const b = randInt(8, a - 1);
        const answer = a - b;
        return {
          text: `${a} − ${b} = ?`, answer: String(answer), options: uniqueOptions(answer, 12),
          hint: `Có thể trừ phần chục trước, sau đó trừ phần đơn vị.`, difficulty: 2,
        };
      },
      early_multiplication: () => {
        const a = pick([2, 5, 10]);
        const b = randInt(1, 10);
        const answer = a * b;
        return {
          text: `${a} × ${b} = ?`, answer: String(answer), options: uniqueOptions(answer, Math.max(6, a)),
          hint: `${a} × ${b} nghĩa là có ${b} nhóm, mỗi nhóm ${a}.`, difficulty: 2,
        };
      },
      missing_number: () => {
        const a = randInt(10, 50);
        const missing = randInt(3, 25);
        const total = a + missing;
        return {
          text: `${a} + ? = ${total}`, answer: String(missing), options: uniqueOptions(missing, 8),
          hint: `Muốn tìm số còn thiếu, lấy ${total} − ${a}.`, difficulty: 2,
        };
      },
    };
  }

  grade3() {
    return {
      multiplication: () => {
        const a = randInt(2, 9);
        const b = randInt(2, 10);
        const answer = a * b;
        return {
          text: `${a} × ${b} = ?`, answer: String(answer), options: uniqueOptions(answer, 12),
          hint: `Nhớ lại bảng nhân ${a}, hoặc cộng ${a} lặp lại ${b} lần.`, difficulty: 3,
        };
      },
      division_exact: () => {
        const divisor = randInt(2, 9);
        const quotient = randInt(2, 10);
        const dividend = divisor * quotient;
        return {
          text: `${dividend} ÷ ${divisor} = ?`, answer: String(quotient), options: uniqueOptions(quotient, 5),
          hint: `Tìm số mà ${divisor} nhân với nó bằng ${dividend}.`, difficulty: 3,
        };
      },
      add_within_1000: () => {
        const a = randInt(120, 680);
        const b = randInt(40, 999 - a);
        const answer = a + b;
        return {
          text: `${a} + ${b} = ?`, answer: String(answer), options: uniqueOptions(answer, 35),
          hint: "Cộng theo hàng đơn vị, chục rồi trăm; nhớ phần cần nhớ.", difficulty: 3,
        };
      },
      missing_factor: () => {
        const a = randInt(2, 9);
        const missing = randInt(2, 10);
        const product = a * missing;
        return {
          text: `${a} × ? = ${product}`, answer: String(missing), options: uniqueOptions(missing, 5),
          hint: `Có thể lấy ${product} ÷ ${a}.`, difficulty: 3,
        };
      },
    };
  }

  grade4() {
    return {
      multi_digit_multiplication: () => {
        const a = randInt(12, 49);
        const b = randInt(2, 9);
        const answer = a * b;
        return {
          text: `${a} × ${b} = ?`, answer: String(answer), options: uniqueOptions(answer, 25),
          hint: `Tách ${a} thành chục và đơn vị, nhân từng phần với ${b}.`, difficulty: 4,
        };
      },
      division_exact: () => {
        const divisor = randInt(3, 12);
        const quotient = randInt(5, 30);
        const dividend = divisor * quotient;
        return {
          text: `${dividend} ÷ ${divisor} = ?`, answer: String(quotient), options: uniqueOptions(quotient, 8),
          hint: `Tìm ${divisor} × ? = ${dividend}.`, difficulty: 4,
        };
      },
      fraction_same_denominator: () => {
        const denominator = pick([4, 5, 6, 8, 10]);
        const a = randInt(1, Math.max(1, Math.floor(denominator / 2)));
        const b = randInt(1, denominator - a);
        const numerator = a + b;
        const answer = `${numerator}/${denominator}`;
        const distractors = new Set([answer]);
        while (distractors.size < 4) {
          distractors.add(`${Math.max(1, numerator + randInt(-2, 2))}/${denominator}`);
        }
        return {
          text: `${a}/${denominator} + ${b}/${denominator} = ?`,
          answer,
          options: shuffle([...distractors]),
          hint: "Hai phân số cùng mẫu: giữ nguyên mẫu số và cộng các tử số.",
          difficulty: 4,
        };
      },
      two_step: () => {
        const a = randInt(20, 60);
        const b = randInt(10, 40);
        const c = randInt(2, 9);
        const answer = a + b * c;
        return {
          text: `${a} + ${b} × ${c} = ?`, answer: String(answer), options: uniqueOptions(answer, 30),
          hint: "Thực hiện phép nhân trước, sau đó mới cộng.", difficulty: 4,
        };
      },
    };
  }
}
