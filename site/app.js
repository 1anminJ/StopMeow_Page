// 앱 CatSprite.swift의 기본 자세(idleStand, 정면 시선)와 색 규칙을 그대로 옮긴 것.
// 색 우선순위: 몸통(B) 칸별 색("행_열") > 부위 색("part_문자") > 기본색 — 앱 displayColors와 동일.
const ROWS = [
  "..O.....O....",
  "..OP....PO...",
  ".OBBBBBBBBO..",
  ".OBKBBBKBBO..",
  ".OBBBPPBBBO..",
  ".OBBBBBBBBOBO",
  "OBWWWWWWWBOO.",
  "..OW....WO...",
];
const DEFAULT_COLORS = { O: "#3B2417", B: "#E08C4A", W: "#FFFFFF", K: "#212121", P: "#F2A8BF" };

function drawCat(canvas, design = {}) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ROWS.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === ".") return;
      ctx.fillStyle = (ch === "B" && design[`${r}_${c}`]) || design[`part_${ch}`] || DEFAULT_COLORS[ch];
      ctx.fillRect(c, r, 1, 1);
    });
  });
}

async function copy(button, code) {
  try {
    await navigator.clipboard.writeText(code);
    button.textContent = "복사됨!";
  } catch {
    button.textContent = "복사 실패";
  }
  setTimeout(() => (button.textContent = "코드 복사"), 1500);
}

async function loadGallery() {
  const gallery = document.getElementById("gallery");
  const template = document.getElementById("card");
  let cats;
  try {
    cats = await (await fetch(`gallery.json?t=${Date.now()}`, { cache: "no-store" })).json();
  } catch {
    gallery.innerHTML = '<p class="empty">갤러리를 불러오지 못했어요. 잠시 후 새로고침해 주세요.</p>';
    return;
  }

  document.getElementById("count").textContent = cats.length ? `${cats.length}마리` : "";
  if (!cats.length) {
    gallery.innerHTML = '<p class="empty">아직 올라온 고양이가 없어요. 첫 번째로 올려보세요!</p>';
    return;
  }

  for (const cat of cats) {
    const card = template.content.cloneNode(true);
    drawCat(card.querySelector("canvas"), cat.design);
    card.querySelector("canvas").setAttribute("aria-label", `${cat.catName} 미리보기`);
    // 사용자 입력이라 textContent로만 넣는다(HTML로 해석하지 않음).
    card.querySelector("h3").textContent = cat.catName;
    card.querySelector(".by").textContent = `by ${cat.nickname}`;
    const button = card.querySelector(".copy");
    button.addEventListener("click", () => copy(button, cat.code));
    gallery.append(card);
  }
}

drawCat(document.getElementById("hero-cat"));
loadGallery();
