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
   alias → 정식 이름 변환
----------------------------- */
function resolveAlias(q) {
  let nq = normalize(q);

  for (let key in aliasMap) {
    let aliases = aliasMap[key] || [];

    // 정식 이름 직접 매칭
    if (normalize(key).includes(nq)) {
      return key;
    }

    // alias 매칭
    for (let a of aliases) {
      if (normalize(a).includes(nq)) {
        return key; // 핵심: 정식 이름 반환
      }
    }
  }

  return q; // 없으면 그대로
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
   검색
----------------------------- */
function showSearch(q) {
  let resolved = resolveAlias(q);
  let nq = normalize(resolved);

  let filtered = data.filter(item =>
    normalize(item.title).includes(nq)
  );

  resultBox.innerHTML = filtered.map(item => `
    <div class="card">
      <a href="${item.url}" target="_blank">${item.title}</a>
      <p>${item.content ? item.content.slice(0, 80) : ""}</p>
    </div>
  `).join("");
}

/* -----------------------------
   input (debounce)
----------------------------- */
let timer;

input.addEventListener("input", (e) => {
  clearTimeout(timer);

  timer = setTimeout(() => {
    showSearch(e.target.value);
  }, 150);
});
