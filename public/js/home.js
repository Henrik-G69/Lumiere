// Chaves e configurações
const TMDB_API_KEY = '98f79a8fc16247f2c16e9d0b422dbfbe';
const BASE_API_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// Seletor do hero
const nextButton = document.getElementById('movie-hero__next-button');
const prevButton = document.getElementById('movie-hero__prev-button');
const carousel = document.querySelector('.movie-hero');
const listHTML = document.querySelector('.movie-hero .films-list');

// Função para buscar trending movies
async function fetchTrending(type = 'movie') {
  const res = await fetch(`${BASE_API_URL}/trending/${type}/day?api_key=${TMDB_API_KEY}&language=pt-BR`);
  const data = await res.json();
  return data.results.slice(0, 10);
}

// Preenche o hero slider
async function populateHero() {
  const movies = await fetchTrending('movie');
  listHTML.innerHTML = '';
  movies.forEach(m => {
    const div = document.createElement('div');
    div.classList.add('movie-hero-film');
    div.innerHTML = `
      <img src="${IMG_BASE}${m.backdrop_path}" alt="${m.title}" />
      <div class="hero-info">
        <h3>${m.title}</h3>
        <p>${m.overview.substring(0, 100)}...</p>
      </div>
    `;
    div.addEventListener('click', () => {
      window.location.href = `openFilmes.html?id=${m.id}&type=movie`;
    });
    listHTML.appendChild(div);
  });
}

/* Slider controls */
nextButton.onclick = () => showSlider('next');
prevButton.onclick = () => showSlider('prev');

function showSlider(type) {
  nextButton.disabled = prevButton.disabled = true;
  const items = document.querySelectorAll('.movie-hero-film');
  if (type === 'next') {
    listHTML.appendChild(items[0]);
  } else {
    listHTML.prepend(items[items.length - 1]);
  }
  setTimeout(() => nextButton.disabled = prevButton.disabled = false, 300);
}

// Top 10 lists rendering
import { initializeCarousel, renderAllUserLists } from './minhaslistas.js';
async function populateTopLists() {
  const topFilms = document.getElementById('carousel_top_filmes');
  const topSeries = document.getElementById('carousel_top_series');
  const filmes = await fetchTrending('movie');
  const series = await fetchTrending('tv');

  filmes.forEach((m) => renderCard(topFilms, m, 'movie'));
  series.forEach((s) => renderCard(topSeries, s, 'tv'));

  initializeCarousel(topFilms);
  initializeCarousel(topSeries);
}

function renderCard(container, media, type) {
  const div = document.createElement('div');
  div.classList.add('film-on-list');
  div.innerHTML = `
    <img src="${IMG_BASE}${media.poster_path}" alt="${media.title || media.name}" />
    <div class="film-on-list-details">
      <span class="duration-value">${
      type === 'movie' && media.runtime ? Math.floor(media.runtime/60)+'h'+media.runtime%60+'min' : ''
    }</span>
      <span class="rating-list-value">${(media.vote_average/2).toFixed(1)}</span>
    </div>
  `;
  div.addEventListener('click', () => {
    window.location.href = `openFilmes.html?id=${media.id}&type=${type}`;
  });
  container.appendChild(div);
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  await populateHero();
  populateTopLists();
  setInterval(() => showSlider('next'), 5000);
  renderAllUserLists();
});