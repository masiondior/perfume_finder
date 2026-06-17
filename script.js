let data = [];
let aliasMap = {};

const input = document.getElementById("search");
const resultBox = document.getElementById("result");

Promise.all([
  fetch("./data.json").then(r => r.json()),
  fetch("./mapping.json").then(r => r.json())
]).then(([d, m]) => {
  data = d || [];
  aliasMap = m || {};
  showRecent();
});

/* -----------------------------
   normalize
----------------------------- */
function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

/* -----------------------------
   최근 30개
----------------------------- */
function showRecent() {
  resultBox.innerHTML = data.slice(0, 30).map(item => `
    <div class="card">
      <a href="${item.url}" target="_blank">${item.title}</a>
      <p>${item.content ? item.content.slice(0, 80) : ""}</p>
    </div>
  `).join("");
}

/* -----------------------------
   검색 (정상 + alias 지원)
----------------------------- */
function showSearch(q) {
  let nq = normalize(q);

  if (!nq) {
    showRecent();
    return;
  }

  let filtered = data.filter(item => {
    let title = normalize(item.title);

    // 1. 제목 직접 검색
    if (title.includes(nq)) return true;

    // 2. alias 검색
    for (let key in aliasMap) {
      let aliases = aliasMap[key] || [];

      if (
        normalize(key).includes(nq) ||
        aliases.some(a => normalize(a).includes(nq))
      ) {
        // key가 해당 item title과 매칭되는 경우만 통과
        if (title.includes(normalize(key))) return true;
      }
    }

    return false;
  });

  resultBox.innerHTML = filtered.map(item => `
    <div class="card">
      <a href="${item.url}" target="_blank">${item.title}</a>
      <p>${item.content ? item.content.slice(0, 80) : ""}</p>
    </div>
  `).join("");
}

/* -----------------------------
   input debounce
----------------------------- */
let timer;

input.addEventListener("input", (e) => {
  clearTimeout(timer);

  timer = setTimeout(() => {
    showSearch(e.target.value);
  }, 150);
});
