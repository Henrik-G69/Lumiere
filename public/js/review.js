// review.js
import { initModal } from './modal.js';

/** Configuração de paginação */
const REVIEWS_PER_PAGE = 10;
let currentPage = 1;

/** Storage utils */
const STORAGE_KEY = 'app_reviews';
function getReviews() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
export function addReview(r) {
  const arr = getReviews();
  arr.unshift(r);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/** Render utils: clona o <template> para cada review */
export function renderReviewCard(r, prepend = false) {
  const tpl = document.getElementById('review-item-template');
  const clone = tpl.content.cloneNode(true);
  const article = clone.querySelector('article');

  // Preencher dados
  article.querySelector('.banner-film').src = r.banner;
  article.querySelector('.banner-film').alt = r.title;

  // Avatar / usuário
  article.querySelector('.avatar').src = r.user.avatar || '../icons/PersonCircle.svg';
  article.querySelector('.user-name').textContent = r.user.name;
  article.querySelector('.user-ranking').innerHTML = `${r.user.ranking}° ranking <span>(${r.user.xp} XP)</span>`;

  // Avaliação em estrelas
  const pct = (r.rating / 10) * 100;
  article.querySelector('.star-rating').style.setProperty('--pct', `${pct}%`);

  // Valor numérico de 0-5
  const displayRating = (r.rating / 2).toFixed(1);
  article.querySelector('.rating-value').textContent = displayRating;

  // Título e ano
  article.querySelector('.action-title').textContent = r.title;
  article.querySelector('.action-year').textContent = r.year;

  // Season / Episode (se aplicável)
  const seasonBtn = article.querySelector('.action-season');
  const episodeBtn = article.querySelector('.action-episode');
  if (r.type === 'tv') {
    seasonBtn.textContent = `Season ${r.season}`;
    episodeBtn.textContent = `Episode ${r.episode}`;
    seasonBtn.style.display = '';
    episodeBtn.style.display = '';
  } else {
    seasonBtn.style.display = 'none';
    episodeBtn.style.display = 'none';
  }
  article.querySelector('.card-description').textContent = r.text;

  const container = document.querySelector('.review-list');
  if (prepend) container.prepend(article);
  else container.appendChild(article);
}

/** Renderiza apenas uma página de reviews e cria paginação */
export function renderPage(page = 1) {
  const all = getReviews();
  const total = all.length;
  const totalPages = Math.ceil(total / REVIEWS_PER_PAGE) || 1;
  currentPage = Math.min(Math.max(1, page), totalPages);

  // Slice dos reviews para página
  const start = (currentPage - 1) * REVIEWS_PER_PAGE;
  const slice = all.slice(start, start + REVIEWS_PER_PAGE);

  // Limpa e renderiza
  const container = document.querySelector('.review-list');
  container.innerHTML = '';
  slice.forEach(r => renderReviewCard(r, false));

  // Atualiza controles de paginação
  renderPagination(totalPages);
}

/** Cria botões de paginação */
function renderPagination(totalPages) {
  const pagContainer = document.querySelector('.paginacao .indicators');
  pagContainer.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('aria-label', `Página ${i}`);
    if (i === currentPage) dot.classList.add('active');
    // sem textContent, fica invisível
    dot.addEventListener('click', () => renderPage(i));
    pagContainer.appendChild(dot);

  }
}

/** Init */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.btn-add-review').addEventListener('click', initModal);
  renderPage(1);
  // seta esquerda
  const prevBtn = document.querySelector('.carousel-controls .arrow:first-child');
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) renderPage(currentPage - 1);
  });

  // seta direita
  const nextBtn = document.querySelector('.carousel-controls .arrow:last-child');
  nextBtn.addEventListener('click', () => {
    // totalPages você pode recalcular ou armazenar globalmente
    const totalPages = Math.ceil(getReviews().length / REVIEWS_PER_PAGE) || 1;
    if (currentPage < totalPages) renderPage(currentPage + 1);
  });

});