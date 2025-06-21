const api_key = "98f79a8fc16247f2c16e9d0b422dbfbe";
const img_url = "https://image.tmdb.org/t/p/w500";

const films_top10 = document.getElementById("carouselFilms__top10");
const films_latest = document.getElementById("carouselFilms__latest");
const films_topRated = document.getElementById("carouselFilms__topRated");
const films_horror = document.getElementById("carouselFilms__horror");
const films_classics = document.getElementById("carouselFilms__classics");
const movieCardTemplate =
  document.getElementById("movieCardTemplate").content.firstElementChild;
const CACHE_KEY_POPULAR_MOVIES = "popularMoviesLastYearCache";
const CACHE_KEY_LATEST_MOVIES = "latestMoviesCache";
const CACHE_KEY_TOP_RATED_MOVIES = "topRatedMoviesCache";
const CACHE_KEY_HORROR_MOVIES = "horrorMoviesCache";
const CACHE_KEY_CLASSICS_MOVIES = "classicsMoviesCache";
const CACHE_DURATION_MS = 3600000;
/*criamos um método de cache para evitar requisições constantes da API, otimizando
memória e desempenho, o cache dura por 1h e depois disso há outra requisição */

/**
 * formata o tempo de execução para filmes ou o número de temporadas para séries.
 * @param {object} mediaDetails detalhes (filme ou série).
 * @returns {string} tempo formatado (em horas ou temporadas).
 */
function formatDuration(mediaDetails, mediaType) {
  if (!mediaDetails) {
    return "N/A";
  }

  if (mediaType === "movie") {
    const minutes = mediaDetails.runtime;
    if (minutes === null || minutes === undefined || minutes <= 0) {
      return "N/A";
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return remainingMinutes === 0
        ? `${hours}h`
        : `${hours}h${remainingMinutes}`;
    } else {
      return `${remainingMinutes}min`;
    }
  }
  // Retorna N/A para mediaType que não seja 'movie' ou se os detalhes não forem de filme
  return "N/A";
}

/**
 * função para formatar objetos date para o formatoYYYY-MM-DD.
 * @param {Date} date o objeto a ser formatado.
 * @returns {string} A data formatada.
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // mês começando com 0, adiciona zero à esquerda
  const day = String(date.getDate()).padStart(2, "0"); // adiciona zero à esquerda para formatar em dois digitos
  return `${year}-${month}-${day}`;
}

// obtem a data de hoje para filtros de discover
const today = new Date();
const todayFormatted = formatDate(today);

// obtem a data de um ano atrás para filtros de discover
const oneYearAgo = new Date();
oneYearAgo.setFullYear(today.getFullYear() - 1); // subtrai 1 ano
const oneYearAgoFormatted = formatDate(oneYearAgo);

// data limite como criterio de "Clássicos do Século Passado" (lista de filmes)
const endOfLastCentury = "1999-12-31";

// data limite para "Clássicos da Cultura Pop (Séries)" - por exemplo, séries lançadas antes de 2012
const endOfPopCultureClassics = "2012-12-31";

// ID do gênero Terror na TMDB para a lista de filmes de terror
const HORROR_GENRE_ID = 27;

/**
 * Carrega os detalhes dos filmes, com cache, e renderiza os cards.
 * @param {HTMLElement} element          – Container onde os filmes serão exibidos.
 * @param {string} listCacheKey         – Chave de cache no localStorage.
 * @param {string} apiEndpointBase      – Base do endpoint da API TMDB (ex: 'movie/popular?api_key=...').
 * @param {string} loadingMessage       – Texto exibido enquanto carrega.
 * @param {string} noMediaMessage       – Texto exibido se não houver filmes.
 * @param {string} mediaType            - O tipo de mídia ('movie' ou 'tv'). // AJUSTE: Adicionado mediaType explicitamente
 * @param {number} pagesToLoad          – Quantidade de páginas da API a serem carregadas.
 * @returns {Promise<Array>}
 */
