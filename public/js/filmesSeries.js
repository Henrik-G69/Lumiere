const api_key = '98f79a8fc16247f2c16e9d0b422dbfbe';
const img_url = 'https://image.tmdb.org/t/p/w500';


const films_top10 = document.getElementById('carouselFilms__top10');
const films_latest = document.getElementById('carouselFilms__latest');
const films_topRated = document.getElementById('carouselFilms__topRated');
const films_horror = document.getElementById('carouselFilms__horror');
const films_classics = document.getElementById('carouselFilms__classics');
const series_top10 = document.getElementById('carouselSeries__top10');
const series_latest = document.getElementById('carouselSeries__latest');
const series_popCultureClassics = document.getElementById('carouselSeries__popCultureClassics');
const series_topRated = document.getElementById('carouselSeries__topRated');
const movieCardTemplate = document.getElementById('movieCardTemplate').content.firstElementChild;
const CACHE_KEY_POPULAR_MOVIES = 'popularMoviesLastYearCache';
const CACHE_KEY_LATEST_MOVIES = 'latestMoviesCache';
const CACHE_KEY_TOP_RATED_MOVIES = 'topRatedMoviesCache';
const CACHE_KEY_HORROR_MOVIES = 'horrorMoviesCache';
const CACHE_KEY_CLASSICS_MOVIES = 'classicsMoviesCache';
const CACHE_KEY_POPULAR_SERIES = 'popularSeriesLastYearCache';
const CACHE_KEY_LATEST_SERIES = 'latestSeriesCache';
const CACHE_KEY_POP_CULTURE_CLASSICS_SERIES = 'popCultureClassicsSeriesCache';
const CACHE_KEY_TOP_RATED_SERIES = 'topRatedSeriesCache';
const CACHE_KEY_MEDIA_DETAILS = 'mediaDetailsCache_'; 
const CACHE_DURATION_MS = 3600000; 
/*criamos um método de cache para evitar requisições constantes da API, otimizando
memória e desempenho, o cache dura por 1h e depois disso há outra requisição */



/**
 * formata o tempo de execução para filmes ou o número de temporadas para séries.
 * @param {object} mediaDetails detalhes (filme ou série).
 * @param {string} mediaType tipo de card ('movie' ou 'tv').
 * @returns {string} tempo formatado (em horas ou temporadas).
 */
function formatDuration(mediaDetails, mediaType) {
    if (!mediaDetails) {
        return 'N/A';
    }

    if (mediaType === 'movie') {
        const minutes = mediaDetails.runtime;
        if (minutes === null || minutes === undefined || minutes <= 0) {
            return 'N/A';
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours > 0) {
            return remainingMinutes === 0 ? `${hours}h` : `${hours}h${remainingMinutes}`;
        } else {
            return `${remainingMinutes}min`;
        }
    } else if (mediaType === 'tv') {
        const seasons = mediaDetails.number_of_seasons;
        const status = mediaDetails.status;
        if (seasons === 1) {
            return '1S';
        } else if (seasons > 1) {
            return `${seasons}S`;
        }
    }
    return 'N/A';
}


/**
 * função para formatar objetos date para o formatoYYYY-MM-DD.
 * @param {Date} date o objeto a ser formatado.
 * @returns {string} A data formatada.
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // mês começando com 0, adiciona zero à esquerda
    const day = String(date.getDate()).padStart(2, '0'); // adiciona zero à esquerda para formatar em dois digitos
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
const endOfLastCentury = '1999-12-31';

// data limite para "Clássicos da Cultura Pop (Séries)" - por exemplo, séries lançadas antes de 2012
const endOfPopCultureClassics = '2012-12-31'; 

// ID do gênero Terror na TMDB para a lista de filmes de terror 
const HORROR_GENRE_ID = 27;


/**
 * função que carrega os detalhes dos filmes e series, independente do tipo
 * também implementa cache para a lista de mídias e para os detalhes de cada mídia
 * @param {HTMLElement} element O elemento DOM onde as mídias serão exibidas.
 * @param {string} listCacheKey A chave para o cache da lista de mídias no localStorage.
 * @param {string} apiEndpointBase O caminho base do endpoint da API da TMDB (ex: 'movie/popular?api_key=...').
 * @param {string} mediaType Tipo de mídia ('movie' ou 'tv').
 * @param {number} pagesToLoad O número de páginas da API a serem carregadas (padrão: 1).
 * @returns {Promise<Array>}
 */
