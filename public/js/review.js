// review.js
import { initModal } from './modal.js';

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
  const container = document.querySelector('.review-list');
if (prepend) {
  container.prepend(article);
} else {
  container.appendChild(article);
}

  

  // Banner
  article.querySelector('.banner-film').src = r.banner;
  article.querySelector('.banner-film').alt = r.title;

  // Avatar / usuário
  article.querySelector('.avatar').src = r.user.avatar;
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
  article.querySelector('.action-year').textContent  = r.year;

  // Season / Episode (se aplicável)
  const seasonBtn  = article.querySelector('.action-season');
  const episodeBtn = article.querySelector('.action-episode');
  if (r.type === 'tv') {
    seasonBtn.textContent  = `Season ${r.season}`;
    episodeBtn.textContent = `Episode ${r.episode}`;
    seasonBtn.style.display  = '';
    episodeBtn.style.display = '';
  } else {
    seasonBtn.style.display  = 'none';
    episodeBtn.style.display = 'none';
  }

  // Descrição do review
  article.querySelector('.card-description').textContent = r.text;
}

export function renderAllReviews() {
  const cont = document.querySelector('.review-list');
  cont.innerHTML = '';
  getReviews().forEach(r => renderReviewCard(r, false));
}

/** Init */
document.addEventListener('DOMContentLoaded', () => {
  renderAllReviews();
  document.querySelector('.btn-add-review').addEventListener('click', initModal);
});
