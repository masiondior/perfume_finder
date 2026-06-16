let data = [];

const input = document.getElementById("search");
const resultBox = document.getElementById("result");

fetch("./data.json")
  .then(res => res.json())
  .then(json => {
    data = json || [];
    showRecent();
  })
  .catch(err => {
    console.error("data.json 로드 실패:", err);
    resultBox.innerHTML = "<p>데이터 로딩 실패</p>";
  });

/* -----------------------------
   문자열 정규화 (띄어쓰기 무시 + 소문자)
----------------------------- */
function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

/* -----------------------------
   최근 30개 표시
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
   검색 (전체 결과 + 공백 무시)
----------------------------- */
function showSearch(q) {
  let nq = normalize(q);

  if (!nq) {
    showRecent();
    return;
  }

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
   입력 이벤트 (debounce)
----------------------------- */
let timer;

input.addEventListener("input", (e) => {
  clearTimeout(timer);

  timer = setTimeout(() => {
    let q = e.target.value;
    showSearch(q);
  }, 150);
});