async function loadMedia(element, listCacheKey, apiEndpointBase, loadingMessage, noMediaMessage, mediaType, pagesToLoad = 1) {
    if (!element) {
        console.error(`Elemento DOM para ${loadingMessage} (associado ao endpoint base '${apiEndpointBase}') não encontrado.`);
        return [];
    }
    element.innerHTML = loadingMessage;

    try {
        let allMedia = []; // array para armazenar mídias de todas as páginas
        let isListCacheValid = false;

        const savedListCache = localStorage.getItem(listCacheKey);
        if (savedListCache) {
            const { data, timestamp, fetchedPagesCount } = JSON.parse(savedListCache);
            const now = Date.now();
            // verifica se o cache ainda é válido e se ele já contém o número de páginas desejado
            if (now - timestamp < CACHE_DURATION_MS && fetchedPagesCount >= pagesToLoad) {
                allMedia = data; // carrega todos os dados do cache se já tiver as páginas necessárias
                isListCacheValid = true;
                console.log(`${loadingMessage.replace('Carregando ', '').replace('...', '')} (${fetchedPagesCount} páginas) carregados do cache.`);
            } else {
                console.log(`Cache de ${loadingMessage.replace('Carregando ', '').replace('...', '')} expirado ou incompleto. Buscando novas mídias.`);
            }
        }

        // se o cache não for válido ou não existir, faz as requisições à API
        if (!isListCacheValid) {
            for (let page = 1; page <= pagesToLoad; page++) {
                try {
                    //aAdiciona o parâmetro de página ao endpoint base
                    const endpointWithPage = `${apiEndpointBase}&page=${page}`;
                    console.log(`Fazendo requisição à API: https://api.themoviedb.org/3/${endpointWithPage}`);
                    const response = await fetch(`https://api.themoviedb.org/3/${endpointWithPage}`);

                    if (!response.ok) { // verifica se a resposta HTTP foi bem-sucedida (as duas requisições, no caso)
                        throw new Error(`Erro HTTP! Status: ${response.status} ao carregar página ${page} de: ${apiEndpointBase}`);
                    }

                    const apiData = await response.json();
                    if (apiData.results && apiData.results.length > 0) {
                        allMedia = allMedia.concat(apiData.results); // concatena os resultados de cada página
                    } else {
                        // se uma página não retornar resultados, não há mais dados para buscar, então para o loop.
                        console.log(`Página ${page} não retornou resultados para ${loadingMessage}. Parando de carregar.`);
                        break;
                    }

                    // atribui um pequeno atraso, evitando estourar o limite da api de requisições por segundo
                    //e tornando a distribuição dos dados no design mais "dinamico"
                    // não espera após a última página que será buscada
                    if (page < pagesToLoad) {
                        await new Promise(resolve => setTimeout(resolve, 150)); // atraso de 150ms
                    }

                } catch (pageError) {
                    console.error(`Erro ao buscar página ${page} para ${loadingMessage}:`, pageError);
                    // Se uma página falhar, para.
                    break;
                }
            }
            // salva todos os resultados no cache, junto com a quantidade de páginas buscadas
            const cacheEntry = {
                data: allMedia,
                timestamp: Date.now(),
                fetchedPagesCount: pagesToLoad // armazena quantas páginas foram buscadas e cacheadas
            };
            localStorage.setItem(listCacheKey, JSON.stringify(cacheEntry));
            console.log(`Novas ${loadingMessage.replace('Carregando ', '').replace('...', '').toLowerCase()} (${pagesToLoad} páginas) salvas no cache.`);
        }

        element.innerHTML = ''; //limpa as mensagens de carregamento depois de requisitar

        // verifica se há mídias para exibir
        if (allMedia && allMedia.length > 0) {
            // verifica se o template do card de mídia existe
            if (!movieCardTemplate) {
                console.error("Template de card de filme/série com ID 'movieCardTemplate' não encontrado no DOM.");
                element.innerHTML = '<p style="color: red;">Erro: Template de mídia não encontrado.</p>';
                return allMedia;
            }

            // preenche todos os cards (o carrossel vai gerenciar a rolagem)
            for (let i = 0; i < allMedia.length; i++) {
                const currentMedia = allMedia[i];

                let duration = 'N/A';
                let mediaDetails;

                // lógica de cache para os detalhes individuais da mídia
                const mediaDetailsCacheKey = `${CACHE_KEY_MEDIA_DETAILS}${mediaType}_${currentMedia.id}`; 
                const savedDetailsCache = localStorage.getItem(mediaDetailsCacheKey);

                if (savedDetailsCache) {
                    const { data, timestamp } = JSON.parse(savedDetailsCache);
                    const now = Date.now();
                    if (now - timestamp < CACHE_DURATION_MS) {
                        mediaDetails = data;
                    }
                }

                // se os detalhes não foram válidos do cache, faça a requisição
                if (!mediaDetails) {
                    try {
                        const mediaDetailsResponse = await fetch(`https://api.themoviedb.org/3/${mediaType}/${currentMedia.id}?api_key=${api_key}&language=en-US`);

                        if (!mediaDetailsResponse.ok) {
                            console.warn(`Aviso: Erro ao buscar detalhes para a ${mediaType} ID ${currentMedia.id}. Status: ${mediaDetailsResponse.status}`);
                            mediaDetails = null;
                        } else {
                            mediaDetails = await mediaDetailsResponse.json();
                            const detailsCacheEntry = {
                                data: mediaDetails,
                                timestamp: Date.now()
                            };
                            localStorage.setItem(mediaDetailsCacheKey, JSON.stringify(detailsCacheEntry));
                        }
                    } catch (detailsError) {
                        console.error(`Erro ao buscar detalhes para a ${mediaType} ID ${currentMedia.id}:`, detailsError);
                        mediaDetails = null;
                    }
                }

                // atualiza a duração/temporadas se os detalhes foram obtidos
                if (mediaDetails) {
                    duration = formatDuration(mediaDetails, mediaType);
                }

                // criação e preenchimento do card de mídia usando o template
                const mediaCard = movieCardTemplate.cloneNode(true);

                // preenche a imagem do pôster (usa poster_path tanto para filmes quanto para séries)
                const posterImg = mediaCard.querySelector('.film-banner-list-carousel');
                if (posterImg && currentMedia.poster_path) {
                    posterImg.src = `${img_url}${currentMedia.poster_path}`;
                    posterImg.alt = `Pôster da ${mediaType === 'movie' ? 'filme' : 'série'} ${currentMedia.title || currentMedia.name}`;
                } else {
                    posterImg.src = '../public/img/placeholder.png'; // Imagem placeholder em caso de erro
                    posterImg.alt = 'Imagem não disponível';
                }


                if (posterImg) {
                    posterImg.addEventListener('click', () => {
                        const targetPage = 'openFilmes.html';

                        /*obs.: essa parte é essencial
                        ela remaneja o cache das informações principais do filme/serie quando os seus cards forem clicados
                        enviando para a página de apertura (openFilmes), o que evita múltiplas requisições e um
                        "delay" quando a página é aperta, tornando melhor a UX */
                        const preloadedDetails = {
                            id: currentMedia.id,
                            type: mediaType,
                            title: currentMedia.title || currentMedia.name,
                            overview: currentMedia.overview, //sinpose
                            poster_path: currentMedia.poster_path, //caminho do poster
                            backdrop_path: currentMedia.backdrop_path, //caminho da imagem de fundo/banner larga(o)
                            vote_average: currentMedia.vote_average, //avaliaçao media do publico do moviedb
                            release_date: currentMedia.release_date || currentMedia.first_air_date,
                            genre_ids: currentMedia.genre_ids, // Se disponível
                            runtime: mediaDetails ? mediaDetails.runtime : undefined, //duraçaodo filme
                            number_of_seasons: mediaDetails ? mediaDetails.number_of_seasons : undefined,
                            status: mediaDetails ? mediaDetails.status : undefined, // para séries e especifica o status, em andamento ou finalizada
                        };

                        try {
                            sessionStorage.setItem('preloadedContentDetails', JSON.stringify(preloadedDetails));
                            console.log('Detalhes pré-carregados salvos no sessionStorage para ID:', currentMedia.id);
                        } catch (e) {
                            console.error('Erro ao salvar no sessionStorage:', e);
                        }
                        // redireciona para a página de destino, passando o ID e o type ('film' ou 'tv'/serie) como parâmetros de consulta
                        window.location.href = `${targetPage}?id=${currentMedia.id}&type=${mediaType}`;
                    });
                }


                // preenche a duração/temporadas
                const durationElement = mediaCard.querySelector('.duration-value');
                if (durationElement) {
                    durationElement.textContent = duration;
                }

                // preenche a avaliação (usa vote_average tanto para filmes quanto para séries)
                const rating = currentMedia.vote_average;
                const displayRating = rating !== null && rating !== undefined && rating > 0
                                    ? (rating / 2).toFixed(1) // divide por 2 para escala de 5 estrelas e formata
                                    : 'N/A';

                const ratingListValueElement = mediaCard.querySelector('.rating-list-value');
                if (ratingListValueElement) {
                    ratingListValueElement.textContent = displayRating;
                }
                const starRatingDiv = mediaCard.querySelector('.star-rating');
                if (starRatingDiv && rating !== null && rating !== undefined && rating > 0) {
                    const percentage = (rating / 10) * 100; // converte para porcentagem (escala de 10)
                    starRatingDiv.style.setProperty('--pct', `${percentage}%`);
                } else if (starRatingDiv) {
                    starRatingDiv.style.setProperty('--pct', `0%`); // Sem estrelas se não houver avaliação ou for 0
                }

                // adiciona o card ao elemento pai (carrossel)
                element.appendChild(mediaCard);
            }
        } else {
            // se não houver mídias, exibe a mensagem de "não encontrado"
            element.innerHTML = `<p>${noMediaMessage}</p>`;
        }

        return allMedia; // retorna a lista

    } catch (error) {
        console.error(`Erro ao carregar ${loadingMessage.replace('Carregando ', '').replace('...', '').toLowerCase()}:`, error);
        if (element) {
            element.innerHTML = `<p style="color: red;">Ocorreu um erro ao carregar as mídias: ${error.message}</p>`;
        }
        return [];
    }
}


