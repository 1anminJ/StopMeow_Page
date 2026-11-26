// Action 전용: 이슈 이벤트를 읽어 검증하고 cats/<이슈번호>.json 으로 저장한다.
// 이슈 본문은 신뢰할 수 없는 입력이라 셸에 끼워 넣지 않고 여기서 이벤트 파일로만 읽는다.
// 결과(added, 댓글 내용)는 다음 단계가 쓰도록 GITHUB_OUTPUT / comment.md 로 넘긴다.
import { appendFileSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { buildEntry } from "./lib.mjs";

const issue = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")).issue;
mkdirSync("cats", { recursive: true });
const existing = readdirSync("cats").filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(`cats/${f}`, "utf8")));

let added = false;
let comment;
try {
  const entry = buildEntry(issue, existing);
  writeFileSync(`cats/${entry.id}.json`, JSON.stringify(entry, null, 2) + "\n");
  added = true;
  comment = `🐱 **${entry.catName}** 등록 완료! 1~2분 뒤 갤러리에 나타나요.\n\nhttps://1anminj.github.io/StopMeow_Page/`;
} catch (e) {
  comment = `😿 등록하지 못했어요: ${e.message}\n\n고친 뒤 새 이슈로 다시 올려 주세요.`;
}

writeFileSync("comment.md", comment);
appendFileSync(process.env.GITHUB_OUTPUT, `added=${added}\n`);
