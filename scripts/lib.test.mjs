// node --test scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";
import { buildEntry, decodeCode, DAILY_LIMIT } from "./lib.mjs";

const encode = (design) => "STOPMEOW1:" + deflateRawSync(JSON.stringify(design)).toString("base64url");
// 앱(Swift NSData.compressed(.zlib))이 실제로 만든 코드 — 앱↔페이지 형식 호환 확인용.
const APP_CODE = "STOPMEOW1:q1YyjjdRslJSNgYDJR2lgsSikngnkJClKwjChPxBQkZgoFQLAA";

const body = (catName, nickname, code) => `### 고양이 이름\n\n${catName}\n\n### 닉네임\n\n${nickname}\n\n### 공유 코드\n\n${code}\n`;
const issue = (n, b, login = "alice") => ({ number: n, body: b, user: { login } });

test("앱이 만든 코드를 해석한다", () => {
  assert.deepEqual(decodeCode(APP_CODE).design, { "3_4": "#333333", part_B: "#9E9E9E", part_O: "#222222" });
});

test("정상 이슈는 항목이 된다 (코드 중간 줄바꿈 허용)", () => {
  const code = encode({ "3_4": "#FFAA00" });
  const entry = buildEntry(issue(7, body(" 치즈 ", "앨리스", code.slice(0, 15) + "\n" + code.slice(15))), []);
  assert.equal(entry.id, 7);
  assert.equal(entry.catName, "치즈");
  assert.equal(entry.code, code);
  assert.deepEqual(entry.design, { "3_4": "#FFAA00" });
});

test("잘못된 입력은 사유와 함께 거절한다", () => {
  const ok = encode({ "3_4": "#FFAA00" });
  const cases = [
    [body("치즈", "앨리스", "hello"), /공유 코드가 아니에요/],
    [body("치즈", "앨리스", "STOPMEOW1:!!!"), /손상/],
    [body("치즈", "앨리스", encode({})), /기본 고양이/],
    [body("치즈", "앨리스", encode({ "3_4": "red" })), /올바르지/],
    [body("치즈", "앨리스", encode({ "<script>": "#FFFFFF" })), /올바르지/],
    [body("_No response_", "앨리스", ok), /고양이 이름을/],
    [body("시 발", "앨리스", ok), /사용할 수 없는/],
    [body("가".repeat(21), "앨리스", ok), /20자/],
  ];
  for (const [b, msg] of cases) assert.throws(() => buildEntry(issue(1, b), []), msg);
});

test("압축 폭탄은 거절한다", () => {
  const bomb = "STOPMEOW1:" + deflateRawSync(Buffer.alloc(10 * 1024 * 1024, 0x20)).toString("base64url");
  assert.throws(() => decodeCode(bomb), /손상/);
});

test("같은 사람은 하루 제한까지만 올릴 수 있다", () => {
  const now = new Date("2026-11-26T12:00:00Z");
  const mine = Array.from({ length: DAILY_LIMIT }, () => ({ githubUser: "alice", createdAt: "2026-11-26T09:00:00Z" }));
  const b = body("치즈", "앨리스", encode({ "3_4": "#FFAA00" }));
  assert.throws(() => buildEntry(issue(1, b), mine, now), /하루/);
  assert.ok(buildEntry(issue(1, b, "bob"), mine, now)); // 다른 사람은 상관없음
  const old = mine.map((c) => ({ ...c, createdAt: "2026-11-24T09:00:00Z" }));
  assert.ok(buildEntry(issue(1, b), old, now)); // 하루 지난 건 안 셈
});