async function getTop10Films() {
    const discoverEndpoint = `discover/movie?api_key=${api_key}&language=en-US&sort_by=popularity.desc&primary_release_date.gte=${oneYearAgoFormatted}&primary_release_date.lte=${todayFormatted}&vote_count.gte=500`;
    return loadMedia(
        films_top10,
        CACHE_KEY_POPULAR_MOVIES,
        discoverEndpoint,
        'Carregando filmes populares do último ano...',
        'Nenhum filme popular do último ano encontrado.',
        'movie',
        2 // puxa 2 páginas de requisições da API (40 filmes)
    );
}

// Novos Filmes (Em Cartaz)
async function getLatestFilms() {
    const nowPlayingEndpoint = `movie/now_playing?api_key=${api_key}&language=en-US`;
    return loadMedia(
        films_latest,
        CACHE_KEY_LATEST_MOVIES,
        nowPlayingEndpoint,
        'Carregando filmes mais recentes...',
        'Nenhum filme mais recente encontrado.',
        'movie',
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
        'Carregando filmes mais bem avaliados de todos os tempos...',
        'Nenhum filme mais bem avaliado encontrado.',
        'movie',
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
        'Carregando filmes de Terror...',
        'Nenhum filme de Terror encontrado.',
        'movie',
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
        'Carregando Clássicos do Século Passado...',
        'Nenhum Clássico do Século Passado encontrado.',
        'movie',
        2 
    );
}

