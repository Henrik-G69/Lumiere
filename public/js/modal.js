// modal.js
import { addReview, renderReviewCard } from './review.js';

const apiKey   = '98f79a8fc16247f2c16e9d0b422dbfbe';
const tmdbBase = 'https://api.themoviedb.org/3';
const img_url  = 'https://image.tmdb.org/t/p/w500';

export function initModal() {
  const dlg = document.getElementById('review-modal');
  dlg.showModal();
}

document.addEventListener('DOMContentLoaded', () => {
  const dlg     = document.getElementById('review-modal');
  const typeEl  = dlg.querySelector('#modal-type');
  const searchEl= dlg.querySelector('#modal-search');
  const resultsEl = dlg.querySelector('#modal-results');
  const seCont  = dlg.querySelector('#season-episode-container');
  const seasonEl= dlg.querySelector('#modal-season');
  const episodeEl= dlg.querySelector('#modal-episode');
  const saveBtn = dlg.querySelector('#modal-save');
  const cancelBtn = dlg.querySelector('#modal-cancel');

  let selected = null;

  // Quando troca filme/serie
  typeEl.addEventListener('change', () => {
    selected = null;
    resultsEl.innerHTML = '';
    seCont.classList.add('hidden');
    searchEl.value = '';
  });

  // Busca TMDb
  searchEl.addEventListener('input', debounce(async () => {
    const q = searchEl.value.trim();
    if (!q) {
      resultsEl.innerHTML = '';
      return;
    }
    const type = typeEl.value;
    const res  = await fetch(`${tmdbBase}/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(q)}`);
    const { results } = await res.json();
    showResults(results || [], type);
  }, 300));

  function showResults(items, type) {
    resultsEl.innerHTML = '';
    items.slice(0,5).forEach(item => {
      const title = type === 'movie' ? item.title : item.name;
      if (!title) return;
      const li = document.createElement('li');
      li.textContent = title;
      li.addEventListener('click', () => selectItem(item, type));
      resultsEl.appendChild(li);
    });
  }

  async function selectItem(item, type) {
    selected = { type, id: item.id };
    searchEl.value = type === 'movie' ? item.title : item.name;
    resultsEl.innerHTML = '';

    if (type === 'tv') {
      const resShow   = await fetch(`${tmdbBase}/tv/${item.id}?api_key=${apiKey}`);
      const showJson  = await resShow.json();
      seasonEl.innerHTML = '';
      for (let s = 1; s <= (showJson.number_of_seasons || 0); s++) {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = `Season ${s}`;
        seasonEl.appendChild(opt);
      }
      seasonEl.addEventListener('change', loadEpisodes);
      await loadEpisodes();
      seCont.classList.remove('hidden');
    } else {
      seCont.classList.add('hidden');
    }
  }

  async function loadEpisodes() {
    const season = seasonEl.value;
    const res    = await fetch(`${tmdbBase}/tv/${selected.id}/season/${season}?api_key=${apiKey}`);
    const json   = await res.json();
    episodeEl.innerHTML = '';
    (json.episodes || []).forEach(ep => {
      const opt = document.createElement('option');
      opt.value = ep.episode_number;
      opt.textContent = `Ep ${ep.episode_number}`;
      episodeEl.appendChild(opt);
    });
  }

  saveBtn.addEventListener('click', async () => {
    if (!selected) {
      return alert('Selecione um título primeiro.');
    }

    const rating = parseFloat(dlg.querySelector('#modal-rating').value);
    const text   = dlg.querySelector('#modal-text').value.trim();

    // detalhes gerais
    const detailRes = await fetch(`${tmdbBase}/${selected.type}/${selected.id}?api_key=${apiKey}`);
    const detailJson= await detailRes.json();

    // trailer
    const videoRes  = await fetch(`${tmdbBase}/${selected.type}/${selected.id}/videos?api_key=${apiKey}`);
    const videoJson = await videoRes.json();
    const trailer   = (videoJson.results || [])
                      .find(v => v.type === 'Trailer' && v.site === 'YouTube');

    // montando o objeto
    const review = {
      user: {
        email : localStorage.getItem('loggedInUserEmail'),
        name  : localStorage.getItem('loggedInUserNickname'),
        avatar: '../public/img/default-avatar.png',
        ranking: '–',
        xp: 0
      },
      type   : selected.type,
      id     : selected.id,
      season : selected.type === 'tv' ? seasonEl.value : null,
      episode: selected.type === 'tv' ? episodeEl.value  : null,
      rating, text,
      banner: `${img_url}${detailJson.poster_path}`,
      title : selected.type === 'movie' ? detailJson.title : detailJson.name,
      year  : ((selected.type === 'movie'
               ? detailJson.release_date
               : detailJson.first_air_date) || '').slice(0,4),
      description: detailJson.overview,
      trailerUrl : trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
    };

    addReview(review);
    renderReviewCard(review, true);
    dlg.close();
  });

  cancelBtn.addEventListener('click', () => dlg.close());

  dlg.addEventListener('close', () => {
    dlg.querySelector('form').reset();
    resultsEl.innerHTML = '';
    seCont.classList.add('hidden');
    selected = null;
  });
});

// helper debounce
function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}
// Fim do modal.js