async function loadMedia(
  element,
  listCacheKey,
  apiEndpointBase,
  loadingMessage,
  noMediaMessage,
  mediaType, // AJUSTE: Parâmetro mediaType adicionado aqui
  pagesToLoad = 1
) {
  if (!element) {
    console.error(`Elemento para "${loadingMessage}" não encontrado.`);
    return [];
  }
  element.innerHTML = loadingMessage;

  try {
    let allMovies = [];
    let isCacheValid = false;

    // Verifica cache da lista
    const savedCache = localStorage.getItem(listCacheKey);
    if (savedCache) {
      const { data, timestamp, fetchedPagesCount } = JSON.parse(savedCache);
      if (
        Date.now() - timestamp < CACHE_DURATION_MS &&
        fetchedPagesCount >= pagesToLoad
      ) {
        allMovies = data;
        isCacheValid = true;
        console.log(
          `${loadingMessage} carregado do cache (${fetchedPagesCount} páginas).`
        );
      }
    }

    // Se cache inválido, busca na API
    if (!isCacheValid) {
      for (let page = 1; page <= pagesToLoad; page++) {
        const url = `https://api.themoviedb.org/3/${apiEndpointBase}&page=${page}`;
        console.log(`Fazendo requisição à API: ${url}`); // Adicionado log para debug
        const res = await fetch(url);
        if (!res.ok)
          throw new Error(
            `Status ${res.status} ao buscar página ${page} de: ${apiEndpointBase}`
          );
        const { results } = await res.json();
        if (!results || results.length === 0) {
          console.log(
            `Página ${page} não retornou resultados para ${loadingMessage}. Parando de carregar.`
          );
          break; // Se uma página não retorna resultados, para o loop.
        }
        allMovies = allMovies.concat(results);
        if (page < pagesToLoad) await new Promise((r) => setTimeout(r, 150));
      }
      // Salva no cache
      localStorage.setItem(
        listCacheKey,
        JSON.stringify({
          data: allMovies,
          timestamp: Date.now(),
          fetchedPagesCount: pagesToLoad,
        })
      );
      console.log(`${loadingMessage} salvo no cache (${pagesToLoad} páginas).`);
    }

    element.innerHTML = ""; // limpa o loading

    if (!allMovies.length) {
      element.innerHTML = `<p>${noMediaMessage}</p>`;
      return [];
    }

    // Renderiza cada filme
    allMovies.forEach((movie) => {
      // Clona o template
      const mediaCard = movieCardTemplate.cloneNode(true);

      // Preenche pôster
      const imgEl = mediaCard.querySelector(".film-banner-list-carousel");
      if (imgEl && movie.poster_path) {
        imgEl.src = `${img_url}${movie.poster_path}`;
        imgEl.alt = `Pôster do filme ${movie.title}`;
      } else {
        imgEl.src = "../public/img/placeholder.png"; // Imagem placeholder em caso de erro
        imgEl.alt = "Imagem não disponível";
      }

      // Prepara detalhes para sessão seguinte
      const details = {
        id: movie.id,
        type: mediaType, // AJUSTE: Passando o mediaType correto
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        runtime: movie.runtime, // Inclui runtime para filmes
      };
      imgEl.addEventListener("click", () => {
        sessionStorage.setItem(
          "preloadedContentDetails",
          JSON.stringify(details)
        );
        window.location.href = `/Lumiere/pages/openFilmes.html?id=${movie.id}&type=${mediaType}`; // AJUSTE: Passando o mediaType correto na URL
      });

      // Duração (runtime sempre em minutos)
      const durationEl = mediaCard.querySelector(".duration-value");
      durationEl.textContent = formatDuration(
        { runtime: movie.runtime },
        mediaType // AJUSTE: Passando o mediaType correto para formatDuration
      );

      // Avaliação
      const rating =
        movie.vote_average != null && movie.vote_average > 0
          ? (movie.vote_average / 2).toFixed(1)
          : "N/A";
      const ratingEl = mediaCard.querySelector(".rating-list-value");
      ratingEl.textContent = rating;
      const starDiv = mediaCard.querySelector(".star-rating");
      starDiv.style.setProperty(
        "--pct",
        movie.vote_average && movie.vote_average > 0
          ? `${(movie.vote_average / 10) * 100}%`
          : "0%"
      );

      element.appendChild(mediaCard);
    });

    return allMovies;
  } catch (err) {
    console.error(`Erro ao carregar ${loadingMessage}:`, err);
    element.innerHTML = `<p style="color:red;">Ocorreu um erro ao carregar as mídias: ${err.message}</p>`;
    return [];
  }
}

async function getTop10Films() {
  const discoverEndpoint = `discover/movie?api_key=${api_key}&language=en-US&sort_by=popularity.desc&primary_release_date.gte=${oneYearAgoFormatted}&primary_release_date.lte=${todayFormatted}&vote_count.gte=500`;
  return loadMedia(
    films_top10,
    CACHE_KEY_POPULAR_MOVIES,
    discoverEndpoint,
    "Carregando filmes populares do último ano...",
    "Nenhum filme popular do último ano encontrado.",
    "movie", // AJUSTE: Parâmetro mediaType adicionado
    2 // Páginas a carregar
  );
}

