let data = [];
let searchAliasMap = {};  // 원래이름 → [별명들]
let aliasToRealMap = {};  // 별명 → 원래이름

const input = document.getElementById("search");
const resultBox = document.getElementById("result");

Promise.all([
  fetch("./data.json").then(r => r.json()),
  fetch("./mapping.json").then(r => r.json())
])
  .then(([json, mapping]) => {
    data = json || [];
    searchAliasMap = buildSearchAliasMap(mapping);
    aliasToRealMap = buildAliasToRealMap(mapping);
    showRecent();
  })
  .catch(err => {
    console.error("로드 실패:", err);
    resultBox.innerHTML = "<p>데이터 로딩 실패</p>";
  });

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

// 원래이름 → [별명들]
function buildSearchAliasMap(mapping) {
  const map = {};
  for (const [realName, aliases] of Object.entries(mapping)) {
    map[normalize(realName)] = aliases.map(normalize);
  }
  return map;
}

// 별명 → 원래이름
function buildAliasToRealMap(mapping) {
  const map = {};
  for (const [realName, aliases] of Object.entries(mapping)) {
    for (const alias of aliases) {
      map[normalize(alias)] = normalize(realName);
    }
  }
  return map;
}

// 검색어로부터 같이 찾아야 할 모든 키워드 수집
function resolveQueryTerms(nq) {
  const terms = new Set([nq]);

  // 1. 검색어가 별명이면 → 원래 이름 추가
  for (const [normalizedAlias, normalizedReal] of Object.entries(aliasToRealMap)) {
    if (normalizedAlias.includes(nq)) {
      terms.add(normalizedReal);
    }
  }

  // 2. 수집된 원래 이름들의 다른 별명도 모두 추가
  for (const term of terms) {
    if (searchAliasMap[term]) {
      searchAliasMap[term].forEach(a => terms.add(a));
    }
  }

  // 3. 검색어가 원래 이름에 포함되면 → 그 별명들도 추가
  for (const [normalizedReal, aliases] of Object.entries(searchAliasMap)) {
    if (normalizedReal.includes(nq)) {
      terms.add(normalizedReal);
      aliases.forEach(a => terms.add(a));
    }
  }

  return terms;
}

function showRecent() {
  resultBox.innerHTML = data.slice(0, 30).map(item => `
    <div class="card">
      <a href="${item.url}" target="_blank">${item.title}</a>
      <p>${item.content ? item.content.slice(0, 80) : ""}</p>
    </div>
  `).join("");
}

function showSearch(q) {
  let nq = normalize(q);
  if (!nq) {
    showRecent();
    return;
  }

  const terms = resolveQueryTerms(nq);

  let filtered = data.filter(item => {
    const nt = normalize(item.title);
    return [...terms].some(term => nt.includes(term));
  });

  resultBox.innerHTML = filtered.map(item => `
    <div class="card">
      <a href="${item.url}" target="_blank">${item.title}</a>
      <p>${item.content ? item.content.slice(0, 80) : ""}</p>
    </div>
  `).join("");
}

let timer;
input.addEventListener("input", (e) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    let q = e.target.value;
    showSearch(q);
  }, 150);
});
