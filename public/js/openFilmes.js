// openFilmes.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Configurações da API ---
    const TMDB_API_KEY = '98f79a8fc16247f2c16e9d0b422dbfbe';
    const OMDB_API_KEY = '3ea301f'; // Sua chave da OMDb API
    const BASE_API_URL = 'https://api.themoviedb.org/3';
    const BASE_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
    const BASE_BACKDROP_URL = 'https://image.tmdb.org/t/p/w1280';

    // URL para a imagem placeholder. Verifique se o caminho está correto.
    const PLACEHOLDER_IMAGE_URL = '../public/icons/place-holder.svg';

    // Mapa de URLs base dos provedores de streaming, aluguel e compra.
    const STREAMING_PROVIDER_URLS = {
        'Netflix': 'https://www.netflix.com/',
        'Amazon Prime Video': 'https://www.primevideo.com/',
        'Prime Video': 'https://www.primevideo.com/',
        'Disney Plus': 'https://www.disneyplus.com/',
        'Disney+': 'https://www.disneyplus.com/',
        'Max': 'https://www.max.com/',
        'HBO Max': 'https://www.max.com/',
        'Globoplay': 'https://globoplay.globo.com/',
        'Globo Play': 'https://globoplay.globo.com/',
        'Star Plus': 'https://www.starplus.com/',
        'Star+': 'https://www.starplus.com/',
        'Paramount+': 'https://www.paramountplus.com/',
        'Paramount Plus': 'https://www.paramountplus.com/',
        'Paramount Plus Apple TV Channel': 'https://www.paramountplus.com/',
        'Paramount Plus Premium': 'https://www.paramountplus.com/',
        'Mubi': 'https://www.mubi.com/',
        'Oldflix': 'https://www.oldflix.com.br/',
        'Telecine Play': 'https://www.telecineplay.com.br/',
        'Telecine': 'https://www.telecineplay.com.br/',
        'Telecine Amazon Channel': 'https://www.primevideo.com/',
        'Apple TV Plus': 'https://www.apple.com/apple-tv-plus/',
        'Apple TV+': 'https://www.apple.com/apple-tv-plus/',
        'Lionsgate Plus': 'https://www.lionsgateplus.com/',
        'Lionsgate+': 'https://www.lionsgateplus.com/',
        'Looke': 'https://www.looke.com.br/',
        'Looke Amazon Channel': 'https://www.primevideo.com/',
        'Claro Video': 'https://www.claro.com.br/claro-video',
        'Google Play Movies': 'https://play.google.com/store/movies',
        'Google Play Movies & TV': 'https://play.google.com/store/movies',
        'YouTube': 'https://www.youtube.com/', // URL base mais genérica para YouTube
        'Apple TV': 'https://tv.apple.com/',
        'iTunes': 'https://itunes.apple.com/',
        'Amazon Video': 'https://www.amazon.com/gp/video/storefront/',
        'Microsoft Store': 'https://www.microsoft.com/en-us/store/movies-and-tv',
    };

    // --- Elementos do DOM (cache para performance e legibilidade) ---
    const elements = {
        bannerImg: document.querySelector('.banner-img'),
        bannerTitle: document.querySelector('.banner-info h1'),
        bannerDescription: document.querySelector('.banner-info p'),
        mainDescription: document.querySelector('section.description p'),
        castContainer: document.querySelector('.cast-container'),
        releasedYearElement: document.querySelector('.section.year .value'),
        languagesContainer: document.querySelector('.section.languages .buttons'),
        genresContainer: document.querySelector('.section.genres .buttons'),
        directorSection: document.querySelector('.director-section'),
        musicSection: document.querySelector('.music-section'),

        // Elemento para o contêiner pai onde os ratings serão criados dinamicamente
        ratingsGridContainer: document.querySelector('#ratings-grid-container'),
        ratingsSection: document.querySelector('.section.ratings'), // Seção pai para mostrar/esconder

        playNowButton: document.querySelector('.btn-play'),

        // Referências para as seções de provedores
        watchSection: document.querySelector('.section.watch'),

        // Referência para a seção de episódios e o novo contêiner
        episodesSection: document.querySelector('#episodes-section'),
        seasonsListContainer: document.querySelector('#seasons-list-container'),

        containerDetails: document.querySelector('.container-details'),
        mainContent: document.querySelector('main'),
        bannerSection: document.querySelector('.banner'),
        matchCta: document.querySelector('.match-cta'),
        matchButton: document.querySelector('.open-serie-match-button')
    };

    // --- Funções de Ajuda ---

    /**
     * Extrai o ID e o tipo de conteúdo (filme/série) da URL.
     * @returns {object} Um objeto com id e type.
     */
    function getContentIdAndTypeFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        let type = params.get('type');
        return {
            id,
            type
        };
    }

    /**
     * Busca a URL do trailer no YouTube.
     * Tenta buscar em inglês primeiro, depois em português.
     * @param {string} id O ID do conteúdo.
     * @param {string} contentType O tipo de conteúdo ('movie' ou 'tv').
     * @returns {string|null} A URL do trailer do YouTube ou null se não encontrado.
     */
    async function fetchTrailerUrl(id, contentType) {
        try {
            // Tenta buscar em português (pt-BR) primeiro
            let response = await fetch(`${BASE_API_URL}/${contentType}/${id}/videos?api_key=${TMDB_API_KEY}&language=pt-BR`);
            let data = await response.json();

            // Se não houver resultados em português ou a resposta não for OK, tenta em inglês (en-US)
            if (!response.ok || !data.results || data.results.length === 0) {
                response = await fetch(`${BASE_API_URL}/${contentType}/${id}/videos?api_key=${TMDB_API_KEY}&language=en-US`);
                data = await response.json();
                if (!response.ok) {
                    throw new Error(`Erro ao buscar vídeos: ${response.statusText}`);
                }
            }
            return findYouTubeVideo(data.results);
        } catch (error) {
            console.error('Erro ao buscar vídeos do trailer:', error);
            return null;
        }
    }

    /**
     * Encontra a URL de um trailer ou teaser do YouTube nos resultados da API.
     * @param {Array} videos Lista de objetos de vídeo da API.
     * @returns {string|null} URL do YouTube.
     */
    function findYouTubeVideo(videos) {
        const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');
        // CORREÇÃO APLICADA: Formato da URL do YouTube para o botão "Play Now"
        if (trailer) return `https://www.youtube.com/watch?v=${trailer.key}`; 

        const teaser = videos.find(video => video.type === 'Teaser' && video.site === 'YouTube');
        // CORREÇÃO APLICADA: Formato da URL do YouTube para o botão "Play Now"
        if (teaser) return `https://www.youtube.com/watch?v=${teaser.key}`;

        return null;
    }

    /**
     * Busca os provedores de streaming para o Brasil.
     * @param {string} id O ID do conteúdo.
     * @param {string} contentType O tipo de conteúdo ('movie' ou 'tv').
     * @returns {object|null} Objeto com os provedores para o Brasil ou null.
     */
    async function fetchWatchProviders(id, contentType) {
        try {
            const response = await fetch(`${BASE_API_URL}/${contentType}/${id}/watch/providers?api_key=${TMDB_API_KEY}`);
            if (!response.ok) {
                throw new Error(`Erro ao buscar provedores: ${response.statusText}`);
            }
            const data = await response.json();
            return data.results.BR || null; // Retorna provedores para o Brasil
        } catch (error) {
            console.error('Erro ao buscar provedores de watch:', error);
            return null;
        }
    }

    // --- NOVA FUNÇÃO: Busca ratings de IMDb, Rotten Tomatoes e Metacritic da OMDb API. ---
    /**
     * Busca ratings de IMDb, Rotten Tomatoes e Metacritic da OMDb API.
     * @param {string} imdbId O ID IMDb do conteúdo (ex: 'tt1234567').
     * @returns {object} Um objeto com as notas, ou valores vazios se não encontrados.
     */
    async function fetchOmdbRatings(imdbId) {
        if (!imdbId) return {};

        try {
            const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}`);
            if (!response.ok) {
                throw new Error(`Erro ao buscar ratings da OMDb: ${response.statusText}`);
            }
            const data = await response.json();

            if (data.Response === 'True' && data.Ratings) {
                const ratings = {};
                data.Ratings.forEach(r => {
                    if (r.Source === 'Internet Movie Database') ratings.imdb = r.Value;
                    if (r.Source === 'Rotten Tomatoes') ratings.rottenTomatoes = r.Value;
                    if (r.Source === 'Metacritic') ratings.metacritic = r.Value;
                });
                return ratings;
            } else {
                console.warn('OMDb: Conteúdo não encontrado ou sem ratings:', data.Error);
                return {};
            }
        } catch (error) {
            console.error('Erro ao buscar ratings da OMDb:', error);
            return {};
        }
    }

    // --- NOVA FUNÇÃO: Cria e retorna um elemento HTML para um box de rating. ---
    /**
     * Cria e retorna um elemento HTML para um box de rating.
     * @param {string} title O título da fonte do rating (ex: 'IMDb').
     * @param {string} value O valor do rating a ser exibido (já na escala de 1-5, ex: '3.9').
     * @param {number} percentage A porcentagem de preenchimento das estrelas (0-100).
     * @param {string|null} linkUrl A URL para onde o box deve linkar, ou null.
     * @returns {HTMLElement} O elemento div do rating box.
     */
    function createRatingBoxElement(title, value, percentage, linkUrl) {
        const ratingBox = document.createElement('div');
        ratingBox.classList.add('rating-box');

        let innerHTML = `
            <h4>${title}</h4>
            <div class="rating">
                <div class="star-rating" style="--pct: ${percentage || 0}%;">
                    <img class="stars-bg" src="../public/icons/FiveStarsEmpty.svg" alt="Five Stars Background">
                    <div class="stars-full-wrapper">
                        <img class="stars-full" src="../public/icons/FiveStarsFull.svg" alt="Five Stars Fill">
                    </div>
                </div>
                <div class="rating-text">
                    <span class="rating-value">${value || '--'}</span>
                </div>
            </div>
        `;

        if (linkUrl) {
            const link = document.createElement('a');
            link.href = linkUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.textDecoration = 'none'; // Remove sublinhado padrão do link
            link.style.color = 'inherit'; // Mantém a cor do texto padrão
            link.style.display = 'block'; // Para o link preencher o box
            link.innerHTML = innerHTML;
            ratingBox.appendChild(link);
        } else {
            ratingBox.innerHTML = innerHTML;
        }

        return ratingBox;
    }

    /**
     * Busca os detalhes e créditos de um filme ou série, e também o IMDb ID.
     * Tenta 'movie' e 'tv' se o tipo preferido não for especificado ou falhar.
     * @param {string} id O ID do conteúdo.
     * @param {string} [preferredType=null] O tipo de conteúdo preferido ('movie' ou 'tv').
     * @returns {object|null} Objeto contendo content, credits, type e imdb_id ou null.
     */
    async function fetchContentDetails(id, preferredType = null) {
        if (!id) {
            console.error('ID do conteúdo não fornecido.');
            return null;
        }

        let contentType = preferredType;
        let contentData = null;
        let creditsData = null;
        let imdbId = null;

        const typesToTry = preferredType ? [preferredType] : ['movie', 'tv'];

        for (const type of typesToTry) {
            try {
                const contentResponse = await fetch(`${BASE_API_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`);

                if (contentResponse.ok) {
                    contentData = await contentResponse.json();
                    contentType = type; // Confirma o tipo encontrado

                    // Fetch credits
                    const creditsResponse = await fetch(`${BASE_API_URL}/${type}/${id}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`);
                    if (creditsResponse.ok) {
                        creditsData = await creditsResponse.json();
                    } else {
                        console.warn(`Não foi possível carregar créditos para ${type} ID ${id}.`);
                    }

                    // Fetch external IDs for IMDb ID
                    const externalIdsResponse = await fetch(`${BASE_API_URL}/${type}/${id}/external_ids?api_key=${TMDB_API_KEY}`);
                    if (externalIdsResponse.ok) {
                        const externalIdsData = await externalIdsResponse.json();
                        imdbId = externalIdsData.imdb_id;
                    } else {
                        console.warn(`Não foi possível carregar IDs externos para ${type} ID ${id}.`);
                    }
                    break;
                } else if (contentResponse.status === 404 && !preferredType) {
                    console.log(`ID ${id} não encontrado como ${type}. Tentando o próximo tipo...`);
                    continue;
                } else {
                    throw new Error(`Erro ao buscar ${type} ID ${id}: ${contentResponse.statusText}`);
                }
            } catch (error) {
                console.error(`Erro na requisição para ${type} ID ${id}:`, error);
                if (preferredType) return null;
            }
        }

        if (contentData && contentType) {
            return {
                content: contentData,
                credits: creditsData,
                type: contentType,
                imdb_id: imdbId
            };
        }
        return null;
    }

    /**
     * Popula os detalhes do conteúdo na página HTML.
     * @param {object} data Objeto contendo content, credits, type e imdb_id.
     */
    async function populateContentDetails(data) {
        if (!data || !data.content) {
            console.error('Dados do conteúdo inválidos para preenchimento.');
            return;
        }

        const content = data.content;
        const credits = data.credits;
        const contentType = data.type;
        const imdbId = data.imdb_id; // Obter o IMDb ID

        document.title = `${content.title || content.name} - Detalhes`;

        // --- Banner Image ---
        if (elements.bannerImg) {
            if (content.backdrop_path) {
                elements.bannerImg.src = `${BASE_BACKDROP_URL}${content.backdrop_path}`;
                elements.bannerImg.alt = `Cena de fundo de ${content.title || content.name}`;
            } else if (content.poster_path) {
                elements.bannerImg.src = `${BASE_IMAGE_URL}${content.poster_path}`;
                elements.bannerImg.alt = `Pôster de ${content.title || content.name}`;
            } else {
                elements.bannerImg.src = PLACEHOLDER_IMAGE_URL;
                elements.bannerImg.alt = 'Imagem de banner não disponível';
            }
        }

        // --- Banner Title & Description ---
        if (elements.bannerTitle) {
            elements.bannerTitle.textContent = content.title || content.name || 'Título Indisponível';
        }

        if (elements.bannerDescription) {
            let infoItems = [];
            if (content.genres && content.genres.length > 0) {
                const genreNames = content.genres.map(genre => genre.name);
                infoItems.push(genreNames.join(' • '));
            }
            if (content.vote_average) {
                // Aqui no banner, a nota continua de 0 a 10 como vem da TMDb, pois não é um rating box de 1 a 5 estrelas
                const formattedRating = content.vote_average.toFixed(1);
                infoItems.push(`${formattedRating} ★`);
            }
            elements.bannerDescription.textContent = infoItems.join(' • ') || 'Informações não disponíveis.';
        }

        // --- Main Description ---
        if (elements.mainDescription) {
            elements.mainDescription.textContent = content.overview || 'Descrição não disponível.';
        }

        // --- Cast ---
        if (elements.castContainer && credits && credits.cast) {
            elements.castContainer.innerHTML = '';
            const topCast = credits.cast.slice(0, 10); // Limita ao top 10

            topCast.forEach(person => {
                const profilePath = person.profile_path ? `${BASE_IMAGE_URL}${person.profile_path}` : PLACEHOLDER_IMAGE_URL;
                const castMemberArticle = document.createElement('article');
                castMemberArticle.classList.add('cast-member');
                castMemberArticle.innerHTML = `
                    <img src="${profilePath}" alt="Foto de ${person.name}">
                    <p class="cast-name">${person.name}</p>
                    <p class="cast-role">${person.character}</p>
                `;
                elements.castContainer.appendChild(castMemberArticle);
            });
        }

        // --- Released Year ---
        if (elements.releasedYearElement) {
            const date = contentType === 'movie' ? content.release_date : content.first_air_date;
            elements.releasedYearElement.textContent = date ? new Date(date).getFullYear() : 'N/A';
        }

        // --- Genres ---
        if (elements.genresContainer && content.genres) {
            elements.genresContainer.innerHTML = '';
            content.genres.forEach(genre => {
                const button = document.createElement('button');
                button.textContent = genre.name;
                elements.genresContainer.appendChild(button);
            });
        }

        // --- Languages ---
        if (elements.languagesContainer && content.spoken_languages) {
            elements.languagesContainer.innerHTML = '';
            content.spoken_languages.forEach(lang => {
                const button = document.createElement('button');
                button.textContent = lang.english_name || lang.name;
                elements.languagesContainer.appendChild(button);
            });
        }

        // --- Director/Creator ---
        if (elements.directorSection) {
            const personCardImg = elements.directorSection.querySelector('.person-card img');
            const personCardName = elements.directorSection.querySelector('.person-card .name');
            const personCardSub = elements.directorSection.querySelector('.person-card .sub');
            const directorTitle = elements.directorSection.querySelector('h3');

            let mainPerson = null;
            let role = '';

            if (contentType === 'movie' && credits && credits.crew) {
                mainPerson = credits.crew.find(member => member.job === 'Director');
                role = 'Diretor';
            } else if (contentType === 'tv' && content.created_by && content.created_by.length > 0) {
                // Para séries, usa o primeiro criador
                mainPerson = content.created_by[0];
                role = 'Criador(es)';
            }

            if (mainPerson) {
                const profilePath = mainPerson.profile_path ? `${BASE_IMAGE_URL}${mainPerson.profile_path}` : PLACEHOLDER_IMAGE_URL;
                if (directorTitle) directorTitle.textContent = role;
                if (personCardImg) {
                    personCardImg.src = profilePath;
                    personCardImg.alt = `Foto de ${mainPerson.name}`;
                }
                if (personCardName) personCardName.textContent = mainPerson.name;
                if (personCardSub) personCardSub.textContent = role;
                elements.directorSection.style.display = 'flex';
            } else {
                elements.directorSection.style.display = 'none';
            }
        }

        // --- Music Composer ---
        if (elements.musicSection && credits && credits.crew) {
            const musicComposer = credits.crew.find(member => member.job === 'Original Music Composer' || member.job === 'Composer');
            const personCardImg = elements.musicSection.querySelector('.person-card img');
            const personCardName = elements.musicSection.querySelector('.person-card .name');
            const personCardSub = elements.musicSection.querySelector('.person-card .sub');

            if (musicComposer) {
                const profilePath = musicComposer.profile_path ? `${BASE_IMAGE_URL}${musicComposer.profile_path}` : PLACEHOLDER_IMAGE_URL;
                if (personCardImg) {
                    personCardImg.src = profilePath;
                    personCardImg.alt = `Foto de ${musicComposer.name}`;
                }
                if (personCardName) personCardName.textContent = musicComposer.name;
                if (personCardSub) personCardSub.textContent = 'Compositor';
                elements.musicSection.style.display = 'flex';
            } else {
                elements.musicSection.style.display = 'none';
            }
        }

        // --- INÍCIO DO CÓDIGO DO RATING-BOX ---
        // --- Ratings (IMDb, Rotten Tomatoes, Metacritic, Lumière) ---
        if (elements.ratingsGridContainer) {
            elements.ratingsGridContainer.innerHTML = ''; // Limpa o contêiner de ratings

            // Busca ratings da OMDb se o IMDb ID estiver disponível
            let omdbRatings = {};
            if (imdbId) {
                omdbRatings = await fetchOmdbRatings(imdbId);
            }

            let anyRatingDisplayed = false; // Flag para controlar a visibilidade da seção

            // Função auxiliar para adicionar um rating box se o valor for válido
            // Ajustada para padronizar as notas de 1 a 5 no display e no cálculo da porcentagem.
            const addRatingBox = (title, originalValue, originalMaxValue, linkUrl) => {
                if (originalValue !== undefined && originalValue !== null && originalValue !== 'N/A' && originalValue !== '--' && originalValue !== '') {
                    let displayValue5Star = null; // Valor a ser exibido na escala de 1 a 5
                    let percentageForStars = 0; // Porcentagem para o preenchimento das estrelas (0-100)

                    if (typeof originalValue === 'string') {
                        let numericValue;
                        if (originalValue.includes('/')) { // Ex: "7.8/10", "85/100"
                            const parts = originalValue.split('/');
                            numericValue = parseFloat(parts[0]);
                            originalMaxValue = parseFloat(parts[1]); // Usa o max real da string, se fornecido
                        } else if (originalValue.includes('%')) { // Ex: "85%"
                            numericValue = parseFloat(originalValue.replace('%', ''));
                            originalMaxValue = 100; // Porcentagem é sempre de 0 a 100
                        } else { // Valor numérico simples como string
                            numericValue = parseFloat(originalValue);
                        }

                        if (!isNaN(numericValue) && originalMaxValue > 0) {
                            displayValue5Star = ((numericValue / originalMaxValue) * 5).toFixed(1); // Converte para 1-5
                            percentageForStars = (numericValue / originalMaxValue) * 100; // Porcentagem original
                        } else {
                            return; // Se não puder converter, não adiciona o box
                        }
                    } else if (typeof originalValue === 'number' && originalMaxValue > 0) { // Ex: 7.8, 85
                        displayValue5Star = ((originalValue / originalMaxValue) * 5).toFixed(1); // Converte para 1-5
                        percentageForStars = (originalValue / originalMaxValue) * 100; // Porcentagem original
                    } else {
                        return; // Se não for número ou max for zero, não adiciona o box
                    }

                    // Se a porcentagem calculada exceder 100 (por erros de arredondamento ou dados), limite-a
                    percentageForStars = Math.min(100, Math.max(0, percentageForStars));

                    const ratingBoxElement = createRatingBoxElement(title, displayValue5Star, percentageForStars, linkUrl);
                    elements.ratingsGridContainer.appendChild(ratingBoxElement);
                    anyRatingDisplayed = true;
                }
            };

            // IMDb Rating
            const imdbRating = omdbRatings.imdb; // Ex: "7.8/10"
            if (imdbRating) {
                const imdbLink = `https://www.imdb.com/title/${imdbId}/`;
                addRatingBox('IMDb', imdbRating, 10, imdbLink); // Passa "7.8/10" e o max original de 10
            }

            // Rotten Tomatoes Rating
            const rtRating = omdbRatings.rottenTomatoes; // Ex: "85%"
            if (rtRating) {
                const rtLink = `https://www.rottentomatoes.com/`; 
                addRatingBox('Rotten Tomatoes', rtRating, 100, rtLink); // Passa "85%" e o max original de 100
            }

            // Lumière Rating (sempre da TMDb)
            if (content.vote_average) {
                // content.vote_average já é de 0-10, passamos 10 como maxValue
                addRatingBox('Lumérie', content.vote_average, 10, null); // Max 10 para TMDb vote_average
            }

            // Metacritic Rating
            const mcRating = omdbRatings.metacritic; // Ex: "75/100"
            if (mcRating) {
                let mcLink = `https://www.metacritic.com/search/`;
                if (contentType === 'tv') {
                    mcLink = `https://www.metacritic.com/search/tv/`;
                }
                addRatingBox('Metacritic', mcRating, 100, mcLink); // Passa "75/100" e o max original de 100
            }

            // Controla a visibilidade da seção Ratings completa
            if (elements.ratingsSection) {
                elements.ratingsSection.style.display = anyRatingDisplayed ? 'block' : 'none';
            }
        }
        // --- FIM DO CÓDIGO DO RATING-BOX ---


        // --- Watch Providers (Streaming, Rent, Buy) ---
        if (elements.watchSection && content.id && contentType) {
            const providers = await fetchWatchProviders(content.id, contentType);

            // Esta é a parte que preenche o div 'providers' com os links
            // Agora, com a classe 'buttons' no HTML, .querySelector('.providers.buttons') funcionará
            const allProvidersContainer = elements.watchSection.querySelector('.providers.buttons');
            if (allProvidersContainer) { // Certifique-se de que o elemento foi encontrado
                allProvidersContainer.innerHTML = '';

                const allAvailableProviders = [];
                if (providers?.flatrate) allAvailableProviders.push(...providers.flatrate);
                if (providers?.rent) allAvailableProviders.push(...providers.rent);
                if (providers?.buy) allAvailableProviders.push(...providers.buy);

                const uniqueProviders = new Map();
                allAvailableProviders.forEach(p => {
                    if (STREAMING_PROVIDER_URLS[p.provider_name]) {
                        uniqueProviders.set(p.provider_id, {
                            name: p.provider_name,
                            url: STREAMING_PROVIDER_URLS[p.provider_name]
                        });
                    }
                });

                if (uniqueProviders.size > 0) {
                    uniqueProviders.forEach(provider => {
                        const providerLink = document.createElement('a');
                        providerLink.classList.add('provider-link-tag');
                        providerLink.textContent = provider.name;
                        providerLink.href = provider.url;
                        providerLink.target = '_blank';
                        providerLink.rel = 'noopener noreferrer';
                        allProvidersContainer.appendChild(providerLink);
                    });
                    elements.watchSection.style.display = 'block';
                } else {
                    elements.watchSection.style.display = 'none';
                }
            } else {
                elements.watchSection.style.display = 'none'; // Se o contêiner não for encontrado, oculta a seção
            }
        }


        // --- Temporadas e Episódios (Visibilidade e População Dinâmica) ---
        if (elements.episodesSection) {
            if (contentType === 'tv') {
                elements.episodesSection.style.display = 'block';
                if (content.seasons && content.seasons.length > 0) {
                    populateSeasonsAndEpisodes(content.id, content.seasons);
                } else {
                    elements.seasonsListContainer.innerHTML = '<p>Nenhuma temporada encontrada para esta série.</p>';
                }
            } else {
                elements.episodesSection.style.display = 'none';
            }
        }

        // --- Play Now Button (Trailer) ---
        if (elements.playNowButton && content.id && contentType) {
            const trailerUrl = await fetchTrailerUrl(content.id, contentType);
            if (trailerUrl) {
                elements.playNowButton.addEventListener('click', () => {
                    window.open(trailerUrl, '_blank');
                });
                elements.playNowButton.style.display = 'flex';
            } else {
                elements.playNowButton.style.display = 'none';
                console.warn('Nenhum trailer encontrado para este conteúdo.');
            }
        }
    }

    /**
     * Popula as temporadas e episódios de uma série dinamicamente.
     * @param {number} seriesId O ID da série.
     * @param {Array} seasonsArray A lista de temporadas da API principal da série.
     */
    async function populateSeasonsAndEpisodes(seriesId, seasonsArray) {
        if (!elements.seasonsListContainer) return;

        elements.seasonsListContainer.innerHTML = '';

        const validSeasons = seasonsArray.filter(season =>
            season.season_number > 0 && season.episode_count >= 0
        ).sort((a, b) => a.season_number - b.season_number);

        if (validSeasons.length === 0) {
            elements.seasonsListContainer.innerHTML = '<p>Nenhuma temporada disponível (além de especiais, se houver).</p>';
            elements.episodesSection.style.display = 'none';
            return;
        }

        let firstSeasonRendered = false;

        for (const season of validSeasons) {
            const seasonDiv = document.createElement('div');
            seasonDiv.classList.add('season');
            seasonDiv.dataset.seasonNumber = season.season_number;

            // Não usamos o poster da temporada aqui, apenas para o cabeçalho e info
            // const seasonPosterPath = season.poster_path ? `${BASE_IMAGE_URL}${season.poster_path}` : PLACEHOLDER_IMAGE_URL;

            seasonDiv.innerHTML = `
                <div class="season-header">
                    <div class="season-div">
                        <span class="season-count">Temporada ${season.season_number}</span>
                        <span class="episode-count">${season.episode_count} Episódios</span>
                    </div>
                    <button class="arrow">
                        <img src="../public/icons/Arrow.svg" alt="Arrow Icon" class="arrow-icon">
                    </button>
                </div>
                <div class="episode-list">
                    </div>
            `;
            elements.seasonsListContainer.appendChild(seasonDiv);

            const arrowButton = seasonDiv.querySelector('.arrow');
            const episodeListDiv = seasonDiv.querySelector('.episode-list');
            const arrowImg = arrowButton.querySelector('.arrow-icon');

            // Adiciona funcionalidade de expansão/colapso
                       arrowButton.addEventListener('click', async () => {
                const isCurrentlyExpanded = seasonDiv.classList.contains('expanded');
                
                if (isCurrentlyExpanded) {
                    // Se está expandida, feche
                    seasonDiv.classList.remove('expanded');
                    // CORREÇÃO APLICADA: Define maxHeight para 0 para iniciar a transição de fechamento
                    episodeListDiv.style.maxHeight = '0'; 
                    episodeListDiv.style.opacity = '0'; // Garante que a opacidade também transicione
                    arrowImg.classList.add('arrowDown-icon');
                    arrowImg.classList.remove('arrowUp-icon');
                } else {
                    // Se está fechada, expanda
                    seasonDiv.classList.add('expanded');
                    arrowImg.classList.add('arrowUp-icon');
                    arrowImg.classList.remove('arrowDown-icon');

                    // CORREÇÃO APLICADA: Carrega episódios apenas se ainda não foram carregados
                    if (episodeListDiv.children.length === 0) { 
                        try {
                            const response = await fetch(`${BASE_API_URL}/tv/${seriesId}/season/${season.season_number}?api_key=${TMDB_API_KEY}&language=pt-BR`);
                            if (!response.ok) {
                                throw new Error(`Erro ao buscar episódios da temporada ${season.season_number}: ${response.statusText}`);
                            }
                            const seasonDetails = await response.json();

                            if (seasonDetails.episodes && seasonDetails.episodes.length > 0) {
                                episodeListDiv.innerHTML = ''; // Limpa antes de adicionar novos episódios
                                seasonDetails.episodes.forEach(episode => {
                                    const episodeDiv = document.createElement('div');
                                    episodeDiv.classList.add('episode');
                                    const episodeThumbnail = episode.still_path ? `${BASE_IMAGE_URL}${episode.still_path}` : PLACEHOLDER_IMAGE_URL;
                                    const episodeRuntime = episode.runtime ? `${episode.runtime} min` : '';

                                    episodeDiv.innerHTML = `
                                        <div class="episode-number">${episode.episode_number.toString().padStart(2, '0')}</div>
                                        <img src="${episodeThumbnail}" alt="Miniatura do episódio ${episode.episode_number}" class="episode-thumbnail">
                                        <div class="episode-info">
                                            <div class="episode-title-duration">
                                                <h3>${episode.name || 'Título Indisponível'}</h3>
                                                <div class="duration">
                                                    ${episodeRuntime ? `<img src="../public/icons/Clock.svg" alt="clock-icon" class="duration-icon"> ${episodeRuntime}` : ''}
                                                </div>
                                            </div>
                                            <p>${episode.overview || 'Descrição não disponível.'}</p>
                                        </div>
                                    `;
                                    episodeListDiv.appendChild(episodeDiv);
                                });
                            } else {
                                episodeListDiv.innerHTML = '<p>Nenhum episódio encontrado para esta temporada.</p>';
                            }
                        } catch (error) {
                            console.error(`Erro ao carregar episódios para Temporada ${season.season_number}:`, error);
                            episodeListDiv.innerHTML = '<p>Erro ao carregar episódios.</p>';
                        }
                    }
                    // CORREÇÃO APLICADA: Define maxHeight para se adaptar ao conteúdo (scrollHeight) e opacidade
                    // Isso garante que a seção se expanda o suficiente para todos os episódios.
                    // É importante que o conteúdo já esteja no DOM para que scrollHeight seja preciso
                    episodeListDiv.style.maxHeight = episodeListDiv.scrollHeight + 'px';
                    episodeListDiv.style.opacity = '1';
                }
            });


            // Expande a primeira temporada válida por padrão, se ainda não o fez
            if (!firstSeasonRendered) {
                arrowButton.click();
                firstSeasonRendered = true;
            }
        }
    }

    // --- Lógica Principal de Inicialização ---
    const {
        id,
        type
    } = getContentIdAndTypeFromUrl();

    
    if (elements.matchButton) {
        elements.matchButton.addEventListener('click', () => {
            window.location.href = '../pages/matchGame.html'; // Use 'matchGame.html' para consistência com o header
        });
    }
    if (id) {
        fetchContentDetails(id, type)
            .then(data => {
                if (data) {
                    populateContentDetails(data);
                    if (elements.containerDetails) {
                        elements.containerDetails.style.display = 'flex';
                    }
                } else { // <-- SE O FILME/SÉRIE NÃO FOR ENCONTRADO
                    if (elements.mainContent) {
                        elements.mainContent.innerHTML = '<p class="error-message">Filme/Série não encontrado. Verifique o ID ou tipo.</p>';
                    }
                    // <-- O CÓDIGO DO BOTÃO 'MATCH!' ESTÁ AQUI
                    if (elements.matchButton) {
                        elements.matchButton.addEventListener('click', () => {
                            window.location.href = '../pages/match.html'; // Ou 'match.html' se for o nome do seu arquivo
                        });
                    }
                    if (elements.bannerSection) {
                        elements.bannerSection.style.display = 'none';
                    }
                }
            })
            .catch(error => {
                console.error("Erro fatal ao carregar os detalhes:", error);
                if (elements.mainContent) {
                    elements.mainContent.innerHTML = '<p class="error-message">Ocorreu um erro ao carregar os detalhes. Tente novamente mais tarde.</p>';
                }
                if (elements.bannerSection) {
                    elements.bannerSection.style.display = 'none';
                }
            });
    } else {
        if (elements.mainContent) {
            elements.mainContent.innerHTML = '<p class="error-message">Nenhum ID de filme/série fornecido. Por favor, selecione um filme/série da página inicial.</p>';
        }
        if (elements.bannerSection) {
            elements.bannerSection.style.display = 'none';
        }
    }
});