// cats/*.json 을 합쳐 site/gallery.json 을 만든다(최신순). 배포 직전과 로컬 미리보기 때 실행.
// 공개 페이지엔 표시에 필요한 필드만 내보낸다.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";

mkdirSync("cats", { recursive: true });
const cats = readdirSync("cats")
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(`cats/${f}`, "utf8")))
  .sort((a, b) => b.id - a.id)
  .map(({ id, catName, nickname, code, design, createdAt }) => ({ id, catName, nickname, code, design, createdAt }));

writeFileSync("site/gallery.json", JSON.stringify(cats));
console.log(`gallery.json: ${cats.length}마리`);
