let items = [];
let currentTab = 'all';

try {
  items = JSON.parse(localStorage.getItem('perfume-checklist') || '[]');
} catch(e) { items = []; }

function save() {
  localStorage.setItem('perfume-checklist', JSON.stringify(items));
}

function addItem() {
  const input = document.getElementById('perfume-input');
  const name = input.value.trim();
  if (!name) return;
  items.unshift({ id: Date.now(), name, done: false });
  save();
  input.value = '';
  render();
}

function toggleItem(id) {
  const item = items.find(i => i.id === id);
  if (item) { item.done = !item.done; save(); render(); }
}

function deleteItem(id) {
  items = items.filter(i => i.id !== id);
  save();
  render();
}

function setTab(tab, el) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  render();
}

function render() {
  const filtered = items.filter(i => {
    if (currentTab === 'todo') return !i.done;
    if (currentTab === 'done') return i.done;
    return true;
  });

  const total = items.length;
  const done = items.filter(i => i.done).length;
  document.getElementById('count').textContent = `전체 ${total}개 · 시향 완료 ${done}개`;

  const list = document.getElementById('list');
  if (!filtered.length) {
    list.innerHTML = `<p class="empty">항목이 없습니다.</p>`;
    return;
  }

  list.innerHTML = filtered.map(item => `
    <div class="item ${item.done ? 'done' : ''}">
      <button class="check ${item.done ? 'checked' : ''}" onclick="toggleItem(${item.id})">
        ${item.done ? '✓' : ''}
      </button>
      <span class="name">${item.name}</span>
      <button class="del" onclick="deleteItem(${item.id})">✕</button>
    </div>
  `).join('');
}

document.getElementById('perfume-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addItem();
});

render();