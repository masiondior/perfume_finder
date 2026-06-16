let data = [];

const input = document.getElementById("search");
const resultBox = document.getElementById("result");

fetch("./data.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    showRecent();
  });

function showRecent() {
  resultBox.innerHTML = data.slice(0, 30).map(item => `
    <div class="card">
      <a href="${item.url}" target="_blank">${item.title}</a>
      <p>${item.content ? item.content.slice(0, 80) : ""}</p>
    </div>
  `).join("");
}

function showSearch(q) {
  let filtered = data.filter(item =>
    (item.title || "").toLowerCase().includes(q)
  );

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
    let q = e.target.value.trim().toLowerCase();

    if (!q) {
      showRecent();
    } else {
      showSearch(q);
    }
  }, 150);
});