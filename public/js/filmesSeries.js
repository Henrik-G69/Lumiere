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

/**
 * Formata o tempo de execução para filmes ou o número de temporadas para séries.
 * @param {object} mediaDetails Detalhes da mídia (filme ou série).
 * @param {string} mediaType Tipo de mídia ('movie' ou 'tv').
 * @returns {string} Tempo formatado (ex: "2h30" ou "5 Temporadas").
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
        } else if (status === 'Returning Series' || status === 'In Production' || status === 'Planned') {
            return 'Em Andamento'; // Para séries ainda no ar sem número de temporadas definido
        }
        return 'N/A';
    }
    return 'N/A';
}


/**
 * Função auxiliar para formatar objetos Date para o formato YYYY-MM-DD.
 * @param {Date} date O objeto Date a ser formatado.
 * @returns {string} A data formatada.
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa do 0, adiciona zero à esquerda
    const day = String(date.getDate()).padStart(2, '0'); // Adiciona zero à esquerda
    return `${year}-${month}-${day}`;
}

// Obter a data de hoje para filtros de discover
const today = new Date();
const todayFormatted = formatDate(today);

// Obter a data de um ano atrás para filtros de discover
const oneYearAgo = new Date();
oneYearAgo.setFullYear(today.getFullYear() - 1); // Subtrai 1 ano
const oneYearAgoFormatted = formatDate(oneYearAgo);

// Data limite para "Clássicos do Século Passado" (Filmes)
const endOfLastCentury = '1999-12-31';

// Data limite para "Clássicos da Cultura Pop (Séries)" - por exemplo, séries lançadas antes de 2010
const endOfPopCultureClassics = '2018-12-31'; // Ajuste conforme seu critério de "clássicos da cultura pop" para séries

// ID do gênero Terror na TMDB
const HORROR_GENRE_ID = 27;


/**
 * Função genérica para carregar e exibir mídias (filmes ou séries) em uma lista.
 * Implementa cache para a lista de mídias e para os detalhes de cada mídia.
 * Esta função foi modificada para puxar múltiplas páginas da API.
 * @param {HTMLElement} element O elemento DOM onde as mídias serão exibidas.
 * @param {string} listCacheKey A chave para o cache da lista de mídias no localStorage.
 * @param {string} apiEndpointBase O caminho base do endpoint da API da TMDB (ex: 'movie/popular?api_key=...').
 * NÃO inclua o parâmetro '&page=' aqui, ele será adicionado internamente.
 * @param {string} loadingMessage A mensagem a ser exibida enquanto as mídias estão carregando.
 * @param {string} noMediaMessage A mensagem a ser exibida se nenhuma mídia for encontrada.
 * @param {string} mediaType Tipo de mídia ('movie' ou 'tv').
 * @param {number} pagesToLoad O número de páginas da API a serem carregadas (padrão: 1).
 * @returns {Promise<Array>} Uma promessa que resolve com a lista de mídias.
 */
