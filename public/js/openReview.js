// openReview.js
import { fetchContentDetails } from './openFilmes.js';
import { renderPage, initModal } from './review.js';

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    id: p.get('id'),
    type: p.get('type')
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  const { id, type } = getParams();
  if (!id || !type) return;  // sem parâmetros, não faz nada

  // ─── 1) preencher o banner ──────────────────────────────────────
  const bannerImg   = document.querySelector('.banner-img');
  const bannerTitle = document.querySelector('.banner-info h1');
  const bannerDesc  = document.querySelector('.banner-info p');

  try {
    const data = await fetchContentDetails(id, type);
    if (data && data.content) {
      const imgPath = data.content.backdrop_path || data.content.poster_path;
      bannerImg.src   = imgPath
        ? `https://image.tmdb.org/t/p/w500${imgPath}`
        : './icons/place-holder.svg';
      bannerImg.alt   = data.content.title || data.content.name;
      bannerTitle.textContent = data.content.title || data.content.name;
      bannerDesc.textContent  = data.content.overview || 'Descrição não disponível.';
    }
  } catch (err) {
    console.error('Erro ao carregar detalhes do conteúdo:', err);
  }

  // ─── 2) “Add Your Review” travado neste id/type ─────────────────
  const btnAdd = document.querySelector('.btn-add-review');
  btnAdd.addEventListener('click', () => {
    // pega o título já renderizado no banner
    const title = bannerTitle.textContent;
    // chama o modal passando o objeto forced = { id, type, title }
    initModal({ id, type, title });
  });

  // ─── 3) renderizar só os reviews deste título ────────────────
  renderPage(1, id, type);
});
