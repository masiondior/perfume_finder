const firebaseConfig = {
  apiKey: "AIzaSyDbgQ_miezNh8EH0LoPh7ogIabJdhDI0bk",
  authDomain: "perfume-log.firebaseapp.com",
  projectId: "perfume-log",
  storageBucket: "perfume-log.firebasestorage.app",
  messagingSenderId: "447726157728",
  appId: "1:447726157728:web:f4dbea5b0c5d40f779aec5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let uid = null;
let perfumes = [];
let query = '';
let modalStar = 0;

auth.signInAnonymously().then(cred => {
  uid = cred.user.uid;
});

db.collection('perfumes').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
  perfumes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  render();
});

function normalize(text) {
  return (text || '').toLowerCase().replace(/\s+/g, '');
}

function clearSearch() {
  document.getElementById('search').value = '';
  document.getElementById('clear-btn').style.display = 'none';
  query = '';
  render();
}

document.getElementById('search').addEventListener('input', e => {
  query = e.target.value;
  document.getElementById('clear-btn').style.display = query ? 'block' : 'none';
  render();
});

function getAvg(ratings) {
  if (!ratings || !Object.keys(ratings).length) return 0;
  const vals = Object.values(ratings);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round(avg);
}

function renderStars(score, id, clickable) {
  return [1,2,3,4,5].map(n => `
    <button class="star ${n <= score ? 'filled' : ''}"
      ${clickable ? `onclick="rate('${id}', ${n})"` : 'disabled'}
      style="${!clickable ? 'cursor:default; opacity:0.6;' : ''}">★</button>
  `).join('');
}

function render() {
  const parts = query.split('-').map(s => s.trim()).filter(Boolean);
  const filtered = query
    ? perfumes.filter(p => {
        if (parts.length >= 2) {
          return normalize(p.brand).includes(normalize(parts[0])) &&
                 normalize(p.name).includes(normalize(parts.slice(1).join('-')));
        }
        return normalize(p.brand).includes(normalize(query)) ||
               normalize(p.name).includes(normalize(query));
      })
    : perfumes;

  document.getElementById('count').textContent = `총 ${filtered.length}개`;

  const result = document.getElementById('result');

  if (!filtered.length) {
    result.innerHTML = query
      ? `
        <p class="no-result">검색 결과가 없습니다.</p>
        <button class="add-suggest-btn" onclick="openAddModal()">+ '${query}' 추가하기</button>
      `
      : `<p class="no-result">아직 등록된 향수가 없습니다.</p>`;
    return;
  }

  result.innerHTML = filtered.map(p => {
    const ratings = p.ratings || {};
    const avg = getAvg(ratings);
    const count = Object.keys(ratings).length;
    const myRating = uid ? (ratings[uid] || 0) : 0;

    return `
      <div class="perfume-card">
        <div class="brand">${p.brand}</div>
        <div class="pname">${p.name}</div>
        <div class="rating-row">
          <span class="rating-label">내 평점</span>
          <div class="stars ${myRating ? 'mine' : ''}">
            ${renderStars(myRating, p.id, true)}
          </div>
          ${myRating ? `<span class="rating-info">${myRating}점</span>` : '<span class="rating-info">미평가</span>'}
        </div>
        <div class="rating-row">
          <span class="rating-label">전체 평점</span>
          <div class="stars">
            ${renderStars(avg, p.id, false)}
          </div>
          <span class="rating-info">${avg > 0 ? `${avg}점 (${count}명)` : '평점 없음'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function rate(id, score) {
  if (!uid) return;
  db.collection('perfumes').doc(id).update({
    [`ratings.${uid}`]: score
  });
}

function openAddModal() {
  modalStar = 0;
  document.getElementById('modal-error').textContent = '';

  const parts = query.split('-').map(s => s.trim());
  if (parts.length >= 2) {
    document.getElementById('modal-brand').value = parts[0];
    document.getElementById('modal-name').value = parts.slice(1).join('-');
  } else {
    document.getElementById('modal-brand').value = '';
    document.getElementById('modal-name').value = query || '';
  }

  renderModalStars();
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

function renderModalStars() {
  document.getElementById('modal-stars').innerHTML = [1,2,3,4,5].map(n => `
    <button class="star ${n <= modalStar ? 'filled' : ''}"
      onclick="setModalStar(${n})">★</button>
  `).join('');
}

function setModalStar(n) {
  modalStar = n;
  renderModalStars();
}

function addPerfume() {
  const brand = document.getElementById('modal-brand').value.trim();
  const name = document.getElementById('modal-name').value.trim();
  const errorEl = document.getElementById('modal-error');

  if (!brand) { errorEl.textContent = '브랜드를 입력해주세요.'; return; }
  if (!name) { errorEl.textContent = '향수 이름을 입력해주세요.'; return; }

  const ratings = {};
  if (uid && modalStar > 0) ratings[uid] = modalStar;

  db.collection('perfumes').add({
    brand,
    name,
    ratings,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => closeModal());
}