async function loadMedia(element, listCacheKey, apiEndpointBase, loadingMessage, noMediaMessage, mediaType, pagesToLoad = 1) {
    if (!element) {
        console.error(`Elemento DOM para ${loadingMessage} (associado ao endpoint base '${apiEndpointBase}') não encontrado.`);
        return [];
    }
    element.innerHTML = loadingMessage;

    try {
        let allMedia = []; // Array para armazenar mídias de todas as páginas
        let isListCacheValid = false;

        const savedListCache = localStorage.getItem(listCacheKey);
        if (savedListCache) {
            const { data, timestamp, fetchedPagesCount } = JSON.parse(savedListCache);
            const now = Date.now();
            // Verifica se o cache ainda é válido E se ele já contém o número de páginas desejado
            if (now - timestamp < CACHE_DURATION_MS && fetchedPagesCount >= pagesToLoad) {
                allMedia = data; // Carrega todos os dados do cache se já tiver as páginas necessárias
                isListCacheValid = true;
                console.log(`${loadingMessage.replace('Carregando ', '').replace('...', '')} (${fetchedPagesCount} páginas) carregados do cache.`);
            } else {
                console.log(`Cache de ${loadingMessage.replace('Carregando ', '').replace('...', '')} expirado ou incompleto. Buscando novas mídias.`);
            }
        }

        // Se o cache não for válido ou não existir, faz as requisições à API
        if (!isListCacheValid) {
            for (let page = 1; page <= pagesToLoad; page++) {
                try {
                    // Adiciona o parâmetro de página ao endpoint base
                    const endpointWithPage = `${apiEndpointBase}&page=${page}`;
                    console.log(`Fazendo requisição à API: https://api.themoviedb.org/3/${endpointWithPage}`);
                    const response = await fetch(`https://api.themoviedb.org/3/${endpointWithPage}`);

                    if (!response.ok) { // Verifica se a resposta HTTP foi bem-sucedida (status 2xx)
                        throw new Error(`Erro HTTP! Status: ${response.status} ao carregar página ${page} de: ${apiEndpointBase}`);
                    }

                    const apiData = await response.json();
                    if (apiData.results && apiData.results.length > 0) {
                        allMedia = allMedia.concat(apiData.results); // Concatena os resultados de cada página
                    } else {
                        // Se uma página não retornar resultados, não há mais dados para buscar, então para o loop.
                        console.log(`Página ${page} não retornou resultados para ${loadingMessage}. Parando de carregar.`);
                        break;
                    }

                    // PEQUENO ATRASO (IMPORTANTE para evitar rate limits do TMDB)
                    // Não espere após a última página que será buscada
                    if (page < pagesToLoad) {
                        await new Promise(resolve => setTimeout(resolve, 150)); // Atraso de 150ms entre as requisições
                    }

                } catch (pageError) {
                    console.error(`Erro ao buscar página ${page} para ${loadingMessage}:`, pageError);
                    // Se uma página falhar, você pode decidir parar ou tentar a próxima.
                    // Aqui, optamos por parar para não ter dados incompletos ou requisições desnecessárias.
                    break;
                }
            }
            // Salva todos os resultados combinados no cache, junto com a quantidade de páginas buscadas
            const cacheEntry = {
                data: allMedia,
                timestamp: Date.now(),
                fetchedPagesCount: pagesToLoad // Armazena quantas páginas foram buscadas e cacheadas
            };
            localStorage.setItem(listCacheKey, JSON.stringify(cacheEntry));
            console.log(`Novas ${loadingMessage.replace('Carregando ', '').replace('...', '').toLowerCase()} (${pagesToLoad} páginas) salvas no cache.`);
        }

        element.innerHTML = ''; // Limpa a mensagem de carregamento após obter as mídias

        // Verifica se há mídias para exibir
        if (allMedia && allMedia.length > 0) {
            // Verifica se o template do card de mídia existe
            if (!movieCardTemplate) {
                console.error("Template de card de filme/série com ID 'movieCardTemplate' não encontrado no DOM.");
                element.innerHTML = '<p style="color: red;">Erro: Template de mídia não encontrado.</p>';
                return allMedia;
            }

            // Preenche todos os cards (o carrossel vai gerenciar a rolagem)
            for (let i = 0; i < allMedia.length; i++) {
                const currentMedia = allMedia[i]; // Agora usamos 'allMedia' que contém resultados de várias páginas

                let duration = 'N/A';
                let mediaDetails;

                // Lógica de cache para os DETALHES individuais da mídia
                const mediaDetailsCacheKey = `${CACHE_KEY_MEDIA_DETAILS}${mediaType}_${currentMedia.id}`; // Adiciona mediaType à chave
                const savedDetailsCache = localStorage.getItem(mediaDetailsCacheKey);

                if (savedDetailsCache) {
                    const { data, timestamp } = JSON.parse(savedDetailsCache);
                    const now = Date.now();
                    if (now - timestamp < CACHE_DURATION_MS) {
                        mediaDetails = data;
                    }
                }

                // Se os detalhes não foram válidos do cache, faça a requisição
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

                // Atualiza a duração/temporadas se os detalhes foram obtidos
                if (mediaDetails) {
                    duration = formatDuration(mediaDetails, mediaType);
                }

                // Criação e preenchimento do card de mídia usando o template
                const mediaCard = movieCardTemplate.cloneNode(true);

                // Preenche a imagem do pôster (usa poster_path tanto para filmes quanto para séries)
                const posterImg = mediaCard.querySelector('.film-banner-list-carousel');
                if (posterImg && currentMedia.poster_path) {
                    posterImg.src = `${img_url}${currentMedia.poster_path}`;
                    posterImg.alt = `Pôster da ${mediaType === 'movie' ? 'filme' : 'série'} ${currentMedia.title || currentMedia.name}`;
                } else {
                    posterImg.src = '../public/img/placeholder.png'; // Imagem placeholder
                    posterImg.alt = 'Imagem não disponível';
                }


                if (posterImg) {
                    posterImg.addEventListener('click', () => {
                        // Determina a página de destino com base no tipo de mídia
                        const targetPage = mediaType === 'movie' ? 'openFilmes.html' : 'openSerie.html';

                        // Redireciona para a página de destino, passando o ID como um parâmetro de consulta
                        window.location.href = `${targetPage}?id=${currentMedia.id}`;
                    });


                }


                // Preenche a duração/temporadas
                const durationElement = mediaCard.querySelector('.duration-value');
                if (durationElement) {
                    durationElement.textContent = duration;
                }

                // Preenche a avaliação (usa vote_average tanto para filmes quanto para séries)
                const rating = currentMedia.vote_average;
                const displayRating = rating !== null && rating !== undefined && rating > 0
                                    ? (rating / 2).toFixed(1) // Divide por 2 para escala de 5 estrelas e formata
                                    : 'N/A';

                const ratingListValueElement = mediaCard.querySelector('.rating-list-value');
                if (ratingListValueElement) {
                    ratingListValueElement.textContent = displayRating;
                }
                const starRatingDiv = mediaCard.querySelector('.star-rating');
                if (starRatingDiv && rating !== null && rating !== undefined && rating > 0) {
                    const percentage = (rating / 10) * 100; // Converte para porcentagem (escala de 10)
                    starRatingDiv.style.setProperty('--pct', `${percentage}%`);
                } else if (starRatingDiv) {
                    starRatingDiv.style.setProperty('--pct', `0%`); // Sem estrelas se não houver avaliação ou for 0
                }

                // Adiciona o card ao elemento pai (carrossel)
                element.appendChild(mediaCard);
            }
        } else {
            // Se não houver mídias, exibe a mensagem de "não encontrado"
            element.innerHTML = `<p>${noMediaMessage}</p>`;
        }

        return allMedia; // Retorna a lista de mídias

    } catch (error) {
        console.error(`Erro ao carregar ${loadingMessage.replace('Carregando ', '').replace('...', '').toLowerCase()}:`, error);
        if (element) {
            element.innerHTML = `<p style="color: red;">Ocorreu um erro ao carregar as mídias: ${error.message}</p>`;
        }
        return [];
    }
}

