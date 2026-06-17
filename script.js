let data = [];
let aliasMap = {};

const input = document.getElementById("search");
const resultBox = document.getElementById("result");

/* -----------------------------
   데이터 + 매핑 로딩
----------------------------- */
Promise.all([
  fetch("./data.json").then(r => r.json()),
  fetch("./mapping.json").then(r => r.json())
]).then(([d, m]) => {
  data = d || [];
  aliasMap = m || {};
  showRecent();
}).catch(err => {
  console.error("로딩 실패:", err);
  resultBox.innerHTML = "<p>데이터 로딩 실패</p>";
});

/* -----------------------------
   normalize (띄어쓰기 무시 + 소문자 + 특수문자 제거)
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
   검색 로직 (alias + title 매칭)
----------------------------- */
function showSearch(q) {
  let nq = normalize(q);

  if (!nq) {
    showRecent();
    return;
  }

  let matchedKeys = Object.keys(aliasMap).filter(key => {
    let normKey = normalize(key);

    return (
      normKey.includes(nq) ||
      (aliasMap[key] || []).some(a => normalize(a).includes(nq))
    );
  });

  let filtered = data.filter(item => {
    let title = normalize(item.title);

    return matchedKeys.some(k => normalize(k).includes(title));
  });

  resultBox.innerHTML = filtered.map(item => `
    <div class="card">
      <a href="${item.url}" target="_blank">${item.title}</a>
      <p>${item.content ? item.content.slice(0, 80) : ""}</p>
    </div>
  `).join("");
}

/* -----------------------------
   입력 (debounce)
----------------------------- */
let timer;

input.addEventListener("input", (e) => {
  clearTimeout(timer);

  timer = setTimeout(() => {
    showSearch(e.target.value);
  }, 150);
});
