// 공유 코드 해석·검증과 이슈 본문 파싱. submit.mjs(Action)와 테스트가 같이 쓴다.
import { inflateRawSync } from "node:zlib";

export const CODE_PREFIX = "STOPMEOW1:";
export const DAILY_LIMIT = 10;
const MAX_ENTRIES = 200;
const MAX_NAME = 20;
// ponytail: 최소 금칙어 목록(앱 서버와 동일). 변형 표기는 못 막음 — 문제가 생기면 cats/에서 파일을 지우면 됨.
const BANNED_WORDS = ["시발", "씨발", "병신", "좆", "fuck", "shit"];

/** "STOPMEOW1:<base64url(raw deflate(JSON))>" → { "3_4": "#AABBCC", "part_O": "#112233", ... } */
export function decodeCode(code) {
  const trimmed = code.replace(/\s/g, "");
  if (!trimmed.startsWith(CODE_PREFIX)) throw new Error("멈춰묘 공유 코드가 아니에요. 앱 디자인 탭의 \"코드 복사\"로 복사한 코드를 붙여 주세요.");
  let design;
  try {
    // 압축 해제 결과 크기를 제한해 압축 폭탄을 막는다.
    const json = inflateRawSync(Buffer.from(trimmed.slice(CODE_PREFIX.length), "base64url"), { maxOutputLength: 64 * 1024 });
    design = JSON.parse(json.toString("utf8"));
  } catch {
    throw new Error("코드가 잘렸거나 손상됐어요. 다시 복사해서 붙여 주세요.");
  }
  if (typeof design !== "object" || design === null || Array.isArray(design)) throw new Error("코드 내용이 올바르지 않아요.");
  const entries = Object.entries(design);
  if (entries.length === 0) throw new Error("기본 고양이는 올릴 수 없어요. 디자인을 꾸민 뒤 코드를 복사해 주세요.");
  if (entries.length > MAX_ENTRIES) throw new Error("코드 내용이 올바르지 않아요.");
  for (const [key, value] of entries) {
    if (!/^(\d{1,2}_\d{1,2}|part_[A-Z])$/.test(key) || typeof value !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(value)) {
      throw new Error("코드 내용이 올바르지 않아요.");
    }
  }
  return { code: trimmed, design };
}

/** GitHub 이슈 양식 본문("### 라벨\n\n값")에서 라벨별 값을 꺼낸다. 비운 칸은 "_No response_". */
export function parseIssueForm(body) {
  const fields = {};
  for (const section of (body ?? "").split(/^### /m).slice(1)) {
    const [label, ...rest] = section.split("\n");
    const value = rest.join("\n").trim();
    fields[label.trim()] = value === "_No response_" ? "" : value;
  }
  return fields;
}

export function validateName(value, label) {
  const name = (value ?? "").trim();
  if (!name) throw new Error(`${label}을(를) 적어 주세요.`);
  if ([...name].length > MAX_NAME) throw new Error(`${label}은(는) ${MAX_NAME}자까지 가능해요.`);
  const normalized = name.toLowerCase().replace(/\s/g, "");
  if (BANNED_WORDS.some((w) => normalized.includes(w))) throw new Error("사용할 수 없는 단어가 들어 있어요.");
  return name;
}

/** 이슈 하나를 cats/ 에 저장할 항목으로 바꾼다. 문제가 있으면 사용자에게 보여줄 메시지로 throw. */
export function buildEntry(issue, existingCats, now = new Date()) {
  const fields = parseIssueForm(issue.body);
  const catName = validateName(fields["고양이 이름"], "고양이 이름");
  const nickname = validateName(fields["닉네임"], "닉네임");
  const { code, design } = decodeCode(fields["공유 코드"] ?? "");

  const user = issue.user.login;
  const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const recent = existingCats.filter((c) => c.githubUser === user && Date.parse(c.createdAt) > dayAgo).length;
  if (recent >= DAILY_LIMIT) throw new Error(`올리기는 하루 ${DAILY_LIMIT}마리까지 가능해요.`);

  return { id: issue.number, catName, nickname, code, design, githubUser: user, createdAt: now.toISOString() };
}