// --- FUNÇÕES ESPECÍFICAS PARA CADA LISTA DE FILMES ---

// Note: O '&page=1' foi removido do endpoint, e o 2 foi passado como pagesToLoad
async function getTop10Films() {
    const discoverEndpoint = `discover/movie?api_key=${api_key}&language=en-US&sort_by=popularity.desc&primary_release_date.gte=${oneYearAgoFormatted}&primary_release_date.lte=${todayFormatted}&vote_count.gte=500`;
    return loadMedia(
        films_top10,
        CACHE_KEY_POPULAR_MOVIES,
        discoverEndpoint,
        'Carregando filmes populares do último ano...',
        'Nenhum filme popular do último ano encontrado.',
        'movie',
        2 // Puxar 2 páginas (40 filmes)
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
        2 // Puxar 2 páginas (40 filmes)
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
        2 // Puxar 2 páginas (40 filmes)
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
        2 // Puxar 2 páginas (40 filmes)
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
        2 // Puxar 2 páginas (40 filmes)
    );
}

// --- FUNÇÕES ESPECÍFICAS PARA CADA LISTA DE SÉRIES ---

// Top 10 Séries Agora (Populares do último ano)
async function getTop10Series() {
    const discoverEndpoint = `discover/tv?api_key=${api_key}&language=en-US&sort_by=popularity.desc&first_air_date.gte=${oneYearAgoFormatted}&first_air_date.lte=${todayFormatted}&vote_count.gte=200`;
    return loadMedia(
        series_top10,
        CACHE_KEY_POPULAR_SERIES,
        discoverEndpoint,
        'Carregando séries populares do último ano...',
        'Nenhuma série popular do último ano encontrada.',
        'tv',
        2 // Puxar 2 páginas (40 séries)
    );
}

