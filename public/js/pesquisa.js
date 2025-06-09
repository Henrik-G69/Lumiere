// pesquisa.js
const API_KEY = '98f79a8fc16247f2c16e9d0b422dbfbe'; // seu TMDb API Key
const BASE = 'https://api.themoviedb.org/3';

//
// --- ELEMENTOS
//
const catalog       = document.getElementById('catalog');
const summaryQuery  = document.getElementById('summary-query');
const btnQuery      = document.getElementById('btn-query');
const inputQuery    = document.getElementById('filter-query');
const typeCbs       = [...document.getElementsByName('type')];
const genreInput    = document.getElementById('genre-search');
const genreResults  = document.getElementById('genre-results');
const genreTags     = document.getElementById('genre-tags');
const yearMin       = document.getElementById('year-min');
const yearMax       = document.getElementById('year-max');
const durMin        = document.getElementById('dur-min');
const durMax        = document.getElementById('dur-max');
const ratingRadios  = [...document.getElementsByName('rating')];
const sortSelect    = document.getElementById('sort');

let allGenres = [];      // [{id, name},…]
let selGenres = new Set();

//
// --- INICIALIZAÇÃO
//
document.addEventListener('DOMContentLoaded', async () => {
  await loadGenres();    // popula allGenres
  attachListeners();
  runSearch();
});

//
// Carrega lista de gêneros TMDb (_movie_, usamos a mesma p/ séries)
//
async function loadGenres() {
  const res = await fetch(`${BASE}/genre/movie/list?api_key=${API_KEY}&language=pt-BR`);
  const json = await res.json();
  allGenres = json.genres;
}

//
// Configura events
//
function attachListeners() {
  // pesquisa básica
  btnQuery.addEventListener('click', runSearch);
  document.getElementById('global-search')
          .addEventListener('submit', ev => { ev.preventDefault(); runSearch(); });

  // busca incremental de gêneros
  genreInput.addEventListener('input', () => {
    const q = genreInput.value.trim().toLowerCase();
    genreResults.innerHTML = '';
    if (!q) return;
    allGenres
      .filter(g => g.name.toLowerCase().includes(q))
      .slice(0,5)
      .forEach(g => {
        const li = document.createElement('li');
        li.textContent = g.name;
        li.addEventListener('click', () => addGenreTag(g));
        genreResults.appendChild(li);
      });
  });

  // remover dropdown ao clicar fora
  document.addEventListener('click', e => {
    if (!genreInput.contains(e.target)) genreResults.innerHTML = '';
  });
}

//
// Quando clica num gênero sugerido
//
function addGenreTag(g) {
  if (selGenres.has(g.id)) return;
  selGenres.add(g.id);
  renderGenreTags();
  genreInput.value = '';
  genreResults.innerHTML = '';
}

//
// Atualiza UI das tags
//
function renderGenreTags() {
  genreTags.innerHTML = '';
  selGenres.forEach(id => {
    const g = allGenres.find(x=>x.id===id);
    const btn = document.createElement('button');
    btn.className = 'tag';
    btn.textContent = g.name + ' ×';
    btn.addEventListener('click', () => {
      selGenres.delete(id);
      renderGenreTags();
    });
    genreTags.appendChild(btn);
  });
}

//
// Monta e dispara a busca
//
async function runSearch() {
  // resumo do texto
  const qtxt = inputQuery.value.trim();
  summaryQuery.textContent = qtxt ? `“${qtxt}”` : 'Todos';

  // tipos
  let types = typeCbs.filter(cb=>cb.checked).map(cb=>cb.value);
  if (types.length === 0) types = ['movie','tv'];

  // parâmetros comuns
  const params = new URLSearchParams({
    api_key: API_KEY,
    language: 'pt-BR',
    sort_by: sortSelect.value,
    'vote_average.gte': ratingRadios.find(r=>r.checked).value,
    'with_runtime.gte': durMin.value,
    'with_runtime.lte': durMax.value,
    'primary_release_date.gte': `${yearMin.value}-01-01`,
    'primary_release_date.lte': `${yearMax.value}-12-31`,
    page: 1
  });

  if (selGenres.size) {
    params.set('with_genres', [...selGenres].join(','));
  }

  catalog.innerHTML = '<p>Carregando…</p>';
  try {
    // busca para cada tipo (search ou discover)
    const promises = types.map(type => {
      const endpoint = qtxt
        ? `/search/${type}`
        : `/discover/${type}`;
      const url = `${BASE}${endpoint}?${params.toString()}`;
      if (qtxt) params.set('query', qtxt);
      return fetch(url).then(r=>r.json());
    });
    const results = (await Promise.all(promises))
                      .flatMap(r=>r.results || []);
    renderResults(results);
  } catch(err) {
    catalog.innerHTML = `<p>Erro: ${err.message}</p>`;
  }
}

//
// Renderiza cartazes
//
function renderResults(items) {
  catalog.innerHTML = '';
  if (!items.length) {
    catalog.innerHTML = '<p>Nenhum resultado encontrado.</p>';
    return;
  }
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'movie-item';
    const img = document.createElement('img');
    img.src = item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : '../public/icons/place-holder.svg';
    img.alt = item.title || item.name;
    div.appendChild(img);
    div.addEventListener('click', () => {
      window.location.href = `openFilmes.html?id=${item.id}&type=${item.media_type||item.title?'movie':'tv'}`;
    });
    catalog.appendChild(div);
  });
}