// lista de series

// Top 10 Séries Agora (populares do último ano)
async function getTop10Series() {
    const discoverEndpoint = `discover/tv?api_key=${api_key}&language=en-US&sort_by=popularity.desc&first_air_date.gte=${oneYearAgoFormatted}&first_air_date.lte=${todayFormatted}&vote_count.gte=200`;
    return loadMedia(
        series_top10,
        CACHE_KEY_POPULAR_SERIES,
        discoverEndpoint,
        'Carregando séries populares do último ano...',
        'Nenhuma série popular do último ano encontrada.',
        'tv',
        2 
    );
}

// Novas Séries (séries recém-lançadas, populares e bem avaliadas)
async function getLatestSeries() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    const threeMonthsAgoFormatted = formatDate(threeMonthsAgo);

    const discoverEndpoint = `discover/tv?api_key=${api_key}&language=en-US&sort_by=popularity.desc&first_air_date.gte=${threeMonthsAgoFormatted}&first_air_date.lte=${todayFormatted}&vote_count.gte=50`;

    return loadMedia(
        series_latest,
        CACHE_KEY_LATEST_SERIES,
        discoverEndpoint,
        'Carregando novas séries (recentes e populares)...',
        'Nenhuma série recente e popular encontrada.',
        'tv',
        2 
    );
}

// Clássicos da Cultura Pop 
async function getPopCultureClassicsSeries() {
    const popClassicsEndpoint = `discover/tv?api_key=${api_key}&language=en-US&sort_by=popularity.desc&first_air_date.lte=${endOfPopCultureClassics}&vote_count.gte=500`;
    return loadMedia(
        series_popCultureClassics,
        CACHE_KEY_POP_CULTURE_CLASSICS_SERIES,
        popClassicsEndpoint,
        'Carregando Clássicos da Cultura Pop (Séries)...',
        'Nenhum Clássico da Cultura Pop encontrado.',
        'tv',
        2 
    );
}

