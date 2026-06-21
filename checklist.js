let items = [];
let currentTab = 'all';
let openId = null;

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
  items.unshift({ id: Date.now(), name, done: false, memo: '' });
  save();
  input.value = '';
  render();
}

function toggleItem(e, id) {
  e.stopPropagation();
  const item = items.find(i => i.id === id);
  if (item) { item.done = !item.done; save(); render(); }
}

function deleteItem(e, id) {
  e.stopPropagation();
  items = items.filter(i => i.id !== id);
  if (openId === id) openId = null;
  save();
  render();
}

function toggleMemo(id) {
  openId = openId === id ? null : id;
  render();
}

function autoSaveMemo(id) {
  const ta = document.getElementById('memo-' + id);
  const item = items.find(i => i.id === id);
  if (item && ta) { item.memo = ta.value; save(); }
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

  list.innerHTML = filtered.map(item => {
    const isOpen = openId === item.id;
    return `
      <div class="item ${item.done ? 'done' : ''}">
        <div class="item-row" onclick="toggleMemo(${item.id})">
          <button class="check ${item.done ? 'checked' : ''}" onclick="toggleItem(event, ${item.id})">
            ${item.done ? '✓' : ''}
          </button>
          <div style="flex:1; overflow:hidden;">
            <div class="name">${item.name}</div>
            ${item.memo && !isOpen ? `<div class="memo-preview">${item.memo}</div>` : ''}
          </div>
          <span class="chevron ${isOpen ? 'open' : ''}">▼</span>
          <button class="del" onclick="deleteItem(event, ${item.id})">✕</button>
        </div>
        <div class="memo-box ${isOpen ? 'open' : ''}">
          <textarea id="memo-${item.id}" rows="3" placeholder="메모를 입력하세요..." oninput="autoSaveMemo(${item.id})">${item.memo || ''}</textarea>
        </div>
      </div>
    `;
  }).join('');
}

document.getElementById('perfume-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addItem();
});

render();