// Novos Filmes (Em Cartaz)
async function getLatestFilms() {
  const nowPlayingEndpoint = `movie/now_playing?api_key=${api_key}&language=en-US`;
  return loadMedia(
    films_latest,
    CACHE_KEY_LATEST_MOVIES,
    nowPlayingEndpoint,
    "Carregando filmes mais recentes...",
    "Nenhum filme mais recente encontrado.",
    "movie", // AJUSTE: Parâmetro mediaType adicionado
    2
  );
}

// Filmes Mais Bem Avaliados de Todos os Tempos
async function getTopRatedFilms() {
  const topRatedEndpoint = `discover/movie?api_key=${api_key}&language=en-US&sort_by=vote_average.desc&vote_count.gte=2000`;
  return loadMedia(
    films_topRated,
    CACHE_KEY_TOP_RATED_MOVIES,
    topRatedEndpoint,
    "Carregando filmes mais bem avaliados de todos os tempos...",
    "Nenhum filme mais bem avaliado encontrado.",
    "movie", // AJUSTE: Parâmetro mediaType adicionado
    2
  );
}

// Filmes de Terror (Gênero ID: 27)
async function getHorrorFilms() {
  const horrorEndpoint = `discover/movie?api_key=${api_key}&language=en-US&sort_by=popularity.desc&with_genres=${HORROR_GENRE_ID}&vote_count.gte=100`;
  return loadMedia(
    films_horror,
    CACHE_KEY_HORROR_MOVIES,
    horrorEndpoint,
    "Carregando filmes de Terror...",
    "Nenhum filme de Terror encontrado.",
    "movie", // AJUSTE: Parâmetro mediaType adicionado
    2
  );
}

// Clássicos do Século Passado (até 1999)
async function getClassicsFilms() {
  const classicsEndpoint = `discover/movie?api_key=${api_key}&language=en-US&sort_by=popularity.desc&primary_release_date.lte=${endOfLastCentury}&vote_count.gte=500`;
  return loadMedia(
    films_classics,
    CACHE_KEY_CLASSICS_MOVIES,
    classicsEndpoint,
    "Carregando Clássicos do Século Passado...",
    "Nenhum Clássico do Século Passado encontrado.",
    "movie", // AJUSTE: Parâmetro mediaType adicionado
    2
  );
}

// Função para obter a largura de um item (incluindo o gap/margin)
// Movida para fora do loop filmsCarousels.forEach para evitar redefinição.
const getItemWidthWithGap = (carouselElement, item) => {
  if (!item) {
    // Fallback se não há itens para medir. Use o CSS calculado para o gap
    const computedStyle = getComputedStyle(carouselElement); // Usa o elemento passado como argumento
    const gapValue = parseFloat(computedStyle.gap);
    return 176 + (isNaN(gapValue) ? 0 : gapValue);
  }
  const computedStyle = getComputedStyle(carouselElement); // Usa o elemento passado como argumento
  const gapValue = parseFloat(computedStyle.gap);
  return item.offsetWidth + (isNaN(gapValue) ? 0 : gapValue);
};