// Séries Mais Bem Avaliadas de Todos os Tempos 
async function getTopRatedSeries() {
    const topRatedEndpoint = `discover/tv?api_key=${api_key}&language=en-US&sort_by=vote_average.desc&vote_count.gte=1000`;
    return loadMedia(
        series_topRated,
        CACHE_KEY_TOP_RATED_SERIES,
        topRatedEndpoint,
        'Carregando Séries Mais Bem Avaliadas de Todos os Tempos...',
        'Nenhuma série mais bem avaliada encontrada.',
        'tv',
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
document.addEventListener('DOMContentLoaded', () => {


    const filmsCarousels = document.querySelectorAll('.films-carousel');

    filmsCarousels.forEach(carousel => {
        const carouselId = carousel.id; // pegar o ID do carrossel para referenciar os controles

        let leftArrow, rightArrow, indicatorsContainer;

        if (carouselId) {
            leftArrow = document.querySelector(`.arrow.carousel-arrow-left[data-carousel-id="${carouselId}"]`);
            rightArrow = document.querySelector(`.arrow.carousel-arrow-right[data-carousel-id="${carouselId}"]`);
            indicatorsContainer = document.querySelector(`.indicators[data-carousel-id="${carouselId}"]`);
        } else {
            console.warn(`Carrossel de filmes/séries sem ID encontrado:`, carousel, `As setas e indicadores podem não funcionar corretamente. Um 'id' é necessário para que a lógica funcione.`);
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
                behavior: 'smooth'
            });

            currentPage = pageIndex;
            updateIndicators();
            updateArrowVisibility();
        };

        const updateIndicators = () => {
            if (!indicatorsContainer) return;

            indicatorsContainer.innerHTML = '';
            const totalPages = getTotalPages();

            if (totalPages <= 1) { // se houver apenas 1 página ou menos, esconde os indicadores
                indicatorsContainer.style.display = 'none';
                return;
            }

            indicatorsContainer.style.display = 'flex';

            // loop para criar um dot para CADA página
            for (let i = 0; i < totalPages; i++) {
                const dot = document.createElement('span');
                dot.classList.add('dot');
                if (i === currentPage) {
                    dot.classList.add('active');
                }
                dot.dataset.pageIndex = i;
                indicatorsContainer.appendChild(dot);
                dot.addEventListener('click', () => goToPage(i));
            }
        };

        const updateArrowVisibility = () => {
            if (!leftArrow || !rightArrow) return;

            const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;

            // margem de erro para a comparação de rolagem
            const scrollThreshold = 5;

            if (carousel.scrollLeft <= scrollThreshold) {
                leftArrow.classList.add('arrow--hidden');
            } else {
                leftArrow.classList.remove('arrow--hidden');
            }

            if (carousel.scrollLeft >= maxScrollLeft - scrollThreshold) {
                rightArrow.classList.add('arrow--hidden');
            } else {
                rightArrow.classList.remove('arrow--hidden');
            }
        };

        // Event listeners para as setas
        if (leftArrow) {
            leftArrow.addEventListener('click', () => {
                if (currentPage > 0) {
                    goToPage(currentPage - 1);
                } 
                // else { updateArrowVisibility(); } removido - redundante
            });
        }

        if (rightArrow) {
            rightArrow.addEventListener('click', () => {
                if (currentPage < getTotalPages() - 1) {
                    goToPage(currentPage + 1);
                }
                // else { updateArrowVisibility(); } removido - redundante
            });
        }

        // listener para atualizar dots e setas ao rolar
        let scrollTimeout;
        carousel.addEventListener('scroll', () => {
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
                    currentPage = Math.round(currentScrollLeft / (itemWidthWithGap * itemsPerPageLogic));
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
                    if (!item.classList.contains('film-on-list--animated')) {
                        item.classList.add('film-on-list--animated');
                        // atraso para animação em cascata 
                        item.style.animationDelay = `${index * 0.05}s`;
                    }
                });
            }
        });
        // (adicionar/remover cards)
        observer.observe(carousel, { childList: true });

        // garante que as setas e dots estejam corretos no carregamento inicial
        setTimeout(() => { // pequeno atraso para garantir que o layout esteja completo
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

    getTop10Series();
    getLatestSeries();
    getPopCultureClassicsSeries();
    getTopRatedSeries();
});