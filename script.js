let data = [];
let searchAliasMap = {};

const input = document.getElementById("search");
const resultBox = document.getElementById("result");

Promise.all([
  fetch("./data.json").then(r => r.json()),
  fetch("./mapping.json").then(r => r.json())
])
  .then(([json, mapping]) => {
    data = json || [];
    searchAliasMap = buildSearchAliasMap(mapping);
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

function getMatchedAliases(nq) {
  const aliases = [];
  for (const [normalizedReal, normalizedAliases] of Object.entries(searchAliasMap)) {
    if (normalizedReal.includes(nq)) {
      aliases.push(...normalizedAliases);
    }
  }
  return aliases;
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

  const extraAliases = getMatchedAliases(nq);

  let filtered = data.filter(item => {
    const nt = normalize(item.title);
    return nt.includes(nq) || extraAliases.some(alias => nt.includes(alias));
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