// inicia o carregamento de todas as listas
document.addEventListener("DOMContentLoaded", () => {
  const filmsCarousels = document.querySelectorAll(".films-carousel");

  filmsCarousels.forEach((carousel) => {
    const carouselId = carousel.id; // pegar o ID do carrossel para referenciar os controles

    let leftArrow, rightArrow, indicatorsContainer;

    if (carouselId) {
      leftArrow = document.querySelector(
        `.arrow.carousel-arrow-left[data-carousel-id="${carouselId}"]`
      );
      rightArrow = document.querySelector(
        `.arrow.carousel-arrow-right[data-carousel-id="${carouselId}"]`
      );
      indicatorsContainer = document.querySelector(
        `.indicators[data-carousel-id="${carouselId}"]`
      );
    } else {
      console.warn(
        `Carrossel de filmes/séries sem ID encontrado:`,
        carousel,
        `As setas e indicadores podem não funcionar corretamente. Um 'id' é necessário para que a lógica funcione.`
      );
      return; // pula o carrossel se não tiver um ID
    }

    const itemsPerPageLogic = 5; // mostra 5 itens para pagina do carrossel rodada
    let currentPage = 0; // pagina atual do carrossel

    // função para calcular o número total de páginas (ou "grupos" de itens)
    const getTotalPages = () => {
      const totalItems = carousel.children.length;
      if (totalItems === 0) return 0;

      return Math.ceil(totalItems / itemsPerPageLogic);
    };

    // função para rolar para uma "página" específica
    const goToPage = (pageIndex) => {
      const totalPages = getTotalPages();
      if (totalPages === 0) return;

      // garante que o pageIndex esteja dentro dos limites
      pageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));

      const firstItem = carousel.children[0];
      if (!firstItem) return;

      // Passa 'carousel' para a função getItemWidthWithGap
      const itemWidthWithGap = getItemWidthWithGap(carousel, firstItem);
      const scrollAmount = itemWidthWithGap * itemsPerPageLogic * pageIndex; // sempre pula de 5 em 5 itens

      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
      carousel.scroll({
        left: Math.min(scrollAmount, maxScrollLeft),
        behavior: "smooth",
      });

      currentPage = pageIndex;
      updateIndicators();
      updateArrowVisibility();
    };

    const updateIndicators = () => {
      if (!indicatorsContainer) return;

      indicatorsContainer.innerHTML = "";
      const totalPages = getTotalPages();

      if (totalPages <= 1) {
        // se houver apenas 1 página ou menos, esconde os indicadores
        indicatorsContainer.style.display = "none";
        return;
      }

      indicatorsContainer.style.display = "flex";

      // loop para criar um dot para CADA página
      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement("span");
        dot.classList.add("dot");
        if (i === currentPage) {
          dot.classList.add("active");
        }
        dot.dataset.pageIndex = i;
        indicatorsContainer.appendChild(dot);
        dot.addEventListener("click", () => goToPage(i));
      }
    };

    const updateArrowVisibility = () => {
      if (!leftArrow || !rightArrow) return;

      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;

      // margem de erro para a comparação de rolagem
      const scrollThreshold = 5;

      if (carousel.scrollLeft <= scrollThreshold) {
        leftArrow.classList.add("arrow--hidden");
      } else {
        leftArrow.classList.remove("arrow--hidden");
      }

      if (carousel.scrollLeft >= maxScrollLeft - scrollThreshold) {
        rightArrow.classList.add("arrow--hidden");
      } else {
        rightArrow.classList.remove("arrow--hidden");
      }
    };

    // Event listeners para as setas
    if (leftArrow) {
      leftArrow.addEventListener("click", () => {
        if (currentPage > 0) {
          goToPage(currentPage - 1);
        }
      });
    }

    if (rightArrow) {
      rightArrow.addEventListener("click", () => {
        if (currentPage < getTotalPages() - 1) {
          goToPage(currentPage + 1);
        }
      });
    }

    // listener para atualizar dots e setas ao rolar
    let scrollTimeout;
    carousel.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const firstItem = carousel.children[0];
        if (!firstItem) {
          currentPage = 0;
        } else {
          // Passa 'carousel' para a função getItemWidthWithGap
          const itemWidthWithGap = getItemWidthWithGap(carousel, firstItem);
          const currentScrollLeft = carousel.scrollLeft;
          // calcula a página atual baseada na rolagem
          currentPage = Math.round(
            currentScrollLeft / (itemWidthWithGap * itemsPerPageLogic)
          );
          // garante que currentPage não exceda o total de páginas
          currentPage = Math.min(currentPage, getTotalPages() - 1);
        }

        updateIndicators();
        updateArrowVisibility();
      }, 100);
    });

    // observador para reagir a quando a quantia de cards mudar
    const observer = new MutationObserver(() => {
      goToPage(Math.min(currentPage, getTotalPages() - 1));

      if (carousel.children.length > 0) {
        // animação de entrada para novos itens carregados
        Array.from(carousel.children).forEach((item, index) => {
          // verifica se o item já tem a classe de animação para não aplicar múltiplas vezes
          if (!item.classList.contains("film-on-list--animated")) {
            item.classList.add("film-on-list--animated");
            // atraso para animação em cascata
            item.style.animationDelay = `${index * 0.05}s`;
          }
        });
      }
    });
    // (adicionar/remover cards)
    observer.observe(carousel, { childList: true });

    // garante que as setas e dots estejam corretos no carregamento inicial
    setTimeout(() => {
      // pequeno atraso para garantir que o layout esteja completo
      updateIndicators();
      updateArrowVisibility();
    }, 200);
  });

  // chama as funções para carregar os dados
  getTop10Films();
  getLatestFilms();
  getTopRatedFilms();
  getHorrorFilms();
  getClassicsFilms();
});
