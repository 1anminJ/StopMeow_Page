# 멈춰묘 갤러리 페이지

https://1anminj.github.io/StopMeow_Page/

멈춰묘 앱에서 꾸민 고양이를 공유하는 정적 페이지. 서버 없이 GitHub만으로 돌아간다.

- **올리기**: 이슈 양식(`.github/ISSUE_TEMPLATE/submit-cat.yml`) → Action이 공유 코드 검증 → `cats/<이슈번호>.json` 커밋 → 결과 댓글 후 이슈 닫기 → 배포
- **보기/데려가기**: 배포 때 `cats/*.json`을 `site/gallery.json`으로 합치고, 페이지에서 "코드 복사" → 앱 디자인 탭 "코드 붙여넣기"
- **삭제(관리)**: `cats/`에서 해당 파일을 지우고 push하면 다시 배포됨

공유 코드 형식: `STOPMEOW1:` + base64url(raw deflate(디자인 JSON)) — 앱 `PixelOverrides`(`"행_열"`/`"part_문자"` → `#RRGGBB`) 그대로.

## 로컬 미리보기

```bash
node scripts/build.mjs
python3 -m http.server -d site 8000   # http://localhost:8000
node --test scripts/                  # 검증 로직 테스트
```
