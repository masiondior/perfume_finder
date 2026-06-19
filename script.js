let data = [];
let searchAliasMap = {};
let aliasToRealMap = {};

const input = document.getElementById("search");
const resultBox = document.getElementById("result");
const clearBtn = document.getElementById("clear-btn");
const countEl = document.getElementById("count");

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

function buildSearchAliasMap(mapping) {
  const map = {};
  for (const [realName, aliases] of Object.entries(mapping)) {
    map[normalize(realName)] = aliases.map(normalize);
  }
  return map;
}

function buildAliasToRealMap(mapping) {
  const map = {};
  for (const [realName, aliases] of Object.entries(mapping)) {
    for (const alias of aliases) {
      map[normalize(alias)] = normalize(realName);
    }
  }
  return map;
}

function resolveQueryTerms(nq) {
  const terms = new Set([nq]);

  for (const [normalizedAlias, normalizedReal] of Object.entries(aliasToRealMap)) {
    if (normalizedAlias.includes(nq)) {
      terms.add(normalizedReal);
    }
  }

  for (const term of terms) {
    if (searchAliasMap[term]) {
      searchAliasMap[term].forEach(a => terms.add(a));
    }
  }

  for (const [normalizedReal, aliases] of Object.entries(searchAliasMap)) {
    if (normalizedReal.includes(nq)) {
      terms.add(normalizedReal);
      aliases.forEach(a => terms.add(a));
    }
  }

  return terms;
}

function fuzzyMatch(title, query) {
  let ti = 0;
  let qi = 0;
  while (ti < title.length && qi < query.length) {
    if (title[ti] === query[qi]) qi++;
    ti++;
  }
  return qi === query.length;
}

function openRandom() {
  if (!data.length) return;
  const item = data[Math.floor(Math.random() * data.length)];
  window.open(item.url, "_blank");
}

function clearSearch() {
  input.value = "";
  clearBtn.style.display = "none";
  countEl.textContent = "";
  showRecent();
}

function showRecent() {
  const shown = Math.min(data.length, 30);
  countEl.textContent = `최근 ${shown}개`;
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
    clearBtn.style.display = "none";
    countEl.textContent = "";
    showRecent();
    return;
  }

  clearBtn.style.display = "block";

  const terms = resolveQueryTerms(nq);

  let filtered = data.filter(item => {
    const nt = normalize(item.title);
    return [...terms].some(term => nt.includes(term)) || fuzzyMatch(nt, nq);
  });

  countEl.textContent = `검색 결과 ${filtered.length}개`;

  resultBox.innerHTML = filtered.length
    ? filtered.map(item => `
        <div class="card">
          <a href="${item.url}" target="_blank">${item.title}</a>
          <p>${item.content ? item.content.slice(0, 80) : ""}</p>
        </div>
      `).join("")
    : "<p class='no-result'>검색 결과가 없습니다.</p>";
}

let timer;
input.addEventListener("input", (e) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    let q = e.target.value;
    showSearch(q);
  }, 150);
});
const topBtn = document.getElementById("top-btn");

window.addEventListener("scroll", () => {
  topBtn.style.display = window.scrollY > 300 ? "block" : "none";
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