// Novas Séries (Séries recém-lançadas, populares e bem avaliadas)
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
        2 // Puxar 2 páginas (40 séries)
    );
}

// Clássicos da Cultura Pop (Séries) - substituindo "Recomendados"
async function getPopCultureClassicsSeries() {
    const popClassicsEndpoint = `discover/tv?api_key=${api_key}&language=en-US&sort_by=popularity.desc&first_air_date.lte=${endOfPopCultureClassics}&vote_count.gte=500`;
    return loadMedia(
        series_popCultureClassics,
        CACHE_KEY_POP_CULTURE_CLASSICS_SERIES,
        popClassicsEndpoint,
        'Carregando Clássicos da Cultura Pop (Séries)...',
        'Nenhum Clássico da Cultura Pop encontrado.',
        'tv',
        2 // Puxar 2 páginas (40 séries)
    );
}

// Séries Mais Bem Avaliadas de Todos os Tempos (NOVA LISTA)
async function getTopRatedSeries() {
    const topRatedEndpoint = `discover/tv?api_key=${api_key}&language=en-US&sort_by=vote_average.desc&vote_count.gte=1000`;
    return loadMedia(
        series_topRated,
        CACHE_KEY_TOP_RATED_SERIES,
        topRatedEndpoint,
        'Carregando Séries Mais Bem Avaliadas de Todos os Tempos...',
        'Nenhuma série mais bem avaliada encontrada.',
        'tv',
        2 // Puxar 2 páginas (40 séries)
    );
}

// --- FUNÇÕES E CÓDIGO RELACIONADOS A CARROSSÉIS DE GÊNEROS E SEÇÃO DE MATCHES PERMANECEM REMOVIDOS ---


