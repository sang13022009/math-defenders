import test from "node:test";
import assert from "node:assert/strict";
import { QuestionEngine } from "../src/learning/QuestionEngine.js";

const engine = new QuestionEngine();

for (const grade of [1, 2, 3, 4]) {
  test(`grade ${grade} generates valid multiple-choice questions`, () => {
    for (let i = 0; i < 250; i += 1) {
      const question = engine.generate(grade);
      assert.equal(question.grade, grade);
      assert.ok(question.skill);
      assert.ok(question.text);
      assert.ok(question.hint);
      assert.ok(Array.isArray(question.options));
      assert.ok(question.options.length >= 3);
      assert.equal(new Set(question.options).size, question.options.length, `duplicate options: ${question.text}`);
      assert.ok(question.options.map(String).includes(String(question.answer)), `answer missing from options: ${question.text}`);
    }
  });
}

test("preferred skill is respected when available", () => {
  for (let i = 0; i < 30; i += 1) {
    const question = engine.generate(3, "multiplication");
    assert.equal(question.skill, "multiplication");
  }
});