// --- CHAMADAS PARA INICIAR O CARREGAMENTO DE TODAS AS LISTAS AO CARREGAR A PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Lógica EXCLUSIVA para os Carrosséis de Lista (APENAS .films-carousel) ---

    // Seleciona APENAS os carrosséis com a classe .films-carousel
    const filmsCarousels = document.querySelectorAll('.films-carousel');

    filmsCarousels.forEach(carousel => {
        const carouselId = carousel.id; // Pegar o ID do carrossel para referenciar os controles

        let leftArrow, rightArrow, indicatorsContainer;

        // É ESSENCIAL que o .films-carousel tenha um ID e que as setas e indicadores
        // tenham um data-carousel-id que corresponda a esse ID.
        if (carouselId) {
            leftArrow = document.querySelector(`.arrow.carousel-arrow-left[data-carousel-id="${carouselId}"]`);
            rightArrow = document.querySelector(`.arrow.carousel-arrow-right[data-carousel-id="${carouselId}"]`);
            indicatorsContainer = document.querySelector(`.indicators[data-carousel-id="${carouselId}"]`);
        } else {
            console.warn(`Carrossel de filmes/séries sem ID encontrado:`, carousel, `As setas e indicadores podem não funcionar corretamente. Um 'id' é necessário para que a lógica funcione.`);
            return; // Pula este carrossel se não tiver um ID
        }

        // Se os controles não forem encontrados para um carrossel de lista,
        // isso geralmente significa um problema de setup no HTML.
        if (!leftArrow || !rightArrow || !indicatorsContainer) {
            // Este log é importante para depuração se você não tiver os controles HTML para um ID
            console.warn(`Controles (setas ou indicadores) para o carrossel #${carouselId} não encontrados. Verifique se o ID do carrossel corresponde ao data-carousel-id nos botões e indicators.`, carousel);
            return; // Pula este carrossel se não tiver controles associados
        }

        const itemsPerPageLogic = 5; // Para .films-carousel, sempre 5 itens por "página"
        let currentPage = 0; // Página atual para este carrossel

        // Função para obter a largura de um item (incluindo o gap/margin)
        const getItemWidthWithGap = (item) => {
            if (!item) {
                // Fallback se não há itens para medir. Use o CSS calculado para o gap
                const computedStyle = getComputedStyle(carousel);
                const gapValue = parseFloat(computedStyle.gap);
                return 176 + (isNaN(gapValue) ? 0 : gapValue);
            }
            const computedStyle = getComputedStyle(carousel);
            const gapValue = parseFloat(computedStyle.gap);
            return item.offsetWidth + (isNaN(gapValue) ? 0 : gapValue);
        };

        // Função para calcular o número total de páginas (ou "grupos" de itens)
        const getTotalPages = () => {
            const totalItems = carousel.children.length;
            if (totalItems === 0) return 0;

            return Math.ceil(totalItems / itemsPerPageLogic);
        };

        // Função para rolar para uma "página" específica
        const goToPage = (pageIndex) => {
            const totalPages = getTotalPages();
            if (totalPages === 0) return;

            // Garante que o pageIndex esteja dentro dos limites
            pageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));

            const firstItem = carousel.children[0];
            if (!firstItem) return;

            const itemWidthWithGap = getItemWidthWithGap(firstItem);
            const scrollAmount = itemWidthWithGap * itemsPerPageLogic * pageIndex; // Sempre pula de 5 em 5 itens

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

            if (totalPages <= 1) { // Se houver apenas 1 página ou menos, esconde os indicadores
                indicatorsContainer.style.display = 'none';
                return;
            }

            indicatorsContainer.style.display = 'flex';

            // Loop para criar um dot para CADA página
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

            // Margem de erro para a comparação de rolagem (evita problemas de sub-pixel)
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
                } else {
                    // Se estiver na primeira página e clicar na seta esquerda, esconde a seta
                    updateArrowVisibility();
                }
            });
        }

        if (rightArrow) {
            rightArrow.addEventListener('click', () => {
                if (currentPage < getTotalPages() - 1) {
                    goToPage(currentPage + 1);
                } else {
                    // Se estiver na última página e clicar na seta direita, esconde a seta
                    updateArrowVisibility();
                }
            });
        }

        // Listener para atualizar dots e setas ao rolar (manual ou com JS)
        let scrollTimeout;
        carousel.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const firstItem = carousel.children[0];
                if (!firstItem) {
                    currentPage = 0;
                } else {
                    const itemWidthWithGap = getItemWidthWithGap(firstItem);
                    const currentScrollLeft = carousel.scrollLeft;
                    // Calcula a página atual baseada na rolagem
                    currentPage = Math.round(currentScrollLeft / (itemWidthWithGap * itemsPerPageLogic));
                    // Garante que currentPage não exceda o total de páginas
                    currentPage = Math.min(currentPage, getTotalPages() - 1);
                }

                updateIndicators();
                updateArrowVisibility();
            }, 100);
        });

        // Observador para reagir a mudanças no número de itens (quando a API carrega os cards)
        const observer = new MutationObserver(() => {
            // Tenta ir para a página atual, mas garante que não exceda o limite de páginas
            // É importante chamar goToPage *antes* de updateIndicators/updateArrowVisibility,
            // pois goToPage já faz essas chamadas internamente e garante o currentPage correto.
            goToPage(Math.min(currentPage, getTotalPages() - 1));

            if (carousel.children.length > 0) {
                // Adiciona a animação de entrada aos novos itens carregados
                Array.from(carousel.children).forEach((item, index) => {
                    // Verifica se o item já tem a classe de animação para não aplicar múltiplas vezes
                    if (!item.classList.contains('film-on-list--animated')) {
                        item.classList.add('film-on-list--animated');
                        // Atraso para animação em cascata (se houver muitos itens novos)
                        item.style.animationDelay = `${index * 0.05}s`;
                    }
                });
            }
        });
        // Observa apenas as mudanças nos filhos diretos (adicionar/remover cards)
        observer.observe(carousel, { childList: true });

        // Inicialização: Garante que as setas e dots estejam corretos no carregamento inicial
        setTimeout(() => { // Pequeno atraso para garantir que o layout esteja completo
            updateIndicators();
            updateArrowVisibility();
        }, 200); // Aumentei um pouco o atraso para mais certeza com o cálculo de layout
    });

    // --- Fim: Lógica dos Carrosséis de Lista (.films-carousel) ---


    // --- Chamadas para carregar dados das listas de FILMES e SÉRIES ---
    getTop10Films();
    getLatestFilms();
    getTopRatedFilms();
    getHorrorFilms();
    getClassicsFilms();

    getTop10Series();
    getLatestSeries();
    getPopCultureClassicsSeries();
    getTopRatedSeries();

    // Funções e chamadas para carrosséis de gêneros e matches foram removidas conforme solicitado.
});